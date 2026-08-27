import {
  type SystemLocator,
  SystemLocator as SystemLocatorValue,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxySectorStellarPopulationProperties,
} from '../../domain/sector/galaxy-sector-stellar-population-properties';

import {
  type SystemSeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  type StellarEvolutionStateName,
} from '../../domain/stellar/stellar-evolution-state';

import {
  StellarEvolutionInput,
} from '../../domain/stellar/stellar-evolution-input';

import {
  StellarPopulationProfile,
  StellarPopulationRegime,
} from '../../domain/stellar/stellar-population-profile';

import {
  type StellarSpectralFamily,
} from '../../domain/stellar/stellar-spectral-type';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

import {
  StellarDesignationGenerator,
} from './stellar-designation-generator';

import {
  StellarEvolutionEngine,
} from './stellar-evolution-engine';

import {
  StellarGenerator,
} from './stellar-generator';

import {
  STELLAR_SPECTRAL_V1_MAX_EFFECTIVE_TEMPERATURE_KELVIN,
  STELLAR_SPECTRAL_V1_MIN_EFFECTIVE_TEMPERATURE_KELVIN,
} from './stellar-spectral-classifier';

const MAX_TOTAL_SYSTEMS =
  1_000_000;

const DEFAULT_MAX_RECORDED_VIOLATIONS =
  24;

const MAX_RECORDED_VIOLATIONS =
  256;

const STEFAN_BOLTZMANN_RELATIVE_TOLERANCE =
  1e-12;

const CONSISTENCY_RELATIVE_TOLERANCE =
  1e-11;

const SOLAR_EFFECTIVE_TEMPERATURE_KELVIN =
  5_772;

const FNV64_OFFSET_BASIS =
  0xcbf29ce484222325n;

const FNV64_PRIME =
  0x100000001b3n;

const FNV64_MASK =
  (1n << 64n) - 1n;

/**
 * Precision used only by the regression fingerprint. The physical validators
 * above keep their stricter tolerances; this quantization prevents harmless
 * sub-ULP/libm differences between Node/browser operating systems from
 * changing the checksum.
 */
const CHECKSUM_SIGNIFICANT_DIGITS =
  8;

const COMPACT_REMNANT_STATES:
  ReadonlySet<StellarEvolutionStateName> =
    new Set<StellarEvolutionStateName>([
      'WHITE_DWARF',
      'NEUTRON_STAR',
      'STELLAR_BLACK_HOLE',
    ]);

export type StellarCoherenceInvariant =
  | 'GENERATION_EXCEPTION'
  | 'PHYSICAL_BASELINE_MASS_IDENTITY'
  | 'PHYSICAL_STEFAN_BOLTZMANN'
  | 'SPECTRAL_TEMPERATURE_ENVELOPE'
  | 'SPECTRAL_BASELINE_FAMILY'
  | 'EVOLUTION_INPUT_COHERENCE'
  | 'LIFETIME_COHERENCE'
  | 'ACTIVITY_APPLICABILITY'
  | 'ROTATION_APPLICABILITY'
  | 'STAR_MATERIALIZATION'
  | 'DESIGNATION_IDENTITY';

export type StellarCoherenceScenarioName =
  | 'YOUNG_ACTIVE'
  | 'ACTIVE_METAL_RICH'
  | 'MIXED_SOLAR'
  | 'QUIESCENT_METAL_POOR'
  | 'OLD_QUIESCENT';

export interface StellarCoherenceBatchRequest {
  /**
   * Canonical UniverseSeed strings. Keeping the Worker boundary string-only
   * avoids coupling the dedicated audit Worker to domain class instances.
   */
  readonly universeSeeds:
    readonly string[];

  /**
   * Number of distinct SystemLocators generated for each UniverseSeed.
   */
  readonly systemsPerSeed:
    number;

  /**
   * Caps diagnostic payload size without limiting how many violations are
   * counted. Useful for very large Worker/Node batches.
   */
  readonly maxRecordedViolations?:
    number;
}

export interface StellarCoherenceViolation {
  readonly universeSeed:
    string;

  readonly systemSeedHex:
    string | null;

  readonly galaxyIndex:
    string;

  readonly sectorKey:
    string;

  readonly galacticObjectIndex:
    string;

  readonly scenario:
    StellarCoherenceScenarioName;

  readonly invariant:
    StellarCoherenceInvariant;

  readonly message:
    string;
}

export interface StellarCoherenceBatchReport {
  readonly complete:
    boolean;

  readonly totalSystems:
    number;

  readonly processedSystems:
    number;

  readonly coherentSystems:
    number;

  readonly failedSystems:
    number;

  readonly totalViolations:
    number;

  /**
   * Deterministic 64-bit FNV-1a digest over portability-quantized scientific
   * outputs. It is a regression fingerprint, not a cryptographic identity.
   */
  readonly checksum64:
    string;

  readonly evolutionStateCounts:
    Readonly<Record<StellarEvolutionStateName, number>>;

  readonly spectralFamilyCounts:
    Readonly<Record<StellarSpectralFamily, number>>;

  readonly scenarioCounts:
    Readonly<Record<StellarCoherenceScenarioName, number>>;

  readonly violations:
    readonly StellarCoherenceViolation[];
}

interface StellarCoherenceScenario {
  readonly name:
    StellarCoherenceScenarioName;

  readonly sector:
    GalaxySectorStellarPopulationProperties;

  readonly population:
    StellarPopulationProfile;
}

interface ViolationContext {
  readonly universeSeed:
    string;

  readonly systemSeedHex:
    string | null;

  readonly locator:
    SystemLocator;

  readonly scenario:
    StellarCoherenceScenarioName;
}

const SCENARIOS:
  readonly StellarCoherenceScenario[] =
    Object.freeze([
      Object.freeze({
        name: 'YOUNG_ACTIVE',
        sector:
          new GalaxySectorStellarPopulationProperties(
            1.25,
            0.35,
          ),
        population:
          new StellarPopulationProfile(
            0.35,
            0.92,
            0.78,
            0.17,
            0.05,
            0.68,
            0.62,
            0.90,
            0.04,
            StellarPopulationRegime.YOUNG_ACTIVE,
          ),
      }),
      Object.freeze({
        name: 'ACTIVE_METAL_RICH',
        sector:
          new GalaxySectorStellarPopulationProperties(
            2.30,
            2.0,
          ),
        population:
          new StellarPopulationProfile(
            2.0,
            0.75,
            0.45,
            0.45,
            0.10,
            0.75,
            0.70,
            0.72,
            0.10,
            StellarPopulationRegime.ACTIVE,
          ),
      }),
      Object.freeze({
        name: 'MIXED_SOLAR',
        sector:
          new GalaxySectorStellarPopulationProperties(
            1.0,
            5.5,
          ),
        population:
          new StellarPopulationProfile(
            5.5,
            0.45,
            0.25,
            0.55,
            0.20,
            0.82,
            0.75,
            0.40,
            0.25,
            StellarPopulationRegime.MIXED,
          ),
      }),
      Object.freeze({
        name: 'QUIESCENT_METAL_POOR',
        sector:
          new GalaxySectorStellarPopulationProperties(
            0.25,
            9.5,
          ),
        population:
          new StellarPopulationProfile(
            9.5,
            0.15,
            0.08,
            0.32,
            0.60,
            0.92,
            0.65,
            0.08,
            0.65,
            StellarPopulationRegime.QUIESCENT,
          ),
      }),
      Object.freeze({
        name: 'OLD_QUIESCENT',
        sector:
          new GalaxySectorStellarPopulationProperties(
            0.05,
            12.8,
          ),
        population:
          new StellarPopulationProfile(
            12.8,
            0.03,
            0.02,
            0.18,
            0.80,
            0.97,
            0.55,
            0.02,
            0.90,
            StellarPopulationRegime.OLD_QUIESCENT,
          ),
      }),
    ]);

/**
 * Point-15.7 pure physical-coherence auditor.
 *
 * The runner intentionally does not mutate or depend on presentation runtime,
 * persistence, Three.js or the point-10.9 galactic particle Worker. The same
 * synchronous function can therefore run unchanged in Vitest/Node or behind a
 * dedicated Web Worker entry point.
 *
 * All checks are cross-contract invariants over the already-frozen 15.1..15.6
 * APIs. No entropy branch, generator draw order, domain entity or designation
 * algorithm is changed by point 15.7.
 */
export class StellarCoherenceBatchRunner {

  private constructor() {}

  static run(
    request:
      StellarCoherenceBatchRequest,
  ): StellarCoherenceBatchReport {

    const validated =
      validateRequest(
        request,
      );

    const totalSystems =
      validated.universeSeeds.length *
      validated.systemsPerSeed;

    const evolutionStateCounts =
      emptyEvolutionStateCounts();

    const spectralFamilyCounts =
      emptySpectralFamilyCounts();

    const scenarioCounts =
      emptyScenarioCounts();

    const recordedViolations:
      StellarCoherenceViolation[] =
        [];

    let processedSystems =
      0;

    let failedSystems =
      0;

    let totalViolations =
      0;

    let checksum =
      FNV64_OFFSET_BASIS;

    for (
      let seedIndex = 0;
      seedIndex < validated.universeSeeds.length;
      seedIndex += 1
    ) {
      const universeSeed =
        validated.universeSeeds[
          seedIndex
        ]!;

      const generationKey =
        new UniverseGenerationKey(
          UniverseSeed.parse(
            universeSeed,
          ),
          GeneratorVersion.V1,
        );

      for (
        let systemIndex = 0;
        systemIndex < validated.systemsPerSeed;
        systemIndex += 1
      ) {
        const locator =
          locatorForOrdinal(
            seedIndex,
            systemIndex,
          );

        const scenario =
          scenarioForOrdinal(
            seedIndex,
            systemIndex,
          );

        scenarioCounts[
          scenario.name
        ] += 1;

        let systemSeedHex:
          string | null =
            null;

        const localViolations:
          StellarCoherenceViolation[] =
            [];

        const context =
          (): ViolationContext => ({
            universeSeed,
            systemSeedHex,
            locator,
            scenario:
              scenario.name,
          });

        try {
          const systemSeed =
            ProceduralTargetResolver
              .resolveTargetSeed(
                generationKey,
                locator,
              ) as SystemSeed;

          systemSeedHex =
            systemSeed.normalizedValue;

          const physical =
            StellarGenerator
              .generatePhysicalProperties(
                generationKey,
                locator,
                scenario.sector,
                scenario.population,
              );

          const spectral =
            StellarGenerator
              .generateSpectralAppearance(
                generationKey,
                physical,
                scenario.sector,
              );

          const lifetime =
            StellarGenerator
              .generateLifetimeProfile(
                generationKey,
                locator,
                physical,
                scenario.sector,
                scenario.population,
              );

          const activity =
            StellarGenerator
              .generateActivityProfile(
                generationKey,
                locator,
                physical,
                lifetime,
              );

          const rotation =
            StellarGenerator
              .generateRotationStabilityProfile(
                generationKey,
                locator,
                physical,
                lifetime,
                activity,
              );

          const star =
            StellarGenerator
              .generateStar(
                generationKey,
                locator,
                scenario.sector,
                scenario.population,
              );

          const designation =
            StellarDesignationGenerator
              .generate(
                generationKey,
                locator,
              );

          checkPhysicalCoherence(
            physical,
            context(),
            localViolations,
          );

          const referenceEvolution =
            StellarEvolutionEngine
              .evaluate(
                generationKey,
                new StellarEvolutionInput(
                  physical.initialMassSolar,
                  scenario.sector
                    .characteristicMetallicitySolarRatio,
                  0,
                ),
              );

          const expectedSpectralFamily =
            referenceEvolution
              .mainSequenceClass
              ?.name ??
            referenceEvolution
              .brownDwarfClass
              ?.name ??
            null;

          checkSpectralCoherence(
            physical.effectiveTemperatureKelvin,
            spectral.spectralType.family,
            spectral.spectralType.designation,
            expectedSpectralFamily,
            context(),
            localViolations,
          );

          checkLifetimeCoherence(
            physical.initialMassSolar,
            scenario.sector
              .characteristicMetallicitySolarRatio,
            lifetime,
            context(),
            localViolations,
          );

          const stateName =
            lifetime
              .evolutionAssessment
              .evolutionState
              .name;

          checkActivityAndRotationCoherence(
            stateName,
            activity,
            rotation,
            context(),
            localViolations,
          );

          checkStarMaterialization(
            generationKey,
            locator,
            lifetime.evolutionAssessment,
            star,
            context(),
            localViolations,
          );

          checkDesignationIdentity(
            generationKey,
            locator,
            systemSeed.normalizedValue,
            designation.name,
            designation.proceduralCode,
            context(),
            localViolations,
          );

          evolutionStateCounts[
            stateName
          ] += 1;

          spectralFamilyCounts[
            spectral
              .spectralType
              .family
          ] += 1;

          checksum =
            hashStringFNV1a64(
              checksum,
              canonicalScientificRecord(
                universeSeed,
                locator,
                scenario.name,
                systemSeed.normalizedValue,
                physical,
                spectral.spectralType.designation,
                spectral.color.hex,
                lifetime,
                activity,
                rotation,
                designation.name,
                designation.proceduralCode,
              ),
            );
        } catch (
          error: unknown
        ) {
          localViolations.push(
            createViolation(
              context(),
              'GENERATION_EXCEPTION',
              error instanceof Error
                ? `${error.name}: ${error.message}`
                : String(error),
            ),
          );

          checksum =
            hashStringFNV1a64(
              checksum,
              `ERROR|${universeSeed}|${locatorKey(locator)}|${scenario.name}|${String(error)}`,
            );
        }

        processedSystems += 1;

        if (
          localViolations.length >
          0
        ) {
          failedSystems += 1;
          totalViolations +=
            localViolations.length;

          const remainingSlots =
            validated.maxRecordedViolations -
            recordedViolations.length;

          if (
            remainingSlots >
            0
          ) {
            recordedViolations.push(
              ...localViolations.slice(
                0,
                remainingSlots,
              ),
            );
          }
        }
      }
    }

    return {
      complete:
        processedSystems ===
          totalSystems &&
        failedSystems ===
          0,
      totalSystems,
      processedSystems,
      coherentSystems:
        processedSystems -
        failedSystems,
      failedSystems,
      totalViolations,
      checksum64:
        checksum
          .toString(16)
          .toUpperCase()
          .padStart(
            16,
            '0',
          ),
      evolutionStateCounts:
        Object.freeze({
          ...evolutionStateCounts,
        }),
      spectralFamilyCounts:
        Object.freeze({
          ...spectralFamilyCounts,
        }),
      scenarioCounts:
        Object.freeze({
          ...scenarioCounts,
        }),
      violations:
        Object.freeze([
          ...recordedViolations,
        ]),
    };
  }
}

function validateRequest(
  request:
    StellarCoherenceBatchRequest,
): {
  readonly universeSeeds:
    readonly string[];
  readonly systemsPerSeed:
    number;
  readonly maxRecordedViolations:
    number;
} {
  if (
    !Array.isArray(
      request.universeSeeds,
    ) ||
    request.universeSeeds.length ===
      0
  ) {
    throw new RangeError(
      'Stellar coherence batches require at least one UniverseSeed.',
    );
  }

  if (
    !Number.isInteger(
      request.systemsPerSeed,
    ) ||
    request.systemsPerSeed <=
      0
  ) {
    throw new RangeError(
      'systemsPerSeed must be a positive integer.',
    );
  }

  const totalSystems =
    request.universeSeeds.length *
    request.systemsPerSeed;

  if (
    !Number.isSafeInteger(
      totalSystems,
    ) ||
    totalSystems >
      MAX_TOTAL_SYSTEMS
  ) {
    throw new RangeError(
      `A stellar coherence batch may contain at most ${MAX_TOTAL_SYSTEMS} systems.`,
    );
  }

  const canonicalSeeds:
    string[] =
      [];

  const seenSeeds =
    new Set<string>();

  for (
    const serializedSeed
    of request.universeSeeds
  ) {
    const canonical =
      UniverseSeed
        .parse(
          serializedSeed,
        )
        .serialize();

    if (
      seenSeeds.has(
        canonical,
      )
    ) {
      throw new RangeError(
        `Duplicate UniverseSeed in stellar coherence batch: ${canonical}.`,
      );
    }

    seenSeeds.add(
      canonical,
    );

    canonicalSeeds.push(
      canonical,
    );
  }

  const maxRecordedViolations =
    request.maxRecordedViolations ??
    DEFAULT_MAX_RECORDED_VIOLATIONS;

  if (
    !Number.isInteger(
      maxRecordedViolations,
    ) ||
    maxRecordedViolations <
      0 ||
    maxRecordedViolations >
      MAX_RECORDED_VIOLATIONS
  ) {
    throw new RangeError(
      `maxRecordedViolations must be an integer in [0, ${MAX_RECORDED_VIOLATIONS}].`,
    );
  }

  return {
    universeSeeds:
      canonicalSeeds,
    systemsPerSeed:
      request.systemsPerSeed,
    maxRecordedViolations,
  };
}

function locatorForOrdinal(
  seedIndex:
    number,

  systemIndex:
    number,
): SystemLocator {
  const galaxyIndex =
    BigInt(
      (
        seedIndex *
          31 +
        systemIndex *
          17
      ) %
      1_024,
    );

  const sectorValue =
    (
      seedIndex *
        104_729 +
      systemIndex *
        7_919
    ) %
    2_000_001;

  const sectorKey =
    BigInt(
      sectorValue -
      1_000_000,
    );

  const galacticObjectIndex =
    BigInt(
      seedIndex *
        1_000_000 +
      systemIndex,
    );

  return new SystemLocatorValue(
    galaxyIndex,
    sectorKey,
    galacticObjectIndex,
  );
}

function scenarioForOrdinal(
  seedIndex:
    number,

  systemIndex:
    number,
): StellarCoherenceScenario {
  return SCENARIOS[
    (
      seedIndex *
        3 +
      systemIndex
    ) %
    SCENARIOS.length
  ]!;
}

function checkPhysicalCoherence(
  physical: {
    readonly initialMassSolar:
      number;
    readonly currentMassSolar:
      number;
    readonly radiusSolar:
      number;
    readonly luminositySolar:
      number;
    readonly effectiveTemperatureKelvin:
      number;
  },
  context:
    ViolationContext,
  violations:
    StellarCoherenceViolation[],
): void {
  if (
    !near(
      physical.initialMassSolar,
      physical.currentMassSolar,
      CONSISTENCY_RELATIVE_TOLERANCE,
    )
  ) {
    violations.push(
      createViolation(
        context,
        'PHYSICAL_BASELINE_MASS_IDENTITY',
        `Point 15.1 reference current mass ${physical.currentMassSolar} differs from initial mass ${physical.initialMassSolar}.`,
      ),
    );
  }

  const expectedTemperature =
    SOLAR_EFFECTIVE_TEMPERATURE_KELVIN *
    (
      physical.luminositySolar /
      physical.radiusSolar **
        2
    ) **
      0.25;

  if (
    !near(
      physical.effectiveTemperatureKelvin,
      expectedTemperature,
      STEFAN_BOLTZMANN_RELATIVE_TOLERANCE,
    )
  ) {
    violations.push(
      createViolation(
        context,
        'PHYSICAL_STEFAN_BOLTZMANN',
        `Temperature ${physical.effectiveTemperatureKelvin} K is inconsistent with radius ${physical.radiusSolar} R☉ and luminosity ${physical.luminositySolar} L☉; expected ${expectedTemperature} K.`,
      ),
    );
  }

  if (
    physical.effectiveTemperatureKelvin <
      STELLAR_SPECTRAL_V1_MIN_EFFECTIVE_TEMPERATURE_KELVIN ||
    physical.effectiveTemperatureKelvin >
      STELLAR_SPECTRAL_V1_MAX_EFFECTIVE_TEMPERATURE_KELVIN
  ) {
    violations.push(
      createViolation(
        context,
        'SPECTRAL_TEMPERATURE_ENVELOPE',
        `Point-15.1 temperature ${physical.effectiveTemperatureKelvin} K is outside point-15.2 scientific envelope [${STELLAR_SPECTRAL_V1_MIN_EFFECTIVE_TEMPERATURE_KELVIN}, ${STELLAR_SPECTRAL_V1_MAX_EFFECTIVE_TEMPERATURE_KELVIN}] K.`,
      ),
    );
  }
}

function checkSpectralCoherence(
  effectiveTemperatureKelvin:
    number,
  actualFamily:
    StellarSpectralFamily,
  designation:
    string,
  expectedFamily:
    string | null,
  context:
    ViolationContext,
  violations:
    StellarCoherenceViolation[],
): void {
  if (
    expectedFamily ===
      null ||
    actualFamily !==
      expectedFamily
  ) {
    violations.push(
      createViolation(
        context,
        'SPECTRAL_BASELINE_FAMILY',
        `Point-15.2 family ${actualFamily} does not match zero-age phase-14 family ${String(expectedFamily)} at ${effectiveTemperatureKelvin} K.`,
      ),
    );
  }

  if (
    !designation.startsWith(
      actualFamily,
    )
  ) {
    violations.push(
      createViolation(
        context,
        'SPECTRAL_BASELINE_FAMILY',
        `Spectral designation ${designation} does not begin with family ${actualFamily}.`,
      ),
    );
  }
}

function checkLifetimeCoherence(
  initialMassSolar:
    number,
  metallicitySolarRatio:
    number,
  lifetime: ReturnType<
    typeof StellarGenerator.generateLifetimeProfile
  >,
  context:
    ViolationContext,
  violations:
    StellarCoherenceViolation[],
): void {
  const input =
    lifetime
      .evolutionAssessment
      .input;

  if (
    !near(
      input.initialMassSolar,
      initialMassSolar,
      CONSISTENCY_RELATIVE_TOLERANCE,
    ) ||
    !near(
      input.metallicitySolarRatio,
      metallicitySolarRatio,
      CONSISTENCY_RELATIVE_TOLERANCE,
    ) ||
    !near(
      input.ageBillionYears,
      lifetime.ageBillionYears,
      CONSISTENCY_RELATIVE_TOLERANCE,
    )
  ) {
    violations.push(
      createViolation(
        context,
        'EVOLUTION_INPUT_COHERENCE',
        'Point-15.3 evolution input does not preserve generated mass, sector metallicity and generated age.',
      ),
    );
  }

  const mainSequenceLifetime =
    lifetime
      .evolutionAssessment
      .mainSequenceLifetimeBillionYears;

  const postMainSequenceDuration =
    lifetime
      .evolutionAssessment
      .postMainSequenceDurationBillionYears;

  if (
    mainSequenceLifetime ===
      null ||
    postMainSequenceDuration ===
      null
  ) {
    if (
      lifetime.terminalAgeBillionYears !==
        null ||
      lifetime.remainingLifeBillionYears !==
        null
    ) {
      violations.push(
        createViolation(
          context,
          'LIFETIME_COHERENCE',
          'A non-finite V1 stellar lifetime must expose null terminal and remaining life.',
        ),
      );
    }

    return;
  }

  const expectedTerminal =
    mainSequenceLifetime +
    postMainSequenceDuration;

  const expectedRemaining =
    Math.max(
      0,
      expectedTerminal -
        lifetime.ageBillionYears,
    );

  if (
    lifetime.terminalAgeBillionYears ===
      null ||
    lifetime.remainingLifeBillionYears ===
      null ||
    !near(
      lifetime.terminalAgeBillionYears,
      expectedTerminal,
      CONSISTENCY_RELATIVE_TOLERANCE,
    ) ||
    !near(
      lifetime.remainingLifeBillionYears,
      expectedRemaining,
      CONSISTENCY_RELATIVE_TOLERANCE,
    )
  ) {
    violations.push(
      createViolation(
        context,
        'LIFETIME_COHERENCE',
        `Point-15.3 terminal/remaining life is inconsistent with phase-14 durations; expected terminal=${expectedTerminal}, remaining=${expectedRemaining}.`,
      ),
    );
  }
}

function checkActivityAndRotationCoherence(
  stateName:
    StellarEvolutionStateName,
  activity: ReturnType<
    typeof StellarGenerator.generateActivityProfile
  >,
  rotation: ReturnType<
    typeof StellarGenerator.generateRotationStabilityProfile
  >,
  context:
    ViolationContext,
  violations:
    StellarCoherenceViolation[],
): void {
  const isCompactRemnant =
    COMPACT_REMNANT_STATES.has(
      stateName,
    );

  if (
    activity.ordinaryFlareModelApplicable ===
      isCompactRemnant
  ) {
    violations.push(
      createViolation(
        context,
        'ACTIVITY_APPLICABILITY',
        `${stateName} has ordinaryFlareModelApplicable=${activity.ordinaryFlareModelApplicable}; compact remnants must be excluded and ordinary stars/substellar objects included.`,
      ),
    );
  }

  if (
    rotation.ordinaryRotationModelApplicable ===
      isCompactRemnant
  ) {
    violations.push(
      createViolation(
        context,
        'ROTATION_APPLICABILITY',
        `${stateName} has ordinaryRotationModelApplicable=${rotation.ordinaryRotationModelApplicable}; compact remnants must be excluded and ordinary stars/substellar objects included.`,
      ),
    );
  }

  if (
    activity.ordinaryFlareModelApplicable &&
    (
      activity.magneticActivityIndex ===
        null ||
      activity.magneticActivityIndex <
        0 ||
      activity.magneticActivityIndex >
        1 ||
      activity.flareRatePerDay ===
        null ||
      activity.flareRatePerDay <
        0 ||
      activity.typicalFlareEnergyJoules ===
        null ||
      activity.typicalFlareEnergyJoules <=
        0 ||
      activity.maximumFlareEnergyJoules ===
        null ||
      activity.maximumFlareEnergyJoules <
        activity.typicalFlareEnergyJoules
    )
  ) {
    violations.push(
      createViolation(
        context,
        'ACTIVITY_APPLICABILITY',
        'Applicable point-15.4 activity exposes an invalid normalized index or flare statistic.',
      ),
    );
  }

  if (
    rotation.ordinaryRotationModelApplicable &&
    (
      rotation.rotationPeriodDays ===
        null ||
      rotation.rotationPeriodDays <=
        0 ||
      rotation.stabilityIndex ===
        null ||
      rotation.stabilityIndex <
        0 ||
      rotation.stabilityIndex >
        1
    )
  ) {
    violations.push(
      createViolation(
        context,
        'ROTATION_APPLICABILITY',
        'Applicable point-15.5 rotation exposes an invalid period or stability index.',
      ),
    );
  }
}

function checkStarMaterialization(
  generationKey:
    UniverseGenerationKey,
  locator:
    SystemLocator,
  assessment: ReturnType<
    typeof StellarGenerator.generateLifetimeProfile
  >['evolutionAssessment'],
  star: ReturnType<
    typeof StellarGenerator.generateStar
  >,
  context:
    ViolationContext,
  violations:
    StellarCoherenceViolation[],
): void {
  const sameLocator =
    star.locator.galaxyIndex ===
      locator.galaxyIndex &&
    star.locator.sectorKey ===
      locator.sectorKey &&
    star.locator.galacticObjectIndex ===
      locator.galacticObjectIndex;

  const sameClassification =
    star.evolutionState.name ===
      assessment.evolutionState.name &&
    nullableName(
      star.mainSequenceClass,
    ) ===
      nullableName(
        assessment.mainSequenceClass,
      ) &&
    nullableName(
      star.brownDwarfClass,
    ) ===
      nullableName(
        assessment.brownDwarfClass,
      ) &&
    nullableName(
      star.postMainSequenceStage,
    ) ===
      nullableName(
        assessment.postMainSequenceStage,
      ) &&
    nullableName(
      star.whiteDwarfComposition,
    ) ===
      nullableName(
        assessment.whiteDwarfComposition,
      ) &&
    nullableName(
      star.neutronStarFormationChannel,
    ) ===
      nullableName(
        assessment.neutronStarFormationChannel,
      ) &&
    nullableName(
      star.blackHoleFormationChannel,
    ) ===
      nullableName(
        assessment.blackHoleFormationChannel,
      );

  if (
    !generationKey.equals(
      star.generationKey,
    ) ||
    !sameLocator ||
    !sameClassification
  ) {
    violations.push(
      createViolation(
        context,
        'STAR_MATERIALIZATION',
        'Canonical Star identity/classification does not match the generated point-15.3 evolution assessment.',
      ),
    );
  }
}

function checkDesignationIdentity(
  generationKey:
    UniverseGenerationKey,
  locator:
    SystemLocator,
  systemSeedHex:
    string,
  name:
    string,
  proceduralCode:
    string,
  context:
    ViolationContext,
  violations:
    StellarCoherenceViolation[],
): void {
  const expectedCode =
    `GEN-V${generationKey.generatorVersion.code}` +
    `-G${locator.galaxyIndex}` +
    `-S${locator.sectorKey}` +
    `-O${locator.galacticObjectIndex}` +
    `-SYS-${systemSeedHex}`;

  if (
    name.trim().length ===
      0 ||
    proceduralCode !==
      expectedCode
  ) {
    violations.push(
      createViolation(
        context,
        'DESIGNATION_IDENTITY',
        `Point-15.6 designation is not bound to the canonical SystemLocator/SystemSeed. Expected ${expectedCode}, received ${proceduralCode}.`,
      ),
    );
  }
}

function createViolation(
  context:
    ViolationContext,
  invariant:
    StellarCoherenceInvariant,
  message:
    string,
): StellarCoherenceViolation {
  return {
    universeSeed:
      context.universeSeed,
    systemSeedHex:
      context.systemSeedHex,
    galaxyIndex:
      context.locator
        .galaxyIndex
        .toString(),
    sectorKey:
      context.locator
        .sectorKey
        .toString(),
    galacticObjectIndex:
      context.locator
        .galacticObjectIndex
        .toString(),
    scenario:
      context.scenario,
    invariant,
    message,
  };
}

function canonicalScientificRecord(
  universeSeed:
    string,
  locator:
    SystemLocator,
  scenario:
    StellarCoherenceScenarioName,
  systemSeedHex:
    string,
  physical: ReturnType<
    typeof StellarGenerator.generatePhysicalProperties
  >,
  spectralDesignation:
    string,
  colorHex:
    string,
  lifetime: ReturnType<
    typeof StellarGenerator.generateLifetimeProfile
  >,
  activity: ReturnType<
    typeof StellarGenerator.generateActivityProfile
  >,
  rotation: ReturnType<
    typeof StellarGenerator.generateRotationStabilityProfile
  >,
  designationName:
    string,
  proceduralCode:
    string,
): string {
  const assessment =
    lifetime.evolutionAssessment;

  return [
    universeSeed,
    locatorKey(
      locator,
    ),
    scenario,
    systemSeedHex,
    finiteNumberKey(
      physical.initialMassSolar,
    ),
    finiteNumberKey(
      physical.currentMassSolar,
    ),
    finiteNumberKey(
      physical.radiusSolar,
    ),
    finiteNumberKey(
      physical.luminositySolar,
    ),
    finiteNumberKey(
      physical.effectiveTemperatureKelvin,
    ),
    spectralDesignation,
    colorHex,
    finiteNumberKey(
      lifetime.ageBillionYears,
    ),
    nullableFiniteNumberKey(
      lifetime.terminalAgeBillionYears,
    ),
    nullableFiniteNumberKey(
      lifetime.remainingLifeBillionYears,
    ),
    assessment.evolutionState.name,
    nullableName(
      assessment.mainSequenceClass,
    ),
    nullableName(
      assessment.brownDwarfClass,
    ),
    nullableName(
      assessment.postMainSequenceStage,
    ),
    nullableName(
      assessment.whiteDwarfComposition,
    ),
    nullableName(
      assessment.neutronStarFormationChannel,
    ),
    nullableName(
      assessment.blackHoleFormationChannel,
    ),
    String(
      activity.ordinaryFlareModelApplicable,
    ),
    nullableFiniteNumberKey(
      activity.magneticActivityIndex,
    ),
    nullableName(
      activity.regime,
    ),
    nullableFiniteNumberKey(
      activity.flareRatePerDay,
    ),
    nullableFiniteNumberKey(
      activity.typicalFlareEnergyJoules,
    ),
    nullableFiniteNumberKey(
      activity.maximumFlareEnergyJoules,
    ),
    String(
      rotation.ordinaryRotationModelApplicable,
    ),
    nullableFiniteNumberKey(
      rotation.rotationPeriodDays,
    ),
    nullableName(
      rotation.rotationRegime,
    ),
    nullableFiniteNumberKey(
      rotation.stabilityIndex,
    ),
    nullableName(
      rotation.stabilityRegime,
    ),
    designationName,
    proceduralCode,
  ].join('|');
}

function locatorKey(
  locator:
    SystemLocator,
): string {
  return `${locator.galaxyIndex}:${locator.sectorKey}:${locator.galacticObjectIndex}`;
}

function finiteNumberKey(
  value:
    number,
): string {
  const normalized =
    Object.is(
      value,
      -0,
    )
      ? 0
      : value;

  return normalized
    .toExponential(
      CHECKSUM_SIGNIFICANT_DIGITS -
        1,
    );
}

function nullableFiniteNumberKey(
  value:
    number | null,
): string {
  return value ===
    null
    ? 'null'
    : finiteNumberKey(
        value,
      );
}

function nullableName(
  value:
    | {
        readonly name:
          string;
      }
    | null,
): string | null {
  return value?.name ??
    null;
}

function near(
  actual:
    number,
  expected:
    number,
  relativeTolerance:
    number,
): boolean {
  const scale =
    Math.max(
      1,
      Math.abs(
        actual,
      ),
      Math.abs(
        expected,
      ),
    );

  return Math.abs(
    actual -
      expected,
  ) <=
    relativeTolerance *
    scale;
}

function hashStringFNV1a64(
  initial:
    bigint,
  value:
    string,
): bigint {
  let hash =
    initial;

  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {
    hash ^=
      BigInt(
        value.charCodeAt(
          index,
        ),
      );

    hash =
      (
        hash *
        FNV64_PRIME
      ) &
      FNV64_MASK;
  }

  return hash;
}

function emptyEvolutionStateCounts():
  Record<StellarEvolutionStateName, number> {
  return {
    BROWN_DWARF: 0,
    MAIN_SEQUENCE: 0,
    GIANT: 0,
    SUPERGIANT: 0,
    WHITE_DWARF: 0,
    NEUTRON_STAR: 0,
    STELLAR_BLACK_HOLE: 0,
  };
}

function emptySpectralFamilyCounts():
  Record<StellarSpectralFamily, number> {
  return {
    O: 0,
    B: 0,
    A: 0,
    F: 0,
    G: 0,
    K: 0,
    M: 0,
    L: 0,
    T: 0,
    Y: 0,
  };
}

function emptyScenarioCounts():
  Record<StellarCoherenceScenarioName, number> {
  return {
    YOUNG_ACTIVE: 0,
    ACTIVE_METAL_RICH: 0,
    MIXED_SOLAR: 0,
    QUIESCENT_METAL_POOR: 0,
    OLD_QUIESCENT: 0,
  };
}
