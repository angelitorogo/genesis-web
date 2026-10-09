import {
  InjectionToken,
} from '@angular/core';

import {
  type DiscoveryPointsRepository,
  type DiscoveryRepository,
  type UniverseNavigationRepository,
  type UniverseRepository,
} from '../../domain/repository/genesis-repositories';

import {
  type SupernovaCanonicalEventRepository,
} from '../../domain/repository/supernova-canonical-event-repository';
import {
  type NovaCanonicalEventRepository,
} from '../../domain/repository/nova-canonical-event-repository';
import {
  type KilonovaCanonicalEventRepository,
} from '../../domain/repository/kilonova-canonical-event-repository';

import {
  type ProceduralLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GenesisIndexedDb,
} from '../../data/local/indexed-db/genesis-indexed-db';

import {
  DexieDiscoveryPointsRepository,
} from '../../data/local/repository/dexie-discovery-points.repository';

import {
  DexieDiscoveryRepository,
  type ProceduralTargetSeedResolver,
} from '../../data/local/repository/dexie-discovery.repository';

import {
  DexieSupernovaCanonicalEventRepository,
} from '../../data/local/repository/dexie-supernova-canonical-event.repository';
import {
  DexieNovaCanonicalEventRepository,
} from '../../data/local/repository/dexie-nova-canonical-event.repository';
import {
  DexieKilonovaCanonicalEventRepository,
} from '../../data/local/repository/dexie-kilonova-canonical-event.repository';

import {
  DexieUniverseNavigationRepository,
} from '../../data/local/repository/dexie-universe-navigation.repository';

import {
  DexieUniverseRepository,
} from '../../data/local/repository/dexie-universe.repository';

import {
  ProceduralTargetResolver,
} from '../../simulation/regeneration/procedural-target-resolver';

export interface GenesisLocalRepositories {
  readonly universeRepository:
    UniverseRepository;

  readonly navigationRepository:
    UniverseNavigationRepository;

  readonly pointsRepository:
    DiscoveryPointsRepository;

  readonly discoveryRepository:
    DiscoveryRepository;

  /**
   * 29.1E optional only for legacy/test repository bundles. Production always
   * supplies it from the same GenesisIndexedDb instance as the other stores.
   */
  readonly supernovaCanonicalEventRepository?:
    SupernovaCanonicalEventRepository;

  /** 29.2 optional only for legacy/test bundles. Production always supplies it. */
  readonly novaCanonicalEventRepository?:
    NovaCanonicalEventRepository;

  /** 29.3 optional only for legacy/test bundles. Production always supplies it. */
  readonly kilonovaCanonicalEventRepository?:
    KilonovaCanonicalEventRepository;
}

const TARGET_SEED_RESOLVER:
  ProceduralTargetSeedResolver =
  Object.freeze({
    resolveTargetSeedNormalized(
      generationKey:
        UniverseGenerationKey,

      locator:
        ProceduralLocator,
    ): string {

      return ProceduralTargetResolver
        .resolveTargetSeed(
          generationKey,
          locator,
        )
        .normalizedValue;
    },
  });

export const GENESIS_LOCAL_REPOSITORIES =
  new InjectionToken<GenesisLocalRepositories>(
    'GENESIS_LOCAL_REPOSITORIES',
    {
      providedIn:
        'root',

      factory:
        createGenesisLocalRepositories,
    },
  );

function createGenesisLocalRepositories():
  GenesisLocalRepositories {

  const database =
    new GenesisIndexedDb();

  return Object.freeze({
    universeRepository:
      new DexieUniverseRepository(
        database,
      ),

    navigationRepository:
      new DexieUniverseNavigationRepository(
        database,
      ),

    pointsRepository:
      new DexieDiscoveryPointsRepository(
        database,
      ),

    discoveryRepository:
      new DexieDiscoveryRepository(
        database,
        TARGET_SEED_RESOLVER,
      ),

    supernovaCanonicalEventRepository:
      new DexieSupernovaCanonicalEventRepository(
        database,
        TARGET_SEED_RESOLVER,
      ),

    novaCanonicalEventRepository:
      new DexieNovaCanonicalEventRepository(
        database,
        TARGET_SEED_RESOLVER,
      ),

    kilonovaCanonicalEventRepository:
      new DexieKilonovaCanonicalEventRepository(
        database,
        TARGET_SEED_RESOLVER,
      ),
  });
}
