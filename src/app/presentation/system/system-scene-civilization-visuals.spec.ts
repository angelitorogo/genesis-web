import { ArchiveStellarSystemKnowledgeLevel } from '../genesis-archive/archive-stellar-system-card';
import {
  bodyIndexForPlanet,
  civilizationVisualMapOf,
  decorateSystemSceneSnapshotWithCivilizationTiers,
} from './system-scene-civilization-visuals';
import type { SystemSceneSnapshot } from './system-scene-snapshot';

function snapshotFixture(): SystemSceneSnapshot {
  return Object.freeze({
    universeSeed: 'seed',
    generatorVersionCode: 3,
    address: Object.freeze({ galaxyIndex: 0n, sectorKey: 0n, galacticObjectIndex: 0n }),
    proceduralIdentity: 'sys',
    title: 'Sistema',
    discoveryStateCode: 4,
    discoveryStateLabel: 'Confirmado',
    knowledgeLevel: ArchiveStellarSystemKnowledgeLevel.CONFIRMED,
    multiplicityName: 'SINGLE',
    componentCount: 1,
    accessibleLabel: 'Sistema',
    stars: Object.freeze([]),
    planets: Object.freeze([
      Object.freeze({
        id: 'planet-1',
        kind: 'planet' as const,
        label: 'b',
        title: 'Planeta b',
        colorHex: '#8899AA',
        radiusScene: 1,
        position: Object.freeze({ x: 0, y: 0, z: 0 }),
        orbitId: null,
        motionContributions: Object.freeze([]),
        surfaceStyle: 'rocky' as const,
        lightIntensity: 1,
        sourceLuminositySolar: null,
        spin: Object.freeze({ periodDays: 1, axialTiltDegrees: 0, retrograde: false }),
        surfaceEnvironment: null,
        giantAtmosphere: null,
        specialPresentation: null,
      }),
      Object.freeze({
        id: 'planet-2',
        kind: 'planet' as const,
        label: 'c',
        title: 'Planeta c',
        colorHex: '#8899AA',
        radiusScene: 1,
        position: Object.freeze({ x: 0, y: 0, z: 0 }),
        orbitId: null,
        motionContributions: Object.freeze([]),
        surfaceStyle: 'rocky' as const,
        lightIntensity: 1,
        sourceLuminositySolar: null,
        spin: Object.freeze({ periodDays: 1, axialTiltDegrees: 0, retrograde: false }),
        surfaceEnvironment: null,
        giantAtmosphere: null,
        specialPresentation: null,
      }),
    ]),
    moons: Object.freeze([]),
    minorBodies: Object.freeze([]),
    orbits: Object.freeze([]),
    guides: Object.freeze([]),
    orbitalMotion: Object.freeze([]),
    habitableZones: Object.freeze([]),
  } as unknown as SystemSceneSnapshot);
}

describe('VISCIV.1a system-scene civilization visuals', () => {
  it('maps historical single-host planet ids to zero-based body indices', () => {
    const snapshot = snapshotFixture();
    expect(bodyIndexForPlanet(snapshot, 'planet-1')).toBe('0');
    expect(bodyIndexForPlanet(snapshot, 'planet-2')).toBe('1');
    expect(bodyIndexForPlanet(snapshot, 'not-a-planet')).toBeNull();
  });

  it('uses explicit bindings when multihost scientific mappings exist', () => {
    const snapshot = Object.freeze({
      ...snapshotFixture(),
      scientificPlanetBindings: Object.freeze([
        Object.freeze({ sceneBodyId: 'planet-alpha', bodyIndex: '7' }),
      ]),
      planets: Object.freeze([
        Object.freeze({ ...(snapshotFixture().planets[0] as object), id: 'planet-alpha' }),
      ]),
    }) as SystemSceneSnapshot;

    expect(bodyIndexForPlanet(snapshot, 'planet-alpha')).toBe('7');
  });

  it('decorates only the planets with revealed civilization tiers', () => {
    const base = snapshotFixture();
    const vegetationProfile = Object.freeze({
      coverageFraction01: 0.72,
      lushness01: 0.82,
      floraSpeciesCount: 5,
      paletteHexes: Object.freeze(['#79B05F', '#B8C45A']),
      paletteEntries: Object.freeze([
        Object.freeze({ hex: '#79B05F', weight01: 0.7 }),
        Object.freeze({ hex: '#B8C45A', weight01: 0.3 }),
      ]),
    });
    const tiers = civilizationVisualMapOf([
      Object.freeze({ bodyIndex: '1', tier: 'VERY_ADVANCED' as const, vegetationProfile }),
    ]);

    const decorated = decorateSystemSceneSnapshotWithCivilizationTiers(base, tiers);
    expect(decorated.planets[0]!.visualCivilizationTier ?? null).toBeNull();
    expect(decorated.planets[1]!.visualCivilizationTier).toBe('VERY_ADVANCED');
    expect(decorated.planets[1]!.visualVegetationProfile).toBe(vegetationProfile);
    expect(decorated.planets[0]!.visualVegetationProfile ?? null).toBeNull();
    expect(decorated).not.toBe(base);
  });
});
