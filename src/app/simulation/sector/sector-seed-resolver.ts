import {
  SectorLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type GalaxySectorCoordinates,
} from '../../domain/sector/galaxy-sector-coordinates';

import {
  type GalaxySectorGrid,
} from '../../domain/sector/galaxy-sector-grid';

import {
  SectorSeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

/**
 * Typed facade for resolving SectorSeed values.
 *
 * Canonical responsibilities:
 *
 * - delegates hierarchical seed resolution exclusively to
 *   ProceduralTargetResolver;
 * - remains stateless and deterministic;
 * - does not duplicate SeedDeriver logic;
 * - consumes no random draws;
 * - generates no sector content;
 * - performs no persistence;
 * - does not modify exploration or discovery state;
 * - the grid overload validates coordinates through
 *   GalaxySectorGrid.locatorFor().
 */
export class SectorSeedResolver {

  private constructor() {}

  static resolve(
    generationKey:
      UniverseGenerationKey,

    locator:
      SectorLocator,
  ): SectorSeed {

    const resolvedSeed =
      ProceduralTargetResolver
        .resolveTargetSeed(
          generationKey,
          locator,
        );

    if (
      !(
        resolvedSeed instanceof
        SectorSeed
      )
    ) {
      throw new Error(
        'SectorLocator did not resolve to SectorSeed.',
      );
    }

    return resolvedSeed;
  }

  static resolveFromGrid(
    grid:
      GalaxySectorGrid,

    coordinates:
      GalaxySectorCoordinates,
  ): SectorSeed {

    const locator =
      grid.locatorFor(
        coordinates,
      );

    return this.resolve(
      grid.generationKey,
      locator,
    );
  }
}