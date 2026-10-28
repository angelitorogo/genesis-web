
import Dexie from 'dexie';

import {
  IDBKeyRange,
  indexedDB,
} from 'fake-indexeddb';

import {
  GENESIS_INDEXED_DB_NAME,
  GenesisIndexedDb,
} from './genesis-indexed-db';

import {
  GENESIS_INDEXED_DB_MIGRATIONS,
  GeneratorVersionMigrationStrategy,
  validateGenesisIndexedDbMigrationChain,
} from './genesis-indexed-db-migrations';

import {
  GENESIS_INDEXED_DB_SCHEMA_VERSION,
  GENESIS_INDEXED_DB_SCHEMA_VERSION_V1,
  GENESIS_INDEXED_DB_SCHEMA_VERSION_V2,
  GENESIS_INDEXED_DB_SCHEMA_VERSION_V3,
  GENESIS_INDEXED_DB_SCHEMA_VERSION_V5,
  GENESIS_INDEXED_DB_SCHEMA_VERSION_V8,
  GENESIS_INDEXED_DB_SCHEMA_VERSION_V10,
  GENESIS_INDEXED_DB_V1_STORES,
  GENESIS_INDEXED_DB_V2_STORES,
  GENESIS_INDEXED_DB_V3_STORES,
  GENESIS_INDEXED_DB_V8_STORES,
  GENESIS_INDEXED_DB_STORES,
  GENESIS_STORAGE_FORMAT_VERSION,
} from './genesis-indexed-db-schema';

const TEST_INDEXED_DB_DEPENDENCIES =
  Object.freeze({
    indexedDB,
    IDBKeyRange,
  });

describe(
  'GenesisIndexedDb migrations',
  () => {
    const databaseName =
      `${GENESIS_INDEXED_DB_NAME}-migration-tests`;

    let database:
      GenesisIndexedDb | undefined;

    let legacyDatabase:
      Dexie | undefined;

    afterEach(
        async () => {
            database
            ?.closeDatabase();

            legacyDatabase
            ?.close();

            const cleanupDatabase =
            new Dexie(
                databaseName,
                TEST_INDEXED_DB_DEPENDENCIES,
            );

            await cleanupDatabase
            .delete();

            database =
            undefined;

            legacyDatabase =
            undefined;
        },
    );

    function createLegacyV1Database():
    Dexie {

        const legacy =
            new Dexie(
            databaseName,
            {
                autoOpen:
                false,

                ...TEST_INDEXED_DB_DEPENDENCIES,
            },
            );

        legacy
            .version(
            GENESIS_INDEXED_DB_SCHEMA_VERSION_V1,
            )
            .stores(
            GENESIS_INDEXED_DB_V1_STORES,
            );

        return legacy;
    }

    
    function createLegacyV2Database():
      Dexie {

      const legacy =
        new Dexie(
          databaseName,
          {
            autoOpen:
              false,

            ...TEST_INDEXED_DB_DEPENDENCIES,
          },
        );

      legacy
        .version(
          GENESIS_INDEXED_DB_SCHEMA_VERSION_V1,
        )
        .stores(
          GENESIS_INDEXED_DB_V1_STORES,
        );

      legacy
        .version(
          GENESIS_INDEXED_DB_SCHEMA_VERSION_V2,
        )
        .stores(
          GENESIS_INDEXED_DB_V2_STORES,
        );

      return legacy;
    }

    function createLegacyV3Database():
      Dexie {

      const legacy =
        createLegacyV2Database();

      legacy
        .version(
          GENESIS_INDEXED_DB_SCHEMA_VERSION_V3,
        )
        .stores(
          GENESIS_INDEXED_DB_V3_STORES,
        );

      return legacy;
    }

    function createCurrentDatabase():
        GenesisIndexedDb {

        return new GenesisIndexedDb(
            databaseName,
            TEST_INDEXED_DB_DEPENDENCIES,
        );
    }

    it(
      'should expose the exact canonical migration chain through v7',
      () => {
        expect(
          GENESIS_INDEXED_DB_MIGRATIONS,
        ).toEqual([
          {
            id:
              'v1-to-v2',

            fromSchemaVersion:
              1,

            toSchemaVersion:
              2,

            generatorVersionStrategy:
              GeneratorVersionMigrationStrategy
                .PRESERVE,
          },

          {
            id:
              'v2-to-v3',

            fromSchemaVersion:
              2,

            toSchemaVersion:
              3,

            generatorVersionStrategy:
              GeneratorVersionMigrationStrategy
                .PRESERVE,
          },

          {
            id:
              'v3-to-v4',

            fromSchemaVersion:
              3,

            toSchemaVersion:
              4,

            generatorVersionStrategy:
              GeneratorVersionMigrationStrategy
                .PRESERVE,
          },
          {
            id: 'v4-to-v5-private-biospheres',
            fromSchemaVersion: 4,
            toSchemaVersion: 5,
            generatorVersionStrategy: GeneratorVersionMigrationStrategy.PRESERVE,
          },
          {
            id:'v5-to-v6-private-biosphere-audits',fromSchemaVersion:5,toSchemaVersion:6,
            generatorVersionStrategy:GeneratorVersionMigrationStrategy.PRESERVE,
          },
          {
            id:'v6-to-v7-remove-legacy-biology',fromSchemaVersion:6,toSchemaVersion:7,
            generatorVersionStrategy:GeneratorVersionMigrationStrategy.PRESERVE,
          },
          {
            id:'v7-to-v8-vida3-microbial-private',fromSchemaVersion:7,toSchemaVersion:8,
            generatorVersionStrategy:GeneratorVersionMigrationStrategy.PRESERVE,
          },
          {id:'v8-to-v9-vida4-ecological-private',fromSchemaVersion:8,toSchemaVersion:9,
            generatorVersionStrategy:GeneratorVersionMigrationStrategy.PRESERVE},
          {id:'v9-to-v10-vida9-biological-private',fromSchemaVersion:9,toSchemaVersion:10,
            generatorVersionStrategy:GeneratorVersionMigrationStrategy.PRESERVE},
        ]);
      },
    );

    it(
      'should validate the canonical migration chain',
      () => {
        expect(
          () =>
            validateGenesisIndexedDbMigrationChain(),
        ).not.toThrow();

        expect(
          GENESIS_INDEXED_DB_SCHEMA_VERSION,
        ).toBe(
          GENESIS_INDEXED_DB_SCHEMA_VERSION_V10,
        );
      },
    );

    it(
      'should reject an invalid current schema version',
      () => {
        expect(
          () =>
            validateGenesisIndexedDbMigrationChain(
              [],
              0,
            ),
        ).toThrow(
          'below the first supported schema',
        );
      },
    );

    it(
      'should reject a gap in the migration chain',
      () => {
        expect(
          () =>
            validateGenesisIndexedDbMigrationChain(
              [
                {
                  id:
                    'broken',

                  fromSchemaVersion:
                    2,

                  toSchemaVersion:
                    3,

                  generatorVersionStrategy:
                    GeneratorVersionMigrationStrategy
                      .PRESERVE,
                },
              ],
              3,
            ),
        ).toThrow(
          'Migration chain gap',
        );
      },
    );

    it(
      'should reject migrations that skip schema versions',
      () => {
        expect(
          () =>
            validateGenesisIndexedDbMigrationChain(
              [
                {
                  id:
                    'broken',

                  fromSchemaVersion:
                    1,

                  toSchemaVersion:
                    3,

                  generatorVersionStrategy:
                    GeneratorVersionMigrationStrategy
                      .PRESERVE,
                },
              ],
              3,
            ),
        ).toThrow(
          'must advance exactly one schema version',
        );
      },
    );

    it(
      'should reject a chain that does not reach the current schema',
      () => {
        expect(
          () =>
            validateGenesisIndexedDbMigrationChain(
              [],
              2,
            ),
        ).toThrow(
          'Migration chain ends at schema 1',
        );
      },
    );

    it(
      'should migrate an empty v1 database through v7 without inventing metadata',
      async () => {
        legacyDatabase =
          createLegacyV1Database();

        await legacyDatabase
          .open();

        legacyDatabase
          .close();

        database =
          createCurrentDatabase()

        await database
          .openDatabase();

        expect(
          database.verno,
        ).toBe(
          GENESIS_INDEXED_DB_SCHEMA_VERSION_V10,
        );

        expect(
          database.tables
            .map(
              (
                table,
              ) =>
                table.name,
            )
            .sort(),
        ).toEqual([
          'discoveries',
          'galaxies',
          'galaxyKnowledgeSnapshots',
          'metadata',
          'navigation',
          'observations',
          'privateBiologicalRecordsVIDA9',
          'privateEcologicalBiospheres',
          'privateMicrobialBiospheres',
          'progress',
          'universes',
        ]);

        expect(
          await database
            .metadata
            .count(),
        ).toBe(0);

        expect(
          await database
            .navigation
            .count(),
        ).toBe(0);
      },
    );

    it('VIDA.4 upgrades V8 to V9 without changing earlier microbial records', async () => {
      legacyDatabase = new Dexie(databaseName, {autoOpen:false, ...TEST_INDEXED_DB_DEPENDENCIES});
      legacyDatabase.version(GENESIS_INDEXED_DB_SCHEMA_VERSION_V8)
        .stores(GENESIS_INDEXED_DB_V8_STORES);
      await legacyDatabase.open();
      await legacyDatabase.table('metadata').put({key:'storage',schemaVersion:8,
        storageFormatVersion:1,updatedAtEpochMs:42});
      await legacyDatabase.table('privateMicrobialBiospheres').put({
        universeSeed:'7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',
        generatorVersionCode:3,bodyStorageKey:'VIDA.3/microbial/v3-aquifer-lunar-surface|0:1:0:0:PLANET:-',
        modelRevision:'VIDA.3/microbial/v3-aquifer-lunar-surface',snapshotJson:'{}',digest:'abc',
      });
      legacyDatabase.close();
      database=createCurrentDatabase();
      await database.openDatabase();
      expect(database.verno).toBe(10);
      expect((await database.metadata.get('storage'))?.schemaVersion).toBe(10);
      expect(await database.privateMicrobialBiospheres.count()).toBe(1);
      expect(await database.privateEcologicalBiospheres.count()).toBe(0);
      expect(await database.observations.count()).toBe(0);
    });

    it('VIDA.0 migrates V5 to V7 and removes retired biology while preserving gameplay', async () => {
      legacyDatabase = new Dexie(databaseName, { autoOpen: false, ...TEST_INDEXED_DB_DEPENDENCIES });
      legacyDatabase.version(GENESIS_INDEXED_DB_SCHEMA_VERSION_V5).stores(GENESIS_INDEXED_DB_STORES);
      await legacyDatabase.open();
      await legacyDatabase.table('metadata').put({ key: 'storage', schemaVersion: 5,
        storageFormatVersion: 1, updatedAtEpochMs: 123 });
      await legacyDatabase.table('universes').put({
        universeSeed: 'OLD-UNIVERSE', generatorVersionCode: 3,
        createdAtEpochMs: 1, updatedAtEpochMs: 2,
      });
      await legacyDatabase.table('privateBiospheres').put({
        universeSeed: 'OLD-UNIVERSE', generatorVersionCode: 3,
        bodyStorageKey: 'bio33.1:test', payloadJson: '{}', schema: 'retired',
      });
      legacyDatabase.close();
      database = createCurrentDatabase(); await database.openDatabase();
      expect(database.verno).toBe(10);
      expect(database.tables.map(x => x.name)).not.toContain('privateBiospheres');
      expect(database.tables.map(x => x.name)).not.toContain('privateBiosphereAudits');
      expect(await database.universes.count()).toBe(1);
      expect((await database.metadata.get('storage'))?.schemaVersion).toBe(10);
    });

    it(
      'should migrate an existing v3 database through v7 with an empty derived snapshot store',
      async () => {
        const now = 1_786_291_200_000;

        legacyDatabase =
          createLegacyV3Database();

        await legacyDatabase.open();

        await legacyDatabase
          .table('metadata')
          .put({
            key: 'storage',
            schemaVersion: 3,
            storageFormatVersion: GENESIS_STORAGE_FORMAT_VERSION,
            updatedAtEpochMs: now,
          });

        legacyDatabase.close();

        database =
          createCurrentDatabase();

        await database.openDatabase();

        expect(database.verno).toBe(
          GENESIS_INDEXED_DB_SCHEMA_VERSION_V10,
        );

        expect(
          await database.galaxyKnowledgeSnapshots.count(),
        ).toBe(0);

        expect(
          (await database.metadata.get('storage'))
            ?.schemaVersion,
        ).toBe(10);
      },
    );

    it(
      'should migrate v1 through v7 preserving data and GeneratorVersion',
      async () => {
        const universeSeed =
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1';

        const now =
          1_786_291_200_000;

        legacyDatabase =
          createLegacyV1Database();

        await legacyDatabase
          .open();

        await legacyDatabase
          .table(
            'metadata',
          )
          .put({
            key:
              'storage',

            schemaVersion:
              1,

            storageFormatVersion:
              GENESIS_STORAGE_FORMAT_VERSION,

            updatedAtEpochMs:
              now,
          });

        await legacyDatabase
          .table(
            'universes',
          )
          .put({
            universeSeed,

            generatorVersionCode:
              1,

            createdAtEpochMs:
              now,

            updatedAtEpochMs:
              now,
          });

        await legacyDatabase
          .table(
            'galaxies',
          )
          .put({
            universeSeed,

            generatorVersionCode:
              1,

            galaxyIndex:
              '0',

            discoveryStateCode:
              1,

            firstKnownAtEpochMs:
              now,

            updatedAtEpochMs:
              now,
          });

        await legacyDatabase
          .table(
            'discoveries',
          )
          .put({
            universeSeed,

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

            discoveryStateCode:
              1,

            firstKnownAtEpochMs:
              now,

            updatedAtEpochMs:
              now,
          });

        await legacyDatabase
          .table(
            'observations',
          )
          .put({
            id:
              'observation-1',

            universeSeed,

            generatorVersionCode:
              1,

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

        await legacyDatabase
          .table(
            'progress',
          )
          .put({
            universeSeed,

            generatorVersionCode:
              1,

            scopeCode:
              0,

            scopeKey:
              'GLOBAL',

            galaxyIndex:
              null,

            discoveryPoints:
              '125',

            updatedAtEpochMs:
              now,
          });

        legacyDatabase
          .close();

        database =
          createCurrentDatabase()

        await database
          .openDatabase();

        expect(
          await database
            .metadata
            .get(
              'storage',
            ),
        ).toEqual({
          key:
            'storage',

          schemaVersion:
            GENESIS_INDEXED_DB_SCHEMA_VERSION_V10,

          storageFormatVersion:
            1,

          updatedAtEpochMs:
            now,
        });

        expect(
          await database
            .universes
            .get([
              universeSeed,
              1,
            ]),
        ).toEqual({
          universeSeed,

          generatorVersionCode:
            1,

          createdAtEpochMs:
            now,

          updatedAtEpochMs:
            now,
        });

        expect(
          (
            await database
              .galaxies
              .get([
                universeSeed,
                1,
                '0',
              ])
          )
            ?.generatorVersionCode,
        ).toBe(1);

        expect(
          (
            await database
              .discoveries
              .get([
                universeSeed,
                1,
                4,
                '58691B1E4E539DBA3EB173F795FDE7E2',
              ])
          )
            ?.generatorVersionCode,
        ).toBe(1);

        expect(
          await database
            .discoveries
            .get([
              universeSeed,
              1,
              4,
              '58691B1E4E539DBA3EB173F795FDE7E2',
            ]),
        ).toMatchObject({
          sectorKey:
            '123456789',

          sectorX:
            0,

          sectorY:
            123456789,
        });

        expect(
          (
            await database
              .observations
              .get(
                'observation-1',
              )
          )
            ?.generatorVersionCode,
        ).toBe(1);

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
            ?.generatorVersionCode,
        ).toBe(1);

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
          '125',
        );

        expect(
          await database
            .navigation
            .count(),
        ).toBe(0);
      },
    );

    it(
      'should migrate v2 discovery coordinates from canonical sectorKey values',
      async () => {
        const universeSeed =
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1';

        legacyDatabase =
          createLegacyV2Database();

        await legacyDatabase
          .open();

        await legacyDatabase
          .table(
            'metadata',
          )
          .put({
            key:
              'storage',

            schemaVersion:
              2,

            storageFormatVersion:
              GENESIS_STORAGE_FORMAT_VERSION,

            updatedAtEpochMs:
              1,
          });

        await legacyDatabase
          .table(
            'discoveries',
          )
          .bulkPut([
            {
              universeSeed,

              generatorVersionCode:
                1,

              targetTypeCode:
                1,

              targetSeed:
                'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',

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
            },

            {
              universeSeed,

              generatorVersionCode:
                1,

              targetTypeCode:
                4,

              targetSeed:
                'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',

              galaxyIndex:
                '0',

              sectorKey:
                '-51539607518',

              galacticObjectIndex:
                '7',

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
            },
          ]);

        legacyDatabase
          .close();

        database =
          createCurrentDatabase();

        await database
          .openDatabase();

        expect(
          database.verno,
        ).toBe(
          GENESIS_INDEXED_DB_SCHEMA_VERSION_V10,
        );

        expect(
          await database
            .metadata
            .get(
              'storage',
            ),
        ).toMatchObject({
          schemaVersion:
            GENESIS_INDEXED_DB_SCHEMA_VERSION_V10,
        });

        expect(
          await database
            .discoveries
            .get([
              universeSeed,
              1,
              1,
              'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            ]),
        ).toMatchObject({
          sectorKey:
            null,

          sectorX:
            null,

          sectorY:
            null,
        });

        expect(
          await database
            .discoveries
            .get([
              universeSeed,
              1,
              4,
              'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
            ]),
        ).toMatchObject({
          sectorKey:
            '-51539607518',

          sectorX:
            -12,

          sectorY:
            34,
        });
      },
    );

    it(
      'should abort v2 to v3 migration when sectorKey is not canonical',
      async () => {
        legacyDatabase =
          createLegacyV2Database();

        await legacyDatabase
          .open();

        await legacyDatabase
          .table(
            'discoveries',
          )
          .put({
            universeSeed:
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',

            generatorVersionCode:
              1,

            targetTypeCode:
              4,

            targetSeed:
              'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',

            galaxyIndex:
              '0',

            sectorKey:
              '0001',

            galacticObjectIndex:
              '7',

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

        legacyDatabase
          .close();

        database =
          createCurrentDatabase();

        await expect(
          database
            .openDatabase(),
        ).rejects.toThrow(
          /Cannot migrate discovery coordinates/,
        );
      },
    );

    it(
      'should abort migration when persisted schema metadata is inconsistent',
      async () => {
        legacyDatabase =
          createLegacyV1Database();

        await legacyDatabase
          .open();

        await legacyDatabase
          .table(
            'metadata',
          )
          .put({
            key:
              'storage',

            schemaVersion:
              99,

            storageFormatVersion:
              1,

            updatedAtEpochMs:
              1,
          });

        legacyDatabase
          .close();

        database =
          createCurrentDatabase()

        await expect(
          database
            .openDatabase(),
        ).rejects.toThrow(
          /expected schemaVersion 1/,
        );
      },
    );
  },
);