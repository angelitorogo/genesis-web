import {
  sha256,
} from '@noble/hashes/sha2.js';

import {
  bytesToHex,
  hexToBytes,
  utf8ToBytes,
} from '@noble/hashes/utils.js';

import {
  type SystemLocator,
} from '../../domain/generation/procedural-locator';

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
  type SystemSeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  STELLAR_EVOLUTION_V1_MAX_INITIAL_MASS_SOLAR,
  STELLAR_EVOLUTION_V1_MIN_INITIAL_MASS_SOLAR,
} from '../../domain/stellar/stellar-evolution-input';

import {
  StellarPhysicalProperties,
} from '../../domain/stellar/stellar-physical-properties';

import {
  type StellarPopulationProfile,
} from '../../domain/stellar/stellar-population-profile';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  Sfc64Random,
} from '../random/sfc64-random';

import {
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

const V1_PHYSICAL_BRANCH =
  utf8ToBytes(
    'GENESIS-STELLAR-PHYSICAL-PROPERTIES-V1',
  );

const V1_SOLAR_EFFECTIVE_TEMPERATURE_KELVIN =
  5_772;

const V1_LOW_MASS_UPPER_SOLAR =
  0.80;

const V1_SOLAR_LIKE_UPPER_SOLAR =
  2.10;

const V1_MIN_EFFECTIVE_METALLICITY_SOLAR_RATIO =
  0.01;

const V1_MAX_EFFECTIVE_METALLICITY_SOLAR_RATIO =
  3.0;

interface V1PhysicalDraws {
  readonly massBand:
    number;

  readonly massWithinBand:
    number;

  readonly radiusScatter:
    number;

  readonly luminosityScatter:
    number;
}

/**
 * Incremental point-15 StellarGenerator implementation.
 *
 * Point 15.1 owns only the deterministic zero-age/reference physical baseline:
 * initial/current mass, radius, luminosity and effective temperature.
 *
 * Important boundaries:
 * - point 15.2 owns spectral type and color;
 * - point 15.3 owns generated age, remaining life and age-dependent evolution;
 * - activity/flares, rotation/stability and designation remain 15.4..15.6;
 * - Star itself is not materialized yet because a final current evolutionary
 *   state requires the generated age from point 15.3.
 *
 * Entropy is isolated behind a SHA-256 domain separator derived from the
 * existing SystemSeed. SeedDeriver and the frozen hierarchical vectors are not
 * modified, and later 15.x sub-features can use independent domain branches
 * without perturbing these four point-15.1 draws.
 */
export class StellarGenerator {

  private constructor() {}

  static generatePhysicalProperties(
    generationKey:
      UniverseGenerationKey,

    locator:
      SystemLocator,

    sectorStellarPopulation:
      GalaxySectorStellarPopulationProperties,

    stellarPopulationProfile:
      StellarPopulationProfile,
  ): StellarPhysicalProperties {

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.generatePhysicalPropertiesV1(
        generationKey,
        locator,
        sectorStellarPopulation,
        stellarPopulationProfile,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static generatePhysicalPropertiesV1(
    generationKey:
      UniverseGenerationKey,

    locator:
      SystemLocator,

    sectorStellarPopulation:
      GalaxySectorStellarPopulationProperties,

    stellarPopulationProfile:
      StellarPopulationProfile,
  ): StellarPhysicalProperties {

    const systemSeed =
      ProceduralTargetResolver
        .resolveTargetSeed(
          generationKey,
          locator,
        ) as SystemSeed;

    const random =
      new Sfc64Random(
        physicalBranchSeedV1(
          systemSeed,
        ),
      );

    /*
     * Frozen point-15.1 draw order. Future 15.x properties must not append
     * themselves to this stream; they receive their own domain-separated
     * branch instead.
     */
    const draws:
      V1PhysicalDraws = {
        massBand:
          random.nextDouble(),

        massWithinBand:
          random.nextDouble(),

        radiusScatter:
          random.nextDouble(),

        luminosityScatter:
          random.nextDouble(),
      };

    const metallicitySolarRatio =
      sectorStellarPopulation
        .characteristicMetallicitySolarRatio;

    const effectiveMetallicity =
      clamp(
        metallicitySolarRatio,
        V1_MIN_EFFECTIVE_METALLICITY_SOLAR_RATIO,
        V1_MAX_EFFECTIVE_METALLICITY_SOLAR_RATIO,
      );

    const logMetallicity =
      Math.log10(
        effectiveMetallicity,
      );

    const hydrogenBurningLimitSolar =
      clamp(
        0.075 -
        0.006 *
          logMetallicity,
        0.070,
        0.090,
      );

    const initialMassSolar =
      sampleInitialMassV1(
        draws,
        hydrogenBurningLimitSolar,
        stellarPopulationProfile,
      );

    const baseRadiusSolar =
      baselineRadiusSolarV1(
        initialMassSolar,
        hydrogenBurningLimitSolar,
      );

    const baseLuminositySolar =
      baselineLuminositySolarV1(
        initialMassSolar,
        hydrogenBurningLimitSolar,
      );

    const radiusMetallicityFactor =
      clamp(
        1.0 +
        0.020 *
          logMetallicity,
        0.96,
        1.02,
      );

    const luminosityMetallicityFactor =
      clamp(
        1.0 -
        0.080 *
          logMetallicity,
        0.96,
        1.16,
      );

    const radiusScatterFactor =
      lerp(
        0.96,
        1.04,
        draws.radiusScatter,
      );

    const luminosityScatterFactor =
      lerp(
        0.90,
        1.10,
        draws.luminosityScatter,
      );

    const radiusSolar =
      baseRadiusSolar *
      radiusMetallicityFactor *
      radiusScatterFactor;

    const luminositySolar =
      baseLuminositySolar *
      luminosityMetallicityFactor *
      luminosityScatterFactor;

    const effectiveTemperatureKelvin =
      V1_SOLAR_EFFECTIVE_TEMPERATURE_KELVIN *
      (
        luminositySolar /
        radiusSolar **
          2
      ) **
        0.25;

    return new StellarPhysicalProperties(
      initialMassSolar,
      initialMassSolar,
      radiusSolar,
      luminositySolar,
      effectiveTemperatureKelvin,
    );
  }
}

function sampleInitialMassV1(
  draws:
    V1PhysicalDraws,

  hydrogenBurningLimitSolar:
    number,

  stellarPopulationProfile:
    StellarPopulationProfile,
): number {

  /*
   * The environmental propensities from phase 6 are independent weights, not
   * frequencies. Point 15.1 therefore applies them as modifiers to a strongly
   * low-mass-dominated four-band IMF approximation and normalizes the result.
   * The characteristic population age/remnant propensity are intentionally not
   * consumed until point 15.3.
   */
  const brownDwarfWeight =
    0.08 *
    (
      0.25 +
      0.75 *
        stellarPopulationProfile
          .lowMassStarPropensity
    );

  const lowMassWeight =
    0.70 *
    (
      0.25 +
      0.75 *
        stellarPopulationProfile
          .lowMassStarPropensity
    );

  const solarLikeWeight =
    0.20 *
    (
      0.25 +
      0.75 *
        stellarPopulationProfile
          .solarLikeStarPropensity
    );

  const highMassWeight =
    0.02 *
    (
      0.10 +
      0.90 *
        stellarPopulationProfile
          .highMassStarPropensity
    );

  const totalWeight =
    brownDwarfWeight +
    lowMassWeight +
    solarLikeWeight +
    highMassWeight;

  const bandDraw =
    draws.massBand *
    totalWeight;

  if (
    bandDraw <
    brownDwarfWeight
  ) {
    return samplePowerLaw(
      STELLAR_EVOLUTION_V1_MIN_INITIAL_MASS_SOLAR,
      hydrogenBurningLimitSolar,
      0.30,
      draws.massWithinBand,
    );
  }

  if (
    bandDraw <
    brownDwarfWeight +
      lowMassWeight
  ) {
    return samplePowerLaw(
      hydrogenBurningLimitSolar,
      V1_LOW_MASS_UPPER_SOLAR,
      1.30,
      draws.massWithinBand,
    );
  }

  if (
    bandDraw <
    brownDwarfWeight +
      lowMassWeight +
      solarLikeWeight
  ) {
    return samplePowerLaw(
      V1_LOW_MASS_UPPER_SOLAR,
      V1_SOLAR_LIKE_UPPER_SOLAR,
      2.30,
      draws.massWithinBand,
    );
  }

  return samplePowerLaw(
    V1_SOLAR_LIKE_UPPER_SOLAR,
    STELLAR_EVOLUTION_V1_MAX_INITIAL_MASS_SOLAR,
    2.30,
    draws.massWithinBand,
  );
}

function baselineRadiusSolarV1(
  massSolar:
    number,

  hydrogenBurningLimitSolar:
    number,
): number {

  if (
    massSolar <
    hydrogenBurningLimitSolar
  ) {
    const normalizedMass =
      clamp01(
        (
          massSolar -
          STELLAR_EVOLUTION_V1_MIN_INITIAL_MASS_SOLAR
        ) /
        (
          hydrogenBurningLimitSolar -
          STELLAR_EVOLUTION_V1_MIN_INITIAL_MASS_SOLAR
        ),
      );

    return (
      0.090 +
      0.025 *
        normalizedMass **
          0.30
    );
  }

  if (
    massSolar <=
    1.0
  ) {
    return massSolar **
      0.80;
  }

  if (
    massSolar <=
    10.0
  ) {
    return massSolar **
      0.57;
  }

  return (
    1.25 *
    massSolar **
      0.47
  );
}

function baselineLuminositySolarV1(
  massSolar:
    number,

  hydrogenBurningLimitSolar:
    number,
): number {

  if (
    massSolar <
    hydrogenBurningLimitSolar
  ) {
    const normalizedMass =
      clamp01(
        (
          massSolar -
          STELLAR_EVOLUTION_V1_MIN_INITIAL_MASS_SOLAR
        ) /
        (
          hydrogenBurningLimitSolar -
          STELLAR_EVOLUTION_V1_MIN_INITIAL_MASS_SOLAR
        ),
      );

    return (
      0.00001 +
      0.00035 *
        normalizedMass **
          2.20
    );
  }

  if (
    massSolar <
    0.43
  ) {
    return (
      0.23 *
      massSolar **
        2.30
    );
  }

  if (
    massSolar <
    2.0
  ) {
    return massSolar **
      4.0;
  }

  if (
    massSolar <
    20.0
  ) {
    return (
      1.50 *
      massSolar **
        3.50
    );
  }

  return (
    3_200 *
    massSolar
  );
}

function samplePowerLaw(
  min:
    number,

  max:
    number,

  alpha:
    number,

  draw:
    number,
): number {

  if (
    max <=
    min
  ) {
    return min;
  }

  if (
    Math.abs(
      alpha -
      1.0,
    ) <
    1e-12
  ) {
    return (
      min *
      (
        max /
        min
      ) **
        draw
    );
  }

  const exponent =
    1.0 -
    alpha;

  const minPower =
    min **
      exponent;

  const maxPower =
    max **
      exponent;

  return (
    minPower +
    draw *
      (
        maxPower -
        minPower
      )
  ) **
    (
      1.0 /
      exponent
    );
}

function physicalBranchSeedV1(
  systemSeed:
    SystemSeed,
): UniverseSeed {

  const digest =
    sha256
      .create()
      .update(
        V1_PHYSICAL_BRANCH,
      )
      .update(
        hexToBytes(
          systemSeed
            .normalizedValue,
        ),
      )
      .digest();

  return universeSeedFromNormalized128(
    bytesToHex(
      digest.slice(
        0,
        16,
      ),
    )
      .toUpperCase(),
  );
}

function universeSeedFromNormalized128(
  normalized:
    string,
): UniverseSeed {

  if (
    !/^[0-9A-F]{32}$/u.test(
      normalized,
    )
  ) {
    throw new RangeError(
      `Expected normalized 128-bit hexadecimal seed: ${normalized}.`,
    );
  }

  const canonical =
    normalized
      .match(
        /.{4}/gu,
      )
      ?.join(
        '-',
      );

  if (
    canonical ===
    undefined
  ) {
    throw new RangeError(
      `Cannot format normalized 128-bit seed: ${normalized}.`,
    );
  }

  return UniverseSeed.parse(
    canonical,
  );
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
