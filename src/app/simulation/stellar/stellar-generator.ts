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
  StellarEvolutionInput,
} from '../../domain/stellar/stellar-evolution-input';

import {
  StellarActivityProfile,
} from '../../domain/stellar/stellar-activity-profile';

import {
  StellarActivityRegime,
} from '../../domain/stellar/stellar-activity-regime';

import {
  Star,
} from '../../domain/stellar/star';

import {
  STELLAR_LIFETIME_V1_MAX_AGE_BILLION_YEARS,
  StellarLifetimeProfile,
} from '../../domain/stellar/stellar-lifetime-profile';

import {
  StellarPhysicalProperties,
} from '../../domain/stellar/stellar-physical-properties';

import {
  type StellarSpectralAppearance,
} from '../../domain/stellar/stellar-spectral-appearance';

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

import {
  StellarEvolutionEngine,
} from './stellar-evolution-engine';

import {
  StellarSpectralClassifier,
} from './stellar-spectral-classifier';

const V1_PHYSICAL_BRANCH =
  utf8ToBytes(
    'GENESIS-STELLAR-PHYSICAL-PROPERTIES-V1',
  );

const V1_AGE_BRANCH =
  utf8ToBytes(
    'GENESIS-STELLAR-AGE-V1',
  );

const V1_ACTIVITY_BRANCH =
  utf8ToBytes(
    'GENESIS-STELLAR-ACTIVITY-V1',
  );

const V1_MAX_YOUNG_AGE_BILLION_YEARS =
  0.10;

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

interface V1AgeDraws {
  readonly cohort:
    number;

  readonly withinCohort:
    number;
}


interface V1ActivityDraws {
  readonly activityScatter:
    number;

  readonly flareRateScatter:
    number;

  readonly flareEnergyScatter:
    number;
}

/**
 * Incremental point-15 StellarGenerator implementation.
 *
 * Point 15.1 owns the deterministic zero-age/reference physical baseline:
 * initial/current mass, radius, luminosity and effective temperature. Point 15.2
 * derives detailed spectral subtype and representative display color from that
 * baseline without consuming any additional entropy. Point 15.3 adds an
 * independent generated-age branch, derives finite remaining progenitor life
 * from the frozen phase-14 evolution model and can finally materialize the
 * canonical current Star evolutionary state. Point 15.4 adds a third isolated
 * entropy branch for baseline ordinary magnetic activity and flare statistics.
 *
 * Important boundaries:
 * - points 15.3/15.4 do not rewrite the frozen point-15.1 physical draw stream;
 * - point 15.4 does not generate rotation/stability, magnetic-field strength,
 *   compact-remnant burst/accretion physics or individual flare event times;
 * - rotation/stability and designation remain 15.5..15.6;
 * - point-15.2 spectral appearance remains the reference-baseline appearance;
 *   giant/remnant atmosphere-specific spectral vocabularies are not invented
 *   here.
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

  /**
   * Derives the point-15.2 spectral type and representative color for the
   * point-15.1 reference physical baseline.
   *
   * The already-frozen phase-14 evolution engine is evaluated at age zero only
   * to recover the canonical broad O/B/A/F/G/K/M or L/T/Y family. Temperature
   * then resolves the detailed 0..9 subtype and display color. No PRNG is used.
   *
   * This method intentionally remains the reference-baseline appearance even
   * after point 15.3 adds age/current evolutionary state. Giant/remnant
   * atmosphere-specific spectral vocabularies are not inferred by this API.
   */
  static generateSpectralAppearance(
    generationKey:
      UniverseGenerationKey,

    physicalProperties:
      StellarPhysicalProperties,

    sectorStellarPopulation:
      GalaxySectorStellarPopulationProperties,
  ): StellarSpectralAppearance {

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.generateSpectralAppearanceV1(
        generationKey,
        physicalProperties,
        sectorStellarPopulation,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  /**
   * Generates point-15.3 age, terminal age and remaining stellar life.
   *
   * Age entropy is isolated from the frozen point-15.1 physical branch. The
   * local population's young/mature/old fractions select the cohort, while
   * formation activity and remnant propensity shape age within the selected
   * cohort. Phase 14 then determines the exact current evolutionary state.
   */
  static generateLifetimeProfile(
    generationKey:
      UniverseGenerationKey,

    locator:
      SystemLocator,

    physicalProperties:
      StellarPhysicalProperties,

    sectorStellarPopulation:
      GalaxySectorStellarPopulationProperties,

    stellarPopulationProfile:
      StellarPopulationProfile,
  ): StellarLifetimeProfile {

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.generateLifetimeProfileV1(
        generationKey,
        locator,
        physicalProperties,
        sectorStellarPopulation,
        stellarPopulationProfile,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  /**
   * Generates point-15.4 ordinary stellar magnetic activity and flare
   * statistics for the current point-15.3 evolutionary state.
   *
   * The profile is a deterministic baseline, not an event timeline. MAIN_SEQUENCE,
   * BROWN_DWARF, GIANT and SUPERGIANT states receive an ordinary flare model.
   * Compact remnants explicitly return a non-applicable profile so V1 does not
   * conflate white-dwarf variability, neutron-star magnetospheric bursts or
   * black-hole accretion with ordinary photospheric stellar flares.
   */
  static generateActivityProfile(
    generationKey:
      UniverseGenerationKey,

    locator:
      SystemLocator,

    physicalProperties:
      StellarPhysicalProperties,

    lifetimeProfile:
      StellarLifetimeProfile,
  ): StellarActivityProfile {

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.generateActivityProfileV1(
        generationKey,
        locator,
        physicalProperties,
        lifetimeProfile,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  /**
   * Materializes the canonical phase-14 Star at its generated point-15.3 age.
   *
   * Physical/spectral values remain separate immutable generation outputs; the
   * Star domain entity continues to own identity plus the current evolutionary
   * classification established in phase 14.
   */
  static generateStar(
    generationKey:
      UniverseGenerationKey,

    locator:
      SystemLocator,

    sectorStellarPopulation:
      GalaxySectorStellarPopulationProperties,

    stellarPopulationProfile:
      StellarPopulationProfile,
  ): Star {

    const physicalProperties =
      this.generatePhysicalProperties(
        generationKey,
        locator,
        sectorStellarPopulation,
        stellarPopulationProfile,
      );

    const lifetimeProfile =
      this.generateLifetimeProfile(
        generationKey,
        locator,
        physicalProperties,
        sectorStellarPopulation,
        stellarPopulationProfile,
      );

    const assessment =
      lifetimeProfile
        .evolutionAssessment;

    return new Star(
      generationKey,
      locator,
      assessment.evolutionState,
      assessment.mainSequenceClass,
      assessment.brownDwarfClass,
      assessment.postMainSequenceStage,
      assessment.whiteDwarfComposition,
      assessment.neutronStarFormationChannel,
      assessment.blackHoleFormationChannel,
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

  private static generateLifetimeProfileV1(
    generationKey:
      UniverseGenerationKey,

    locator:
      SystemLocator,

    physicalProperties:
      StellarPhysicalProperties,

    sectorStellarPopulation:
      GalaxySectorStellarPopulationProperties,

    stellarPopulationProfile:
      StellarPopulationProfile,
  ): StellarLifetimeProfile {

    const systemSeed =
      ProceduralTargetResolver
        .resolveTargetSeed(
          generationKey,
          locator,
        ) as SystemSeed;

    const random =
      new Sfc64Random(
        ageBranchSeedV1(
          systemSeed,
        ),
      );

    /*
     * Frozen point-15.3 draw order. No later 15.x property may append to this
     * branch.
     */
    const draws:
      V1AgeDraws = {
        cohort:
          random.nextDouble(),

        withinCohort:
          random.nextDouble(),
      };

    const ageBillionYears =
      sampleAgeBillionYearsV1(
        draws,
        stellarPopulationProfile,
      );

    const evolutionAssessment =
      StellarEvolutionEngine
        .evaluate(
          generationKey,
          new StellarEvolutionInput(
            physicalProperties
              .initialMassSolar,
            sectorStellarPopulation
              .characteristicMetallicitySolarRatio,
            ageBillionYears,
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
        ageBillionYears,
        null,
        null,
        evolutionAssessment,
      );
    }

    const terminalAgeBillionYears =
      mainSequenceLifetime +
      postMainSequenceDuration;

    return new StellarLifetimeProfile(
      ageBillionYears,
      terminalAgeBillionYears,
      Math.max(
        0,
        terminalAgeBillionYears -
          ageBillionYears,
      ),
      evolutionAssessment,
    );
  }

  private static generateActivityProfileV1(
    generationKey:
      UniverseGenerationKey,

    locator:
      SystemLocator,

    physicalProperties:
      StellarPhysicalProperties,

    lifetimeProfile:
      StellarLifetimeProfile,
  ): StellarActivityProfile {

    const stateName =
      lifetimeProfile
        .evolutionAssessment
        .evolutionState
        .name;

    if (
      stateName ===
        'WHITE_DWARF' ||
      stateName ===
        'NEUTRON_STAR' ||
      stateName ===
        'STELLAR_BLACK_HOLE'
    ) {
      return new StellarActivityProfile(
        false,
        null,
        null,
        null,
        null,
        null,
      );
    }

    const systemSeed =
      ProceduralTargetResolver
        .resolveTargetSeed(
          generationKey,
          locator,
        ) as SystemSeed;

    const random =
      new Sfc64Random(
        activityBranchSeedV1(
          systemSeed,
        ),
      );

    /*
     * Frozen point-15.4 draw order. These three values describe baseline
     * activity scatter, average flare-rate scatter and flare-energy scatter.
     * Individual flare events are deliberately not generated here.
     */
    const draws:
      V1ActivityDraws = {
        activityScatter:
          random.nextDouble(),

        flareRateScatter:
          random.nextDouble(),

        flareEnergyScatter:
          random.nextDouble(),
      };

    const magneticActivityIndex =
      activityIndexV1(
        lifetimeProfile,
        draws.activityScatter,
      );

    const regime =
      StellarActivityRegime
        .fromActivityIndex(
          magneticActivityIndex,
        );

    const flareRatePerDay =
      flareRatePerDayV1(
        lifetimeProfile,
        magneticActivityIndex,
        draws.flareRateScatter,
      );

    const typicalFlareEnergyJoules =
      typicalFlareEnergyJoulesV1(
        physicalProperties,
        lifetimeProfile,
        magneticActivityIndex,
        draws.flareEnergyScatter,
      );

    const maximumFlareEnergyJoules =
      typicalFlareEnergyJoules *
      (
        20 +
        180 *
          magneticActivityIndex
      );

    return new StellarActivityProfile(
      true,
      magneticActivityIndex,
      regime,
      flareRatePerDay,
      typicalFlareEnergyJoules,
      maximumFlareEnergyJoules,
    );
  }

  private static generateSpectralAppearanceV1(
    generationKey:
      UniverseGenerationKey,

    physicalProperties:
      StellarPhysicalProperties,

    sectorStellarPopulation:
      GalaxySectorStellarPopulationProperties,
  ): StellarSpectralAppearance {

    const referenceEvolution =
      StellarEvolutionEngine
        .evaluate(
          generationKey,
          new StellarEvolutionInput(
            physicalProperties
              .initialMassSolar,
            sectorStellarPopulation
              .characteristicMetallicitySolarRatio,
            0,
          ),
        );

    return StellarSpectralClassifier
      .classify(
        physicalProperties
          .effectiveTemperatureKelvin,
        referenceEvolution
          .mainSequenceClass,
        referenceEvolution
          .brownDwarfClass,
      );
  }
}

function activityIndexV1(
  lifetimeProfile:
    StellarLifetimeProfile,

  activityScatter:
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
      0.85,
      1.15,
      activityScatter,
    );

  if (
    stateName ===
    'BROWN_DWARF'
  ) {
    const familyName =
      assessment
        .brownDwarfClass
        ?.name;

    const familyFactor =
      familyName ===
        'L'
        ? 0.72
        : familyName ===
            'T'
          ? 0.46
          : 0.24;

    const coolingDecay =
      Math.exp(
        -age /
          8.0,
      );

    return clamp01(
      (
        0.04 +
        familyFactor *
          coolingDecay
      ) *
        scatterFactor,
    );
  }

  if (
    stateName ===
    'GIANT'
  ) {
    const stageFactor =
      assessment
        .postMainSequenceStage
        ?.name ===
        'ASYMPTOTIC_GIANT_BRANCH'
        ? 0.18
        : 0.12;

    return clamp01(
      stageFactor *
      scatterFactor,
    );
  }

  if (
    stateName ===
    'SUPERGIANT'
  ) {
    return clamp01(
      0.10 *
      scatterFactor,
    );
  }

  const familyName =
    assessment
      .mainSequenceClass
      ?.name;

  const profile =
    mainSequenceActivityProfileV1(
      familyName,
    );

  const ageDecay =
    Math.exp(
      -age /
        profile
          .decayBillionYears,
    );

  return clamp01(
    (
      profile.floor +
      profile.amplitude *
        ageDecay
    ) *
      scatterFactor,
  );
}

function mainSequenceActivityProfileV1(
  familyName:
    string | undefined,
): {
  readonly floor:
    number;
  readonly amplitude:
    number;
  readonly decayBillionYears:
    number;
  readonly flareRateScalePerDay:
    number;
} {

  switch (
    familyName
  ) {
    case 'M':
      return {
        floor:
          0.10,
        amplitude:
          0.84,
        decayBillionYears:
          12.0,
        flareRateScalePerDay:
          2.0,
      };

    case 'K':
      return {
        floor:
          0.07,
        amplitude:
          0.70,
        decayBillionYears:
          7.0,
        flareRateScalePerDay:
          0.80,
      };

    case 'G':
      return {
        floor:
          0.04,
        amplitude:
          0.55,
        decayBillionYears:
          4.0,
        flareRateScalePerDay:
          0.25,
      };

    case 'F':
      return {
        floor:
          0.03,
        amplitude:
          0.34,
        decayBillionYears:
          2.0,
        flareRateScalePerDay:
          0.08,
      };

    case 'A':
      return {
        floor:
          0.01,
        amplitude:
          0.12,
        decayBillionYears:
          0.6,
        flareRateScalePerDay:
          0.01,
      };

    case 'B':
      return {
        floor:
          0.005,
        amplitude:
          0.06,
        decayBillionYears:
          0.08,
        flareRateScalePerDay:
          0.002,
      };

    case 'O':
      return {
        floor:
          0.003,
        amplitude:
          0.04,
        decayBillionYears:
          0.02,
        flareRateScalePerDay:
          0.001,
      };
  }

  throw new RangeError(
    `Unsupported MAIN_SEQUENCE family for point-15.4 activity: ${familyName ?? 'null'}.`,
  );
}

function flareRatePerDayV1(
  lifetimeProfile:
    StellarLifetimeProfile,

  magneticActivityIndex:
    number,

  flareRateScatter:
    number,
): number {

  const assessment =
    lifetimeProfile
      .evolutionAssessment;

  const stateName =
    assessment
      .evolutionState
      .name;

  let rateScale:
    number;

  if (
    stateName ===
    'BROWN_DWARF'
  ) {
    switch (
      assessment
        .brownDwarfClass
        ?.name
    ) {
      case 'L':
        rateScale =
          0.50;
        break;

      case 'T':
        rateScale =
          0.20;
        break;

      case 'Y':
        rateScale =
          0.05;
        break;

      default:
        throw new RangeError(
          'BROWN_DWARF activity requires an L/T/Y family.',
        );
    }
  } else if (
    stateName ===
    'GIANT'
  ) {
    rateScale =
      0.02;
  } else if (
    stateName ===
    'SUPERGIANT'
  ) {
    rateScale =
      0.005;
  } else {
    rateScale =
      mainSequenceActivityProfileV1(
        assessment
          .mainSequenceClass
          ?.name,
      )
        .flareRateScalePerDay;
  }

  return (
    rateScale *
    magneticActivityIndex **
      1.5 *
    lerp(
      0.75,
      1.25,
      flareRateScatter,
    )
  );
}

function typicalFlareEnergyJoulesV1(
  physicalProperties:
    StellarPhysicalProperties,

  lifetimeProfile:
    StellarLifetimeProfile,

  magneticActivityIndex:
    number,

  flareEnergyScatter:
    number,
): number {

  const stateName =
    lifetimeProfile
      .evolutionAssessment
      .evolutionState
      .name;

  const luminosityScale =
    clamp(
      physicalProperties
        .luminositySolar **
        0.35,
      0.30,
      30,
    );

  const evolvedScale =
    stateName ===
      'SUPERGIANT'
      ? 4.0
      : stateName ===
          'GIANT'
        ? 2.0
        : stateName ===
            'BROWN_DWARF'
          ? 0.65
          : 1.0;

  return (
    1.0e24 *
    luminosityScale *
    evolvedScale *
    lerp(
      0.40,
      2.50,
      magneticActivityIndex,
    ) *
    lerp(
      0.70,
      1.30,
      flareEnergyScatter,
    )
  );
}

function sampleAgeBillionYearsV1(
  draws:
    V1AgeDraws,

  stellarPopulationProfile:
    StellarPopulationProfile,
): number {

  const characteristicAge =
    clamp(
      stellarPopulationProfile
        .characteristicStellarAgeBillionYears,
      0,
      STELLAR_LIFETIME_V1_MAX_AGE_BILLION_YEARS,
    );

  const maximumPopulationAge =
    Math.min(
      STELLAR_LIFETIME_V1_MAX_AGE_BILLION_YEARS,
      characteristicAge *
        1.35,
    );

  const youngUpperAge =
    Math.min(
      maximumPopulationAge,
      V1_MAX_YOUNG_AGE_BILLION_YEARS,
      Math.max(
        0.001,
        characteristicAge *
          0.10,
      ),
    );

  const oldLowerAge =
    clamp(
      characteristicAge,
      youngUpperAge,
      maximumPopulationAge,
    );

  const youngCutoff =
    stellarPopulationProfile
      .youngStarFraction;

  const matureCutoff =
    youngCutoff +
    stellarPopulationProfile
      .matureStarFraction;

  if (
    draws.cohort <
    youngCutoff
  ) {
    const recentFormationBias =
      1.0 +
      2.0 *
        stellarPopulationProfile
          .formationActivityIndex;

    return lerp(
      0,
      youngUpperAge,
      draws.withinCohort **
        recentFormationBias,
    );
  }

  if (
    draws.cohort <
    matureCutoff
  ) {
    return lerp(
      youngUpperAge,
      oldLowerAge,
      draws.withinCohort,
    );
  }

  const oldAgeBiasExponent =
    1.0 /
    (
      1.0 +
      2.0 *
        stellarPopulationProfile
          .stellarRemnantPropensity
    );

  return lerp(
    oldLowerAge,
    maximumPopulationAge,
    draws.withinCohort **
      oldAgeBiasExponent,
  );
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

function activityBranchSeedV1(
  systemSeed:
    SystemSeed,
): UniverseSeed {

  const digest =
    sha256
      .create()
      .update(
        V1_ACTIVITY_BRANCH,
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

function ageBranchSeedV1(
  systemSeed:
    SystemSeed,
): UniverseSeed {

  const digest =
    sha256
      .create()
      .update(
        V1_AGE_BRANCH,
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
