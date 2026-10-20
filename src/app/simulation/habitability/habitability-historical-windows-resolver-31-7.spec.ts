import { describe, expect, it } from 'vitest';
import {
  HABITABILITY_REQUIREMENTS_31_1,
  type HabitabilityEvidence,
} from '../../domain/habitability/habitability-scenario';
import type {
  HistoricalEnvironmentalState31_7, HistoricalEnvironmentSource31_7,
  HabitabilityHistoricalRequest31_7,
} from '../../domain/habitability/habitability-historical-windows-31-7';
import type {
  PlanetaryHistoryInput32_1, PlanetaryHistorySourceEpisode32_1,
} from '../../domain/planetary-history/planetary-history-32-1';
import { PlanetaryHistoryIntervalEngine32_12 } from '../planetary-history/planetary-history-interval-engine-32-12';
import { HabitabilityHistoricalWindowsResolver31_7 as Resolver } from './habitability-historical-windows-resolver-31-7';

const ctx: Omit<PlanetaryHistoryInput32_1, 'episodes'> = {
  bodyKind: 'PLANET', bodyKey: 'universe/S9/planet/1', multiplicity: 'SINGLE',
  time: { kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: 4.5 },
};
const version = { universeKey: 'seed-v2', physicsModelRevision: 'physics-32.12', sourceRevision: 'events-v1' };
function history(start = 100, end = 149, context = ctx, events: readonly PlanetaryHistorySourceEpisode32_1[] = []) {
  const eventSource = {
    revision: () => 'events-v1',
    readInterval: (_: typeof ctx, a: number, b: number) => events.filter(e => e.time.startYear <= b && e.time.endYear >= a),
    readByKey: (_: typeof ctx, k: string) => events.find(e => e.episodeKey === k) ?? null,
  };
  return new PlanetaryHistoryIntervalEngine32_12(eventSource).read({
    context, version, startYear: start, endYear: end,
  });
}
function evidence(route: 'SURFACE_AQUEOUS' | 'SUBSURFACE_AQUEOUS', verdict: 'SUPPORTS' | 'CONTRADICTS' = 'SUPPORTS'):
  HabitabilityEvidence[] {
  return HABITABILITY_REQUIREMENTS_31_1[route].map(constraint => ({
    route, constraint, verdict, basis: 'PHYSICAL_MODEL',
    accessibleToObserver: true, sourceKey: `dated.${route}.${constraint}`,
  }));
}
const supports = (): HabitabilityEvidence[] => [...evidence('SURFACE_AQUEOUS'), ...evidence('SUBSURFACE_AQUEOUS')];
function state(
  from: number, to: number, overrides: Partial<HistoricalEnvironmentalState31_7> = {},
): HistoricalEnvironmentalState31_7 {
  return {
    bodyKind: ctx.bodyKind, bodyKey: ctx.bodyKey,
    startYear: from, endYear: to,
    temporalBasis: 'DATED_PHYSICAL_TRAJECTORY',
    sourcePhase: 'physical-trajectory', sourceModel: 'TemporalEnvironmentalModel',
    sourceRecordKey: `segment-${from}-${to}`,
    accessibleToObserver: true, evidence: supports(), ...overrides,
  };
}
class Environment implements HistoricalEnvironmentSource31_7 {
  revisionTag = 'environment-v1';
  revisionCalls = 0;
  readCalls = 0;
  constructor(readonly states: readonly HistoricalEnvironmentalState31_7[]) {}
  revision(): string { this.revisionCalls++; return this.revisionTag; }
  readInterval(_: typeof ctx, startYear: number, endYear: number) {
    this.readCalls++;
    return this.states.filter(s => s.startYear <= endYear && s.endYear >= startYear);
  }
}
const req = (start = 100, end = 149, overrides: Partial<HabitabilityHistoricalRequest31_7> = {}):
  HabitabilityHistoricalRequest31_7 => ({
    history: history(start, end), environmentSourceRevision: 'environment-v1',
    perspective: 'SIMULATED_REALITY', ...overrides,
  });
const observed = (stateName: 'DETECTED' | 'CONFIRMED' = 'CONFIRMED', accessible = true) => ({
  perspective: 'OBSERVED_KNOWLEDGE' as const,
  observationAccess: { discoveryState: stateName, scientificFicheAccessible: accessible },
});
function route(report: ReturnType<typeof Resolver.reconstruct>, name: string = 'SURFACE_AQUEOUS') {
  const result = report.routes.find(r => r.route === name);
  if (!result) throw Error('Missing route');
  return result;
}

describe('GENESIS 31.7 — historically supported environmental compatibility windows', () => {
  it('does not generate past habitability from current CT-0 or from no dated states', () => {
    const r = Resolver.reconstruct(req(), new Environment([]));
    expect(route(r).compatibleWindows).toEqual([]);
    expect(route(r).uncoveredIntervals).toEqual([{ startYear: 100, endYear: 149 }]);
    expect(route(r).segments[0].status).toBe('INSUFFICIENT_EVIDENCE');
    expect(r.historicalCompleteness).toBe('NOT_ESTABLISHED');
    expect(r.lifePresence).toBe('NOT_EVALUATED');
  });
  it('does not turn a dated event alone into a habitable window', () => {
    const impact: PlanetaryHistorySourceEpisode32_1 = {
      episodeKey: 'impact', targetBodyKind: ctx.bodyKind, targetBodyKey: ctx.bodyKey,
      kind: 'REALIZED_IMPACT',
      time: { timeScale: 'YEARS_SINCE_SYSTEM_FORMATION', startYear: 120, endYear: 120,
        resolution: 'MODELLED_INSTANT' },
      source: { sourcePhase: '32.8', sourceModel: 'RealizedImpact',
        sourceRecordKey: 'hit', evidenceKind: 'RESOLVED_PHYSICAL_EVENT' },
      causedByEpisodeKeys: [],
    };
    const r = Resolver.reconstruct(req(100, 149, { history: history(100, 149, ctx, [impact]) }),
      new Environment([]));
    expect(route(r).compatibleWindows).toEqual([]);
  });
  it('provides compatible windows for explicitly sustained modeled environments', () => {
    const r = Resolver.reconstruct(req(), new Environment([state(100, 119)]));
    expect(route(r).compatibleWindows).toHaveLength(1);
    expect(route(r).compatibleWindows[0].startYear).toBe(100);
    expect(route(r).compatibleWindows[0].endYear).toBe(119);
    expect(route(r).uncoveredIntervals).toEqual([{ startYear: 120, endYear: 149 }]);
    expect(r.interpretation).toBe('HISTORICAL_ENVIRONMENTAL_COMPATIBILITY_NOT_LIFE_PROBABILITY');
  });
  it('merges adjacent compatible segments with identical temporal support', () => {
    const r = Resolver.reconstruct(req(), new Environment([state(110, 119), state(100, 109)]));
    expect(route(r).compatibleWindows).toHaveLength(1);
    expect(route(r).compatibleWindows[0].sourceRecordKeys).toEqual([
      'segment-100-109', 'segment-110-119',
    ]);
    expect(route(r).compatibleWindows[0].endYear).toBe(119);
  });
  it('does not bridge a one-year gap (continuity will be evaluated by 31.8)', () => {
    const r = Resolver.reconstruct(req(), new Environment([state(100, 109), state(111, 119)]));
    expect(route(r).compatibleWindows).toHaveLength(2);
    expect(route(r).uncoveredIntervals[0]).toEqual({ startYear: 110, endYear: 110 });
  });
  it('keeps physical-model and inferred temporal windows distinct', () => {
    const r = Resolver.reconstruct(req(), new Environment([
      state(100, 109), state(110, 119, { temporalBasis: 'DATED_INFERRED_ENVELOPE' }),
    ]));
    expect(route(r).compatibleWindows).toHaveLength(2);
    expect(route(r).compatibleWindows[1].temporalBasis).toBe('DATED_INFERRED_ENVELOPE');
  });
  it('one physical contradiction breaks a window despite all other supports', () => {
    const all = supports();
    const altered = all.map(e => e.route === 'SURFACE_AQUEOUS' && e.constraint === 'LIQUID_RESERVOIR' ?
      { ...e, verdict: 'CONTRADICTS' as const } : e);
    const r = Resolver.reconstruct(req(), new Environment([
      state(100, 109), state(110, 119, { evidence: altered }), state(120, 129),
    ]));
    expect(route(r).compatibleWindows).toHaveLength(2);
    expect(route(r).segments[1].status).toBe('CONSTRAINTS_INCOMPATIBLE');
    expect(route(r).segments[1].decisiveContradictions).toEqual(['LIQUID_RESERVOIR']);
    expect(route(r).compatibleWindows[1].startYear).toBe(120);
  });
  it('insufficient chemistry leaves environmental interval unresolved, not compatible', () => {
    const all = supports().filter(e => !(e.route === 'SURFACE_AQUEOUS' && e.constraint === 'CHEMICAL_FEASIBILITY'));
    const r = Resolver.reconstruct(req(), new Environment([state(100, 129, { evidence: all })]));
    expect(route(r).compatibleWindows).toEqual([]);
    expect(route(r).segments[0].status).toBe('INSUFFICIENT_EVIDENCE');
    expect(route(r).segments[0].missingConstraints).toContain('CHEMICAL_FEASIBILITY');
  });
  it('surface and subsurface water routes are evaluated independently', () => {
    const onlySub = evidence('SUBSURFACE_AQUEOUS');
    const r = Resolver.reconstruct(req(), new Environment([state(100, 149, { evidence: onlySub })]));
    expect(route(r).compatibleWindows).toEqual([]);
    expect(route(r, 'SUBSURFACE_AQUEOUS').compatibleWindows).toHaveLength(1);
  });
  it('does not fabricate a historical alternative-chemistry model', () => {
    const r = Resolver.reconstruct(req(), new Environment([state(100, 149)]));
    expect(route(r, 'ALTERNATIVE_CHEMISTRY').compatibleWindows).toEqual([]);
    expect(route(r, 'ALTERNATIVE_CHEMISTRY').segments[0].status).toBe('MODEL_NOT_IMPLEMENTED');
  });
  it('clips physically justified environmental coverage to the bounded history query', () => {
    const r = Resolver.reconstruct(req(110, 130), new Environment([state(100, 149)]));
    expect(route(r).compatibleWindows[0].startYear).toBe(110);
    expect(route(r).compatibleWindows[0].endYear).toBe(130);
  });
  it('is order-independent and never mutates input environmental states', () => {
    const a = Object.freeze(state(100, 109));
    const b = Object.freeze(state(110, 119));
    const result = Resolver.reconstruct(req(), new Environment([a, b]));
    const flipped = Resolver.reconstruct(req(), new Environment([b, a]));
    expect(result).toEqual(flipped);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.routes[0].segments[0])).toBe(true);
    expect(a.startYear).toBe(100);
  });
  it('requires real explicit temporal coverage, not current snapshots', () => {
    const fake = { ...state(100, 110), temporalBasis: 'CURRENT_SNAPSHOT' as any };
    expect(() => Resolver.reconstruct(req(), new Environment([fake]))).toThrow();
  });
  it('rejects overlapping environmental records even when they agree', () => {
    expect(() => Resolver.reconstruct(req(), new Environment([state(100, 111), state(111, 120)]))).toThrow();
  });
  it('rejects records outside the requested query window', () => {
    const src = new Environment([state(10, 19)]);
    src.readInterval = () => [state(10, 19)];
    expect(() => Resolver.reconstruct(req(), src)).toThrow();
  });
  it('rejects records belonging to a different planet or moon', () => {
    expect(() => Resolver.reconstruct(req(), new Environment([state(100, 110, { bodyKey: 'other' })]))).toThrow();
    expect(() => Resolver.reconstruct(req(), new Environment([state(100, 110, { bodyKind: 'MOON' })]))).toThrow();
  });
  it('rejects impossible or reversed environmental time ranges', () => {
    expect(() => Resolver.reconstruct(req(), new Environment([state(-1, 120)]))).toThrow();
    expect(() => Resolver.reconstruct(req(), new Environment([state(120, 100)]))).toThrow();
    expect(() => Resolver.reconstruct(req(), new Environment([state(100.5, 110)]))).toThrow();
  });
  it('rejects an environmental source interval that extends beyond the CT-0 system age', () => {
    expect(() => Resolver.reconstruct(req(), new Environment([
      state(100, 4_500_000_001),
    ]))).toThrow();
  });
  it('rejects duplicate physical environmental source identities', () => {
    expect(() => Resolver.reconstruct(req(), new Environment([
      state(100, 109, { sourceRecordKey: 'same' }),
      state(110, 119, { sourceRecordKey: 'same' }),
    ]))).toThrow();
  });
  it('exposes scientific model provenance only for accessible dated states', () => {
    const r = Resolver.reconstruct(req(), new Environment([state(100, 110)]));
    expect(route(r).segments[0].sourcePhase).toBe('physical-trajectory');
    expect(route(r).segments[0].sourceModel).toBe('TemporalEnvironmentalModel');
    expect(route(r).segments[1].sourceModel).toBeNull();
  });
  it('rejects missing scientific provenance', () => {
    expect(() => Resolver.reconstruct(req(), new Environment([state(100, 110, { sourceRecordKey: '' })]))).toThrow();
  });
  it('rejects duplicate criterion identities using the 31.1 validator', () => {
    const es = [...supports(), evidence('SURFACE_AQUEOUS')[0]];
    expect(() => Resolver.reconstruct(req(), new Environment([state(100, 110, { evidence: es })]))).toThrow();
  });
  it('rejects source revision mismatches before reading interval records', () => {
    const src = new Environment([state(100, 110)]);
    src.revisionTag = 'new-revision';
    expect(() => Resolver.reconstruct(req(), src)).toThrow();
    expect(src.readCalls).toBe(0);
  });
  it('rejects an environment catalog that changes mid-query', () => {
    const src = new Environment([state(100, 110)]);
    src.readInterval = () => { src.revisionTag = 'mutated'; return [state(100, 110)]; };
    expect(() => Resolver.reconstruct(req(), src)).toThrow();
  });
  it('rejects record overflow rather than silently dropping environmental evidence', () => {
    expect(() => Resolver.reconstruct(req(), new Environment([state(100, 109), state(110, 119)]), 1)).toThrow();
  });
  it('refuses invalid 32.12 history rather than treating events as environmental trajectory', () => {
    const h: any = { ...history(), contractVersion: '32.2' };
    expect(() => Resolver.reconstruct(req(100, 149, { history: h }), new Environment([]))).toThrow();
  });
  it('refuses an observation without authorized discovery contract', () => {
    expect(() => Resolver.reconstruct(req(100, 149, { perspective: 'OBSERVED_KNOWLEDGE' }),
      new Environment([]))).toThrow();
  });
  it('does not query the source or reveal body identity if the fiche is locked', () => {
    const src = new Environment([state(100, 149)]);
    const r = Resolver.reconstruct(req(100, 149, observed('DETECTED')), src);
    expect(r.access).toBe('SCIENTIFIC_FICHE_LOCKED');
    expect(r.bodyKey).toBeNull();
    expect(r.routes).toEqual([]);
    expect(src.readCalls).toBe(0);
    expect(src.revisionCalls).toBe(0);
  });
  it('CONFIRMED alone does not unlock a restricted scientific fiche', () => {
    const src = new Environment([state(100, 149)]);
    const r = Resolver.reconstruct(req(100, 149, observed('CONFIRMED', false)), src);
    expect(r.access).toBe('SCIENTIFIC_FICHE_LOCKED');
    expect(src.readCalls).toBe(0);
  });
  it('confirmed observations do not publish hidden environmental intervals or their counts', () => {
    const src = new Environment([state(100, 119, { accessibleToObserver: false }), state(120, 129)]);
    const r = Resolver.reconstruct(req(100, 149, observed()), src);
    expect(route(r).compatibleWindows).toHaveLength(1);
    expect(route(r).uncoveredIntervals[0]).toEqual({ startYear: 100, endYear: 119 });
    expect(JSON.stringify(r).includes('segment-100-119')).toBe(false);
    expect(JSON.stringify(r).includes('hidden')).toBe(false);
  });
  it('confirmed evidence can be visible at the time layer but still privately unresolved', () => {
    const hidden = supports().map(e => e.route === 'SURFACE_AQUEOUS' ?
      { ...e, accessibleToObserver: false } : e);
    const r = Resolver.reconstruct(req(100, 149, observed()), new Environment([
      state(100, 149, { evidence: hidden }),
    ]));
    expect(route(r).compatibleWindows).toEqual([]);
    expect(route(r).segments[0].status).toBe('INSUFFICIENT_EVIDENCE');
    expect(route(r, 'SUBSURFACE_AQUEOUS').compatibleWindows).toHaveLength(1);
    expect(JSON.stringify(route(r)).includes('dated.SURFACE_AQUEOUS')).toBe(false);
  });
  it.each(['SINGLE', 'BINARY', 'TRIPLE'] as const)(
    'same explicit constraints and dated records for %s', (multiplicity: 'SINGLE' | 'BINARY' | 'TRIPLE') => {
      const c = { ...ctx, multiplicity };
      const r = Resolver.reconstruct(req(100, 149, { history: history(100, 149, c) }),
        new Environment([state(100, 149)]));
      expect(route(r).compatibleWindows).toHaveLength(1);
    });
  it('separates lunar surface and subsurface evidence from the planet model', () => {
    const lunar = { ...ctx, bodyKind: 'MOON' as const, bodyKey: 'universe/S9/moon/2' };
    const r = Resolver.reconstruct(req(100, 149, { history: history(100, 149, lunar) }),
      new Environment([state(100, 149, {
        bodyKind: lunar.bodyKind, bodyKey: lunar.bodyKey,
        evidence: evidence('SUBSURFACE_AQUEOUS'),
      })]));
    expect(route(r, 'SURFACE_AQUEOUS').compatibleWindows).toEqual([]);
    expect(route(r, 'SUBSURFACE_AQUEOUS').compatibleWindows).toHaveLength(1);
  });
  it('returns bounded outputs and does not materialize an entire planetary history', () => {
    const records = Array.from({ length: 1024 }, (_, i) => state(100 + i, 100 + i));
    const src = new Environment(records);
    const r = Resolver.reconstruct(req(100, 149), src);
    expect(route(r).compatibleWindows).toHaveLength(1);
    expect(route(r).segments).toHaveLength(50);
    expect(src.readCalls).toBe(1);
  });
});
