import {
  computed,
  inject,
  Injectable,
  signal,
} from '@angular/core';

import {
  ExternalGalaxyFocusChoice,
} from '../../domain/exploration/external-galaxy-focus';

import {
  type ExplorationSectorProgressResult,
} from '../../domain/exploration/exploration-sector-progress-result';

import {
  type ExplorationSectorResult,
} from '../../domain/exploration/exploration-sector-result';

import {
  type ExplorationSectorScanResult,
  type ExplorationSectorSelection,
} from '../../domain/exploration/exploration-sector-scan';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  SectorLocator,
} from '../../domain/generation/procedural-locator';


import {
  ExternalGalaxyFocusEngine,
} from '../../simulation/exploration/external-galaxy-focus-engine';

import {
  ExplorationSectorResultEngine,
} from '../../simulation/exploration/exploration-sector-result-engine';

import {
  ExplorationSectorScanEngine,
} from '../../simulation/exploration/exploration-sector-scan-engine';

import {
  EXTERNAL_GALAXY_SEARCH_RUNTIME,
  type ExternalGalaxySearchRuntimeResult,
  type ExternalGalaxySearchStatus,
} from '../runtime/external-galaxy-search.runtime';

import {
  GALAXY_FOCUS_RUNTIME,
} from '../runtime/galaxy-focus.runtime';

import {
  GalaxyFocusTransitionRuntime,
} from '../runtime/galaxy-focus-transition.runtime';

import {
  EXPLORATION_SECTOR_PROGRESS_RUNTIME,
} from '../runtime/exploration-sector-progress.runtime';

import {
  GENESIS_LOCAL_REPOSITORIES,
} from '../runtime/genesis-local-repositories';

import {
  UniverseSeedFacade,
} from '../universe/universe-seed.facade';

import {
  ExplorationEntryAssembler,
} from './exploration-entry-assembler';

import {
  type ExplorationEntryModel,
} from './exploration-entry-model';

import {
  type ExplorationUiState,
  INITIAL_EXPLORATION_UI_STATE,
} from './exploration-ui-state';

/**
 * Main exploration facade.
 *
 * The original point-9.5 sector flow remains unchanged. The missing gameplay
 * integration for frozen points 7.4..7.8 is exposed as an independent
 * extragalactic search flow:
 *
 * - it never treats another galaxy as content of a sector;
 * - failed attempts persist the point-7.5 anti-blocking streak;
 * - a successful attempt persists one external GalaxyLocator at DETECTED,
 *   awards the frozen galaxy-detection PD and exposes only point-7.6
 *   preliminary information;
 * - point 7.7 always requires an explicit remain/change-focus decision.
 */
export interface ExternalGalaxySearchOpportunityNotification {
  readonly newlyUnlockedSearchOpportunities:
    bigint;

  readonly availableSearchOpportunities:
    bigint;
}

export interface ExplorationMapSectorSelectionRequest {
  readonly sectorX:
    string;

  readonly sectorY:
    string;
}

@Injectable({
  providedIn:
    'root',
})
export class ExplorationFacade {

  private readonly repositories =
    inject(
      GENESIS_LOCAL_REPOSITORIES,
    );

  private readonly progressRuntime =
    inject(
      EXPLORATION_SECTOR_PROGRESS_RUNTIME,
    );

  private readonly externalGalaxySearchRuntime =
    inject(
      EXTERNAL_GALAXY_SEARCH_RUNTIME,
    );

  private readonly focusRuntime =
    inject(
      GALAXY_FOCUS_RUNTIME,
    );

  private readonly focusTransitionRuntime =
    inject(
      GalaxyFocusTransitionRuntime,
    );

  private readonly universeSeedFacade =
    inject(
      UniverseSeedFacade,
    );

  private readonly stateSignal =
    signal<ExplorationUiState>(
      INITIAL_EXPLORATION_UI_STATE,
    );

  private readonly selectedSectorSignal =
    signal<ExplorationSectorSelection | null>(
      null,
    );

  private readonly selectedSectorFromMapSignal =
    signal<boolean>(
      false,
    );

  private readonly selectedSectorExploredSignal =
    signal<boolean>(
      false,
    );

  private readonly scanResultSignal =
    signal<ExplorationSectorScanResult | null>(
      null,
    );

  private readonly explorationResultSignal =
    signal<ExplorationSectorResult | null>(
      null,
    );

  private readonly progressResultSignal =
    signal<ExplorationSectorProgressResult | null>(
      null,
    );

  private readonly progressPendingSignal =
    signal<boolean>(
      false,
    );

  private readonly scanErrorSignal =
    signal<string>(
      '',
    );

  private readonly progressErrorSignal =
    signal<string>(
      '',
    );

  private readonly externalSearchStatusSignal =
    signal<ExternalGalaxySearchStatus | null>(
      null,
    );

  private readonly externalSearchOpportunityNotificationSignal =
    signal<ExternalGalaxySearchOpportunityNotification | null>(
      null,
    );

  private readonly externalSearchResultSignal =
    signal<ExternalGalaxySearchRuntimeResult | null>(
      null,
    );

  private readonly externalSearchPendingSignal =
    signal<boolean>(
      false,
    );

  private readonly externalSearchErrorSignal =
    signal<string>(
      '',
    );

  private readonly externalFocusDecisionSignal =
    signal<ExternalGalaxyFocusChoice | null>(
      null,
    );

  private readonly externalFocusPendingSignal =
    signal<boolean>(
      false,
    );

  private readonly externalFocusMessageSignal =
    signal<string>(
      '',
    );

  private readonly externalFocusErrorSignal =
    signal<string>(
      '',
    );

  private refreshSequence =
    0;

  private scanSequence =
    0;

  private externalSearchSequence =
    0;

  private externalFocusSequence =
    0;

  readonly state =
    this.stateSignal
      .asReadonly();

  readonly selectedSector =
    this.selectedSectorSignal
      .asReadonly();

  readonly selectedSectorFromMap =
    this.selectedSectorFromMapSignal
      .asReadonly();

  readonly selectedSectorExplored =
    this.selectedSectorExploredSignal
      .asReadonly();

  readonly scanResult =
    this.scanResultSignal
      .asReadonly();

  readonly explorationResult =
    this.explorationResultSignal
      .asReadonly();

  readonly progressResult =
    this.progressResultSignal
      .asReadonly();

  readonly progressPending =
    this.progressPendingSignal
      .asReadonly();

  readonly scanErrorMessage =
    this.scanErrorSignal
      .asReadonly();

  readonly progressErrorMessage =
    this.progressErrorSignal
      .asReadonly();

  readonly externalSearchStatus =
    this.externalSearchStatusSignal
      .asReadonly();

  readonly externalSearchOpportunityNotification =
    this.externalSearchOpportunityNotificationSignal
      .asReadonly();

  readonly externalSearchResult =
    this.externalSearchResultSignal
      .asReadonly();

  readonly externalSearchPending =
    this.externalSearchPendingSignal
      .asReadonly();

  readonly externalSearchErrorMessage =
    this.externalSearchErrorSignal
      .asReadonly();

  readonly externalFocusDecision =
    this.externalFocusDecisionSignal
      .asReadonly();

  readonly externalFocusPending =
    this.externalFocusPendingSignal
      .asReadonly();

  readonly externalFocusMessage =
    this.externalFocusMessageSignal
      .asReadonly();

  readonly externalFocusErrorMessage =
    this.externalFocusErrorSignal
      .asReadonly();

  readonly externalFocusChoiceRequired =
    computed<boolean>(
      () => {
        const result =
          this.externalSearchResult();

        return (
          result?.detected ===
            true &&
          result.focusOffer !==
            null &&
          this.externalFocusDecision() ===
            null
        );
      },
    );

  readonly entry =
    computed<ExplorationEntryModel | null>(
      () => {
        const state =
          this.state();

        return state.kind ===
          'content'
          ? state.entry
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

  async refresh(
    mapSector:
      ExplorationMapSectorSelectionRequest | null =
        null,
  ):
    Promise<void> {

    const refreshId =
      ++this.refreshSequence;

    ++this.scanSequence;
    ++this.externalSearchSequence;
    ++this.externalFocusSequence;

    this.resetOperationalFlow();
    this.resetExternalTransientFlow();

    this.stateSignal
      .set({
        kind:
          'loading',
      });

    try {
      const generationKey =
        this.universeSeedFacade
          .activeGenerationKey();

      const universeExists =
        await this.repositories
          .universeRepository
          .exists(
            generationKey,
          );

      if (
        refreshId !==
        this.refreshSequence
      ) {
        return;
      }

      if (
        !universeExists
      ) {
        this.stateSignal
          .set({
            kind:
              'empty',
          });

        return;
      }

      const [
        navigation,
        knownDiscoveries,
        externalSearchStatus,
      ] =
        await Promise.all([
          this.repositories
            .navigationRepository
            .getNavigation(
              generationKey,
            ),

          this.repositories
            .discoveryRepository
            .getKnownDiscoveries(
              generationKey,
            ),

          this.externalGalaxySearchRuntime
            .getStatus(
              generationKey,
            ),
        ]);

      if (
        refreshId !==
        this.refreshSequence
      ) {
        return;
      }

      const entry =
        ExplorationEntryAssembler
          .assemble(
            generationKey,
            navigation
              .activeGalaxyIndex,
            knownDiscoveries,
          );

      const centralSector =
        ExplorationSectorScanEngine
          .prepareSector(
            generationKey,
            entry.activeGalaxyIndex,
            0,
            0,
          );

      let selectedSector =
        centralSector;

      let selectedSectorFromMap =
        false;

      let selectedSectorExplored =
        false;

      if (
        mapSector !==
          null
      ) {
        const sectorX =
          parseIntegerCoordinate(
            mapSector.sectorX,
            'X',
          );

        const sectorY =
          parseIntegerCoordinate(
            mapSector.sectorY,
            'Y',
          );

        assertWithinGrid(
          sectorX,
          centralSector.minCoordinate,
          centralSector.maxCoordinate,
        );

        assertWithinGrid(
          sectorY,
          centralSector.minCoordinate,
          centralSector.maxCoordinate,
        );

        selectedSector =
          ExplorationSectorScanEngine
            .prepareSector(
              generationKey,
              entry.activeGalaxyIndex,
              sectorX,
              sectorY,
            );

        selectedSectorFromMap =
          true;

        selectedSectorExplored =
          knownDiscoveries
            .some(
              (
                discovery,
              ) =>
                discovery.locator instanceof
                  SectorLocator &&
                discovery.locator
                  .galaxyIndex ===
                  selectedSector.galaxyIndex &&
                discovery.locator
                  .sectorKey ===
                  selectedSector
                    .sectorLocator
                    .sectorKey,
            );
      }

      this.selectedSectorSignal
        .set(
          selectedSector,
        );

      this.selectedSectorFromMapSignal
        .set(
          selectedSectorFromMap,
        );

      this.selectedSectorExploredSignal
        .set(
          selectedSectorExplored,
        );

      await this
        .publishExternalSearchStatus(
          externalSearchStatus,
          generationKey,
        );

      this.stateSignal
        .set({
          kind:
            'content',

          entry,
        });
    } catch (
      error
    ) {
      if (
        refreshId !==
        this.refreshSequence
      ) {
        return;
      }

      this.stateSignal
        .set({
          kind:
            'error',

          message:
            error instanceof Error &&
            error.message
              .trim()
              .length >
              0
              ? error.message
              : 'No se pudo preparar el contexto de exploración.',
        });
    }
  }

  async searchExternalGalaxy():
    Promise<void> {

    const searchId =
      ++this.externalSearchSequence;

    this.externalSearchResultSignal
      .set(
        null,
      );

    this.externalSearchErrorSignal
      .set(
        '',
      );

    this.externalFocusDecisionSignal
      .set(
        null,
      );

    this.externalFocusMessageSignal
      .set(
        '',
      );

    this.externalFocusErrorSignal
      .set(
        '',
      );

    const entry =
      this.entry();

    if (
      entry ===
      null
    ) {
      this.externalSearchErrorSignal
        .set(
          'No hay un contexto de exploración activo.',
        );

      return;
    }

    this.externalSearchPendingSignal
      .set(
        true,
      );

    try {
      const result =
        await this
          .externalGalaxySearchRuntime
          .search(
            entry
              .generationKey,
          );

      const status =
        await this
          .externalGalaxySearchRuntime
          .getStatus(
            entry
              .generationKey,
          );

      if (
        searchId !==
        this.externalSearchSequence
      ) {
        return;
      }

      this.externalSearchResultSignal
        .set(
          result,
        );

      await this
        .publishExternalSearchStatus(
          status,
          entry.generationKey,
        );
    } catch (
      error
    ) {
      if (
        searchId !==
        this.externalSearchSequence
      ) {
        return;
      }

      this.externalSearchErrorSignal
        .set(
          error instanceof Error &&
          error.message
            .trim()
            .length >
            0
            ? error.message
            : 'No se pudo ejecutar la búsqueda extragaláctica.',
        );
    } finally {
      if (
        searchId ===
        this.externalSearchSequence
      ) {
        this.externalSearchPendingSignal
          .set(
            false,
          );
      }
    }
  }

  dismissExternalSearchOpportunityNotification():
    void {

    this.externalSearchOpportunityNotificationSignal
      .set(
        null,
      );
  }

  remainOnCurrentGalaxy():
    void {

    this.externalFocusErrorSignal
      .set(
        '',
      );

    const entry =
      this.entry();

    const result =
      this.externalSearchResult();

    if (
      entry ===
        null ||
      result?.focusOffer ===
        null ||
      result?.focusOffer ===
        undefined
    ) {
      this.externalFocusErrorSignal
        .set(
          'No existe una detección externa pendiente de decisión.',
        );

      return;
    }

    const decision =
      ExternalGalaxyFocusEngine
        .resolveFocusChoice(
          entry
            .generationKey,
          result
            .focusOffer,
          ExternalGalaxyFocusChoice
            .REMAIN_CURRENT,
        );

    if (
      decision
        .resultingFocusGalaxyIndex !==
      entry
        .activeGalaxyIndex
    ) {
      this.externalFocusErrorSignal
        .set(
          'La decisión de permanecer no conservó la galaxia activa esperada.',
        );

      return;
    }

    this.externalFocusDecisionSignal
      .set(
        ExternalGalaxyFocusChoice
          .REMAIN_CURRENT,
      );

    this.externalFocusMessageSignal
      .set(
        'Permaneces en la galaxia actual. La nueva galaxia detectada queda accesible desde Galaxias descubiertas.',
      );
  }

  async focusDetectedGalaxy():
    Promise<void> {

    const focusId =
      ++this.externalFocusSequence;

    this.externalFocusErrorSignal
      .set(
        '',
      );

    this.externalFocusMessageSignal
      .set(
        '',
      );

    const entry =
      this.entry();

    const result =
      this.externalSearchResult();

    const detectedGalaxyIndex =
      result
        ?.detectedGalaxyIndex ??
      null;

    if (
      entry ===
        null ||
      result?.focusOffer ===
        null ||
      result?.focusOffer ===
        undefined ||
      detectedGalaxyIndex ===
        null
    ) {
      this.externalFocusErrorSignal
        .set(
          'No existe una galaxia externa detectada a la que cambiar el foco.',
        );

      return;
    }

    this.externalFocusPendingSignal
      .set(
        true,
      );

    try {
      const focusResult =
        await this
          .focusRuntime
          .changeFocus(
            entry
              .generationKey,
            detectedGalaxyIndex,
          );

      if (
        focusId !==
        this.externalFocusSequence
      ) {
        return;
      }

      if (
        focusResult
          .activeGalaxyIndex !==
        detectedGalaxyIndex
      ) {
        throw new Error(
          'El cambio de foco no confirmó la galaxia externa detectada.',
        );
      }

      await this.refresh();

      this
        .focusTransitionRuntime
        .presentPersistedFocusChange({
          previousFocusGalaxyIndex:
            focusResult
              .previousFocusGalaxyIndex,

          activeGalaxyIndex:
            focusResult
              .activeGalaxyIndex,
        });

      this.externalFocusDecisionSignal
        .set(
          ExternalGalaxyFocusChoice
            .FOCUS_DETECTED,
        );

      this.externalFocusMessageSignal
        .set(
          'La galaxia detectada define ahora el foco de exploración. La galaxia anterior queda disponible en el historial persistido de 11.6.',
        );
    } catch (
      error
    ) {
      if (
        focusId !==
        this.externalFocusSequence
      ) {
        return;
      }

      this.externalFocusErrorSignal
        .set(
          error instanceof Error &&
          error.message
            .trim()
            .length >
            0
            ? error.message
            : 'No se pudo cambiar el foco a la galaxia detectada.',
        );
    } finally {
      if (
        focusId ===
        this.externalFocusSequence
      ) {
        this.externalFocusPendingSignal
          .set(
            false,
          );
      }
    }
  }

  async scanSelectedSector():
    Promise<void> {

    const selection =
      this.selectedSector();

    if (
      selection ===
        null ||
      !this.selectedSectorFromMap()
    ) {
      this.scanErrorSignal
        .set(
          'Selecciona primero un sector desde el Mapa galáctico.',
        );

      return;
    }

    if (
      this.selectedSectorExplored()
    ) {
      this.scanErrorSignal
        .set(
          'El sector seleccionado ya está explorado. Selecciona un sector no explorado desde el Mapa galáctico.',
        );

      return;
    }

    await this.scanSector(
      selection
        .sectorX
        .toString(),
      selection
        .sectorY
        .toString(),
    );
  }

  async scanSector(
    sectorXInput:
      string,

    sectorYInput:
      string,
  ): Promise<void> {

    const scanId =
      ++this.scanSequence;

    this.scanResultSignal
      .set(null);

    this.explorationResultSignal
      .set(null);

    this.progressResultSignal
      .set(null);

    this.scanErrorSignal
      .set('');

    this.progressErrorSignal
      .set('');

    this.progressPendingSignal
      .set(false);

    try {
      const entry =
        this.entry();

      const referenceSector =
        this.selectedSector();

      if (
        entry ===
        null ||
        referenceSector ===
        null
      ) {
        throw new Error(
          'No hay un contexto de exploración activo.',
        );
      }

      const sectorX =
        parseIntegerCoordinate(
          sectorXInput,
          'X',
        );

      const sectorY =
        parseIntegerCoordinate(
          sectorYInput,
          'Y',
        );

      assertWithinGrid(
        sectorX,
        referenceSector
          .minCoordinate,
        referenceSector
          .maxCoordinate,
      );

      assertWithinGrid(
        sectorY,
        referenceSector
          .minCoordinate,
        referenceSector
          .maxCoordinate,
      );

      const selection =
        ExplorationSectorScanEngine
          .prepareSector(
            entry.generationKey,
            entry.activeGalaxyIndex,
            sectorX,
            sectorY,
          );

      const scanResult =
        ExplorationSectorScanEngine
          .scan(
            selection,
          );

      const explorationResult =
        ExplorationSectorResultEngine
          .resolve(
            scanResult,
          );

      this.selectedSectorSignal
        .set(
          selection,
        );

      this.scanResultSignal
        .set(
          scanResult,
        );

      this.explorationResultSignal
        .set(
          explorationResult,
        );

      this.progressPendingSignal
        .set(true);

      try {
        const progress =
          await this.progressRuntime
            .commitResolvedResult(
              explorationResult,
            );

        if (
          scanId !==
          this.scanSequence
        ) {
          return;
        }

        this.progressResultSignal
          .set(
            progress,
          );

        this.selectedSectorExploredSignal
          .set(
            true,
          );

        try {
          const status =
            await this
              .externalGalaxySearchRuntime
              .getStatus(
                entry
                  .generationKey,
              );

          if (
            scanId ===
            this.scanSequence
          ) {
            await this
              .publishExternalSearchStatus(
                status,
                entry.generationKey,
              );
          }
        } catch (
          error
        ) {
          if (
            scanId ===
            this.scanSequence
          ) {
            this.externalSearchErrorSignal
              .set(
                error instanceof Error &&
                error.message
                  .trim()
                  .length >
                  0
                  ? error.message
                  : 'El progreso se guardó, pero no se pudo actualizar la probabilidad extragaláctica.',
              );
          }
        }
      } catch (
        error
      ) {
        if (
          scanId !==
          this.scanSequence
        ) {
          return;
        }

        this.progressErrorSignal
          .set(
            error instanceof Error &&
            error.message
              .trim()
              .length >
              0
              ? error.message
              : 'El resultado se resolvió, pero no se pudo guardar su progreso.',
          );
      } finally {
        if (
          scanId ===
          this.scanSequence
        ) {
          this.progressPendingSignal
            .set(false);
        }
      }
    } catch (
      error
    ) {
      if (
        scanId !==
        this.scanSequence
      ) {
        return;
      }

      this.scanErrorSignal
        .set(
          error instanceof Error &&
          error.message
            .trim()
            .length >
            0
            ? error.message
            : 'No se pudo ejecutar el escaneo del sector.',
        );
    }
  }

  private async publishExternalSearchStatus(
    status:
      ExternalGalaxySearchStatus,

    generationKey:
      UniverseGenerationKey,
  ): Promise<void> {

    this.externalSearchStatusSignal
      .set(
        status,
      );

    if (
      status
        .unannouncedSearchOpportunities <=
      0n
    ) {
      return;
    }

    this.externalSearchOpportunityNotificationSignal
      .set(
        Object.freeze({
          newlyUnlockedSearchOpportunities:
            status
              .unannouncedSearchOpportunities,

          availableSearchOpportunities:
            status
              .availableSearchOpportunities,
        }),
      );

    try {
      await this
        .externalGalaxySearchRuntime
        .acknowledgeOpportunityNotifications(
          generationKey,
        );
    } catch {
      /*
       * Notification acknowledgement is presentation-only state. The search
       * opportunity itself is already persisted independently, so an
       * acknowledgement failure must never revoke or consume an attempt.
       */
    }
  }

  private resetOperationalFlow():
    void {

    this.selectedSectorSignal
      .set(null);

    this.selectedSectorFromMapSignal
      .set(false);

    this.selectedSectorExploredSignal
      .set(false);

    this.scanResultSignal
      .set(null);

    this.explorationResultSignal
      .set(null);

    this.progressResultSignal
      .set(null);

    this.progressPendingSignal
      .set(false);

    this.scanErrorSignal
      .set('');

    this.progressErrorSignal
      .set('');
  }

  private resetExternalTransientFlow():
    void {

    this.externalSearchStatusSignal
      .set(
        null,
      );

    this.externalSearchOpportunityNotificationSignal
      .set(
        null,
      );

    this.externalSearchResultSignal
      .set(
        null,
      );

    this.externalSearchPendingSignal
      .set(
        false,
      );

    this.externalSearchErrorSignal
      .set(
        '',
      );

    this.externalFocusDecisionSignal
      .set(
        null,
      );

    this.externalFocusPendingSignal
      .set(
        false,
      );

    this.externalFocusMessageSignal
      .set(
        '',
      );

    this.externalFocusErrorSignal
      .set(
        '',
      );
  }
}

function parseIntegerCoordinate(
  input:
    string,

  axis:
    'X' |
    'Y',
): number {

  const normalized =
    input.trim();

  if (
    !/^-?\d+$/.test(
      normalized,
    )
  ) {
    throw new RangeError(
      `La coordenada ${axis} debe ser un número entero.`,
    );
  }

  const value =
    Number(
      normalized,
    );

  if (
    !Number.isSafeInteger(
      value,
    )
  ) {
    throw new RangeError(
      `La coordenada ${axis} debe ser un número entero seguro.`,
    );
  }

  return value;
}

function assertWithinGrid(
  coordinate:
    number,

  minCoordinate:
    number,

  maxCoordinate:
    number,
): void {

  if (
    coordinate <
      minCoordinate ||
    coordinate >
      maxCoordinate
  ) {
    throw new RangeError(
      `Rango permitido: ${minCoordinate}..${maxCoordinate}.`,
    );
  }
}
