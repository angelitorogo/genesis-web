import {
  type BodyLocator,
} from '../generation/procedural-locator';

import {
  type BodySeed,
} from '../seed/hierarchical-seeds';

export const PLANET_V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER =
  5.514;

export const PLANET_V1_EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED =
  9.80665;

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-19.2 bulk physical state of one mature planet.
 *
 * Mass and radius use Earth units. Mean density uses g/cm^3 and surface gravity
 * is exposed both in Earth gravities and m/s^2. The solid-core mass is inherited
 * unchanged from point 18.2; accretedEnvelopeMassEarth is the additional mass
 * actually retained from the finite point-17.7 gas-capture budget.
 *
 * This contract deliberately does not assign a planet type or detailed internal
 * composition. Those semantic classifications remain points 19.4 and 19.5.
 */
export class PlanetPhysicalProperties {

  constructor(
    readonly planetOrdinal:
      number,

    readonly bodyLocator:
      BodyLocator,

    readonly bodySeed:
      BodySeed,

    readonly inheritedSolidCoreMassEarth:
      number,

    readonly accretedEnvelopeMassEarth:
      number,

    readonly massEarth:
      number,

    readonly radiusEarth:
      number,

    readonly densityGramsPerCubicCentimeter:
      number,

    readonly surfaceGravityEarth:
      number,

    readonly surfaceGravityMetersPerSecondSquared:
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
        'Point-19.2 physical properties must use the BodyLocator belonging to planetOrdinal.',
      );
    }

    if (
      bodySeed.kind !==
      'body'
    ) {
      throw new RangeError(
        'PlanetPhysicalProperties requires a BodySeed.',
      );
    }

    assertPositiveFinite(
      inheritedSolidCoreMassEarth,
      'inheritedSolidCoreMassEarth',
    );

    assertNonNegativeFinite(
      accretedEnvelopeMassEarth,
      'accretedEnvelopeMassEarth',
    );

    assertPositiveFinite(
      massEarth,
      'massEarth',
    );

    assertPositiveFinite(
      radiusEarth,
      'radiusEarth',
    );

    assertPositiveFinite(
      densityGramsPerCubicCentimeter,
      'densityGramsPerCubicCentimeter',
    );

    assertPositiveFinite(
      surfaceGravityEarth,
      'surfaceGravityEarth',
    );

    assertPositiveFinite(
      surfaceGravityMetersPerSecondSquared,
      'surfaceGravityMetersPerSecondSquared',
    );

    if (
      !approximatelyEqual(
        massEarth,
        inheritedSolidCoreMassEarth +
          accretedEnvelopeMassEarth,
      )
    ) {
      throw new RangeError(
        'Point-19.2 total mass must equal inherited solid-core mass plus accreted envelope mass.',
      );
    }

    const expectedDensity =
      PLANET_V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER *
      massEarth /
      radiusEarth **
        3;

    if (
      !approximatelyEqual(
        densityGramsPerCubicCentimeter,
        expectedDensity,
      )
    ) {
      throw new RangeError(
        'Point-19.2 mean density must be coherent with massEarth and radiusEarth.',
      );
    }

    const expectedSurfaceGravityEarth =
      massEarth /
      radiusEarth **
        2;

    if (
      !approximatelyEqual(
        surfaceGravityEarth,
        expectedSurfaceGravityEarth,
      )
    ) {
      throw new RangeError(
        'Point-19.2 surfaceGravityEarth must satisfy g/gEarth = M/MEarth / (R/REarth)^2.',
      );
    }

    if (
      !approximatelyEqual(
        surfaceGravityMetersPerSecondSquared,
        surfaceGravityEarth *
          PLANET_V1_EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED,
      )
    ) {
      throw new RangeError(
        'Point-19.2 SI surface gravity must match surfaceGravityEarth.',
      );
    }
  }

  get envelopeMassFraction01():
    number {

    return this
      .accretedEnvelopeMassEarth /
      this
        .massEarth;
  }

  get solidMassFraction01():
    number {

    return this
      .inheritedSolidCoreMassEarth /
      this
        .massEarth;
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

function assertNonNegativeFinite(
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
      0
  ) {
    throw new RangeError(
      `${propertyName} must be finite and non-negative: ${value}.`,
    );
  }
}

function approximatelyEqual(
  left:
    number,

  right:
    number,
): boolean {

  const scale =
    Math.max(
      1,
      Math.abs(
        left,
      ),
      Math.abs(
        right,
      ),
    );

  return (
    Math.abs(
      left -
      right,
    ) <=
    CONSISTENCY_TOLERANCE *
      scale
  );
}
