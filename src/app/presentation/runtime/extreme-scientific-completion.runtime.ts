import {
  InjectionToken,
} from '@angular/core';

import {
  type ScientificEvidence,
} from '../../domain/discovery/scientific-evidence';

import {
  DiscoveryTargetType,
} from '../../domain/discovery/discovery-target-type';

import {
  type ExtremeType,
} from '../../domain/galactic-object/extreme-object-type';

import {
  GalacticObjectScientificSubject,
} from '../../domain/galactic-object/galactic-object-scientific-subject';

import {
  GalaxyLocator,
  GalacticObjectLocator,
  type ProceduralLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GenesisIndexedDb,
} from '../../data/local/indexed-db/genesis-indexed-db';

import {
  DexieDiscoveryPointsRepository,
} from '../../data/local/repository/dexie-discovery-points.repository';

import {
  type ProceduralTargetSeedResolver,
} from '../../data/local/repository/dexie-discovery.repository';

import {
  DexieScientificEvidenceRepository,
} from '../../data/local/repository/dexie-scientific-evidence.repository';

import {
  ensureUniverseExists,
  generationKeyStorageParts,
  normalizeTargetSeed,
} from '../../data/local/repository/local-repository-support';

import {
  ExtremeScientificCompletionEngine,
  type ExtremeScientificCompletionEvaluation,
  type ExtremeScientificStudyStatus,
} from '../../simulation/galactic-object/extreme-scientific-completion-engine';

import {
  ProceduralTargetResolver,
} from '../../simulation/regeneration/procedural-target-resolver';

const EXTREME_SCIENTIFIC_COMPLETION_OBSERVATION_KIND_V1 =
  'EXTREME_SCIENTIFIC_COMPLETION_V1';

const EXTREME_SCIENTIFIC_COMPLETION_PAYLOAD_VERSION_V1 =
  1;

const CompletionLedgerCode =
  Object.freeze({
    EVENT_HORIZON_COMPLETED:
      'EVENT_HORIZON_COMPLETED',

    REWARD_GRANTED:
      'REWARD_GRANTED',
  } as const);

type CompletionLedgerCode =
  typeof CompletionLedgerCode[
    keyof typeof CompletionLedgerCode
  ];

export interface ExtremeScientificCompletionStatus {
  readonly studies:
    readonly ExtremeScientificStudyStatus[];

  readonly completedStudies:
    number;

  readonly totalStudies:
    number;

  readonly completionPercent:
    number;

  readonly complete:
    boolean;

  readonly rewardDiscoveryPoints:
    bigint;

  readonly rewardGranted:
    boolean;

  readonly rewardGrantedNow:
    boolean;
}

export interface ExtremeScientificCompletionRuntime {
  settle(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,

    extremeType:
      ExtremeType,

    scientificSubject:
      GalacticObjectScientificSubject | null,
  ): Promise<ExtremeScientificCompletionStatus | null>;

  recordEventHorizonSimulationCompletion(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,
  ): Promise<void>;
}

/**
 * 28.7 persistence/reward coordinator.
 *
 * Physical study completion is read from the canonical ScientificEvidence rows
 * written by 28.1/28.3/28.4/28.5/28.6. The non-observational 28.2 simulation
 * and the one-shot reward use a separate completion ledger in the existing
 * generic observations store, so neither is misrepresented as physical
 * evidence and no IndexedDB schema migration is required.
 */
export class DexieExtremeScientificCompletionRuntime
  implements ExtremeScientificCompletionRuntime {

  private readonly evidenceRepository:
    DexieScientificEvidenceRepository;

  private readonly pointsRepository:
    DexieDiscoveryPointsRepository;

  constructor(
    private readonly database:
      GenesisIndexedDb,

    private readonly targetSeedResolver:
      ProceduralTargetSeedResolver =
      TARGET_SEED_RESOLVER,

    private readonly clock:
      () => number =
      Date.now,
  ) {
    this.evidenceRepository =
      new DexieScientificEvidenceRepository(
        database,
        targetSeedResolver,
      );

    this.pointsRepository =
      new DexieDiscoveryPointsRepository(
        database,
        clock,
      );
  }

  async settle(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,

    extremeType:
      ExtremeType,

    scientificSubject:
      GalacticObjectScientificSubject | null,
  ): Promise<ExtremeScientificCompletionStatus | null> {

    await this.database
      .openDatabase();

    let snapshot =
      await this.evaluate(
        generationKey,
        locator,
        extremeType,
        scientificSubject,
      );

    if (
      snapshot ===
        null
    ) {
      return null;
    }

    if (
      !snapshot.evaluation.complete ||
      snapshot.ledger.rewardGranted
    ) {
      return toStatus(
        snapshot.evaluation,
        snapshot.ledger,
        false,
      );
    }

    let rewardGrantedNow =
      false;

    await this.database
      .transaction(
        'rw',
        this.database.universes,
        this.database.progress,
        this.database.observations,
        async () => {
          const current =
            await this.evaluate(
              generationKey,
              locator,
              extremeType,
              scientificSubject,
            );

          if (
            current ===
              null ||
            !current.evaluation.complete ||
            current.ledger.rewardGranted
          ) {
            return;
          }

          const reward =
            current.evaluation
              .rewardDiscoveryPoints;

          if (
            reward <=
              0n
          ) {
            return;
          }

          const pointsBefore =
            await this.pointsRepository
              .getGlobalDiscoveryPoints(
                generationKey,
              );

          await this.pointsRepository
            .setGlobalDiscoveryPoints(
              generationKey,
              pointsBefore +
                reward,
            );

          await this.putLedgerEntry(
            generationKey,
            locator,
            CompletionLedgerCode.REWARD_GRANTED,
            {
              code:
                CompletionLedgerCode.REWARD_GRANTED,
              rewardDiscoveryPoints:
                reward.toString(10),
            },
          );

          rewardGrantedNow =
            true;
        },
      );

    snapshot =
      await this.evaluate(
        generationKey,
        locator,
        extremeType,
        scientificSubject,
      );

    if (
      snapshot ===
        null
    ) {
      return null;
    }

    return toStatus(
      snapshot.evaluation,
      snapshot.ledger,
      rewardGrantedNow,
    );
  }

  async recordEventHorizonSimulationCompletion(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,
  ): Promise<void> {

    await this.database
      .openDatabase();

    const ledger =
      await this.readLedger(
        generationKey,
        locator,
      );

    if (
      ledger.eventHorizonCompleted
    ) {
      return;
    }

    await this.putLedgerEntry(
      generationKey,
      locator,
      CompletionLedgerCode.EVENT_HORIZON_COMPLETED,
      {
        code:
          CompletionLedgerCode.EVENT_HORIZON_COMPLETED,
      },
    );
  }

  private async evaluate(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,

    extremeType:
      ExtremeType,

    scientificSubject:
      GalacticObjectScientificSubject | null,
  ): Promise<RuntimeEvaluation | null> {

    const [
      targetEvidence,
      galaxyEvidence,
      ledger,
    ] =
      await Promise.all([
        this.evidenceRepository
          .getEvidence(
            generationKey,
            locator,
          ),
        scientificSubject ===
          GalacticObjectScientificSubject.ACTIVE_GALACTIC_NUCLEUS
          ? this.evidenceRepository
              .getEvidence(
                generationKey,
                new GalaxyLocator(
                  locator.galaxyIndex,
                ),
              )
          : Promise.resolve(
              Object.freeze([]) as readonly ScientificEvidence[],
            ),
        this.readLedger(
          generationKey,
          locator,
        ),
      ]);

    const evaluation =
      ExtremeScientificCompletionEngine
        .evaluate(
          extremeType,
          scientificSubject,
          targetEvidence,
          galaxyEvidence,
          ledger.eventHorizonCompleted,
        );

    if (
      evaluation ===
        null
    ) {
      return null;
    }

    return Object.freeze({
      evaluation,
      ledger,
    });
  }

  private async readLedger(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,
  ): Promise<CompletionLedgerState> {

    await ensureUniverseExists(
      this.database,
      generationKey,
    );

    const identity =
      this.targetIdentity(
        generationKey,
        locator,
      );

    const [
      horizonEntity,
      rewardEntity,
    ] =
      await Promise.all([
        this.database.observations.get(
          completionObservationId(
            identity,
            CompletionLedgerCode.EVENT_HORIZON_COMPLETED,
          ),
        ),
        this.database.observations.get(
          completionObservationId(
            identity,
            CompletionLedgerCode.REWARD_GRANTED,
          ),
        ),
      ]);

    const horizonPayload =
      parseLedgerPayload(
        horizonEntity,
        CompletionLedgerCode.EVENT_HORIZON_COMPLETED,
      );

    const rewardPayload =
      parseLedgerPayload(
        rewardEntity,
        CompletionLedgerCode.REWARD_GRANTED,
      );

    const rewardDiscoveryPoints =
      rewardPayload ===
        null ||
      !('rewardDiscoveryPoints' in rewardPayload)
        ? null
        : parseNonNegativeBigInt(
            rewardPayload.rewardDiscoveryPoints,
          );

    return Object.freeze({
      eventHorizonCompleted:
        horizonPayload !==
        null,
      rewardGranted:
        rewardPayload !==
        null,
      rewardDiscoveryPoints,
    });
  }

  private async putLedgerEntry(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,

    code:
      CompletionLedgerCode,

    payload:
      CompletionLedgerPayload,
  ): Promise<void> {

    await ensureUniverseExists(
      this.database,
      generationKey,
    );

    const identity =
      this.targetIdentity(
        generationKey,
        locator,
      );

    const id =
      completionObservationId(
        identity,
        code,
      );

    const existing =
      await this.database
        .observations
        .get(
          id,
        );

    if (
      existing !==
        undefined
    ) {
      parseLedgerPayload(
        existing,
        code,
      );

      return;
    }

    await this.database
      .observations
      .put({
        id,
        universeSeed:
          identity.universeSeed,
        generatorVersionCode:
          identity.generatorVersionCode,
        targetTypeCode:
          identity.targetTypeCode,
        targetSeed:
          identity.targetSeed,
        observationKind:
          EXTREME_SCIENTIFIC_COMPLETION_OBSERVATION_KIND_V1,
        payloadVersion:
          EXTREME_SCIENTIFIC_COMPLETION_PAYLOAD_VERSION_V1,
        payloadJson:
          JSON.stringify(
            payload,
          ),
        observedAtEpochMs:
          this.clock(),
      });
  }

  private targetIdentity(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,
  ): CompletionTargetIdentity {

    const {
      universeSeed,
      generatorVersionCode,
    } =
      generationKeyStorageParts(
        generationKey,
      );

    return Object.freeze({
      universeSeed,
      generatorVersionCode,
      targetTypeCode:
        DiscoveryTargetType
          .fromLocator(
            locator,
          )
          .code,
      targetSeed:
        normalizeTargetSeed(
          this.targetSeedResolver
            .resolveTargetSeedNormalized(
              generationKey,
              locator,
            ),
        ),
    });
  }
}

interface RuntimeEvaluation {
  readonly evaluation:
    ExtremeScientificCompletionEvaluation;

  readonly ledger:
    CompletionLedgerState;
}

interface CompletionLedgerState {
  readonly eventHorizonCompleted:
    boolean;

  readonly rewardGranted:
    boolean;

  readonly rewardDiscoveryPoints:
    bigint | null;
}

interface CompletionTargetIdentity {
  readonly universeSeed:
    string;

  readonly generatorVersionCode:
    number;

  readonly targetTypeCode:
    number;

  readonly targetSeed:
    string;
}

type CompletionLedgerPayload =
  | {
      readonly code:
        typeof CompletionLedgerCode.EVENT_HORIZON_COMPLETED;
    }
  | {
      readonly code:
        typeof CompletionLedgerCode.REWARD_GRANTED;

      readonly rewardDiscoveryPoints:
        string;
    };

function toStatus(
  evaluation:
    ExtremeScientificCompletionEvaluation,

  ledger:
    CompletionLedgerState,

  rewardGrantedNow:
    boolean,
): ExtremeScientificCompletionStatus {

  return Object.freeze({
    studies:
      evaluation.studies,
    completedStudies:
      evaluation.completedStudies,
    totalStudies:
      evaluation.totalStudies,
    completionPercent:
      evaluation.completionPercent,
    complete:
      evaluation.complete,
    rewardDiscoveryPoints:
      ledger.rewardDiscoveryPoints ??
      evaluation.rewardDiscoveryPoints,
    rewardGranted:
      ledger.rewardGranted,
    rewardGrantedNow,
  });
}

function completionObservationId(
  identity:
    CompletionTargetIdentity,

  code:
    CompletionLedgerCode,
): string {

  return JSON.stringify([
    EXTREME_SCIENTIFIC_COMPLETION_OBSERVATION_KIND_V1,
    identity.universeSeed,
    identity.generatorVersionCode,
    identity.targetTypeCode,
    identity.targetSeed,
    code,
  ]);
}

function parseLedgerPayload(
  entity:
    {
      readonly observationKind:
        string;
      readonly payloadVersion:
        number;
      readonly payloadJson:
        string;
    } | undefined,

  expectedCode:
    CompletionLedgerCode,
): CompletionLedgerPayload | null {

  if (
    entity ===
      undefined
  ) {
    return null;
  }

  if (
    entity.observationKind !==
      EXTREME_SCIENTIFIC_COMPLETION_OBSERVATION_KIND_V1 ||
    entity.payloadVersion !==
      EXTREME_SCIENTIFIC_COMPLETION_PAYLOAD_VERSION_V1
  ) {
    throw new RangeError(
      'Persisted 28.7 completion ledger entry has an unsupported kind/version.',
    );
  }

  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        entity.payloadJson,
      );
  } catch {
    throw new RangeError(
      'Persisted 28.7 completion ledger payload is invalid JSON.',
    );
  }

  if (
    typeof parsed !==
      'object' ||
    parsed ===
      null ||
    !('code' in parsed) ||
    parsed.code !==
      expectedCode
  ) {
    throw new RangeError(
      'Persisted 28.7 completion ledger payload has an invalid code.',
    );
  }

  if (
    expectedCode ===
      CompletionLedgerCode.REWARD_GRANTED
  ) {
    if (
      !('rewardDiscoveryPoints' in parsed) ||
      typeof parsed.rewardDiscoveryPoints !==
        'string'
    ) {
      throw new RangeError(
        'Persisted 28.7 reward ledger entry has no valid PD amount.',
      );
    }

    return Object.freeze({
      code:
        CompletionLedgerCode.REWARD_GRANTED,
      rewardDiscoveryPoints:
        parsed.rewardDiscoveryPoints,
    });
  }

  return Object.freeze({
    code:
      CompletionLedgerCode.EVENT_HORIZON_COMPLETED,
  });
}

function parseNonNegativeBigInt(
  value:
    string,
): bigint {

  if (
    !/^\d+$/.test(
      value,
    )
  ) {
    throw new RangeError(
      'Persisted 28.7 reward PD amount must be a non-negative integer.',
    );
  }

  return BigInt(
    value,
  );
}

const TARGET_SEED_RESOLVER:
  ProceduralTargetSeedResolver =
  Object.freeze({
    resolveTargetSeedNormalized(
      key:
        UniverseGenerationKey,

      locator:
        ProceduralLocator,
    ): string {
      return ProceduralTargetResolver
        .resolveTargetSeed(
          key,
          locator,
        )
        .normalizedValue;
    },
  });

export const EXTREME_SCIENTIFIC_COMPLETION_RUNTIME =
  new InjectionToken<ExtremeScientificCompletionRuntime>(
    'EXTREME_SCIENTIFIC_COMPLETION_RUNTIME',
    {
      providedIn:
        'root',

      factory:
        () =>
          new DexieExtremeScientificCompletionRuntime(
            new GenesisIndexedDb(),
          ),
    },
  );
