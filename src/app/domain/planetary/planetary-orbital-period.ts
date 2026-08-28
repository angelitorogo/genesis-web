import {
  type BodyLocator,
} from '../generation/procedural-locator';

import {
  type BodySeed,
} from '../seed/hierarchical-seeds';

const DAYS_PER_JULIAN_YEAR =
  365.25;

const CONSISTENCY_TOLERANCE =
  1e-12;

/**
 * Point-18.4 Keplerian orbital period attached to one mature planet identity.
 *
 * The period is derived from the frozen point-18.3 semi-major axis and the V1
 * gravitating host mass. Planet mass is intentionally omitted because phase 19
 * has not yet materialized final planetary masses and the stellar term dominates
 * the two-body period at the precision claimed by this contract.
 */
export class PlanetaryOrbitalPeriod {

  constructor(
    readonly planetOrdinal:
      number,

    readonly bodyLocator:
      BodyLocator,

    readonly bodySeed:
      BodySeed,

    readonly sourceSemiMajorAxisAu:
      number,

    readonly gravitatingMassSolar:
      number,

    readonly periodYears:
      number,

    readonly periodDays:
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
        'Point-18.4 orbital periods must use the BodyLocator belonging to planetOrdinal.',
      );
    }

    if (
      bodySeed.kind !==
      'body'
    ) {
      throw new RangeError(
        'PlanetaryOrbitalPeriod requires a BodySeed.',
      );
    }

    assertPositiveFinite(
      sourceSemiMajorAxisAu,
      'sourceSemiMajorAxisAu',
    );

    assertPositiveFinite(
      gravitatingMassSolar,
      'gravitatingMassSolar',
    );

    assertPositiveFinite(
      periodYears,
      'periodYears',
    );

    assertPositiveFinite(
      periodDays,
      'periodDays',
    );

    const expectedDays =
      periodYears *
      DAYS_PER_JULIAN_YEAR;

    if (
      !approximatelyEqual(
        periodDays,
        expectedDays,
      )
    ) {
      throw new RangeError(
        'periodDays must equal periodYears * 365.25.',
      );
    }

    const expectedPeriodYears =
      Math.sqrt(
        sourceSemiMajorAxisAu **
          3 /
        gravitatingMassSolar,
      );

    if (
      !approximatelyEqual(
        periodYears,
        expectedPeriodYears,
      )
    ) {
      throw new RangeError(
        'Point-18.4 periodYears must satisfy the frozen V1 Kepler relation P^2 = a^3 / M.',
      );
    }
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

function approximatelyEqual(
  first:
    number,

  second:
    number,
): boolean {

  return (
    Math.abs(
      first -
      second,
    ) <=
    CONSISTENCY_TOLERANCE *
      Math.max(
        1,
        Math.abs(
          first,
        ),
        Math.abs(
          second,
        ),
      )
  );
}
