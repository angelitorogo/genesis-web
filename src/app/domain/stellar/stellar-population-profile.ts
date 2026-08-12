const FRACTION_SUM_TOLERANCE =
  1e-9;

/**
 * Broad V1 stellar-population regime derived from characteristic local age
 * and galaxy-wide star-formation activity.
 */
export enum StellarPopulationRegime {
  YOUNG_ACTIVE =
    'YOUNG_ACTIVE',

  ACTIVE =
    'ACTIVE',

  MIXED =
    'MIXED',

  QUIESCENT =
    'QUIESCENT',

  OLD_QUIESCENT =
    'OLD_QUIESCENT',
}

/**
 * Statistical environmental Ground Truth for stellar populations.
 *
 * youngStarFraction, matureStarFraction and oldStarFraction form an
 * exhaustive age-cohort partition and therefore sum to 1.
 *
 * The mass/remnant propensities are independent favorability weights in
 * [0, 1]. They are not fractions of the same partition.
 *
 * This model does not materialize individual stars, an IMF or spectral
 * classes.
 */
export class StellarPopulationProfile {

  constructor(
    readonly characteristicStellarAgeBillionYears:
      number,

    readonly formationActivityIndex:
      number,

    readonly youngStarFraction:
      number,

    readonly matureStarFraction:
      number,

    readonly oldStarFraction:
      number,

    readonly lowMassStarPropensity:
      number,

    readonly solarLikeStarPropensity:
      number,

    readonly highMassStarPropensity:
      number,

    readonly stellarRemnantPropensity:
      number,

    readonly regime:
      StellarPopulationRegime,
  ) {
    if (
      !Number.isFinite(
        characteristicStellarAgeBillionYears,
      ) ||
      characteristicStellarAgeBillionYears <=
        0
    ) {
      throw new RangeError(
        'characteristicStellarAgeBillionYears must be finite and greater than 0.',
      );
    }

    assertNormalized(
      formationActivityIndex,
      'formationActivityIndex',
    );

    assertNormalized(
      youngStarFraction,
      'youngStarFraction',
    );

    assertNormalized(
      matureStarFraction,
      'matureStarFraction',
    );

    assertNormalized(
      oldStarFraction,
      'oldStarFraction',
    );

    assertNormalized(
      lowMassStarPropensity,
      'lowMassStarPropensity',
    );

    assertNormalized(
      solarLikeStarPropensity,
      'solarLikeStarPropensity',
    );

    assertNormalized(
      highMassStarPropensity,
      'highMassStarPropensity',
    );

    assertNormalized(
      stellarRemnantPropensity,
      'stellarRemnantPropensity',
    );

    const cohortSum =
      youngStarFraction +
      matureStarFraction +
      oldStarFraction;

    if (
      Math.abs(
        cohortSum -
        1.0,
      ) >
      FRACTION_SUM_TOLERANCE
    ) {
      throw new RangeError(
        `Stellar age cohort fractions must sum to 1.0 ± ${FRACTION_SUM_TOLERANCE}: ${cohortSum}.`,
      );
    }

    if (
      !Object.values(
        StellarPopulationRegime,
      ).includes(
        regime,
      )
    ) {
      throw new RangeError(
        `Unknown StellarPopulationRegime: ${String(regime)}.`,
      );
    }
  }
}

function assertNormalized(
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
      `${propertyName} must be finite and in range [0, 1]: ${value}.`,
    );
  }
}
