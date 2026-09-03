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
  ExplorationBalanceV1,
} from '../../domain/exploration/exploration-balance';

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
  'Exploration external-galaxy gameplay integration',
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

    let globalDiscoveryPoints:
      bigint;

    let consumedSearchOpportunities:
      bigint;

    let lastAnnouncedEarnedSearchOpportunities:
      bigint;

    function externalStatus() {
      const searchDiscoveryPointStep =
        ExplorationBalanceV1
          .externalGalaxySearchDiscoveryPointStep;

      const earnedSearchOpportunities =
        globalDiscoveryPoints /
        searchDiscoveryPointStep;

      const availableSearchOpportunities =
        earnedSearchOpportunities -
        consumedSearchOpportunities;

      const unannouncedSearchOpportunities =
        earnedSearchOpportunities -
        lastAnnouncedEarnedSearchOpportunities;

      const nextSearchOpportunityThreshold =
        (
          earnedSearchOpportunities +
          1n
        ) *
        searchDiscoveryPointStep;

      return {
        globalDiscoveryPoints,
        consecutiveFailedSearches:
          failures,
        knownExternalGalaxyCount:
          0n,
        searchOpportunityAvailable:
          availableSearchOpportunities >
          0n,
        earnedSearchOpportunities,
        consumedSearchOpportunities,
        availableSearchOpportunities,
        unannouncedSearchOpportunities,
        nextSearchOpportunityThreshold,
        discoveryPointsUntilNextOpportunity:
          nextSearchOpportunityThreshold -
          globalDiscoveryPoints,
        searchDiscoveryPointStep,

        nextSearchProfile:
          ExternalGalaxySearchPityEngine
            .evaluateNextSearchProbability(
              generationKey,
              globalDiscoveryPoints,
              failures,
            ),
      };
    }

    const externalRuntime:
      ExternalGalaxySearchRuntime =
      {
        async getStatus() {
          return externalStatus();
        },

        async acknowledgeOpportunityNotifications() {
          lastAnnouncedEarnedSearchOpportunities =
            globalDiscoveryPoints /
            ExplorationBalanceV1
              .externalGalaxySearchDiscoveryPointStep;
        },

        async search() {
          const status =
            externalStatus();

          if (
            !status
              .searchOpportunityAvailable
          ) {
            throw new RangeError(
              `External-galaxy search has no available attempts. The next attempt unlocks at ${status.nextSearchOpportunityThreshold.toString(10)} global Discovery Points.`,
            );
          }

          const before =
            failures;

          const used =
            ExternalGalaxySearchPityEngine
              .evaluateNextSearchProbability(
                generationKey,
                globalDiscoveryPoints,
                before,
              );

          failures +=
            1n;

          consumedSearchOpportunities +=
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
              globalDiscoveryPoints,

            globalDiscoveryPointsAfter:
              globalDiscoveryPoints,

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
                  globalDiscoveryPoints,
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

        globalDiscoveryPoints =
          0n;

        consumedSearchOpportunities =
          0n;

        lastAnnouncedEarnedSearchOpportunities =
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
      'should keep /exploration exclusively focused on the external-galaxy search flow',
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
            '[data-testid="external-galaxy-search"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="exploration-operation-scope"]',
          )?.textContent,
        ).toContain(
          'Búsqueda extragaláctica',
        );

        for (
          const testId
          of [
            'scan-sector-action',
            'selected-sector-from-map',
            'exploration-result',
            'exploration-reward',
            'exploration-open-galaxy-map-link',
          ]
        ) {
          expect(
            element.querySelector(
              `[data-testid="${testId}"]`,
            ),
          ).toBeNull();
        }
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

        const searchAction =
          element.querySelector(
            '[data-testid="external-galaxy-search-action"]',
          ) as HTMLButtonElement | null;

        expect(
          searchAction
            ?.disabled,
        ).toBe(
          true,
        );

        expect(
          searchAction
            ?.textContent,
        ).toContain(
          'BÚSQUEDA BLOQUEADA',
        );

        expect(
          element.querySelector(
            '[data-testid="external-galaxy-search-opportunity-threshold"]',
          )?.textContent,
        ).toContain(
          'Cada 100 PD ganados.',
        );

        expect(
          element.querySelector(
            '[data-testid="external-galaxy-search-points-remaining"]',
          )?.textContent,
        ).toContain(
          '100',
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

        globalDiscoveryPoints =
          100n;

        await fixture
          .componentInstance
          .facade
          .refresh();

        fixture.detectChanges();

        expect(
          (
            element.querySelector(
              '[data-testid="external-galaxy-search-action"]',
            ) as HTMLButtonElement | null
          )
            ?.disabled,
        ).toBe(
          false,
        );

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
            '[data-testid="external-galaxy-search-opportunity-threshold"]',
          )?.textContent,
        ).toContain(
          'Cada 100 PD ganados.',
        );

        expect(
          (
            element.querySelector(
              '[data-testid="external-galaxy-search-action"]',
            ) as HTMLButtonElement | null
          )
            ?.disabled,
        ).toBe(
          true,
        );

        expect(
          element.querySelector(
            '[data-testid="exploration-result"]',
          ),
        ).toBeNull();
      },
    );

    it(
      'should announce newly accumulated search attempts once and show the complete available stock',
      async () => {
        globalDiscoveryPoints =
          300n;

        const {
          fixture,
          element,
        } =
          await fixtureAndElement();

        fixture.detectChanges();

        expect(
          element.querySelector(
            '[data-testid="external-galaxy-search-available-attempts"]',
          )?.textContent,
        ).toContain(
          '3',
        );

        expect(
          element.querySelector(
            '[data-testid="external-galaxy-search-opportunity-toast-new"]',
          )?.textContent,
        ).toContain(
          '3 nuevos intentos',
        );

        expect(
          element.querySelector(
            '[data-testid="external-galaxy-search-opportunity-toast-total"]',
          )?.textContent,
        ).toContain(
          '3 intentos disponibles',
        );

        fixture
          .componentInstance
          .dismissExternalSearchOpportunityNotification();

        fixture.detectChanges();

        expect(
          element.querySelector(
            '[data-testid="external-galaxy-search-opportunity-toast"]',
          ),
        ).toBeNull();

        await fixture
          .componentInstance
          .facade
          .refresh();

        fixture.detectChanges();

        expect(
          element.querySelector(
            '[data-testid="external-galaxy-search-opportunity-toast"]',
          ),
        ).toBeNull();
      },
    );
  },
);
