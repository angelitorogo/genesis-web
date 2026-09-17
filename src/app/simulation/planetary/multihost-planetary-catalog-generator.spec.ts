import {
  criticalPTypeInnerAu,
  criticalSTypeOuterAu,
  generateMultihostPlanetaryCatalog,
  type MultihostStellarInput,
} from './multihost-planetary-catalog-generator';

const SEED = '0123456789ABCDEF0123456789ABCDEF';
const binary: MultihostStellarInput = {
  seed: SEED,
  massA: 1,
  massB: 0.8,
  massC: null,
  radiusAAu: 0.00465,
  radiusBAu: 0.004,
  radiusCAu: null,
  innerBinaryAxisAu: 1,
  innerBinaryEccentricity: 0.12,
  outerBinaryAxisAu: null,
  outerBinaryEccentricity: null,
  frozenPAbInnerAu: 3.3,
  frozenPAbOuterAu: null,
  samplingOuterAu: 40,
};

describe('V2 experimental multihost candidate architecture', () => {
  it('derives distinct S-A/S-B/P-AB stable domains without forcing candidates', () => {
    const result = generateMultihostPlanetaryCatalog(binary);
    expect(result.windows.map(window => window.hostId)).toEqual(['A', 'B', 'AB']);
    const a = result.windows[0]!;
    const b = result.windows[1]!;
    const p = result.windows[2]!;
    expect(a.outerStableAu).toBeLessThan(binary.innerBinaryAxisAu!);
    expect(b.outerStableAu).toBeLessThan(binary.innerBinaryAxisAu!);
    expect(p.innerStableAu).toBeGreaterThanOrEqual(binary.frozenPAbInnerAu!);
    expect(p.outerStableAu).toBeNull();
    expect(result.candidates.every(candidate => candidate.experimental)).toBe(true);
  });

  it('uses distinct host masses and protects the FULL radial excursion of every candidate', () => {
    const result = generateMultihostPlanetaryCatalog(binary);
    for (const candidate of result.candidates) {
      const window = result.windows.find(item => item.hostId === candidate.hostId)!;
      expect(candidate.periapsisAu).toBeGreaterThan(window.innerStableAu);
      expect(candidate.apoapsisAu).toBeLessThan(window.referenceOuterAu);
      expect(candidate.periodDays).toBeCloseTo(
        365.25 * Math.sqrt(candidate.semiMajorAxisAu ** 3 / window.gravitatingMassSolar),
        8,
      );
    }
    expect(generateMultihostPlanetaryCatalog(binary)).toEqual(result);
    expect(Object.isFrozen(result.candidates)).toBe(true);
  });

  it('exposes S-C, P-AB bounded by C, and exterior P-ABC in a hierarchical triple', () => {
    const triple = generateMultihostPlanetaryCatalog({
      ...binary,
      massC: 0.5,
      radiusCAu: 0.003,
      outerBinaryAxisAu: 45,
      outerBinaryEccentricity: 0.12,
      frozenPAbOuterAu: 10,
      samplingOuterAu: 220,
    });
    expect(triple.windows.map(window => window.hostId))
      .toEqual(['A', 'B', 'AB', 'C', 'ABC']);
    const ab = triple.windows.find(window => window.hostId === 'AB')!;
    const abc = triple.windows.find(window => window.hostId === 'ABC')!;
    expect(ab.outerStableAu).toBeLessThanOrEqual(10);
    expect(abc.innerStableAu).toBeGreaterThan(45);
    expect(abc.gravitatingMassSolar).toBeCloseTo(2.3, 9);
    for (const candidate of triple.candidates) {
      const window = triple.windows.find(item => item.hostId === candidate.hostId)!;
      expect(candidate.periapsisAu).toBeGreaterThan(window.innerStableAu);
      expect(candidate.apoapsisAu).toBeLessThan(window.referenceOuterAu);
    }
  });

  it('rejects invalid physics inputs rather than inventing a stable interval', () => {
    expect(() => generateMultihostPlanetaryCatalog({
      ...binary, innerBinaryEccentricity: 0.95,
    })).toThrow(RangeError);
    expect(() => generateMultihostPlanetaryCatalog({
      ...binary, massC: 0.5,
    })).toThrow(RangeError);
    expect(generateMultihostPlanetaryCatalog({
      ...binary, frozenPAbOuterAu: 2.4,
    }).windows.find(window => window.hostId === 'AB')?.usable).toBe(false);
  });

  it('separates S-type and P-type Holman-Wiegert domains for equal circular binary', () => {
    expect(criticalSTypeOuterAu(1, 0, 1, 1)).toBeCloseTo(0.274, 3);
    expect(criticalPTypeInnerAu(1, 0, 1, 1)).toBeCloseTo(2.3875, 3);
  });
});
