import {
  computed,
  inject,
  Injectable,
  signal,
} from '@angular/core';

import {
  type KnownDiscovery,
} from '../../domain/discovery/known-discovery';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  GalacticObjectLocator,
  GalaxyLocator,
  SectorLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type GalaxySectorGrid,
} from '../../domain/sector/galaxy-sector-grid';

import {
  type Galaxy,
} from '../../domain/universe/galaxy';

import {
  ExplorationSectorResultEngine,
} from '../../simulation/exploration/exploration-sector-result-engine';

import {
  ExternalGalaxyPreliminaryInformationGenerator,
} from '../../simulation/observation/galaxy/external-galaxy-preliminary-information-generator';

import {
  GalaxySectorGridGenerator,
} from '../../simulation/sector/galaxy-sector-grid-generator';

import {
  GalaxySectorObjectLocationResolver,
} from '../../simulation/sector/galaxy-sector-object-location-resolver';

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
  GalacticMapDiscoveryMarker,
  GalacticMapDiscoveryMarkers,
} from './galactic-map-discovery-markers';

import {
  buildGalacticMapEnvironmentalLayers,
  type GalacticMapEnvironmentalLayers,
} from './galactic-map-environmental-layers';

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
 * Point-10.5 read-only application facade for the galactic map.
 *
 * A discovered galaxy reads one persisted KnownDiscovery snapshot and reuses
 * it for both point-10.3 sector coverage and point-10.4/10.5 object markers.
 * Point 10.5 additionally builds deterministic region/GHZ map metadata from
 * already-existing V1 environmental generators without enumerating the full
 * 2D grid or persisting any new map state.
 *
 * Marker families reuse the exact frozen point-9.4 operational taxonomy:
 * SYSTEM, NEBULA, STAR_CLUSTER and EXTREME_OBJECT. This taxonomy remains
 * separate from formal scientific classification.
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

      let explorationCoverage:
        GalacticMapExplorationCoverage | null =
        null;

      let discoveryMarkers:
        GalacticMapDiscoveryMarkers | null =
        null;

      let environmentalLayers:
        GalacticMapEnvironmentalLayers | null =
        null;

      if (
        detailedGalaxy !==
          null &&
        visualStructure !==
          null
      ) {
        const grid =
          GalaxySectorGridGenerator
            .generate(
              detailedGalaxy,
            );

        const knownDiscoveries =
          await this
            .repositories
            .discoveryRepository
            .getKnownDiscoveries(
              generationKey,
            );

        explorationCoverage =
          this.prepareExplorationCoverage(
            generationKey,
            detailedGalaxy,
            grid,
            knownDiscoveries,
          );

        discoveryMarkers =
          this.prepareDiscoveryMarkers(
            generationKey,
            detailedGalaxy,
            grid,
            knownDiscoveries,
          );

        environmentalLayers =
          buildGalacticMapEnvironmentalLayers(
            detailedGalaxy,
            grid,
            visualStructure,
          );
      }

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
              discoveryMarkers,
              environmentalLayers,
              detailedGalaxy
                ?.designation
                .name ??
                null,
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

  private prepareExplorationCoverage(
    generationKey:
      UniverseGenerationKey,

    galaxy:
      Galaxy,

    grid:
      GalaxySectorGrid,

    knownDiscoveries:
      readonly KnownDiscovery[],
  ): GalacticMapExplorationCoverage {

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

  private prepareDiscoveryMarkers(
    generationKey:
      UniverseGenerationKey,

    galaxy:
      Galaxy,

    grid:
      GalaxySectorGrid,

    knownDiscoveries:
      readonly KnownDiscovery[],
  ): GalacticMapDiscoveryMarkers {

    const markers:
      GalacticMapDiscoveryMarker[] =
      [];

    for (
      const discovery
      of knownDiscoveries
    ) {
      const locator =
        discovery
          .locator;

      if (
        locator.galaxyIndex !==
        galaxy.index
      ) {
        continue;
      }

      if (
        locator instanceof
        SystemLocator
      ) {
        const location =
          GalaxySectorObjectLocationResolver
            .resolve(
              generationKey,
              locator,
            );

        markers.push(
          new GalacticMapDiscoveryMarker(
            locator,
            ExplorationResultKind.SYSTEM,
            discovery.state,
            location.sectorCoordinates,
            location.normalizedX,
            location.normalizedY,
          ),
        );

        continue;
      }

      if (
        locator instanceof
        GalacticObjectLocator
      ) {
        const location =
          GalaxySectorObjectLocationResolver
            .resolve(
              generationKey,
              locator,
            );

        markers.push(
          new GalacticMapDiscoveryMarker(
            locator,
            ExplorationSectorResultEngine
              .resolveGalacticObjectKind(
                generationKey,
                locator,
              ),
            discovery.state,
            location.sectorCoordinates,
            location.normalizedX,
            location.normalizedY,
          ),
        );
      }
    }

    return new GalacticMapDiscoveryMarkers(
      generationKey,
      galaxy.index,
      grid,
      markers,
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
