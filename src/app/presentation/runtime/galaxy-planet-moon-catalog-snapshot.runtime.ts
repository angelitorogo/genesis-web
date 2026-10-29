import { resolveEffectivePlanetVIDA5, safeCatalogPlanetProjectionV3 } from './galaxy-catalog-effective-planet-vida5';
import { PlanetScientificTargetResolver, type PlanetScientificResolvedTarget } from '../../simulation/planetary/planet-scientific-target-resolver';
import { StellarMultihostScientificTargetResolver } from '../../simulation/stellar/stellar-multihost-scientific-target-resolver';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { Vida9ConfirmedSystemBiologyIndexer } from './vida9-confirmed-system-biology-indexer';
import { ensureVida9PlanetsInBackground, scheduleVida9MoonsInBackground } from './vida9-background-materializer';
import { canonicalGalaxyKnownDiscoveries } from '../../domain/exploration/galaxy-known-discoveries-canonical';
import { InjectionToken } from '@angular/core';
import { CompactHostPlanetarySystemGenerator } from '../../simulation/planetary/compact-host-planetary-system-generator';

import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { type KnownDiscovery } from '../../domain/discovery/known-discovery';
import {
  BodyLocator,
  MoonLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { moonRomanNumeralV1 } from '../../domain/planetary/moon-designation';
import { MoonWaterRegime } from '../../domain/planetary/moon-water-regime';
import { PlanetType } from '../../domain/planetary/planet-type';
import { type CatalogAtmosphereState } from '../galaxy-knowledge-catalog/galaxy-knowledge-atmosphere-filter';
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
  readonly orbitClass: 'SINGLE_HOST' | 'COMPACT_HOST' | 'S_TYPE' | 'P_TYPE' | 'POST_COLLAPSE_MODEL' | null;
  readonly massEarth: number | null;
  readonly radiusEarth: number | null;
  readonly semiMajorAxisAu: number | null;
  readonly orbitalPeriodDays: number | null;
  readonly meanSurfaceTemperatureKelvin: number | null;
  readonly surfaceLiquidWaterCoverageFraction01: number | null;
  /** 31.4f conditional projections: never part of known-water evidence. */
  readonly compactConditionalTemperatureKelvin?: number | null;
  readonly compactConditionalLiquidCoverage01?: number | null;
  readonly postCollapseIdentityHex: string | null;
  readonly atmosphere?: CatalogAtmosphereState | null;
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
  readonly orbitClass: 'SINGLE_HOST' | 'COMPACT_HOST' | 'S_TYPE' | 'P_TYPE';
  readonly materializationPRE3310?: 'IDENTITY_ONLY' | 'DETAILED';
  readonly massEarth: number | null;
  readonly radiusEarth: number | null;
  readonly orbitalPeriodDays: number | null;
  readonly inferredIceRichnessIndex01: number | null;
  readonly surfaceLiquidWaterPotentialIndex01: number | null;
  readonly subsurfaceOceanPotentialIndex01: number | null;
  readonly waterRegime: MoonWaterRegime | null;
  readonly atmosphere?: CatalogAtmosphereState | null;
}

export interface GalaxyKnowledgePlanetMoonCatalogSnapshot {
  readonly galaxyIndex: bigint;
  readonly planets: readonly GalaxyKnowledgePlanetCatalogEntry[];
  readonly moons: readonly GalaxyKnowledgeMoonCatalogEntry[];
  readonly unmaterializedMinorMoonCount: bigint;
  readonly atmosphereProjectionVersion?: 1;
  /** V3: public values already include the VIDA.5 biogenic atmosphere, not PRE-VIDA.5. */
  readonly effectivePhysicalProjectionVIDA5?: 1 | 2;
  readonly identityCoveragePRE3310?: 1;
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
        Date.now,
        buildGalaxyPlanetMoonCatalogSnapshot,
        new Vida9ConfirmedSystemBiologyIndexer(new GenesisIndexedDb()),
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
  // VIDA.9 is independent of the legacy 33.F.3 biosphere production system,
  // which VIDA.0 intentionally retired. Background writes never block reads.
  private readonly vida9Pending = new Map<string, Promise<void>>();
  private readonly vida9Completed = new Set<string>();
  private vida9Queue: Promise<void> = Promise.resolve();

  constructor(
    private readonly repository: GalaxyKnowledgeSnapshotRepository,
    private readonly clock: () => number = Date.now,
    private readonly builder: typeof buildGalaxyPlanetMoonCatalogSnapshot =
      buildGalaxyPlanetMoonCatalogSnapshot,
    private readonly vida9Indexer: Pick<Vida9ConfirmedSystemBiologyIndexer, 'ensureConfirmedCatalog'> | null = null,
  ) {}

  async resolve(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    knownDiscoveries: readonly KnownDiscovery[],
  ): Promise<GalaxyKnowledgePlanetMoonCatalogSnapshot> {
    // Resolve the public knowledge-safe catalogue independently of biology.
    const knowledgeRevision = galaxyKnowledgeRevision(galaxyIndex, knownDiscoveries);
    if (
      this.hotSnapshot !== null &&
      this.hotSnapshot.galaxyIndex === galaxyIndex &&
      this.hotSnapshot.knowledgeRevision === knowledgeRevision &&
      this.hotSnapshot.generationKey.equals(generationKey)
    ) {
      this.scheduleVida9(generationKey, this.hotSnapshot.snapshot, knowledgeRevision, knownDiscoveries);
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
      && JSON.parse(existing.planetMoonCatalogJson).atmosphereProjectionVersion === 1
      && (generationKey.generatorVersion !== GeneratorVersion.V3 ||
        JSON.parse(existing.planetMoonCatalogJson).effectivePhysicalProjectionVIDA5 === 2)
      && (generationKey.generatorVersion !== GeneratorVersion.V3 ||
        JSON.parse(existing.planetMoonCatalogJson).identityCoveragePRE3310 === 1)
    ) {
      const snapshot = restoreSnapshot(existing.planetMoonCatalogJson);
      this.hotSnapshot = Object.freeze({
        generationKey: generationKey.copy(),
        galaxyIndex,
        knowledgeRevision,
        snapshot,
      });
      this.scheduleVida9(generationKey, snapshot, knowledgeRevision, knownDiscoveries);
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
    this.scheduleVida9(generationKey, snapshot, knowledgeRevision, knownDiscoveries);
    return snapshot;
  }

  /** Writes private VIDA.9 records only after the public catalogue is available. */
  private scheduleVida9(
    generationKey: UniverseGenerationKey,
    snapshot: GalaxyKnowledgePlanetMoonCatalogSnapshot,
    knowledgeRevision: string,
    knownDiscoveries: readonly KnownDiscovery[],
  ): void {
    if (this.vida9Indexer === null || generationKey.generatorVersion !== GeneratorVersion.V3 ||
      !(snapshot.planets.some(planet => planet.stateName === 'CONFIRMED') ||
        snapshot.moons.some(moon => moon.stateName === 'CONFIRMED'))) return;
    // Trust the canonical confirmed *system*, not only a stale or test catalogue.
    if (!canonicalGalaxyKnownDiscoveries(generationKey, snapshot.galaxyIndex, knownDiscoveries)
      .some(discovery => discovery.locator instanceof SystemLocator &&
        discovery.state.code >= DiscoveryState.CONFIRMED.code)) return;

    const taskKey = [generationKey.universeSeed.serialize(), generationKey.generatorVersionCode,
      snapshot.galaxyIndex.toString(10), knowledgeRevision].join('|');
    if (this.vida9Pending.has(taskKey) || this.vida9Completed.has(taskKey)) return;

    const stableKey = generationKey.copy();
    const indexer = this.vida9Indexer;
    const work = this.vida9Queue.then(async () => {
      // Yield a browser task before procedural materialization / IndexedDB writes.
      await new Promise<void>(resolve => setTimeout(resolve, 0));
      // Production browsers index in a dedicated Worker. The legacy main-
      // thread 29,000-planet / 81,000-moon loop was competing with first fiche
      // navigation. Test doubles and runtimes without workers retain the
      // original code path for regression coverage.
      if(indexer instanceof Vida9ConfirmedSystemBiologyIndexer &&
          typeof Worker==='function' && typeof indexedDB!=='undefined'){
        const systems=new Set(canonicalGalaxyKnownDiscoveries(stableKey,snapshot.galaxyIndex,knownDiscoveries)
          .filter(d=>d.locator instanceof SystemLocator &&
            d.state.code>=DiscoveryState.CONFIRMED.code).map(d=>{
              const loc=d.locator as SystemLocator;
              return [loc.galaxyIndex,loc.sectorKey,loc.galacticObjectIndex].join('/');
            }));
        const planets=ensureVida9PlanetsInBackground(stableKey,snapshot.galaxyIndex,systems);
        if(planets!==null){
          await planets; // Planetary civilizations first, before any moon scan.
          await scheduleVida9MoonsInBackground(stableKey,snapshot.galaxyIndex,snapshot);
        }else{
          await indexer.ensureConfirmedCatalog(stableKey,snapshot);
        }
      }else{
        await indexer.ensureConfirmedCatalog(stableKey,snapshot);
      }
      this.vida9Completed.add(taskKey);
    }).catch((error: unknown) => {
      // A failed materialization may retry on the next resolve; public state is untouched.
      console.error('VIDA.9: persistencia biológica pendiente. El catálogo continúa disponible.', error);
    }).finally(() => {
      this.vida9Pending.delete(taskKey);
    });
    this.vida9Pending.set(taskKey, work);
    this.vida9Queue = work;
  }

}

export function buildGalaxyPlanetMoonCatalogSnapshot(
  generationKey: UniverseGenerationKey,
  galaxyIndex: bigint,
  knownDiscoveries: readonly KnownDiscovery[],
): GalaxyKnowledgePlanetMoonCatalogSnapshot {
  const systemDiscoveries = new Map<string, KnownDiscovery & { readonly locator: SystemLocator }>();
  const bodyDiscoveries: Array<KnownDiscovery & { readonly locator: BodyLocator }> = [];

  for (const discovery of canonicalGalaxyKnownDiscoveries(generationKey, galaxyIndex, knownDiscoveries)) {
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
    atmosphereProjectionVersion: 1 as const,
    ...(generationKey.generatorVersion === GeneratorVersion.V3
      ? { identityCoveragePRE3310: 1 as const, effectivePhysicalProjectionVIDA5: 2 as const }
      : {}),
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
  const compact = CompactHostPlanetarySystemGenerator.generateOrNull(generationKey, locator);
  if (compact !== null) {
    return Object.freeze({
      planets: Object.freeze(compact.planets.map(planet => Object.freeze({
        id: bodyLocatorLabel(planet.locator),
        locator: planet.locator,
        parentSystemLocator: locator,
        designation: `${systemDesignation} ${planet.ordinal}`,
        systemDesignation, stateName: DiscoveryState.CONFIRMED.name,
        subtype: planet.bulkKind === 'ROCKY' ? PlanetType.ROCKY : PlanetType.SUPER_EARTH, hostLabel:'A', orbitClass:'COMPACT_HOST' as const,
        massEarth:planet.massEarth, radiusEarth:planet.radiusEarth,
        semiMajorAxisAu:planet.semiMajorAxisAu, orbitalPeriodDays:planet.orbitalPeriodDays,
        // Conditional compact scenarios are NOT observational known-water evidence.
        meanSurfaceTemperatureKelvin:null, surfaceLiquidWaterCoverageFraction01:null,
        compactConditionalTemperatureKelvin:compact.characterizations[planet.ordinal-1]!.surfaceTemperatureScenarioK,
        compactConditionalLiquidCoverage01:compact.characterizations[planet.ordinal-1]!.surfaceLiquidWaterCoverageFraction01,
        postCollapseIdentityHex:null,
        atmosphere:null,
      }))),
      moons:Object.freeze(compact.secondaries.moons.map(moon=>{
        const planet=compact.planets[moon.parentPlanetOrdinal-1]!;
        const planetTitle=`${systemDesignation} ${planet.ordinal}`;
        const locatorMoon=new MoonLocator(locator.galaxyIndex,locator.sectorKey,
          locator.galacticObjectIndex,BigInt(planet.ordinal-1),BigInt(moon.ordinal-1));
        return Object.freeze({id:moonLocatorLabel(locatorMoon),locator:locatorMoon,
          parentSystemLocator:locator,designation:`${planetTitle} ${moonRomanNumeralV1(moon.ordinal)}`,
          hostPlanetDesignation:planetTitle,systemDesignation,stateName:DiscoveryState.CONFIRMED.name,
          composition:moon.iceRichnessIndex01<0.32?'ROCKY' as const:
            moon.iceRichnessIndex01>0.72?'ICY' as const:'MIXED_ROCK_ICE' as const,
          hostLabel:'A',orbitClass:'COMPACT_HOST' as const,
          massEarth:moon.massEarth,radiusEarth:moon.radiusEarth,
          orbitalPeriodDays:moon.orbitalPeriodDays,
          inferredIceRichnessIndex01:moon.iceRichnessIndex01,
          surfaceLiquidWaterPotentialIndex01:0,subsurfaceOceanPotentialIndex01:0,
          waterRegime:MoonWaterRegime.NONE,atmosphere:null,
        });
      })),unmaterializedMinorMoonCount:0n,
    });
  }
  const multiple = StellarMultihostFormation.generateOrNull(generationKey, locator);

  if (multiple !== null) {
    return projectMultipleSystem(systemDesignation, locator, multiple, generationKey);
  }

  const single = StellarMultihostFormation.generateSingleOrNull(generationKey, locator);
  if (single === null) {
    throw new Error('CONFIRMED system could not resolve its physical host for 26.1c.3.');
  }
  return projectSingleSystem(systemDesignation, locator, single, generationKey);
}

/** PRE-33.10: catalog the identity without evaluating physics on galaxy listing. */
function projectIdentityOnlyMoon(
  locator: MoonLocator, parent: SystemLocator, designation: string,
  hostPlanetDesignation: string, systemDesignation: string, hostLabel: string,
  orbitClass: GalaxyKnowledgeMoonCatalogEntry['orbitClass'],
): GalaxyKnowledgeMoonCatalogEntry {
  return Object.freeze({
    id: moonLocatorLabel(locator), locator, parentSystemLocator: parent,
    designation, hostPlanetDesignation, systemDesignation,
    stateName: DiscoveryState.CONFIRMED.name,
    composition: 'UNCLASSIFIED' as const, hostLabel, orbitClass,
    materializationPRE3310: 'IDENTITY_ONLY' as const,
    massEarth: null, radiusEarth: null, orbitalPeriodDays: null,
    inferredIceRichnessIndex01: null,
    surfaceLiquidWaterPotentialIndex01: null,
    subsurfaceOceanPotentialIndex01: null, waterRegime: null, atmosphere: null,
  });
}

function projectSingleSystem(
  systemDesignation: string,
  locator: SystemLocator,
  single: GeneratedSingleHost,
  generationKey: UniverseGenerationKey,
): ProjectedSystemCatalog {
  const v3 = generationKey.generatorVersion === GeneratorVersion.V3;
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

    // V3 public identity is backed by an already materialized private V1
    // planet/atmosphere/moon source. Never call legacy resolveDetailed(V3).
    // PRE-33.03 is a strict per-planet physical diagnostic. A failed phase
    // model must not abort the whole confirmed system/galaxy catalogue.
    // Keep the public body's identity and independent basic physical fields;
    // never substitute PRE-VIDA.5 temperature/atmosphere for unresolved CT-0.
    const publicSource = v3 && single.planetarySystem !== null
      ? safeCatalogPlanetProjectionV3(() => PlanetScientificTargetResolver.projectGenerated(Object.freeze({
          locator: publicLocator,
          planetOrdinal: index + 1,
          designation: planet.designation.name,
          hostSystemDesignation: systemDesignation,
          orbitTopology: single.planetarySystem!.architecture.orbitTopology,
          hostPlanetCount: single.planets.length,
        }), planet, atmosphere, moonSystem, Object.freeze({
          physical: single.physical, lifetime: single.lifetime,
        }), undefined, generationKey.generatorVersionCode))
      : undefined;
    planets.push(projectStandardPlanet(
      publicLocator,
      locator,
      planet.designation.name,
      systemDesignation,
      'A',
      'SINGLE_HOST',
      planet,
      atmosphere,
      generationKey,
      publicSource,
    ));

    unmaterializedMinorMoonCount += BigInt(moonSystem.unmaterializedMinorMoonCount);
    if (moonSystem.unmaterializedMinorMoonCount > 0 &&
        v3) {
      for (const identity of moonSystem.moonIdentities.slice(moonSystem.relevantMoonCount)) {
        const publicMoonLocator = new MoonLocator(locator.galaxyIndex, locator.sectorKey,
          locator.galacticObjectIndex, BigInt(index), BigInt(identity.moonOrdinal - 1));
        moons.push(projectIdentityOnlyMoon(publicMoonLocator, locator,
          `${planet.designation.name} ${moonRomanNumeralV1(identity.moonOrdinal)}`,
          planet.designation.name, systemDesignation, 'A', 'SINGLE_HOST'));
      }
    }
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
        atmosphere: null,
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
  generationKey: UniverseGenerationKey,
): ProjectedSystemCatalog {
  const v3 = generationKey.generatorVersion === GeneratorVersion.V3;
  // Same public ordinal/host mapping as system and planet scientific fiches.
  // The resolver receives the already-generated multihost aggregate.
  const scientific = v3 ? new StellarMultihostScientificTargetResolver(multiple) : null;
  const planets = multiple.publicPlanets.map(entry => projectMultiplePlanet(
    systemDesignation,
    locator,
    entry,
    generationKey,
    scientific ? safeCatalogPlanetProjectionV3(() => scientific.resolveDetailed(
      generationKey, entry.publicLocator)) : undefined,
  ));
  const publicIndex = StellarMultihostPublicTargetIndex.build(multiple);
  const moons: GalaxyKnowledgeMoonCatalogEntry[] = [];

  let unmaterializedMinorMoonCount = 0n;
  for (const publicPlanet of multiple.publicPlanets) {
    unmaterializedMinorMoonCount += BigInt(publicPlanet.moonSystem.unmaterializedMinorMoonCount);
  }

  for (const publicMoon of publicIndex.moons) {
    const moon = publicMoon.relevantMoon;
    if (moon === null && !v3) continue;
    const host = publicMoon.parent.host;
    const hostPlanetDesignation = stellarMultihostPublicPlanetDesignation(
      systemDesignation,
      host,
      publicMoon.parent.sourcePlanetOrdinal,
    );
    if (moon === null) {
      moons.push(projectIdentityOnlyMoon(publicMoon.publicLocator, locator,
        stellarMultihostPublicMoonDesignation(systemDesignation, host,
          publicMoon.parent.sourcePlanetOrdinal, publicMoon.sourceIdentity.moonOrdinal),
        hostPlanetDesignation, systemDesignation, host,
        host === 'AB' ? 'P_TYPE' : 'S_TYPE'));
      continue;
    }
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
  generationKey: UniverseGenerationKey,
  publicSource?: PlanetScientificResolvedTarget | null,
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
    generationKey,
    publicSource,
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
  generationKey: UniverseGenerationKey,
  publicSource?: PlanetScientificResolvedTarget | null,
): GalaxyKnowledgePlanetCatalogEntry {
  // Only actual V3 CONFIRMED planets: V1/V2 and compact/post-collapse scenarios
  // retain their previous knowledge/evidence contract. No new discoveries.
  const effective = generationKey.generatorVersion === GeneratorVersion.V3
    ? publicSource ? resolveEffectivePlanetVIDA5(generationKey, locator, publicSource) : null
    : undefined;
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
    // Null is preferable to a misleading PRE-VIDA.5 reading when a V3
    // physical target cannot be reconstructed.
    meanSurfaceTemperatureKelvin: effective === undefined
      ? atmosphere.meanSurfaceTemperatureKelvin
      : effective?.detail.climate.meanSurfaceTemperatureKelvin ?? null,
    surfaceLiquidWaterCoverageFraction01: atmosphere.surfaceLiquidWaterCoverageFraction01,
    postCollapseIdentityHex: null,
    atmosphere: effective === undefined
      ? projectPlanetAtmosphere(atmosphere)
      : effective === null ? null : projectEffectiveAtmosphere(effective),
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
    atmosphere: projectMoonAtmosphere(moon.environmentState.atmosphereAssessment),
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

/** Use the final retained/condensed mixture shown by the scientific fiche, never the bulk template. */
function projectPlanetAtmosphere(
  atmosphere: GeneratedSingleHost['atmospheres'][number],
): CatalogAtmosphereState {
  const pressure=atmosphere.retainedSurfacePressurePascal;
  // Historical/partial fixtures may not contain a retained mixture. In that
  // case its composition is unknown; do not manufacture an empty gas vector.
  const components=Array.isArray(atmosphere.retainedGasComposition)
    ? atmosphere.retainedGasComposition : null;
  const fractions=atmosphere.isVacuum || components === null || components.length === 0
    ? null
    : Object.freeze(Object.fromEntries(components.map(component => [component.gas, component.moleFraction01])));
  return Object.freeze({
    fractions,
    pressureBar: pressure === null || !Number.isFinite(pressure) ? null : pressure / 100_000,
    conditional: false,
  });
}

/** EXACT effective gas mixture and pressure from the same target as the fiche. */
function projectEffectiveAtmosphere(
  target: NonNullable<ReturnType<typeof resolveEffectivePlanetVIDA5>>,
): CatalogAtmosphereState {
  const a = target.detail.atmosphere;
  return Object.freeze({
    fractions: a.isVacuum || a.retainedGasComposition.length === 0
      ? null
      : Object.freeze(Object.fromEntries(a.retainedGasComposition.map(g => [g.gas, g.moleFraction01]))),
    pressureBar: a.retainedSurfacePressurePascal === null ||
      !Number.isFinite(a.retainedSurfacePressurePascal)
      ? null : a.retainedSurfacePressurePascal / 100_000,
    conditional: false,
  });
}

/** Lunar fractions are a conditional pressure scenario, not a confirmed atmosphere. */
function projectMoonAtmosphere(
  assessment: NonNullable<GeneratedSingleHost['moonSystems'][number]['relevantMoons'][number]['environmentState']['atmosphereAssessment']> | null,
): CatalogAtmosphereState {
  const resolved=assessment?.pressureBasis === 'CONDITIONAL_SCENARIO'
    && assessment.estimatedSurfacePressurePascal !== null
    && assessment.estimatedSurfacePressurePascal > 0 && assessment.species.length > 0;
  return Object.freeze({
    fractions: resolved
      ? Object.freeze(Object.fromEntries(assessment!.species.map(item => [item.gas,item.moleFraction01])))
      : null,
    pressureBar: resolved ? assessment!.estimatedSurfacePressurePascal! / 100_000 : null,
    conditional: true,
  });
}

function restoreSnapshot(json: string): GalaxyKnowledgePlanetMoonCatalogSnapshot {
  const raw = parseBigIntTree(json) as {
    galaxyIndex: bigint;
    planets: readonly RawPlanet[];
    moons: readonly RawMoon[];
    unmaterializedMinorMoonCount: bigint;
    atmosphereProjectionVersion?: 1;
    effectivePhysicalProjectionVIDA5?: 1 | 2;
    identityCoveragePRE3310?: 1;
  };

  return Object.freeze({
    galaxyIndex: raw.galaxyIndex,
    planets: Object.freeze(raw.planets.map(restorePlanet)),
    moons: Object.freeze(raw.moons.map(restoreMoon)),
    unmaterializedMinorMoonCount: raw.unmaterializedMinorMoonCount,
    atmosphereProjectionVersion: raw.atmosphereProjectionVersion,
    effectivePhysicalProjectionVIDA5: raw.effectivePhysicalProjectionVIDA5,
    identityCoveragePRE3310: raw.identityCoveragePRE3310,
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
