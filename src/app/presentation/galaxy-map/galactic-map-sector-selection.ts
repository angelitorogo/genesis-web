import {
  GalaxySectorCoordinates,
} from '../../domain/sector/galaxy-sector-coordinates';

import {
  type GalacticMapExplorationCoverage,
} from './galactic-map-exploration-coverage';

import {
  sectorCellSize,
} from './galactic-map-sector-overlay';

export interface GalacticMapSectorSelection {
  readonly coordinates:
    GalaxySectorCoordinates;

  readonly sectorKey:
    bigint;

  readonly explored:
    boolean;
}

/**
 * Resolves a local point on the galactic Z=0 cartographic plane into one real
 * sector address. The operation is addressing-only: it does not generate
 * sector content, systems, stars or hidden Ground Truth.
 */
export function resolveGalacticMapSectorSelection(
  coverage:
    GalacticMapExplorationCoverage,

  haloOuterRadiusNormalized:
    number,

  localX:
    number,

  localY:
    number,
): GalacticMapSectorSelection | null {

  if (
    !Number.isFinite(
      localX,
    ) ||
    !Number.isFinite(
      localY,
    )
  ) {
    return null;
  }

  if (
    Math.abs(
      localX,
    ) >
      haloOuterRadiusNormalized ||
    Math.abs(
      localY,
    ) >
      haloOuterRadiusNormalized
  ) {
    return null;
  }

  const cellSize =
    sectorCellSize(
      coverage,
      haloOuterRadiusNormalized,
    );

  const sectorX =
    normalizeNegativeZero(
      Math.round(
        localX /
          cellSize,
      ),
    );

  const sectorY =
    normalizeNegativeZero(
      Math.round(
        localY /
          cellSize,
      ),
    );

  const coordinates =
    new GalaxySectorCoordinates(
      sectorX,
      sectorY,
    );

  if (
    !coverage
      .grid
      .contains(
        coordinates,
      )
  ) {
    return null;
  }

  return Object.freeze({
    coordinates,

    sectorKey:
      coverage
        .grid
        .sectorKeyFor(
          coordinates,
        ),

    explored:
      isExplored(
        coverage,
        coordinates,
      ),
  });
}

function isExplored(
  coverage:
    GalacticMapExplorationCoverage,

  coordinates:
    GalaxySectorCoordinates,
): boolean {

  return coverage
    .exploredSectors
    .some(
      (
        explored,
      ) =>
        explored.x ===
          coordinates.x &&
        explored.y ===
          coordinates.y,
    );
}

function normalizeNegativeZero(
  value:
    number,
): number {

  return Object.is(
    value,
    -0,
  )
    ? 0
    : value;
}
