import Dexie from 'dexie';

import {
  IDBKeyRange,
  indexedDB,
} from 'fake-indexeddb';

import {
  KnownDiscovery,
} from '../../../domain/discovery/known-discovery';

import {
  DiscoveryState,
} from '../../../domain/discovery/discovery-state';

import {
  DiscoveryTargetType,
} from '../../../domain/discovery/discovery-target-type';

import {
  BodyLocator,
  CivilizationLocator,
  GalacticObjectLocator,
  GalaxyLocator,
  type ProceduralLocator,
  SectorLocator,
  SystemLocator,
} from '../../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../../domain/generation/universe-generation-key';

import {
  UniverseNotFoundError,
} from '../../../domain/repository/genesis-repositories';

import {
  UniverseSeed,
} from '../../../domain/universe/universe-seed';

import {
  GenesisIndexedDb,
} from '../indexed-db/genesis-indexed-db';

import {
  DexieDiscoveryPointsRepository,
} from './dexie-discovery-points.repository';

import {
  DexieDiscoveryRepository,
  type ProceduralTargetSeedResolver,
} from './dexie-discovery.repository';

import {
  DexieUniverseNavigationRepository,
} from './dexie-universe-navigation.repository';

import {
  DexieUniverseRepository,
} from './dexie-universe.repository';

import {
  CorruptLocalDataError,
} from './local-repository-support';

describe(
  'GENESIS local repositories',
  () => {
    const databaseName =
      'genesis-web-repositories-tests';

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

    const secondGenerationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
        ),
        GeneratorVersion.V1,
      );

    let database:
      GenesisIndexedDb;

    let universeRepository:
      DexieUniverseRepository;

    let navigationRepository:
      DexieUniverseNavigationRepository;

    let pointsRepository:
      DexieDiscoveryPointsRepository;

    let discoveryRepository:
      DexieDiscoveryRepository;

    let now:
      number;

    const targetSeedResolver:
      ProceduralTargetSeedResolver =
      {
        resolveTargetSeedNormalized(
          _generationKey,
          locator,
        ): string {

          const targetType =
            DiscoveryTargetType
              .fromLocator(
                locator,
              );

          let accumulator =
            BigInt(
              targetType.code,
            );

          const mix =
            (
              value:
                bigint,
            ): void => {

              accumulator =
                BigInt.asUintN(
                  128,
                  (
                    accumulator *
                    0x100000001B3n
                  ) ^
                    BigInt.asUintN(
                      64,
                      value,
                    ),
                );
            };

          mix(
            locator.galaxyIndex,
          );

          if (
            'sectorKey' in
            locator
          ) {
            mix(
              locator.sectorKey,
            );
          }

          if (
            'galacticObjectIndex' in
            locator
          ) {
            mix(
              locator
                .galacticObjectIndex,
            );
          }

          if (
            'bodyIndex' in
            locator
          ) {
            mix(
              locator.bodyIndex,
            );
          }

          if (
            'civilizationIndex' in
            locator
          ) {
            mix(
              locator
                .civilizationIndex,
            );
          }

          return accumulator
            .toString(
              16,
            )
            .padStart(
              32,
              '0',
            )
            .slice(
              -32,
            )
            .toUpperCase();
        },
      };

    function createRepositories():
      void {

      universeRepository =
        new DexieUniverseRepository(
          database,
          () =>
            now++,
        );

      navigationRepository =
        new DexieUniverseNavigationRepository(
          database,
          () =>
            now++,
        );

      pointsRepository =
        new DexieDiscoveryPointsRepository(
          database,
          () =>
            now++,
        );

      discoveryRepository =
        new DexieDiscoveryRepository(
          database,
          targetSeedResolver,
          () =>
            now++,
        );
    }

    beforeEach(
      () => {
        now =
          1000;

        database =
          new GenesisIndexedDb(
            databaseName,
            dependencies,
          );

        createRepositories();
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

    it(
      'should create, query and list universes without duplicates',
      async () => {
        expect(
          await universeRepository
            .createIfAbsent(
              generationKey,
            ),
        ).toBe(true);

        expect(
          await universeRepository
            .createIfAbsent(
              generationKey,
            ),
        ).toBe(false);

        expect(
          await universeRepository
            .createIfAbsent(
              secondGenerationKey,
            ),
        ).toBe(true);

        expect(
          await universeRepository
            .exists(
              generationKey,
            ),
        ).toBe(true);

        const all =
          await universeRepository
            .getAll();

        expect(
          all.map(
            (
              key,
            ) =>
              key
                .universeSeed
                .serialize(),
          ),
        ).toEqual([
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
        ]);
      },
    );

    it(
      'should reject repository access for an unknown universe',
      async () => {
        await expect(
          navigationRepository
            .getNavigation(
              generationKey,
            ),
        ).rejects.toBeInstanceOf(
          UniverseNotFoundError,
        );

        await expect(
          pointsRepository
            .getGlobalDiscoveryPoints(
              generationKey,
            ),
        ).rejects.toBeInstanceOf(
          UniverseNotFoundError,
        );

        await expect(
          discoveryRepository
            .getState(
              generationKey,
              new GalaxyLocator(
                0n,
              ),
            ),
        ).rejects.toBeInstanceOf(
          UniverseNotFoundError,
        );
      },
    );

    it(
      'should persist navigation with exact 64-bit indices',
      async () => {
        await universeRepository
          .createIfAbsent(
            generationKey,
          );

        expect(
          await navigationRepository
            .getNavigation(
              generationKey,
            ),
        ).toEqual({
          activeGalaxyIndex:
            0n,

          recentGalaxyIndices:
            [],
        });

        const longMax =
          (1n << 63n) - 1n;

        await navigationRepository
          .setNavigation(
            generationKey,
            {
              activeGalaxyIndex:
                longMax,

              recentGalaxyIndices:
                [
                  7n,
                  longMax,
                ],
            },
          );

        expect(
          await navigationRepository
            .getNavigation(
              generationKey,
            ),
        ).toEqual({
          activeGalaxyIndex:
            longMax,

          recentGalaxyIndices:
            [
              7n,
              longMax,
            ],
        });
      },
    );

    it(
      'should keep global and galaxy discovery points independent',
      async () => {
        await universeRepository
          .createIfAbsent(
            generationKey,
          );

        expect(
          await pointsRepository
            .getGlobalDiscoveryPoints(
              generationKey,
            ),
        ).toBe(0n);

        expect(
          await pointsRepository
            .getGalaxyDiscoveryPoints(
              generationKey,
              7n,
            ),
        ).toBe(0n);

        await pointsRepository
          .setGlobalDiscoveryPoints(
            generationKey,
            500n,
          );

        await pointsRepository
          .setGalaxyDiscoveryPoints(
            generationKey,
            7n,
            125n,
          );

        expect(
          await pointsRepository
            .getGlobalDiscoveryPoints(
              generationKey,
            ),
        ).toBe(500n);

        expect(
          await pointsRepository
            .getGalaxyDiscoveryPoints(
              generationKey,
              7n,
            ),
        ).toBe(125n);
      },
    );

    it(
      'should reject invalid discovery point values',
      async () => {
        await universeRepository
          .createIfAbsent(
            generationKey,
          );

        await expect(
          pointsRepository
            .setGlobalDiscoveryPoints(
              generationKey,
              -1n,
            ),
        ).rejects.toBeInstanceOf(
          RangeError,
        );

        await expect(
          pointsRepository
            .setGalaxyDiscoveryPoints(
              generationKey,
              -1n,
              0n,
            ),
        ).rejects.toBeInstanceOf(
          RangeError,
        );

        await expect(
          pointsRepository
            .setGlobalDiscoveryPoints(
              generationKey,
              1n << 63n,
            ),
        ).rejects.toBeInstanceOf(
          RangeError,
        );
      },
    );

    it(
      'should persist known discovery states and delete UNKNOWN',
      async () => {
        await universeRepository
          .createIfAbsent(
            generationKey,
          );

        const locator =
          new SystemLocator(
            0n,
            123456789n,
            7n,
          );

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              locator,
            ),
        ).toBe(
          DiscoveryState.UNKNOWN,
        );

        await discoveryRepository
          .setState(
            generationKey,
            locator,
            DiscoveryState.DETECTED,
          );

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              locator,
            ),
        ).toBe(
          DiscoveryState.DETECTED,
        );

        await discoveryRepository
          .setState(
            generationKey,
            locator,
            DiscoveryState.CONFIRMED,
          );

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              locator,
            ),
        ).toBe(
          DiscoveryState.CONFIRMED,
        );

        await discoveryRepository
          .setState(
            generationKey,
            locator,
            DiscoveryState.UNKNOWN,
          );

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              locator,
            ),
        ).toBe(
          DiscoveryState.UNKNOWN,
        );

        expect(
          await database
            .discoveries
            .count(),
        ).toBe(0);
      },
    );

    it(
      'should list known discoveries as domain models',
      async () => {
        await universeRepository
          .createIfAbsent(
            generationKey,
          );

        const system =
          new SystemLocator(
            0n,
            123456789n,
            7n,
          );

        const body =
          new BodyLocator(
            0n,
            123456789n,
            7n,
            3n,
          );

        await discoveryRepository
          .setState(
            generationKey,
            system,
            DiscoveryState.DETECTED,
          );

        await discoveryRepository
          .setState(
            generationKey,
            body,
            DiscoveryState.CATALOGUED,
          );

        const known =
          await discoveryRepository
            .getKnownDiscoveries(
              generationKey,
            );

        expect(
          known,
        ).toHaveLength(2);

        expect(
          known.every(
            (
              discovery,
            ) =>
              discovery instanceof
              KnownDiscovery,
          ),
        ).toBe(true);

        expect(
          known.map(
            (
              discovery,
            ) =>
              discovery.state.code,
          ),
        ).toEqual([
          1,
          4,
        ]);
      },
    );

    it(
      'should preserve firstKnownAt when a state is updated',
      async () => {
        await universeRepository
          .createIfAbsent(
            generationKey,
          );

        const locator =
          new GalaxyLocator(
            0n,
          );

        await discoveryRepository
          .setState(
            generationKey,
            locator,
            DiscoveryState.DETECTED,
          );

        const first =
          (
            await database
              .discoveries
              .toArray()
          )[0];

        await discoveryRepository
          .setState(
            generationKey,
            locator,
            DiscoveryState.CONFIRMED,
          );

        const updated =
          (
            await database
              .discoveries
              .toArray()
          )[0];

        expect(
          updated
            .firstKnownAtEpochMs,
        ).toBe(
          first
            .firstKnownAtEpochMs,
        );

        expect(
          updated
            .updatedAtEpochMs,
        ).toBeGreaterThan(
          first
            .updatedAtEpochMs,
        );
      },
    );

    it(
      'should survive database close and reopen',
      async () => {
        await universeRepository
          .createIfAbsent(
            generationKey,
          );

        await navigationRepository
          .setNavigation(
            generationKey,
            {
              activeGalaxyIndex:
                5n,

              recentGalaxyIndices:
                [
                  2n,
                  5n,
                ],
            },
          );

        await pointsRepository
          .setGlobalDiscoveryPoints(
            generationKey,
            750n,
          );

        const locator =
          new GalaxyLocator(
            0n,
          );

        await discoveryRepository
          .setState(
            generationKey,
            locator,
            DiscoveryState.DISCOVERED,
          );

        database
          .closeDatabase();

        database =
          new GenesisIndexedDb(
            databaseName,
            dependencies,
          );

        createRepositories();

        expect(
          await navigationRepository
            .getNavigation(
              generationKey,
            ),
        ).toEqual({
          activeGalaxyIndex:
            5n,

          recentGalaxyIndices:
            [
              2n,
              5n,
            ],
        });

        expect(
          await pointsRepository
            .getGlobalDiscoveryPoints(
              generationKey,
            ),
        ).toBe(750n);

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              locator,
            ),
        ).toBe(
          DiscoveryState.DISCOVERED,
        );
      },
    );

    it(
      'should delete a universe and every dependent IndexedDB row atomically',
      async () => {
        await universeRepository
          .createIfAbsent(
            generationKey,
          );

        await navigationRepository
          .setNavigation(
            generationKey,
            {
              activeGalaxyIndex:
                0n,

              recentGalaxyIndices:
                [
                  0n,
                ],
            },
          );

        await pointsRepository
          .setGlobalDiscoveryPoints(
            generationKey,
            100n,
          );

        await discoveryRepository
          .setState(
            generationKey,
            new GalaxyLocator(
              0n,
            ),
            DiscoveryState.DISCOVERED,
          );

        const universeSeed =
          generationKey
            .universeSeed
            .serialize();

        await database
          .galaxies
          .put({
            universeSeed,

            generatorVersionCode:
              1,

            galaxyIndex:
              '0',

            discoveryStateCode:
              2,

            firstKnownAtEpochMs:
              1,

            updatedAtEpochMs:
              1,
          });

        await database
          .observations
          .put({
            id:
              'observation-1',

            universeSeed,

            generatorVersionCode:
              1,

            targetTypeCode:
              1,

            targetSeed:
              '00000000000000000000000000000001',

            observationKind:
              'test',

            payloadVersion:
              1,

            payloadJson:
              '{}',

            observedAtEpochMs:
              1,
          });

        expect(
          await universeRepository
            .delete(
              generationKey,
            ),
        ).toBe(true);

        expect(
          await database
            .universes
            .count(),
        ).toBe(0);

        expect(
          await database
            .navigation
            .count(),
        ).toBe(0);

        expect(
          await database
            .progress
            .count(),
        ).toBe(0);

        expect(
          await database
            .discoveries
            .count(),
        ).toBe(0);

        expect(
          await database
            .galaxies
            .count(),
        ).toBe(0);

        expect(
          await database
            .observations
            .count(),
        ).toBe(0);

        expect(
          await universeRepository
            .delete(
              generationKey,
            ),
        ).toBe(false);
      },
    );

    it(
      'should reject corrupt persisted navigation',
      async () => {
        await universeRepository
          .createIfAbsent(
            generationKey,
          );

        await database
          .navigation
          .put({
            universeSeed:
              generationKey
                .universeSeed
                .serialize(),

            generatorVersionCode:
              1,

            activeGalaxyIndex:
              '-1',

            recentGalaxyIndices:
              [],

            updatedAtEpochMs:
              1,
          });

        await expect(
          navigationRepository
            .getNavigation(
              generationKey,
            ),
        ).rejects.toBeInstanceOf(
          CorruptLocalDataError,
        );
      },
    );

    it(
      'should reject corrupt persisted discovery points',
      async () => {
        await universeRepository
          .createIfAbsent(
            generationKey,
          );

        await database
          .progress
          .put({
            universeSeed:
              generationKey
                .universeSeed
                .serialize(),

            generatorVersionCode:
              1,

            scopeCode:
              0,

            scopeKey:
              'GLOBAL',

            galaxyIndex:
              null,

            discoveryPoints:
              '01',

            updatedAtEpochMs:
              1,
          });

        await expect(
          pointsRepository
            .getGlobalDiscoveryPoints(
              generationKey,
            ),
        ).rejects.toBeInstanceOf(
          CorruptLocalDataError,
        );
      },
    );

    it(
      'should reject corrupt persisted discovery lineage',
      async () => {
        await universeRepository
          .createIfAbsent(
            generationKey,
          );

        await database
          .discoveries
          .put({
            universeSeed:
              generationKey
                .universeSeed
                .serialize(),

            generatorVersionCode:
              1,

            targetTypeCode:
              5,

            targetSeed:
              '00000000000000000000000000000005',

            galaxyIndex:
              '0',

            sectorKey:
              null,

            galacticObjectIndex:
              null,

            bodyIndex:
              null,

            civilizationIndex:
              null,

            discoveryStateCode:
              1,

            firstKnownAtEpochMs:
              1,

            updatedAtEpochMs:
              1,
          });

        await expect(
          discoveryRepository
            .getKnownDiscoveries(
              generationKey,
            ),
        ).rejects.toThrow();
      },
    );

    it(
  'should reject a persisted locator that disagrees with the requested locator',
  async () => {
    await universeRepository
      .createIfAbsent(
        generationKey,
      );

    const requested =
      new SystemLocator(
        0n,
        123456789n,
        7n,
      );

    await discoveryRepository
      .setState(
        generationKey,
        requested,
        DiscoveryState.DETECTED,
      );

    const entity =
      (
        await database
          .discoveries
          .toArray()
      )[0];

    await database
      .discoveries
      .put({
        ...entity,

        galacticObjectIndex:
          '8',
      });

    await expect(
      discoveryRepository
        .getState(
          generationKey,
          requested,
        ),
    ).rejects.toBeInstanceOf(
      CorruptLocalDataError,
    );
  },
);

    it(
      'should reject a persisted targetSeed that disagrees with procedural identity',
      async () => {
        await universeRepository
          .createIfAbsent(
            generationKey,
          );

        const locator =
          new GalaxyLocator(
            0n,
          );

        await discoveryRepository
          .setState(
            generationKey,
            locator,
            DiscoveryState.DETECTED,
          );

        const entity =
          (
            await database
              .discoveries
              .toArray()
          )[0];

        await database
          .discoveries
          .delete([
            entity.universeSeed,
            entity.generatorVersionCode,
            entity.targetTypeCode,
            entity.targetSeed,
          ]);

        await database
          .discoveries
          .put({
            ...entity,

            targetSeed:
              'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
          });

        await expect(
          discoveryRepository
            .getKnownDiscoveries(
              generationKey,
            ),
        ).rejects.toBeInstanceOf(
          CorruptLocalDataError,
        );
      },
    );

    it(
  'should reject a materialized UNKNOWN discovery state',
  async () => {
    await universeRepository
      .createIfAbsent(
        generationKey,
      );

    const locator =
      new GalaxyLocator(
        0n,
      );

    await discoveryRepository
      .setState(
        generationKey,
        locator,
        DiscoveryState.DETECTED,
      );

    const entity =
      (
        await database
          .discoveries
          .toArray()
      )[0];

    await database
      .discoveries
      .put({
        ...entity,

        discoveryStateCode:
          0 as never,
      });

    await expect(
      discoveryRepository
        .getState(
          generationKey,
          locator,
        ),
    ).rejects.toBeInstanceOf(
      CorruptLocalDataError,
    );
  },
);

    it(
      'should reject corrupt persisted GeneratorVersion',
      async () => {
        await database
          .openDatabase();

        await database
          .universes
          .put({
            universeSeed:
              generationKey
                .universeSeed
                .serialize(),

            generatorVersionCode:
              99,

            createdAtEpochMs:
              1,

            updatedAtEpochMs:
              1,
          });

        await expect(
          universeRepository
            .getAll(),
        ).rejects.toBeInstanceOf(
          CorruptLocalDataError,
        );
      },
    );

    it(
  'should reject persisted Long values above Long.MAX_VALUE',
  async () => {
    await universeRepository
      .createIfAbsent(
        generationKey,
      );

    await database
      .navigation
      .put({
        universeSeed:
          generationKey
            .universeSeed
            .serialize(),

        generatorVersionCode:
          1,

        activeGalaxyIndex:
          '9223372036854775808',

        recentGalaxyIndices:
          [],

        updatedAtEpochMs:
          1,
      });

    await expect(
      navigationRepository
        .getNavigation(
          generationKey,
        ),
    ).rejects.toBeInstanceOf(
      CorruptLocalDataError,
    );
  },
);

it(
  'should reject a corrupt persisted UniverseSeed',
  async () => {
    await database
      .openDatabase();

    await database
      .universes
      .put({
        universeSeed:
          'INVALID-SEED',

        generatorVersionCode:
          1,

        createdAtEpochMs:
          1,

        updatedAtEpochMs:
          1,
      });

    await expect(
      universeRepository
        .getAll(),
    ).rejects.toBeInstanceOf(
      CorruptLocalDataError,
    );
  },
);

it(
  'should reject an invalid persisted targetSeed format',
  async () => {
    await universeRepository
      .createIfAbsent(
        generationKey,
      );

    await database
      .discoveries
      .put({
        universeSeed:
          generationKey
            .universeSeed
            .serialize(),

        generatorVersionCode:
          1,

        targetTypeCode:
          1,

        targetSeed:
          'INVALID-TARGET-SEED',

        galaxyIndex:
          '0',

        sectorKey:
          null,

        galacticObjectIndex:
          null,

        bodyIndex:
          null,

        civilizationIndex:
          null,

        discoveryStateCode:
          1,

        firstKnownAtEpochMs:
          1,

        updatedAtEpochMs:
          1,
      });

    await expect(
      discoveryRepository
        .getKnownDiscoveries(
          generationKey,
        ),
    ).rejects.toBeInstanceOf(
      CorruptLocalDataError,
    );
  },
);

it(
  'should reject materialized UNKNOWN when listing known discoveries',
  async () => {
    await universeRepository
      .createIfAbsent(
        generationKey,
      );

    const locator =
      new GalaxyLocator(
        0n,
      );

    await discoveryRepository
      .setState(
        generationKey,
        locator,
        DiscoveryState.DETECTED,
      );

    const entity =
      (
        await database
          .discoveries
          .toArray()
      )[0];

    await database
      .discoveries
      .put({
        ...entity,

        discoveryStateCode:
          0 as never,
      });

    await expect(
      discoveryRepository
        .getKnownDiscoveries(
          generationKey,
        ),
    ).rejects.toBeInstanceOf(
      CorruptLocalDataError,
    );
  },
);

    it(
      'should reject UNKNOWN in KnownDiscovery',
      () => {
        expect(
          () =>
            new KnownDiscovery(
              generationKey,

              new GalaxyLocator(
                0n,
              ),

              DiscoveryState.UNKNOWN,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
  'should make concurrent createIfAbsent calls atomic',
  async () => {
    const results =
      await Promise.all([
        universeRepository
          .createIfAbsent(
            generationKey,
          ),

        universeRepository
          .createIfAbsent(
            generationKey,
          ),
      ]);

    expect(
      results
        .sort(),
    ).toEqual([
      false,
      true,
    ]);

    expect(
      await database
        .universes
        .count(),
    ).toBe(1);
  },
);

it(
  'should persist and restore every procedural locator type',
  async () => {
    await universeRepository
      .createIfAbsent(
        generationKey,
      );

    const locators:
      readonly ProceduralLocator[] =
      [
        new GalaxyLocator(
          0n,
        ),

        new SectorLocator(
          0n,
          123456789n,
        ),

        new GalacticObjectLocator(
          0n,
          123456789n,
          7n,
        ),

        new SystemLocator(
          0n,
          123456789n,
          7n,
        ),

        new BodyLocator(
          0n,
          123456789n,
          7n,
          3n,
        ),

        new CivilizationLocator(
          0n,
          123456789n,
          7n,
          3n,
          1n,
        ),
      ];

    for (
      const locator
      of locators
    ) {
      await discoveryRepository
        .setState(
          generationKey,
          locator,
          DiscoveryState.DETECTED,
        );

      expect(
        await discoveryRepository
          .getState(
            generationKey,
            locator,
          ),
      ).toBe(
        DiscoveryState.DETECTED,
      );
    }

    expect(
      await database
        .discoveries
        .count(),
    ).toBe(6);
  },
);

  },
);