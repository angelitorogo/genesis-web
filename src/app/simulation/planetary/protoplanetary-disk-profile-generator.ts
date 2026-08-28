import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  ProtoplanetaryDiskProfile,
} from '../../domain/planetary/protoplanetary-disk-profile';

import {
  ProtoplanetaryDiskStage,
} from '../../domain/planetary/protoplanetary-disk-stage';

import {
  type StellarPhysicalProperties,
} from '../../domain/stellar/stellar-physical-properties';

import {
  type StellarYouthProfile,
} from '../../domain/stellar/stellar-youth-profile';

import {
  StellarYouthStage,
} from '../../domain/stellar/stellar-youth-stage';

const V1_SOLAR_RADIUS_AU =
  0.004650467260962157;

const V1_SOLAR_MASS_DISPERSAL_AGE_MILLION_YEARS =
  6.0;

const V1_MIN_DISPERSAL_AGE_MILLION_YEARS =
  2.5;

const V1_MAX_DISPERSAL_AGE_MILLION_YEARS =
  12.0;

const V1_GAS_RICH_PROGRESS_UPPER =
  0.35;

const V1_EVOLVING_PROGRESS_UPPER =
  0.80;

const V1_DISK_MASS_RATIO_FLOOR =
  0.0015;

const V1_MIN_OUTER_RADIUS_AU =
  18;

const V1_MAX_OUTER_RADIUS_AU =
  360;

/**
 * Point-17.2 pure bulk protoplanetary-disk generator.
 *
 * V1 consumes no new seed and no PRNG draws. Natural variation comes from the
 * already-frozen point-15 stellar mass/luminosity/radius and the point-17.1
 * age-dependent youth overlay. A youth profile may outlive its primordial disk:
 * generateOrNull() therefore returns null after the mass-dependent disk
 * dispersal time even while the host is still classified as a young star.
 *
 * Point 17.2 intentionally does not partition gas/dust, create gaps/rings,
 * locate condensation fronts or materialize protoplanets. Those remain 17.3+.
 */
export class ProtoplanetaryDiskProfileGenerator {

  private constructor() {}

  static generateOrNull(
    generationKey:
      UniverseGenerationKey,

    physicalProperties:
      StellarPhysicalProperties,

    youthProfile:
      StellarYouthProfile | null,
  ): ProtoplanetaryDiskProfile | null {

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.generateV1(
        physicalProperties,
        youthProfile,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static generateV1(
    physicalProperties:
      StellarPhysicalProperties,

    youthProfile:
      StellarYouthProfile | null,
  ): ProtoplanetaryDiskProfile | null {

    if (
      youthProfile ===
      null
    ) {
      return null;
    }

    const centralMassSolar =
      physicalProperties
        .initialMassSolar;

    const dispersalAgeMillionYears =
      dispersalAgeMillionYearsV1(
        centralMassSolar,
        youthProfile,
      );

    const ageMillionYears =
      youthProfile
        .ageMillionYears;

    if (
      ageMillionYears >=
      dispersalAgeMillionYears
    ) {
      return null;
    }

    const evolutionProgress01 =
      clamp01(
        ageMillionYears /
          dispersalAgeMillionYears,
      );

    const stage =
      stageV1(
        youthProfile,
        evolutionProgress01,
      );

    const initialDiskMassRatio =
      clamp(
        0.10 *
          centralMassSolar **
            -0.08,
        0.06,
        0.14,
      );

    const diskToCentralMassRatio =
      V1_DISK_MASS_RATIO_FLOOR +
      (
        initialDiskMassRatio -
        V1_DISK_MASS_RATIO_FLOOR
      ) *
        (
          1 -
          evolutionProgress01
        ) **
          1.35;

    const diskMassSolar =
      centralMassSolar *
      diskToCentralMassRatio;

    const earlyRadiusSolar =
      physicalProperties
        .radiusSolar *
      youthProfile
        .referenceRadiusMultiplier;

    const earlyLuminositySolar =
      physicalProperties
        .luminositySolar *
      youthProfile
        .referenceLuminosityMultiplier;

    const innerRadiusAu =
      Math.max(
        0.008,
        3.0 *
          earlyRadiusSolar *
          V1_SOLAR_RADIUS_AU,
        0.010 *
          Math.sqrt(
            earlyLuminositySolar,
          ),
      );

    const baseOuterRadiusAu =
      clamp(
        100 *
          centralMassSolar **
            0.35,
        V1_MIN_OUTER_RADIUS_AU,
        V1_MAX_OUTER_RADIUS_AU /
          1.15,
      );

    const outerRadiusAu =
      clamp(
        baseOuterRadiusAu *
          (
            0.90 +
            0.25 *
              Math.sqrt(
                evolutionProgress01,
              )
          ),
        V1_MIN_OUTER_RADIUS_AU,
        V1_MAX_OUTER_RADIUS_AU,
      );

    const characteristicRadiusAu =
      clamp(
        outerRadiusAu *
          (
            0.30 +
            0.10 *
              evolutionProgress01
          ),
        innerRadiusAu *
          3,
        outerRadiusAu *
          0.70,
      );

    const referenceTemperatureAt1AuKelvin =
      clamp(
        280 *
          earlyLuminositySolar **
            0.25 *
          (
            1 +
            0.12 *
              youthProfile
                .accretionActivityIndex
          ),
        30,
        2_500,
      );

    const surfaceDensityPowerLawExponent =
      0.85 +
      0.25 *
        evolutionProgress01;

    const aspectRatioAt1Au =
      clamp(
        0.035 *
          (
            referenceTemperatureAt1AuKelvin /
            280
          ) **
            0.5 *
          centralMassSolar **
            -0.25,
        0.02,
        0.15,
      );

    const accretionRateSolarMassPerYear =
      accretionRateSolarMassPerYearV1(
        centralMassSolar,
        youthProfile,
        evolutionProgress01,
      );

    return new ProtoplanetaryDiskProfile(
      stage,
      ageMillionYears,
      dispersalAgeMillionYears,
      evolutionProgress01,
      centralMassSolar,
      diskMassSolar,
      diskToCentralMassRatio,
      innerRadiusAu,
      characteristicRadiusAu,
      outerRadiusAu,
      referenceTemperatureAt1AuKelvin,
      surfaceDensityPowerLawExponent,
      aspectRatioAt1Au,
      accretionRateSolarMassPerYear,
    );
  }
}

function dispersalAgeMillionYearsV1(
  centralMassSolar:
    number,

  youthProfile:
    StellarYouthProfile,
): number {

  const massScaledLifetime =
    clamp(
      V1_SOLAR_MASS_DISPERSAL_AGE_MILLION_YEARS *
        centralMassSolar **
          -0.25,
      V1_MIN_DISPERSAL_AGE_MILLION_YEARS,
      V1_MAX_DISPERSAL_AGE_MILLION_YEARS,
    );

  const protostellarFloor =
    youthProfile
      .protostellarUpperAgeMillionYears ===
        null
      ? 0
      : youthProfile
          .protostellarUpperAgeMillionYears *
        2;

  return clamp(
    Math.max(
      massScaledLifetime,
      protostellarFloor,
    ),
    V1_MIN_DISPERSAL_AGE_MILLION_YEARS,
    V1_MAX_DISPERSAL_AGE_MILLION_YEARS,
  );
}

function stageV1(
  youthProfile:
    StellarYouthProfile,

  evolutionProgress01:
    number,
): ProtoplanetaryDiskStage {

  if (
    youthProfile
      .stage ===
    StellarYouthStage.PROTOSTAR
  ) {
    return ProtoplanetaryDiskStage
      .EMBEDDED_ACCRETION_DISK;
  }

  if (
    evolutionProgress01 <
    V1_GAS_RICH_PROGRESS_UPPER
  ) {
    return ProtoplanetaryDiskStage
      .MASSIVE_PRIMORDIAL_DISK;
  }

  if (
    evolutionProgress01 <
    V1_EVOLVING_PROGRESS_UPPER
  ) {
    return ProtoplanetaryDiskStage
      .EVOLVING_PRIMORDIAL_DISK;
  }

  return ProtoplanetaryDiskStage
    .DISPERSING_DISK;
}

function accretionRateSolarMassPerYearV1(
  centralMassSolar:
    number,

  youthProfile:
    StellarYouthProfile,

  evolutionProgress01:
    number,
): number {

  const massScaling =
    centralMassSolar **
      1.5;

  const youthBoost =
    1 +
    80 *
      youthProfile
        .accretionActivityIndex;

  const dispersalDecay =
    Math.max(
      0.015,
      (
        1 -
        evolutionProgress01
      ) **
        1.6,
    );

  return clamp(
    5e-9 *
      massScaling *
      youthBoost *
      dispersalDecay,
    0,
    1e-4,
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
