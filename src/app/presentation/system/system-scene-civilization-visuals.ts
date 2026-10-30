import { type Vida7CivilizationTier } from '../../domain/life/vida7-intelligence-civilizations';
import type { SystemScenePlanetVegetationProfileV1 } from './system-scene-planet-surface-texture';
import type { SystemSceneBodySnapshot, SystemSceneSnapshot } from './system-scene-snapshot';

export function decorateSystemSceneSnapshotWithCivilizationTiers(
  snapshot: SystemSceneSnapshot,
  tiersByBodyIndex: ReadonlyMap<string, SystemSceneCivilizationVisualRecord>,
): SystemSceneSnapshot {
  if (tiersByBodyIndex.size === 0) {
    return snapshot;
  }

  let changed = false;
  const stars = snapshot.stars.map(star => star);
  const planets = snapshot.planets.map(planet => {
    const bodyIndex = bodyIndexForPlanet(snapshot, planet.id);
    const record = bodyIndex === null ? undefined : tiersByBodyIndex.get(bodyIndex);
    const tier = record?.tier ?? null;
    const vegetationProfile = record?.vegetationProfile ?? null;
    if ((planet.visualCivilizationTier ?? null) === tier &&
        (planet.visualVegetationProfile ?? null) === vegetationProfile) {
      return planet;
    }
    changed = true;
    return Object.freeze({
      ...planet,
      visualCivilizationTier: tier,
      visualVegetationProfile: vegetationProfile,
    });
  });

  if (!changed) {
    return snapshot;
  }

  return Object.freeze({
    ...snapshot,
    stars: Object.freeze(stars),
    planets: Object.freeze(planets),
  });
}

export function bodyIndexForPlanet(
  snapshot: SystemSceneSnapshot,
  sceneBodyId: string,
): string | null {
  const mapped = snapshot.scientificPlanetBindings;
  if (mapped !== undefined) {
    const entry = mapped.find(binding => binding.sceneBodyId === sceneBodyId);
    return entry?.bodyIndex ?? null;
  }

  const match = /^planet-([1-9]\d*)$/.exec(sceneBodyId);
  if (!match) {
    return null;
  }

  return (BigInt(match[1]!) - 1n).toString();
}

export interface SystemSceneCivilizationVisualRecord {
  readonly bodyIndex: string;
  readonly tier: Vida7CivilizationTier;
  readonly vegetationProfile?: SystemScenePlanetVegetationProfileV1 | null;
}

export function civilizationVisualMapOf(
  records: readonly SystemSceneCivilizationVisualRecord[],
): ReadonlyMap<string, SystemSceneCivilizationVisualRecord> {
  const map = new Map<string, SystemSceneCivilizationVisualRecord>();
  for (const record of records) {
    map.set(record.bodyIndex, record);
  }
  return map;
}

export function withPlanetCivilizationTier(
  planet: SystemSceneBodySnapshot,
  tier: Vida7CivilizationTier | null,
): SystemSceneBodySnapshot {
  return Object.freeze({
    ...planet,
    visualCivilizationTier: tier,
  });
}
