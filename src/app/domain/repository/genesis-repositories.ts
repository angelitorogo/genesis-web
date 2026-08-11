import {
  type KnownDiscovery,
} from '../discovery/known-discovery';

import {
  type DiscoveryStateValue,
} from '../discovery/discovery-state';

import {
  type ProceduralLocator,
} from '../generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  type GalaxySectorCoordinates,
} from '../sector/galaxy-sector-coordinates';

export class UniverseNotFoundError
  extends Error {

  constructor(
    readonly generationKey:
      UniverseGenerationKey,
  ) {
    super(
      [
        'Universe not found:',
        generationKey
          .universeSeed
          .serialize(),
        `GeneratorVersion=${generationKey.generatorVersion.code}`,
      ].join(' '),
    );

    this.name =
      'UniverseNotFoundError';
  }
}

export interface UniverseNavigationState {
  readonly activeGalaxyIndex:
    bigint;

  readonly recentGalaxyIndices:
    readonly bigint[];
}

export interface UniverseRepository {
  createIfAbsent(
    generationKey:
      UniverseGenerationKey,
  ): Promise<boolean>;

  exists(
    generationKey:
      UniverseGenerationKey,
  ): Promise<boolean>;

  getAll():
    Promise<
      readonly UniverseGenerationKey[]
    >;

  delete(
    generationKey:
      UniverseGenerationKey,
  ): Promise<boolean>;
}

export interface UniverseNavigationRepository {
  getNavigation(
    generationKey:
      UniverseGenerationKey,
  ): Promise<UniverseNavigationState>;

  setNavigation(
    generationKey:
      UniverseGenerationKey,

    navigation:
      UniverseNavigationState,
  ): Promise<void>;
}

export interface DiscoveryPointsRepository {
  getGlobalDiscoveryPoints(
    generationKey:
      UniverseGenerationKey,
  ): Promise<bigint>;

  setGlobalDiscoveryPoints(
    generationKey:
      UniverseGenerationKey,

    discoveryPoints:
      bigint,
  ): Promise<void>;

  getGalaxyDiscoveryPoints(
    generationKey:
      UniverseGenerationKey,

    galaxyIndex:
      bigint,
  ): Promise<bigint>;

  setGalaxyDiscoveryPoints(
    generationKey:
      UniverseGenerationKey,

    galaxyIndex:
      bigint,

    discoveryPoints:
      bigint,
  ): Promise<void>;
}

export interface DiscoveryRepository {
  getState(
    generationKey:
      UniverseGenerationKey,

    locator:
      ProceduralLocator,
  ): Promise<DiscoveryStateValue>;

  setState(
    generationKey:
      UniverseGenerationKey,

    locator:
      ProceduralLocator,

    state:
      DiscoveryStateValue,
  ): Promise<void>;

  getKnownDiscoveries(
    generationKey:
      UniverseGenerationKey,
  ): Promise<
    readonly KnownDiscovery[]
  >;

  getKnownDiscoveriesInSector(
    generationKey:
      UniverseGenerationKey,

    galaxyIndex:
      bigint,

    coordinates:
      GalaxySectorCoordinates,
  ): Promise<
    readonly KnownDiscovery[]
  >;
}