import type { HabitabilityRoute, HabitabilityBodyKind, HabitabilityMultiplicity, HabitabilityPerspective } from '../habitability/habitability-scenario';

/** PRE-33.09 uses inclusive integer years since system formation; no browser clock.
 * Compatibility is environmental, NOT life, abiogenesis, survival or safety. */
export type EnvironmentalContinuityVerdictPRE3309 =
  'COMPATIBLE' | 'INCOMPATIBLE' | 'UNKNOWN' | 'MODEL_NOT_IMPLEMENTED';

export interface DatedEventConsequencePRE3309 {
  readonly episodeKey: string;
  /** An unquantified event can only interrupt certification over its dated extent. */
  readonly outcome: 'UNRESOLVED' | 'QUANTIFIED_DISRUPTION' | 'QUANTIFIED_NON_DISRUPTIVE';
  /** Routes that are physically demonstrated incompatible during the episode. */
  readonly affectedRoutes: readonly HabitabilityRoute[];
  /** Required only for a quantified conclusion, never a V1 danger index. */
  readonly physicalResponseSourceKey: string | null;
  readonly physicalCriterion: 'TEMPERATURE' | 'SOLVENT' | 'PRESSURE' |
    'CHEMICAL_ENERGY' | 'IONIZING_DOSE' | 'DYNAMICS' | null;
}

export interface EnvironmentalContinuitySegmentPRE3309 {
  readonly startYear: number;
  readonly endYear: number;
  readonly verdict: EnvironmentalContinuityVerdictPRE3309;
  readonly physicalEnvironmentRecordKey: string | null;
  readonly overlappingEventKeys: readonly string[];
  /** Compatibility after a transient is UNKNOWN until an independent later dated record. */
  readonly reason: string;
}

export interface EnvironmentalContinuityRoutePRE3309 {
  readonly route: HabitabilityRoute;
  readonly segments: readonly EnvironmentalContinuitySegmentPRE3309[];
  readonly compatibleYearSlots: number;
  readonly longestContinuousYearSlots: number;
  readonly compatibleAtQueryEndYearSlots: number;
  readonly incompatibleYearSlots: number;
  readonly unknownYearSlots: number;
  readonly modelNotImplementedYearSlots: number;
  /** Only the queried interval has documented compatibility; whole-life history remains unknown. */
  readonly coversEntireQueriedIntervalWithDocumentedCompatibility: boolean;
}

export interface EnvironmentalContinuityReportPRE3309 {
  readonly contractVersion: 'PRE-33.09/CT0-DATED-CONTINUITY/v1';
  readonly perspective: HabitabilityPerspective;
  readonly access: 'INTERNAL' | 'SCIENTIFIC_FICHE_AVAILABLE' | 'SCIENTIFIC_FICHE_LOCKED';
  readonly bodyKind: HabitabilityBodyKind | null;
  readonly bodyKey: string | null;
  readonly multiplicity: HabitabilityMultiplicity | null;
  readonly startYear: number | null;
  readonly endYear: number | null;
  readonly routes: readonly EnvironmentalContinuityRoutePRE3309[];
  /** This remains unknown even when the requested finite interval is fully resolved. */
  readonly historicalCompleteness: 'NOT_ESTABLISHED';
  readonly lifePresence: 'NOT_EVALUATED';
  readonly biologicalContinuity: 'NOT_EVALUATED';
  readonly eventCatalogCompleteness: 'NOT_ESTABLISHED';
}
