import type {
  PlanetaryHistoryChronology32_1,
  PlanetaryHistoryInput32_1,
  PlanetaryHistorySourceEpisode32_1,
} from './planetary-history-32-1';

/**
 * 32.12 — Versioned on-demand history queries. All dates are inclusive,
 * integer CT-0 model-years since formation of the SAME system.
 *
 * This is an internal SIMULATED_REALITY contract. Publication to players is
 * performed separately by the authorization-aware 32.11 timeline projection.
 * An interval does NOT imply historical completeness or absence of other events.
 */
export interface PlanetaryHistoryVersion32_12 {
  /** Stable opaque identifier of the canonical generated universe/scenario. */
  readonly universeKey: string;
  /** The physical generator/domain schema revision; changes invalidate caches. */
  readonly physicsModelRevision: string;
  /** Composite revision of all physical historical event catalogs used by source. */
  readonly sourceRevision: string;
}

export interface PlanetaryHistoryIntervalRequest32_12 {
  readonly context: Omit<PlanetaryHistoryInput32_1, 'episodes'>;
  readonly version: PlanetaryHistoryVersion32_12;
  /** Inclusive interval on the common CT-0 system-formation axis. */
  readonly startYear: number;
  readonly endYear: number;
}

/**
 * Caller-supplied bounded physical source, NOT a precomputed full timeline.
 *
 * readInterval must emit *only* episodes overlapping the requested interval,
 * and should stop after maxResults (the engine detects overflow).
 * readByKey resolves historical causes across the window boundary as required.
 * revision must change whenever the source's physical data changes; mismatch
 * is rejected before a cached response is returned.
 *
 * Implementations can read lazy catalogs, IndexedDB records, or future workers.
 * No method here writes/persists histories or synthesizes missing events.
 */
export interface PlanetaryHistoryIntervalSource32_12 {
  revision(context: Omit<PlanetaryHistoryInput32_1, 'episodes'>): string;
  readInterval(
    context: Omit<PlanetaryHistoryInput32_1, 'episodes'>,
    startYear: number, endYear: number, maxResults: number,
  ): readonly PlanetaryHistorySourceEpisode32_1[];
  readByKey(
    context: Omit<PlanetaryHistoryInput32_1, 'episodes'>,
    episodeKey: string,
  ): PlanetaryHistorySourceEpisode32_1 | null;
}

export interface PlanetaryHistoryIntervalOptions32_12 {
  /** Maximum cached windows, including different planets; default 8. */
  readonly maxCachedWindows?: number;
  /** Hard bound on total events fetched (window + causal closure); default 4096. */
  readonly maxSourceEpisodes?: number;
  /** Hard bound on recursive causal depth; default 128. */
  readonly maxCausalDepth?: number;
}

export interface PlanetaryHistoryIntervalResult32_12 {
  readonly contractVersion: '32.12-CT0-v1';
  readonly version: PlanetaryHistoryVersion32_12;
  readonly startYear: number;
  readonly endYear: number;
  /** A 32.1-compatible chronology containing *only* overlapping episodes. */
  readonly chronology: PlanetaryHistoryChronology32_1;
  /** Ancestors outside the interval were validated but are never in chronology. */
  readonly crossIntervalCauseCount: number;
  /** Number of source records loaded to validate this window, never the world's total. */
  readonly sourceEpisodesRead: number;
  readonly coverage: 'QUERIED_INTERVAL_ONLY';
  readonly historicalCompleteness: 'NOT_ESTABLISHED';
}

export interface PlanetaryHistoryIntervalCacheStats32_12 {
  readonly cachedWindows: number;
  readonly hits: number;
  readonly misses: number;
}
