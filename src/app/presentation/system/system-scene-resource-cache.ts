export interface SystemSceneDisposableResourceV1 {
  dispose(): void;
}

export interface SystemSceneResourceLeaseV1<
  TResource extends SystemSceneDisposableResourceV1,
> extends SystemSceneDisposableResourceV1 {
  readonly resource: TResource;
  readonly cached: boolean;
}

export interface SystemSceneResourceCacheStatsV1 {
  readonly cachedEntryCount: number;
  readonly leasedEntryCount: number;
  readonly estimatedCachedBytes: number;
  readonly maxEntries: number;
  readonly maxEstimatedBytes: number;
}

interface CacheEntry<TResource extends SystemSceneDisposableResourceV1> {
  readonly key: string;
  readonly resource: TResource;
  readonly estimatedBytes: number;
  leaseCount: number;
  lastUseOrdinal: number;
}

/**
 * Point-25.11 bounded LRU cache for expensive renderer resources.
 *
 * Entries currently referenced by a live scene are never evicted. If every
 * cached entry is leased and admitting a new resource would cross a hard bound,
 * that resource is returned as an uncached lease and disposed immediately when
 * its owner releases it. This keeps the cache bounded without invalidating a
 * material that is still rendering.
 */
export class SystemSceneBoundedResourceCacheV1<
  TResource extends SystemSceneDisposableResourceV1,
> implements SystemSceneDisposableResourceV1 {
  private readonly entries = new Map<string, CacheEntry<TResource>>();
  private ordinal = 0;
  private estimatedCachedBytes = 0;
  private disposed = false;

  constructor(
    private readonly maxEntries: number,
    private readonly maxEstimatedBytes: number,
  ) {
    if (!Number.isInteger(maxEntries) || maxEntries < 1) {
      throw new RangeError(`maxEntries must be a positive integer: ${maxEntries}.`);
    }

    if (!Number.isFinite(maxEstimatedBytes) || maxEstimatedBytes < 1) {
      throw new RangeError(
        `maxEstimatedBytes must be finite and positive: ${maxEstimatedBytes}.`,
      );
    }
  }

  acquire(
    key: string,
    estimatedBytes: number,
    factory: () => TResource,
  ): SystemSceneResourceLeaseV1<TResource> {
    this.assertAlive();
    if (key.length === 0) {
      throw new RangeError('Resource cache keys must be non-empty.');
    }
    if (!Number.isFinite(estimatedBytes) || estimatedBytes < 0) {
      throw new RangeError(`estimatedBytes must be finite and non-negative: ${estimatedBytes}.`);
    }

    const existing = this.entries.get(key);
    if (existing !== undefined) {
      existing.leaseCount += 1;
      existing.lastUseOrdinal = ++this.ordinal;
      return this.leaseForEntry(existing);
    }

    this.evictUntilFits(estimatedBytes);

    const resource = factory();
    const mayCache =
      estimatedBytes <= this.maxEstimatedBytes &&
      this.entries.size < this.maxEntries &&
      this.estimatedCachedBytes + estimatedBytes <= this.maxEstimatedBytes;

    if (!mayCache) {
      let released = false;
      return Object.freeze({
        resource,
        cached: false,
        dispose: () => {
          if (released) {
            return;
          }
          released = true;
          resource.dispose();
        },
      });
    }

    const entry: CacheEntry<TResource> = {
      key,
      resource,
      estimatedBytes,
      leaseCount: 1,
      lastUseOrdinal: ++this.ordinal,
    };
    this.entries.set(key, entry);
    this.estimatedCachedBytes += estimatedBytes;
    return this.leaseForEntry(entry);
  }

  stats(): SystemSceneResourceCacheStatsV1 {
    let leasedEntryCount = 0;
    for (const entry of this.entries.values()) {
      if (entry.leaseCount > 0) {
        leasedEntryCount += 1;
      }
    }

    return Object.freeze({
      cachedEntryCount: this.entries.size,
      leasedEntryCount,
      estimatedCachedBytes: this.estimatedCachedBytes,
      maxEntries: this.maxEntries,
      maxEstimatedBytes: this.maxEstimatedBytes,
    });
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    for (const entry of this.entries.values()) {
      entry.resource.dispose();
    }
    this.entries.clear();
    this.estimatedCachedBytes = 0;
  }

  private leaseForEntry(
    entry: CacheEntry<TResource>,
  ): SystemSceneResourceLeaseV1<TResource> {
    let released = false;
    return Object.freeze({
      resource: entry.resource,
      cached: true,
      dispose: () => {
        if (released) {
          return;
        }
        released = true;
        const current = this.entries.get(entry.key);
        if (current !== entry) {
          return;
        }
        current.leaseCount = Math.max(0, current.leaseCount - 1);
        current.lastUseOrdinal = ++this.ordinal;
      },
    });
  }

  private evictUntilFits(incomingBytes: number): void {
    while (
      this.entries.size >= this.maxEntries ||
      this.estimatedCachedBytes + incomingBytes > this.maxEstimatedBytes
    ) {
      let candidate: CacheEntry<TResource> | null = null;
      for (const entry of this.entries.values()) {
        if (entry.leaseCount !== 0) {
          continue;
        }
        if (candidate === null || entry.lastUseOrdinal < candidate.lastUseOrdinal) {
          candidate = entry;
        }
      }

      if (candidate === null) {
        return;
      }

      this.entries.delete(candidate.key);
      this.estimatedCachedBytes -= candidate.estimatedBytes;
      candidate.resource.dispose();
    }
  }

  private assertAlive(): void {
    if (this.disposed) {
      throw new Error('SystemSceneBoundedResourceCacheV1 has been disposed.');
    }
  }
}
