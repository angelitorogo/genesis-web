import Dexie from 'dexie';
import { IDBKeyRange, indexedDB } from 'fake-indexeddb';

import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { ExplorationResultKind } from '../../domain/exploration/exploration-sector-result';
import { ExtremeType } from '../../domain/galactic-object/extreme-object-type';
import { frozenPhysicalSourceKey } from '../../domain/generation/frozen-physical-source-key';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { GalacticObjectLocator, SystemLocator, type ProceduralLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GenesisIndexedDb } from '../../data/local/indexed-db/genesis-indexed-db';
import { DexieDiscoveryPointsRepository } from '../../data/local/repository/dexie-discovery-points.repository';
import { DexieDiscoveryRepository, type ProceduralTargetSeedResolver } from '../../data/local/repository/dexie-discovery.repository';
import { DexieScientificEvidenceRepository } from '../../data/local/repository/dexie-scientific-evidence.repository';
import { DexieUniverseRepository } from '../../data/local/repository/dexie-universe.repository';
import { ExplorationSectorResultEngine } from '../../simulation/exploration/exploration-sector-result-engine';
import { ExtremeObjectTypeResolver } from '../../simulation/galactic-object/extreme-object-type-resolver';
import { GalaxySectorContentGenerator } from '../../simulation/sector/galaxy-sector-content-generator';
import { GalaxyGenerator } from '../../simulation/universe/galaxy-generator';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';
import { DexiePulsarTimingObservationRuntime } from './pulsar-timing-observation.runtime';

const dependencies = { indexedDB, IDBKeyRange };
const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),
  GeneratorVersion.V2,
);
const resolver: ProceduralTargetSeedResolver = {
  resolveTargetSeedNormalized(k: UniverseGenerationKey, locator: ProceduralLocator): string {
    return ProceduralTargetResolver.resolveTargetSeed(k, locator).normalizedValue;
  },
};
const pulsar = findPulsar();

describe('28.3 persisted pulse timing runtime', () => {
  const dbName = 'genesis-phase-28-3-pulsar-timing-runtime';
  let db: GenesisIndexedDb;
  let discoveries: DexieDiscoveryRepository;
  let points: DexieDiscoveryPointsRepository;
  let evidence: DexieScientificEvidenceRepository;
  let runtime: DexiePulsarTimingObservationRuntime;

  beforeEach(async () => {
    db = new GenesisIndexedDb(dbName, dependencies);
    discoveries = new DexieDiscoveryRepository(db, resolver, () => 1000);
    points = new DexieDiscoveryPointsRepository(db, () => 1000);
    evidence = new DexieScientificEvidenceRepository(db, resolver);
    runtime = new DexiePulsarTimingObservationRuntime(db, points, discoveries, resolver);
    await new DexieUniverseRepository(db, () => 1000).createIfAbsent(key);
    await points.setGlobalDiscoveryPoints(key, 0n);
  });

  afterEach(async () => {
    db.closeDatabase();
    await new Dexie(dbName, dependencies).delete();
  });

  it('is absent before CONFIRMED and cannot leak timing values', async () => {
    for (const state of [DiscoveryState.DETECTED, DiscoveryState.DISCOVERED, DiscoveryState.CATALOGUED]) {
      await discoveries.setState(key, pulsar, state);
      expect(await runtime.inspect(key, pulsar)).toBeNull();
      await expect(runtime.measure(key, pulsar)).rejects.toThrow();
    }
    expect(await evidence.getEvidence(key, pulsar)).toHaveLength(0);
  });

  it('requires genuine level-4 unlocks, persists one campaign and preserves PD/state', async () => {
    await discoveries.setState(key, pulsar, DiscoveryState.CONFIRMED);
    const locked = await runtime.inspect(key, pulsar);
    expect(locked).not.toBeNull();
    expect(locked!.measured).toBe(false);
    expect(locked!.canMeasure).toBe(false);
    expect(locked!.facts).toHaveLength(0);
    await expect(runtime.measure(key, pulsar)).rejects.toThrow();

    await discoveries.setState(key, new SystemLocator(0n, 1n, 0n), DiscoveryState.CATALOGUED);
    await points.setGlobalDiscoveryPoints(key, 10_000n);

    const unlocked = await runtime.inspect(key, pulsar);
    expect(unlocked!.canMeasure).toBe(true);
    expect(unlocked!.facts).toHaveLength(0);

    await runtime.measure(key, pulsar);
    const after = await runtime.inspect(key, pulsar);
    expect(after!.measured).toBe(true);
    expect(after!.canMeasure).toBe(false);
    expect(after!.measuredInstrumentLabel).toBe('Radio');
    expect(after!.facts.length).toBeGreaterThanOrEqual(5);
    expect(await points.getGlobalDiscoveryPoints(key)).toBe(10_000n);
    expect(await discoveries.getState(key, pulsar)).toBe(DiscoveryState.CONFIRMED);
    expect(await evidence.getEvidence(key, pulsar)).toHaveLength(1);

    await runtime.measure(key, pulsar);
    expect(await evidence.getEvidence(key, pulsar)).toHaveLength(1);

    const reloaded = new DexiePulsarTimingObservationRuntime(db, points, discoveries, resolver);
    expect((await reloaded.inspect(key, pulsar))?.facts).toEqual(after!.facts);
  });
});

function findPulsar(): GalacticObjectLocator {
  const galaxy = GalaxyGenerator.generate(key, 0n);
  const physicalKey = frozenPhysicalSourceKey(key);
  for (let x = -40; x <= 40; x += 1) {
    for (let y = -40; y <= 40; y += 1) {
      if (x === 0 && y === 0) continue;
      const content = GalaxySectorContentGenerator.generate(galaxy, { x, y });
      for (const locator of content.galacticObjectLocators) {
        if (ExplorationSectorResultEngine.resolveGalacticObjectKind(physicalKey, locator) !==
            ExplorationResultKind.EXTREME_OBJECT) continue;
        if (ExtremeObjectTypeResolver.resolve(key, locator) === ExtremeType.PULSAR) return locator;
      }
    }
  }
  throw new Error('Missing deterministic V2 pulsar fixture for 28.3 runtime.');
}
