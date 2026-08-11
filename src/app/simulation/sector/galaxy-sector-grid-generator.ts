import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  GalaxySectorGrid,
} from '../../domain/sector/galaxy-sector-grid';

import {
  type Galaxy,
} from '../../domain/universe/galaxy';

const V1_SECTOR_SIZE_LIGHT_YEARS =
  1000;

const SIGNED_INT32_MAX =
  2147483647;

const MAX_SIDE_LENGTH_IN_SECTORS =
  2 *
    SIGNED_INT32_MAX +
  1;

/**
 * Deterministic geometry generator for a galaxy sector grid.
 *
 * GeneratorVersion.V1 follows the canonical Android contract:
 *
 * - sector cells are 1,000 light-years per side;
 * - the galaxy diameter determines the minimum grid width;
 * - the grid side is always odd;
 * - (0, 0) is therefore always a unique central sector;
 * - the grid contains no materialized sector collection;
 * - no random generator is consumed;
 * - no SectorSeed is derived.
 */
export class GalaxySectorGridGenerator {

  private constructor() {}

  static generate(
    galaxy:
      Galaxy,
  ): GalaxySectorGrid {

    if (
      galaxy
        .generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.generateV1(
        galaxy,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${galaxy.generationKey.generatorVersion.code}.`,
    );
  }

  private static generateV1(
    galaxy:
      Galaxy,
  ): GalaxySectorGrid {

    const diameterLightYears =
      galaxy
        .physicalProperties
        .diameterLightYears;

    const minimumSectorCount =
      Math.max(
        1,
        Math.ceil(
          diameterLightYears /
            V1_SECTOR_SIZE_LIGHT_YEARS,
        ),
      );

    if (
      !Number.isSafeInteger(
        minimumSectorCount,
      ) ||
      minimumSectorCount >
        MAX_SIDE_LENGTH_IN_SECTORS
    ) {
      throw new RangeError(
        'Galaxy sector grid exceeds supported coordinate range.',
      );
    }

    const oddSectorCount =
      minimumSectorCount %
          2 ===
        0
        ? minimumSectorCount +
          1
        : minimumSectorCount;

    if (
      oddSectorCount >
      MAX_SIDE_LENGTH_IN_SECTORS
    ) {
      throw new RangeError(
        'Galaxy sector grid exceeds supported coordinate range.',
      );
    }

    const halfExtent =
      (
        oddSectorCount -
        1
      ) /
      2;

    if (
      halfExtent >
      SIGNED_INT32_MAX
    ) {
      throw new RangeError(
        'Galaxy sector grid exceeds supported coordinate range.',
      );
    }

    return new GalaxySectorGrid(
      galaxy.generationKey,
      galaxy.index,
      V1_SECTOR_SIZE_LIGHT_YEARS,
      halfExtent,
    );
  }
}