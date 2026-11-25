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

    it('CACHE-GAL.2: reuses snapshots across A -> B -> A, and invalidates after new knowledge', async () => {
      const stored = new Map<string, GalaxyKnowledgeSnapshotEntity>();
      const reads: string[] = [];
      const repository: GalaxyKnowledgeSnapshotRepository = {
        async get(_key, galaxyIndex) {
          const id = galaxyIndex.toString();
          reads.push(id);
          return stored.get(id);
        },
        async put(entity) {
          stored.set(entity.galaxyIndex, entity);
        },
      };
      const runtime = new DexieGalaxyKnowledgeSnapshotRuntime(repository, () => 123);
      const aRows = [new KnownDiscovery(generationKey,
        new GalaxyLocator(0n), DiscoveryState.DISCOVERED)];
      const bRows = [new KnownDiscovery(generationKey,
        new GalaxyLocator(1n), DiscoveryState.DISCOVERED)];
      const firstA = await runtime.resolve(generationKey, 0n, DiscoveryState.DISCOVERED, aRows);
      await runtime.resolve(generationKey, 1n, DiscoveryState.DISCOVERED, bRows);
      const secondA = await runtime.resolve(generationKey, 0n, DiscoveryState.DISCOVERED, aRows);
      expect(secondA).toBe(firstA);
      expect(reads).toEqual(['0', '1']);

      const updatedA = [...aRows,
        new KnownDiscovery(generationKey, new SectorLocator(0n, 9n), DiscoveryState.DETECTED)];
      const newA = await runtime.resolve(generationKey, 0n, DiscoveryState.DISCOVERED, updatedA);
      expect(newA.knowledgeRevision).not.toBe(firstA.knowledgeRevision);
      expect(reads).toEqual(['0', '1', '0']);
    });

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
