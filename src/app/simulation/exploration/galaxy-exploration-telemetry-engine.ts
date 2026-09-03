import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  type KnownDiscovery,
} from '../../domain/discovery/known-discovery';

import {
  GalaxyExplorationTelemetry,
  type GalaxyExplorationInventoryCounts,
} from '../../domain/exploration/galaxy-exploration-telemetry';

import {
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  BodyLocator,
  CivilizationLocator,
  GalacticObjectLocator,
  GalaxyLocator,
  SectorLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxySectorGridGenerator,
} from '../sector/galaxy-sector-grid-generator';

import {
  GalaxyGenerator,
} from '../universe/galaxy-generator';

import {
  ExplorationSectorResultEngine,
} from './exploration-sector-result-engine';

const SIGNED_LONG_MAX =
  (1n << 63n) -
  1n;

const PERCENT_BASIS_POINTS =
  10_000n;

/**
 * Point-26.1 knowledge-safe inventory/coverage projection.
 *
 * The only denominator exposed is the already-addressable phase-5 sector grid.
 * This is the same cartographic boundary used by galactic-map sector navigation:
 * no sector contents are enumerated or generated to obtain it.
 *
 * Object-family counters inspect only persisted GalacticObjectLocator rows and
 * reuse the frozen point-9.4 broad family classifier. They do not materialize
 * nebula/cluster/extreme-object physical models.
 *
 * The current discovery persistence ABI has no individual moon or phase-22
 * minor-body rows. Those counters therefore remain zero rather than replaying
 * phase-21/22 Ground Truth for every known system.
 */
export class GalaxyExplorationTelemetryEngine {

  private constructor() {}

  static build(
    generationKey:
      UniverseGenerationKey,

    galaxyIndex:
      bigint,

    galaxyState:
      DiscoveryStateValue,

    knownDiscoveries:
      readonly KnownDiscovery[],
  ): GalaxyExplorationTelemetry {

    if (
      galaxyIndex <
        0n ||
      galaxyIndex >
        SIGNED_LONG_MAX
    ) {
      throw new RangeError(
        `galaxyIndex must be a non-negative signed Long: ${galaxyIndex}.`,
      );
    }

    const canonicalState =
      DiscoveryState
        .fromCode(
          galaxyState.code,
        );

    if (
      !DiscoveryState.isKnown(
        canonicalState,
      )
    ) {
      throw new RangeError(
        'GalaxyExplorationTelemetryEngine requires a known galaxy.',
      );
    }

    const emptyInventory =
      emptyInventoryCounts();

    /*
     * DETECTED external galaxies cannot yet open the galactic map. Return an
     * intentionally empty inventory before touching any classifier/generator so
     * malformed persistence cannot turn this dashboard into a Ground Truth side
     * channel.
     */
    if (
      canonicalState.code <
      DiscoveryState
        .DISCOVERED
        .code
    ) {
      return new GalaxyExplorationTelemetry(
        null,
        null,
        emptyInventory,
      );
    }

    const mutable = {
      ...emptyInventory,
    };

    for (
      const discovery
      of knownDiscoveries
    ) {
      if (
        !DiscoveryState.isKnown(
          discovery.state,
        ) ||
        discovery
          .locator
          .galaxyIndex !==
        galaxyIndex
      ) {
        continue;
      }

      const locator =
        discovery.locator;

      if (
        locator instanceof
        GalaxyLocator
      ) {
        continue;
      }

      if (
        locator instanceof
        SectorLocator
      ) {
        mutable.sectors +=
          1n;

        continue;
      }

      if (
        locator instanceof
        SystemLocator
      ) {
        mutable.systems +=
          1n;

        continue;
      }

      if (
        locator instanceof
        GalacticObjectLocator
      ) {
        const kind =
          ExplorationSectorResultEngine
            .resolveGalacticObjectKind(
              generationKey,
              locator,
            );

        if (
          kind ===
          ExplorationResultKind
            .STAR_CLUSTER
        ) {
          mutable.starClusters +=
            1n;

          continue;
        }

        if (
          kind ===
          ExplorationResultKind
            .NEBULA
        ) {
          mutable.nebulae +=
            1n;

          continue;
        }

        if (
          kind ===
          ExplorationResultKind
            .EXTREME_OBJECT
        ) {
          mutable.extremeObjects +=
            1n;

          continue;
        }

        throw new RangeError(
          `Unexpected persistent GalacticObjectLocator family: ${kind}.`,
        );
      }

      /*
       * BodyLocator is the persisted phase-19 planetary identity. Natural
       * satellites own MoonLocator from 21.8, which is intentionally outside
       * the historical discovery persistence ABI used here.
       */
      if (
        locator instanceof
        BodyLocator
      ) {
        mutable.planets +=
          1n;

        continue;
      }

      if (
        locator instanceof
        CivilizationLocator
      ) {
        mutable.civilizations +=
          1n;
      }
    }

    const inventory =
      Object.freeze({
        ...mutable,
      }) satisfies
        GalaxyExplorationInventoryCounts;

    const galaxy =
      GalaxyGenerator
        .generate(
          generationKey,
          galaxyIndex,
        );

    const grid =
      GalaxySectorGridGenerator
        .generate(
          galaxy,
        );

    const side =
      grid.sideLengthInSectors;

    const totalSectors =
      side *
      side;

    const exploredPercentageBasisPoints =
      roundedBasisPoints(
        inventory.sectors,
        totalSectors,
      );

    return new GalaxyExplorationTelemetry(
      totalSectors,
      exploredPercentageBasisPoints,
      inventory,
    );
  }
}

function emptyInventoryCounts():
  GalaxyExplorationInventoryCounts {

  return Object.freeze({
    sectors:
      0n,
    systems:
      0n,
    starClusters:
      0n,
    nebulae:
      0n,
    extremeObjects:
      0n,
    planets:
      0n,
    moons:
      0n,
    asteroids:
      0n,
    comets:
      0n,
    transNeptunianObjects:
      0n,
    capturedObjects:
      0n,
    civilizations:
      0n,
  });
}


function roundedBasisPoints(
  exploredSectors:
    bigint,

  totalSectors:
    bigint,
): bigint {

  if (
    totalSectors <=
    0n
  ) {
    throw new RangeError(
      'totalSectors must be positive.',
    );
  }

  const rounded =
    (
      exploredSectors *
        PERCENT_BASIS_POINTS +
      totalSectors /
        2n
    ) /
    totalSectors;

  return rounded >
    PERCENT_BASIS_POINTS
    ? PERCENT_BASIS_POINTS
    : rounded;
}
