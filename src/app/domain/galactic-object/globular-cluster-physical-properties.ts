/**
 * Point-12.5 intrinsic Ground Truth for one globular stellar cluster.
 *
 * These values are aggregate properties. They do not materialize individual
 * member stars and they do not imply that observation has measured them.
 */
export class GlobularClusterPhysicalProperties {

  constructor(
    readonly stellarCount:
      number,

    readonly massSolarMasses:
      number,

    readonly ageBillionYears:
      number,

    readonly metallicitySolarRatio:
      number,

    readonly coreRadiusParsecs:
      number,

    readonly halfLightRadiusParsecs:
      number,

    readonly tidalRadiusParsecs:
      number,

    readonly centralConcentration:
      number,

    readonly stellarRemnantFraction:
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
      ageBillionYears,
      'ageBillionYears',
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
      coreRadiusParsecs,
      'coreRadiusParsecs',
    );

    requirePositiveFinite(
      halfLightRadiusParsecs,
      'halfLightRadiusParsecs',
    );

    if (
      halfLightRadiusParsecs <=
      coreRadiusParsecs
    ) {
      throw new RangeError(
        'halfLightRadiusParsecs must be greater than coreRadiusParsecs.',
      );
    }

    requirePositiveFinite(
      tidalRadiusParsecs,
      'tidalRadiusParsecs',
    );

    if (
      tidalRadiusParsecs <=
      halfLightRadiusParsecs
    ) {
      throw new RangeError(
        'tidalRadiusParsecs must be greater than halfLightRadiusParsecs.',
      );
    }

    requireNormalized(
      centralConcentration,
      'centralConcentration',
    );

    requireNormalized(
      stellarRemnantFraction,
      'stellarRemnantFraction',
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
