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
  ExplorationSectorProgressResult,
} from '../../domain/exploration/exploration-sector-progress-result';

import {
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

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
  ExternalGalaxySearchPityEngine,
} from '../../simulation/exploration/external-galaxy-search-pity-engine';

import {
  EXTERNAL_GALAXY_SEARCH_RUNTIME,
  type ExternalGalaxySearchRuntime,
} from '../runtime/external-galaxy-search.runtime';

import {
  GALAXY_FOCUS_RUNTIME,
  type GalaxyFocusRuntime,
} from '../runtime/galaxy-focus.runtime';

import {
  EXPLORATION_SECTOR_PROGRESS_RUNTIME,
  type ExplorationSectorProgressRuntime,
} from '../runtime/exploration-sector-progress.runtime';

import {
  GENESIS_LOCAL_REPOSITORIES,
  type GenesisLocalRepositories,
} from '../runtime/genesis-local-repositories';

import {
  UniverseSeedFacade,
} from '../universe/universe-seed.facade';

import {
  Exploration,
} from './exploration';

describe(
  'Exploration point 9.5 plus external-galaxy gameplay integration',
  () => {
    const POINT_9_5_FIXTURE_SEED =
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1';

    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          POINT_9_5_FIXTURE_SEED,
        ),
        GeneratorVersion.V1,
      );

    const repositories:
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
            return [generationKey];
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
            return [
              new KnownDiscovery(
                generationKey,
                new GalaxyLocator(0n),
                DiscoveryState.DISCOVERED,
              ),
            ];
          },

          async getKnownDiscoveriesInSector() {
            return [];
          },
        },
      };

    const runtime:
      ExplorationSectorProgressRuntime =
      {
        async commitResolvedResult(
          result,
        ) {
          const staticResult =
            result.targetLocator !==
            null;

          const award =
            !staticResult
              ? 2
              : result.resultKind ===
                ExplorationResultKind.SYSTEM
                ? 8
                : 14;

          return new ExplorationSectorProgressResult(
            award,
            0n,
            BigInt(award),
            2n,
            staticResult
              ? 4n
              : 3n,
            DiscoveryState.DETECTED,
            staticResult
              ? DiscoveryState.DETECTED
              : null,
          );
        },
      };

    let failures:
      bigint;

    const externalRuntime:
      ExternalGalaxySearchRuntime =
      {
        async getStatus() {
          return {
            globalDiscoveryPoints:
              0n,

            consecutiveFailedSearches:
              failures,

            knownExternalGalaxyCount:
              0n,

            nextSearchProfile:
              ExternalGalaxySearchPityEngine
                .evaluateNextSearchProbability(
                  generationKey,
                  0n,
                  failures,
                ),
          };
        },

        async search() {
          const before =
            failures;

          const used =
            ExternalGalaxySearchPityEngine
              .evaluateNextSearchProbability(
                generationKey,
                0n,
                before,
              );

          failures +=
            1n;

          return {
            detected:
              false,

            probabilityProfileUsed:
              used,

            consecutiveFailedSearchesBefore:
              before,

            consecutiveFailedSearchesAfter:
              failures,

            globalDiscoveryPointsBefore:
              0n,

            globalDiscoveryPointsAfter:
              0n,

            awardedDiscoveryPoints:
              0,

            detectedGalaxyIndex:
              null,

            preliminaryInformation:
              null,

            focusOffer:
              null,

            nextSearchProfile:
              ExternalGalaxySearchPityEngine
                .evaluateNextSearchProbability(
                  generationKey,
                  0n,
                  failures,
                ),
          };
        },
      };

    const focusRuntime:
      GalaxyFocusRuntime =
      {
        async changeFocus() {
          throw new Error(
            'Unexpected focus change.',
          );
        },

        async returnToRecentGalaxy() {
          throw new Error(
            'Unexpected recent-galaxy return.',
          );
        },
      };

    beforeEach(
      async () => {
        failures =
          0n;

        await TestBed
          .configureTestingModule({
            imports: [
              Exploration,
            ],

            providers: [
              provideRouter([]),
              {
                provide:
                  GENESIS_LOCAL_REPOSITORIES,

                useValue:
                  repositories,
              },
              {
                provide:
                  EXPLORATION_SECTOR_PROGRESS_RUNTIME,

                useValue:
                  runtime,
              },
              {
                provide:
                  EXTERNAL_GALAXY_SEARCH_RUNTIME,

                useValue:
                  externalRuntime,
              },
              {
                provide:
                  GALAXY_FOCUS_RUNTIME,

                useValue:
                  focusRuntime,
              },
              {
                provide:
                  UniverseSeedFacade,

                useValue: {
                  activeGenerationKey:
                    () =>
                      generationKey,
                },
              },
            ],
          })
          .compileComponents();
      },
    );

    async function fixtureAndElement() {
      const fixture =
        TestBed.createComponent(
          Exploration,
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
      'should render the active exploration context without reward before scanning',
      async () => {
        const {
          element,
        } =
          await fixtureAndElement();

        expect(
          element.querySelector(
            '[data-testid="exploration-page"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="exploration-reward"]',
          ),
        ).toBeNull();
      },
    );

    it(
      'should render the resolved result and point-9.5 reward/progress without changing scientific classification',
      async () => {
        const {
          fixture,
          element,
        } =
          await fixtureAndElement();

        await fixture
          .componentInstance
          .facade
          .scanSector(
            '0',
            '0',
          );

        fixture.detectChanges();

        expect(
          element.querySelector(
            '[data-testid="exploration-result"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="exploration-reward"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="exploration-result-scientific-classification"]',
          )?.textContent,
        ).toContain(
          'Sin clasificar',
        );

        expect(
          element.querySelector(
            '[data-testid="exploration-sector-state"]',
          )?.textContent,
        ).toContain(
          'Detectada',
        );
      },
    );

    it(
      'should render transient progression as non-persisted event identity',
      async () => {
        const {
          fixture,
          element,
        } =
          await fixtureAndElement();

        await fixture
          .componentInstance
          .facade
          .scanSector(
            '86',
            '86',
          );

        fixture.detectChanges();

        expect(
          element.querySelector(
            '[data-testid="exploration-result-state"]',
          )?.textContent,
        ).toContain(
          'Evento no persistido',
        );

        expect(
          element.querySelector(
            '[data-testid="exploration-reward-points"]',
          )?.textContent,
        ).toContain(
          '+2 PD',
        );
      },
    );

    it(
      'should keep the point-9.5 boundary explicit in the real screen',
      async () => {
        const {
          element,
        } =
          await fixtureAndElement();

        expect(
          element.textContent,
        ).toContain(
          'Límite del punto 9.5',
        );

        expect(
          element.textContent,
        ).toContain(
          'Ground Truth oculto',
        );
      },
    );

    it(
      'should render external-galaxy search as a separate global operation with the baseline probability',
      async () => {
        const {
          element,
        } =
          await fixtureAndElement();

        expect(
          element.querySelector(
            '[data-testid="external-galaxy-search"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="external-galaxy-search-action"]',
          )?.textContent,
        ).toContain(
          'BUSCAR GALAXIA EXTERNA',
        );

        expect(
          element.querySelector(
            '[data-testid="external-galaxy-search-effective-probability"]',
          )?.textContent,
        ).toContain(
          '2%',
        );

        expect(
          element.textContent,
        ).toContain(
          'no usa coordenadas X/Y',
        );
      },
    );

    it(
      'should render a failed external search without creating a sector result and show the increased pity state',
      async () => {
        const {
          fixture,
          element,
        } =
          await fixtureAndElement();

        await fixture
          .componentInstance
          .facade
          .searchExternalGalaxy();

        fixture.detectChanges();

        expect(
          element.querySelector(
            '[data-testid="external-galaxy-search-result"]',
          )?.getAttribute(
            'data-detected',
          ),
        ).toBe(
          'false',
        );

        expect(
          element.querySelector(
            '[data-testid="external-galaxy-search-failures"]',
          )?.textContent,
        ).toContain(
          '1',
        );

        expect(
          element.querySelector(
            '[data-testid="external-galaxy-search-effective-probability"]',
          )?.textContent,
        ).toContain(
          '11.8%',
        );

        expect(
          element.querySelector(
            '[data-testid="exploration-result"]',
          ),
        ).toBeNull();
      },
    );
  },
);
