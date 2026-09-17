import { generateMultihostPlanetaryCatalog, type MultihostStellarInput } from './multihost-planetary-catalog-generator';
import { generateMultihostFormedPlanetarySystemV22 } from './multihost-formed-planetary-system-generator';
import { generateMultihostScientificPlanetsV241 } from './multihost-scientific-planet-generator-v241';
import { generateMultihostScientificMoonsV242 } from './multihost-scientific-moon-generator-v242';

const INPUT: MultihostStellarInput = Object.freeze({
  seed: '00000000000000000000000000000001',
  massA: 1, massB: 0.8, massC: null,
  radiusAAu: 0.00465, radiusBAu: 0.004, radiusCAu: null,
  innerBinaryAxisAu: 12, innerBinaryEccentricity: 0.12,
  outerBinaryAxisAu: null, outerBinaryEccentricity: null,
  frozenPAbInnerAu: 36, frozenPAbOuterAu: null, samplingOuterAu: 1000,
});
function sample(input: MultihostStellarInput, metallicity = 1) {
  const catalogue = generateMultihostPlanetaryCatalog(input);
  const luminosities = {A: 1, B: 0.42};
  const formed = generateMultihostFormedPlanetarySystemV22({
    systemSeed: catalogue.sourceSystemSeed, windows: catalogue.windows,
    metallicitySolarRatio: metallicity,
    hostLuminositiesSolarV241: luminosities,
  });
  const planets = generateMultihostScientificPlanetsV241(formed, luminosities);
  return {formed, planets, moons: generateMultihostScientificMoonsV242(formed, planets)};
}

describe('V2.4.2 scientific S-type moon generation', () => {
  it('is immutable and repeatable, bounded by parent mass and Roche/Hill for both binary hosts', () => {
    const seeds = Array.from({length: 56}, (_, i) => (i + 1).toString(16).toUpperCase().padStart(32, '0'));
    let sampled = 0;
    let aroundA = 0;
    let aroundB = 0;
    for (const seed of seeds) {
      const input = {...INPUT, seed, innerBinaryAxisAu: [3.06, 6.4, 12, 24, 48, 93, 220][Number.parseInt(seed.slice(-2), 16) % 7]!};
      const {formed, planets, moons} = sample(input);
      expect(moons).toEqual(generateMultihostScientificMoonsV242(formed, planets));
      expect(Object.isFrozen(moons)).toBe(true);
      expect(Object.isFrozen(moons.moons)).toBe(true);
      expect(moons.systems).toHaveLength(planets.planets.length);
      expect(moons.moons.length).toBe(moons.systems.reduce((n, system) => n + system.modeledMoonCount, 0));
      expect(new Set(moons.moons.map(moon => moon.id)).size).toBe(moons.moons.length);
      expect(new Set(moons.moons.map(moon => moon.formationSeedHex)).size).toBe(moons.moons.length);
      const before = JSON.stringify(formed);
      for (const system of moons.systems) {
        const parent = planets.planets.find(planet => planet.id === system.hostPlanetId)!;
        expect(parent).toBeDefined();
        expect(system.hillRadiusPlanetRadii).toBeGreaterThan(0);
        expect(system.modeledMoonCount).toBeLessThanOrEqual(8);
        expect(system.estimatedTotalMoonCount).toBeGreaterThanOrEqual(system.modeledMoonCount);
        expect(Number.isInteger(system.estimatedTotalMoonCount)).toBe(true);
        if (system.modeledMoonCount === 0) expect(system.estimatedTotalMoonCount).toBe(0);
        expect(system.modeledMoonMassEarth).toBeLessThanOrEqual(parent.physics.massEarth * 0.013 + 1e-9);
        expect(system.moons.every(moon => moon.hostPlanetId === parent.id &&
          moon.hostId === parent.hostId)).toBe(true);
        let previous = 0;
        let previousRadiusEarth = 0;
        for (const moon of system.moons) {
          const peri = moon.semiMajorAxisPlanetRadii * (1 - moon.eccentricity);
          const apo = moon.semiMajorAxisPlanetRadii * (1 + moon.eccentricity);
          expect(peri).toBeGreaterThan(moon.rocheLimitPlanetRadii);
          expect(apo).toBeLessThan(moon.progradeOuterLimitPlanetRadii);
          expect(moon.progradeOuterLimitPlanetRadii).toBeLessThanOrEqual(0.35 * moon.hillRadiusPlanetRadii + 1e-8);
          expect(peri).toBeGreaterThan(previous +
            (previousRadiusEarth + (previousRadiusEarth > 0 ? moon.radiusEarth : 0)) /
              parent.physics.radiusEarth);
          previous = apo;
          previousRadiusEarth = moon.radiusEarth;
          expect(moon.massEarth).toBeGreaterThan(0);
          expect(moon.radiusEarth).toBeGreaterThan(0);
          expect(moon.periodDays).toBeGreaterThan(0);
          expect(moon.massEarth / moon.radiusEarth ** 3 * 5.514)
            .toBeCloseTo(moon.densityGramsPerCubicCentimeter, 8);
          expect(moon.id).toContain(parent.id);
          expect(moon.formationSeedHex).toMatch(/^[0-9A-F]{32}$/);
          expect(moon.environment.provenance).toBe('V2_4_2_REFERENCE_ESTIMATE');
          expect(moon).not.toHaveProperty('locator');
          expect(moon).not.toHaveProperty('moonSeed');
          if (moon.hostId === 'A') aroundA++;
          if (moon.hostId === 'B') aroundB++;
          sampled++;
        }
      }
      expect(JSON.stringify(formed)).toBe(before);
    }
    expect(sampled).toBeGreaterThan(10);
    expect(aroundA).toBeGreaterThan(0);
    expect(aroundB).toBeGreaterThan(0);
  });

  it('does not invent moons for a zero-metallicity system or mutate the V1 planet identities', () => {
    const {formed, planets, moons} = sample(INPUT, 0);
    expect(formed.planets).toHaveLength(0);
    expect(planets.planets).toHaveLength(0);
    expect(moons.moons).toHaveLength(0);
    expect(moons.systems).toHaveLength(0);
    expect(moons.version).toBe('V2_4_2_MOON_SCIENCE');
  });

  it('rejects unmatched V2.4.1 scientific planet catalogs and preserves the original aggregates', () => {
    const {formed, planets, moons} = sample(INPUT);
    expect(() => generateMultihostScientificMoonsV242(formed, {...planets,
      sourceSystemSeed: 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
    })).toThrow(RangeError);
    if (planets.planets.length) {
      expect(() => generateMultihostScientificMoonsV242(formed, {...planets,
        planets: Object.freeze(planets.planets.slice(1)),
      })).toThrow(RangeError);
    }
    expect(moons.systems.every(system =>
      system.moons.every(moon => moon.hostId === system.hostId))).toBe(true);
  });


  it('regression: scientifically usable A/B systems have richer relevant-moon populations without forcing every hot/unstable planet', () => {
    let catalogued = 0;
    let planets = 0;
    let giantMoons = 0;
    let aroundA = 0;
    let aroundB = 0;
    let maximum = 0;
    let moonless = 0;
    for (let index = 1; index <= 56; index++) {
      const input = {...INPUT,
        seed: index.toString(16).toUpperCase().padStart(32, '0'),
        innerBinaryAxisAu: [3.06, 6.4, 12, 24, 48, 93, 220, 500][index % 8]!,
      };
      const result = sample(input);
      planets += result.planets.planets.length;
      catalogued += result.moons.moons.length;
      for (const system of result.moons.systems) {
        maximum = Math.max(maximum, system.modeledMoonCount);
        if (system.modeledMoonCount === 0) moonless++;
        const planet = result.planets.planets.find(item => item.id === system.hostPlanetId)!;
        if (['GAS_GIANT', 'ICE_GIANT', 'MINI_NEPTUNE'].includes(planet.type)) {
          giantMoons += system.modeledMoonCount;
        }
        if (system.hostId === 'A') aroundA += system.modeledMoonCount;
        if (system.hostId === 'B') aroundB += system.modeledMoonCount;
      }
    }
    // Stable, physically permitted populations must no longer be suppressed
    // by the former hard five-per-host and ten-per-scene limits.
    expect(catalogued).toBeGreaterThan(planets);
    expect(giantMoons).toBeGreaterThan(350);
    expect(aroundA).toBeGreaterThan(300);
    expect(aroundB).toBeGreaterThan(300);
    expect(maximum).toBe(8);
    expect(moonless).toBeGreaterThan(0);
  });

});
