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
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type UniverseNavigationRepository,
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
  DexieUniverseNavigationRepository,
} from '../../data/local/repository/dexie-universe-navigation.repository';

import {
  DexieUniverseRepository,
} from '../../data/local/repository/dexie-universe.repository';

import {
  ProceduralTargetResolver,
} from '../../simulation/regeneration/procedural-target-resolver';

import {
  DexieGalaxyFocusRuntime,
} from './galaxy-focus.runtime';

describe(
  'DexieGalaxyFocusRuntime',
  () => {
    const databaseName =
      'genesis-web-point-11-6-focus-runtime-tests';

    const dependencies =
      Object.freeze({
        indexedDB,
        IDBKeyRange,
      });

    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
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

    let discoveryRepository:
      DexieDiscoveryRepository;

    let pointsRepository:
      DexieDiscoveryPointsRepository;

    let runtime:
      DexieGalaxyFocusRuntime;

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

        discoveryRepository =
          new DexieDiscoveryRepository(
            database,
            targetSeedResolver,
            () => 1000,
          );

        pointsRepository =
          new DexieDiscoveryPointsRepository(
            database,
            () => 1000,
          );

        runtime =
          new DexieGalaxyFocusRuntime(
            database,
            navigationRepository,
            discoveryRepository,
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
      'should atomically focus a DETECTED galaxy and promote it to VISITED',
      async () => {
        await discoveryRepository
          .setState(
            generationKey,
            new GalaxyLocator(
              1n,
            ),
            DiscoveryState
              .DETECTED,
          );

        const result =
          await runtime
            .changeFocus(
              generationKey,
              1n,
            );

        expect(
          result
            .previousFocusGalaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          result
            .activeGalaxyIndex,
        ).toBe(
          1n,
        );

        expect(
          result
            .targetStateBefore,
        ).toBe(
          DiscoveryState
            .DETECTED,
        );

        expect(
          result
            .targetStateAfter,
        ).toBe(
          DiscoveryState
            .VISITED,
        );

        expect(
          result
            .didPromoteTargetToVisited,
        ).toBe(true);

        expect(
          await navigationRepository
            .getNavigation(
              generationKey,
            ),
        ).toEqual({
          activeGalaxyIndex:
            1n,

          recentGalaxyIndices:
            [
              0n,
            ],
        });

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              new GalaxyLocator(
                1n,
              ),
            ),
        ).toBe(
          DiscoveryState
            .VISITED,
        );

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              new GalaxyLocator(
                0n,
              ),
            ),
        ).toBe(
          DiscoveryState
            .DISCOVERED,
        );
      },
    );

    it(
      'should promote DISCOVERED to VISITED and preserve VISITED or higher exact states',
      async () => {
        for (
          const [
            galaxyIndex,
            state,
            expected,
          ]
          of [
            [
              1n,
              DiscoveryState
                .DISCOVERED,
              DiscoveryState
                .VISITED,
            ],
            [
              2n,
              DiscoveryState
                .VISITED,
              DiscoveryState
                .VISITED,
            ],
            [
              3n,
              DiscoveryState
                .CATALOGUED,
              DiscoveryState
                .CATALOGUED,
            ],
            [
              4n,
              DiscoveryState
                .CONFIRMED,
              DiscoveryState
                .CONFIRMED,
            ],
          ] as const
        ) {
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

          await discoveryRepository
            .setState(
              generationKey,
              new GalaxyLocator(
                galaxyIndex,
              ),
              state,
            );

          const result =
            await runtime
              .changeFocus(
                generationKey,
                galaxyIndex,
              );

          expect(
            result
              .targetStateAfter,
          ).toBe(
            expected,
          );

          expect(
            await discoveryRepository
              .getState(
                generationKey,
                new GalaxyLocator(
                  galaxyIndex,
                ),
              ),
          ).toBe(
            expected,
          );
        }
      },
    );

    it(
      'should preserve MRU history without duplicates and keep the new active galaxy out of recentGalaxyIndices',
      async () => {
        await discoveryRepository
          .setState(
            generationKey,
            new GalaxyLocator(
              1n,
            ),
            DiscoveryState
              .VISITED,
          );

        await discoveryRepository
          .setState(
            generationKey,
            new GalaxyLocator(
              2n,
            ),
            DiscoveryState
              .VISITED,
          );

        await navigationRepository
          .setNavigation(
            generationKey,
            {
              activeGalaxyIndex:
                2n,

              recentGalaxyIndices:
                [
                  1n,
                  0n,
                  2n,
                  1n,
                ],
            },
          );

        const result =
          await runtime
            .changeFocus(
              generationKey,
              1n,
            );

        expect(
          result
            .recentGalaxyIndices,
        ).toEqual([
          2n,
          0n,
        ]);

        expect(
          await navigationRepository
            .getNavigation(
              generationKey,
            ),
        ).toEqual({
          activeGalaxyIndex:
            1n,

          recentGalaxyIndices:
            [
              2n,
              0n,
            ],
        });
      },
    );

    it(
      'should return to any persisted recent galaxy and move the outgoing focus to the MRU head',
      async () => {
        await discoveryRepository
          .setState(
            generationKey,
            new GalaxyLocator(
              1n,
            ),
            DiscoveryState
              .VISITED,
          );

        await discoveryRepository
          .setState(
            generationKey,
            new GalaxyLocator(
              2n,
            ),
            DiscoveryState
              .VISITED,
          );

        await navigationRepository
          .setNavigation(
            generationKey,
            {
              activeGalaxyIndex:
                2n,

              recentGalaxyIndices:
                [
                  1n,
                  0n,
                ],
            },
          );

        const result =
          await runtime
            .returnToRecentGalaxy(
              generationKey,
              0n,
            );

        expect(
          result
            .previousFocusGalaxyIndex,
        ).toBe(
          2n,
        );

        expect(
          result
            .activeGalaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          result
            .recentGalaxyIndices,
        ).toEqual([
          2n,
          1n,
        ]);

        expect(
          await navigationRepository
            .getNavigation(
              generationKey,
            ),
        ).toEqual({
          activeGalaxyIndex:
            0n,

          recentGalaxyIndices:
            [
              2n,
              1n,
            ],
        });
      },
    );

    it(
      'should preserve galaxy-local discoveries and Discovery Points across a complete 11.6 round trip',
      async () => {
        await discoveryRepository
          .setState(
            generationKey,
            new GalaxyLocator(
              0n,
            ),
            DiscoveryState
              .VISITED,
          );

        await discoveryRepository
          .setState(
            generationKey,
            new GalaxyLocator(
              1n,
            ),
            DiscoveryState
              .VISITED,
          );

        await discoveryRepository
          .setState(
            generationKey,
            new SystemLocator(
              0n,
              10n,
              0n,
            ),
            DiscoveryState
              .DETECTED,
          );

        await discoveryRepository
          .setState(
            generationKey,
            new SystemLocator(
              1n,
              20n,
              0n,
            ),
            DiscoveryState
              .CONFIRMED,
          );

        await pointsRepository
          .setGlobalDiscoveryPoints(
            generationKey,
            777n,
          );

        await pointsRepository
          .setGalaxyDiscoveryPoints(
            generationKey,
            0n,
            111n,
          );

        await pointsRepository
          .setGalaxyDiscoveryPoints(
            generationKey,
            1n,
            222n,
          );

        await runtime
          .changeFocus(
            generationKey,
            1n,
          );

        expect(
          await navigationRepository
            .getNavigation(
              generationKey,
            ),
        ).toEqual({
          activeGalaxyIndex:
            1n,

          recentGalaxyIndices:
            [
              0n,
            ],
        });

        await runtime
          .returnToRecentGalaxy(
            generationKey,
            0n,
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
            [
              1n,
            ],
        });

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              new GalaxyLocator(
                0n,
              ),
            ),
        ).toBe(
          DiscoveryState
            .VISITED,
        );

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              new GalaxyLocator(
                1n,
              ),
            ),
        ).toBe(
          DiscoveryState
            .VISITED,
        );

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              new SystemLocator(
                0n,
                10n,
                0n,
              ),
            ),
        ).toBe(
          DiscoveryState
            .DETECTED,
        );

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              new SystemLocator(
                1n,
                20n,
                0n,
              ),
            ),
        ).toBe(
          DiscoveryState
            .CONFIRMED,
        );

        expect(
          await pointsRepository
            .getGlobalDiscoveryPoints(
              generationKey,
            ),
        ).toBe(
          777n,
        );

        expect(
          await pointsRepository
            .getGalaxyDiscoveryPoints(
              generationKey,
              0n,
            ),
        ).toBe(
          111n,
        );

        expect(
          await pointsRepository
            .getGalaxyDiscoveryPoints(
              generationKey,
              1n,
            ),
        ).toBe(
          222n,
        );
      },
    );

    it(
      'should reject a known galaxy that is not present in the persisted recent history',
      async () => {
        await discoveryRepository
          .setState(
            generationKey,
            new GalaxyLocator(
              1n,
            ),
            DiscoveryState
              .VISITED,
          );

        await expect(
          runtime
            .returnToRecentGalaxy(
              generationKey,
              1n,
            ),
        ).rejects
          .toThrow(
            'recent-galaxy history',
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

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              new GalaxyLocator(
                1n,
              ),
            ),
        ).toBe(
          DiscoveryState
            .VISITED,
        );
      },
    );

    it(
      'should reject UNKNOWN targets without creating knowledge or changing navigation',
      async () => {
        await expect(
          runtime
            .changeFocus(
              generationKey,
              99n,
            ),
        ).rejects
          .toThrow(
            RangeError,
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

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              new GalaxyLocator(
                99n,
              ),
            ),
        ).toBe(
          DiscoveryState
            .UNKNOWN,
        );
      },
    );

    it(
      'should reject a request to focus the galaxy that is already active',
      async () => {
        await expect(
          runtime
            .changeFocus(
              generationKey,
              0n,
            ),
        ).rejects
          .toThrow(
            RangeError,
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

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              new GalaxyLocator(
                0n,
              ),
            ),
        ).toBe(
          DiscoveryState
            .DISCOVERED,
        );
      },
    );

    it(
      'should reject a corrupted navigation focus that points to an UNKNOWN galaxy',
      async () => {
        await discoveryRepository
          .setState(
            generationKey,
            new GalaxyLocator(
              1n,
            ),
            DiscoveryState
              .DETECTED,
          );

        await navigationRepository
          .setNavigation(
            generationKey,
            {
              activeGalaxyIndex:
                42n,

              recentGalaxyIndices:
                [],
            },
          );

        await expect(
          runtime
            .changeFocus(
              generationKey,
              1n,
            ),
        ).rejects
          .toThrow(
            'current exploration focus',
          );

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              new GalaxyLocator(
                1n,
              ),
            ),
        ).toBe(
          DiscoveryState
            .DETECTED,
        );
      },
    );

    it(
      'should roll back a VISITED promotion when the navigation write fails',
      async () => {
        await discoveryRepository
          .setState(
            generationKey,
            new GalaxyLocator(
              1n,
            ),
            DiscoveryState
              .DETECTED,
          );

        const failingNavigation:
          UniverseNavigationRepository =
          {
            getNavigation:
              navigationRepository
                .getNavigation
                .bind(
                  navigationRepository,
                ),

            async setNavigation() {
              throw new Error(
                'synthetic navigation write failure',
              );
            },
          };

        const failingRuntime =
          new DexieGalaxyFocusRuntime(
            database,
            failingNavigation,
            discoveryRepository,
          );

        await expect(
          failingRuntime
            .changeFocus(
              generationKey,
              1n,
            ),
        ).rejects
          .toThrow(
            'synthetic navigation write failure',
          );

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              new GalaxyLocator(
                1n,
              ),
            ),
        ).toBe(
          DiscoveryState
            .DETECTED,
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
  },
);
