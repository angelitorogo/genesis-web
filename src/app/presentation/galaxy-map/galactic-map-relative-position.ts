import {
  GalaxySectorKeyCodec,
} from '../../domain/sector/galaxy-sector-key-codec';

import {
  type GalaxySectorGrid,
} from '../../domain/sector/galaxy-sector-grid';

import {
  type GalacticMapDiscoveryMarker,
} from './galactic-map-discovery-markers';

import {
  type GalacticMapRegionRadii,
} from './galactic-map-environmental-layers';

export const GalacticMapRelativeRegion =
  Object.freeze({
    CENTRAL:
      'CENTRAL',

    INNER:
      'INNER',

    MIDDLE:
      'MIDDLE',

    OUTER:
      'OUTER',

    OUTSIDE_NOMINAL:
      'OUTSIDE_NOMINAL',
  } as const);

export type GalacticMapRelativeRegion =
  typeof GalacticMapRelativeRegion[
    keyof typeof GalacticMapRelativeRegion
  ];

export interface GalacticMapRelativePosition {
  readonly xSectorUnits:
    number;

  readonly ySectorUnits:
    number;

  readonly xLightYears:
    number;

  readonly yLightYears:
    number;

  readonly distanceFromCenterLightYears:
    number;

  readonly normalizedRadius:
    number;

  readonly azimuthDegrees:
    number;

  readonly region:
    GalacticMapRelativeRegion;
}

/**
 * Point-10.7 read-only position of one persistent discovery relative to the
 * active galactic centre.
 *
 * The calculation uses only already-known marker placement plus the existing
 * sector-grid geometry. It consumes no PRNG draws, materializes no sector
 * content and does not mutate DiscoveryState, persistence or Ground Truth.
 *
 * Coordinate convention:
 * - sector (0, 0) contains the galactic centre;
 * - normalized marker placement [0, 1) is converted to an offset around the
 *   sector centre with `normalized - 0.5`;
 * - 0 degrees points along +X and angles grow towards +Y;
 * - the radial region reuses the exact point-10.5 region radii supplied by the
 *   environmental-layer projection instead of defining a second threshold set.
 */
export function resolveGalacticMapRelativePosition(
  marker:
    GalacticMapDiscoveryMarker,

  grid:
    GalaxySectorGrid,

  regionRadii:
    GalacticMapRegionRadii,
): GalacticMapRelativePosition {

  assertCompatibleMarkerGrid(
    marker,
    grid,
  );

  assertRegionRadii(
    regionRadii,
  );

  const xSectorUnits =
    marker
      .sectorCoordinates
      .x +
    marker.normalizedX -
    0.5;

  const ySectorUnits =
    marker
      .sectorCoordinates
      .y +
    marker.normalizedY -
    0.5;

  const xLightYears =
    xSectorUnits *
    grid.sectorSizeLightYears;

  const yLightYears =
    ySectorUnits *
    grid.sectorSizeLightYears;

  const distanceSectorUnits =
    Math.hypot(
      xSectorUnits,
      ySectorUnits,
    );

  const distanceFromCenterLightYears =
    distanceSectorUnits *
    grid.sectorSizeLightYears;

  const normalizedRadius =
    grid.halfExtentInSectors ===
      0
      ? 0
      : distanceSectorUnits /
        grid.halfExtentInSectors;

  const azimuthDegrees =
    normalizeDegrees(
      Math.atan2(
        ySectorUnits,
        xSectorUnits,
      ) *
        180 /
        Math.PI,
    );

  return Object.freeze({
    xSectorUnits,
    ySectorUnits,
    xLightYears,
    yLightYears,
    distanceFromCenterLightYears,
    normalizedRadius,
    azimuthDegrees,
    region:
      relativeRegionForRadius(
        normalizedRadius,
        regionRadii,
      ),
  });
}

export function galacticMapRelativeRegionLabel(
  region:
    GalacticMapRelativeRegion,
): string {

  switch (
    region
  ) {
    case GalacticMapRelativeRegion.CENTRAL:
      return 'Región central';

    case GalacticMapRelativeRegion.INNER:
      return 'Región interior';

    case GalacticMapRelativeRegion.MIDDLE:
      return 'Región media';

    case GalacticMapRelativeRegion.OUTER:
      return 'Región exterior';

    case GalacticMapRelativeRegion.OUTSIDE_NOMINAL:
      return 'Fuera del límite nominal';
  }

  throw new RangeError(
    `Unsupported GalacticMapRelativeRegion: ${String(region)}.`,
  );
}

function relativeRegionForRadius(
  normalizedRadius:
    number,

  regionRadii:
    GalacticMapRegionRadii,
): GalacticMapRelativeRegion {

  if (
    normalizedRadius <
      regionRadii
        .centralOuterRadiusNormalized
  ) {
    return GalacticMapRelativeRegion
      .CENTRAL;
  }

  if (
    normalizedRadius <
      regionRadii
        .innerOuterRadiusNormalized
  ) {
    return GalacticMapRelativeRegion
      .INNER;
  }

  if (
    normalizedRadius <
      regionRadii
        .middleOuterRadiusNormalized
  ) {
    return GalacticMapRelativeRegion
      .MIDDLE;
  }

  if (
    normalizedRadius <=
      regionRadii
        .nominalOuterRadiusNormalized
  ) {
    return GalacticMapRelativeRegion
      .OUTER;
  }

  return GalacticMapRelativeRegion
    .OUTSIDE_NOMINAL;
}

function normalizeDegrees(
  degrees:
    number,
): number {

  const normalized =
    (
      degrees %
        360 +
      360
    ) %
    360;

  return Object.is(
    normalized,
    -0,
  )
    ? 0
    : normalized;
}

function assertCompatibleMarkerGrid(
  marker:
    GalacticMapDiscoveryMarker,

  grid:
    GalaxySectorGrid,
): void {

  if (
    marker
      .locator
      .galaxyIndex !==
      grid.galaxyIndex ||
    !grid.contains(
      marker.sectorCoordinates,
    ) ||
    marker
      .locator
      .sectorKey !==
      GalaxySectorKeyCodec
        .encode(
          marker.sectorCoordinates,
        )
  ) {
    throw new RangeError(
      'Persistent discovery marker must belong to the supplied galactic sector grid.',
    );
  }
}

function assertRegionRadii(
  regionRadii:
    GalacticMapRegionRadii,
): void {

  const values = [
    regionRadii
      .centralOuterRadiusNormalized,
    regionRadii
      .innerOuterRadiusNormalized,
    regionRadii
      .middleOuterRadiusNormalized,
    regionRadii
      .nominalOuterRadiusNormalized,
  ];

  for (
    let index =
      0;
    index <
      values.length;
    index +=
      1
  ) {
    const value =
      values[
        index
      ];

    if (
      !Number.isFinite(
        value,
      ) ||
      value <
        0 ||
      value >
        1 ||
      (
        index >
          0 &&
        value <=
          values[
            index -
              1
          ]
      )
    ) {
      throw new RangeError(
        'Galactic relative-position region radii must be finite, normalized and strictly increasing.',
      );
    }
  }
}
