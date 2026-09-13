import {
  BodyLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type PlanetarySystemOrbitTopology,
} from '../../domain/planetary/planetary-system-orbit-topology';

import {
  GalaxySectorKeyCodec,
} from '../../domain/sector/galaxy-sector-key-codec';

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
  StellarPopulationProfileGenerator,
} from '../stellar/stellar-population-profile-generator';

import {
  StellarSystemGenerator,
} from '../stellar/stellar-system-generator';

import {
  GalaxyGenerator,
} from '../universe/galaxy-generator';

import {
  PlanetaryFormationMaturationGenerator,
} from './planetary-formation-maturation-generator';

import {
  PlanetarySystemGenerator,
} from './planetary-system-generator';

import {
  ProtoplanetaryFormationSnapshotGenerator,
} from './protoplanetary-formation-snapshot-generator';

export interface PlanetScientificIdentitySource {
  readonly locator:
    BodyLocator;

  readonly planetOrdinal:
    number;

  readonly designation:
    string;

  readonly hostSystemDesignation:
    string;

  readonly orbitTopology:
    PlanetarySystemOrbitTopology;

  readonly hostPlanetCount:
    number;
}

/**
 * Point-26.3 deterministic resolver for the identity layer of one mature planet.
 *
 * This intentionally stops at the frozen phase-18 planetary-system boundary.
 * It does not materialize point-19 bulk physics, atmosphere, climate, geology,
 * moons or any later Ground Truth. Those facts belong to the 26.4 sections and
 * must be projected through their own scientific disclosure contracts.
 */
export class PlanetScientificTargetResolver {

  private constructor() {}

  static resolve(
    generationKey:
      UniverseGenerationKey,

    locator:
      BodyLocator,
  ): PlanetScientificIdentitySource | null {

    const systemLocator =
      new SystemLocator(
        locator.galaxyIndex,
        locator.sectorKey,
        locator.galacticObjectIndex,
      );

    const galaxy =
      GalaxyGenerator.generate(
        generationKey,
        systemLocator.galaxyIndex,
      );

    const grid =
      GalaxySectorGridGenerator
        .generate(
          galaxy,
        );

    const stellarDensity =
      GalaxySectorStellarDensityGenerator
        .generate(
          galaxy,
          grid,
          GalaxySectorKeyCodec
            .decode(
              systemLocator.sectorKey,
            ),
        );

    const stellarPopulation =
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
          stellarPopulation,
        );

    const stellarSystem =
      StellarSystemGenerator
        .generate(
          generationKey,
          systemLocator,
          stellarPopulation,
          stellarPopulationProfile,
        );

    const formationSnapshot =
      ProtoplanetaryFormationSnapshotGenerator
        .generateMaturationReferenceOrNull(
          generationKey,
          systemLocator,
        );

    if (
      formationSnapshot ===
        null
    ) {
      return null;
    }

    const formationBlueprint =
      PlanetaryFormationMaturationGenerator
        .generate(
          generationKey,
          formationSnapshot.systemSeed,
          formationSnapshot.diskProfile,
          formationSnapshot.diskStructure,
          formationSnapshot.planetFormationProfile,
          formationSnapshot.candidatePopulation,
          formationSnapshot.earlyDynamics,
        );

    const planetarySystem =
      PlanetarySystemGenerator
        .generate(
          generationKey,
          stellarSystem,
          formationBlueprint,
        );

    if (
      locator.bodyIndex <
        0n ||
      locator.bodyIndex >=
        BigInt(
          planetarySystem
            .planetCount,
        )
    ) {
      return null;
    }

    const index =
      Number(
        locator.bodyIndex,
      );

    const slot =
      planetarySystem
        .planetSlots[index];

    const designation =
      planetarySystem
        .planetDesignations[index];

    if (
      slot ===
        undefined ||
      designation ===
        undefined ||
      slot.bodyLocator.bodyIndex !==
        locator.bodyIndex
    ) {
      return null;
    }

    return Object.freeze({
      locator:
        slot.bodyLocator,
      planetOrdinal:
        slot.planetOrdinal,
      designation:
        designation.name,
      hostSystemDesignation:
        stellarSystem.designation.name,
      orbitTopology:
        planetarySystem
          .architecture
          .orbitTopology,
      hostPlanetCount:
        planetarySystem
          .planetCount,
    });
  }
}
