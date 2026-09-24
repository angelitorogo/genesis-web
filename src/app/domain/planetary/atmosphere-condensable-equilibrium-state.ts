import { AtmosphereGas } from './atmosphere-gas';
import { type AtmosphereGasComponent } from './atmosphere-gas-component';

const CONSISTENCY_TOLERANCE = 1e-7;
const MAX_REPORTED_CONDENSATION_ITERATIONS = 512;

export class AtmosphereCondensableSpeciesEquilibrium {
  constructor(
    readonly gas: AtmosphereGas,
    readonly sourceMixingRatio01: number,
    readonly sourcePartialPressurePascal: number,
    readonly effectiveMixingRatio01: number,
    readonly effectivePartialPressurePascal: number,
    readonly saturationPressurePascal: number,
    readonly condensedPartialPressurePascal: number,
    readonly condensationTemperatureKelvin: number,
  ) {
    if (!Object.values(AtmosphereGas).includes(gas)) {
      throw new RangeError('AtmosphereCondensableSpeciesEquilibrium requires a known AtmosphereGas.');
    }

    for (const [label, value] of [
      ['sourceMixingRatio01', sourceMixingRatio01],
      ['effectiveMixingRatio01', effectiveMixingRatio01],
    ] as const) {
      if (!Number.isFinite(value) || value < 0 || value > 1) {
        throw new RangeError(`${label} must be finite and in [0, 1]: ${value}.`);
      }
    }

    for (const [label, value] of [
      ['sourcePartialPressurePascal', sourcePartialPressurePascal],
      ['effectivePartialPressurePascal', effectivePartialPressurePascal],
      ['saturationPressurePascal', saturationPressurePascal],
      ['condensedPartialPressurePascal', condensedPartialPressurePascal],
    ] as const) {
      if (!Number.isFinite(value) || value < 0) {
        throw new RangeError(`${label} must be finite and non-negative: ${value}.`);
      }
    }

    if (!Number.isFinite(condensationTemperatureKelvin) || condensationTemperatureKelvin <= 0) {
      throw new RangeError(`condensationTemperatureKelvin must be finite and positive: ${condensationTemperatureKelvin}.`);
    }

    if (effectivePartialPressurePascal > sourcePartialPressurePascal * (1 + CONSISTENCY_TOLERANCE)) {
      throw new RangeError('Gas-phase partial pressure cannot exceed the retained species inventory.');
    }

    const saturationTolerancePascal = Math.max(
      0.05,
      1e-7 * Math.max(1, sourcePartialPressurePascal, saturationPressurePascal),
    );
    if (effectivePartialPressurePascal - saturationPressurePascal > saturationTolerancePascal) {
      throw new RangeError(
        `Gas-phase partial pressure cannot exceed the species saturation/sublimation pressure for ${gas}: effective=${effectivePartialPressurePascal}, saturation=${saturationPressurePascal}, T=${condensationTemperatureKelvin}.`,
      );
    }

    if (!approximatelyEqual(
      condensedPartialPressurePascal,
      sourcePartialPressurePascal - effectivePartialPressurePascal,
    )) {
      throw new RangeError('Condensed reservoir must equal retained species inventory minus gas-phase inventory.');
    }

    Object.freeze(this);
  }

  get condensedFractionOfRetained01(): number {
    if (this.sourcePartialPressurePascal <= 0) return 0;
    return this.condensedPartialPressurePascal / this.sourcePartialPressurePascal;
  }
}

/**
 * Climate-coupled phase partition for condensable atmospheric species.
 *
 * Point 20.3 remains the owner of escape/retention. This state only partitions
 * that already-retained inventory between gas and condensed reservoirs. The
 * condensed equivalent pressure is therefore an inventory diagnostic, not a
 * claim that all condensate forms one literal surface layer.
 */
export class AtmosphereCondensableEquilibriumState {
  readonly speciesEquilibria: readonly AtmosphereCondensableSpeciesEquilibrium[];
  readonly effectiveGasComponents: readonly AtmosphereGasComponent[];

  constructor(
    readonly sourceSurfacePressurePascal: number,
    readonly effectiveSurfacePressurePascal: number,
    readonly meanSurfaceTemperatureKelvin: number,
    readonly effectiveCondensationTemperatureKelvin: number,
    readonly heatRedistributionEfficiency01: number,
    readonly coldTrapWeight01: number,
    readonly iterationCount: number,
    readonly converged: boolean,
    speciesEquilibria: readonly AtmosphereCondensableSpeciesEquilibrium[],
    effectiveGasComponents: readonly AtmosphereGasComponent[],
  ) {
    for (const [label, value] of [
      ['sourceSurfacePressurePascal', sourceSurfacePressurePascal],
      ['effectiveSurfacePressurePascal', effectiveSurfacePressurePascal],
      ['meanSurfaceTemperatureKelvin', meanSurfaceTemperatureKelvin],
      ['effectiveCondensationTemperatureKelvin', effectiveCondensationTemperatureKelvin],
    ] as const) {
      if (!Number.isFinite(value) || value <= 0) {
        throw new RangeError(`${label} must be finite and positive: ${value}.`);
      }
    }

    for (const [label, value] of [
      ['heatRedistributionEfficiency01', heatRedistributionEfficiency01],
      ['coldTrapWeight01', coldTrapWeight01],
    ] as const) {
      if (!Number.isFinite(value) || value < 0 || value > 1) {
        throw new RangeError(`${label} must be finite and in [0, 1]: ${value}.`);
      }
    }

    if (
      !Number.isInteger(iterationCount) ||
      iterationCount < 0 ||
      iterationCount > MAX_REPORTED_CONDENSATION_ITERATIONS
    ) {
      throw new RangeError(
        `iterationCount must be an integer in [0, ${MAX_REPORTED_CONDENSATION_ITERATIONS}]: ${iterationCount}.`,
      );
    }

    if (effectiveSurfacePressurePascal > sourceSurfacePressurePascal * (1 + CONSISTENCY_TOLERANCE)) {
      throw new RangeError('Condensation cannot increase gaseous surface pressure.');
    }

    const seen = new Set<AtmosphereGas>();
    for (const species of speciesEquilibria) {
      if (seen.has(species.gas)) {
        throw new RangeError(`Duplicate condensable equilibrium species: ${species.gas}.`);
      }
      seen.add(species.gas);
    }

    const gasFractionSum = effectiveGasComponents.reduce(
      (sum, component) => sum + component.moleFraction01,
      0,
    );
    if (effectiveGasComponents.length > 0 && !approximatelyEqual(gasFractionSum, 1)) {
      throw new RangeError(`Final gas-phase mixing ratios must sum to 1: ${gasFractionSum}.`);
    }

    for (const species of speciesEquilibria) {
      const component = effectiveGasComponents.find(candidate => candidate.gas === species.gas);
      const componentFraction = component?.moleFraction01 ?? 0;
      if (!approximatelyEqual(componentFraction, species.effectiveMixingRatio01)) {
        throw new RangeError(`Final ${species.gas} mixing ratio must match the condensable equilibrium state.`);
      }
    }

    this.speciesEquilibria = Object.freeze([...speciesEquilibria]);
    this.effectiveGasComponents = Object.freeze([...effectiveGasComponents]);
    Object.freeze(this);
  }

  species(gas: AtmosphereGas): AtmosphereCondensableSpeciesEquilibrium | null {
    return this.speciesEquilibria.find(candidate => candidate.gas === gas) ?? null;
  }
}

function approximatelyEqual(left: number, right: number): boolean {
  const scale = Math.max(1, Math.abs(left), Math.abs(right));
  return Math.abs(left - right) <= CONSISTENCY_TOLERANCE * scale;
}
