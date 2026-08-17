import {
  computed,
  inject,
  Injectable,
  signal,
} from '@angular/core';

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
  ExplorationSectorResultEngine,
} from '../../simulation/exploration/exploration-sector-result-engine';

import {
  ExplorationSectorScanEngine,
} from '../../simulation/exploration/exploration-sector-scan-engine';

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
 * Point-9.5 exploration facade.
 *
 * 9.3 and 9.4 remain pure deterministic read/resolve stages. Once 9.4 has
 * produced the resolved result, 9.5 commits only observed knowledge:
 * - the scanned sector reaches at least DETECTED;
 * - a static result locator reaches at least DETECTED;
 * - transient events do not invent a locator or persistent event row;
 * - global PD and derived local galaxy progress are exposed after one atomic
 *   persistence operation.
 */
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

  private refreshSequence =
    0;

  private scanSequence =
    0;

  readonly state =
    this.stateSignal
      .asReadonly();

  readonly selectedSector =
    this.selectedSectorSignal
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

  async refresh():
    Promise<void> {

    const refreshId =
      ++this.refreshSequence;

    ++this.scanSequence;

    this.resetOperationalFlow();

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

      this.selectedSectorSignal
        .set(
          centralSector,
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

  private resetOperationalFlow():
    void {

    this.selectedSectorSignal
      .set(null);

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
