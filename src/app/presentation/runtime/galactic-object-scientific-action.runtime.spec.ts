import Dexie from 'dexie';

import {
  IDBKeyRange,
  indexedDB,
} from 'fake-indexeddb';

import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  GalacticObjectScientificActionType,
} from '../../domain/galactic-object/galactic-object-scientific-action';

import {
  GalacticObjectLocator,
  type ProceduralLocator,
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
  SupernovaRemnantGenerator,
} from '../../simulation/galactic-object/supernova-remnant-generator';

import {
  ProceduralTargetResolver,
} from '../../simulation/regeneration/procedural-target-resolver';

import {
  DexieGalacticObjectScientificActionRuntime,
} from './galactic-object-scientific-action.runtime';

const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

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
  'DexieGalacticObjectScientificActionRuntime',
  () => {
    const databaseName =
      'genesis-web-point-12-7-scientific-action-runtime';

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

    const remnantLocator =
      findPersistentSupernovaRemnantLocator(
        generationKey,
      );

    let database:
      GenesisIndexedDb;

    let universeRepository:
      DexieUniverseRepository;

    let pointsRepository:
      DexieDiscoveryPointsRepository;

    let discoveryRepository:
      DexieDiscoveryRepository;

    let runtime:
      DexieGalacticObjectScientificActionRuntime;

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
            TARGET_SEED_RESOLVER,
            () => 1000,
          );

        runtime =
          new DexieGalacticObjectScientificActionRuntime(
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
            remnantLocator,
            DiscoveryState.DETECTED,
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

    function session(
      state:
        DiscoveryStateValue,

      instrumentType:
        ObservationInstrumentType,

      level:
        ObservationInstrumentLevel,
    ): LeveledInstrumentObservationSession {

      const observatory =
        new Observatory(
          generationKey,
        );

      const baseSession =
        new ObservationSession(
          observatory,
          remnantLocator,
          state,
        );

      const instrument =
        ObservationInstrumentCatalogV1
          .instrument(
            instrumentType,
          );

      return new LeveledInstrumentObservationSession(
        new InstrumentObservationSession(
          baseSession,
          instrument,
        ),
        ObservationInstrumentCapabilityCatalogV1
          .profile(
            instrumentType,
            level,
          ),
      );
    }

    it(
      'should atomically persist a scientific survey and its canonical 24 PD reward',
      async () => {
        const committed =
          await runtime
            .commitAction(
              session(
                DiscoveryState.DETECTED,
                ObservationInstrumentType.X_RAY,
                ObservationInstrumentLevel.LEVEL_2,
              ),
              GalacticObjectScientificActionType.EXTREME_OBJECT_SURVEY,
            );

        expect(
          committed.actionResult.newDiscoveryState,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );

        expect(
          committed.globalDiscoveryPointsBefore,
        ).toBe(0n);

        expect(
          committed.globalDiscoveryPointsAfter,
        ).toBe(24n);

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              remnantLocator,
            ),
        ).toBe(
          DiscoveryState.DISCOVERED,
        );
      },
    );

    it(
      'should persist the complete remnant scientific chain to CONFIRMED for exactly 216 additional PD from DETECTED',
      async () => {
        await runtime
          .commitAction(
            session(
              DiscoveryState.DETECTED,
              ObservationInstrumentType.X_RAY,
              ObservationInstrumentLevel.LEVEL_2,
            ),
            GalacticObjectScientificActionType.EXTREME_OBJECT_SURVEY,
          );

        await runtime
          .commitAction(
            session(
              DiscoveryState.DISCOVERED,
              ObservationInstrumentType.SPECTROSCOPY,
              ObservationInstrumentLevel.LEVEL_3,
            ),
            GalacticObjectScientificActionType.SUPERNOVA_REMNANT_SHOCK_CHARACTERIZATION,
          );

        const committed =
          await runtime
            .commitAction(
              session(
                DiscoveryState.CATALOGUED,
                ObservationInstrumentType.RADIO,
                ObservationInstrumentLevel.LEVEL_4,
              ),
              GalacticObjectScientificActionType.SUPERNOVA_REMNANT_EVOLUTION_CONFIRMATION,
            );

        expect(
          committed.actionResult.newDiscoveryState,
        ).toBe(
          DiscoveryState.CONFIRMED,
        );

        expect(
          await pointsRepository
            .getGlobalDiscoveryPoints(
              generationKey,
            ),
        ).toBe(216n);

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              remnantLocator,
            ),
        ).toBe(
          DiscoveryState.CONFIRMED,
        );
      },
    );

    it(
      'should re-read persisted state so a stale session cannot farm the same action twice',
      async () => {
        const staleSession =
          session(
            DiscoveryState.DETECTED,
            ObservationInstrumentType.X_RAY,
            ObservationInstrumentLevel.LEVEL_2,
          );

        await runtime
          .commitAction(
            staleSession,
            GalacticObjectScientificActionType.EXTREME_OBJECT_SURVEY,
          );

        await expect(
          runtime
            .commitAction(
              staleSession,
              GalacticObjectScientificActionType.EXTREME_OBJECT_SURVEY,
            ),
        ).rejects.toThrow(
          RangeError,
        );

        expect(
          await pointsRepository
            .getGlobalDiscoveryPoints(
              generationKey,
            ),
        ).toBe(24n);
      },
    );

    it(
      'should reject signed-Long PD overflow without advancing persisted discovery state',
      async () => {
        await pointsRepository
          .setGlobalDiscoveryPoints(
            generationKey,
            SIGNED_LONG_MAX,
          );

        await expect(
          runtime
            .commitAction(
              session(
                DiscoveryState.DETECTED,
                ObservationInstrumentType.X_RAY,
                ObservationInstrumentLevel.LEVEL_2,
              ),
              GalacticObjectScientificActionType.EXTREME_OBJECT_SURVEY,
            ),
        ).rejects.toThrow(
          RangeError,
        );

        expect(
          await discoveryRepository
            .getState(
              generationKey,
              remnantLocator,
            ),
        ).toBe(
          DiscoveryState.DETECTED,
        );

        expect(
          await pointsRepository
            .getGlobalDiscoveryPoints(
              generationKey,
            ),
        ).toBe(
          SIGNED_LONG_MAX,
        );
      },
    );
  },
);

function findPersistentSupernovaRemnantLocator(
  generationKey:
    UniverseGenerationKey,
): GalacticObjectLocator {

  for (
    let index =
      1n;
    index <
      2_048n;
    index +=
      1n
  ) {
    const candidate =
      new GalacticObjectLocator(
        0n,
        0n,
        index,
      );

    if (
      SupernovaRemnantGenerator
        .isSupernovaRemnantLocator(
          generationKey,
          candidate,
        )
    ) {
      return candidate;
    }
  }

  throw new RangeError(
    'Missing deterministic persistent supernova-remnant test locator outside the reserved galactic nucleus object.',
  );
}
