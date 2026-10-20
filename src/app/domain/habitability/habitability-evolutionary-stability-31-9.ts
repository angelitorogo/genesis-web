import type { HabitabilityBodyKind, HabitabilityMultiplicity, HabitabilityPerspective,
  HabitabilityRoute } from './habitability-scenario';
import type { HistoricalHabitabilityReport31_7 } from './habitability-historical-windows-31-7';
import type { HabitabilityContinuityReport31_8 } from './habitability-continuity-31-8';
import type { PlanetaryHistoryIntervalResult32_12 } from '../planetary-history/planetary-history-interval-32-12';
import type { PlanetaryHistoryEpisodeKind32_1 } from '../planetary-history/planetary-history-32-1';

/**
 * 31.9: a source-certified causal response, NOT an inference from temporal
 * coincidence. The source is responsible for physically resolving the response.
 * A dated catastrophe alone cannot assert loss of habitability or extinction.
 */
export interface CertifiedEnvironmentalResponse31_9 {
  readonly eventEpisodeId: string;
  readonly targetBodyKind: HabitabilityBodyKind;
  readonly targetBodyKey: string;
  readonly route: HabitabilityRoute;
  readonly responseYear: number;
  readonly change: 'COMPATIBILITY_INTERRUPTED' | 'COMPATIBILITY_RESTORED';
  readonly sourcePhase: string;
  readonly sourceModel: string;
  readonly sourceRecordKey: string;
  readonly resolution: 'RESOLVED_PHYSICAL_RESPONSE';
  /** True ONLY when the observation/access layer grants this response. */
  readonly accessibleToObserver: boolean;
}

export interface HabitabilityEvolutionaryStabilityRequest31_9 {
  readonly windows: HistoricalHabitabilityReport31_7;
  readonly continuity: HabitabilityContinuityReport31_8;
  /** Versioned, physically supported events for exactly the same CT-0 slice. */
  readonly history: PlanetaryHistoryIntervalResult32_12;
  readonly certifiedResponses?: readonly CertifiedEnvironmentalResponse31_9[];
  /** Authoritative publication allow-list, not all events in CONFIRMED. */
  readonly observedEpisodeIds?: readonly string[];
}

export interface HistoricalPerturbationContext31_9 {
  readonly episodeId: string;
  readonly kind: PlanetaryHistoryEpisodeKind32_1;
  readonly startYear: number;
  readonly endYear: number;
  readonly sourcePhase: string;
  readonly sourceModel: string;
  readonly sourceRecordKey: string;
  readonly temporalRelation: 'INTERSECTS_DOCUMENTED_COMPATIBILITY' |
    'NO_DOCUMENTED_COMPATIBLE_OVERLAP';
  /** Never synonymous with resilience or damage. */
  readonly causality: 'TIMING_ONLY_NO_CAUSAL_INFERENCE';
}

export interface DocumentedEnvironmentalChange31_9 {
  readonly eventEpisodeId: string;
  readonly responseYear: number;
  readonly change: CertifiedEnvironmentalResponse31_9['change'];
  readonly sourcePhase: string;
  readonly sourceModel: string;
  readonly sourceRecordKey: string;
  readonly relation: 'EXPLICIT_PHYSICALLY_RESOLVED_CAUSAL_LINK';
}

export interface EvolutionaryStabilityRoute31_9 {
  readonly route: HabitabilityRoute;
  readonly compatibleYearSlots: number;
  readonly longestContinuousCompatibleYearSlots: number;
  readonly incompatibleYearSlots: number;
  readonly insufficientEvidenceYearSlots: number;
  readonly uncoveredYearSlots: number;
  /** Purely environmental state transitions, not assumed to be catastrophes. */
  readonly documentedCompatibilityInterruptions: number;
  readonly documentedCompatibilityRestorations: number;
  readonly unknownContinuityBreaks: number;
  readonly eventContexts: readonly HistoricalPerturbationContext31_9[];
  readonly certifiedChanges: readonly DocumentedEnvironmentalChange31_9[];
  readonly causalAssessment: 'EXPLICIT_PHYSICAL_RESPONSES_RECORDED' |
    'TEMPORAL_COINCIDENCES_ONLY' | 'NO_CAUSAL_RESPONSE_ESTABLISHED';
  readonly evolutionaryStability: 'NOT_DETERMINED_BEYOND_DOCUMENTED_ENVIRONMENTAL_WINDOWS';
}

export interface HabitabilityEvolutionaryStabilityReport31_9 {
  readonly contractVersion: '31.9-CT0-v1';
  readonly interpretation: 'PHYSICAL_ENVIRONMENTAL_STABILITY_NOT_BIOLOGICAL_EVOLUTION_OR_LIFE';
  readonly perspective: HabitabilityPerspective;
  readonly access: HistoricalHabitabilityReport31_7['access'];
  readonly bodyKind: HabitabilityBodyKind | null;
  readonly bodyKey: string | null;
  readonly multiplicity: HabitabilityMultiplicity | null;
  readonly startYear: number | null;
  readonly endYear: number | null;
  readonly routes: readonly EvolutionaryStabilityRoute31_9[];
  readonly historicalCompleteness: 'NOT_ESTABLISHED';
  readonly lifePresence: 'NOT_EVALUATED';
  readonly extinction: 'NOT_EVALUATED';
}
