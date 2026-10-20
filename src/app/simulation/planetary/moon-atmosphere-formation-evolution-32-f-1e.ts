import type { MoonFormationInventory32F1d } from '../../domain/planetary/moon-formation-inventory-32-f-1d';
import type { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import type { MoonAtmosphereFormationEvolution32F1e } from '../../domain/planetary/moon-atmosphere-formation-evolution-32-f-1e';
import { MoonAtmosphereAutomaticV2Source32F1c } from './moon-atmosphere-automatic-v2-32-f-1c';

const SECONDS_PER_DAY = 86_400;

const MISSING = Object.freeze([
  'EXPOSED_H2O_FRACTION_AND_INITIAL_GAS_MASS',
  'STELLAR_EUV_AND_PHOTOLYSIS',
  'CHARGED_PARTICLE_EROSION',
  'OUTGASSING_AND_REPLENISHMENT',
  'OTHER_VOLATILE_SPECIATION',
  'DATED_ATMOSPHERIC_EVOLUTION',
] as const);

/**
 * 32.F.1e.b. A conditional *initial* water-vapor column from the formation
 * inventory and H2O saturation. Neither a present atmosphere nor a gas loss
 * prediction can be inferred from these bulk V2 inputs.
 *
 * Jeans escape needs exobase temperature, density and radius, and a valid
 * kinetic/Knudsen regime. The surface is NOT a proxy for this boundary. No
 * future pressure is published while escape, replenishment and photolysis
 * remain unknown. The standalone 32.F.1 engine retains its independent
 * quantitative mass/flux path; this adapter never fabricates such forcing.
 */
export class MoonAtmosphereFormationEvolutionEngine32F1e {
  private constructor() {}

  static fromMaterialized(
    physical: MoonPhysicalProperties,
    inventory: MoonFormationInventory32F1d,
    temperatureKelvin: number,
    orbitalPeriodDays: number,
  ): MoonAtmosphereFormationEvolution32F1e {
    const mass = physical.massEarth * 5.9722e24;
    if (inventory.hostPlanetOrdinal !== physical.hostPlanetOrdinal ||
        inventory.moonOrdinal !== physical.moonOrdinal ||
        inventory.provenance !== 'DETERMINISTIC_CONDITIONAL_FORMATION_MODEL_NOT_OBSERVATION' ||
        !Number.isFinite(mass) || mass <= 0 ||
        Math.abs(inventory.totalMassKilograms - mass) / mass > 1e-12 ||
        !Number.isFinite(inventory.waterIceMassKilograms) || inventory.waterIceMassKilograms < 0 ||
        !Number.isFinite(inventory.otherCondensableMassKilograms) || inventory.otherCondensableMassKilograms < 0 ||
        inventory.waterIceMassKilograms + inventory.otherCondensableMassKilograms > mass * (1 + 1e-12) ||
        !Number.isFinite(temperatureKelvin) || temperatureKelvin <= 0 ||
        !Number.isFinite(orbitalPeriodDays) || orbitalPeriodDays <= 0 ||
        !Number.isFinite(physical.radiusEarth) || physical.radiusEarth <= 0 ||
        !Number.isFinite(physical.surfaceGravityEarth) || physical.surfaceGravityEarth <= 0) {
      throw new RangeError('32.F.1e requires aligned V2 moon, conditional inventory and valid thermal/orbital inputs.');
    }
    const intervalSeconds = orbitalPeriodDays * SECONDS_PER_DAY;
    if (!Number.isFinite(intervalSeconds) || intervalSeconds <= 0) {
      throw new RangeError('32.F.1e invalid conditional orbit interval.');
    }
    const constraints = MoonAtmosphereAutomaticV2Source32F1c.fromMaterialized(physical, temperatureKelvin);
    const saturation = constraints.waterVaporSaturationPascalIfEquilibrated;
    const gasCapacity = saturation === null ? null : saturation * constraints.kilogramsOfGasPerPascal;
    const initialMass = gasCapacity === null ? null : Math.min(inventory.waterIceMassKilograms, gasCapacity);
    // We can bound a *hypothetical initial* H2O column, but not a loss rate.
    // In particular, initialMass===0 does NOT imply a vacuum: non-H2O gases
    // and other reservoirs are outside this scenario.
    // Never give the endmember the same meaning as independently quantified
    // physicalBalance32F1. No derived value establishes actual pressure.
    return Object.freeze({
      contractVersion: '32.F.1e-water-vapor-endmember-v2',
      provenance: 'CONDITIONAL_FORMATION_ENDMEMBER_NOT_OBSERVATION',
      hostPlanetOrdinal: physical.hostPlanetOrdinal,
      moonOrdinal: physical.moonOrdinal,
      initialGasMassStatus: 'UNRESOLVED',
      realAtmosphericPressureStatus: 'UNKNOWN',
      realAtmosphericRegimeStatus: 'UNKNOWN',
      sourceWaterIceMassKilograms: inventory.waterIceMassKilograms,
      unidentifiedCondensablesKilograms: inventory.otherCondensableMassKilograms,
      intervalSeconds,
      conditionalInitialWaterVaporMassKilograms: initialMass,
      conditionalInitialWaterVaporPressurePascal: initialMass === null ? null :
        initialMass / constraints.kilogramsOfGasPerPascal,
      conditionalThermalJeansEscapeKilogramsPerSecond: null,
      conditionalFinalWaterVaporPressurePascal: null,
      conditionalBalance: null,
      missingIndependentSources: MISSING,
      assumption: 'SATURATED_H2O_INITIAL_COLUMN_ONLY_NO_EXOBASE_OR_REPLENISHMENT',
    });
  }
}
