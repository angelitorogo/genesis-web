import { describe, expect, it } from 'vitest';
import { HABITABILITY_REQUIREMENTS_31_1, type HabitabilityEvidence } from
  '../../domain/habitability/habitability-scenario';
import type { HistoricalHabContext31_7 } from
  '../../domain/habitability/habitability-historical-windows-31-7';
import { PlanetaryHistoryIntervalEngine32_12 } from
  '../planetary-history/planetary-history-interval-engine-32-12';
import { HabitabilityContinuityResolver31_8 } from './habitability-continuity-resolver-31-8';
import { HabitabilityHistoricalWindowsResolver31_7 } from
  './habitability-historical-windows-resolver-31-7';
import {
  HabitabilityDatedPhysicalSource31Fc,
  type DatedPhysicalEnvironmentalCatalog31Fc,
  type ResolvedPhysicalEnvironmentalInterval31Fc,
} from './habitability-dated-physical-source-31-f-c';

const context: HistoricalHabContext31_7 = {
  bodyKind: 'PLANET', bodyKey: 'G0/S1/O2/B3', multiplicity: 'BINARY',
  time: { kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: 4 },
};
function evidence(): HabitabilityEvidence[] {
  return (['SURFACE_AQUEOUS', 'SUBSURFACE_AQUEOUS'] as const).flatMap(route =>
    HABITABILITY_REQUIREMENTS_31_1[route].map(constraint => ({
      route, constraint, verdict: 'SUPPORTS' as const,
      basis: 'PHYSICAL_MODEL' as const, sourceKey: `real.physical.${route}.${constraint}`,
      accessibleToObserver: true,
    })));
}
function record(a: number, b: number,
  override: Partial<ResolvedPhysicalEnvironmentalInterval31Fc> = {},
): ResolvedPhysicalEnvironmentalInterval31Fc {
  return {
    bodyKind: 'PLANET', bodyKey: context.bodyKey,
    timeScale: 'YEARS_SINCE_SYSTEM_FORMATION',
    startYear: a, endYear: b, resolution: 'MODELLED_INTERVAL',
    coverage: 'ENVIRONMENT_RESOLVED_FOR_EVERY_CT0_YEAR',
    sourcePhase: 'physical-timeseries', sourceModel: 'ResolvedHistoricalClimate',
    sourceRecordKey: `physical-${a}-${b}`, evidence: evidence(), ...override,
  };
}
function catalog(records: readonly ResolvedPhysicalEnvironmentalInterval31Fc[],
  revision = 'physical-timeline-v1'): DatedPhysicalEnvironmentalCatalog31Fc {
  return {
    revision: () => revision,
    readInterval: (_, start, end, max) => records.filter(r =>
      r.startYear <= end && r.endYear >= start).slice(0, max + 1),
  };
}
function results(records: readonly ResolvedPhysicalEnvironmentalInterval31Fc[],
  perspective: 'SIMULATED_REALITY' | 'OBSERVED_KNOWLEDGE' = 'SIMULATED_REALITY',
) {
  const source = new HabitabilityDatedPhysicalSource31Fc(catalog(records));
  const history = new PlanetaryHistoryIntervalEngine32_12({
    revision: () => 'historical-events-v1',
    readInterval: () => [], readByKey: () => null,
  }).read({context, startYear: 100, endYear: 149,
    version: {universeKey: 'universe-real-v2', physicsModelRevision: 'physics-v2',
      sourceRevision: 'historical-events-v1'}});
  const windows = HabitabilityHistoricalWindowsResolver31_7.reconstruct({
    history, perspective, environmentSourceRevision: source.revision(context),
    observationAccess: {discoveryState: 'CONFIRMED', scientificFicheAccessible: true},
  }, source);
  return {windows, continuity: HabitabilityContinuityResolver31_8.summarize({historicalWindows: windows})};
}
const surface = (r: ReturnType<typeof results>) =>
  r.windows.routes.find(v => v.route === 'SURFACE_AQUEOUS')!;
const surfaceDuration = (r: ReturnType<typeof results>) =>
  r.continuity.routes.find(v => v.route === 'SURFACE_AQUEOUS')!;

describe('GENESIS 31.F.c — strict materialized dated physical environmental source', () => {
  it('implements a physical producer for 31.7 without generating historical data', () => {
    const src = new HabitabilityDatedPhysicalSource31Fc(catalog([]));
    expect(src.revision(context)).toBe('31.F.c:physical-timeline-v1');
    expect(src.readInterval(context, 100, 149, 10)).toEqual([]);
    const r = results([]);
    expect(surface(r).compatibleWindows).toEqual([]);
    expect(surface(r).uncoveredIntervals).toEqual([{startYear: 100, endYear: 149}]);
    expect(surfaceDuration(r).accumulatedCompatibleYearSlots).toBe(0);
  });
  it('passes genuinely interval-supported constraints through 31.7 and 31.8 with gaps intact', () => {
    const r = results([record(120, 129), record(100, 109)]);
    expect(surface(r).compatibleWindows.map(w => [w.startYear, w.endYear])).toEqual([
      [100, 109], [120, 129],
    ]);
    expect(surface(r).uncoveredIntervals).toEqual([
      {startYear: 110, endYear: 119}, {startYear: 130, endYear: 149},
    ]);
    expect(surfaceDuration(r).accumulatedCompatibleYearSlots).toBe(20);
    expect(surfaceDuration(r).longestContinuousCompatibleYearSlots).toBe(10);
  });
  it('never makes internal physical intervals visible, even if the source says accessible', () => {
    const src = new HabitabilityDatedPhysicalSource31Fc(catalog([record(100, 109, {
      evidence: evidence().map(e => Object.assign({}, e, {secretPhysics: 'secretPhysics'})),
    })]));
    const states = src.readInterval(context, 100, 149, 16);
    expect(states[0].accessibleToObserver).toBe(false);
    expect(states[0].evidence.every(e => !e.accessibleToObserver)).toBe(true);
    expect(JSON.stringify(states)).not.toContain('secretPhysics');
    const observed = results([record(100, 109)], 'OBSERVED_KNOWLEDGE');
    expect(surface(observed).compatibleWindows).toEqual([]);
    expect(surface(observed).uncoveredIntervals).toEqual([{startYear: 100, endYear: 149}]);
    expect(JSON.stringify(observed)).not.toContain('physical-100-109');
  });
  it('disallows converting physical 32.10 point samples into full-year historical trajectories', () => {
    const point = record(110, 110, {resolution: 'MODELLED_INSTANT' as never});
    expect(() => new HabitabilityDatedPhysicalSource31Fc(catalog([point]))
      .readInterval(context, 100, 149, 16)).toThrow();
    expect(() => new HabitabilityDatedPhysicalSource31Fc(catalog([
      record(100, 109, {coverage: 'SUPPLIED_SAMPLES_ONLY' as never}),
    ])).readInterval(context, 100, 149, 16)).toThrow();
  });
  it('rejects foreign bodies, out-of-window, future and undated physics', () => {
    for (const bad of [
      record(100, 109, {bodyKey: 'another-body'}),
      record(100, 109, {bodyKind: 'MOON'}),
      record(100, 109, {timeScale: 'LOOKBACK_YEARS' as never}),
      record(100, 109, {startYear: -1}),
      record(100, 4_000_000_001),
      record(110, 109),
    ]) {
      expect(() => new HabitabilityDatedPhysicalSource31Fc(catalog([bad]))
        .readInterval(context, 0, 4_000_000_000, 16)).toThrow();
    }
    expect(new HabitabilityDatedPhysicalSource31Fc(catalog([record(100, 109)]))
      .readInterval(context, 120, 149, 16)).toEqual([]);
  });
  it('rejects duplications, overlaps, unbounded results and revision races', () => {
    for (const records of [
      [record(100, 109), record(110, 119, {sourceRecordKey:'physical-100-109'})],
      [record(100, 110), record(110, 120)],
    ]) {
      expect(() => new HabitabilityDatedPhysicalSource31Fc(catalog(records))
        .readInterval(context, 100, 149, 8)).toThrow();
    }
    expect(() => new HabitabilityDatedPhysicalSource31Fc(catalog([
      record(100,109), record(110,119),
    ])).readInterval(context, 100, 149, 1)).toThrow();
    let i = 0;
    const source: DatedPhysicalEnvironmentalCatalog31Fc = {
      revision: () => `v${++i}`, readInterval: () => [record(100,109)],
    };
    expect(() => new HabitabilityDatedPhysicalSource31Fc(source)
      .readInterval(context, 100, 149, 8)).toThrow();
  });
  it('does not promote inferred envelopes to resolved evidence', () => {
    const inferred = record(100, 109, {resolution: 'INFERRED_INTERVAL',
      evidence: evidence().map(e => ({...e, basis: 'INFERRED_MODEL' as const}))});
    const r = results([inferred]);
    expect(surface(r).segments[0].resolution).toBe('INFERRED_EVIDENCE');
    expect(surface(r).segments[0].temporalBasis).toBe('DATED_INFERRED_ENVELOPE');
    expect(() => new HabitabilityDatedPhysicalSource31Fc(catalog([
      record(100,109,{resolution:'INFERRED_INTERVAL'}),
    ])).readInterval(context,100,149,8)).toThrow();
  });
  it('clones producer-owned arrays so subsequent mutations do not affect 31.7', () => {
    const input = record(100, 109);
    const backing = [input];
    const src = new HabitabilityDatedPhysicalSource31Fc(catalog(backing));
    const read = src.readInterval(context, 100, 149, 4);
    (input.evidence as unknown as Array<{sourceKey: string}>)[0].sourceKey = 'changed';
    backing.pop();
    expect(read[0].evidence[0].sourceKey).not.toBe('changed');
    expect(Object.isFrozen(read)).toBe(true);
    expect(Object.isFrozen(read[0].evidence[0])).toBe(true);
  });
});
