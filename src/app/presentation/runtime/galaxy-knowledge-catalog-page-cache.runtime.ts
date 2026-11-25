import { inject, InjectionToken } from '@angular/core';

import { canonicalGalaxyKnownDiscoveries } from '../../domain/exploration/galaxy-known-discoveries-canonical';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { type DiscoveryRepository } from '../../domain/repository/genesis-repositories';
import { GenesisIndexedDb } from '../../data/local/indexed-db/genesis-indexed-db';
import {
  DexieGalaxyKnowledgeSnapshotRepository,
  type GalaxyKnowledgeSnapshotRepository,
} from '../../data/local/repository/dexie-galaxy-knowledge-snapshot.repository';
import { GENESIS_LOCAL_REPOSITORIES } from './genesis-local-repositories';
import { generationKeyStorageParts } from '../../data/local/repository/local-repository-support';
import { appendGalaxyKnowledgeCatalogPageCAT1 } from './galaxy-knowledge-catalog-page-cache.model';
import {
  GALAXY_SCIENTIFIC_MODEL_VERSION,
  galaxyKnowledgeRevision,
} from './galaxy-knowledge-snapshot.runtime';
import {
  type GalaxyKnowledgeCatalogDataRequest,
  type GalaxyKnowledgeCatalogDataResult,
} from '../galaxy-knowledge-catalog/galaxy-knowledge-catalog.model';

import {
  galaxyKnowledgeCatalogPageCacheKeyCAT1,
  galaxyKnowledgeCatalogPageCacheableCAT1,
  restoreGalaxyKnowledgeCatalogPagesCAT1,
} from './galaxy-knowledge-catalog-page-cache.model';

const MAX_HOT_PAGES = 64;

/**
 * Fetches the current persisted revision before serving a hit. In particular,
 * a catalogue page never becomes permission to reveal an undiscovered object.
 * A completed page is retained in memory and as an optional, bounded fragment
 * of the existing galactic scientific snapshot (no IndexedDB schema upgrade).
 */
export interface GalaxyKnowledgeCatalogPageStoreCAT1 extends Pick<GalaxyKnowledgeSnapshotRepository, 'get'> {
  updateCatalogPageIfRevisionMatches?(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    scientificModelVersion: number,
    expectedKnowledgeRevision: string,
    pageKey: string,
    result: GalaxyKnowledgeCatalogDataResult,
  ): Promise<boolean>;
}

/** Keep catalog-page persistence in the presentation/runtime layer: the lower
 * repository must not depend on catalogue presentation models. */
export class DexieGalaxyKnowledgeCatalogPageStoreCAT1 implements GalaxyKnowledgeCatalogPageStoreCAT1 {
  constructor(
    private readonly database: GenesisIndexedDb,
    private readonly snapshots: GalaxyKnowledgeSnapshotRepository =
      new DexieGalaxyKnowledgeSnapshotRepository(database),
  ) {}

  get(generationKey: UniverseGenerationKey, galaxyIndex: bigint, version: number) {
    return this.snapshots.get(generationKey, galaxyIndex, version);
  }

  async updateCatalogPageIfRevisionMatches(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    scientificModelVersion: number,
    expectedKnowledgeRevision: string,
    pageKey: string,
    result: GalaxyKnowledgeCatalogDataResult,
  ): Promise<boolean> {
    await this.database.openDatabase();
    const {universeSeed, generatorVersionCode} = generationKeyStorageParts(generationKey);
    const indexKey = [universeSeed, generatorVersionCode, galaxyIndex.toString(10), scientificModelVersion] as const;
    return this.database.transaction('rw', this.database.galaxyKnowledgeSnapshots, async () => {
      const stored = await this.database.galaxyKnowledgeSnapshots.get(indexKey);
      if (stored && stored.knowledgeRevision !== expectedKnowledgeRevision) return false;
      const catalogPagesJson = appendGalaxyKnowledgeCatalogPageCAT1(stored?.catalogPagesJson, pageKey, result);
      if (catalogPagesJson === null) return false;
      if (stored) {
        await this.database.galaxyKnowledgeSnapshots.update(indexKey, {catalogPagesJson});
      } else {
        await this.database.galaxyKnowledgeSnapshots.put({
          universeSeed, generatorVersionCode, galaxyIndex:galaxyIndex.toString(10),
          scientificModelVersion, knowledgeRevision: expectedKnowledgeRevision,
          catalogPagesJson, updatedAtEpochMs: Date.now(),
        });
      }
      return true;
    });
  }
}

export class DexieGalaxyKnowledgeCatalogPageCacheRuntimeCAT1 {
  private readonly hot = new Map<string, GalaxyKnowledgeCatalogDataResult>();
  private readonly pending = new Map<string, Promise<GalaxyKnowledgeCatalogDataResult>>();
  private readonly revisionMemo = new WeakMap<readonly object[], Readonly<{ identity: string; revision: string }>>();

  constructor(
    private readonly snapshots: GalaxyKnowledgeCatalogPageStoreCAT1,
    private readonly discoveries: Pick<DiscoveryRepository, 'getKnownDiscoveries' | 'getKnownDiscoveriesInGalaxy'>,
  ) {}

  async resolve(
    request: GalaxyKnowledgeCatalogDataRequest,
    loader: () => Promise<GalaxyKnowledgeCatalogDataResult>,
  ): Promise<GalaxyKnowledgeCatalogDataResult> {
    // No speculative caching for exploration UI, nor for in-progress VIDA.9.
    if (request.scientificOnly !== true) return loader();

    const started = performance.now();
    const generationKey = request.generationKey;
    const galaxyIndex = request.galaxyIndex;
    // The cache is optional. An unsupported/scoped discovery repository must
    // not turn a working category query into a navigation failure.
    let known: Awaited<ReturnType<DiscoveryRepository['getKnownDiscoveries']>>;
    try {
      known = this.discoveries.getKnownDiscoveriesInGalaxy
        ? await this.discoveries.getKnownDiscoveriesInGalaxy(generationKey, galaxyIndex)
        : (await this.discoveries.getKnownDiscoveries(generationKey)).filter(row => row.locator.galaxyIndex === galaxyIndex);
    } catch {
      return loader();
    }
    const revision = this.knowledgeRevision(generationKey, galaxyIndex, known);
    const identity = [generationKey.universeSeed.serialize(), generationKey.generatorVersionCode,
      galaxyIndex.toString(), GALAXY_SCIENTIFIC_MODEL_VERSION, revision].join('/');
    const pageKey = galaxyKnowledgeCatalogPageCacheKeyCAT1(request);
    const key = `${identity}|${pageKey}`;
    const discoveryMs = performance.now() - started;
    const hot = this.hot.get(key);
    if (hot !== undefined) {
      this.hot.delete(key);
      this.hot.set(key, hot);
      this.logTiming(request, 'memoria', discoveryMs, 0, 0);
      return hot;
    }
    const pending = this.pending.get(key);
    if (pending) return pending;

    const resolvePage = async (): Promise<GalaxyKnowledgeCatalogDataResult> => {
      const afterDiscovery = performance.now();
      // A legacy snapshot may exist with an older knowledge revision. Never
      // restore old pages even if their query strings happen to match.
      let stored;
      try {
        stored = await this.snapshots.get(generationKey, galaxyIndex, GALAXY_SCIENTIFIC_MODEL_VERSION);
      } catch {
        stored = undefined; // Optional acceleration must not prevent navigation.
      }
      if (stored?.knowledgeRevision === revision) {
        const saved = restoreGalaxyKnowledgeCatalogPagesCAT1(stored.catalogPagesJson)
          .entries.find(entry => entry.key === pageKey);
        if (saved) {
          this.logTiming(request, 'IndexedDB', discoveryMs, performance.now()-afterDiscovery, 0);
          return this.remember(key, saved.result);
        }
      }

      const afterRead = performance.now();
      const result = await loader();
      const buildMs = performance.now() - afterRead;
      this.logTiming(request, 'construcción', discoveryMs, afterRead-afterDiscovery, buildMs);
      if (!galaxyKnowledgeCatalogPageCacheableCAT1(result)) return result;
      this.remember(key, result);
      // A read-model write failure must never fail an otherwise valid list.
      try {
        await this.snapshots.updateCatalogPageIfRevisionMatches?.(
          generationKey, galaxyIndex, GALAXY_SCIENTIFIC_MODEL_VERSION,
          revision, pageKey, result,
        );
      } catch {
        // IndexedDB quota, browser restrictions or concurrent disposal.
      }
      return result;
    };
    const task = resolvePage();
    this.pending.set(key, task);
    try {
      return await task;
    } finally {
      if (this.pending.get(key) === task) this.pending.delete(key);
    }
  }

  private logTiming(
    request: GalaxyKnowledgeCatalogDataRequest,
    source: 'memoria' | 'IndexedDB' | 'construcción',
    discoveryMs: number,
    readMs: number,
    buildMs: number,
  ): void {
    // Opt-in diagnostics; never log the universe seed or biological records.
    if (typeof window === 'undefined' || !new URLSearchParams(window.location.search).has('debugCatalog')) return;
    console.info('[GENESIS CACHE-CAT.1]', {
      galaxy: request.galaxyIndex.toString(),
      category: request.query.category,
      source,
      discoveryMs: Math.round(discoveryMs),
      snapshotMs: Math.round(readMs),
      buildMs: Math.round(buildMs),
    });
  }

  private knowledgeRevision(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    discoveries: readonly object[],
  ): string {
    const frozen = Object.isFrozen(discoveries);
    const identity = `${generationKey.universeSeed.serialize()}|${generationKey.generatorVersionCode}|${galaxyIndex}`;
    if (frozen) {
      const memo = this.revisionMemo.get(discoveries);
      if (memo?.identity === identity) return memo.revision;
    }
    const canonical = canonicalGalaxyKnownDiscoveries(
      generationKey, galaxyIndex, discoveries as Parameters<typeof canonicalGalaxyKnownDiscoveries>[2],
    );
    const revision = galaxyKnowledgeRevision(galaxyIndex, canonical);
    if (frozen) this.revisionMemo.set(discoveries, {identity, revision});
    return revision;
  }

  private remember(key: string, result: GalaxyKnowledgeCatalogDataResult): GalaxyKnowledgeCatalogDataResult {
    this.hot.delete(key);
    this.hot.set(key, result);
    if (this.hot.size > MAX_HOT_PAGES) this.hot.delete(this.hot.keys().next().value!);
    return result;
  }
}

export const GALAXY_KNOWLEDGE_CATALOG_PAGE_CACHE_CAT1 =
  new InjectionToken<DexieGalaxyKnowledgeCatalogPageCacheRuntimeCAT1>(
    'GALAXY_KNOWLEDGE_CATALOG_PAGE_CACHE_CAT1', {
      providedIn: 'root',
      factory: () => new DexieGalaxyKnowledgeCatalogPageCacheRuntimeCAT1(
        new DexieGalaxyKnowledgeCatalogPageStoreCAT1(new GenesisIndexedDb()),
        inject(GENESIS_LOCAL_REPOSITORIES).discoveryRepository,
      ),
    },
  );
