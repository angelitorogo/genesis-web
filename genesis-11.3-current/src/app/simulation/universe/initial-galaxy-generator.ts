import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type Galaxy,
} from '../../domain/universe/galaxy';

import {
  GenesisUniverse,
} from '../../domain/universe/genesis-universe';

import {
  GalaxyGenerator,
} from './galaxy-generator';

/**
 * Procedural generator for the initial/home galaxy of a universe.
 *
 * Stateless and deterministic.
 *
 * The complete V1 galaxy-generation pipeline lives in GalaxyGenerator.
 * This class is only the strict facade for GenesisUniverse.INITIAL_GALAXY_INDEX.
 */
export class InitialGalaxyGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,
  ): Galaxy {

    return GalaxyGenerator
      .generate(
        generationKey,
        GenesisUniverse
          .INITIAL_GALAXY_INDEX,
      );
  }
}
