import { type KnownDiscovery } from '../../domain/discovery/known-discovery';
import { DiscoveryTargetType } from '../../domain/discovery/discovery-target-type';
import { type DiscoveryStateValue } from '../../domain/discovery/discovery-state';
import { type ProceduralLocator } from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { type DiscoveryRepository } from '../../domain/repository/genesis-repositories';
import { type GalaxySectorCoordinates } from '../../domain/sector/galaxy-sector-coordinates';

/**
 * CACHE-GAL.1: bounded, commit-aware cache for the expensive Dexie discovery
 * hydration used by the galaxy list, detail and scientific catalogues.
 *
 * No procedural Ground Truth is cached, and no discovery is promoted: these
 * arrays are the *persisted* records returned by the repository's integrity
 * checks. Dexie storage mutations invalidate the cache after commit, even
 * when they originate from a different GenesisIndexedDb instance or tab.
 */
export class GalaxyDiscoveryReadCacheRuntime implements DiscoveryRepository {
  // Whole-universe hydration is disproportionately expensive. A catalogue
  // navigation must never evict this snapshot by opening a second galaxy.
  // Separate bounded LRUs retain U while galaxy/target-type queries churn.
  private readonly universeResults = new Map<string, Promise<readonly KnownDiscovery[]>>();
  private readonly galaxyResults = new Map<string, Promise<readonly KnownDiscovery[]>>();
  private readonly maxUniverseEntries = 2;
  // Keep many visited galaxies warm. Expensive confirmed telemetry is also
  // persisted in CACHE-GAL.3, so a rare LRU eviction no longer implies a
  // full 30–40 second scientific reprojection.
  private readonly maxGalaxyEntries = 64;

  constructor(
    private readonly source: DiscoveryRepository,
    private readonly inTransaction: () => boolean = () => false,
  ) {}

  invalidate(): void {
    this.universeResults.clear();
    this.galaxyResults.clear();
  }

  getState(generationKey: UniverseGenerationKey, locator: ProceduralLocator): Promise<DiscoveryStateValue> {
    return this.source.getState(generationKey, locator);
  }

  async setState(
    generationKey: UniverseGenerationKey,
    locator: ProceduralLocator,
    state: DiscoveryStateValue,
  ): Promise<void> {
    // Invalidate both before the write and on completion; an in-flight
    // pre-commit read must never become a fresh cache entry after this action.
    this.invalidate();
    try {
      await this.source.setState(generationKey, locator, state);
    } finally {
      this.invalidate();
    }
  }

  getKnownDiscoveries(generationKey: UniverseGenerationKey): Promise<readonly KnownDiscovery[]> {
    // Reads inside a Dexie transaction must see that transaction's own writes
    // and must never await a promise originating outside its transaction zone.
    if (this.inTransaction()) return this.source.getKnownDiscoveries(generationKey);
    return this.resolve(`U|${keyForUniverse(generationKey)}`,
      () => this.source.getKnownDiscoveries(generationKey));
  }

  getKnownDiscoveriesInGalaxy(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    targetTypeCode?: number,
  ): Promise<readonly KnownDiscovery[]> {
    const query = this.source.getKnownDiscoveriesInGalaxy;
    if (this.inTransaction()) {
      if (query) return query.call(this.source, generationKey, galaxyIndex, targetTypeCode);
      return this.source.getKnownDiscoveries(generationKey).then(records => records.filter(
        row => row.locator.galaxyIndex === galaxyIndex &&
          (targetTypeCode === undefined || targetTypeFor(row) === targetTypeCode),
      ));
    }
    if (!query) {
      // Indexed fast path is present in production; preserve mock and
      // alternative-repository compatibility without bypassing authorization.
      return this.getKnownDiscoveries(generationKey).then(records => records.filter(
        row => row.locator.galaxyIndex === galaxyIndex &&
          (targetTypeCode === undefined || targetTypeFor(row) === targetTypeCode),
      ));
    }
    return this.resolve(
      `G|${keyForUniverse(generationKey)}|${galaxyIndex.toString()}|${targetTypeCode ?? '*'}`,
      () => query.call(this.source, generationKey, galaxyIndex, targetTypeCode),
    );
  }

  getKnownDiscoveriesInSector(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    coordinates: GalaxySectorCoordinates,
  ): Promise<readonly KnownDiscovery[]> {
    // The galactic-map sector path is not part of this navigation cache.
    return this.source.getKnownDiscoveriesInSector(generationKey, galaxyIndex, coordinates);
  }

  getObservationProgressMilestones(generationKey: UniverseGenerationKey) {
    const query = this.source.getObservationProgressMilestones;
    if (!query) {
      // This optional method is available in production; fail visibly rather
      // than computing instrument grants from a stale cross-screen snapshot.
      return Promise.reject(new Error('El repositorio no admite hitos instrumentales.'));
    }
    return query.call(this.source, generationKey);
  }

  private resolve(
    key: string,
    loader: () => Promise<readonly KnownDiscovery[]>,
  ): Promise<readonly KnownDiscovery[]> {
    const results = key.startsWith('U|') ? this.universeResults : this.galaxyResults;
    const maxEntries = key.startsWith('U|') ? this.maxUniverseEntries : this.maxGalaxyEntries;
    const existing = results.get(key);
    if (existing !== undefined) {
      results.delete(key);
      results.set(key, existing);
      return existing;
    }

    let promise: Promise<readonly KnownDiscovery[]>;
    try {
      promise = Promise.resolve(loader()).then(records => Object.freeze([...records]));
    } catch (error) {
      return Promise.reject(error);
    }
    results.set(key, promise);
    if (results.size > maxEntries) {
      results.delete(results.keys().next().value!);
    }
    void promise.catch(() => {
      if (results.get(key) === promise) results.delete(key);
    });
    return promise;
  }
}

function keyForUniverse(key: UniverseGenerationKey): string {
  return `${key.universeSeed.serialize()}|${key.generatorVersionCode}`;
}

function targetTypeFor(row: KnownDiscovery): number {
  // Dynamically resolving the target type preserves the same semantics as
  // the indexed Dexie repository for third-party fallback implementations.
  return DiscoveryTargetType.fromLocator(row.locator).code;
}

/** Dexie 4 observability keys: idb://<db>/discoveries/<index>. */
export function galaxyDiscoveryCacheAffectedByMutation(changedParts: unknown): boolean {
  if (changedParts === null || typeof changedParts !== 'object') return true;
  const parts = Object.keys(changedParts);
  if (parts.length === 0) return true;
  return parts.some(part =>
    /(?:^|\/)genesis-web\/(?:discoveries|universes)(?:\/|$)/.test(part) ||
    // Unknown storage key formats must fail closed, not leave stale knowledge.
    !part.startsWith('idb://'),
  );
}
