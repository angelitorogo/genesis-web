import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  PlanetFormationProfile,
  PlanetFormationRegime,
} from '../../domain/planetary/planet-formation-profile';

import {
  type GalaxySectorStellarPopulationProperties,
} from '../../domain/sector/galaxy-sector-stellar-population-properties';

const V1_METALLICITY_FLOOR =
  0.03;

const V1_METALLICITY_CEILING =
  2.50;

/**
 * Pure deterministic V1 mapping from characteristic sector metallicity to
 * broad planetary-formation propensities.
 *
 * This generator:
 *
 * - consumes no PRNG draws;
 * - does not use a seed directly;
 * - does not materialize stars, systems or planets;
 * - does not persist Ground Truth;
 * - depends only on GeneratorVersion and the already-derived local sector
 *   stellar-population environment.
 */
export class PlanetFormationProfileGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    stellarPopulation:
      GalaxySectorStellarPopulationProperties,
  ): PlanetFormationProfile {

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.generateV1(
        stellarPopulation,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static generateV1(
    stellarPopulation:
      GalaxySectorStellarPopulationProperties,
  ): PlanetFormationProfile {

    const metallicitySolarRatio =
      stellarPopulation
        .characteristicMetallicitySolarRatio;

    const effectiveMetallicity =
      clamp(
        metallicitySolarRatio,
        V1_METALLICITY_FLOOR,
        V1_METALLICITY_CEILING,
      );

    const logFloor =
      Math.log10(
        V1_METALLICITY_FLOOR,
      );

    const logCeiling =
      Math.log10(
        V1_METALLICITY_CEILING,
      );

    const normalizedLogMetallicity =
      clamp01(
        (
          Math.log10(
            effectiveMetallicity,
          ) -
          logFloor
        ) /
        (
          logCeiling -
          logFloor
        ),
      );

    const solidMaterialIndex =
      smoothstep(
        normalizedLogMetallicity,
      );

    const overallPlanetFormationProbability =
      0.35 +
      0.63 *
        solidMaterialIndex;

    const rockyPlanetFormationPropensity =
      0.55 +
      0.40 *
        Math.sqrt(
          solidMaterialIndex,
        );

    const iceRichPlanetFormationPropensity =
      0.10 +
      0.80 *
        (
          solidMaterialIndex **
          1.35
        );

    const giantPlanetFormationPropensity =
      0.02 +
      0.93 *
        (
          solidMaterialIndex **
          2.20
        );

    const regime =
      regimeV1(
        overallPlanetFormationProbability,
        giantPlanetFormationPropensity,
      );

    return new PlanetFormationProfile(
      metallicitySolarRatio,
      solidMaterialIndex,
      overallPlanetFormationProbability,
      rockyPlanetFormationPropensity,
      iceRichPlanetFormationPropensity,
      giantPlanetFormationPropensity,
      regime,
    );
  }
}

function regimeV1(
  overallPlanetFormationProbability:
    number,

  giantPlanetFormationPropensity:
    number,
): PlanetFormationRegime {

  if (
    overallPlanetFormationProbability <
    0.50
  ) {
    return PlanetFormationRegime
      .SOLID_LIMITED;
  }

  if (
    giantPlanetFormationPropensity <
    0.30
  ) {
    return PlanetFormationRegime
      .ROCKY_FAVORED;
  }

  if (
    giantPlanetFormationPropensity <
    0.65
  ) {
    return PlanetFormationRegime
      .MIXED;
  }

  return PlanetFormationRegime
    .GIANT_ENHANCED;
}

function smoothstep(
  value:
    number,
): number {

  const t =
    clamp01(
      value,
    );

  return (
    t *
    t *
    (
      3 -
      2 *
        t
    )
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
