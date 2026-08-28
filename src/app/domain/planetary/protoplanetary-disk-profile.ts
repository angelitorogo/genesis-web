import {
  ProtoplanetaryDiskStage,
} from './protoplanetary-disk-stage';

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-17.2 deterministic bulk protoplanetary-disk envelope around one young
 * stellar/substellar component.
 *
 * The profile is deliberately axisymmetric and composition-agnostic. It owns
 * only the global primordial disk reservoir and its coarse radial/thermal
 * structure. Point 17.3 will partition this envelope into gas, dust, gaps and
 * condensation regions without changing the frozen point-17.2 bulk vector.
 */
export class ProtoplanetaryDiskProfile {

  constructor(
    readonly stage:
      ProtoplanetaryDiskStage,

    readonly ageMillionYears:
      number,

    readonly dispersalAgeMillionYears:
      number,

    readonly evolutionProgress01:
      number,

    readonly centralMassSolar:
      number,

    readonly diskMassSolar:
      number,

    readonly diskToCentralMassRatio:
      number,

    readonly innerRadiusAu:
      number,

    readonly characteristicRadiusAu:
      number,

    readonly outerRadiusAu:
      number,

    readonly referenceTemperatureAt1AuKelvin:
      number,

    readonly surfaceDensityPowerLawExponent:
      number,

    readonly aspectRatioAt1Au:
      number,

    readonly accretionRateSolarMassPerYear:
      number,
  ) {
    assertNonNegativeFinite(
      ageMillionYears,
      'ageMillionYears',
    );

    assertPositiveFinite(
      dispersalAgeMillionYears,
      'dispersalAgeMillionYears',
    );

    if (
      ageMillionYears -
        dispersalAgeMillionYears >
      CONSISTENCY_TOLERANCE
    ) {
      throw new RangeError(
        'ProtoplanetaryDiskProfile age cannot exceed its dispersal age.',
      );
    }

    assertNormalized(
      evolutionProgress01,
      'evolutionProgress01',
    );

    const expectedProgress =
      clamp01(
        ageMillionYears /
          dispersalAgeMillionYears,
      );

    if (
      !approximatelyEqual(
        evolutionProgress01,
        expectedProgress,
      )
    ) {
      throw new RangeError(
        'evolutionProgress01 must equal ageMillionYears / dispersalAgeMillionYears.',
      );
    }

    assertPositiveFinite(
      centralMassSolar,
      'centralMassSolar',
    );

    assertPositiveFinite(
      diskMassSolar,
      'diskMassSolar',
    );

    if (
      diskMassSolar >=
      centralMassSolar
    ) {
      throw new RangeError(
        'diskMassSolar must remain below the central component mass in V1.',
      );
    }

    assertPositiveFinite(
      diskToCentralMassRatio,
      'diskToCentralMassRatio',
    );

    if (
      diskToCentralMassRatio >=
      1
    ) {
      throw new RangeError(
        'diskToCentralMassRatio must remain below 1 in V1.',
      );
    }

    if (
      !approximatelyEqual(
        diskToCentralMassRatio,
        diskMassSolar /
          centralMassSolar,
      )
    ) {
      throw new RangeError(
        'diskToCentralMassRatio must match diskMassSolar / centralMassSolar.',
      );
    }

    assertPositiveFinite(
      innerRadiusAu,
      'innerRadiusAu',
    );

    assertPositiveFinite(
      characteristicRadiusAu,
      'characteristicRadiusAu',
    );

    assertPositiveFinite(
      outerRadiusAu,
      'outerRadiusAu',
    );

    if (
      !(
        innerRadiusAu <
          characteristicRadiusAu &&
        characteristicRadiusAu <
          outerRadiusAu
      )
    ) {
      throw new RangeError(
        'Disk radii must satisfy innerRadiusAu < characteristicRadiusAu < outerRadiusAu.',
      );
    }

    assertPositiveFinite(
      referenceTemperatureAt1AuKelvin,
      'referenceTemperatureAt1AuKelvin',
    );

    if (
      !Number.isFinite(
        surfaceDensityPowerLawExponent,
      ) ||
      surfaceDensityPowerLawExponent <
        0.5 ||
      surfaceDensityPowerLawExponent >
        1.5
    ) {
      throw new RangeError(
        'surfaceDensityPowerLawExponent must be finite and in [0.5, 1.5].',
      );
    }

    if (
      !Number.isFinite(
        aspectRatioAt1Au,
      ) ||
      aspectRatioAt1Au <
        0.01 ||
      aspectRatioAt1Au >
        0.20
    ) {
      throw new RangeError(
        'aspectRatioAt1Au must be finite and in [0.01, 0.20].',
      );
    }

    assertNonNegativeFinite(
      accretionRateSolarMassPerYear,
      'accretionRateSolarMassPerYear',
    );
  }

  get isEmbedded():
    boolean {

    return (
      this.stage ===
      ProtoplanetaryDiskStage.EMBEDDED_ACCRETION_DISK
    );
  }

  get isDispersing():
    boolean {

    return (
      this.stage ===
      ProtoplanetaryDiskStage.DISPERSING_DISK
    );
  }

  get isActivelyAccreting():
    boolean {

    return (
      this.accretionRateSolarMassPerYear >
      0
    );
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

function assertNonNegativeFinite(
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

function approximatelyEqual(
  left:
    number,

  right:
    number,
): boolean {

  const scale =
    Math.max(
      1,
      Math.abs(
        left,
      ),
      Math.abs(
        right,
      ),
    );

  return (
    Math.abs(
      left -
      right,
    ) <=
    CONSISTENCY_TOLERANCE *
      scale
  );
}

function clamp01(
  value:
    number,
): number {

  return Math.min(
    1,
    Math.max(
      0,
      value,
    ),
  );
}
