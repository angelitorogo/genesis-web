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
  GalaxyLocator,
  SectorLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type Galaxy,
} from '../../domain/universe/galaxy';

import {
  ExternalGalaxyPreliminaryInformationGenerator,
} from '../../simulation/observation/galaxy/external-galaxy-preliminary-information-generator';

import {
  GalaxySectorGridGenerator,
} from '../../simulation/sector/galaxy-sector-grid-generator';

import {
  GalaxyGenerator,
} from '../../simulation/universe/galaxy-generator';

import {
  GalaxyVisualStructureGenerator,
} from '../../simulation/universe/galaxy-visual-structure-generator';

import {
  GENESIS_LOCAL_REPOSITORIES,
} from '../runtime/genesis-local-repositories';

import {
  UniverseSeedFacade,
} from '../universe/universe-seed.facade';

import {
  GalacticMapExplorationCoverage,
} from './galactic-map-exploration-coverage';

import {
  GalacticMapModel,
} from './galactic-map-model';

import {
  INITIAL_GALACTIC_MAP_UI_STATE,
  type GalacticMapUiState,
} from './galactic-map-ui-state';

/**
 * Point-10.3 read-only application facade for the galactic map.
 *
 * Besides the already-approved galaxy scene, it reads the persisted known
 * discovery snapshot once and extracts only SectorLocator entries belonging
 * to the active galaxy. Those locators become binary explored/unexplored map
 * coverage. It never generates sector content, reads PD or performs writes.
 */
@Injectable({
  providedIn:
    'root',
})
export class GalacticMapFacade {

  private readonly repositories =
    inject(
      GENESIS_LOCAL_REPOSITORIES,
    );

  private readonly universeSeedFacade =
    inject(
      UniverseSeedFacade,
    );

  private readonly stateSignal =
    signal<GalacticMapUiState>(
      INITIAL_GALACTIC_MAP_UI_STATE,
    );

  private refreshSequence =
    0;

  readonly state =
    this
      .stateSignal
      .asReadonly();

  readonly model =
    computed<GalacticMapModel | null>(
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

      const navigation =
        await this
          .repositories
          .navigationRepository
          .getNavigation(
            generationKey,
          );

      const galaxyIndex =
        navigation
          .activeGalaxyIndex;

      const knowledgeState =
        await this
          .repositories
          .discoveryRepository
          .getState(
            generationKey,
            new GalaxyLocator(
              galaxyIndex,
            ),
          );

      if (
        refreshId !==
        this.refreshSequence
      ) {
        return;
      }

      if (
        !DiscoveryState.isKnown(
          knowledgeState,
        )
      ) {
        throw new RangeError(
          'The active galaxy must already be known before opening the galactic map.',
        );
      }

      const preliminaryInformation =
        ExternalGalaxyPreliminaryInformationGenerator
          .generate(
            generationKey,
            galaxyIndex,
            knowledgeState,
          );

      const detailedGalaxy =
        knowledgeState.code >=
        DiscoveryState
          .DISCOVERED
          .code
          ? GalaxyGenerator
              .generate(
                generationKey,
                galaxyIndex,
              )
          : null;

      const visualStructure =
        detailedGalaxy ===
          null
          ? null
          : GalaxyVisualStructureGenerator
              .generate(
                detailedGalaxy,
              );

      const explorationCoverage =
        detailedGalaxy ===
          null
          ? null
          : await this
              .prepareExplorationCoverage(
                generationKey,
                detailedGalaxy,
              );

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
            'content',

          model:
            new GalacticMapModel(
              generationKey,
              galaxyIndex,
              preliminaryInformation,
              visualStructure,
              detailedGalaxy
                ?.type ??
                null,
              explorationCoverage,
            ),
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
              : 'No se pudo preparar el mapa galáctico.',
        });
    }
  }

  private async prepareExplorationCoverage(
    generationKey:
      UniverseGenerationKey,

    galaxy:
      Galaxy,
  ): Promise<GalacticMapExplorationCoverage> {

    const grid =
      GalaxySectorGridGenerator
        .generate(
          galaxy,
        );

    const knownDiscoveries =
      await this
        .repositories
        .discoveryRepository
        .getKnownDiscoveries(
          generationKey,
        );

    const exploredSectors =
      knownDiscoveries
        .filter(
          (
            discovery,
          ) =>
            discovery
              .locator instanceof
              SectorLocator &&
            discovery
              .locator
              .galaxyIndex ===
              galaxy.index,
        )
        .map(
          (
            discovery,
          ) => {
            const locator =
              discovery
                .locator as
                SectorLocator;

            return grid
              .coordinatesFor(
                locator
                  .sectorKey,
              );
          },
        );

    return new GalacticMapExplorationCoverage(
      generationKey,
      galaxy.index,
      grid,
      exploredSectors,
    );
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
