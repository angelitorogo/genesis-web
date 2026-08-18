/**
 * Point-12.4 intrinsic Ground Truth for one open stellar cluster.
 *
 * These values are aggregate cluster properties. They do not materialize
 * individual stars and they do not imply that observation has measured them.
 */
export class OpenClusterPhysicalProperties {

  constructor(
    readonly stellarCount:
      number,

    readonly massSolarMasses:
      number,

    readonly ageMillionYears:
      number,

    readonly metallicitySolarRatio:
      number,

    readonly halfMassRadiusParsecs:
      number,

    readonly tidalRadiusParsecs:
      number,

    readonly binaryFraction:
      number,

    readonly boundFraction:
      number,
  ) {
    if (
      !Number.isSafeInteger(
        stellarCount,
      ) ||
      stellarCount <=
        0
    ) {
      throw new RangeError(
        'stellarCount must be a positive safe integer.',
      );
    }

    requirePositiveFinite(
      massSolarMasses,
      'massSolarMasses',
    );

    requirePositiveFinite(
      ageMillionYears,
      'ageMillionYears',
    );

    if (
      !Number.isFinite(
        metallicitySolarRatio,
      ) ||
      metallicitySolarRatio <
        0
    ) {
      throw new RangeError(
        'metallicitySolarRatio must be finite and non-negative.',
      );
    }

    requirePositiveFinite(
      halfMassRadiusParsecs,
      'halfMassRadiusParsecs',
    );

    requirePositiveFinite(
      tidalRadiusParsecs,
      'tidalRadiusParsecs',
    );

    if (
      tidalRadiusParsecs <=
      halfMassRadiusParsecs
    ) {
      throw new RangeError(
        'tidalRadiusParsecs must be greater than halfMassRadiusParsecs.',
      );
    }

    requireNormalized(
      binaryFraction,
      'binaryFraction',
    );

    requireNormalized(
      boundFraction,
      'boundFraction',
    );
  }
}

function requirePositiveFinite(
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
      `${propertyName} must be finite and greater than 0.`,
    );
  }
}

function requireNormalized(
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
      `${propertyName} must be finite and in range [0, 1].`,
    );
  }
}
