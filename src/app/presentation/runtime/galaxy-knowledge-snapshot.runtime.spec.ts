import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  KnownDiscovery,
} from '../../domain/discovery/known-discovery';

import {
  GalaxyLocator,
  SectorLocator,
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
  type GalaxyKnowledgeSnapshotEntity,
} from '../../data/local/entity/galaxy-knowledge-snapshot.entity';

import {
  type GalaxyKnowledgeSnapshotRepository,
} from '../../data/local/repository/dexie-galaxy-knowledge-snapshot.repository';

import {
  DexieGalaxyKnowledgeSnapshotRuntime,
  GALAXY_SCIENTIFIC_MODEL_VERSION,
  galaxyKnowledgeRevision,
} from './galaxy-knowledge-snapshot.runtime';

describe(
  'DexieGalaxyKnowledgeSnapshotRuntime',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '1234-5678-90AB-CDEF-1234-5678-90AB-CDEF',
        ),
        GeneratorVersion.V2,
      );

    const discoveries =
      Object.freeze([
        new KnownDiscovery(
          generationKey,
          new GalaxyLocator(0n),
          DiscoveryState.CONFIRMED,
        ),
        new KnownDiscovery(
          generationKey,
          new SectorLocator(0n, 0n),
          DiscoveryState.DETECTED,
        ),
      ]);

    it(
      'persists one versioned snapshot and reuses it while galaxy knowledge is unchanged',
      async () => {
        let stored:
          GalaxyKnowledgeSnapshotEntity | undefined;

        const repository:
          GalaxyKnowledgeSnapshotRepository = {
            async get() {
              return stored;
            },

            async put(entity) {
              stored = entity;
            },
          };

        const runtime =
          new DexieGalaxyKnowledgeSnapshotRuntime(
            repository,
            () => 123,
          );

        const first =
          await runtime.resolve(
            generationKey,
            0n,
            DiscoveryState.CONFIRMED,
            discoveries,
          );

        expect(stored).toBeDefined();
        expect(stored?.scientificModelVersion).toBe(
          GALAXY_SCIENTIFIC_MODEL_VERSION,
        );
        expect(stored?.updatedAtEpochMs).toBe(123);

        const second =
          await runtime.resolve(
            generationKey,
            0n,
            DiscoveryState.CONFIRMED,
            discoveries,
          );

        expect(second.statistics).toEqual(first.statistics);
        expect(second.explorationTelemetry).toEqual(
          first.explorationTelemetry,
        );
        expect(second.knowledgeRevision).toBe(
          first.knowledgeRevision,
        );
      },
    );

    it(
      'changes the revision whenever persisted knowledge in that galaxy changes',
      () => {
        const before =
          galaxyKnowledgeRevision(
            0n,
            discoveries,
          );

        const after =
          galaxyKnowledgeRevision(
            0n,
            [
              ...discoveries,
              new KnownDiscovery(
                generationKey,
                new SectorLocator(0n, 1n),
                DiscoveryState.DETECTED,
              ),
            ],
          );

        expect(after).not.toBe(before);
      },
    );

    it(
      'ignores discoveries belonging to another galaxy when computing the revision',
      () => {
        const before =
          galaxyKnowledgeRevision(
            0n,
            discoveries,
          );

        const after =
          galaxyKnowledgeRevision(
            0n,
            [
              ...discoveries,
              new KnownDiscovery(
                generationKey,
                new GalaxyLocator(1n),
                DiscoveryState.CONFIRMED,
              ),
            ],
          );

        expect(after).toBe(before);
      },
    );
  },
);
