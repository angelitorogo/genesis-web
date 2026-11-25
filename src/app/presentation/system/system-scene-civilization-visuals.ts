import { type Vida7CivilizationTier } from '../../domain/life/vida7-intelligence-civilizations';
import { ArchiveStellarSystemKnowledgeLevel } from '../genesis-archive/archive-stellar-system-card';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import type { SystemScenePlanetVegetationProfileV1 } from './system-scene-planet-surface-texture';
import type { Vida38InfrastructurePlan386 } from '../infrastructure/vida38-infrastructure-plan-38-6';
import type { SystemSceneBodySnapshot, SystemSceneSnapshot } from './system-scene-snapshot';

/** 38.7x: independent key for a moon. Never overwrite its parent planet's
 * biology when both have VIDA.9 records with the same bodyIndex. */
export function systemSceneMoonVisualKey387x(bodyIndex: string, moonIndex: string): string {
  return `${bodyIndex}:MOON:${moonIndex}`;
}

/** Fail closed on a non-confirmed or stale scene, including infrastructure. */
export function stripSystemSceneBiologyVisuals387(snapshot: SystemSceneSnapshot): SystemSceneSnapshot {
  let leaked = false;
  const safePlanets = snapshot.planets.map(planet => {
    if ((planet.visualCivilizationTier ?? null) === null &&
        (planet.visualVegetationProfile ?? null) === null &&
        (planet.visualInfrastructurePlans?.length ?? 0) === 0) return planet;
    leaked = true;
    return Object.freeze({
      ...planet,
      visualCivilizationTier: null,
      visualVegetationProfile: null,
      visualInfrastructurePlans: Object.freeze([]),
    });
  });
  const safeMoons = snapshot.moons.map(moon => {
    if ((moon.visualInfrastructurePlans?.length ?? 0) === 0) return moon;
    leaked = true;
    return Object.freeze({ ...moon, visualInfrastructurePlans: Object.freeze([]) });
  });
  return leaked ? Object.freeze({
    ...snapshot, planets: Object.freeze(safePlanets), moons: Object.freeze(safeMoons),
  }) : snapshot;
}

/** Never merge a record belonging to another system or universe. */
export function systemSceneVisualRecordAuthorized387x(
  record: SystemSceneCivilizationVisualRecord,
  snapshot: SystemSceneSnapshot,
): boolean {
  return (record.universeSeed === undefined || record.universeSeed === snapshot.universeSeed) &&
    (record.generatorVersionCode === undefined ||
      record.generatorVersionCode === snapshot.generatorVersionCode) &&
    (record.systemKey === undefined || record.systemKey ===
      `${snapshot.address.galaxyIndex}/${snapshot.address.sectorKey}/${snapshot.address.galacticObjectIndex}`);
}

export function decorateSystemSceneSnapshotWithCivilizationTiers(
  snapshot: SystemSceneSnapshot,
  tiersByBodyIndex: ReadonlyMap<string, SystemSceneCivilizationVisualRecord>,
): SystemSceneSnapshot {
  if (snapshot.knowledgeLevel !== ArchiveStellarSystemKnowledgeLevel.CONFIRMED ||
      snapshot.discoveryStateCode !== DiscoveryState.CONFIRMED.code) {
    return stripSystemSceneBiologyVisuals387(snapshot);
  }

  if (tiersByBodyIndex.size === 0) return snapshot;

  let changed = false;
  const planets = snapshot.planets.map(planet => {
    const bodyIndex = bodyIndexForPlanet(snapshot, planet.id);
    const candidate = bodyIndex === null ? undefined : tiersByBodyIndex.get(bodyIndex);
    const record = candidate && systemSceneVisualRecordAuthorized387x(candidate, snapshot)
      ? candidate : undefined;
    const tier = record?.tier ?? null;
    const vegetationProfile = record?.vegetationProfile ?? null;
    const infrastructurePlans = record?.infrastructurePlans ?? Object.freeze([]);
    if ((planet.visualCivilizationTier ?? null) === tier &&
        (planet.visualVegetationProfile ?? null) === vegetationProfile &&
        (planet.visualInfrastructurePlans ?? null) === (record?.infrastructurePlans ?? null)) {
      return planet;
    }
    changed = true;
    return Object.freeze({
      ...planet,
      visualCivilizationTier: tier,
      visualVegetationProfile: vegetationProfile,
      visualInfrastructurePlans: infrastructurePlans,
    });
  });
  const moons = snapshot.moons.map(moon => {
    const moonBinding = bodyIndicesForMoon387x(snapshot, moon.id);
    const candidate = moonBinding === null ? undefined : tiersByBodyIndex.get(
      systemSceneMoonVisualKey387x(moonBinding.bodyIndex, moonBinding.moonIndex),
    );
    const record = candidate && systemSceneVisualRecordAuthorized387x(candidate, snapshot)
      ? candidate : undefined;
    const infrastructurePlans = record?.infrastructurePlans ?? Object.freeze([]);
    if ((moon.visualInfrastructurePlans ?? null) === (record?.infrastructurePlans ?? null)) return moon;
    changed = true;
    return Object.freeze({ ...moon, visualInfrastructurePlans: infrastructurePlans });
  });

  return changed ? Object.freeze({
    ...snapshot, planets: Object.freeze(planets), moons: Object.freeze(moons),
  }) : snapshot;
}

/** The same binding/legacy rules as the moon scientific route. */
export function bodyIndicesForMoon387x(
  snapshot: SystemSceneSnapshot, sceneBodyId: string,
): Readonly<{bodyIndex: string; moonIndex: string}> | null {
  if (snapshot.scientificMoonBindings !== undefined) {
    const matching = snapshot.scientificMoonBindings.filter(binding => binding.sceneBodyId === sceneBodyId);
    return matching.length === 1 ? Object.freeze({
      bodyIndex: matching[0]!.bodyIndex, moonIndex: matching[0]!.moonIndex,
    }) : null;
  }
  if (snapshot.scientificPlanetBindings !== undefined) return null;
  const match = /^moon-([1-9]\d*)-([1-9]\d*)$/.exec(sceneBodyId);
  if (!match) return null;
  return Object.freeze({
    bodyIndex: (BigInt(match[1]!) - 1n).toString(),
    moonIndex: (BigInt(match[2]!) - 1n).toString(),
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
  /** Null is a confirmed biosphere without a VIDA.7 civilization. */
  readonly tier: Vida7CivilizationTier | null;
  readonly vegetationProfile?: SystemScenePlanetVegetationProfileV1 | null;
  /** 38.6: optional provenance of the confirmed system. Older fixtures omit it. */
  readonly universeSeed?: string;
  readonly generatorVersionCode?: number;
  readonly systemKey?: string;
  /** Null identifies a planet; a string identifies a moon of bodyIndex. */
  readonly moonIndex?: string | null;
  /** VIDA.7 / VIDA.8-backed infrastructure, never inferred from a signal. */
  readonly infrastructurePlans?: readonly Vida38InfrastructurePlan386[];
}

export function civilizationVisualMapOf(
  records: readonly SystemSceneCivilizationVisualRecord[],
): ReadonlyMap<string, SystemSceneCivilizationVisualRecord> {
  const map = new Map<string, SystemSceneCivilizationVisualRecord>();
  for (const record of records) {
    map.set(record.moonIndex === null || record.moonIndex === undefined
      ? record.bodyIndex
      : systemSceneMoonVisualKey387x(record.bodyIndex, record.moonIndex), record);
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
