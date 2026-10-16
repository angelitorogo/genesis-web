import type {
  HabitabilityBodyKind, HabitabilityConstraint, HabitabilityEvidenceBasis,
  HabitabilityEvidenceVerdict, HabitabilityMultiplicity, HabitabilityPerspective,
  HabitabilityRoute, HabitabilityScenarioStatus, HabitabilitySupportResolution,
  HabitabilityTimeContextCt0,
} from './habitability-scenario';

/** 31.6: descriptive fractions of REQUIRED constraints, NEVER probability of life. */
export interface HabitabilityCriterionTally31_6 {
  readonly required: number;
  readonly supporting: number;
  readonly contradicting: number;
  readonly unresolved: number;
}

export type HabitabilityFactorGroup31_6 =
  | 'THERMAL_RESERVOIR_AND_CONFINEMENT'
  | 'CHEMISTRY_AND_ENERGY'
  | 'RADIATION_AND_SHIELDING'
  | 'DYNAMICAL_STABILITY'
  | 'GRAVITY_AND_RETENTION';

export interface HabitabilityFactorBreakdown31_6 {
  readonly group: HabitabilityFactorGroup31_6;
  readonly tally: HabitabilityCriterionTally31_6;
  /** Only constraints that the route actually requires. */
  readonly criteria: readonly HabitabilityConstraint[];
}

export interface HabitabilityEvidenceBasisTally31_6 {
  readonly directObservations: number;
  readonly physicalModels: number;
  readonly inferredModels: number;
  readonly unresolved: number;
}

export interface HabitabilityCriterionTrace31_6 {
  readonly constraint: HabitabilityConstraint;
  readonly verdict: HabitabilityEvidenceVerdict;
  readonly basis: HabitabilityEvidenceBasis;
  /** Already filtered by HabitabilityEngine for OBSERVED_KNOWLEDGE. */
  readonly sourceKey: string | null;
}

/** Epistemic type, not a numerical confidence level. */
export type HabitabilityDecisiveBasis31_6 =
  | 'NOT_DETERMINED' | 'INFERRED_MODEL' | 'PHYSICAL_MODEL' | 'DIRECT_OBSERVATION';
export type HabitabilityCoverage31_6 = 'NONE' | 'PARTIAL' | 'COMPLETE' | 'NOT_APPLICABLE';

export interface HabitabilityRouteIndex31_6 {
  readonly route: HabitabilityRoute;
  readonly status: HabitabilityScenarioStatus;
  readonly resolution: HabitabilitySupportResolution;
  readonly tally: HabitabilityCriterionTally31_6;
  readonly factorBreakdown: readonly HabitabilityFactorBreakdown31_6[];
  readonly evidenceBases: HabitabilityEvidenceBasisTally31_6;
  readonly coverage: HabitabilityCoverage31_6;
  /** Fraction of required criteria with an evaluable SUPPORTS/CONTRADICTS verdict. */
  readonly evidenceCoverageIndex01: number | null;
  /** Fraction of ALL required criteria that support; null if none evaluable. */
  readonly supportingCriteriaIndex01: number | null;
  /** Fraction of ALL required criteria that contradict; null if none evaluable. */
  readonly contradictingCriteriaIndex01: number | null;
  /** Inferred evidence is never treated as a directly observed measurement. */
  readonly decisiveBasis: HabitabilityDecisiveBasis31_6;
  /** Includes only accessible sources in the requested perspective. */
  readonly criteria: readonly HabitabilityCriterionTrace31_6[];
  readonly missingConstraints: readonly HabitabilityConstraint[];
  readonly decisiveContradictions: readonly HabitabilityConstraint[];
}

export interface HabitabilityIndexReport31_6 {
  readonly contractVersion: '31.6-CT0';
  readonly interpretation: 'DESCRIPTIVE_CONSTRAINT_COVERAGE_NOT_LIFE_PROBABILITY';
  readonly bodyKind: HabitabilityBodyKind;
  readonly bodyKey: string;
  readonly multiplicity: HabitabilityMultiplicity;
  readonly perspective: HabitabilityPerspective;
  readonly time: HabitabilityTimeContextCt0;
  readonly routes: readonly HabitabilityRouteIndex31_6[];
}
