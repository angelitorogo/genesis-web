import { describe, expect, it } from 'vitest';
import type {
  PlanetaryHistoryInput32_1, PlanetaryHistorySourceEpisode32_1,
} from '../../domain/planetary-history/planetary-history-32-1';
import { PlanetaryHistoryEngine } from './planetary-history-engine';

const base: PlanetaryHistoryInput32_1 = {
  bodyKind: 'PLANET', bodyKey: 'G0/S7/O0/B2', multiplicity: 'SINGLE',
  time: { kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: 4.6 },
  episodes: [],
};
function episode(
  key: string, startYear: number, endYear = startYear,
  overrides: Partial<PlanetaryHistorySourceEpisode32_1> = {},
): PlanetaryHistorySourceEpisode32_1 {
  return {
    episodeKey: key, targetBodyKind: 'PLANET', targetBodyKey: base.bodyKey,
    kind: 'ATMOSPHERE_TRANSITION',
    time: { timeScale: 'YEARS_SINCE_SYSTEM_FORMATION',
      startYear, endYear, resolution: startYear === endYear
        ? 'MODELLED_INSTANT' : 'MODELLED_INTERVAL' },
    source: { sourcePhase: '32.3', sourceModel: 'AtmosphereTransitionModel',
      sourceRecordKey: `physical.${key}`, evidenceKind: 'RESOLVED_PHYSICAL_EVENT' },
    causedByEpisodeKeys: [],
    ...overrides,
  };
}
function build(events: readonly PlanetaryHistorySourceEpisode32_1[] = [],
  input = base) {
  return PlanetaryHistoryEngine.build({ ...input, episodes: events });
}
function fails(event: PlanetaryHistorySourceEpisode32_1) {
  return () => build([event]);
}

describe('GENESIS 32.1 — PlanetaryHistoryEngine canonical causal chronology / CT-0', () => {
  it('does not invent a formation, ocean, catastrophe or biology from an empty input', () => {
    const result = build();
    expect(result.episodes).toEqual([]);
    expect(result.historicalCompleteness).toBe('NOT_ESTABLISHED');
    expect(result.coverage).toBe('SUPPLIED_EPISODES_ONLY');
    expect(result.lifePresence).toBe('NOT_EVALUATED');
    expect(result.layer).toBe('SIMULATED_REALITY');
    expect(result.presentYearAfterFormation).toBe(4_600_000_000);
  });
  it('allows an unresolved CT-0 age only when there are no episodes', () => {
    const ctx = { ...base, time: { kind: 'CURRENT_SNAPSHOT' as const,
      systemAgeBillionYears: null } };
    expect(build([], ctx).presentYearAfterFormation).toBe(null);
    expect(() => build([episode('a', 10)], ctx)).toThrow();
  });
  it('sorts historical episodes by ascending absolute system-age time', () => {
    const ids = build([episode('late', 70), episode('early', 4), episode('middle', 30)])
      .episodes.map((x) => x.episodeKey);
    expect(ids).toEqual(['early', 'middle', 'late']);
  });
  it('uses end time to break same-start ties without a cause dependency', () => {
    const ids = build([
      episode('slow', 10, 20), episode('short', 10, 11), episode('point', 10),
    ]).episodes.map((x) => x.episodeKey);
    expect(ids).toEqual(['point', 'short', 'slow']);
  });
  it('gives identical IDs and ordering for reordered source arrays and repeated calls', () => {
    const a = episode('a', 100), b = episode('b', 100), c = episode('c', 20);
    const one = build([a, b, c]);
    const two = build([c, b, a]);
    expect(JSON.stringify(one)).toBe(JSON.stringify(two));
    expect(JSON.stringify(build([a, b, c]))).toBe(JSON.stringify(one));
  });
  it('stable IDs contain body/provenance and cannot collide through separators', () => {
    const x = episode('a/b', 10);
    const y = episode('a', 10, 10, { source: { ...x.source, sourceRecordKey: 'physical.a/b' } });
    expect(build([x, y]).episodes[0].episodeId === build([x, y]).episodes[1].episodeId).toBe(false);
    const other = { ...base, bodyKey: 'G0/S8/O0/B2' };
    expect(build([x]).episodes[0].episodeId ===
      build([{ ...x, targetBodyKey: other.bodyKey }], other).episodes[0].episodeId).toBe(false);
  });
  it('enforces a cause before its same-year effect regardless of source order', () => {
    const cause = episode('z-cause', 100);
    const effect = episode('a-effect', 100, 100,
      { kind: 'WATER_RESERVOIR_TRANSITION', causedByEpisodeKeys: ['z-cause'] });
    const r = build([effect, cause]);
    expect(r.episodes.map((x) => x.episodeKey)).toEqual(['z-cause', 'a-effect']);
    expect(r.episodes[1].causedByEpisodeIds).toEqual([r.episodes[0].episodeId]);
  });
  it('accepts several causal parents and canonically sorts their references', () => {
    const p = episode('p', 2), q = episode('q', 4), effect = episode('e', 7, 7,
      { causedByEpisodeKeys: ['q', 'p'] });
    const r = build([effect, q, p]);
    expect(r.episodes[2].causedByEpisodeIds).toEqual(
      [r.episodes[0].episodeId, r.episodes[1].episodeId].sort(),
    );
  });
  it('allows overlapping physical intervals when the causal episode started earlier', () => {
    const r = build([episode('effect', 90, 110, { causedByEpisodeKeys: ['cause'] }),
      episode('cause', 70, 120)]);
    expect(r.episodes[0].episodeKey).toBe('cause');
  });
  it('rejects a causal dependency that begins in the future', () => {
    expect(() => build([episode('cause', 100), episode('effect', 99, 99,
      { causedByEpisodeKeys: ['cause'] })])).toThrow();
  });
  it('rejects dangling dependencies instead of silently removing them', () => {
    expect(fails(episode('effect', 100, 100,
      { causedByEpisodeKeys: ['source-not-supplied'] }))).toThrow();
  });
  it('rejects cycles even when all timestamps are identical', () => {
    expect(() => build([
      episode('a', 1, 1, { causedByEpisodeKeys: ['b'] }),
      episode('b', 1, 1, { causedByEpisodeKeys: ['a'] }),
    ])).toThrow();
  });
  it('rejects self-causation and duplicate cause declarations', () => {
    expect(fails(episode('a', 1, 1, { causedByEpisodeKeys: ['a'] }))).toThrow();
    expect(() => build([episode('a', 1), episode('b', 2, 2,
      { causedByEpisodeKeys: ['a', 'a'] })])).toThrow();
  });
  it('rejects duplicate episode identities and whitespace-unstable IDs', () => {
    expect(() => build([episode('x', 1), episode('x', 2)])).toThrow();
    expect(fails(episode(' bad ', 1))).toThrow();
    expect(fails(episode('', 1))).toThrow();
  });
  it('rejects an episode of another planet or moon, including in a multihost system', () => {
    expect(fails(episode('a', 1, 1, { targetBodyKey: 'another' }))).toThrow();
    expect(fails(episode('a', 1, 1, { targetBodyKind: 'MOON' }))).toThrow();
    for (const multiplicity of ['SINGLE', 'BINARY', 'TRIPLE'] as const) {
      expect(build([episode('a', 1)], { ...base, multiplicity }).episodes.length).toBe(1);
    }
  });
  it('supports a moon as the primary target without pretending that it is a planet', () => {
    const moon = { ...base, bodyKind: 'MOON' as const, bodyKey: 'G0/S7/O0/B2/M1' };
    const r = build([episode('moon-ice', 9, 15, { targetBodyKind: 'MOON',
      targetBodyKey: moon.bodyKey })], moon);
    expect(r.bodyKind).toBe('MOON');
    expect(r.episodes[0].targetBodyKind).toBe('MOON');
  });
  it('rejects future episodes and negative, fractional or unsafe years', () => {
    expect(fails(episode('future', 4_600_000_001))).toThrow();
    for (const year of [-1, 1.5, Number.NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      expect(fails(episode('bad', year))).toThrow();
    }
    expect(fails(episode('reverse', 20, 10))).toThrow();
  });
  it('rejects dates in a relative collision window until explicitly anchored to CT-0', () => {
    expect(fails(episode('collision', 5, 5, { time: {
      timeScale: 'YEARS_SINCE_SYSTEM_FORMATION', startYear: 5, endYear: 5,
      resolution: 'MODELLED_INSTANT',
    } }))).not.toThrow();
    expect(fails(episode('relative', 5, 5, { time: {
      timeScale: 'YEARS_AFTER_IMPACT_WINDOW_START' as 'YEARS_SINCE_SYSTEM_FORMATION',
      startYear: 5, endYear: 5, resolution: 'MODELLED_INSTANT',
    } }))).toThrow();
  });
  it('rejects inconsistent time-resolution declarations', () => {
    expect(fails(episode('a', 1, 2, { time: {
      timeScale: 'YEARS_SINCE_SYSTEM_FORMATION', startYear: 1, endYear: 2,
      resolution: 'MODELLED_INSTANT',
    } }))).toThrow();
    expect(fails(episode('a', 1, 1, { time: {
      timeScale: 'YEARS_SINCE_SYSTEM_FORMATION', startYear: 1, endYear: 1,
      resolution: 'INFERRED_INTERVAL',
    } }))).toThrow();
  });
  it('cannot turn risk estimates into historical impacts or inferred bursts into effects', () => {
    const inferred = { sourcePhase: '23.8', sourceModel: 'RiskEngine',
      sourceRecordKey: 'risk.only', evidenceKind: 'INFERRED_PHYSICAL_EPISODE' as const };
    expect(fails(episode('impact', 55, 55,
      { kind: 'REALIZED_IMPACT', source: inferred }))).toThrow();
    expect(fails(episode('burst', 55, 55,
      { kind: 'RESOLVED_TRANSIENT_EFFECT', source: inferred }))).toThrow();
    expect(build([episode('resolved-impact', 55, 55,
      { kind: 'REALIZED_IMPACT' })]).episodes[0].kind).toBe('REALIZED_IMPACT');
  });
  it('allows inferred geologic intervals only with appropriately inferred provenance', () => {
    const source = { sourcePhase: '32.2', sourceModel: 'CoolingResolver',
      sourceRecordKey: 'inferred.cooling', evidenceKind: 'INFERRED_PHYSICAL_EPISODE' as const };
    const r = build([episode('cooling', 100, 200, { kind: 'INTERIOR_COOLING',
      source, time: { timeScale: 'YEARS_SINCE_SYSTEM_FORMATION',
        startYear: 100, endYear: 200, resolution: 'INFERRED_INTERVAL' } })]);
    expect(r.episodes[0].source.evidenceKind).toBe('INFERRED_PHYSICAL_EPISODE');
    expect(fails(episode('wrong', 100, 200, { time: {
      timeScale: 'YEARS_SINCE_SYSTEM_FORMATION', startYear: 100,
      endYear: 200, resolution: 'INFERRED_INTERVAL',
    } }))).toThrow();
  });
  it('requires stable scientific source provenance and rejects unsupported physical episodes', () => {
    expect(fails(episode('a', 1, 1, { source: {
      sourcePhase: '', sourceModel: 'valid', sourceRecordKey: 'valid',
      evidenceKind: 'RESOLVED_PHYSICAL_EVENT',
    } }))).toThrow();
    expect(fails(episode('a', 1, 1, { kind: 'ALIEN_EXTINCTION' as 'FORMATION' }))).toThrow();
  });
  it('leaves CT-0 and all caller-owned sources immutable, while freezing the result deeply', () => {
    const a = episode('a', 10, 11);
    const data = [a];
    const before = JSON.stringify({ base, data });
    const r = build(data);
    expect(JSON.stringify({ base, data })).toBe(before);
    expect(Object.isFrozen(r)).toBe(true);
    expect(Object.isFrozen(r.episodes)).toBe(true);
    expect(Object.isFrozen(r.episodes[0])).toBe(true);
    expect(Object.isFrozen(r.episodes[0].source)).toBe(true);
    expect(Object.isFrozen(r.episodes[0].time)).toBe(true);
    expect(Object.isFrozen(r.episodes[0].causedByEpisodeIds)).toBe(true);
  });
  it('does not add an observational projection, survival, habitability or inferred life', () => {
    const r = build([episode('cooling', 12, 100)]);
    expect('observedKnowledge' in r).toBe(false);
    expect('habitabilityProbability' in r).toBe(false);
    expect('lifeProbability' in r).toBe(false);
    expect('biosphere' in r).toBe(false);
    expect(r.lifePresence).toBe('NOT_EVALUATED');
  });
  it('retains initial/final years for long-lived episodes without generating intermediate history', () => {
    const r = build([episode('thermal', 2, 4_000_000_000)]);
    expect(r.episodes.length).toBe(1);
    expect(r.episodes[0].time.startYear).toBe(2);
    expect(r.episodes[0].time.endYear).toBe(4_000_000_000);
  });
  it('scales to thousands of independently supplied events without mutating or materializing more', () => {
    const events = Array.from({ length: 2048 }, (_, n) => episode(`event-${n}`, n * 2));
    const r = build([...events].reverse());
    expect(r.episodes.length).toBe(events.length);
    expect(r.episodes[0].time.startYear).toBe(0);
    expect(r.episodes[r.episodes.length - 1].time.startYear).toBe(4094);
    expect(JSON.stringify(build(events))).toBe(JSON.stringify(r));
  });
  it('rejects invalid CT-0 ages and body contexts', () => {
    for (const age of [-1, Infinity, NaN, 10_000_000]) {
      expect(() => build([], { ...base, time: { ...base.time,
        systemAgeBillionYears: age } })).toThrow();
    }
    expect(() => build([], { ...base, bodyKey: '' })).toThrow();
    expect(() => build([], { ...base, multiplicity: 'QUADRUPLE' as 'SINGLE' })).toThrow();
  });
});
