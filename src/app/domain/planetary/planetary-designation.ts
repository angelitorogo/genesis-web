import {
  type BodyLocator,
} from '../generation/procedural-locator';

import {
  type BodySeed,
} from '../seed/hierarchical-seeds';

import {
  type StellarDesignation,
} from '../stellar/stellar-designation';

/**
 * Point-18.8 human/technical designation attached to one already-frozen mature
 * planet identity.
 *
 * The designation is deliberately identity-only: it does not carry physical
 * planet properties, discovery state or a new seed. The human suffix is layered
 * over the frozen point-15.6 stellar-system designation while the technical code
 * also retains the canonical point-18.2 BodySeed for unambiguous regeneration.
 */
export class PlanetaryDesignation {

  readonly name:
    string;

  readonly proceduralCode:
    string;

  constructor(
    readonly systemDesignation:
      StellarDesignation,

    readonly planetOrdinal:
      number,

    readonly bodyLocator:
      BodyLocator,

    readonly bodySeed:
      BodySeed,

    readonly catalogSuffix:
      string,
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
        'Point-18.8 planet designations must use the BodyLocator belonging to planetOrdinal.',
      );
    }

    if (
      bodySeed.kind !==
      'body'
    ) {
      throw new RangeError(
        'PlanetaryDesignation requires a BodySeed.',
      );
    }

    if (
      planetOrdinal >
      25
    ) {
      throw new RangeError(
        'Point-18.8 V1 supports at most 25 lettered planet designations (b..z).',
      );
    }

    const expectedCatalogSuffix =
      String.fromCharCode(
        'a'.charCodeAt(0) +
        planetOrdinal,
      );

    if (
      catalogSuffix !==
      expectedCatalogSuffix
    ) {
      throw new RangeError(
        `Point-18.8 V1 catalogSuffix for planetOrdinal ${planetOrdinal} must be ${expectedCatalogSuffix}.`,
      );
    }

    this.name =
      `${systemDesignation.name} ${catalogSuffix}`;

    this.proceduralCode =
      `${systemDesignation.proceduralCode}` +
      `-P${planetOrdinal}` +
      `-${catalogSuffix}` +
      `-BODY-${bodySeed.normalizedValue}`;
  }
}
