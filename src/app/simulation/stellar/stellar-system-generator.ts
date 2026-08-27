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
  type StellarPopulationProfile,
} from '../../domain/stellar/stellar-population-profile';

import {
  StellarSystem,
} from '../../domain/stellar/stellar-system';

import {
  StellarSystemMultiplicity,
} from '../../domain/stellar/stellar-system-multiplicity';

import {
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

import {
  StellarBinaryCompanionGenerator,
} from './stellar-binary-companion-generator';

import {
  StellarDesignationGenerator,
} from './stellar-designation-generator';

import {
  StellarGenerator,
} from './stellar-generator';

/**
 * Phase-16 materializer for explicit stellar-system architectures.
 *
 * Point 16.1 established generateSingle(). Point 16.2 adds generateBinary()
 * without introducing a multiplicity-selection draw: deciding what fraction of
 * arbitrary systems are SINGLE/BINARY/TRIPLE remains separate from defining
 * each architecture and can be frozen only once the triple contract exists.
 *
 * Both methods preserve SystemLocator/SystemSeed as the system identity. The
 * canonical point-15 primary remains bit-for-bit unchanged; binary component B
 * is derived from its own intra-system SHA-256 branch.
 */
export class StellarSystemGenerator {

  private constructor() {}

  static generateSingle(
    generationKey:
      UniverseGenerationKey,

    locator:
      SystemLocator,

    sectorStellarPopulation:
      GalaxySectorStellarPopulationProperties,

    stellarPopulationProfile:
      StellarPopulationProfile,
  ): StellarSystem {

    assertSupportedVersion(
      generationKey,
    );

    const seed =
      ProceduralTargetResolver
        .resolveTargetSeed(
          generationKey,
          locator,
        ) as SystemSeed;

    const designation =
      StellarDesignationGenerator
        .generate(
          generationKey,
          locator,
        );

    const primaryStar =
      StellarGenerator
        .generateStar(
          generationKey,
          locator,
          sectorStellarPopulation,
          stellarPopulationProfile,
        );

    return new StellarSystem(
      generationKey,
      locator,
      seed,
      designation,
      StellarSystemMultiplicity.SINGLE,
      primaryStar,
    );
  }

  static generateBinary(
    generationKey:
      UniverseGenerationKey,

    locator:
      SystemLocator,

    sectorStellarPopulation:
      GalaxySectorStellarPopulationProperties,

    stellarPopulationProfile:
      StellarPopulationProfile,
  ): StellarSystem {

    assertSupportedVersion(
      generationKey,
    );

    const single =
      this.generateSingle(
        generationKey,
        locator,
        sectorStellarPopulation,
        stellarPopulationProfile,
      );

    /*
     * These calls only re-materialize frozen point-15 values. They consume no
     * mutable/shared state and allow point 16.2 to make B coeval with A without
     * changing the Star entity or any point-15 draw stream.
     */
    const primaryPhysicalProperties =
      StellarGenerator
        .generatePhysicalProperties(
          generationKey,
          locator,
          sectorStellarPopulation,
          stellarPopulationProfile,
        );

    const primaryLifetimeProfile =
      StellarGenerator
        .generateLifetimeProfile(
          generationKey,
          locator,
          primaryPhysicalProperties,
          sectorStellarPopulation,
          stellarPopulationProfile,
        );

    const secondaryCompanion =
      StellarBinaryCompanionGenerator
        .generate(
          generationKey,
          single.seed,
          single.designation,
          primaryPhysicalProperties,
          primaryLifetimeProfile,
          sectorStellarPopulation,
        );

    return new StellarSystem(
      generationKey,
      locator,
      single.seed,
      single.designation,
      StellarSystemMultiplicity.BINARY,
      single.primaryStar,
      secondaryCompanion,
    );
  }
}

function assertSupportedVersion(
  generationKey:
    UniverseGenerationKey,
): void {

  if (
    generationKey
      .generatorVersion !==
    GeneratorVersion.V1
  ) {
    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }
}
