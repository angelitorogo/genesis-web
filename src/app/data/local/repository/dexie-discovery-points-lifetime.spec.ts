import Dexie from 'dexie';

import {
  IDBKeyRange,
  indexedDB,
} from 'fake-indexeddb';

import {
  GeneratorVersion,
} from '../../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../../domain/generation/universe-generation-key';

import {
  UniverseSeed,
} from '../../../domain/universe/universe-seed';

import {
  GenesisIndexedDb,
} from '../indexed-db/genesis-indexed-db';

import {
  DexieUniverseRepository,
} from './dexie-universe.repository';

import {
  DexieDiscoveryPointsRepository,
} from './dexie-discovery-points.repository';

describe(
  'DexieDiscoveryPointsRepository lifetime-earned global PD',
  () => {
    const databaseName =
      'genesis-web-point-26-1-lifetime-earned-pd';

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

    let database:
      GenesisIndexedDb;

    let repository:
      DexieDiscoveryPointsRepository;

    beforeEach(
      async () => {
        database =
          new GenesisIndexedDb(
            databaseName,
            dependencies,
          );

        const universeRepository =
          new DexieUniverseRepository(
            database,
            () => 1000,
          );

        repository =
          new DexieDiscoveryPointsRepository(
            database,
            () => 1000,
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

    it(
      'should count only positive balance deltas as newly earned PD and never decrease lifetime progress on spends',
      async () => {
        await repository
          .setGlobalDiscoveryPoints(
            generationKey,
            250n,
          );

        expect(
          await repository
            .getLifetimeEarnedGlobalDiscoveryPoints(
              generationKey,
            ),
        ).toBe(
          250n,
        );

        await repository
          .setGlobalDiscoveryPoints(
            generationKey,
            50n,
          );

        expect(
          await repository
            .getGlobalDiscoveryPoints(
              generationKey,
            ),
        ).toBe(
          50n,
        );

        expect(
          await repository
            .getLifetimeEarnedGlobalDiscoveryPoints(
              generationKey,
            ),
        ).toBe(
          250n,
        );

        await repository
          .setGlobalDiscoveryPoints(
            generationKey,
            149n,
          );

        expect(
          await repository
            .getLifetimeEarnedGlobalDiscoveryPoints(
              generationKey,
            ),
        ).toBe(
          349n,
        );

        await repository
          .setGlobalDiscoveryPoints(
            generationKey,
            150n,
          );

        expect(
          await repository
            .getLifetimeEarnedGlobalDiscoveryPoints(
              generationKey,
            ),
        ).toBe(
          350n,
        );
      },
    );

    it(
      'should preserve PD earned before legacy lifetime reconciliation and add them to the proven historical floor exactly once',
      async () => {
        await repository
          .setGlobalDiscoveryPoints(
            generationKey,
            5n,
          );

        const key =
          [
            generationKey
              .universeSeed
              .serialize(),
            generationKey
              .generatorVersion
              .code,
            0,
            'GLOBAL',
          ] as const;

        const entity =
          await database
            .progress
            .get(
              key,
            );

        expect(
          entity,
        ).toBeDefined();

        if (
          entity ===
          undefined
        ) {
          throw new Error(
            'Global progress fixture must exist.',
          );
        }

        const legacy =
          {
            ...entity,
          } as
            typeof entity &
            {
              lifetimeEarnedDiscoveryPoints?:
                string;

              unreconciledLifetimeEarnedDiscoveryPoints?:
                string;
            };

        delete legacy
          .lifetimeEarnedDiscoveryPoints;
        delete legacy
          .unreconciledLifetimeEarnedDiscoveryPoints;

        await database
          .progress
          .put(
            legacy,
          );

        /*
         * These 100 PD are earned before /exploration (and therefore before the
         * external-search high-water mark can repair the legacy lifetime row).
         */
        await repository
          .setGlobalDiscoveryPoints(
            generationKey,
            104n,
          );

        await repository
          .setGlobalDiscoveryPoints(
            generationKey,
            105n,
          );

        expect(
          await repository
            .getLifetimeEarnedGlobalDiscoveryPoints(
              generationKey,
            ),
        ).toBe(
          105n,
        );

        const pending =
          await database
            .progress
            .get(
              key,
            ) as
              (typeof entity &
                {
                  unreconciledLifetimeEarnedDiscoveryPoints?:
                    string;
                }) |
              undefined;

        expect(
          pending
            ?.unreconciledLifetimeEarnedDiscoveryPoints,
        ).toBe(
          '100',
        );

        expect(
          await repository
            .ensureLifetimeEarnedGlobalDiscoveryPointsAtLeast(
              generationKey,
              700n,
            ),
        ).toBe(
          800n,
        );

        expect(
          await repository
            .getGlobalDiscoveryPoints(
              generationKey,
            ),
        ).toBe(
          105n,
        );

        expect(
          await repository
            .getLifetimeEarnedGlobalDiscoveryPoints(
              generationKey,
            ),
        ).toBe(
          800n,
        );

        const reconciled =
          await database
            .progress
            .get(
              key,
            ) as
              (typeof entity &
                {
                  lifetimeEarnedDiscoveryPoints?:
                    string;

                  unreconciledLifetimeEarnedDiscoveryPoints?:
                    string;
                }) |
              undefined;

        expect(
          reconciled
            ?.lifetimeEarnedDiscoveryPoints,
        ).toBe(
          '800',
        );

        expect(
          reconciled
            ?.unreconciledLifetimeEarnedDiscoveryPoints,
        ).toBeUndefined();
      },
    );
  },
);
