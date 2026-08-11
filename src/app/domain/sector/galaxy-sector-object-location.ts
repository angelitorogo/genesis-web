import {
  type GalaxySectorCoordinates,
} from './galaxy-sector-coordinates';

/**
 * Exact procedural location of an addressable object
 * inside a galactic sector.
 *
 * sectorCoordinates identify the discrete sector.
 *
 * normalizedX and normalizedY identify the deterministic
 * local position inside that sector:
 *
 *   0.0 <= normalizedX < 1.0
 *   0.0 <= normalizedY < 1.0
 *
 * These values are Ground Truth and must not be persisted.
 * They are regenerated from procedural identity.
 */
export class GalaxySectorObjectLocation {

  constructor(
    readonly sectorCoordinates:
      GalaxySectorCoordinates,

    readonly normalizedX:
      number,

    readonly normalizedY:
      number,
  ) {
    requireNormalizedCoordinate(
      normalizedX,
      'normalizedX',
    );

    requireNormalizedCoordinate(
      normalizedY,
      'normalizedY',
    );
  }
}

function requireNormalizedCoordinate(
  value:
    number,

  name:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0 ||
    value >=
      1
  ) {
    throw new RangeError(
      `${name} must be finite and belong to [0.0, 1.0).`,
    );
  }
}