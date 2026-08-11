import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  GalaxySectorStellarPopulationProperties,
} from '../../domain/sector/galaxy-sector-stellar-population-properties';

import {
  type GalaxySectorStellarDensity,
} from '../../domain/sector/galaxy-sector-stellar-density';

import {
  type Galaxy,
} from '../../domain/universe/galaxy';

/*
 * Frozen V1 radial metallicity anchors.
 *
 * The archived Android contract preserves the canonical values at
 * normalizedRadius = 0.0, 0.5 and 1.0.
 *
 * Expressing them as factors relative to the galaxy-wide metallicity
 * makes the gradient reusable for every V1 galaxy while reproducing
 * the frozen Caeloria vectors exactly.
 */
const V1_METALLICITY_CENTER_FACTOR =
  1.15;

const V1_METALLICITY_MIDDLE_FACTOR =
  0.994174657611873;

const V1_METALLICITY_OUTER_FACTOR =
  0.80;

/*
 * Frozen V1 stellar-age anchors.
 *
 * For the canonical Caeloria age these factors reproduce exactly:
 *
 * r = 0.0 -> 9.298532891895936
 * r = 0.5 -> 8.793177843423331
 * r = 1.0 -> 8.287822794950726
 */
const V1_AGE_CENTER_FACTOR =
  0.92;

const V1_AGE_OUTER_FACTOR =
  0.82;

/**
 * Generates characteristic metallicity and stellar age for one sector.
 *
 * The calculation is pure and deterministic:
 *
 * - consumes no PRNG draws;
 * - does not use SectorSeed;
 * - does not alter Galaxy;
 * - does not persist anything;
 * - does not modify discovery state;
 * - does not materialize stars;
 * - depends only on the galaxy physical baseline, the radial position
 *   already calculated by 5.4 and GeneratorVersion.
 */
export class GalaxySectorStellarPopulationPropertiesGenerator {

  private constructor() {}

  static generate(
    galaxy:
      Galaxy,

    stellarDensity:
      GalaxySectorStellarDensity,
  ): GalaxySectorStellarPopulationProperties {

    if (
      galaxy
        .generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.generateV1(
        galaxy,
        stellarDensity,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${galaxy.generationKey.generatorVersion.code}.`,
    );
  }

  private static generateV1(
    galaxy:
      Galaxy,

    stellarDensity:
      GalaxySectorStellarDensity,
  ): GalaxySectorStellarPopulationProperties {

    /*
     * The bounding grid is square, so corners can have r > 1.
     *
     * The physical radial gradients stop at the nominal galactic edge.
     * Sectors outside it therefore inherit the r = 1 environmental
     * boundary values instead of extrapolating indefinitely.
     */
    const normalizedRadius =
      clamp01(
        stellarDensity
          .normalizedRadius,
      );

    const metallicityFactor =
      metallicityFactorV1(
        normalizedRadius,
      );

    const ageFactor =
      lerp(
        V1_AGE_CENTER_FACTOR,
        V1_AGE_OUTER_FACTOR,
        normalizedRadius,
      );

    const characteristicMetallicitySolarRatio =
      galaxy
        .physicalProperties
        .metallicitySolarRatio *
      metallicityFactor;

    const characteristicStellarAgeBillionYears =
      galaxy
        .physicalProperties
        .ageBillionYears *
      ageFactor;

    return new GalaxySectorStellarPopulationProperties(
      characteristicMetallicitySolarRatio,
      characteristicStellarAgeBillionYears,
    );
  }
}

/**
 * V1 metallicity interpolation.
 *
 * Android's archived contract exposes three frozen golden anchors:
 *
 * r = 0.0
 * r = 0.5
 * r = 1.0
 *
 * The original Android implementation between those anchors is not
 * present in the retained audit material. V1 Web therefore treats
 * those three values themselves as the compatibility contract and
 * interpolates continuously and monotonically between them.
 */
function metallicityFactorV1(
  normalizedRadius:
    number,
): number {

  if (
    normalizedRadius <=
    0.5
  ) {
    return lerp(
      V1_METALLICITY_CENTER_FACTOR,
      V1_METALLICITY_MIDDLE_FACTOR,
      normalizedRadius /
        0.5,
    );
  }

  return lerp(
    V1_METALLICITY_MIDDLE_FACTOR,
    V1_METALLICITY_OUTER_FACTOR,
    (
      normalizedRadius -
      0.5
    ) /
      0.5,
  );
}

function lerp(
  start:
    number,

  end:
    number,

  t:
    number,
): number {

  return (
    start +
    (
      end -
      start
    ) *
      t
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