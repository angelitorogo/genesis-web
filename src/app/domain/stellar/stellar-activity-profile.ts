import {
  type StellarActivityRegime,
  StellarActivityRegime as StellarActivityRegimes,
} from './stellar-activity-regime';

/**
 * Point-15.4 baseline ordinary stellar magnetic-activity and flare statistics.
 *
 * magneticActivityIndex is a dimensionless V1 generator quantity in [0, 1].
 * flareRatePerDay is an average occurrence rate, while typical/max flare energy
 * are expressed in joules. These are statistical Ground-Truth properties, not
 * an event schedule and not observed knowledge.
 *
 * Compact remnants deliberately use ordinaryFlareModelApplicable=false and
 * null activity/flare fields. V1 does not pretend that white-dwarf magnetic
 * variability, neutron-star magnetospheric bursts or black-hole accretion are
 * ordinary photospheric stellar flares. Specialized compact-remnant behaviour
 * can be modeled later without changing this contract.
 */
export class StellarActivityProfile {

  constructor(
    readonly ordinaryFlareModelApplicable:
      boolean,

    readonly magneticActivityIndex:
      number | null,

    readonly regime:
      StellarActivityRegime | null,

    readonly flareRatePerDay:
      number | null,

    readonly typicalFlareEnergyJoules:
      number | null,

    readonly maximumFlareEnergyJoules:
      number | null,
  ) {
    if (
      !ordinaryFlareModelApplicable
    ) {
      if (
        magneticActivityIndex !==
          null ||
        regime !==
          null ||
        flareRatePerDay !==
          null ||
        typicalFlareEnergyJoules !==
          null ||
        maximumFlareEnergyJoules !==
          null
      ) {
        throw new RangeError(
          'Non-applicable ordinary flare profiles must expose null activity and flare values.',
        );
      }

      return;
    }

    assertUnitInterval(
      magneticActivityIndex,
      'magneticActivityIndex',
    );

    if (
      regime ===
      null
    ) {
      throw new RangeError(
        'Applicable ordinary flare profiles require a StellarActivityRegime.',
      );
    }

    const expectedRegime =
      StellarActivityRegimes
        .fromActivityIndex(
          magneticActivityIndex,
        );

    if (
      regime.name !==
      expectedRegime.name
    ) {
      throw new RangeError(
        'StellarActivityRegime must match magneticActivityIndex.',
      );
    }

    assertNonNegativeFinite(
      flareRatePerDay,
      'flareRatePerDay',
    );

    assertPositiveFinite(
      typicalFlareEnergyJoules,
      'typicalFlareEnergyJoules',
    );

    assertPositiveFinite(
      maximumFlareEnergyJoules,
      'maximumFlareEnergyJoules',
    );

    if (
      maximumFlareEnergyJoules <
      typicalFlareEnergyJoules
    ) {
      throw new RangeError(
        'maximumFlareEnergyJoules must be greater than or equal to typicalFlareEnergyJoules.',
      );
    }
  }

  get hasModeledFlares():
    boolean {

    return (
      this.ordinaryFlareModelApplicable &&
      this.flareRatePerDay !==
        null &&
      this.flareRatePerDay >
        0
    );
  }
}

function assertUnitInterval(
  value:
    number | null,

  propertyName:
    string,
): asserts value is number {

  if (
    value ===
      null ||
    !Number.isFinite(
      value,
    ) ||
    value <
      0 ||
    value >
      1
  ) {
    throw new RangeError(
      `${propertyName} must be finite and in [0, 1].`,
    );
  }
}

function assertNonNegativeFinite(
  value:
    number | null,

  propertyName:
    string,
): asserts value is number {

  if (
    value ===
      null ||
    !Number.isFinite(
      value,
    ) ||
    value <
      0
  ) {
    throw new RangeError(
      `${propertyName} must be finite and non-negative.`,
    );
  }
}

function assertPositiveFinite(
  value:
    number | null,

  propertyName:
    string,
): asserts value is number {

  if (
    value ===
      null ||
    !Number.isFinite(
      value,
    ) ||
    value <=
      0
  ) {
    throw new RangeError(
      `${propertyName} must be finite and greater than 0.`,
    );
  }
}
