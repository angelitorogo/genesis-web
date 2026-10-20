import { describe, expect, it } from 'vitest';
import type { PlanetaryHistoryIntervalSource32_12 } from '../../domain/planetary-history/planetary-history-interval-32-12';
import type { PlanetaryHistorySourceEpisode32_1, PlanetaryHistoryInput32_1 } from '../../domain/planetary-history/planetary-history-32-1';
import type { DatedPhysicalEnvironmentalCatalog31Fc, ResolvedPhysicalEnvironmentalInterval31Fc } from '../habitability/habitability-dated-physical-source-31-f-c';
import { PlanetaryHistoryHabitabilityReconstruction31Fd } from './planetary-history-habitability-reconstruction-31-f-d';

// Contract integration checks use explicitly FAKE catalog data, not game
// production histories. Passing these tests cannot certify real environmental
// trajectories or the closeout of phase 31.
const context = {
  bodyKind: 'PLANET' as const, bodyKey: 'G3/S-17/O8/B0', multiplicity: 'TRIPLE' as const,
  time: { kind: 'CURRENT_SNAPSHOT' as const, systemAgeBillionYears: 4.2 },
};
const version = {
  universeKey: 'regression-test-only', physicsModelRevision: '31-f-f-fixture',
  sourceRevision: 'episodes-v1',
};
const request = (body: Omit<PlanetaryHistoryInput32_1, 'episodes'> = context) => ({ context: body, version, startYear: 100, endYear: 149 });
const moon = { ...context, bodyKind: 'MOON' as const, bodyKey: `${context.bodyKey}/M0` };

function impact(body: Omit<PlanetaryHistoryInput32_1, 'episodes'> = context): PlanetaryHistorySourceEpisode32_1 {
  return {
    episodeKey: `${body.bodyKey}/impact`, targetBodyKind: body.bodyKind,
    targetBodyKey: body.bodyKey, kind: 'REALIZED_IMPACT',
    time: { timeScale: 'YEARS_SINCE_SYSTEM_FORMATION', startYear: 115, endYear: 115,
      resolution: 'MODELLED_INSTANT' },
    source: { sourcePhase: 'test-only', sourceModel: '31-f-f-fixture',
      sourceRecordKey: `${body.bodyKey}/impact`, evidenceKind: 'RESOLVED_PHYSICAL_EVENT' },
    causedByEpisodeKeys: [],
  };
}
function catalog(
  intervals: readonly ResolvedPhysicalEnvironmentalInterval31Fc[] = [],
  events: readonly PlanetaryHistorySourceEpisode32_1[] = [],
) {
  let physicalReadCount = 0;
  const episodeSource: PlanetaryHistoryIntervalSource32_12 = {
    revision: () => version.sourceRevision,
    readInterval: (body, from, to) => events.filter(e =>
      e.targetBodyKind === body.bodyKind && e.targetBodyKey === body.bodyKey &&
      e.time.startYear <= to && e.time.endYear >= from),
    readByKey: (body, key) => events.find(e => e.episodeKey === key &&
      e.targetBodyKind === body.bodyKind && e.targetBodyKey === body.bodyKey) ?? null,
  };
  const physicalSource: DatedPhysicalEnvironmentalCatalog31Fc = {
    revision: () => 'physical-env-v1',
    readInterval: (body, from, to) => {
      physicalReadCount++;
      return intervals.filter(i => i.bodyKey === body.bodyKey && i.bodyKind === body.bodyKind &&
        i.startYear <= to && i.endYear >= from);
    },
  };
  return {
    reconstruct: new PlanetaryHistoryHabitabilityReconstruction31Fd(episodeSource, physicalSource),
    get physicalReadCount() { return physicalReadCount; },
  };
}
function surface(result: ReturnType<PlanetaryHistoryHabitabilityReconstruction31Fd['reconstruct']>) {
  return result.windows.routes.find(x => x.route === 'SURFACE_AQUEOUS')!;
}
function continuity(result: ReturnType<PlanetaryHistoryHabitabilityReconstruction31Fd['reconstruct']>) {
  return result.continuity.routes.find(x => x.route === 'SURFACE_AQUEOUS')!;
}

describe('31.F.f — cierre de contratos históricos 32.12/31.F.c/31.7/31.8/31.9', () => {
  it('un impacto fechado no sustituye la fuente ambiental: el pasado queda desconocido', () => {
    const sources = catalog([], [impact()]);
    const result = sources.reconstruct.reconstruct(request());
    expect(result.history.chronology.episodes).toHaveLength(1);
    expect(surface(result).compatibleWindows).toEqual([]);
    expect(surface(result).uncoveredIntervals).toEqual([{ startYear: 100, endYear: 149 }]);
    expect(continuity(result).accumulatedCompatibleYearSlots).toBe(0);
    expect(continuity(result).uncoveredYearSlots).toBe(50);
    expect(result.evolutionaryStability.lifePresence).toBe('NOT_EVALUATED');
    expect(result.evolutionaryStability.extinction).toBe('NOT_EVALUATED');
    expect(result.historicalCompleteness).toBe('NOT_ESTABLISHED');
    expect(sources.physicalReadCount).toBe(1);
  });

  it('sin episodios ni intervalos tampoco atribuye el clima ACTUAL a los 50 años consultados', () => {
    const sources = catalog();
    const first = sources.reconstruct.reconstruct(request());
    expect(surface(first).compatibleWindows).toEqual([]);
    expect(surface(first).uncoveredIntervals).toEqual([{ startYear: 100, endYear: 149 }]);
    expect(continuity(first).longestContinuousCompatibleYearSlots).toBe(0);
    expect(first.windows.perspective).toBe('SIMULATED_REALITY');
    expect(sources.reconstruct.reconstruct(request())).toEqual(first);
  });

  it('el pasado lunar no hereda el episodio del planeta: aislamiento por cuerpo', () => {
    const sources = catalog([], [impact()]);
    const lunar = sources.reconstruct.reconstruct(request(moon));
    expect(lunar.history.chronology.episodes).toEqual([]);
    expect(lunar.windows.bodyKind).toBe('MOON');
    expect(lunar.windows.bodyKey).toBe(moon.bodyKey);
    expect(continuity(lunar).uncoveredYearSlots).toBe(50);
    expect(lunar.historicalCompleteness).toBe('NOT_ESTABLISHED');
  });

  it('rechaza un registro físico ajeno incluso cuando el catálogo devuelve datos incorrectos', () => {
    const wrong: ResolvedPhysicalEnvironmentalInterval31Fc = {
      bodyKind: 'MOON', bodyKey: moon.bodyKey,
      timeScale: 'YEARS_SINCE_SYSTEM_FORMATION', startYear: 100, endYear: 149,
      resolution: 'MODELLED_INTERVAL', coverage: 'ENVIRONMENT_RESOLVED_FOR_EVERY_CT0_YEAR',
      sourcePhase: 'test-only', sourceModel: 'test-only', sourceRecordKey: 'foreign', evidence: [],
    };
    // Use a broken source on purpose: 31.F.c must validate identity, not trust it.
    const episodes: PlanetaryHistoryIntervalSource32_12 = {
      revision: () => version.sourceRevision,
      readInterval: () => [], readByKey: () => null,
    };
    const physical: DatedPhysicalEnvironmentalCatalog31Fc = {
      revision: () => 'env-v1', readInterval: () => [wrong],
    };
    const system = new PlanetaryHistoryHabitabilityReconstruction31Fd(episodes, physical);
    expect(() => system.reconstruct(request())).toThrow(/physical|trajectory|body|foreign|31\.F\.c/i);
  });
});
