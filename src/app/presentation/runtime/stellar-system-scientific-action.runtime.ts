import {
  InjectionToken,
} from '@angular/core';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  type ProceduralLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  InstrumentObservationSession,
} from '../../domain/observation/observation-instrument';

import {
  LeveledInstrumentObservationSession,
} from '../../domain/observation/observation-instrument-capability';

import {
  ObservationSession,
} from '../../domain/observation/observatory';

import {
  type StellarSystemScientificActionResult,
  type StellarSystemScientificActionType,
} from '../../domain/planetary/stellar-system-scientific-action';

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
  StellarSystemScientificActionEngine,
} from '../../simulation/planetary/stellar-system-scientific-action-engine';

import {
  ProceduralTargetResolver,
} from '../../simulation/regeneration/procedural-target-resolver';

const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

/** Persisted point-17.6 ANALYZE DISK outcome. */
export class CommittedStellarSystemScientificAction {

  constructor(
    readonly actionResult:
      StellarSystemScientificActionResult,

    readonly globalDiscoveryPointsBefore:
      bigint,

    readonly globalDiscoveryPointsAfter:
      bigint,
  ) {
    if (
      globalDiscoveryPointsBefore <
        0n ||
      globalDiscoveryPointsAfter <
        globalDiscoveryPointsBefore
    ) {
      throw new RangeError(
        'Committed point-17.6 Discovery Points must be monotonic and non-negative.',
      );
    }

    if (
      globalDiscoveryPointsAfter -
        globalDiscoveryPointsBefore !==
      BigInt(
        actionResult
          .awardedDiscoveryPoints,
      )
    ) {
      throw new RangeError(
        'Committed point-17.6 Discovery Point delta must match the pure action result.',
      );
    }
  }
}

export interface StellarSystemScientificActionRuntime {
  commitAction(
    observationSession:
      LeveledInstrumentObservationSession,

    actionType:
      StellarSystemScientificActionType,
  ): Promise<CommittedStellarSystemScientificAction>;
}

/**
 * Point-17.6 persistence boundary.
 *
 * ANALYZE DISK persists only the one-way DiscoveryState transition and global
 * PD in the existing Dexie transaction. The analysis report itself remains
 * regenerable Ground Truth and is never stored.
 */
export class DexieStellarSystemScientificActionRuntime
  implements StellarSystemScientificActionRuntime {

  constructor(
    private readonly database:
      GenesisIndexedDb,

    private readonly pointsRepository:
      DiscoveryPointsRepository,

    private readonly discoveryRepository:
      DiscoveryRepository,
  ) {}

  async commitAction(
    observationSession:
      LeveledInstrumentObservationSession,

    actionType:
      StellarSystemScientificActionType,
  ): Promise<CommittedStellarSystemScientificAction> {

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
            observationSession,
            actionType,
          ),
      );
  }

  private async commitInsideTransaction(
    observationSession:
      LeveledInstrumentObservationSession,

    actionType:
      StellarSystemScientificActionType,
  ): Promise<CommittedStellarSystemScientificAction> {

    const generationKey =
      observationSession
        .generationKey;

    const currentState =
      DiscoveryState.fromCode(
        (
          await this
            .discoveryRepository
            .getState(
              generationKey,
              observationSession
                .targetLocator,
            )
        ).code,
      );

    if (
      currentState.code <
        DiscoveryState.CATALOGUED.code
    ) {
      throw new RangeError(
        'Point-17.6 ANALYZE DISK requires a persisted system at DiscoveryState.CATALOGUED or higher.',
      );
    }

    const currentSession =
      rebuildWithCurrentState(
        observationSession,
        currentState,
      );

    const actionResult =
      StellarSystemScientificActionEngine
        .evaluate(
          generationKey,
          currentSession,
          actionType,
        );

    const globalBefore =
      await this
        .pointsRepository
        .getGlobalDiscoveryPoints(
          generationKey,
        );

    const globalAfter =
      globalBefore +
      BigInt(
        actionResult
          .awardedDiscoveryPoints,
      );

    if (
      globalAfter >
        SIGNED_LONG_MAX
    ) {
      throw new RangeError(
        'Point-17.6 global Discovery Points exceed signed Long range.',
      );
    }

    await this
      .discoveryRepository
      .setState(
        generationKey,
        observationSession
          .targetLocator,
        actionResult
          .newDiscoveryState,
      );

    await this
      .pointsRepository
      .setGlobalDiscoveryPoints(
        generationKey,
        globalAfter,
      );

    return new CommittedStellarSystemScientificAction(
      actionResult,
      globalBefore,
      globalAfter,
    );
  }
}

function rebuildWithCurrentState(
  observationSession:
    LeveledInstrumentObservationSession,

  currentState:
    ReturnType<
      typeof DiscoveryState.fromCode
    >,
): LeveledInstrumentObservationSession {

  const baseSession =
    new ObservationSession(
      observationSession
        .observatory,
      observationSession
        .targetLocator,
      currentState,
    );

  const instrumentSession =
    new InstrumentObservationSession(
      baseSession,
      observationSession
        .instrument,
    );

  return new LeveledInstrumentObservationSession(
    instrumentSession,
    observationSession
      .capabilityProfile,
  );
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

export const STELLAR_SYSTEM_SCIENTIFIC_ACTION_RUNTIME =
  new InjectionToken<StellarSystemScientificActionRuntime>(
    'STELLAR_SYSTEM_SCIENTIFIC_ACTION_RUNTIME',
    {
      providedIn:
        'root',

      factory:
        createStellarSystemScientificActionRuntime,
    },
  );

function createStellarSystemScientificActionRuntime():
  StellarSystemScientificActionRuntime {

  const database =
    new GenesisIndexedDb();

  return new DexieStellarSystemScientificActionRuntime(
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
