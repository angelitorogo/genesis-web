import Dexie from 'dexie';

import {
  IDBKeyRange,
  indexedDB,
} from 'fake-indexeddb';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  GalaxyLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type DiscoveryPointsRepository,
} from '../../domain/repository/genesis-repositories';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

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
  DexieExternalGalaxySearchStateRepository,
} from '../../data/local/repository/dexie-external-galaxy-search-state.repository';

import {
  DexieUniverseNavigationRepository,
} from '../../data/local/repository/dexie-universe-navigation.repository';

import {
  DexieUniverseRepository,
} from '../../data/local/repository/dexie-universe.repository';

import {
  ProceduralTargetResolver,
} from '../../simulation/regeneration/procedural-target-resolver';

import {
  DexieExternalGalaxySearchRuntime,
} from './external-galaxy-search.runtime';

describe(
  'DexieExternalGalaxySearchRuntime',
  () => {
    const databaseName =
      'genesis-web-external-galaxy-search-runtime-tests';

    const dependencies =
      Object.freeze({
        indexedDB,
        IDBKeyRange,
      });

    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',
        ),
        GeneratorVersion.V1,
      );

    const targetSeedResolver:
      ProceduralTargetSeedResolver =
      {
        resolveTargetSeedNormalized(
          key,
          locator,
        ): string {

          return ProceduralTargetResolver
            .resolveTargetSeed(
              key,
              locator,
            )
            .normalizedValue;
        },
      };

    let database:
      GenesisIndexedDb;

    let universeRepository:
      DexieUniverseRepository;

    let navigationRepository:
      DexieUniverseNavigationRepository;

    let pointsRepository:
      DexieDiscoveryPointsRepository;

    let discoveryRepository:
      DexieDiscoveryRepository;

    let searchStateRepository:
      DexieExternalGalaxySearchStateRepository;

    let runtime:
      DexieExternalGalaxySearchRuntime;

    beforeEach(
      async () => {
        database =
          new GenesisIndexedDb(
            databaseName,
            dependencies,
          );

        universeRepository =
          new DexieUniverseRepository(
            database,
            () => 1000,
          );

        navigationRepository =
          new DexieUniverseNavigationRepository(
            database,
            () => 1000,
          );

        pointsRepository =
          new DexieDiscoveryPointsRepository(
            database,
            () => 1000,
          );

        discoveryRepository =
          new DexieDiscoveryRepository(
            database,
            targetSeedResolver,
            () => 1000,
          );

        searchStateRepository =
          new DexieExternalGalaxySearchStateRepository(
            database,
            () => 1000,
          );

        runtime =
          new DexieExternalGalaxySearchRuntime(
            database,
            navigationRepository,
            pointsRepository,
            discoveryRepository,
            searchStateRepository,
          );

        await universeRepository
          .createIfAbsent(
            generationKey,
          );

        await navigationRepository
          .setNavigation(
            generationKey,
            {
              activeGalaxyIndex:
                0n,

              recentGalaxyIndices:
                [],
            },
          );

        await pointsRepository
          .setGlobalDiscoveryPoints(
            generationKey,
            0n,
          );

        await discoveryRepository
          .setState(
            generationKey,
            new GalaxyLocator(
              0n,
            ),
            DiscoveryState
              .DISCOVERED,
          );
      },
    );

    afterEach(
      async () => {
        database
          .closeDatabase();

        const cleanup =
          new Dexie(
            databaseName,
            dependencies,
          );

        await cleanup
          .delete();
      },
    );

    it(
      'should expose the canonical baseline status before the first external search',
      async () => {
        const status =
          await runtime
            .getStatus(
              generationKey,
            );

        expect(
          status
            .globalDiscoveryPoints,
        ).toBe(
          0n,
        );

        expect(
          status
            .consecutiveFailedSearches,
        ).toBe(
          0n,
        );

        expect(
          status
            .knownExternalGalaxyCount,
        ).toBe(
          0n,
        );

        expect(
          status
            .nextSearchProfile
            .effectiveProbabilityPerNextSearch,
        ).toBe(
          0.02,
        );
      },
    );

    it(
      'should persist a failed search streak across a database reopen',
      async () => {
        const first =
          await runtime
            .search(
              generationKey,
            );

        expect(
          first.detected,
        ).toBe(
          false,
        );

        expect(
          first
            .consecutiveFailedSearchesAfter,
        ).toBe(
          1n,
        );

        database
          .closeDatabase();

        const reopenedDatabase =
          new GenesisIndexedDb(
            databaseName,
            dependencies,
          );

        const reopenedRuntime =
          new DexieExternalGalaxySearchRuntime(
            reopenedDatabase,
            new DexieUniverseNavigationRepository(
              reopenedDatabase,
            ),
            new DexieDiscoveryPointsRepository(
              reopenedDatabase,
            ),
            new DexieDiscoveryRepository(
              reopenedDatabase,
              targetSeedResolver,
            ),
            new DexieExternalGalaxySearchStateRepository(
              reopenedDatabase,
            ),
          );

        const reopenedStatus =
          await reopenedRuntime
            .getStatus(
              generationKey,
            );

        expect(
          reopenedStatus
            .consecutiveFailedSearches,
        ).toBe(
          1n,
        );

        expect(
          reopenedStatus
            .nextSearchProfile
            .effectiveProbabilityPerNextSearch,
        ).toBeCloseTo(
          0.118,
          12,
        );

        reopenedDatabase
          .closeDatabase();
      },
    );

    it(
      'should detect the frozen B5 external galaxy, persist DETECTED and award the existing 40 PD exactly once',
      async () => {
        let result =
          await runtime
            .search(
              generationKey,
            );

        for (
          let attempt =
            1;
          !result.detected &&
          attempt <
            10;
          attempt +=
            1
        ) {
          result =
            await runtime
              .search(
                generationKey,
              );
        }

        expect(
          result.detected,
        ).toBe(
          true,
        );

        expect(
          result
            .detectedGalaxyIndex,
        ).toBe(
          6_144_476_401_109_999_526n,
        );

        expect(
          result
            .awardedDiscoveryPoints,
        ).toBe(
          40,
        );

        expect(
          result
            .globalDiscoveryPointsAfter,
        ).toBe(
          40n,
        );

        expect(
          result
            .preliminaryInformation
            ?.galaxyIndex,
        ).toBe(
          result
            .detectedGalaxyIndex,
        );

        expect(
          result
            .focusOffer
            ?.currentGalaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          result
            .focusOffer
            ?.detectedGalaxyIndex,
        ).toBe(
          result
            .detectedGalaxyIndex,
        );

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              new GalaxyLocator(
                result
                  .detectedGalaxyIndex ??
                  -1n,
              ),
            ),
        ).toBe(
          DiscoveryState
            .DETECTED,
        );

        expect(
          await pointsRepository
            .getGlobalDiscoveryPoints(
              generationKey,
            ),
        ).toBe(
          40n,
        );

        expect(
          await searchStateRepository
            .getConsecutiveFailedSearches(
              generationKey,
            ),
        ).toBe(
          0n,
        );
      },
    );

    it(
      'should keep navigation focus unchanged when a galaxy is only detected',
      async () => {
        await searchStateRepository
          .setConsecutiveFailedSearches(
            generationKey,
            9n,
          );

        const result =
          await runtime
            .search(
              generationKey,
            );

        expect(
          result.detected,
        ).toBe(
          true,
        );

        expect(
          await navigationRepository
            .getNavigation(
              generationKey,
            ),
        ).toEqual({
          activeGalaxyIndex:
            0n,

          recentGalaxyIndices:
            [],
        });
      },
    );

    it(
      'should preserve the pity streak when point-11.5 or 11.6 navigation is updated',
      async () => {
        await searchStateRepository
          .setConsecutiveFailedSearches(
            generationKey,
            5n,
          );

        await navigationRepository
          .setNavigation(
            generationKey,
            {
              activeGalaxyIndex:
                7n,

              recentGalaxyIndices:
                [
                  0n,
                ],
            },
          );

        expect(
          await searchStateRepository
            .getConsecutiveFailedSearches(
              generationKey,
            ),
        ).toBe(
          5n,
        );
      },
    );

    it(
      'should roll back detection and pity reset if the global PD write fails',
      async () => {
        await searchStateRepository
          .setConsecutiveFailedSearches(
            generationKey,
            9n,
          );

        const failingPointsRepository:
          DiscoveryPointsRepository =
          {
            getGlobalDiscoveryPoints:
              pointsRepository
                .getGlobalDiscoveryPoints
                .bind(
                  pointsRepository,
                ),

            async setGlobalDiscoveryPoints() {
              throw new Error(
                'synthetic PD write failure',
              );
            },

            getGalaxyDiscoveryPoints:
              pointsRepository
                .getGalaxyDiscoveryPoints
                .bind(
                  pointsRepository,
                ),

            setGalaxyDiscoveryPoints:
              pointsRepository
                .setGalaxyDiscoveryPoints
                .bind(
                  pointsRepository,
                ),
          };

        const failingRuntime =
          new DexieExternalGalaxySearchRuntime(
            database,
            navigationRepository,
            failingPointsRepository,
            discoveryRepository,
            searchStateRepository,
          );

        await expect(
          failingRuntime
            .search(
              generationKey,
            ),
        ).rejects
          .toThrow(
            'synthetic PD write failure',
          );

        expect(
          await searchStateRepository
            .getConsecutiveFailedSearches(
              generationKey,
            ),
        ).toBe(
          9n,
        );

        expect(
          await pointsRepository
            .getGlobalDiscoveryPoints(
              generationKey,
            ),
        ).toBe(
          0n,
        );

        expect(
          (
            await discoveryRepository
              .getKnownDiscoveries(
                generationKey,
              )
          )
            .filter(
              (
                discovery,
              ) =>
                discovery.locator
                instanceof
                GalaxyLocator,
            ),
        ).toHaveLength(
          1,
        );
      },
    );
  },
);
