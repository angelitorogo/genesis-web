import {
  computed,
  inject,
  Injectable,
  signal,
} from '@angular/core';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  type GalaxyExplorationTelemetry,
} from '../../domain/exploration/galaxy-exploration-telemetry';

import {
  type GalaxyGeneralProfile,
} from '../../domain/exploration/galaxy-general-profile';

import {
  type GalaxyKnowledgeStatistics,
} from '../../domain/exploration/galaxy-knowledge-statistics';

import {
  type GalaxyScientificProfile,
} from '../../domain/exploration/galaxy-scientific-profile';

import {
  GalaxyLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxyExplorationTelemetryEngine,
} from '../../simulation/exploration/galaxy-exploration-telemetry-engine';

import {
  GalaxyGeneralProfileEngine,
} from '../../simulation/exploration/galaxy-general-profile-engine';

import {
  GalaxyKnowledgeStatisticsEngine,
} from '../../simulation/exploration/galaxy-knowledge-statistics-engine';

import {
  GalaxyScientificProfileEngine,
} from '../../simulation/exploration/galaxy-scientific-profile-engine';

import {
  GalaxyScientificStateTransitionAction,
  type GalaxyScientificStateTransitionActionValue,
} from '../../simulation/exploration/galaxy-scientific-state-transition-engine';

import {
  GALAXY_FOCUS_RUNTIME,
} from '../runtime/galaxy-focus.runtime';

import {
  GalaxyFocusTransitionRuntime,
} from '../runtime/galaxy-focus-transition.runtime';

import {
  GALAXY_SCIENTIFIC_KNOWLEDGE_RUNTIME,
} from '../runtime/galaxy-scientific-knowledge.runtime';

import {
  GENESIS_LOCAL_REPOSITORIES,
} from '../runtime/genesis-local-repositories';

import {
  UniverseSeedFacade,
} from '../universe/universe-seed.facade';

const SIGNED_LONG_MAX =
  (1n << 63n) -
  1n;

export interface GalaxyDetailModel {
  readonly profile:
    GalaxyGeneralProfile;

  readonly statistics:
    GalaxyKnowledgeStatistics;

  readonly explorationTelemetry:
    GalaxyExplorationTelemetry;

  readonly scientificProfile:
    GalaxyScientificProfile;

  readonly globalDiscoveryPoints:
    bigint;

  readonly isCurrentFocus:
    boolean;

  readonly isVisitable:
    boolean;

  readonly isRecentFocus:
    boolean;

  readonly isOriginGalaxy:
    boolean;
}

export type GalaxyDetailUiState =
  | Readonly<{
      kind:
        'loading';
    }>
  | Readonly<{
      kind:
        'empty';
    }>
  | Readonly<{
      kind:
        'not-found';
    }>
  | Readonly<{
      kind:
        'error';

      message:
        string;
    }>
  | Readonly<{
      kind:
        'content';

      model:
        GalaxyDetailModel;
    }>;

interface LoadedGalaxyContext {
  readonly generationKey:
    UniverseGenerationKey;

  readonly galaxyIndex:
    bigint;
}

const INITIAL_STATE:
  GalaxyDetailUiState =
  Object.freeze({
    kind:
      'loading',
  });

/**
 * Point-26.1 galaxy scientific-detail facade, preserving the 11.5/11.6 focus flow.
 *
 * Loading remains knowledge-safe exactly as in 11.3/11.4: a requested
 * GalaxyLocator must already exist at DETECTED or later and statistics are
 * derived only from persisted KnownDiscovery rows.
 *
 * 11.5 allows any non-current known galaxy to become the exploration focus.
 * 11.6 additionally recognizes galaxies present in recentGalaxyIndices and
 * routes that explicit action through returnToRecentGalaxy(), which validates
 * the persisted history atomically before applying the same focus transition.
 *
 * Point 26.1 adds a separate scientific projection gated by the same persisted
 * DiscoveryState: exact baseline physical magnitudes require CATALOGUED and
 * structural/nuclear details require CONFIRMED. Opening the route never upgrades
 * knowledge. Point 26.1 now reads the global PD balance only to present the
 * affordability of galaxy scientific milestones; the atomic runtime owns the
 * actual PD debit together with the DiscoveryState write. It still does not
 * model physical/FTL travel. The point-26.1 telemetry extension may expose only the
 * real phase-5 addressable sector denominator already used by the galactic map;
 * its percentage is sector coverage, never hidden-content completion.
 */
@Injectable({
  providedIn:
    'root',
})
export class GalaxyDetailFacade {

  private readonly repositories =
    inject(
      GENESIS_LOCAL_REPOSITORIES,
    );

  private readonly focusRuntime =
    inject(
      GALAXY_FOCUS_RUNTIME,
    );

  private readonly focusTransitionRuntime =
    inject(
      GalaxyFocusTransitionRuntime,
    );

  private readonly scientificKnowledgeRuntime =
    inject(
      GALAXY_SCIENTIFIC_KNOWLEDGE_RUNTIME,
    );

  private readonly universeSeedFacade =
    inject(
      UniverseSeedFacade,
    );

  private readonly stateSignal =
    signal<GalaxyDetailUiState>(
      INITIAL_STATE,
    );

  private readonly loadedContextSignal =
    signal<LoadedGalaxyContext | null>(
      null,
    );

  private readonly focusPendingSignal =
    signal<boolean>(
      false,
    );

  private readonly focusSuccessSignal =
    signal<string>(
      '',
    );

  private readonly focusErrorSignal =
    signal<string>(
      '',
    );

  private readonly scientificActionPendingSignal =
    signal<boolean>(
      false,
    );

  private readonly scientificActionSuccessSignal =
    signal<string>(
      '',
    );

  private readonly scientificActionErrorSignal =
    signal<string>(
      '',
    );

  private loadSequence =
    0;

  private focusSequence =
    0;

  private scientificActionSequence =
    0;

  readonly state =
    this
      .stateSignal
      .asReadonly();

  readonly model =
    computed<GalaxyDetailModel | null>(
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

  readonly focusPending =
    this
      .focusPendingSignal
      .asReadonly();

  readonly focusSuccessMessage =
    this
      .focusSuccessSignal
      .asReadonly();

  readonly focusErrorMessage =
    this
      .focusErrorSignal
      .asReadonly();

  readonly scientificActionPending =
    this
      .scientificActionPendingSignal
      .asReadonly();

  readonly scientificActionSuccessMessage =
    this
      .scientificActionSuccessSignal
      .asReadonly();

  readonly scientificActionErrorMessage =
    this
      .scientificActionErrorSignal
      .asReadonly();

  async load(
    galaxyIndexValue:
      string | null,
  ): Promise<void> {

    const loadId =
      ++this
        .loadSequence;

    this
      .loadedContextSignal
      .set(
        null,
      );

    this
      .focusSuccessSignal
      .set(
        '',
      );

    this
      .focusErrorSignal
      .set(
        '',
      );

    this
      .scientificActionSuccessSignal
      .set(
        '',
      );

    this
      .scientificActionErrorSignal
      .set(
        '',
      );

    this
      .stateSignal
      .set({
        kind:
          'loading',
      });

    try {
      const galaxyIndex =
        parseGalaxyIndex(
          galaxyIndexValue,
        );

      const universes =
        await this
          .repositories
          .universeRepository
          .getAll();

      if (
        loadId !==
        this.loadSequence
      ) {
        return;
      }

      if (
        universes.length ===
        0
      ) {
        this
          .stateSignal
          .set({
            kind:
              'empty',
          });

        return;
      }

      const generationKey =
        resolveActiveGenerationKey(
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
              'error',

            message:
              'No hay un universo activo seleccionado.',
          });

        return;
      }

      const locator =
        new GalaxyLocator(
          galaxyIndex,
        );

      const [
        navigation,
        discoveryState,
      ] =
        await Promise.all([
          this
            .repositories
            .navigationRepository
            .getNavigation(
              generationKey,
            ),

          this
            .repositories
            .discoveryRepository
            .getState(
              generationKey,
              locator,
            ),
        ]);

      if (
        loadId !==
        this.loadSequence
      ) {
        return;
      }

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

      const [
        knownDiscoveries,
        globalDiscoveryPoints,
      ] =
        await Promise.all([
          this
            .repositories
            .discoveryRepository
            .getKnownDiscoveries(
              generationKey,
            ),

          this
            .repositories
            .pointsRepository
            .getGlobalDiscoveryPoints(
              generationKey,
            ),
        ]);

      if (
        loadId !==
        this.loadSequence
      ) {
        return;
      }

      const persistedGalaxyRecord =
        knownDiscoveries
          .find(
            (
              discovery,
            ) =>
              discovery
                .locator instanceof
                GalaxyLocator &&
              discovery
                .locator
                .galaxyIndex ===
                galaxyIndex,
          );

      if (
        persistedGalaxyRecord ===
          undefined ||
        DiscoveryState
          .fromCode(
            persistedGalaxyRecord
              .state
              .code,
          )
          .code !==
        DiscoveryState
          .fromCode(
            discoveryState
              .code,
          )
          .code
      ) {
        throw new RangeError(
          'El estado de la galaxia no coincide con el catálogo de conocimiento persistido.',
        );
      }

      const profile =
        GalaxyGeneralProfileEngine
          .build(
            generationKey,
            galaxyIndex,
            discoveryState,
          );

      const statistics =
        GalaxyKnowledgeStatisticsEngine
          .build(
            generationKey,
            galaxyIndex,
            knownDiscoveries,
          );

      const explorationTelemetry =
        GalaxyExplorationTelemetryEngine
          .build(
            generationKey,
            galaxyIndex,
            discoveryState,
            knownDiscoveries,
          );

      const scientificProfile =
        GalaxyScientificProfileEngine
          .build(
            generationKey,
            galaxyIndex,
            discoveryState,
          );

      const isCurrentFocus =
        navigation
          .activeGalaxyIndex ===
        galaxyIndex;

      const isRecentFocus =
        !isCurrentFocus &&
        navigation
          .recentGalaxyIndices
          .includes(
            galaxyIndex,
          );

      this
        .loadedContextSignal
        .set(
          Object.freeze({
            generationKey,
            galaxyIndex,
          }),
        );

      this
        .stateSignal
        .set({
          kind:
            'content',

          model:
            Object.freeze({
              profile,
              statistics,
              explorationTelemetry,
              scientificProfile,
              globalDiscoveryPoints,
              isCurrentFocus,

              isVisitable:
                !isCurrentFocus,

              isRecentFocus,

              isOriginGalaxy:
                galaxyIndex ===
                0n,
            }),
        });
    } catch (
      error
    ) {
      if (
        loadId !==
        this.loadSequence
      ) {
        return;
      }

      this
        .stateSignal
        .set({
          kind:
            'error',

          message:
            error instanceof
              Error &&
            error.message
              .trim()
              .length >
              0
              ? error.message
              : 'No se pudo cargar la ficha científica de galaxia.',
        });
    }
  }

  async changeFocusToDisplayedGalaxy():
    Promise<void> {

    const focusId =
      ++this
        .focusSequence;

    this
      .focusSuccessSignal
      .set(
        '',
      );

    this
      .focusErrorSignal
      .set(
        '',
      );

    const context =
      this
        .loadedContextSignal();

    const model =
      this
        .model();

    if (
      context ===
        null ||
      model ===
        null
    ) {
      this
        .focusErrorSignal
        .set(
          'No hay una galaxia conocida cargada para cambiar el foco.',
        );

      return;
    }

    const scientificState =
      DiscoveryState
        .fromCode(
          model
            .scientificProfile
            .knowledgeState
            .code,
        );

    const canReaffirmCurrentDiscoveredFocus =
      model
        .isCurrentFocus &&
      scientificState ===
        DiscoveryState.DISCOVERED;

    if (
      !model
        .isVisitable &&
      !canReaffirmCurrentDiscoveredFocus
    ) {
      this
        .focusErrorSignal
        .set(
          scientificState ===
            DiscoveryState.DETECTED
            ? 'Valida primero la detección de esta galaxia antes de establecerla como foco.'
            : 'Esta galaxia ya es el foco de exploración.',
        );

      return;
    }

    this
      .focusPendingSignal
      .set(
        true,
      );

    try {
      const returningToRecentGalaxy =
        model
          .isRecentFocus;

      const result =
        returningToRecentGalaxy
          ? await this
              .focusRuntime
              .returnToRecentGalaxy(
                context
                  .generationKey,
                context
                  .galaxyIndex,
              )
          : await this
              .focusRuntime
              .changeFocus(
                context
                  .generationKey,
                context
                  .galaxyIndex,
              );

      if (
        focusId !==
        this.focusSequence
      ) {
        return;
      }

      await this
        .load(
          result
            .activeGalaxyIndex
            .toString(
              10,
            ),
        );

      if (
        focusId !==
        this.focusSequence
      ) {
        return;
      }

      const refreshed =
        this.model();

      if (
        refreshed ===
          null ||
        !refreshed
          .isCurrentFocus
      ) {
        throw new Error(
          'El foco se persistió, pero la ficha no pudo confirmar el nuevo contexto activo.',
        );
      }

      if (
        result
          .previousFocusGalaxyIndex !==
        result
          .activeGalaxyIndex
      ) {
        this
          .focusTransitionRuntime
          .presentPersistedFocusChange({
            previousFocusGalaxyIndex:
              result
                .previousFocusGalaxyIndex,

            activeGalaxyIndex:
              result
                .activeGalaxyIndex,
          });
      }

      this
        .focusSuccessSignal
        .set(
          returningToRecentGalaxy
            ? 'Regreso completado. La galaxia vuelve a ser el foco activo sin reiniciar su progreso persistido.'
            : result
                .didPromoteTargetToVisited
              ? 'Foco actualizado. La galaxia queda registrada como Visitada.'
              : 'Foco de exploración actualizado.',
        );
    } catch (
      error
    ) {
      if (
        focusId !==
        this.focusSequence
      ) {
        return;
      }

      this
        .focusErrorSignal
        .set(
          error instanceof
            Error &&
          error.message
            .trim()
            .length >
            0
            ? error.message
            : 'No se pudo cambiar el foco de exploración.',
        );
    } finally {
      if (
        focusId ===
        this.focusSequence
      ) {
        this
          .focusPendingSignal
          .set(
            false,
          );
      }
    }
  }

  async validateDisplayedGalaxyDetection():
    Promise<void> {

    await this
      .commitScientificKnowledgeTransition(
        GalaxyScientificStateTransitionAction
          .VALIDATE_DETECTION,
      );
  }

  async catalogueDisplayedGalaxy():
    Promise<void> {

    await this
      .commitScientificKnowledgeTransition(
        GalaxyScientificStateTransitionAction
          .CATALOGUE,
      );
  }

  async confirmDisplayedGalaxy():
    Promise<void> {

    await this
      .commitScientificKnowledgeTransition(
        GalaxyScientificStateTransitionAction
          .CONFIRM,
      );
  }

  private async commitScientificKnowledgeTransition(
    action:
      GalaxyScientificStateTransitionActionValue,
  ): Promise<void> {

    const actionId =
      ++this
        .scientificActionSequence;

    this
      .scientificActionSuccessSignal
      .set(
        '',
      );

    this
      .scientificActionErrorSignal
      .set(
        '',
      );

    const context =
      this
        .loadedContextSignal();

    const model =
      this
        .model();

    if (
      context ===
        null ||
      model ===
        null
    ) {
      this
        .scientificActionErrorSignal
        .set(
          'No hay una galaxia conocida cargada para ejecutar esta acción científica.',
        );

      return;
    }

    this
      .scientificActionPendingSignal
      .set(
        true,
      );

    try {
      const result =
        await this
          .scientificKnowledgeRuntime
          .commit(
            context
              .generationKey,
            context
              .galaxyIndex,
            action,
          );

      if (
        actionId !==
        this.scientificActionSequence
      ) {
        return;
      }

      await this
        .load(
          context
            .galaxyIndex
            .toString(
              10,
            ),
        );

      if (
        actionId !==
        this.scientificActionSequence
      ) {
        return;
      }

      const refreshed =
        this
          .model();

      if (
        refreshed ===
          null ||
        DiscoveryState
          .fromCode(
            refreshed
              .scientificProfile
              .knowledgeState
              .code,
          ) !==
        result
          .stateAfter
      ) {
        throw new Error(
          'El hito científico se persistió, pero la ficha no pudo confirmar el nuevo estado.',
        );
      }

      if (
        result.stateAfter ===
          DiscoveryState.CATALOGUED &&
        refreshed
          .scientificProfile
          .physicalProperties ===
          null
      ) {
        throw new Error(
          'La galaxia quedó Catalogada, pero la proyección física no se desbloqueó.',
        );
      }

      if (
        result.stateAfter ===
          DiscoveryState.CONFIRMED &&
        refreshed
          .scientificProfile
          .structure ===
          null
      ) {
        throw new Error(
          'La galaxia quedó Confirmada, pero la estructura científica no se desbloqueó.',
        );
      }

      this
        .scientificActionSuccessSignal
        .set(
          result.stateAfter ===
            DiscoveryState.DISCOVERED
            ? `Detección validada sin coste de PD. La galaxia queda Descubierta y su identidad procedural ya está disponible. Saldo global: ${result.globalDiscoveryPointsAfter} PD.`
            : result.stateAfter ===
                DiscoveryState.CATALOGUED
              ? `Catalogación completada por ${result.discoveryPointCost} PD. Saldo global: ${result.globalDiscoveryPointsAfter} PD. Las magnitudes físicas de la galaxia ya están disponibles.`
              : `Confirmación completada por ${result.discoveryPointCost} PD. Saldo global: ${result.globalDiscoveryPointsAfter} PD. La estructura y el núcleo galáctico ya están disponibles.`,
        );
    } catch (
      error
    ) {
      if (
        actionId !==
        this.scientificActionSequence
      ) {
        return;
      }

      this
        .scientificActionErrorSignal
        .set(
          error instanceof
            Error &&
          error.message
            .trim()
            .length >
            0
            ? error.message
            : 'No se pudo completar la acción científica de la galaxia.',
        );
    } finally {
      if (
        actionId ===
        this.scientificActionSequence
      ) {
        this
          .scientificActionPendingSignal
          .set(
            false,
          );
      }
    }
  }
}

function parseGalaxyIndex(
  value:
    string | null,
): bigint {

  if (
    value ===
      null ||
    !/^(0|[1-9][0-9]*)$/.test(
      value,
    )
  ) {
    throw new RangeError(
      'galaxyIndex debe ser un entero decimal no negativo.',
    );
  }

  const parsed =
    BigInt(
      value,
    );

  if (
    parsed >
    SIGNED_LONG_MAX
  ) {
    throw new RangeError(
      'galaxyIndex debe caber en un signed Long.',
    );
  }

  return parsed;
}

function resolveActiveGenerationKey(
  selectedGenerationKey:
    UniverseGenerationKey,

  persistedUniverses:
    readonly UniverseGenerationKey[],
): UniverseGenerationKey | null {

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