import { describe, expect, it } from 'vitest';
import {
  HABITABILITY_REQUIREMENTS_31_1,
  type HabitabilityEvidence,
} from '../../domain/habitability/habitability-scenario';
import type { PlanetaryHistoryIntervalSource32_12 } from '../../domain/planetary-history/planetary-history-interval-32-12';
import type { PlanetaryHistoryInput32_1, PlanetaryHistorySourceEpisode32_1 } from '../../domain/planetary-history/planetary-history-32-1';
import type {
  DatedPhysicalEnvironmentalCatalog31Fc,
  ResolvedPhysicalEnvironmentalInterval31Fc,
} from '../habitability/habitability-dated-physical-source-31-f-c';
import { PlanetaryHistoryHabitabilityReconstruction31Fd } from './planetary-history-habitability-reconstruction-31-f-d';

const context = {
  bodyKind: 'PLANET' as const, bodyKey: 'G0/S4/O1/B2', multiplicity: 'BINARY' as const,
  time: { kind: 'CURRENT_SNAPSHOT' as const, systemAgeBillionYears: 4.2 },
};
const version = {
  universeKey: 'fixture-universe-v2', physicsModelRevision: 'physical-32.12',
  sourceRevision: 'events-v1',
};
type Ctx = Omit<PlanetaryHistoryInput32_1, 'episodes'>;
const query = (startYear = 100, endYear = 149, body: Ctx = context) => ({
  context: body, version, startYear, endYear,
});

function evidence(surface: 'SUPPORTS' | 'CONTRADICTS' = 'SUPPORTS'): HabitabilityEvidence[] {
  return (['SURFACE_AQUEOUS', 'SUBSURFACE_AQUEOUS'] as const).flatMap(route =>
    HABITABILITY_REQUIREMENTS_31_1[route].map(constraint => ({
      route, constraint,
      verdict: route === 'SURFACE_AQUEOUS' ? surface : 'SUPPORTS',
      basis: 'PHYSICAL_MODEL' as const, sourceKey: `physical.${route}.${constraint}`,
      accessibleToObserver: false,
    })));
}
function interval(startYear: number, endYear: number, surface: 'SUPPORTS' | 'CONTRADICTS' = 'SUPPORTS',
  body: Ctx = context): ResolvedPhysicalEnvironmentalInterval31Fc {
  return {
    bodyKind: body.bodyKind, bodyKey: body.bodyKey, timeScale: 'YEARS_SINCE_SYSTEM_FORMATION',
    startYear, endYear, coverage: 'ENVIRONMENT_RESOLVED_FOR_EVERY_CT0_YEAR',
    resolution: 'MODELLED_INTERVAL', sourcePhase: 'physical-history',
    sourceModel: 'modelled-interval-catalog', sourceRecordKey: `${body.bodyKey}/${startYear}-${endYear}`,
    evidence: evidence(surface),
  };
}
function episode(key: string, at: number, body: Ctx = context): PlanetaryHistorySourceEpisode32_1 {
  return {
    episodeKey: key, targetBodyKind: body.bodyKind, targetBodyKey: body.bodyKey,
    kind: 'REALIZED_IMPACT',
    time: { timeScale: 'YEARS_SINCE_SYSTEM_FORMATION', startYear: at, endYear: at,
      resolution: 'MODELLED_INSTANT' },
    source: { sourcePhase: '32.8', sourceModel: 'realized-impact-catalog',
      sourceRecordKey: key, evidenceKind: 'RESOLVED_PHYSICAL_EVENT' },
    causedByEpisodeKeys: [],
  };
}
function runtime(
  records: readonly ResolvedPhysicalEnvironmentalInterval31Fc[],
  events: readonly PlanetaryHistorySourceEpisode32_1[] = [],
) {
  let eventRevision = 'events-v1', environmentRevision = 'env-v1';
  let eventReads = 0, environmentalReads = 0;
  const eventSource: PlanetaryHistoryIntervalSource32_12 = {
    revision: () => eventRevision,
    readInterval: (body, start, end, limit) => {
      eventReads++;
      return events.filter(x => x.targetBodyKind === body.bodyKind && x.targetBodyKey === body.bodyKey &&
        x.time.startYear <= end && x.time.endYear >= start).slice(0, limit);
    },
    readByKey: (body, key) => events.find(x => x.episodeKey === key &&
      x.targetBodyKind === body.bodyKind && x.targetBodyKey === body.bodyKey) ?? null,
  };
  const environmentalSource: DatedPhysicalEnvironmentalCatalog31Fc = {
    revision: () => environmentRevision,
    readInterval: (body, start, end, limit) => {
      environmentalReads++;
      return records.filter(x => x.bodyKind === body.bodyKind && x.bodyKey === body.bodyKey &&
        x.startYear <= end && x.endYear >= start).slice(0, limit);
    },
  };
  return {
    assembled: new PlanetaryHistoryHabitabilityReconstruction31Fd(eventSource, environmentalSource),
    get eventReads() { return eventReads; },
    get environmentalReads() { return environmentalReads; },
    changeEventRevision() { eventRevision = 'events-v2'; },
    changeEnvironmentalRevision() { environmentRevision = 'env-v2'; },
  };
}
function surface(result: ReturnType<PlanetaryHistoryHabitabilityReconstruction31Fd['reconstruct']>) {
  return result.windows.routes.find(r => r.route === 'SURFACE_AQUEOUS')!;
}
function surfaceContinuity(result: ReturnType<PlanetaryHistoryHabitabilityReconstruction31Fd['reconstruct']>) {
  return result.continuity.routes.find(r => r.route === 'SURFACE_AQUEOUS')!;
}
function surfaceStability(result: ReturnType<PlanetaryHistoryHabitabilityReconstruction31Fd['reconstruct']>) {
  return result.evolutionaryStability.routes.find(r => r.route === 'SURFACE_AQUEOUS')!;
}

describe('31.F.d — consulta interna real 32.12 → 31.7 → 31.8 → 31.9', () => {
  it('without a dated environmental catalog retains an entirely UNKNOWN interval', () => {
    const state = runtime([]);
    const result = state.assembled.reconstruct(query());
    expect(result.history.chronology.episodes).toEqual([]);
    expect(surface(result).compatibleWindows).toEqual([]);
    expect(surface(result).uncoveredIntervals).toEqual([{ startYear: 100, endYear: 149 }]);
    expect(surfaceContinuity(result).accumulatedCompatibleYearSlots).toBe(0);
    expect(surfaceContinuity(result).uncoveredYearSlots).toBe(50);
    expect(surfaceStability(result).evolutionaryStability).toBe('NOT_DETERMINED_BEYOND_DOCUMENTED_ENVIRONMENTAL_WINDOWS');
    expect(result.historicalCompleteness).toBe('NOT_ESTABLISHED');
    expect(result.lifePresence).toBe('NOT_EVALUATED');
    expect(result.windows.perspective).toBe('SIMULATED_REALITY');
    expect(state.environmentalReads).toBe(1);
  });
  it('dated physical events alone never become habitable trajectory or certified impact damage', () => {
    const result = runtime([], [episode('impact', 120)]).assembled.reconstruct(query());
    expect(result.history.chronology.episodes).toHaveLength(1);
    expect(surface(result).compatibleWindows).toHaveLength(0);
    expect(surfaceContinuity(result).uncoveredYearSlots).toBe(50);
    expect(surfaceStability(result).certifiedChanges).toEqual([]);
    expect(surfaceStability(result).causalAssessment).toBe('TEMPORAL_COINCIDENCES_ONLY');
    expect(surfaceStability(result).eventContexts[0].causality).toBe('TIMING_ONLY_NO_CAUSAL_INFERENCE');
  });
  it('reads real covered intervals and retains every missing CT-0 year explicitly', () => {
    const result = runtime([interval(100, 109), interval(120, 129)]).assembled.reconstruct(query());
    expect(surface(result).compatibleWindows.map(w => [w.startYear, w.endYear])).toEqual([[100, 109], [120, 129]]);
    expect(surface(result).uncoveredIntervals).toEqual([
      { startYear: 110, endYear: 119 }, { startYear: 130, endYear: 149 },
    ]);
    expect(surfaceContinuity(result).accumulatedCompatibleYearSlots).toBe(20);
    expect(surfaceContinuity(result).longestContinuousCompatibleYearSlots).toBe(10);
    expect(surfaceContinuity(result).uncoveredYearSlots).toBe(30);
    expect(surfaceStability(result).unknownContinuityBreaks).toBe(2);
  });
  it('adjacent supported slices form one uninterrupted run, never biological continuity', () => {
    const result = runtime([interval(100, 109), interval(110, 149)]).assembled.reconstruct(query());
    expect(surfaceContinuity(result).accumulatedCompatibleYearSlots).toBe(50);
    expect(surfaceContinuity(result).longestContinuousCompatibleYearSlots).toBe(50);
    expect(surfaceContinuity(result).compatibleRuns).toHaveLength(1);
    expect(surfaceContinuity(result).compatibleRuns[0].interpretation)
      .toBe('DOCUMENTED_UNINTERRUPTED_COMPATIBILITY_NOT_BIOLOGICAL_CONTINUITY');
    expect(result.evolutionaryStability.lifePresence).toBe('NOT_EVALUATED');
    expect(result.evolutionaryStability.extinction).toBe('NOT_EVALUATED');
  });
  it('computes interruptions and restorations but refuses to infer their cause from coincident events', () => {
    const r = runtime([interval(100, 109), interval(110, 119, 'CONTRADICTS'), interval(120, 149)],
      [episode('impact', 110)]).assembled.reconstruct(query());
    expect(surfaceContinuity(r).accumulatedCompatibleYearSlots).toBe(40);
    expect(surfaceContinuity(r).longestContinuousCompatibleYearSlots).toBe(30);
    expect(surfaceStability(r).documentedCompatibilityInterruptions).toBe(1);
    expect(surfaceStability(r).documentedCompatibilityRestorations).toBe(1);
    expect(surfaceStability(r).certifiedChanges).toHaveLength(0);
    expect(surfaceStability(r).causalAssessment).toBe('TEMPORAL_COINCIDENCES_ONLY');
  });
  it('retains body isolation for lunar history in multihost systems', () => {
    const moon = { ...context, bodyKind: 'MOON' as const, bodyKey: 'G0/S4/O1/B2/M1',
      multiplicity: 'TRIPLE' as const };
    const r = runtime([interval(100, 129), interval(130, 149, 'SUPPORTS', moon)],
      [episode('planet-event', 105), episode('moon-event', 135, moon)]).assembled.reconstruct(query(100, 149, moon));
    expect(r.windows.bodyKind).toBe('MOON');
    expect(r.windows.multiplicity).toBe('TRIPLE');
    expect(surfaceContinuity(r).uncoveredYearSlots).toBe(30);
    expect(r.history.chronology.episodes.map(e => e.episodeKey)).toEqual(['moon-event']);
    expect(r.evolutionaryStability.bodyKey).toBe(moon.bodyKey);
  });
  it('rejects event-source revision mismatch even if 32.12 had previously cached that window', () => {
    const state = runtime([interval(100,149)]);
    state.assembled.reconstruct(query());
    state.changeEventRevision();
    expect(() => state.assembled.reconstruct(query())).toThrow(/revision/i);
  });
  it('rejects environmental-source revision races and rejects point samples', () => {
    const changed = runtime([interval(100, 149)]);
    changed.changeEnvironmentalRevision();
    expect(changed.assembled.reconstruct(query()).windows.routes).toHaveLength(3);
    const point = runtime([interval(120,120)]);
    expect(() => point.assembled.reconstruct(query())).toThrow();
  });
  it('fails closed if the environmental revision changes between the 32.12 and 31.7 reads', () => {
    let versionRead = 0;
    const e: PlanetaryHistoryIntervalSource32_12 = {
      revision: () => 'events-v1', readInterval: () => [], readByKey: () => null,
    };
    const physical: DatedPhysicalEnvironmentalCatalog31Fc = {
      revision: () => versionRead++ === 0 ? 'before' : 'after',
      readInterval: () => [interval(100, 149)],
    };
    expect(() => new PlanetaryHistoryHabitabilityReconstruction31Fd(e, physical)
      .reconstruct(query())).toThrow(/revision|changed/i);
  });
  it('fails closed if the episode source mutates during environmental reconstruction', () => {
    let eventRevision = 'events-v1';
    const e: PlanetaryHistoryIntervalSource32_12 = {
      revision: () => eventRevision, readInterval: () => [], readByKey: () => null,
    };
    const physical: DatedPhysicalEnvironmentalCatalog31Fc = {
      revision: () => 'environment-stable',
      readInterval: () => { eventRevision = 'events-v2'; return [interval(100, 149)]; },
    };
    expect(() => new PlanetaryHistoryHabitabilityReconstruction31Fd(e, physical)
      .reconstruct(query())).toThrow(/changed/i);
  });
  it('rejects unsupported overlap rather than double-counting stable years', () => {
    expect(() => runtime([interval(100,110),interval(110,120)]).assembled.reconstruct(query())).toThrow();
  });
  it('is deterministic for shuffled physical intervals and does not query full histories', () => {
    const first = interval(100,110), second = interval(120,130);
    const a = runtime([first,second]);
    const b = runtime([second,first]);
    expect(a.assembled.reconstruct(query())).toEqual(b.assembled.reconstruct(query()));
    expect(a.eventReads).toBe(1);
    expect(a.environmentalReads).toBe(1);
    expect(Object.isFrozen(a.assembled.reconstruct(query()))).toBe(true);
  });
  it('respects a bounded requested window instead of synthesizing past outside it', () => {
    const r = runtime([interval(80, 120), interval(130, 180)])
      .assembled.reconstruct(query(100, 149));
    expect(surface(r).segments.map(x => [x.startYear, x.endYear])).toEqual([[100,120],[121,129],[130,149]]);
    expect(surfaceContinuity(r).accumulatedCompatibleYearSlots).toBe(41);
    expect(surfaceContinuity(r).uncoveredYearSlots).toBe(9);
    expect(r.history.startYear).toBe(100);
    expect(r.history.endYear).toBe(149);
  });
});
