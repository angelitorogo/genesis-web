import { ArchiveStellarSystemKnowledgeLevel } from '../genesis-archive/archive-stellar-system-card';
import type { Vida38InfrastructurePlan386 } from '../infrastructure/vida38-infrastructure-plan-38-6';
import { type Vida7CivilizationTier } from '../../domain/life/vida7-intelligence-civilizations';
import type { SystemScenePlanetVegetationProfileV1 } from './system-scene-planet-surface-texture';
import type { SystemSceneBodySnapshot, SystemSceneSnapshot } from './system-scene-snapshot';

function sceneRecord386(snapshot:SystemSceneSnapshot,
  record:SystemSceneCivilizationVisualRecord|undefined,
  bodyIndex:string,moonIndex:string|null):SystemSceneCivilizationVisualRecord|undefined {
  if (!record) return undefined;
  if (record.universeSeed !== undefined && record.universeSeed !== snapshot.universeSeed) return undefined;
  if (record.generatorVersionCode !== undefined && record.generatorVersionCode !== snapshot.generatorVersionCode) return undefined;
  if (record.systemKey !== undefined && record.systemKey !==
      [snapshot.address.galaxyIndex,snapshot.address.sectorKey,snapshot.address.galacticObjectIndex].join('/')) return undefined;
  const expected = snapshot.address === undefined ? null :
    [snapshot.address.galaxyIndex,snapshot.address.sectorKey,snapshot.address.galacticObjectIndex,
      bodyIndex,moonIndex === null ? 'PLANET':'MOON',moonIndex ?? '-'].join(':');
  if (expected !== null && record.infrastructurePlans?.some(p=>p.bodyStorageKey!==expected)) return undefined;
  return record;
}

export function decorateSystemSceneSnapshotWithCivilizationTiers(
  snapshot: SystemSceneSnapshot,
  tiersByBodyIndex: ReadonlyMap<string, SystemSceneCivilizationVisualRecord>,
): SystemSceneSnapshot {
  // A stale asynchronous read must never decorate another or unconfirmed scene.
  if (snapshot.knowledgeLevel !== undefined &&
      snapshot.knowledgeLevel !== ArchiveStellarSystemKnowledgeLevel.CONFIRMED) return snapshot;
  if (tiersByBodyIndex.size === 0) {
    return snapshot;
  }

  let changed = false;
  const stars = snapshot.stars.map(star => star);
  const planets = snapshot.planets.map(planet => {
    const bodyIndex = bodyIndexForPlanet(snapshot, planet.id);
    const record = bodyIndex === null ? undefined : sceneRecord386(snapshot,tiersByBodyIndex.get(bodyIndex),bodyIndex,null);
    const tier = record?.tier ?? null;
    const vegetationProfile = record?.vegetationProfile ?? null;
    const infrastructurePlans = record?.infrastructurePlans ?? null;
    if ((planet.visualCivilizationTier ?? null) === tier &&
        (planet.visualVegetationProfile ?? null) === vegetationProfile &&
        (planet.visualInfrastructurePlans ?? null) === infrastructurePlans) {
      return planet;
    }
    changed = true;
    return Object.freeze({
      ...planet,
      visualCivilizationTier: tier,
      visualVegetationProfile: vegetationProfile,
      visualInfrastructurePlans: infrastructurePlans ?? undefined,
    });
  });

  const moons = (snapshot.moons ?? []).map(moon => {
    const binding = snapshot.scientificMoonBindings?.find(entry => entry.sceneBodyId === moon.id);
    const legacyOrdinal = /^moon-\d+-(\d+)$/.exec(moon.id);
    const bodyIndex = binding?.bodyIndex ?? (snapshot.scientificMoonBindings === undefined
      ? bodyIndexForPlanet(snapshot,moon.hostPlanetId) : null);
    const moonIndex = binding?.moonIndex ?? (snapshot.scientificMoonBindings === undefined && legacyOrdinal
      ? (BigInt(legacyOrdinal[1]!) - 1n).toString() : null);
    const record = bodyIndex === null || moonIndex === null ? undefined
      : sceneRecord386(snapshot,tiersByBodyIndex.get(`${bodyIndex}:MOON:${moonIndex}`),bodyIndex,moonIndex);
    const plans = record?.infrastructurePlans ?? null;
    if ((moon.visualInfrastructurePlans ?? null) === plans) return moon;
    changed = true;
    return Object.freeze({...moon,visualInfrastructurePlans:plans ?? undefined});
  });
  if (!changed) return snapshot;
  return Object.freeze({...snapshot,stars:Object.freeze(stars),
    planets:Object.freeze(planets),moons:Object.freeze(moons)});
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
  readonly universeSeed?: string;
  readonly generatorVersionCode?: number;
  readonly systemKey?: string;
  readonly moonIndex?: string | null;
  readonly tier: Vida7CivilizationTier | null;
  readonly infrastructurePlans?: readonly Vida38InfrastructurePlan386[];
  readonly vegetationProfile?: SystemScenePlanetVegetationProfileV1 | null;
}

export function civilizationVisualMapOf(
  records: readonly SystemSceneCivilizationVisualRecord[],
): ReadonlyMap<string, SystemSceneCivilizationVisualRecord> {
  const map = new Map<string, SystemSceneCivilizationVisualRecord>();
  for (const record of records) {
    map.set(record.moonIndex === null || record.moonIndex === undefined
      ? record.bodyIndex : `${record.bodyIndex}:MOON:${record.moonIndex}`, record);
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
