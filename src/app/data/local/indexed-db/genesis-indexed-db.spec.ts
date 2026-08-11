import {
  IDBKeyRange,
  indexedDB,
} from 'fake-indexeddb';

import {
  GENESIS_INDEXED_DB_NAME,
  GenesisIndexedDb,
} from './genesis-indexed-db';

import {
  GENESIS_INDEXED_DB_SCHEMA_VERSION,
  GENESIS_STORAGE_FORMAT_VERSION,
} from './genesis-indexed-db-schema';

import {
  createGalaxyProgressEntity,
  createGlobalProgressEntity,
} from '../entity/progress.entity';

import {
  createDiscoveryEntity,
  discoveryStateFromEntity,
} from '../entity/discovery.entity';

import {
  DiscoveryState,
} from '../../../domain/discovery/discovery-state';

const TEST_INDEXED_DB_DEPENDENCIES =
  Object.freeze({
    indexedDB,
    IDBKeyRange,
  });


describe(
  'GenesisIndexedDb',
  () => {
    let database:
      GenesisIndexedDb;

    function createTestDatabase():
      GenesisIndexedDb {

      return new GenesisIndexedDb(
        GENESIS_INDEXED_DB_NAME,
        TEST_INDEXED_DB_DEPENDENCIES,
      );
    }  

    beforeEach(
      () => {
        database =
          createTestDatabase();
      },
    );

    afterEach(
      async () => {
        database.closeDatabase();

        await database.delete();
      },
    );

    it(
      'should use the canonical GENESIS database name',
      () => {
        expect(
          database.name,
        ).toBe(
          GENESIS_INDEXED_DB_NAME,
        );

        expect(
          database.name,
        ).toBe(
          'genesis-web',
        );
      },
    );

    it(
      'should start closed',
      () => {
        expect(
          database.isOpen(),
        ).toBe(false);
      },
    );

    it(
      'should open the IndexedDB database',
      async () => {
        await database
          .openDatabase();

        expect(
          database.isOpen(),
        ).toBe(true);

        expect(
          database
            .backendDB()
            .name,
        ).toBe(
          GENESIS_INDEXED_DB_NAME,
        );
      },
    );

    it(
      'should make openDatabase idempotent',
      async () => {
        await database
          .openDatabase();

        const backend =
          database.backendDB();

        await database
          .openDatabase();

        expect(
          database.backendDB(),
        ).toBe(
          backend,
        );
      },
    );

    it(
      'should close the database explicitly',
      async () => {
        await database
          .openDatabase();

        database
          .closeDatabase();

        expect(
          database.isOpen(),
        ).toBe(false);
      },
    );

    it(
      'should use schema version 3',
      async () => {
        await database
          .openDatabase();

        expect(
          database.verno,
        ).toBe(
          GENESIS_INDEXED_DB_SCHEMA_VERSION,
        );

        expect(
          database.verno,
        ).toBe(3);
      },
    );

    it(
      'should preserve the portable storage format version',
      () => {
        expect(
          GENESIS_STORAGE_FORMAT_VERSION,
        ).toBe(1);
      },
    );

    it(
      'should define the exact point 3.3 stores',
      async () => {
        await database
          .openDatabase();

        const tableNames =
          database
            .tables
            .map(
              (table) =>
                table.name,
            )
            .sort();

        expect(
          tableNames,
        ).toEqual([
          'discoveries',
          'galaxies',
          'metadata',
          'navigation',
          'observations',
          'progress',
          'universes',
        ]);
      },
    );

    it(
      'should not create a favorites store',
      async () => {
        await database
          .openDatabase();

        expect(
          database.tables
            .some(
              (table) =>
                table.name ===
                'favorites',
            ),
        ).toBe(false);
      },
    );

    it(
      'should use universeSeed and generatorVersionCode as universe identity',
      async () => {
        await database
          .openDatabase();

        expect(
          database
            .universes
            .schema
            .primKey
            .keyPath,
        ).toEqual([
          'universeSeed',
          'generatorVersionCode',
        ]);
      },
    );

    it(
      'should use procedural target identity as discovery primary key',
      async () => {
        await database
          .openDatabase();

        expect(
          database
            .discoveries
            .schema
            .primKey
            .keyPath,
        ).toEqual([
          'universeSeed',
          'generatorVersionCode',
          'targetTypeCode',
          'targetSeed',
        ]);
      },
    );

    it(
      'should index discovery sector coordinates for spatial queries',
      async () => {
        await database
          .openDatabase();

        const coordinateIndex =
          database
            .discoveries
            .schema
            .indexes
            .find(
              (
                index,
              ) =>
                Array.isArray(
                  index.keyPath,
                ) &&
                index.keyPath.join('|') ===
                  [
                    'universeSeed',
                    'generatorVersionCode',
                    'galaxyIndex',
                    'sectorX',
                    'sectorY',
                  ].join('|'),
            );

        expect(
          coordinateIndex,
        ).toBeDefined();
      },
    );

    it(
      'should use universe generation identity as navigation primary key',
      async () => {
        await database
          .openDatabase();

        expect(
          database
            .navigation
            .schema
            .primKey
            .keyPath,
        ).toEqual([
          'universeSeed',
          'generatorVersionCode',
        ]);
      },
    );

    it(
      'should persist active galaxy and recent navigation across reopen',
      async () => {
        const universeSeed =
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1';

        await database
          .openDatabase();

        await database
          .navigation
          .put({
            universeSeed,

            generatorVersionCode:
              1,

            activeGalaxyIndex:
              '7',

            recentGalaxyIndices: [
              '7',
              '3',
              '0',
            ],

            updatedAtEpochMs:
              1_786_291_200_000,
          });

        database
          .closeDatabase();

        database =
          createTestDatabase();

        await database
          .openDatabase();

        const restored =
          await database
            .navigation
            .get([
              universeSeed,
              1,
            ]);

        expect(
          restored,
        ).toEqual({
          universeSeed,

          generatorVersionCode:
            1,

          activeGalaxyIndex:
            '7',

          recentGalaxyIndices: [
            '7',
            '3',
            '0',
          ],

          updatedAtEpochMs:
            1_786_291_200_000,
        });
      },
    );

    it(
      'should isolate navigation by GeneratorVersion',
      async () => {
        const universeSeed =
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1';

        await database
          .openDatabase();

        await database
          .navigation
          .bulkPut([
            {
              universeSeed,

              generatorVersionCode:
                1,

              activeGalaxyIndex:
                '3',

              recentGalaxyIndices: [
                '3',
                '0',
              ],

              updatedAtEpochMs:
                1,
            },

            {
              universeSeed,

              generatorVersionCode:
                2,

              activeGalaxyIndex:
                '9',

              recentGalaxyIndices: [
                '9',
                '2',
              ],

              updatedAtEpochMs:
                2,
            },
          ]);

        expect(
          (
            await database
              .navigation
              .get([
                universeSeed,
                1,
              ])
          )
            ?.activeGalaxyIndex,
        ).toBe(
          '3',
        );

        expect(
          (
            await database
              .navigation
              .get([
                universeSeed,
                2,
              ])
          )
            ?.activeGalaxyIndex,
        ).toBe(
          '9',
        );
      },
    );

    it(
      'should preserve 64-bit galaxy indices without Number precision loss',
      async () => {
        const universeSeed =
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1';

        const longMax =
          '9223372036854775807';

        await database
          .openDatabase();

        await database
          .navigation
          .put({
            universeSeed,

            generatorVersionCode:
              1,

            activeGalaxyIndex:
              longMax,

            recentGalaxyIndices: [
              longMax,
              '0',
            ],

            updatedAtEpochMs:
              1,
          });

        const restored =
          await database
            .navigation
            .get([
              universeSeed,
              1,
            ]);

        expect(
          restored
            ?.activeGalaxyIndex,
        ).toBe(
          longMax,
        );

        expect(
          restored
            ?.recentGalaxyIndices,
        ).toEqual([
          longMax,
          '0',
        ]);
      },
    );

    it(
  'should persist global and galaxy discovery points independently',
    async () => {
      const universeSeed =
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1';

      await database
        .openDatabase();

      await database
        .progress
        .bulkPut([
          createGlobalProgressEntity({
            universeSeed,

            generatorVersionCode:
              1,

            discoveryPoints:
              500n,

            updatedAtEpochMs:
              1,
          }),

          createGalaxyProgressEntity({
            universeSeed,

            generatorVersionCode:
              1,

            galaxyIndex:
              0n,

            discoveryPoints:
              125n,

            updatedAtEpochMs:
              2,
          }),

          createGalaxyProgressEntity({
            universeSeed,

            generatorVersionCode:
              1,

            galaxyIndex:
              7n,

            discoveryPoints:
              310n,

            updatedAtEpochMs:
              3,
          }),
        ]);

      const global =
        await database
          .progress
          .get([
            universeSeed,
            1,
            0,
            'GLOBAL',
          ]);

      const galaxy0 =
        await database
          .progress
          .get([
            universeSeed,
            1,
            1,
            '0',
          ]);

      const galaxy7 =
        await database
          .progress
          .get([
            universeSeed,
            1,
            1,
            '7',
          ]);

      expect(
        global
          ?.discoveryPoints,
      ).toBe(
        '500',
      );

      expect(
        galaxy0
          ?.discoveryPoints,
      ).toBe(
        '125',
      );

      expect(
        galaxy7
          ?.discoveryPoints,
      ).toBe(
        '310',
      );
    },
  );

  it(
    'should persist discovery points across database reopen',
    async () => {
      const universeSeed =
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1';

      await database
        .openDatabase();

      await database
        .progress
        .bulkPut([
          createGlobalProgressEntity({
            universeSeed,

            generatorVersionCode:
              1,

            discoveryPoints:
              900n,

            updatedAtEpochMs:
              1,
          }),

          createGalaxyProgressEntity({
            universeSeed,

            generatorVersionCode:
              1,

            galaxyIndex:
              3n,

            discoveryPoints:
              275n,

            updatedAtEpochMs:
              2,
          }),
        ]);

      database
        .closeDatabase();

      database =
        createTestDatabase();

      await database
        .openDatabase();

      expect(
        (
          await database
            .progress
            .get([
              universeSeed,
              1,
              0,
              'GLOBAL',
            ])
        )
          ?.discoveryPoints,
      ).toBe(
        '900',
      );

      expect(
        (
          await database
            .progress
            .get([
              universeSeed,
              1,
              1,
              '3',
            ])
        )
          ?.discoveryPoints,
      ).toBe(
        '275',
      );
    },
  );

  it(
    'should isolate discovery points by GeneratorVersion and galaxy',
    async () => {
      const universeSeed =
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1';

      await database
        .openDatabase();

      await database
        .progress
        .bulkPut([
          createGalaxyProgressEntity({
            universeSeed,

            generatorVersionCode:
              1,

            galaxyIndex:
              4n,

            discoveryPoints:
              10n,

            updatedAtEpochMs:
              1,
          }),

          createGalaxyProgressEntity({
            universeSeed,

            generatorVersionCode:
              1,

            galaxyIndex:
              5n,

            discoveryPoints:
              20n,

            updatedAtEpochMs:
              2,
          }),

          createGalaxyProgressEntity({
            universeSeed,

            generatorVersionCode:
              2,

            galaxyIndex:
              4n,

            discoveryPoints:
              30n,

            updatedAtEpochMs:
              3,
          }),
        ]);

      expect(
        (
          await database
            .progress
            .get([
              universeSeed,
              1,
              1,
              '4',
            ])
        )
          ?.discoveryPoints,
      ).toBe(
        '10',
      );

      expect(
        (
          await database
            .progress
            .get([
              universeSeed,
              1,
              1,
              '5',
            ])
        )
          ?.discoveryPoints,
      ).toBe(
        '20',
      );

      expect(
        (
          await database
            .progress
            .get([
              universeSeed,
              2,
              1,
              '4',
            ])
        )
          ?.discoveryPoints,
      ).toBe(
        '30',
      );
    },
  );

  it(
    'should preserve Long.MAX_VALUE discovery points without Number precision loss',
    async () => {
      const universeSeed =
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1';

      const longMax =
        9223372036854775807n;

      await database
        .openDatabase();

      await database
        .progress
        .put(
          createGalaxyProgressEntity({
            universeSeed,

            generatorVersionCode:
              1,

            galaxyIndex:
              longMax,

            discoveryPoints:
              longMax,

            updatedAtEpochMs:
              1,
          }),
        );

      const restored =
        await database
          .progress
          .get([
            universeSeed,
            1,
            1,
            '9223372036854775807',
          ]);

      expect(
        restored
          ?.galaxyIndex,
      ).toBe(
        '9223372036854775807',
      );

      expect(
        restored
          ?.discoveryPoints,
      ).toBe(
        '9223372036854775807',
      );
    },
  );


      it(
      'should persist every known discovery state',
      async () => {
        const universeSeed =
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1';

        await database
          .openDatabase();

        for (
          const state
          of DiscoveryState
            .knownValues
        ) {
          const entity =
            createDiscoveryEntity({
              universeSeed,

              generatorVersionCode:
                1,

              targetTypeCode:
                4,

              targetSeed:
                `TARGET-${state.code}`,

              galaxyIndex:
                '0',

              sectorKey:
                '123456789',

              galacticObjectIndex:
                String(
                  state.code,
                ),

              bodyIndex:
                null,

              civilizationIndex:
                null,

              state,

              firstKnownAtEpochMs:
                state.code,

              updatedAtEpochMs:
                state.code,
            });

          expect(
            entity,
          ).not.toBeNull();

          if (
            entity !==
            null
          ) {
            await database
              .discoveries
              .put(
                entity,
              );
          }
        }

        const stored =
          await database
            .discoveries
            .toArray();

        expect(
          stored
            .map(
              (entity) =>
                entity.discoveryStateCode,
            )
            .sort(),
        ).toEqual([
          1,
          2,
          3,
          4,
          5,
        ]);
      },
    );

    it(
      'should represent UNKNOWN by absence of a discovery row',
      async () => {
        await database
          .openDatabase();

        const entity =
          createDiscoveryEntity({
            universeSeed:
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',

            generatorVersionCode:
              1,

            targetTypeCode:
              4,

            targetSeed:
              '58691B1E4E539DBA3EB173F795FDE7E2',

            galaxyIndex:
              '0',

            sectorKey:
              '123456789',

            galacticObjectIndex:
              '7',

            bodyIndex:
              null,

            civilizationIndex:
              null,

            state:
              DiscoveryState.UNKNOWN,

            firstKnownAtEpochMs:
              1,

            updatedAtEpochMs:
              1,
          });

        expect(
          entity,
        ).toBeNull();

        expect(
          await database
            .discoveries
            .count(),
        ).toBe(0);

        expect(
          discoveryStateFromEntity(
            undefined,
          ),
        ).toBe(
          DiscoveryState.UNKNOWN,
        );
      },
    );

    it(
      'should update the persisted state of the same procedural target',
      async () => {
        const universeSeed =
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1';

        const targetSeed =
          '58691B1E4E539DBA3EB173F795FDE7E2';

        await database
          .openDatabase();

        const detected =
          createDiscoveryEntity({
            universeSeed,

            generatorVersionCode:
              1,

            targetTypeCode:
              4,

            targetSeed,

            galaxyIndex:
              '0',

            sectorKey:
              '123456789',

            galacticObjectIndex:
              '7',

            bodyIndex:
              null,

            civilizationIndex:
              null,

            state:
              DiscoveryState.DETECTED,

            firstKnownAtEpochMs:
              1,

            updatedAtEpochMs:
              1,
          });

        const confirmed =
          createDiscoveryEntity({
            universeSeed,

            generatorVersionCode:
              1,

            targetTypeCode:
              4,

            targetSeed,

            galaxyIndex:
              '0',

            sectorKey:
              '123456789',

            galacticObjectIndex:
              '7',

            bodyIndex:
              null,

            civilizationIndex:
              null,

            state:
              DiscoveryState.CONFIRMED,

            firstKnownAtEpochMs:
              1,

            updatedAtEpochMs:
              2,
          });

        expect(
          detected,
        ).not.toBeNull();

        expect(
          confirmed,
        ).not.toBeNull();

        if (
          detected === null ||
          confirmed === null
        ) {
          throw new Error(
            'Known discovery states must be persistable.',
          );
        }

        await database
          .discoveries
          .put(
            detected,
          );

        await database
          .discoveries
          .put(
            confirmed,
          );

        expect(
          await database
            .discoveries
            .count(),
        ).toBe(1);

        const restored =
          await database
            .discoveries
            .get([
              universeSeed,
              1,
              4,
              targetSeed,
            ]);

        expect(
          discoveryStateFromEntity(
            restored,
          ),
        ).toBe(
          DiscoveryState.CONFIRMED,
        );
      },
    );

    it(
      'should preserve discovery state across database reopen',
      async () => {
        const universeSeed =
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1';

        const targetSeed =
          '86FE2CB4F2CC4678D23F310333F15EF7';

        await database
          .openDatabase();

        const entity =
          createDiscoveryEntity({
            universeSeed,

            generatorVersionCode:
              1,

            targetTypeCode:
              5,

            targetSeed,

            galaxyIndex:
              '0',

            sectorKey:
              '123456789',

            galacticObjectIndex:
              '7',

            bodyIndex:
              '3',

            civilizationIndex:
              null,

            state:
              DiscoveryState.CATALOGUED,

            firstKnownAtEpochMs:
              1,

            updatedAtEpochMs:
              2,
          });

        if (
          entity === null
        ) {
          throw new Error(
            'CATALOGUED must be persistable.',
          );
        }

        await database
          .discoveries
          .put(
            entity,
          );

        database
          .closeDatabase();

        database =
          createTestDatabase();

        await database
          .openDatabase();

        const restored =
          await database
            .discoveries
            .get([
              universeSeed,
              1,
              5,
              targetSeed,
            ]);

        expect(
          discoveryStateFromEntity(
            restored,
          ),
        ).toBe(
          DiscoveryState.CATALOGUED,
        );
      },
    );

    it(
      'should isolate discovery states by GeneratorVersion',
      async () => {
        const universeSeed =
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1';

        const targetSeed =
          'TEST-TARGET';

        await database
          .openDatabase();

        const version1 =
          createDiscoveryEntity({
            universeSeed,

            generatorVersionCode:
              1,

            targetTypeCode:
              4,

            targetSeed,

            galaxyIndex:
              '0',

            sectorKey:
              '1',

            galacticObjectIndex:
              '0',

            bodyIndex:
              null,

            civilizationIndex:
              null,

            state:
              DiscoveryState.DETECTED,

            firstKnownAtEpochMs:
              1,

            updatedAtEpochMs:
              1,
          });

        const version2 =
          createDiscoveryEntity({
            universeSeed,

            generatorVersionCode:
              2,

            targetTypeCode:
              4,

            targetSeed,

            galaxyIndex:
              '0',

            sectorKey:
              '1',

            galacticObjectIndex:
              '0',

            bodyIndex:
              null,

            civilizationIndex:
              null,

            state:
              DiscoveryState.CONFIRMED,

            firstKnownAtEpochMs:
              1,

            updatedAtEpochMs:
              2,
          });

        if (
          version1 === null ||
          version2 === null
        ) {
          throw new Error(
            'Known states must be persistable.',
          );
        }

        await database
          .discoveries
          .bulkPut([
            version1,
            version2,
          ]);

        expect(
          discoveryStateFromEntity(
            await database
              .discoveries
              .get([
                universeSeed,
                1,
                4,
                targetSeed,
              ]),
          ),
        ).toBe(
          DiscoveryState.DETECTED,
        );

        expect(
          discoveryStateFromEntity(
            await database
              .discoveries
              .get([
                universeSeed,
                2,
                4,
                targetSeed,
              ]),
          ),
        ).toBe(
          DiscoveryState.CONFIRMED,
        );
      },
    );

    it(
      'should persist representative entities in every store',
      async () => {
        await database
          .openDatabase();

        const universeSeed =
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1';

        const generatorVersionCode =
          1;

        const now =
          1_786_291_200_000;

        await database
          .metadata
          .add({
            key:
              'storage',

            schemaVersion:
              GENESIS_INDEXED_DB_SCHEMA_VERSION,

            storageFormatVersion:
              GENESIS_STORAGE_FORMAT_VERSION,

            updatedAtEpochMs:
              now,
          });

        await database
          .universes
          .add({
            universeSeed,

            generatorVersionCode,

            createdAtEpochMs:
              now,

            updatedAtEpochMs:
              now,
          });

        await database
          .galaxies
          .add({
            universeSeed,

            generatorVersionCode,

            galaxyIndex:
              '0',

            discoveryStateCode:
              1,

            firstKnownAtEpochMs:
              now,

            updatedAtEpochMs:
              now,
          });

        await database
          .discoveries
          .add({
            universeSeed,

            generatorVersionCode,

            targetTypeCode:
              4,

            targetSeed:
              '58691B1E4E539DBA3EB173F795FDE7E2',

            galaxyIndex:
              '0',

            sectorKey:
              '123456789',

            galacticObjectIndex:
              '7',

            bodyIndex:
              null,

            civilizationIndex:
              null,

            discoveryStateCode:
              1,

            firstKnownAtEpochMs:
              now,

            updatedAtEpochMs:
              now,
          });

        await database
          .observations
          .add({
            id:
              'observation-1',

            universeSeed,

            generatorVersionCode,

            targetTypeCode:
              4,

            targetSeed:
              '58691B1E4E539DBA3EB173F795FDE7E2',

            observationKind:
              'test',

            payloadVersion:
              1,

            payloadJson:
              '{}',

            observedAtEpochMs:
              now,
          });

        await database
          .progress
          .add({
            universeSeed,

            generatorVersionCode,

            scopeCode:
              0,

            scopeKey:
              'GLOBAL',

            galaxyIndex:
              null,

            discoveryPoints:
              '0',

            updatedAtEpochMs:
              now,
          });

        await database
          .navigation
          .add({
            universeSeed,

            generatorVersionCode,

            activeGalaxyIndex:
              '0',

            recentGalaxyIndices: [
              '0',
            ],

            updatedAtEpochMs:
              now,
          });

        expect(
          await database
            .metadata
            .count(),
        ).toBe(1);

        expect(
          await database
            .universes
            .count(),
        ).toBe(1);

        expect(
          await database
            .galaxies
            .count(),
        ).toBe(1);

        expect(
          await database
            .discoveries
            .count(),
        ).toBe(1);

        expect(
          await database
            .observations
            .count(),
        ).toBe(1);

        expect(
          await database
            .progress
            .count(),
        ).toBe(1);

        expect(
          await database
            .navigation
            .count(),
        ).toBe(1);
      },
    );
  },
);