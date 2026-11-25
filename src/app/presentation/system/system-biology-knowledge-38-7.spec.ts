import { ArchiveStellarSystemKnowledgeLevel } from '../genesis-archive/archive-stellar-system-card';
import type { SystemSceneSnapshot } from './system-scene-snapshot';
import { civilizationVisualMapOf, decorateSystemSceneSnapshotWithCivilizationTiers, stripSystemSceneBiologyVisuals387 } from './system-scene-civilization-visuals';
import { systemSceneBiologyIdentity387 } from './system';

/** Real knowledge never comes from a technosignature-only alert or a cached
 * visualization from another system; the same applies to vegetation profiles. */
function fixture(level: ArchiveStellarSystemKnowledgeLevel): SystemSceneSnapshot {
  return Object.freeze({
    knowledgeLevel: level,
    discoveryStateCode: level === ArchiveStellarSystemKnowledgeLevel.CONFIRMED ? 5 : 4,
    moons: Object.freeze([]),
    planets: Object.freeze([
      Object.freeze({
        id: 'planet-1',
        visualCivilizationTier: 'ADVANCED',
        visualVegetationProfile: Object.freeze({
          floraSpeciesCount: 3, coverageFraction01: .55, lushness01: .6,
          paletteHexes: Object.freeze(['#5a8a42']),
        }),
      }),
    ]),
  }) as unknown as SystemSceneSnapshot;
}

describe('GENESIS 38.7 — aislamiento entre niveles de conocimiento y sistemas', () => {
  const visuals = civilizationVisualMapOf([
    { bodyIndex: '0', tier: 'VERY_ADVANCED', vegetationProfile: {
      floraSpeciesCount: 9, coverageFraction01: .7, lushness01: .8, paletteHexes: ['#426b50'],
    } },
  ]);

  for (const level of [
    ArchiveStellarSystemKnowledgeLevel.DETECTED,
    ArchiveStellarSystemKnowledgeLevel.IDENTIFIED,
    ArchiveStellarSystemKnowledgeLevel.CATALOGUED,
  ]) {
    it(`blocks stale biology and cities for ${level}`, () => {
      const snapshot = fixture(level);
      const safe = decorateSystemSceneSnapshotWithCivilizationTiers(snapshot, visuals);
      expect(safe.planets[0]!.visualCivilizationTier ?? null).toBeNull();
      expect(safe.planets[0]!.visualVegetationProfile ?? null).toBeNull();
      expect(snapshot.planets[0]!.visualCivilizationTier).toBe('ADVANCED');
    });
  }

  it('fails closed if the scene claims CONFIRMED but persisted discovery is only CATALOGUED', () => {
    const scene = Object.freeze({ ...fixture(ArchiveStellarSystemKnowledgeLevel.CONFIRMED),
      discoveryStateCode: 4 });
    const safe = decorateSystemSceneSnapshotWithCivilizationTiers(scene, visuals);
    expect(safe.planets[0]!.visualCivilizationTier ?? null).toBeNull();
    expect(safe.planets[0]!.visualVegetationProfile ?? null).toBeNull();
  });

  it('strips stale biological visuals even if the previous snapshot was confirmed', () => {
    const prior = fixture(ArchiveStellarSystemKnowledgeLevel.CONFIRMED);
    const safe = stripSystemSceneBiologyVisuals387(prior);
    expect(safe.planets[0]!.visualCivilizationTier ?? null).toBeNull();
    expect(safe.planets[0]!.visualVegetationProfile ?? null).toBeNull();
  });

  it('does not reveal anything if a technosignature is present but confirmation is absent', () => {
    const snapshot = fixture(ArchiveStellarSystemKnowledgeLevel.CATALOGUED);
    // Injected visualization data behaves exactly as if a stale 37 signal
    // incorrectly supplied a civilization tier to the renderer.
    const safe = decorateSystemSceneSnapshotWithCivilizationTiers(snapshot, visuals);
    expect(safe.planets[0]!.visualCivilizationTier ?? null).toBeNull();
  });

  it('binds async VIDA.9 projection to the exact seed/version/galaxy/sector/system', () => {
    const source = Object.freeze({ universeSeed: 'SEED', generatorVersionCode: 3,
      galaxyIndex: 1n, sectorKey: 4n, galacticObjectIndex: 7n });
    const expected = systemSceneBiologyIdentity387(source);
    expect(expected).not.toBeNull();
    expect(systemSceneBiologyIdentity387({ ...source, galacticObjectIndex: 8n })).not.toBe(expected);
    expect(systemSceneBiologyIdentity387({ ...source, sectorKey: 5n })).not.toBe(expected);
    expect(systemSceneBiologyIdentity387({ ...source, galaxyIndex: 2n })).not.toBe(expected);
    expect(systemSceneBiologyIdentity387({ ...source, generatorVersionCode: 2 })).not.toBe(expected);
    expect(systemSceneBiologyIdentity387({ ...source, universeSeed: 'OTHER' })).not.toBe(expected);
    expect(systemSceneBiologyIdentity387(null)).toBeNull();
  });
});
