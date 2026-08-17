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
      'should render the known galaxies, focus marker and preliminary safe information',
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

        expect(
          element.querySelectorAll(
            '[data-testid="discovered-galaxy-card"]',
          ).length,
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
          element.querySelector(
            '[data-testid="current-focus-badge"]',
          )?.textContent,
        ).toContain(
          'EN FOCO',
        );

        expect(
          element.querySelectorAll(
            '[data-testid="galaxy-visitable-badge"]',
          ).length,
        ).toBe(
          1,
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-visitable-badge"]',
          )?.textContent,
        ).toContain(
          'VISITABLE',
        );

        const galaxyCards =
          element.querySelectorAll(
            '[data-testid="discovered-galaxy-card"]',
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
            0
          ]
            ?.querySelector(
              '[data-testid="discovered-galaxy-index"]',
            )
            ?.textContent,
        ).toContain(
          'Galaxia 0',
        );

        expect(
          galaxyCards[
            1
          ]
            ?.querySelector(
              '[data-testid="discovered-galaxy-name"]',
            ),
        ).toBeNull();

        expect(
          galaxyCards[
            1
          ]
            ?.querySelector(
              '[data-testid="discovered-galaxy-index"]',
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

        expect(
          element.querySelectorAll(
            '[data-testid="galaxy-state-definition"]',
          ).length,
        ).toBe(
          4,
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-state-semantics"]',
          )?.textContent,
        ).toContain(
          'Desconocida',
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

        expect(
          element.querySelector(
            '[data-testid="discovered-galaxies-point-boundary"]',
          )?.textContent,
        ).toContain(
          '11.5',
        );
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
