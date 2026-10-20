import type { MoonFormationInventory32F1d } from '../../domain/planetary/moon-formation-inventory-32-f-1d';
import type { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import type {
  MoonWaterPhaseEndpoint32F2a, MoonWaterPhaseInventory32F2a,
} from '../../domain/planetary/moon-water-phase-inventory-32-f-2a';
import { MoonAtmosphereAutomaticV2Source32F1c } from './moon-atmosphere-automatic-v2-32-f-1c';

const WATER_TRIPLE_POINT_K = 273.16;
const WATER_CRITICAL_K = 647.096;
const MISSING = Object.freeze([
  'NO_RESOLVED_SURFACE_WATER_EXPOSURE_OR_GEOGRAPHY',
  'NO_INDEPENDENT_SURFACE_PRESSURE_OR_ATMOSPHERIC_HISTORY',
  'NO_INTERIOR_SHELL_THICKNESS_PRESSURE_SALINITY_OR_THERMAL_PROFILE',
  'NO_DATED_WATER_EXCHANGE_OR_ESCAPE_RATES',
] as const);

/**
 * 32.F.2a: no new seed draws and no partition fractions invented.
 * The three endpoints bound *possible* allocations of the conditional H2O
 * formation mass. Ice+vapor equilibrium is meaningful below the triple point.
 * Liquid+vapor equilibrium is meaningful above it only with explicitly assumed
 * external confinement >= saturation pressure. The buried endpoint leaves
 * the interior phase unresolved; actual compartment fractions are all null.
 * 32.F.2b must provide geometry/thermal profiles to resolve interior phases.
 */
export class MoonWaterPhaseBalanceEngine32F2a {
  private constructor() {}

  static fromMaterialized(
    physical: MoonPhysicalProperties,
    inventory: MoonFormationInventory32F1d,
    surfaceTemperatureKelvin: number,
  ): MoonWaterPhaseInventory32F2a {
    const canonicalMass = physical.massEarth * 5.9722e24;
    if (inventory.hostPlanetOrdinal !== physical.hostPlanetOrdinal ||
      inventory.moonOrdinal !== physical.moonOrdinal ||
      inventory.provenance !== 'DETERMINISTIC_CONDITIONAL_FORMATION_MODEL_NOT_OBSERVATION' ||
      !Number.isFinite(canonicalMass) || canonicalMass <= 0 ||
      !Number.isFinite(inventory.totalMassKilograms) ||
      Math.abs(inventory.totalMassKilograms - canonicalMass) / canonicalMass > 1e-12 ||
      !Number.isFinite(inventory.waterIceMassKilograms) || inventory.waterIceMassKilograms < 0 ||
      inventory.waterIceMassKilograms > inventory.totalMassKilograms ||
      !Number.isFinite(surfaceTemperatureKelvin) || surfaceTemperatureKelvin <= 0) {
      throw new RangeError('32.F.2a requires aligned, nonnegative formation H2O and finite moon state.');
    }
    const water = inventory.waterIceMassKilograms;
    const constraints = MoonAtmosphereAutomaticV2Source32F1c.fromMaterialized(physical, surfaceTemperatureKelvin);
    const saturation = constraints.waterVaporSaturationPascalIfEquilibrated;
    const vaporCapacity = saturation === null ? null : saturation * constraints.kilogramsOfGasPerPascal;
    if (vaporCapacity !== null && (!Number.isFinite(vaporCapacity) || vaporCapacity < 0)) {
      throw new RangeError('32.F.2a vapor capacity overflow.');
    }

    const endpoints: MoonWaterPhaseEndpoint32F2a[] = [];
    const make = (
      scenario: MoonWaterPhaseEndpoint32F2a['scenario'],
      ice: number, liquid: number, vapor: number, interior: number,
      pressure: number | null,
    ): void => {
      const parts = [ice, liquid, vapor, interior];
      const total = parts.reduce((sum, component) => sum + component, 0);
      if (parts.some(value => !Number.isFinite(value) || value < 0) ||
        Math.abs(total - water) / Math.max(1, water) > 1e-12) {
        throw new RangeError('32.F.2a endmember cannot violate conservation or nonnegative mass.');
      }
      endpoints.push(Object.freeze({
        scenario, surfaceIceMassKilograms: ice, surfaceLiquidMassKilograms: liquid,
        surfaceVaporMassKilograms: vapor, interiorPhaseUnresolvedMassKilograms: interior,
        totalMassKilograms: total, assumedConfiningPressurePascal: pressure,
      }));
    };

    // Extreme lower surface exposure: all the formation H2O remains somewhere
    // in the interior. No ice or ocean is asserted by this bound.
    make('ALL_H2O_SEQUESTERED_INTERIOR_PHASE_UNRESOLVED', 0, 0, 0, water, null);

    if (vaporCapacity !== null) {
      const vapor = Math.min(water, vaporCapacity);
      // Close the budget by subtraction only from the largest inventory;
      // subtraction cannot be negative because vapor <= water.
      const condensed = water - vapor;
      if (surfaceTemperatureKelvin <= WATER_TRIPLE_POINT_K) {
        make('ALL_H2O_EXPOSED_COLD_EQUILIBRIUM', condensed, 0, vapor, 0, null);
      } else if (surfaceTemperatureKelvin < WATER_CRITICAL_K) {
        // Counterfactual pressure is an explicit hypothesis, never fed back as
        // real pressure to MoonEnvironment or 31.12.
        make('ALL_H2O_EXPOSED_WARM_CONFINED_EQUILIBRIUM', 0, condensed, vapor, 0,
          saturation! * 1.01);
      }
    }
    return Object.freeze({
      contractVersion: '32.F.2a-conditional-water-endmembers-v1',
      provenance: 'FORMATION_H2O_ENDMEMBER_CONDITIONAL_NOT_OBSERVED',
      hostPlanetOrdinal: physical.hostPlanetOrdinal,
      moonOrdinal: physical.moonOrdinal,
      sourceFormationWaterKilograms: water,
      sourceFormationMassKilograms: inventory.totalMassKilograms,
      sourceSurfaceTemperatureKelvin: surfaceTemperatureKelvin,
      waterSaturationPressurePascal: saturation,
      saturatedVaporCapacityKilograms: vaporCapacity,
      surfaceLiquidRequiresPressureAtLeastPascal: surfaceTemperatureKelvin > WATER_TRIPLE_POINT_K &&
        surfaceTemperatureKelvin < WATER_CRITICAL_K ? saturation : null,
      possibleEndmembers: Object.freeze(endpoints),
      actualSurfaceIceMassKilograms: null,
      actualSurfaceLiquidMassKilograms: null,
      actualSurfaceVaporMassKilograms: null,
      actualInteriorLiquidMassKilograms: null,
      actualInteriorIceMassKilograms: null,
      actualWaterDistributionStatus: 'UNRESOLVED_EXPOSURE_PRESSURE_INTERIOR_GEOMETRY_AND_HISTORY',
      modelLimits: MISSING,
    });
  }
}
