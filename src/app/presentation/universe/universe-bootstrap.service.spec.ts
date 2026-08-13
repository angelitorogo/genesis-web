import {
  TestBed,
} from '@angular/core/testing';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  GalaxyLocator,
  type ProceduralLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type GenesisLocalRepositories,
  GENESIS_LOCAL_REPOSITORIES,
} from '../runtime/genesis-local-repositories';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  UniverseBootstrapService,
} from './universe-bootstrap.service';

describe(
  'UniverseBootstrapService',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    function configure(
      options: {
        readonly createResult?:
          boolean;

        readonly failOnPoints?:
          boolean;
      } = {},
    ): {
      readonly service:
        UniverseBootstrapService;

      readonly navigationWrites:
        unknown[];

      readonly pointWrites:
        bigint[];

      readonly discoveryWrites:
        Array<{
          readonly locator:
            ProceduralLocator;

          readonly state:
            typeof DiscoveryState.DISCOVERED;
        }>;

      readonly deletes:
        UniverseGenerationKey[];

      readonly createCalls:
        UniverseGenerationKey[];
    } {
      const navigationWrites:
        unknown[] =
        [];

      const pointWrites:
        bigint[] =
        [];

      const discoveryWrites:
        Array<{
          readonly locator:
            ProceduralLocator;

          readonly state:
            typeof DiscoveryState.DISCOVERED;
        }> =
        [];

      const deletes:
        UniverseGenerationKey[] =
        [];

      const createCalls:
        UniverseGenerationKey[] =
        [];

      const repositories:
        GenesisLocalRepositories =
        {
          universeRepository: {
            async createIfAbsent(
              key,
            ) {
              createCalls.push(
                key,
              );

              return options
                .createResult ??
                true;
            },

            async exists() {
              return true;
            },

            async getAll() {
              return [
                generationKey,
              ];
            },

            async delete(
              key,
            ) {
              deletes.push(
                key,
              );

              return true;
            },
          },

          navigationRepository: {
            async getNavigation() {
              return {
                activeGalaxyIndex:
                  0n,

                recentGalaxyIndices:
                  [],
              };
            },

            async setNavigation(
              _key,
              navigation,
            ) {
              navigationWrites.push(
                navigation,
              );
            },
          },

          pointsRepository: {
            async getGlobalDiscoveryPoints() {
              return 0n;
            },

            async setGlobalDiscoveryPoints(
              _key,
              points,
            ) {
              if (
                options.failOnPoints
              ) {
                throw new Error(
                  'Simulated progress failure.',
                );
              }

              pointWrites.push(
                points,
              );
            },

            async getGalaxyDiscoveryPoints() {
              return 0n;
            },

            async setGalaxyDiscoveryPoints() {},
          },

          discoveryRepository: {
            async getState() {
              return DiscoveryState.UNKNOWN;
            },

            async setState(
              _key,
              locator,
              state,
            ) {
              if (
                state !==
                  DiscoveryState.DISCOVERED
              ) {
                throw new Error(
                  'Unexpected bootstrap discovery state.',
                );
              }

              discoveryWrites.push({
                locator,
                state,
              });
            },

            async getKnownDiscoveries() {
              return [];
            },

            async getKnownDiscoveriesInSector() {
              return [];
            },
          },
        };

      TestBed.configureTestingModule({
        providers: [
          {
            provide:
              GENESIS_LOCAL_REPOSITORIES,

            useValue:
              repositories,
          },
        ],
      });

      return {
        service:
          TestBed.inject(
            UniverseBootstrapService,
          ),

        navigationWrites,
        pointWrites,
        discoveryWrites,
        deletes,
        createCalls,
      };
    }

    it(
      'should persist the exact frozen V1 initial exploration bootstrap for a new universe',
      async () => {
        const {
          service,
          navigationWrites,
          pointWrites,
          discoveryWrites,
          deletes,
        } =
          configure();

        const result =
          await service
            .ensureInitialized(
              generationKey,
            );

        expect(
          result.created,
        ).toBe(
          true,
        );

        expect(
          navigationWrites,
        ).toEqual([
          {
            activeGalaxyIndex:
              0n,

            recentGalaxyIndices:
              [],
          },
        ]);

        expect(
          pointWrites,
        ).toEqual([
          0n,
        ]);

        expect(
          discoveryWrites,
        ).toHaveLength(
          1,
        );

        expect(
          discoveryWrites[
            0
          ]
          ?.locator,
        ).toBeInstanceOf(
          GalaxyLocator,
        );

        const locator =
          discoveryWrites[
            0
          ]
          ?.locator;

        if (
          !(
            locator instanceof
              GalaxyLocator
          )
        ) {
          throw new Error(
            'Expected canonical initial GalaxyLocator.',
          );
        }

        expect(
          locator.galaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          discoveryWrites[
            0
          ]
          ?.state,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );

        expect(
          deletes,
        ).toEqual(
          [],
        );
      },
    );

    it(
      'should leave every persisted value untouched when the universe already exists',
      async () => {
        const {
          service,
          navigationWrites,
          pointWrites,
          discoveryWrites,
          deletes,
        } =
          configure({
            createResult:
              false,
          });

        const result =
          await service
            .ensureInitialized(
              generationKey,
            );

        expect(
          result.created,
        ).toBe(
          false,
        );

        expect(
          navigationWrites,
        ).toEqual(
          [],
        );

        expect(
          pointWrites,
        ).toEqual(
          [],
        );

        expect(
          discoveryWrites,
        ).toEqual(
          [],
        );

        expect(
          deletes,
        ).toEqual(
          [],
        );
      },
    );

    it(
      'should be idempotent when createIfAbsent reports creation only on the first call',
      async () => {
        let first =
          true;

        const navigationWrites:
          unknown[] =
          [];

        const repositories:
          GenesisLocalRepositories =
          {
            universeRepository: {
              async createIfAbsent() {
                if (
                  first
                ) {
                  first =
                    false;

                  return true;
                }

                return false;
              },

              async exists() {
                return true;
              },

              async getAll() {
                return [
                  generationKey,
                ];
              },

              async delete() {
                return true;
              },
            },

            navigationRepository: {
              async getNavigation() {
                return {
                  activeGalaxyIndex:
                    0n,

                  recentGalaxyIndices:
                    [],
                };
              },

              async setNavigation(
                _key,
                navigation,
              ) {
                navigationWrites.push(
                  navigation,
                );
              },
            },

            pointsRepository: {
              async getGlobalDiscoveryPoints() {
                return 0n;
              },

              async setGlobalDiscoveryPoints() {},

              async getGalaxyDiscoveryPoints() {
                return 0n;
              },

              async setGalaxyDiscoveryPoints() {},
            },

            discoveryRepository: {
              async getState() {
                return DiscoveryState.UNKNOWN;
              },

              async setState() {},

              async getKnownDiscoveries() {
                return [];
              },

              async getKnownDiscoveriesInSector() {
                return [];
              },
            },
          };

        TestBed.configureTestingModule({
          providers: [
            {
              provide:
                GENESIS_LOCAL_REPOSITORIES,

              useValue:
                repositories,
            },
          ],
        });

        const service =
          TestBed.inject(
            UniverseBootstrapService,
          );

        const firstResult =
          await service
            .ensureInitialized(
              generationKey,
            );

        const secondResult =
          await service
            .ensureInitialized(
              generationKey,
            );

        expect(
          firstResult.created,
        ).toBe(
          true,
        );

        expect(
          secondResult.created,
        ).toBe(
          false,
        );

        expect(
          navigationWrites,
        ).toHaveLength(
          1,
        );
      },
    );

    it(
      'should delete a newly created partial universe if bootstrap persistence fails',
      async () => {
        const {
          service,
          deletes,
        } =
          configure({
            failOnPoints:
              true,
          });

        await expect(
          service
            .ensureInitialized(
              generationKey,
            ),
        ).rejects.toThrow(
          'Simulated progress failure.',
        );

        expect(
          deletes,
        ).toEqual([
          generationKey,
        ]);
      },
    );

    it(
      'should reject unsupported generator versions before creating any universe row',
      async () => {
        const {
          service,
          createCalls,
        } =
          configure();

        const unsupportedGenerationKey =
          {
            universeSeed:
              generationKey
                .universeSeed,

            generatorVersion: {
              code:
                999,
            },
          } as unknown as
            UniverseGenerationKey;

        await expect(
          service
            .ensureInitialized(
              unsupportedGenerationKey,
            ),
        ).rejects.toThrow(
          'Unsupported GeneratorVersion: 999.',
        );

        expect(
          createCalls,
        ).toEqual(
          [],
        );
      },
    );
  },
);
