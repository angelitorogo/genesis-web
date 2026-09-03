import Dexie from 'dexie';

import {
  IDBKeyRange,
  indexedDB,
} from 'fake-indexeddb';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  GalaxyLocator,
  type ProceduralLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type DiscoveryPointsRepository,
} from '../../domain/repository/genesis-repositories';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GenesisIndexedDb,
} from '../../data/local/indexed-db/genesis-indexed-db';

import {
  DexieDiscoveryPointsRepository,
} from '../../data/local/repository/dexie-discovery-points.repository';

import {
  DexieDiscoveryRepository,
  type ProceduralTargetSeedResolver,
} from '../../data/local/repository/dexie-discovery.repository';

import {
  DexieExternalGalaxySearchStateRepository,
} from '../../data/local/repository/dexie-external-galaxy-search-state.repository';

import {
  DexieUniverseRepository,
} from '../../data/local/repository/dexie-universe.repository';

import {
  GalaxyScientificStateTransitionAction,
} from '../../simulation/exploration/galaxy-scientific-state-transition-engine';

import {
  ProceduralTargetResolver,
} from '../../simulation/regeneration/procedural-target-resolver';

import {
  DexieGalaxyScientificKnowledgeRuntime,
} from './galaxy-scientific-knowledge.runtime';

describe(
  'DexieGalaxyScientificKnowledgeRuntime point 26.1',
  () => {
    const databaseName =
      'genesis-web-point-26-1-galaxy-scientific-pd-runtime';

    const dependencies =
      Object.freeze({
        indexedDB,
        IDBKeyRange,
      });

    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',
        ),
        GeneratorVersion.V1,
      );

    const targetSeedResolver:
      ProceduralTargetSeedResolver =
      Object.freeze({
        resolveTargetSeedNormalized(
          key:
            UniverseGenerationKey,
          locator:
            ProceduralLocator,
        ): string {

          return ProceduralTargetResolver
            .resolveTargetSeed(
              key,
              locator,
            )
            .normalizedValue;
        },
      });

    let database:
      GenesisIndexedDb;

    let universeRepository:
      DexieUniverseRepository;

    let discoveryRepository:
      DexieDiscoveryRepository;

    let pointsRepository:
      DexieDiscoveryPointsRepository;

    let searchStateRepository:
      DexieExternalGalaxySearchStateRepository;

    let runtime:
      DexieGalaxyScientificKnowledgeRuntime;

    beforeEach(
      async () => {
        database =
          new GenesisIndexedDb(
            databaseName,
            dependencies,
          );

        universeRepository =
          new DexieUniverseRepository(
            database,
            () => 1000,
          );

        discoveryRepository =
          new DexieDiscoveryRepository(
            database,
            targetSeedResolver,
            () => 1000,
          );

        pointsRepository =
          new DexieDiscoveryPointsRepository(
            database,
            () => 1000,
          );

        searchStateRepository =
          new DexieExternalGalaxySearchStateRepository(
            database,
            () => 1000,
          );

        runtime =
          new DexieGalaxyScientificKnowledgeRuntime(
            database,
            pointsRepository,
            discoveryRepository,
            searchStateRepository,
          );

        await universeRepository
          .createIfAbsent(
            generationKey,
          );
      },
    );

    afterEach(
      async () => {
        database
          .closeDatabase();

        const cleanup =
          new Dexie(
            databaseName,
            dependencies,
          );

        await cleanup
          .delete();
      },
    );

    async function seed(
      state:
        ReturnType<
          typeof DiscoveryState.fromCode
        >,

      globalDiscoveryPoints:
        bigint,
    ): Promise<void> {

      await discoveryRepository
        .setState(
          generationKey,
          new GalaxyLocator(
            0n,
          ),
          state,
        );

      await pointsRepository
        .setGlobalDiscoveryPoints(
          generationKey,
          globalDiscoveryPoints,
        );
    }

    it(
      'should atomically spend 250 global PD for VISITED to CATALOGUED',
      async () => {
        await seed(
          DiscoveryState.VISITED,
          1000n,
        );

        const result =
          await runtime
            .commit(
              generationKey,
              0n,
              GalaxyScientificStateTransitionAction.CATALOGUE,
            );

        expect(
          result.discoveryPointCost,
        ).toBe(
          250n,
        );

        expect(
          result.globalDiscoveryPointsBefore,
        ).toBe(
          1000n,
        );

        expect(
          result.globalDiscoveryPointsAfter,
        ).toBe(
          750n,
        );

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              new GalaxyLocator(
                0n,
              ),
            ),
        ).toBe(
          DiscoveryState.CATALOGUED,
        );

        expect(
          await pointsRepository
            .getGlobalDiscoveryPoints(
              generationKey,
            ),
        ).toBe(
          750n,
        );

        expect(
          (
            await searchStateRepository
              .getState(
                generationKey,
              )
          )
            .earnedSearchOpportunitiesHighWatermark,
        ).toBe(
          10n,
        );
      },
    );

    it(
      'should atomically spend 500 global PD for CATALOGUED to CONFIRMED',
      async () => {
        await seed(
          DiscoveryState.CATALOGUED,
          750n,
        );

        const result =
          await runtime
            .commit(
              generationKey,
              0n,
              GalaxyScientificStateTransitionAction.CONFIRM,
            );

        expect(
          result.globalDiscoveryPointsAfter,
        ).toBe(
          250n,
        );

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              new GalaxyLocator(
                0n,
              ),
            ),
        ).toBe(
          DiscoveryState.CONFIRMED,
        );
      },
    );

    it(
      'should preserve a higher external-search opportunity high-water mark while spending PD',
      async () => {
        await seed(
          DiscoveryState.VISITED,
          650n,
        );

        await searchStateRepository
          .setState(
            generationKey,
            {
              consecutiveFailedSearches:
                0n,
              consumedSearchOpportunities:
                4n,
              lastAnnouncedEarnedSearchOpportunities:
                6n,
              earnedSearchOpportunitiesHighWatermark:
                8n,
            },
          );

        await runtime
          .commit(
            generationKey,
            0n,
            GalaxyScientificStateTransitionAction.CATALOGUE,
          );

        expect(
          await pointsRepository
            .getGlobalDiscoveryPoints(
              generationKey,
            ),
        ).toBe(
          400n,
        );

        expect(
          (
            await searchStateRepository
              .getState(
                generationKey,
              )
          )
            .earnedSearchOpportunitiesHighWatermark,
        ).toBe(
          8n,
        );
      },
    );

    it(
      'should reject insufficient global PD without changing state or balance',
      async () => {
        await seed(
          DiscoveryState.VISITED,
          249n,
        );

        await expect(
          runtime
            .commit(
              generationKey,
              0n,
              GalaxyScientificStateTransitionAction.CATALOGUE,
            ),
        ).rejects.toThrow(
          '249/250 PD',
        );

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              new GalaxyLocator(
                0n,
              ),
            ),
        ).toBe(
          DiscoveryState.VISITED,
        );

        expect(
          await pointsRepository
            .getGlobalDiscoveryPoints(
              generationKey,
            ),
        ).toBe(
          249n,
        );
      },
    );

    it(
      'should re-read persisted state so a repeated action cannot charge PD twice',
      async () => {
        await seed(
          DiscoveryState.VISITED,
          1000n,
        );

        await runtime
          .commit(
            generationKey,
            0n,
            GalaxyScientificStateTransitionAction.CATALOGUE,
          );

        await expect(
          runtime
            .commit(
              generationKey,
              0n,
              GalaxyScientificStateTransitionAction.CATALOGUE,
            ),
        ).rejects.toThrow(
          RangeError,
        );

        expect(
          await pointsRepository
            .getGlobalDiscoveryPoints(
              generationKey,
            ),
        ).toBe(
          750n,
        );
      },
    );

    it(
      'should roll back the state write when the PD write fails inside the transaction',
      async () => {
        await seed(
          DiscoveryState.VISITED,
          1000n,
        );

        const failingPointsRepository:
          DiscoveryPointsRepository =
          {
            getGlobalDiscoveryPoints:
              pointsRepository
                .getGlobalDiscoveryPoints
                .bind(
                  pointsRepository,
                ),

            async setGlobalDiscoveryPoints() {
              throw new Error(
                'synthetic PD write failure',
              );
            },

            getGalaxyDiscoveryPoints:
              pointsRepository
                .getGalaxyDiscoveryPoints
                .bind(
                  pointsRepository,
                ),

            setGalaxyDiscoveryPoints:
              pointsRepository
                .setGalaxyDiscoveryPoints
                .bind(
                  pointsRepository,
                ),
          };

        const failingRuntime =
          new DexieGalaxyScientificKnowledgeRuntime(
            database,
            failingPointsRepository,
            discoveryRepository,
            searchStateRepository,
          );

        await expect(
          failingRuntime
            .commit(
              generationKey,
              0n,
              GalaxyScientificStateTransitionAction.CATALOGUE,
            ),
        ).rejects.toThrow(
          'synthetic PD write failure',
        );

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              new GalaxyLocator(
                0n,
              ),
            ),
        ).toBe(
          DiscoveryState.VISITED,
        );

        expect(
          await pointsRepository
            .getGlobalDiscoveryPoints(
              generationKey,
            ),
        ).toBe(
          1000n,
        );
      },
    );
  },
);
