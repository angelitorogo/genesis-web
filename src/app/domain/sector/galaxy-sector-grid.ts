import {
  SectorLocator,
} from '../generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  type GalaxySectorCoordinates,
} from './galaxy-sector-coordinates';

import {
  GalaxySectorKeyCodec,
} from './galaxy-sector-key-codec';

const SIGNED_LONG_MAX =
  (1n << 63n) -
  1n;

const SIGNED_INT32_MAX =
  2147483647;

/**
 * Addressable sector grid of a galaxy.
 *
 * The grid describes only geometry and procedural addressing.
 *
 * It never materializes all sectors in memory.
 *
 * Coordinate convention:
 *
 * - x and y are discrete grid indices;
 * - (0, 0) is the unique central sector;
 * - x and y range from -halfExtentInSectors to
 *   +halfExtentInSectors;
 * - there is no z coordinate at roadmap point 5.1;
 * - every sector conceptually represents a column through the
 *   thickness of the galactic plane.
 *
 * Sector content and SectorSeed generation belong to later
 * roadmap points.
 */
export class GalaxySectorGrid {

  constructor(
    readonly generationKey:
      UniverseGenerationKey,

    readonly galaxyIndex:
      bigint,

    readonly sectorSizeLightYears:
      number,

    readonly halfExtentInSectors:
      number,
  ) {
    if (
      galaxyIndex <
        0n ||
      galaxyIndex >
        SIGNED_LONG_MAX
    ) {
      throw new RangeError(
        `galaxyIndex must be a non-negative signed Long: ${galaxyIndex}.`,
      );
    }

    if (
      !Number.isFinite(
        sectorSizeLightYears,
      ) ||
      sectorSizeLightYears <=
        0
    ) {
      throw new RangeError(
        'sectorSizeLightYears must be finite and greater than 0.',
      );
    }

    if (
      !Number.isInteger(
        halfExtentInSectors,
      ) ||
      halfExtentInSectors <
        0 ||
      halfExtentInSectors >
        SIGNED_INT32_MAX
    ) {
      throw new RangeError(
        `halfExtentInSectors must be a non-negative signed Int32: ${halfExtentInSectors}.`,
      );
    }
  }

  get minCoordinate():
    number {

    if (
      this
        .halfExtentInSectors ===
      0
    ) {
      return 0;
    }

    return -this
      .halfExtentInSectors;
  }

  get maxCoordinate():
    number {

    return this
      .halfExtentInSectors;
  }

  get sideLengthInSectors():
    bigint {

    return (
      2n *
        BigInt(
          this
            .halfExtentInSectors,
        ) +
      1n
    );
  }

  contains(
    coordinates:
      GalaxySectorCoordinates,
  ): boolean {

    return (
      coordinates.x >=
        this.minCoordinate &&
      coordinates.x <=
        this.maxCoordinate &&
      coordinates.y >=
        this.minCoordinate &&
      coordinates.y <=
        this.maxCoordinate
    );
  }

  sectorKeyFor(
    coordinates:
      GalaxySectorCoordinates,
  ): bigint {

    if (
      !this.contains(
        coordinates,
      )
    ) {
      throw new RangeError(
        'Sector coordinates are outside this galaxy sector grid.',
      );
    }

    return GalaxySectorKeyCodec
      .encode(
        coordinates,
      );
  }

  locatorFor(
    coordinates:
      GalaxySectorCoordinates,
  ): SectorLocator {

    return new SectorLocator(
      this.galaxyIndex,
      this.sectorKeyFor(
        coordinates,
      ),
    );
  }

  coordinatesFor(
    sectorKey:
      bigint,
  ): GalaxySectorCoordinates {

    const coordinates =
      GalaxySectorKeyCodec
        .decode(
          sectorKey,
        );

    if (
      !this.contains(
        coordinates,
      )
    ) {
      throw new RangeError(
        'Sector key resolves outside this galaxy sector grid.',
      );
    }

    return coordinates;
  }
}