import {
  computed,
  inject,
  Injectable,
  signal,
} from '@angular/core';

import {
  type GalaxyArchiveSnapshot,
} from '../../domain/exploration/galaxy-archive';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxyArchiveEngine,
} from '../../simulation/exploration/galaxy-archive-engine';

import {
  GENESIS_LOCAL_REPOSITORIES,
} from '../runtime/genesis-local-repositories';

import {
  UniverseSeedFacade,
} from '../universe/universe-seed.facade';

export type DiscoveredGalaxiesUiState =
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
        'error';

      message:
        string;
    }>
  | Readonly<{
      kind:
        'content';

      snapshot:
        GalaxyArchiveSnapshot;
    }>;

const INITIAL_STATE:
  DiscoveredGalaxiesUiState =
  Object.freeze({
    kind:
      'loading',
  });

/**
 * Read-only point-11.1 facade for the discovered-galaxy catalogue.
 *
 * The catalogue itself already belongs to the frozen point-7.8 simulation
 * contract. This facade only resolves the active universe, reads persisted
 * navigation + known discoveries and delegates membership/order/preliminary
 * information to GalaxyArchiveEngine.
 *
 * Point 11.1 performs no DiscoveryState writes, no navigation writes, no PD
 * reads and no Ground Truth materialization beyond the preliminary observation
 * already permitted by the point-7.6/7.8 contract.
 */
@Injectable({
  providedIn:
    'root',
})
export class DiscoveredGalaxiesFacade {

  private readonly repositories =
    inject(
      GENESIS_LOCAL_REPOSITORIES,
    );

  private readonly universeSeedFacade =
    inject(
      UniverseSeedFacade,
    );

  private readonly stateSignal =
    signal<DiscoveredGalaxiesUiState>(
      INITIAL_STATE,
    );

  private refreshSequence =
    0;

  readonly state =
    this
      .stateSignal
      .asReadonly();

  readonly snapshot =
    computed<GalaxyArchiveSnapshot | null>(
      () => {
        const state =
          this.state();

        return state.kind ===
          'content'
          ? state.snapshot
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
      ++this.refreshSequence;

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

      const [
        navigation,
        knownDiscoveries,
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
            .getKnownDiscoveries(
              generationKey,
            ),
        ]);

      if (
        refreshId !==
        this.refreshSequence
      ) {
        return;
      }

      const snapshot =
        GalaxyArchiveEngine
          .buildArchive(
            generationKey,
            navigation
              .activeGalaxyIndex,
            knownDiscoveries,
          );

      this
        .stateSignal
        .set({
          kind:
            'content',

          snapshot,
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
              : 'No se pudo cargar el catálogo de galaxias descubiertas.',
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
