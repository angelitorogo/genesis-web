import { InjectionToken } from '@angular/core';

import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { type KnownDiscovery } from '../../domain/discovery/known-discovery';
import {
  BodyLocator,
  MoonLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { moonRomanNumeralV1 } from '../../domain/planetary/moon-designation';
import { type MoonWaterRegime } from '../../domain/planetary/moon-water-regime';
import { type PlanetType } from '../../domain/planetary/planet-type';
import { GenesisIndexedDb } from '../../data/local/indexed-db/genesis-indexed-db';
import { type GalaxyKnowledgeSnapshotEntity } from '../../data/local/entity/galaxy-knowledge-snapshot.entity';
import {
  DexieGalaxyKnowledgeSnapshotRepository,
  type GalaxyKnowledgeSnapshotRepository,
} from '../../data/local/repository/dexie-galaxy-knowledge-snapshot.repository';
import {
  StellarMultihostFormation,
  type GeneratedMultipleHost,
  type GeneratedPublicPlanet,
  type GeneratedSingleHost,
} from '../../simulation/stellar/stellar-multihost-formation';
import { StellarMultihostPublicTargetIndex } from '../../simulation/stellar/stellar-multihost-public-target-index';
import { StellarDesignationGenerator } from '../../simulation/stellar/stellar-designation-generator';
import { multihostPhysicalSourceKey } from '../../simulation/stellar/stellar-multihost-physical-source-key';
import {
  stellarMultihostPublicMoonDesignation,
  stellarMultihostPublicPlanetDesignation,
} from '../../simulation/stellar/stellar-multihost-public-designation';
import {
  GALAXY_SCIENTIFIC_MODEL_VERSION,
  galaxyKnowledgeRevision,
  parseBigIntTree,
  stringifyBigIntTree,
} from './galaxy-knowledge-snapshot.runtime';

export type GalaxyKnowledgePlanetCatalogSubtype =
  | PlanetType
  | 'POST_COLLAPSE_MODEL'
  | 'UNCLASSIFIED';

export type GalaxyKnowledgeMoonComposition =
  | 'ROCKY'
  | 'MIXED_ROCK_ICE'
  | 'ICY'
  | 'UNCLASSIFIED';

export interface GalaxyKnowledgePlanetCatalogEntry {
  readonly id: string;
  readonly locator: BodyLocator | null;
  readonly parentSystemLocator: SystemLocator;
  readonly designation: string;
  readonly systemDesignation: string | null;
  readonly stateName: string;
  readonly subtype: GalaxyKnowledgePlanetCatalogSubtype;
  readonly hostLabel: string | null;
  readonly orbitClass: 'SINGLE_HOST' | 'S_TYPE' | 'P_TYPE' | 'POST_COLLAPSE_MODEL' | null;
  readonly massEarth: number | null;
  readonly radiusEarth: number | null;
  readonly semiMajorAxisAu: number | null;
  readonly orbitalPeriodDays: number | null;
  readonly meanSurfaceTemperatureKelvin: number | null;
  readonly surfaceLiquidWaterCoverageFraction01: number | null;
  readonly postCollapseIdentityHex: string | null;
}

export interface GalaxyKnowledgeMoonCatalogEntry {
  readonly id: string;
  readonly locator: MoonLocator;
  readonly parentSystemLocator: SystemLocator;
  readonly designation: string;
  readonly hostPlanetDesignation: string;
  readonly systemDesignation: string;
  readonly stateName: string;
  readonly composition: GalaxyKnowledgeMoonComposition;
  readonly hostLabel: string;
  readonly orbitClass: 'SINGLE_HOST' | 'S_TYPE' | 'P_TYPE';
  readonly massEarth: number;
  readonly radiusEarth: number;
  readonly orbitalPeriodDays: number;
  readonly inferredIceRichnessIndex01: number;
  readonly surfaceLiquidWaterPotentialIndex01: number;
  readonly subsurfaceOceanPotentialIndex01: number;
  readonly waterRegime: MoonWaterRegime;
}

export interface GalaxyKnowledgePlanetMoonCatalogSnapshot {
  readonly galaxyIndex: bigint;
  readonly planets: readonly GalaxyKnowledgePlanetCatalogEntry[];
  readonly moons: readonly GalaxyKnowledgeMoonCatalogEntry[];
  readonly unmaterializedMinorMoonCount: bigint;
}

export interface GalaxyPlanetMoonCatalogSnapshotRuntime {
  resolve(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    knownDiscoveries: readonly KnownDiscovery[],
  ): Promise<GalaxyKnowledgePlanetMoonCatalogSnapshot>;
}

export const GALAXY_PLANET_MOON_CATALOG_SNAPSHOT_RUNTIME =
  new InjectionToken<GalaxyPlanetMoonCatalogSnapshotRuntime>(
    'GALAXY_PLANET_MOON_CATALOG_SNAPSHOT_RUNTIME',
    {
      providedIn: 'root',
      factory: () => new DexieGalaxyPlanetMoonCatalogSnapshotRuntime(
        new DexieGalaxyKnowledgeSnapshotRepository(new GenesisIndexedDb()),
      ),
    },
  );

interface GalaxyPlanetMoonHotSnapshot {
  readonly generationKey: UniverseGenerationKey;
  readonly galaxyIndex: bigint;
  readonly knowledgeRevision: string;
  readonly snapshot: GalaxyKnowledgePlanetMoonCatalogSnapshot;
}

/**
 * Point-26.1c.3 derived read-model for listable planet/moon identities.
 *
 * The snapshot is knowledge-safe: only persisted CONFIRMED SystemLocators may
 * materialize their already-public planetary catalogue. Historical BodyLocator
 * discoveries outside such a parent remain listable but physically
 * unclassified, matching 26.1b telemetry. Unmaterialized minor moons remain an
 * aggregate count because the phase-21 model intentionally owns no individual
 * physical identity for them.
 */
export class DexieGalaxyPlanetMoonCatalogSnapshotRuntime
  implements GalaxyPlanetMoonCatalogSnapshotRuntime {

  private hotSnapshot: GalaxyPlanetMoonHotSnapshot | null = null;

  constructor(
    private readonly repository: GalaxyKnowledgeSnapshotRepository,
    private readonly clock: () => number = Date.now,
    private readonly builder: typeof buildGalaxyPlanetMoonCatalogSnapshot =
      buildGalaxyPlanetMoonCatalogSnapshot,
  ) {}

  async resolve(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    knownDiscoveries: readonly KnownDiscovery[],
  ): Promise<GalaxyKnowledgePlanetMoonCatalogSnapshot> {
    const knowledgeRevision = galaxyKnowledgeRevision(galaxyIndex, knownDiscoveries);
    if (
      this.hotSnapshot !== null &&
      this.hotSnapshot.galaxyIndex === galaxyIndex &&
      this.hotSnapshot.knowledgeRevision === knowledgeRevision &&
      this.hotSnapshot.generationKey.equals(generationKey)
    ) {
      return this.hotSnapshot.snapshot;
    }

    const existing = await this.repository.get(
      generationKey,
      galaxyIndex,
      GALAXY_SCIENTIFIC_MODEL_VERSION,
    );

    if (
      existing !== undefined &&
      existing.knowledgeRevision === knowledgeRevision &&
      existing.planetMoonCatalogJson !== undefined
    ) {
      const snapshot = restoreSnapshot(existing.planetMoonCatalogJson);
      this.hotSnapshot = Object.freeze({
        generationKey: generationKey.copy(),
        galaxyIndex,
        knowledgeRevision,
        snapshot,
      });
      return snapshot;
    }

    const snapshot = this.builder(generationKey, galaxyIndex, knownDiscoveries);
    const reusableExisting =
      existing !== undefined && existing.knowledgeRevision === knowledgeRevision
        ? existing
        : undefined;

    await this.repository.put({
      ...reusableExisting,
      universeSeed: generationKey.universeSeed.serialize(),
      generatorVersionCode: generationKey.generatorVersionCode,
      galaxyIndex: galaxyIndex.toString(10),
      scientificModelVersion: GALAXY_SCIENTIFIC_MODEL_VERSION,
      knowledgeRevision,
      planetMoonCatalogJson: stringifyBigIntTree(snapshot),
      updatedAtEpochMs: this.clock(),
    });

    this.hotSnapshot = Object.freeze({
      generationKey: generationKey.copy(),
      galaxyIndex,
      knowledgeRevision,
      snapshot,
    });
    return snapshot;
  }
}

export function buildGalaxyPlanetMoonCatalogSnapshot(
  generationKey: UniverseGenerationKey,
  galaxyIndex: bigint,
  knownDiscoveries: readonly KnownDiscovery[],
): GalaxyKnowledgePlanetMoonCatalogSnapshot {
  const systemDiscoveries = new Map<string, KnownDiscovery & { readonly locator: SystemLocator }>();
  const bodyDiscoveries: Array<KnownDiscovery & { readonly locator: BodyLocator }> = [];

  for (const discovery of knownDiscoveries) {
    if (!DiscoveryState.isKnown(discovery.state) || discovery.locator.galaxyIndex !== galaxyIndex) {
      continue;
    }
    if (discovery.locator instanceof SystemLocator) {
      systemDiscoveries.set(systemKey(discovery.locator), discovery as KnownDiscovery & { readonly locator: SystemLocator });
    } else if (discovery.locator instanceof BodyLocator) {
      bodyDiscoveries.push(discovery as KnownDiscovery & { readonly locator: BodyLocator });
    }
  }

  const planets: GalaxyKnowledgePlanetCatalogEntry[] = [];
  const moons: GalaxyKnowledgeMoonCatalogEntry[] = [];
  const projectedBodyKeys = new Set<string>();
  let unmaterializedMinorMoonCount = 0n;

  for (const discovery of systemDiscoveries.values()) {
    if (discovery.state.code < DiscoveryState.CONFIRMED.code) continue;

    const projection = projectConfirmedSystem(generationKey, discovery.locator);
    planets.push(...projection.planets);
    moons.push(...projection.moons);
    unmaterializedMinorMoonCount += projection.unmaterializedMinorMoonCount;

    for (const planet of projection.planets) {
      if (planet.locator !== null) projectedBodyKeys.add(bodyKey(planet.locator));
    }
  }

  for (const discovery of bodyDiscoveries) {
    if (projectedBodyKeys.has(bodyKey(discovery.locator))) continue;

    const parentSystemLocator = new SystemLocator(
      discovery.locator.galaxyIndex,
      discovery.locator.sectorKey,
      discovery.locator.galacticObjectIndex,
    );
    const parentDiscovery = systemDiscoveries.get(systemKey(parentSystemLocator));

    planets.push(Object.freeze({
      id: bodyLocatorLabel(discovery.locator),
      locator: discovery.locator,
      parentSystemLocator,
      designation: 'Planeta conocido',
      systemDesignation: parentDiscovery !== undefined && parentDiscovery.state.code >= DiscoveryState.DISCOVERED.code
        ? safeSystemDesignation(generationKey, parentSystemLocator)
        : null,
      stateName: discovery.state.name,
      subtype: 'UNCLASSIFIED' as const,
      hostLabel: null,
      orbitClass: null,
      massEarth: null,
      radiusEarth: null,
      semiMajorAxisAu: null,
      orbitalPeriodDays: null,
      meanSurfaceTemperatureKelvin: null,
      surfaceLiquidWaterCoverageFraction01: null,
      postCollapseIdentityHex: null,
    }));
  }

  planets.sort((left, right) => compareSystemThenPlanet(left.parentSystemLocator, left.id, right.parentSystemLocator, right.id));
  moons.sort((left, right) => compareSystemThenPlanet(left.parentSystemLocator, left.id, right.parentSystemLocator, right.id));

  return Object.freeze({
    galaxyIndex,
    planets: Object.freeze(planets),
    moons: Object.freeze(moons),
    unmaterializedMinorMoonCount,
  });
}

interface ProjectedSystemCatalog {
  readonly planets: readonly GalaxyKnowledgePlanetCatalogEntry[];
  readonly moons: readonly GalaxyKnowledgeMoonCatalogEntry[];
  readonly unmaterializedMinorMoonCount: bigint;
}

function projectConfirmedSystem(
  generationKey: UniverseGenerationKey,
  locator: SystemLocator,
): ProjectedSystemCatalog {
  const systemDesignation = safeSystemDesignation(generationKey, locator);
  const multiple = StellarMultihostFormation.generateOrNull(generationKey, locator);

  if (multiple !== null) {
    return projectMultipleSystem(systemDesignation, locator, multiple);
  }

  const single = StellarMultihostFormation.generateSingleOrNull(generationKey, locator);
  if (single === null) {
    throw new Error('CONFIRMED system could not resolve its physical host for 26.1c.3.');
  }
  return projectSingleSystem(systemDesignation, locator, single);
}

function projectSingleSystem(
  systemDesignation: string,
  locator: SystemLocator,
  single: GeneratedSingleHost,
): ProjectedSystemCatalog {
  const planets: GalaxyKnowledgePlanetCatalogEntry[] = [];
  const moons: GalaxyKnowledgeMoonCatalogEntry[] = [];
  let unmaterializedMinorMoonCount = 0n;

  for (let index = 0; index < single.planets.length; index += 1) {
    const planet = single.planets[index];
    const atmosphere = single.atmospheres[index];
    const moonSystem = single.moonSystems[index];
    if (
      planet === undefined ||
      atmosphere === undefined ||
      moonSystem === undefined ||
      atmosphere.hostPlanet !== planet ||
      moonSystem.hostPlanet !== planet
    ) {
      throw new Error('CONFIRMED SINGLE 26.1c.3 projection has inconsistent planet ordering.');
    }

    const publicLocator = new BodyLocator(
      locator.galaxyIndex,
      locator.sectorKey,
      locator.galacticObjectIndex,
      BigInt(index),
    );

    planets.push(projectStandardPlanet(
      publicLocator,
      locator,
      planet.designation.name,
      systemDesignation,
      'A',
      'SINGLE_HOST',
      planet,
      atmosphere,
    ));

    unmaterializedMinorMoonCount += BigInt(moonSystem.unmaterializedMinorMoonCount);
    for (const moon of moonSystem.relevantMoons) {
      moons.push(projectRelevantMoon(
        moon.identity.locator,
        locator,
        `${planet.designation.name} ${moonRomanNumeralV1(moon.moonOrdinal)}`,
        planet.designation.name,
        systemDesignation,
        'A',
        'SINGLE_HOST',
        moon,
      ));
    }
  }

  if (single.pulsarPlanetPopulation !== undefined && single.pulsarPlanetPopulation !== null) {
    for (const planet of single.pulsarPlanetPopulation.planets) {
      planets.push(Object.freeze({
        id: `PSG-${planet.identityHex}`,
        locator: null,
        parentSystemLocator: locator,
        designation: `PSG-${planet.identityHex.slice(0, 8)}`,
        systemDesignation,
        stateName: DiscoveryState.CONFIRMED.name,
        subtype: 'POST_COLLAPSE_MODEL' as const,
        hostLabel: 'A',
        orbitClass: 'POST_COLLAPSE_MODEL' as const,
        massEarth: planet.massEarth,
        radiusEarth: planet.radiusEarth,
        semiMajorAxisAu: planet.semiMajorAxisAu,
        orbitalPeriodDays: planet.orbitalPeriodDays,
        meanSurfaceTemperatureKelvin: null,
        surfaceLiquidWaterCoverageFraction01: null,
        postCollapseIdentityHex: planet.identityHex,
      }));
    }
  }

  return Object.freeze({
    planets: Object.freeze(planets),
    moons: Object.freeze(moons),
    unmaterializedMinorMoonCount,
  });
}

function projectMultipleSystem(
  systemDesignation: string,
  locator: SystemLocator,
  multiple: GeneratedMultipleHost,
): ProjectedSystemCatalog {
  const planets = multiple.publicPlanets.map(entry => projectMultiplePlanet(
    systemDesignation,
    locator,
    entry,
  ));
  const publicIndex = StellarMultihostPublicTargetIndex.build(multiple);
  const moons: GalaxyKnowledgeMoonCatalogEntry[] = [];

  let unmaterializedMinorMoonCount = 0n;
  for (const publicPlanet of multiple.publicPlanets) {
    unmaterializedMinorMoonCount += BigInt(publicPlanet.moonSystem.unmaterializedMinorMoonCount);
  }

  for (const publicMoon of publicIndex.moons) {
    const moon = publicMoon.relevantMoon;
    if (moon === null) continue;
    const host = publicMoon.parent.host;
    const hostPlanetDesignation = stellarMultihostPublicPlanetDesignation(
      systemDesignation,
      host,
      publicMoon.parent.sourcePlanetOrdinal,
    );
    moons.push(projectRelevantMoon(
      publicMoon.publicLocator,
      locator,
      stellarMultihostPublicMoonDesignation(
        systemDesignation,
        host,
        publicMoon.parent.sourcePlanetOrdinal,
        moon.moonOrdinal,
      ),
      hostPlanetDesignation,
      systemDesignation,
      host,
      host === 'AB' ? 'P_TYPE' : 'S_TYPE',
      moon,
    ));
  }

  return Object.freeze({
    planets: Object.freeze(planets),
    moons: Object.freeze(moons),
    unmaterializedMinorMoonCount,
  });
}

function projectMultiplePlanet(
  systemDesignation: string,
  locator: SystemLocator,
  entry: GeneratedPublicPlanet,
): GalaxyKnowledgePlanetCatalogEntry {
  return projectStandardPlanet(
    entry.publicLocator,
    locator,
    stellarMultihostPublicPlanetDesignation(
      systemDesignation,
      entry.host,
      entry.sourcePlanetOrdinal,
    ),
    systemDesignation,
    entry.host,
    entry.host === 'AB' ? 'P_TYPE' : 'S_TYPE',
    entry.planet,
    entry.atmosphere,
  );
}

function projectStandardPlanet(
  locator: BodyLocator,
  parentSystemLocator: SystemLocator,
  designation: string,
  systemDesignation: string,
  hostLabel: string,
  orbitClass: 'SINGLE_HOST' | 'S_TYPE' | 'P_TYPE',
  planet: GeneratedSingleHost['planets'][number],
  atmosphere: GeneratedSingleHost['atmospheres'][number],
): GalaxyKnowledgePlanetCatalogEntry {
  return Object.freeze({
    id: bodyLocatorLabel(locator),
    locator,
    parentSystemLocator,
    designation,
    systemDesignation,
    stateName: DiscoveryState.CONFIRMED.name,
    subtype: planet.planetType,
    hostLabel,
    orbitClass,
    massEarth: planet.massEarth,
    radiusEarth: planet.radiusEarth,
    semiMajorAxisAu: planet.orbit.semiMajorAxisAu,
    orbitalPeriodDays: planet.orbitalPeriod.periodDays,
    meanSurfaceTemperatureKelvin: atmosphere.meanSurfaceTemperatureKelvin,
    surfaceLiquidWaterCoverageFraction01: atmosphere.surfaceLiquidWaterCoverageFraction01,
    postCollapseIdentityHex: null,
  });
}

function projectRelevantMoon(
  locator: MoonLocator,
  parentSystemLocator: SystemLocator,
  designation: string,
  hostPlanetDesignation: string,
  systemDesignation: string,
  hostLabel: string,
  orbitClass: 'SINGLE_HOST' | 'S_TYPE' | 'P_TYPE',
  moon: GeneratedSingleHost['moonSystems'][number]['relevantMoons'][number],
): GalaxyKnowledgeMoonCatalogEntry {
  return Object.freeze({
    id: moonLocatorLabel(locator),
    locator,
    parentSystemLocator,
    designation,
    hostPlanetDesignation,
    systemDesignation,
    stateName: DiscoveryState.CONFIRMED.name,
    composition: moonComposition(moon.environmentState.inferredIceRichnessIndex01),
    hostLabel,
    orbitClass,
    massEarth: moon.physicalProperties.massEarth,
    radiusEarth: moon.physicalProperties.radiusEarth,
    orbitalPeriodDays: moon.orbit.orbitalPeriodDays,
    inferredIceRichnessIndex01: moon.environmentState.inferredIceRichnessIndex01,
    surfaceLiquidWaterPotentialIndex01: moon.environmentState.surfaceLiquidWaterPotentialIndex01,
    subsurfaceOceanPotentialIndex01: moon.environmentState.subsurfaceOceanPotentialIndex01,
    waterRegime: moon.environmentState.waterRegime,
  });
}

function moonComposition(value: number): GalaxyKnowledgeMoonComposition {
  if (!Number.isFinite(value) || value < 0 || value > 1) return 'UNCLASSIFIED';
  if (value < 0.35) return 'ROCKY';
  if (value >= 0.65) return 'ICY';
  return 'MIXED_ROCK_ICE';
}

function safeSystemDesignation(
  generationKey: UniverseGenerationKey,
  locator: SystemLocator,
): string {
  return StellarDesignationGenerator.generate(
    multihostPhysicalSourceKey(generationKey),
    locator,
  ).name;
}

function compareSystemThenPlanet(
  leftSystem: SystemLocator,
  leftId: string,
  rightSystem: SystemLocator,
  rightId: string,
): number {
  if (leftSystem.sectorKey !== rightSystem.sectorKey) {
    return leftSystem.sectorKey < rightSystem.sectorKey ? -1 : 1;
  }
  if (leftSystem.galacticObjectIndex !== rightSystem.galacticObjectIndex) {
    return leftSystem.galacticObjectIndex < rightSystem.galacticObjectIndex ? -1 : 1;
  }
  return leftId.localeCompare(rightId, 'en');
}

function systemKey(locator: SystemLocator): string {
  return `${locator.galaxyIndex}:${locator.sectorKey}:${locator.galacticObjectIndex}`;
}

function bodyKey(locator: BodyLocator): string {
  return `${locator.galaxyIndex}:${locator.sectorKey}:${locator.galacticObjectIndex}:${locator.bodyIndex}`;
}

function bodyLocatorLabel(locator: BodyLocator): string {
  return `G${locator.galaxyIndex}/S${locator.sectorKey}/O${locator.galacticObjectIndex}/P${locator.bodyIndex}`;
}

function moonLocatorLabel(locator: MoonLocator): string {
  return `G${locator.galaxyIndex}/S${locator.sectorKey}/O${locator.galacticObjectIndex}/P${locator.bodyIndex}/M${locator.moonIndex}`;
}

function restoreSnapshot(json: string): GalaxyKnowledgePlanetMoonCatalogSnapshot {
  const raw = parseBigIntTree(json) as {
    galaxyIndex: bigint;
    planets: readonly RawPlanet[];
    moons: readonly RawMoon[];
    unmaterializedMinorMoonCount: bigint;
  };

  return Object.freeze({
    galaxyIndex: raw.galaxyIndex,
    planets: Object.freeze(raw.planets.map(restorePlanet)),
    moons: Object.freeze(raw.moons.map(restoreMoon)),
    unmaterializedMinorMoonCount: raw.unmaterializedMinorMoonCount,
  });
}

interface RawSystemLocator {
  readonly galaxyIndex: bigint;
  readonly sectorKey: bigint;
  readonly galacticObjectIndex: bigint;
}

interface RawBodyLocator extends RawSystemLocator {
  readonly bodyIndex: bigint;
}

interface RawMoonLocator extends RawBodyLocator {
  readonly moonIndex: bigint;
}

interface RawPlanet extends Omit<GalaxyKnowledgePlanetCatalogEntry, 'locator' | 'parentSystemLocator'> {
  readonly locator: RawBodyLocator | null;
  readonly parentSystemLocator: RawSystemLocator;
}

interface RawMoon extends Omit<GalaxyKnowledgeMoonCatalogEntry, 'locator' | 'parentSystemLocator'> {
  readonly locator: RawMoonLocator;
  readonly parentSystemLocator: RawSystemLocator;
}

function restorePlanet(raw: RawPlanet): GalaxyKnowledgePlanetCatalogEntry {
  return Object.freeze({
    ...raw,
    locator: raw.locator === null ? null : new BodyLocator(
      raw.locator.galaxyIndex,
      raw.locator.sectorKey,
      raw.locator.galacticObjectIndex,
      raw.locator.bodyIndex,
    ),
    parentSystemLocator: restoreSystemLocator(raw.parentSystemLocator),
  });
}

function restoreMoon(raw: RawMoon): GalaxyKnowledgeMoonCatalogEntry {
  return Object.freeze({
    ...raw,
    locator: new MoonLocator(
      raw.locator.galaxyIndex,
      raw.locator.sectorKey,
      raw.locator.galacticObjectIndex,
      raw.locator.bodyIndex,
      raw.locator.moonIndex,
    ),
    parentSystemLocator: restoreSystemLocator(raw.parentSystemLocator),
  });
}

function restoreSystemLocator(raw: RawSystemLocator): SystemLocator {
  return new SystemLocator(raw.galaxyIndex, raw.sectorKey, raw.galacticObjectIndex);
}
