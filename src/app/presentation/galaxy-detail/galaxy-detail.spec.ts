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
  KnownDiscovery,
} from '../../domain/discovery/known-discovery';

import {
  BodyLocator,
  CivilizationLocator,
  GalacticObjectLocator,
  GalaxyLocator,
  SectorLocator,
  SystemLocator,
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
  GALAXY_FOCUS_RUNTIME,
  type GalaxyFocusRuntime,
} from '../runtime/galaxy-focus.runtime';

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

    const defaultStates =
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
      ]);

    function galaxyDiscoveriesFromStates(
      states:
        ReadonlyMap<
          bigint,
          DiscoveryStateValue
        >,
    ): readonly KnownDiscovery[] {

      return [
        ...states,
      ]
        .filter(
          (
            [
              ,
              state,
            ],
          ) =>
            DiscoveryState
              .isKnown(
                state,
              ),
        )
        .map(
          (
            [
              galaxyIndex,
              state,
            ],
          ) =>
            new KnownDiscovery(
              generationKey,
              new GalaxyLocator(
                galaxyIndex,
              ),
              state,
            ),
        );
    }

    function repositories(
      states:
        ReadonlyMap<
          bigint,
          DiscoveryStateValue
        > =
          defaultStates,

      activeGalaxyIndex =
        0n,

      universes:
        readonly UniverseGenerationKey[] =
          [
            generationKey,
          ],

      knownDiscoveries:
        readonly KnownDiscovery[] =
          galaxyDiscoveriesFromStates(
            states,
          ),
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
              'GalaxyDetailFacade must not write navigation directly.',
            );
          },
        },

        pointsRepository: {
          async getGlobalDiscoveryPoints() {
            throw new Error(
              '11.5 must not read global PD.',
            );
          },

          async setGlobalDiscoveryPoints() {
            throw new Error(
              '11.5 must not write global PD.',
            );
          },

          async getGalaxyDiscoveryPoints() {
            throw new Error(
              '11.5 structural progress must not be conflated with per-galaxy PD.',
            );
          },

          async setGalaxyDiscoveryPoints() {
            throw new Error(
              '11.5 must not write per-galaxy PD.',
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
                'Galaxy detail must query exactly one GalaxyLocator before loading statistics.',
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
              'GalaxyDetailFacade must not mutate DiscoveryState directly.',
            );
          },

          async getKnownDiscoveries() {
            return knownDiscoveries;
          },

          async getKnownDiscoveriesInSector() {
            throw new Error(
              '11.5 must not materialize sector content.',
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

      focusRuntime:
        GalaxyFocusRuntime =
          {
            async changeFocus() {
              throw new Error(
                '11.5 focus mutation was not expected in this test.',
              );
            },
          },
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

          {
            provide:
              GALAXY_FOCUS_RUNTIME,

            useValue:
              focusRuntime,
          },
        ],
      });
    }

    it(
      'should load the default B5 origin galaxy with its own bootstrap statistics without reading PD or changing focus',
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
          'Elixisis',
        );

        expect(
          model
            ?.profile
            .galaxyType,
        ).toBe(
          GalaxyType
            .BARRED_SPIRAL,
        );

        expect(
          model
            ?.statistics
            .progressUnits,
        ).toBe(
          2n,
        );

        expect(
          model
            ?.statistics
            .knownRecords,
        ).toBe(
          1n,
        );

        expect(
          model
            ?.statistics
            .internalKnownRecords,
        ).toBe(
          0n,
        );

        expect(
          model
            ?.isCurrentFocus,
        ).toBe(true);

        expect(
          model
            ?.isVisitable,
        ).toBe(false);

        expect(
          model
            ?.isOriginGalaxy,
        ).toBe(true);
      },
      15_000,
    );

    it(
      'should render the point-11.5 profile, local progress and current-focus control',
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
          'Elixisis',
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
          'Espiral barrada',
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
            '[data-testid="galaxy-detail-scale"]',
          )?.textContent,
        ).toMatch(
          /Compacta|Media|Grande|Extendida/,
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-population"]',
          )?.textContent,
        ).toMatch(
          /Baja|Moderada|Alta|Muy alta/,
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-nuclear"]',
          )?.textContent,
        ).toMatch(
          /Sin actividad nuclear clara|Candidata a núcleo activo|Candidata a actividad nuclear extrema/,
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-progress"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-progress-units"]',
          )?.textContent,
        ).toContain(
          '2',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-known-records"]',
          )?.textContent,
        ).toContain(
          '1',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-known-sectors"]',
          )?.textContent,
        ).toContain(
          '0',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-state-discovered"]',
          )?.textContent,
        ).toContain(
          '1',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-progress-no-percentage"]',
          )?.textContent,
        ).toContain(
          'No son PD ni un porcentaje',
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
            '[data-testid="galaxy-detail-focus-control"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-focus-current"]',
          )?.textContent,
        ).toContain(
          'Esta galaxia ya define el contexto activo',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-change-focus-action"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-boundary"]',
          )?.textContent,
        ).toContain(
          '11.5',
        );
      },
      15_000,
    );

    it(
      'should derive statistics from every known locator in the requested galaxy only',
      async () => {
        const knownDiscoveries =
          [
            new KnownDiscovery(
              generationKey,
              new GalaxyLocator(
                0n,
              ),
              DiscoveryState
                .DISCOVERED,
            ),

            new KnownDiscovery(
              generationKey,
              new SectorLocator(
                0n,
                10n,
              ),
              DiscoveryState
                .DETECTED,
            ),

            new KnownDiscovery(
              generationKey,
              new GalacticObjectLocator(
                0n,
                10n,
                1n,
              ),
              DiscoveryState
                .VISITED,
            ),

            new KnownDiscovery(
              generationKey,
              new SystemLocator(
                0n,
                10n,
                2n,
              ),
              DiscoveryState
                .CONFIRMED,
            ),

            new KnownDiscovery(
              generationKey,
              new BodyLocator(
                0n,
                10n,
                2n,
                4n,
              ),
              DiscoveryState
                .CATALOGUED,
            ),

            new KnownDiscovery(
              generationKey,
              new CivilizationLocator(
                0n,
                10n,
                2n,
                4n,
                1n,
              ),
              DiscoveryState
                .DISCOVERED,
            ),

            new KnownDiscovery(
              generationKey,
              new GalaxyLocator(
                1n,
              ),
              DiscoveryState
                .CONFIRMED,
            ),

            new KnownDiscovery(
              generationKey,
              new SystemLocator(
                1n,
                20n,
                3n,
              ),
              DiscoveryState
                .CONFIRMED,
            ),
          ];

        configure(
          '0',
          repositories(
            defaultStates,
            0n,
            [
              generationKey,
            ],
            knownDiscoveries,
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

        const statistics =
          facade
            .model()
            ?.statistics;

        expect(
          statistics
            ?.progressUnits,
        ).toBe(
          17n,
        );

        expect(
          statistics
            ?.knownRecords,
        ).toBe(
          6n,
        );

        expect(
          statistics
            ?.targetCounts,
        ).toEqual({
          sectors:
            1n,

          galacticObjects:
            1n,

          systems:
            1n,

          bodies:
            1n,

          civilizations:
            1n,
        });

        expect(
          statistics
            ?.stateCounts,
        ).toEqual({
          detected:
            1n,

          discovered:
            2n,

          visited:
            1n,

          catalogued:
            1n,

          confirmed:
            1n,
        });
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
            '[data-testid="galaxy-detail-progress-units"]',
          )?.textContent,
        ).toContain(
          '1',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-known-records"]',
          )?.textContent,
        ).toContain(
          '1',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-map-link"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-change-focus-action"]',
          )?.textContent,
        ).toContain(
          'Establecer como foco de exploración',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-focus-semantics"]',
          )?.textContent,
        ).toContain(
          'no representa ni afirma un',
        );
      },
      15_000,
    );

    it(
      'should change focus explicitly, promote a DETECTED galaxy to VISITED and reload its newly available identity',
      async () => {
        const mutableStates =
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
          ]);

        let activeGalaxyIndex =
          0n;

        let recentGalaxyIndices:
          readonly bigint[] =
          [];

        const repositoryBundle:
          GenesisLocalRepositories =
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
                  activeGalaxyIndex,
                  recentGalaxyIndices,
                };
              },

              async setNavigation(
                _generationKey,
                navigation,
              ) {
                activeGalaxyIndex =
                  navigation
                    .activeGalaxyIndex;

                recentGalaxyIndices =
                  [
                    ...navigation
                      .recentGalaxyIndices,
                  ];
              },
            },

            pointsRepository: {
              async getGlobalDiscoveryPoints() {
                throw new Error(
                  '11.5 must not read global PD.',
                );
              },

              async setGlobalDiscoveryPoints() {
                throw new Error(
                  '11.5 must not write global PD.',
                );
              },

              async getGalaxyDiscoveryPoints() {
                throw new Error(
                  '11.5 must not read per-galaxy PD.',
                );
              },

              async setGalaxyDiscoveryPoints() {
                throw new Error(
                  '11.5 must not write per-galaxy PD.',
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
                    '11.5 focus tests query GalaxyLocator state only.',
                  );
                }

                return (
                  mutableStates.get(
                    locator
                      .galaxyIndex,
                  ) ??
                  DiscoveryState
                    .UNKNOWN
                );
              },

              async setState(
                _generationKey,
                locator,
                state,
              ) {
                if (
                  !(
                    locator instanceof
                    GalaxyLocator
                  )
                ) {
                  throw new Error(
                    '11.5 focus tests mutate GalaxyLocator state only.',
                  );
                }

                mutableStates.set(
                  locator
                    .galaxyIndex,
                  state,
                );
              },

              async getKnownDiscoveries() {
                return galaxyDiscoveriesFromStates(
                  mutableStates,
                );
              },

              async getKnownDiscoveriesInSector() {
                throw new Error(
                  '11.5 must not materialize sector content.',
                );
              },
            },
          };

        const focusRuntime:
          GalaxyFocusRuntime =
          {
            async changeFocus(
              _generationKey,
              targetGalaxyIndex,
            ) {
              const targetStateBefore =
                mutableStates.get(
                  targetGalaxyIndex,
                ) ??
                DiscoveryState
                  .UNKNOWN;

              mutableStates.set(
                targetGalaxyIndex,
                DiscoveryState
                  .VISITED,
              );

              const previousFocusGalaxyIndex =
                activeGalaxyIndex;

              activeGalaxyIndex =
                targetGalaxyIndex;

              recentGalaxyIndices =
                [
                  previousFocusGalaxyIndex,
                ];

              return Object.freeze({
                previousFocusGalaxyIndex,
                activeGalaxyIndex:
                  targetGalaxyIndex,
                targetStateBefore,
                targetStateAfter:
                  DiscoveryState
                    .VISITED,
                didPromoteTargetToVisited:
                  true,
                recentGalaxyIndices,
              });
            },
          };

        configure(
          '1',
          repositoryBundle,
          focusRuntime,
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

        const before =
          fixture.nativeElement as
            HTMLElement;

        expect(
          before.querySelector(
            '[data-testid="galaxy-detail-name-restricted"]',
          ),
        ).toBeTruthy();

        await fixture
          .componentInstance
          .facade
          .changeFocusToDisplayedGalaxy();

        fixture.detectChanges();

        const after =
          fixture.nativeElement as
            HTMLElement;

        expect(
          activeGalaxyIndex,
        ).toBe(
          1n,
        );

        expect(
          recentGalaxyIndices,
        ).toEqual([
          0n,
        ]);

        expect(
          mutableStates.get(
            1n,
          ),
        ).toBe(
          DiscoveryState
            .VISITED,
        );

        expect(
          after.querySelector(
            '[data-testid="galaxy-detail-state"]',
          )?.textContent,
        ).toContain(
          'Visitada',
        );

        expect(
          after.querySelector(
            '[data-testid="galaxy-detail-name"]',
          ),
        ).toBeTruthy();

        expect(
          after.querySelector(
            '[data-testid="galaxy-detail-exact-type"]',
          ),
        ).toBeTruthy();

        expect(
          after.querySelector(
            '[data-testid="galaxy-detail-focus-badge"]',
          ),
        ).toBeTruthy();

        expect(
          after.querySelector(
            '[data-testid="galaxy-detail-map-link"]',
          ),
        ).toBeTruthy();

        expect(
          after.querySelector(
            '[data-testid="galaxy-detail-focus-success"]',
          )?.textContent,
        ).toContain(
          'Visitada',
        );

        expect(
          after.querySelector(
            '[data-testid="galaxy-detail-change-focus-action"]',
          ),
        ).toBeNull();
      },
      15_000,
    );

    it(
      'should expose not-found for an UNKNOWN URL target without enumerating hidden content',
      async () => {
        const baseRepositories =
          repositories();

        const repositoryBundle:
          GenesisLocalRepositories =
          {
            ...baseRepositories,

            discoveryRepository: {
              ...baseRepositories
                .discoveryRepository,

              async getKnownDiscoveries() {
                throw new Error(
                  'UNKNOWN targets must be rejected before statistics are enumerated.',
                );
              },
            },
          };

        configure(
          '99',
          repositoryBundle,
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
