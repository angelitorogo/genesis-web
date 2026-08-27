import {
  StellarActivityProfile,
} from '../../domain/stellar/stellar-activity-profile';

import {
  STELLAR_LIFETIME_V1_MAX_AGE_BILLION_YEARS,
  StellarLifetimeProfile,
} from '../../domain/stellar/stellar-lifetime-profile';

import {
  StellarPhysicalProperties,
} from '../../domain/stellar/stellar-physical-properties';

import {
  StellarRotationRegime,
} from '../../domain/stellar/stellar-rotation-regime';

import {
  StellarRotationStabilityProfile,
} from '../../domain/stellar/stellar-rotation-stability-profile';

import {
  StellarStabilityRegime,
} from '../../domain/stellar/stellar-stability-regime';

/**
 * Pure V1 interpretation model for point 15.5.
 *
 * Entropy ownership stays in StellarGenerator. This model receives the two
 * already-generated [0, 1) scatter values and interprets them from current
 * phase-14 state, point-15.1 reference mass, point-15.3 age and point-15.4
 * ordinary magnetic activity.
 */
export class StellarRotationStabilityModel {

  private constructor() {}

  static evaluateV1(
    physicalProperties:
      StellarPhysicalProperties,

    lifetimeProfile:
      StellarLifetimeProfile,

    activityProfile:
      StellarActivityProfile,

    rotationScatter:
      number,

    stabilityScatter:
      number,
  ): StellarRotationStabilityProfile {

    assertUnitDraw(
      rotationScatter,
      'rotationScatter',
    );

    assertUnitDraw(
      stabilityScatter,
      'stabilityScatter',
    );

    if (
      !activityProfile
        .ordinaryFlareModelApplicable ||
      activityProfile
        .magneticActivityIndex ===
        null
    ) {
      throw new RangeError(
        'Ordinary point-15.5 rotation requires an applicable point-15.4 activity profile.',
      );
    }

    const rotationPeriodDays =
      rotationPeriodDaysV1(
        physicalProperties,
        lifetimeProfile,
        activityProfile
          .magneticActivityIndex,
        rotationScatter,
      );

    const rotationRegime =
      StellarRotationRegime
        .fromRotationPeriodDays(
          rotationPeriodDays,
        );

    const stabilityIndex =
      stabilityIndexV1(
        lifetimeProfile,
        activityProfile
          .magneticActivityIndex,
        rotationPeriodDays,
        stabilityScatter,
      );

    const stabilityRegime =
      StellarStabilityRegime
        .fromStabilityIndex(
          stabilityIndex,
        );

    return new StellarRotationStabilityProfile(
      true,
      rotationPeriodDays,
      rotationRegime,
      stabilityIndex,
      stabilityRegime,
    );
  }
}

function rotationPeriodDaysV1(
  physicalProperties:
    StellarPhysicalProperties,

  lifetimeProfile:
    StellarLifetimeProfile,

  magneticActivityIndex:
    number,

  rotationScatter:
    number,
): number {

  const assessment =
    lifetimeProfile
      .evolutionAssessment;

  const stateName =
    assessment
      .evolutionState
      .name;

  const age =
    lifetimeProfile
      .ageBillionYears;

  const scatterFactor =
    lerp(
      0.78,
      1.22,
      rotationScatter,
    );

  if (
    stateName ===
    'BROWN_DWARF'
  ) {
    const familyName =
      assessment
        .brownDwarfClass
        ?.name;

    const basePeriodDays =
      familyName ===
        'L'
        ? 0.35
        : familyName ===
            'T'
          ? 0.25
          : familyName ===
              'Y'
            ? 0.18
            : null;

    if (
      basePeriodDays ===
      null
    ) {
      throw new RangeError(
        'BROWN_DWARF rotation requires an L/T/Y family.',
      );
    }

    const weakSpinUpFactor =
      clamp(
        1 /
        (
          1 +
          0.025 *
            Math.sqrt(
              age,
            )
        ),
        0.75,
        1.0,
      );

    return clamp(
      basePeriodDays *
      weakSpinUpFactor *
      scatterFactor,
      0.05,
      1.50,
    );
  }

  if (
    stateName ===
    'GIANT'
  ) {
    const stageName =
      assessment
        .postMainSequenceStage
        ?.name;

    const basePeriodDays =
      stageName ===
        'ASYMPTOTIC_GIANT_BRANCH'
        ? 180
        : stageName ===
            'RED_GIANT_BRANCH'
          ? 80
          : null;

    if (
      basePeriodDays ===
      null
    ) {
      throw new RangeError(
        'GIANT rotation requires a RED_GIANT_BRANCH or ASYMPTOTIC_GIANT_BRANCH stage.',
      );
    }

    const massFactor =
      clamp(
        1 /
        Math.sqrt(
          physicalProperties
            .currentMassSolar,
        ),
        0.45,
        1.40,
      );

    const activityFactor =
      lerp(
        1.08,
        0.90,
        magneticActivityIndex,
      );

    return (
      basePeriodDays *
      massFactor *
      activityFactor *
      scatterFactor
    );
  }

  if (
    stateName ===
    'SUPERGIANT'
  ) {
    const massFactor =
      clamp(
        3 /
        Math.sqrt(
          physicalProperties
            .currentMassSolar,
        ),
        0.45,
        1.20,
      );

    return (
      35 *
      massFactor *
      lerp(
        1.06,
        0.92,
        magneticActivityIndex,
      ) *
      scatterFactor
    );
  }

  const familyName =
    assessment
      .mainSequenceClass
      ?.name;

  const sqrtAge =
    Math.sqrt(
      age,
    );

  let baselinePeriodDays:
    number;

  switch (
    familyName
  ) {
    case 'O':
      baselinePeriodDays =
        0.65 +
        2.0 *
          sqrtAge;
      break;

    case 'B':
      baselinePeriodDays =
        0.80 +
        2.2 *
          sqrtAge;
      break;

    case 'A':
      baselinePeriodDays =
        0.90 +
        1.8 *
          sqrtAge;
      break;

    case 'F':
      baselinePeriodDays =
        1.40 +
        5.2 *
          sqrtAge;
      break;

    case 'G':
      baselinePeriodDays =
        1.60 +
        10.8 *
          sqrtAge;
      break;

    case 'K':
      baselinePeriodDays =
        1.80 +
        12.2 *
          sqrtAge;
      break;

    case 'M':
      baselinePeriodDays =
        0.45 +
        7.2 *
          sqrtAge;
      break;

    default:
      throw new RangeError(
        `Unsupported MAIN_SEQUENCE family for point-15.5 rotation: ${familyName ?? 'null'}.`,
      );
  }

  const activityCoupling =
    lerp(
      1.08,
      0.88,
      magneticActivityIndex,
    );

  return Math.max(
    0.05,
    baselinePeriodDays *
    activityCoupling *
    scatterFactor,
  );
}

function stabilityIndexV1(
  lifetimeProfile:
    StellarLifetimeProfile,

  magneticActivityIndex:
    number,

  rotationPeriodDays:
    number,

  stabilityScatter:
    number,
): number {

  const assessment =
    lifetimeProfile
      .evolutionAssessment;

  const stateName =
    assessment
      .evolutionState
      .name;

  const rotationSettledFactor =
    clamp01(
      (
        Math.log10(
          rotationPeriodDays,
        ) -
        Math.log10(
          0.05,
        )
      ) /
      (
        Math.log10(
          300,
        ) -
        Math.log10(
          0.05,
        )
      ),
    );

  const quietness =
    1 -
    magneticActivityIndex;

  let baseline:
    number;

  if (
    stateName ===
    'BROWN_DWARF'
  ) {
    const ageSettling =
      clamp01(
        lifetimeProfile
          .ageBillionYears /
        STELLAR_LIFETIME_V1_MAX_AGE_BILLION_YEARS,
      );

    baseline =
      0.28 +
      0.40 *
        quietness +
      0.10 *
        rotationSettledFactor +
      0.08 *
        ageSettling;
  } else if (
    stateName ===
    'GIANT'
  ) {
    const isAsymptotic =
      assessment
        .postMainSequenceStage
        ?.name ===
      'ASYMPTOTIC_GIANT_BRANCH';

    baseline =
      (
        isAsymptotic
          ? 0.28
          : 0.55
      ) +
      (
        isAsymptotic
          ? 0.20
          : 0.22
      ) *
        quietness +
      0.08 *
        rotationSettledFactor;
  } else if (
    stateName ===
    'SUPERGIANT'
  ) {
    baseline =
      0.25 +
      0.22 *
        quietness +
      0.08 *
        rotationSettledFactor;
  } else {
    const familyName =
      assessment
        .mainSequenceClass
        ?.name;

    const familyBaseline =
      familyName ===
        'O' ||
      familyName ===
        'B'
        ? 0.32
        : familyName ===
            'A'
          ? 0.38
          : familyName ===
              'F'
            ? 0.48
            : familyName ===
                'G' ||
              familyName ===
                'K'
              ? 0.52
              : familyName ===
                  'M'
                ? 0.42
                : null;

    if (
      familyBaseline ===
      null
    ) {
      throw new RangeError(
        `Unsupported MAIN_SEQUENCE family for point-15.5 stability: ${familyName ?? 'null'}.`,
      );
    }

    baseline =
      familyBaseline +
      0.35 *
        quietness +
      0.12 *
        rotationSettledFactor;
  }

  return clamp01(
    baseline +
    lerp(
      -0.06,
      0.06,
      stabilityScatter,
    ),
  );
}

function assertUnitDraw(
  value:
    number,

  name:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0 ||
    value >=
      1
  ) {
    throw new RangeError(
      `${name} must be finite and in [0, 1).`,
    );
  }
}

function lerp(
  min:
    number,

  max:
    number,

  t:
    number,
): number {

  return (
    min +
    (
      max -
      min
    ) *
      t
  );
}

function clamp01(
  value:
    number,
): number {

  return clamp(
    value,
    0,
    1,
  );
}

function clamp(
  value:
    number,

  min:
    number,

  max:
    number,
): number {

  return Math.min(
    max,
    Math.max(
      min,
      value,
    ),
  );
}
