import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxySectorCoordinates,
} from '../../domain/sector/galaxy-sector-coordinates';

import {
  type GalaxySectorGrid,
} from '../../domain/sector/galaxy-sector-grid';

/**
 * Point-10.3 read-only exploration coverage for the active galactic map.
 *
 * A sector is explored when its canonical SectorLocator already exists in
 * persistence with a known DiscoveryState (DETECTED or later). UNKNOWN is
 * represented by absence and therefore remains unexplored.
 *
 * This projection contains addressing only. It materializes no sector content,
 * systems, galactic objects or markers.
 */
export class GalacticMapExplorationCoverage {

  readonly exploredSectors:
    readonly GalaxySectorCoordinates[];

  constructor(
    readonly generationKey:
      UniverseGenerationKey,

    readonly galaxyIndex:
      bigint,

    readonly grid:
      GalaxySectorGrid,

    exploredSectors:
      readonly GalaxySectorCoordinates[],
  ) {
    if (
      !sameGenerationKey(
        generationKey,
        grid.generationKey,
      )
    ) {
      throw new RangeError(
        'GalacticMapExplorationCoverage grid must belong to generationKey.',
      );
    }

    if (
      grid.galaxyIndex !==
      galaxyIndex
    ) {
      throw new RangeError(
        'GalacticMapExplorationCoverage grid must belong to galaxyIndex.',
      );
    }

    const coordinateKeys =
      new Set<string>();

    const canonicalCoordinates:
      GalaxySectorCoordinates[] =
      [];

    for (
      const coordinates
      of exploredSectors
    ) {
      const canonical =
        new GalaxySectorCoordinates(
          coordinates.x,
          coordinates.y,
        );

      if (
        !grid.contains(
          canonical,
        )
      ) {
        throw new RangeError(
          [
            'Explored sector coordinates are outside the active galaxy grid:',
            `x=${canonical.x},`,
            `y=${canonical.y}.`,
          ].join(
            ' ',
          ),
        );
      }

      const key =
        `${canonical.x}:${canonical.y}`;

      if (
        coordinateKeys.has(
          key,
        )
      ) {
        throw new RangeError(
          `Duplicate explored sector coordinates: ${key}.`,
        );
      }

      coordinateKeys.add(
        key,
      );

      canonicalCoordinates.push(
        canonical,
      );
    }

    canonicalCoordinates.sort(
      (
        left,
        right,
      ) =>
        left.x -
          right.x ||
        left.y -
          right.y,
    );

    this.exploredSectors =
      Object.freeze(
        canonicalCoordinates,
      );
  }

  get exploredSectorCount():
    number {

    return this
      .exploredSectors
      .length;
  }

  get totalSectorCount():
    bigint {

    const side =
      this
        .grid
        .sideLengthInSectors;

    return side *
      side;
  }
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
