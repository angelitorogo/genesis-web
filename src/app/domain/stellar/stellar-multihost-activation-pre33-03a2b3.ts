import type { MultihostCoEvalPhysicalRevisionPRE3303A2B2 } from './stellar-multihost-coeval-revision-pre33-03a2b2';

/** Explicit scientific branch (NOT a new public GeneratorVersion or saved game). */
export const MULTIHOST_ACTIVATION_CONTRACT_PRE3303A2B3 =
  'PRE-33.03a.2b.3/multihost-physical-branch-gate/v1' as const;
export const MULTIHOST_LEGACY_BRANCH_PRE3303A2B3 = 'PUBLIC_V2_FROZEN' as const;
export const MULTIHOST_REVIEW_BRANCH_PRE3303A2B3 = 'COEVAL_03A2B2_SCIENTIFIC_PREVIEW' as const;
export type MultihostPhysicsBranchPRE3303A2B3 =
  typeof MULTIHOST_LEGACY_BRANCH_PRE3303A2B3 | typeof MULTIHOST_REVIEW_BRANCH_PRE3303A2B3;
export type MultihostCutoverDependencyPRE3303A2B3 =
  | 'STELLAR_14_8_15_3' | 'REMNANTS_29_31' | 'MULTIHOST_ORBITS_16'
  | 'PLANETS_18_19' | 'ATMOSPHERES_20' | 'MOONS_21'
  | 'HISTORICAL_EVENTS_32_12' | 'OBSERVED_AND_PERSISTED_IDENTITIES';
export interface MultihostDependencyGatePRE3303A2B3 {
  readonly dependency: MultihostCutoverDependencyPRE3303A2B3;
  readonly status: 'RECOMPUTED_PREVIEW' | 'NOT_REBUILT_FOR_NEW_BRANCH';
  readonly explanation: string;
}
export interface MultihostActivationPlanPRE3303A2B3 {
  readonly contractVersion: typeof MULTIHOST_ACTIVATION_CONTRACT_PRE3303A2B3;
  readonly systemKey: string;
  readonly parentUniverseSeed: string;
  readonly legacyGeneratorVersion: 'V2';
  readonly parentSystemSeedHex: string;
  readonly originalSnapshotDigest: string;
  readonly revision: MultihostCoEvalPhysicalRevisionPRE3303A2B2;
  readonly dependencies: readonly MultihostDependencyGatePRE3303A2B3[];
  readonly legacyBodyKeys: readonly string[];
  readonly originalPlanetCount: number;
  readonly originalAtmosphereCount: number;
  readonly originalMoonSystemCount: number;
  readonly revisedStellarComponentCount: number;
  readonly phaseChanges: readonly ('A' | 'B' | 'C')[];
  readonly status: 'SCIENTIFIC_PREVIEW_AVAILABLE' | 'STELLAR_REVISION_INVALID';
  readonly canonicalCutover: 'BLOCKED_UNTIL_ATOMIC_DEPENDENCY_REGENERATION_AND_PUBLIC_VERSION';
  readonly readOnlyScientificPreview: true;
  readonly legacyGeneratorUntouched: true;
  readonly savedPlayerKnowledgeUntouched: true;
  readonly certifiedCT0Oceans: false;
}
export interface MultihostScientificSelectionPRE3303A2B3 {
  readonly contractVersion: typeof MULTIHOST_ACTIVATION_CONTRACT_PRE3303A2B3;
  readonly branch: MultihostPhysicsBranchPRE3303A2B3;
  readonly systemKey: string;
  readonly revisedStellarComponents: MultihostCoEvalPhysicalRevisionPRE3303A2B2['components'] | null;
  readonly planetSnapshots: 'FROZEN_V2_ONLY' | 'UNAVAILABLE_IN_PREVIEW';
  readonly phase32History: 'FROZEN_V2_ONLY' | 'UNAVAILABLE_IN_PREVIEW';
  readonly persistentWrite: false;
  readonly ct0OceansCertified: false;
}
