import type {
  HabitabilityBodyKind, HabitabilityEvidence, HabitabilityMultiplicity,
  HabitabilityPerspective, HabitabilityRoute, HabitabilityScenarioStatus,
  HabitabilitySupportResolution, HabitabilityConstraint,
} from './habitability-scenario';
import type {
  PlanetaryHistoryInput32_1,
} from '../planetary-history/planetary-history-32-1';
import type {
  PlanetaryHistoryIntervalResult32_12,
} from '../planetary-history/planetary-history-interval-32-12';

/**
 * GENESIS 31.7 — A dated environmental trajectory is NOT a dated event, a
 * present-day CT-0 snapshot, or a value extrapolated from a risk/mean index.
 * An explicit physical source must justify ALL years of every state segment.
 * CT-0 dates are inclusive, safe integer years since formation of the system.
 */
export interface HistoricalEnvironmentalState31_7 {
  readonly bodyKind: HabitabilityBodyKind;
  readonly bodyKey: string;
  readonly startYear: number;
  readonly endYear: number;
  readonly temporalBasis: 'DATED_PHYSICAL_TRAJECTORY' | 'DATED_INFERRED_ENVELOPE';
  /** Stable scientific provenance for temporal coverage (not the current state). */
  readonly sourcePhase: string;
  readonly sourceModel: string;
  readonly sourceRecordKey: string;
  /** Publication belongs to the discovery layer, not to the physical source. */
  readonly accessibleToObserver: boolean;
  /** Criteria backed throughout the stated interval, not an instantaneous sample. */
  readonly evidence: readonly HabitabilityEvidence[];
}

export type HistoricalHabContext31_7 = Omit<PlanetaryHistoryInput32_1, 'episodes'>;

/**
 * An indexed, bounded environmental source supplied by future physically
 * grounded trajectory producers. None of 32.2–32.10 automatically certifies
 * continuous environmental conditions from its isolated episodes.
 */
export interface HistoricalEnvironmentSource31_7 {
  revision(context: HistoricalHabContext31_7): string;
  readInterval(
    context: HistoricalHabContext31_7,
    startYear: number, endYear: number, maxRecords: number,
  ): readonly HistoricalEnvironmentalState31_7[];
}

export interface HabitabilityHistoricalRequest31_7 {
  readonly history: PlanetaryHistoryIntervalResult32_12;
  /** Independent version for the dated environmental source. */
  readonly environmentSourceRevision: string;
  readonly perspective: HabitabilityPerspective;
  /** Required in OBSERVED_KNOWLEDGE, never inferred from physical evidence. */
  readonly observationAccess?: {
    readonly discoveryState: 'DETECTED' | 'DISCOVERED' | 'VISITED' | 'CATALOGUED' | 'CONFIRMED';
    readonly scientificFicheAccessible: boolean;
  };
}

export interface HistoricalHabRouteSegment31_7 {
  readonly startYear: number;
  readonly endYear: number;
  readonly status: HabitabilityScenarioStatus;
  readonly resolution: HabitabilitySupportResolution;
  /** Null for uncovered/hidden portions of the requested interval. */
  readonly temporalBasis: HistoricalEnvironmentalState31_7['temporalBasis'] | null;
  readonly sourcePhase: string | null;
  readonly sourceModel: string | null;
  readonly sourceRecordKey: string | null;
  readonly missingConstraints: readonly HabitabilityConstraint[];
  readonly decisiveContradictions: readonly HabitabilityConstraint[];
}

/** Compatible slices coalesced ONLY across directly adjacent dated evidence. */
export interface HistoricalHabitableWindow31_7 {
  readonly startYear: number;
  readonly endYear: number;
  readonly resolution: HabitabilitySupportResolution;
  readonly temporalBasis: HistoricalEnvironmentalState31_7['temporalBasis'];
  readonly sourceRecordKeys: readonly string[];
  readonly interpretation: 'CONSTRAINT_COMPATIBILITY_NOT_LIFE_OR_CONTINUITY_PROOF';
}

export interface HistoricalHabRoute31_7 {
  readonly route: HabitabilityRoute;
  readonly segments: readonly HistoricalHabRouteSegment31_7[];
  readonly compatibleWindows: readonly HistoricalHabitableWindow31_7[];
  /** A gap means unknown coverage; it never means an uninhabited epoch. */
  readonly uncoveredIntervals: readonly { readonly startYear: number; readonly endYear: number }[];
}

export interface HistoricalHabitabilityReport31_7 {
  readonly contractVersion: '31.7-CT0-v1';
  readonly interpretation: 'HISTORICAL_ENVIRONMENTAL_COMPATIBILITY_NOT_LIFE_PROBABILITY';
  readonly perspective: HabitabilityPerspective;
  readonly access: 'INTERNAL' | 'SCIENTIFIC_FICHE_AVAILABLE' | 'SCIENTIFIC_FICHE_LOCKED';
  readonly bodyKind: HabitabilityBodyKind | null;
  readonly bodyKey: string | null;
  readonly multiplicity: HabitabilityMultiplicity | null;
  readonly startYear: number | null;
  readonly endYear: number | null;
  readonly routes: readonly HistoricalHabRoute31_7[];
  readonly historicalCompleteness: 'NOT_ESTABLISHED';
  readonly lifePresence: 'NOT_EVALUATED';
}
