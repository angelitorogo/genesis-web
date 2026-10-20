import { describe, it, expect } from 'vitest';
import type { PlanetaryHistorySourceEpisode32_1 } from '../../domain/planetary-history/planetary-history-32-1';
import { PlanetaryHistoryIntervalEngine32_12 } from '../../simulation/planetary-history/planetary-history-interval-engine-32-12';
import { PlanetaryHistoryIntervalTimeline32_12 } from './planetary-history-interval-timeline-32-12';

const bodyKey = 'G0/S41/O0/B2';
const context = { bodyKind: 'PLANET' as const, bodyKey, multiplicity: 'BINARY' as const,
  time: { kind: 'CURRENT_SNAPSHOT' as const, systemAgeBillionYears: 4.2 } };
const version = { universeKey: 'seed-fingerprint-1', physicsModelRevision: '32-physical-v1',
  sourceRevision: 'rev-1' };
const request = { context, version, startYear: 50, endYear: 70 };
function e(key: string, year: number, causedByEpisodeKeys: readonly string[] = []):
  PlanetaryHistorySourceEpisode32_1 {
  return { episodeKey: key, targetBodyKind: 'PLANET', targetBodyKey: bodyKey,
    kind: 'REALIZED_IMPACT',
    time: { timeScale: 'YEARS_SINCE_SYSTEM_FORMATION', startYear: year,
      endYear: year, resolution: 'MODELLED_INSTANT' },
    source: { sourcePhase: '23.13', sourceModel: 'RealizedImpact',
      sourceRecordKey: key, evidenceKind: 'RESOLVED_PHYSICAL_EVENT' },
    causedByEpisodeKeys };
}
function makeSource() {
  let reads = 0;
  const events = [e('old', 30), e('visible', 50, ['old']), e('hidden', 60, ['visible']),
    e('other-window', 90)];
  const engine = new PlanetaryHistoryIntervalEngine32_12({
    revision: () => 'rev-1',
    readInterval: (_ctx, start, end) => { reads++; return events.filter(x =>
      x.time.startYear <= end && x.time.endYear >= start); },
    readByKey: (_ctx, key) => events.find(x => x.episodeKey === key) ?? null,
  });
  const internal = engine.read(request);
  const ids = Object.fromEntries(internal.chronology.episodes.map(x => [x.episodeKey, x.episodeId]));
  return { engine, ids, reads: () => reads };
}
function visibility(perspective: 'SIMULATED_REALITY' | 'OBSERVED_KNOWLEDGE',
  discovery: 'DETECTED' | 'DISCOVERED' | 'VISITED' | 'CATALOGUED' | 'CONFIRMED' = 'CONFIRMED',
  authorized = true, publishedEpisodeIds: readonly string[] = []) {
  return { perspective, discovery, ficheAuthorized: authorized, publishedEpisodeIds };
}
describe('GENESIS 32.12 — bounded timeline presentation and knowledge gate', () => {
  it('does not consult the physical source when scientific access is locked', () => {
    let calls = 0;
    const engine = new PlanetaryHistoryIntervalEngine32_12({
      revision: () => { calls++; return 'rev-1'; },
      readInterval: () => { calls++; return []; }, readByKey: () => { calls++; return null; },
    });
    for (const state of ['DETECTED', 'DISCOVERED', 'VISITED', 'CATALOGUED'] as const) {
      const result = PlanetaryHistoryIntervalTimeline32_12.build(engine, request,
        visibility('OBSERVED_KNOWLEDGE', state));
      expect(result.status).toBe('LOCKED');
      expect(result.bodyKey).toBeNull();
      expect(result.rows.length).toBe(0);
    }
    expect(calls).toBe(0);
  });
  it('also avoids private reads when CONFIRMED lacks fiche authorization', () => {
    let calls = 0;
    const engine = new PlanetaryHistoryIntervalEngine32_12({
      revision: () => { calls++; return 'rev-1'; }, readInterval: () => [], readByKey: () => null,
    });
    expect(PlanetaryHistoryIntervalTimeline32_12.build(engine, request,
      visibility('OBSERVED_KNOWLEDGE', 'CONFIRMED', false)).status).toBe('LOCKED');
    expect(calls).toBe(0);
  });
  it('projects only explicitly allowed records, without exposing a hidden child', () => {
    const { engine, ids } = makeSource();
    const result = PlanetaryHistoryIntervalTimeline32_12.build(engine, request,
      visibility('OBSERVED_KNOWLEDGE', 'CONFIRMED', true, [ids['visible']]));
    expect(result.rows.length).toBe(1);
    expect(result.rows[0].title).toBe('Impacto realizado');
    expect(JSON.stringify(result).includes(ids['hidden'])).toBe(false);
    expect(result.rows[0].visibleConsequenceIds).toEqual([]);
  });
  it('ignores globally published records outside the current interval without leaking them', () => {
    const { engine, ids } = makeSource();
    const outside = engine.read({ ...request, startYear: 90, endYear: 90 })
      .chronology.episodes[0].episodeId;
    const result = PlanetaryHistoryIntervalTimeline32_12.build(engine, request,
      visibility('OBSERVED_KNOWLEDGE', 'CONFIRMED', true, [outside, ids['visible']]));
    expect(result.rows.length).toBe(1);
    expect(JSON.stringify(result).includes(outside)).toBe(false);
  });
  it('keeps the same 32.11 interactive view contract for internal bounded histories', () => {
    const { engine } = makeSource();
    const result = PlanetaryHistoryIntervalTimeline32_12.build(engine, request,
      visibility('SIMULATED_REALITY'));
    expect(result.contractVersion).toBe('32.11-CT0');
    expect(result.mode).toBe('INTERNAL');
    expect(result.rows.length).toBe(2);
    expect(result.completeness).toBe('NOT_ESTABLISHED');
  });
});
