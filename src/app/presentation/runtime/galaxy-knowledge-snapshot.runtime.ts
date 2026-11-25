import { canonicalGalaxyKnownDiscoveries } from '../../domain/exploration/galaxy-known-discoveries-canonical';
import { confirmedScientificDiscoveries38BisB7 } from '../../domain/exploration/scientific-confirmation-38-bis-b7';
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
  DiscoveryState,
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
  16; // L.1: moon mass hierarchy changed; invalidate derived moon/census catalogues only.

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

  /** Optional for tests implementing the earlier contract. Production stores
   * confirmed-only projections in IndexedDB so LRU eviction is cheap. */
  resolveConfirmedTelemetry?(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    galaxyState: DiscoveryStateValue,
    knownDiscoveries: readonly KnownDiscovery[],
    knowledgeRevision: string,
  ): Promise<GalaxyExplorationTelemetry>;
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

  // A single hot galaxy snapshot is insufficient for A -> B -> A navigation.
  // Keep a small, revision-scoped LRU of *derived observed knowledge*, never
  // private procedural data. Revision equality is checked before every hit.
  private readonly hotSnapshots = new Map<string, GalaxyKnowledgeSnapshot>();
  private readonly maxHotSnapshots = 6;
  // Keep memory bounded; the durable scientific fragment survives any LRU
  // eviction and a complete component/application reload.
  private readonly confirmedTelemetryHot = new Map<string, Readonly<{
    revision: string;
    telemetry: GalaxyExplorationTelemetry;
  }>>();
  private readonly confirmedTelemetryInflight = new Map<string, Promise<GalaxyExplorationTelemetry>>();
  private readonly latestConfirmedTelemetryRevision = new Map<string, string>();
  private readonly maxConfirmedTelemetryHot = 6;

  constructor(
    private readonly repository: GalaxyKnowledgeSnapshotRepository,
    private readonly clock: () => number = Date.now,
  ) {}

  private remember(identity: string, snapshot: GalaxyKnowledgeSnapshot): GalaxyKnowledgeSnapshot {
    this.hotSnapshots.delete(identity);
    this.hotSnapshots.set(identity, snapshot);
    if (this.hotSnapshots.size > this.maxHotSnapshots) {
      this.hotSnapshots.delete(this.hotSnapshots.keys().next().value!);
    }
    return snapshot;
  }

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

    const identity = [
      generationKey.universeSeed.serialize(),
      generationKey.generatorVersionCode,
      galaxyIndex.toString(10),
      GALAXY_SCIENTIFIC_MODEL_VERSION,
    ].join('/');
    const hot = this.hotSnapshots.get(identity);
    if (hot?.knowledgeRevision === knowledgeRevision) {
      return this.remember(identity, hot);
    }
    // An earlier identity with changed confirmed knowledge must not survive
    // this read, even if the persisted snapshot has not yet been rewritten.
    this.hotSnapshots.delete(identity);

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
      return this.remember(identity, restoreSnapshot(existing));
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

    return this.remember(identity, Object.freeze({
      knowledgeRevision,
      statistics,
      explorationTelemetry,
    }));
  }

  async resolveConfirmedTelemetry(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    galaxyState: DiscoveryStateValue,
    knownDiscoveries: readonly KnownDiscovery[],
    knowledgeRevision: string,
  ): Promise<GalaxyExplorationTelemetry> {
    // Knowledge revision is always computed from the canonical *persisted*
    // discovery rows by resolve(); no signal or procedural private data used.
    const identity = [
      generationKey.universeSeed.serialize(),
      generationKey.generatorVersionCode,
      galaxyIndex.toString(10),
      GALAXY_SCIENTIFIC_MODEL_VERSION,
    ].join('/');
    const revision = `${knowledgeRevision}/${galaxyState.code}`;
    this.latestConfirmedTelemetryRevision.set(identity, revision);
    const cached = this.confirmedTelemetryHot.get(identity);
    if (cached?.revision === revision) {
      this.confirmedTelemetryHot.delete(identity);
      this.confirmedTelemetryHot.set(identity, cached);
      return cached.telemetry;
    }
    this.confirmedTelemetryHot.delete(identity);

    const pendingKey = `${identity}|${revision}`;
    const inflight = this.confirmedTelemetryInflight.get(pendingKey);
    if (inflight) return inflight;

    const pending = this.loadConfirmedTelemetry(
      generationKey, galaxyIndex, knownDiscoveries, knowledgeRevision, revision,
    ).then(telemetry => {
      // Do not overwrite a newer revision already warmed by a concurrent load.
      if (this.latestConfirmedTelemetryRevision.get(identity) === revision) {
        this.confirmedTelemetryHot.delete(identity);
        this.confirmedTelemetryHot.set(identity, Object.freeze({revision, telemetry}));
        if (this.confirmedTelemetryHot.size > this.maxConfirmedTelemetryHot) {
          this.confirmedTelemetryHot.delete(this.confirmedTelemetryHot.keys().next().value!);
        }
      }
      return telemetry;
    });
    this.confirmedTelemetryInflight.set(pendingKey, pending);
    try {
      return await pending;
    } finally {
      if (this.confirmedTelemetryInflight.get(pendingKey) === pending) {
        this.confirmedTelemetryInflight.delete(pendingKey);
      }
    }
  }

  private async loadConfirmedTelemetry(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    knownDiscoveries: readonly KnownDiscovery[],
    knowledgeRevision: string,
    revision: string,
  ): Promise<GalaxyExplorationTelemetry> {
    const persisted = await this.repository.get(
      generationKey, galaxyIndex, GALAXY_SCIENTIFIC_MODEL_VERSION,
    );
    if (
      persisted?.knowledgeRevision === knowledgeRevision &&
      persisted.confirmedScientificTelemetryRevision === revision &&
      persisted.confirmedScientificTelemetryJson !== undefined
    ) {
      // A damaged derived fragment may be safely rebuilt. A different
      // revision MUST NEVER be reused, even if the old one was CONFIRMED.
      try {
        return restoreTelemetryJson(persisted.confirmedScientificTelemetryJson);
      } catch {
        // Recalculate from authorized records and overwrite this fragment.
      }
    }

    const confirmedDiscoveries = confirmedScientificDiscoveries38BisB7(knownDiscoveries);
    const computed = GalaxyExplorationTelemetryEngine.build(
      generationKey,
      galaxyIndex,
      // Confirmed-only telemetry is a projection, not an upgrade to the
      // planet/galaxy's persisted discovery state.
      DiscoveryState.CONFIRMED,
      confirmedDiscoveries,
      generateKnownCompactHostCatalog(generationKey, galaxyIndex, confirmedDiscoveries)
        .map(entry => entry.host),
    );

    const json = stringifyBigIntTree(computed);
    const update = this.repository.updateConfirmedScientificTelemetryIfRevisionMatches;
    if (update) {
      // Atomic compare-and-update prevents an old background projection from
      // overwriting a newer galaxy snapshot after an observation transition.
      await update.call(
        this.repository, generationKey, galaxyIndex,
        GALAXY_SCIENTIFIC_MODEL_VERSION, knowledgeRevision, revision, json,
      );
    } else {
      // Backwards-compatible mock repository. Production always uses the
      // atomic path above; never use an unsafe read-modify-write there.
      const latest = await this.repository.get(
        generationKey, galaxyIndex, GALAXY_SCIENTIFIC_MODEL_VERSION,
      );
      if (latest?.knowledgeRevision === knowledgeRevision) {
        await this.repository.put({
          ...latest,
          confirmedScientificTelemetryRevision: revision,
          confirmedScientificTelemetryJson: json,
        });
      }
    }
    return computed;
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

  const explorationTelemetry = restoreTelemetryJson(entity.explorationTelemetryJson);

  const statistics =
    new GalaxyKnowledgeStatistics(
      rawStatistics.galaxyIndex,
      rawStatistics.progressUnits,
      rawStatistics.knownRecords,
      rawStatistics.targetCounts,
      rawStatistics.stateCounts,
    );


  return Object.freeze({
    knowledgeRevision:
      entity.knowledgeRevision,

    statistics,
    explorationTelemetry,
  });
}

/** Restore through the same domain invariant checks as the existing snapshot. */
function restoreTelemetryJson(json: string): GalaxyExplorationTelemetry {
  const raw = parseBigIntTree(json) as {
    totalSectors: bigint | null;
    exploredPercentageBasisPoints: bigint | null;
    inventory: GalaxyExplorationTelemetry['inventory'];
    breakdown: GalaxyExplorationTelemetry['breakdown'];
    compactHostSystems?: GalaxyExplorationTelemetry['compactHostSystems'];
    compactHostPlanets?: bigint;
  };
  return new GalaxyExplorationTelemetry(
    raw.totalSectors,
    raw.exploredPercentageBasisPoints,
    raw.inventory,
    raw.breakdown,
    raw.compactHostSystems,
    raw.compactHostPlanets ?? 0n,
  );
}
