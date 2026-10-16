import type { DiscoveryStateValue } from '../discovery/discovery-state';
import type {
  HabitabilityBodyKind, HabitabilityEvidence, HabitabilityMultiplicity,
  HabitabilityScenarioAssessment, HabitabilityTimeContextCt0,
} from './habitability-scenario';
import type { HabitabilityIndexReport31_6 } from './habitability-indices-31-6';
import type {
  AlternativeAssessment31_11, AlternativeEvidence31_11,
} from './habitability-alternative-routes-31-11';

/**
 * GENESIS 31.12 — Three independent epistemic layers.
 * No layer evaluates whether life exists or the likelihood of abiogenesis.
 * CT-0 is a single current epoch, never a historical reconstruction.
 */
export interface HabitabilityKnowledgeInput31_12 {
  readonly bodyKind: HabitabilityBodyKind;
  readonly bodyKey: string;
  readonly multiplicity: HabitabilityMultiplicity;
  readonly time: HabitabilityTimeContextCt0;
  /** Evidence already resolved by 31.2–31.5/31.10. No new physics. */
  readonly aqueousEvidence: readonly HabitabilityEvidence[];
  /** Independent, explicit niche evidence from phase 31.11. */
  readonly alternativeEvidence: readonly AlternativeEvidence31_11[];
}

/** Internal only — never bind this type to a player's scientific fiche. */
export interface HabitabilityInternalAssessment31_12 {
  readonly contractVersion: '31.12-CT0';
  readonly simulatedReality: {
    readonly layer: 'SIMULATED_REALITY';
    readonly bodyKind: HabitabilityBodyKind;
    readonly bodyKey: string;
    readonly multiplicity: HabitabilityMultiplicity;
    readonly time: HabitabilityTimeContextCt0;
    /** Phase 31 models environments, NOT actual biology in Ground Truth. */
    readonly lifePresence: 'NOT_EVALUATED';
  };
  readonly physicalPotential: {
    readonly layer: 'PHYSICAL_POTENTIAL';
    readonly aqueousScenario: HabitabilityScenarioAssessment;
    readonly aqueousIndices: HabitabilityIndexReport31_6;
    /** Separate routes: never merge into 31.1's legacy placeholder. */
    readonly alternativeRoutes: AlternativeAssessment31_11;
    readonly lifeProbability: 'NOT_DEFINED';
  };
}

/** Permission is assigned by the discovery/observational layer, not by physics. */
export interface HabitabilityObservationAccess31_12 {
  readonly discoveryState: DiscoveryStateValue;
  /** Must come from existing scientific-fiche authorization, not this resolver. */
  readonly scientificFicheAccessible: boolean;
}

/** Observer-safe DTO; deliberately has NO Ground Truth or internal potential field. */
export interface HabitabilityObservedAssessment31_12 {
  readonly contractVersion: '31.12-CT0';
  readonly layer: 'OBSERVED_KNOWLEDGE';
  readonly discoveryState: DiscoveryStateValue['name'];
  readonly access: 'SCIENTIFIC_FICHE_LOCKED' | 'SCIENTIFIC_FICHE_AVAILABLE';
  /** Null while locked so that identity, age and private environment cannot leak. */
  readonly bodyKind: HabitabilityBodyKind | null;
  readonly bodyKey: string | null;
  readonly multiplicity: HabitabilityMultiplicity | null;
  readonly time: HabitabilityTimeContextCt0 | null;
  readonly aqueousIndices: HabitabilityIndexReport31_6 | null;
  readonly alternativeRoutes: AlternativeAssessment31_11 | null;
  readonly interpretation: 'ENVIRONMENTAL_COMPATIBILITY_NOT_LIFE_DETECTION';
  readonly lifePresence: 'NOT_EVALUATED';
}
