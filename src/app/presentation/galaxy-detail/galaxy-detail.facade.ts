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
  type GalaxyGeneralProfile,
} from '../../domain/exploration/galaxy-general-profile';

import {
  type GalaxyKnowledgeStatistics,
} from '../../domain/exploration/galaxy-knowledge-statistics';

import {
  GalaxyLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxyGeneralProfileEngine,
} from '../../simulation/exploration/galaxy-general-profile-engine';

import {
  GalaxyKnowledgeStatisticsEngine,
} from '../../simulation/exploration/galaxy-knowledge-statistics-engine';

import {
  GALAXY_FOCUS_RUNTIME,
} from '../runtime/galaxy-focus.runtime';

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

  readonly isCurrentFocus:
    boolean;

  readonly isVisitable:
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
 * Point-11.5 galaxy-detail facade.
 *
 * Loading remains knowledge-safe exactly as in 11.3/11.4: a requested
 * GalaxyLocator must already exist at DETECTED or later and statistics are
 * derived only from persisted KnownDiscovery rows.
 *
 * 11.5 adds one explicit mutation: a non-current known galaxy can become the
 * exploration focus through GALAXY_FOCUS_RUNTIME. That runtime atomically
 * persists activeGalaxyIndex and promotes the target to at least VISITED.
 *
 * The facade still does not read/write Discovery Points, materialize hidden
 * procedural content, expose fictitious completion percentages, implement a
 * "return to previous galaxy" flow (11.6) or model/animate physical FTL travel
 * (11.7).
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

  private loadSequence =
    0;

  private focusSequence =
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

      const knownDiscoveries =
        await this
          .repositories
          .discoveryRepository
          .getKnownDiscoveries(
            generationKey,
          );

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

      const isCurrentFocus =
        navigation
          .activeGalaxyIndex ===
        galaxyIndex;

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
              isCurrentFocus,

              isVisitable:
                !isCurrentFocus,

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
              : 'No se pudo cargar la ficha general de galaxia.',
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

    if (
      !model
        .isVisitable
    ) {
      this
        .focusErrorSignal
        .set(
          'Esta galaxia ya es el foco de exploración.',
        );

      return;
    }

    this
      .focusPendingSignal
      .set(
        true,
      );

    try {
      const result =
        await this
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

      this
        .focusSuccessSignal
        .set(
          result
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
