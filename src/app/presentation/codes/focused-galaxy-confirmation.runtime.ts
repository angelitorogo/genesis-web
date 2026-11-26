import {
  inject,
  InjectionToken,
} from '@angular/core';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  GalaxyLocator,
  type GalacticObjectLocator,
  type SectorLocator,
  type ProceduralLocator,
  type SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxySectorCoordinates,
} from '../../domain/sector/galaxy-sector-coordinates';

import {
  type DiscoveryRepository,
  type UniverseNavigationRepository,
} from '../../domain/repository/genesis-repositories';

import {
  GalaxySectorContentGenerator,
} from '../../simulation/sector/galaxy-sector-content-generator';

import {
  GalaxySectorGridGenerator,
} from '../../simulation/sector/galaxy-sector-grid-generator';

import {
  GalaxyGenerator,
} from '../../simulation/universe/galaxy-generator';

import {
  GENESIS_LOCAL_REPOSITORIES,
} from '../runtime/genesis-local-repositories';
import { markGalaxyArchiveDirtyForBulkConfirmation38BisB6 } from
  '../../data/local/repository/genesis-knowledge-commits-38-bis-b6';
import { withBulkGalaxyConfirmationSession } from './bulk-galaxy-confirmation-session';

/**
 * Administrative QA code. It is intentionally not a reward/entitlement code:
 * it can be executed again and always targets only the currently focused galaxy.
 */
export const CONFIRM_FOCUSED_GALAXY_CODE =
  'C0DE-6A1A-C0DE-F11A';

/** IndexedDB bulkGet/bulkPut is bounded to keep transactions short. */
const TARGETS_PER_BATCH = 256;
const YIELD_EVERY_SECTORS = 16;

export interface FocusedGalaxyConfirmationSectorPlan {
  readonly sectorLocator:
    SectorLocator;

  readonly systemLocators:
    readonly SystemLocator[];

  readonly galacticObjectLocators:
    readonly GalacticObjectLocator[];
}

export interface FocusedGalaxyConfirmationPlan {
  readonly totalSectors:
    bigint;

  readonly sectors:
    Iterable<FocusedGalaxyConfirmationSectorPlan>;
}

export type FocusedGalaxyConfirmationPlanFactory = (
  generationKey:
    UniverseGenerationKey,

  galaxyIndex:
    bigint,
) => FocusedGalaxyConfirmationPlan;

export type FocusedGalaxyConfirmationResult =
  | {
      readonly kind:
        'confirmed';

      readonly galaxyIndex:
        bigint;

      readonly sectors:
        bigint;

      readonly systems:
        bigint;

      readonly galacticObjects:
        bigint;
    }
  | {
      readonly kind:
        'no-focused-galaxy';
    }
  | {
      readonly kind:
        'unsupported-version';
    };

/**
 * QA-only focused-galaxy knowledge materializer.
 *
 * It deliberately bypasses the ordinary observation campaign and rewards:
 * - no PD are granted or spent;
 * - no evidence rows are fabricated;
 * - no other galaxy is touched;
 * - only canonical procedural addresses are persisted;
 * - CONFIRMED system knowledge is the existing authoritative gate that exposes
 *   planets, moons and minor-body scientific routes. MoonLocator is not part of
 *   the discovery persistence ABI, so no parallel per-moon discovery schema is
 *   introduced here.
 */
export class FocusedGalaxyConfirmationRuntime {

  constructor(
    private readonly navigationRepository:
      UniverseNavigationRepository,

    private readonly discoveryRepository:
      DiscoveryRepository,

    private readonly planFactory:
      FocusedGalaxyConfirmationPlanFactory =
        buildProceduralFocusedGalaxyConfirmationPlan,
  ) {}

  async confirmFocusedGalaxy(
    generationKey: UniverseGenerationKey,
    reportProgress?: (completedSectors: bigint, totalSectors: bigint) => void,
  ): Promise<FocusedGalaxyConfirmationResult> {

    // The QA materializer supports public V2 and V3 addresses. V1 stays
    // protected; all writes below remain scoped to the selected universe key.
    if (
      generationKey.generatorVersion !== GeneratorVersion.V2 &&
      generationKey.generatorVersion !== GeneratorVersion.V3
    ) {
      return {
        kind:
          'unsupported-version',
      };
    }

    const navigation =
      await this
        .navigationRepository
        .getNavigation(
          generationKey,
        );

    const galaxyIndex =
      navigation
        .activeGalaxyIndex;

    const galaxyLocator =
      new GalaxyLocator(
        galaxyIndex,
      );

    const galaxyState =
      await this
        .discoveryRepository
        .getState(
          generationKey,
          galaxyLocator,
        );

    if (
      !DiscoveryState.isKnown(
        galaxyState,
      )
    ) {
      return {
        kind:
          'no-focused-galaxy',
      };
    }

    const plan =
      this.planFactory(
        generationKey,
        galaxyIndex,
      );

    reportProgress?.(0n, plan.totalSectors);
    // BULKCONF-ARCHPERF.1: index jobs must be durable BEFORE any batch
    // modifies discoveries. A crash/reload can then reconcile partial work.
    // The Archive worker is paused (also across tabs with Web Locks) while
    // science writes progress, avoiding repeated regeneration of partial data.
    const archiveEvent = {
      universeSeed: generationKey.universeSeed.serialize(),
      generatorVersionCode: generationKey.generatorVersionCode,
      galaxyIndex: galaxyIndex.toString(),
      kind: 'GALAXY' as const,
    };

    return withBulkGalaxyConfirmationSession(async () => {
      await markGalaxyArchiveDirtyForBulkConfirmation38BisB6(archiveEvent);

      let sectors = 0n;
      let systems = 0n;
      let galacticObjects = 0n;
      let sinceYield = 0;
      const batch: ProceduralLocator[] = [galaxyLocator];

      const flush = async (): Promise<void> => {
        if (batch.length === 0) return;
        if (this.discoveryRepository.confirmLocatorsBatch) {
          await this.discoveryRepository.confirmLocatorsBatch(generationKey, batch);
        } else {
          // Alternative repositories and older test doubles retain the same
          // safe semantics, albeit without Dexie's bulk-write fast path.
          for (const locator of batch) {
            const state = await this.discoveryRepository.getState(generationKey, locator);
            if (state !== DiscoveryState.CONFIRMED) {
              await this.discoveryRepository.setState(generationKey, locator, DiscoveryState.CONFIRMED);
            }
          }
        }
        batch.length = 0;
      };

      for (const sector of plan.sectors) {
        const locators: ProceduralLocator[] = [
          sector.sectorLocator,
          ...sector.systemLocators,
          ...sector.galacticObjectLocators,
        ];
        // Even an old-sector CONFIRMED state cannot be trusted as a full
        // checkpoint: legacy code could have been interrupted mid-sector.
        // Reconcile every canonical child, but write only missing states.
        for (const locator of locators) {
          if (batch.length >= TARGETS_PER_BATCH) await flush();
          batch.push(locator);
        }
        sectors += 1n;
        systems += BigInt(sector.systemLocators.length);
        galacticObjects += BigInt(sector.galacticObjectLocators.length);
        sinceYield += 1;
        if (sinceYield >= YIELD_EVERY_SECTORS) {
          sinceYield = 0;
          await flush();
          reportProgress?.(sectors, plan.totalSectors);
          await yieldToEventLoop();
        }
      }
      await flush();
      reportProgress?.(sectors, plan.totalSectors);

      if (
      sectors !==
      plan.totalSectors
      ) {
        throw new RangeError(
          `Focused-galaxy confirmation enumerated ${sectors.toString()} sectors but expected ${plan.totalSectors.toString()}.`,
        );
      }

      // A final invalidation captures the complete canonical knowledge state.
      // No per-system Archive notification is emitted during bulk writes.
      await markGalaxyArchiveDirtyForBulkConfirmation38BisB6(archiveEvent);
      return {
        kind: 'confirmed' as const,
        galaxyIndex,
        sectors,
        systems,
        galacticObjects,
      };
    });
  }
}

export const FOCUSED_GALAXY_CONFIRMATION_RUNTIME =
  new InjectionToken<FocusedGalaxyConfirmationRuntime>(
    'FOCUSED_GALAXY_CONFIRMATION_RUNTIME',
    {
      providedIn:
        'root',

      factory: () => {
        const repositories =
          inject(
            GENESIS_LOCAL_REPOSITORIES,
          );

        return new FocusedGalaxyConfirmationRuntime(
          repositories.navigationRepository,
          repositories.discoveryRepository,
        );
      },
    },
  );

export function buildProceduralFocusedGalaxyConfirmationPlan(
  generationKey:
    UniverseGenerationKey,

  galaxyIndex:
    bigint,
): FocusedGalaxyConfirmationPlan {

  const galaxy =
    GalaxyGenerator.generate(
      generationKey,
      galaxyIndex,
    );

  const grid =
    GalaxySectorGridGenerator.generate(
      galaxy,
    );

  const totalSectors =
    grid.sideLengthInSectors *
    grid.sideLengthInSectors;

  function* sectors():
    IterableIterator<FocusedGalaxyConfirmationSectorPlan> {

    for (
      let y = grid.minCoordinate;
      y <= grid.maxCoordinate;
      y += 1
    ) {
      for (
        let x = grid.minCoordinate;
        x <= grid.maxCoordinate;
        x += 1
      ) {
        const coordinates =
          new GalaxySectorCoordinates(
            x,
            y,
          );

        const content =
          GalaxySectorContentGenerator.generate(
            galaxy,
            coordinates,
          );

        yield Object.freeze({
          sectorLocator:
            content.locator,

          systemLocators:
            content.systemLocators,

          galacticObjectLocators:
            content.galacticObjectLocators,
        });
      }
    }
  }

  return Object.freeze({
    totalSectors,
    sectors:
      sectors(),
  });
}

function yieldToEventLoop():
  Promise<void> {

  return new Promise(
    resolve => {
      setTimeout(
        resolve,
        0,
      );
    },
  );
}
