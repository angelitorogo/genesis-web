import {
  InjectionToken,
} from '@angular/core';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  type GalacticObjectScientificActionResult,
  type GalacticObjectScientificActionType,
} from '../../domain/galactic-object/galactic-object-scientific-action';

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
  GalacticObjectScientificActionEngine,
} from '../../simulation/galactic-object/galactic-object-scientific-action-engine';

import {
  ProceduralTargetResolver,
} from '../../simulation/regeneration/procedural-target-resolver';

const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

/**
 * Persisted point-12.7 action outcome.
 */
export class CommittedGalacticObjectScientificAction {

  constructor(
    readonly actionResult:
      GalacticObjectScientificActionResult,

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
        'Committed scientific-action Discovery Points must be monotonic and non-negative.',
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
        'Committed scientific-action Discovery Point delta must match the pure action result.',
      );
    }
  }
}

export interface GalacticObjectScientificActionRuntime {
  commitAction(
    observationSession:
      LeveledInstrumentObservationSession,

    actionType:
      GalacticObjectScientificActionType,
  ): Promise<CommittedGalacticObjectScientificAction>;
}

/**
 * Point-12.7 persistence boundary.
 *
 * DiscoveryState and global PD are committed in one Dexie transaction. No
 * separate scientific-action history is required for V1 because each action
 * is a one-way DiscoveryState milestone transition and therefore cannot be
 * farmed repeatedly.
 */
export class DexieGalacticObjectScientificActionRuntime
  implements GalacticObjectScientificActionRuntime {

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
      GalacticObjectScientificActionType,
  ): Promise<CommittedGalacticObjectScientificAction> {

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
      GalacticObjectScientificActionType,
  ): Promise<CommittedGalacticObjectScientificAction> {

    const generationKey =
      observationSession
        .generationKey;

    const currentState =
      DiscoveryState
        .fromCode(
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
      DiscoveryState.DETECTED.code
    ) {
      throw new RangeError(
        'Point-12.7 scientific actions require a persisted target at DiscoveryState.DETECTED or higher.',
      );
    }

    const currentSession =
      rebuildWithCurrentState(
        observationSession,
        currentState,
      );

    const actionResult =
      GalacticObjectScientificActionEngine
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
        'Point-12.7 global Discovery Points exceed signed Long range.',
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

    return new CommittedGalacticObjectScientificAction(
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

export const GALACTIC_OBJECT_SCIENTIFIC_ACTION_RUNTIME =
  new InjectionToken<GalacticObjectScientificActionRuntime>(
    'GALACTIC_OBJECT_SCIENTIFIC_ACTION_RUNTIME',
    {
      providedIn:
        'root',

      factory:
        createGalacticObjectScientificActionRuntime,
    },
  );

function createGalacticObjectScientificActionRuntime():
  GalacticObjectScientificActionRuntime {

  const database =
    new GenesisIndexedDb();

  return new DexieGalacticObjectScientificActionRuntime(
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
