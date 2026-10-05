import Dexie from 'dexie';
import {
  IDBKeyRange,
  indexedDB,
} from 'fake-indexeddb';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  BodyLocator,
  GalacticObjectLocator,
  SystemLocator,
  type ProceduralLocator,
} from '../../domain/generation/procedural-locator';

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
  DexieScientificEvidenceRepository,
} from '../../data/local/repository/dexie-scientific-evidence.repository';

import {
  DexieUniverseRepository,
} from '../../data/local/repository/dexie-universe.repository';

import {
  GravitationalLensingReconstructionProfileEngine,
} from '../../simulation/galactic-object/gravitational-lensing-reconstruction-profile-engine';

import {
  ProceduralTargetResolver,
} from '../../simulation/regeneration/procedural-target-resolver';

import {
  DexieGravitationalLensingReconstructionObservationRuntime,
} from './gravitational-lensing-reconstruction-observation.runtime';

const dependencies =
  {
    indexedDB,
    IDBKeyRange,
  };

const key =
  new UniverseGenerationKey(
    UniverseSeed.parse(
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
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

      if (
        locator instanceof
          BodyLocator
      ) {
        return [
          locator.galaxyIndex,
          locator.sectorKey,
          locator.galacticObjectIndex,
          locator.bodyIndex,
        ]
          .map(
            value =>
              BigInt
                .asUintN(
                  32,
                  value,
                )
                .toString(
                  16,
                )
                .padStart(
                  8,
                  '0',
                ),
          )
          .join(
            '',
          );
      }

      return ProceduralTargetResolver
        .resolveTargetSeed(
          generationKey,
          locator,
        )
        .normalizedValue;
    },
  };

const lens =
  findActiveNucleus();

describe(
  '28.6 persisted gravitational-lensing reconstruction runtime',
  () => {
    const databaseName =
      'genesis-phase-28-6-gravitational-lensing-runtime';

    let database:
      GenesisIndexedDb;

    let discoveries:
      DexieDiscoveryRepository;

    let points:
      DexieDiscoveryPointsRepository;

    let evidence:
      DexieScientificEvidenceRepository;

    let runtime:
      DexieGravitationalLensingReconstructionObservationRuntime;

    beforeEach(
      async () => {
        database =
          new GenesisIndexedDb(
            databaseName,
            dependencies,
          );

        discoveries =
          new DexieDiscoveryRepository(
            database,
            resolver,
            () =>
              1000,
          );

        points =
          new DexieDiscoveryPointsRepository(
            database,
            () =>
              1000,
          );

        evidence =
          new DexieScientificEvidenceRepository(
            database,
            resolver,
          );

        runtime =
          new DexieGravitationalLensingReconstructionObservationRuntime(
            database,
            points,
            discoveries,
            resolver,
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
            0n,
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
      'is absent before CONFIRMED and cannot leak source-plane reconstruction',
      async () => {
        for (
          const state
          of [
            DiscoveryState.DETECTED,
            DiscoveryState.DISCOVERED,
            DiscoveryState.CATALOGUED,
          ]
        ) {
          await discoveries
            .setState(
              key,
              lens,
              state,
            );

          expect(
            await runtime.inspect(
              key,
              lens,
            ),
          ).toBeNull();

          await expect(
            runtime.analyze(
              key,
              lens,
            ),
          ).rejects.toThrow();
        }

        expect(
          await evidence.getEvidence(
            key,
            lens,
          ),
        ).toHaveLength(
          0,
        );
      },
    );

    it(
      'requires the real optical level-5 unlock, persists one campaign and preserves PD/state',
      async () => {
        await discoveries
          .setState(
            key,
            lens,
            DiscoveryState.CONFIRMED,
          );

        const locked =
          await runtime.inspect(
            key,
            lens,
          );

        expect(locked).not.toBeNull();
        expect(locked!.analyzed).toBe(false);
        expect(locked!.canAnalyze).toBe(false);
        expect(locked!.facts).toHaveLength(0);

        await expect(
          runtime.analyze(
            key,
            lens,
          ),
        ).rejects.toThrow(
          /óptica/i,
        );

        await discoveries
          .setState(
            key,
            new SystemLocator(
              0n,
              1n,
              0n,
            ),
            DiscoveryState.CONFIRMED,
          );

        expect(
          (
            await discoveries
              .getKnownDiscoveries(
                key,
              )
          ).some(
            discovery =>
              discovery.locator instanceof BodyLocator,
          ),
        ).toBe(false);

        await points
          .setGlobalDiscoveryPoints(
            key,
            10_000n,
          );

        const unlocked =
          await runtime.inspect(
            key,
            lens,
          );

        expect(unlocked!.canAnalyze).toBe(true);

        const pointsBefore =
          await points
            .getGlobalDiscoveryPoints(
              key,
            );

        await runtime.analyze(
          key,
          lens,
        );

        const after =
          await runtime.inspect(
            key,
            lens,
          );

        expect(after!.analyzed).toBe(true);
        expect(after!.canAnalyze).toBe(false);
        expect(after!.analyzedInstrumentLabel).toBe('Óptica');
        expect(
          after!.facts.some(
            fact =>
              fact.label ===
                'Resultado de la campaña',
          ),
        ).toBe(true);

        expect(
          await points.getGlobalDiscoveryPoints(
            key,
          ),
        ).toBe(
          pointsBefore,
        );

        expect(
          await discoveries.getState(
            key,
            lens,
          ),
        ).toBe(
          DiscoveryState.CONFIRMED,
        );

        expect(
          await evidence.getEvidence(
            key,
            lens,
          ),
        ).toHaveLength(
          1,
        );

        await runtime.analyze(
          key,
          lens,
        );

        expect(
          await evidence.getEvidence(
            key,
            lens,
          ),
        ).toHaveLength(
          1,
        );

        const reloaded =
          new DexieGravitationalLensingReconstructionObservationRuntime(
            database,
            points,
            discoveries,
            resolver,
          );

        expect(
          (
            await reloaded.inspect(
              key,
              lens,
            )
          )?.facts,
        ).toEqual(
          after!.facts,
        );
      },
    );
  },
);

function findActiveNucleus():
  GalacticObjectLocator {

  for (
    let galaxyIndex =
      0n;
    galaxyIndex <
      512n;
    galaxyIndex +=
      1n
  ) {
    const locator =
      new GalacticObjectLocator(
        galaxyIndex,
        0n,
        0n,
      );

    if (
      GravitationalLensingReconstructionProfileEngine
        .resolveConfirmed(
          key,
          locator,
          DiscoveryState.CONFIRMED,
        ) !==
      null
    ) {
      return locator;
    }
  }

  throw new Error(
    'Missing deterministic active-nucleus fixture for 28.6 runtime.',
  );
}
