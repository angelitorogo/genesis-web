import {
  TestBed,
} from '@angular/core/testing';

import {
  ActivatedRoute,
  provideRouter,
} from '@angular/router';

import {
  DiscoveryState,
  type DiscoveryStateValue,
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
  GalaxyType,
} from '../../domain/universe/galaxy-type';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GENESIS_LOCAL_REPOSITORIES,
  type GenesisLocalRepositories,
} from '../runtime/genesis-local-repositories';

import {
  DEFAULT_UNIVERSE_SEED,
} from '../universe/universe-seed.facade';

import {
  GalaxyDetailFacade,
} from './galaxy-detail.facade';

import {
  GalaxyDetailPage,
} from './galaxy-detail';

describe(
  'GalaxyDetailPage',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          DEFAULT_UNIVERSE_SEED,
        ),
        GeneratorVersion.V1,
      );

    function repositories(
      states:
        ReadonlyMap<
          bigint,
          DiscoveryStateValue
        > =
          new Map<
            bigint,
            DiscoveryStateValue
          >([
            [
              0n,
              DiscoveryState
                .DISCOVERED,
            ],
            [
              1n,
              DiscoveryState
                .DETECTED,
            ],
          ]),

      activeGalaxyIndex =
        0n,

      universes:
        readonly UniverseGenerationKey[] =
          [
            generationKey,
          ],
    ): GenesisLocalRepositories {

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

          async setNavigation() {
            throw new Error(
              '11.3 must not change the active galaxy.',
            );
          },
        },

        pointsRepository: {
          async getGlobalDiscoveryPoints() {
            throw new Error(
              '11.3 must not read global PD.',
            );
          },

          async setGlobalDiscoveryPoints() {
            throw new Error(
              '11.3 must not write global PD.',
            );
          },

          async getGalaxyDiscoveryPoints() {
            throw new Error(
              '11.3 must not read per-galaxy PD.',
            );
          },

          async setGalaxyDiscoveryPoints() {
            throw new Error(
              '11.3 must not write per-galaxy PD.',
            );
          },
        },

        discoveryRepository: {
          async getState(
            _generationKey,
            locator,
          ) {
            if (
              !(
                locator instanceof
                GalaxyLocator
              )
            ) {
              throw new Error(
                '11.3 must query exactly one GalaxyLocator.',
              );
            }

            return (
              states.get(
                locator
                  .galaxyIndex,
              ) ??
              DiscoveryState
                .UNKNOWN
            );
          },

          async setState() {
            throw new Error(
              '11.3 must not mutate DiscoveryState.',
            );
          },

          async getKnownDiscoveries() {
            throw new Error(
              '11.3 must not enumerate the complete discovery catalogue.',
            );
          },

          async getKnownDiscoveriesInSector() {
            throw new Error(
              '11.3 must not materialize sector content.',
            );
          },
        },
      };
    }

    function configure(
      galaxyIndex:
        string,

      repositoryBundle:
        GenesisLocalRepositories =
          repositories(),
    ): void {

      TestBed.configureTestingModule({
        imports: [
          GalaxyDetailPage,
        ],

        providers: [
          provideRouter(
            [],
          ),

          {
            provide:
              ActivatedRoute,

            useValue: {
              snapshot: {
                paramMap: {
                  get(
                    key:
                      string,
                  ) {
                    return key ===
                      'galaxyIndex'
                      ? galaxyIndex
                      : null;
                  },
                },
              },
            },
          },

          {
            provide:
              GENESIS_LOCAL_REPOSITORIES,

            useValue:
              repositoryBundle,
          },
        ],
      });
    }

    it(
      'should load the canonical Caeloria general profile without reading PD or changing focus',
      async () => {
        configure(
          '0',
        );

        const facade =
          TestBed.inject(
            GalaxyDetailFacade,
          );

        await facade
          .load(
            '0',
          );

        const model =
          facade.model();

        expect(
          model,
        ).not.toBeNull();

        expect(
          model
            ?.profile
            .knownName,
        ).toBe(
          'Caeloria',
        );

        expect(
          model
            ?.profile
            .galaxyType,
        ).toBe(
          GalaxyType
            .ELLIPTICAL,
        );

        expect(
          model
            ?.isCurrentFocus,
        ).toBe(true);

        expect(
          model
            ?.isOriginGalaxy,
        ).toBe(true);
      },
      15_000,
    );

    it(
      'should render the point-11.3 discovered-galaxy identity and safe observational profile',
      async () => {
        configure(
          '0',
        );

        await TestBed
          .compileComponents();

        const fixture =
          TestBed.createComponent(
            GalaxyDetailPage,
          );

        fixture.detectChanges();

        await fixture
          .componentInstance
          .facade
          .load(
            '0',
          );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-page"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-name"]',
          )?.textContent,
        ).toContain(
          'Caeloria',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-index"]',
          )?.textContent,
        ).toContain(
          'Galaxia 0',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-state"]',
          )?.textContent,
        ).toContain(
          'Descubierta',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-exact-type"]',
          )?.textContent,
        ).toContain(
          'Elíptica',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-morphology"]',
          )?.textContent,
        ).toContain(
          'Esferoidal',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-scale"]',
          )?.textContent,
        ).toContain(
          'Grande',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-population"]',
          )?.textContent,
        ).toContain(
          'Alta',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-nuclear"]',
          )?.textContent,
        ).toContain(
          'Sin actividad nuclear clara',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-focus-badge"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-origin-badge"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-map-link"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-boundary"]',
          )?.textContent,
        ).toContain(
          '11.3',
        );
      },
      15_000,
    );

    it(
      'should render a DETECTED external galaxy without leaking proper name or exact GalaxyType',
      async () => {
        configure(
          '1',
        );

        await TestBed
          .compileComponents();

        const fixture =
          TestBed.createComponent(
            GalaxyDetailPage,
          );

        fixture.detectChanges();

        await fixture
          .componentInstance
          .facade
          .load(
            '1',
          );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-name"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-index"]',
          )?.textContent,
        ).toContain(
          'Galaxia 1',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-name-restricted"]',
          )?.textContent,
        ).toContain(
          'Nombre propio aún no resuelto',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-exact-type"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-exact-type-restricted"]',
          )?.textContent,
        ).toContain(
          'Aún no resuelto',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-state"]',
          )?.textContent,
        ).toContain(
          'Detectada',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-morphology"]',
          )?.textContent,
        ).toContain(
          'Disco galáctico',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-map-link"]',
          ),
        ).toBeNull();
      },
      15_000,
    );

    it(
      'should expose not-found for an UNKNOWN URL target instead of materializing it',
      async () => {
        configure(
          '99',
        );

        const facade =
          TestBed.inject(
            GalaxyDetailFacade,
          );

        await facade
          .load(
            '99',
          );

        expect(
          facade.state().kind,
        ).toBe(
          'not-found',
        );

        expect(
          facade.model(),
        ).toBeNull();
      },
    );

    it(
      'should expose Empty when no persisted universe exists',
      async () => {
        configure(
          '0',
          repositories(
            new Map<
              bigint,
              DiscoveryStateValue
            >(),
            0n,
            [],
          ),
        );

        const facade =
          TestBed.inject(
            GalaxyDetailFacade,
          );

        await facade
          .load(
            '0',
          );

        expect(
          facade.state().kind,
        ).toBe(
          'empty',
        );
      },
    );

    it(
      'should reject malformed or out-of-range galaxyIndex route values',
      async () => {
        configure(
          '0',
        );

        const facade =
          TestBed.inject(
            GalaxyDetailFacade,
          );

        await facade
          .load(
            '-1',
          );

        expect(
          facade.state().kind,
        ).toBe(
          'error',
        );

        await facade
          .load(
            (
              1n <<
              63n
            ).toString(
              10,
            ),
          );

        expect(
          facade.state().kind,
        ).toBe(
          'error',
        );
      },
    );
  },
);