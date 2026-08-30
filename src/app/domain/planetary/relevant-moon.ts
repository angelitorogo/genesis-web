import {
  type BodyLocator,
} from '../generation/procedural-locator';

import {
  type BodySeed,
} from '../seed/hierarchical-seeds';

import {
  type MoonOrbitalElements,
} from './moon-orbital-elements';

import {
  type MoonPhysicalProperties,
} from './moon-physical-properties';

/**
 * Point-21.3 individually materialized relevant natural satellite.
 *
 * `moonOrdinal` is a stable local ordinal under the host Planet and is sufficient
 * for deterministic point-21.3 property derivation. It is deliberately not a
 * MoonLocator or MoonSeed. Point 21.8 remains responsible for seeds and
 * designations without changing these frozen physical/orbital values.
 */
export class RelevantMoon {

  constructor(
    readonly hostPlanetOrdinal:
      number,

    readonly hostPlanetLocator:
      BodyLocator,

    readonly hostPlanetSeed:
      BodySeed,

    readonly moonOrdinal:
      number,

    readonly physicalProperties:
      MoonPhysicalProperties,

    readonly orbit:
      MoonOrbitalElements,
  ) {
    if (
      !Number.isInteger(
        hostPlanetOrdinal,
      ) ||
      hostPlanetOrdinal <=
        0
    ) {
      throw new RangeError(
        'RelevantMoon hostPlanetOrdinal must be a positive integer.',
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
        'RelevantMoon must preserve the canonical host Planet BodyLocator.',
      );
    }

    if (
      hostPlanetSeed.kind !==
      'body'
    ) {
      throw new RangeError(
        'RelevantMoon requires the canonical host Planet BodySeed as parent context.',
      );
    }

    if (
      !Number.isInteger(
        moonOrdinal,
      ) ||
      moonOrdinal <=
        0
    ) {
      throw new RangeError(
        'RelevantMoon moonOrdinal must be a positive integer.',
      );
    }

    if (
      physicalProperties
        .hostPlanetOrdinal !==
        hostPlanetOrdinal ||
      physicalProperties
        .moonOrdinal !==
        moonOrdinal ||
      orbit
        .hostPlanetOrdinal !==
        hostPlanetOrdinal ||
      orbit
        .moonOrdinal !==
        moonOrdinal
    ) {
      throw new RangeError(
        'RelevantMoon physical/orbital products must preserve the exact host/moon ordinals.',
      );
    }
  }

  get massEarth():
    number {

    return this
      .physicalProperties
      .massEarth;
  }

  get radiusEarth():
    number {

    return this
      .physicalProperties
      .radiusEarth;
  }

  get meanDensityGramsPerCubicCentimeter():
    number {

    return this
      .physicalProperties
      .meanDensityGramsPerCubicCentimeter;
  }

  get surfaceGravityEarth():
    number {

    return this
      .physicalProperties
      .surfaceGravityEarth;
  }

  get semiMajorAxisPlanetRadii():
    number {

    return this
      .orbit
      .semiMajorAxisPlanetRadii;
  }

  get orbitalPeriodDays():
    number {

    return this
      .orbit
      .orbitalPeriodDays;
  }
}
