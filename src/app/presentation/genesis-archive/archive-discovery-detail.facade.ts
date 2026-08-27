import {
  computed,
  inject,
  Injectable,
  signal,
} from '@angular/core';

import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  ExplorationResultKind,
  type ExplorationLocatedResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  GalacticObjectScientificActionType,
  type GalacticObjectScientificActionRule,
} from '../../domain/galactic-object/galactic-object-scientific-action';

import {
  GalacticObjectScientificSurveyFamily,
} from '../../domain/galactic-object/galactic-object-scientific-subject';

import {
  GalacticObjectLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxySectorKeyCodec,
} from '../../domain/sector/galaxy-sector-key-codec';

import {
  InstrumentObservationSession,
  ObservationInstrumentType,
} from '../../domain/observation/observation-instrument';

import {
  LeveledInstrumentObservationSession,
  ObservationInstrumentLevel,
} from '../../domain/observation/observation-instrument-capability';

import {
  type ObservationInstrumentProgressionOverview,
  ObservationProgressMilestone,
} from '../../domain/observation/observation-instrument-progression';

import {
  ObservationSession,
  Observatory,
} from '../../domain/observation/observatory';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ExplorationSectorResultEngine,
} from '../../simulation/exploration/exploration-sector-result-engine';

import {
  GalacticObjectScientificActionCatalogV1,
} from '../../simulation/galactic-object/galactic-object-scientific-action-catalog';

import {
  GalacticObjectScientificActionEngine,
} from '../../simulation/galactic-object/galactic-object-scientific-action-engine';

import {
  GalacticObjectScientificSubjectResolver,
} from '../../simulation/galactic-object/galactic-object-scientific-subject-resolver';

import {
  ObservationInstrumentCapabilityCatalogV1,
} from '../../simulation/observation/observation-instrument-capability-catalog';

import {
  ObservationInstrumentCatalogV1,
} from '../../simulation/observation/observation-instrument-catalog';

import {
  ObservationInstrumentProgressionEngine,
} from '../../simulation/observation/observation-instrument-progression-engine';

import {
  GENESIS_LOCAL_REPOSITORIES,
} from '../runtime/genesis-local-repositories';

import {
  GALACTIC_OBJECT_SCIENTIFIC_ACTION_RUNTIME,
} from '../runtime/galactic-object-scientific-action.runtime';

import {
  UniverseSeedFacade,
} from '../universe/universe-seed.facade';

import {
  ArchiveGalacticObjectCardAssembler,
  type ArchiveGalacticObjectCardModel,
} from './archive-galactic-object-card';

import {
  ArchiveStellarSystemCardAssembler,
  type ArchiveStellarSystemCardModel,
} from './archive-stellar-system-card';

const SIGNED_LONG_MIN =
  -(1n << 63n);

const SIGNED_LONG_MAX =
  (1n << 63n) -
  1n;

export const ArchiveDiscoveryLocatorKind =
  Object.freeze({
    SYSTEM:
      'system',

    GALACTIC_OBJECT:
      'galactic-object',
  } as const);

export type ArchiveDiscoveryLocatorKind =
  typeof ArchiveDiscoveryLocatorKind[
    keyof typeof ArchiveDiscoveryLocatorKind
  ];

export interface ArchiveDiscoveryDetailRequest {
  readonly locatorKind:
    string | null;

  readonly galaxyIndex:
    string | null;

  readonly sectorKey:
    string | null;

  readonly galacticObjectIndex:
    string | null;

  readonly universeSeed:
    string | null;

  readonly generatorVersionCode:
    string | null;
}

export interface ArchiveScientificInstrumentOption {
  readonly instrumentType:
    ObservationInstrumentType;

  readonly label:
    string;

  readonly minimumLevelRank:
    number;

  readonly highestUnlockedLevelRank:
    number | null;

  readonly isAvailable:
    boolean;

  readonly statusLabel:
    string;
}

export interface ArchiveScientificPendingRequirementsModel {
  readonly instrumentLabel:
    string;

  readonly minimumLevelRank:
    number;

  readonly items:
    readonly string[];
}

export interface ArchiveGalacticObjectScientificActionModel {
  readonly actionType:
    GalacticObjectScientificActionType;

  readonly label:
    string;

  readonly targetDiscoveryStateLabel:
    string;

  readonly awardedDiscoveryPoints:
    number;

  readonly minimumInstrumentLevelRank:
    number;

  readonly instrumentOptions:
    readonly ArchiveScientificInstrumentOption[];

  readonly selectedInstrumentType:
    ObservationInstrumentType | null;

  readonly selectedInstrumentLabel:
    string | null;

  readonly canExecute:
    boolean;

  readonly pendingRequirements:
    ArchiveScientificPendingRequirementsModel | null;

  readonly buttonLabel:
    string;
}

export interface ArchiveDiscoveryDetailModel {
  readonly universeSeed:
    string;

  readonly generatorVersionCode:
    number;

  readonly locatorKind:
    ArchiveDiscoveryLocatorKind;

  readonly locatorKindLabel:
    string;

  readonly resultKind:
    ExplorationLocatedResultKind;

  readonly familyLabel:
    string;

  readonly discoveryState:
    DiscoveryStateValue;

  readonly discoveryStateLabel:
    string;

  readonly galaxyIndex:
    bigint;

  readonly sectorKey:
    bigint;

  readonly sectorX:
    number;

  readonly sectorY:
    number;

  readonly galacticObjectIndex:
    bigint;

  readonly proceduralIdentity:
    string;

  readonly galacticObjectCard:
    ArchiveGalacticObjectCardModel | null;

  readonly stellarSystemCard:
    ArchiveStellarSystemCardModel | null;

  readonly scientificAction:
    ArchiveGalacticObjectScientificActionModel | null;
}

export type ArchiveDiscoveryDetailUiState =
  | {
      readonly kind:
        'loading';
    }
  | {
      readonly kind:
        'content';

      readonly model:
        ArchiveDiscoveryDetailModel;
    }
  | {
      readonly kind:
        'not-found';
    }
  | {
      readonly kind:
        'error';

      readonly message:
        string;
    };

@Injectable({
  providedIn:
    'root',
})
export class ArchiveDiscoveryDetailFacade {

  private readonly repositories =
    inject(
      GENESIS_LOCAL_REPOSITORIES,
    );

  private readonly universeSeedFacade =
    inject(
      UniverseSeedFacade,
    );

  private readonly scientificActionRuntime =
    inject(
      GALACTIC_OBJECT_SCIENTIFIC_ACTION_RUNTIME,
    );

  private currentRequest:
    ArchiveDiscoveryDetailRequest | null =
    null;

  private currentGenerationKey:
    UniverseGenerationKey | null =
    null;

  private currentLocator:
    GalacticObjectLocator | null =
    null;

  private readonly actionPendingSignal =
    signal(
      false,
    );

  readonly actionPending =
    this
      .actionPendingSignal
      .asReadonly();

  private readonly actionFeedbackSignal =
    signal<string | null>(
      null,
    );

  readonly actionFeedback =
    this
      .actionFeedbackSignal
      .asReadonly();

  private readonly actionErrorSignal =
    signal<string | null>(
      null,
    );

  readonly actionError =
    this
      .actionErrorSignal
      .asReadonly();

  private readonly stateSignal =
    signal<ArchiveDiscoveryDetailUiState>({
      kind:
        'loading',
    });

  readonly state =
    this
      .stateSignal
      .asReadonly();

  readonly model =
    computed<ArchiveDiscoveryDetailModel | null>(
      () => {
        const state =
          this.state();

        return state.kind ===
          'content'
          ? state.model
          : null;
      },
    );

  readonly errorMessage =
    computed<string>(
      () => {
        const state =
          this.state();

        return state.kind ===
          'error'
          ? state.message
          : '';
      },
    );

  async load(
    request:
      ArchiveDiscoveryDetailRequest,
  ): Promise<void> {

    this
      .actionFeedbackSignal
      .set(
        null,
      );

    this
      .actionErrorSignal
      .set(
        null,
      );

    await this
      .resolveDetails(
        request,
      );
  }

  async performScientificAction():
    Promise<void> {

    const model =
      this.model();

    const action =
      model
        ?.scientificAction ??
      null;

    const request =
      this.currentRequest;

    const generationKey =
      this.currentGenerationKey;

    const locator =
      this.currentLocator;

    if (
      model ===
        null ||
      action ===
        null ||
      !action.canExecute ||
      action.selectedInstrumentType ===
        null ||
      request ===
        null ||
      generationKey ===
        null ||
      locator ===
        null
    ) {
      this
        .actionErrorSignal
        .set(
          'La acción científica no está disponible con el estado e instrumentación actuales.',
        );

      return;
    }

    if (
      this.actionPending()
    ) {
      return;
    }

    this
      .actionPendingSignal
      .set(
        true,
      );

    this
      .actionErrorSignal
      .set(
        null,
      );

    try {
      const level =
        ObservationInstrumentLevel
          .fromRank(
            action
              .minimumInstrumentLevelRank,
          );

      const session =
        createObservationSession(
          generationKey,
          locator,
          model
            .discoveryState,
          action
            .selectedInstrumentType,
          level,
        );

      const committed =
        await this
          .scientificActionRuntime
          .commitAction(
            session,
            action.actionType,
          );

      await this
        .resolveDetails(
          request,
        );

      this
        .actionFeedbackSignal
        .set(
          `${action.label} completado · +${committed.actionResult.awardedDiscoveryPoints} PD · ${stateLabel(committed.actionResult.newDiscoveryState)}.`,
        );
    } catch (
      error
    ) {
      this
        .actionErrorSignal
        .set(
          error instanceof
            Error
            ? error.message
            : 'No se pudo completar la acción científica.',
        );
    } finally {
      this
        .actionPendingSignal
        .set(
          false,
        );
    }
  }

  private async resolveDetails(
    request:
      ArchiveDiscoveryDetailRequest,
  ): Promise<void> {

    this
      .stateSignal
      .set({
        kind:
          'loading',
      });

    this.currentRequest =
      Object.freeze({
        ...request,
      });

    this.currentGenerationKey =
      null;

    this.currentLocator =
      null;

    try {
      const parsed =
        parseRequest(
          request,
        );

      const universes =
        await this
          .repositories
          .universeRepository
          .getAll();

      const generationKey =
        resolveGenerationKey(
          parsed,
          this
            .universeSeedFacade
            .activeGenerationKey(),
          universes,
        );

      if (
        generationKey ===
          null
      ) {
        this
          .stateSignal
          .set({
            kind:
              'not-found',
          });

        return;
      }

      const locator =
        createLocator(
          parsed,
        );

      const discoveryState =
        await this
          .repositories
          .discoveryRepository
          .getState(
            generationKey,
            locator,
          );

      if (
        !DiscoveryState.isKnown(
          discoveryState,
        )
      ) {
        this
          .stateSignal
          .set({
            kind:
              'not-found',
          });

        return;
      }

      const resultKind =
        resolveResultKind(
          generationKey,
          locator,
        );

      const coordinates =
        GalaxySectorKeyCodec
          .decode(
            parsed.sectorKey,
          );

      const galacticObjectCard =
        locator instanceof
          GalacticObjectLocator
          ? ArchiveGalacticObjectCardAssembler
              .build(
                generationKey,
                locator,
                resultKind,
                discoveryState,
              )
          : null;

      const stellarSystemCard =
        locator instanceof
          SystemLocator
          ? ArchiveStellarSystemCardAssembler
              .build(
                generationKey,
                locator,
                discoveryState,
              )
          : null;

      const scientificAction =
        locator instanceof
          GalacticObjectLocator
          ? await this
              .buildScientificActionModel(
                generationKey,
                locator,
                resultKind,
                discoveryState,
                galacticObjectCard,
              )
          : null;

      if (
        locator instanceof
          GalacticObjectLocator
      ) {
        this.currentGenerationKey =
          generationKey;

        this.currentLocator =
          locator;
      }

      this
        .stateSignal
        .set({
          kind:
            'content',

          model:
            Object.freeze({
              universeSeed:
                generationKey
                  .universeSeed
                  .serialize(),

              generatorVersionCode:
                generationKey
                  .generatorVersion
                  .code,

              locatorKind:
                parsed.locatorKind,

              locatorKindLabel:
                parsed.locatorKind ===
                  ArchiveDiscoveryLocatorKind.SYSTEM
                  ? 'SystemLocator'
                  : 'GalacticObjectLocator',

              resultKind,

              familyLabel:
                familyLabel(
                  resultKind,
                ),

              discoveryState:
                DiscoveryState
                  .fromCode(
                    discoveryState.code,
                  ),

              discoveryStateLabel:
                stateLabel(
                  discoveryState,
                ),

              galaxyIndex:
                parsed.galaxyIndex,

              sectorKey:
                parsed.sectorKey,

              sectorX:
                coordinates.x,

              sectorY:
                coordinates.y,

              galacticObjectIndex:
                parsed
                  .galacticObjectIndex,

              proceduralIdentity:
                [
                  `G${parsed.galaxyIndex.toString(10)}`,
                  `S${parsed.sectorKey.toString(10)}`,
                  `O${parsed.galacticObjectIndex.toString(10)}`,
                ].join(
                  ' / ',
                ),

              galacticObjectCard,

              stellarSystemCard,

              scientificAction,
            }),
        });
    } catch (
      error
    ) {
      this
        .stateSignal
        .set({
          kind:
            'error',

          message:
            error instanceof
              Error
              ? error.message
              : 'No se pudo resolver la ficha del descubrimiento.',
        });
    }
  }

  private async buildScientificActionModel(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,

    resultKind:
      ExplorationLocatedResultKind,

    discoveryState:
      DiscoveryStateValue,

    card:
      ArchiveGalacticObjectCardModel | null,
  ): Promise<ArchiveGalacticObjectScientificActionModel | null> {

    const rule =
      resolveNextScientificRule(
        generationKey,
        locator,
        resultKind,
        discoveryState,
      );

    if (
      rule ===
        null
    ) {
      return null;
    }

    const [
      globalDiscoveryPoints,
      knownDiscoveries,
    ] =
      await Promise.all([
        this
          .repositories
          .pointsRepository
          .getGlobalDiscoveryPoints(
            generationKey,
          ),

        this
          .repositories
          .discoveryRepository
          .getKnownDiscoveries(
            generationKey,
          ),
      ]);

    const progression =
      ObservationInstrumentProgressionEngine
        .evaluate(
          generationKey,
          globalDiscoveryPoints,
          knownDiscoveries,
        );

    const instrumentOptions =
      Object.freeze(
        rule
          .compatibleInstrumentTypes
          .map(
            (
              instrumentType,
            ) =>
              buildInstrumentOption(
                progression,
                instrumentType,
                rule
                  .minimumInstrumentLevel,
              ),
          ),
      );

    const selected =
      instrumentOptions
        .find(
          (
            option,
          ) =>
            option.isAvailable,
        ) ??
      null;

    const pendingRequirements =
      selected ===
        null
        ? buildPendingRequirements(
            progression,
            rule
              .compatibleInstrumentTypes,
            rule
              .minimumInstrumentLevel,
          )
        : null;

    const evaluationInstrumentType =
      rule
        .compatibleInstrumentTypes[
          0
        ];

    if (
      evaluationInstrumentType ===
        undefined
    ) {
      throw new RangeError(
        'La acción científica no define ningún instrumento compatible.',
      );
    }

    const evaluationSession =
      createObservationSession(
        generationKey,
        locator,
        discoveryState,
        evaluationInstrumentType,
        rule
          .minimumInstrumentLevel,
      );

    const reward =
      GalacticObjectScientificActionEngine
        .evaluate(
          generationKey,
          evaluationSession,
          rule.actionType,
        )
        .awardedDiscoveryPoints;

    return Object.freeze({
      actionType:
        rule.actionType,

      label:
        card
          ?.nextScientificStep ??
        scientificActionLabel(
          rule.actionType,
        ),

      targetDiscoveryStateLabel:
        stateLabel(
          rule
            .targetDiscoveryState,
        ),

      awardedDiscoveryPoints:
        reward,

      minimumInstrumentLevelRank:
        rule
          .minimumInstrumentLevel
          .rank,

      instrumentOptions,

      selectedInstrumentType:
        selected
          ?.instrumentType ??
        null,

      selectedInstrumentLabel:
        selected
          ?.label ??
        null,

      canExecute:
        selected !==
        null,

      pendingRequirements,

      buttonLabel:
        scientificActionButtonLabel(
          discoveryState,
        ),
    });
  }
}

function resolveNextScientificRule(
  generationKey:
    UniverseGenerationKey,

  locator:
    GalacticObjectLocator,

  resultKind:
    ExplorationLocatedResultKind,

  discoveryState:
    DiscoveryStateValue,
): GalacticObjectScientificActionRule | null {

  const canonicalState =
    DiscoveryState
      .fromCode(
        discoveryState.code,
      );

  if (
    canonicalState.code >=
    DiscoveryState.CONFIRMED.code
  ) {
    return null;
  }

  if (
    canonicalState.code <
    DiscoveryState.DISCOVERED.code
  ) {
    const family =
      scientificSurveyFamily(
        resultKind,
      );

    return family ===
      null
      ? null
      : GalacticObjectScientificActionCatalogV1
          .surveyRule(
            family,
          );
  }

  const subject =
    GalacticObjectScientificSubjectResolver
      .resolve(
        generationKey,
        locator,
        canonicalState,
      );

  if (
    subject ===
      null
  ) {
    return null;
  }

  return GalacticObjectScientificActionCatalogV1
    .subjectRules(
      subject,
    )
    .find(
      (
        rule,
      ) =>
        canonicalState.code >=
          rule
            .minimumDiscoveryState
            .code &&
        canonicalState.code <
          rule
            .targetDiscoveryState
            .code,
    ) ??
    null;
}

function scientificSurveyFamily(
  resultKind:
    ExplorationLocatedResultKind,
): GalacticObjectScientificSurveyFamily | null {

  switch (
    resultKind
  ) {
    case ExplorationResultKind.NEBULA:
      return GalacticObjectScientificSurveyFamily
        .NEBULA;

    case ExplorationResultKind.STAR_CLUSTER:
      return GalacticObjectScientificSurveyFamily
        .STAR_CLUSTER;

    case ExplorationResultKind.EXTREME_OBJECT:
      return GalacticObjectScientificSurveyFamily
        .EXTREME_OBJECT;

    default:
      return null;
  }
}

function buildInstrumentOption(
  progression:
    ObservationInstrumentProgressionOverview,

  instrumentType:
    ObservationInstrumentType,

  minimumLevel:
    ObservationInstrumentLevel,
): ArchiveScientificInstrumentOption {

  const status =
    progression
      .status(
        instrumentType,
        minimumLevel,
      );

  const highestUnlockedLevel =
    progression
      .highestUnlockedLevel(
        instrumentType,
      );

  return Object.freeze({
    instrumentType,

    label:
      instrumentLabel(
        instrumentType,
      ),

    minimumLevelRank:
      minimumLevel.rank,

    highestUnlockedLevelRank:
      highestUnlockedLevel
        ?.rank ??
      null,

    isAvailable:
      status.isUnlocked,

    statusLabel:
      instrumentStatusLabel(
        status
          .missingGlobalDiscoveryPoints,
        status
          .missingMilestones,
      ),
  });
}

function buildPendingRequirements(
  progression:
    ObservationInstrumentProgressionOverview,

  instrumentTypes:
    readonly ObservationInstrumentType[],

  minimumLevel:
    ObservationInstrumentLevel,
): ArchiveScientificPendingRequirementsModel | null {

  const blocked =
    instrumentTypes
      .map(
        (
          instrumentType,
        ) => ({
          instrumentType,
          status:
            progression
              .status(
                instrumentType,
                minimumLevel,
              ),
        }),
      )
      .filter(
        (
          candidate,
        ) =>
          !candidate
            .status
            .isUnlocked,
      );

  if (
    blocked.length ===
      0
  ) {
    return null;
  }

  let preferred =
    blocked[
      0
    ];

  if (
    preferred ===
      undefined
  ) {
    return null;
  }

  for (
    let index =
      1;
    index <
      blocked.length;
    index +=
      1
  ) {
    const candidate =
      blocked[
        index
      ];

    if (
      candidate !==
        undefined &&
      isCloserUnlockPath(
        candidate.status
          .missingMilestones,
        candidate.status
          .missingGlobalDiscoveryPoints,
        preferred.status
          .missingMilestones,
        preferred.status
          .missingGlobalDiscoveryPoints,
      )
    ) {
      preferred =
        candidate;
    }
  }

  const items:
    string[] =
    [];

  if (
    preferred
      .status
      .missingGlobalDiscoveryPoints >
      0n
  ) {
    items.push(
      `${preferred.status.missingGlobalDiscoveryPoints.toString(10)} PD adicionales`,
    );
  }

  for (
    const milestone
    of preferred
      .status
      .missingMilestones
  ) {
    items.push(
      milestoneRequirementLabel(
        milestone,
      ),
    );
  }

  return Object.freeze({
    instrumentLabel:
      instrumentLabel(
        preferred
          .instrumentType,
      ),

    minimumLevelRank:
      minimumLevel.rank,

    items:
      Object.freeze([
        ...items,
      ]),
  });
}

function isCloserUnlockPath(
  candidateMilestones:
    readonly ObservationProgressMilestone[],

  candidateDiscoveryPoints:
    bigint,

  currentMilestones:
    readonly ObservationProgressMilestone[],

  currentDiscoveryPoints:
    bigint,
): boolean {

  if (
    candidateMilestones.length !==
      currentMilestones.length
  ) {
    return candidateMilestones.length <
      currentMilestones.length;
  }

  return candidateDiscoveryPoints <
    currentDiscoveryPoints;
}

function milestoneRequirementLabel(
  milestone:
    ObservationProgressMilestone,
): string {

  switch (
    milestone
  ) {
    case ObservationProgressMilestone.FIRST_SYSTEM_DISCOVERED:
      return 'Descubrir el primer sistema';

    case ObservationProgressMilestone.FIRST_BODY_DISCOVERED:
      return 'Descubrir el primer cuerpo';

    case ObservationProgressMilestone.FIRST_GALACTIC_OBJECT_CATALOGUED:
      return 'Catalogar el primer objeto galáctico';

    case ObservationProgressMilestone.FIRST_TARGET_CONFIRMED:
      return 'Confirmar el primer objetivo científico';

    case ObservationProgressMilestone.FIRST_EXTERNAL_GALAXY_DETECTED:
      return 'Detectar la primera galaxia externa';
  }

  throw new RangeError(
    `Hito científico no soportado: ${String(milestone)}.`,
  );
}

function instrumentStatusLabel(
  missingDiscoveryPoints:
    bigint,

  missingMilestones:
    readonly ObservationProgressMilestone[],
): string {

  if (
    missingDiscoveryPoints ===
      0n &&
    missingMilestones.length ===
      0
  ) {
    return 'Disponible';
  }

  const reasons:
    string[] =
    [];

  if (
    missingDiscoveryPoints >
      0n
  ) {
    reasons.push(
      `faltan ${missingDiscoveryPoints.toString(10)} PD`,
    );
  }

  if (
    missingMilestones.length >
      0
  ) {
    reasons.push(
      missingMilestones.length ===
        1
        ? 'falta 1 hito científico'
        : `faltan ${missingMilestones.length} hitos científicos`,
    );
  }

  return `Bloqueado · ${reasons.join(' y ')}`;
}

function createObservationSession(
  generationKey:
    UniverseGenerationKey,

  locator:
    GalacticObjectLocator,

  discoveryState:
    DiscoveryStateValue,

  instrumentType:
    ObservationInstrumentType,

  level:
    ObservationInstrumentLevel,
): LeveledInstrumentObservationSession {

  const observatory =
    new Observatory(
      generationKey,
    );

  const baseSession =
    new ObservationSession(
      observatory,
      locator,
      discoveryState,
    );

  const instrument =
    ObservationInstrumentCatalogV1
      .instrument(
        instrumentType,
      );

  return new LeveledInstrumentObservationSession(
    new InstrumentObservationSession(
      baseSession,
      instrument,
    ),
    ObservationInstrumentCapabilityCatalogV1
      .profile(
        instrumentType,
        level,
      ),
  );
}

function instrumentLabel(
  instrumentType:
    ObservationInstrumentType,
): string {

  switch (
    instrumentType
  ) {
    case ObservationInstrumentType.OPTICAL:
      return 'Óptico';

    case ObservationInstrumentType.INFRARED:
      return 'Infrarrojo';

    case ObservationInstrumentType.RADIO:
      return 'Radio';

    case ObservationInstrumentType.SPECTROSCOPY:
      return 'Espectroscopía';

    case ObservationInstrumentType.X_RAY:
      return 'Rayos X';

    case ObservationInstrumentType.GAMMA_RAY:
      return 'Rayos gamma';

    case ObservationInstrumentType.GRAVITATIONAL_WAVE:
      return 'Ondas gravitacionales';
  }
}

function scientificActionLabel(
  actionType:
    GalacticObjectScientificActionType,
): string {

  return actionType
    .split(
      '_',
    )
    .map(
      (
        part,
      ) =>
        part
          .toLocaleLowerCase(
            'es-ES',
          ),
    )
    .join(
      ' ',
    );
}

function scientificActionButtonLabel(
  discoveryState:
    DiscoveryStateValue,
): string {

  const canonical =
    DiscoveryState
      .fromCode(
        discoveryState.code,
      );

  if (
    canonical.code <
    DiscoveryState.DISCOVERED.code
  ) {
    return 'Realizar reconocimiento';
  }

  if (
    canonical.code <
    DiscoveryState.CATALOGUED.code
  ) {
    return 'Realizar caracterización';
  }

  return 'Realizar confirmación';
}

interface ParsedArchiveDiscoveryDetailRequest {
  readonly locatorKind:
    ArchiveDiscoveryLocatorKind;

  readonly galaxyIndex:
    bigint;

  readonly sectorKey:
    bigint;

  readonly galacticObjectIndex:
    bigint;

  readonly universeSeed:
    string | null;

  readonly generatorVersionCode:
    number | null;
}

function parseRequest(
  request:
    ArchiveDiscoveryDetailRequest,
): ParsedArchiveDiscoveryDetailRequest {

  if (
    request.locatorKind !==
      ArchiveDiscoveryLocatorKind.SYSTEM &&
    request.locatorKind !==
      ArchiveDiscoveryLocatorKind.GALACTIC_OBJECT
  ) {
    throw new RangeError(
      'Tipo de marcador de archivo no soportado.',
    );
  }

  return {
    locatorKind:
      request.locatorKind,

    galaxyIndex:
      parseNonNegativeLong(
        request.galaxyIndex,
        'galaxyIndex',
      ),

    sectorKey:
      parseSignedLong(
        request.sectorKey,
        'sectorKey',
      ),

    galacticObjectIndex:
      parseNonNegativeLong(
        request.galacticObjectIndex,
        'galacticObjectIndex',
      ),

    ...parseGenerationIdentity(
      request.universeSeed,
      request.generatorVersionCode,
    ),
  };
}

function createLocator(
  request:
    ParsedArchiveDiscoveryDetailRequest,
): SystemLocator | GalacticObjectLocator {

  if (
    request.locatorKind ===
      ArchiveDiscoveryLocatorKind.SYSTEM
  ) {
    return new SystemLocator(
      request.galaxyIndex,
      request.sectorKey,
      request.galacticObjectIndex,
    );
  }

  return new GalacticObjectLocator(
    request.galaxyIndex,
    request.sectorKey,
    request.galacticObjectIndex,
  );
}

function resolveResultKind(
  generationKey:
    UniverseGenerationKey,

  locator:
    SystemLocator | GalacticObjectLocator,
): ExplorationLocatedResultKind {

  if (
    locator instanceof
      SystemLocator
  ) {
    return ExplorationResultKind
      .SYSTEM;
  }

  return ExplorationSectorResultEngine
    .resolveGalacticObjectKind(
      generationKey,
      locator,
    );
}

function familyLabel(
  resultKind:
    ExplorationLocatedResultKind,
): string {

  switch (
    resultKind
  ) {
    case ExplorationResultKind.SYSTEM:
      return 'Sistema';

    case ExplorationResultKind.NEBULA:
      return 'Nebulosa';

    case ExplorationResultKind.STAR_CLUSTER:
      return 'Cúmulo estelar';

    case ExplorationResultKind.EXTREME_OBJECT:
      return 'Objeto extremo';
  }

  throw new RangeError(
    `Familia operacional no soportada: ${String(resultKind)}.`,
  );
}

function stateLabel(
  state:
    DiscoveryStateValue,
): string {

  const canonical =
    DiscoveryState
      .fromCode(
        state.code,
      );

  if (
    canonical ===
      DiscoveryState.DETECTED
  ) {
    return 'Detectado';
  }

  if (
    canonical ===
      DiscoveryState.DISCOVERED
  ) {
    return 'Descubierto';
  }

  if (
    canonical ===
      DiscoveryState.VISITED
  ) {
    return 'Visitado';
  }

  if (
    canonical ===
      DiscoveryState.CATALOGUED
  ) {
    return 'Catalogado';
  }

  if (
    canonical ===
      DiscoveryState.CONFIRMED
  ) {
    return 'Confirmado';
  }

  return 'Desconocido';
}

function parseNonNegativeLong(
  raw:
    string | null,

  propertyName:
    string,
): bigint {

  const value =
    parseSignedLong(
      raw,
      propertyName,
    );

  if (
    value <
      0n
  ) {
    throw new RangeError(
      `${propertyName} debe ser un Long no negativo.`,
    );
  }

  return value;
}

function parseSignedLong(
  raw:
    string | null,

  propertyName:
    string,
): bigint {

  if (
    raw ===
      null ||
    !/^-?\d+$/.test(
      raw,
    )
  ) {
    throw new RangeError(
      `${propertyName} debe ser un entero decimal válido.`,
    );
  }

  const value =
    BigInt(
      raw,
    );

  if (
    value <
      SIGNED_LONG_MIN ||
    value >
      SIGNED_LONG_MAX
  ) {
    throw new RangeError(
      `${propertyName} debe pertenecer al rango Long de 64 bits.`,
    );
  }

  return value;
}

function parseGenerationIdentity(
  universeSeed:
    string | null,

  generatorVersionCode:
    string | null,
): {
  readonly universeSeed:
    string | null;

  readonly generatorVersionCode:
    number | null;
} {

  if (
    universeSeed ===
      null &&
    generatorVersionCode ===
      null
  ) {
    return {
      universeSeed:
        null,

      generatorVersionCode:
        null,
    };
  }

  if (
    universeSeed ===
      null ||
    generatorVersionCode ===
      null
  ) {
    throw new RangeError(
      'La identidad de universo de la ficha requiere seed y versión de generador.',
    );
  }

  if (
    !UniverseSeed.isValid(
      universeSeed,
    )
  ) {
    throw new RangeError(
      'La seed de universo de la ficha no tiene un formato válido.',
    );
  }

  if (
    !/^\d+$/.test(
      generatorVersionCode,
    )
  ) {
    throw new RangeError(
      'generatorVersionCode debe ser un entero decimal válido.',
    );
  }

  const versionCode =
    Number(
      generatorVersionCode,
    );

  if (
    !Number.isSafeInteger(
      versionCode,
    ) ||
    versionCode <=
      0
  ) {
    throw new RangeError(
      'generatorVersionCode debe ser un entero positivo seguro.',
    );
  }

  return {
    universeSeed:
      UniverseSeed
        .parse(
          universeSeed,
        )
        .serialize(),

    generatorVersionCode:
      versionCode,
  };
}

function resolveGenerationKey(
  request:
    ParsedArchiveDiscoveryDetailRequest,

  selectedGenerationKey:
    UniverseGenerationKey,

  persistedUniverses:
    readonly UniverseGenerationKey[],
): UniverseGenerationKey | null {

  if (
    request.universeSeed !==
      null &&
    request.generatorVersionCode !==
      null
  ) {
    return persistedUniverses
      .find(
        (
          candidate,
        ) =>
          candidate
            .universeSeed
            .serialize() ===
            request.universeSeed &&
          candidate
            .generatorVersion
            .code ===
            request.generatorVersionCode,
      ) ??
      null;
  }

  const selected =
    persistedUniverses
      .find(
        (
          candidate,
        ) =>
          sameGenerationKey(
            candidate,
            selectedGenerationKey,
          ),
      );

  if (
    selected !==
      undefined
  ) {
    return selected;
  }

  if (
    persistedUniverses.length ===
      1
  ) {
    return persistedUniverses[
      0
    ];
  }

  return null;
}

function sameGenerationKey(
  left:
    UniverseGenerationKey,

  right:
    UniverseGenerationKey,
): boolean {

  return (
    left
      .generatorVersion
      .code ===
      right
        .generatorVersion
        .code &&
    left
      .universeSeed
      .serialize() ===
      right
        .universeSeed
        .serialize()
  );
}
