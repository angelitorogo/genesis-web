import type { StellarEvolutionStateName } from './stellar-evolution-state';
import type { StellarLifetimeProfile } from './stellar-lifetime-profile';

/** A new, explicitly requested scientific source revision, NOT GeneratorVersion.V3.
 * Existing V1/V2 persisted universes are never interpreted as this revision.
 */
export const MULTIHOST_COEVAL_REVISION_PRE3303A2B2 =
  'PRE-33.03a.2b.2/coeval-scientific-physical-revision/v1' as const;
export const MULTIHOST_FROZEN_SOURCE_PRE3303A2B2 = 'FROZEN_V2_PRIVATE_V1_15_3' as const;
export type MultihostRevisionStatusPRE3303A2B2 =
  | 'COEVAL_PHYSICAL_SOURCE_READY'
  | 'INVALID_PRIMARY_CHRONOLOGY'
  | 'INVALID_COMPONENT_PHYSICS';
export type MultihostH2ORevisionStatusPRE3303A2B2 =
  | 'CONDITIONAL_DATED_MODEL_ONLY'
  | 'UNRESOLVED_STELLAR_PHASE_REQUIRES_REGENERATION'
  | 'UNRESOLVED_PHYSICAL_FORCING_OR_SURFACE';

export interface MultihostRevisedComponentPRE3303A2B2 {
  readonly label: 'A' | 'B' | 'C';
  /** Existing physical identity; only scientific chronology has a new revision. */
  readonly physicalScopeSeed: string;
  readonly frozenAgeBillionYears: number;
  readonly revisedAgeBillionYears: number;
  readonly initialMassSolar: number;
  readonly metallicitySolarRatio: number;
  readonly referenceLuminositySolar: number;
  readonly frozenEvolutionState: StellarEvolutionStateName;
  readonly revisedEvolutionState: StellarEvolutionStateName;
  /** New phase-14 evaluation; is not the original component lifetime. */
  readonly revisedLifetime: StellarLifetimeProfile;
  readonly phaseChanged: boolean;
}

export interface MultihostCoEvalPhysicalRevisionPRE3303A2B2 {
  readonly contractVersion: typeof MULTIHOST_COEVAL_REVISION_PRE3303A2B2;
  readonly parentSourceVersion: typeof MULTIHOST_FROZEN_SOURCE_PRE3303A2B2;
  readonly parentGenerationVersion: 'V2';
  readonly systemKey: string;
  readonly sharedFormationAgeBillionYears: number;
  readonly components: readonly MultihostRevisedComponentPRE3303A2B2[];
  readonly status: MultihostRevisionStatusPRE3303A2B2;
  readonly statusExplanation: string;
  readonly coevalPhysicsRecomputed: boolean;
  /** This revision is never a drop-in rehydration of saved old objects. */
  readonly legacyUniverseUnmodified: true;
  readonly phase32Unmodified: true;
  readonly gameCutoverActivated: false;
  readonly migrationRequiresAtomicRegeneration: true;
  readonly ct0WaterCertified: false;
  readonly planetRecordsCompatibleWithoutMigration: false;
}
