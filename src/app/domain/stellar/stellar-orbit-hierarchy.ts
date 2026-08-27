import {
  type StellarRelativeOrbit,
} from './stellar-relative-orbit';

import {
  StellarSystemMultiplicity,
} from './stellar-system-multiplicity';

export const STELLAR_TRIPLE_V1_MIN_HIERARCHY_SEPARATION_RATIO =
  5;

const HIERARCHY_TOLERANCE =
  1e-12;

/**
 * Point-16.4 simplified stellar-orbit hierarchy.
 *
 * V1 fixes A-B as the relative inner pair for every multiple system. A BINARY
 * therefore owns only innerOrbit. A TRIPLE preserves that exact A-B orbit and
 * adds outerOrbit for C relative to the A+B barycentre. SINGLE owns no stellar
 * relative orbit.
 *
 * The triple hierarchy is deliberately conservative: outer periastron must be
 * at least five inner apoastra away. This is a coarse deterministic stability
 * boundary, not a replacement for full three-body integrations.
 */
export class StellarOrbitHierarchy {

  constructor(
    readonly multiplicity:
      StellarSystemMultiplicity,

    readonly innerOrbit:
      StellarRelativeOrbit | null,

    readonly outerOrbit:
      StellarRelativeOrbit | null,
  ) {
    if (
      multiplicity ===
      StellarSystemMultiplicity.SINGLE
    ) {
      if (
        innerOrbit !==
          null ||
        outerOrbit !==
          null
      ) {
        throw new RangeError(
          'SINGLE stellar systems cannot carry stellar relative orbits.',
        );
      }

      return;
    }

    if (
      innerOrbit ===
        null
    ) {
      throw new RangeError(
        `${multiplicity.name} stellar systems require the A-B inner orbit.`,
      );
    }

    if (
      multiplicity ===
      StellarSystemMultiplicity.BINARY
    ) {
      if (
        outerOrbit !==
          null
      ) {
        throw new RangeError(
          'BINARY stellar systems cannot carry a triple outer orbit.',
        );
      }

      return;
    }

    if (
      multiplicity ===
      StellarSystemMultiplicity.TRIPLE
    ) {
      if (
        outerOrbit ===
          null
      ) {
        throw new RangeError(
          'TRIPLE stellar systems require an outer C orbit around the A+B barycentre.',
        );
      }

      const separationRatio =
        outerOrbit
          .periastronAu /
        innerOrbit
          .apoastronAu;

      if (
        separationRatio +
          HIERARCHY_TOLERANCE <
        STELLAR_TRIPLE_V1_MIN_HIERARCHY_SEPARATION_RATIO
      ) {
        throw new RangeError(
          `TRIPLE hierarchy requires outer periastron / inner apoastron >= ${STELLAR_TRIPLE_V1_MIN_HIERARCHY_SEPARATION_RATIO}: ${separationRatio}.`,
        );
      }

      return;
    }

    throw new RangeError(
      `Unsupported StellarSystemMultiplicity for point 16.4: ${multiplicity.name}.`,
    );
  }

  get hasInnerOrbit():
    boolean {

    return this
      .innerOrbit !==
      null;
  }

  get hasOuterOrbit():
    boolean {

    return this
      .outerOrbit !==
      null;
  }

  get hierarchySeparationRatio():
    number | null {

    if (
      this.innerOrbit ===
        null ||
      this.outerOrbit ===
        null
    ) {
      return null;
    }

    return (
      this.outerOrbit
        .periastronAu /
      this.innerOrbit
        .apoastronAu
    );
  }
}
