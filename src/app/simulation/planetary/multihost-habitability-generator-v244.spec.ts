import { PlanetaryOrbitHabitableZoneRelation as Relation } from '../../domain/planetary/planetary-orbit-habitable-zone-relation';
import { PlanetarySystemHabitableZoneDynamicalRegime as Dynamics } from '../../domain/planetary/planetary-system-habitable-zone-dynamical-regime';
import { PLANETARY_HABITABLE_ZONE_V1_INNER_EFFECTIVE_FLUX_SOLAR as INNER,
  PLANETARY_HABITABLE_ZONE_V1_OUTER_EFFECTIVE_FLUX_SOLAR as OUTER,
  planetarySystemReferenceZoneEdgesV1 } from './planetary-system-habitable-zone-generator';
import { classifyIntervalV1 } from './planetary-system-habitable-zone-classification-generator';
import { generateMultihostPlanetaryCatalog, type MultihostStellarInput } from './multihost-planetary-catalog-generator';
import { generateMultihostFormedPlanetarySystemV22 } from './multihost-formed-planetary-system-generator';
import { generateMultihostScientificPlanetsV241 } from './multihost-scientific-planet-generator-v241';
import { generateMultihostHabitabilityV244, type BinaryHabitabilityContextV244 } from './multihost-habitability-generator-v244';

const INPUT: MultihostStellarInput = Object.freeze({
  seed: '00000000000000000000000000000031',
  massA: 1, massB: 0.8, massC: null,
  radiusAAu: 0.00465, radiusBAu: 0.004, radiusCAu: null,
  innerBinaryAxisAu: 36, innerBinaryEccentricity: 0.12,
  outerBinaryAxisAu: null, outerBinaryEccentricity: null,
  frozenPAbInnerAu: 110, frozenPAbOuterAu: null, samplingOuterAu: 1000,
});
const LUM = Object.freeze({A: 1, B: 0.25});
const CONTEXT: BinaryHabitabilityContextV244 = Object.freeze({
  binarySemiMajorAxisAu: 36, binaryEccentricity: 0.12,
  stellarEvolution: Object.freeze({A: 'MAIN_SEQUENCE', B: 'MAIN_SEQUENCE'}),
});
function fixture(input = INPUT) {
  const catalog = generateMultihostPlanetaryCatalog(input);
  const formed = generateMultihostFormedPlanetarySystemV22({
    systemSeed: catalog.sourceSystemSeed, windows: catalog.windows,
    hostLuminositiesSolarV241: LUM,
  });
  const scientific = generateMultihostScientificPlanetsV241(formed, LUM);
  return {catalog, formed, scientific};
}

describe('V2.4.4 binary A/B habitable-zone geometry and conservative companion flux', () => {
  it('uses the EXACT pure V1 18.6 edges and V1 18.7 q..Q classifier independently for A and B', () => {
    const {catalog, formed, scientific} = fixture();
    const original = JSON.stringify({catalog, formed, scientific});
    const result = generateMultihostHabitabilityV244(catalog, formed, scientific, LUM, CONTEXT);
    expect(result).toEqual(generateMultihostHabitabilityV244(catalog, formed, scientific, LUM, CONTEXT));
    expect(JSON.stringify({catalog, formed, scientific})).toBe(original);
    expect(result.hosts.map(host => host.hostId)).toEqual(['A', 'B']);
    expect(result.planets.length).toBe(scientific.planets.length);
    expect(Object.isFrozen(result)).toBe(true);
    for (const host of result.hosts) {
      const sourceEdges = planetarySystemReferenceZoneEdgesV1(LUM[host.hostId]);
      expect(host.radiativeInnerEdgeAu).toBe(sourceEdges.radiativeInnerEdgeAu);
      expect(host.radiativeOuterEdgeAu).toBe(sourceEdges.radiativeOuterEdgeAu);
      expect(host.radiativeInnerEdgeAu).toBeCloseTo(Math.sqrt(LUM[host.hostId] / INNER), 12);
      expect(host.radiativeOuterEdgeAu).toBeCloseTo(Math.sqrt(LUM[host.hostId] / OUTER), 12);
      expect(host.stellarEvolutionRegime).toBe('MAIN_SEQUENCE_HOST');
      expect(host.persistentReferenceCandidate).toBe(host.dynamicalRegime !== Dynamics.NO_DYNAMICAL_OVERLAP);
    }
    for (const body of result.planets) {
      const originalPlanet = formed.planets.find(planet => planet.id === body.planetId)!;
      const zone = result.hosts.find(host => host.hostId === body.hostId)!;
      expect(body.radiativeRelation).toBe(classifyIntervalV1(originalPlanet.periapsisAu,
        originalPlanet.apoapsisAu, zone.radiativeInnerEdgeAu, zone.radiativeOuterEdgeAu));
      expect(body.dynamicallyAvailableRelation).toBe(zone.dynamicallyHabitableInnerEdgeAu === null ? null :
        classifyIntervalV1(originalPlanet.periapsisAu, originalPlanet.apoapsisAu,
          zone.dynamicallyHabitableInnerEdgeAu, zone.dynamicallyHabitableOuterEdgeAu!));
      expect(body.orbitalReferenceCandidate).toBe(zone.persistentReferenceCandidate &&
        body.dynamicallyAvailableRelation === Relation.WHOLLY_WITHIN_ZONE);
      expect(body.irradiance.status).toBe('BOUNDED');
      expect(body.irradiance.totalMinimumSolar!).toBeLessThanOrEqual(body.irradiance.totalMaximumSolar!);
      expect(body.irradiance.totalMinimumSolar!).toBeGreaterThan(body.irradiance.hostOnlyMinimumSolar);
      expect(body.irradiance.totalMaximumSolar!).toBeGreaterThan(body.irradiance.hostOnlyMaximumSolar);
      const companionLum = LUM[body.hostId === 'A' ? 'B' : 'A'];
      expect(body.irradiance.companionMinimumSolar).toBeCloseTo(
        companionLum / (36 * 1.12 + originalPlanet.apoapsisAu) ** 2, 12);
      expect(body.irradiance.companionMaximumSolar).toBeCloseTo(
        companionLum / (36 * 0.88 - originalPlanet.apoapsisAu) ** 2, 12);
    }
  });

  it('does not claim full persistent HZ for a clipped window, evolved star or missing binary orbit', () => {
    const {catalog, formed, scientific} = fixture();
    const noOrbit = generateMultihostHabitabilityV244(catalog, formed, scientific, LUM);
    expect(noOrbit.hosts.every(host => !host.persistentReferenceCandidate &&
      host.stellarEvolutionRegime === 'REFERENCE_ONLY')).toBe(true);
    expect(noOrbit.planets.every(planet => planet.irradiance.status === 'UNKNOWN_BINARY_ORBIT' &&
      planet.irradiance.totalMinimumSolar === null &&
      planet.irradiance.equilibriumTemperatureMinKelvin === null &&
      planet.binaryFluxReferenceRegime === 'NOT_ASSESSED')).toBe(true);
    const evolved = generateMultihostHabitabilityV244(catalog, formed, scientific, LUM, {
      ...CONTEXT, stellarEvolution: {A: 'GIANT', B: 'MAIN_SEQUENCE'},
    });
    expect(evolved.hosts.find(host => host.hostId === 'A')!.persistentReferenceCandidate).toBe(false);
    expect(evolved.hosts.find(host => host.hostId === 'B')!.stellarEvolutionRegime).toBe('MAIN_SEQUENCE_HOST');
  });

  it('leaves giant surface temperatures null and never upgrades liquid reference into confirmed habitability', () => {
    const {catalog, formed, scientific} = fixture();
    const science = new Map(scientific.planets.map(planet => [planet.id, planet]));
    const result = generateMultihostHabitabilityV244(catalog, formed, scientific, LUM, CONTEXT);
    for (const planet of result.planets) {
      const original = science.get(planet.planetId)!;
      const giant = original.environment.atmosphere.regime === 'DEEP_ENVELOPE';
      expect(planet.irradiance.estimatedSurfaceTemperatureMinKelvin === null).toBe(giant);
      expect(planet.irradiance.estimatedSurfaceTemperatureMaxKelvin === null).toBe(giant);
      if (giant) expect(planet.environmentalReference).toBe('NO_SURFACE');
    }
    expect(result.limitations.some(text => text.includes('no demuestra habitabilidad'))).toBe(true);
  });

  it('returns no false A/B zones for absent luminosity and rejects incompatible science/seed/orbit', () => {
    const {catalog, formed, scientific} = fixture();
    const withoutB = generateMultihostHabitabilityV244(catalog, formed, scientific, {A: 1, B: null}, CONTEXT);
    expect(withoutB.hosts.map(host => host.hostId)).toEqual(['A']);
    expect(withoutB.planets.every(planet => planet.hostId === 'A' &&
      planet.irradiance.status === 'UNKNOWN_BINARY_ORBIT')).toBe(true);
    expect(() => generateMultihostHabitabilityV244(catalog, formed, {
      ...scientific, sourceSystemSeed: '00000000000000000000000000000000',
    }, LUM, CONTEXT)).toThrow(RangeError);
    expect(() => generateMultihostHabitabilityV244(catalog, formed, scientific, LUM, {
      ...CONTEXT, binaryEccentricity: 1,
    })).toThrow(RangeError);
    expect(() => generateMultihostHabitabilityV244(catalog, formed, {
      ...scientific, planets: scientific.planets.slice(1),
    }, LUM, CONTEXT)).toThrow(RangeError);
  });

  it('keeps separate A/B reference zones, immutable orbits and bounded flux across 8 binary families × 3 seeds', () => {
    let planets = 0;
    let completeSystems = 0;
    for (const axis of [0.3, 2.8, 3.06, 6.4, 12, 24, 48, 93]) {
      for (const ordinal of [2, 17, 361]) {
        const seed = ordinal.toString(16).toUpperCase().padStart(32, '0');
        const input = {...INPUT, seed, innerBinaryAxisAu: axis,
          innerBinaryEccentricity: 0.08, frozenPAbInnerAu: axis * 3};
        const {catalog, formed, scientific} = fixture(input);
        const before = JSON.stringify({catalog, formed, scientific});
        const result = generateMultihostHabitabilityV244(catalog, formed, scientific, LUM, {
          ...CONTEXT, binarySemiMajorAxisAu: axis, binaryEccentricity: 0.08,
        });
        expect(JSON.stringify({catalog, formed, scientific})).toBe(before);
        expect(result.hosts.map(host => host.hostId)).toEqual(['A', 'B']);
        expect(result.planets.length).toBe(scientific.planets.length);
        expect(new Set(result.planets.map(planet => planet.planetId)).size).toBe(result.planets.length);
        if (result.planets.length > 0) completeSystems += 1;
        planets += result.planets.length;
        for (const planet of result.planets) {
          expect(planet.irradiance.hostOnlyMinimumSolar).toBeGreaterThan(0);
          expect(planet.irradiance.hostOnlyMaximumSolar)
            .toBeGreaterThanOrEqual(planet.irradiance.hostOnlyMinimumSolar);
          expect(planet.irradiance.status === 'BOUNDED' ||
            planet.irradiance.status === 'UNBOUNDED_CLOSE_APPROACH').toBe(true);
          if (planet.irradiance.status === 'BOUNDED') {
            expect(planet.irradiance.totalMinimumSolar!).toBeLessThanOrEqual(
              planet.irradiance.totalMaximumSolar!);
          } else {
            expect(planet.irradiance.totalMaximumSolar).toBeNull();
            expect(planet.irradiance.equilibriumTemperatureMaxKelvin).toBeNull();
          }
          expect(planet.dynamicallyAvailableRelation === null ||
            Object.values(Relation).includes(planet.dynamicallyAvailableRelation)).toBe(true);
        }
      }
    }
    expect(completeSystems).toBeGreaterThan(8);
    expect(planets).toBeGreaterThan(50);
  });

  it('preserves V1 boundary tolerance: partial crossings and full-span are not classified from semi-major axis alone', () => {
    expect(classifyIntervalV1(0.3, 1.2, 0.95, 1.65)).toBe(Relation.CROSSES_INNER_EDGE);
    expect(classifyIntervalV1(0.3, 2.1, 0.95, 1.65)).toBe(Relation.SPANS_BOTH_EDGES);
    expect(classifyIntervalV1(0.97, 1.2, 0.95, 1.65)).toBe(Relation.WHOLLY_WITHIN_ZONE);
  });
});
