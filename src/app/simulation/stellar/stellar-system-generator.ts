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
  StellarDesignationGenerator,
} from './stellar-designation-generator';

import {
  StellarGenerator,
} from './stellar-generator';

/**
 * Point-16.1 materializer for an explicitly single-star stellar system.
 *
 * This generator intentionally performs no multiplicity draw. Point 16.1 is
 * the canonical SINGLE architecture itself; deciding whether an arbitrary
 * SystemLocator is single, binary or triple belongs to later roadmap points.
 *
 * The system reuses the already-frozen SystemSeed, point-15 designation and
 * canonical primary Star. Consequently this point consumes no new PRNG draws
 * and cannot perturb any phase-15 branch.
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

    if (
      generationKey
        .generatorVersion !==
      GeneratorVersion.V1
    ) {
      throw new RangeError(
        `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
      );
    }

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
}
