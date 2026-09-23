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
  type ExplorationSectorProgressResult,
} from '../../domain/exploration/exploration-sector-progress-result';

import {
  type ExplorationSectorResult,
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
  ExplorationSectorScanEngine,
} from '../../simulation/exploration/exploration-sector-scan-engine';

import {
  GalaxyOperationalAccessPolicy,
} from '../../simulation/exploration/galaxy-operational-access-policy';

import {
  GalaxyKnownNameResolver,
} from '../../simulation/exploration/galaxy-known-name-resolver';

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
  EXPLORATION_SECTOR_PROGRESS_RUNTIME,
} from '../runtime/exploration-sector-progress.runtime';

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

import {
  type GalacticMapSectorSelection,
} from './galactic-map-sector-selection';
import { planGalacticMapSectorBlock } from './galactic-map-sector-block';
import { CODES_REDEMPTION_RUNTIME } from '../codes/codes-redemption.runtime';

/**
 * Galactic-map application facade. Read-side map assembly remains the frozen
 * point-10.3..10.9 contract; explicit user exploration now executes the frozen
 * point-9.5 sector workflow inline without navigating away from /galaxy-map.
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
export interface GalacticMapBlockProgress {
  readonly size: number;
  readonly total: number;
  readonly skipped: number;
  readonly processed: number;
  readonly awarded: number;
}

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

  private readonly codes = inject(CODES_REDEMPTION_RUNTIME);

  private readonly blockProgressSignal = signal<GalacticMapBlockProgress | null>(null);
  readonly blockProgress = this.blockProgressSignal.asReadonly();

  private readonly explorationProgressRuntime =
    inject(
      EXPLORATION_SECTOR_PROGRESS_RUNTIME,
    );

  private readonly stateSignal =
    signal<GalacticMapUiState>(
      INITIAL_GALACTIC_MAP_UI_STATE,
    );

  private readonly inlineExplorationResultSignal =
    signal<ExplorationSectorResult | null>(
      null,
    );

  private readonly inlineExplorationProgressSignal =
    signal<ExplorationSectorProgressResult | null>(
      null,
    );

  private readonly inlineExplorationPendingSignal =
    signal<boolean>(
      false,
    );

  private readonly inlineExplorationErrorSignal =
    signal<string>(
      '',
    );

  private refreshSequence =
    0;

  private inlineExplorationSequence =
    0;

  readonly state =
    this
      .stateSignal
      .asReadonly();

  readonly inlineExplorationResult =
    this
      .inlineExplorationResultSignal
      .asReadonly();

  readonly inlineExplorationProgress =
    this
      .inlineExplorationProgressSignal
      .asReadonly();

  readonly inlineExplorationPending =
    this
      .inlineExplorationPendingSignal
      .asReadonly();

  readonly inlineExplorationErrorMessage =
    this
      .inlineExplorationErrorSignal
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

  async refresh(
    preserveCurrentContent =
      false,
  ):
    Promise<void> {

    const refreshId =
      ++this
        .refreshSequence;

    if (
      !preserveCurrentContent ||
      this.state().kind !==
        'content'
    ) {
      this
        .stateSignal
        .set({
          kind:
            'loading',
        });
    }

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
        this.universeSeedFacade.resolvePersistedUniverse(universes);

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

      const operationalAccess =
        GalaxyOperationalAccessPolicy
          .evaluate(
            galaxyIndex,
            knowledgeState,
          );

      const detailedGalaxy =
        operationalAccess
          .canOpenGalacticMap
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

      if (!this.universeSeedFacade.activeGenerationKey().equals(generationKey)) {
        this.universeSeedFacade.activatePersistedUniverse(generationKey);
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
              GalaxyKnownNameResolver
                .resolve(
                  generationKey,
                  galaxyIndex,
                  knowledgeState,
                ),
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

  async exploreSector(
    selection:
      GalacticMapSectorSelection,
  ): Promise<void> {

    if (this.inlineExplorationPending()) return;
    this.blockProgressSignal.set(null);

    const explorationId =
      ++this
        .inlineExplorationSequence;

    this
      .inlineExplorationResultSignal
      .set(null);

    this
      .inlineExplorationProgressSignal
      .set(null);

    this
      .inlineExplorationErrorSignal
      .set('');

    const model =
      this.model();

    if (
      model ===
        null
    ) {
      this
        .inlineExplorationErrorSignal
        .set(
          'No hay un mapa galáctico activo desde el que explorar el sector.',
        );

      return;
    }

    if (
      !model
        .canExploreSectors
    ) {
      this
        .inlineExplorationErrorSignal
        .set(
          'La exploración de sectores se habilita al confirmar la galaxia. En estado Catalogada el mapa es solo de consulta.',
        );

      return;
    }

    if (
      selection.explored
    ) {
      this
        .inlineExplorationErrorSignal
        .set(
          'El sector seleccionado ya está explorado. Selecciona otro sector del mapa.',
        );

      return;
    }

    this
      .inlineExplorationPendingSignal
      .set(true);

    try {
      const preparedSelection =
        ExplorationSectorScanEngine
          .prepareSector(
            model.generationKey,
            model.galaxyIndex,
            selection.coordinates.x,
            selection.coordinates.y,
          );

      if (
        preparedSelection
          .sectorLocator
          .sectorKey !==
        selection.sectorKey
      ) {
        throw new RangeError(
          'La selección cartográfica no coincide con la identidad determinista del sector.',
        );
      }

      const scanResult =
        ExplorationSectorScanEngine
          .scan(
            preparedSelection,
          );

      const explorationResult =
        ExplorationSectorResultEngine
          .resolve(
            scanResult,
          );

      this
        .inlineExplorationResultSignal
        .set(
          explorationResult,
        );

      const progress =
        await this
          .explorationProgressRuntime
          .commitResolvedResult(
            explorationResult,
          );

      if (
        explorationId !==
        this.inlineExplorationSequence
      ) {
        return;
      }

      this
        .inlineExplorationProgressSignal
        .set(
          progress,
        );

      /*
       * Refresh coverage/markers while the existing scene stays mounted.
       * GalacticMapScene re-renders the new model through the same runtime, so
       * camera, zoom, orientation and galaxy spin remain where the player left
       * them instead of forcing a round-trip through /exploration.
       */
      await this.refresh(
        true,
      );
    } catch (
      error
    ) {
      if (
        explorationId !==
        this.inlineExplorationSequence
      ) {
        return;
      }

      this
        .inlineExplorationErrorSignal
        .set(
          error instanceof Error &&
          error.message
            .trim()
            .length >
            0
            ? error.message
            : 'No se pudo completar la exploración del sector.',
        );
    } finally {
      if (
        explorationId ===
        this.inlineExplorationSequence
      ) {
        this
          .inlineExplorationPendingSignal
          .set(false);
      }
    }
  }

  /** Sequentially commits canonical 9.3 → 9.4 → 9.5 scans; every sector is atomic.
   * A failure leaves already committed sectors visible, with no false all-or-nothing claim.
   */
  async exploreBlock(selection: GalacticMapSectorSelection, size: number): Promise<void> {
    if (size === 1) return this.exploreSector(selection);
    if (this.inlineExplorationPending()) return;
    const explorationId = ++this.inlineExplorationSequence;
    this.inlineExplorationResultSignal.set(null);
    this.inlineExplorationProgressSignal.set(null);
    this.inlineExplorationErrorSignal.set('');
    this.blockProgressSignal.set(null);
    const model = this.model();
    if (model === null || model.explorationCoverage === null) {
      this.inlineExplorationErrorSignal.set('No hay una galaxia descubierta activa para explorar.');
      return;
    }
    if (!model.canExploreSectors) {
      this.inlineExplorationErrorSignal.set(
        'La exploración de sectores se habilita al confirmar la galaxia. En estado Catalogada el mapa es solo de consulta.',
      );
      return;
    }
    this.inlineExplorationPendingSignal.set(true);
    let committed = 0;
    let awarded = 0;
    try {
      // A forged UI value never grants a non-redeemed upgrade.
      const unlocked = await this.codes.getMaxSectorBlockSize(model.generationKey);
      if (model.generationKey.generatorVersionCode !== 2 || size > unlocked) {
        throw new Error('Este tamaño de exploración no está desbloqueado para el universo V2 activo.');
      }
      const coverage = model.explorationCoverage;
      const plan = planGalacticMapSectorBlock(
        coverage.grid, selection, size, coverage.exploredSectors,
      );
      this.blockProgressSignal.set({ size, total: plan.total, skipped: plan.skipped, processed: 0, awarded: 0 });
      for (const coordinates of plan.pending) {
        // Prevent applying the remainder to an unrelated active galaxy/universe.
        const current = this.model();
        if (current === null || !current.generationKey.equals(model.generationKey) ||
            current.galaxyIndex !== model.galaxyIndex) {
          throw new Error('Ha cambiado el universo activo. El bloque se ha detenido.');
        }
        const prepared = ExplorationSectorScanEngine.prepareSector(
          model.generationKey, model.galaxyIndex, coordinates.x, coordinates.y,
        );
        const result = ExplorationSectorResultEngine.resolve(
          ExplorationSectorScanEngine.scan(prepared),
        );
        // Existing runtime owns one transaction per sector and suppresses duplicate rewards.
        const progress = await this.explorationProgressRuntime.commitResolvedResult(result);
        committed++;
        awarded += progress.awardedDiscoveryPoints;
        this.blockProgressSignal.set({
          size, total: plan.total, skipped: plan.skipped,
          processed: committed, awarded,
        });
      }
    } catch (error) {
      this.inlineExplorationErrorSignal.set(
        `${error instanceof Error ? error.message : 'No se pudo explorar el bloque.'} ` +
        `Sectores registrados antes del error: ${committed}.`,
      );
    } finally {
      if (committed > 0 && explorationId === this.inlineExplorationSequence) {
        // One refresh only, after the serial batch: no repeated Three.js scene recreation.
        await this.refresh(true);
      }
      if (explorationId === this.inlineExplorationSequence) {
        this.inlineExplorationPendingSignal.set(false);
      }
    }
  }

  clearInlineExploration():
    void {

    if (
      this.inlineExplorationPending()
    ) {
      return;
    }

    ++this
      .inlineExplorationSequence;

    this.blockProgressSignal.set(null);

    this
      .inlineExplorationResultSignal
      .set(null);

    this
      .inlineExplorationProgressSignal
      .set(null);

    this
      .inlineExplorationErrorSignal
      .set('');
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
