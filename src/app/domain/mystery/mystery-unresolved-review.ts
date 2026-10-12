/** 30.5: epistemic outcomes relative to the observational taxonomy, never Ground Truth. */
export type MysteryUnresolvedReason =
  | 'INSUFFICIENT_EVIDENCE'
  | 'SUBDETERMINED_OBSERVATIONAL_SIGNATURES'
  | 'OUTSIDE_CURRENT_OBSERVATIONAL_RULES'
  | 'APPARENT_TENSION';

/** A closure is a decision about a finite scientific workflow, not eternal unknowability. */
export type MysteryClosureScope =
  | 'CURRENT_CAMPAIGN'
  | 'CURRENT_INSTRUMENT_CAPABILITIES'
  | 'CURRENT_OBSERVATIONAL_TAXONOMY';

export interface MysteryUnresolvedClosure {
  readonly id: string;
  readonly subjectId: string;
  readonly classificationRevisionId: string;
  readonly evidenceDigest: string;
  readonly taxonomyVersion: 'GENESIS-30.4-CLASSIFICATION-V1';
  readonly scope: MysteryClosureScope;
  readonly reasonAtClosure: MysteryUnresolvedReason;
  /** May be superseded by later evidence. Does not modify previous observations. */
  readonly permanentWithinDeclaredScope: true;
}

export interface MysteryUnresolvedAssessment {
  readonly subjectId: string;
  readonly status: 'OPEN_UNRESOLVED' | 'CLOSED_UNRESOLVED' |
    'REOPENED_BY_NEW_EVIDENCE' | 'OBSERVATIONALLY_CLASSIFIED';
  readonly reason: MysteryUnresolvedReason | 'OBSERVATIONAL_CLASS_AVAILABLE';
  readonly unmatchedDetectionEvidenceIds: readonly string[];
  readonly supportedRuleCodes: readonly string[];
  readonly closure: MysteryUnresolvedClosure | null;
  /** Unknown physical origin is legitimate even when an observational signature is classified. */
  readonly physicalOriginDetermined: false;
  readonly groundTruthConsulted: false;
  readonly persistedEvents: 0;
  readonly awardedPD: 0;
}
