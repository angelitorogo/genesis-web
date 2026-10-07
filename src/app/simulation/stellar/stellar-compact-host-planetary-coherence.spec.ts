import {
  stellarPlanetaryMeanInsolationEarth,
  stellarPlanetaryPeriodDaysFromCurrentMass,
  stellarPlanetaryPeriodYearsFromCurrentMass,
} from './stellar-compact-host-planetary-coherence';

describe('29.1E-e compact-host planetary coherence primitives', () => {
  it('uses the current remnant mass instead of the progenitor mass for Keplerian periods', () => {
    const periodDays = stellarPlanetaryPeriodDaysFromCurrentMass(2.74, 9.1695);
    expect(periodDays).toBeCloseTo(547.07, 2);
    expect(periodDays).toBeGreaterThan(500);
    expect(stellarPlanetaryPeriodYearsFromCurrentMass(2.74, 9.1695)).toBeCloseTo(periodDays / 365.25, 12);
  });

  it('gives a quiescent black hole zero stellar insolation instead of reusing progenitor luminosity', () => {
    expect(stellarPlanetaryMeanInsolationEarth(2.74, 0.032, 0)).toBe(0);
  });

  it('rejects unphysical current-host inputs rather than fabricating a compact-remnant environment', () => {
    expect(() => stellarPlanetaryPeriodDaysFromCurrentMass(2.74, 0)).toThrow(RangeError);
    expect(() => stellarPlanetaryMeanInsolationEarth(2.74, 0.032, -1)).toThrow(RangeError);
  });
});
