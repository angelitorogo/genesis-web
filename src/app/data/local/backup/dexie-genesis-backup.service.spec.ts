import Dexie from 'dexie';

import {
  IDBKeyRange,
  indexedDB,
} from 'fake-indexeddb';

import {
  BackupFormatVersion,
  type GenesisBackupSnapshot,
} from '../../../domain/backup/genesis-backup';

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
  GenesisIndexedDb,
} from '../indexed-db/genesis-indexed-db';

import {
  GENESIS_INDEXED_DB_SCHEMA_VERSION,
  GENESIS_STORAGE_FORMAT_VERSION,
} from '../indexed-db/genesis-indexed-db-schema';

import {
  DexieGenesisBackupService,
} from './dexie-genesis-backup.service';

import {
  GenesisBackupValidationError,
  type BackupTargetSeedResolver,
} from './genesis-backup-validator';

describe(
  'DexieGenesisBackupService',
  () => {
    const databaseName =
      'genesis-web-backup-tests';

    const dependencies =
      Object.freeze({
        indexedDB,
        IDBKeyRange,
      });

    const universeSeed =
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1';

    const secondUniverseSeed =
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2';

    let database:
      GenesisIndexedDb;

    let service:
      DexieGenesisBackupService;

    const resolver:
      BackupTargetSeedResolver =
      (
        _generationKey,
        locator,
      ) =>
        syntheticTargetSeed(
          locator,
        );

    beforeEach(
      () => {
        database =
          new GenesisIndexedDb(
            databaseName,
            dependencies,
          );

        service =
          new DexieGenesisBackupService(
            database,
            resolver,
            () =>
              5000,
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

    it(
      'should expose BackupFormatVersion V1 as code 1',
      () => {
        expect(
          BackupFormatVersion.V1.code,
        ).toBe(1);
      },
    );

    it(
      'should import and export a complete portable V1 snapshot',
      async () => {
        await service
          .importSnapshot(
            validSnapshot(),
          );

        const exported =
          await service
            .createSnapshot();

        expect(
          exported.formatVersion,
        ).toBe(1);

        expect(
          exported.exportedAtEpochMs,
        ).toBe(5000);

        expect(
          exported.universes,
        ).toHaveLength(1);

        expect(
          exported.universes[0]
            .discoveries,
        ).toHaveLength(1);

        expect(
          exported.universes[0]
            .observations,
        ).toHaveLength(1);

        expect(
          exported.universes[0]
            .progress,
        ).toHaveLength(2);
      },
    );

    it(
      'should export deterministic portable JSON',
      async () => {
        await service
          .importSnapshot(
            validSnapshot(),
          );

        const first =
          await service
            .exportJson();

        const second =
          await service
            .exportJson();

        expect(
          second,
        ).toBe(
          first,
        );

        expect(
          JSON.parse(
            first,
          ),
        ).toEqual(
          await service
            .createSnapshot(),
        );
      },
    );

    it(
      'should not export IndexedDB metadata or Ground Truth',
      async () => {
        await service
          .importSnapshot(
            validSnapshot(),
          );

        await database
          .metadata
          .put({
            key:
              'storage',

            schemaVersion:
              GENESIS_INDEXED_DB_SCHEMA_VERSION,

            storageFormatVersion:
              GENESIS_STORAGE_FORMAT_VERSION,

            updatedAtEpochMs:
              123,
          });

        const json =
          await service
            .exportJson();

        expect(
          json,
        ).not.toContain(
          '"metadata"',
        );

        expect(
          json,
        ).not.toContain(
          '"schemaVersion"',
        );

        expect(
          json,
        ).not.toContain(
          '"groundTruth"',
        );

        expect(
          json,
        ).not.toContain(
          '"physicalProperties"',
        );
      },
    );

    it(
      'should restore JSON round-trip exactly',
      async () => {
        const original =
          validSnapshot();

        await service
          .importJson(
            JSON.stringify(
              original,
            ),
          );

        const exported =
          await service
            .createSnapshot();

        expect({
          ...exported,

          exportedAtEpochMs:
            original
              .exportedAtEpochMs,
        }).toEqual(
          original,
        );
      },
    );

    it(
      'should reject malformed JSON',
      async () => {
        await expect(
          service
            .importJson(
              '{not-json',
            ),
        ).rejects.toBeInstanceOf(
          GenesisBackupValidationError,
        );
      },
    );

    it(
      'should reject unsupported backup versions',
      async () => {
        const snapshot =
          {
            ...validSnapshot(),

            formatVersion:
              999,
          };

        await expect(
          service
            .importSnapshot(
              snapshot,
            ),
        ).rejects.toBeInstanceOf(
          GenesisBackupValidationError,
        );
      },
    );

    it(
      'should reject unexpected root fields',
      async () => {
        const snapshot =
          {
            ...validSnapshot(),

            unexpected:
              true,
          };

        await expect(
          service
            .importSnapshot(
              snapshot,
            ),
        ).rejects.toBeInstanceOf(
          GenesisBackupValidationError,
        );
      },
    );

    it(
      'should reject duplicate universe identities',
      async () => {
        const base =
          validSnapshot();

        const snapshot =
          {
            ...base,

            universes:
              [
                base.universes[0],
                base.universes[0],
              ],
          };

        await expect(
          service
            .importSnapshot(
              snapshot,
            ),
        ).rejects.toBeInstanceOf(
          GenesisBackupValidationError,
        );
      },
    );

    it(
      'should reject malformed universe seeds',
      async () => {
        const base =
          validSnapshot();

        const snapshot =
          {
            ...base,

            universes: [
              {
                ...base
                  .universes[0],

                universeSeed:
                  'INVALID-SEED',
              },
            ],
          };

        await expect(
          service
            .importSnapshot(
              snapshot,
            ),
        ).rejects.toBeInstanceOf(
          GenesisBackupValidationError,
        );
      },
    );

    it(
      'should reject duplicate discoveries',
      async () => {
        const base =
          validSnapshot();

        const discovery =
          base
            .universes[0]
            .discoveries[0];

        const snapshot =
          {
            ...base,

            universes: [
              {
                ...base
                  .universes[0],

                discoveries:
                  [
                    discovery,
                    discovery,
                  ],
              },
            ],
          };

        await expect(
          service
            .importSnapshot(
              snapshot,
            ),
        ).rejects.toBeInstanceOf(
          GenesisBackupValidationError,
        );
      },
    );

    it(
      'should reject invalid procedural lineage',
      async () => {
        const base =
          validSnapshot();

        const discovery =
          base
            .universes[0]
            .discoveries[0];

        const snapshot =
          {
            ...base,

            universes: [
              {
                ...base
                  .universes[0],

                discoveries: [
                  {
                    ...discovery,

                    targetTypeCode:
                      5,

                    sectorKey:
                      null,

                    galacticObjectIndex:
                      null,

                    bodyIndex:
                      null,
                  },
                ],
              },
            ],
          };

        await expect(
          service
            .importSnapshot(
              snapshot,
            ),
        ).rejects.toBeInstanceOf(
          GenesisBackupValidationError,
        );
      },
    );

    it(
      'should reject targetSeed that disagrees with procedural identity',
      async () => {
        const base =
          validSnapshot();

        const discovery =
          base
            .universes[0]
            .discoveries[0];

        const snapshot =
          {
            ...base,

            universes: [
              {
                ...base
                  .universes[0],

                discoveries: [
                  {
                    ...discovery,

                    targetSeed:
                      'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
                  },
                ],
              },
            ],
          };

        await expect(
          service
            .importSnapshot(
              snapshot,
            ),
        ).rejects.toBeInstanceOf(
          GenesisBackupValidationError,
        );
      },
    );

    it(
      'should reject invalid progress representation',
      async () => {
        const base =
          validSnapshot();

        const progress =
          base
            .universes[0]
            .progress[1];

        const snapshot =
          {
            ...base,

            universes: [
              {
                ...base
                  .universes[0],

                progress: [
                  base
                    .universes[0]
                    .progress[0],

                  {
                    ...progress,

                    scopeKey:
                      '8',
                  },
                ],
              },
            ],
          };

        await expect(
          service
            .importSnapshot(
              snapshot,
            ),
        ).rejects.toBeInstanceOf(
          GenesisBackupValidationError,
        );
      },
    );

    it(
      'should reject invalid observation payload JSON',
      async () => {
        const base =
          validSnapshot();

        const observation =
          base
            .universes[0]
            .observations[0];

        const snapshot =
          {
            ...base,

            universes: [
              {
                ...base
                  .universes[0],

                observations: [
                  {
                    ...observation,

                    payloadJson:
                      '{broken',
                  },
                ],
              },
            ],
          };

        await expect(
          service
            .importSnapshot(
              snapshot,
            ),
        ).rejects.toBeInstanceOf(
          GenesisBackupValidationError,
        );
      },
    );

    it(
      'should validate completely before replacing local data',
      async () => {
        await service
          .importSnapshot(
            validSnapshot(),
          );

        const before =
          await database
            .universes
            .count();

        const invalid =
          {
            ...validSnapshot(),

            formatVersion:
              999,
          };

        await expect(
          service
            .importSnapshot(
              invalid,
            ),
        ).rejects.toBeInstanceOf(
          GenesisBackupValidationError,
        );

        expect(
          await database
            .universes
            .count(),
        ).toBe(
          before,
        );
      },
    );

    it(
      'should replace local game data atomically while preserving metadata',
      async () => {
        await database
          .openDatabase();

        await database
          .metadata
          .put({
            key:
              'storage',

            schemaVersion:
              GENESIS_INDEXED_DB_SCHEMA_VERSION,

            storageFormatVersion:
              GENESIS_STORAGE_FORMAT_VERSION,

            updatedAtEpochMs:
              777,
          });

        await database
          .universes
          .put({
            universeSeed:
              secondUniverseSeed,

            generatorVersionCode:
              1,

            createdAtEpochMs:
              1,

            updatedAtEpochMs:
              1,
          });

        await service
          .importSnapshot(
            validSnapshot(),
          );

        expect(
          await database
            .universes
            .count(),
        ).toBe(1);

        expect(
          await database
            .universes
            .get([
              universeSeed,
              1,
            ]),
        ).toBeDefined();

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
            GENESIS_INDEXED_DB_SCHEMA_VERSION,

          storageFormatVersion:
            GENESIS_STORAGE_FORMAT_VERSION,

          updatedAtEpochMs:
            777,
        });
      },
    );

    it(
      'should import an empty snapshot by clearing game data while preserving metadata',
      async () => {
        await service
          .importSnapshot(
            validSnapshot(),
          );

        await database
          .metadata
          .put({
            key:
              'storage',

            schemaVersion:
              GENESIS_INDEXED_DB_SCHEMA_VERSION,

            storageFormatVersion:
              GENESIS_STORAGE_FORMAT_VERSION,

            updatedAtEpochMs:
              888,
          });

        await service
          .importSnapshot({
            formatVersion:
              BackupFormatVersion.V1.code,

            exportedAtEpochMs:
              6000,

            universes:
              [],
          });

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
            .galaxies
            .count(),
        ).toBe(0);

        expect(
          await database
            .discoveries
            .count(),
        ).toBe(0);

        expect(
          await database
            .observations
            .count(),
        ).toBe(0);

        expect(
          await database
            .progress
            .count(),
        ).toBe(0);

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
            GENESIS_INDEXED_DB_SCHEMA_VERSION,

          storageFormatVersion:
            GENESIS_STORAGE_FORMAT_VERSION,

          updatedAtEpochMs:
            888,
        });
      },
    );

    it(
      'should export multiple universes in canonical identity order',
      async () => {
        const base =
          validSnapshot();

        const firstUniverse =
          base.universes[0];

        const secondUniverse =
          {
            ...firstUniverse,

            universeSeed:
              secondUniverseSeed,

            observations:
              firstUniverse
                .observations
                .map(
                  (
                    observation,
                  ) => ({
                    ...observation,

                    id:
                      'observation-2',
                  }),
                ),
          };

        await service
          .importSnapshot({
            ...base,

            universes: [
              secondUniverse,
              firstUniverse,
            ],
          });

        const exported =
          await service
            .createSnapshot();

        expect(
          exported
            .universes
            .map(
              (
                universe,
              ) =>
                universe
                  .universeSeed,
            ),
        ).toEqual([
          universeSeed,
          secondUniverseSeed,
        ]);
      },
    );

    it(
      'should export every collection in a stable canonical order',
      async () => {
        const base =
          validSnapshot();

        const galaxyDiscovery =
          createDiscovery(
            new GalaxyLocator(
              10n,
            ),
            110,
          );

        const sectorDiscovery =
          createDiscovery(
            new SectorLocator(
              0n,
              7n,
            ),
            120,
          );

        const systemDiscovery =
          createDiscovery(
            new SystemLocator(
              0n,
              123n,
              9n,
            ),
            130,
          );

        const galaxyTargetSeed =
          syntheticTargetSeed(
            new GalaxyLocator(
              0n,
            ),
          );

        const snapshot:
          GenesisBackupSnapshot =
          {
            ...base,

            universes: [
              {
                ...base
                  .universes[0],

                galaxies: [
                  {
                    galaxyIndex:
                      '10',

                    discoveryStateCode:
                      2,

                    firstKnownAtEpochMs:
                      110,

                    updatedAtEpochMs:
                      120,
                  },

                  {
                    galaxyIndex:
                      '2',

                    discoveryStateCode:
                      2,

                    firstKnownAtEpochMs:
                      110,

                    updatedAtEpochMs:
                      120,
                  },

                  {
                    galaxyIndex:
                      '7',

                    discoveryStateCode:
                      2,

                    firstKnownAtEpochMs:
                      110,

                    updatedAtEpochMs:
                      120,
                  },
                ],

                discoveries: [
                  systemDiscovery,
                  sectorDiscovery,
                  galaxyDiscovery,
                ],

                observations: [
                  {
                    id:
                      'z-observation',

                    targetTypeCode:
                      1,

                    targetSeed:
                      galaxyTargetSeed,

                    observationKind:
                      'test',

                    payloadVersion:
                      1,

                    payloadJson:
                      '{"order":"z"}',

                    observedAtEpochMs:
                      150,
                  },

                  {
                    id:
                      'a-observation',

                    targetTypeCode:
                      1,

                    targetSeed:
                      galaxyTargetSeed,

                    observationKind:
                      'test',

                    payloadVersion:
                      1,

                    payloadJson:
                      '{"order":"a"}',

                    observedAtEpochMs:
                      140,
                  },
                ],

                progress: [
                  {
                    scopeCode:
                      1,

                    scopeKey:
                      '2',

                    galaxyIndex:
                      '2',

                    discoveryPoints:
                      '20',

                    updatedAtEpochMs:
                      170,
                  },

                  {
                    scopeCode:
                      0,

                    scopeKey:
                      'GLOBAL',

                    galaxyIndex:
                      null,

                    discoveryPoints:
                      '500',

                    updatedAtEpochMs:
                      150,
                  },

                  {
                    scopeCode:
                      1,

                    scopeKey:
                      '10',

                    galaxyIndex:
                      '10',

                    discoveryPoints:
                      '100',

                    updatedAtEpochMs:
                      160,
                  },
                ],
              },
            ],
          };

        await service
          .importSnapshot(
            snapshot,
          );

        const exported =
          await service
            .createSnapshot();

        const universe =
          exported
            .universes[0];

        expect(
          universe
            .galaxies
            .map(
              (
                galaxy,
              ) =>
                galaxy
                  .galaxyIndex,
            ),
        ).toEqual([
          '2',
          '7',
          '10',
        ]);

        expect(
          universe
            .discoveries
            .map(
              (
                discovery,
              ) =>
                discovery
                  .targetTypeCode,
            ),
        ).toEqual([
          1,
          2,
          4,
        ]);

        expect(
          universe
            .observations
            .map(
              (
                observation,
              ) =>
                observation.id,
            ),
        ).toEqual([
          'a-observation',
          'z-observation',
        ]);

        expect(
          universe
            .progress
            .map(
              (
                progress,
              ) => [
                progress.scopeCode,
                progress.scopeKey,
              ],
            ),
        ).toEqual([
          [
            0,
            'GLOBAL',
          ],
          [
            1,
            '10',
          ],
          [
            1,
            '2',
          ],
        ]);
      },
    );

    function validSnapshot():
      GenesisBackupSnapshot {

      const locator =
        new GalaxyLocator(
          0n,
        );

      const targetSeed =
        syntheticTargetSeed(
          locator,
        );

      return {
        formatVersion:
          BackupFormatVersion.V1.code,

        exportedAtEpochMs:
          4000,

        universes: [
          {
            universeSeed,

            generatorVersionCode:
              1,

            createdAtEpochMs:
              100,

            updatedAtEpochMs:
              200,

            navigation: {
              activeGalaxyIndex:
                '7',

              recentGalaxyIndices:
                [
                  '3',
                  '7',
                ],

              updatedAtEpochMs:
                200,
            },

            galaxies: [
              {
                galaxyIndex:
                  '0',

                discoveryStateCode:
                  2,

                firstKnownAtEpochMs:
                  110,

                updatedAtEpochMs:
                  120,
              },
            ],

            discoveries: [
              {
                targetTypeCode:
                  1,

                targetSeed,

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
                  2,

                firstKnownAtEpochMs:
                  110,

                updatedAtEpochMs:
                  120,
              },
            ],

            observations: [
              {
                id:
                  'observation-1',

                targetTypeCode:
                  1,

                targetSeed,

                observationKind:
                  'test',

                payloadVersion:
                  1,

                payloadJson:
                  '{"signal":true}',

                observedAtEpochMs:
                  130,
              },
            ],

            progress: [
              {
                scopeCode:
                  0,

                scopeKey:
                  'GLOBAL',

                galaxyIndex:
                  null,

                discoveryPoints:
                  '500',

                updatedAtEpochMs:
                  150,
              },

              {
                scopeCode:
                  1,

                scopeKey:
                  '7',

                galaxyIndex:
                  '7',

                discoveryPoints:
                  '125',

                updatedAtEpochMs:
                  160,
              },
            ],
          },
        ],
      };
    }

    function createDiscovery(
      locator:
        ProceduralLocator,

      firstKnownAtEpochMs:
        number,
    ): GenesisBackupSnapshot['universes'][number]['discoveries'][number] {

      const targetType =
        DiscoveryTargetType
          .fromLocator(
            locator,
          );

      const common =
        {
          targetTypeCode:
            targetType.code,

          targetSeed:
            syntheticTargetSeed(
              locator,
            ),

          discoveryStateCode:
            2 as const,

          firstKnownAtEpochMs,

          updatedAtEpochMs:
            firstKnownAtEpochMs +
            1,
        };

      if (
        locator instanceof
        GalaxyLocator
      ) {
        return {
          ...common,

          galaxyIndex:
            locator
              .galaxyIndex
              .toString(
                10,
              ),

          sectorKey:
            null,

          galacticObjectIndex:
            null,

          bodyIndex:
            null,

          civilizationIndex:
            null,
        };
      }

      if (
        locator instanceof
        SectorLocator
      ) {
        return {
          ...common,

          galaxyIndex:
            locator
              .galaxyIndex
              .toString(
                10,
              ),

          sectorKey:
            locator
              .sectorKey
              .toString(
                10,
              ),

          galacticObjectIndex:
            null,

          bodyIndex:
            null,

          civilizationIndex:
            null,
        };
      }

      if (
        locator instanceof
        GalacticObjectLocator ||
        locator instanceof
        SystemLocator
      ) {
        return {
          ...common,

          galaxyIndex:
            locator
              .galaxyIndex
              .toString(
                10,
              ),

          sectorKey:
            locator
              .sectorKey
              .toString(
                10,
              ),

          galacticObjectIndex:
            locator
              .galacticObjectIndex
              .toString(
                10,
              ),

          bodyIndex:
            null,

          civilizationIndex:
            null,
        };
      }

      if (
        locator instanceof
        BodyLocator
      ) {
        return {
          ...common,

          galaxyIndex:
            locator
              .galaxyIndex
              .toString(
                10,
              ),

          sectorKey:
            locator
              .sectorKey
              .toString(
                10,
              ),

          galacticObjectIndex:
            locator
              .galacticObjectIndex
              .toString(
                10,
              ),

          bodyIndex:
            locator
              .bodyIndex
              .toString(
                10,
              ),

          civilizationIndex:
            null,
        };
      }

      if (
        locator instanceof
        CivilizationLocator
      ) {
        return {
          ...common,

          galaxyIndex:
            locator
              .galaxyIndex
              .toString(
                10,
              ),

          sectorKey:
            locator
              .sectorKey
              .toString(
                10,
              ),

          galacticObjectIndex:
            locator
              .galacticObjectIndex
              .toString(
                10,
              ),

          bodyIndex:
            locator
              .bodyIndex
              .toString(
                10,
              ),

          civilizationIndex:
            locator
              .civilizationIndex
              .toString(
                10,
              ),
        };
      }

      throw new TypeError(
        'Unsupported ProceduralLocator.',
      );
    }

    function syntheticTargetSeed(
      locator:
        ProceduralLocator,
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
        locator instanceof
        SectorLocator ||
        locator instanceof
        GalacticObjectLocator ||
        locator instanceof
        SystemLocator ||
        locator instanceof
        BodyLocator ||
        locator instanceof
        CivilizationLocator
      ) {
        mix(
          locator.sectorKey,
        );
      }

      if (
        locator instanceof
        GalacticObjectLocator ||
        locator instanceof
        SystemLocator ||
        locator instanceof
        BodyLocator ||
        locator instanceof
        CivilizationLocator
      ) {
        mix(
          locator
            .galacticObjectIndex,
        );
      }

      if (
        locator instanceof
        BodyLocator ||
        locator instanceof
        CivilizationLocator
      ) {
        mix(
          locator.bodyIndex,
        );
      }

      if (
        locator instanceof
        CivilizationLocator
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
    }
  },
);