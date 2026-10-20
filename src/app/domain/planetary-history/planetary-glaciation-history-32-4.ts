import type { Atmosphere } from '../planetary/atmosphere';
import type { HabitabilityTimeContextCt0 } from '../habitability/habitability-scenario';
import type {
  PlanetaryHistoryChronology32_1,
  PlanetaryHistorySourceEpisode32_1,
} from './planetary-history-32-1';
import type { PlanetaryVolatilesHistoryResult32_3 } from './planetary-volatiles-history-32-3';

/** The canonical inputs are frozen 20.5/20.6/20.7 physical projections. */
export interface PlanetaryGlaciationHistoryInput32_4 {
  readonly atmosphere: Pick<Atmosphere,
    'hostPlanet' | 'climateState' | 'climateVariabilityState' | 'waterInventory'>;
  readonly time: HabitabilityTimeContextCt0;
  /** Optional previous stage, validated and merged without changing episode dates. */
  readonly precedingVolatiles?: Pick<PlanetaryVolatilesHistoryResult32_3,
    'bodyKey' | 'chronology' | 'sourceEpisodes' | 'water'>;
}

export type PlanetaryGlacialCurrentRegime32_4 =
  | 'DEEP_ENVELOPE_NO_SOLID_SURFACE'
  | 'NO_MODELED_ACCESSIBLE_WATER'
  | 'ICE_DOMINATED_INVENTORY'
  | 'LIQUID_DOMINATED_INVENTORY'
  | 'VAPOR_DOMINATED_INVENTORY'
  | 'MIXED_PHASE_INVENTORY';

export type PlanetaryFreezeThawWindow32_4 =
  | 'REFERENCE_FREEZING_CROSSING_POSSIBLE'
  | 'NO_REFERENCE_CROSSING_IN_ENVELOPE'
  | 'NOT_EVALUABLE';

/** Reports present conditions only, never a historical glaciation event. */
export interface PlanetaryCryosphereSnapshot32_4 {
  readonly sourceModels: readonly ['CLIMATE_20_5', 'CLIMATE_VARIABILITY_20_6', 'WATER_20_7'];
  readonly interpretation: 'CURRENT_MODEL_SNAPSHOT_NOT_HISTORICAL_EPISODES';
  /** Coarse present reference insolation, not a dated stellar luminosity track. */
  readonly currentMeanReferenceInsolationEarth: number;
  readonly currentEquilibriumTemperatureKelvin: number;
  readonly currentMeanSurfaceTemperatureKelvin: number | null;
  readonly currentSurfaceMinimumKelvin: number | null;
  readonly currentSurfaceMaximumKelvin: number | null;
  /** 20.7 phase shares refer to accessible water inventory, NOT surface area. */
  readonly iceInventoryFraction01: number | null;
  readonly liquidInventoryFraction01: number | null;
  readonly vaporInventoryFraction01: number | null;
  /** These are surface area coverages, NOT inventory shares. */
  readonly iceSurfaceCoverageFraction01: number | null;
  readonly liquidSurfaceCoverageFraction01: number | null;
  readonly waterInventoryIndex01: number;
  readonly pressurePascal: number | null;
  readonly currentRegime: PlanetaryGlacialCurrentRegime32_4;
  /** Threshold-crossing potential is neither an ice age nor a thaw event. */
  readonly freezeThawWindow: PlanetaryFreezeThawWindow32_4;
  readonly transitionDirection: 'NOT_RESOLVED';
}

export interface PlanetaryUndatedCryosphereProcess32_4 {
  readonly process: 'GLACIATION_ONSET' | 'DEGLACIATION';
  readonly temporalStatus: 'EPOCH_NOT_RESOLVED';
  readonly evidence: 'CURRENT_STATE_ONLY';
  readonly note: string;
}

export interface PlanetaryGlaciationHistoryResult32_4 {
  readonly contractVersion: '32.4-CT0';
  readonly layer: 'SIMULATED_REALITY';
  readonly bodyKey: string;
  readonly cryosphere: PlanetaryCryosphereSnapshot32_4;
  readonly processes: readonly PlanetaryUndatedCryosphereProcess32_4[];
  /** Inherited source-backed episodes only; snapshot analysis creates none. */
  readonly sourceEpisodes: readonly PlanetaryHistorySourceEpisode32_1[];
  readonly chronology: PlanetaryHistoryChronology32_1;
  readonly historicalCompleteness: 'NOT_ESTABLISHED';
  readonly lifePresence: 'NOT_EVALUATED';
}
