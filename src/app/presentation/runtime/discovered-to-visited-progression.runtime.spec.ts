import Dexie from 'dexie';

import {
  IDBKeyRange,
  indexedDB,
} from 'fake-indexeddb';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  DiscoveredToVisitedEntryKind,
} from '../../domain/discovery/discovered-to-visited-entry';

import {
  type ProceduralLocator,
  SystemLocator,
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
  DexieDiscoveredToVisitedProgressionRuntime,
} from './discovered-to-visited-progression.runtime';

const TARGET_SEED_RESOLVER:
  ProceduralTargetSeedResolver =
  Object.freeze({
    resolveTargetSeedNormalized(
      _generationKey:
        UniverseGenerationKey,

      locator:
        ProceduralLocator,
    ): string {

      const ordinal =
        'galacticObjectIndex' in
          locator
          ? locator
              .galacticObjectIndex
          : locator
              .galaxyIndex;

      return (
        ordinal +
        1n
      )
        .toString(
          16,
        )
        .toUpperCase()
        .padStart(
          32,
          '0',
        );
    },
  });

describe(
  'DexieDiscoveredToVisitedProgressionRuntime point 26.A.4',
  () => {
    const databaseName =
      'genesis-web-point-26-A-4-discovered-visited';

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

    const discoveredLocator =
      new SystemLocator(
        0n,
        10n,
        7n,
      );

    const detectedLocator =
      new SystemLocator(
        0n,
        10n,
        8n,
      );

    const unknownLocator =
      new SystemLocator(
        0n,
        10n,
        9n,
      );

    let database:
      GenesisIndexedDb;

    let universeRepository:
      DexieUniverseRepository;

    let discoveryRepository:
      DexieDiscoveryRepository;

    let pointsRepository:
      DexieDiscoveryPointsRepository;

    let runtime:
      DexieDiscoveredToVisitedProgressionRuntime;

    let now:
      number;

    beforeEach(
      async () => {
        now =
          1000;

        database =
          new GenesisIndexedDb(
            databaseName,
            dependencies,
          );

        universeRepository =
          new DexieUniverseRepository(
            database,
            () => now,
          );

        discoveryRepository =
          new DexieDiscoveryRepository(
            database,
            TARGET_SEED_RESOLVER,
            () => now,
          );

        pointsRepository =
          new DexieDiscoveryPointsRepository(
            database,
            () => now,
          );

        runtime =
          new DexieDiscoveredToVisitedProgressionRuntime(
            database,
            discoveryRepository,
          );

        await universeRepository
          .createIfAbsent(
            generationKey,
          );

        await discoveryRepository
          .setState(
            generationKey,
            discoveredLocator,
            DiscoveryState.DISCOVERED,
          );

        await discoveryRepository
          .setState(
            generationKey,
            detectedLocator,
            DiscoveryState.DETECTED,
          );

        await pointsRepository
          .setGlobalDiscoveryPoints(
            generationKey,
            500n,
          );

        await pointsRepository
          .setGalaxyDiscoveryPoints(
            generationKey,
            0n,
            75n,
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

    it(
      'should persist the first DISCOVERED scene entry exactly as VISITED',
      async () => {
        now =
          2000;

        const committed =
          await runtime
            .recordEntry(
              generationKey,
              discoveredLocator,
              DiscoveredToVisitedEntryKind
                .SCENE,
            );

        expect(
          committed.stateBefore,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );

        expect(
          committed.stateAfter,
        ).toBe(
          DiscoveryState.VISITED,
        );

        expect(
          committed.isVisitEligible,
        ).toBe(true);

        expect(
          committed.didAdvance,
        ).toBe(true);

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              discoveredLocator,
            ),
        ).toBe(
          DiscoveryState.VISITED,
        );
      },
    );

    it(
      'should allow a detailed card to be the first visit trigger as an alternative to the scene',
      async () => {
        const committed =
          await runtime
            .recordEntry(
              generationKey,
              discoveredLocator,
              DiscoveredToVisitedEntryKind
                .DETAILED_CARD,
            );

        expect(
          committed.entryKind,
        ).toBe(
          DiscoveredToVisitedEntryKind
            .DETAILED_CARD,
        );

        expect(
          committed.stateAfter,
        ).toBe(
          DiscoveryState.VISITED,
        );
      },
    );

    it(
      'should persist the first interaction once and keep later entries idempotent',
      async () => {
        now =
          2000;

        await runtime
          .recordEntry(
            generationKey,
            discoveredLocator,
            DiscoveredToVisitedEntryKind
              .SCENE,
          );

        const afterFirst =
          (
            await database
              .discoveries
              .toArray()
          )
            .find(
              entity =>
                entity.galacticObjectIndex ===
                '7',
            );

        expect(
          afterFirst
            ?.firstKnownAtEpochMs,
        ).toBe(1000);

        expect(
          afterFirst
            ?.updatedAtEpochMs,
        ).toBe(2000);

        now =
          3000;

        const replay =
          await runtime
            .recordEntry(
              generationKey,
              discoveredLocator,
              DiscoveredToVisitedEntryKind
                .DETAILED_CARD,
            );

        expect(
          replay.stateBefore,
        ).toBe(
          DiscoveryState.VISITED,
        );

        expect(
          replay.stateAfter,
        ).toBe(
          DiscoveryState.VISITED,
        );

        expect(
          replay.didAdvance,
        ).toBe(false);

        const afterReplay =
          (
            await database
              .discoveries
              .toArray()
          )
            .find(
              entity =>
                entity.galacticObjectIndex ===
                '7',
            );

        expect(
          afterReplay
            ?.updatedAtEpochMs,
        ).toBe(2000);
      },
    );

    it(
      'should keep DETECTED unchanged when its unresolved scene is opened',
      async () => {
        now =
          2000;

        const committed =
          await runtime
            .recordEntry(
              generationKey,
              detectedLocator,
              DiscoveredToVisitedEntryKind
                .SCENE,
            );

        expect(
          committed.stateBefore,
        ).toBe(
          DiscoveryState.DETECTED,
        );

        expect(
          committed.stateAfter,
        ).toBe(
          DiscoveryState.DETECTED,
        );

        expect(
          committed.isVisitEligible,
        ).toBe(false);

        expect(
          committed.didAdvance,
        ).toBe(false);

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              detectedLocator,
            ),
        ).toBe(
          DiscoveryState.DETECTED,
        );
      },
    );

    it(
      'should reject UNKNOWN and leave both discoveries and observations unmaterialized for that target',
      async () => {
        const observationCountBefore =
          await database
            .observations
            .count();

        await expect(
          runtime
            .recordEntry(
              generationKey,
              unknownLocator,
              DiscoveredToVisitedEntryKind
                .DETAILED_CARD,
            ),
        ).rejects.toThrow(
          /UNKNOWN/,
        );

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              unknownLocator,
            ),
        ).toBe(
          DiscoveryState.UNKNOWN,
        );

        expect(
          await database
            .observations
            .count(),
        ).toBe(
          observationCountBefore,
        );
      },
    );

    it(
      'should not spend or award PD and should not create scientific evidence when recording VISITED',
      async () => {
        const observationCountBefore =
          await database
            .observations
            .count();

        await runtime
          .recordEntry(
            generationKey,
            discoveredLocator,
            DiscoveredToVisitedEntryKind
              .SCENE,
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
              0n,
            ),
        ).toBe(75n);

        expect(
          await database
            .observations
            .count(),
        ).toBe(
          observationCountBefore,
        );
      },
    );

    it(
      'should preserve CATALOGUED and CONFIRMED without regression on later entries',
      async () => {
        for (
          const state
          of [
            DiscoveryState.CATALOGUED,
            DiscoveryState.CONFIRMED,
          ]
        ) {
          now +=
            1000;

          await discoveryRepository
            .setState(
              generationKey,
              discoveredLocator,
              state,
            );

          const committed =
            await runtime
              .recordEntry(
                generationKey,
                discoveredLocator,
                DiscoveredToVisitedEntryKind
                  .SCENE,
              );

          expect(
            committed.stateBefore,
          ).toBe(
            state,
          );

          expect(
            committed.stateAfter,
          ).toBe(
            state,
          );

          expect(
            committed.didAdvance,
          ).toBe(false);
        }
      },
    );

    it(
      'should preserve VISITED across a database close and reopen cycle',
      async () => {
        await runtime
          .recordEntry(
            generationKey,
            discoveredLocator,
            DiscoveredToVisitedEntryKind
              .SCENE,
          );

        database.closeDatabase();

        database =
          new GenesisIndexedDb(
            databaseName,
            dependencies,
          );

        discoveryRepository =
          new DexieDiscoveryRepository(
            database,
            TARGET_SEED_RESOLVER,
            () => 4000,
          );

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              discoveredLocator,
            ),
        ).toBe(
          DiscoveryState.VISITED,
        );
      },
    );
  },
);
