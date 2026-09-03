import {
  TestBed,
} from '@angular/core/testing';

import {
  provideRouter,
} from '@angular/router';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  KnownDiscovery,
} from '../../domain/discovery/known-discovery';

import {
  GalaxyKnowledgeState,
} from '../../domain/exploration/galaxy-knowledge-state';

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
  DiscoveredGalaxiesFacade,
} from './discovered-galaxies.facade';

import {
  DiscoveredGalaxiesPage,
} from './discovered-galaxies';

describe(
  'DiscoveredGalaxiesPage',
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

            new KnownDiscovery(
              generationKey,
              new GalaxyLocator(
                1n,
              ),
              DiscoveryState
                .DETECTED,
            ),

            new KnownDiscovery(
              generationKey,
              new SystemLocator(
                0n,
                0n,
                0n,
              ),
              DiscoveryState
                .CONFIRMED,
            ),
          ],

      activeGalaxyIndex =
        0n,

      recentGalaxyIndices:
        readonly bigint[] =
          [],
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

              recentGalaxyIndices,
            };
          },

          async setNavigation() {
            throw new Error(
              '11.1 must not change the active galaxy.',
            );
          },
        },

        pointsRepository: {
          async getGlobalDiscoveryPoints() {
            throw new Error(
              '11.1 must not read global PD.',
            );
          },

          async setGlobalDiscoveryPoints() {
            throw new Error(
              '11.1 must not write global PD.',
            );
          },

          async getGalaxyDiscoveryPoints() {
            throw new Error(
              '11.1 must not read per-galaxy PD.',
            );
          },

          async setGalaxyDiscoveryPoints() {
            throw new Error(
              '11.1 must not write per-galaxy PD.',
            );
          },
        },

        discoveryRepository: {
          async getState() {
            throw new Error(
              '11.1 reads the persisted known-discovery snapshot once.',
            );
          },

          async setState() {
            throw new Error(
              '11.1 must not mutate DiscoveryState.',
            );
          },

          async getKnownDiscoveries() {
            return knownDiscoveries;
          },

          async getKnownDiscoveriesInSector() {
            throw new Error(
              '11.1 must not materialize sector content.',
            );
          },
        },
      };
    }

    function configure(
      repositoryBundle:
        GenesisLocalRepositories,

      focusRuntime:
        GalaxyFocusRuntime =
          {
            async changeFocus() {
              throw new Error(
                '11.5 focus mutation was not expected in this catalogue test.',
              );
            },

            async returnToRecentGalaxy() {
              throw new Error(
                '11.6 return mutation was not expected in this catalogue test.',
              );
            },
          },
    ): void {

      TestBed.configureTestingModule({
        imports: [
          DiscoveredGalaxiesPage,
        ],

        providers: [
          provideRouter(
            [],
          ),

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
      'should build the point-11.1 read-only catalogue from known GalaxyLocator discoveries only',
      async () => {
        configure(
          repositories(),
        );

        const facade =
          TestBed.inject(
            DiscoveredGalaxiesFacade,
          );

        await facade
          .refresh();

        const snapshot =
          facade.snapshot();

        expect(
          snapshot,
        ).not.toBeNull();

        expect(
          snapshot
            ?.entries
            .map(
              (
                entry,
              ) =>
                entry.galaxyIndex,
            ),
        ).toEqual([
          0n,
          1n,
        ]);

        expect(
          snapshot
            ?.entries[
              0
            ]
            .knowledgeState,
        ).toBe(
          DiscoveryState
            .DISCOVERED,
        );

        expect(
          snapshot
            ?.entries[
              1
            ]
            .knowledgeState,
        ).toBe(
          DiscoveryState
            .DETECTED,
        );

        expect(
          snapshot
            ?.currentFocusGalaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          snapshot
            ?.entries[
              0
            ]
            .isCurrentFocus,
        ).toBe(true);

        expect(
          snapshot
            ?.entries[
              0
            ]
            .galaxyKnowledgeState,
        ).toBe(
          GalaxyKnowledgeState
            .DISCOVERED,
        );

        expect(
          snapshot
            ?.entries[
              1
            ]
            .galaxyKnowledgeState,
        ).toBe(
          GalaxyKnowledgeState
            .DETECTED,
        );

        expect(
          snapshot
            ?.entries[
              0
            ]
            .knownName,
        ).toBe(
          'Elixisis',
        );

        expect(
          snapshot
            ?.entries[
              1
            ]
            .knownName,
        ).toBeNull();

        expect(
          snapshot
            ?.entries[
              1
            ]
            .designationCode,
        ).toContain(
          'GEN-V1-G1-',
        );
      },
      15_000,
    );

    it(
      'should route DETECTED catalogue rows to validation instead of allowing a direct focus jump',
      async () => {
        configure(
          repositories(),
        );

        await TestBed
          .compileComponents();

        const fixture =
          TestBed.createComponent(
            DiscoveredGalaxiesPage,
          );

        fixture.detectChanges();

        await fixture
          .componentInstance
          .facade
          .refresh();

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="discovered-galaxies-page"]',
          ),
        ).toBeTruthy();

        const galaxyCards =
          element.querySelectorAll(
            '[data-testid="discovered-galaxy-card"]',
          );

        expect(
          galaxyCards.length,
        ).toBe(
          2,
        );

        expect(
          element.querySelector(
            '[data-testid="known-galaxy-count"]',
          )?.textContent,
        ).toContain(
          '2',
        );

        expect(
          galaxyCards[
            0
          ]
            ?.querySelector(
              '[data-testid="discovered-galaxy-name"]',
            )
            ?.textContent,
        ).toContain(
          'Elixisis',
        );

        expect(
          galaxyCards[
            1
          ]
            ?.querySelector(
              '[data-testid="discovered-galaxy-name"]',
            )
            ?.textContent,
        ).toContain(
          'Galaxia 1',
        );

        expect(
          element.querySelectorAll(
            '[data-testid="discovered-galaxy-state"]',
          )[
            0
          ]
            ?.textContent,
        ).toContain(
          'Descubierta',
        );

        expect(
          element.querySelectorAll(
            '[data-testid="discovered-galaxy-state"]',
          )[
            1
          ]
            ?.textContent,
        ).toContain(
          'Detectada',
        );

        const originStatuses =
          element.querySelectorAll(
            '[data-testid="galaxy-origin-status"]',
          );

        expect(
          originStatuses[
            0
          ]
            ?.textContent,
        ).toContain(
          'Galaxia natal',
        );

        expect(
          originStatuses[
            1
          ]
            ?.textContent,
        ).toContain(
          'Galaxia externa',
        );

        const detailLinks =
          element.querySelectorAll(
            '[data-testid="discovered-galaxy-detail-link"]',
          );

        expect(
          detailLinks.length,
        ).toBe(
          2,
        );

        expect(
          detailLinks[
            0
          ]?.getAttribute(
            'href',
          ),
        ).toBe(
          '/galaxies/0',
        );

        expect(
          detailLinks[
            1
          ]?.getAttribute(
            'href',
          ),
        ).toBe(
          '/galaxies/1',
        );

        const focusActions =
          element.querySelectorAll(
            '[data-testid="discovered-galaxy-focus-action"]',
          );

        expect(
          focusActions.length,
        ).toBe(
          1,
        );

        expect(
          (
            focusActions[
              0
            ] as HTMLButtonElement
          ).disabled,
        ).toBe(
          true,
        );

        expect(
          focusActions[
            0
          ]?.textContent,
        ).toContain(
          'EN FOCO',
        );

        const validateActions =
          element.querySelectorAll(
            '[data-testid="discovered-galaxy-validate-action"]',
          );

        expect(
          validateActions.length,
        ).toBe(
          1,
        );

        expect(
          validateActions[
            0
          ]?.getAttribute(
            'href',
          ),
        ).toBe(
          '/galaxies/1',
        );

        expect(
          validateActions[
            0
          ]?.textContent,
        ).toContain(
          'VALIDAR DETECCIÓN',
        );

        expect(
          element.querySelector(
            '[data-testid="discovered-galaxy-morphology"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="discovered-galaxy-designation"]',
          ),
        ).toBeNull();
      },
      30_000,
    );

    it(
      'should keep the persisted point-11.6 MRU history out of the catalogue UI',
      async () => {
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
                  .VISITED,
              ),

              new KnownDiscovery(
                generationKey,
                new GalaxyLocator(
                  1n,
                ),
                DiscoveryState
                  .VISITED,
              ),

              new KnownDiscovery(
                generationKey,
                new GalaxyLocator(
                  2n,
                ),
                DiscoveryState
                  .CATALOGUED,
              ),
            ],
            2n,
            [
              1n,
              0n,
            ],
          ),
        );

        await TestBed
          .compileComponents();

        const fixture =
          TestBed.createComponent(
            DiscoveredGalaxiesPage,
          );

        fixture.detectChanges();

        await fixture
          .componentInstance
          .facade
          .refresh();

        fixture.detectChanges();

        expect(
          fixture
            .componentInstance
            .facade
            .recentEntries()
            .map(
              (
                entry,
              ) =>
                entry
                  .galaxyIndex,
            ),
        ).toEqual([
          1n,
          0n,
        ]);

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="galaxy-return-history"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="galaxy-return-action"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="previous-focus-badge"]',
          ),
        ).toBeNull();
      },
      30_000,
    );

    it(
      'should change focus directly from any known catalogue row through the existing focus runtime',
      async () => {
        let activeGalaxyIndex =
          0n;

        let recentGalaxyIndices:
          readonly bigint[] =
          [];

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
              new GalaxyLocator(
                1n,
              ),
              DiscoveryState
                .DISCOVERED,
            ),
          ];

        const baseRepositories =
          repositories(
            [
              generationKey,
            ],
            knownDiscoveries,
            activeGalaxyIndex,
            recentGalaxyIndices,
          );

        const repositoryBundle:
          GenesisLocalRepositories =
          {
            ...baseRepositories,

            navigationRepository: {
              async getNavigation() {
                return {
                  activeGalaxyIndex,
                  recentGalaxyIndices,
                };
              },

              async setNavigation() {
                throw new Error(
                  'The catalogue must delegate focus writes to the runtime.',
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
              expect(
                targetGalaxyIndex,
              ).toBe(
                1n,
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
                targetStateBefore:
                  DiscoveryState
                    .DISCOVERED,
                targetStateAfter:
                  DiscoveryState
                    .VISITED,
                didPromoteTargetToVisited:
                  true,
                recentGalaxyIndices,
              });
            },

            async returnToRecentGalaxy() {
              throw new Error(
                'The compact catalogue must use changeFocus(), not the hidden MRU return action.',
              );
            },
          };

        configure(
          repositoryBundle,
          focusRuntime,
        );

        const facade =
          TestBed.inject(
            DiscoveredGalaxiesFacade,
          );

        await facade
          .refresh();

        await facade
          .focusGalaxy(
            1n,
          );

        expect(
          facade
            .snapshot()
            ?.currentFocusGalaxyIndex,
        ).toBe(
          1n,
        );

        expect(
          facade
            .focusSuccessMessage(),
        ).toContain(
          'nuevo foco',
        );

        expect(
          facade
            .focusPendingGalaxyIndex(),
        ).toBeNull();
      },
      30_000,
    );

    it(
      'should return to a persisted previous galaxy through the point-11.6 runtime and refresh the MRU history',
      async () => {
        let activeGalaxyIndex =
          1n;

        let recentGalaxyIndices:
          readonly bigint[] =
          [
            0n,
          ];

        const knownDiscoveries =
          [
            new KnownDiscovery(
              generationKey,
              new GalaxyLocator(
                0n,
              ),
              DiscoveryState
                .VISITED,
            ),

            new KnownDiscovery(
              generationKey,
              new GalaxyLocator(
                1n,
              ),
              DiscoveryState
                .VISITED,
            ),
          ];

        const baseRepositories =
          repositories(
            [
              generationKey,
            ],
            knownDiscoveries,
            activeGalaxyIndex,
            recentGalaxyIndices,
          );

        const repositoryBundle:
          GenesisLocalRepositories =
          {
            ...baseRepositories,

            navigationRepository: {
              async getNavigation() {
                return {
                  activeGalaxyIndex,
                  recentGalaxyIndices,
                };
              },

              async setNavigation() {
                throw new Error(
                  'The catalogue must delegate 11.6 navigation writes to the runtime.',
                );
              },
            },
          };

        const focusRuntime:
          GalaxyFocusRuntime =
          {
            async changeFocus() {
              throw new Error(
                'A persisted previous galaxy must use returnToRecentGalaxy().',
              );
            },

            async returnToRecentGalaxy(
              _generationKey,
              targetGalaxyIndex,
            ) {
              expect(
                targetGalaxyIndex,
              ).toBe(
                0n,
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
                targetStateBefore:
                  DiscoveryState
                    .VISITED,
                targetStateAfter:
                  DiscoveryState
                    .VISITED,
                didPromoteTargetToVisited:
                  false,
                recentGalaxyIndices,
              });
            },
          };

        configure(
          repositoryBundle,
          focusRuntime,
        );

        const facade =
          TestBed.inject(
            DiscoveredGalaxiesFacade,
          );

        await facade
          .refresh();

        expect(
          facade
            .recentEntries()
            .map(
              (
                entry,
              ) =>
                entry
                  .galaxyIndex,
            ),
        ).toEqual([
          0n,
        ]);

        await facade
          .returnToRecentGalaxy(
            0n,
          );

        expect(
          facade
            .snapshot()
            ?.currentFocusGalaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          facade
            .recentEntries()
            .map(
              (
                entry,
              ) =>
                entry
                  .galaxyIndex,
            ),
        ).toEqual([
          1n,
        ]);

        expect(
          facade
            .returnSuccessMessage(),
        ).toContain(
          'progreso persistido se conserva',
        );

        expect(
          facade
            .returnPendingGalaxyIndex(),
        ).toBeNull();
      },
      15_000,
    );

    it(
      'should project higher global galaxy knowledge to VISITED without materializing UNKNOWN',
      async () => {
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

              new KnownDiscovery(
                generationKey,
                new GalaxyLocator(
                  1n,
                ),
                DiscoveryState
                  .VISITED,
              ),

              new KnownDiscovery(
                generationKey,
                new GalaxyLocator(
                  2n,
                ),
                DiscoveryState
                  .CATALOGUED,
              ),

              new KnownDiscovery(
                generationKey,
                new GalaxyLocator(
                  3n,
                ),
                DiscoveryState
                  .CONFIRMED,
              ),
            ],
          ),
        );

        const facade =
          TestBed.inject(
            DiscoveredGalaxiesFacade,
          );

        await facade
          .refresh();

        const snapshot =
          facade.snapshot();

        expect(
          snapshot
            ?.entries
            .map(
              (
                entry,
              ) =>
                entry
                  .galaxyKnowledgeState,
            ),
        ).toEqual([
          GalaxyKnowledgeState
            .DISCOVERED,
          GalaxyKnowledgeState
            .VISITED,
          GalaxyKnowledgeState
            .VISITED,
          GalaxyKnowledgeState
            .VISITED,
        ]);

        expect(
          snapshot
            ?.entries
            .some(
              (
                entry,
              ) =>
                entry
                  .galaxyKnowledgeState ===
                GalaxyKnowledgeState
                  .UNKNOWN,
            ),
        ).toBe(false);
      },
      15_000,
    );

    it(
      'should expose Empty when no persisted universe exists',
      async () => {
        configure(
          repositories(
            [],
            [],
          ),
        );

        const facade =
          TestBed.inject(
            DiscoveredGalaxiesFacade,
          );

        await facade
          .refresh();

        expect(
          facade.state(),
        ).toEqual({
          kind:
            'empty',
        });
      },
    );

    it(
      'should not choose an arbitrary universe when the persisted selection is ambiguous',
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

        configure(
          repositories(
            [
              first,
              second,
            ],
            [],
          ),
        );

        const facade =
          TestBed.inject(
            DiscoveredGalaxiesFacade,
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
      },
    );
  },
);
