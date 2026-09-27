import {
  InjectionToken,
} from '@angular/core';

import {
  type KnownDiscovery,
} from '../../domain/discovery/known-discovery';

import {
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  type GalaxyKnownWaterMoon,
  type GalaxyKnownWaterMoonIndex,
  type GalaxyKnownWaterMoonSystem,
} from '../../domain/exploration/galaxy-known-water-moon-index';

import {
  type GalaxyKnownWaterWorld,
  type GalaxyKnownWaterWorldIndex,
  type GalaxyKnownWaterWorldSystem,
} from '../../domain/exploration/galaxy-known-water-world-index';

import {
  BodyLocator,
  MoonLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  MoonWaterRegime,
} from '../../domain/planetary/moon-water-regime';

import {
  PlanetType,
} from '../../domain/planetary/planet-type';

import {
  GalaxyKnownWaterMoonIndexEngine,
} from '../../simulation/exploration/galaxy-known-water-moon-index-engine';

import {
  GalaxyKnownWaterWorldIndexEngine,
} from '../../simulation/exploration/galaxy-known-water-world-index-engine';

import {
  GenesisIndexedDb,
} from '../../data/local/indexed-db/genesis-indexed-db';

import {
  type GalaxyKnowledgeSnapshotEntity,
} from '../../data/local/entity/galaxy-knowledge-snapshot.entity';

import {
  DexieGalaxyKnowledgeSnapshotRepository,
  type GalaxyKnowledgeSnapshotRepository,
} from '../../data/local/repository/dexie-galaxy-knowledge-snapshot.repository';

import {
  GALAXY_SCIENTIFIC_MODEL_VERSION,
  galaxyKnowledgeRevision,
  parseBigIntTree,
  stringifyBigIntTree,
} from './galaxy-knowledge-snapshot.runtime';

export interface GalaxyWaterIndexSnapshotRuntime {
  resolveWorldIndex(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    galaxyState: DiscoveryStateValue,
    knownDiscoveries: readonly KnownDiscovery[],
  ): Promise<GalaxyKnownWaterWorldIndex>;

  resolveMoonIndex(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    galaxyState: DiscoveryStateValue,
    knownDiscoveries: readonly KnownDiscovery[],
  ): Promise<GalaxyKnownWaterMoonIndex>;
}

type WaterWorldIndexBuilder = typeof GalaxyKnownWaterWorldIndexEngine.build;
type WaterMoonIndexBuilder = typeof GalaxyKnownWaterMoonIndexEngine.build;

export const GALAXY_WATER_INDEX_SNAPSHOT_RUNTIME =
  new InjectionToken<GalaxyWaterIndexSnapshotRuntime>(
    'GALAXY_WATER_INDEX_SNAPSHOT_RUNTIME',
    {
      providedIn: 'root',
      factory: () =>
        new DexieGalaxyWaterIndexSnapshotRuntime(
          new DexieGalaxyKnowledgeSnapshotRepository(
            new GenesisIndexedDb(),
          ),
        ),
    },
  );

/**
 * Point 3 performance read-model.
 *
 * Water catalogues are derived scientific indexes, never Ground Truth. Each
 * expensive catalogue is generated at most once for a stable knowledge
 * revision and then stored as an optional fragment of the existing V4 galaxy
 * knowledge snapshot. The world and moon fragments are warmed independently,
 * so opening one index never forces generation of the other.
 */
export class DexieGalaxyWaterIndexSnapshotRuntime
  implements GalaxyWaterIndexSnapshotRuntime {

  constructor(
    private readonly repository: GalaxyKnowledgeSnapshotRepository,
    private readonly clock: () => number = Date.now,
    private readonly worldIndexBuilder: WaterWorldIndexBuilder =
      GalaxyKnownWaterWorldIndexEngine.build,
    private readonly moonIndexBuilder: WaterMoonIndexBuilder =
      GalaxyKnownWaterMoonIndexEngine.build,
  ) {}

  async resolveWorldIndex(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    galaxyState: DiscoveryStateValue,
    knownDiscoveries: readonly KnownDiscovery[],
  ): Promise<GalaxyKnownWaterWorldIndex> {
    const knowledgeRevision = galaxyKnowledgeRevision(
      galaxyIndex,
      knownDiscoveries,
    );

    const existing = await this.repository.get(
      generationKey,
      galaxyIndex,
      GALAXY_SCIENTIFIC_MODEL_VERSION,
    );

    if (
      existing !== undefined &&
      existing.knowledgeRevision === knowledgeRevision &&
      existing.waterWorldIndexJson !== undefined
    ) {
      return restoreWaterWorldIndex(existing.waterWorldIndexJson);
    }

    const index = this.worldIndexBuilder(
      generationKey,
      galaxyIndex,
      galaxyState,
      knownDiscoveries,
    );

    await this.repository.put(
      this.mergeFragment(
        generationKey,
        galaxyIndex,
        knowledgeRevision,
        existing,
        {
          waterWorldIndexJson: stringifyBigIntTree(index),
        },
      ),
    );

    return index;
  }

  async resolveMoonIndex(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    galaxyState: DiscoveryStateValue,
    knownDiscoveries: readonly KnownDiscovery[],
  ): Promise<GalaxyKnownWaterMoonIndex> {
    const knowledgeRevision = galaxyKnowledgeRevision(
      galaxyIndex,
      knownDiscoveries,
    );

    const existing = await this.repository.get(
      generationKey,
      galaxyIndex,
      GALAXY_SCIENTIFIC_MODEL_VERSION,
    );

    if (
      existing !== undefined &&
      existing.knowledgeRevision === knowledgeRevision &&
      existing.waterMoonIndexJson !== undefined
    ) {
      return restoreWaterMoonIndex(existing.waterMoonIndexJson);
    }

    const index = this.moonIndexBuilder(
      generationKey,
      galaxyIndex,
      galaxyState,
      knownDiscoveries,
    );

    await this.repository.put(
      this.mergeFragment(
        generationKey,
        galaxyIndex,
        knowledgeRevision,
        existing,
        {
          waterMoonIndexJson: stringifyBigIntTree(index),
        },
      ),
    );

    return index;
  }

  private mergeFragment(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    knowledgeRevision: string,
    existing: GalaxyKnowledgeSnapshotEntity | undefined,
    fragment: Pick<
      GalaxyKnowledgeSnapshotEntity,
      'waterWorldIndexJson' | 'waterMoonIndexJson'
    >,
  ): GalaxyKnowledgeSnapshotEntity {
    const reusableExisting =
      existing !== undefined &&
      existing.knowledgeRevision === knowledgeRevision
        ? existing
        : undefined;

    return {
      ...reusableExisting,
      ...fragment,
      universeSeed: generationKey.universeSeed.serialize(),
      generatorVersionCode: generationKey.generatorVersionCode,
      galaxyIndex: galaxyIndex.toString(10),
      scientificModelVersion: GALAXY_SCIENTIFIC_MODEL_VERSION,
      knowledgeRevision,
      updatedAtEpochMs: this.clock(),
    };
  }
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

function restoreWaterWorldIndex(
  json: string,
): GalaxyKnownWaterWorldIndex {
  const raw = parseBigIntTree(json) as {
    galaxyIndex: bigint;
    totalWorlds: bigint;
    systems: readonly {
      locator: RawSystemLocator;
      designation: string;
      multiplicity: GalaxyKnownWaterWorldSystem['multiplicity'];
      worlds: readonly {
        locator: RawBodyLocator;
        designation: string;
        planetType: PlanetType;
        surfaceLiquidWaterCoverageFraction01: number;
        hostLabel: GalaxyKnownWaterWorld['hostLabel'];
        orbitClass: GalaxyKnownWaterWorld['orbitClass'];
      }[];
    }[];
  };

  const systems = raw.systems.map(system => Object.freeze({
    locator: restoreSystemLocator(system.locator),
    designation: system.designation,
    multiplicity: system.multiplicity,
    worlds: Object.freeze(system.worlds.map(world => Object.freeze({
      locator: new BodyLocator(
        world.locator.galaxyIndex,
        world.locator.sectorKey,
        world.locator.galacticObjectIndex,
        world.locator.bodyIndex,
      ),
      designation: world.designation,
      planetType: restorePlanetType(world.planetType),
      surfaceLiquidWaterCoverageFraction01:
        world.surfaceLiquidWaterCoverageFraction01,
      hostLabel: world.hostLabel,
      orbitClass: world.orbitClass,
    }))),
  }));

  return Object.freeze({
    galaxyIndex: raw.galaxyIndex,
    systems: Object.freeze(systems),
    totalWorlds: raw.totalWorlds,
  });
}

function restoreWaterMoonIndex(
  json: string,
): GalaxyKnownWaterMoonIndex {
  const raw = parseBigIntTree(json) as {
    galaxyIndex: bigint;
    totalUniqueMoons: bigint;
    surfaceLiquidPotentialMoonCount: bigint;
    subsurfaceOceanEvidenceMoonCount: bigint;
    systems: readonly {
      locator: RawSystemLocator;
      designation: string;
      multiplicity: GalaxyKnownWaterMoonSystem['multiplicity'];
      moons: readonly {
        locator: RawMoonLocator;
        designation: string;
        hostPlanetDesignation: string;
        hostLabel: GalaxyKnownWaterMoon['hostLabel'];
        orbitClass: GalaxyKnownWaterMoon['orbitClass'];
        surfaceLiquidWaterPotentialIndex01: number;
        subsurfaceOceanPotentialIndex01: number;
        waterRegime: MoonWaterRegime;
        surfaceLiquidPotentialAtLeast40Percent: boolean;
        subsurfaceOceanEvidence: boolean;
      }[];
    }[];
  };

  const systems = raw.systems.map(system => Object.freeze({
    locator: restoreSystemLocator(system.locator),
    designation: system.designation,
    multiplicity: system.multiplicity,
    moons: Object.freeze(system.moons.map(moon => Object.freeze({
      locator: new MoonLocator(
        moon.locator.galaxyIndex,
        moon.locator.sectorKey,
        moon.locator.galacticObjectIndex,
        moon.locator.bodyIndex,
        moon.locator.moonIndex,
      ),
      designation: moon.designation,
      hostPlanetDesignation: moon.hostPlanetDesignation,
      hostLabel: moon.hostLabel,
      orbitClass: moon.orbitClass,
      surfaceLiquidWaterPotentialIndex01:
        moon.surfaceLiquidWaterPotentialIndex01,
      subsurfaceOceanPotentialIndex01:
        moon.subsurfaceOceanPotentialIndex01,
      waterRegime: restoreMoonWaterRegime(moon.waterRegime),
      surfaceLiquidPotentialAtLeast40Percent:
        moon.surfaceLiquidPotentialAtLeast40Percent,
      subsurfaceOceanEvidence: moon.subsurfaceOceanEvidence,
    }))),
  }));

  return Object.freeze({
    galaxyIndex: raw.galaxyIndex,
    systems: Object.freeze(systems),
    totalUniqueMoons: raw.totalUniqueMoons,
    surfaceLiquidPotentialMoonCount: raw.surfaceLiquidPotentialMoonCount,
    subsurfaceOceanEvidenceMoonCount: raw.subsurfaceOceanEvidenceMoonCount,
  });
}

function restoreSystemLocator(
  locator: RawSystemLocator,
): SystemLocator {
  return new SystemLocator(
    locator.galaxyIndex,
    locator.sectorKey,
    locator.galacticObjectIndex,
  );
}

function restorePlanetType(
  value: PlanetType,
): PlanetType {
  if (!Object.values(PlanetType).includes(value)) {
    throw new RangeError(`Persisted water-world snapshot has invalid PlanetType: ${String(value)}.`);
  }
  return value;
}

function restoreMoonWaterRegime(
  value: MoonWaterRegime,
): MoonWaterRegime {
  if (!Object.values(MoonWaterRegime).includes(value)) {
    throw new RangeError(`Persisted water-moon snapshot has invalid MoonWaterRegime: ${String(value)}.`);
  }
  return value;
}
