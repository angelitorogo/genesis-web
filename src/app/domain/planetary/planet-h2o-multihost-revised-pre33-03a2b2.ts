import type { MultihostCoEvalPhysicalRevisionPRE3303A2B2 } from '../stellar/stellar-multihost-coeval-revision-pre33-03a2b2';
import type { MultipleH2OResultPRE3303A2B } from './planet-h2o-multihost-forcing-pre33-03a2b';

export const H2O_MULTIPLE_REVISED_PRE3303A2B2 = 'PRE-33.03a.2b.2/versioned-multihost-H2O/v1' as const;
export type H2OMultipleRevisedStatusPRE3303A2B2 =
  | 'VERSIONED_COEVAL_HISTORY_CONDITIONAL'
  | 'REQUIRES_ATOMIC_PLANET_REGENERATION'
  | 'REVISED_CHRONOLOGY_UNRESOLVED'
  | 'NO_RESOLVED_FORCING_OR_SURFACE';
export interface H2OMultipleRevisedPRE3303A2B2 {
  readonly contractVersion: typeof H2O_MULTIPLE_REVISED_PRE3303A2B2;
  readonly status: H2OMultipleRevisedStatusPRE3303A2B2;
  readonly scientificSource: MultihostCoEvalPhysicalRevisionPRE3303A2B2;
  readonly conditionalH2O: MultipleH2OResultPRE3303A2B | null;
  readonly historicalForcingIsHypothetical: true;
  readonly copiedFrozenPlanetSnapshot: true;
  readonly noAutomaticSavedUniverseMigration: true;
  readonly oceanCT0Certified: false;
}
