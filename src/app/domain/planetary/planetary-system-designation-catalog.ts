import {
  type SystemLocator,
} from '../generation/procedural-locator';

import {
  type StellarDesignation,
} from '../stellar/stellar-designation';

import {
  type PlanetaryDesignation,
} from './planetary-designation';

/**
 * Point-18.8 ordered designation catalog for one mature planetary system.
 *
 * Entries are contiguous by planetOrdinal and preserve the exact BodyLocator /
 * BodySeed identities selected by point 18.2. Naming is therefore a projection
 * over an existing planetary architecture, never a source of new identity.
 */
export class PlanetarySystemDesignationCatalog {

  readonly designations:
    readonly PlanetaryDesignation[];

  constructor(
    readonly systemLocator:
      SystemLocator,

    readonly systemDesignation:
      StellarDesignation,

    readonly planetCount:
      number,

    designations:
      readonly PlanetaryDesignation[],
  ) {
    if (
      !Number.isInteger(
        planetCount,
      ) ||
      planetCount <
        0
    ) {
      throw new RangeError(
        'planetCount must be a non-negative integer.',
      );
    }

    if (
      designations.length !==
      planetCount
    ) {
      throw new RangeError(
        'Point-18.8 requires exactly one designation per mature planet identity.',
      );
    }

    const names =
      new Set<string>();

    const proceduralCodes =
      new Set<string>();

    const bodySeeds =
      new Set<string>();

    for (
      let index = 0;
      index <
        designations.length;
      index += 1
    ) {
      const designation =
        designations[index];

      if (
        designation.planetOrdinal !==
        index +
          1
      ) {
        throw new RangeError(
          'Point-18.8 designations must be contiguous and ordered by planetOrdinal.',
        );
      }

      if (
        !sameSystemLocator(
          systemLocator,
          designation.bodyLocator,
        )
      ) {
        throw new RangeError(
          'Every point-18.8 designation must belong to the catalog SystemLocator.',
        );
      }

      if (
        !sameSystemDesignation(
          systemDesignation,
          designation.systemDesignation,
        )
      ) {
        throw new RangeError(
          'Every point-18.8 planet designation must be layered over the catalog stellar-system designation.',
        );
      }

      if (
        names.has(
          designation.name,
        ) ||
        proceduralCodes.has(
          designation.proceduralCode,
        ) ||
        bodySeeds.has(
          designation.bodySeed.normalizedValue,
        )
      ) {
        throw new RangeError(
          'Point-18.8 planet designations must have unique human names, technical codes and BodySeeds within the system.',
        );
      }

      names.add(
        designation.name,
      );

      proceduralCodes.add(
        designation.proceduralCode,
      );

      bodySeeds.add(
        designation.bodySeed.normalizedValue,
      );
    }

    this.designations =
      Object.freeze([
        ...designations,
      ]);
  }

  get hasDesignations():
    boolean {

    return this
      .designations
      .length >
      0;
  }
}

function sameSystemLocator(
  systemLocator:
    SystemLocator,

  bodyLocator:
    PlanetaryDesignation['bodyLocator'],
): boolean {

  return (
    systemLocator.galaxyIndex ===
      bodyLocator.galaxyIndex &&
    systemLocator.sectorKey ===
      bodyLocator.sectorKey &&
    systemLocator.galacticObjectIndex ===
      bodyLocator.galacticObjectIndex
  );
}

function sameSystemDesignation(
  left:
    StellarDesignation,

  right:
    StellarDesignation,
): boolean {

  return (
    left.name ===
      right.name &&
    left.proceduralCode ===
      right.proceduralCode
  );
}
