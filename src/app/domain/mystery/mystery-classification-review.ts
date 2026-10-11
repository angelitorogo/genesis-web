import type { MysteryObservedEvidence } from './mystery-observational-evidence';

/** 30.4: observational phenomenological classes, NOT canonical progenitor identities. */
export type MysteryObservedClass = 'RADIO_VARIABLE_SOURCE' | 'RADIO_PERIODIC_SIGNAL';
export type MysteryClassificationStatus = 'UNCLASSIFIED' | 'PROVISIONAL' | 'SUPPORTED' | 'UNDER_REVIEW';

export interface MysteryClassificationRuleAudit {
  readonly classCode: MysteryObservedClass;
  readonly candidateEvidenceIds: readonly string[];
  readonly qualifyingEpochs: number;
  readonly independentCampaigns: number;
  readonly threshold: string;
  readonly status: 'NOT_MET' | 'PROVISIONAL' | 'SUPPORTED' | 'BLOCKED_TENSION';
}

export interface MysteryClassificationDecision {
  readonly status: MysteryClassificationStatus;
  /** Null means the evidence does not justify one specific observational class. */
  readonly classCode: MysteryObservedClass | null;
  readonly reason: 'INSUFFICIENT_EVIDENCE' | 'REQUIRED_SIGNATURE_MET' |
    'INDEPENDENT_REPLICATION_MET' | 'APPARENT_TENSION' | 'COMPETING_SIGNATURES';
  readonly supportingEvidenceIds: readonly string[];
  readonly rules: readonly MysteryClassificationRuleAudit[];
  /** Does not assert any physical Ground Truth. */
  readonly canonicalIdentityRevealed: false;
}

/** Snapshots are preserved for immutable, replayable revisions and anti-rewrite validation. */
export interface MysteryClassificationRevision {
  readonly revisionId: string;
  readonly sequence: number;
  readonly subjectId: string;
  readonly evidenceDigest: string;
  readonly evidenceSnapshot: readonly MysteryObservedEvidence[];
  readonly decision: MysteryClassificationDecision;
  readonly change: 'INITIAL' | 'NEW_EVIDENCE' | 'PROMOTED' | 'REOPENED' | 'RECLASSIFIED';
}

export interface MysteryClassificationHistory {
  readonly subjectId: string;
  readonly revisions: readonly MysteryClassificationRevision[];
  readonly current: MysteryClassificationDecision;
  readonly classificationIsObservationOnly: true;
  readonly persistedEvents: 0;
  readonly awardedPD: 0;
}
