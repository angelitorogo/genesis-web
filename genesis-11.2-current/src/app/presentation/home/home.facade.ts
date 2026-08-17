import {
  computed,
  inject,
  Injectable,
  signal,
} from '@angular/core';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  UniverseSeedFacade,
} from '../universe/universe-seed.facade';

import {
  GENESIS_LOCAL_REPOSITORIES,
  type GenesisLocalRepositories,
} from '../runtime/genesis-local-repositories';

import {
  HomeDashboardAssembler,
} from './home-dashboard-assembler';

import {
  type HomeDashboardModel,
} from './home-dashboard-model';

import {
  HomeUiState,
  INITIAL_HOME_UI_STATE,
} from './home-ui-state';

/**
 * Backward-compatible point-9.1 aliases.
 *
 * Home and universe bootstrap now share the same canonical local-repository
 * bundle instead of wiring Dexie independently.
 */
export type HomeDashboardRepositories =
  GenesisLocalRepositories;

export const HOME_DASHBOARD_REPOSITORIES =
  GENESIS_LOCAL_REPOSITORIES;

@Injectable({
  providedIn:
    'root',
})
export class HomeFacade {

  private readonly repositories =
    inject(
      GENESIS_LOCAL_REPOSITORIES,
    );

  private readonly universeSeedFacade =
    inject(
      UniverseSeedFacade,
    );

  private readonly stateSignal =
    signal<HomeUiState>(
      INITIAL_HOME_UI_STATE,
    );

  private refreshSequence =
    0;

  readonly state =
    this
      .stateSignal
      .asReadonly();

  readonly title =
    computed(
      () =>
        'GENESIS',
    );

  readonly subtitle =
    computed(
      () =>
        'Centro de exploración galáctica',
    );

  readonly dashboard =
    computed<HomeDashboardModel | null>(
      () => {
        const state =
          this.state();

        return state.kind ===
          'content'
          ? state.dashboard
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

  async refresh():
    Promise<void> {

    const refreshId =
      ++this
        .refreshSequence;

    this
      .stateSignal
      .set({
        kind:
          'loading',
      });

    try {
      const universes =
        await this
          .repositories
          .universeRepository
          .getAll();

      if (
        refreshId !==
        this.refreshSequence
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

      const activeGenerationKey =
        resolveActiveGenerationKey(
          this
            .universeSeedFacade
            .activeGenerationKey(),
          universes,
        );

      if (
        activeGenerationKey ===
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

      const [
        navigation,
        discoveryPoints,
        knownDiscoveries,
      ] =
        await Promise.all([
          this
            .repositories
            .navigationRepository
            .getNavigation(
              activeGenerationKey,
            ),

          this
            .repositories
            .pointsRepository
            .getGlobalDiscoveryPoints(
              activeGenerationKey,
            ),

          this
            .repositories
            .discoveryRepository
            .getKnownDiscoveries(
              activeGenerationKey,
            ),
        ]);

      if (
        refreshId !==
        this.refreshSequence
      ) {
        return;
      }

      const dashboard =
        HomeDashboardAssembler
          .assemble(
            activeGenerationKey,
            navigation
              .activeGalaxyIndex,
            discoveryPoints,
            knownDiscoveries,
          );

      this
        .stateSignal
        .set({
          kind:
            'content',

          dashboard,
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
              : 'No se pudo cargar el estado de exploración.',
        });
    }
  }
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
