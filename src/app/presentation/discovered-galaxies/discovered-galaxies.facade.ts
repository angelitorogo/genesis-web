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
  GALAXY_FOCUS_RUNTIME,
} from '../runtime/galaxy-focus.runtime';

import {
  GalaxyFocusTransitionRuntime,
} from '../runtime/galaxy-focus-transition.runtime';

import {
  GENESIS_LOCAL_REPOSITORIES,
} from '../runtime/genesis-local-repositories';

import {
  UniverseSeedFacade,
} from '../universe/universe-seed.facade';

export type DiscoveredGalaxyArchiveEntry =
  GalaxyArchiveSnapshot[
    'entries'
  ][number];

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

      generationKey:
        UniverseGenerationKey;

      snapshot:
        GalaxyArchiveSnapshot;

      recentEntries:
        readonly DiscoveredGalaxyArchiveEntry[];
    }>;

const INITIAL_STATE:
  DiscoveredGalaxiesUiState =
  Object.freeze({
    kind:
      'loading',
  });

/**
 * Point-11.1..11.6 facade for the discovered-galaxy catalogue.
 *
 * Catalogue membership and observational projection remain delegated to the
 * frozen GalaxyArchiveEngine contract. Point 11.6 additionally projects the
 * persisted recentGalaxyIndices history onto already-known archive entries and
 * exposes an explicit return action through GALAXY_FOCUS_RUNTIME.
 *
 * Returning never reads or writes Discovery Points, never materializes hidden
 * Ground Truth and never invents an UNKNOWN galaxy. The runtime validates the
 * selected galaxy against the persisted recent history atomically.
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
    signal<DiscoveredGalaxiesUiState>(
      INITIAL_STATE,
    );

  private readonly returnPendingGalaxyIndexSignal =
    signal<bigint | null>(
      null,
    );

  private readonly returnSuccessSignal =
    signal<string>(
      '',
    );

  private readonly returnErrorSignal =
    signal<string>(
      '',
    );

  private refreshSequence =
    0;

  private returnSequence =
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

  readonly recentEntries =
    computed<
      readonly DiscoveredGalaxyArchiveEntry[]
    >(
      () => {
        const state =
          this.state();

        return state.kind ===
          'content'
          ? state.recentEntries
          : [];
      },
    );

  readonly returnPendingGalaxyIndex =
    this
      .returnPendingGalaxyIndexSignal
      .asReadonly();

  readonly returnSuccessMessage =
    this
      .returnSuccessSignal
      .asReadonly();

  readonly returnErrorMessage =
    this
      .returnErrorSignal
      .asReadonly();

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
      .returnSuccessSignal
      .set(
        '',
      );

    this
      .returnErrorSignal
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

      const recentEntries =
        projectRecentEntries(
          navigation
            .recentGalaxyIndices,
          snapshot,
        );

      this
        .stateSignal
        .set({
          kind:
            'content',

          generationKey,
          snapshot,
          recentEntries,
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

  isRecentGalaxy(
    galaxyIndex:
      bigint,
  ): boolean {

    return this
      .recentEntries()
      .some(
        (
          entry,
        ) =>
          entry
            .galaxyIndex ===
          galaxyIndex,
      );
  }

  async returnToRecentGalaxy(
    galaxyIndex:
      bigint,
  ): Promise<void> {

    const returnId =
      ++this
        .returnSequence;

    this
      .returnSuccessSignal
      .set(
        '',
      );

    this
      .returnErrorSignal
      .set(
        '',
      );

    const state =
      this
        .state();

    if (
      state.kind !==
        'content' ||
      !state
        .recentEntries
        .some(
          (
            entry,
          ) =>
            entry
              .galaxyIndex ===
            galaxyIndex,
        )
    ) {
      this
        .returnErrorSignal
        .set(
          'La galaxia seleccionada no pertenece al historial reciente persistido.',
        );

      return;
    }

    this
      .returnPendingGalaxyIndexSignal
      .set(
        galaxyIndex,
      );

    try {
      const generationKey =
        state
          .generationKey;

      const result =
        await this
          .focusRuntime
          .returnToRecentGalaxy(
            generationKey,
            galaxyIndex,
          );

      if (
        returnId !==
        this.returnSequence
      ) {
        return;
      }

      await this
        .refresh();

      if (
        returnId !==
        this.returnSequence
      ) {
        return;
      }

      const refreshed =
        this
          .snapshot();

      if (
        refreshed ===
          null ||
        refreshed
          .currentFocusGalaxyIndex !==
        result
          .activeGalaxyIndex
      ) {
        throw new Error(
          'El regreso se persistió, pero el catálogo no pudo confirmar el nuevo foco activo.',
        );
      }

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

      this
        .returnSuccessSignal
        .set(
          'Galaxia anterior restaurada como foco. Su progreso persistido se conserva.',
        );
    } catch (
      error
    ) {
      if (
        returnId !==
        this.returnSequence
      ) {
        return;
      }

      this
        .returnErrorSignal
        .set(
          error instanceof
            Error &&
          error.message
            .trim()
            .length >
            0
            ? error.message
            : 'No se pudo regresar a la galaxia anterior.',
        );
    } finally {
      if (
        returnId ===
        this.returnSequence
      ) {
        this
          .returnPendingGalaxyIndexSignal
          .set(
            null,
          );
      }
    }
  }
}

function projectRecentEntries(
  recentGalaxyIndices:
    readonly bigint[],

  snapshot:
    GalaxyArchiveSnapshot,
): readonly DiscoveredGalaxyArchiveEntry[] {

  const byGalaxyIndex =
    new Map<
      bigint,
      DiscoveredGalaxyArchiveEntry
    >(
      snapshot
        .entries
        .map(
          (
            entry,
          ) =>
            [
              entry.galaxyIndex,
              entry,
            ] as const,
        ),
    );

  const projected:
    DiscoveredGalaxyArchiveEntry[] =
    [];

  for (
    const galaxyIndex
    of recentGalaxyIndices
  ) {
    if (
      galaxyIndex ===
        snapshot
          .currentFocusGalaxyIndex ||
      projected
        .some(
          (
            entry,
          ) =>
            entry
              .galaxyIndex ===
            galaxyIndex,
        )
    ) {
      continue;
    }

    const entry =
      byGalaxyIndex
        .get(
          galaxyIndex,
        );

    if (
      entry ===
        undefined
    ) {
      continue;
    }

    projected.push(
      entry,
    );
  }

  return Object.freeze(
    projected,
  );
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
