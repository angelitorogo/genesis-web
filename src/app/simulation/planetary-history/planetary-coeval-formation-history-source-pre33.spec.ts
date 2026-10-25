import { describe, expect, it } from 'vitest';
import { coevalPlanetFormationEpisodePRE33 as episode } from './planetary-coeval-formation-history-source-pre33';
import { PlanetaryHistoryEngine } from './planetary-history-engine';
import type { PlanetarySystemFormationBlueprint } from '../../domain/planetary/planetary-system-formation-blueprint';

const blueprint = (start: number, end: number): PlanetarySystemFormationBlueprint =>
  ({ sourceDiskAgeMillionYears: start, formationCompletionAgeMillionYears: end } as PlanetarySystemFormationBlueprint);
const produce = (start: number, end: number, now = 2_000_000_000) =>
  episode('V3-CANDIDATE/SEED/G0/S1', 'V3-CANDIDATE/SEED/G0/S1/B0', 0, blueprint(start, end), now);

describe('PRE33 coeval planetary formation history from 17.7', () => {
  it('uses a source-backed inferred interval instead of an invented impact or supernova', () => {
    const item = produce(0.1, 15);
    expect(item.time).toEqual({ timeScale: 'YEARS_SINCE_SYSTEM_FORMATION',
      startYear: 100000, endYear: 15000000, resolution: 'INFERRED_INTERVAL' });
    expect(item.source.evidenceKind).toBe('INFERRED_PHYSICAL_EPISODE');
    expect(item.kind).toBe('FORMATION');
    expect(PlanetaryHistoryEngine.build({ bodyKind: 'PLANET', bodyKey: item.targetBodyKey,
      multiplicity: 'BINARY', time: { kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: 2 },
      episodes: [item] }).episodes.length).toBe(1);
  });
  it('rejects planets whose completion occurs after the corrected system age', () => {
    expect(() => produce(1, 15, 12_200_000)).toThrow('NOT_MATURE');
  });
  it('refuses foreign or malformed identities and reversed histories', () => {
    expect(() => episode('', 'B0', 0, blueprint(0, 2), 3000000)).toThrow('INVALID_PHYSICAL');
    expect(() => produce(10, 1)).toThrow('NOT_MATURE');
  });
  it('preserves public ordinal in the source identity', () => {
    const first = produce(1, 10);
    const second = episode('V3-CANDIDATE/SEED/G0/S1', 'V3-CANDIDATE/SEED/G0/S1/B1', 1,
      blueprint(1, 10), 2000000000);
    expect(first.episodeKey).not.toBe(second.episodeKey);
    expect(first.targetBodyKey).not.toBe(second.targetBodyKey);
  });
});
