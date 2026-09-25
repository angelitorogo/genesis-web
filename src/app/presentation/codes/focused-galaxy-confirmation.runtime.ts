import {
  inject,
  InjectionToken,
} from '@angular/core';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  GalaxyLocator,
  type GalacticObjectLocator,
  type SectorLocator,
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

/**
 * Administrative QA code. It is intentionally not a reward/entitlement code:
 * it can be executed again and always targets only the currently focused galaxy.
 */
export const CONFIRM_FOCUSED_GALAXY_CODE =
  'C0DE-6A1A-C0DE-F11A';

const YIELD_EVERY_SECTORS =
  16;

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
    generationKey:
      UniverseGenerationKey,
  ): Promise<FocusedGalaxyConfirmationResult> {

    if (
      generationKey
        .generatorVersionCode !==
      2
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

    await this
      .discoveryRepository
      .setState(
        generationKey,
        galaxyLocator,
        DiscoveryState.CONFIRMED,
      );

    let sectors =
      0n;

    let systems =
      0n;

    let galacticObjects =
      0n;

    let sinceYield =
      0;

    for (
      const sector
      of plan.sectors
    ) {
      await this
        .discoveryRepository
        .setState(
          generationKey,
          sector.sectorLocator,
          DiscoveryState.CONFIRMED,
        );

      sectors +=
        1n;

      for (
        const systemLocator
        of sector.systemLocators
      ) {
        await this
          .discoveryRepository
          .setState(
            generationKey,
            systemLocator,
            DiscoveryState.CONFIRMED,
          );

        systems +=
          1n;
      }

      for (
        const objectLocator
        of sector.galacticObjectLocators
      ) {
        await this
          .discoveryRepository
          .setState(
            generationKey,
            objectLocator,
            DiscoveryState.CONFIRMED,
          );

        galacticObjects +=
          1n;
      }

      sinceYield +=
        1;

      if (
        sinceYield >=
        YIELD_EVERY_SECTORS
      ) {
        sinceYield =
          0;

        await yieldToEventLoop();
      }
    }

    if (
      sectors !==
      plan.totalSectors
    ) {
      throw new RangeError(
        `Focused-galaxy confirmation enumerated ${sectors.toString()} sectors but expected ${plan.totalSectors.toString()}.`,
      );
    }

    return {
      kind:
        'confirmed',

      galaxyIndex,
      sectors,
      systems,
      galacticObjects,
    };
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
