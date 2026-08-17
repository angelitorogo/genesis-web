import {
  TestBed,
} from '@angular/core/testing';

import {
  KnownDiscovery,
} from '../../domain/discovery/known-discovery';

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
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  DEFAULT_UNIVERSE_SEED,
} from '../universe/universe-seed.facade';

import {
  HOME_DASHBOARD_REPOSITORIES,
  HomeDashboardRepositories,
  HomeFacade,
} from './home.facade';

describe(
  'HomeFacade',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          DEFAULT_UNIVERSE_SEED,
        ),
        GeneratorVersion.V1,
      );

    function repositories(
      universes:
        readonly UniverseGenerationKey[] =
          [
            generationKey,
          ],

      knownDiscoveries:
        readonly KnownDiscovery[] =
          [
            new KnownDiscovery(
              generationKey,
              new GalaxyLocator(
                0n,
              ),
              DiscoveryState
                .DISCOVERED,
            ),
          ],

      activeGalaxyIndex =
        0n,

      discoveryPoints =
        0n,
    ): HomeDashboardRepositories {

      return {
        universeRepository: {
          async createIfAbsent() {
            return false;
          },

          async exists() {
            return true;
          },

          async getAll() {
            return universes;
          },

          async delete() {
            return false;
          },
        },

        navigationRepository: {
          async getNavigation() {
            return {
              activeGalaxyIndex,

              recentGalaxyIndices:
                [],
            };
          },

          async setNavigation() {},
        },

        pointsRepository: {
          async getGlobalDiscoveryPoints() {
            return discoveryPoints;
          },

          async setGlobalDiscoveryPoints() {},

          async getGalaxyDiscoveryPoints() {
            return 0n;
          },

          async setGalaxyDiscoveryPoints() {},
        },

        discoveryRepository: {
          async getState() {
            return DiscoveryState
              .UNKNOWN;
          },

          async setState() {},

          async getKnownDiscoveries() {
            return knownDiscoveries;
          },

          async getKnownDiscoveriesInSector() {
            return [];
          },
        },
      };
    }

    function configure(
      repositoryBundle:
        HomeDashboardRepositories,
    ): HomeFacade {

      TestBed.configureTestingModule({
        providers: [
          {
            provide:
              HOME_DASHBOARD_REPOSITORIES,

            useValue:
              repositoryBundle,
          },
        ],
      });

      return TestBed.inject(
        HomeFacade,
      );
    }

    it(
      'should expose the definitive Home identity and start in Loading',
      () => {
        const facade =
          configure(
            repositories(),
          );

        expect(
          facade.state(),
        ).toEqual({
          kind:
            'loading',
        });

        expect(
          facade.title(),
        ).toBe(
          'GENESIS',
        );

        expect(
          facade.subtitle(),
        ).toBe(
          'Centro de exploración galáctica',
        );

        expect(
          facade.dashboard(),
        ).toBeNull();
      },
    );

    it(
      'should load the real persisted dashboard and delegate local progress assembly',
      async () => {
        const facade =
          configure(
            repositories(
              [
                generationKey,
              ],
              [
                new KnownDiscovery(
                  generationKey,
                  new GalaxyLocator(
                    0n,
                  ),
                  DiscoveryState
                    .DISCOVERED,
                ),
              ],
              0n,
              12_345n,
            ),
          );

        await facade
          .refresh();

        expect(
          facade.state().kind,
        ).toBe(
          'content',
        );

        expect(
          facade.dashboard()
            ?.activeGalaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          facade.dashboard()
            ?.activeGalaxyDiscoveryState,
        ).toBe(
          DiscoveryState
            .DISCOVERED,
        );

        expect(
          facade.dashboard()
            ?.discoveryPoints,
        ).toBe(
          12_345n,
        );

        expect(
          facade.dashboard()
            ?.galaxyProgressUnits,
        ).toBe(
          2n,
        );
      },
    );

    it(
      'should expose Empty when no persisted universe exists',
      async () => {
        const facade =
          configure(
            repositories(
              [],
              [],
            ),
          );

        await facade
          .refresh();

        expect(
          facade.state(),
        ).toEqual({
          kind:
            'empty',
        });

        expect(
          facade.dashboard(),
        ).toBeNull();
      },
    );

    it(
      'should never choose an arbitrary universe when multiple persisted universes do not match the active selection',
      async () => {
        const first =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              'AAAA-0000-0000-0000-0000-0000-0000-0001',
            ),
            GeneratorVersion.V1,
          );

        const second =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              'BBBB-0000-0000-0000-0000-0000-0000-0002',
            ),
            GeneratorVersion.V1,
          );

        const facade =
          configure(
            repositories(
              [
                first,
                second,
              ],
              [],
            ),
          );

        await facade
          .refresh();

        expect(
          facade.state(),
        ).toEqual({
          kind:
            'error',

          message:
            'No hay un universo activo seleccionado.',
        });

        expect(
          facade.dashboard(),
        ).toBeNull();
      },
    );
  },
);
