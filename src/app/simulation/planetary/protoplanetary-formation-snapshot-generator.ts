import {
  type SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type EarlyPlanetaryDynamicsOutcome,
} from '../../domain/planetary/early-planetary-dynamics-outcome';

import {
  type PlanetFormationProfile,
} from '../../domain/planetary/planet-formation-profile';

import {
  type ProtoplanetCandidatePopulation,
} from '../../domain/planetary/protoplanet-candidate-population';

import {
  type ProtoplanetaryDiskProfile,
} from '../../domain/planetary/protoplanetary-disk-profile';

import {
  type ProtoplanetaryDiskStructure,
} from '../../domain/planetary/protoplanetary-disk-structure';

import {
  GalaxySectorKeyCodec,
} from '../../domain/sector/galaxy-sector-key-codec';

import {
  type GalaxySectorStellarPopulationProperties,
} from '../../domain/sector/galaxy-sector-stellar-population-properties';

import {
  type SystemSeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  StellarEvolutionInput,
} from '../../domain/stellar/stellar-evolution-input';

import {
  StellarLifetimeProfile,
} from '../../domain/stellar/stellar-lifetime-profile';

import {
  type StellarPhysicalProperties,
} from '../../domain/stellar/stellar-physical-properties';

import {
  type StellarYouthProfile,
} from '../../domain/stellar/stellar-youth-profile';

import {
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

import {
  GalaxySectorGridGenerator,
} from '../sector/galaxy-sector-grid-generator';

import {
  GalaxySectorStellarDensityGenerator,
} from '../sector/galaxy-sector-stellar-density-generator';

import {
  GalaxySectorStellarPopulationPropertiesGenerator,
} from '../sector/galaxy-sector-stellar-population-properties-generator';

import {
  StellarEvolutionEngine,
} from '../stellar/stellar-evolution-engine';

import {
  StellarGenerator,
} from '../stellar/stellar-generator';

import {
  StellarPopulationProfileGenerator,
} from '../stellar/stellar-population-profile-generator';

import {
  StellarYouthProfileGenerator,
} from '../stellar/stellar-youth-profile-generator';

import {
  GalaxyGenerator,
} from '../universe/galaxy-generator';

import {
  EarlyPlanetaryDynamicsGenerator,
} from './early-planetary-dynamics-generator';

import {
  PlanetFormationProfileGenerator,
} from './planet-formation-profile-generator';

import {
  ProtoplanetCandidatePopulationGenerator,
} from './protoplanet-candidate-population-generator';

import {
  ProtoplanetaryDiskProfileGenerator,
} from './protoplanetary-disk-profile-generator';

import {
  ProtoplanetaryDiskStructureGenerator,
} from './protoplanetary-disk-structure-generator';

const BILLION_YEARS_TO_MILLION_YEARS =
  1_000;

const AGE_TOLERANCE_MILLION_YEARS =
  1e-9;

/**
 * Internal point-17.6 materialization of the already-frozen 17.1-17.5 chain
 * for one SystemLocator.
 *
 * This snapshot is not persisted. It gives observation/presentation layers one
 * canonical way to regenerate the same formation Ground Truth without
 * duplicating the phase-17 pipeline.
 */
export interface ProtoplanetaryFormationSnapshot {
  readonly systemSeed:
    SystemSeed;

  readonly stellarPhysicalProperties:
    StellarPhysicalProperties;

  readonly stellarLifetimeProfile:
    StellarLifetimeProfile;

  readonly stellarYouthProfile:
    StellarYouthProfile;

  readonly diskProfile:
    ProtoplanetaryDiskProfile;

  readonly planetFormationProfile:
    PlanetFormationProfile;

  readonly diskStructure:
    ProtoplanetaryDiskStructure;

  readonly candidatePopulation:
    ProtoplanetCandidatePopulation;

  readonly earlyDynamics:
    EarlyPlanetaryDynamicsOutcome;
}

interface ProtoplanetaryFormationContext {
  readonly systemSeed:
    SystemSeed;

  readonly stellarPhysicalProperties:
    StellarPhysicalProperties;

  readonly currentStellarLifetimeProfile:
    StellarLifetimeProfile;

  readonly sectorStellarPopulation:
    GalaxySectorStellarPopulationProperties;

  readonly planetFormationProfile:
    PlanetFormationProfile;
}

export class ProtoplanetaryFormationSnapshotGenerator {

  private constructor() {}

  /**
   * Current-age point-17.1..17.5 snapshot.
   *
   * This preserves the original 17.6 semantics: once the primordial disk has
   * dispersed, the method returns null and therefore remains suitable for the
   * ANALYZE DISK observation path.
   */
  static generateOrNull(
    generationKey:
      UniverseGenerationKey,

    locator:
      SystemLocator,
  ): ProtoplanetaryFormationSnapshot | null {

    const context =
      materializeContext(
        generationKey,
        locator,
      );

    const stellarYouthProfile =
      StellarYouthProfileGenerator
        .generateOrNull(
          generationKey,
          context
            .stellarPhysicalProperties,
          context
            .currentStellarLifetimeProfile,
        );

    if (
      stellarYouthProfile ===
      null
    ) {
      return null;
    }

    const diskProfile =
      ProtoplanetaryDiskProfileGenerator
        .generateOrNull(
          generationKey,
          context
            .stellarPhysicalProperties,
          stellarYouthProfile,
        );

    if (
      diskProfile ===
      null
    ) {
      return null;
    }

    return materializeFormationSnapshot(
      generationKey,
      context,
      context.currentStellarLifetimeProfile,
      stellarYouthProfile,
      diskProfile,
    );
  }

  /**
   * Replays the historical phase-17 formation state that feeds mature phases
   * 17.7 -> 18 -> 19 after the primordial disk has disappeared.
   *
   * The reference epoch is not invented by presentation. V1 reuses the exact
   * frozen point-17.2 EVOLVING -> DISPERSING transition (80% of the disk
   * dispersal lifetime). If the current star has not reached that epoch yet,
   * mature planets are not materialized and this returns null.
   *
   * No new hierarchical seed, hash branch or PRNG draw is introduced here.
   * Historical stellar age evaluation is a pure replay of phase 14/17.1.
   */
  static generateMaturationReferenceOrNull(
    generationKey:
      UniverseGenerationKey,

    locator:
      SystemLocator,
  ): ProtoplanetaryFormationSnapshot | null {

    const context =
      materializeContext(
        generationKey,
        locator,
      );

    const zeroAgeLifetimeProfile =
      historicalLifetimeProfile(
        generationKey,
        context
          .stellarPhysicalProperties,
        context
          .sectorStellarPopulation,
        0,
      );

    const zeroAgeYouthProfile =
      StellarYouthProfileGenerator
        .generateOrNull(
          generationKey,
          context
            .stellarPhysicalProperties,
          zeroAgeLifetimeProfile,
        );

    const maturationAgeMillionYears =
      ProtoplanetaryDiskProfileGenerator
        .maturationReferenceAgeMillionYears(
          generationKey,
          context
            .stellarPhysicalProperties,
          zeroAgeYouthProfile,
        );

    if (
      maturationAgeMillionYears ===
      null
    ) {
      return null;
    }

    const currentAgeMillionYears =
      context
        .currentStellarLifetimeProfile
        .ageBillionYears *
      BILLION_YEARS_TO_MILLION_YEARS;

    if (
      currentAgeMillionYears +
        AGE_TOLERANCE_MILLION_YEARS <
      maturationAgeMillionYears
    ) {
      return null;
    }

    const maturationLifetimeProfile =
      historicalLifetimeProfile(
        generationKey,
        context
          .stellarPhysicalProperties,
        context
          .sectorStellarPopulation,
        maturationAgeMillionYears /
          BILLION_YEARS_TO_MILLION_YEARS,
      );

    const maturationYouthProfile =
      StellarYouthProfileGenerator
        .generateOrNull(
          generationKey,
          context
            .stellarPhysicalProperties,
          maturationLifetimeProfile,
        );

    if (
      maturationYouthProfile ===
      null
    ) {
      return null;
    }

    const maturationDiskProfile =
      ProtoplanetaryDiskProfileGenerator
        .generateOrNull(
          generationKey,
          context
            .stellarPhysicalProperties,
          maturationYouthProfile,
        );

    if (
      maturationDiskProfile ===
      null
    ) {
      return null;
    }

    return materializeFormationSnapshot(
      generationKey,
      context,
      maturationLifetimeProfile,
      maturationYouthProfile,
      maturationDiskProfile,
    );
  }
}

function materializeContext(
  generationKey:
    UniverseGenerationKey,

  locator:
    SystemLocator,
): ProtoplanetaryFormationContext {

  const galaxy =
    GalaxyGenerator.generate(
      generationKey,
      locator.galaxyIndex,
    );

  const grid =
    GalaxySectorGridGenerator
      .generate(
        galaxy,
      );

  const coordinates =
    GalaxySectorKeyCodec
      .decode(
        locator.sectorKey,
      );

  const stellarDensity =
    GalaxySectorStellarDensityGenerator
      .generate(
        galaxy,
        grid,
        coordinates,
      );

  const sectorStellarPopulation =
    GalaxySectorStellarPopulationPropertiesGenerator
      .generate(
        galaxy,
        stellarDensity,
      );

  const stellarPopulationProfile =
    StellarPopulationProfileGenerator
      .generate(
        generationKey,
        galaxy.physicalProperties,
        sectorStellarPopulation,
      );

  const stellarPhysicalProperties =
    StellarGenerator
      .generatePhysicalProperties(
        generationKey,
        locator,
        sectorStellarPopulation,
        stellarPopulationProfile,
      );

  const currentStellarLifetimeProfile =
    StellarGenerator
      .generateLifetimeProfile(
        generationKey,
        locator,
        stellarPhysicalProperties,
        sectorStellarPopulation,
        stellarPopulationProfile,
      );

  const systemSeed =
    ProceduralTargetResolver
      .resolveTargetSeed(
        generationKey,
        locator,
      ) as SystemSeed;

  const planetFormationProfile =
    PlanetFormationProfileGenerator
      .generate(
        generationKey,
        sectorStellarPopulation,
      );

  return Object.freeze({
    systemSeed,
    stellarPhysicalProperties,
    currentStellarLifetimeProfile,
    sectorStellarPopulation,
    planetFormationProfile,
  });
}

function historicalLifetimeProfile(
  generationKey:
    UniverseGenerationKey,

  physicalProperties:
    StellarPhysicalProperties,

  sectorStellarPopulation:
    GalaxySectorStellarPopulationProperties,

  ageBillionYears:
    number,
): StellarLifetimeProfile {

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

function materializeFormationSnapshot(
  generationKey:
    UniverseGenerationKey,

  context:
    ProtoplanetaryFormationContext,

  stellarLifetimeProfile:
    StellarLifetimeProfile,

  stellarYouthProfile:
    StellarYouthProfile,

  diskProfile:
    ProtoplanetaryDiskProfile,
): ProtoplanetaryFormationSnapshot {

  const diskStructure =
    ProtoplanetaryDiskStructureGenerator
      .generate(
        generationKey,
        context.systemSeed,
        diskProfile,
        context.planetFormationProfile,
      );

  const candidatePopulation =
    ProtoplanetCandidatePopulationGenerator
      .generate(
        generationKey,
        context.systemSeed,
        diskProfile,
        diskStructure,
        context.planetFormationProfile,
      );

  const earlyDynamics =
    EarlyPlanetaryDynamicsGenerator
      .generate(
        generationKey,
        context.systemSeed,
        diskProfile,
        diskStructure,
        candidatePopulation,
      );

  return Object.freeze({
    systemSeed:
      context.systemSeed,
    stellarPhysicalProperties:
      context.stellarPhysicalProperties,
    stellarLifetimeProfile,
    stellarYouthProfile,
    diskProfile,
    planetFormationProfile:
      context.planetFormationProfile,
    diskStructure,
    candidatePopulation,
    earlyDynamics,
  });
}
