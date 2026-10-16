/**
 * GENESIS 31.1 — Contracts for environmental compatibility scenarios.
 *
 * This is NOT an abiogenesis model, a life detector, or a statistical
 * probability of life. The phase-21 lunar indices and radiative HZ labels are
 * not evidence of compatibility unless later, separate physical resolvers
 * justify the individual constraints.
 */
export type HabitabilityBodyKind = 'PLANET' | 'MOON';
export type HabitabilityMultiplicity = 'SINGLE' | 'BINARY' | 'TRIPLE' | 'UNKNOWN';
export type HabitabilityPerspective = 'SIMULATED_REALITY' | 'OBSERVED_KNOWLEDGE';
export type HabitabilityRoute =
  | 'SURFACE_AQUEOUS'
  | 'SUBSURFACE_AQUEOUS'
  | 'ALTERNATIVE_CHEMISTRY';

/** CT-0 — current snapshot only; historic reconstruction belongs to phase 32. */
export interface HabitabilityTimeContextCt0 {
  readonly kind: 'CURRENT_SNAPSHOT';
  /** Age of the local modeled system in Gyr; null if not determined. */
  readonly systemAgeBillionYears: number | null;
}

export type HabitabilityConstraint =
  | 'TEMPERATURE'
  | 'LIQUID_RESERVOIR'
  | 'PRESSURE_OR_CONFINEMENT'
  | 'CHEMICAL_FEASIBILITY'
  | 'ENERGY_GRADIENT'
  | 'RADIATION_EXPOSURE'
  | 'DYNAMICAL_STABILITY'
  | 'GRAVITY_AND_RETENTION'
  | 'RESERVOIR_GEOMETRY';

/** Values supplied by dedicated scientific resolvers in future subphases. */
export type HabitabilityEvidenceVerdict = 'SUPPORTS' | 'CONTRADICTS' | 'UNRESOLVED';
export type HabitabilityEvidenceBasis =
  | 'PHYSICAL_MODEL'
  | 'INFERRED_MODEL'
  | 'DIRECT_OBSERVATION'
  | 'UNRESOLVED';

export interface HabitabilityEvidence {
  readonly route: HabitabilityRoute;
  readonly constraint: HabitabilityConstraint;
  readonly verdict: HabitabilityEvidenceVerdict;
  readonly basis: HabitabilityEvidenceBasis;
  /**
   * Granted by the observational/discovery layer, not inferred from the
   * simulated ground truth. Hidden evidence must never leak into an observed
   * knowledge projection.
   */
  readonly accessibleToObserver: boolean;
  /** Stable field provenance, never a random draw or a new seed. */
  readonly sourceKey: string;
}

export interface HabitabilityScenarioInput {
  readonly bodyKind: HabitabilityBodyKind;
  readonly bodyKey: string;
  readonly multiplicity: HabitabilityMultiplicity;
  readonly perspective: HabitabilityPerspective;
  readonly time: HabitabilityTimeContextCt0;
  readonly evidence: readonly HabitabilityEvidence[];
}

export type HabitabilityScenarioStatus =
  | 'CONSTRAINTS_COMPATIBLE'
  | 'CONSTRAINTS_INCOMPATIBLE'
  | 'INSUFFICIENT_EVIDENCE'
  | 'MODEL_NOT_IMPLEMENTED';

export type HabitabilitySupportResolution =
  | 'RESOLVED_EVIDENCE'
  | 'INFERRED_EVIDENCE'
  | 'NOT_DETERMINED';

export interface HabitabilityConstraintResult {
  readonly constraint: HabitabilityConstraint;
  readonly verdict: HabitabilityEvidenceVerdict;
  readonly basis: HabitabilityEvidenceBasis;
  readonly sourceKey: string | null;
}

export interface HabitabilityRouteScenario {
  readonly route: HabitabilityRoute;
  readonly status: HabitabilityScenarioStatus;
  readonly resolution: HabitabilitySupportResolution;
  readonly constraints: readonly HabitabilityConstraintResult[];
  readonly missingConstraints: readonly HabitabilityConstraint[];
  /** Deliberately no score, percentage, probability, organism or biosignature. */
}

export interface HabitabilityScenarioAssessment {
  readonly bodyKind: HabitabilityBodyKind;
  readonly bodyKey: string;
  readonly multiplicity: HabitabilityMultiplicity;
  readonly perspective: HabitabilityPerspective;
  readonly time: HabitabilityTimeContextCt0;
  readonly routes: readonly HabitabilityRouteScenario[];
  readonly contractVersion: '31.1-CT0';
}

/** Required constraints, not terrestrial preference weights. */
export const HABITABILITY_REQUIREMENTS_31_1 = Object.freeze({
  SURFACE_AQUEOUS: Object.freeze([
    'TEMPERATURE',
    'LIQUID_RESERVOIR',
    'PRESSURE_OR_CONFINEMENT',
    'CHEMICAL_FEASIBILITY',
    'ENERGY_GRADIENT',
    'RADIATION_EXPOSURE',
    'DYNAMICAL_STABILITY',
    'GRAVITY_AND_RETENTION',
  ] as const),
  SUBSURFACE_AQUEOUS: Object.freeze([
    'TEMPERATURE',
    'LIQUID_RESERVOIR',
    'PRESSURE_OR_CONFINEMENT',
    'CHEMICAL_FEASIBILITY',
    'ENERGY_GRADIENT',
    'RADIATION_EXPOSURE',
    'DYNAMICAL_STABILITY',
    'RESERVOIR_GEOMETRY',
  ] as const),
  // Phase 31.11 must explicitly define solvent chemistry and route criteria;
  // this placeholder must never be turned into a positive assertion in 31.1.
  ALTERNATIVE_CHEMISTRY: Object.freeze([] as readonly HabitabilityConstraint[]),
} satisfies Readonly<Record<HabitabilityRoute, readonly HabitabilityConstraint[]>>);

export const HABITABILITY_ROUTES_31_1: readonly HabitabilityRoute[] =
  Object.freeze(['SURFACE_AQUEOUS', 'SUBSURFACE_AQUEOUS', 'ALTERNATIVE_CHEMISTRY']);
