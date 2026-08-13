import {
  InjectionToken,
} from '@angular/core';

import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

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
  type ProceduralLocator,
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
} from '../../data/local/indexed-db/genesis-indexed-db';

import {
  DexieDiscoveryPointsRepository,
} from '../../data/local/repository/dexie-discovery-points.repository';

import {
  DexieDiscoveryRepository,
  type ProceduralTargetSeedResolver,
} from '../../data/local/repository/dexie-discovery.repository';

import {
  DiscoveryRewardEngine,
} from '../../simulation/exploration/discovery-reward-engine';

import {
  ExplorationProgressOverviewEngine,
} from '../../simulation/exploration/exploration-progress-overview-engine';

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
}

export interface ExplorationSectorProgressRuntime {
  commitResolvedResult(
    result:
      ExplorationSectorResult,
  ): Promise<ExplorationSectorProgressResult>;
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

    const globalBefore =
      await this
        .pointsRepository
        .getGlobalDiscoveryPoints(
          generationKey,
        );

    const discoveriesBefore =
      await this
        .discoveryRepository
        .getKnownDiscoveries(
          generationKey,
        );

    const galaxyBefore =
      ExplorationProgressOverviewEngine
        .buildProgressOverview(
          generationKey,
          globalBefore,
          galaxyIndex,
          discoveriesBefore,
        )
        .galaxyProgress
        .galaxyProgressUnits;

    const sectorTransition =
      await this
        .advanceToDetected(
          generationKey,
          result
            .scanResult
            .selection
            .sectorLocator,
        );

    const targetTransition =
      result.targetLocator ===
      null
        ? null
        : await this
          .advanceToDetected(
            generationKey,
            result.targetLocator,
          );

    const awardedDiscoveryPoints =
      sectorTransition
        .awardedDiscoveryPoints +
      (
        targetTransition
          ?.awardedDiscoveryPoints ??
        0
      );

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

    const discoveriesAfter =
      await this
        .discoveryRepository
        .getKnownDiscoveries(
          generationKey,
        );

    const galaxyAfter =
      ExplorationProgressOverviewEngine
        .buildProgressOverview(
          generationKey,
          globalAfter,
          galaxyIndex,
          discoveriesAfter,
        )
        .galaxyProgress
        .galaxyProgressUnits;

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
  ): Promise<DetectedTransition> {

    const previousState =
      DiscoveryState
        .fromCode(
          (
            await this
              .discoveryRepository
              .getState(
                generationKey,
                locator,
              )
          ).code,
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
    };
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
