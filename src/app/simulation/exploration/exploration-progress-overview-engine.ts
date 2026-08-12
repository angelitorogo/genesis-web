import {
  type KnownDiscovery,
} from '../../domain/discovery/known-discovery';

import {
  ExplorationProgressOverview,
} from '../../domain/exploration/exploration-progress-overview';

import {
  GalaxyExplorationProgress,
} from '../../domain/exploration/galaxy-exploration-progress';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

/**
 * Builds a read-only overview that deliberately separates:
 *
 * 1. global Discovery Points, supplied from persistent universe progression;
 * 2. local galaxy progress units, derived from the current known-discovery
 *    snapshot for the selected galaxy.
 *
 * V1 local progress is structural rather than economic:
 *
 *   galaxyProgressUnits =
 *     sum(knownDiscovery.state.code)
 *
 * for discoveries whose locator.galaxyIndex equals the requested galaxy.
 *
 * DiscoveryState codes therefore contribute:
 *
 * - DETECTED:   1 unit
 * - DISCOVERED: 2 units
 * - VISITED:    3 units
 * - CATALOGUED: 4 units
 * - CONFIRMED:  5 units
 *
 * UNKNOWN never appears in KnownDiscovery snapshots.
 *
 * IMPORTANT:
 * This engine does not persist anything, does not award/spend PD, does not
 * unlock galaxies and consumes no random entropy. Coherence/duplicate
 * validation of repository snapshots belongs to the application/presentation
 * assembler that consumes this engine later; V1 only derives the overview
 * from the supplied snapshot.
 */
export class ExplorationProgressOverviewEngine {

  private constructor() {}

  static buildProgressOverview(
    generationKey:
      UniverseGenerationKey,

    globalDiscoveryPoints:
      bigint,

    galaxyIndex:
      bigint,

    knownDiscoveries:
      readonly KnownDiscovery[],
  ): ExplorationProgressOverview {

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.buildV1(
        globalDiscoveryPoints,
        galaxyIndex,
        knownDiscoveries,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static buildV1(
    globalDiscoveryPoints:
      bigint,

    galaxyIndex:
      bigint,

    knownDiscoveries:
      readonly KnownDiscovery[],
  ): ExplorationProgressOverview {

    let galaxyProgressUnits =
      0n;

    for (
      const discovery of
      knownDiscoveries
    ) {
      if (
        discovery
          .locator
          .galaxyIndex !==
        galaxyIndex
      ) {
        continue;
      }

      galaxyProgressUnits +=
        BigInt(
          discovery
            .state
            .code,
        );

      if (
        galaxyProgressUnits >
        SIGNED_LONG_MAX
      ) {
        throw new RangeError(
          'galaxyProgressUnits exceeds signed Long range.',
        );
      }
    }

    return new ExplorationProgressOverview(
      globalDiscoveryPoints,
      new GalaxyExplorationProgress(
        galaxyIndex,
        galaxyProgressUnits,
      ),
    );
  }
}
