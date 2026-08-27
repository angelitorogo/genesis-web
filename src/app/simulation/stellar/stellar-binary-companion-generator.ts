import {
  sha256,
} from '@noble/hashes/sha2.js';

import {
  bytesToHex,
  hexToBytes,
  utf8ToBytes,
} from '@noble/hashes/utils.js';

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
  StellarCompanion,
} from '../../domain/stellar/stellar-companion';

import {
  StellarComponentDesignation,
} from '../../domain/stellar/stellar-component-designation';

import {
  type StellarDesignation,
} from '../../domain/stellar/stellar-designation';

import {
  StellarEvolutionInput,
  STELLAR_EVOLUTION_V1_MIN_INITIAL_MASS_SOLAR,
} from '../../domain/stellar/stellar-evolution-input';

import {
  StellarLifetimeProfile,
  type StellarLifetimeProfile as StellarLifetimeProfileType,
} from '../../domain/stellar/stellar-lifetime-profile';

import {
  StellarPhysicalProperties,
  type StellarPhysicalProperties as StellarPhysicalPropertiesType,
} from '../../domain/stellar/stellar-physical-properties';

import {
  StellarSystemComponentLabel,
} from '../../domain/stellar/stellar-system-component-label';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  Sfc64Random,
} from '../random/sfc64-random';

import {
  StellarEvolutionEngine,
} from './stellar-evolution-engine';

import {
  StellarSpectralClassifier,
} from './stellar-spectral-classifier';

const V1_BINARY_COMPANION_B_BRANCH =
  utf8ToBytes(
    'GENESIS-STELLAR-BINARY-COMPANION-B-V1',
  );

const V1_MIN_EFFECTIVE_METALLICITY_SOLAR_RATIO =
  0.01;

const V1_MAX_EFFECTIVE_METALLICITY_SOLAR_RATIO =
  3.0;

const V1_SOLAR_EFFECTIVE_TEMPERATURE_KELVIN =
  5_772;

const V1_MIN_BINARY_MASS_RATIO =
  0.08;

interface V1BinaryCompanionDraws {
  readonly massRatio:
    number;

  readonly radiusScatter:
    number;

  readonly luminosityScatter:
    number;
}

/**
 * Point-16.2 generator for component B of an explicitly binary stellar system.
 *
 * Component B is derived from a SHA-256 domain branch of the existing
 * SystemSeed. This is an intra-system identity only: SeedDeriver, SystemLocator
 * and every frozen phase-15 branch remain untouched.
 *
 * Binary components are coeval by construction. The primary's generated age is
 * reused for B, while B's initial mass is correlated through a deterministic
 * mass ratio q <= 1 so the frozen phase-15 primary remains component A.
 *
 * The physical baseline intentionally mirrors the frozen point-15.1 reference
 * mass/radius/luminosity/temperature laws, but consumes only the new binary-B
 * branch. No orbital parameters are generated before point 16.4.
 */
export class StellarBinaryCompanionGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    systemSeed:
      SystemSeed,

    systemDesignation:
      StellarDesignation,

    primaryPhysicalProperties:
      StellarPhysicalPropertiesType,

    primaryLifetimeProfile:
      StellarLifetimeProfileType,

    sectorStellarPopulation:
      GalaxySectorStellarPopulationProperties,
  ): StellarCompanion {

    if (
      generationKey
        .generatorVersion !==
      GeneratorVersion.V1
    ) {
      throw new RangeError(
        `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
      );
    }

    const componentSeedHex =
      deriveComponentSeedHexV1(
        systemSeed,
      );

    const random =
      new Sfc64Random(
        universeSeedFromNormalized128(
          componentSeedHex,
        ),
      );

    const draws:
      V1BinaryCompanionDraws = {
        massRatio:
          random.nextDouble(),

        radiusScatter:
          random.nextDouble(),

        luminosityScatter:
          random.nextDouble(),
      };

    const primaryInitialMassSolar =
      primaryPhysicalProperties
        .initialMassSolar;

    const minimumAllowedRatio =
      Math.min(
        1,
        Math.max(
          V1_MIN_BINARY_MASS_RATIO,
          STELLAR_EVOLUTION_V1_MIN_INITIAL_MASS_SOLAR /
            primaryInitialMassSolar,
        ),
      );

    /*
     * A shallow equal-mass preference is a coarse V1 binary population proxy,
     * not a full observed mass-ratio distribution. q remains continuous and
     * deterministic, with B never more massive than the canonical A primary.
     */
    const sampledMassRatio =
      minimumAllowedRatio +
      (
        1 -
        minimumAllowedRatio
      ) *
        Math.sqrt(
          draws.massRatio,
        );

    const secondaryInitialMassSolar =
      Math.min(
        primaryInitialMassSolar,
        Math.max(
          STELLAR_EVOLUTION_V1_MIN_INITIAL_MASS_SOLAR,
          primaryInitialMassSolar *
            sampledMassRatio,
        ),
      );

    const massRatioToPrimary =
      secondaryInitialMassSolar /
      primaryInitialMassSolar;

    const physicalProperties =
      physicalPropertiesV1(
        secondaryInitialMassSolar,
        sectorStellarPopulation
          .characteristicMetallicitySolarRatio,
        draws,
      );

    const zeroAgeAssessment =
      StellarEvolutionEngine
        .evaluate(
          generationKey,
          new StellarEvolutionInput(
            secondaryInitialMassSolar,
            sectorStellarPopulation
              .characteristicMetallicitySolarRatio,
            0,
          ),
        );

    const spectralAppearance =
      StellarSpectralClassifier
        .classify(
          physicalProperties
            .effectiveTemperatureKelvin,
          zeroAgeAssessment
            .mainSequenceClass,
          zeroAgeAssessment
            .brownDwarfClass,
        );

    const lifetimeProfile =
      lifetimeProfileV1(
        generationKey,
        secondaryInitialMassSolar,
        sectorStellarPopulation
          .characteristicMetallicitySolarRatio,
        primaryLifetimeProfile
          .ageBillionYears,
      );

    return new StellarCompanion(
      StellarSystemComponentLabel.B,
      componentSeedHex,
      new StellarComponentDesignation(
        systemDesignation,
        StellarSystemComponentLabel.B,
      ),
      primaryInitialMassSolar,
      massRatioToPrimary,
      physicalProperties,
      spectralAppearance,
      lifetimeProfile,
    );
  }
}

function physicalPropertiesV1(
  initialMassSolar:
    number,

  metallicitySolarRatio:
    number,

  draws:
    V1BinaryCompanionDraws,
): StellarPhysicalProperties {

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

function lifetimeProfileV1(
  generationKey:
    UniverseGenerationKey,

  initialMassSolar:
    number,

  metallicitySolarRatio:
    number,

  coevalAgeBillionYears:
    number,
): StellarLifetimeProfile {

  const evolutionAssessment =
    StellarEvolutionEngine
      .evaluate(
        generationKey,
        new StellarEvolutionInput(
          initialMassSolar,
          metallicitySolarRatio,
          coevalAgeBillionYears,
        ),
      );

  const mainSequenceLifetime =
    evolutionAssessment
      .mainSequenceLifetimeBillionYears;

  const postMainSequenceDuration =
    evolutionAssessment
      .postMainSequenceDurationBillionYears;

  if (
    mainSequenceLifetime ===
      null ||
    postMainSequenceDuration ===
      null
  ) {
    return new StellarLifetimeProfile(
      coevalAgeBillionYears,
      null,
      null,
      evolutionAssessment,
    );
  }

  const terminalAgeBillionYears =
    mainSequenceLifetime +
    postMainSequenceDuration;

  return new StellarLifetimeProfile(
    coevalAgeBillionYears,
    terminalAgeBillionYears,
    Math.max(
      0,
      terminalAgeBillionYears -
        coevalAgeBillionYears,
    ),
    evolutionAssessment,
  );
}

function deriveComponentSeedHexV1(
  systemSeed:
    SystemSeed,
): string {

  const digest =
    sha256
      .create()
      .update(
        V1_BINARY_COMPANION_B_BRANCH,
      )
      .update(
        hexToBytes(
          systemSeed
            .normalizedValue,
        ),
      )
      .digest();

  return bytesToHex(
    digest.slice(
      0,
      16,
    ),
  )
    .toUpperCase();
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
