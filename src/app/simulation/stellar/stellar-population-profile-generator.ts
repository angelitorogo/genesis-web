import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type GalaxySectorStellarPopulationProperties,
} from '../../domain/sector/galaxy-sector-stellar-population-properties';

import {
  StellarPopulationProfile,
  StellarPopulationRegime,
} from '../../domain/stellar/stellar-population-profile';

import {
  type GalaxyPhysicalProperties,
} from '../../domain/universe/galaxy-physical-properties';

const V1_MAX_STELLAR_AGE_BILLION_YEARS =
  13.8;

const V1_BILLION_STARS =
  1_000_000_000.0;

const V1_FORMATION_ACTIVITY_REFERENCE =
  0.01;

/**
 * Pure deterministic V1 mapping from stellar age and galaxy-wide formation
 * activity to statistical stellar-population priors.
 *
 * This generator:
 *
 * - consumes no PRNG draws;
 * - does not use UniverseSeed as entropy;
 * - deliberately ignores metallicity in V1;
 * - does not materialize individual stars;
 * - does not implement an IMF;
 * - does not assign spectral classes;
 * - does not persist Ground Truth.
 */
export class StellarPopulationProfileGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    galaxyPhysicalProperties:
      GalaxyPhysicalProperties,

    sectorStellarPopulation:
      GalaxySectorStellarPopulationProperties,
  ): StellarPopulationProfile {

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.generateV1(
        galaxyPhysicalProperties,
        sectorStellarPopulation,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static generateV1(
    galaxyPhysicalProperties:
      GalaxyPhysicalProperties,

    sectorStellarPopulation:
      GalaxySectorStellarPopulationProperties,
  ): StellarPopulationProfile {

    const characteristicStellarAgeBillionYears =
      sectorStellarPopulation
        .characteristicStellarAgeBillionYears;

    const stellarPopulationBillions =
      Number(
        galaxyPhysicalProperties
          .stellarPopulation,
      ) /
      V1_BILLION_STARS;

    const formationRatePerBillionStars =
      galaxyPhysicalProperties
        .starFormationRateSolarMassesPerYear /
      stellarPopulationBillions;

    const formationActivityIndex =
      formationRatePerBillionStars /
      (
        formationRatePerBillionStars +
        V1_FORMATION_ACTIVITY_REFERENCE
      );

    const normalizedAge =
      clamp01(
        characteristicStellarAgeBillionYears /
        V1_MAX_STELLAR_AGE_BILLION_YEARS,
      );

    const recentness =
      1.0 -
      normalizedAge;

    const youngRaw =
      0.05 +
      0.90 *
        formationActivityIndex +
      0.35 *
        recentness;

    const matureRaw =
      0.10 +
      0.50 *
        (
          1.0 -
          Math.abs(
            2.0 *
              normalizedAge -
            1.0,
          )
        ) +
      0.15 *
        formationActivityIndex;

    const oldRaw =
      0.05 +
      1.20 *
        normalizedAge +
      0.25 *
        (
          1.0 -
          formationActivityIndex
        ) *
        normalizedAge;

    const cohortTotal =
      youngRaw +
      matureRaw +
      oldRaw;

    const youngStarFraction =
      youngRaw /
      cohortTotal;

    const matureStarFraction =
      matureRaw /
      cohortTotal;

    const oldStarFraction =
      oldRaw /
      cohortTotal;

    const lowMassT =
      clamp01(
        0.75 *
          normalizedAge +
        0.25 *
          (
            1.0 -
            formationActivityIndex
          ),
      );

    const lowMassStarPropensity =
      lerp(
        0.72,
        0.96,
        lowMassT,
      );

    const solarLikeT =
      clamp01(
        0.60 *
          (
            1.0 -
            Math.abs(
              2.0 *
                normalizedAge -
              1.0,
            )
          ) +
        0.40 *
          (
            1.0 -
            0.50 *
              formationActivityIndex
          ),
      );

    const solarLikeStarPropensity =
      lerp(
        0.45,
        0.82,
        solarLikeT,
      );

    const highMassT =
      clamp01(
        formationActivityIndex *
        (
          0.60 +
          0.40 *
            recentness
        ),
      );

    const highMassStarPropensity =
      lerp(
        0.01,
        0.90,
        highMassT **
          1.35,
      );

    const remnantT =
      clamp01(
        0.80 *
          normalizedAge +
        0.20 *
          (
            1.0 -
            formationActivityIndex
          ),
      );

    const stellarRemnantPropensity =
      lerp(
        0.03,
        0.92,
        remnantT **
          1.25,
      );

    const regime =
      regimeV1(
        formationActivityIndex,
        normalizedAge,
      );

    return new StellarPopulationProfile(
      characteristicStellarAgeBillionYears,
      formationActivityIndex,
      youngStarFraction,
      matureStarFraction,
      oldStarFraction,
      lowMassStarPropensity,
      solarLikeStarPropensity,
      highMassStarPropensity,
      stellarRemnantPropensity,
      regime,
    );
  }
}

function regimeV1(
  formationActivityIndex:
    number,

  normalizedAge:
    number,
): StellarPopulationRegime {

  if (
    formationActivityIndex >=
      0.75 &&
    normalizedAge <
      0.50
  ) {
    return StellarPopulationRegime
      .YOUNG_ACTIVE;
  }

  if (
    formationActivityIndex >=
    0.50
  ) {
    return StellarPopulationRegime
      .ACTIVE;
  }

  if (
    formationActivityIndex >=
    0.20
  ) {
    return StellarPopulationRegime
      .MIXED;
  }

  if (
    normalizedAge >=
    0.65
  ) {
    return StellarPopulationRegime
      .OLD_QUIESCENT;
  }

  return StellarPopulationRegime
    .QUIESCENT;
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

  return Math.min(
    1.0,
    Math.max(
      0.0,
      value,
    ),
  );
}
