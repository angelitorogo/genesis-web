import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import type { MysteryEvidenceAssessment, MysteryObservedEvidence } from '../../domain/mystery/mystery-observational-evidence';
import type { MysteryClassificationHistory } from '../../domain/mystery/mystery-classification-review';
import type {
  MysteryClosureScope, MysteryUnresolvedAssessment, MysteryUnresolvedClosure, MysteryUnresolvedReason,
} from '../../domain/mystery/mystery-unresolved-review';

const TAXONOMY_VERSION = 'GENESIS-30.4-CLASSIFICATION-V1' as const;
const DOMAIN = 'GENESIS-30.5-UNRESOLVED-V1';
const SCOPES: readonly MysteryClosureScope[] = [
  'CURRENT_CAMPAIGN', 'CURRENT_INSTRUMENT_CAPABILITIES', 'CURRENT_OBSERVATIONAL_TAXONOMY',
];
const ascii = (a: string, b: string): number => a === b ? 0 : a < b ? -1 : 1;
const digest = (value: unknown): string => bytesToHex(sha256(utf8ToBytes(JSON.stringify([DOMAIN, value])))).slice(0, 32).toUpperCase();
const freeze = <T>(value: T): Readonly<T> => Object.freeze(value);

/** Rule coverage is versioned and intentionally limited to what 30.4 knows how to evaluate.
 * A signature outside these rules does NOT prove a novel physical object. */
function coveredByCurrentTaxonomy(e: MysteryObservedEvidence): boolean {
  return e.band === 'RADIO' &&
    (e.observable === 'FLUX_DENSITY_JY' || e.observable === 'PERIOD_S');
}
function significant(e: MysteryObservedEvidence): boolean {
  return e.kind === 'DETECTION' && e.value > 0 &&
    e.value / Math.max(e.sigmaMinus, e.sigmaPlus) >= 5;
}

export class MysteryUnresolvedEngine {
  private constructor() {}

  private static verify(assessment: MysteryEvidenceAssessment, history: MysteryClassificationHistory): void {
    if (!history?.revisions?.length || history.subjectId !== assessment?.subject?.id ||
        history.current !== history.revisions[history.revisions.length - 1].decision &&
        JSON.stringify(history.current) !== JSON.stringify(history.revisions[history.revisions.length - 1].decision)) {
      throw new RangeError('30.5 requires a consistent 30.4 review for the same 30.1 subject.');
    }
    const sorted = [...assessment.evidence].sort((a, b) => ascii(a.id, b.id));
    if (JSON.stringify(sorted) !== JSON.stringify(history.revisions[history.revisions.length - 1].evidenceSnapshot)) {
      throw new RangeError('30.5 review must match the complete current evidence snapshot.');
    }
  }

  static assess(
    assessment: MysteryEvidenceAssessment,
    history: MysteryClassificationHistory,
    previousClosure: MysteryUnresolvedClosure | null = null,
  ): MysteryUnresolvedAssessment {
    this.verify(assessment, history);
    const current = history.current;
    const supported = current.rules.filter(r => r.status === 'PROVISIONAL' || r.status === 'SUPPORTED')
      .map(r => r.classCode).sort(ascii);
    const unmatched = assessment.evidence.filter(e => significant(e) && !coveredByCurrentTaxonomy(e))
      .map(e => e.id).sort(ascii);
    let reason: MysteryUnresolvedAssessment['reason'] = 'INSUFFICIENT_EVIDENCE';
    let status: MysteryUnresolvedAssessment['status'] = 'OPEN_UNRESOLVED';
    if (current.status === 'SUPPORTED' || current.status === 'PROVISIONAL') {
      reason = 'OBSERVATIONAL_CLASS_AVAILABLE'; status = 'OBSERVATIONALLY_CLASSIFIED';
    } else if (current.reason === 'COMPETING_SIGNATURES') {
      reason = 'SUBDETERMINED_OBSERVATIONAL_SIGNATURES';
    } else if (current.reason === 'APPARENT_TENSION') {
      reason = 'APPARENT_TENSION';
    } else if (unmatched.length > 0) {
      reason = 'OUTSIDE_CURRENT_OBSERVATIONAL_RULES';
    }
    if (previousClosure) {
      if (previousClosure.subjectId !== assessment.subject.id ||
          previousClosure.taxonomyVersion !== TAXONOMY_VERSION ||
          !SCOPES.includes(previousClosure.scope)) {
        throw new RangeError('30.5 closure does not belong to this observational subject/taxonomy.');
      }
      const matches = history.revisions.some(r =>
        r.revisionId === previousClosure.classificationRevisionId &&
        r.evidenceDigest === previousClosure.evidenceDigest);
      if (!matches || previousClosure.id !== `MUC30-${digest([
        previousClosure.subjectId, previousClosure.classificationRevisionId,
        previousClosure.evidenceDigest, previousClosure.scope, previousClosure.reasonAtClosure, TAXONOMY_VERSION,
      ])}`) {
        throw new RangeError('30.5 unverified or tampered closure snapshot.');
      }
      if (status !== 'OBSERVATIONALLY_CLASSIFIED') {
        status = history.revisions[history.revisions.length - 1].revisionId === previousClosure.classificationRevisionId
          ? 'CLOSED_UNRESOLVED' : 'REOPENED_BY_NEW_EVIDENCE';
      }
    }
    return freeze({
      subjectId: assessment.subject.id, status, reason,
      unmatchedDetectionEvidenceIds: freeze(unmatched), supportedRuleCodes: freeze(supported),
      closure: previousClosure, physicalOriginDetermined: false as const,
      groundTruthConsulted: false as const, persistedEvents: 0 as const, awardedPD: 0 as const,
    });
  }

  /** Explicit decision to end a bounded campaign, NEVER a claim of eternal impossibility.
   * Cannot close a source which already has a justified observational class. */
  static close(
    assessment: MysteryEvidenceAssessment,
    history: MysteryClassificationHistory,
    scope: MysteryClosureScope,
  ): MysteryUnresolvedClosure {
    if (!SCOPES.includes(scope)) throw new RangeError('30.5 closure needs a declared scientific scope.');
    const evaluation = this.assess(assessment, history);
    if (evaluation.status === 'OBSERVATIONALLY_CLASSIFIED') {
      throw new RangeError('30.5 cannot close an observationally classified source as unclassified.');
    }
    const last = history.revisions[history.revisions.length - 1];
    const reason = evaluation.reason as MysteryUnresolvedReason;
    return freeze({
      id: `MUC30-${digest([assessment.subject.id, last.revisionId, last.evidenceDigest, scope, reason, TAXONOMY_VERSION])}`,
      subjectId: assessment.subject.id,
      classificationRevisionId: last.revisionId,
      evidenceDigest: last.evidenceDigest,
      taxonomyVersion: TAXONOMY_VERSION,
      scope, reasonAtClosure: reason,
      permanentWithinDeclaredScope: true as const,
    });
  }
}
