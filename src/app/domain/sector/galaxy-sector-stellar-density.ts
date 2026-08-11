import {
  type GalaxyRegion,
} from './galaxy-region';

/**
 * Structural stellar-density description of one galactic sector.
 *
 * relativeDensity is a normalized dimensionless scale in [0, 1].
 * It is not an absolute physical stellar density.
 */
export class GalaxySectorStellarDensity {

  constructor(
    readonly region:
      GalaxyRegion,

    readonly normalizedRadius:
      number,

    readonly relativeDensity:
      number,
  ) {
    if (
      !Number.isFinite(
        normalizedRadius,
      ) ||
      normalizedRadius <
        0
    ) {
      throw new RangeError(
        'normalizedRadius must be finite and non-negative.',
      );
    }

    if (
      !Number.isFinite(
        relativeDensity,
      ) ||
      relativeDensity <
        0 ||
      relativeDensity >
        1
    ) {
      throw new RangeError(
        'relativeDensity must be finite and between 0 and 1.',
      );
    }
  }
}