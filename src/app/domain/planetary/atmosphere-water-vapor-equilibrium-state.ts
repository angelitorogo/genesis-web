import { AtmosphereGas } from './atmosphere-gas';
import { type AtmosphereGasComponent } from './atmosphere-gas-component';

const CONSISTENCY_TOLERANCE = 1e-9;

/**
 * Thermodynamic phase-partition diagnostic for atmospheric H2O on a solid world.
 *
 * Point 20.3 still owns long-term atmospheric retention. This state is a later
 * climate-coupled projection: it keeps the dry-gas partial pressures fixed while
 * allowing retained H2O vapor to condense/freeze until its gaseous partial
 * pressure is compatible with the converged saturation-vapor-pressure ceiling.
 * The condensed remainder is not lost from the planetary water inventory.
 */
export class AtmosphereWaterVaporEquilibriumState {
  readonly effectiveGasComponents: readonly AtmosphereGasComponent[];

  constructor(
    readonly sourceSurfacePressurePascal: number,
    readonly sourceWaterVaporMoleFraction01: number,
    readonly sourceWaterVaporPartialPressurePascal: number,
    readonly effectiveSurfacePressurePascal: number,
    readonly effectiveWaterVaporMoleFraction01: number,
    readonly effectiveWaterVaporPartialPressurePascal: number,
    readonly saturationVaporPressurePascal: number,
    readonly condensedWaterPartialPressurePascal: number,
    readonly iterationCount: number,
    readonly converged: boolean,
    effectiveGasComponents: readonly AtmosphereGasComponent[],
  ) {
    for (const [label, value] of [
      ['sourceSurfacePressurePascal', sourceSurfacePressurePascal],
      ['sourceWaterVaporPartialPressurePascal', sourceWaterVaporPartialPressurePascal],
      ['effectiveSurfacePressurePascal', effectiveSurfacePressurePascal],
      ['effectiveWaterVaporPartialPressurePascal', effectiveWaterVaporPartialPressurePascal],
      ['saturationVaporPressurePascal', saturationVaporPressurePascal],
      ['condensedWaterPartialPressurePascal', condensedWaterPartialPressurePascal],
    ] as const) {
      if (!Number.isFinite(value) || value < 0) {
        throw new RangeError(`${label} must be finite and non-negative: ${value}.`);
      }
    }

    for (const [label, value] of [
      ['sourceWaterVaporMoleFraction01', sourceWaterVaporMoleFraction01],
      ['effectiveWaterVaporMoleFraction01', effectiveWaterVaporMoleFraction01],
    ] as const) {
      if (!Number.isFinite(value) || value < 0 || value > 1) {
        throw new RangeError(`${label} must be finite and in [0, 1]: ${value}.`);
      }
    }

    if (!Number.isInteger(iterationCount) || iterationCount < 0 || iterationCount > 8) {
      throw new RangeError(`iterationCount must be an integer in [0, 8]: ${iterationCount}.`);
    }

    if (effectiveSurfacePressurePascal > sourceSurfacePressurePascal * (1 + CONSISTENCY_TOLERANCE)) {
      throw new RangeError('Condensation cannot increase the gaseous surface pressure.');
    }

    if (effectiveWaterVaporPartialPressurePascal > sourceWaterVaporPartialPressurePascal * (1 + CONSISTENCY_TOLERANCE)) {
      throw new RangeError('Effective H2O vapor pressure cannot exceed the retained H2O inventory ceiling.');
    }

    if (effectiveWaterVaporPartialPressurePascal > saturationVaporPressurePascal * (1 + 1e-6)) {
      throw new RangeError('Effective H2O vapor pressure cannot exceed saturation vapor pressure.');
    }

    if (!approximatelyEqual(
      condensedWaterPartialPressurePascal,
      sourceWaterVaporPartialPressurePascal - effectiveWaterVaporPartialPressurePascal,
    )) {
      throw new RangeError('Condensed H2O must equal retained vapor inventory minus effective gaseous H2O.');
    }

    const sum = effectiveGasComponents.reduce((total, component) => total + component.moleFraction01, 0);
    if (effectiveGasComponents.length > 0 && !approximatelyEqual(sum, 1)) {
      throw new RangeError('Effective atmospheric gas fractions must sum to 1.');
    }

    const water = effectiveGasComponents.find(component => component.gas === AtmosphereGas.WATER_VAPOR);
    const componentWater = water?.moleFraction01 ?? 0;
    if (!approximatelyEqual(componentWater, effectiveWaterVaporMoleFraction01)) {
      throw new RangeError('Effective H2O component must match effectiveWaterVaporMoleFraction01.');
    }

    this.effectiveGasComponents = Object.freeze([...effectiveGasComponents]);
    Object.freeze(this);
  }
}

function approximatelyEqual(left: number, right: number): boolean {
  const scale = Math.max(1, Math.abs(left), Math.abs(right));
  return Math.abs(left - right) <= CONSISTENCY_TOLERANCE * scale;
}
