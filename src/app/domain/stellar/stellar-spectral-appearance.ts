import {
  type StellarColor,
} from './stellar-color';

import {
  type StellarSpectralType,
} from './stellar-spectral-type';

/**
 * Point-15.2 renderer-independent spectral result for one stellar baseline.
 *
 * spectralType is a simplified scientific classification; color is a display
 * approximation derived from the same effective temperature. Neither value is
 * an observation, discovery state, CSS style or Three.js material.
 */
export class StellarSpectralAppearance {

  constructor(
    readonly spectralType:
      StellarSpectralType,

    readonly color:
      StellarColor,
  ) {}
}
