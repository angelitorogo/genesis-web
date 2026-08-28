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
  type SystemSeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  type StellarLifetimeProfile,
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

/**
 * Internal point-17.6 materialization of the already-frozen 17.1-17.5 chain
 * for one SystemLocator.
 *
 * This snapshot is not persisted. It gives the observation/action layer one
 * canonical way to regenerate exactly the same young-star/disk/formation
 * Ground Truth without duplicating the pipeline in presentation code.
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

export class ProtoplanetaryFormationSnapshotGenerator {

  private constructor() {}

  static generateOrNull(
    generationKey:
      UniverseGenerationKey,

    locator:
      SystemLocator,
  ): ProtoplanetaryFormationSnapshot | null {

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

    const stellarLifetimeProfile =
      StellarGenerator
        .generateLifetimeProfile(
          generationKey,
          locator,
          stellarPhysicalProperties,
          sectorStellarPopulation,
          stellarPopulationProfile,
        );

    const stellarYouthProfile =
      StellarYouthProfileGenerator
        .generateOrNull(
          generationKey,
          stellarPhysicalProperties,
          stellarLifetimeProfile,
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
          stellarPhysicalProperties,
          stellarYouthProfile,
        );

    if (
      diskProfile ===
        null
    ) {
      return null;
    }

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

    const diskStructure =
      ProtoplanetaryDiskStructureGenerator
        .generate(
          generationKey,
          systemSeed,
          diskProfile,
          planetFormationProfile,
        );

    const candidatePopulation =
      ProtoplanetCandidatePopulationGenerator
        .generate(
          generationKey,
          systemSeed,
          diskProfile,
          diskStructure,
          planetFormationProfile,
        );

    const earlyDynamics =
      EarlyPlanetaryDynamicsGenerator
        .generate(
          generationKey,
          systemSeed,
          diskProfile,
          diskStructure,
          candidatePopulation,
        );

    return Object.freeze({
      systemSeed,
      stellarPhysicalProperties,
      stellarLifetimeProfile,
      stellarYouthProfile,
      diskProfile,
      planetFormationProfile,
      diskStructure,
      candidatePopulation,
      earlyDynamics,
    });
  }
}
