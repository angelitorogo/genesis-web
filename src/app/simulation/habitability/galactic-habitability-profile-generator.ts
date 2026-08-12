import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalacticHabitabilityBand,
  GalacticHabitabilityModelStatus,
  GalacticHabitabilityProfile,
} from '../../domain/habitability/galactic-habitability-profile';

import {
  type PlanetFormationProfile,
} from '../../domain/planetary/planet-formation-profile';

import {
  type GalaxySectorStellarDensity,
} from '../../domain/sector/galaxy-sector-stellar-density';

import {
  type StellarPopulationProfile,
} from '../../domain/stellar/stellar-population-profile';

/**
 * Generates the simplified speculative V1 Galactic Habitable Zone profile for
 * one sector.
 *
 * IMPORTANT SCIENTIFIC DISCLAIMER:
 *
 * This generator produces a procedural heuristic only. It does not claim that
 * the returned sector actually contains life, a habitable planet or a
 * scientifically established Galactic Habitable Zone.
 *
 * The calculation is pure and deterministic:
 *
 * - consumes no PRNG draws;
 * - does not use UniverseSeed as entropy;
 * - does not use GalaxyRegion directly;
 * - does not use normalizedRadius directly;
 * - does not materialize stars, systems, planets or life;
 * - does not persist Ground Truth.
 *
 * V1 combines only already-derived environmental inputs from points 5.4, 6.4
 * and 6.5.
 */
export class GalacticHabitabilityProfileGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    stellarDensity:
      GalaxySectorStellarDensity,

    planetFormationProfile:
      PlanetFormationProfile,

    stellarPopulationProfile:
      StellarPopulationProfile,
  ): GalacticHabitabilityProfile {

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.generateV1(
        stellarDensity,
        planetFormationProfile,
        stellarPopulationProfile,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static generateV1(
    stellarDensity:
      GalaxySectorStellarDensity,

    planetFormationProfile:
      PlanetFormationProfile,

    stellarPopulationProfile:
      StellarPopulationProfile,
  ): GalacticHabitabilityProfile {

    const planetFormationSupport =
      clamp01(
        0.65 *
          planetFormationProfile
            .overallPlanetFormationProbability +
        0.35 *
          planetFormationProfile
            .rockyPlanetFormationPropensity,
      );

    const stableHostStarSupport =
      clamp01(
        0.45 *
          stellarPopulationProfile
            .solarLikeStarPropensity +
        0.30 *
          stellarPopulationProfile
            .lowMassStarPropensity +
        0.25 *
          (
            1.0 -
            stellarPopulationProfile
              .highMassStarPropensity
          ),
      );

    const stellarOpportunityIndex =
      Math.sqrt(
        stellarDensity
          .relativeDensity,
      );

    const crowdingHazard =
      stellarDensity
        .relativeDensity **
      1.35;

    const massiveStarHazard =
      stellarPopulationProfile
        .highMassStarPropensity **
      1.25;

    const environmentalHazard =
      clamp01(
        0.80 *
          crowdingHazard +
        0.20 *
          massiveStarHazard,
      );

    const environmentalSafety =
      clamp01(
        1.0 -
        environmentalHazard,
      );

    const environmentalFactor =
      0.25 +
      0.75 *
        environmentalSafety;

    const habitabilityPotential =
      clamp01(
        planetFormationSupport *
        stableHostStarSupport *
        stellarOpportunityIndex *
        environmentalFactor,
      );

    const band =
      bandV1(
        habitabilityPotential,
      );

    return new GalacticHabitabilityProfile(
      GalacticHabitabilityModelStatus
        .SPECULATIVE_SIMPLIFIED,
      planetFormationSupport,
      stableHostStarSupport,
      stellarOpportunityIndex,
      crowdingHazard,
      massiveStarHazard,
      environmentalSafety,
      habitabilityPotential,
      band,
    );
  }
}

function bandV1(
  habitabilityPotential:
    number,
): GalacticHabitabilityBand {

  if (
    habitabilityPotential <
    0.20
  ) {
    return GalacticHabitabilityBand
      .LOW_POTENTIAL;
  }

  if (
    habitabilityPotential <
    0.35
  ) {
    return GalacticHabitabilityBand
      .MARGINAL;
  }

  if (
    habitabilityPotential <
    0.50
  ) {
    return GalacticHabitabilityBand
      .FAVORED;
  }

  return GalacticHabitabilityBand
    .HIGH_POTENTIAL;
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
