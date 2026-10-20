import type {
  PlanetaryHistorySourceEpisode32_1,
} from '../../domain/planetary-history/planetary-history-32-1';
import type {
  PlanetaryHistoryIntervalCacheStats32_12,
  PlanetaryHistoryIntervalOptions32_12,
  PlanetaryHistoryIntervalRequest32_12,
  PlanetaryHistoryIntervalResult32_12,
  PlanetaryHistoryIntervalSource32_12,
} from '../../domain/planetary-history/planetary-history-interval-32-12';
import { PlanetaryHistoryEngine } from './planetary-history-engine';

const DEFAULT_CACHE = 8;
const DEFAULT_LIMIT = 4096;
const DEFAULT_DEPTH = 128;

type SourceEpisode = PlanetaryHistorySourceEpisode32_1;

/**
 * GENESIS 32.12 — Pure interval reconstruction, with a bounded in-memory LRU.
 *
 * Reads only interval episodes + their causal ancestors. No full-history
 * materialization, IndexedDB writes, randomness, fake historical checkpoints,
 * fabricated dates or player-observation data in the cache.
 *
 * 32.1 validates the complete fetched causal subgraph. The return chronology
 * contains ONLY the window's overlapping episodes, retaining their original
 * stable IDs and references (including causes outside the window). 32.11
 * already restricts displayed links to the provided, authorized episodes.
 */
export class PlanetaryHistoryIntervalEngine32_12 {
  private readonly cached = new Map<string, PlanetaryHistoryIntervalResult32_12>();
  private readonly capacity: number;
  private readonly maxEvents: number;
  private readonly maxDepth: number;
  private hits = 0;
  private misses = 0;

  constructor(
    private readonly source: PlanetaryHistoryIntervalSource32_12,
    options: PlanetaryHistoryIntervalOptions32_12 = {},
  ) {
    this.capacity = positiveIntegerOrZero(options.maxCachedWindows ?? DEFAULT_CACHE,
      'maxCachedWindows');
    this.maxEvents = positiveInteger(options.maxSourceEpisodes ?? DEFAULT_LIMIT,
      'maxSourceEpisodes');
    this.maxDepth = positiveInteger(options.maxCausalDepth ?? DEFAULT_DEPTH,
      'maxCausalDepth');
    if (!source || typeof source.revision !== 'function' ||
      typeof source.readInterval !== 'function' || typeof source.readByKey !== 'function') {
      throw new TypeError('32.12 requires a bounded physical interval source.');
    }
  }

  read(request: PlanetaryHistoryIntervalRequest32_12): PlanetaryHistoryIntervalResult32_12 {
    validateRequest(request);
    const { context, version, startYear, endYear } = request;
    const currentRevision = this.source.revision(context);
    assertRevision(currentRevision, 'physical source revision');
    if (currentRevision !== version.sourceRevision) {
      throw new RangeError('Historical source revision mismatch; refresh the version manifest.');
    }
    const cacheKey = JSON.stringify([
      '32.12-CT0-v1', version.universeKey, version.physicsModelRevision,
      version.sourceRevision, context.bodyKind, context.bodyKey,
      context.multiplicity, context.time.kind, context.time.systemAgeBillionYears,
      startYear, endYear,
    ]);
    const hit = this.cached.get(cacheKey);
    if (hit) {
      this.cached.delete(cacheKey);
      this.cached.set(cacheKey, hit);
      this.hits++;
      return hit;
    }
    this.misses++;

    const candidates = this.source.readInterval(context, startYear, endYear, this.maxEvents + 1);
    if (!Array.isArray(candidates)) {
      throw new TypeError('A physical interval source must return an episode array.');
    }
    if (candidates.length > this.maxEvents) {
      throw new RangeError('Requested window exceeds the bounded historical reconstruction budget.');
    }
    const all = new Map<string, SourceEpisode>();
    const roots: string[] = [];
    const pending: { key: string; depth: number }[] = [];
    const pendingKeys = new Set<string>();

    for (const candidate of candidates) {
      const item = copyEpisode(candidate);
      assertTarget(item, context.bodyKind, context.bodyKey);
      if (item.time.endYear < startYear || item.time.startYear > endYear) {
        throw new RangeError('Interval source returned an episode outside the requested window.');
      }
      if (all.has(item.episodeKey)) {
        throw new RangeError('Interval source returned duplicate historical keys.');
      }
      all.set(item.episodeKey, item);
      roots.push(item.episodeKey);
    }
    for (const item of all.values()) for (const cause of item.causedByEpisodeKeys) {
      if (!all.has(cause) && !pendingKeys.has(cause)) {
        pending.push({ key: cause, depth: 1 });
        pendingKeys.add(cause);
      }
    }
    // Iterative closure: no recursion/stack growth with long histories.
    for (let cursor = 0; cursor < pending.length; cursor++) {
      const { key, depth } = pending[cursor];
      if (all.has(key)) continue;
      if (depth > this.maxDepth) throw new RangeError('Historical causal closure depth exceeded.');
      if (all.size >= this.maxEvents) {
        throw new RangeError('Historical causal closure exceeds the reconstruction budget.');
      }
      const sourceItem = this.source.readByKey(context, key);
      if (!sourceItem) throw new RangeError(`Historical cause ${key} is absent from its physical catalog.`);
      const item = copyEpisode(sourceItem);
      assertTarget(item, context.bodyKind, context.bodyKey);
      if (item.episodeKey !== key) {
        throw new RangeError('Physical source returned a different causal episode key.');
      }
      if (item.time.endYear >= startYear && item.time.startYear <= endYear) {
        throw new RangeError('Interval source omitted an overlapping causal episode.');
      }
      all.set(key, item);
      for (const parent of item.causedByEpisodeKeys) {
        if (!all.has(parent) && !pendingKeys.has(parent)) {
          pending.push({ key: parent, depth: depth + 1 });
          pendingKeys.add(parent);
        }
      }
    }
    // A provider can be backed by a mutable DB. Do not cache a slice read
    // across a mid-query physical source revision.
    if (this.source.revision(context) !== version.sourceRevision) {
      throw new RangeError('Historical physical source changed during the interval reconstruction.');
    }
    const built = PlanetaryHistoryEngine.build({ ...context, episodes: [...all.values()] });
    const rootSet = new Set(roots);
    const displayed = Object.freeze(built.episodes.filter(e => rootSet.has(e.episodeKey)));
    const displayedIds = new Set(displayed.map(e => e.episodeId));
    const crossIntervalCauseCount = displayed.reduce((sum, episode) =>
      sum + episode.causedByEpisodeIds.filter(id => !displayedIds.has(id)).length, 0);
    const chronology = Object.freeze({ ...built, episodes: displayed });
    const result: PlanetaryHistoryIntervalResult32_12 = Object.freeze({
      contractVersion: '32.12-CT0-v1',
      version: Object.freeze({ ...version }), startYear, endYear,
      chronology, crossIntervalCauseCount, sourceEpisodesRead: all.size,
      coverage: 'QUERIED_INTERVAL_ONLY', historicalCompleteness: 'NOT_ESTABLISHED',
    });
    if (this.capacity > 0) {
      this.cached.set(cacheKey, result);
      if (this.cached.size > this.capacity) this.cached.delete(this.cached.keys().next().value!);
    }
    return result;
  }

  clear(): void { this.cached.clear(); }

  stats(): PlanetaryHistoryIntervalCacheStats32_12 {
    return Object.freeze({ cachedWindows: this.cached.size, hits: this.hits, misses: this.misses });
  }
}

function validateRequest(request: PlanetaryHistoryIntervalRequest32_12): void {
  if (!request || typeof request !== 'object' || !request.context || !request.version) {
    throw new TypeError('32.12 requires a CT-0 context and explicit model versions.');
  }
  const { context, version, startYear, endYear } = request;
  for (const [label, value] of [
    ['universeKey', version.universeKey], ['physicsModelRevision', version.physicsModelRevision],
    ['sourceRevision', version.sourceRevision],
  ] as const) assertRevision(value, label);
  if (!context.time || context.time.kind !== 'CURRENT_SNAPSHOT' ||
    context.time.systemAgeBillionYears === null ||
    !Number.isFinite(context.time.systemAgeBillionYears) ||
    context.time.systemAgeBillionYears < 0) {
    throw new RangeError('Bounded historical reconstruction requires a resolved CT-0 system age.');
  }
  const present = Math.round(context.time.systemAgeBillionYears * 1_000_000_000);
  if (!Number.isSafeInteger(present) || !Number.isSafeInteger(startYear) ||
    !Number.isSafeInteger(endYear) || startYear < 0 || endYear < startYear ||
    endYear > present) {
    throw new RangeError('Requested interval is outside the supported CT-0 history.');
  }
  if (context.bodyKind !== 'PLANET' && context.bodyKind !== 'MOON') {
    throw new RangeError('32.12 supports planet and moon histories only.');
  }
  assertRevision(context.bodyKey, 'bodyKey');
  if (!['SINGLE', 'BINARY', 'TRIPLE', 'UNKNOWN'].includes(context.multiplicity)) {
    throw new RangeError('Invalid stellar architecture.');
  }
}

function assertRevision(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0 || value.trim() !== value ||
    value.includes('\u0000')) {
    throw new RangeError(`${label} must be a stable nonempty normalized identifier.`);
  }
}

function assertTarget(item: SourceEpisode, kind: string, key: string): void {
  if (item.targetBodyKind !== kind || item.targetBodyKey !== key) {
    throw new RangeError('Physical history source returned an episode belonging to another body.');
  }
}

function copyEpisode(item: SourceEpisode): SourceEpisode {
  if (!item || typeof item !== 'object' || !item.time || !item.source ||
    !Array.isArray(item.causedByEpisodeKeys)) {
    throw new TypeError('Malformed source history episode.');
  }
  // Snapshot the provider-owned record to prevent later mutation/cache poisoning.
  return Object.freeze({ ...item, time: Object.freeze({ ...item.time }),
    source: Object.freeze({ ...item.source }),
    causedByEpisodeKeys: Object.freeze([...item.causedByEpisodeKeys]) });
}

function positiveInteger(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < 1) throw new RangeError(`${name} must be positive.`);
  return value;
}
function positiveIntegerOrZero(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(`${name} must be nonnegative.`);
  return value;
}
