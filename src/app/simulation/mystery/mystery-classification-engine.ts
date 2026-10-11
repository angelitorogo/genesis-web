import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import type {
  MysteryObservedEvidence, MysteryEvidenceAssessment,
} from '../../domain/mystery/mystery-observational-evidence';
import type {
  MysteryObservedClass, MysteryClassificationDecision, MysteryClassificationHistory,
  MysteryClassificationRevision, MysteryClassificationRuleAudit,
} from '../../domain/mystery/mystery-classification-review';

const DOMAIN = 'GENESIS-30.4-CLASSIFICATION-V1';
const RULES = ['RADIO_VARIABLE_SOURCE', 'RADIO_PERIODIC_SIGNAL'] as const;
const compare = (a: string, b: string): number => a === b ? 0 : a < b ? -1 : 1;
function digest(value: unknown): string {
  return bytesToHex(sha256(utf8ToBytes(JSON.stringify([DOMAIN, value])))).toUpperCase();
}
function freeze<T>(value: T): Readonly<T> { return Object.freeze(value); }
function detectionSignificance(e: MysteryObservedEvidence): boolean {
  return e.kind === 'DETECTION' && e.value > 0 &&
    e.value / Math.max(e.sigmaMinus, e.sigmaPlus) >= 5;
}
function disjoint(a: Extract<MysteryObservedEvidence, {kind:'DETECTION'}>,
                  b: Extract<MysteryObservedEvidence, {kind:'DETECTION'}>): boolean {
  return a.value + 2 * a.sigmaPlus < b.value - 2 * b.sigmaMinus ||
    b.value + 2 * b.sigmaPlus < a.value - 2 * a.sigmaMinus;
}
function overlapping(a: Extract<MysteryObservedEvidence, {kind:'DETECTION'}>,
                     b: Extract<MysteryObservedEvidence, {kind:'DETECTION'}>): boolean {
  return !disjoint(a, b);
}

type Det = Extract<MysteryObservedEvidence, {kind:'DETECTION'}>;
interface Candidate {
  readonly audit: MysteryClassificationRuleAudit;
  readonly selected: readonly MysteryObservedEvidence[];
}
function rule(
  code: MysteryObservedClass, selected: readonly Det[], qualifying: boolean,
  hasTension: boolean, threshold: string, additionalEvidence: readonly Det[] = [],
): Candidate {
  const epochs = new Set(selected.map(e => e.epochKey)).size;
  const campaigns = new Set(selected.map(e => e.campaignKey)).size;
  const status = hasTension ? 'BLOCKED_TENSION'
    : !qualifying ? 'NOT_MET'
    : epochs >= 3 && campaigns >= 2 ? 'SUPPORTED' : 'PROVISIONAL';
  return {
    selected,
    audit: freeze({
      classCode: code,
      candidateEvidenceIds: freeze([...new Set([...selected, ...additionalEvidence].map(e => e.id))].sort(compare)),
      qualifyingEpochs: epochs, independentCampaigns: campaigns,
      threshold, status,
    }),
  };
}

/** Classification uses *only* normalized observational evidence (30.2/30.3).
 * No canonical links, locators, seeded hidden types or wall clock are accepted. */
export class MysteryClassificationEngine {
  private constructor() {}

  static decide(assessment: MysteryEvidenceAssessment): MysteryClassificationDecision {
    if (!assessment || !/^(?:UCS30|UPH30)-[A-F0-9]{32}$/.test(assessment.subject?.id ?? '')) {
      throw new RangeError('30.4 needs a valid 30.1 observed subject.');
    }
    const detections = assessment.evidence.filter((e): e is Det => e.kind === 'DETECTION');
    const flux = detections.filter(e => e.band === 'RADIO' && e.observable === 'FLUX_DENSITY_JY' && detectionSignificance(e));
    const periods = detections.filter(e => e.band === 'RADIO' && e.observable === 'PERIOD_S' && detectionSignificance(e));
    const fluxVariable = flux.some((a, i) => flux.slice(i + 1).some(b =>
      a.epochKey !== b.epochKey && disjoint(a, b)));
    // Periodic signal requires two independent epochs with overlapping 2σ
    // periodicities plus at least one high-SNR flux detection; this is not a pulsar diagnosis.
    const periodic = flux.length > 0 && periods.some((a, i) => periods.slice(i + 1).some(b =>
      a.epochKey !== b.epochKey && overlapping(a, b))) &&
      periods.every((a, i) => periods.slice(i + 1).every(b => overlapping(a, b)));
    const radioTensions = assessment.tensions.some(t => t.band === 'RADIO' &&
      (t.observable === 'FLUX_DENSITY_JY' || t.observable === 'PERIOD_S'));

    const candidates = [
      rule(RULES[0], flux, fluxVariable, radioTensions,
        '>=2 epochs: flujo radio S/N>=5, intervalos 2σ separados; soporte: >=3 épocas y >=2 campañas'),
      rule(RULES[1], periods, periodic, radioTensions,
        '>=2 épocas con periodo radio S/N>=5 e intervalos 2σ compatibles, radio detectada; soporte: >=3 épocas y >=2 campañas',
        flux.slice(0, 1)),
    ];
    const qualified = candidates.filter(c => c.audit.status === 'PROVISIONAL' || c.audit.status === 'SUPPORTED');
    let status: MysteryClassificationDecision['status'] = 'UNCLASSIFIED';
    let reason: MysteryClassificationDecision['reason'] = 'INSUFFICIENT_EVIDENCE';
    let classCode: MysteryObservedClass | null = null;
    let supporting: readonly string[] = [];
    if (radioTensions) {
      status = 'UNDER_REVIEW'; reason = 'APPARENT_TENSION';
    } else if (qualified.length > 1) {
      status = 'UNDER_REVIEW'; reason = 'COMPETING_SIGNATURES';
    } else if (qualified.length === 1) {
      const winner = qualified[0];
      classCode = winner.audit.classCode;
      status = winner.audit.status as 'PROVISIONAL' | 'SUPPORTED';
      reason = status === 'SUPPORTED' ? 'INDEPENDENT_REPLICATION_MET' : 'REQUIRED_SIGNATURE_MET';
      supporting = winner.audit.candidateEvidenceIds;
    }
    return freeze({ status, classCode, reason,
      supportingEvidenceIds: freeze([...supporting]),
      rules: freeze(candidates.map(c => c.audit)),
      canonicalIdentityRevealed: false as const,
    });
  }

  /** Revisions are immutable; same evidence in any order returns same history.
   * For 30.4 no deletion or rewriting of measurements is accepted: 30.7 will
   * add a separately audited evidence-retraction protocol. */
  static review(assessment: MysteryEvidenceAssessment,
                previous?: MysteryClassificationHistory): MysteryClassificationHistory {
    const decision = this.decide(assessment);
    const ordered = freeze([...assessment.evidence].sort((a, b) => compare(a.id, b.id)));
    // Encode the full measurements, not just ids, to detect conflicting replacements.
    const evidenceDigest = digest([assessment.subject.id, ordered]);
    if (previous) {
      if (previous.subjectId !== assessment.subject.id ||
          previous.revisions.length === 0 ||
          JSON.stringify(previous.current) !== JSON.stringify(previous.revisions[previous.revisions.length - 1].decision)) {
        throw new RangeError('30.4 revision history must belong to the same subject and be internally consistent.');
      }
      const last = previous.revisions[previous.revisions.length - 1];
      if (last.evidenceDigest === evidenceDigest) return previous;
      const byId = new Map(ordered.map(e => [e.id, JSON.stringify(e)]));
      if (last.evidenceSnapshot.some(e => byId.get(e.id) !== JSON.stringify(e))) {
        throw new RangeError('30.4 cannot erase or rewrite prior observations: use an explicit future audit/retraction.');
      }
    }
    const old = previous?.current;
    const change: MysteryClassificationRevision['change'] = !old ? 'INITIAL'
      : old.classCode !== decision.classCode && decision.classCode !== null ? 'RECLASSIFIED'
      : (old.status === 'SUPPORTED' || old.status === 'PROVISIONAL') &&
        (decision.status === 'UNCLASSIFIED' || decision.status === 'UNDER_REVIEW') ? 'REOPENED'
      : old.status !== 'SUPPORTED' && decision.status === 'SUPPORTED' ? 'PROMOTED'
      : 'NEW_EVIDENCE';
    const sequence = (previous?.revisions.length ?? 0) + 1;
    const revision = freeze({
      revisionId: `MCR30-${digest([assessment.subject.id, evidenceDigest]).slice(0, 32)}`,
      sequence, subjectId: assessment.subject.id, evidenceDigest,
      evidenceSnapshot: ordered, decision, change,
    } satisfies MysteryClassificationRevision);
    const revisions = freeze([...(previous?.revisions ?? []), revision]);
    return freeze({ subjectId: assessment.subject.id, revisions, current: decision,
      classificationIsObservationOnly: true as const,
      persistedEvents: 0 as const, awardedPD: 0 as const,
    });
  }
}
