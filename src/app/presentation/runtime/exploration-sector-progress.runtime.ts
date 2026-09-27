import {
  InjectionToken,
} from '@angular/core';

import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  type KnownDiscovery,
} from '../../domain/discovery/known-discovery';

import {
  DiscoveryTargetType,
} from '../../domain/discovery/discovery-target-type';

import {
  type ExplorationSectorProgressResult,
  ExplorationSectorProgressResult as SectorProgressResult,
} from '../../domain/exploration/exploration-sector-progress-result';

import {
  type ExplorationSectorResult,
} from '../../domain/exploration/exploration-sector-result';

import {
  DiscoveryRewardReason,
} from '../../domain/exploration/discovery-reward-reason';

import {
  GalacticObjectLocator,
  GalaxyLocator,
  type ProceduralLocator,
  SectorLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type DiscoveryPointsRepository,
  type DiscoveryRepository,
} from '../../domain/repository/genesis-repositories';

import {
  GenesisIndexedDb,
  type DiscoveryEntityKey,
} from '../../data/local/indexed-db/genesis-indexed-db';

import {
  createDiscoveryEntity,
} from '../../data/local/entity/discovery.entity';

import {
  DexieDiscoveryPointsRepository,
} from '../../data/local/repository/dexie-discovery-points.repository';

import {
  DexieDiscoveryRepository,
  type ProceduralTargetSeedResolver,
} from '../../data/local/repository/dexie-discovery.repository';

import {
  generationKeyStorageParts,
} from '../../data/local/repository/local-repository-support';

import {
  DiscoveryRewardEngine,
} from '../../simulation/exploration/discovery-reward-engine';

import {
  GalaxyOperationalAccessPolicy,
} from '../../simulation/exploration/galaxy-operational-access-policy';

import {
  ProceduralTargetResolver,
} from '../../simulation/regeneration/procedural-target-resolver';

const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

const NO_REWARD_REASONS =
  new Set<DiscoveryRewardReason>();

interface DetectedTransition {
  readonly state:
    DiscoveryStateValue;

  readonly awardedDiscoveryPoints:
    number;

  readonly galaxyProgressUnitsDelta:
    bigint;
}

export interface ExplorationSectorBlockCommitResult {
  readonly processedSectors: number;
  readonly awardedDiscoveryPoints: number;
  readonly globalDiscoveryPointsBefore: bigint;
  readonly globalDiscoveryPointsAfter: bigint;
  readonly galaxyProgressUnitsBefore: bigint;
  readonly galaxyProgressUnitsAfter: bigint;
}

export interface ExplorationSectorProgressRuntime {
  commitResolvedResult(
    result:
      ExplorationSectorResult,
  ): Promise<ExplorationSectorProgressResult>;

  commitResolvedResults?(
    results:
      readonly ExplorationSectorResult[],
  ): Promise<ExplorationSectorBlockCommitResult>;
}

/**
 * Point-9.5 persistence boundary.
 *
 * DiscoveryState writes and global PD are committed in one Dexie transaction.
 * Local galaxy progress remains derived from the persisted KnownDiscovery
 * snapshot and is never stored as a second counter.
 */
export class DexieExplorationSectorProgressRuntime
  implements ExplorationSectorProgressRuntime {

  constructor(
    private readonly database:
      GenesisIndexedDb,

    private readonly pointsRepository:
      DiscoveryPointsRepository,

    private readonly discoveryRepository:
      DiscoveryRepository,
  ) {}

  async commitResolvedResult(
    result:
      ExplorationSectorResult,
  ): Promise<ExplorationSectorProgressResult> {

    await this
      .database
      .openDatabase();

    return this
      .database
      .transaction(
        'rw',
        this.database.universes,
        this.database.discoveries,
        this.database.progress,
        async () =>
          this.commitInsideTransaction(
            result,
          ),
      );
  }

  /**
   * Step 2 performance path for one already-resolved sector block.
   *
   * The whole block performs one exact bulk read of the locators that may be
   * touched, one bulk write for new UNKNOWN -> DETECTED rows and one global-PD
   * update. Galaxy progress is aggregated once before the batch and advanced
   * from the known number of newly materialized rows.
   */
  async commitResolvedResults(
    results:
      readonly ExplorationSectorResult[],
  ): Promise<ExplorationSectorBlockCommitResult> {

    if (results.length === 0) {
      return {
        processedSectors: 0,
        awardedDiscoveryPoints: 0,
        globalDiscoveryPointsBefore: 0n,
        globalDiscoveryPointsAfter: 0n,
        galaxyProgressUnitsBefore: 0n,
        galaxyProgressUnitsAfter: 0n,
      };
    }

    await this.database.openDatabase();

    return this.database.transaction(
      'rw',
      this.database.universes,
      this.database.discoveries,
      this.database.progress,
      async () => this.commitBlockInsideTransaction(results),
    );
  }

  private async commitBlockInsideTransaction(
    results:
      readonly ExplorationSectorResult[],
  ): Promise<ExplorationSectorBlockCommitResult> {

    const firstSelection = results[0].scanResult.selection;
    const generationKey = firstSelection.generationKey;
    const galaxyIndex = firstSelection.galaxyIndex;

    for (const result of results) {
      const selection = result.scanResult.selection;
      if (
        !selection.generationKey.equals(generationKey) ||
        selection.galaxyIndex !== galaxyIndex
      ) {
        throw new RangeError(
          'Block exploration results must belong to one UniverseGenerationKey and galaxy.',
        );
      }
    }

    const galaxyKnowledgeState =
      await this.discoveryRepository.getState(
        generationKey,
        new GalaxyLocator(galaxyIndex),
      );

    GalaxyOperationalAccessPolicy.assertSectorExplorationAllowed(
      galaxyIndex,
      galaxyKnowledgeState,
    );

    const globalBefore =
      await this.pointsRepository.getGlobalDiscoveryPoints(generationKey);

    const galaxyBefore =
      await this.getGalaxyProgressUnits(generationKey, galaxyIndex);

    const { universeSeed, generatorVersionCode } =
      generationKeyStorageParts(generationKey);

    const candidates: Array<{
      readonly locator: SectorLocator | SystemLocator | GalacticObjectLocator;
      readonly key: DiscoveryEntityKey;
    }> = [];

    const uniqueCandidateKeys = new Set<string>();

    for (const result of results) {
      const locators: readonly (SectorLocator | SystemLocator | GalacticObjectLocator)[] = [
        result.scanResult.selection.sectorLocator,
        ...result.locatedTargets.map(target => target.locator),
      ];

      for (const locator of locators) {
        const targetType = DiscoveryTargetType.fromLocator(locator);
        const targetSeed = TARGET_SEED_RESOLVER.resolveTargetSeedNormalized(
          generationKey,
          locator,
        );
        const key = [
          universeSeed,
          generatorVersionCode,
          targetType.code,
          targetSeed,
        ] as const;
        const identity = `${targetType.code}:${targetSeed}`;

        if (uniqueCandidateKeys.has(identity)) {
          continue;
        }

        uniqueCandidateKeys.add(identity);
        candidates.push({ locator, key });
      }
    }

    const existing =
      await this.database.discoveries.bulkGet(
        candidates.map(candidate => candidate.key),
      );

    const now = Date.now();
    const newEntities: NonNullable<ReturnType<typeof createDiscoveryEntity>>[] = [];
    let awardedDiscoveryPoints = 0;

    for (let index = 0; index < candidates.length; index++) {
      if (existing[index] !== undefined) {
        continue;
      }

      const locator = candidates[index].locator;
      const targetType = DiscoveryTargetType.fromLocator(locator);
      const targetSeed = candidates[index].key[3];
      const reward = DiscoveryRewardEngine.evaluateDiscoveryReward(
        generationKey,
        targetType,
        DiscoveryState.UNKNOWN,
        DiscoveryState.DETECTED,
        NO_REWARD_REASONS,
      );

      awardedDiscoveryPoints += reward.totalAwardedDiscoveryPoints;

      const entity = createDiscoveryEntity({
        universeSeed,
        generatorVersionCode,
        targetTypeCode: targetType.code,
        targetSeed,
        ...explorationLocatorLineage(locator),
        state: DiscoveryState.DETECTED,
        firstKnownAtEpochMs: now,
        updatedAtEpochMs: now,
      });

      if (entity === null) {
        throw new RangeError(
          'DETECTED block discovery unexpectedly produced no persisted entity.',
        );
      }

      newEntities.push(entity);
    }

    const globalAfter = globalBefore + BigInt(awardedDiscoveryPoints);

    if (globalAfter > SIGNED_LONG_MAX) {
      throw new RangeError(
        'Point-9.5 global Discovery Points exceed signed Long range.',
      );
    }

    if (newEntities.length > 0) {
      await this.database.discoveries.bulkPut(newEntities);
    }

    if (awardedDiscoveryPoints > 0) {
      await this.pointsRepository.setGlobalDiscoveryPoints(
        generationKey,
        globalAfter,
      );
    }

    const galaxyAfter = galaxyBefore + BigInt(newEntities.length);

    return {
      processedSectors: results.length,
      awardedDiscoveryPoints,
      globalDiscoveryPointsBefore: globalBefore,
      globalDiscoveryPointsAfter: globalAfter,
      galaxyProgressUnitsBefore: galaxyBefore,
      galaxyProgressUnitsAfter: galaxyAfter,
    };
  }

  private async commitInsideTransaction(
    result:
      ExplorationSectorResult,
  ): Promise<ExplorationSectorProgressResult> {

    const generationKey =
      result
        .scanResult
        .selection
        .generationKey;

    const galaxyIndex =
      result
        .scanResult
        .selection
        .galaxyIndex;

    const galaxyKnowledgeState =
      await this
        .discoveryRepository
        .getState(
          generationKey,
          new GalaxyLocator(
            galaxyIndex,
          ),
        );

    GalaxyOperationalAccessPolicy
      .assertSectorExplorationAllowed(
        galaxyIndex,
        galaxyKnowledgeState,
      );

    const globalBefore =
      await this
        .pointsRepository
        .getGlobalDiscoveryPoints(
          generationKey,
        );

    const sectorDiscoveriesBefore =
      await this
        .discoveryRepository
        .getKnownDiscoveriesInSector(
          generationKey,
          galaxyIndex,
          result
            .scanResult
            .selection
            .coordinates,
        );

    const galaxyBefore =
      await this
        .getGalaxyProgressUnits(
          generationKey,
          galaxyIndex,
        );

    const sectorLocator =
      result
        .scanResult
        .selection
        .sectorLocator;

    const sectorTransition =
      await this
        .advanceToDetected(
          generationKey,
          sectorLocator,
          stateFromSectorSnapshot(
            sectorDiscoveriesBefore,
            sectorLocator,
          ),
        );

    const primaryLocator =
      result.targetLocator;

    let targetTransition:
      DetectedTransition |
      null =
      null;

    let targetAwardedDiscoveryPoints =
      0;

    let targetGalaxyProgressUnitsDelta =
      0n;

    for (
      const target
      of result.locatedTargets
    ) {
      const transition =
        await this
          .advanceToDetected(
            generationKey,
            target.locator,
            stateFromSectorSnapshot(
              sectorDiscoveriesBefore,
              target.locator,
            ),
          );

      targetAwardedDiscoveryPoints +=
        transition
          .awardedDiscoveryPoints;

      targetGalaxyProgressUnitsDelta +=
        transition
          .galaxyProgressUnitsDelta;

      if (
        primaryLocator !==
          null &&
        sameLocatedLocator(
          target.locator,
          primaryLocator,
        )
      ) {
        targetTransition =
          transition;
      }
    }

    const awardedDiscoveryPoints =
      sectorTransition
        .awardedDiscoveryPoints +
      targetAwardedDiscoveryPoints;

    const globalAfter =
      globalBefore +
      BigInt(
        awardedDiscoveryPoints,
      );

    if (
      globalAfter >
      SIGNED_LONG_MAX
    ) {
      throw new RangeError(
        'Point-9.5 global Discovery Points exceed signed Long range.',
      );
    }

    if (
      awardedDiscoveryPoints >
      0
    ) {
      await this
        .pointsRepository
        .setGlobalDiscoveryPoints(
          generationKey,
          globalAfter,
        );
    }

    const galaxyProgressUnitsDelta =
      sectorTransition
        .galaxyProgressUnitsDelta +
      targetGalaxyProgressUnitsDelta;

    const galaxyAfter =
      galaxyBefore +
      galaxyProgressUnitsDelta;

    return new SectorProgressResult(
      awardedDiscoveryPoints,
      globalBefore,
      globalAfter,
      galaxyBefore,
      galaxyAfter,
      sectorTransition.state,
      targetTransition
        ?.state ??
        null,
    );
  }

  private async advanceToDetected(
    generationKey:
      UniverseGenerationKey,

    locator:
      ProceduralLocator,

    previousStateValue:
      DiscoveryStateValue,
  ): Promise<DetectedTransition> {

    const previousState =
      DiscoveryState
        .fromCode(
          previousStateValue
            .code,
        );

    if (
      previousState.code >=
      DiscoveryState.DETECTED.code
    ) {
      return {
        state:
          previousState,

        awardedDiscoveryPoints:
          0,

        galaxyProgressUnitsDelta:
          0n,
      };
    }

    const reward =
      DiscoveryRewardEngine
        .evaluateDiscoveryReward(
          generationKey,
          DiscoveryTargetType
            .fromLocator(
              locator,
            ),
          previousState,
          DiscoveryState.DETECTED,
          NO_REWARD_REASONS,
        );

    await this
      .discoveryRepository
      .setState(
        generationKey,
        locator,
        DiscoveryState.DETECTED,
      );

    return {
      state:
        DiscoveryState.DETECTED,

      awardedDiscoveryPoints:
        reward
          .totalAwardedDiscoveryPoints,

      galaxyProgressUnitsDelta:
        1n,
    };
  }

  /**
   * Reads only the rows for the active galaxy and sums the persisted
   * DiscoveryState codes. Unlike getKnownDiscoveries(), this does not sort,
   * rehydrate locators or regenerate/validate procedural target seeds.
   *
   * The post-write total is derived from known UNKNOWN -> DETECTED deltas,
   * so sector exploration no longer performs a second whole-universe
   * discovery snapshot.
   *
   * Step 2 (block exploration) can hoist this one lightweight aggregate
   * outside the per-sector loop.
   */
  private async getGalaxyProgressUnits(
    generationKey:
      UniverseGenerationKey,

    galaxyIndex:
      bigint,
  ): Promise<bigint> {

    const {
      universeSeed,
      generatorVersionCode,
    } =
      generationKeyStorageParts(
        generationKey,
      );

    let total =
      0n;

    await this
      .database
      .discoveries
      .where(
        '[universeSeed+generatorVersionCode+galaxyIndex]',
      )
      .equals([
        universeSeed,
        generatorVersionCode,
        galaxyIndex
          .toString(
            10,
          ),
      ])
      .each(
        (
          entity,
        ) => {
          total +=
            BigInt(
              entity
                .discoveryStateCode,
            );
        },
      );

    return total;
  }
}

const TARGET_SEED_RESOLVER:
  ProceduralTargetSeedResolver =
  Object.freeze({
    resolveTargetSeedNormalized(
      generationKey:
        UniverseGenerationKey,

      locator:
        ProceduralLocator,
    ): string {

      return ProceduralTargetResolver
        .resolveTargetSeed(
          generationKey,
          locator,
        )
        .normalizedValue;
    },
  });

function stateFromSectorSnapshot(
  snapshot:
    readonly KnownDiscovery[],

  locator:
    SectorLocator |
    SystemLocator |
    GalacticObjectLocator,
): DiscoveryStateValue {

  for (
    const discovery
    of snapshot
  ) {
    if (
      sameSectorPersistedLocator(
        discovery.locator,
        locator,
      )
    ) {
      return discovery
        .state;
    }
  }

  return DiscoveryState
    .UNKNOWN;
}

function sameSectorPersistedLocator(
  left:
    ProceduralLocator,

  right:
    SectorLocator |
    SystemLocator |
    GalacticObjectLocator,
): boolean {

  if (
    right instanceof
    SectorLocator
  ) {
    return (
      left instanceof
        SectorLocator &&
      left.galaxyIndex ===
        right.galaxyIndex &&
      left.sectorKey ===
        right.sectorKey
    );
  }

  if (
    right instanceof
    SystemLocator
  ) {
    return (
      left instanceof
        SystemLocator &&
      left.galaxyIndex ===
        right.galaxyIndex &&
      left.sectorKey ===
        right.sectorKey &&
      left.galacticObjectIndex ===
        right.galacticObjectIndex
    );
  }

  return (
    left instanceof
      GalacticObjectLocator &&
    left.galaxyIndex ===
      right.galaxyIndex &&
    left.sectorKey ===
      right.sectorKey &&
    left.galacticObjectIndex ===
      right.galacticObjectIndex
  );
}

function sameLocatedLocator(
  left:
    SystemLocator |
    GalacticObjectLocator,

  right:
    SystemLocator |
    GalacticObjectLocator,
): boolean {

  return (
    (left instanceof SystemLocator) ===
      (right instanceof SystemLocator) &&
    left.galaxyIndex ===
      right.galaxyIndex &&
    left.sectorKey ===
      right.sectorKey &&
    left.galacticObjectIndex ===
      right.galacticObjectIndex
  );
}

function explorationLocatorLineage(
  locator:
    SectorLocator |
    SystemLocator |
    GalacticObjectLocator,
): {
  readonly galaxyIndex: string;
  readonly sectorKey: string;
  readonly galacticObjectIndex: string | null;
  readonly bodyIndex: null;
  readonly civilizationIndex: null;
} {
  if (locator instanceof SectorLocator) {
    return {
      galaxyIndex: locator.galaxyIndex.toString(10),
      sectorKey: locator.sectorKey.toString(10),
      galacticObjectIndex: null,
      bodyIndex: null,
      civilizationIndex: null,
    };
  }

  return {
    galaxyIndex: locator.galaxyIndex.toString(10),
    sectorKey: locator.sectorKey.toString(10),
    galacticObjectIndex: locator.galacticObjectIndex.toString(10),
    bodyIndex: null,
    civilizationIndex: null,
  };
}

export const EXPLORATION_SECTOR_PROGRESS_RUNTIME =
  new InjectionToken<ExplorationSectorProgressRuntime>(
    'EXPLORATION_SECTOR_PROGRESS_RUNTIME',
    {
      providedIn:
        'root',

      factory:
        createExplorationSectorProgressRuntime,
    },
  );

function createExplorationSectorProgressRuntime():
  ExplorationSectorProgressRuntime {

  const database =
    new GenesisIndexedDb();

  return new DexieExplorationSectorProgressRuntime(
    database,
    new DexieDiscoveryPointsRepository(
      database,
    ),
    new DexieDiscoveryRepository(
      database,
      TARGET_SEED_RESOLVER,
    ),
  );
}
