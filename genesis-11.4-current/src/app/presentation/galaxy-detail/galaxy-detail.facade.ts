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
  GalaxyLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxyGeneralProfileEngine,
} from '../../simulation/exploration/galaxy-general-profile-engine';

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

  readonly isCurrentFocus:
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

const INITIAL_STATE:
  GalaxyDetailUiState =
  Object.freeze({
    kind:
      'loading',
  });

/**
 * Point-11.3 read-only facade for a reloadable general galaxy record.
 *
 * The URL never creates knowledge. A requested GalaxyLocator must already be
 * persisted at DETECTED or later. The facade does not enumerate sector content,
 * read/write PD, mutate DiscoveryState or change navigation focus.
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

  private readonly universeSeedFacade =
    inject(
      UniverseSeedFacade,
    );

  private readonly stateSignal =
    signal<GalaxyDetailUiState>(
      INITIAL_STATE,
    );

  private loadSequence =
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

  async load(
    galaxyIndexValue:
      string | null,
  ): Promise<void> {

    const loadId =
      ++this
        .loadSequence;

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

      const profile =
        GalaxyGeneralProfileEngine
          .build(
            generationKey,
            galaxyIndex,
            discoveryState,
          );

      this
        .stateSignal
        .set({
          kind:
            'content',

          model:
            Object.freeze({
              profile,

              isCurrentFocus:
                navigation
                  .activeGalaxyIndex ===
                galaxyIndex,

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
