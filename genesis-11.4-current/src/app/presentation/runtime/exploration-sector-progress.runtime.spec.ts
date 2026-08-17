import Dexie from 'dexie';

import {
  IDBKeyRange,
  indexedDB,
} from 'fake-indexeddb';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

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
  DexieUniverseRepository,
} from '../../data/local/repository/dexie-universe.repository';

import {
  ExplorationSectorResultEngine,
} from '../../simulation/exploration/exploration-sector-result-engine';

import {
  ExplorationSectorScanEngine,
} from '../../simulation/exploration/exploration-sector-scan-engine';

import {
  ProceduralTargetResolver,
} from '../../simulation/regeneration/procedural-target-resolver';

import {
  DexieExplorationSectorProgressRuntime,
} from './exploration-sector-progress.runtime';

describe(
  'DexieExplorationSectorProgressRuntime',
  () => {
    const databaseName =
      'genesis-web-point-9-5-runtime-tests';

    const dependencies =
      Object.freeze({
        indexedDB,
        IDBKeyRange,
      });

    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const targetSeedResolver:
      ProceduralTargetSeedResolver =
      {
        resolveTargetSeedNormalized(
          key,
          locator,
        ): string {
          return ProceduralTargetResolver
            .resolveTargetSeed(
              key,
              locator,
            )
            .normalizedValue;
        },
      };

    let database:
      GenesisIndexedDb;

    let universeRepository:
      DexieUniverseRepository;

    let pointsRepository:
      DexieDiscoveryPointsRepository;

    let discoveryRepository:
      DexieDiscoveryRepository;

    let runtime:
      DexieExplorationSectorProgressRuntime;

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

        pointsRepository =
          new DexieDiscoveryPointsRepository(
            database,
            () => 1000,
          );

        discoveryRepository =
          new DexieDiscoveryRepository(
            database,
            targetSeedResolver,
            () => 1000,
          );

        runtime =
          new DexieExplorationSectorProgressRuntime(
            database,
            pointsRepository,
            discoveryRepository,
          );

        await universeRepository
          .createIfAbsent(
            generationKey,
          );

        await pointsRepository
          .setGlobalDiscoveryPoints(
            generationKey,
            0n,
          );

        await discoveryRepository
          .setState(
            generationKey,
            new GalaxyLocator(0n),
            DiscoveryState.DISCOVERED,
          );
      },
    );

    afterEach(
      async () => {
        database.closeDatabase();

        const cleanup =
          new Dexie(
            databaseName,
            dependencies,
          );

        await cleanup.delete();
      },
    );

    function resolve(
      x:
        number,

      y:
        number,
    ) {
      return ExplorationSectorResultEngine
        .resolve(
          ExplorationSectorScanEngine
            .scan(
              ExplorationSectorScanEngine
                .prepareSector(
                  generationKey,
                  0n,
                  x,
                  y,
                ),
            ),
        );
    }



    function resolveStatic() {
      for (
        let x =
          -12;
        x <=
          12;
        x +=
          1
      ) {
        for (
          let y =
            -12;
          y <=
            12;
          y +=
            1
        ) {
          const result =
            resolve(
              x,
              y,
            );

          if (
            result.targetLocator !==
            null
          ) {
            return result;
          }
        }
      }

      throw new Error(
        'Frozen point-9.4 central sample must contain at least one static result.',
      );
    }

    it(
      'should persist sector plus static result at DETECTED and award only frozen 7.x base PD',
      async () => {
        const result =
          resolveStatic();

        const progress =
          await runtime
            .commitResolvedResult(
              result,
            );

        const expected =
          result.resultKind ===
          ExplorationResultKind.SYSTEM
            ? 8
            : 14;

        expect(
          progress.awardedDiscoveryPoints,
        ).toBe(expected);

        expect(
          progress.sectorState,
        ).toBe(
          DiscoveryState.DETECTED,
        );

        expect(
          progress.resultState,
        ).toBe(
          DiscoveryState.DETECTED,
        );

        expect(
          await pointsRepository
            .getGlobalDiscoveryPoints(
              generationKey,
            ),
        ).toBe(
          BigInt(expected),
        );

        expect(
          progress.galaxyProgressUnitsBefore,
        ).toBe(2n);

        expect(
          progress.galaxyProgressUnitsAfter,
        ).toBe(4n);
      },
    );

    it(
      'should make repeated scans idempotent',
      async () => {
        const result =
          resolveStatic();

        const first =
          await runtime
            .commitResolvedResult(
              result,
            );

        const second =
          await runtime
            .commitResolvedResult(
              result,
            );

        expect(
          second.awardedDiscoveryPoints,
        ).toBe(0);

        expect(
          second.globalDiscoveryPointsBefore,
        ).toBe(
          first.globalDiscoveryPointsAfter,
        );

        expect(
          second.globalDiscoveryPointsAfter,
        ).toBe(
          first.globalDiscoveryPointsAfter,
        );

        expect(
          second.galaxyProgressDelta,
        ).toBe(0n);
      },
    );

    it(
      'should reward only the sector for a transient event and never invent a transient discovery row',
      async () => {
        const result =
          resolve(86, 86);

        expect(
          result.targetLocator,
        ).toBeNull();

        const beforeCount =
          await database
            .discoveries
            .count();

        const progress =
          await runtime
            .commitResolvedResult(
              result,
            );

        const afterCount =
          await database
            .discoveries
            .count();

        expect(
          progress.awardedDiscoveryPoints,
        ).toBe(2);

        expect(
          progress.resultState,
        ).toBeNull();

        expect(
          afterCount -
          beforeCount,
        ).toBe(1);
      },
    );

    it(
      'should never regress an already more advanced static result',
      async () => {
        const result =
          resolveStatic();

        if (
          result.targetLocator ===
          null
        ) {
          throw new Error(
            'Frozen central sample must resolve a static result.',
          );
        }

        await discoveryRepository
          .setState(
            generationKey,
            result.targetLocator,
            DiscoveryState.DISCOVERED,
          );

        const progress =
          await runtime
            .commitResolvedResult(
              result,
            );

        expect(
          progress.awardedDiscoveryPoints,
        ).toBe(2);

        expect(
          progress.resultState,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );
      },
    );

    it(
      'should roll back discovery writes if the global PD write fails',
      async () => {
        const result =
          resolveStatic();

        const failingPoints =
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
          new DexieExplorationSectorProgressRuntime(
            database,
            failingPoints,
            discoveryRepository,
          );

        await expect(
          failingRuntime
            .commitResolvedResult(
              result,
            ),
        ).rejects.toThrow(
          'synthetic PD write failure',
        );

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              result
                .scanResult
                .selection
                .sectorLocator,
            ),
        ).toBe(
          DiscoveryState.UNKNOWN,
        );

        if (
          result.targetLocator !==
          null
        ) {
          expect(
            await discoveryRepository
              .getState(
                generationKey,
                result.targetLocator,
              ),
          ).toBe(
            DiscoveryState.UNKNOWN,
          );
        }
      },
    );
  },
);
