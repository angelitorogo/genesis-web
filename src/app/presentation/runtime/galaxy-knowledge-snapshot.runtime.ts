import { canonicalGalaxyKnownDiscoveries } from '../../domain/exploration/galaxy-known-discoveries-canonical';
import {
  InjectionToken,
} from '@angular/core';

import {
  sha256,
} from '@noble/hashes/sha2.js';

import {
  bytesToHex,
  utf8ToBytes,
} from '@noble/hashes/utils.js';

import {
  type KnownDiscovery,
} from '../../domain/discovery/known-discovery';

import {
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  GalaxyExplorationTelemetry,
} from '../../domain/exploration/galaxy-exploration-telemetry';

import {
  GalaxyKnowledgeStatistics,
} from '../../domain/exploration/galaxy-knowledge-statistics';

import {
  BodyLocator,
  CivilizationLocator,
  GalacticObjectLocator,
  GalaxyLocator,
  type ProceduralLocator,
  SectorLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import { generateKnownCompactHostCatalog } from '../../simulation/exploration/galaxy-known-compact-host-catalog-generator';

import {
  GalaxyExplorationTelemetryEngine,
} from '../../simulation/exploration/galaxy-exploration-telemetry-engine';

import {
  GalaxyKnowledgeStatisticsEngine,
} from '../../simulation/exploration/galaxy-knowledge-statistics-engine';

import {
  GenesisIndexedDb,
} from '../../data/local/indexed-db/genesis-indexed-db';

import {
  DexieGalaxyKnowledgeSnapshotRepository,
  type GalaxyKnowledgeSnapshotRepository,
} from '../../data/local/repository/dexie-galaxy-knowledge-snapshot.repository';

import {
  type GalaxyKnowledgeSnapshotEntity,
} from '../../data/local/entity/galaxy-knowledge-snapshot.entity';

export const GALAXY_SCIENTIFIC_MODEL_VERSION =
  15; // 31.5: canonical unique known-object views; invalidate derived counts/catalogues only.

export interface GalaxyKnowledgeSnapshot {
  readonly knowledgeRevision: string;
  readonly statistics: GalaxyKnowledgeStatistics;
  readonly explorationTelemetry: GalaxyExplorationTelemetry;
}

export interface GalaxyKnowledgeSnapshotRuntime {
  resolve(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    galaxyState: DiscoveryStateValue,
    knownDiscoveries: readonly KnownDiscovery[],
  ): Promise<GalaxyKnowledgeSnapshot>;
}

export const GALAXY_KNOWLEDGE_SNAPSHOT_RUNTIME =
  new InjectionToken<GalaxyKnowledgeSnapshotRuntime>(
    'GALAXY_KNOWLEDGE_SNAPSHOT_RUNTIME',
    {
      providedIn: 'root',
      factory: () =>
        new DexieGalaxyKnowledgeSnapshotRuntime(
          new DexieGalaxyKnowledgeSnapshotRepository(
            new GenesisIndexedDb(),
          ),
        ),
    },
  );

export class DexieGalaxyKnowledgeSnapshotRuntime
  implements GalaxyKnowledgeSnapshotRuntime {

  constructor(
    private readonly repository: GalaxyKnowledgeSnapshotRepository,
    private readonly clock: () => number = Date.now,
  ) {}

  async resolve(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    galaxyState: DiscoveryStateValue,
    knownDiscoveries: readonly KnownDiscovery[],
  ): Promise<GalaxyKnowledgeSnapshot> {

    const canonicalKnown = canonicalGalaxyKnownDiscoveries(
      generationKey,
      galaxyIndex,
      knownDiscoveries,
    );

    const knowledgeRevision =
      galaxyKnowledgeRevision(
        galaxyIndex,
        canonicalKnown,
      );

    const existing =
      await this.repository.get(
        generationKey,
        galaxyIndex,
        GALAXY_SCIENTIFIC_MODEL_VERSION,
      );

    if (
      existing !== undefined &&
      existing.knowledgeRevision === knowledgeRevision &&
      existing.statisticsJson !== undefined &&
      existing.explorationTelemetryJson !== undefined
    ) {
      return restoreSnapshot(existing);
    }

    const statistics =
      GalaxyKnowledgeStatisticsEngine.build(
        generationKey,
        galaxyIndex,
        canonicalKnown,
      );

    // Only persisted, already catalogued system identities may classify a
    // compact host. Never enumerate hidden sector candidates for telemetry.
    const compactHosts = generateKnownCompactHostCatalog(
      generationKey, galaxyIndex, canonicalKnown,
    ).map(entry => entry.host);
    const explorationTelemetry =
      GalaxyExplorationTelemetryEngine.build(
        generationKey,
        galaxyIndex,
        galaxyState,
        canonicalKnown,
        compactHosts,
      );

    const reusableExisting =
      existing !== undefined &&
      existing.knowledgeRevision === knowledgeRevision
        ? existing
        : undefined;

    const entity:
      GalaxyKnowledgeSnapshotEntity = {
        ...reusableExisting,

        universeSeed:
          generationKey.universeSeed.serialize(),

        generatorVersionCode:
          generationKey.generatorVersionCode,

        galaxyIndex:
          galaxyIndex.toString(10),

        scientificModelVersion:
          GALAXY_SCIENTIFIC_MODEL_VERSION,

        knowledgeRevision,

        statisticsJson:
          stringifyBigIntTree(statistics),

        explorationTelemetryJson:
          stringifyBigIntTree(explorationTelemetry),

        updatedAtEpochMs:
          this.clock(),
      };

    await this.repository.put(entity);

    return Object.freeze({
      knowledgeRevision,
      statistics,
      explorationTelemetry,
    });
  }
}

export function galaxyKnowledgeRevision(
  galaxyIndex: bigint,
  knownDiscoveries: readonly KnownDiscovery[],
): string {

  const records =
    knownDiscoveries
      .filter(
        discovery =>
          discovery.locator.galaxyIndex === galaxyIndex,
      )
      .map(
        discovery =>
          [
            locatorRevisionKey(discovery.locator),
            discovery.state.code,
          ].join(':'),
      )
      .sort();

  return bytesToHex(
    sha256(
      utf8ToBytes(
        records.join('\n'),
      ),
    ),
  ).toUpperCase();
}

function locatorRevisionKey(
  locator: ProceduralLocator,
): string {

  if (locator instanceof GalaxyLocator) {
    return `G:${locator.galaxyIndex}`;
  }

  if (locator instanceof SectorLocator) {
    return `S:${locator.galaxyIndex}:${locator.sectorKey}`;
  }

  if (locator instanceof GalacticObjectLocator) {
    return `O:${locator.galaxyIndex}:${locator.sectorKey}:${locator.galacticObjectIndex}`;
  }

  if (locator instanceof SystemLocator) {
    return `Y:${locator.galaxyIndex}:${locator.sectorKey}:${locator.galacticObjectIndex}`;
  }

  if (locator instanceof BodyLocator) {
    return `B:${locator.galaxyIndex}:${locator.sectorKey}:${locator.galacticObjectIndex}:${locator.bodyIndex}`;
  }

  if (locator instanceof CivilizationLocator) {
    return `C:${locator.galaxyIndex}:${locator.sectorKey}:${locator.galacticObjectIndex}:${locator.bodyIndex}:${locator.civilizationIndex}`;
  }

  const exhaustive: never = locator;
  throw new RangeError(`Unsupported procedural locator: ${String(exhaustive)}`);
}

export function stringifyBigIntTree(
  value: unknown,
): string {

  return JSON.stringify(
    value,
    (
      _key,
      nested,
    ) =>
      typeof nested === 'bigint'
        ? {
            __genesisBigInt:
              nested.toString(10),
          }
        : nested,
  );
}

export function parseBigIntTree(
  json: string,
): unknown {

  return JSON.parse(
    json,
    (
      _key,
      nested,
    ) => {
      if (
        typeof nested === 'object' &&
        nested !== null &&
        Object.keys(nested).length === 1 &&
        '__genesisBigInt' in nested
      ) {
        const value =
          (nested as { __genesisBigInt: unknown })
            .__genesisBigInt;

        if (
          typeof value !== 'string' ||
          !/^-?(0|[1-9]\d*)$/.test(value)
        ) {
          throw new RangeError(
            'Persisted galaxy knowledge snapshot contains an invalid bigint.',
          );
        }

        return BigInt(value);
      }

      return nested;
    },
  );
}

function restoreSnapshot(
  entity: GalaxyKnowledgeSnapshotEntity,
): GalaxyKnowledgeSnapshot {

  if (
    entity.statisticsJson === undefined ||
    entity.explorationTelemetryJson === undefined
  ) {
    throw new RangeError(
      'Persisted galaxy knowledge snapshot is missing the aggregate statistics fragment.',
    );
  }

  const rawStatistics =
    parseBigIntTree(
      entity.statisticsJson,
    ) as {
      galaxyIndex: bigint;
      progressUnits: bigint;
      knownRecords: bigint;
      targetCounts: GalaxyKnowledgeStatistics['targetCounts'];
      stateCounts: GalaxyKnowledgeStatistics['stateCounts'];
    };

  const rawTelemetry =
    parseBigIntTree(
      entity.explorationTelemetryJson,
    ) as {
      totalSectors: bigint | null;
      exploredPercentageBasisPoints: bigint | null;
      inventory: GalaxyExplorationTelemetry['inventory'];
      breakdown: GalaxyExplorationTelemetry['breakdown'];
      compactHostSystems?: GalaxyExplorationTelemetry['compactHostSystems'];
      compactHostPlanets?: bigint;
    };

  const statistics =
    new GalaxyKnowledgeStatistics(
      rawStatistics.galaxyIndex,
      rawStatistics.progressUnits,
      rawStatistics.knownRecords,
      rawStatistics.targetCounts,
      rawStatistics.stateCounts,
    );

  const explorationTelemetry =
    new GalaxyExplorationTelemetry(
      rawTelemetry.totalSectors,
      rawTelemetry.exploredPercentageBasisPoints,
      rawTelemetry.inventory,
      rawTelemetry.breakdown,
      rawTelemetry.compactHostSystems,
      rawTelemetry.compactHostPlanets ?? 0n,
    );

  return Object.freeze({
    knowledgeRevision:
      entity.knowledgeRevision,

    statistics,
    explorationTelemetry,
  });
}
