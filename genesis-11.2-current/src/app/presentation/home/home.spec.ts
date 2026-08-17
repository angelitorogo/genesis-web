import {
  TestBed,
} from '@angular/core/testing';

import {
  provideRouter,
} from '@angular/router';

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
  type HomeDashboardRepositories,
} from './home.facade';

import {
  Home,
} from './home';

describe(
  'Home',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          DEFAULT_UNIVERSE_SEED,
        ),
        GeneratorVersion.V1,
      );

    const repositories:
      HomeDashboardRepositories =
      {
        universeRepository: {
          async createIfAbsent() {
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
            return false;
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

          async setNavigation() {},
        },

        pointsRepository: {
          async getGlobalDiscoveryPoints() {
            return 1_250n;
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
            return [
              new KnownDiscovery(
                generationKey,
                new GalaxyLocator(
                  0n,
                ),
                DiscoveryState
                  .DISCOVERED,
              ),
            ];
          },

          async getKnownDiscoveriesInSector() {
            return [];
          },
        },
      };

    beforeEach(
      async () => {
        await TestBed
          .configureTestingModule({
            imports: [
              Home,
            ],

            providers: [
              provideRouter(
                [],
              ),

              {
                provide:
                  HOME_DASHBOARD_REPOSITORIES,

                useValue:
                  repositories,
              },
            ],
          })
          .compileComponents();
      },
    );

    async function renderedHome():
      Promise<{
        readonly fixture:
          ReturnType<
            typeof TestBed.createComponent<Home>
          >;

        readonly element:
          HTMLElement;
      }> {

      const fixture =
        TestBed.createComponent(
          Home,
        );

      fixture.detectChanges();

      await fixture
        .componentInstance
        .facade
        .refresh();

      fixture.detectChanges();

      return {
        fixture,

        element:
          fixture.nativeElement as
            HTMLElement,
      };
    }

    it(
      'should create and render the definitive GENESIS Home heading',
      async () => {
        const {
          fixture,
          element,
        } =
          await renderedHome();

        expect(
          fixture
            .componentInstance,
        ).toBeTruthy();

        expect(
          element
            .querySelector(
              '[data-testid="home-title"]',
            )
            ?.textContent,
        ).toContain(
          'GENESIS',
        );

        expect(
          element
            .querySelector(
              '[data-testid="home-subtitle"]',
            )
            ?.textContent,
        ).toContain(
          'Centro de exploración galáctica',
        );
      },
    );

    it(
      'should render active galaxy knowledge, global PD and local progress from persisted state',
      async () => {
        const {
          element,
        } =
          await renderedHome();

        expect(
          element
            .querySelector(
              '[data-testid="active-galaxy-index"]',
            )
            ?.textContent,
        ).toContain(
          'Galaxia 0',
        );

        expect(
          element
            .querySelector(
              '[data-testid="origin-galaxy-badge"]',
            )
            ?.textContent,
        ).toContain(
          'GALAXIA NATAL',
        );

        expect(
          element
            .querySelector(
              '[data-testid="active-galaxy-state"]',
            )
            ?.textContent,
        ).toContain(
          'Descubierta',
        );

        expect(
          element
            .querySelector(
              '[data-testid="discovery-points"]',
            )
            ?.textContent,
        ).toContain(
          '1250',
        );

        expect(
          element
            .querySelector(
              '[data-testid="local-progress"]',
            )
            ?.textContent,
        ).toContain(
          '2',
        );
      },
    );

    it(
      'should expose exactly the four point-9.6 real access links',
      async () => {
        const {
          element,
        } =
          await renderedHome();

        const navigation =
          element
            .querySelector(
              '[data-testid="module-navigation"]',
            );

        expect(
          navigation
            ?.querySelectorAll(
              'a',
            )
            .length,
        ).toBe(
          4,
        );

        expect(
          element
            .querySelector(
              '[data-testid="galaxy-map-link"]',
            ),
        ).toBeTruthy();

        expect(
          element
            .querySelector(
              '[data-testid="archive-link"]',
            ),
        ).toBeTruthy();

        expect(
          element
            .querySelector(
              '[data-testid="observatory-link"]',
            ),
        ).toBeTruthy();

        expect(
          element
            .querySelector(
              '[data-testid="statistics-link"]',
            ),
        ).toBeTruthy();
      },
    );

    it(
      'should preserve the point-9.2 exploration action alongside the point-9.6 Statistics access',
      async () => {
        const {
          element,
        } =
          await renderedHome();

        const action =
          element
            .querySelector(
              '[data-testid="perform-exploration-link"]',
            ) as HTMLAnchorElement | null;

        expect(
          action,
        ).toBeTruthy();

        expect(
          action
            ?.textContent,
        ).toContain(
          'REALIZAR EXPLORACIÓN',
        );

        expect(
          action
            ?.getAttribute(
              'href',
            ),
        ).toBe(
          '/exploration',
        );

        const statisticsLink =
          element
            .querySelector(
              '[data-testid="statistics-link"]',
            ) as HTMLAnchorElement | null;

        expect(
          statisticsLink
            ?.getAttribute(
              'href',
            ),
        ).toBe(
          '/statistics',
        );

        expect(
          element
            .querySelector(
              '[data-testid="settings-link"]',
            ),
        ).toBeNull();
      },
    );
  },
);
