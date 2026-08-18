import {
  StarFormationActivity,
  type StarFormationActivity as StarFormationActivityValue,
} from './star-formation-activity';

/**
 * Regenerable point-12.3 Ground Truth describing the young massive stellar
 * population currently sustaining an H II region.
 *
 * The profile intentionally contains aggregate physical quantities only. It
 * does not materialize an open cluster (12.4), grant Discovery Points (12.7),
 * store observation state or contain render data (12.8).
 */
export class StarFormationProfile {

  constructor(
    readonly activity:
      StarFormationActivityValue,

    readonly starFormationRateSolarMassesPerMillionYears:
      number,

    readonly youngStellarAgeMillionYears:
      number,

    readonly ionizingStarCount:
      number,

    readonly ionizingPhotonRatePerSecond:
      number,
  ) {
    if (
      !Object.values(
        StarFormationActivity,
      ).includes(
        activity,
      )
    ) {
      throw new RangeError(
        `Unknown StarFormationActivity: ${String(activity)}.`,
      );
    }

    requirePositiveFinite(
      starFormationRateSolarMassesPerMillionYears,
      'starFormationRateSolarMassesPerMillionYears',
    );

    requirePositiveFinite(
      youngStellarAgeMillionYears,
      'youngStellarAgeMillionYears',
    );

    requirePositiveSafeInteger(
      ionizingStarCount,
      'ionizingStarCount',
    );

    requirePositiveFinite(
      ionizingPhotonRatePerSecond,
      'ionizingPhotonRatePerSecond',
    );
  }
}

function requirePositiveFinite(
  value:
    number,

  name:
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
      `${name} must be finite and positive.`,
    );
  }
}

function requirePositiveSafeInteger(
  value:
    number,

  name:
    string,
): void {

  if (
    !Number.isSafeInteger(
      value,
    ) ||
    value <=
      0
  ) {
    throw new RangeError(
      `${name} must be a positive safe integer.`,
    );
  }
}
