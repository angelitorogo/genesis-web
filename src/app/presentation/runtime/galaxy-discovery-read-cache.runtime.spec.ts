import { vi } from 'vitest';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { KnownDiscovery } from '../../domain/discovery/known-discovery';
import { GalaxyLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { type DiscoveryRepository } from '../../domain/repository/genesis-repositories';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import {
  GalaxyDiscoveryReadCacheRuntime,
  galaxyDiscoveryCacheAffectedByMutation,
} from './galaxy-discovery-read-cache.runtime';

const a = new UniverseGenerationKey(
  UniverseSeed.parse('1234-5678-90AB-CDEF-1234-5678-90AB-CDEF'),
  GeneratorVersion.V3,
);
const b = new UniverseGenerationKey(a.universeSeed, GeneratorVersion.V2);

function mockRepository() {
  const rows = [
    new KnownDiscovery(a, new GalaxyLocator(0n), DiscoveryState.CONFIRMED),
    new KnownDiscovery(a, new SystemLocator(0n, 1n, 2n), DiscoveryState.CONFIRMED),
  ];
  const getKnownDiscoveries = vi.fn(async () => rows);
  const getKnownDiscoveriesInGalaxy = vi.fn(async (_: UniverseGenerationKey, galaxyIndex: bigint) =>
    rows.filter(row => row.locator.galaxyIndex === galaxyIndex),
  );
  const setState = vi.fn(async () => undefined);
  const repository: DiscoveryRepository = {
    getState: async () => DiscoveryState.CONFIRMED,
    setState,
    getKnownDiscoveries,
    getKnownDiscoveriesInGalaxy,
    getKnownDiscoveriesInSector: async () => [],
  };
  return { repository, rows, getKnownDiscoveries, getKnownDiscoveriesInGalaxy, setState };
}

describe('CACHE-GAL.1 · navigation discovery read cache', () => {
  it('reuses universe reads and coalesces simultaneous calls without dropping knowledge checks', async () => {
    const source = mockRepository();
    const cache = new GalaxyDiscoveryReadCacheRuntime(source.repository);
    const [first, second] = await Promise.all([cache.getKnownDiscoveries(a), cache.getKnownDiscoveries(a)]);
    const third = await cache.getKnownDiscoveries(a);
    expect(source.getKnownDiscoveries).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
    expect(first).toBe(third);
    expect(first).toHaveLength(2);
  });

  it('isolates universe versions and per-galaxy catalogues, including target-type filters', async () => {
    const source = mockRepository();
    const cache = new GalaxyDiscoveryReadCacheRuntime(source.repository);
    await cache.getKnownDiscoveries(a);
    await cache.getKnownDiscoveries(b);
    await cache.getKnownDiscoveriesInGalaxy(a, 0n);
    await cache.getKnownDiscoveriesInGalaxy(a, 0n);
    await cache.getKnownDiscoveriesInGalaxy(a, 1n);
    await cache.getKnownDiscoveriesInGalaxy(a, 0n, 4);
    expect(source.getKnownDiscoveries).toHaveBeenCalledTimes(2);
    expect(source.getKnownDiscoveriesInGalaxy).toHaveBeenCalledTimes(3);
  });

  it('bypasses snapshots inside an active transaction to see uncommitted writes', async () => {
    const source = mockRepository();
    let inside = false;
    const cache = new GalaxyDiscoveryReadCacheRuntime(source.repository, () => inside);
    await cache.getKnownDiscoveries(a);
    inside = true;
    await cache.getKnownDiscoveries(a);
    await cache.getKnownDiscoveriesInGalaxy(a, 0n);
    inside = false;
    await cache.getKnownDiscoveries(a);
    expect(source.getKnownDiscoveries).toHaveBeenCalledTimes(2);
    expect(source.getKnownDiscoveriesInGalaxy).toHaveBeenCalledTimes(1);
  });

  it('discards the cache immediately when discovery state changes', async () => {
    const source = mockRepository();
    const cache = new GalaxyDiscoveryReadCacheRuntime(source.repository);
    await cache.getKnownDiscoveries(a);
    await cache.setState(a, new GalaxyLocator(0n), DiscoveryState.CATALOGUED);
    await cache.getKnownDiscoveries(a);
    expect(source.setState).toHaveBeenCalledTimes(1);
    expect(source.getKnownDiscoveries).toHaveBeenCalledTimes(2);
  });

  it('discards an in-flight result on invalidation', async () => {
    const source = mockRepository();
    let finish!: (rows: KnownDiscovery[]) => void;
    source.getKnownDiscoveries.mockImplementationOnce(() => new Promise<KnownDiscovery[]>(resolve => { finish = resolve; }));
    const cache = new GalaxyDiscoveryReadCacheRuntime(source.repository);
    const earlier = cache.getKnownDiscoveries(a);
    cache.invalidate();
    finish(source.rows);
    await earlier;
    await cache.getKnownDiscoveries(a);
    expect(source.getKnownDiscoveries).toHaveBeenCalledTimes(2);
  });

  it('retries failed reads rather than memorizing an error forever', async () => {
    const source = mockRepository();
    source.getKnownDiscoveries.mockRejectedValueOnce(new Error('Temporal'));
    const cache = new GalaxyDiscoveryReadCacheRuntime(source.repository);
    await expect(cache.getKnownDiscoveries(a)).rejects.toThrow('Temporal');
    await cache.getKnownDiscoveries(a);
    expect(source.getKnownDiscoveries).toHaveBeenCalledTimes(2);
  });

  it('invalidates only for discovery/universe changes, not background VIDA9/Archive writes', () => {
    expect(galaxyDiscoveryCacheAffectedByMutation({
      'idb://genesis-web/discoveries/': {},
    })).toBe(true);
    expect(galaxyDiscoveryCacheAffectedByMutation({
      'idb://genesis-web/universes/': {},
    })).toBe(true);
    expect(galaxyDiscoveryCacheAffectedByMutation({
      'idb://genesis-web/privateBiologicalRecordsVIDA9/': {},
    })).toBe(false);
    expect(galaxyDiscoveryCacheAffectedByMutation({
      'idb://genesis-web/galaxyKnowledgeSnapshots/': {},
    })).toBe(false);
    expect(galaxyDiscoveryCacheAffectedByMutation(null)).toBe(true);
  });
});


describe('CACHE-GAL.2 · retention across galaxy navigation', () => {
  it('A -> B -> A retains the expensive universe snapshot despite many galaxy queries', async () => {
    const source = mockRepository();
    const cache = new GalaxyDiscoveryReadCacheRuntime(source.repository);
    const firstUniverse = await cache.getKnownDiscoveries(a);
    for (let index = 0n; index < 12n; index++) {
      await cache.getKnownDiscoveriesInGalaxy(a, index);
      await cache.getKnownDiscoveriesInGalaxy(a, index, 4);
    }
    const returnToUniverse = await cache.getKnownDiscoveries(a);
    expect(firstUniverse).toBe(returnToUniverse);
    expect(source.getKnownDiscoveries).toHaveBeenCalledTimes(1);
    expect(source.getKnownDiscoveriesInGalaxy).toHaveBeenCalledTimes(24);
  });

  it('A -> B -> A retains each galaxy query and its target-type variants', async () => {
    const source = mockRepository();
    const cache = new GalaxyDiscoveryReadCacheRuntime(source.repository);
    const aBefore = await cache.getKnownDiscoveriesInGalaxy(a, 0n);
    const bBefore = await cache.getKnownDiscoveriesInGalaxy(a, 1n);
    await cache.getKnownDiscoveriesInGalaxy(a, 1n, 4);
    const aAfter = await cache.getKnownDiscoveriesInGalaxy(a, 0n);
    const bAfter = await cache.getKnownDiscoveriesInGalaxy(a, 1n);
    expect(aAfter).toBe(aBefore);
    expect(bAfter).toBe(bBefore);
    expect(source.getKnownDiscoveriesInGalaxy).toHaveBeenCalledTimes(3);
  });

  it('a discovery mutation still invalidates both cache pools', async () => {
    const source = mockRepository();
    const cache = new GalaxyDiscoveryReadCacheRuntime(source.repository);
    await cache.getKnownDiscoveries(a);
    await cache.getKnownDiscoveriesInGalaxy(a, 0n);
    cache.invalidate();
    await cache.getKnownDiscoveries(a);
    await cache.getKnownDiscoveriesInGalaxy(a, 0n);
    expect(source.getKnownDiscoveries).toHaveBeenCalledTimes(2);
    expect(source.getKnownDiscoveriesInGalaxy).toHaveBeenCalledTimes(2);
  });
});


describe('CACHE-GAL.3 · retención real al recorrer todas las galaxias', () => {
  it('mantiene el índice de la primera después de visitar veinte galaxias', async () => {
    const source = mockRepository();
    const cache = new GalaxyDiscoveryReadCacheRuntime(source.repository);
    const first = await cache.getKnownDiscoveriesInGalaxy(a, 0n);
    for (let i = 1n; i <= 20n; i++) {
      await cache.getKnownDiscoveriesInGalaxy(a, i);
      await cache.getKnownDiscoveriesInGalaxy(a, i, 4);
    }
    expect(await cache.getKnownDiscoveriesInGalaxy(a, 0n)).toBe(first);
    expect(source.getKnownDiscoveriesInGalaxy).toHaveBeenCalledTimes(41);
    cache.invalidate();
    await cache.getKnownDiscoveriesInGalaxy(a, 0n);
    expect(source.getKnownDiscoveriesInGalaxy).toHaveBeenCalledTimes(42);
  });
});
