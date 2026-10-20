import type {
  HabitabilityBodyKind,
  HabitabilityMultiplicity,
  HabitabilityTimeContextCt0,
} from '../habitability/habitability-scenario';

/**
 * GENESIS 32.1 — Internal historical chronology, not observed knowledge.
 *
 * CT-0 provides the *present* age. Episode dates are integer model-years
 * elapsed since formation of the SAME system, never look-back years, UTC dates,
 * times relative to a collision window, or independent host-star ages.
 * Sources in 32.2–32.10 must explicitly transform their own time coordinates
 * before producing an episode. No transformation is guessed here.
 */
export interface PlanetaryHistoryInput32_1 {
  readonly bodyKind: HabitabilityBodyKind;
  readonly bodyKey: string;
  readonly multiplicity: HabitabilityMultiplicity;
  readonly time: HabitabilityTimeContextCt0;
  /** Only source-backed episodes supplied for this body. Not an entire history. */
  readonly episodes: readonly PlanetaryHistorySourceEpisode32_1[];
}

export type PlanetaryHistoryEpisodeKind32_1 =
  | 'FORMATION'
  | 'ACCRETION'
  | 'INTERIOR_COOLING'
  | 'DIFFERENTIATION'
  | 'ATMOSPHERE_TRANSITION'
  | 'WATER_RESERVOIR_TRANSITION'
  | 'GLACIATION_TRANSITION'
  | 'VOLCANIC_EPISODE'
  | 'CLIMATE_GEOCHEMISTRY_TRANSITION'
  | 'STELLAR_ENVIRONMENT_CHANGE'
  | 'REALIZED_IMPACT'
  | 'RESOLVED_TRANSIENT_EFFECT';

export type PlanetaryHistoryEvidenceKind32_1 =
  | 'RESOLVED_PHYSICAL_EVENT'
  | 'INFERRED_PHYSICAL_EPISODE';

export interface PlanetaryHistorySource32_1 {
  readonly sourcePhase: string;
  readonly sourceModel: string;
  /** ID of the actual source record, not a random seed or a risk score. */
  readonly sourceRecordKey: string;
  readonly evidenceKind: PlanetaryHistoryEvidenceKind32_1;
}

export interface PlanetaryHistoryTime32_1 {
  readonly timeScale: 'YEARS_SINCE_SYSTEM_FORMATION';
  /** Finite safe integers. Equal endpoints mean an instantaneous episode. */
  readonly startYear: number;
  readonly endYear: number;
  readonly resolution: 'MODELLED_INSTANT' | 'MODELLED_INTERVAL' | 'INFERRED_INTERVAL';
}

export interface PlanetaryHistorySourceEpisode32_1 {
  /** Unique among the supplied episodes for this body; stable between runs. */
  readonly episodeKey: string;
  readonly targetBodyKind: HabitabilityBodyKind;
  readonly targetBodyKey: string;
  readonly kind: PlanetaryHistoryEpisodeKind32_1;
  readonly time: PlanetaryHistoryTime32_1;
  readonly source: PlanetaryHistorySource32_1;
  /** Causal links to episodeKey in this input. They must be physically ordered. */
  readonly causedByEpisodeKeys: readonly string[];
}

export interface PlanetaryHistoryEpisode32_1 {
  readonly episodeId: string;
  readonly episodeKey: string;
  readonly targetBodyKind: HabitabilityBodyKind;
  readonly targetBodyKey: string;
  readonly kind: PlanetaryHistoryEpisodeKind32_1;
  readonly time: PlanetaryHistoryTime32_1;
  readonly source: PlanetaryHistorySource32_1;
  readonly causedByEpisodeIds: readonly string[];
}

export interface PlanetaryHistoryChronology32_1 {
  readonly contractVersion: '32.1-CT0';
  readonly layer: 'SIMULATED_REALITY';
  readonly bodyKind: HabitabilityBodyKind;
  readonly bodyKey: string;
  readonly multiplicity: HabitabilityMultiplicity;
  readonly time: HabitabilityTimeContextCt0;
  /** Null when CT-0 has not resolved system age. */
  readonly presentYearAfterFormation: number | null;
  readonly timeScale: 'YEARS_SINCE_SYSTEM_FORMATION';
  /** Sorted chronologically, then by dependencies, then stable source identity. */
  readonly episodes: readonly PlanetaryHistoryEpisode32_1[];
  /** An empty list NEVER means the body had no historical events. */
  readonly coverage: 'SUPPLIED_EPISODES_ONLY';
  readonly historicalCompleteness: 'NOT_ESTABLISHED';
  readonly lifePresence: 'NOT_EVALUATED';
}
