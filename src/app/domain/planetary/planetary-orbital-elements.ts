import {
  type BodyLocator,
} from '../generation/procedural-locator';

import {
  type BodySeed,
} from '../seed/hierarchical-seeds';

/**
 * Point-18.3 geometric Keplerian elements for one mature planet identity.
 *
 * The orbit deliberately contains no period or time-dependent orbital phase.
 * Point 18.4 owns periods, while anomaly/epoch propagation is outside the
 * current V1 geometry contract. Angles use degrees and describe a prograde
 * reference-plane orbit generated deterministically from the existing BodySeed.
 */
export class PlanetaryOrbitalElements {

  constructor(
    readonly planetOrdinal:
      number,

    readonly bodyLocator:
      BodyLocator,

    readonly bodySeed:
      BodySeed,

    readonly semiMajorAxisAu:
      number,

    readonly eccentricity:
      number,

    readonly inclinationDegrees:
      number,

    readonly longitudeOfAscendingNodeDegrees:
      number,

    readonly argumentOfPeriapsisDegrees:
      number,
  ) {
    if (
      !Number.isInteger(
        planetOrdinal,
      ) ||
      planetOrdinal <=
        0
    ) {
      throw new RangeError(
        'planetOrdinal must be a positive integer.',
      );
    }

    if (
      bodyLocator.bodyIndex !==
      BigInt(
        planetOrdinal -
          1,
      )
    ) {
      throw new RangeError(
        'Point-18.3 orbital elements must use the BodyLocator belonging to planetOrdinal.',
      );
    }

    if (
      bodySeed.kind !==
      'body'
    ) {
      throw new RangeError(
        'PlanetaryOrbitalElements requires a BodySeed.',
      );
    }

    assertPositiveFinite(
      semiMajorAxisAu,
      'semiMajorAxisAu',
    );

    if (
      !Number.isFinite(
        eccentricity,
      ) ||
      eccentricity <
        0 ||
      eccentricity >=
        1
    ) {
      throw new RangeError(
        `eccentricity must be finite and in [0, 1): ${eccentricity}.`,
      );
    }

    if (
      !Number.isFinite(
        inclinationDegrees,
      ) ||
      inclinationDegrees <
        0 ||
      inclinationDegrees >
        180
    ) {
      throw new RangeError(
        `inclinationDegrees must be finite and in [0, 180]: ${inclinationDegrees}.`,
      );
    }

    assertCanonicalAngle(
      longitudeOfAscendingNodeDegrees,
      'longitudeOfAscendingNodeDegrees',
    );

    assertCanonicalAngle(
      argumentOfPeriapsisDegrees,
      'argumentOfPeriapsisDegrees',
    );
  }

  get periastronAu():
    number {

    return this
      .semiMajorAxisAu *
      (
        1 -
        this.eccentricity
      );
  }

  get apoastronAu():
    number {

    return this
      .semiMajorAxisAu *
      (
        1 +
        this.eccentricity
      );
  }
}

function assertPositiveFinite(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <=
      0
  ) {
    throw new RangeError(
      `${propertyName} must be finite and greater than 0: ${value}.`,
    );
  }
}

function assertCanonicalAngle(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0 ||
    value >=
      360
  ) {
    throw new RangeError(
      `${propertyName} must be finite and in [0, 360): ${value}.`,
    );
  }
}
