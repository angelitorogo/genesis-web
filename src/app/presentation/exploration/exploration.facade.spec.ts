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
  ExternalGalaxyFocusChoice,
} from '../../domain/exploration/external-galaxy-focus';

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
  ExternalGalaxyFocusEngine,
} from '../../simulation/exploration/external-galaxy-focus-engine';

import {
  ExternalGalaxySearchPityEngine,
} from '../../simulation/exploration/external-galaxy-search-pity-engine';

import {
  ExternalGalaxyPreliminaryInformationGenerator,
} from '../../simulation/observation/galaxy/external-galaxy-preliminary-information-generator';

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
  ExplorationFacade,
} from './exploration.facade';

describe(
  'ExplorationFacade point 9.5 plus external-galaxy gameplay integration',
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

    function repositories(
      exists =
        true,
    ): GenesisLocalRepositories {
      return {
        universeRepository: {
          async createIfAbsent() {
            return false;
          },

          async exists() {
            return exists;
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
    }

    function externalStatus(
      globalDiscoveryPoints =
        0n,

      consecutiveFailedSearches =
        0n,

      knownExternalGalaxyCount =
        0n,
    ) {
      return Object.freeze({
        globalDiscoveryPoints,
        consecutiveFailedSearches,
        knownExternalGalaxyCount,

        nextSearchProfile:
          ExternalGalaxySearchPityEngine
            .evaluateNextSearchProbability(
              generationKey,
              globalDiscoveryPoints,
              consecutiveFailedSearches,
            ),
      });
    }

    function baselineExternalRuntime():
      ExternalGalaxySearchRuntime {

      return {
        async getStatus() {
          return externalStatus();
        },

        async search() {
          const used =
            ExternalGalaxySearchPityEngine
              .evaluateNextSearchProbability(
                generationKey,
                0n,
                0n,
              );

          return {
            detected:
              false,

            probabilityProfileUsed:
              used,

            consecutiveFailedSearchesBefore:
              0n,

            consecutiveFailedSearchesAfter:
              1n,

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
                  1n,
                ),
          };
        },
      };
    }

    function noOpFocusRuntime():
      GalaxyFocusRuntime {

      return {
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
    }

    function configure(
      runtime:
        ExplorationSectorProgressRuntime,

      bundle =
        repositories(),

      externalRuntime =
        baselineExternalRuntime(),

      focusRuntime =
        noOpFocusRuntime(),
    ): ExplorationFacade {
      TestBed.resetTestingModule();

      TestBed.configureTestingModule({
        providers: [
          {
            provide:
              GENESIS_LOCAL_REPOSITORIES,

            useValue:
              bundle,
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
      });

      return TestBed.inject(
        ExplorationFacade,
      );
    }

    function successfulRuntime(
      calls:
        unknown[] =
        [],
    ): ExplorationSectorProgressRuntime {
      return {
        async commitResolvedResult(
          result,
        ) {
          calls.push(
            result,
          );

          const staticResult =
            result.targetLocator !==
            null;

          const award =
            staticResult
              ? result.resultKind ===
                ExplorationResultKind.SYSTEM
                ? 8
                : 14
              : 2;

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
    }

    it(
      'should prepare the active-galaxy exploration context without progression side effects',
      async () => {
        const calls:
          unknown[] =
          [];

        const facade =
          configure(
            successfulRuntime(
              calls,
            ),
          );

        await facade.refresh();

        expect(
          facade.state().kind,
        ).toBe(
          'content',
        );

        expect(
          facade.selectedSector()?.sectorX,
        ).toBe(0);

        expect(
          facade.progressResult(),
        ).toBeNull();

        expect(
          facade.externalSearchStatus()
            ?.nextSearchProfile
            .effectiveProbabilityPerNextSearch,
        ).toBe(
          0.02,
        );

        expect(
          calls,
        ).toHaveLength(0);
      },
    );

    it(
      'should resolve 9.4 first and then expose the committed 9.5 reward/progress',
      async () => {
        const calls:
          unknown[] =
          [];

        const facade =
          configure(
            successfulRuntime(
              calls,
            ),
          );

        await facade.refresh();
        await facade.scanSector(
          '0',
          '0',
        );

        expect(
          facade.scanResult(),
        ).not.toBeNull();

        expect(
          facade.explorationResult(),
        ).not.toBeNull();

        expect(
          calls,
        ).toHaveLength(1);

        expect(
          facade.progressResult()
            ?.awardedDiscoveryPoints,
        ).toBeGreaterThan(0);

        expect(
          facade.progressErrorMessage(),
        ).toBe('');
      },
    );

    it(
      'should expose a transient reward without a result DiscoveryState',
      async () => {
        const facade =
          configure(
            successfulRuntime(),
          );

        await facade.refresh();
        await facade.scanSector(
          '86',
          '86',
        );

        expect(
          facade.explorationResult()
            ?.targetLocator,
        ).toBeNull();

        expect(
          facade.progressResult()
            ?.awardedDiscoveryPoints,
        ).toBe(2);

        expect(
          facade.progressResult()
            ?.resultState,
        ).toBeNull();
      },
    );

    it(
      'should preserve the resolved result and expose a persistence error if 9.5 commit fails',
      async () => {
        const facade =
          configure({
            async commitResolvedResult() {
              throw new Error(
                'synthetic persistence failure',
              );
            },
          });

        await facade.refresh();
        await facade.scanSector(
          '0',
          '0',
        );

        expect(
          facade.explorationResult(),
        ).not.toBeNull();

        expect(
          facade.progressResult(),
        ).toBeNull();

        expect(
          facade.progressErrorMessage(),
        ).toContain(
          'synthetic persistence failure',
        );
      },
    );

    it(
      'should reject invalid coordinates before invoking progression runtime',
      async () => {
        const calls:
          unknown[] =
          [];

        const facade =
          configure(
            successfulRuntime(
              calls,
            ),
          );

        await facade.refresh();
        await facade.scanSector(
          '87',
          '0',
        );

        expect(
          facade.scanErrorMessage(),
        ).toContain(
          'Rango permitido',
        );

        expect(
          calls,
        ).toHaveLength(0);
      },
    );

    it(
      'should expose Empty when the active universe is not persisted',
      async () => {
        const facade =
          configure(
            successfulRuntime(),
            repositories(false),
          );

        await facade.refresh();

        expect(
          facade.state(),
        ).toEqual({
          kind:
            'empty',
        });
      },
    );

    it(
      'should persistently advance the anti-blocking status after a failed external search',
      async () => {
        let failures =
          0n;

        const externalRuntime:
          ExternalGalaxySearchRuntime =
          {
            async getStatus() {
              return externalStatus(
                0n,
                failures,
              );
            },

            async search() {
              const used =
                ExternalGalaxySearchPityEngine
                  .evaluateNextSearchProbability(
                    generationKey,
                    0n,
                    failures,
                  );

              const before =
                failures;

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

        const facade =
          configure(
            successfulRuntime(),
            repositories(),
            externalRuntime,
          );

        await facade.refresh();
        await facade
          .searchExternalGalaxy();

        expect(
          facade.externalSearchResult()
            ?.detected,
        ).toBe(
          false,
        );

        expect(
          facade.externalSearchStatus()
            ?.consecutiveFailedSearches,
        ).toBe(
          1n,
        );

        expect(
          facade.externalSearchStatus()
            ?.nextSearchProfile
            .effectiveProbabilityPerNextSearch,
        ).toBeCloseTo(
          0.118,
          12,
        );
      },
    );

    it(
      'should expose safe preliminary information and require an explicit 7.7 choice after detection',
      async () => {
        const detectedGalaxyIndex =
          1n;

        const used =
          ExternalGalaxySearchPityEngine
            .evaluateNextSearchProbability(
              generationKey,
              0n,
              9n,
            );

        const preliminaryInformation =
          ExternalGalaxyPreliminaryInformationGenerator
            .generate(
              generationKey,
              detectedGalaxyIndex,
              DiscoveryState.DETECTED,
            );

        const focusOffer =
          ExternalGalaxyFocusEngine
            .buildFocusOffer(
              generationKey,
              0n,
              detectedGalaxyIndex,
              DiscoveryState.DETECTED,
            );

        let searched =
          false;

        const externalRuntime:
          ExternalGalaxySearchRuntime =
          {
            async getStatus() {
              return searched
                ? externalStatus(
                    40n,
                    0n,
                    1n,
                  )
                : externalStatus();
            },

            async search() {
              searched =
                true;

              return {
                detected:
                  true,

                probabilityProfileUsed:
                  used,

                consecutiveFailedSearchesBefore:
                  9n,

                consecutiveFailedSearchesAfter:
                  0n,

                globalDiscoveryPointsBefore:
                  0n,

                globalDiscoveryPointsAfter:
                  40n,

                awardedDiscoveryPoints:
                  40,

                detectedGalaxyIndex,
                preliminaryInformation,
                focusOffer,

                nextSearchProfile:
                  ExternalGalaxySearchPityEngine
                    .evaluateNextSearchProbability(
                      generationKey,
                      40n,
                      0n,
                    ),
              };
            },
          };

        const facade =
          configure(
            successfulRuntime(),
            repositories(),
            externalRuntime,
          );

        await facade.refresh();
        await facade
          .searchExternalGalaxy();

        expect(
          facade
            .externalFocusChoiceRequired(),
        ).toBe(
          true,
        );

        expect(
          facade.externalSearchResult()
            ?.preliminaryInformation
            ?.galaxyIndex,
        ).toBe(
          detectedGalaxyIndex,
        );

        expect(
          facade.externalSearchResult()
            ?.awardedDiscoveryPoints,
        ).toBe(
          40,
        );

        facade
          .remainOnCurrentGalaxy();

        expect(
          facade.externalFocusDecision(),
        ).toBe(
          ExternalGalaxyFocusChoice
            .REMAIN_CURRENT,
        );

        expect(
          facade
            .externalFocusChoiceRequired(),
        ).toBe(
          false,
        );

        expect(
          facade.externalFocusMessage(),
        ).toContain(
          'Galaxias descubiertas',
        );
      },
    );

    it(
      'should not convert an external search into a sector scan',
      async () => {
        const sectorCalls:
          unknown[] =
          [];

        const facade =
          configure(
            successfulRuntime(
              sectorCalls,
            ),
          );

        await facade.refresh();
        await facade
          .searchExternalGalaxy();

        expect(
          sectorCalls,
        ).toHaveLength(
          0,
        );

        expect(
          facade.scanResult(),
        ).toBeNull();

        expect(
          facade.explorationResult(),
        ).toBeNull();
      },
    );
  },
);
