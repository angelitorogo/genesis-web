import Dexie from 'dexie';
import {
  IDBKeyRange,
  indexedDB,
} from 'fake-indexeddb';

import {
  ScientificEvidence,
} from '../../domain/discovery/scientific-evidence';

import {
  ExtremeType,
} from '../../domain/galactic-object/extreme-object-type';

import {
  GalacticObjectScientificSubject,
} from '../../domain/galactic-object/galactic-object-scientific-subject';

import {
  GalaxyLocator,
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
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GenesisIndexedDb,
} from '../../data/local/indexed-db/genesis-indexed-db';

import {
  DexieDiscoveryPointsRepository,
} from '../../data/local/repository/dexie-discovery-points.repository';

import {
  type ProceduralTargetSeedResolver,
} from '../../data/local/repository/dexie-discovery.repository';

import {
  DexieScientificEvidenceRepository,
} from '../../data/local/repository/dexie-scientific-evidence.repository';

import {
  DexieUniverseRepository,
} from '../../data/local/repository/dexie-universe.repository';

import {
  ACCRETION_DISK_EVIDENCE_CODE,
  ACCRETION_DISK_EVIDENCE_DIMENSION,
} from '../../simulation/observation/accretion-disk-observation-engine';

import {
  GRAVITATIONAL_LENSING_RECONSTRUCTION_EVIDENCE_CODE,
  GRAVITATIONAL_LENSING_RECONSTRUCTION_EVIDENCE_DIMENSION,
} from '../../simulation/observation/gravitational-lensing-reconstruction-observation-engine';

import {
  MAGNETAR_ACTIVITY_EVIDENCE_CODE,
  MAGNETAR_ACTIVITY_EVIDENCE_DIMENSION,
} from '../../simulation/observation/magnetar-activity-observation-engine';

import {
  PULSAR_TIMING_EVIDENCE_CODE,
  PULSAR_TIMING_EVIDENCE_DIMENSION,
} from '../../simulation/observation/pulsar-timing-observation-engine';

import {
  RELATIVISTIC_JET_ANALYSIS_EVIDENCE_CODE,
  RELATIVISTIC_JET_ANALYSIS_EVIDENCE_DIMENSION,
} from '../../simulation/observation/relativistic-jet-analysis-observation-engine';

import {
  ProceduralTargetResolver,
} from '../../simulation/regeneration/procedural-target-resolver';

import {
  DexieExtremeScientificCompletionRuntime,
} from './extreme-scientific-completion.runtime';

const dependencies =
  {
    indexedDB,
    IDBKeyRange,
  };

const key =
  new UniverseGenerationKey(
    UniverseSeed.parse(
      'A2B4-C6D8-E0F1-2345-6789-ABCD-EF01-1357',
    ),
    GeneratorVersion.V2,
  );

const resolver:
  ProceduralTargetSeedResolver =
  {
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
  };

function evidence(
  dimensionCode:
    string,

  evidenceCode:
    string,
): ScientificEvidence {
  return new ScientificEvidence({
    dimensionCode,
    evidenceCode,
    sourceKey:
      `${dimensionCode}:SPEC`,
    independenceKey:
      `${dimensionCode}:SPEC_INDEPENDENT`,
    quality01:
      1,
    uncertainty01:
      0,
    observedAtEpochMs:
      1000,
  });
}

describe(
  '28.7 persisted extreme scientific completion runtime',
  () => {
    const databaseName =
      'genesis-phase-28-7-extreme-scientific-completion';

    let database:
      GenesisIndexedDb;

    let points:
      DexieDiscoveryPointsRepository;

    let scientificEvidence:
      DexieScientificEvidenceRepository;

    let runtime:
      DexieExtremeScientificCompletionRuntime;

    beforeEach(
      async () => {
        database =
          new GenesisIndexedDb(
            databaseName,
            dependencies,
          );

        points =
          new DexieDiscoveryPointsRepository(
            database,
            () =>
              2000,
          );

        scientificEvidence =
          new DexieScientificEvidenceRepository(
            database,
            resolver,
          );

        runtime =
          new DexieExtremeScientificCompletionRuntime(
            database,
            resolver,
            () =>
              2000,
          );

        await new DexieUniverseRepository(
          database,
          () =>
            1000,
        )
          .createIfAbsent(
            key,
          );

        await points
          .setGlobalDiscoveryPoints(
            key,
            1000n,
          );
      },
    );

    afterEach(
      async () => {
        database.closeDatabase();
        await new Dexie(
          databaseName,
          dependencies,
        ).delete();
      },
    );

    it(
      'awards a pulsar completion exactly once and persists the reward marker',
      async () => {
        const locator =
          new GalacticObjectLocator(
            1n,
            20n,
            3n,
          );

        await scientificEvidence
          .recordEvidence(
            key,
            locator,
            evidence(
              PULSAR_TIMING_EVIDENCE_DIMENSION,
              PULSAR_TIMING_EVIDENCE_CODE,
            ),
          );

        const first =
          await runtime
            .settle(
              key,
              locator,
              ExtremeType.PULSAR,
              GalacticObjectScientificSubject.DISTRIBUTED_EXTREME_OBJECT,
            );

        expect(first?.complete).toBe(true);
        expect(first?.rewardGranted).toBe(true);
        expect(first?.rewardGrantedNow).toBe(true);
        expect(first?.rewardDiscoveryPoints).toBe(150n);
        expect(
          await points.getGlobalDiscoveryPoints(key),
        ).toBe(1150n);

        const second =
          await runtime
            .settle(
              key,
              locator,
              ExtremeType.PULSAR,
              GalacticObjectScientificSubject.DISTRIBUTED_EXTREME_OBJECT,
            );

        expect(second?.rewardGrantedNow).toBe(false);
        expect(
          await points.getGlobalDiscoveryPoints(key),
        ).toBe(1150n);

        expect(second?.rewardGranted).toBe(true);
        expect(second?.rewardDiscoveryPoints).toBe(150n);
      },
    );

    it(
      'does not reward a magnetar until timing and magnetic monitoring are both persisted',
      async () => {
        const locator =
          new GalacticObjectLocator(
            2n,
            30n,
            4n,
          );

        await scientificEvidence.recordEvidence(
          key,
          locator,
          evidence(
            PULSAR_TIMING_EVIDENCE_DIMENSION,
            PULSAR_TIMING_EVIDENCE_CODE,
          ),
        );

        const partial =
          await runtime.settle(
            key,
            locator,
            ExtremeType.MAGNETAR,
            GalacticObjectScientificSubject.DISTRIBUTED_EXTREME_OBJECT,
          );

        expect(partial?.complete).toBe(false);
        expect(partial?.completedStudies).toBe(1);
        expect(partial?.totalStudies).toBe(2);
        expect(await points.getGlobalDiscoveryPoints(key)).toBe(1000n);

        await scientificEvidence.recordEvidence(
          key,
          locator,
          evidence(
            MAGNETAR_ACTIVITY_EVIDENCE_DIMENSION,
            MAGNETAR_ACTIVITY_EVIDENCE_CODE,
          ),
        );

        const complete =
          await runtime.settle(
            key,
            locator,
            ExtremeType.MAGNETAR,
            GalacticObjectScientificSubject.DISTRIBUTED_EXTREME_OBJECT,
          );

        expect(complete?.complete).toBe(true);
        expect(complete?.rewardDiscoveryPoints).toBe(350n);
        expect(await points.getGlobalDiscoveryPoints(key)).toBe(1350n);
      },
    );

    it(
      'requires galaxy disk evidence plus target horizon/jet/lensing evidence for an active AGN',
      async () => {
        const locator =
          new GalacticObjectLocator(
            3n,
            0n,
            0n,
          );

        await scientificEvidence.recordEvidence(
          key,
          new GalaxyLocator(3n),
          evidence(
            ACCRETION_DISK_EVIDENCE_DIMENSION,
            ACCRETION_DISK_EVIDENCE_CODE,
          ),
        );

        await runtime
          .recordEventHorizonSimulationCompletion(
            key,
            locator,
          );

        for (
          const [
            dimension,
            code,
          ]
          of [
            [
              RELATIVISTIC_JET_ANALYSIS_EVIDENCE_DIMENSION,
              RELATIVISTIC_JET_ANALYSIS_EVIDENCE_CODE,
            ],
            [
              GRAVITATIONAL_LENSING_RECONSTRUCTION_EVIDENCE_DIMENSION,
              GRAVITATIONAL_LENSING_RECONSTRUCTION_EVIDENCE_CODE,
            ],
          ] as const
        ) {
          await scientificEvidence.recordEvidence(
            key,
            locator,
            evidence(
              dimension,
              code,
            ),
          );
        }

        const status =
          await runtime.settle(
            key,
            locator,
            ExtremeType.AGN,
            GalacticObjectScientificSubject.ACTIVE_GALACTIC_NUCLEUS,
          );

        expect(status?.complete).toBe(true);
        expect(status?.completedStudies).toBe(4);
        expect(status?.rewardDiscoveryPoints).toBe(750n);
        expect(await points.getGlobalDiscoveryPoints(key)).toBe(1750n);
      },
    );

    it(
      'persists the 28.2 exterior-simulation completion marker idempotently without changing physics or PD',
      async () => {
        const locator =
          new GalacticObjectLocator(
            4n,
            50n,
            5n,
          );

        await runtime.recordEventHorizonSimulationCompletion(key, locator);
        await runtime.recordEventHorizonSimulationCompletion(key, locator);

        const ledgerEntries =
          await database
            .observations
            .where('observationKind')
            .equals('EXTREME_SCIENTIFIC_COMPLETION_V1')
            .toArray();

        expect(
          ledgerEntries.filter(
            item =>
              item.payloadJson.includes('EVENT_HORIZON_COMPLETED'),
          ),
        ).toHaveLength(1);
        expect(await points.getGlobalDiscoveryPoints(key)).toBe(1000n);
      },
    );
  },
);
