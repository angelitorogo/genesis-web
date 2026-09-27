import Dexie from 'dexie';

import {
  vi,
} from 'vitest';

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

    function resolveForGalaxy(
      galaxyIndex:
        bigint,

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
                  galaxyIndex,
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
          2 +
          result.locatedTargets.reduce(
            (total, target) =>
              total +
              (
                target.kind ===
                  ExplorationResultKind.SYSTEM
                  ? 6
                  : 12
              ),
            0,
          );

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
        ).toBe(
          3n +
          BigInt(
            result.locatedTargetCount,
          ),
        );
      },
    );

    it(
      'should preserve exact absolute galaxy progress while deriving the post-write value by delta',
      async () => {
        const result =
          resolveStatic();

        let otherResult =
          null as ReturnType<typeof resolve> | null;

        for (
          let x = -12;
          x <= 12 && otherResult === null;
          x += 1
        ) {
          for (
            let y = -12;
            y <= 12 && otherResult === null;
            y += 1
          ) {
            const candidate =
              resolve(
                x,
                y,
              );

            if (
              candidate.targetLocator !==
                null &&
              candidate
                .scanResult
                .selection
                .sectorLocator
                .sectorKey !==
              result
                .scanResult
                .selection
                .sectorLocator
                .sectorKey
            ) {
              otherResult =
                candidate;
            }
          }
        }

        if (
          otherResult?.targetLocator ===
          null ||
          otherResult ===
          null
        ) {
          throw new Error(
            'Frozen sample must contain a second static sector.',
          );
        }

        await discoveryRepository
          .setState(
            generationKey,
            otherResult.targetLocator,
            DiscoveryState.DISCOVERED,
          );

        const progress =
          await runtime
            .commitResolvedResult(
              result,
            );

        expect(
          progress.galaxyProgressUnitsBefore,
        ).toBe(
          4n,
        );

        expect(
          progress.galaxyProgressUnitsAfter,
        ).toBe(
          5n +
          BigInt(
            result.locatedTargetCount,
          ),
        );
      },
    );

    it(
      'should avoid whole-universe discovery snapshots and read the affected sector once',
      async () => {
        const result =
          resolveStatic();

        const globalSnapshotSpy =
          vi.spyOn(
            discoveryRepository,
            'getKnownDiscoveries',
          );

        const sectorSnapshotSpy =
          vi.spyOn(
            discoveryRepository,
            'getKnownDiscoveriesInSector',
          );

        const stateSpy =
          vi.spyOn(
            discoveryRepository,
            'getState',
          );

        await runtime
          .commitResolvedResult(
            result,
          );

        expect(
          globalSnapshotSpy,
        ).not.toHaveBeenCalled();

        expect(
          sectorSnapshotSpy,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          stateSpy,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          sectorSnapshotSpy,
        ).toHaveBeenCalledWith(
          generationKey,
          0n,
          result
            .scanResult
            .selection
            .coordinates,
        );
      },
    );

    it(
      'should persist every static object present in a multi-object sector at DETECTED',
      async () => {
        let result =
          null as ReturnType<typeof resolve> | null;

        for (
          let x = -16;
          x <= 16 && result === null;
          x += 1
        ) {
          for (
            let y = -16;
            y <= 16 && result === null;
            y += 1
          ) {
            const candidate =
              resolve(
                x,
                y,
              );

            if (
              candidate.locatedTargetCount >=
              3
            ) {
              result =
                candidate;
            }
          }
        }

        if (
          result ===
          null
        ) {
          throw new Error(
            'Frozen sample must contain a sector with at least three static Ground Truth targets.',
          );
        }

        await runtime
          .commitResolvedResult(
            result,
          );

        for (
          const target
          of result.locatedTargets
        ) {
          expect(
            await discoveryRepository
              .getState(
                generationKey,
                target.locator,
              ),
          ).toBe(
            DiscoveryState.DETECTED,
          );
        }

        const repeated =
          await runtime
            .commitResolvedResult(
              result,
            );

        expect(
          repeated.awardedDiscoveryPoints,
        ).toBe(
          0,
        );
      },
      30_000,
    );

    it(
      'should commit a sector block through one bulk read and one bulk write without per-sector snapshots',
      async () => {
        const results = [
          resolve(0, 1),
          resolve(1, 0),
          resolve(1, 1),
        ];

        const globalSnapshotSpy = vi.spyOn(
          discoveryRepository,
          'getKnownDiscoveries',
        );
        const sectorSnapshotSpy = vi.spyOn(
          discoveryRepository,
          'getKnownDiscoveriesInSector',
        );
        const bulkGetSpy = vi.spyOn(
          database.discoveries,
          'bulkGet',
        );
        const bulkPutSpy = vi.spyOn(
          database.discoveries,
          'bulkPut',
        );

        const progress = await runtime.commitResolvedResults(results);

        expect(progress.processedSectors).toBe(3);
        expect(progress.awardedDiscoveryPoints).toBeGreaterThan(0);
        expect(globalSnapshotSpy).not.toHaveBeenCalled();
        expect(sectorSnapshotSpy).not.toHaveBeenCalled();
        expect(bulkGetSpy).toHaveBeenCalledTimes(1);
        expect(bulkPutSpy).toHaveBeenCalledTimes(1);

        for (const result of results) {
          expect(
            await discoveryRepository.getState(
              generationKey,
              result.scanResult.selection.sectorLocator,
            ),
          ).toBe(DiscoveryState.DETECTED);

          for (const target of result.locatedTargets) {
            expect(
              await discoveryRepository.getState(
                generationKey,
                target.locator,
              ),
            ).toBe(DiscoveryState.DETECTED);
          }
        }
      },
      30_000,
    );

    it(
      'should make repeated block commits idempotent',
      async () => {
        const results = [
          resolve(0, 1),
          resolve(1, 0),
          resolve(1, 1),
        ];

        const first = await runtime.commitResolvedResults(results);
        const second = await runtime.commitResolvedResults(results);

        expect(first.awardedDiscoveryPoints).toBeGreaterThan(0);
        expect(second.awardedDiscoveryPoints).toBe(0);
        expect(second.globalDiscoveryPointsBefore).toBe(
          first.globalDiscoveryPointsAfter,
        );
        expect(second.globalDiscoveryPointsAfter).toBe(
          first.globalDiscoveryPointsAfter,
        );
        expect(second.galaxyProgressUnitsBefore).toBe(
          first.galaxyProgressUnitsAfter,
        );
        expect(second.galaxyProgressUnitsAfter).toBe(
          first.galaxyProgressUnitsAfter,
        );
      },
      30_000,
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

    it.each([
      DiscoveryState.VISITED,
      DiscoveryState.CATALOGUED,
    ])(
      'should reject external sector persistence atomically while the galaxy is %s',
      async (
        state,
      ) => {
        const galaxyIndex =
          7n;

        await discoveryRepository
          .setState(
            generationKey,
            new GalaxyLocator(
              galaxyIndex,
            ),
            state,
          );

        const result =
          resolveForGalaxy(
            galaxyIndex,
            0,
            0,
          );

        await expect(
          runtime
            .commitResolvedResult(
              result,
            ),
        ).rejects.toThrow(
          'Confirmada',
        );

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              result.scanResult.selection.sectorLocator,
            ),
        ).toBe(
          DiscoveryState.UNKNOWN,
        );

        expect(
          await pointsRepository
            .getGlobalDiscoveryPoints(
              generationKey,
            ),
        ).toBe(
          0n,
        );
      },
    );

    it(
      'should allow sector persistence after an external galaxy is confirmed',
      async () => {
        const galaxyIndex =
          7n;

        await discoveryRepository
          .setState(
            generationKey,
            new GalaxyLocator(
              galaxyIndex,
            ),
            DiscoveryState.CONFIRMED,
          );

        const result =
          resolveForGalaxy(
            galaxyIndex,
            0,
            0,
          );

        const progress =
          await runtime
            .commitResolvedResult(
              result,
            );

        expect(progress.sectorState).toBe(
          DiscoveryState.DETECTED,
        );
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

        for (
          const target
          of result.locatedTargets
        ) {
          await discoveryRepository
            .setState(
              generationKey,
              target.locator,
              DiscoveryState.DISCOVERED,
            );
        }

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

        for (
          const target
          of result.locatedTargets
        ) {
          expect(
            await discoveryRepository
              .getState(
                generationKey,
                target.locator,
              ),
          ).toBe(
            DiscoveryState.UNKNOWN,
          );
        }
      },
    );
  },
);
