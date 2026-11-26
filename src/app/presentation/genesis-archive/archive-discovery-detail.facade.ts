import { CompactHostPlanetarySystemGenerator } from '../../simulation/planetary/compact-host-planetary-system-generator';
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

import { type KnownDiscovery } from '../../domain/discovery/known-discovery';
import { isGalacticNucleusLocator } from '../../domain/universe/galactic-center';

import {
  type DiscoveredToVisitedEntryKindValue,
} from '../../domain/discovery/discovered-to-visited-entry';

import {
  ExplorationResultKind,
  type ExplorationLocatedResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  GalacticObjectScientificActionType,
  type GalacticObjectScientificActionRule,
} from '../../domain/galactic-object/galactic-object-scientific-action';

import {
  ExtremeType,
  extremeTypeDefinition,
  type ExtremeType as ExtremeTypeValue,
} from '../../domain/galactic-object/extreme-object-type';

import {
  GalacticObjectScientificSubject,
  GalacticObjectScientificSurveyFamily,
} from '../../domain/galactic-object/galactic-object-scientific-subject';

import {
  GalacticObjectLocator,
  type ProceduralLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type ProtoplanetaryDiskAnalysis,
} from '../../domain/planetary/protoplanetary-disk-analysis';

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

import { GalacticObjectScientificActionCatalogV2 } from '../../simulation/galactic-object/galactic-object-scientific-action-catalog-v2';

import {
  GalacticObjectScientificActionEngine,
} from '../../simulation/galactic-object/galactic-object-scientific-action-engine';

import {
  GalacticObjectScientificSubjectResolver,
} from '../../simulation/galactic-object/galactic-object-scientific-subject-resolver';

import {
  ExtremeScientificEpistemicBoundaryEngine,
  type ExtremeScientificEpistemicBoundaryModel,
} from '../../simulation/galactic-object/extreme-scientific-epistemic-boundary-engine';

import {
  ProtoplanetaryDiskAnalysisEngine,
} from '../../simulation/planetary/protoplanetary-disk-analysis-engine';
import { multihostPhysicalSourceKey } from '../../simulation/stellar/stellar-multihost-physical-source-key';

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
  type StellarSystemScientificObservationRuleCode,
} from '../../simulation/observation/stellar-system-scientific-observation-catalog';

import {
  GENESIS_LOCAL_REPOSITORIES,
} from '../runtime/genesis-local-repositories';

import {
  GALACTIC_OBJECT_SCIENTIFIC_ACTION_RUNTIME,
} from '../runtime/galactic-object-scientific-action.runtime';

import {
  STELLAR_SYSTEM_SCIENTIFIC_PROGRESSION_RUNTIME,
  type StellarSystemScientificProgressionSnapshot,
} from '../runtime/stellar-system-scientific-progression.runtime';

import {
  PULSAR_TIMING_OBSERVATION_RUNTIME,
  type PulsarTimingObservationStatus,
} from '../runtime/pulsar-timing-observation.runtime';

import {
  MAGNETAR_ACTIVITY_OBSERVATION_RUNTIME,
  type MagnetarActivityObservationStatus,
} from '../runtime/magnetar-activity-observation.runtime';

import {
  RELATIVISTIC_JET_ANALYSIS_OBSERVATION_RUNTIME,
  type RelativisticJetAnalysisObservationStatus,
} from '../runtime/relativistic-jet-analysis-observation.runtime';

import {
  GRAVITATIONAL_LENSING_RECONSTRUCTION_OBSERVATION_RUNTIME,
  type GravitationalLensingReconstructionObservationStatus,
} from '../runtime/gravitational-lensing-reconstruction-observation.runtime';

import {
  EXTREME_SCIENTIFIC_COMPLETION_RUNTIME,
  type ExtremeScientificCompletionStatus,
} from '../runtime/extreme-scientific-completion.runtime';

import {
  StellarSystemScientificCampaignAssembler,
  type StellarSystemScientificCampaignModel,
} from '../runtime/stellar-system-scientific-campaign';

import {
  isScientificRouteUniverseRef,
  scientificRouteUniverseRef,
} from '../scientific/scientific-route-identity';

import {
  UniverseSeedFacade,
} from '../universe/universe-seed.facade';

import {
  ArchiveGalacticObjectCardAssembler,
  ArchiveGalacticObjectRenderKind,
  type ArchiveGalacticObjectCardModel,
} from './archive-galactic-object-card';

import {
  ArchiveEventHorizonApproachAssembler,
  type ArchiveEventHorizonApproachModel,
} from './archive-event-horizon-approach';

import {
  type EventHorizonExternalApproachSimulationState,
} from '../../domain/observation/event-horizon-external-approach-simulation-state';

import {
  EventHorizonExternalApproachSimulationEngine,
} from '../../simulation/observation/event-horizon-external-approach-simulation-engine';

import {
  ArchiveStellarSystemCardAssembler,
  type ArchiveStellarSystemCardModel,
} from './archive-stellar-system-card';
import { ArchiveV2StellarSystemCardAssembler } from './archive-v2-stellar-system-card';

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

  readonly universeRef?:
    string | null;

  /**
   * Legacy compatibility only. Point 26.10 no longer emits the raw seed in
   * shareable routes, but old bookmarks remain readable.
   */
  readonly universeSeed?:
    string | null;

  /** Legacy companion of universeSeed; see universeSeed above. */
  readonly generatorVersionCode?:
    string | null;

  readonly stellarSystemEntryKind?:
    DiscoveredToVisitedEntryKindValue | null;

  /**
   * Point 26.A.9 opt-in for the shared stellar-system scientific campaign.
   * Production Archive/System/Observatory surfaces set this to true. Keeping it
   * optional preserves old unit fixtures that only exercise point-26.2 cards.
   */
  readonly includeStellarSystemScientificProgression?:
    boolean;
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

export interface ArchiveProtoplanetaryDiskAnalysisFactModel {
  readonly label:
    string;

  readonly value:
    string;
}

export interface ArchiveProtoplanetaryDiskAnalysisModel {
  readonly summary:
    string;

  readonly diskFacts:
    readonly ArchiveProtoplanetaryDiskAnalysisFactModel[];

  readonly formationFacts:
    readonly ArchiveProtoplanetaryDiskAnalysisFactModel[];
}

export interface ArchiveDiscoveryDetailModel {
  readonly universeSeed:
    string;

  readonly generatorVersionCode:
    number;

  /** Opaque public reference used by stable phase-26 routes. */
  readonly routeUniverseRef?:
    string;

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

  readonly eventHorizonApproach?:
    ArchiveEventHorizonApproachModel | null;

  /** 28.3 post-confirmation pulse synchronization/period measurement. */
  readonly pulsarTiming?:
    PulsarTimingObservationStatus | null;

  /** 28.4 post-confirmation magnetar field / short-burst monitoring. */
  readonly magnetarActivity?:
    MagnetarActivityObservationStatus | null;


  /** 28.5 post-confirmation relativistic-jet analysis. */
  readonly relativisticJetAnalysis?:
    RelativisticJetAnalysisObservationStatus | null;

  /** 28.6 post-confirmation gravitational-lensing/source reconstruction. */
  readonly gravitationalLensingReconstruction?:
    GravitationalLensingReconstructionObservationStatus | null;


  /** 28.7 evidence-driven scientific dossier completion and one-shot reward. */
  readonly extremeScientificCompletion?:
    ExtremeScientificCompletionStatus | null;

  /** 28.8 explicit separation between evidence, verifiable models and speculation. */
  readonly extremeScientificEpistemicBoundary?:
    ExtremeScientificEpistemicBoundaryModel | null;

  /**
   * Shared point-26.A.9 scientific campaign. Optional only for compatibility
   * with pre-A9 presentation fixtures; production stellar-system surfaces load it.
   */
  readonly stellarSystemScientificCampaign?:
    StellarSystemScientificCampaignModel | null;

  /**
   * Deprecated point-17.6 presentation slot. A9 never populates it; keeping the
   * optional key prevents old test fixtures from becoming a compile-time migration
   * concern while removing the gameplay shortcut from every production surface.
   */
  readonly stellarSystemScientificAction?:
    unknown | null;

  readonly protoplanetaryDiskAnalysis:
    ArchiveProtoplanetaryDiskAnalysisModel | null;
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

  private readonly stellarSystemScientificProgressionRuntime =
    inject(
      STELLAR_SYSTEM_SCIENTIFIC_PROGRESSION_RUNTIME,
    );

  private readonly pulsarTimingObservationRuntime =
    inject(
      PULSAR_TIMING_OBSERVATION_RUNTIME,
    );

  private readonly magnetarActivityObservationRuntime =
    inject(
      MAGNETAR_ACTIVITY_OBSERVATION_RUNTIME,
    );


  private readonly relativisticJetAnalysisObservationRuntime =
    inject(
      RELATIVISTIC_JET_ANALYSIS_OBSERVATION_RUNTIME,
    );

  private readonly gravitationalLensingReconstructionObservationRuntime =
    inject(
      GRAVITATIONAL_LENSING_RECONSTRUCTION_OBSERVATION_RUNTIME,
    );


  private readonly extremeScientificCompletionRuntime =
    inject(
      EXTREME_SCIENTIFIC_COMPLETION_RUNTIME,
    );

  private currentRequest:
    ArchiveDiscoveryDetailRequest | null =
    null;

  private currentGenerationKey:
    UniverseGenerationKey | null =
    null;

  private currentLocator:
    ProceduralLocator | null =
    null;

  /** The transaction has committed, even if a subsequent IndexedDB read lags. */
  private lastCommittedGalacticObjectState:
    DiscoveryStateValue | null = null;

  /** Discard late resolutions from a route or operation that was superseded. */
  private resolutionVersion = 0;

  private readonly refreshRequiredSignal = signal(false);
  readonly refreshRequired = this.refreshRequiredSignal.asReadonly();

  /** Auxiliary nuclear studies never determine the canonical discovery stage. */
  private readonly nucleusSupplementaryWarningSignal = signal<string | null>(null);
  readonly nucleusSupplementaryWarning =
    this.nucleusSupplementaryWarningSignal.asReadonly();

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

  private readonly magnetarActivityFeedbackSignal =
    signal<string | null>(
      null,
    );

  readonly magnetarActivityFeedback =
    this
      .magnetarActivityFeedbackSignal
      .asReadonly();

  private readonly magnetarActivityErrorSignal =
    signal<string | null>(
      null,
    );

  readonly magnetarActivityError =
    this
      .magnetarActivityErrorSignal
      .asReadonly();


  private readonly relativisticJetAnalysisFeedbackSignal =
    signal<string | null>(
      null,
    );

  readonly relativisticJetAnalysisFeedback =
    this
      .relativisticJetAnalysisFeedbackSignal
      .asReadonly();

  private readonly relativisticJetAnalysisErrorSignal =
    signal<string | null>(
      null,
    );

  readonly relativisticJetAnalysisError =
    this
      .relativisticJetAnalysisErrorSignal
      .asReadonly();

  private readonly gravitationalLensingReconstructionFeedbackSignal =
    signal<string | null>(
      null,
    );

  readonly gravitationalLensingReconstructionFeedback =
    this
      .gravitationalLensingReconstructionFeedbackSignal
      .asReadonly();

  private readonly gravitationalLensingReconstructionErrorSignal =
    signal<string | null>(
      null,
    );

  readonly gravitationalLensingReconstructionError =
    this
      .gravitationalLensingReconstructionErrorSignal
      .asReadonly();

  private readonly eventHorizonApproachSimulationSignal =
    signal<EventHorizonExternalApproachSimulationState | null>(
      null,
    );

  readonly eventHorizonApproachSimulation =
    this
      .eventHorizonApproachSimulationSignal
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

    this.lastCommittedGalacticObjectState = null;
    this.refreshRequiredSignal.set(false);
    this.nucleusSupplementaryWarningSignal.set(null);

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

    this
      .magnetarActivityFeedbackSignal
      .set(
        null,
      );

    this
      .magnetarActivityErrorSignal
      .set(
        null,
      );

    this
      .relativisticJetAnalysisFeedbackSignal
      .set(
        null,
      );

    this
      .relativisticJetAnalysisErrorSignal
      .set(
        null,
      );

    this
      .gravitationalLensingReconstructionFeedbackSignal
      .set(
        null,
      );

    this
      .gravitationalLensingReconstructionErrorSignal
      .set(
        null,
      );

    this
      .eventHorizonApproachSimulationSignal
      .set(
        null,
      );

    await this
      .resolveDetails(
        request,
      );
  }

  /** Refresh only the read model; never repeat an already committed action. */
  async retryScientificCardRefresh(): Promise<void> {
    const request = this.currentRequest;
    if (request === null || this.actionPending()) return;
    this.actionPendingSignal.set(true);
    this.actionErrorSignal.set(null);
    try {
      const refreshed = await this.resolveDetails(
        request, null, true, this.lastCommittedGalacticObjectState,
      );
      if (refreshed) {
        this.actionFeedbackSignal.set('Ficha científica sincronizada con el conocimiento persistido.');
      }
    } finally {
      this.actionPendingSignal.set(false);
    }
  }

  startEventHorizonApproach():
    void {

    const configuration =
      this
        .model()
        ?.eventHorizonApproach ??
      null;

    if (
      configuration ===
        null
    ) {
      return;
    }

    const current =
      this
        .eventHorizonApproachSimulationSignal();

    if (
      current !==
        null
    ) {
      this
        .eventHorizonApproachSimulationSignal
        .set(
          EventHorizonExternalApproachSimulationEngine
            .start(
              current,
            ),
        );

      return;
    }

    const initial =
      EventHorizonExternalApproachSimulationEngine
        .createFromSchwarzschildRadius(
          configuration
            .schwarzschildRadiusKm,
        );

    this
      .eventHorizonApproachSimulationSignal
      .set(
        EventHorizonExternalApproachSimulationEngine
          .start(
            initial,
          ),
      );
  }

  pauseOrResumeEventHorizonApproach():
    void {

    const current =
      this
        .eventHorizonApproachSimulationSignal();

    if (
      current ===
        null
    ) {
      this
        .startEventHorizonApproach();

      return;
    }

    this
      .eventHorizonApproachSimulationSignal
      .set(
        current.isRunning
          ? EventHorizonExternalApproachSimulationEngine
              .pause(
                current,
              )
          : EventHorizonExternalApproachSimulationEngine
              .start(
                current,
              ),
      );
  }

  approachEventHorizon():
    void {

    const current =
      this
        .eventHorizonApproachSimulationSignal();

    if (
      current ===
        null
    ) {
      return;
    }

    const next =
      EventHorizonExternalApproachSimulationEngine
        .approach(
          current,
        );

    this
      .eventHorizonApproachSimulationSignal
      .set(
        next,
      );

    if (
      next.atMinimumExteriorRadius
    ) {
      void this
        .persistEventHorizonCompletion();
    }
  }

  retreatFromEventHorizon():
    void {

    const current =
      this
        .eventHorizonApproachSimulationSignal();

    if (
      current ===
        null
    ) {
      return;
    }

    this
      .eventHorizonApproachSimulationSignal
      .set(
        EventHorizonExternalApproachSimulationEngine
          .retreat(
            current,
          ),
      );
  }

  resetEventHorizonApproach():
    void {

    const current =
      this
        .eventHorizonApproachSimulationSignal();

    if (
      current ===
        null
    ) {
      return;
    }

    this
      .eventHorizonApproachSimulationSignal
      .set(
        EventHorizonExternalApproachSimulationEngine
          .reset(
            current,
          ),
      );
  }

  private async persistEventHorizonCompletion():
    Promise<void> {

    const request =
      this.currentRequest;

    const generationKey =
      this.currentGenerationKey;

    const locator =
      this.currentLocator;

    if (
      request === null ||
      generationKey === null ||
      !(locator instanceof GalacticObjectLocator)
    ) {
      return;
    }

    try {
      await this
        .extremeScientificCompletionRuntime
        .recordEventHorizonSimulationCompletion(
          generationKey,
          locator,
        );

      await this
        .resolveDetails(
          request, null, true, this.lastCommittedGalacticObjectState,
        );
    } catch {
      // 28.2 remains a usable simulation even if local persistence fails.
      // The next archive load can retry completion without changing physics.
    }
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
      !(locator instanceof
        GalacticObjectLocator)
    ) {
      this
        .actionErrorSignal
        .set(
          'La acción científica no está disponible con el estado e instrumentación actuales.',
        );

      return;
    }

    if (
      this.actionPending() || this.refreshRequired()
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
      // LIVE-SCI.2: the Archive card is a snapshot. Another observation or a
      // delayed read may have advanced the persisted state since it was built.
      // Never submit an old action or claim a second PD reward against it.
      const persistedBeforeAction = await this.repositories.discoveryRepository
        .getState(generationKey, locator);
      if (this.currentRequest === null ||
          JSON.stringify(this.currentRequest) !== JSON.stringify(request)) return;
      if (persistedBeforeAction.code !== model.discoveryState.code) {
        const synchronized = await this.resolveDetails(
          request, null, true, this.lastCommittedGalacticObjectState,
        );
        if (synchronized) {
          this.actionFeedbackSignal.set(
            'El conocimiento del objeto ya había cambiado. Ficha sincronizada sin repetir la observación ni conceder PD.',
          );
        } else {
          this.refreshRequiredSignal.set(true);
        }
        return;
      }

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
            action
              .actionType,
          );

      // Navigation can happen while IndexedDB is committing. Do not publish
      // the previous object's result in another object's Archive detail.
      if (this.currentRequest === null ||
          JSON.stringify(this.currentRequest) !== JSON.stringify(request)) return;

      // The action is already atomic and persisted. A separate readback may
      // momentarily be stale; never restore the previous scientific stage or
      // leave the old action executable after the transaction succeeded.
      this.lastCommittedGalacticObjectState = committed.actionResult.newDiscoveryState;
      let refreshed = await this.resolveDetails(
        request, null, true, this.lastCommittedGalacticObjectState,
      );
      // One bounded read-only retry covers transient cross-connection reads.
      // No scientific operation or PD write is repeated.
      if (!refreshed && this.currentRequest !== null &&
          JSON.stringify(this.currentRequest) === JSON.stringify(request)) {
        refreshed = await this.resolveDetails(
          request, null, true, this.lastCommittedGalacticObjectState,
        );
      }

      this.actionFeedbackSignal.set(
        refreshed
          ? `${action.label} completado · +${committed.actionResult.awardedDiscoveryPoints} PD · ${stateLabel(committed.actionResult.newDiscoveryState)}.`
          : `${action.label} guardada · +${committed.actionResult.awardedDiscoveryPoints} PD. La ficha necesita sincronizarse; no vuelvas a ejecutar la acción.`,
      );
    } catch (
      error
    ) {
      // A late failure from the previous galaxy cannot become the new
      // nucleus card's error after Angular has reused the Archive route.
      if (isGalacticNucleusLocator(locator) &&
          (this.currentRequest === null ||
            JSON.stringify(this.currentRequest) !== JSON.stringify(request))) {
        return;
      }
      // The transaction reads DiscoveryState again atomically. If that
      // authoritative read sees a newer stage, the old button must disappear
      // immediately rather than exposing the internal isStateEligible error.
      // Read-only recovery: never re-run commitAction or award PD twice.
      const isStateConflict = error instanceof RangeError &&
        error.message.includes('isStateEligible=false');
      let persistedAfterFailure: DiscoveryStateValue | null = null;
      try {
        if (this.currentRequest !== null &&
            JSON.stringify(this.currentRequest) === JSON.stringify(request)) {
          persistedAfterFailure = await this.repositories.discoveryRepository
            .getState(generationKey, locator);
        }
      } catch {
        // The original error and the retry control remain available.
      }
      const differsFromCard = persistedAfterFailure !== null &&
        persistedAfterFailure.code !== model.discoveryState.code;
      if ((isStateConflict || differsFromCard) &&
          this.currentRequest !== null &&
          JSON.stringify(this.currentRequest) === JSON.stringify(request)) {
        let synchronized = await this.resolveDetails(
          request, null, true, this.lastCommittedGalacticObjectState,
        );
        if (synchronized &&
            this.model()?.discoveryState.code === model.discoveryState.code) {
          synchronized = await this.resolveDetails(
            request, null, true, this.lastCommittedGalacticObjectState,
          );
        }
        if (synchronized &&
            this.model()?.discoveryState.code !== model.discoveryState.code) {
          this.actionFeedbackSignal.set(
            'El conocimiento persistido ya había avanzado. Ficha sincronizada; no se ha repetido la observación ni concedido PD.',
          );
          this.actionErrorSignal.set(null);
        } else {
          this.refreshRequiredSignal.set(true);
          this.actionErrorSignal.set(
            'El estado científico guardado no coincide con la ficha. Pulsa «Actualizar ficha»; no repitas la observación.',
          );
        }
        return;
      }
      this.actionErrorSignal.set(
        error instanceof Error
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

  async performPulsarTimingObservation():
    Promise<void> {

    const request =
      this.currentRequest;

    const generationKey =
      this.currentGenerationKey;

    const locator =
      this.currentLocator;

    const timing =
      this.model()
        ?.pulsarTiming ??
      null;

    if (
      request === null ||
      generationKey === null ||
      !(locator instanceof GalacticObjectLocator) ||
      timing === null ||
      !timing.canMeasure
    ) {
      this.actionErrorSignal.set(
        'La sincronización de pulsos no está disponible con el estado e instrumentación actuales.',
      );
      return;
    }

    if (this.actionPending()) return;

    this.actionPendingSignal.set(true);
    this.actionErrorSignal.set(null);
    this.actionFeedbackSignal.set(null);

    try {
      await this.pulsarTimingObservationRuntime.measure(
        generationKey,
        locator,
      );

      await this.resolveDetails(request, null, true, this.lastCommittedGalacticObjectState);

      this.actionFeedbackSignal.set(
        'Sincronización completada · período de pulsos medido y evidencia temporal persistida · sin coste ni recompensa directa de PD.',
      );
    } catch (error) {
      this.actionErrorSignal.set(
        error instanceof Error
          ? error.message
          : 'No se pudo completar la sincronización de pulsos.',
      );
    } finally {
      this.actionPendingSignal.set(false);
    }
  }

  async performMagnetarActivityObservation():
    Promise<void> {

    const request =
      this.currentRequest;

    const generationKey =
      this.currentGenerationKey;

    const locator =
      this.currentLocator;

    const activity =
      this.model()
        ?.magnetarActivity ??
      null;

    if (
      request === null ||
      generationKey === null ||
      !(locator instanceof GalacticObjectLocator) ||
      activity === null ||
      !activity.canMeasure
    ) {
      this.magnetarActivityErrorSignal.set(
        'La medición magnética del magnetar no está disponible con el estado, temporización e instrumentación actuales.',
      );
      return;
    }

    if (this.actionPending()) return;

    this.actionPendingSignal.set(true);
    this.actionErrorSignal.set(null);
    this.actionFeedbackSignal.set(null);
    this.magnetarActivityErrorSignal.set(null);
    this.magnetarActivityFeedbackSignal.set(null);

    try {
      await this.magnetarActivityObservationRuntime.measure(
        generationKey,
        locator,
      );

      await this.resolveDetails(request, null, true, this.lastCommittedGalacticObjectState);

      this.magnetarActivityFeedbackSignal.set(
        'Monitorización completada · campo dipolar inferido y actividad de estallidos persistida · sin coste ni recompensa directa de PD.',
      );
    } catch (error) {
      this.magnetarActivityErrorSignal.set(
        error instanceof Error
          ? error.message
          : 'No se pudo completar la monitorización magnética del magnetar.',
      );
    } finally {
      this.actionPendingSignal.set(false);
    }
  }

  async performRelativisticJetAnalysis():
    Promise<void> {

    const request =
      this.currentRequest;

    const generationKey =
      this.currentGenerationKey;

    const locator =
      this.currentLocator;

    const jetAnalysis =
      this.model()
        ?.relativisticJetAnalysis ??
      null;

    if (
      request === null ||
      generationKey === null ||
      !(locator instanceof GalacticObjectLocator) ||
      jetAnalysis === null ||
      !jetAnalysis.canAnalyze
    ) {
      this.relativisticJetAnalysisErrorSignal.set(
        'El análisis de jets relativistas no está disponible con el estado e instrumentación actuales.',
      );
      return;
    }

    if (this.actionPending()) return;

    this.actionPendingSignal.set(true);
    this.actionErrorSignal.set(null);
    this.actionFeedbackSignal.set(null);
    this.relativisticJetAnalysisErrorSignal.set(null);
    this.relativisticJetAnalysisFeedbackSignal.set(null);

    try {
      await this.relativisticJetAnalysisObservationRuntime.analyze(
        generationKey,
        locator,
      );

      // NUCLEUS-SYNC.1 publishes the canonical card before auxiliary 28.5/28.6
      // readbacks complete. The action result must be based on the persisted
      // observation status, never on an as-yet-null optional UI projection.
      const synchronized = await this.resolveDetails(
        request, null, true, this.lastCommittedGalacticObjectState,
      );
      if (!synchronized) return;
      const resolvedVersion = this.resolutionVersion;
      let status = this.model()?.relativisticJetAnalysis ?? null;
      if (status === null) {
        status = await this.relativisticJetAnalysisObservationRuntime.inspect(
          generationKey, locator,
        );
        // Navigation or another scientific action may supersede this response.
        if (resolvedVersion !== this.resolutionVersion) return;
        const current = this.stateSignal();
        if (current.kind !== 'content') return;
        this.stateSignal.set({
          kind: 'content',
          model: Object.freeze({ ...current.model, relativisticJetAnalysis: status }),
        });
      }
      if (status === null || !status.analyzed) {
        this.refreshRequiredSignal.set(true);
        this.relativisticJetAnalysisErrorSignal.set(
          'El análisis está guardado, pero aún no se ha podido leer su resultado. Actualiza la ficha sin repetir la observación.',
        );
        return;
      }
      const detected = status.facts.some(
        fact => fact.label === 'Resultado de la campaña' &&
          fact.value === 'Firma de jet relativista colimado detectada',
      );

      this.relativisticJetAnalysisFeedbackSignal.set(
        detected
          ? 'Análisis completado · firma relativista y cinemática caracterizadas y persistidas como evidencia científica · sin coste ni recompensa directa de PD.'
          : 'Análisis completado · no detección persistida como evidencia científica · sin coste ni recompensa directa de PD.',
      );
    } catch (error) {
      this.relativisticJetAnalysisErrorSignal.set(
        error instanceof Error
          ? error.message
          : 'No se pudo completar el análisis de jets relativistas.',
      );
    } finally {
      this.actionPendingSignal.set(false);
    }
  }

  async performGravitationalLensingReconstruction():
    Promise<void> {

    const request =
      this.currentRequest;

    const generationKey =
      this.currentGenerationKey;

    const locator =
      this.currentLocator;

    const lensing =
      this.model()
        ?.gravitationalLensingReconstruction ??
      null;

    if (
      request === null ||
      generationKey === null ||
      !(locator instanceof GalacticObjectLocator) ||
      lensing === null ||
      !lensing.canAnalyze
    ) {
      this.gravitationalLensingReconstructionErrorSignal.set(
        'La reconstrucción de lente gravitacional no está disponible con el estado e instrumentación actuales.',
      );
      return;
    }

    if (this.actionPending()) return;

    this.actionPendingSignal.set(true);
    this.actionErrorSignal.set(null);
    this.actionFeedbackSignal.set(null);
    this.gravitationalLensingReconstructionErrorSignal.set(null);
    this.gravitationalLensingReconstructionFeedbackSignal.set(null);

    try {
      await this.gravitationalLensingReconstructionObservationRuntime.analyze(
        generationKey,
        locator,
      );

      // Resolve the finished observation independently from the three
      // background studies. A pending auxiliary read must not be mistaken for
      // a scientific non-detection after successful persistence.
      const synchronized = await this.resolveDetails(
        request, null, true, this.lastCommittedGalacticObjectState,
      );
      if (!synchronized) return;
      const resolvedVersion = this.resolutionVersion;
      let status = this.model()?.gravitationalLensingReconstruction ?? null;
      if (status === null) {
        status = await this.gravitationalLensingReconstructionObservationRuntime.inspect(
          generationKey, locator,
        );
        if (resolvedVersion !== this.resolutionVersion) return;
        const current = this.stateSignal();
        if (current.kind !== 'content') return;
        this.stateSignal.set({
          kind: 'content',
          model: Object.freeze({ ...current.model, gravitationalLensingReconstruction: status }),
        });
      }
      if (status === null || !status.analyzed) {
        this.refreshRequiredSignal.set(true);
        this.gravitationalLensingReconstructionErrorSignal.set(
          'La reconstrucción está guardada, pero aún no se ha podido leer su resultado. Actualiza la ficha sin repetir la observación.',
        );
        return;
      }
      const detected = status.facts.some(
        fact => fact.label === 'Resultado de la campaña' &&
          fact.value === 'Configuración de lente gravitacional reconstruible detectada',
      );

      this.gravitationalLensingReconstructionFeedbackSignal.set(
        detected
          ? 'Análisis completado · geometría de lente y reconstrucción de fuente persistidas como evidencia científica · sin coste ni recompensa directa de PD.'
          : 'Análisis completado · no detección de una configuración fuerte reconstruible persistida como evidencia científica · sin coste ni recompensa directa de PD.',
      );
    } catch (error) {
      this.gravitationalLensingReconstructionErrorSignal.set(
        error instanceof Error
          ? error.message
          : 'No se pudo completar la reconstrucción de lente gravitacional.',
      );
    } finally {
      this.actionPendingSignal.set(false);
    }
  }

  async performStellarSystemObservation(
    ruleCode:
      StellarSystemScientificObservationRuleCode,
  ): Promise<void> {

    const request =
      this.currentRequest;

    const generationKey =
      this.currentGenerationKey;

    const locator =
      this.currentLocator;

    if (
      request ===
        null ||
      generationKey ===
        null ||
      !(locator instanceof
        SystemLocator)
    ) {
      this
        .actionErrorSignal
        .set(
          'No hay un sistema estelar válido seleccionado para observación.',
        );

      return;
    }

    const currentAction =
      this
        .model()
        ?.stellarSystemScientificCampaign
        ?.actions
        .find(
          action =>
            action.ruleCode ===
            ruleCode,
        ) ??
      null;

    if (
      currentAction
        ?.isCompleted ===
      true
    ) {
      this
        .actionErrorSignal
        .set(
          null,
        );

      this
        .actionFeedbackSignal
        .set(
          'Esta observación ya está aplicada con calidad suficiente para la etapa actual.',
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

    this
      .actionFeedbackSignal
      .set(
        null,
      );

    try {
      const committed =
        await this
          .stellarSystemScientificProgressionRuntime
          .performObservation(
            generationKey,
            locator,
            ruleCode,
          );

      await this
        .resolveDetails(
          request, null, true, this.lastCommittedGalacticObjectState,
        );

      const rewardSuffix =
        committed.awardedDiscoveryPoints >
          0
          ? ` · +${committed.awardedDiscoveryPoints} PD`
          : '';

      const visibleState =
        this
          .model()
          ?.discoveryState ??
        committed.stateAfter;

      this
        .actionFeedbackSignal
        .set(
          `Observación registrada${rewardSuffix} · ${stateLabel(visibleState)}.`,
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
            : 'No se pudo registrar la observación científica.',
        );
    } finally {
      this
        .actionPendingSignal
        .set(
          false,
        );
    }
  }

  async performStellarSystemStageObservation():
    Promise<void> {

    const request =
      this.currentRequest;

    const generationKey =
      this.currentGenerationKey;

    const locator =
      this.currentLocator;

    const campaign =
      this
        .model()
        ?.stellarSystemScientificCampaign ??
      null;

    if (
      request ===
        null ||
      generationKey ===
        null ||
      !(locator instanceof
        SystemLocator) ||
      campaign ===
        null
    ) {
      this
        .actionErrorSignal
        .set(
          'No hay una etapa científica válida seleccionada para este sistema.',
        );

      return;
    }

    const pendingActions =
      campaign.actions.filter(
        action =>
          action.isCompleted !==
          true,
      );

    if (
      pendingActions.length ===
      0
    ) {
      this
        .actionErrorSignal
        .set(
          null,
        );

      this
        .actionFeedbackSignal
        .set(
          'La campaña observacional de esta etapa ya está completada.',
        );

      return;
    }

    if (
      pendingActions.some(
        action =>
          !action.isAvailable,
      )
    ) {
      this
        .actionErrorSignal
        .set(
          'La campaña de esta etapa sigue bloqueada por requisitos de progresión o instrumentación.',
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

    this
      .actionFeedbackSignal
      .set(
        null,
      );

    try {
      const committed =
        await this
          .stellarSystemScientificProgressionRuntime
          .performObservations(
            generationKey,
            locator,
            pendingActions.map(
              action =>
                action.ruleCode,
            ),
          );

      let progressionSnapshot =
        committed.snapshot;

      // The Archive detailed card is itself the canonical DISCOVERED -> VISITED
      // entry milestone. Before the performance hotfix, resolveDetails(request)
      // re-applied this entry after a DETECTED -> DISCOVERED campaign. Passing
      // the preloaded DISCOVERED snapshot bypassed recordEntry(), leaving the
      // system stuck at DISCOVERED with no catalogue campaign. Preserve the
      // single-snapshot fast path for every other transition, but commit the
      // detailed-entry milestone exactly once when this stage has just reached
      // DISCOVERED.
      if (
        committed.stateAfter.code ===
          DiscoveryState.DISCOVERED.code &&
        request.stellarSystemEntryKind !==
          undefined &&
        request.stellarSystemEntryKind !==
          null
      ) {
        progressionSnapshot =
          (
            await this
              .stellarSystemScientificProgressionRuntime
              .recordEntry(
                generationKey,
                locator,
                request.stellarSystemEntryKind,
              )
          ).snapshot;
      }

      await this
        .resolveDetails(
          request, progressionSnapshot, true,
        );

      const rewardSuffix =
        committed.awardedDiscoveryPoints >
          0
          ? ` · +${committed.awardedDiscoveryPoints} PD`
          : '';

      const visibleState =
        this
          .model()
          ?.discoveryState ??
        campaign.discoveryState;

      this
        .actionFeedbackSignal
        .set(
          `Campaña de etapa completada${rewardSuffix} · ${stateLabel(visibleState)}.`,
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
            : 'No se pudo completar la campaña observacional de esta etapa.',
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

    preloadedStellarSystemProgression:
      StellarSystemScientificProgressionSnapshot | null =
      null,

    preserveCurrentContent = false,
    committedGalacticObjectState: DiscoveryStateValue | null = null,
  ): Promise<boolean> {

    // Retain the same renderer/canvas until the next fully assembled model
    // can be published atomically. Only route navigation enters 'loading'.
    // A late action belonging to a previous route may never overwrite the
    // current object's scientific card (Angular can reuse the same facade).
    if (preserveCurrentContent && this.currentRequest !== null &&
        JSON.stringify(this.currentRequest) !== JSON.stringify(request)) {
      return false;
    }
    const version = ++this.resolutionVersion;
    const keepContent = preserveCurrentContent && this.state().kind === 'content';
    if (!keepContent) {
      this.stateSignal.set({ kind: 'loading' });
      this.currentGenerationKey = null;
      this.currentLocator = null;
    }

    this.currentRequest = Object.freeze({ ...request });

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
          this.universeSeedFacade.resolvePersistedUniverse(universes),
          universes,
        );

      if (generationKey === null) {
        if (version !== this.resolutionVersion) return false;
        if (!keepContent) this.stateSignal.set({ kind: 'not-found' });
        else this.actionErrorSignal.set('No se pudo sincronizar el universo de la ficha. Reintenta actualizar sin repetir la observación.');
        if (keepContent) this.refreshRequiredSignal.set(true);
        return false;
      }

      const locator =
        createLocator(
          parsed,
        );

      const persistedDiscoveryState =
        await this
          .repositories
          .discoveryRepository
          .getState(
            generationKey,
            locator,
          );

      if (!DiscoveryState.isKnown(persistedDiscoveryState) &&
          !(locator instanceof GalacticObjectLocator && committedGalacticObjectState !== null &&
            DiscoveryState.isKnown(committedGalacticObjectState))) {
        if (version !== this.resolutionVersion) return false;
        if (!keepContent) this.stateSignal.set({ kind: 'not-found' });
        else this.actionErrorSignal.set('El registro recién actualizado no está disponible para lectura. Reintenta sincronizar la ficha.');
        if (keepContent) this.refreshRequiredSignal.set(true);
        return false;
      }

      const shouldLoadStellarSystemProgression =
        locator instanceof
          SystemLocator &&
        (
          request.includeStellarSystemScientificProgression ===
            true ||
          (
            request.stellarSystemEntryKind !==
              undefined &&
            request.stellarSystemEntryKind !==
              null
          )
        );

      const stellarSystemProgression =
        shouldLoadStellarSystemProgression &&
        locator instanceof
          SystemLocator
          ? preloadedStellarSystemProgression !==
              null
            ? preloadedStellarSystemProgression
            : request.stellarSystemEntryKind ===
              undefined ||
            request.stellarSystemEntryKind ===
              null
            ? await this
                .stellarSystemScientificProgressionRuntime
                .snapshot(
                  generationKey,
                  locator,
                )
            : (
                await this
                  .stellarSystemScientificProgressionRuntime
                  .recordEntry(
                    generationKey,
                    locator,
                    request.stellarSystemEntryKind,
                  )
              ).snapshot
          : null;

      // A successfully committed scientific action is authoritative for the
      // current object. Never demote its UI because a separate readback or a
      // test double still exposes the preceding discovery level.
      const synchronizedObjectState =
        locator instanceof GalacticObjectLocator &&
        committedGalacticObjectState !== null &&
        committedGalacticObjectState.code > persistedDiscoveryState.code
          ? committedGalacticObjectState
          : persistedDiscoveryState;

      const discoveryState =
        stellarSystemProgression?.discoveryState ?? synchronizedObjectState;

      const stellarSystemScientificCampaign =
        stellarSystemProgression ===
          null
          ? null
          : StellarSystemScientificCampaignAssembler
              .build(
                stellarSystemProgression,
              );

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
          ? (generationKey.generatorVersion.code === 2 || generationKey.generatorVersion.code === 3)
            ? ArchiveV2StellarSystemCardAssembler.build(generationKey, locator, discoveryState)
            : ArchiveStellarSystemCardAssembler.build(generationKey, locator, discoveryState)
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

      const eventHorizonApproach =
        locator instanceof
          GalacticObjectLocator
          ? ArchiveEventHorizonApproachAssembler
              .build(
                generationKey,
                locator,
                galacticObjectCard,
              )
          : null;

      const pulsarTiming =
        locator instanceof GalacticObjectLocator &&
        galacticObjectCard?.extremeType !== null &&
        galacticObjectCard?.extremeType !== undefined &&
        galacticObjectCard.knowledgeLevel === 'CONFIRMED' &&
        extremeTypeDefinition(galacticObjectCard.extremeType).capabilities.pulseTiming
          ? await this
              .pulsarTimingObservationRuntime
              .inspect(
                generationKey,
                locator,
              )
          : null;

      const magnetarActivity =
        locator instanceof GalacticObjectLocator &&
        galacticObjectCard?.extremeType !== null &&
        galacticObjectCard?.extremeType !== undefined &&
        galacticObjectCard.knowledgeLevel === 'CONFIRMED' &&
        extremeTypeDefinition(galacticObjectCard.extremeType).capabilities.magneticActivity
          ? await this
              .magnetarActivityObservationRuntime
              .inspect(
                generationKey,
                locator,
              )
          : null;

      // NUCLEUS-SYNC.1: publish the nuclear scientific stage and its 3D card
      // BEFORE querying optional 28.5/28.6/28.7 studies. A rejected or slow
      // complementary operation must never roll back an already committed
      // DETECTED -> DISCOVERED -> CATALOGUED -> CONFIRMED transition.
      const isConfirmedActiveNucleus =
        locator instanceof GalacticObjectLocator &&
        isGalacticNucleusLocator(locator) &&
        galacticObjectCard?.knowledgeLevel === 'CONFIRMED' &&
        galacticObjectCard.scientificSubject ===
          GalacticObjectScientificSubject.ACTIVE_GALACTIC_NUCLEUS;

      const relativisticJetAnalysis = isConfirmedActiveNucleus
        ? null
        : locator instanceof GalacticObjectLocator &&
            galacticObjectCard?.knowledgeLevel === 'CONFIRMED' &&
            galacticObjectCard.extremeType === ExtremeType.MICROQUASAR
          ? await this.relativisticJetAnalysisObservationRuntime.inspect(
              generationKey, locator,
            )
          : null;

      const gravitationalLensingReconstruction = isConfirmedActiveNucleus
        ? null
        : locator instanceof GalacticObjectLocator &&
            galacticObjectCard?.knowledgeLevel === 'CONFIRMED' &&
            galacticObjectCard.extremeType === ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE
          ? await this.gravitationalLensingReconstructionObservationRuntime.inspect(
              generationKey, locator,
            )
          : null;

      const completionExtremeType =
        galacticObjectCard?.extremeType ??
        (galacticObjectCard?.scientificSubject ===
          GalacticObjectScientificSubject.ACTIVE_GALACTIC_NUCLEUS
          ? galacticObjectCard.render.kind ===
              ArchiveGalacticObjectRenderKind.QUASAR_NUCLEUS
            ? ExtremeType.QUASAR
            : ExtremeType.AGN
          : null);

      const extremeScientificCompletion = isConfirmedActiveNucleus
        ? null
        : locator instanceof GalacticObjectLocator &&
            galacticObjectCard?.knowledgeLevel === 'CONFIRMED' &&
            completionExtremeType !== null
          ? await this.extremeScientificCompletionRuntime.settle(
              generationKey,
              locator,
              completionExtremeType,
              galacticObjectCard.scientificSubject,
            )
          : null;

      const extremeScientificEpistemicBoundary =
        locator instanceof GalacticObjectLocator &&
        galacticObjectCard?.knowledgeLevel === 'CONFIRMED' &&
        completionExtremeType !== null
          ? ExtremeScientificEpistemicBoundaryEngine
              .build(
                completionExtremeType,
                galacticObjectCard.scientificSubject,
              )
          : null;

      const protoplanetaryDiskAnalysis =
        locator instanceof
          SystemLocator &&
        discoveryState.code >=
          DiscoveryState.CONFIRMED.code
          ? buildProtoplanetaryDiskAnalysisModel(
              // The V2 multiple's A/B/C/P disk populations do not have one
              // authoritative parent disk. Never display the V1 parent disk
              // as a physical property of the complete multihost system.
              (generationKey.generatorVersion.code === 2 || generationKey.generatorVersion.code === 3) &&
              (stellarSystemCard?.render.multiplicity?.name !== 'SINGLE' ||
                CompactHostPlanetarySystemGenerator.generateOrNull(generationKey, locator) !== null)
                ? null
                : ProtoplanetaryDiskAnalysisEngine.analyzeOrNull(
                    (generationKey.generatorVersion.code === 2 || generationKey.generatorVersion.code === 3)
                      ? multihostPhysicalSourceKey(generationKey)
                      : generationKey,
                    locator,
                  ),
            )
          : null;

      if (version !== this.resolutionVersion) return false;
      this.currentGenerationKey =
        generationKey;

      this.currentLocator =
        locator;

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

              routeUniverseRef:
                scientificRouteUniverseRef(
                  generationKey
                    .universeSeed
                    .serialize(),
                  generationKey
                    .generatorVersion
                    .code,
                ),

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

              eventHorizonApproach,

              pulsarTiming,

              magnetarActivity,

              relativisticJetAnalysis,

              gravitationalLensingReconstruction,

              extremeScientificCompletion,

              extremeScientificEpistemicBoundary,

              stellarSystemScientificCampaign,

              stellarSystemScientificAction:
                null,

              protoplanetaryDiskAnalysis,
            }),
        });
      if (this.refreshRequiredSignal()) this.actionErrorSignal.set(null);
      this.refreshRequiredSignal.set(false);
      if (isConfirmedActiveNucleus &&
          locator instanceof GalacticObjectLocator &&
          galacticObjectCard !== null &&
          completionExtremeType !== null) {
        this.nucleusSupplementaryWarningSignal.set(null);
        void this.resolveNucleusSupplementaryScience(
          generationKey, locator, completionExtremeType,
          galacticObjectCard.scientificSubject, version,
        );
      }
      return true;
    } catch (error) {
      if (version !== this.resolutionVersion) return false;
      const message = error instanceof Error
        ? error.message
        : 'No se pudo resolver la ficha del descubrimiento.';
      if (keepContent) {
        // Persisted science is not rolled back by a failed presentation read.
        // Do not destroy a mounted 3D scene or silently re-enable the old action.
        this.refreshRequiredSignal.set(true);
        this.actionErrorSignal.set(`La observación está guardada, pero la ficha no se ha actualizado: ${message}`);
      } else {
        this.stateSignal.set({ kind: 'error', message });
      }
      return false;
    }
  }

  /**
   * Post-confirmation studies are independent of the primary nucleus card.
   * The version guard also prevents a late result from a former galaxy from
   * replacing the card after an Angular route reuse.
   * Completion settles rewards atomically in its own runtime; never duplicate
   * that transaction when a presentation read fails.
   */
  private async resolveNucleusSupplementaryScience(
    generationKey: UniverseGenerationKey,
    locator: GalacticObjectLocator,
    extremeType: ExtremeTypeValue,
    scientificSubject: GalacticObjectScientificSubject | null,
    version: number,
  ): Promise<void> {
    const [jet, lensing, completion] = await Promise.allSettled([
      Promise.resolve().then(() =>
        this.relativisticJetAnalysisObservationRuntime.inspect(generationKey, locator)),
      Promise.resolve().then(() =>
        this.gravitationalLensingReconstructionObservationRuntime.inspect(generationKey, locator)),
      Promise.resolve().then(() =>
        this.extremeScientificCompletionRuntime.settle(
          generationKey, locator, extremeType, scientificSubject)),
    ]);

    if (version !== this.resolutionVersion) return;
    const current = this.stateSignal();
    if (current.kind !== 'content') return;

    const issues = [
      jet.status === 'rejected' ? 'jets relativistas' : null,
      lensing.status === 'rejected' ? 'lente gravitacional' : null,
      completion.status === 'rejected' ? 'expediente científico' : null,
    ].filter((item): item is string => item !== null);

    this.stateSignal.set({
      kind: 'content',
      model: Object.freeze({
        ...current.model,
        relativisticJetAnalysis: jet.status === 'fulfilled' ? jet.value : null,
        gravitationalLensingReconstruction:
          lensing.status === 'fulfilled' ? lensing.value : null,
        extremeScientificCompletion:
          completion.status === 'fulfilled' ? completion.value : null,
      }),
    });
    this.nucleusSupplementaryWarningSignal.set(
      issues.length > 0
        ? `Los estudios complementarios de ${issues.join(', ')} no se han podido actualizar. La confirmación científica se conserva; puedes reintentar sin repetir la observación.`
        : null,
    );
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

    // PERF-GO1: the six persisted milestone existence facts determine
    // instrument unlocks. Reading/sorting every discovery in a mature universe
    // was repeated at initial entry and after every stage transition.
    const repository = this.repositories.discoveryRepository;
    const [globalDiscoveryPoints, achievedMilestones] = await Promise.all([
      this.repositories.pointsRepository.getGlobalDiscoveryPoints(generationKey),
      repository.getObservationProgressMilestones !== undefined
        ? repository.getObservationProgressMilestones(generationKey)
        : repository.getKnownDiscoveries(generationKey).then((knownDiscoveries: readonly KnownDiscovery[]) =>
            ObservationInstrumentProgressionEngine.evaluate(
              generationKey, 0n, knownDiscoveries,
            ).achievedMilestones),
    ]);

    const progression = ObservationInstrumentProgressionEngine
      .evaluateFromMilestones(
        generationKey, globalDiscoveryPoints, achievedMilestones,
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
      : GalacticObjectScientificActionCatalogV2
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

  return GalacticObjectScientificActionCatalogV2
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

    case ObservationProgressMilestone.FIRST_SYSTEM_CATALOGUED:
      return 'Catalogar el primer sistema';

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
    ProceduralLocator,

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

function buildProtoplanetaryDiskAnalysisModel(
  analysis:
    ProtoplanetaryDiskAnalysis | null,
): ArchiveProtoplanetaryDiskAnalysisModel | null {

  if (
    analysis ===
      null
  ) {
    return null;
  }

  const diskFacts =
    Object.freeze([
      diskFact(
        'Etapa estelar joven',
        stellarYouthStageLabel(
          analysis
            .stellarYouthStage
            .name,
        ),
      ),
      diskFact(
        'Etapa del disco',
        diskStageLabel(
          analysis
            .diskStage
            .name,
        ),
      ),
      diskFact(
        'Edad del disco',
        formatMillionYears(
          analysis
            .diskAgeMillionYears,
        ),
      ),
      diskFact(
        'Masa total',
        `${formatNumber(analysis.diskMassSolar, 5)} M☉`,
      ),
      diskFact(
        'Extensión radial',
        `${formatNumber(analysis.innerRadiusAu, 3)}–${formatNumber(analysis.outerRadiusAu, 2)} AU`,
      ),
      diskFact(
        'Radio característico',
        `${formatNumber(analysis.characteristicRadiusAu, 2)} AU`,
      ),
      diskFact(
        'Gas',
        formatPercent(
          analysis
            .gasMassFraction01,
        ),
      ),
      diskFact(
        'Polvo',
        formatPercent(
          analysis
            .dustMassFraction01,
        ),
      ),
      diskFact(
        'Huecos radiales',
        String(
          analysis.gapCount,
        ),
      ),
      diskFact(
        'Regiones de condensación',
        String(
          analysis
            .condensationRegionCount,
        ),
      ),
      diskFact(
        'Línea de nieve del agua',
        analysis
          .waterSnowLineRadiusAu ===
          null
          ? 'No cruza el disco V1'
          : `${formatNumber(analysis.waterSnowLineRadiusAu, 2)} AU`,
      ),
    ]);

  const formationFacts =
    Object.freeze([
      diskFact(
        'Candidatos iniciales',
        String(
          analysis
            .initialCandidateCount,
        ),
      ),
      diskFact(
        'Sólidos en candidatos',
        `${formatNumber(analysis.candidateSolidMassEarth, 3)} M⊕`,
      ),
      diskFact(
        'Supervivientes tempranos',
        String(
          analysis
            .survivingBodyCount,
        ),
      ),
      diskFact(
        'Cuerpos migrados',
        String(
          analysis
            .migratedBodyCount,
        ),
      ),
      diskFact(
        'Colisiones tempranas',
        String(
          analysis
            .collisionCount,
        ),
      ),
    ]);

  return Object.freeze({
    summary:
      analysis.hasCandidatePopulation
        ? `El análisis resuelve un disco protoplanetario con ${analysis.initialCandidateCount} candidato${analysis.initialCandidateCount === 1 ? '' : 's'} inicial${analysis.initialCandidateCount === 1 ? '' : 'es'} y ${analysis.survivingBodyCount} superviviente${analysis.survivingBodyCount === 1 ? '' : 's'} tras la dinámica temprana simplificada.`
        : 'El análisis confirma el disco protoplanetario, pero la reserva sólida V1 no materializa candidatos protoplanetarios en este sistema.',

    diskFacts,

    formationFacts,
  });
}

function diskFact(
  label:
    string,

  value:
    string,
): ArchiveProtoplanetaryDiskAnalysisFactModel {

  return Object.freeze({
    label,
    value,
  });
}

function stellarYouthStageLabel(
  stage:
    string,
): string {

  switch (
    stage
  ) {
    case 'PROTOSTAR':
      return 'Protoestrella';

    case 'PRE_MAIN_SEQUENCE':
      return 'Pre-secuencia principal';

    case 'YOUNG_STAR':
      return 'Estrella joven';

    case 'YOUNG_BROWN_DWARF':
      return 'Enana marrón joven';

    default:
      return stage;
  }
}

function diskStageLabel(
  stage:
    string,
): string {

  switch (
    stage
  ) {
    case 'EMBEDDED_ACCRETION_DISK':
      return 'Disco de acreción embebido';

    case 'MASSIVE_PRIMORDIAL_DISK':
      return 'Disco primordial masivo';

    case 'EVOLVING_PRIMORDIAL_DISK':
      return 'Disco primordial en evolución';

    case 'DISPERSING_DISK':
      return 'Disco en dispersión';

    default:
      return stage;
  }
}

function formatMillionYears(
  ageMillionYears:
    number,
): string {

  if (
    ageMillionYears >=
      1
  ) {
    return `${formatNumber(ageMillionYears, ageMillionYears >= 100 ? 0 : 2)} millones de años`;
  }

  const thousandYears =
    ageMillionYears *
    1_000;

  if (
    thousandYears >=
      1
  ) {
    return `${formatNumber(thousandYears, thousandYears >= 100 ? 0 : 1)} mil años`;
  }

  return `${formatNumber(ageMillionYears * 1_000_000, 0)} años`;
}

function formatPercent(
  fraction:
    number,
): string {

  return `${formatNumber(fraction * 100, 2)} %`;
}

function formatNumber(
  value:
    number,

  maximumFractionDigits:
    number,
): string {

  return value
    .toLocaleString(
      'es-ES',
      {
        maximumFractionDigits,
      },
    );
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

  readonly universeRef:
    string | null;

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
      request.universeRef ??
        null,
      request.universeSeed ??
        null,
      request.generatorVersionCode ??
        null,
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
  universeRef:
    string | null,

  universeSeed:
    string | null,

  generatorVersionCode:
    string | null,
): {
  readonly universeRef:
    string | null;

  readonly universeSeed:
    string | null;

  readonly generatorVersionCode:
    number | null;
} {

  if (
    universeRef !==
      null
  ) {
    if (
      universeSeed !==
        null ||
      generatorVersionCode !==
        null
    ) {
      throw new RangeError(
        'La ruta científica no puede mezclar la referencia pública del universo con seed/version legacy.',
      );
    }

    if (
      !isScientificRouteUniverseRef(
        universeRef,
      )
    ) {
      throw new RangeError(
        'La referencia pública del universo de la ficha no tiene un formato válido.',
      );
    }

    return {
      universeRef,
      universeSeed:
        null,
      generatorVersionCode:
        null,
    };
  }

  if (
    universeSeed ===
      null &&
    generatorVersionCode ===
      null
  ) {
    return {
      universeRef:
        null,
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
      'La identidad legacy de universo de la ficha requiere seed y versión de generador.',
    );
  }

  if (
    !UniverseSeed.isValid(
      universeSeed,
    )
  ) {
    throw new RangeError(
      'La seed legacy de universo de la ficha no tiene un formato válido.',
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
    universeRef:
      null,
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
    UniverseGenerationKey | null,

  persistedUniverses:
    readonly UniverseGenerationKey[],
): UniverseGenerationKey | null {

  if (
    request.universeRef !==
      null
  ) {
    return persistedUniverses
      .find(
        candidate =>
          scientificRouteUniverseRef(
            candidate
              .universeSeed
              .serialize(),
            candidate
              .generatorVersion
              .code,
          ) ===
          request.universeRef,
      ) ??
      null;
  }

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
          selectedGenerationKey !== null && sameGenerationKey(
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
