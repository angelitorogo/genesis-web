import Dexie from 'dexie';

import {
  IDBKeyRange,
  indexedDB,
} from 'fake-indexeddb';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

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
  InstrumentObservationSession,
  ObservationInstrumentType,
} from '../../domain/observation/observation-instrument';

import {
  LeveledInstrumentObservationSession,
  ObservationInstrumentLevel,
} from '../../domain/observation/observation-instrument-capability';

import {
  ObservationSession,
  Observatory,
} from '../../domain/observation/observatory';

import {
  type StellarSystemScientificActionResult,
  StellarSystemScientificActionType,
} from '../../domain/planetary/stellar-system-scientific-action';

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
  ObservationInstrumentCapabilityCatalogV1,
} from '../../simulation/observation/observation-instrument-capability-catalog';

import {
  ObservationInstrumentCatalogV1,
} from '../../simulation/observation/observation-instrument-catalog';

import {
  StellarSystemScientificActionEngine,
} from '../../simulation/planetary/stellar-system-scientific-action-engine';

import {
  ProceduralTargetResolver,
} from '../../simulation/regeneration/procedural-target-resolver';

import {
  DexieStellarSystemScientificActionRuntime,
} from './stellar-system-scientific-action.runtime';

const TARGET_SEED_RESOLVER:
  ProceduralTargetSeedResolver =
  Object.freeze({
    resolveTargetSeedNormalized(
      generationKey:
        UniverseGenerationKey,

      locator:
        ProceduralLocator,
    ): string {

      return ProceduralTargetResolver
        .resolveTargetSeed(
          generationKey,
          locator,
        )
        .normalizedValue;
    },
  });

describe(
  'DexieStellarSystemScientificActionRuntime',
  () => {
    const databaseName =
      'genesis-web-point-17-6-analyze-disk-runtime';

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

    const locator =
      new SystemLocator(
        0n,
        0n,
        5n,
      );

    let database:
      GenesisIndexedDb;

    let pointsRepository:
      DexieDiscoveryPointsRepository;

    let discoveryRepository:
      DexieDiscoveryRepository;

    let runtime:
      DexieStellarSystemScientificActionRuntime;

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

        pointsRepository =
          new DexieDiscoveryPointsRepository(
            database,
            () => 1000,
          );

        discoveryRepository =
          new DexieDiscoveryRepository(
            database,
            TARGET_SEED_RESOLVER,
            () => 1000,
          );

        runtime =
          new DexieStellarSystemScientificActionRuntime(
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
            1000n,
          );

        await discoveryRepository
          .setState(
            generationKey,
            locator,
            DiscoveryState.CATALOGUED,
          );
      },
    );

    afterEach(
      async () => {
        vi.restoreAllMocks();

        database.closeDatabase();

        const cleanup =
          new Dexie(
            databaseName,
            dependencies,
          );

        await cleanup.delete();
      },
    );

    function session():
      LeveledInstrumentObservationSession {

      return new LeveledInstrumentObservationSession(
        new InstrumentObservationSession(
          new ObservationSession(
            new Observatory(
              generationKey,
            ),
            locator,
            DiscoveryState.CATALOGUED,
          ),
          ObservationInstrumentCatalogV1
            .instrument(
              ObservationInstrumentType.INFRARED,
            ),
        ),
        ObservationInstrumentCapabilityCatalogV1
          .profile(
            ObservationInstrumentType.INFRARED,
            ObservationInstrumentLevel.LEVEL_2,
          ),
      );
    }

    it(
      'should atomically persist CONFIRMED and the exact pure-engine PD delta without persisting the analysis report',
      async () => {
        const actionResult =
          {
            newDiscoveryState:
              DiscoveryState.CONFIRMED,
            awardedDiscoveryPoints:
              48,
          } as unknown as
            StellarSystemScientificActionResult;

        vi.spyOn(
          StellarSystemScientificActionEngine,
          'evaluate',
        ).mockReturnValue(
          actionResult,
        );

        const committed =
          await runtime
            .commitAction(
              session(),
              StellarSystemScientificActionType.ANALYZE_DISK,
            );

        expect(
          committed.globalDiscoveryPointsBefore,
        ).toBe(1000n);

        expect(
          committed.globalDiscoveryPointsAfter,
        ).toBe(1048n);

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              locator,
            ),
        ).toBe(
          DiscoveryState.CONFIRMED,
        );
      },
    );

    it(
      'should re-read persisted state before evaluation',
      async () => {
        await discoveryRepository
          .setState(
            generationKey,
            locator,
            DiscoveryState.DISCOVERED,
          );

        const spy =
          vi.spyOn(
            StellarSystemScientificActionEngine,
            'evaluate',
          );

        await expect(
          runtime.commitAction(
            session(),
            StellarSystemScientificActionType.ANALYZE_DISK,
          ),
        ).rejects.toThrowError(
          /requires a persisted system at DiscoveryState.CATALOGUED/,
        );

        expect(
          spy,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
