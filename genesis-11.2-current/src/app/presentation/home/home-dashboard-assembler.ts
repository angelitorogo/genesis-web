import {
  KnownDiscovery,
} from '../../domain/discovery/known-discovery';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

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
} from '../../simulation/exploration/exploration-progress-overview-engine';

import {
  HomeDashboardModel,
} from './home-dashboard-model';

/**
 * Point-9.1 presentation assembler.
 *
 * It validates repository snapshots and delegates the actual local-progress
 * formula to the already-frozen point-7.3 engine.
 *
 * It performs no Ground Truth generation, random draws, hashing, discovery
 * mutations, reward calculation, persistence writes or point-9.2 exploration.
 */
export class HomeDashboardAssembler {

  private constructor() {}

  static assemble(
    generationKey:
      UniverseGenerationKey,

    activeGalaxyIndex:
      bigint,

    discoveryPoints:
      bigint,

    knownDiscoveries:
      readonly KnownDiscovery[],
  ): HomeDashboardModel {

    const canonicalDiscoveries:
      KnownDiscovery[] =
      [];

    const locatorKeys =
      new Set<string>();

    for (
      const discovery
      of knownDiscoveries
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

      canonicalDiscoveries.push(
        new KnownDiscovery(
          generationKey,
          discovery
            .locator,
          canonicalState,
        ),
      );
    }

    const activeGalaxyDiscovery =
      canonicalDiscoveries
        .find(
          (
            discovery,
          ) =>
            discovery
              .locator instanceof
              GalaxyLocator &&
            discovery
              .locator
              .galaxyIndex ===
              activeGalaxyIndex,
        );

    if (
      activeGalaxyDiscovery ===
      undefined
    ) {
      throw new RangeError(
        'The active galaxy must already exist as a known GalaxyLocator.',
      );
    }

    const overview =
      ExplorationProgressOverviewEngine
        .buildProgressOverview(
          generationKey,
          discoveryPoints,
          activeGalaxyIndex,
          canonicalDiscoveries,
        );

    return new HomeDashboardModel(
      generationKey,
      activeGalaxyIndex,
      activeGalaxyDiscovery
        .state,
      overview
        .galaxyProgress
        .galaxyProgressUnits,
      overview
        .globalDiscoveryPoints,
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
