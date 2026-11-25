import { vi } from 'vitest';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { KnownDiscovery } from '../../domain/discovery/known-discovery';
import { GalaxyLocator, SectorLocator } from '../../domain/generation/procedural-locator';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GalaxyExplorationTelemetryEngine } from '../../simulation/exploration/galaxy-exploration-telemetry-engine';
import { type GalaxyKnowledgeSnapshotEntity } from '../../data/local/entity/galaxy-knowledge-snapshot.entity';
import { type GalaxyKnowledgeSnapshotRepository } from '../../data/local/repository/dexie-galaxy-knowledge-snapshot.repository';
import {
  DexieGalaxyKnowledgeSnapshotRuntime, GALAXY_SCIENTIFIC_MODEL_VERSION,
  galaxyKnowledgeRevision,
} from './galaxy-knowledge-snapshot.runtime';

const generationKey = new UniverseGenerationKey(
  UniverseSeed.parse('1234-5678-90AB-CDEF-1234-5678-90AB-CDEF'), GeneratorVersion.V2,
);

function record(index: bigint, revision: string): GalaxyKnowledgeSnapshotEntity {
  return {
    universeSeed: generationKey.universeSeed.serialize(),
    generatorVersionCode: generationKey.generatorVersionCode,
    galaxyIndex: index.toString(10),
    scientificModelVersion: GALAXY_SCIENTIFIC_MODEL_VERSION,
    knowledgeRevision: revision,
    updatedAtEpochMs: 0,
  };
}

function repositoryFixture() {
  const saved = new Map<string, GalaxyKnowledgeSnapshotEntity>();
  let commits = 0;
  const repository: GalaxyKnowledgeSnapshotRepository = {
    async get(_, index) { return saved.get(index.toString(10)); },
    async put(row) { saved.set(row.galaxyIndex, row); },
    async updateConfirmedScientificTelemetryIfRevisionMatches(_, index, _version, revision, telemetryRevision, json) {
      const key = index.toString(10);
      const previous = saved.get(key);
      if (!previous || previous.knowledgeRevision !== revision) return false;
      saved.set(key, {
        ...previous,
        confirmedScientificTelemetryRevision: telemetryRevision,
        confirmedScientificTelemetryJson: json,
      });
      commits++;
      return true;
    },
  };
  return { saved, repository, get commits() { return commits; } };
}

describe('CACHE-GAL.3 · telemetría científica persistida por galaxia', () => {
  it('conserva 18 galaxias aunque desborde los 4/6 snapshots y sobrevive a una instancia nueva', async () => {
    const fixture = repositoryFixture();
    const runtime = new DexieGalaxyKnowledgeSnapshotRuntime(fixture.repository);
    const build = vi.spyOn(GalaxyExplorationTelemetryEngine, 'build');
    try {
      const rowsFor = (index: bigint) => [new KnownDiscovery(
        generationKey, new GalaxyLocator(index), DiscoveryState.DISCOVERED,
      )];
      for (let i = 0n; i < 18n; i++) {
        const rows = rowsFor(i);
        const revision = galaxyKnowledgeRevision(i, rows);
        fixture.saved.set(i.toString(10), record(i, revision));
        await runtime.resolveConfirmedTelemetry(generationKey, i, DiscoveryState.DISCOVERED, rows, revision);
      }
      expect(build).toHaveBeenCalledTimes(18);
      expect(fixture.commits).toBe(18);
      const rows = rowsFor(0n);
      const revision = galaxyKnowledgeRevision(0n, rows);
      await runtime.resolveConfirmedTelemetry(generationKey, 0n, DiscoveryState.DISCOVERED, rows, revision);
      expect(build).toHaveBeenCalledTimes(18); // no heavy reprojection after LRU eviction
      const freshInstance = new DexieGalaxyKnowledgeSnapshotRuntime(fixture.repository);
      await freshInstance.resolveConfirmedTelemetry(generationKey, 0n, DiscoveryState.DISCOVERED, rows, revision);
      expect(build).toHaveBeenCalledTimes(18); // survives even a runtime reload
    } finally {
      build.mockRestore();
    }
  });

  it('rechaza un snapshot previo tras nueva evidencia persistida', async () => {
    const fixture = repositoryFixture();
    const runtime = new DexieGalaxyKnowledgeSnapshotRuntime(fixture.repository);
    const initial = [new KnownDiscovery(generationKey, new GalaxyLocator(0n), DiscoveryState.DISCOVERED)];
    const initialRevision = galaxyKnowledgeRevision(0n, initial);
    fixture.saved.set('0', record(0n, initialRevision));
    const build = vi.spyOn(GalaxyExplorationTelemetryEngine, 'build');
    try {
      await runtime.resolveConfirmedTelemetry(generationKey, 0n, DiscoveryState.DISCOVERED, initial, initialRevision);
      const updated = [
        ...initial,
        new KnownDiscovery(generationKey, new SectorLocator(0n, 3n), DiscoveryState.CONFIRMED),
      ];
      const changedRevision = galaxyKnowledgeRevision(0n, updated);
      fixture.saved.set('0', record(0n, changedRevision));
      await runtime.resolveConfirmedTelemetry(generationKey, 0n, DiscoveryState.DISCOVERED, updated, changedRevision);
      expect(build).toHaveBeenCalledTimes(2);
      expect(fixture.saved.get('0')?.confirmedScientificTelemetryRevision).toBe(`${changedRevision}/${DiscoveryState.DISCOVERED.code}`);
      expect(fixture.saved.get('0')?.confirmedScientificTelemetryJson).not.toBeUndefined();
    } finally {
      build.mockRestore();
    }
  });

  it('no escribe telemetría atrasada sobre una revisión más nueva', async () => {
    const fixture = repositoryFixture();
    const runtime = new DexieGalaxyKnowledgeSnapshotRuntime(fixture.repository);
    const rows = [new KnownDiscovery(generationKey, new GalaxyLocator(0n), DiscoveryState.DISCOVERED)];
    const revision = galaxyKnowledgeRevision(0n, rows);
    fixture.saved.set('0', record(0n, 'revision-que-ya-cambio'));
    await runtime.resolveConfirmedTelemetry(generationKey, 0n, DiscoveryState.DISCOVERED, rows, revision);
    expect(fixture.commits).toBe(0);
    expect(fixture.saved.get('0')?.knowledgeRevision).toBe('revision-que-ya-cambio');
  });
});
