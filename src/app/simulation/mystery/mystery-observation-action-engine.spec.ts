import { MysteryObservationActionEngine as Engine } from './mystery-observation-action-engine';
import { MYSTERY_ACTION_LABORATORY_CASES as CASES } from './mystery-action-laboratory-fixtures';

const byId = (id: string) => CASES.find(item => item.id === id)!;
const plans = (id: string) => {
  const c = byId(id);
  return Engine.plan(c.subject, c.instruments, c.actions.map(action => action.request));
};
const evaluate = (id: string, executed: readonly number[]) => {
  const c = byId(id);
  return Engine.evaluate(c.subject, c.initial, c.instruments,
    c.actions.map(action => action.request),
    executed.map(index => ({ requestId: c.actions[index].request.id, packet: c.actions[index].packet })));
};

describe('30.3 explicit scientific observations', () => {
  it('offers only actions supported by the real instrument capabilities, without reading Ground Truth', () => {
    const p = plans('spectrum');
    expect(p.map(action => [action.status, action.reason])).toEqual([
      ['AVAILABLE', null], ['BLOCKED', 'INSTRUMENT_UNAVAILABLE'],
    ]);
    expect(plans('unsupported')[0].reason).toBe('BAND_UNSUPPORTED');
    expect(plans('astrometry')[0].status).toBe('AVAILABLE');
    expect(plans('campaign')[0].status).toBe('AVAILABLE');
  });

  it('adds only explicit spectra and keeps original evidence and unknown class', () => {
    const before = evaluate('spectrum', []);
    const after = evaluate('spectrum', [0]);
    expect(before.assessment.summary.total).toBe(3);
    expect(after.assessment.summary.total).toBe(5);
    expect(after.assessment.summary.detections).toBe(2);
    expect(after.assessment.summary.upperLimits).toBe(2);
    expect(after.assessment.summary.missing).toBe(1);
    expect(after.assessment.subject).toEqual(before.assessment.subject);
    expect(after.assessment.subject.classification).toBe('UNCLASSIFIED');
    expect(after.classificationChanged).toBe(false);
    expect(after.persistedEvents).toBe(0);
    expect(after.awardedPD).toBe(0);
  });

  it('does not fabricate measurements merely because a mode is supported', () => {
    const c = byId('spectrum');
    const nothing = Engine.evaluate(c.subject, c.initial, c.instruments,
      c.actions.map(item => item.request), [{requestId: c.actions[0].request.id,
        packet: {requestId: c.actions[0].request.id, evidence: []}}]);
    expect(nothing.assessment.summary.total).toBe(3);
    expect(nothing.completedActionIds).toEqual(['OPT-SPECTRUM']);
  });

  it('does not erase the original tension when a new epoch is observed', () => {
    const before = evaluate('tension', []);
    const after = evaluate('tension', [0]);
    expect(before.assessment.summary.apparentTensions).toBe(1);
    expect(after.assessment.summary.apparentTensions).toBe(1);
    expect(after.assessment.summary.total).toBe(3);
  });

  it('keeps upper limits distinct and does not infer a source from astrometry', () => {
    const a = evaluate('astrometry', [0]);
    expect(a.assessment.summary.upperLimits).toBe(1);
    expect(a.assessment.summary.missing).toBe(1);
    expect(a.assessment.subject.classification).toBe('UNKNOWN_PHENOMENON');
    expect(a.assessment.subject.scope.kind).toBe('UNLOCATED');
  });

  it('supports explicit two-band campaigns without filling unobserved bands', () => {
    const x = evaluate('campaign', [0]);
    const newRecords = x.assessment.evidence.filter(item => item.campaignKey === 'SURVEY-CAMPAIGN');
    expect(newRecords).toHaveLength(2);
    expect(newRecords.map(item => item.band).sort()).toEqual(['INFRARED', 'OPTICAL']);
  });

  it('rejects blocked actions even if a fake acquisition packet was provided', () => {
    expect(() => evaluate('spectrum', [1])).toThrow(RangeError);
    expect(() => evaluate('unsupported', [0])).toThrow(RangeError);
  });

  it('rejects forged instrument and subject capabilities, excessive duration and misplaced bands', () => {
    const c = byId('spectrum');
    const req = c.actions[0].request;
    expect(() => Engine.plan(c.subject, c.instruments, [{...req, subjectId: byId('tension').subject.id}])).toThrow(RangeError);
    expect(Engine.plan(c.subject, c.instruments, [{...req, exposureSeconds: 5000}])[0].reason)
      .toBe('EXPOSURE_EXCEEDS_CAPACITY');
    expect(Engine.plan(c.subject, c.instruments, [{...req, bands: ['RADIO']}])[0].reason)
      .toBe('BAND_UNSUPPORTED');
    expect(Engine.plan(c.subject, c.instruments, [{...req, observables: ['STRAIN']}])[0].reason)
      .toBe('MEASUREMENT_UNSUPPORTED');
    expect(() => Engine.plan(c.subject, c.instruments, [{...req, exposureSeconds: -1}])).toThrow(RangeError);
    expect(() => Engine.plan(c.subject, c.instruments, [req, req])).toThrow(RangeError);
  });

  it('rejects packets from a different action, epoch or band', () => {
    const c = byId('spectrum');
    const request = c.actions[0].request;
    const original = c.actions[0].packet;
    const run = (packet: typeof original) => Engine.evaluate(c.subject, c.initial,
      c.instruments, c.actions.map(item => item.request), [{ requestId: request.id, packet }]);
    expect(() => run({ ...original, requestId: 'OTHER' })).toThrow(RangeError);
    expect(() => run({ ...original, evidence: [{ ...original.evidence[0], epochKey: 'ANOTHER-EPOCH' }] })).toThrow(RangeError);
    expect(() => run({ ...original, evidence: [{ ...original.evidence[0], band: 'X_RAY' }] })).toThrow(RangeError);
    expect(() => run({ ...original, evidence: [{ ...original.evidence[0], observationKey: 'FORGED' }] })).toThrow(RangeError);
  });

  it('repeated acquisition with the same action is idempotent; conflicting replay fails', () => {
    const c = byId('spectrum');
    const req = c.actions[0].request.id;
    const run = { requestId: req, packet: c.actions[0].packet };
    const a = Engine.evaluate(c.subject, c.initial, c.instruments,
      c.actions.map(item => item.request), [run]);
    const b = Engine.evaluate(c.subject, c.initial, c.instruments,
      c.actions.map(item => item.request), [run, run]);
    expect(b.assessment).toEqual(a.assessment);
    expect(b.completedActionIds).toEqual([req]);
    expect(() => Engine.evaluate(c.subject, c.initial, c.instruments,
      c.actions.map(item => item.request), [run, {
        requestId: req, packet: { requestId: req, evidence: [] },
      }])).toThrow(RangeError);
  });

  it('results are independent of order and do not consult wall time', () => {
    const clock = vi.spyOn(Date, 'now').mockImplementation(() => { throw Error('clock forbidden'); });
    try {
      const c = byId('spectrum');
      const result = evaluate('spectrum', [0]);
      const replay = evaluate('spectrum', [0]);
      expect(result).toEqual(replay);
      expect(c.subject.toObservedRecord()).toEqual(result.assessment.subject);
    } finally { clock.mockRestore(); }
  });
});
