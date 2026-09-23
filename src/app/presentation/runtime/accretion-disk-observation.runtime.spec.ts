import Dexie from 'dexie';
import { IDBKeyRange, indexedDB } from 'fake-indexeddb';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { GalaxyLocator, SystemLocator, type ProceduralLocator } from '../../domain/generation/procedural-locator';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GenesisIndexedDb } from '../../data/local/indexed-db/genesis-indexed-db';
import { DexieDiscoveryRepository, type ProceduralTargetSeedResolver } from '../../data/local/repository/dexie-discovery.repository';
import { DexieDiscoveryPointsRepository } from '../../data/local/repository/dexie-discovery-points.repository';
import { DexieUniverseRepository } from '../../data/local/repository/dexie-universe.repository';
import { DexieScientificEvidenceRepository } from '../../data/local/repository/dexie-scientific-evidence.repository';
import { AccretionDiskObservationEngine } from '../../simulation/observation/accretion-disk-observation-engine';
import { CompactAccretionEngine } from '../../simulation/stellar/compact-accretion-engine';
import { GalaxyGenerator } from '../../simulation/universe/galaxy-generator';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';
import { DexieAccretionDiskObservationRuntime } from './accretion-disk-observation.runtime';

const dependencies = { indexedDB, IDBKeyRange };
const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
const key = new UniverseGenerationKey(seed, GeneratorVersion.V2);
const resolver: ProceduralTargetSeedResolver = {
  resolveTargetSeedNormalized(k: UniverseGenerationKey, locator: ProceduralLocator): string {
    return ProceduralTargetResolver.resolveTargetSeed(k, locator).normalizedValue;
  },
};
const activeIndex = (() => {
  for (let index = 0n; index < 512n; index++) {
    if (CompactAccretionEngine.fromExistingGalaxy(GalaxyGenerator.generate(key, index)) !== null) return index;
  }
  throw new Error('The regression seed must contain a canonical active nucleus.');
})();
const quietIndex = (() => {
  for (let index = 0n; index < 512n; index++) {
    if (CompactAccretionEngine.fromExistingGalaxy(GalaxyGenerator.generate(key, index)) === null) return index;
  }
  throw new Error('The regression seed must contain an inactive/absent nucleus.');
})();

describe('28.1 persisted nuclear accretion-disk observing action', () => {
  const dbName = 'genesis-phase-28-1-disk-observation-runtime';
  let db: GenesisIndexedDb;
  let discoveries: DexieDiscoveryRepository;
  let points: DexieDiscoveryPointsRepository;
  let evidence: DexieScientificEvidenceRepository;
  let runtime: DexieAccretionDiskObservationRuntime;

  beforeEach(async () => {
    db = new GenesisIndexedDb(dbName, dependencies);
    discoveries = new DexieDiscoveryRepository(db, resolver, () => 1000);
    points = new DexieDiscoveryPointsRepository(db, () => 1000);
    evidence = new DexieScientificEvidenceRepository(db, resolver);
    runtime = new DexieAccretionDiskObservationRuntime(db, points, discoveries, resolver);
    await new DexieUniverseRepository(db, () => 1000).createIfAbsent(key);
    await points.setGlobalDiscoveryPoints(key, 0n);
  });
  afterEach(async () => {
    db.closeDatabase();
    await new Dexie(dbName, dependencies).delete();
  });

  it('never offers a disk to unknown, discovered or catalogued galaxies', async () => {
    expect(await runtime.inspect(key, activeIndex)).toBeNull();
    await expect(runtime.observe(key, activeIndex)).rejects.toThrow();
    for (const state of [DiscoveryState.DETECTED, DiscoveryState.DISCOVERED, DiscoveryState.CATALOGUED]) {
      await discoveries.setState(key, new GalaxyLocator(activeIndex), state);
      expect(await runtime.inspect(key, activeIndex)).toBeNull();
      await expect(runtime.observe(key, activeIndex)).rejects.toThrow();
    }
    expect(await evidence.getEvidence(key, new GalaxyLocator(activeIndex))).toHaveLength(0);
  });

  it('does not invent a disk for a confirmed quiescent or absent nucleus', async () => {
    await discoveries.setState(key, new GalaxyLocator(quietIndex), DiscoveryState.CONFIRMED);
    expect(await runtime.inspect(key, quietIndex)).toBeNull();
    await expect(runtime.observe(key, quietIndex)).rejects.toThrow();
    expect(await evidence.getEvidence(key, new GalaxyLocator(quietIndex))).toHaveLength(0);
  });

  it('requires a genuine instrument unlock, persists one observed campaign, survives reload and preserves PD/state', async () => {
    const locator = new GalaxyLocator(activeIndex);
    await discoveries.setState(key, locator, DiscoveryState.CONFIRMED);
    const locked = await runtime.inspect(key, activeIndex);
    expect(locked).not.toBeNull();
    expect(locked!.observed).toBe(false);
    expect(locked!.modelFacts).toHaveLength(0);
    expect(locked!.canObserve).toBe(false);
    await expect(runtime.observe(key, activeIndex)).rejects.toThrow();
    expect(await evidence.getEvidence(key, locator)).toHaveLength(0);

    // Existing progression milestone and global PD, no invented instrument unlock.
    await discoveries.setState(key, new SystemLocator(activeIndex, 0n, 0n), DiscoveryState.DISCOVERED);
    await points.setGlobalDiscoveryPoints(key, 10_000n);
    const unlocked = await runtime.inspect(key, activeIndex);
    expect(unlocked!.canObserve).toBe(true);
    expect(unlocked!.modelFacts).toHaveLength(0);
    await runtime.observe(key, activeIndex);
    const after = await runtime.inspect(key, activeIndex);
    expect(after!.observed).toBe(true);
    expect(after!.canObserve).toBe(false);
    expect(after!.modelFacts.length).toBeGreaterThan(2);
    expect(after!.observedInstrumentLabel).toBe('Espectroscopia');
    expect(await points.getGlobalDiscoveryPoints(key)).toBe(10_000n);
    expect(await discoveries.getState(key, locator)).toBe(DiscoveryState.CONFIRMED);
    expect(await evidence.getEvidence(key, locator)).toHaveLength(1);
    await runtime.observe(key, activeIndex);
    expect(await evidence.getEvidence(key, locator)).toHaveLength(1);
    const reloaded = new DexieAccretionDiskObservationRuntime(db, points, discoveries, resolver);
    expect((await reloaded.inspect(key, activeIndex))?.modelFacts).toEqual(after!.modelFacts);
  });

  it('keeps the V2 disk deterministic, preserves V1 support and contains no fabricated jet', () => {
    const old = new UniverseGenerationKey(seed, GeneratorVersion.V1);
    const oldActiveIndex = (() => {
      for (let index = 0n; index < 512n; index++) {
        if (CompactAccretionEngine.fromExistingGalaxy(GalaxyGenerator.generate(old, index)) !== null) return index;
      }
      throw new Error('The regression seed must contain a canonical V1 active nucleus.');
    })();
    const disk = AccretionDiskObservationEngine.physicalDiskOrNull(key, activeIndex, DiscoveryState.CONFIRMED)!;
    expect(disk).not.toBeNull();
    expect(AccretionDiskObservationEngine.physicalDiskOrNull(key, activeIndex, DiscoveryState.CONFIRMED))
      .toEqual(disk);
    expect(AccretionDiskObservationEngine.physicalDiskOrNull(old, oldActiveIndex, DiscoveryState.CONFIRMED))
      .not.toBeNull();
    expect(AccretionDiskObservationEngine.physicalDiskOrNull(key, activeIndex, DiscoveryState.DISCOVERED))
      .toBeNull();
    expect(CompactAccretionEngine.fromExistingGalaxy(GalaxyGenerator.generate(key, activeIndex))?.jet).toBeNull();
  });
});
