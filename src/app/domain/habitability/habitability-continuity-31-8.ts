import type {
  HabitabilityBodyKind, HabitabilityMultiplicity, HabitabilityPerspective,
  HabitabilityRoute, HabitabilitySupportResolution,
} from './habitability-scenario';
import type {
  HistoricalEnvironmentalState31_7, HistoricalHabitabilityReport31_7,
} from './habitability-historical-windows-31-7';

/**
 * GENESIS 31.8 — Duration is a COUNT of inclusive, integer CT-0 year slots.
 * It is not elapsed time between timestamps, biological continuity, the
 * probability of abiogenesis or proof that the environment remained unchanged.
 * Only intervals already certified by 31.7 are eligible.
 */
export interface HabitabilityContinuousRequest31_8 {
  readonly historicalWindows: HistoricalHabitabilityReport31_7;
}

export interface DocumentedCompatibleRun31_8 {
  readonly startYear: number;
  readonly endYear: number;
  /** endYear - startYear + 1, because 31.7 declares inclusive CT-0 year slots. */
  readonly compatibleYearSlots: number;
  /** Distinct 31.7 provenance grades, not a new physical inference. */
  readonly temporalBases: readonly HistoricalEnvironmentalState31_7['temporalBasis'][];
  readonly supportResolutions: readonly Exclude<HabitabilitySupportResolution, 'NOT_DETERMINED'>[];
  readonly interpretation: 'DOCUMENTED_UNINTERRUPTED_COMPATIBILITY_NOT_BIOLOGICAL_CONTINUITY';
}

export interface HabitabilityRouteDuration31_8 {
  readonly route: HabitabilityRoute;
  readonly queriedYearSlots: number;
  /** Only years with a continuous, dated 31.7-compatible environmental verdict. */
  readonly accumulatedCompatibleYearSlots: number;
  /** The longest single compatible run; distinct from accumulated duration. */
  readonly longestContinuousCompatibleYearSlots: number;
  readonly longestContinuousRun: DocumentedCompatibleRun31_8 | null;
  /** Number of compatible year slots ending exactly at the queried endYear. */
  readonly continuousCompatibleYearSlotsAtQueryEnd: number;
  /** A requested interval end is not automatically the present day. */
  readonly queryEndIsPresentDay: 'NOT_ESTABLISHED';
  readonly compatibleRuns: readonly DocumentedCompatibleRun31_8[];
  readonly incompatibleYearSlots: number;
  readonly insufficientEvidenceYearSlots: number;
  readonly modelNotImplementedYearSlots: number;
  /** Hidden records also count as uncovered in OBSERVED_KNOWLEDGE. */
  readonly uncoveredYearSlots: number;
  readonly datedEvidenceYearSlots: number;
  readonly coversEntireQueriedIntervalWithCompatibility: boolean;
  readonly interpretation: 'COMPATIBLE_ENVIRONMENTAL_YEAR_SLOTS_NOT_LIFE_PROBABILITY';
}

export interface HabitabilityContinuityReport31_8 {
  readonly contractVersion: '31.8-CT0-v1';
  readonly interpretation: 'DOCUMENTED_COMPATIBILITY_DURATIONS_NOT_LIFE_OR_EVOLUTION';
  readonly durationUnit: 'INCLUSIVE_CT0_YEAR_SLOTS';
  readonly perspective: HabitabilityPerspective;
  readonly access: HistoricalHabitabilityReport31_7['access'];
  readonly bodyKind: HabitabilityBodyKind | null;
  readonly bodyKey: string | null;
  readonly multiplicity: HabitabilityMultiplicity | null;
  readonly startYear: number | null;
  readonly endYear: number | null;
  readonly routes: readonly HabitabilityRouteDuration31_8[];
  /** The completeness of ALL historical reality cannot be inferred from a query. */
  readonly historicalCompleteness: 'NOT_ESTABLISHED';
  readonly lifePresence: 'NOT_EVALUATED';
}
