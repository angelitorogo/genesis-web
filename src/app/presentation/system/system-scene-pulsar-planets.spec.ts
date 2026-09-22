import { type PulsarSecondGenerationPopulation } from '../../domain/planetary/pulsar-second-generation-planet';
import { buildLinearFitSystemScale } from './system-scene-scale-projection';
import { systemScenePlanetFicheRoute } from './system-scene-scientific-route';
import { projectPulsarSecondGenerationPlanets } from './system-scene-pulsar-planets';
import { type SystemSceneSnapshot } from './system-scene-snapshot';

const identity = 'C'.repeat(32);
const population: PulsarSecondGenerationPopulation = Object.freeze({
  modelVersion: 'PULSAR_SECOND_GENERATION_V1',
  origin: 'MODELLED_SUPERNOVA_FALLBACK', hostSystemSeedHex: 'A'.repeat(32),
  parentPulsarHostSeedHex: 'A'.repeat(32), diskMassEarth: 4,
  diskFormationAgeBillionYears: 0.01, planetFormationAgeBillionYears: 0.015,
  scientificStatus: 'SPECULATIVE_FORMATION_MODEL',
  planets: Object.freeze([Object.freeze({ identityHex: identity, ordinal: 1,
    origin: 'MODELLED_SUPERNOVA_FALLBACK', hostSystemSeedHex: 'A'.repeat(32),
    parentPulsarHostSeedHex: 'A'.repeat(32), massEarth: 1.5, radiusEarth: 1.12,
    semiMajorAxisAu: 0.5, eccentricity: 0.02, periastronAu: 0.49, apoastronAu: 0.51,
    orbitalPeriodDays: 107, formedAtAgeBillionYears: 0.015, diskMassEarth: 4,
    edgeOnTimingSemiAmplitudeSeconds: 0.002, isotropicEquivalentSpinDownFluxWm2: 200,
  })]),
});
const snapshot = Object.freeze({
  generatorVersionCode: 2, multiplicityName: 'SINGLE', knowledgeLevel: 'CATALOGUED',
  stars: Object.freeze([Object.freeze({ id: 'star-1' })]),
  scale: buildLinearFitSystemScale(3, 5),
  simulation: Object.freeze({ epochSimulationDay: 0, playbackDaysPerRealSecond: 1 }),
  planets: Object.freeze([]),
  address: Object.freeze({ galaxyIndex: '0', sectorKey: '-1', galacticObjectIndex: '0' }),
} as unknown as SystemSceneSnapshot);

describe('27.9 V2 — isolated scene projection for rare post-collapse planets', () => {
  it('provides a selectable body, a real-period orbit and separate immutable identities', () => {
    const result = projectPulsarSecondGenerationPlanets(population, snapshot);
    expect(result.planets).toHaveLength(1);
    expect(result.orbits).toHaveLength(1);
    expect(result.motions).toHaveLength(1);
    expect(result.planets[0]!.id).toBe(`pulsar-sg-${identity}`);
    expect(result.planets[0]!.kind).toBe('planet');
    expect(result.planets[0]!.title).toContain('hipótesis');
    expect(result.orbits[0]!.motionId).toBe(result.motions[0]!.id);
    expect(result.motions[0]!.periodDays).toBe(107);
    expect(Object.isFrozen(result.planets[0])).toBe(true);
    expect(Object.isFrozen(result.orbits)).toBe(true);
    expect(systemScenePlanetFicheRoute(snapshot, result.planets[0]!.id)).toBeNull();
    expect(snapshot.planets).toHaveLength(0); // No change to frozen phase-18 planet ordinals.
  });

  it('refuses disclosure before cataloguing or outside the supported V2 SINGLE host', () => {
    expect(() => projectPulsarSecondGenerationPlanets(population,
      { ...snapshot, knowledgeLevel: 'DISCOVERED' } as unknown as SystemSceneSnapshot)).toThrow(RangeError);
    expect(() => projectPulsarSecondGenerationPlanets(population,
      { ...snapshot, generatorVersionCode: 1 } as SystemSceneSnapshot)).toThrow(RangeError);
    expect(() => projectPulsarSecondGenerationPlanets(population,
      { ...snapshot, multiplicityName: 'BINARY' } as SystemSceneSnapshot)).toThrow(RangeError);
  });
});
