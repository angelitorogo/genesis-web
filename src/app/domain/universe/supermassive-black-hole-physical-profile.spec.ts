import { StellarBlackHole } from '../stellar/stellar-black-hole';
import { SupermassiveBlackHolePhysicalProfile as Physics } from './supermassive-black-hole-physical-profile';

describe('27.3 — canonical supermassive black-hole reference physics', () => {
  it('derives the non-spinning reference radius and gravitational time from 27.1 constants', () => {
    const mass = 4_100_000;
    const profile = new Physics(mass, 2e11);
    const radius = 2 * StellarBlackHole.GRAVITATIONAL_CONSTANT_SI *
      StellarBlackHole.SOLAR_MASS_KG * mass /
      StellarBlackHole.LIGHT_SPEED_M_PER_S ** 2 / 1_000;
    expect(profile.massSolarMasses).toBe(mass);
    expect(profile.hostTotalMassSolarMasses).toBe(2e11);
    expect(profile.schwarzschildRadiusKm).toBe(radius);
    expect(profile.gravitationalTimeSeconds).toBe(
      radius * 1_000 / (2 * StellarBlackHole.LIGHT_SPEED_M_PER_S),
    );
    expect(profile.massFractionOfGalaxy).toBe(mass / 2e11);
    expect(Object.isFrozen(profile)).toBe(true);
    expect(Object.keys(profile)).not.toContain('spin');
    expect(Object.keys(profile)).not.toContain('accretionRate');
    expect(Object.keys(profile)).not.toContain('jetLuminosity');
  });

  it('respects the frozen 1% total-host-mass cap including the exact boundary', () => {
    expect(new Physics(1e8, 1e10).massFractionOfGalaxy).toBe(0.01);
    expect(() => new Physics(1e8 + 1, 1e10)).toThrow(RangeError);
  });

  it('rejects unphysical masses and reference overflows without changing canonical galaxy inputs', () => {
    for (const value of [NaN, Infinity, -Infinity, 0, -1]) {
      expect(() => new Physics(value, 1e12)).toThrow(RangeError);
      expect(() => new Physics(1e7, value)).toThrow(RangeError);
    }
    expect(() => new Physics(1e308, 1e308)).toThrow(RangeError);
    expect(() => new Physics(Number.MIN_VALUE, 1)).toThrow(RangeError);
  });
});
