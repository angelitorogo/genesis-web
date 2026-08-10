import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  InitialExplorationState,
  type InitialExplorationDiscoveryState,
} from '../../domain/exploration/initial-exploration-state';

import {
  GalaxyLocator,
  type ProceduralLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GenesisUniverse,
} from '../../domain/universe/genesis-universe';

/**
 * Generates the initial observed exploration state of a GENESIS universe.
 *
 * GeneratorVersion.V1 bootstrap:
 *
 * - active galaxy: GenesisUniverse.INITIAL_GALAXY_INDEX;
 * - discovery points: 0;
 * - initial galaxy: DISCOVERED;
 * - every other procedural target: UNKNOWN by absence.
 *
 * This generator:
 *
 * - consumes no random draws;
 * - derives no procedural seeds;
 * - reads no Ground Truth;
 * - performs no persistence operations.
 */
export class InitialExplorationStateGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,
  ): InitialExplorationState {

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.generateV1();
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static generateV1():
    InitialExplorationState {

    const initialGalaxyIndex =
      GenesisUniverse
        .INITIAL_GALAXY_INDEX;

    const initialGalaxyLocator =
      new GalaxyLocator(
        initialGalaxyIndex,
      );

    const knownDiscoveries =
      new Map<
        ProceduralLocator,
        InitialExplorationDiscoveryState
      >([
        [
          initialGalaxyLocator,
          DiscoveryState.DISCOVERED,
        ],
      ]);

    return new InitialExplorationState(
      initialGalaxyIndex,
      0n,
      knownDiscoveries,
    );
  }
}