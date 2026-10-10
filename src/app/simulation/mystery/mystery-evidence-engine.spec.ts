import { UnclassifiedSource, UnknownPhenomenon } from '../../domain/mystery/mystery-observational-subject';
import type { MysteryEvidenceInput } from '../../domain/mystery/mystery-observational-evidence';
import { MysteryEvidenceEngine as Engine } from './mystery-evidence-engine';

const SID = `UCS30-${'A'.repeat(32)}`;
const PID = `UPH30-${'B'.repeat(32)}`;
const UID = `U30-${'C'.repeat(32)}`;
const scope = { kind: 'UNLOCATED' as const, id: `USC30-${'D'.repeat(32)}` };
const source = new UnclassifiedSource(SID, UID, scope);
const phenomenon = new UnknownPhenomenon(PID, UID, scope, SID);
const context = { campaignKey: 'CAMPAIGN-1', epochKey: 'EPOCH-1',
  componentKey: 'CORE', band: 'RADIO' as const,
  observable: 'FLUX_DENSITY_JY' as const };
const detection = (observationKey: string, value: number, extra: Partial<MysteryEvidenceInput> = {}): MysteryEvidenceInput =>
  ({ ...context, observationKey, kind: 'DETECTION', value, sigmaMinus: 1, sigmaPlus: 1, ...extra }) as MysteryEvidenceInput;

describe('30.2 partial observational evidence without forced classification', () => {
  it('reports detections, upper limits and missing coverage as different scientific outcomes', () => {
    const r = Engine.assess(source, [
      detection('radio', 3.5),
      { ...context, observationKey: 'optical', band: 'OPTICAL', kind: 'UPPER_LIMIT', limit: 0.2, thresholdSigma: 5 },
      { ...context, observationKey: 'x-ray', band: 'X_RAY', kind: 'MISSING', reason: 'NOT_MEASURED' },
    ]);
    expect(r.summary).toEqual({ total: 3, detections: 1, upperLimits: 1, missing: 1,
      apparentTensions: 0, partial: true, classificationChanged: false });
    expect(r.subject.classification).toBe('UNCLASSIFIED');
    expect(r.evidence.find(x => x.kind === 'MISSING')).not.toHaveProperty('value');
    expect(r.evidence.find(x => x.kind === 'UPPER_LIMIT')).not.toHaveProperty('value');
  });

  it('marks clearly disjoint 2-sigma intervals as APPARENT, not as impossible or classified', () => {
    const r = Engine.assess(source, [detection('R1', 12), detection('R2', 20)]);
    expect(r.tensions).toHaveLength(1);
    expect(r.tensions[0].kind).toBe('APPARENT_INTERVAL_TENSION');
    expect(r.tensions[0].comparisonSigma).toBe(2);
    expect(r.subject.classification).toBe('UNCLASSIFIED');
  });

  it('does not confuse overlap or boundary touching with a contradiction', () => {
    expect(Engine.assess(source, [detection('R1', 12), detection('R2', 16)]).tensions).toHaveLength(0);
    expect(Engine.assess(source, [detection('R1', 12), detection('R2', 14)]).tensions).toHaveLength(0);
  });

  it('does not infer contradiction from time variability, bands, components or incompatible quantities', () => {
    const items: MysteryEvidenceInput[] = [
      detection('R1', 12),
      detection('EPOCH-2', 40, { epochKey: 'EPOCH-2' }),
      detection('BAND-2', 50, { band: 'OPTICAL' }),
      detection('COMPONENT-2', 50, { componentKey: 'JET' }),
      detection('MEASURE-2', 50, { observable: 'ENERGY_FLUX_W_M2' }),
    ];
    expect(Engine.assess(source, items).tensions).toHaveLength(0);
  });

  it('is permutation invariant for assessments, tensions and IDs', () => {
    const inputs = [detection('X1', 2), detection('X2', 20),
      { ...context, observationKey: 'MISS', kind: 'MISSING' as const, reason: 'NOT_RESOLVED' as const }];
    expect(Engine.assess(source, inputs)).toEqual(Engine.assess(source, [...inputs].reverse()));
  });

  it('is idempotent for a duplicate observation key with identical evidence', () => {
    const r = Engine.assess(source, [detection('r1', 12), detection('R1', 12)]);
    expect(r.summary.total).toBe(1);
  });

  it('rejects reuse of the same observation key with conflicting data', () => {
    expect(() => Engine.assess(source, [detection('R1', 12), detection('r1', 13)])).toThrow(RangeError);
    expect(() => Engine.assess(source, [detection('R1', 12),
      { ...context, observationKey: 'R1', kind: 'MISSING', reason: 'NOT_MEASURED' }])).toThrow(RangeError);
  });

  it('supports source-less phenomena and preserves the immutable 30.1 observational link', () => {
    const r = Engine.assess(phenomenon, [detection('RADIO', 15)]);
    expect(r.subject.classification).toBe('UNKNOWN_PHENOMENON');
    expect(r.subject).toHaveProperty('unclassifiedSourceId', SID);
    expect(r.evidence[0].id).not.toBe(Engine.assess(source, [detection('RADIO', 15)]).evidence[0].id);
    expect(JSON.stringify(r)).not.toContain('canonical');
    expect(JSON.stringify(r)).not.toContain('generatorVersion');
  });

  it('never assigns an unknown kind to observations nor physical classes from measurements', () => {
    const r = Engine.assess(source, [detection('R1', 12), detection('R2', 20)]);
    expect(JSON.stringify(r)).not.toMatch(/MAGNETAR|QUASAR|PROGENITOR|CANONICAL_EVENT/);
    expect(source.toObservedRecord().classification).toBe('UNCLASSIFIED');
  });

  it('distinguishes unmeasured data from a measured zero', () => {
    const zero = Engine.assess(source, [detection('ZERO', 0)]);
    const absent = Engine.assess(source, [{ ...context, observationKey: 'ABSENT', kind: 'MISSING', reason: 'NOT_MEASURED' }]);
    expect(zero.summary.detections).toBe(1);
    expect(absent.summary.missing).toBe(1);
    expect(absent.evidence[0]).not.toHaveProperty('value');
  });

  it('does not treat upper limits as zero-value detections or force an interval inconsistency', () => {
    const r = Engine.assess(source, [detection('RADIO', 10),
      { ...context, observationKey: 'LIMIT', kind: 'UPPER_LIMIT', limit: 1, thresholdSigma: 3 }]);
    expect(r.tensions).toHaveLength(0);
    expect(r.summary.upperLimits).toBe(1);
  });

  it('supports asymmetric uncertainties and signed observables such as radial velocity', () => {
    const r = Engine.assess(source, [detection('VEL', -40, { observable: 'RADIAL_VELOCITY_M_S', sigmaMinus: 1, sigmaPlus: 3 })]);
    expect(r.evidence[0]).toMatchObject({ kind: 'DETECTION', value: -40, sigmaMinus: 1, sigmaPlus: 3 });
  });

  it('rejects NaNs, infinities, invalid physical quantities, identifiers and malformed absences', () => {
    expect(() => Engine.assess(source, [detection('BAD', NaN)])).toThrow(RangeError);
    expect(() => Engine.assess(source, [detection('BAD', Infinity)])).toThrow(RangeError);
    expect(() => Engine.assess(source, [detection('BAD', 2, { sigmaMinus: 0 })])).toThrow(RangeError);
    expect(() => Engine.assess(source, [detection('BAD', 2, { observable: 'POLARIZATION_FRACTION' })])).toThrow(RangeError);
    expect(() => Engine.assess(source, [detection('bad key', 2)])).toThrow(RangeError);
    expect(() => Engine.assess(source, [detection('BAD', 2, { band: 'UNKNOWN_BAND' as never })])).toThrow(RangeError);
    expect(() => Engine.assess(source, [{ ...context, observationKey: 'BAD', kind: 'MISSING', reason: 'NO' as never }])).toThrow(RangeError);
    expect(() => Engine.assess({} as never, [])).toThrow(TypeError);
  });

  it('produces frozen independent snapshots and does not mutate caller inputs', () => {
    const first = detection('R1', 12);
    const input = [first];
    const r = Engine.assess(source, input);
    expect(Object.isFrozen(r)).toBe(true);
    expect(Object.isFrozen(r.evidence)).toBe(true);
    expect(Object.isFrozen(r.evidence[0])).toBe(true);
    expect(Object.isFrozen(r.summary)).toBe(true);
    expect(input).toEqual([first]);
  });

  it('is independent of Date.now, Math.random and input order', () => {
    const clock = vi.spyOn(Date, 'now').mockImplementation(() => { throw new Error('No clock allowed'); });
    const random = vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('No random allowed'); });
    try {
      const x = Engine.assess(source, [detection('R1', 12), detection('R2', 20)]);
      const y = Engine.assess(source, [detection('R2', 20), detection('R1', 12)]);
      expect(x).toEqual(y);
    } finally { clock.mockRestore(); random.mockRestore(); }
  });
});
