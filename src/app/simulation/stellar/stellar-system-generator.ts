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
  CircumbinaryPlanetCompatibilityGenerator,
} from '../planetary/circumbinary-planet-compatibility-generator';

import {
  StellarBinaryCompanionGenerator,
} from './stellar-binary-companion-generator';

import {
  StellarDesignationGenerator,
} from './stellar-designation-generator';

import {
  StellarGenerator,
} from './stellar-generator';

import {
  StellarSystemMultiplicitySelector,
} from './stellar-system-multiplicity-selector';

import {
  StellarOrbitHierarchyGenerator,
} from './stellar-orbit-hierarchy-generator';

import {
  StellarTripleCompanionGenerator,
} from './stellar-triple-companion-generator';

/**
 * Phase-16 materializer for stellar-system architectures.
 *
 * Point 16.1 established generateSingle(), point 16.2 added generateBinary(),
 * and point 16.3 adds generateTriple() plus generate(), which freezes the V1
 * multiplicity selection after all supported component counts exist.
 *
 * Every architecture preserves SystemLocator/SystemSeed as system identity.
 * The canonical phase-15 primary A is bit-for-bit unchanged; B and C come from
 * independent intra-system branches. Point 16.4 adds deterministic simplified
 * orbit hierarchies on independent branches without perturbing those identities.
 * Point 16.5 derives a pure dynamical circumbinary-planet envelope from those
 * already-frozen masses/orbits and consumes no additional entropy.
 */
export class StellarSystemGenerator {

  private constructor() {}

  static generate(
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

    const multiplicity =
      StellarSystemMultiplicitySelector
        .select(
          generationKey,
          seed,
        );

    if (
      multiplicity ===
      StellarSystemMultiplicity.SINGLE
    ) {
      return this.generateSingle(
        generationKey,
        locator,
        sectorStellarPopulation,
        stellarPopulationProfile,
      );
    }

    if (
      multiplicity ===
      StellarSystemMultiplicity.BINARY
    ) {
      return this.generateBinary(
        generationKey,
        locator,
        sectorStellarPopulation,
        stellarPopulationProfile,
      );
    }

    return this.generateTriple(
      generationKey,
      locator,
      sectorStellarPopulation,
      stellarPopulationProfile,
    );
  }

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

    const orbitHierarchy =
      StellarOrbitHierarchyGenerator
        .generateSingle(
          generationKey,
        );

    return new StellarSystem(
      generationKey,
      locator,
      seed,
      designation,
      StellarSystemMultiplicity.SINGLE,
      primaryStar,
      orbitHierarchy,
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
     * mutable/shared state and keep B coeval with the canonical primary A.
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

    const orbitHierarchy =
      StellarOrbitHierarchyGenerator
        .generateBinary(
          generationKey,
          single.seed,
          primaryPhysicalProperties,
          secondaryCompanion,
        );

    const circumbinaryPlanetCompatibility =
      CircumbinaryPlanetCompatibilityGenerator
        .generateBinary(
          generationKey,
          orbitHierarchy,
          primaryPhysicalProperties,
          secondaryCompanion,
        );

    return new StellarSystem(
      generationKey,
      locator,
      single.seed,
      single.designation,
      StellarSystemMultiplicity.BINARY,
      single.primaryStar,
      orbitHierarchy,
      secondaryCompanion,
      null,
      circumbinaryPlanetCompatibility,
    );
  }

  static generateTriple(
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

    const binary =
      this.generateBinary(
        generationKey,
        locator,
        sectorStellarPopulation,
        stellarPopulationProfile,
      );

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

    const tertiaryCompanion =
      StellarTripleCompanionGenerator
        .generate(
          generationKey,
          binary.seed,
          binary.designation,
          primaryPhysicalProperties,
          binary.secondaryCompanion!,
          primaryLifetimeProfile,
          sectorStellarPopulation,
        );

    const orbitHierarchy =
      StellarOrbitHierarchyGenerator
        .generateTriple(
          generationKey,
          binary.seed,
          primaryPhysicalProperties,
          binary.secondaryCompanion!,
          tertiaryCompanion,
        );

    const circumbinaryPlanetCompatibility =
      CircumbinaryPlanetCompatibilityGenerator
        .generateTriple(
          generationKey,
          orbitHierarchy,
          primaryPhysicalProperties,
          binary.secondaryCompanion!,
          tertiaryCompanion,
        );

    return new StellarSystem(
      generationKey,
      locator,
      binary.seed,
      binary.designation,
      StellarSystemMultiplicity.TRIPLE,
      binary.primaryStar,
      orbitHierarchy,
      binary.secondaryCompanion,
      tertiaryCompanion,
      circumbinaryPlanetCompatibility,
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
