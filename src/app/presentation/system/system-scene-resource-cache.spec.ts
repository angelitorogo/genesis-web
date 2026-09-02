import {
  SystemSceneBoundedResourceCacheV1,
} from './system-scene-resource-cache';

describe('SystemScene bounded resource cache point 25.11', () => {
  it('should reuse one cached resource and release leases without disposing the live cache entry', () => {
    let created = 0;
    let disposed = 0;
    const cache = new SystemSceneBoundedResourceCacheV1(2, 200);
    const factory = () => ({
      id: ++created,
      dispose: () => {
        disposed += 1;
      },
    });

    const first = cache.acquire('a', 80, factory);
    const second = cache.acquire('a', 80, factory);

    expect(first.resource).toBe(second.resource);
    expect(created).toBe(1);
    first.dispose();
    second.dispose();
    expect(disposed).toBe(0);
    expect(cache.stats().leasedEntryCount).toBe(0);

    cache.dispose();
    expect(disposed).toBe(1);
  });

  it('should evict the least recently used unleased entry while respecting hard bounds', () => {
    const disposed: string[] = [];
    const cache = new SystemSceneBoundedResourceCacheV1(2, 160);
    const resource = (id: string) => ({
      id,
      dispose: () => disposed.push(id),
    });

    const a = cache.acquire('a', 70, () => resource('a'));
    a.dispose();
    const b = cache.acquire('b', 70, () => resource('b'));
    b.dispose();
    const c = cache.acquire('c', 70, () => resource('c'));
    c.dispose();

    expect(disposed).toContain('a');
    expect(cache.stats().cachedEntryCount).toBe(2);
    expect(cache.stats().estimatedCachedBytes).toBeLessThanOrEqual(160);
    cache.dispose();
  });

  it('should bypass the cache when every bounded slot is actively leased', () => {
    let uncachedDisposed = 0;
    const cache = new SystemSceneBoundedResourceCacheV1(1, 100);
    const held = cache.acquire('held', 80, () => ({ dispose() {} }));
    const overflow = cache.acquire('overflow', 80, () => ({
      dispose: () => {
        uncachedDisposed += 1;
      },
    }));

    expect(overflow.cached).toBe(false);
    expect(cache.stats().cachedEntryCount).toBe(1);
    overflow.dispose();
    expect(uncachedDisposed).toBe(1);
    held.dispose();
    cache.dispose();
  });
});
