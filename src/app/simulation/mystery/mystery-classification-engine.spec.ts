import { MysteryClassificationEngine as Classify } from './mystery-classification-engine';
import { MysteryEvidenceEngine as Evidence } from './mystery-evidence-engine';
import { MYSTERY_CLASSIFICATION_CASES as cases } from './mystery-classification-laboratory-fixtures';

const by = (id: string) => cases.find(c => c.id === id)!;
const assess = (id: string, steps = 0) => {
  const c = by(id);
  return Evidence.assess(c.subject, [
    ...c.initial, ...c.steps.slice(0, steps).flatMap(s => s.evidence),
  ]);
};

describe('30.4 evidence-only scientific classification', () => {
  it('does not guess physical taxonomy from a radio detection, limits or X-ray signal', () => {
    for (const id of ['insufficient', 'outside']) {
      const decision = Classify.decide(assess(id));
      expect(decision.status).toBe('UNCLASSIFIED');
      expect(decision.classCode).toBeNull();
      expect(decision.canonicalIdentityRevealed).toBe(false);
    }
  });
  it('allows a provisional observational radio-variable class only across distinct epochs', () => {
    const result = Classify.decide(assess('provisional'));
    expect(result.status).toBe('PROVISIONAL');
    expect(result.classCode).toBe('RADIO_VARIABLE_SOURCE');
    expect(result.rules[0].qualifyingEpochs).toBe(2);
  });
  it('promotes to supported only with third epoch and independent campaign', () => {
    const first = Classify.review(assess('supported'));
    const second = Classify.review(assess('supported', 1), first);
    expect(first.current.status).toBe('PROVISIONAL');
    expect(second.current.status).toBe('SUPPORTED');
    expect(second.revisions).toHaveLength(2);
    expect(second.revisions[1].change).toBe('PROMOTED');
    expect(second.current.classCode).toBe('RADIO_VARIABLE_SOURCE');
  });
  it('reopens rather than hiding a same-epoch apparent tension', () => {
    const first = Classify.review(assess('reopen'));
    const supported = Classify.review(assess('reopen', 1), first);
    const reopened = Classify.review(assess('reopen', 2), supported);
    expect(supported.current.status).toBe('SUPPORTED');
    expect(reopened.current.status).toBe('UNDER_REVIEW');
    expect(reopened.current.classCode).toBeNull();
    expect(reopened.current.reason).toBe('APPARENT_TENSION');
    expect(reopened.revisions[2].change).toBe('REOPENED');
    expect(assess('reopen', 2).summary.apparentTensions).toBeGreaterThan(0);
  });
  it('periodicity can be supported observationally but never establishes pulsar identity', () => {
    const initial = Classify.review(assess('periodic'));
    const repeated = Classify.review(assess('periodic', 1), initial);
    expect(initial.current.classCode).toBe('RADIO_PERIODIC_SIGNAL');
    expect(initial.current.status).toBe('PROVISIONAL');
    expect(repeated.current.status).toBe('SUPPORTED');
    expect(JSON.stringify(repeated)).not.toContain('PULSAR');
    expect(JSON.stringify(repeated)).not.toContain('canonicalSource');
  });
  it('does not promote low-significance or same-epoch flux measurements', () => {
    const c = by('provisional');
    const lowSNR = c.initial.map(item => item.kind === 'DETECTION' ?
      { ...item, sigmaMinus: 4, sigmaPlus: 4 } : item);
    const result = Classify.decide(Evidence.assess(c.subject, lowSNR));
    expect(result.status).toBe('UNCLASSIFIED');
    expect(result.classCode).toBeNull();
    const sameEpoch = c.initial.map(item => ({ ...item, epochKey: 'SAME-EPOCH' }));
    const tension = Classify.decide(Evidence.assess(c.subject, sameEpoch));
    expect(tension.status).toBe('UNDER_REVIEW');
    expect(tension.classCode).toBeNull();
  });
  it('requires consistent measured periods rather than inferring a periodic source from two mismatched values', () => {
    const c = by('periodic');
    const mismatched = c.initial.map(item => item.kind === 'DETECTION' && item.observable === 'PERIOD_S' &&
      item.observationKey === 'PERIODIC-B' ? { ...item, value: item.value + .25 } : item);
    expect(Classify.decide(Evidence.assess(c.subject, mismatched)).status).toBe('UNCLASSIFIED');
  });
  it('is order independent and does not add a revision for an identical dataset', () => {
    const c = by('supported');
    const all = [...c.initial, ...c.steps[0].evidence];
    const forward = Classify.review(Evidence.assess(c.subject, all));
    const reverse = Classify.review(Evidence.assess(c.subject, [...all].reverse()));
    expect(forward).toEqual(reverse);
    expect(Classify.review(Evidence.assess(c.subject, [...all].reverse()), forward)).toBe(forward);
    expect(forward.revisions[0].revisionId).toBe(reverse.revisions[0].revisionId);
  });
  it('cannot erase or rewrite measurements from an existing review', () => {
    const c = by('supported');
    const before = Classify.review(assess('supported'));
    expect(() => Classify.review(Evidence.assess(c.subject, c.initial.slice(0, 1)), before)).toThrow(RangeError);
    const tampered = c.initial.map((item, index) => index === 0 && item.kind === 'DETECTION' ?
      {...item, value: item.value + .5} : item);
    expect(() => Classify.review(Evidence.assess(c.subject, tampered), before)).toThrow(RangeError);
  });
  it('prevents cross-source revision mixing and freezes revision audit', () => {
    const history = Classify.review(assess('provisional'));
    expect(() => Classify.review(assess('insufficient'), history)).toThrow(RangeError);
    expect(Object.isFrozen(history)).toBe(true);
    expect(Object.isFrozen(history.revisions)).toBe(true);
    expect(Object.isFrozen(history.revisions[0].decision)).toBe(true);
    expect(history.persistedEvents).toBe(0);
    expect(history.awardedPD).toBe(0);
  });
  it('does not use timestamps or system clock for review identifiers', () => {
    const spy = vi.spyOn(Date, 'now').mockImplementation(() => { throw new Error('clock read'); });
    try { expect(Classify.review(assess('provisional')).revisions).toHaveLength(1); }
    finally { spy.mockRestore(); }
  });
});
