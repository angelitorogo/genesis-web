import {
  type StellarRotationRegime,
  StellarRotationRegime as StellarRotationRegimes,
} from './stellar-rotation-regime';

import {
  type StellarStabilityRegime,
  StellarStabilityRegime as StellarStabilityRegimes,
} from './stellar-stability-regime';

/**
 * Point-15.5 ordinary stellar rotation and surface/rotational stability profile.
 *
 * rotationPeriodDays is the modeled sidereal-equivalent surface period in Earth
 * days. stabilityIndex is a dimensionless V1 proxy in [0, 1], where larger
 * values mean a more slowly varying/rotationally settled ordinary-star baseline.
 * It deliberately combines current evolutionary state, ordinary magnetic
 * activity and rotation without pretending to be a detailed pulsation or
 * asteroseismic model.
 *
 * Compact remnants use ordinaryRotationModelApplicable=false with all remaining
 * fields null. Their white-dwarf/neutron-star rotation and black-hole Kerr spin
 * require specialized current-radius/spin contracts and are not inferred from
 * the point-15.1 progenitor/reference radius.
 */
export class StellarRotationStabilityProfile {

  constructor(
    readonly ordinaryRotationModelApplicable:
      boolean,

    readonly rotationPeriodDays:
      number | null,

    readonly rotationRegime:
      StellarRotationRegime | null,

    readonly stabilityIndex:
      number | null,

    readonly stabilityRegime:
      StellarStabilityRegime | null,
  ) {
    if (
      !ordinaryRotationModelApplicable
    ) {
      if (
        rotationPeriodDays !==
          null ||
        rotationRegime !==
          null ||
        stabilityIndex !==
          null ||
        stabilityRegime !==
          null
      ) {
        throw new RangeError(
          'Non-applicable ordinary rotation profiles must expose null rotation and stability values.',
        );
      }

      return;
    }

    assertPositiveFinite(
      rotationPeriodDays,
      'rotationPeriodDays',
    );

    if (
      rotationRegime ===
      null
    ) {
      throw new RangeError(
        'Applicable ordinary rotation profiles require a StellarRotationRegime.',
      );
    }

    const expectedRotationRegime =
      StellarRotationRegimes
        .fromRotationPeriodDays(
          rotationPeriodDays,
        );

    if (
      rotationRegime.name !==
      expectedRotationRegime.name
    ) {
      throw new RangeError(
        'StellarRotationRegime must match rotationPeriodDays.',
      );
    }

    assertUnitInterval(
      stabilityIndex,
      'stabilityIndex',
    );

    if (
      stabilityRegime ===
      null
    ) {
      throw new RangeError(
        'Applicable ordinary rotation profiles require a StellarStabilityRegime.',
      );
    }

    const expectedStabilityRegime =
      StellarStabilityRegimes
        .fromStabilityIndex(
          stabilityIndex,
        );

    if (
      stabilityRegime.name !==
      expectedStabilityRegime.name
    ) {
      throw new RangeError(
        'StellarStabilityRegime must match stabilityIndex.',
      );
    }
  }

  get rotationCyclesPerDay():
    number | null {

    if (
      this.rotationPeriodDays ===
      null
    ) {
      return null;
    }

    return 1 /
      this.rotationPeriodDays;
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
