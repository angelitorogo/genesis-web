import {
  type GalaxyStructure,
} from './galaxy-structure';

const SIGNED_LONG_MAX =
  (1n << 63n) -
  1n;

/**
 * Baseline physical properties of a galaxy.
 *
 * These values describe procedural Ground Truth and are independent of
 * observation/discovery state.
 */
export class GalaxyPhysicalProperties {

  constructor(
    readonly ageBillionYears:
      number,

    readonly diameterLightYears:
      number,

    readonly totalMassSolarMasses:
      number,

    readonly stellarPopulation:
      bigint,

    readonly metallicitySolarRatio:
      number,

    readonly starFormationRateSolarMassesPerYear:
      number,

    readonly structure:
      GalaxyStructure,
  ) {
    assertFinitePositive(
      ageBillionYears,
      'ageBillionYears',
    );

    assertFinitePositive(
      diameterLightYears,
      'diameterLightYears',
    );

    assertFinitePositive(
      totalMassSolarMasses,
      'totalMassSolarMasses',
    );

    if (
      stellarPopulation <=
        0n ||
      stellarPopulation >
        SIGNED_LONG_MAX
    ) {
      throw new RangeError(
        `stellarPopulation must be a positive signed Long: ${stellarPopulation}.`,
      );
    }

    assertFiniteNonNegative(
      metallicitySolarRatio,
      'metallicitySolarRatio',
    );

    assertFiniteNonNegative(
      starFormationRateSolarMassesPerYear,
      'starFormationRateSolarMassesPerYear',
    );
  }
}

function assertFinitePositive(
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

function assertFiniteNonNegative(
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
      0
  ) {
    throw new RangeError(
      `${propertyName} must be finite and non-negative: ${value}.`,
    );
  }
}