import { describe, it, expect } from 'vitest';
import type {
  PlanetaryHistorySourceEpisode32_1, PlanetaryHistoryInput32_1,
} from '../../domain/planetary-history/planetary-history-32-1';
import type {
  PlanetaryHistoryIntervalRequest32_12, PlanetaryHistoryIntervalSource32_12,
} from '../../domain/planetary-history/planetary-history-interval-32-12';
import { PlanetaryHistoryIntervalEngine32_12 } from './planetary-history-interval-engine-32-12';
import { PlanetaryHistoryTimelineModel32_11 } from '../../presentation/planetary-history/planetary-history-timeline-model-32-11';

type Ctx = Omit<PlanetaryHistoryInput32_1, 'episodes'>;
const ctx: Ctx = {
  bodyKind: 'PLANET', bodyKey: 'G0/S9/O1/B2', multiplicity: 'SINGLE',
  time: { kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: 4.6 },
};
const version = { universeKey: 'canonical-v2-seed-fingerprint',
  physicsModelRevision: 'physics-32.10', sourceRevision: 'source-1' };
function event(key: string, start: number, end = start, parents: readonly string[] = [],
  overrides: Partial<PlanetaryHistorySourceEpisode32_1> = {}): PlanetaryHistorySourceEpisode32_1 {
  return {
    episodeKey: key, targetBodyKind: ctx.bodyKind, targetBodyKey: ctx.bodyKey,
    kind: 'ATMOSPHERE_TRANSITION',
    time: { timeScale: 'YEARS_SINCE_SYSTEM_FORMATION', startYear: start, endYear: end,
      resolution: start === end ? 'MODELLED_INSTANT' : 'MODELLED_INTERVAL' },
    source: { sourcePhase: '32.3', sourceModel: 'PhysicalCatalog',
      sourceRecordKey: `rec-${key}`, evidenceKind: 'RESOLVED_PHYSICAL_EVENT' },
    causedByEpisodeKeys: parents, ...overrides,
  };
}
const req = (startYear: number, endYear: number, context = ctx, v = version):
  PlanetaryHistoryIntervalRequest32_12 => ({ context, version: v, startYear, endYear });

class Catalog implements PlanetaryHistoryIntervalSource32_12 {
  revisionTag = 'source-1';
  calls = 0;
  directCalls = 0;
  readonly requests: [number, number][] = [];
  constructor(readonly events: readonly PlanetaryHistorySourceEpisode32_1[]) {}
  revision(): string { return this.revisionTag; }
  readInterval(context: Ctx, start: number, end: number): readonly PlanetaryHistorySourceEpisode32_1[] {
    this.calls++;
    this.requests.push([start, end]);
    return this.events.filter(e => e.targetBodyKey === context.bodyKey &&
      e.targetBodyKind === context.bodyKind && e.time.startYear <= end && e.time.endYear >= start);
  }
  readByKey(context: Ctx, key: string): PlanetaryHistorySourceEpisode32_1 | null {
    this.directCalls++;
    return this.events.find(e => e.episodeKey === key && e.targetBodyKey === context.bodyKey &&
      e.targetBodyKind === context.bodyKind) ?? null;
  }
}
function withCatalog(events: readonly PlanetaryHistorySourceEpisode32_1[],
  options: ConstructorParameters<typeof PlanetaryHistoryIntervalEngine32_12>[1] = {}) {
  const source = new Catalog(events);
  return { source, engine: new PlanetaryHistoryIntervalEngine32_12(source, options) };
}

describe('GENESIS 32.12 — versioned bounded CT-0 history reconstruction', () => {
  it('returns an empty bounded slice without inventing absent episodes or historical completeness', () => {
    const { engine } = withCatalog([]);
    const r = engine.read(req(5, 50));
    expect(r.chronology.episodes.length).toBe(0);
    expect(r.coverage).toBe('QUERIED_INTERVAL_ONLY');
    expect(r.historicalCompleteness).toBe('NOT_ESTABLISHED');
    expect(r.chronology.lifePresence).toBe('NOT_EVALUATED');
  });
  it('fetches only the exact inclusive interval, not a complete history', () => {
    const { source, engine } = withCatalog([event('a', 4), event('b', 15), event('c', 50)]);
    expect(engine.read(req(15, 15)).chronology.episodes.map(e => e.episodeKey)).toEqual(['b']);
    expect(source.requests).toEqual([[15, 15]]);
    expect(source.directCalls).toBe(0);
  });
  it('includes both ends of an inclusive interval', () => {
    const { engine } = withCatalog([event('a', 10), event('b', 20), event('c', 21)]);
    expect(engine.read(req(10, 20)).chronology.episodes.map(e => e.episodeKey)).toEqual(['a', 'b']);
  });
  it('includes episodes overlapping the interval even if they started earlier or end later', () => {
    const { engine } = withCatalog([event('older', 5, 12), event('later', 19, 35)]);
    expect(engine.read(req(10, 20)).chronology.episodes.map(e => e.episodeKey))
      .toEqual(['older', 'later']);
  });
  it('orders matching episodes deterministically even when the physical catalog is shuffled', () => {
    const a = event('a', 10), b = event('b', 10), c = event('c', 5);
    expect(JSON.stringify(withCatalog([a, b, c]).engine.read(req(0, 15)).chronology.episodes))
      .toBe(JSON.stringify(withCatalog([b, c, a]).engine.read(req(0, 15)).chronology.episodes));
  });
  it('preserves the exact physical source identities across overlapping queries', () => {
    const { engine } = withCatalog([event('a', 10), event('b', 20)]);
    expect(engine.read(req(0, 20)).chronology.episodes[1].episodeId)
      .toBe(engine.read(req(15, 25)).chronology.episodes[0].episodeId);
  });
  it('loads an outside-window causal ancestor for validation without displaying it', () => {
    const { engine, source } = withCatalog([event('past', 5), event('effect', 20, 20, ['past'])]);
    const r = engine.read(req(20, 30));
    expect(r.chronology.episodes.map(e => e.episodeKey)).toEqual(['effect']);
    expect(r.chronology.episodes[0].causedByEpisodeIds.length).toBe(1);
    expect(r.crossIntervalCauseCount).toBe(1);
    expect(r.sourceEpisodesRead).toBe(2);
    expect(source.directCalls).toBe(1);
  });
  it('resolves a chain of older causes without inserting them into the returned window', () => {
    const { engine } = withCatalog([
      event('a', 1), event('b', 2, 2, ['a']), event('c', 3, 3, ['b']),
      event('d', 4, 4, ['c']),
    ]);
    const r = engine.read(req(4, 4));
    expect(r.chronology.episodes.map(e => e.episodeKey)).toEqual(['d']);
    expect(r.sourceEpisodesRead).toBe(4);
  });
  it('keeps linked in-window episodes and their cause/consequence identity', () => {
    const { engine } = withCatalog([event('a', 10), event('b', 20, 20, ['a'])]);
    const r = engine.read(req(10, 20));
    expect(r.chronology.episodes[1].causedByEpisodeIds)
      .toEqual([r.chronology.episodes[0].episodeId]);
    expect(r.crossIntervalCauseCount).toBe(0);
  });
  it('rejects omitted causally referenced episodes that should overlap the window', () => {
    const missing = event('past', 10);
    const physical = new Catalog([missing, event('effect', 20, 20, ['past'])]);
    physical.readInterval = () => [event('effect', 20, 20, ['past'])];
    const engine = new PlanetaryHistoryIntervalEngine32_12(physical);
    expect(() => engine.read(req(10, 20))).toThrow();
  });
  it('rejects a missing physical cause, never silently drops the causal edge', () => {
    const { engine } = withCatalog([event('e', 10, 10, ['absent'])]);
    expect(() => engine.read(req(10, 10))).toThrow();
  });
  it('rejects a cause that begins after its effect', () => {
    const { engine } = withCatalog([event('effect', 5, 5, ['future']), event('future', 50)]);
    expect(() => engine.read(req(5, 5))).toThrow();
  });
  it('rejects cyclic causal history including cycles wholly outside the interval', () => {
    const { engine } = withCatalog([
      event('effect', 10, 10, ['a']), event('a', 1, 1, ['b']), event('b', 1, 1, ['a']),
    ]);
    expect(() => engine.read(req(10, 10))).toThrow();
  });
  it('rejects duplicate history episode keys', () => {
    const { engine } = withCatalog([event('duplicate', 10), event('duplicate', 10)]);
    expect(() => engine.read(req(10, 10))).toThrow();
  });
  it('rejects an out-of-window record delivered by a buggy source', () => {
    const source = new Catalog([event('a', 11)]);
    source.readInterval = () => [event('a', 11)];
    expect(() => new PlanetaryHistoryIntervalEngine32_12(source).read(req(0, 10))).toThrow();
  });
  it('rejects invalid planet and moon source cross-contamination', () => {
    const source = new Catalog([event('wrong', 10, 10, [], { targetBodyKey: 'other' })]);
    source.readInterval = () => source.events;
    expect(() => new PlanetaryHistoryIntervalEngine32_12(source).read(req(0, 20))).toThrow();
  });
  it('rejects an invalid readByKey response with a mismatched key', () => {
    const source = new Catalog([event('e', 10, 10, ['a']), event('a', 2)]);
    source.readByKey = () => event('instead', 2);
    expect(() => new PlanetaryHistoryIntervalEngine32_12(source).read(req(10, 10))).toThrow();
  });
  it('does not promote a risk forecast to a physically realized impact', () => {
    const { engine } = withCatalog([event('risk', 10, 10, [], {
      kind: 'REALIZED_IMPACT', source: { sourcePhase: '23.8', sourceModel: 'Risk',
        sourceRecordKey: 'risk', evidenceKind: 'INFERRED_PHYSICAL_EPISODE' },
    })]);
    expect(() => engine.read(req(10, 10))).toThrow();
  });
  it('does not infer life, extinctions, or recoveries from any historical event', () => {
    const { engine } = withCatalog([event('a', 10)]);
    expect(engine.read(req(10, 10)).chronology.lifePresence).toBe('NOT_EVALUATED');
  });
  it('accepts planet and moon histories as distinct bodies without mixing keys', () => {
    const moonCtx: Ctx = { ...ctx, bodyKind: 'MOON', bodyKey: `${ctx.bodyKey}/M1` };
    const moon = event('moon', 10, 10, [], {
      targetBodyKind: moonCtx.bodyKind, targetBodyKey: moonCtx.bodyKey,
    });
    const { engine } = withCatalog([event('planet', 10), moon]);
    expect(engine.read(req(10, 10)).chronology.episodes.map(e => e.episodeKey)).toEqual(['planet']);
    expect(engine.read(req(10, 10, moonCtx)).chronology.episodes.map(e => e.episodeKey))
      .toEqual(['moon']);
  });
  it('is architecture-neutral for SINGLE, BINARY and TRIPLE', () => {
    const { engine } = withCatalog([event('a', 10)]);
    for (const multiplicity of ['SINGLE', 'BINARY', 'TRIPLE'] as const) {
      expect(engine.read(req(10, 10, { ...ctx, multiplicity })).chronology.episodes.length).toBe(1);
    }
  });
  it('rejects unknown CT-0 age instead of calling an interval empty', () => {
    const { engine, source } = withCatalog([]);
    expect(() => engine.read(req(0, 10, { ...ctx, time: {
      kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: null,
    } }))).toThrow();
    expect(source.calls).toBe(0);
  });
  it('rejects future, negative, reversed, fractional and unsafe windows', () => {
    const { engine } = withCatalog([]);
    for (const [a, b] of [[-1, 5], [10, 5], [0.5, 10], [0, 4_600_000_001],
      [1, Number.MAX_SAFE_INTEGER + 1], [0, Infinity]]) {
      expect(() => engine.read(req(a, b))).toThrow();
    }
  });
  it('rejects a source revision changing between interval reads and causal validation', () => {
    const catalog = new Catalog([event('a', 10)]);
    let calls = 0;
    catalog.revision = () => ++calls === 1 ? 'source-1' : 'source-2';
    const engine = new PlanetaryHistoryIntervalEngine32_12(catalog);
    expect(() => engine.read(req(10, 10))).toThrow();
    expect(engine.stats().cachedWindows).toBe(0);
  });
  it('rejects invalid version fields and a stale physical source revision', () => {
    const { engine, source } = withCatalog([event('a', 10)]);
    expect(() => engine.read(req(10, 10, ctx, { ...version, universeKey: '' }))).toThrow();
    source.revisionTag = 'source-2';
    expect(() => engine.read(req(10, 10))).toThrow();
  });
  it('does not return an old cached history when the underlying physical revision changed', () => {
    const { engine, source } = withCatalog([event('a', 10)]);
    engine.read(req(10, 10));
    source.revisionTag = 'source-2';
    expect(() => engine.read(req(10, 10))).toThrow();
  });
  it('separates model, universe and source revisions in its reproducible cache key', () => {
    const { engine, source } = withCatalog([event('a', 10)]);
    engine.read(req(10, 10));
    engine.read(req(10, 10, ctx, { ...version, universeKey: 'other-universe' }));
    engine.read(req(10, 10, ctx, { ...version, physicsModelRevision: 'new-physics' }));
    source.revisionTag = 'new-source';
    engine.read(req(10, 10, ctx, { ...version, sourceRevision: 'new-source' }));
    expect(source.calls).toBe(4);
  });
  it('reuses repeated windows with bounded LRU memory rather than recomputing them', () => {
    const { engine, source } = withCatalog([event('a', 10)]);
    const first = engine.read(req(0, 10));
    const second = engine.read(req(0, 10));
    expect(first === second).toBe(true);
    expect(source.calls).toBe(1);
    expect(engine.stats()).toEqual({ cachedWindows: 1, hits: 1, misses: 1 });
  });
  it('evicts least recently used intervals on a hard cache limit', () => {
    const { engine, source } = withCatalog([event('a', 10)], { maxCachedWindows: 2 });
    engine.read(req(0, 1)); engine.read(req(2, 3)); engine.read(req(0, 1));
    engine.read(req(4, 5)); engine.read(req(2, 3));
    expect(source.calls).toBe(4);
    expect(engine.stats().cachedWindows).toBe(2);
  });
  it('supports an entirely disabled cache and an explicit clear operation', () => {
    const noCache = withCatalog([event('a', 10)], { maxCachedWindows: 0 });
    noCache.engine.read(req(10, 10)); noCache.engine.read(req(10, 10));
    expect(noCache.source.calls).toBe(2);
    expect(noCache.engine.stats().cachedWindows).toBe(0);
    const cached = withCatalog([event('a', 10)]);
    cached.engine.read(req(10, 10)); cached.engine.clear(); cached.engine.read(req(10, 10));
    expect(cached.source.calls).toBe(2);
  });
  it('enforces a hard bound on event counts and does not cache rejected requests', () => {
    const { engine } = withCatalog([event('a', 10), event('b', 10), event('c', 10)],
      { maxSourceEpisodes: 2 });
    expect(() => engine.read(req(10, 10))).toThrow();
    expect(engine.stats().cachedWindows).toBe(0);
  });
  it('enforces the causal closure event budget across window boundaries', () => {
    const { engine } = withCatalog([event('a', 1), event('b', 2, 2, ['a']),
      event('c', 3, 3, ['b'])], { maxSourceEpisodes: 2 });
    expect(() => engine.read(req(3, 3))).toThrow();
  });
  it('enforces the causal closure depth budget', () => {
    const { engine } = withCatalog([event('a', 1), event('b', 2, 2, ['a']),
      event('c', 3, 3, ['b'])], { maxCausalDepth: 1 });
    expect(() => engine.read(req(3, 3))).toThrow();
  });
  it('rejects malformed cache/resource options', () => {
    const source = new Catalog([]);
    expect(() => new PlanetaryHistoryIntervalEngine32_12(source, { maxCachedWindows: -1 })).toThrow();
    expect(() => new PlanetaryHistoryIntervalEngine32_12(source, { maxSourceEpisodes: 0 })).toThrow();
    expect(() => new PlanetaryHistoryIntervalEngine32_12(source, { maxCausalDepth: 2.3 })).toThrow();
  });
  it('copies physical provider records and returns frozen canonical rows', () => {
    const physical = event('a', 10);
    const { engine } = withCatalog([physical]);
    const r = engine.read(req(10, 10));
    expect(Object.isFrozen(r)).toBe(true);
    expect(Object.isFrozen(r.chronology.episodes[0])).toBe(true);
    expect(Object.isFrozen(r.chronology.episodes[0].source)).toBe(true);
    expect(Object.isFrozen(r.version)).toBe(true);
  });
  it('feeds the real 32.11 projection without exposing outside-window causes as visible', () => {
    const { engine } = withCatalog([event('past', 1), event('effect', 20, 20, ['past'])]);
    const r = engine.read(req(20, 20));
    const projection = PlanetaryHistoryTimelineModel32_11.build(r.chronology, {
      perspective: 'SIMULATED_REALITY', discovery: 'CONFIRMED',
      ficheAuthorized: true, publishedEpisodeIds: [],
    });
    expect(projection.rows.length).toBe(1);
    expect(projection.rows[0].visibleCauseIds.length).toBe(0);
    expect(projection.coverageLabel.includes('Cobertura parcial')).toBe(true);
  });
  it('uses the actual 32.11 knowledge gate so CONFIRMED does not expose unobserved events', () => {
    const { engine } = withCatalog([event('public', 10), event('private', 20)]);
    const r = engine.read(req(0, 20));
    const publicId = r.chronology.episodes[0].episodeId;
    const privateId = r.chronology.episodes[1].episodeId;
    const visible = PlanetaryHistoryTimelineModel32_11.build(r.chronology, {
      perspective: 'OBSERVED_KNOWLEDGE', discovery: 'CONFIRMED',
      ficheAuthorized: true, publishedEpisodeIds: [publicId],
    });
    expect(visible.rows.length).toBe(1);
    expect(JSON.stringify(visible).includes(privateId)).toBe(false);
    const locked = PlanetaryHistoryTimelineModel32_11.build(r.chronology, {
      perspective: 'OBSERVED_KNOWLEDGE', discovery: 'CATALOGUED',
      ficheAuthorized: true, publishedEpisodeIds: [publicId],
    });
    expect(locked.status).toBe('LOCKED');
    expect(locked.bodyKey).toBeNull();
    expect(locked.rows.length).toBe(0);
  });
  it('handles a 5,000-event synthetic source by returning only the 10-episode requested window', () => {
    const events = Array.from({ length: 5000 }, (_, i) => event(`event-${i}`, 100 + i));
    const { engine, source } = withCatalog(events);
    const r = engine.read(req(270, 279));
    expect(r.chronology.episodes.length).toBe(10);
    expect(r.sourceEpisodesRead).toBe(10);
    expect(source.requests).toEqual([[270, 279]]);
    expect(engine.stats().cachedWindows).toBe(1);
  });
});
