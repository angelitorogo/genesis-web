import type {MultipleH2OResultPRE3303A2B} from './planet-h2o-multihost-forcing-pre33-03a2b';
import type {StellarEvolutionStateName} from '../stellar/stellar-evolution-state';

/** Independent V1 child scopes are NOT coeval. This add-on is an explicitly
 * counterfactual, read-only chronological reconstruction, NOT a V2 migration.
 */
export const PRE3303A2B1_CHRONOLOGY='PRE-33.03a.2b.1/coeval-shadow/v1' as const;
export type MultihostChronologyStatusPRE3303A2B1=
  |'FROZEN_COMPONENTS_ALREADY_COEVAL'
  |'COEVAL_REFERENCE_CONDITIONAL_COMPLETED'
  |'UNRESOLVED_COEVAL_PHASE_CONFLICT'
  |'UNRESOLVED_COEVAL_INPUT'
  |'UNRESOLVED_PRIMARY_AGE'
  |'UNRESOLVED_FORCING_OR_SURFACE';
export interface MultihostComponentChronologyPRE3303A2B1 {
  readonly component:'A'|'B'|'C';
  readonly frozenSourceKey:string;
  readonly frozenAgeBillionYears:number;
  readonly frozenState:StellarEvolutionStateName;
  readonly recomputedAtPrimaryAgeState:StellarEvolutionStateName|null;
  readonly mainSequenceEndBillionYears:number|null;
  readonly terminalAgeBillionYears:number|null;
  readonly phaseCompatible:boolean;
}
export interface MultihostChronologyPRE3303A2B1 {
  readonly contractVersion:typeof PRE3303A2B1_CHRONOLOGY;
  readonly bodyKey:string;
  readonly systemSourceKey:string;
  readonly status:MultihostChronologyStatusPRE3303A2B1;
  readonly sharedAgeReferenceBillionYears:number|null;
  readonly frozenComponentsCoEval:boolean;
  readonly components:readonly MultihostComponentChronologyPRE3303A2B1[];
  readonly conditionalReference:MultipleH2OResultPRE3303A2B|null;
  readonly provenance:'PRIMARY_A_15_3_COEVAL_SHADOW_NOT_FROZEN_V2';
  readonly editsFrozenV2:false;
  readonly editsPhase32:false;
  readonly editsPlayerKnowledge:false;
  readonly waterCT0Certified:false;
  readonly realMultiHostHistoryCertified:false;
}
