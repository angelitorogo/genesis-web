import Dexie from 'dexie';
import {
  IDBKeyRange,
  indexedDB,
} from 'fake-indexeddb';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  ExtremeType,
} from '../../domain/galactic-object/extreme-object-type';

import {
  frozenPhysicalSourceKey,
} from '../../domain/generation/frozen-physical-source-key';

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
  ExplorationSectorResultEngine,
} from '../../simulation/exploration/exploration-sector-result-engine';

import {
  ExtremeObjectTypeResolver,
} from '../../simulation/galactic-object/extreme-object-type-resolver';

import {
  ProceduralTargetResolver,
} from '../../simulation/regeneration/procedural-target-resolver';

import {
  GalaxySectorContentGenerator,
} from '../../simulation/sector/galaxy-sector-content-generator';

import {
  GalaxyGenerator,
} from '../../simulation/universe/galaxy-generator';

import {
  DexieRelativisticJetAnalysisObservationRuntime,
} from './relativistic-jet-analysis-observation.runtime';

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

const microquasar =
  findMicroquasar();

describe(
  '28.5 persisted relativistic-jet analysis runtime',
  () => {
    const databaseName =
      'genesis-phase-28-5-relativistic-jet-runtime';

    let database:
      GenesisIndexedDb;

    let discoveries:
      DexieDiscoveryRepository;

    let points:
      DexieDiscoveryPointsRepository;

    let evidence:
      DexieScientificEvidenceRepository;

    let runtime:
      DexieRelativisticJetAnalysisObservationRuntime;

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
          new DexieRelativisticJetAnalysisObservationRuntime(
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
      'is absent before CONFIRMED and cannot leak jet kinematics',
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
              microquasar,
              state,
            );

          expect(
            await runtime.inspect(
              key,
              microquasar,
            ),
          ).toBeNull();

          await expect(
            runtime.analyze(
              key,
              microquasar,
            ),
          ).rejects.toThrow();
        }

        expect(
          await evidence.getEvidence(
            key,
            microquasar,
          ),
        ).toHaveLength(
          0,
        );
      },
    );

    it(
      'requires the real radio level-4 unlock, persists one campaign and preserves PD/state',
      async () => {
        await discoveries
          .setState(
            key,
            microquasar,
            DiscoveryState.CONFIRMED,
          );

        const locked =
          await runtime.inspect(
            key,
            microquasar,
          );

        expect(locked).not.toBeNull();
        expect(locked!.analyzed).toBe(false);
        expect(locked!.canAnalyze).toBe(false);
        expect(locked!.facts).toHaveLength(0);

        await expect(
          runtime.analyze(
            key,
            microquasar,
          ),
        ).rejects.toThrow(
          /radio/i,
        );

        await discoveries
          .setState(
            key,
            new SystemLocator(
              0n,
              1n,
              0n,
            ),
            DiscoveryState.CATALOGUED,
          );

        await discoveries
          .setState(
            key,
            new BodyLocator(
              0n,
              1n,
              0n,
              0n,
            ),
            DiscoveryState.DISCOVERED,
          );

        await points
          .setGlobalDiscoveryPoints(
            key,
            10_000n,
          );

        const unlocked =
          await runtime.inspect(
            key,
            microquasar,
          );

        expect(unlocked!.canAnalyze).toBe(true);

        const pointsBefore =
          await points
            .getGlobalDiscoveryPoints(
              key,
            );

        await runtime.analyze(
          key,
          microquasar,
        );

        const after =
          await runtime.inspect(
            key,
            microquasar,
          );

        expect(after!.analyzed).toBe(true);
        expect(after!.canAnalyze).toBe(false);
        expect(after!.analyzedInstrumentLabel).toBe('Radio');
        expect(
          after!.facts.some(
            fact =>
              fact.label ===
              'Factor de Lorentz bulk (modelo)',
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
            microquasar,
          ),
        ).toBe(
          DiscoveryState.CONFIRMED,
        );

        expect(
          await evidence.getEvidence(
            key,
            microquasar,
          ),
        ).toHaveLength(
          1,
        );

        await runtime.analyze(
          key,
          microquasar,
        );

        expect(
          await evidence.getEvidence(
            key,
            microquasar,
          ),
        ).toHaveLength(
          1,
        );

        const reloaded =
          new DexieRelativisticJetAnalysisObservationRuntime(
            database,
            points,
            discoveries,
            resolver,
          );

        expect(
          (
            await reloaded.inspect(
              key,
              microquasar,
            )
          )?.facts,
        ).toEqual(
          after!.facts,
        );
      },
    );
  },
);

function findMicroquasar():
  GalacticObjectLocator {

  const galaxy =
    GalaxyGenerator.generate(
      key,
      0n,
    );

  const physicalKey =
    frozenPhysicalSourceKey(
      key,
    );

  for (
    let x =
      -48;
    x <=
      48;
    x +=
      1
  ) {
    for (
      let y =
        -48;
      y <=
        48;
      y +=
        1
    ) {
      if (
        x ===
          0 &&
        y ===
          0
      ) {
        continue;
      }

      const content =
        GalaxySectorContentGenerator
          .generate(
            galaxy,
            {
              x,
              y,
            },
          );

      for (
        const locator
        of content.galacticObjectLocators
      ) {
        if (
          ExplorationSectorResultEngine
            .resolveGalacticObjectKind(
              physicalKey,
              locator,
            ) !==
          ExplorationResultKind.EXTREME_OBJECT
        ) {
          continue;
        }

        if (
          ExtremeObjectTypeResolver
            .resolve(
              key,
              locator,
            ) ===
          ExtremeType.MICROQUASAR
        ) {
          return locator;
        }
      }
    }
  }

  throw new Error(
    'Missing deterministic V2 microquasar fixture for 28.5 runtime.',
  );
}
