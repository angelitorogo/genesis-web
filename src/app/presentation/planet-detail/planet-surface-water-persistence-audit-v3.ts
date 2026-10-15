import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import { waterSaturationVaporPressurePascal } from '../../simulation/planetary/atmosphere-radiative-column-model';
import {
  waterBoilingTemperatureKelvinForPressurePascal,
  WATER_V1_FREEZING_TEMPERATURE_KELVIN,
} from '../../simulation/planetary/planet-water-engine';

/**
 * ATM-VIS.3: read-only scientific consistency audit. This is NOT another
 * hydrosphere generator and must never change stored water phases, coverage,
 * persistence flags, atmosphere, climate or surface-rendering inputs.
 *
 * Total atmospheric pressure constrains boiling; partial H2O pressure relative
 * to saturation constrains evaporation tendency. A low ratio alone does NOT
 * prove liquid water impossible: continuous replenishment, local conditions
 * and an unresolved hydrological cycle could sustain a surface reservoir.
 */
export type PlanetWaterPersistenceAuditStatus =
  | 'NOT_APPLICABLE'
  | 'NOT_EVALUABLE'
  | 'THERMAL_INCONSISTENCY'
  | 'EVAPORATION_REPLENISHMENT_UNRESOLVED'
  | 'THERMALLY_ADMISSIBLE_UNCONFIRMED';

export interface PlanetWaterPersistenceAuditInputV3 {
  readonly hasDefinedSolidSurfaceBase: boolean;
  readonly hasPersistentSurfaceLiquidWater: boolean;
  readonly retainedSurfacePressurePascal: number | null;
  readonly meanSurfaceTemperatureKelvin: number | null;
  readonly retainedGasComposition: readonly Readonly<{
    gas: string;
    moleFraction01: number;
  }>[] | null;
}

export interface PlanetWaterPersistenceAuditV3 {
  readonly status: PlanetWaterPersistenceAuditStatus;
  readonly waterVaporPartialPressurePascal: number | null;
  readonly waterSaturationPressurePascal: number | null;
  readonly relativeSaturation01: number | null;
  readonly boilingTemperatureKelvin: number | null;
}

const STRONG_SUBSATURATION_THRESHOLD01 = 0.25;

export function auditPlanetSurfaceWaterPersistenceV3(
  input: PlanetWaterPersistenceAuditInputV3,
): PlanetWaterPersistenceAuditV3 {
  const result = (
    status: PlanetWaterPersistenceAuditStatus,
    vapor: number | null = null,
    saturation: number | null = null,
    ratio: number | null = null,
    boiling: number | null = null,
  ): PlanetWaterPersistenceAuditV3 => Object.freeze({
    status,
    waterVaporPartialPressurePascal: vapor,
    waterSaturationPressurePascal: saturation,
    relativeSaturation01: ratio,
    boilingTemperatureKelvin: boiling,
  });

  if (!input.hasDefinedSolidSurfaceBase || !input.hasPersistentSurfaceLiquidWater) {
    return result('NOT_APPLICABLE');
  }

  const pressure = input.retainedSurfacePressurePascal;
  const temperature = input.meanSurfaceTemperatureKelvin;
  const gases = input.retainedGasComposition;
  if (pressure === null || !Number.isFinite(pressure) || pressure < 0 ||
      temperature === null || !Number.isFinite(temperature) || temperature <= 0) {
    return result('NOT_EVALUABLE');
  }

  const boiling = waterBoilingTemperatureKelvinForPressurePascal(pressure);
  if (boiling === null || temperature < WATER_V1_FREEZING_TEMPERATURE_KELVIN ||
      temperature >= boiling) {
    return result('THERMAL_INCONSISTENCY', null, null, null, boiling);
  }

  if (!gases || gases.length === 0 || gases.some(gas =>
    !Number.isFinite(gas.moleFraction01) || gas.moleFraction01 < 0 || gas.moleFraction01 > 1)) {
    return result('NOT_EVALUABLE', null, null, null, boiling);
  }

  const sum = gases.reduce((acc, gas) => acc + gas.moleFraction01, 0);
  if (Math.abs(sum - 1) > 0.005) {
    // A partial/rounded preview is not evidence of zero H2O.
    return result('NOT_EVALUABLE', null, null, null, boiling);
  }

  const waterMoleFraction = gases
    .filter(gas => gas.gas === AtmosphereGas.WATER_VAPOR)
    .reduce((acc, gas) => acc + gas.moleFraction01, 0);
  const vapor = pressure * waterMoleFraction;
  const saturation = waterSaturationVaporPressurePascal(temperature);
  const ratio = Math.max(0, Math.min(1, vapor / saturation));

  return result(
    ratio < STRONG_SUBSATURATION_THRESHOLD01
      ? 'EVAPORATION_REPLENISHMENT_UNRESOLVED'
      : 'THERMALLY_ADMISSIBLE_UNCONFIRMED',
    vapor, saturation, ratio, boiling,
  );
}
