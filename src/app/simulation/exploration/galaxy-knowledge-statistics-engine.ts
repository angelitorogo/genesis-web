import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  type KnownDiscovery,
} from '../../domain/discovery/known-discovery';

import {
  GalaxyKnowledgeStatistics,
} from '../../domain/exploration/galaxy-knowledge-statistics';

import {
  BodyLocator,
  CivilizationLocator,
  GalacticObjectLocator,
  GalaxyLocator,
  type ProceduralLocator,
  SectorLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  ExplorationProgressOverviewEngine,
} from './exploration-progress-overview-engine';

/**
 * Point-11.4 deterministic, read-only statistics projector.
 *
 * It consumes only persisted KnownDiscovery records and reuses the frozen
 * point-7.3 local-progress formula. It does not generate procedural targets,
 * inspect hidden Ground Truth, calculate a completion denominator, read/write
 * Discovery Points, mutate DiscoveryState or change navigation focus.
 */
export class GalaxyKnowledgeStatisticsEngine {

  private constructor() {}

  static build(
    generationKey:
      UniverseGenerationKey,

    galaxyIndex:
      bigint,

    knownDiscoveries:
      readonly KnownDiscovery[],
  ): GalaxyKnowledgeStatistics {

    const locatorKeys =
      new Set<string>();

    let knownRecords =
      0n;

    let galaxyRecordCount =
      0n;

    let sectors =
      0n;

    let galacticObjects =
      0n;

    let systems =
      0n;

    let bodies =
      0n;

    let civilizations =
      0n;

    let detected =
      0n;

    let discovered =
      0n;

    let visited =
      0n;

    let catalogued =
      0n;

    let confirmed =
      0n;

    for (
      const discovery of
      knownDiscoveries
    ) {
      if (
        !sameGenerationKey(
          generationKey,
          discovery
            .generationKey,
        )
      ) {
        throw new RangeError(
          'knownDiscoveries must all belong to generationKey.',
        );
      }

      const canonicalState =
        DiscoveryState
          .fromCode(
            discovery
              .state
              .code,
          );

      if (
        !DiscoveryState.isKnown(
          canonicalState,
        )
      ) {
        throw new RangeError(
          'knownDiscoveries cannot contain DiscoveryState.UNKNOWN.',
        );
      }

      const locatorKey =
        locatorIdentity(
          discovery
            .locator,
        );

      if (
        locatorKeys.has(
          locatorKey,
        )
      ) {
        throw new RangeError(
          `knownDiscoveries contains duplicate locator: ${locatorKey}.`,
        );
      }

      locatorKeys.add(
        locatorKey,
      );

      if (
        discovery
          .locator
          .galaxyIndex !==
        galaxyIndex
      ) {
        continue;
      }

      knownRecords +=
        1n;

      if (
        discovery
          .locator instanceof
          GalaxyLocator
      ) {
        galaxyRecordCount +=
          1n;
      } else if (
        discovery
          .locator instanceof
          SectorLocator
      ) {
        sectors +=
          1n;
      } else if (
        discovery
          .locator instanceof
          GalacticObjectLocator
      ) {
        galacticObjects +=
          1n;
      } else if (
        discovery
          .locator instanceof
          SystemLocator
      ) {
        systems +=
          1n;
      } else if (
        discovery
          .locator instanceof
          BodyLocator
      ) {
        bodies +=
          1n;
      } else if (
        discovery
          .locator instanceof
          CivilizationLocator
      ) {
        civilizations +=
          1n;
      } else {
        throw new TypeError(
          'Unsupported ProceduralLocator.',
        );
      }

      if (
        canonicalState ===
        DiscoveryState.DETECTED
      ) {
        detected +=
          1n;
      } else if (
        canonicalState ===
        DiscoveryState.DISCOVERED
      ) {
        discovered +=
          1n;
      } else if (
        canonicalState ===
        DiscoveryState.VISITED
      ) {
        visited +=
          1n;
      } else if (
        canonicalState ===
        DiscoveryState.CATALOGUED
      ) {
        catalogued +=
          1n;
      } else if (
        canonicalState ===
        DiscoveryState.CONFIRMED
      ) {
        confirmed +=
          1n;
      }
    }

    if (
      galaxyRecordCount !==
      1n
    ) {
      throw new RangeError(
        'The requested known galaxy must have exactly one GalaxyLocator record.',
      );
    }

    const progressUnits =
      ExplorationProgressOverviewEngine
        .buildProgressOverview(
          generationKey,
          0n,
          galaxyIndex,
          knownDiscoveries,
        )
        .galaxyProgress
        .galaxyProgressUnits;

    return new GalaxyKnowledgeStatistics(
      galaxyIndex,
      progressUnits,
      knownRecords,
      {
        sectors,
        galacticObjects,
        systems,
        bodies,
        civilizations,
      },
      {
        detected,
        discovered,
        visited,
        catalogued,
        confirmed,
      },
    );
  }
}

function sameGenerationKey(
  left:
    UniverseGenerationKey,

  right:
    UniverseGenerationKey,
): boolean {

  return (
    left
      .generatorVersion
      .code ===
      right
        .generatorVersion
        .code &&
    left
      .universeSeed
      .serialize() ===
      right
        .universeSeed
        .serialize()
  );
}

function locatorIdentity(
  locator:
    ProceduralLocator,
): string {

  if (
    locator instanceof
      GalaxyLocator
  ) {
    return [
      'GALAXY',
      locator
        .galaxyIndex,
    ].join(
      ':',
    );
  }

  if (
    locator instanceof
      SectorLocator
  ) {
    return [
      'SECTOR',
      locator
        .galaxyIndex,
      locator
        .sectorKey,
    ].join(
      ':',
    );
  }

  if (
    locator instanceof
      GalacticObjectLocator
  ) {
    return [
      'GALACTIC_OBJECT',
      locator
        .galaxyIndex,
      locator
        .sectorKey,
      locator
        .galacticObjectIndex,
    ].join(
      ':',
    );
  }

  if (
    locator instanceof
      SystemLocator
  ) {
    return [
      'SYSTEM',
      locator
        .galaxyIndex,
      locator
        .sectorKey,
      locator
        .galacticObjectIndex,
    ].join(
      ':',
    );
  }

  if (
    locator instanceof
      BodyLocator
  ) {
    return [
      'BODY',
      locator
        .galaxyIndex,
      locator
        .sectorKey,
      locator
        .galacticObjectIndex,
      locator
        .bodyIndex,
    ].join(
      ':',
    );
  }

  if (
    locator instanceof
      CivilizationLocator
  ) {
    return [
      'CIVILIZATION',
      locator
        .galaxyIndex,
      locator
        .sectorKey,
      locator
        .galacticObjectIndex,
      locator
        .bodyIndex,
      locator
        .civilizationIndex,
    ].join(
      ':',
    );
  }

  throw new TypeError(
    'Unsupported ProceduralLocator.',
  );
}
