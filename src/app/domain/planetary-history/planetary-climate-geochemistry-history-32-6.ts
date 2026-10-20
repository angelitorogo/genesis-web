import type { Atmosphere } from '../planetary/atmosphere';
import type { AtmosphereGas } from '../planetary/atmosphere-gas';
import type { HabitabilityTimeContextCt0 } from '../habitability/habitability-scenario';
import type { PlanetaryCatastropheHistoryResult32_5 } from './planetary-catastrophe-history-32-5';
import type { PlanetaryHistoryChronology32_1, PlanetaryHistorySourceEpisode32_1 } from './planetary-history-32-1';

/** GENESIS 32.6. Frozen 20.3–20.8 current states: NO paleoclimate history is inferred. */
export interface PlanetaryClimateGeochemistryHistoryInput32_6 {
  readonly atmosphere: Pick<Atmosphere,
    'hostPlanet' | 'climateState' | 'climateVariabilityState' | 'greenhouseEffect' |
    'retentionState' | 'waterInventory' | 'geologyState'>;
  readonly time: HabitabilityTimeContextCt0;
  readonly precedingCatastrophe?: Pick<PlanetaryCatastropheHistoryResult32_5,
    'bodyKey' | 'chronology' | 'sourceEpisodes' | 'volcanism' |
    'realizedImpactEffects' | 'impactCoverage'>;
}

/** Quantities are present-day model outputs; none is a delta since formation. */
export interface PlanetaryClimateGeochemistrySnapshot32_6 {
  readonly sourceModels: readonly ['ATMOSPHERE_20_3_20_4', 'CLIMATE_20_5_20_6', 'WATER_20_7', 'GEOLOGY_20_8'];
  readonly interpretation: 'CURRENT_PHYSICAL_STATE_NOT_HISTORICAL_TREND';
  readonly meanInsolationEarth: number;
  readonly equilibriumTemperatureKelvin: number;
  readonly meanSurfaceTemperatureKelvin: number | null;
  readonly minimumSurfaceTemperatureKelvin: number | null;
  readonly maximumSurfaceTemperatureKelvin: number | null;
  readonly seasonalTemperatureAmplitudeKelvin: number | null;
  readonly dayNightTemperatureRangeKelvin: number | null;
  readonly currentClimateStabilityIndex01: number | null;
  readonly greenhouseTrappingFraction01: number;
  readonly currentEffectiveSurfacePressurePascal: number | null;
  readonly gasPhaseSource: 'CONDENSATION_EQUILIBRIUM_20_4' | 'WATER_VAPOR_EQUILIBRIUM_20_4' | 'RETAINED_GASES_20_3';
  readonly gasPhaseMoleFractions: readonly { readonly gas: AtmosphereGas; readonly fraction01: number }[];
  readonly waterInventoryIndex01: number;
  readonly surfaceWaterCoverageFraction01: number | null;
  readonly surfaceIceCoverageFraction01: number | null;
  /** Present-day geochemical activity proxies, NOT fluxes in kilograms/year. */
  readonly volcanismPotential01: number | null;
  readonly volatileOutgassingPotential01: number | null;
  readonly tectonicMobilityIndex01: number | null;
}

export type PlanetaryClimateGeochemistryDriverKind32_6 =
  | 'ILLUMINATION_OR_ORBITAL_FORCING'
  | 'GREENHOUSE_AND_GAS_CHEMISTRY'
  | 'WATER_PHASE_FEEDBACK'
  | 'GEOLOGICAL_OUTGASSING_AND_CYCLING'
  | 'REALIZED_IMPACT_POSSIBLE_CLIMATE_EFFECT';

export interface PlanetaryClimateGeochemistryDriver32_6 {
  readonly driverKey: string;
  readonly kind: PlanetaryClimateGeochemistryDriverKind32_6;
  /** True only for an actually realized impact from 23.13; not for a risk score. */
  readonly status: 'CURRENT_CONDITION_ONLY' | 'RESOLVED_IMPACT_UNQUANTIFIED_EFFECT';
  readonly sourceModel: string;
  readonly sourceRecordKey: string | null;
  readonly causeEvidence: 'PRESENT_MODEL_PROXY' | 'RESOLVED_PHYSICAL_EVENT';
  readonly climateResponse: 'NOT_QUANTIFIED';
  readonly geochemicalResponse: 'NOT_QUANTIFIED';
  readonly direction: 'NOT_RESOLVED';
  readonly startYear: null;
  readonly endYear: null;
  readonly durationYears: null;
  readonly temperatureDeltaKelvin: null;
  readonly gasMassDeltaKilograms: null;
  readonly radiativeForcingWattsPerSquareMeter: null;
  readonly uncertainty: 'NO_HISTORICAL_STATES' | 'IMPACT_CONSEQUENCES_NOT_CLIMATICALLY_RESOLVED';
}

export interface PlanetaryClimateGeochemistryHistoryResult32_6 {
  readonly contractVersion: '32.6-CT0';
  readonly layer: 'SIMULATED_REALITY';
  readonly bodyKey: string;
  readonly snapshot: PlanetaryClimateGeochemistrySnapshot32_6;
  readonly drivers: readonly PlanetaryClimateGeochemistryDriver32_6[];
  /** No dated climate/geochemistry episodes without physically resolved before/after states. */
  readonly resolvedClimateGeochemistryChanges: readonly [];
  readonly sourceEpisodes: readonly PlanetaryHistorySourceEpisode32_1[];
  readonly chronology: PlanetaryHistoryChronology32_1;
  readonly historicalCompleteness: 'NOT_ESTABLISHED';
  readonly lifePresence: 'NOT_EVALUATED';
}
