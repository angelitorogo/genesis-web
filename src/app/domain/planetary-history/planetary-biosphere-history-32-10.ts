import type {
  PlanetaryHistoryChronology32_1,
  PlanetaryHistorySourceEpisode32_1,
  PlanetaryHistoryTime32_1,
} from './planetary-history-32-1';
import type { PlanetaryTransientEffectsHistoryResult32_9 } from
  './planetary-transient-effects-history-32-9';

/**
 * GENESIS 32.10 — Deferred connection to a future, explicitly resolved biosphere.
 * This phase neither creates life nor derives extinction from environmental risk.
 */
export interface ResolvedBiospherePresence32_10 {
  readonly targetBodyKind: 'PLANET' | 'MOON';
  readonly targetBodyKey: string;
  readonly realization: 'RESOLVED_EXISTING_BIOSPHERE';
  /** Earliest epoch for which the future biological source resolves this biosphere. */
  readonly establishedYear: number;
  readonly sourcePhase: string;
  readonly sourceModel: string;
  readonly sourceRecordKey: string;
}

/** An actual biotic outcome supplied by a future biology engine, not by 32.10. */
export interface ResolvedBiologicalHistoryEvent32_10 {
  readonly eventId: string;
  readonly targetBodyKind: 'PLANET' | 'MOON';
  readonly targetBodyKey: string;
  readonly kind: 'MASS_EXTINCTION' | 'BIOTIC_RECOVERY';
  readonly realization: 'RESOLVED_BIOLOGICAL_EVENT';
  readonly sourcePhase: string;
  readonly sourceModel: string;
  readonly sourceRecordKey: string;
  readonly time: PlanetaryHistoryTime32_1;
  /** Optional actual same-body environmental/physical cause. Never inferred. */
  readonly causedByPhysicalEpisodeKey: string | null;
  /** Required for recovery; references an actual supplied MASS_EXTINCTION. */
  readonly causedByExtinctionEventId: string | null;
}

export type EnvironmentalRecoveryMetric32_10 =
  | 'MEAN_SURFACE_TEMPERATURE_K'
  | 'GAS_PRESSURE_PA'
  | 'LIQUID_WATER_COVERAGE_01'
  | 'ICE_COVERAGE_01';

/**
 * Three source-backed states of one physical quantity. Improvement toward an
 * earlier value is NOT the same as biological or fully habitable recovery.
 */
export interface ResolvedEnvironmentalRecoveryEvidence32_10 {
  readonly recordId: string;
  readonly targetBodyKind: 'PLANET' | 'MOON';
  readonly targetBodyKey: string;
  readonly realization: 'RESOLVED_PHYSICAL_COMPARISON';
  readonly sourcePhase: string;
  readonly sourceModel: string;
  readonly sourceRecordKey: string;
  /** Must name a genuinely resolved physical episode already in chronology. */
  readonly disturbanceEpisodeKey: string;
  readonly metric: EnvironmentalRecoveryMetric32_10;
  readonly before: Readonly<{year: number; value: number}>;
  readonly disturbed: Readonly<{year: number; value: number}>;
  readonly later: Readonly<{year: number; value: number}>;
}

export interface PlanetaryBiosphereHistoryInput32_10 {
  readonly preceding: PlanetaryTransientEffectsHistoryResult32_9;
  /** Not supplied is different from explicitly absent. Neither proves no life. */
  readonly biosphere?: ResolvedBiospherePresence32_10 | null;
  readonly biologicalEvents?: readonly ResolvedBiologicalHistoryEvent32_10[];
  readonly environmentalRecoveries?: readonly ResolvedEnvironmentalRecoveryEvidence32_10[];
}

export interface BiologicalHistoricalRecord32_10 {
  readonly eventId: string;
  readonly kind: 'MASS_EXTINCTION' | 'BIOTIC_RECOVERY';
  readonly time: PlanetaryHistoryTime32_1;
  readonly sourcePhase: string;
  readonly sourceModel: string;
  readonly sourceRecordKey: string;
  readonly causedByPhysicalEpisodeId: string | null;
  readonly causedByExtinctionEventId: string | null;
  /** Severity, eliminated taxa and number of species are not inferred. */
  readonly lossFraction: null;
  readonly recoveryDurationYears: null;
}

export interface EnvironmentalRecoveryRecord32_10 {
  readonly recordId: string;
  readonly metric: EnvironmentalRecoveryMetric32_10;
  readonly sourceModel: string;
  readonly sourceRecordKey: string;
  readonly disturbanceEpisodeId: string;
  readonly before: Readonly<{year: number; value: number}>;
  readonly disturbed: Readonly<{year: number; value: number}>;
  readonly later: Readonly<{year: number; value: number}>;
  readonly returnedFractionOfDisturbance: number;
  readonly interpretation: 'PHYSICAL_TREND_TOWARD_REFERENCE_ONLY';
  readonly biologicalConsequence: 'NOT_EVALUATED';
}

export interface PlanetaryBiosphereHistoryResult32_10 {
  readonly contractVersion: '32.10-CT0';
  readonly layer: 'SIMULATED_REALITY';
  readonly bodyKind: 'PLANET' | 'MOON';
  readonly bodyKey: string;
  readonly biosphereCoverage: 'NOT_SUPPLIED' | 'NO_RESOLVED_BIOSPHERE' | 'RESOLVED_SOURCE_SUPPLIED';
  readonly biologicalEventCoverage: 'NOT_SUPPLIED' | 'SUPPLIED_RECORDS_ONLY';
  readonly environmentalCoverage: 'NOT_SUPPLIED' | 'SUPPLIED_RECORDS_ONLY';
  readonly biologicalEvents: readonly BiologicalHistoricalRecord32_10[];
  readonly environmentalRecoveries: readonly EnvironmentalRecoveryRecord32_10[];
  /** Physical CT-0 history stays byte-for-byte identical; biology is a separate overlay. */
  readonly sourceEpisodes: readonly PlanetaryHistorySourceEpisode32_1[];
  readonly chronology: PlanetaryHistoryChronology32_1;
  readonly historicalCompleteness: 'NOT_ESTABLISHED';
  /** Biosphere existence is never decided by this resolver. */
  readonly lifePresence: 'NOT_EVALUATED_BY_32_10';
}
