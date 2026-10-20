import { describe, expect, it } from 'vitest';
import { HABITABILITY_REQUIREMENTS_31_1, type HabitabilityEvidence } from '../../domain/habitability/habitability-scenario';
import type {
  HabitabilityHistoricalRequest31_7, HistoricalEnvironmentalState31_7,
  HistoricalEnvironmentSource31_7, HistoricalHabitabilityReport31_7,
} from '../../domain/habitability/habitability-historical-windows-31-7';
import type { PlanetaryHistoryInput32_1 } from '../../domain/planetary-history/planetary-history-32-1';
import { PlanetaryHistoryIntervalEngine32_12 } from '../planetary-history/planetary-history-interval-engine-32-12';
import { HabitabilityHistoricalWindowsResolver31_7 } from './habitability-historical-windows-resolver-31-7';
import { HabitabilityContinuityResolver31_8 as Resolver } from './habitability-continuity-resolver-31-8';

const context: Omit<PlanetaryHistoryInput32_1, 'episodes'> = {
  bodyKind: 'PLANET', bodyKey: 'system-7/planet/4', multiplicity: 'SINGLE',
  time: { kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: 4.5 },
};
const version = { universeKey: 'S7', physicsModelRevision: 'physics-v4', sourceRevision: 'events-v1' };
const envRevision = 'env-v1';
const e = (route: 'SURFACE_AQUEOUS' | 'SUBSURFACE_AQUEOUS', verdict: 'SUPPORTS' | 'CONTRADICTS' = 'SUPPORTS',
  visible = true, inferred = false): HabitabilityEvidence[] =>
  HABITABILITY_REQUIREMENTS_31_1[route].map((constraint) => ({
    route, constraint, verdict,
    basis: inferred ? 'INFERRED_MODEL' : 'PHYSICAL_MODEL', accessibleToObserver: visible,
    sourceKey: `dated.${route}.${constraint}`,
  }));
const both = () => [...e('SURFACE_AQUEOUS'), ...e('SUBSURFACE_AQUEOUS')];
const state = (from: number, to: number, override: Partial<HistoricalEnvironmentalState31_7> = {}): HistoricalEnvironmentalState31_7 => ({
  bodyKind: context.bodyKind, bodyKey: context.bodyKey,
  startYear: from, endYear: to, temporalBasis: 'DATED_PHYSICAL_TRAJECTORY',
  sourcePhase: '31.7-test', sourceModel: 'model-history', sourceRecordKey: `S-${from}-${to}`,
  accessibleToObserver: true, evidence: both(), ...override,
});
class Environment implements HistoricalEnvironmentSource31_7 {
  readCalls = 0;
  constructor(readonly states: readonly HistoricalEnvironmentalState31_7[]) {}
  revision() { return envRevision; }
  readInterval(_: typeof context, from: number, to: number) {
    this.readCalls++;
    return this.states.filter(s => s.startYear <= to && s.endYear >= from);
  }
}
function history(from = 100, to = 149, c = context) {
  return new PlanetaryHistoryIntervalEngine32_12({
    revision: () => version.sourceRevision,
    readInterval: () => [], readByKey: () => null,
  }).read({ context: c, version, startYear: from, endYear: to });
}
function historical(states: readonly HistoricalEnvironmentalState31_7[], opts: {
  start?: number; end?: number;
  perspective?: 'SIMULATED_REALITY' | 'OBSERVED_KNOWLEDGE';
  discoveryState?: 'DETECTED' | 'CONFIRMED'; fiche?: boolean;
  context?: typeof context;
} = {}) {
  const request: HabitabilityHistoricalRequest31_7 = {
    history: history(opts.start ?? 100, opts.end ?? 149, opts.context ?? context),
    environmentSourceRevision: envRevision,
    perspective: opts.perspective ?? 'SIMULATED_REALITY',
    observationAccess: { discoveryState: opts.discoveryState ?? 'CONFIRMED', scientificFicheAccessible: opts.fiche ?? true },
  };
  return HabitabilityHistoricalWindowsResolver31_7.reconstruct(request, new Environment(states));
}
const summarize = (report: HistoricalHabitabilityReport31_7) => Resolver.summarize({ historicalWindows: report });
function route(result: ReturnType<typeof summarize>, r: string = 'SURFACE_AQUEOUS') {
  const found = result.routes.find(x => x.route === r);
  if (!found) throw new Error('Route missing');
  return found;
}

describe('GENESIS 31.8 — documented environmental continuity, not probability of life', () => {
  it('counts both inclusive CT-0 year slots (50, not 49)', () => {
    const s = route(summarize(historical([state(100, 149)])));
    expect(s.queriedYearSlots).toBe(50);
    expect(s.accumulatedCompatibleYearSlots).toBe(50);
    expect(s.longestContinuousCompatibleYearSlots).toBe(50);
    expect(s.continuousCompatibleYearSlotsAtQueryEnd).toBe(50);
    expect(s.coversEntireQueriedIntervalWithCompatibility).toBe(true);
  });
  it('counts a single dated year as one slot, not zero', () => {
    const s = route(summarize(historical([state(120, 120)], { start: 120, end: 120 })));
    expect(s.accumulatedCompatibleYearSlots).toBe(1);
    expect(s.longestContinuousCompatibleYearSlots).toBe(1);
  });
  it('keeps accumulated time separate from uninterrupted longest time', () => {
    const s = route(summarize(historical([
      state(100, 109), state(120, 134), state(140, 149),
    ])));
    expect(s.accumulatedCompatibleYearSlots).toBe(35);
    expect(s.longestContinuousCompatibleYearSlots).toBe(15);
    expect(s.continuousCompatibleYearSlotsAtQueryEnd).toBe(10);
    expect(s.uncoveredYearSlots).toBe(15);
    expect(s.datedEvidenceYearSlots).toBe(35);
    expect(s.compatibleRuns).toHaveLength(3);
  });
  it('counts uncertainty distinctly and never bridges a one-year historical gap', () => {
    const s = route(summarize(historical([state(100, 109), state(111, 120)], { start: 100, end: 120 })));
    expect(s.accumulatedCompatibleYearSlots).toBe(20);
    expect(s.longestContinuousCompatibleYearSlots).toBe(10);
    expect(s.uncoveredYearSlots).toBe(1);
    expect(s.insufficientEvidenceYearSlots).toBe(1);
  });
  it('a one-year physical contradiction breaks continuity, but is not missing coverage', () => {
    const s = route(summarize(historical([
      state(100, 109),
      state(110, 110, { evidence: e('SURFACE_AQUEOUS', 'CONTRADICTS') }),
      state(111, 120),
    ], { start: 100, end: 120 })));
    expect(s.accumulatedCompatibleYearSlots).toBe(20);
    expect(s.longestContinuousCompatibleYearSlots).toBe(10);
    expect(s.incompatibleYearSlots).toBe(1);
    expect(s.uncoveredYearSlots).toBe(0);
  });
  it('adjacent compatible states coalesce into one documented run', () => {
    const s = route(summarize(historical([state(100, 109), state(110, 120)], { start: 100, end: 120 })));
    expect(s.compatibleRuns).toHaveLength(1);
    expect(s.longestContinuousCompatibleYearSlots).toBe(21);
  });
  it('continuous duration can cross a provenance-grade boundary without losing its grades', () => {
    const s = route(summarize(historical([
      state(100, 109),
      state(110, 120, { temporalBasis: 'DATED_INFERRED_ENVELOPE', evidence: [
        ...e('SURFACE_AQUEOUS', 'SUPPORTS', true, true), ...e('SUBSURFACE_AQUEOUS'),
      ] }),
    ], { start: 100, end: 120 })));
    expect(s.compatibleRuns).toHaveLength(1);
    expect(s.longestContinuousCompatibleYearSlots).toBe(21);
    expect(s.compatibleRuns[0].temporalBases).toHaveLength(2);
    expect(s.compatibleRuns[0].supportResolutions).toHaveLength(2);
  });
  it('does not label the requested interval end as the current epoch', () => {
    const s = route(summarize(historical([state(100, 149)])));
    expect(s.queryEndIsPresentDay).toBe('NOT_ESTABLISHED');
  });
  it('reports zero documented years without asserting environmental impossibility', () => {
    const result = summarize(historical([]));
    const s = route(result);
    expect(s.accumulatedCompatibleYearSlots).toBe(0);
    expect(s.uncoveredYearSlots).toBe(50);
    expect(s.longestContinuousRun).toBeNull();
    expect(result.historicalCompleteness).toBe('NOT_ESTABLISHED');
    expect(result.lifePresence).toBe('NOT_EVALUATED');
  });
  it('does not turn dated incompatible years into uncovered/unknown years', () => {
    const s = route(summarize(historical([state(100, 149, { evidence: e('SURFACE_AQUEOUS', 'CONTRADICTS') })])));
    expect(s.incompatibleYearSlots).toBe(50);
    expect(s.uncoveredYearSlots).toBe(0);
    expect(s.accumulatedCompatibleYearSlots).toBe(0);
  });
  it('uses no evidence of biology, only the physical compatibility verdict', () => {
    const result = summarize(historical([state(100, 149)]));
    expect(result.interpretation).toBe('DOCUMENTED_COMPATIBILITY_DURATIONS_NOT_LIFE_OR_EVOLUTION');
    expect(result.durationUnit).toBe('INCLUSIVE_CT0_YEAR_SLOTS');
    expect(JSON.stringify(result).includes('PROBABILITY_OF_LIFE')).toBe(false);
  });
  it('keeps the surface and subsurface aquatic routes independent', () => {
    const result = summarize(historical([state(100, 149, { evidence: e('SUBSURFACE_AQUEOUS') })]));
    expect(route(result).accumulatedCompatibleYearSlots).toBe(0);
    expect(route(result, 'SUBSURFACE_AQUEOUS').accumulatedCompatibleYearSlots).toBe(50);
  });
  it('does not populate the placeholder alternative-chemistry route', () => {
    const alt = route(summarize(historical([state(100, 149)])), 'ALTERNATIVE_CHEMISTRY');
    expect(alt.modelNotImplementedYearSlots).toBe(50);
    expect(alt.accumulatedCompatibleYearSlots).toBe(0);
  });
  it('does not leak private history when discovery locks the fiche', () => {
    const r = summarize(historical([state(100, 149)], { perspective: 'OBSERVED_KNOWLEDGE', discoveryState: 'DETECTED' }));
    expect(r.access).toBe('SCIENTIFIC_FICHE_LOCKED');
    expect(r.routes).toEqual([]);
    expect(r.bodyKey).toBeNull();
    expect(r.startYear).toBeNull();
  });
  it('CONFIRMED with locked scientific fiche is still locked', () => {
    const r = summarize(historical([state(100, 149)], { perspective: 'OBSERVED_KNOWLEDGE', fiche: false }));
    expect(r.routes).toEqual([]);
  });
  it('private dated states remain missing to the observer; no leaked counts or keys', () => {
    const r = summarize(historical([
      state(100, 129, { accessibleToObserver: false, sourceRecordKey: 'super-secret-date' }),
      state(130, 149),
    ], { perspective: 'OBSERVED_KNOWLEDGE' }));
    const s = route(r);
    expect(s.accumulatedCompatibleYearSlots).toBe(20);
    expect(s.uncoveredYearSlots).toBe(30);
    expect(JSON.stringify(r).includes('super-secret-date')).toBe(false);
  });
  it('an available date with hidden physical criteria does not count as compatible', () => {
    const r = summarize(historical([state(100, 149, { evidence: [
      ...e('SURFACE_AQUEOUS', 'SUPPORTS', false), ...e('SUBSURFACE_AQUEOUS'),
    ] })], { perspective: 'OBSERVED_KNOWLEDGE' }));
    expect(route(r).accumulatedCompatibleYearSlots).toBe(0);
    expect(route(r).insufficientEvidenceYearSlots).toBe(50);
    expect(route(r, 'SUBSURFACE_AQUEOUS').accumulatedCompatibleYearSlots).toBe(50);
  });
  it('does not conflate different planets or moon reports', () => {
    const c = { ...context, bodyKind: 'MOON' as const, bodyKey: 'S7/moon/4' };
    const r = summarize(historical([state(100, 149, { bodyKind: 'MOON', bodyKey: c.bodyKey })], { context: c }));
    expect(r.bodyKind).toBe('MOON');
    expect(r.bodyKey).toBe(c.bodyKey);
  });
  it.each(['SINGLE', 'BINARY', 'TRIPLE'] as const)('applies the same CT-0 duration logic to %s', (m: typeof context.multiplicity) => {
    const r = summarize(historical([state(100, 149)], { context: { ...context, multiplicity: m } }));
    expect(route(r).longestContinuousCompatibleYearSlots).toBe(50);
  });
  it('does not mutate the frozen 31.7 result', () => {
    const source = historical([state(100, 149)]);
    const before = source.routes[0].compatibleWindows[0].startYear;
    const result = summarize(source);
    expect(before).toBe(100);
    expect(source.routes[0].compatibleWindows[0].startYear).toBe(100);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.routes[0])).toBe(true);
    expect(Object.isFrozen(result.routes[0].compatibleRuns[0])).toBe(true);
  });
  it('ties for longest run prefer the earliest chronological one', () => {
    const s = route(summarize(historical([state(100, 109), state(130, 139)])));
    expect(s.longestContinuousRun?.startYear).toBe(100);
  });
  it('a compatible middle run without end coverage has no compatible tail', () => {
    const s = route(summarize(historical([state(110, 119)])));
    expect(s.continuousCompatibleYearSlotsAtQueryEnd).toBe(0);
  });
  it('handles input returned in any record order', () => {
    const a = historical([state(100, 109), state(120, 129)]);
    const b = historical([state(120, 129), state(100, 109)]);
    expect(summarize(a)).toEqual(summarize(b));
  });
  it('rejects an unsupported or forged 31.7 version', () => {
    const h = historical([]);
    expect(() => summarize({ ...h, contractVersion: 'made-up' } as unknown as HistoricalHabitabilityReport31_7)).toThrow();
  });
  it('rejects duplicated routes instead of double-counting compatible years', () => {
    const h = historical([state(100, 149)]);
    expect(() => summarize({ ...h, routes: [h.routes[0], h.routes[0], h.routes[2]] })).toThrow();
  });
  it('rejects an incomplete route or silent undocumented time holes', () => {
    const h = historical([state(100, 149)]);
    const broken = { ...h.routes[0], segments: [] };
    expect(() => summarize({ ...h, routes: [broken, ...h.routes.slice(1)] })).toThrow();
  });
  it('rejects altered compatible windows inconsistent with dated segments', () => {
    const h = historical([state(100, 149)]);
    const broken = { ...h.routes[0], compatibleWindows: [] };
    expect(() => summarize({ ...h, routes: [broken, ...h.routes.slice(1)] })).toThrow();
  });
  it('rejects altered uncovered intervals inconsistent with their segment coverage', () => {
    const h = historical([state(100, 110)]);
    const broken = { ...h.routes[0], uncoveredIntervals: [] };
    expect(() => summarize({ ...h, routes: [broken, ...h.routes.slice(1)] })).toThrow();
  });
  it('rejects false positive compatibility with unresolved physical certainty', () => {
    const h = historical([state(100, 149)]);
    const broken = { ...h.routes[0], segments: [
      { ...h.routes[0].segments[0], resolution: 'NOT_DETERMINED' as const },
    ] };
    expect(() => summarize({ ...h, routes: [broken, ...h.routes.slice(1)] })).toThrow();
  });
  it('rejects overlaps within an altered input report', () => {
    const h = historical([state(100, 109), state(110, 149)]);
    const parts = h.routes[0].segments;
    const broken = { ...h.routes[0], segments: [{ ...parts[0], endYear: 110 }, parts[1]] };
    expect(() => summarize({ ...h, routes: [broken, ...h.routes.slice(1)] })).toThrow();
  });
  it('rejects physically impossible or unsafe query duration', () => {
    const h = historical([]);
    const broken = { ...h, startYear: 0, endYear: Number.MAX_SAFE_INTEGER };
    expect(() => summarize(broken)).toThrow();
  });
  it('supports bounded long queries with thousands of dated records without O(n²) aggregation', () => {
    const src = Array.from({ length: 1000 }, (_, i) => state(100+i, 100+i));
    const r = route(summarize(historical(src, { start: 100, end: 1099 })));
    expect(r.accumulatedCompatibleYearSlots).toBe(1000);
    expect(r.compatibleRuns).toHaveLength(1);
  });
  it('distinguishes complete local query coverage from global historical completeness', () => {
    const r = summarize(historical([state(100, 149)]));
    expect(route(r).coversEntireQueriedIntervalWithCompatibility).toBe(true);
    expect(r.historicalCompleteness).toBe('NOT_ESTABLISHED');
  });
});
