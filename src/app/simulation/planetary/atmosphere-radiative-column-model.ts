import {
  AtmosphereGas,
} from '../../domain/planetary/atmosphere-gas';

import {
  AtmosphereGasComponent,
} from '../../domain/planetary/atmosphere-gas-component';

import {
  greenhouseTemperatureAmplificationFactor,
} from '../../domain/planetary/atmosphere-greenhouse-effect';

import {
  PLANET_V1_EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED,
} from '../../domain/planetary/planet-physical-properties';

const EARTH_REFERENCE_PRESSURE_PASCAL = 101_325;
const WATER_TRIPLE_POINT_TEMPERATURE_KELVIN = 273.16;
const WATER_TRIPLE_POINT_VAPOR_PRESSURE_PASCAL = 611.657;
const WATER_CRITICAL_TEMPERATURE_KELVIN = 647.096;
const WATER_CRITICAL_PRESSURE_PASCAL = 22_064_000;

/** Approximate L_s/R_v over ice near the terrestrial cryosphere range. */
const WATER_SUBLIMATION_CLAUSIUS_KELVIN = 6_140;

const MAX_PRESSURE_BROADENING_FACTOR = 2.5;
const MAX_HYDROGEN_CIA_OPTICAL_DEPTH = 8;
const MAX_DENSE_CONTINUUM_OPTICAL_DEPTH = 50;
const MAX_WATER_VAPOR_EQUILIBRIUM_ITERATIONS = 8;
const WATER_VAPOR_CONVERGENCE_ABSOLUTE_PASCAL = 0.05;
const WATER_VAPOR_CONVERGENCE_RELATIVE = 1e-7;

export interface AtmosphereRadiativeGasDiagnostic {
  readonly gas: AtmosphereGas;
  /** Retained point-20.3 mixing ratio before H2O phase partition. */
  readonly mixingRatio01: number;
  readonly effectiveMixingRatio01: number;
  readonly partialPressurePascal: number;
  readonly columnMassEarth: number;
  readonly effectivePartialPressurePascal: number;
  readonly effectiveColumnMassEarth: number;
  readonly opticalDepthContribution: number;
}

export interface AtmosphereRadiativeColumnState {
  /** Thermodynamic gas pressure after condensable H2O has been phase-limited. */
  readonly effectiveSurfacePressurePascal: number;
  readonly sourceWaterVaporMixingRatio01: number;
  readonly sourceWaterVaporPartialPressurePascal: number;
  readonly effectiveWaterVaporMixingRatio01: number;
  readonly effectiveWaterVaporPartialPressurePascal: number;
  readonly saturationVaporPressurePascal: number;
  readonly condensedWaterPartialPressurePascal: number;
  readonly waterVaporIterationCount: number;
  readonly waterVaporConverged: boolean;
  readonly effectiveGasComponents: readonly AtmosphereGasComponent[];
  readonly totalColumnMassEarth: number;
  readonly pressureBroadeningFactor: number;
  /** Sum of the per-species line proxies before unresolved broadband overlap. */
  readonly summedLineOpticalDepthProxy: number;
  /** Effective grey line opacity after smooth overlap/spectral-window saturation. */
  readonly overlapLimitedLineOpticalDepthProxy: number;
  readonly hydrogenCollisionInducedOpticalDepthProxy: number;
  readonly denseContinuumOpticalDepthProxy: number;
  readonly infraredOpticalDepthProxy: number;
  /** Dry/non-H2O starting point for the bounded H2O fixed-point solve. */
  readonly preliminarySurfaceTemperatureKelvin: number;
  /** Mean temperature implied by the converged grey radiative state. */
  readonly resolvedSurfaceTemperatureKelvin: number;
  readonly greenhouseGasDiagnostics: readonly AtmosphereRadiativeGasDiagnostic[];
}

interface SaturatingGasProfile {
  readonly maximumLineOpticalDepth: number;
  readonly saturationColumnMassEarth: number;
  readonly saturationExponent: number;
}

interface EvaluatedRadiativeState {
  readonly effectiveSurfacePressurePascal: number;
  readonly totalColumnMassEarth: number;
  readonly pressureBroadeningFactor: number;
  readonly summedLineOpticalDepthProxy: number;
  readonly overlapLimitedLineOpticalDepthProxy: number;
  readonly hydrogenCollisionInducedOpticalDepthProxy: number;
  readonly denseContinuumOpticalDepthProxy: number;
  readonly infraredOpticalDepthProxy: number;
  readonly surfaceTemperatureKelvin: number;
  readonly effectiveGasComponents: readonly AtmosphereGasComponent[];
  readonly diagnostics: readonly AtmosphereRadiativeGasDiagnostic[];
}

const SATURATING_GAS_PROFILES: Readonly<Partial<Record<AtmosphereGas, SaturatingGasProfile>>> =
  Object.freeze({
    [AtmosphereGas.CARBON_DIOXIDE]: Object.freeze({
      maximumLineOpticalDepth: 2.0,
      saturationColumnMassEarth: 0.20,
      saturationExponent: 0.78,
    }),
    [AtmosphereGas.WATER_VAPOR]: Object.freeze({
      maximumLineOpticalDepth: 2.6,
      saturationColumnMassEarth: 0.012,
      saturationExponent: 0.72,
    }),
    [AtmosphereGas.METHANE]: Object.freeze({
      maximumLineOpticalDepth: 1.5,
      saturationColumnMassEarth: 0.008,
      saturationExponent: 0.72,
    }),
    [AtmosphereGas.SULFUR_DIOXIDE]: Object.freeze({
      maximumLineOpticalDepth: 1.0,
      saturationColumnMassEarth: 0.025,
      saturationExponent: 0.75,
    }),
    [AtmosphereGas.AMMONIA]: Object.freeze({
      maximumLineOpticalDepth: 1.5,
      saturationColumnMassEarth: 0.006,
      saturationExponent: 0.70,
    }),
  });

/**
 * Hotfix climático — pressure/column greenhouse plus thermodynamic H2O closure.
 *
 * Point 20.3 supplies a retained volatile inventory, not a guarantee that every
 * retained H2O molecule can remain gaseous. For solid worlds this model keeps
 * the non-condensable partial pressures fixed and resolves atmospheric H2O with
 * a deterministic bounded fixed-point loop:
 *
 *   retained H2O ceiling -> greenhouse -> T -> pSat(T) -> effective H2O
 *
 * Condensed H2O reduces the gaseous surface pressure and the remaining gas
 * fractions are renormalized from their unchanged dry partial pressures. The
 * condensed remainder is not deleted; point 20.7 still owns its partition into
 * surface ice/liquid/vapor reservoirs. Molecular bands retain the previous
 * saturating P/g model and unresolved-band overlap; this hotfix changes only
 * the thermodynamically available H2O and consequent gas pressure.
 */
export function atmosphereRadiativeColumnState(
  retainedSurfacePressurePascal: number,
  surfaceGravityMetersPerSecondSquared: number,
  equilibriumTemperatureKelvin: number,
  gasComponents: readonly AtmosphereGasComponent[],
): AtmosphereRadiativeColumnState {
  assertPositiveFinite(retainedSurfacePressurePascal, 'retainedSurfacePressurePascal');
  assertPositiveFinite(surfaceGravityMetersPerSecondSquared, 'surfaceGravityMetersPerSecondSquared');
  assertPositiveFinite(equilibriumTemperatureKelvin, 'equilibriumTemperatureKelvin');
  assertNormalizedGasComposition(gasComponents);

  const sourceWater = gasComponents.find(component => component.gas === AtmosphereGas.WATER_VAPOR);
  const sourceWaterVaporMixingRatio01 = sourceWater?.moleFraction01 ?? 0;
  const sourceWaterVaporPartialPressurePascal = retainedSurfacePressurePascal * sourceWaterVaporMixingRatio01;

  /* Derive the dry pressure from the explicit dry species instead of
   * subtracting H2O from the retained total. The public composition contract
   * intentionally accepts tiny floating-point normalization error (1e-9). For
   * steam-dominated atmospheres that absolute tolerance can be much larger than
   * the whole dry inventory: `P * (1 - xH2O)` may then be slightly smaller than
   * `sum(P * xDry)`. After H2O condenses, dividing an unchanged dry partial
   * pressure by that underestimated total can produce an impossible mole
   * fraction > 1. Summing the represented dry partial pressures keeps pressure
   * and composition on the same basis without changing ordinary normalized
   * atmospheres. */
  const drySurfacePressurePascal = gasComponents.reduce(
    (total, component) => component.gas === AtmosphereGas.WATER_VAPOR
      ? total
      : total + retainedSurfacePressurePascal * component.moleFraction01,
    0,
  );

  /* A pure-steam retained atmosphere has no dry-gas pressure, so a literal
   * dry-state evaluation would have zero gaseous pressure and violate the
   * physical contract. In that edge case seed the fixed-point iteration with
   * the amount of steam supportable at radiative equilibrium. Ordinary mixed
   * atmospheres still begin from the true dry solution. */
  const preliminaryWaterVaporPartialPressurePascal =
    drySurfacePressurePascal > 0
      ? 0
      : Math.min(
          sourceWaterVaporPartialPressurePascal,
          waterSaturationVaporPressurePascal(equilibriumTemperatureKelvin),
        );

  const dryState = evaluateRadiativeState(
    retainedSurfacePressurePascal,
    drySurfacePressurePascal,
    preliminaryWaterVaporPartialPressurePascal,
    surfaceGravityMetersPerSecondSquared,
    equilibriumTemperatureKelvin,
    gasComponents,
  );

  const preliminarySurfaceTemperatureKelvin = dryState.surfaceTemperatureKelvin;

  if (sourceWaterVaporPartialPressurePascal <= 0) {
    const saturationVaporPressurePascal = waterSaturationVaporPressurePascal(dryState.surfaceTemperatureKelvin);
    return Object.freeze({
      effectiveSurfacePressurePascal: dryState.effectiveSurfacePressurePascal,
      sourceWaterVaporMixingRatio01: 0,
      sourceWaterVaporPartialPressurePascal: 0,
      effectiveWaterVaporMixingRatio01: 0,
      effectiveWaterVaporPartialPressurePascal: 0,
      saturationVaporPressurePascal,
      condensedWaterPartialPressurePascal: 0,
      waterVaporIterationCount: 0,
      waterVaporConverged: true,
      effectiveGasComponents: dryState.effectiveGasComponents,
      totalColumnMassEarth: dryState.totalColumnMassEarth,
      pressureBroadeningFactor: dryState.pressureBroadeningFactor,
      summedLineOpticalDepthProxy: dryState.summedLineOpticalDepthProxy,
      overlapLimitedLineOpticalDepthProxy: dryState.overlapLimitedLineOpticalDepthProxy,
      hydrogenCollisionInducedOpticalDepthProxy: dryState.hydrogenCollisionInducedOpticalDepthProxy,
      denseContinuumOpticalDepthProxy: dryState.denseContinuumOpticalDepthProxy,
      infraredOpticalDepthProxy: dryState.infraredOpticalDepthProxy,
      preliminarySurfaceTemperatureKelvin,
      resolvedSurfaceTemperatureKelvin: dryState.surfaceTemperatureKelvin,
      greenhouseGasDiagnostics: dryState.diagnostics,
    });
  }

  let effectiveWaterVaporPartialPressurePascal = Math.min(
    sourceWaterVaporPartialPressurePascal,
    waterSaturationVaporPressurePascal(preliminarySurfaceTemperatureKelvin),
  );

  let waterVaporIterationCount = 0;
  let waterVaporConverged = false;
  let resolved = dryState;
  let saturationVaporPressurePascal = waterSaturationVaporPressurePascal(preliminarySurfaceTemperatureKelvin);

  for (let iteration = 1; iteration <= MAX_WATER_VAPOR_EQUILIBRIUM_ITERATIONS; iteration += 1) {
    waterVaporIterationCount = iteration;
    resolved = evaluateRadiativeState(
      retainedSurfacePressurePascal,
      drySurfacePressurePascal,
      effectiveWaterVaporPartialPressurePascal,
      surfaceGravityMetersPerSecondSquared,
      equilibriumTemperatureKelvin,
      gasComponents,
    );

    saturationVaporPressurePascal = waterSaturationVaporPressurePascal(resolved.surfaceTemperatureKelvin);
    const nextWaterVaporPartialPressurePascal = Math.min(
      sourceWaterVaporPartialPressurePascal,
      saturationVaporPressurePascal,
    );

    if (waterVaporPressureConverged(
      effectiveWaterVaporPartialPressurePascal,
      nextWaterVaporPartialPressurePascal,
    )) {
      effectiveWaterVaporPartialPressurePascal = nextWaterVaporPartialPressurePascal;
      waterVaporConverged = true;
      break;
    }

    /* Starting from the dry solution makes this branch monotonic for the
     * positive H2O greenhouse feedback. A fixed iteration cap preserves exact
     * determinism even near a moist/runaway transition. */
    effectiveWaterVaporPartialPressurePascal = nextWaterVaporPartialPressurePascal;
  }

  /* Evaluate exactly once at the accepted fixed-point value so every exposed
   * pressure/composition/tau diagnostic belongs to the same thermodynamic state. */
  resolved = evaluateRadiativeState(
    retainedSurfacePressurePascal,
    drySurfacePressurePascal,
    effectiveWaterVaporPartialPressurePascal,
    surfaceGravityMetersPerSecondSquared,
    equilibriumTemperatureKelvin,
    gasComponents,
  );
  saturationVaporPressurePascal = waterSaturationVaporPressurePascal(resolved.surfaceTemperatureKelvin);

  const finalTarget = Math.min(sourceWaterVaporPartialPressurePascal, saturationVaporPressurePascal);
  if (waterVaporPressureConverged(effectiveWaterVaporPartialPressurePascal, finalTarget)) {
    waterVaporConverged = true;
  }

  const effectiveWaterVaporMixingRatio01 =
    resolved.effectiveSurfacePressurePascal <= 0
      ? 0
      : effectiveWaterVaporPartialPressurePascal / resolved.effectiveSurfacePressurePascal;

  return Object.freeze({
    effectiveSurfacePressurePascal: resolved.effectiveSurfacePressurePascal,
    sourceWaterVaporMixingRatio01,
    sourceWaterVaporPartialPressurePascal,
    effectiveWaterVaporMixingRatio01,
    effectiveWaterVaporPartialPressurePascal,
    saturationVaporPressurePascal,
    condensedWaterPartialPressurePascal:
      sourceWaterVaporPartialPressurePascal - effectiveWaterVaporPartialPressurePascal,
    waterVaporIterationCount,
    waterVaporConverged,
    effectiveGasComponents: resolved.effectiveGasComponents,
    totalColumnMassEarth: resolved.totalColumnMassEarth,
    pressureBroadeningFactor: resolved.pressureBroadeningFactor,
    summedLineOpticalDepthProxy: resolved.summedLineOpticalDepthProxy,
    overlapLimitedLineOpticalDepthProxy: resolved.overlapLimitedLineOpticalDepthProxy,
    hydrogenCollisionInducedOpticalDepthProxy: resolved.hydrogenCollisionInducedOpticalDepthProxy,
    denseContinuumOpticalDepthProxy: resolved.denseContinuumOpticalDepthProxy,
    infraredOpticalDepthProxy: resolved.infraredOpticalDepthProxy,
    preliminarySurfaceTemperatureKelvin,
    resolvedSurfaceTemperatureKelvin: resolved.surfaceTemperatureKelvin,
    greenhouseGasDiagnostics: resolved.diagnostics,
  });
}

function evaluateRadiativeState(
  sourceSurfacePressurePascal: number,
  drySurfacePressurePascal: number,
  waterVaporPartialPressurePascal: number,
  surfaceGravityMetersPerSecondSquared: number,
  equilibriumTemperatureKelvin: number,
  sourceGasComponents: readonly AtmosphereGasComponent[],
): EvaluatedRadiativeState {
  const effectiveSurfacePressurePascal = drySurfacePressurePascal + waterVaporPartialPressurePascal;
  assertPositiveFinite(effectiveSurfacePressurePascal, 'effectiveSurfacePressurePascal');

  const surfaceGravityEarth =
    surfaceGravityMetersPerSecondSquared /
    PLANET_V1_EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED;

  const totalColumnMassEarth =
    effectiveSurfacePressurePascal /
    EARTH_REFERENCE_PRESSURE_PASCAL /
    surfaceGravityEarth;

  const pressureBroadeningFactor = Math.min(
    MAX_PRESSURE_BROADENING_FACTOR,
    1 + 0.35 * Math.log1p(totalColumnMassEarth),
  );

  const effectiveGasComponents = effectiveGasComposition(
    sourceSurfacePressurePascal,
    effectiveSurfacePressurePascal,
    waterVaporPartialPressurePascal,
    sourceGasComponents,
  );

  const diagnostics: AtmosphereRadiativeGasDiagnostic[] = [];
  let summedLineOpticalDepthProxy = 0;
  let hydrogenMoleFraction01 = 0;
  let greenhouseActiveMoleFraction01 = 0;

  for (const effectiveComponent of effectiveGasComponents) {
    const sourceComponent = sourceGasComponents.find(component => component.gas === effectiveComponent.gas);
    const sourceMixingRatio01 = sourceComponent?.moleFraction01 ?? 0;
    const sourcePartialPressurePascal = sourceSurfacePressurePascal * sourceMixingRatio01;
    const sourceColumnMassEarth = sourcePartialPressurePascal /
      EARTH_REFERENCE_PRESSURE_PASCAL /
      surfaceGravityEarth;

    const effectivePartialPressurePascal =
      effectiveSurfacePressurePascal * effectiveComponent.moleFraction01;
    const effectiveColumnMassEarth = effectivePartialPressurePascal /
      EARTH_REFERENCE_PRESSURE_PASCAL /
      surfaceGravityEarth;

    if (effectiveComponent.gas === AtmosphereGas.HYDROGEN) {
      hydrogenMoleFraction01 = effectiveComponent.moleFraction01;
      continue;
    }

    const profile = SATURATING_GAS_PROFILES[effectiveComponent.gas];
    if (profile === undefined) {
      continue;
    }

    const opticalDepthContribution = saturatingLineOpticalDepth(
      effectiveColumnMassEarth,
      profile,
    ) * pressureBroadeningFactor;

    summedLineOpticalDepthProxy += opticalDepthContribution;
    greenhouseActiveMoleFraction01 += effectiveComponent.moleFraction01;

    diagnostics.push(Object.freeze({
      gas: effectiveComponent.gas,
      mixingRatio01: sourceMixingRatio01,
      effectiveMixingRatio01: effectiveComponent.moleFraction01,
      partialPressurePascal: sourcePartialPressurePascal,
      columnMassEarth: sourceColumnMassEarth,
      effectivePartialPressurePascal,
      effectiveColumnMassEarth,
      opticalDepthContribution,
    }));
  }

  const hydrogenPartialPressurePascal = effectiveSurfacePressurePascal * hydrogenMoleFraction01;
  const hydrogenColumnMassEarth = hydrogenPartialPressurePascal /
    EARTH_REFERENCE_PRESSURE_PASCAL /
    surfaceGravityEarth;

  const hydrogenCollisionInducedOpticalDepthProxy = hydrogenMoleFraction01 <= 0
    ? 0
    : Math.min(
        MAX_HYDROGEN_CIA_OPTICAL_DEPTH,
        0.7 * Math.log1p(hydrogenColumnMassEarth * totalColumnMassEarth / 0.03),
      );

  if (hydrogenMoleFraction01 > 0) {
    const sourceHydrogen = sourceGasComponents.find(component => component.gas === AtmosphereGas.HYDROGEN);
    const sourceMixingRatio01 = sourceHydrogen?.moleFraction01 ?? 0;
    const sourcePartialPressurePascal = sourceSurfacePressurePascal * sourceMixingRatio01;
    diagnostics.push(Object.freeze({
      gas: AtmosphereGas.HYDROGEN,
      mixingRatio01: sourceMixingRatio01,
      effectiveMixingRatio01: hydrogenMoleFraction01,
      partialPressurePascal: sourcePartialPressurePascal,
      columnMassEarth: sourcePartialPressurePascal /
        EARTH_REFERENCE_PRESSURE_PASCAL /
        surfaceGravityEarth,
      effectivePartialPressurePascal: hydrogenPartialPressurePascal,
      effectiveColumnMassEarth: hydrogenColumnMassEarth,
      opticalDepthContribution: hydrogenCollisionInducedOpticalDepthProxy,
    }));
  }

  const denseContinuumOpticalDepthProxy = denseAtmosphereContinuumOpticalDepth(
    totalColumnMassEarth,
    greenhouseActiveMoleFraction01 + 0.2 * hydrogenMoleFraction01,
  );

  const overlapLimitedLineOpticalDepthProxy = overlapLimitedLineOpticalDepth(
    summedLineOpticalDepthProxy,
  );

  const infraredOpticalDepthProxy =
    overlapLimitedLineOpticalDepthProxy +
    hydrogenCollisionInducedOpticalDepthProxy +
    denseContinuumOpticalDepthProxy;

  const surfaceTemperatureKelvin =
    equilibriumTemperatureKelvin *
    greenhouseTemperatureAmplificationFactor(infraredOpticalDepthProxy);

  return Object.freeze({
    effectiveSurfacePressurePascal,
    totalColumnMassEarth,
    pressureBroadeningFactor,
    summedLineOpticalDepthProxy,
    overlapLimitedLineOpticalDepthProxy,
    hydrogenCollisionInducedOpticalDepthProxy,
    denseContinuumOpticalDepthProxy,
    infraredOpticalDepthProxy,
    surfaceTemperatureKelvin,
    effectiveGasComponents,
    diagnostics: Object.freeze([...diagnostics]),
  });
}

function effectiveGasComposition(
  sourceSurfacePressurePascal: number,
  effectiveSurfacePressurePascal: number,
  waterVaporPartialPressurePascal: number,
  sourceGasComponents: readonly AtmosphereGasComponent[],
): readonly AtmosphereGasComponent[] {
  const components = sourceGasComponents.flatMap(component => {
    const partialPressurePascal = component.gas === AtmosphereGas.WATER_VAPOR
      ? waterVaporPartialPressurePascal
      : sourceSurfacePressurePascal * component.moleFraction01;

    if (partialPressurePascal <= 0) return [];

    const moleFraction01 = partialPressurePascal / effectiveSurfacePressurePascal;
    /* A phase-limited trace species can remain positive in pressure space yet
     * underflow to +0 when represented as a normalized mole fraction. The
     * effective gas list must contain only strictly positive represented
     * species; source/condensed diagnostics retain the physical inventory. */
    if (!Number.isFinite(moleFraction01) || moleFraction01 <= 0) return [];

    return [new AtmosphereGasComponent(
      component.gas,
      moleFraction01,
    )];
  });

  return Object.freeze(components);
}

/**
 * Saturation vapor pressure of water over ice below the triple point and over
 * liquid water above it. The ice branch uses Clausius-Clapeyron anchored at the
 * triple point. The liquid branch uses two Antoine ranges, scaled at their
 * junctions to keep the procedural curve continuous. At/above the critical
 * point the saturation distinction ceases to apply and the critical pressure is
 * used as a finite ceiling.
 */
export function waterSaturationVaporPressurePascal(
  temperatureKelvin: number,
): number {
  assertPositiveFinite(temperatureKelvin, 'temperatureKelvin');

  const temperature = Math.max(150, Math.min(WATER_CRITICAL_TEMPERATURE_KELVIN, temperatureKelvin));

  if (temperature <= WATER_TRIPLE_POINT_TEMPERATURE_KELVIN) {
    return WATER_TRIPLE_POINT_VAPOR_PRESSURE_PASCAL * Math.exp(
      WATER_SUBLIMATION_CLAUSIUS_KELVIN *
      (1 / WATER_TRIPLE_POINT_TEMPERATURE_KELVIN - 1 / temperature),
    );
  }

  if (temperature >= WATER_CRITICAL_TEMPERATURE_KELVIN) {
    return WATER_CRITICAL_PRESSURE_PASCAL;
  }

  const lowAtTriple = antoineWaterVaporPressurePascal(WATER_TRIPLE_POINT_TEMPERATURE_KELVIN, 8.07131, 1730.63, 233.426);
  const lowScale = WATER_TRIPLE_POINT_VAPOR_PRESSURE_PASCAL / lowAtTriple;

  if (temperature <= 373.15) {
    return antoineWaterVaporPressurePascal(temperature, 8.07131, 1730.63, 233.426) * lowScale;
  }

  const lowAtBoiling = antoineWaterVaporPressurePascal(373.15, 8.07131, 1730.63, 233.426) * lowScale;
  const highAtBoiling = antoineWaterVaporPressurePascal(373.15, 8.14019, 1810.94, 244.485);
  const highScale = lowAtBoiling / highAtBoiling;
  return Math.min(
    WATER_CRITICAL_PRESSURE_PASCAL,
    antoineWaterVaporPressurePascal(temperature, 8.14019, 1810.94, 244.485) * highScale,
  );
}

function antoineWaterVaporPressurePascal(
  temperatureKelvin: number,
  a: number,
  b: number,
  c: number,
): number {
  const temperatureCelsius = temperatureKelvin - 273.15;
  const millimetersMercury = Math.pow(10, a - b / (c + temperatureCelsius));
  return millimetersMercury * 133.322368;
}

function waterVaporPressureConverged(previousPascal: number, nextPascal: number): boolean {
  const tolerance = Math.max(
    WATER_VAPOR_CONVERGENCE_ABSOLUTE_PASCAL,
    WATER_VAPOR_CONVERGENCE_RELATIVE * Math.max(1, Math.abs(previousPascal), Math.abs(nextPascal)),
  );
  return Math.abs(previousPascal - nextPascal) <= tolerance;
}

/** Coarse unresolved-band overlap for the grey climate handoff. */
function overlapLimitedLineOpticalDepth(summedLineOpticalDepth: number): number {
  return summedLineOpticalDepth <= 0 ? 0 : Math.log1p(summedLineOpticalDepth);
}

function saturatingLineOpticalDepth(
  columnMassEarth: number,
  profile: SaturatingGasProfile,
): number {
  if (columnMassEarth <= 0) return 0;
  return profile.maximumLineOpticalDepth *
    (1 - Math.exp(-Math.pow(
      columnMassEarth / profile.saturationColumnMassEarth,
      profile.saturationExponent,
    )));
}

function denseAtmosphereContinuumOpticalDepth(
  totalColumnMassEarth: number,
  greenhouseActiveMoleFraction01: number,
): number {
  const excessColumnMassEarth = Math.max(0, totalColumnMassEarth - 1);
  if (excessColumnMassEarth === 0 || greenhouseActiveMoleFraction01 <= 0) return 0;
  return Math.min(
    MAX_DENSE_CONTINUUM_OPTICAL_DEPTH,
    0.22 * greenhouseActiveMoleFraction01 * Math.pow(excessColumnMassEarth, 1.22),
  );
}

function assertNormalizedGasComposition(gasComponents: readonly AtmosphereGasComponent[]): void {
  const total = gasComponents.reduce((sum, component) => sum + component.moleFraction01, 0);
  if (!Number.isFinite(total) || Math.abs(total - 1) > 1e-9) {
    throw new RangeError(`Atmospheric gas fractions must sum to 1 before radiative phase partition: ${total}.`);
  }
}

function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be finite and greater than zero: ${value}.`);
  }
}
