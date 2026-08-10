import {
  type UniverseGenerationKey,
} from '../generation/universe-generation-key';

/**
 * Root domain model for a GENESIS universe.
 *
 * The complete procedural identity of the universe is represented by its
 * UniverseGenerationKey.
 *
 * Galaxies are not materialized as a global collection here. They are
 * addressed and generated lazily by galaxy index.
 */
export class GenesisUniverse {

  /**
   * Canonical index of the initial/home galaxy.
   */
  static readonly INITIAL_GALAXY_INDEX =
    0n;

  constructor(
    readonly generationKey:
      UniverseGenerationKey,
  ) {}
}