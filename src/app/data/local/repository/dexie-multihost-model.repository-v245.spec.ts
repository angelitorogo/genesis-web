import Dexie from 'dexie';
import {IDBKeyRange, indexedDB} from 'fake-indexeddb';
import { DiscoveryState } from '../../../domain/discovery/discovery-state';
import { SystemLocator } from '../../../domain/generation/procedural-locator';
import { GeneratorVersion } from '../../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../../domain/universe/universe-seed';
import {
  MULTIHOST_MODEL_RELEASE_V245, type MultihostModelManifestV245,
} from '../../../domain/planetary/multihost-model-manifest-v245';
import { GenesisIndexedDb } from '../indexed-db/genesis-indexed-db';
import { DexieDiscoveryRepository } from './dexie-discovery.repository';
import { DexieUniverseRepository } from './dexie-universe.repository';
import { DexieMultihostModelRepositoryV245, MULTIHOST_MODEL_OBSERVATION_KIND_V245 } from './dexie-multihost-model.repository-v245';

const SEED = '00000000000000000000000000000001';
const KEY = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'), GeneratorVersion.V1,
);
const LOCATOR = new SystemLocator(0n, 0n, 3n);
const RESOLVER = Object.freeze({resolveTargetSeedNormalized: () => SEED});
const manifest: MultihostModelManifestV245 = Object.freeze({
  version: 'V2_4_5_MODEL_MANIFEST', modelRelease: MULTIHOST_MODEL_RELEASE_V245,
  sourceSystemSeed: SEED, catalogueFingerprint: 'A'.repeat(32),
  identities: Object.freeze([]), habitableHostCount: 2,
});

describe('V2.4.5 existing-IndexedDB observation-backed optional model persistence', () => {
  const databaseName = 'genesis-web-v245-multihost-reference-test';
  const dependencies = {indexedDB, IDBKeyRange};
  let db: GenesisIndexedDb;
  let repo: DexieMultihostModelRepositoryV245;
  let discovery: DexieDiscoveryRepository;

  beforeEach(async () => {
    db = new GenesisIndexedDb(databaseName, dependencies);
    repo = new DexieMultihostModelRepositoryV245(db, RESOLVER, () => 1000);
    discovery = new DexieDiscoveryRepository(db, RESOLVER, () => 1000);
    await new DexieUniverseRepository(db, () => 1000).createIfAbsent(KEY);
  });
  afterEach(async () => {
    db.closeDatabase();
    await new Dexie(databaseName, dependencies).delete();
  });

  it('rejects unconfirmed save; never creates discoveries, versions or observations on read', async () => {
    expect(await repo.load(KEY, LOCATOR)).toBeNull();
    await expect(repo.save(KEY, LOCATOR, manifest)).rejects.toThrow();
    await discovery.setState(KEY, LOCATOR, DiscoveryState.CATALOGUED);
    await expect(repo.save(KEY, LOCATOR, manifest)).rejects.toThrow();
    expect(await db.observations.count()).toBe(0);
    expect(await discovery.getState(KEY, LOCATOR)).toBe(DiscoveryState.CATALOGUED);
  });

  it('restores exact manifest after database reopening, saves only custom kind and clears independently', async () => {
    await discovery.setState(KEY, LOCATOR, DiscoveryState.CONFIRMED);
    await repo.save(KEY, LOCATOR, manifest);
    const observations = await db.observations.toArray();
    expect(observations).toHaveLength(1);
    expect(observations[0]?.observationKind).toBe(MULTIHOST_MODEL_OBSERVATION_KIND_V245);
    expect(observations[0]?.generatorVersionCode).toBe(1);
    expect(await db.discoveries.count()).toBe(1);
    db.closeDatabase();
    db = new GenesisIndexedDb(databaseName, dependencies);
    repo = new DexieMultihostModelRepositoryV245(db, RESOLVER);
    discovery = new DexieDiscoveryRepository(db, RESOLVER);
    expect(await repo.load(KEY, LOCATOR)).toEqual(manifest);
    await repo.clear(KEY, LOCATOR);
    expect(await repo.load(KEY, LOCATOR)).toBeNull();
    expect(await discovery.getState(KEY, LOCATOR)).toBe(DiscoveryState.CONFIRMED);
  });

  it('refuses malformed or foreign catalogues instead of leaking model data into a save', async () => {
    await discovery.setState(KEY, LOCATOR, DiscoveryState.CONFIRMED);
    await expect(repo.save(KEY, LOCATOR, {...manifest, sourceSystemSeed: 'F'.repeat(32)})).rejects.toThrow();
    await repo.save(KEY, LOCATOR, manifest);
    const item = (await db.observations.toArray())[0]!;
    await db.observations.put({...item, payloadJson: '{bad'});
    await expect(repo.load(KEY, LOCATOR)).rejects.toThrow();
    expect(await db.discoveries.count()).toBe(1);
  });
});
