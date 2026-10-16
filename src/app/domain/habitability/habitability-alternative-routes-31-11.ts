import type {
  HabitabilityBodyKind, HabitabilityMultiplicity, HabitabilityPerspective,
  HabitabilityEvidenceBasis, HabitabilityEvidenceVerdict, HabitabilityTimeContextCt0,
} from './habitability-scenario';

/**
 * GENESIS 31.11 — Alternate *environmental* scenarios, NOT alternate life.
 * None of these solvent families has a demonstrated alien metabolism.
 * AMMONIA_WATER is explicitly a mixed aqueous solvent, not proof of non-water life.
 */
export const ALTERNATIVE_ROUTES_31_11 = Object.freeze([
  'SURFACE_LIQUID_HYDROCARBONS',
  'SUBSURFACE_AMMONIA_WATER_MIXTURE',
  'ACIDIC_AEROSOL_DROPLETS',
] as const);
export type AlternativeRoute31_11 = typeof ALTERNATIVE_ROUTES_31_11[number];

export const ALTERNATIVE_CRITERIA_31_11 = Object.freeze([
  'LOCAL_LIQUID_SOLVENT_PHASE',
  'EXISTING_RESERVOIR',
  'PRESSURE_AND_NICHE_CONFINEMENT',
  'ACCESSIBLE_REACTANTS',
  'USABLE_ENERGY_GRADIENT',
  'CURRENT_ENVIRONMENTAL_STABILITY',
] as const);
export type AlternativeCriterion31_11 = typeof ALTERNATIVE_CRITERIA_31_11[number];

/** Scientific epistemic category, never a computed likelihood. */
export type AlternativeSpeculation31_11 =
  | 'ESTABLISHED_PHYSICAL_CHEMISTRY'
  | 'CONDITIONAL_PHYSICAL_EXTRAPOLATION'
  | 'SPECULATIVE_BIOCHEMISTRY'
  | 'HIGHLY_SPECULATIVE_BIOCHEMISTRY';

/** Specific physical family/energy hypothesis; no organisms are generated. */
export type AlternativeMetabolicHypothesis31_11 =
  | 'HYDROCARBON_REDOX_COUPLING_UNDEMONSTRATED'
  | 'AMMONIA_WATER_REDOX_UNDEMONSTRATED'
  | 'ACID_DROPLET_CHEMIOSMOTIC_ANALOG_UNDEMONSTRATED';

export interface AlternativeRouteDefinition31_11 {
  readonly route: AlternativeRoute31_11;
  readonly solventFamily: 'METHANE_ETHANE' | 'AMMONIA_WATER' | 'AQUEOUS_SULFURIC_ACID';
  readonly niche: 'SURFACE_LAKE' | 'SUBSURFACE_BRINE' | 'ATMOSPHERIC_DROPLET';
  /** Solvent exists as a chemical family; its presence on this body is NOT assumed. */
  readonly solventChemistry: AlternativeSpeculation31_11;
  /** Biological utilization is entirely hypothetical. */
  readonly metabolismSpeculation: AlternativeSpeculation31_11;
  readonly hypotheticalMetabolism: AlternativeMetabolicHypothesis31_11;
  readonly biologicalPathwayDemonstrated: false;
}

export const ALTERNATIVE_ROUTE_DEFINITIONS_31_11: readonly AlternativeRouteDefinition31_11[] =
  Object.freeze([
    Object.freeze({
      route: 'SURFACE_LIQUID_HYDROCARBONS',
      solventFamily: 'METHANE_ETHANE', niche: 'SURFACE_LAKE',
      solventChemistry: 'ESTABLISHED_PHYSICAL_CHEMISTRY',
      metabolismSpeculation: 'HIGHLY_SPECULATIVE_BIOCHEMISTRY',
      hypotheticalMetabolism: 'HYDROCARBON_REDOX_COUPLING_UNDEMONSTRATED',
      biologicalPathwayDemonstrated: false,
    }),
    Object.freeze({
      route: 'SUBSURFACE_AMMONIA_WATER_MIXTURE',
      solventFamily: 'AMMONIA_WATER', niche: 'SUBSURFACE_BRINE',
      solventChemistry: 'CONDITIONAL_PHYSICAL_EXTRAPOLATION',
      metabolismSpeculation: 'SPECULATIVE_BIOCHEMISTRY',
      hypotheticalMetabolism: 'AMMONIA_WATER_REDOX_UNDEMONSTRATED',
      biologicalPathwayDemonstrated: false,
    }),
    Object.freeze({
      route: 'ACIDIC_AEROSOL_DROPLETS',
      solventFamily: 'AQUEOUS_SULFURIC_ACID', niche: 'ATMOSPHERIC_DROPLET',
      solventChemistry: 'ESTABLISHED_PHYSICAL_CHEMISTRY',
      metabolismSpeculation: 'HIGHLY_SPECULATIVE_BIOCHEMISTRY',
      hypotheticalMetabolism: 'ACID_DROPLET_CHEMIOSMOTIC_ANALOG_UNDEMONSTRATED',
      biologicalPathwayDemonstrated: false,
    }),
  ] as const);

/**
 * Evidence must be supplied by an independently resolved body-local physical
 * source. Bulk CH4/NH3/SO2 composition, historical habitability indices and
 * candidate moon oceans are NOT proof of an actual solvent reservoir.
 */
export interface AlternativeEvidence31_11 {
  readonly bodyKind: HabitabilityBodyKind;
  readonly bodyKey: string;
  readonly systemAgeBillionYears: number | null;
  readonly route: AlternativeRoute31_11;
  readonly criterion: AlternativeCriterion31_11;
  readonly verdict: HabitabilityEvidenceVerdict;
  readonly basis: HabitabilityEvidenceBasis;
  readonly sourceKey: string;
  readonly accessibleToObserver: boolean;
  readonly scope: 'RESOLVED_CURRENT_BODY' | 'CONDITIONAL_SCENARIO';
}

export interface AlternativeCriterionResult31_11 {
  readonly criterion: AlternativeCriterion31_11;
  readonly verdict: HabitabilityEvidenceVerdict;
  readonly basis: HabitabilityEvidenceBasis;
  readonly sourceKey: string | null;
  /** Conditional candidates do not prove a resolved environmental requirement. */
  readonly conditionalCandidate: boolean;
}

export type AlternativeEnvironmentStatus31_11 =
  | 'PHYSICAL_CONSTRAINTS_INCOMPATIBLE'
  | 'PHYSICAL_SCENARIO_SUPPORTED'
  | 'INSUFFICIENT_RESOLVED_EVIDENCE';

export interface AlternativeRouteAssessment31_11 {
  readonly definition: AlternativeRouteDefinition31_11;
  readonly status: AlternativeEnvironmentStatus31_11;
  readonly constraints: readonly AlternativeCriterionResult31_11[];
  readonly missingCriteria: readonly AlternativeCriterion31_11[];
  readonly decisiveContradictions: readonly AlternativeCriterion31_11[];
  readonly evidenceCoverage01: number;
  readonly inferredOnly: boolean;
  readonly metabolicFeasibility: 'NOT_ESTABLISHED';
  readonly lifePresence: 'NOT_EVALUATED';
}

export interface AlternativeAssessment31_11 {
  readonly contractVersion: '31.11-CT0';
  readonly interpretation: 'ENVIRONMENTAL_CONSTRAINTS_NOT_PROBABILITY_OF_LIFE';
  readonly bodyKind: HabitabilityBodyKind;
  readonly bodyKey: string;
  readonly multiplicity: HabitabilityMultiplicity;
  readonly perspective: HabitabilityPerspective;
  readonly time: HabitabilityTimeContextCt0;
  readonly routes: readonly AlternativeRouteAssessment31_11[];
}
