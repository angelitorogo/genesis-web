import { MysteryEvidenceEngine as Evidence } from './mystery-evidence-engine';
import { MysteryClassificationEngine as Classifier } from './mystery-classification-engine';
import { MysteryUnresolvedEngine as Engine } from './mystery-unresolved-engine';
import { MYSTERY_UNRESOLVED_CASES as cases } from './mystery-unresolved-laboratory-fixtures';

const c = (id: string) => cases.find(x => x.id === id)!;
const initial = (id: string) => {
  const entry = c(id);
  const assessment = Evidence.assess(entry.subject, entry.initial);
  return { assessment, history: Classifier.review(assessment) };
};
const later = (id: string) => {
  const entry = c(id);
  const first = initial(id);
  const assessment = Evidence.assess(entry.subject, [...entry.initial, ...entry.later]);
  return { assessment, history: Classifier.review(assessment, first.history) };
};

describe('30.5 legitimate unclassified / unresolved scientific sources', () => {
  it('missing measurements and upper limits never become zeros or new classifications', () => {
    const { assessment, history } = initial('insufficient');
    const result = Engine.assess(assessment, history);
    expect(result.status).toBe('OPEN_UNRESOLVED');
    expect(result.reason).toBe('INSUFFICIENT_EVIDENCE');
    expect(result.physicalOriginDetermined).toBe(false);
  });
  it('competing observational signatures remain subdetermined without choosing a canonical progenitor', () => {
    const { assessment, history } = initial('subdetermined');
    expect(history.current.reason).toBe('COMPETING_SIGNATURES');
    const result = Engine.assess(assessment, history);
    expect(result.reason).toBe('SUBDETERMINED_OBSERVATIONAL_SIGNATURES');
    expect(result.supportedRuleCodes).toHaveLength(2);
    expect(result.status).toBe('OPEN_UNRESOLVED');
  });
  it('a significant X-ray detection outside current radio rules is only a rule-coverage gap', () => {
    const { assessment, history } = initial('taxonomy');
    const result = Engine.assess(assessment, history);
    expect(result.reason).toBe('OUTSIDE_CURRENT_OBSERVATIONAL_RULES');
    expect(result.unmatchedDetectionEvidenceIds).toHaveLength(1);
    expect(result.physicalOriginDetermined).toBe(false);
  });
  it('a non-detection in an unmodeled band does not prove a taxonomy gap', () => {
    const { assessment, history } = initial('insufficient');
    expect(Engine.assess(assessment, history).unmatchedDetectionEvidenceIds).toHaveLength(0);
  });
  it('a closure is explicit, scoped, reproducible and preserves unresolved status', () => {
    const { assessment, history } = initial('closed');
    const closure = Engine.close(assessment, history, 'CURRENT_CAMPAIGN');
    expect(closure.permanentWithinDeclaredScope).toBe(true);
    expect(Engine.assess(assessment, history, closure).status).toBe('CLOSED_UNRESOLVED');
    expect(Engine.close(assessment, history, 'CURRENT_CAMPAIGN')).toEqual(closure);
    expect(Object.isFrozen(closure)).toBe(true);
  });
  it('new evidence reopens, without overwriting the closure or prior review', () => {
    const start = initial('reopened');
    const old = Engine.close(start.assessment, start.history, 'CURRENT_CAMPAIGN');
    const next = later('reopened');
    const result = Engine.assess(next.assessment, next.history, old);
    expect(result.status).toBe('REOPENED_BY_NEW_EVIDENCE');
    expect(result.closure).toBe(old);
    expect(next.history.revisions).toHaveLength(2);
    expect(next.assessment.summary.total).toBe(start.assessment.summary.total + 1);
  });
  it('a justified observational classification cannot be quietly relabeled permanently unclassified', () => {
    const { assessment, history } = initial('classified');
    expect(Engine.assess(assessment, history).status).toBe('OBSERVATIONALLY_CLASSIFIED');
    expect(() => Engine.close(assessment, history, 'CURRENT_CAMPAIGN')).toThrow(RangeError);
  });
  it('rejects mismatched evidence and review snapshots', () => {
    const first = initial('reopened');
    const newer = later('reopened');
    expect(() => Engine.assess(newer.assessment, first.history)).toThrow(RangeError);
    expect(() => Engine.assess(initial('taxonomy').assessment, first.history)).toThrow(RangeError);
  });
  it('rejects cross-source and tampered closures', () => {
    const first = initial('insufficient');
    const old = Engine.close(first.assessment, first.history, 'CURRENT_CAMPAIGN');
    const foreign = initial('taxonomy');
    expect(() => Engine.assess(foreign.assessment, foreign.history, old)).toThrow(RangeError);
    expect(() => Engine.assess(first.assessment, first.history, { ...old, scope: 'CURRENT_OBSERVATIONAL_TAXONOMY' })).toThrow(RangeError);
  });
  it('rejects invalid closure scope and cannot be triggered by wall clock', () => {
    const { assessment, history } = initial('insufficient');
    expect(() => Engine.close(assessment, history, 'GLOBAL_FOREVER' as never)).toThrow(RangeError);
    const spy = vi.spyOn(Date, 'now').mockImplementation(() => { throw new Error('Wall clock consulted'); });
    try { expect(Engine.assess(assessment, history).status).toBe('OPEN_UNRESOLVED'); }
    finally { spy.mockRestore(); }
  });
  it('preserves determinism across observation order and never grants PD or events', () => {
    const entry = c('subdetermined');
    const a = initial('subdetermined');
    const bEvidence = Evidence.assess(entry.subject, [...entry.initial].reverse());
    const bHistory = Classifier.review(bEvidence);
    expect(Engine.assess(a.assessment, a.history)).toEqual(Engine.assess(bEvidence, bHistory));
    const r = Engine.assess(a.assessment, a.history);
    expect(r.awardedPD).toBe(0);
    expect(r.persistedEvents).toBe(0);
    expect(r.groundTruthConsulted).toBe(false);
  });
});
