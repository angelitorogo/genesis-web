import {
  type BodyLocator,
  type MoonLocator,
} from '../generation/procedural-locator';

import {
  type BodySeed,
  type MoonSeed,
} from '../seed/hierarchical-seeds';

import {
  type MoonDesignation,
} from './moon-designation';

/**
 * Point-21.8 canonical identity for one modeled moon.
 *
 * The host BodyLocator/BodySeed remain parent context. MoonLocator/MoonSeed are
 * the first identity level owned by an individual moon and are frozen independently
 * of whether the moon has detailed point-21.3 physical materialization.
 */
export class MoonIdentity {

  constructor(
    readonly hostPlanetOrdinal:
      number,

    readonly hostPlanetLocator:
      BodyLocator,

    readonly hostPlanetSeed:
      BodySeed,

    readonly moonOrdinal:
      number,

    readonly locator:
      MoonLocator,

    readonly seed:
      MoonSeed,

    readonly designation:
      MoonDesignation,
  ) {
    if (
      !Number.isInteger(
        hostPlanetOrdinal,
      ) ||
      hostPlanetOrdinal <=
        0 ||
      !Number.isInteger(
        moonOrdinal,
      ) ||
      moonOrdinal <=
        0
    ) {
      throw new RangeError(
        'MoonIdentity hostPlanetOrdinal and moonOrdinal must be positive integers.',
      );
    }

    if (
      hostPlanetLocator.bodyIndex !==
      BigInt(
        hostPlanetOrdinal -
          1,
      ) ||
      hostPlanetSeed.kind !==
      'body'
    ) {
      throw new RangeError(
        'MoonIdentity requires the canonical host Planet BodyLocator/BodySeed.',
      );
    }

    if (
      locator.galaxyIndex !==
        hostPlanetLocator.galaxyIndex ||
      locator.sectorKey !==
        hostPlanetLocator.sectorKey ||
      locator.galacticObjectIndex !==
        hostPlanetLocator.galacticObjectIndex ||
      locator.bodyIndex !==
        hostPlanetLocator.bodyIndex ||
      locator.moonIndex !==
        BigInt(
          moonOrdinal -
            1,
        )
    ) {
      throw new RangeError(
        'MoonIdentity locator must extend the exact host BodyLocator with moonIndex = moonOrdinal - 1.',
      );
    }

    if (
      seed.kind !==
      'moon'
    ) {
      throw new RangeError(
        'MoonIdentity requires a MoonSeed.',
      );
    }

    if (
      designation.hostPlanetDesignation.planetOrdinal !==
        hostPlanetOrdinal ||
      designation.hostPlanetDesignation.bodyLocator !==
        hostPlanetLocator ||
      designation.hostPlanetDesignation.bodySeed !==
        hostPlanetSeed ||
      designation.moonOrdinal !==
        moonOrdinal ||
      designation.moonLocator !==
        locator ||
      designation.moonSeed !==
        seed
    ) {
      throw new RangeError(
        'MoonIdentity designation must preserve the exact MoonLocator/MoonSeed identity.',
      );
    }
  }
}
