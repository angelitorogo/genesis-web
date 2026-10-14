import { PlanetType } from '../../domain/planetary/planet-type';
import { moonMassHierarchyWeightsL1 } from './moon-mass-hierarchy';

describe('L.1 moon mass hierarchy', () => {
  const samples = [0.12, 0.32, 0.48, 0.61, 0.69, 0.78, 0.90, 0.96];

  it('preserves total mass, nonzero satellites and frozen deterministic weights', () => {
    for (const host of [PlanetType.ROCKY, PlanetType.SUPER_EARTH, PlanetType.MINI_NEPTUNE,
      PlanetType.GAS_GIANT, PlanetType.ICE_GIANT]) {
      for (const hierarchy of [0, 0.2, 0.5, 0.8, 0.99]) {
        const weights = moonMassHierarchyWeightsL1(host, hierarchy, samples);
        expect(Object.isFrozen(weights)).toBe(true);
        expect(weights).toEqual(moonMassHierarchyWeightsL1(host, hierarchy, samples));
        expect(weights.reduce((sum, mass) => sum + mass, 0)).toBeCloseTo(1, 14);
        expect(weights.every(weight => Number.isFinite(weight) && weight > 0)).toBe(true);
      }
    }
  });

  it('permits even, stepped and dominant systems without guaranteeing a giant moon', () => {
    const even = moonMassHierarchyWeightsL1(PlanetType.GAS_GIANT, 0.05, samples);
    const stepped = moonMassHierarchyWeightsL1(PlanetType.GAS_GIANT, 0.40, samples);
    const dominant = moonMassHierarchyWeightsL1(PlanetType.GAS_GIANT, 0.85, samples);
    const exceptional = moonMassHierarchyWeightsL1(PlanetType.GAS_GIANT, 0.98, samples);
    expect(Math.max(...even)).toBeLessThan(0.20);
    expect(Math.max(...stepped)).toBeGreaterThan(Math.max(...even));
    expect(Math.max(...dominant)).toBeGreaterThan(Math.max(...stepped));
    expect(Math.max(...exceptional)).toBeGreaterThan(0.55);
    expect(Math.min(...exceptional)).toBeLessThan(Math.min(...even));
  });

  it('does not assume that the first moon is always the largest', () => {
    const weights = moonMassHierarchyWeightsL1(PlanetType.GAS_GIANT, 0.90, samples);
    expect(weights.indexOf(Math.max(...weights))).not.toBe(0);
  });

  it('keeps the one-moon and moonless boundary exactly intact', () => {
    expect(moonMassHierarchyWeightsL1(PlanetType.ROCKY, 0.94, [])).toEqual([]);
    expect(moonMassHierarchyWeightsL1(PlanetType.ROCKY, 0.94, [0.44])).toEqual([1]);
  });

  it('rejects invalid or fabricated random inputs rather than silently sampling them', () => {
    expect(() => moonMassHierarchyWeightsL1(PlanetType.GAS_GIANT, 1, samples)).toThrow(RangeError);
    expect(() => moonMassHierarchyWeightsL1(PlanetType.GAS_GIANT, 0.2, [NaN])).toThrow(RangeError);
    expect(() => moonMassHierarchyWeightsL1(PlanetType.GAS_GIANT, -0.1, samples)).toThrow(RangeError);
  });
});
