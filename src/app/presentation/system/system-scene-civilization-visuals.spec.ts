import { ArchiveStellarSystemKnowledgeLevel } from '../genesis-archive/archive-stellar-system-card';
import {
  bodyIndexForPlanet,
  civilizationVisualMapOf,
  decorateSystemSceneSnapshotWithCivilizationTiers,
  stripSystemSceneBiologyVisuals387,
} from './system-scene-civilization-visuals';
import type { SystemSceneSnapshot } from './system-scene-snapshot';

function snapshotFixture(): SystemSceneSnapshot {
  return Object.freeze({
    universeSeed: 'seed',
    generatorVersionCode: 3,
    address: Object.freeze({ galaxyIndex: 0n, sectorKey: 0n, galacticObjectIndex: 0n }),
    proceduralIdentity: 'sys',
    title: 'Sistema',
    discoveryStateCode: 5,
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

  it('retains confirmed vegetation when VIDA.7 has no civilization, without inventing one', () => {
    const profile = Object.freeze({
      coverageFraction01: .25, lushness01: .42, floraSpeciesCount: 3,
      paletteHexes: Object.freeze(['#668A5B']),
    });
    const biospheres = civilizationVisualMapOf([
      { bodyIndex: '0', tier: null, vegetationProfile: profile },
    ]);
    const actual = decorateSystemSceneSnapshotWithCivilizationTiers(snapshotFixture(), biospheres);
    expect(actual.planets[0]!.visualCivilizationTier ?? null).toBeNull();
    expect(actual.planets[0]!.visualVegetationProfile).toBe(profile);
  });

  it('blocks even a vegetation-only record when a planet is not confirmed', () => {
    const base = snapshotFixture();
    const discovered = Object.freeze({ ...base,
      knowledgeLevel: ArchiveStellarSystemKnowledgeLevel.CATALOGUED,
      discoveryStateCode: 4,
    });
    const biospheres = civilizationVisualMapOf([
      { bodyIndex: '0', tier: null, vegetationProfile: {
        coverageFraction01: .1, lushness01: .3, floraSpeciesCount: 1,
        paletteHexes: ['#668A5B'],
      } },
    ]);
    const actual = decorateSystemSceneSnapshotWithCivilizationTiers(discovered, biospheres);
    expect(actual.planets[0]!.visualCivilizationTier ?? null).toBeNull();
    expect(actual.planets[0]!.visualVegetationProfile ?? null).toBeNull();
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

/** 38.7: a discovered or catalogued system cannot inherit any biological
 * presentation from stale cached visuals, even when a previous system was
 * confirmed and had a genuine civilization. */
describe('GENESIS 38.7 — no filtración biológica en SystemScene', () => {
  const confirmedMap = () => civilizationVisualMapOf([
    { bodyIndex: '0', tier: 'ADVANCED', vegetationProfile: {
      coverageFraction01: 0.66, lushness01: 0.75, floraSpeciesCount: 4,
      paletteHexes: ['#76b356'],
    } },
  ]);

  for (const level of [
    ArchiveStellarSystemKnowledgeLevel.DETECTED,
    ArchiveStellarSystemKnowledgeLevel.IDENTIFIED,
    ArchiveStellarSystemKnowledgeLevel.CATALOGUED,
  ]) {
    it(`does not reveal planet biology or city lights at knowledge level ${level}`, () => {
      const base = snapshotFixture();
      const suspectSnapshot = Object.freeze({
        ...base,
        knowledgeLevel: level,
        planets: Object.freeze(base.planets.map((planet, index) => index === 0
          ? Object.freeze({ ...planet, visualCivilizationTier: 'ADVANCED' as const,
            visualVegetationProfile: confirmedMap().get('0')?.vegetationProfile })
          : planet)),
      });
      const filtered = decorateSystemSceneSnapshotWithCivilizationTiers(suspectSnapshot, confirmedMap());
      expect(filtered.planets[0]!.visualCivilizationTier ?? null).toBeNull();
      expect(filtered.planets[0]!.visualVegetationProfile ?? null).toBeNull();
      expect(filtered.planets[1]!.visualCivilizationTier ?? null).toBeNull();
    });
  }

  it('does not disclose a civilization from a signal alone', () => {
    const base = Object.freeze({ ...snapshotFixture(),
      knowledgeLevel: ArchiveStellarSystemKnowledgeLevel.CATALOGUED,
    });
    // A technosignature is not an authorization to render any species or city.
    const result = decorateSystemSceneSnapshotWithCivilizationTiers(base, confirmedMap());
    expect(result.planets.every(p => (p.visualCivilizationTier ?? null) === null &&
      (p.visualVegetationProfile ?? null) === null)).toBe(true);
  });

  it('keeps the original scene snapshot unchanged after sanitizing', () => {
    const base = snapshotFixture();
    const originalPlanet = { ...base.planets[0]!, visualCivilizationTier: 'ADVANCED' as const };
    const snapshot = Object.freeze({ ...base,
      knowledgeLevel: ArchiveStellarSystemKnowledgeLevel.CATALOGUED,
      planets: Object.freeze([Object.freeze(originalPlanet), base.planets[1]!]),
    });
    decorateSystemSceneSnapshotWithCivilizationTiers(snapshot, confirmedMap());
    expect(snapshot.planets[0]!.visualCivilizationTier).toBe('ADVANCED');
  });
});

describe('GENESIS 38.7 — fail-closed even for a stale CONFIRMED scene', () => {
  it('removes civilization/vegetation until the exact async system identity is authorized', () => {
    const previous = snapshotFixture();
    const withCivilization = Object.freeze({ ...previous,
      planets: Object.freeze(previous.planets.map(p => Object.freeze({ ...p,
        visualCivilizationTier: 'ADVANCED' as const,
        visualVegetationProfile: { floraSpeciesCount: 2, coverageFraction01: .5,
          lushness01: .6, paletteHexes: ['#48af60'] },
      }))),
    });
    const safe = stripSystemSceneBiologyVisuals387(withCivilization);
    expect(safe.planets.every(p => (p.visualCivilizationTier ?? null) === null &&
      (p.visualVegetationProfile ?? null) === null)).toBe(true);
    expect(withCivilization.planets[0]!.visualCivilizationTier).toBe('ADVANCED');
  });
});
