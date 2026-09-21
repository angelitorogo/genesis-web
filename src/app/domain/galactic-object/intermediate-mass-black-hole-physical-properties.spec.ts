import { IntermediateMassBlackHolePhysicalProperties as Physical } from './intermediate-mass-black-hole-physical-properties';
import { StellarBlackHole } from '../stellar/stellar-black-hole';

/** 27.2: the intermediate class must not invent measured spin or an accretion disk. */
describe('27.2 IntermediateMassBlackHolePhysicalProperties', () => {
  it('accepts the lower boundary and a valid non-spinning reference radius', () => {
    const physical = new Physical(100, StellarBlackHole.schwarzschildRadiusFor(100));
    expect(physical.massSolar).toBe(100);
    expect(physical.schwarzschildRadiusKm).toBeCloseTo(295.325, 1);
    expect(Object.isFrozen(physical)).toBe(true);
    expect('spin' in physical).toBe(false);
    expect('accretionDisk' in physical).toBe(false);
  });

  it('rejects stellar-mass, supermassive-range, non-finite and incorrect-radius inputs', () => {
    for (const mass of [0, 3.05, 99.999, 100_000, Infinity, NaN]) {
      expect(() => new Physical(mass, 100)).toThrow(RangeError);
    }
    const radius = StellarBlackHole.schwarzschildRadiusFor(2_500);
    expect(() => new Physical(2_500, NaN)).toThrow(RangeError);
    expect(() => new Physical(2_500, radius * 1.001)).toThrow(RangeError);
    expect(() => new Physical(2_500, radius)).not.toThrow();
  });
});
