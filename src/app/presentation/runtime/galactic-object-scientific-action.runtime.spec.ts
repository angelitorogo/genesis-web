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
  SystemLocator,
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
import { DexieScientificEvidenceRepository } from '../../data/local/repository/dexie-scientific-evidence.repository';

import {
  ObservationInstrumentCapabilityCatalogV1,
} from '../../simulation/observation/observation-instrument-capability-catalog';

import {
  ObservationInstrumentCatalogV1,
} from '../../simulation/observation/observation-instrument-catalog';

import {
  ACCRETION_DISK_EVIDENCE_CODE,
} from '../../simulation/observation/accretion-disk-observation-engine';

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

      locator: GalacticObjectLocator = remnantLocator,

      key: UniverseGenerationKey = generationKey,
    ): LeveledInstrumentObservationSession {

      const observatory =
        new Observatory(
          key,
        );

      const baseSession =
        new ObservationSession(
          observatory,
          locator,
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
      'should commit a V2 discovery atomically without touching the same-seed V1 universe and reject duplicate rewards',
      async () => {
        const v2 = new UniverseGenerationKey(generationKey.universeSeed, GeneratorVersion.V2);
        await universeRepository.createIfAbsent(v2);
        await pointsRepository.setGlobalDiscoveryPoints(v2, 0n);
        await discoveryRepository.setState(v2, remnantLocator, DiscoveryState.DETECTED);

        const observation = new ObservationSession(
          new Observatory(v2), remnantLocator, DiscoveryState.DETECTED,
        );
        const instrument = ObservationInstrumentCatalogV1.instrument(ObservationInstrumentType.X_RAY);
        const v2Session = new LeveledInstrumentObservationSession(
          new InstrumentObservationSession(observation, instrument),
          ObservationInstrumentCapabilityCatalogV1.profile(
            ObservationInstrumentType.X_RAY, ObservationInstrumentLevel.LEVEL_2,
          ),
        );

        const result = await runtime.commitAction(
          v2Session, GalacticObjectScientificActionType.EXTREME_OBJECT_SURVEY,
        );
        expect(result.actionResult.newDiscoveryState).toBe(DiscoveryState.DISCOVERED);
        expect(await discoveryRepository.getState(v2, remnantLocator)).toBe(DiscoveryState.DISCOVERED);
        expect(await pointsRepository.getGlobalDiscoveryPoints(v2)).toBe(24n);
        expect(await discoveryRepository.getState(generationKey, remnantLocator)).toBe(DiscoveryState.DETECTED);
        expect(await pointsRepository.getGlobalDiscoveryPoints(generationKey)).toBe(0n);

        await expect(runtime.commitAction(
          v2Session, GalacticObjectScientificActionType.EXTREME_OBJECT_SURVEY,
        )).rejects.toThrow(RangeError);
        expect(await pointsRepository.getGlobalDiscoveryPoints(v2)).toBe(24n);
      },
    );

    it('27.10 V2 atomically persists distinct real observation evidence and state/PD for the rare IMBH', async () => {
      const rare = new GalacticObjectLocator(0n, -73014444020n, 0n);
      // A previously catalogued stellar system and earned PD unlock L3 optical
      // and L4 radio. No hidden state, invented IMBH or instrument upgrades.
      await discoveryRepository.setState(generationKey,
        new SystemLocator(0n, 10n, 7n), DiscoveryState.CATALOGUED);
      await pointsRepository.setGlobalDiscoveryPoints(generationKey, 10_000n);
      await discoveryRepository.setState(generationKey, rare, DiscoveryState.DETECTED);
      const baseline = await pointsRepository.getGlobalDiscoveryPoints(generationKey);
      const evidenceRepo = new DexieScientificEvidenceRepository(database, TARGET_SEED_RESOLVER);
      const first = await runtime.commitAction(
        session(DiscoveryState.DETECTED, ObservationInstrumentType.RADIO,
          ObservationInstrumentLevel.LEVEL_2, rare),
        GalacticObjectScientificActionType.EXTREME_OBJECT_SURVEY,
      );
      expect(first.actionResult.newDiscoveryState).toBe(DiscoveryState.DISCOVERED);
      expect(await evidenceRepo.getEvidence(generationKey, rare)).toHaveLength(0);
      const second = await runtime.commitAction(
        session(DiscoveryState.DISCOVERED, ObservationInstrumentType.OPTICAL,
          ObservationInstrumentLevel.LEVEL_3, rare),
        GalacticObjectScientificActionType.IMBH_COMPACT_CHARACTERIZATION,
      );
      expect(second.actionResult.newDiscoveryState).toBe(DiscoveryState.CATALOGUED);
      expect(await discoveryRepository.getState(generationKey, rare)).toBe(DiscoveryState.CATALOGUED);
      const firstEvidence = await evidenceRepo.getEvidence(generationKey, rare);
      expect(firstEvidence).toHaveLength(1);
      expect(firstEvidence[0].evidenceCode).toBe('MULTIBAND_CHARACTERIZATION');
      const third = await runtime.commitAction(
        session(DiscoveryState.CATALOGUED, ObservationInstrumentType.RADIO,
          ObservationInstrumentLevel.LEVEL_4, rare),
        GalacticObjectScientificActionType.IMBH_INDEPENDENT_CONFIRMATION,
      );
      expect(third.actionResult.newDiscoveryState).toBe(DiscoveryState.CONFIRMED);
      expect(await discoveryRepository.getState(generationKey, rare)).toBe(DiscoveryState.CONFIRMED);
      const evidence = await evidenceRepo.getEvidence(generationKey, rare);
      expect(evidence).toHaveLength(2);
      expect(new Set(evidence.map(item => item.independenceKey)).size).toBe(2);
      expect(evidence.map(item => item.evidenceCode).sort()).toEqual([
        'INDEPENDENT_TEMPORAL_FOLLOWUP', 'MULTIBAND_CHARACTERIZATION',
      ]);
      expect(await pointsRepository.getGlobalDiscoveryPoints(generationKey)).toBe(
        baseline + BigInt(first.actionResult.awardedDiscoveryPoints +
          second.actionResult.awardedDiscoveryPoints + third.actionResult.awardedDiscoveryPoints),
      );
      const total = await pointsRepository.getGlobalDiscoveryPoints(generationKey);
      await expect(runtime.commitAction(
        session(DiscoveryState.DISCOVERED, ObservationInstrumentType.OPTICAL,
          ObservationInstrumentLevel.LEVEL_3, rare),
        GalacticObjectScientificActionType.IMBH_COMPACT_CHARACTERIZATION,
      )).rejects.toThrow(RangeError);
      expect(await pointsRepository.getGlobalDiscoveryPoints(generationKey)).toBe(total);
      expect(await evidenceRepo.getEvidence(generationKey, rare)).toEqual(evidence);
    });

    it('persists the two V2 active-nucleus stages from an existing DISCOVERED save without duplicating 28.1 evidence', async () => {
      const v2 = new UniverseGenerationKey(
        UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),
        GeneratorVersion.V2,
      );
      const centre = new GalacticObjectLocator(0n, 0n, 0n);
      const priorMilestone = new SystemLocator(0n, 10n, 7n);
      await universeRepository.createIfAbsent(v2);
      await pointsRepository.setGlobalDiscoveryPoints(v2, 10_000n);
      await discoveryRepository.setState(v2, priorMilestone, DiscoveryState.CATALOGUED);
      await discoveryRepository.setState(v2, centre, DiscoveryState.DISCOVERED);

      const evidenceRepo = new DexieScientificEvidenceRepository(database, TARGET_SEED_RESOLVER);
      const baseline = await pointsRepository.getGlobalDiscoveryPoints(v2);

      const characterize = await runtime.commitAction(
        session(
          DiscoveryState.DISCOVERED,
          ObservationInstrumentType.SPECTROSCOPY,
          ObservationInstrumentLevel.LEVEL_3,
          centre,
          v2,
        ),
        GalacticObjectScientificActionType.ACTIVE_NUCLEUS_MULTIBAND_CHARACTERIZATION,
      );
      expect(characterize.actionResult.newDiscoveryState).toBe(DiscoveryState.CATALOGUED);

      const confirm = await runtime.commitAction(
        session(
          DiscoveryState.CATALOGUED,
          ObservationInstrumentType.RADIO,
          ObservationInstrumentLevel.LEVEL_4,
          centre,
          v2,
        ),
        GalacticObjectScientificActionType.ACTIVE_NUCLEUS_INDEPENDENT_CONFIRMATION,
      );
      expect(confirm.actionResult.newDiscoveryState).toBe(DiscoveryState.CONFIRMED);
      expect(await discoveryRepository.getState(v2, centre)).toBe(DiscoveryState.CONFIRMED);
      expect(await pointsRepository.getGlobalDiscoveryPoints(v2)).toBe(baseline + 192n);

      const evidence = await evidenceRepo.getEvidence(v2, centre);
      expect(evidence.map(item => item.evidenceCode).sort()).toEqual([
        'INDEPENDENT_ACTIVITY_CONFIRMATION',
        'MULTIBAND_CHARACTERIZATION',
      ]);
      expect(new Set(evidence.map(item => item.independenceKey)).size).toBe(2);
      expect(evidence.some(item => item.evidenceCode === ACCRETION_DISK_EVIDENCE_CODE))
        .toBe(false);

      const total = await pointsRepository.getGlobalDiscoveryPoints(v2);
      await expect(runtime.commitAction(
        session(
          DiscoveryState.DISCOVERED,
          ObservationInstrumentType.SPECTROSCOPY,
          ObservationInstrumentLevel.LEVEL_3,
          centre,
          v2,
        ),
        GalacticObjectScientificActionType.ACTIVE_NUCLEUS_MULTIBAND_CHARACTERIZATION,
      )).rejects.toThrow(RangeError);
      expect(await pointsRepository.getGlobalDiscoveryPoints(v2)).toBe(total);
      expect(await evidenceRepo.getEvidence(v2, centre)).toEqual(evidence);
    });

    it('27.10 V2 rejects locked compact campaigns atomically without inventing observed evidence', async () => {
      const rare = new GalacticObjectLocator(0n, -73014444020n, 0n);
      await discoveryRepository.setState(generationKey, rare, DiscoveryState.DISCOVERED);
      const evidenceRepo = new DexieScientificEvidenceRepository(database, TARGET_SEED_RESOLVER);
      await expect(runtime.commitAction(
        session(DiscoveryState.DISCOVERED, ObservationInstrumentType.OPTICAL,
          ObservationInstrumentLevel.LEVEL_3, rare),
        GalacticObjectScientificActionType.IMBH_COMPACT_CHARACTERIZATION,
      )).rejects.toThrow(RangeError);
      expect(await discoveryRepository.getState(generationKey, rare)).toBe(DiscoveryState.DISCOVERED);
      expect(await pointsRepository.getGlobalDiscoveryPoints(generationKey)).toBe(0n);
      expect(await evidenceRepo.getEvidence(generationKey, rare)).toHaveLength(0);
    });

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
