import {
  type BodyLocator,
} from '../generation/procedural-locator';

import {
  type BodySeed,
} from '../seed/hierarchical-seeds';

import {
  type PlanetType,
} from './planet-type';

/**
 * Point-21.2 deterministic natural-satellite population summary for one Planet.
 *
 * This object owns only the total modeled moon count plus the frozen planetary
 * sources needed to explain that count. It deliberately does NOT materialize
 * individual moon identities, seeds, orbits or physical properties. Those
 * remain points 21.3..21.8.
 */
export class MoonPopulationProfile {

  constructor(
    readonly hostPlanetOrdinal:
      number,

    readonly hostPlanetLocator:
      BodyLocator,

    readonly hostPlanetSeed:
      BodySeed,

    readonly sourcePlanetType:
      PlanetType,

    readonly sourceMassEarth:
      number,

    readonly sourceRadiusEarth:
      number,

    readonly sourceSemiMajorAxisAu:
      number,

    readonly sourceEccentricity:
      number,

    readonly sourceGravitatingMassSolar:
      number,

    readonly hillSphereRadiusPlanetRadii:
      number,

    readonly satelliteCapacityIndex01:
      number,

    readonly moonCount:
      number,
  ) {
    if (
      !Number.isInteger(
        hostPlanetOrdinal,
      ) ||
      hostPlanetOrdinal <=
        0
    ) {
      throw new RangeError(
        'MoonPopulationProfile hostPlanetOrdinal must be a positive integer.',
      );
    }

    if (
      hostPlanetLocator
        .bodyIndex !==
      BigInt(
        hostPlanetOrdinal -
          1,
      )
    ) {
      throw new RangeError(
        'MoonPopulationProfile must preserve the canonical host BodyLocator for hostPlanetOrdinal.',
      );
    }

    if (
      hostPlanetSeed.kind !==
      'body'
    ) {
      throw new RangeError(
        'MoonPopulationProfile requires the canonical host Planet BodySeed.',
      );
    }

    assertPositiveFinite(
      sourceMassEarth,
      'sourceMassEarth',
    );

    assertPositiveFinite(
      sourceRadiusEarth,
      'sourceRadiusEarth',
    );

    assertPositiveFinite(
      sourceSemiMajorAxisAu,
      'sourceSemiMajorAxisAu',
    );

    if (
      !Number.isFinite(
        sourceEccentricity,
      ) ||
      sourceEccentricity <
        0 ||
      sourceEccentricity >=
        1
    ) {
      throw new RangeError(
        'sourceEccentricity must be finite and in [0, 1).',
      );
    }

    assertPositiveFinite(
      sourceGravitatingMassSolar,
      'sourceGravitatingMassSolar',
    );

    assertNonNegativeFinite(
      hillSphereRadiusPlanetRadii,
      'hillSphereRadiusPlanetRadii',
    );

    assertUnitInterval(
      satelliteCapacityIndex01,
      'satelliteCapacityIndex01',
    );

    if (
      !Number.isInteger(
        moonCount,
      ) ||
      moonCount <
        0
    ) {
      throw new RangeError(
        'moonCount must be a non-negative integer.',
      );
    }

    if (
      satelliteCapacityIndex01 ===
        0 &&
      moonCount !==
        0
    ) {
      throw new RangeError(
        'A zero satellite-capacity index cannot carry modeled moons.',
      );
    }
  }

  get hasMoons():
    boolean {

    return this
      .moonCount >
      0;
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

function assertUnitInterval(
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
    value >
      1
  ) {
    throw new RangeError(
      `${propertyName} must be finite and in [0, 1]: ${value}.`,
    );
  }
}
