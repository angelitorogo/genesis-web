import {
  AtmosphereCondensableEquilibriumState,
  AtmosphereCondensableSpeciesEquilibrium,
} from '../../domain/planetary/atmosphere-condensable-equilibrium-state';
import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import { AtmosphereGasComponent } from '../../domain/planetary/atmosphere-gas-component';
import {
  greenhouseLongwaveTrappingFraction01,
} from '../../domain/planetary/atmosphere-greenhouse-effect';
import {
  type AtmosphereRadiativeColumnState,
  atmosphereRadiativeColumnState,
} from './atmosphere-radiative-column-model';
import {
  NON_WATER_CONDENSABLE_GASES,
  condensableSaturationPressurePascal,
} from './atmosphere-condensable-thermodynamics';

/* Most atmospheres converge in a handful of passes, but near a steep
 * saturation boundary the greenhouse/phase fixed point can need more than
 * sixteen iterations to satisfy the final-state invariant. Keep a generous
 * deterministic ceiling; the loop still exits immediately after convergence. */
const MAX_MULTISPECIES_ITERATIONS = 512;
const CONVERGENCE_ABSOLUTE_PASCAL = 0.05;
const CONVERGENCE_RELATIVE = 1e-7;
const PRESSURE_REDISTRIBUTION_HALF_PASCAL = 50_000;
const DIURNAL_RANGE_FRACTION = 0.70;

export interface AtmosphereCondensationClimateContext {
  readonly isTidallySynchronized: boolean;
  readonly dayLengthHours: number | null;
}

export interface AtmosphereMultispeciesRadiativeColumnState
  extends AtmosphereRadiativeColumnState {
  readonly condensableEquilibriumState: AtmosphereCondensableEquilibriumState;
}

/**
 * Conservative outer phase-equilibrium wrapper around the already validated
 * H2O/radiative column solver. H2O keeps its existing fixed-point algorithm;
 * this layer only allows other retained condensables to leave the gas phase.
 */
export function atmosphereMultispeciesRadiativeColumnState(
  retainedSurfacePressurePascal: number,
  surfaceGravityMetersPerSecondSquared: number,
  equilibriumTemperatureKelvin: number,
  gasComponents: readonly AtmosphereGasComponent[],
  climateContext: AtmosphereCondensationClimateContext,
): AtmosphereMultispeciesRadiativeColumnState {
  assertPositiveFinite(retainedSurfacePressurePascal, 'retainedSurfacePressurePascal');
  assertNormalizedGasComposition(gasComponents);

  const sourcePartialPressures = new Map<AtmosphereGas, number>();
  for (const component of gasComponents) {
    sourcePartialPressures.set(
      component.gas,
      retainedSurfacePressurePascal * component.moleFraction01,
    );
  }

  const currentNonWaterPartialPressures = new Map<AtmosphereGas, number>();
  for (const component of gasComponents) {
    if (component.gas !== AtmosphereGas.WATER_VAPOR) {
      currentNonWaterPartialPressures.set(
        component.gas,
        sourcePartialPressures.get(component.gas)!,
      );
    }
  }

  let resolved = evaluateWithExistingWaterClosure(
    currentNonWaterPartialPressures,
    sourcePartialPressures.get(AtmosphereGas.WATER_VAPOR) ?? 0,
    surfaceGravityMetersPerSecondSquared,
    equilibriumTemperatureKelvin,
  );

  let iterationCount = 0;
  let converged = true;

  for (let iteration = 1; iteration <= MAX_MULTISPECIES_ITERATIONS; iteration += 1) {
    iterationCount = iteration;
    const forcing = condensationTemperatureState(
      resolved,
      climateContext,
    );

    let allConverged = true;
    const next = new Map(currentNonWaterPartialPressures);

    for (const gas of NON_WATER_CONDENSABLE_GASES) {
      const sourcePartialPressure = sourcePartialPressures.get(gas);
      if (sourcePartialPressure === undefined || sourcePartialPressure <= 0) continue;

      const saturationPressure = condensableSaturationPressurePascal(
        gas,
        forcing.effectiveCondensationTemperatureKelvin,
      );
      if (saturationPressure === null) continue;

      const nextPartialPressure = Math.min(sourcePartialPressure, saturationPressure);
      const previousPartialPressure = currentNonWaterPartialPressures.get(gas) ?? 0;

      if (!pressureConverged(previousPartialPressure, nextPartialPressure)) {
        allConverged = false;
      }
      next.set(gas, nextPartialPressure);
    }

    currentNonWaterPartialPressures.clear();
    for (const [gas, pressure] of next) currentNonWaterPartialPressures.set(gas, pressure);

    resolved = evaluateWithExistingWaterClosure(
      currentNonWaterPartialPressures,
      sourcePartialPressures.get(AtmosphereGas.WATER_VAPOR) ?? 0,
      surfaceGravityMetersPerSecondSquared,
      equilibriumTemperatureKelvin,
    );

    if (allConverged) {
      const postEvaluationForcing = condensationTemperatureState(
        resolved,
        climateContext,
      );

      if (nonWaterCondensablesRespectFinalSaturation(
        currentNonWaterPartialPressures,
        sourcePartialPressures,
        postEvaluationForcing.effectiveCondensationTemperatureKelvin,
      )) {
        converged = true;
        break;
      }
    }

    converged = false;
  }

  const normalizedEffectiveGasComponents = normalizeComponents(
    resolved.effectiveGasComponents,
  );
  resolved = Object.freeze({
    ...resolved,
    effectiveGasComponents: normalizedEffectiveGasComponents,
    effectiveWaterVaporMixingRatio01:
      normalizedEffectiveGasComponents.find(
        component => component.gas === AtmosphereGas.WATER_VAPOR,
      )?.moleFraction01 ?? 0,
  });

  const forcing = condensationTemperatureState(resolved, climateContext);
  const effectiveGasPartialPressures = partialPressuresFromResolvedState(resolved);
  const speciesEquilibria: AtmosphereCondensableSpeciesEquilibrium[] = [];

  for (const component of gasComponents) {
    const gas = component.gas;
    const sourcePartialPressure = sourcePartialPressures.get(gas) ?? 0;
    let saturationPressure: number | null = null;
    let condensationTemperatureKelvin = forcing.effectiveCondensationTemperatureKelvin;

    if (gas === AtmosphereGas.WATER_VAPOR) {
      saturationPressure = resolved.saturationVaporPressurePascal;
      condensationTemperatureKelvin = resolved.resolvedSurfaceTemperatureKelvin;
    } else {
      saturationPressure = condensableSaturationPressurePascal(
        gas,
        forcing.effectiveCondensationTemperatureKelvin,
      );
    }

    if (saturationPressure === null) continue;

    const effectivePartialPressure = effectiveGasPartialPressures.get(gas) ?? 0;
    const effectiveMixingRatio = resolved.effectiveSurfacePressurePascal <= 0
      ? 0
      : effectivePartialPressure / resolved.effectiveSurfacePressurePascal;

    speciesEquilibria.push(new AtmosphereCondensableSpeciesEquilibrium(
      gas,
      component.moleFraction01,
      sourcePartialPressure,
      effectiveMixingRatio,
      effectivePartialPressure,
      saturationPressure,
      Math.max(0, sourcePartialPressure - effectivePartialPressure),
      condensationTemperatureKelvin,
    ));
  }

  const condensableEquilibriumState = new AtmosphereCondensableEquilibriumState(
    retainedSurfacePressurePascal,
    resolved.effectiveSurfacePressurePascal,
    resolved.resolvedSurfaceTemperatureKelvin,
    forcing.effectiveCondensationTemperatureKelvin,
    forcing.heatRedistributionEfficiency01,
    forcing.coldTrapWeight01,
    iterationCount,
    converged && resolved.waterVaporConverged,
    speciesEquilibria,
    resolved.effectiveGasComponents,
  );

  return Object.freeze({
    ...resolved,
    condensableEquilibriumState,
  });
}

function evaluateWithExistingWaterClosure(
  nonWaterPartialPressures: ReadonlyMap<AtmosphereGas, number>,
  sourceWaterPartialPressurePascal: number,
  surfaceGravityMetersPerSecondSquared: number,
  equilibriumTemperatureKelvin: number,
): AtmosphereRadiativeColumnState {
  const components: AtmosphereGasComponent[] = [];
  let syntheticRetainedPressurePascal = sourceWaterPartialPressurePascal;

  for (const pressure of nonWaterPartialPressures.values()) {
    syntheticRetainedPressurePascal += pressure;
  }

  /* A pathological complete collapse still needs a finite input to the H2O
   * solver. If no retained H2O exists either, keep an arbitrarily tiny support
   * pressure; the outer state will immediately expose essentially vacuum gas. */
  const safePressure = Math.max(1e-12, syntheticRetainedPressurePascal);

  for (const [gas, pressure] of nonWaterPartialPressures) {
    if (pressure <= 0) continue;
    const moleFraction01 = pressure / safePressure;
    /* At extreme cryogenic phase collapse a positive saturation pressure can
     * be so many orders of magnitude below the surviving bulk pressure that
     * IEEE-754 division underflows to +0. A zero mole fraction is not a valid
     * AtmosphereGasComponent; it is physically indistinguishable from an
     * absent gas species at double precision, so omit it from the effective
     * gas composition while preserving its source/phase diagnostic. */
    if (!Number.isFinite(moleFraction01) || moleFraction01 <= 0) continue;
    components.push(new AtmosphereGasComponent(gas, moleFraction01));
  }
  if (sourceWaterPartialPressurePascal > 0) {
    const waterMoleFraction01 = sourceWaterPartialPressurePascal / safePressure;
    if (Number.isFinite(waterMoleFraction01) && waterMoleFraction01 > 0) {
      components.push(new AtmosphereGasComponent(
        AtmosphereGas.WATER_VAPOR,
        waterMoleFraction01,
      ));
    }
  }

  if (components.length === 0) {
    /* This can occur only for a fully condensed solid-world atmosphere. Keep
     * one trace inert component so the existing radiative contract remains
     * finite. The pressure is far below every UI/physics regime threshold. */
    components.push(new AtmosphereGasComponent(AtmosphereGas.NITROGEN, 1));
  } else {
    normalizeComponentsInPlace(components);
  }

  return atmosphereRadiativeColumnState(
    safePressure,
    surfaceGravityMetersPerSecondSquared,
    equilibriumTemperatureKelvin,
    components,
  );
}

function partialPressuresFromResolvedState(
  state: AtmosphereRadiativeColumnState,
): Map<AtmosphereGas, number> {
  const result = new Map<AtmosphereGas, number>();
  for (const component of state.effectiveGasComponents) {
    result.set(
      component.gas,
      state.effectiveSurfacePressurePascal * component.moleFraction01,
    );
  }
  return result;
}

function condensationTemperatureState(
  state: AtmosphereRadiativeColumnState,
  climateContext: AtmosphereCondensationClimateContext,
): {
  readonly effectiveCondensationTemperatureKelvin: number;
  readonly heatRedistributionEfficiency01: number;
  readonly coldTrapWeight01: number;
} {
  const heatRedistributionEfficiency01 = heatRedistributionEfficiency(
    state.effectiveSurfacePressurePascal,
    greenhouseLongwaveTrappingFraction01(state.infraredOpticalDepthProxy),
    climateContext.dayLengthHours,
  );

  if (!climateContext.isTidallySynchronized) {
    return Object.freeze({
      effectiveCondensationTemperatureKelvin: state.resolvedSurfaceTemperatureKelvin,
      heatRedistributionEfficiency01,
      coldTrapWeight01: 0,
    });
  }

  const dayNightRangeKelvin =
    state.resolvedSurfaceTemperatureKelvin *
    DIURNAL_RANGE_FRACTION *
    (1 - heatRedistributionEfficiency01);

  const minimumTemperatureProxyKelvin = Math.max(
    1,
    state.resolvedSurfaceTemperatureKelvin - dayNightRangeKelvin / 2,
  );

  /* Permanent-night cold traps matter most when redistribution is poor, but
   * only half of the global gas inventory is allowed to respond to that local
   * extreme. This deliberately avoids treating Tmin as a global atmosphere. */
  const coldTrapWeight01 = 0.5 * (1 - heatRedistributionEfficiency01);
  const effectiveCondensationTemperatureKelvin =
    state.resolvedSurfaceTemperatureKelvin +
    (minimumTemperatureProxyKelvin - state.resolvedSurfaceTemperatureKelvin) *
      coldTrapWeight01;

  return Object.freeze({
    effectiveCondensationTemperatureKelvin,
    heatRedistributionEfficiency01,
    coldTrapWeight01,
  });
}

function heatRedistributionEfficiency(
  surfacePressurePascal: number,
  longwaveTrappingFraction01: number,
  dayLengthHours: number | null,
): number {
  if (surfacePressurePascal <= 0) return 0;
  const pressureFactor01 = surfacePressurePascal /
    (surfacePressurePascal + PRESSURE_REDISTRIBUTION_HALF_PASCAL);
  const hasUsableDayLength =
    typeof dayLengthHours === 'number' &&
    Number.isFinite(dayLengthHours) &&
    dayLengthHours > 0;
  const rotationSupport01 = !hasUsableDayLength
    ? 0.15
    : clamp01(
        1 - Math.log10(Math.max(1, dayLengthHours / 24)) / 2.5,
      );
  return clamp01(
    pressureFactor01 *
      (0.55 + 0.25 * longwaveTrappingFraction01 + 0.20 * rotationSupport01),
  );
}

function nonWaterCondensablesRespectFinalSaturation(
  currentPartialPressures: ReadonlyMap<AtmosphereGas, number>,
  sourcePartialPressures: ReadonlyMap<AtmosphereGas, number>,
  condensationTemperatureKelvin: number,
): boolean {
  for (const gas of NON_WATER_CONDENSABLE_GASES) {
    const sourcePartialPressure = sourcePartialPressures.get(gas);
    if (sourcePartialPressure === undefined || sourcePartialPressure <= 0) continue;

    const saturationPressure = condensableSaturationPressurePascal(
      gas,
      condensationTemperatureKelvin,
    );
    if (saturationPressure === null) continue;

    const effectivePartialPressure = currentPartialPressures.get(gas) ?? 0;
    const maximumGasPhasePressure = Math.min(
      sourcePartialPressure,
      saturationPressure,
    );
    const finalSaturationTolerancePascal = pressureTolerancePascal(
      effectivePartialPressure,
      maximumGasPhasePressure,
      sourcePartialPressure,
      saturationPressure,
    );

    if (effectivePartialPressure - maximumGasPhasePressure > finalSaturationTolerancePascal) {
      return false;
    }
  }

  return true;
}

function pressureConverged(previousPascal: number, nextPascal: number): boolean {
  return Math.abs(previousPascal - nextPascal) <=
    pressureTolerancePascal(previousPascal, nextPascal);
}

function pressureTolerancePascal(...pressuresPascal: readonly number[]): number {
  const scalePascal = pressuresPascal.reduce(
    (scale, pressure) => Math.max(scale, Math.abs(pressure)),
    1,
  );
  return Math.max(
    CONVERGENCE_ABSOLUTE_PASCAL,
    CONVERGENCE_RELATIVE * scalePascal,
  );
}

function normalizeComponents(
  components: readonly AtmosphereGasComponent[],
): readonly AtmosphereGasComponent[] {
  const total = components.reduce((sum, component) => sum + component.moleFraction01, 0);
  if (total <= 0) return Object.freeze([]);
  return Object.freeze(components.flatMap(component => {
    const moleFraction01 = component.moleFraction01 / total;
    return Number.isFinite(moleFraction01) && moleFraction01 > 0
      ? [new AtmosphereGasComponent(component.gas, moleFraction01)]
      : [];
  }));
}

function normalizeComponentsInPlace(components: AtmosphereGasComponent[]): void {
  const total = components.reduce((sum, component) => sum + component.moleFraction01, 0);
  if (Math.abs(total - 1) <= 1e-12) return;
  const normalized = components.flatMap(component => {
    const moleFraction01 = component.moleFraction01 / total;
    return Number.isFinite(moleFraction01) && moleFraction01 > 0
      ? [new AtmosphereGasComponent(component.gas, moleFraction01)]
      : [];
  });
  components.splice(0, components.length, ...normalized);
}

function assertNormalizedGasComposition(components: readonly AtmosphereGasComponent[]): void {
  const total = components.reduce((sum, component) => sum + component.moleFraction01, 0);
  if (!Number.isFinite(total) || Math.abs(total - 1) > 1e-9) {
    throw new RangeError(`Atmospheric gas fractions must sum to 1: ${total}.`);
  }
}

function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be finite and positive: ${value}.`);
  }
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
