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
  'ExplorationFacade point 9.5',
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

    function configure(
      runtime:
        ExplorationSectorProgressRuntime,

      bundle =
        repositories(),
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
  },
);
