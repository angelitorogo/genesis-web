import { describe, expect, it } from 'vitest';
import type { PlanetaryClimateGeochemistryHistoryInput32_6, PlanetaryClimateGeochemistryHistoryResult32_6 } from '../../domain/planetary-history/planetary-climate-geochemistry-history-32-6';
import type { PlanetaryHistorySourceEpisode32_1 } from '../../domain/planetary-history/planetary-history-32-1';
import type { PlanetaryTransientEffectsHistoryResult32_9 } from '../../domain/planetary-history/planetary-transient-effects-history-32-9';
import { PlanetaryHistoryEngine } from './planetary-history-engine';
import { PlanetaryClimateGeochemistryHistoryResolver32_6 } from './planetary-climate-geochemistry-history-resolver-32-6';
import { PlanetaryEnvironmentalHistoryCertification31Fg } from './planetary-environmental-history-certification-31-f-g';

const key = 'G0/S-26/O5/B0';
const loc = { galaxyIndex: 0n, sectorKey: -26n, galacticObjectIndex: 5n, bodyIndex: 0n };
const seed = { kind: 'body', normalizedValue: 'A'.repeat(32) };
const time = { kind: 'CURRENT_SNAPSHOT' as const, systemAgeBillionYears: 4.6 };
const context = { bodyKind: 'PLANET' as const, bodyKey: key, multiplicity: 'SINGLE' as const, time };
const version = { universeKey: 'materialized-universe-v1', physicsModelRevision: '32.6-current-v1', sourceRevision: 'materialized-events-v1' };
const query = (startYear = 100, endYear = 149) => ({ context, version, startYear, endYear });

/** Physically checked 20.3–20.8 CURRENT handoffs, not artificial palaeoclimate. */
function currentAtmosphere(): PlanetaryClimateGeochemistryHistoryInput32_6 {
  const ref = { planetOrdinal: 1, bodyLocator: loc, bodySeed: seed };
  const hostPlanet = {
    planetOrdinal: 1, locator: loc, seed,
    hostPlanetarySystem: { hostStellarSystem: { multiplicity: { name: 'SINGLE' } } },
  };
  const greenhouseEffect = { ...ref, sourceReferenceMeanInsolationEarth: 1.02,
    regime: 'STRONG', sourceRetainedSurfacePressurePascal: 100000,
    infraredOpticalDepthProxy: 2.5, temperatureAmplificationFactor: 1.1,
    longwaveTrappingFraction01: .4, condensableEquilibriumState: null,
    waterVaporEquilibriumState: null };
  const climateState = { ...ref, sourceReferenceMeanInsolationEarth: 1.02,
    equilibriumTemperatureKelvin: 270, sourceInfraredOpticalDepthProxy: 2.5,
    sourceGreenhouseRegime: 'STRONG', sourceGreenhouseTemperatureAmplificationFactor: 1.1,
    meanSurfaceTemperatureKelvin: 300 };
  const climateVariabilityState = { ...ref, sourceEquilibriumTemperatureKelvin: 270,
    sourceMeanSurfaceTemperatureKelvin: 300, minimumSurfaceTemperatureKelvin: 280,
    maximumSurfaceTemperatureKelvin: 330, seasonalTemperatureAmplitudeKelvin: 8,
    diurnalTemperatureRangeKelvin: 32, stabilityIndex01: .8 };
  const waterInventory = { ...ref, sourceMeanSurfaceTemperatureKelvin: 300,
    sourceMinimumSurfaceTemperatureKelvin: 280, sourceMaximumSurfaceTemperatureKelvin: 330,
    sourceClimateStabilityIndex01: .8, sourceRetainedSurfacePressurePascal: 100000,
    waterInventoryIndex01: .4, surfaceLiquidWaterCoverageFraction01: .23,
    surfaceIceCoverageFraction01: .05 };
  const geologyState = { ...ref, sourceWaterInventoryIndex01: .4,
    sourceSurfaceLiquidWaterCoverageFraction01: .23, volcanismIndex01: .7,
    volatileOutgassingPotential01: .5, tectonicMobilityIndex01: .35,
    geologicalActivityIndex01: .6, surfaceRenewalPotential01: .4 };
  const retentionState = { ...ref, sourceReferenceMeanInsolationEarth: 1.02,
    retainedSurfacePressurePascal: 100000, retainedMoleInventoryFraction01: .7,
    retainedGasComponents: [{ gas: 'NITROGEN', moleFraction01: .7 },
      { gas: 'CARBON_DIOXIDE', moleFraction01: .3 }] };
  return { time, atmosphere: { hostPlanet, greenhouseEffect, climateState,
    climateVariabilityState, waterInventory, geologyState, retentionState } } as
    unknown as PlanetaryClimateGeochemistryHistoryInput32_6;
}
function climate(): PlanetaryClimateGeochemistryHistoryResult32_6 {
  return PlanetaryClimateGeochemistryHistoryResolver32_6.resolve(currentAtmosphere());
}
function event(): PlanetaryHistorySourceEpisode32_1 {
  return { episodeKey: `${key}/formation`, targetBodyKind: 'PLANET', targetBodyKey: key,
    kind: 'FORMATION', time: { timeScale: 'YEARS_SINCE_SYSTEM_FORMATION',
      startYear: 0, endYear: 1000, resolution: 'INFERRED_INTERVAL' },
    source: { sourcePhase: '17.7', sourceModel: 'physical-formation',
      sourceRecordKey: `${key}/source-formation`, evidenceKind: 'INFERRED_PHYSICAL_EPISODE' },
    causedByEpisodeKeys: [] };
}
function withEvent(): PlanetaryClimateGeochemistryHistoryResult32_6 {
  const x = climate();
  const episodes = [event()];
  return { ...x, sourceEpisodes: episodes, chronology: PlanetaryHistoryEngine.build({
    ...context, episodes,
  }) };
}
function surface(result: ReturnType<PlanetaryEnvironmentalHistoryCertification31Fg['reconstruct']>) {
  return result.physical.windows.routes.find(r => r.route === 'SURFACE_AQUEOUS')!;
}

describe('31.F.g — materialización física y certificación histórica a prueba de falsos positivos', () => {
  it('conecta 32.6 REAL a 32.12/31.F.c/31.7/31.8/31.9; el clima actual NO llena el pasado', () => {
    const physical = climate();
    expect(physical.snapshot.meanSurfaceTemperatureKelvin).toBe(300);
    expect(physical.snapshot.interpretation).toBe('CURRENT_PHYSICAL_STATE_NOT_HISTORICAL_TREND');
    const bridge = new PlanetaryEnvironmentalHistoryCertification31Fg(physical, version.sourceRevision);
    const result = bridge.reconstruct(query());
    expect(result.certification).toEqual({
      verdict: 'NO_CERTIFIED_ENVIRONMENTAL_TRAJECTORIES', reason: 'CURRENT_SNAPSHOT_ONLY',
      datedSourceEpisodeCount: 0, certifiedContinuousIntervals: 0,
      historicalCoverage: 'UNKNOWN', lifePresence: 'NOT_EVALUATED', playerVisible: false,
    });
    expect(result.physical.history.chronology.episodes).toEqual([]);
    expect(surface(result).compatibleWindows).toEqual([]);
    expect(surface(result).uncoveredIntervals).toEqual([{ startYear: 100, endYear: 149 }]);
    const continuity = result.physical.continuity.routes.find(r => r.route === 'SURFACE_AQUEOUS')!;
    expect(continuity.accumulatedCompatibleYearSlots).toBe(0);
    expect(continuity.uncoveredYearSlots).toBe(50);
    expect(result.physical.historicalCompleteness).toBe('NOT_ESTABLISHED');
    expect(result.physical.lifePresence).toBe('NOT_EVALUATED');
    expect(bridge.reconstruct(query())).toEqual(result);
  });

  it('un evento FECHADO de formación no da 1.000 años de clima favorable', () => {
    const bridge = new PlanetaryEnvironmentalHistoryCertification31Fg(withEvent(), version.sourceRevision);
    const r = bridge.reconstruct(query(100, 149));
    expect(r.physical.history.chronology.episodes.map(e => e.episodeKey)).toEqual([event().episodeKey]);
    expect(r.certification.datedSourceEpisodeCount).toBe(1);
    expect(r.certification.certifiedContinuousIntervals).toBe(0);
    expect(surface(r).compatibleWindows).toHaveLength(0);
    expect(surface(r).uncoveredIntervals).toEqual([{ startYear: 100, endYear: 149 }]);
    expect(r.physical.evolutionaryStability.lifePresence).toBe('NOT_EVALUATED');
  });

  it('rechaza episodios que no coinciden con la cronología, un planeta ajeno y revisiones obsoletas', () => {
    const real = withEvent();
    expect(() => new PlanetaryEnvironmentalHistoryCertification31Fg({
      ...real, sourceEpisodes: [],
    }, version.sourceRevision)).toThrow(/chronology|disagree/i);
    const bridge = new PlanetaryEnvironmentalHistoryCertification31Fg(real, version.sourceRevision);
    expect(() => bridge.reconstruct({ ...query(), context: {
      ...context, bodyKey: 'G0/S-26/O5/B1',
    } })).toThrow(/foreign|body/i);
    expect(() => bridge.reconstruct({ ...query(), version: {
      ...version, sourceRevision: 'changed',
    } })).toThrow(/revision/i);
  });

  it('rechaza falsos intervalos fechados provenientes de 32.6 y no altera la entrada', () => {
    const physical = climate();
    const forged = { ...physical, resolvedClimateGeochemistryChanges: [{
      startYear: 0, endYear: 100, temperatureKelvin: 300,
    }] } as unknown as PlanetaryClimateGeochemistryHistoryResult32_6;
    expect(() => new PlanetaryEnvironmentalHistoryCertification31Fg(forged, version.sourceRevision))
      .toThrow(/32.6|trajectory/i);
    const source = withEvent();
    const copy = JSON.stringify(source.chronology);
    const bridge = new PlanetaryEnvironmentalHistoryCertification31Fg(source, version.sourceRevision);
    bridge.reconstruct(query());
    expect(JSON.stringify(source.chronology)).toBe(copy);
  });

  it('bloquea fallos de identidad CT-0 y mantiene opacas las fuentes para observación', () => {
    const bridge = new PlanetaryEnvironmentalHistoryCertification31Fg(climate(), version.sourceRevision);
    expect(() => bridge.reconstruct({ ...query(), context: {
      ...context, time: { ...time, systemAgeBillionYears: 3.1 },
    } })).toThrow(/CT-0|age|body/i);
    const result = bridge.reconstruct(query());
    expect(JSON.stringify(result.certification)).not.toContain('SIMULATED_REALITY');
    expect(JSON.stringify(result.certification)).not.toContain('sourceRecordKey');
    expect(result.certification.playerVisible).toBe(false);
  });
  it('32.9: respuestas transitorias fechadas sin delta climático NO constituyen trayectorias', () => {
    const source = withEvent();
    const transient = {
      contractVersion: '32.9-CT0', layer: 'SIMULATED_REALITY',
      bodyKind: 'PLANET', bodyKey: key,
      sourceCoverage: 'SUPPLIED_RECORDS_ONLY', eventCount: 1,
      exposureCount: 1, unresolvedExposureCount: 0,
      responses: [{ responseId: 'response-1', climateTemperatureChangeKelvin: null,
        atmosphericMassChangeKilograms: null }],
      sourceEpisodes: source.sourceEpisodes, chronology: source.chronology,
      historicalCompleteness: 'NOT_ESTABLISHED', lifePresence: 'NOT_EVALUATED',
    } as unknown as PlanetaryTransientEffectsHistoryResult32_9;
    const bridge = new PlanetaryEnvironmentalHistoryCertification31Fg(transient, version.sourceRevision);
    const report = bridge.reconstruct(query());
    expect(report.certification.reason).toBe('EVENT_EFFECTS_NOT_ENVIRONMENTAL_TRAJECTORY');
    expect(report.certification.certifiedContinuousIntervals).toBe(0);
    expect(report.physical.history.chronology.episodes).toHaveLength(1);
    expect(surface(report).compatibleWindows).toEqual([]);
    expect(surface(report).uncoveredIntervals).toEqual([{ startYear: 100, endYear: 149 }]);
    expect(() => new PlanetaryEnvironmentalHistoryCertification31Fg({ ...transient,
      responses: [{ ...transient.responses[0], climateTemperatureChangeKelvin: 18 }],
    } as unknown as PlanetaryTransientEffectsHistoryResult32_9, version.sourceRevision)).toThrow(/climate history|transient/i);
  });

  it('32.9 lunar: el episodio lunar no se atribuye al planeta y la historia ambiental sigue vacía', () => {
    const lunar = { ...context, bodyKind: 'MOON' as const, bodyKey: `${key}/M0` };
    const e = { ...event(), targetBodyKind: 'MOON' as const,
      targetBodyKey: lunar.bodyKey, episodeKey: `${lunar.bodyKey}/formation` };
    const physical = {
      contractVersion: '32.9-CT0', layer: 'SIMULATED_REALITY',
      bodyKind: 'MOON', bodyKey: lunar.bodyKey, responses: [],
      sourceEpisodes: [e], chronology: PlanetaryHistoryEngine.build({ ...lunar, episodes: [e] }),
      historicalCompleteness: 'NOT_ESTABLISHED',
    } as unknown as PlanetaryTransientEffectsHistoryResult32_9;
    const bridge = new PlanetaryEnvironmentalHistoryCertification31Fg(physical, version.sourceRevision);
    const r = bridge.reconstruct({ ...query(), context: lunar });
    expect(r.physical.windows.bodyKey).toBe(lunar.bodyKey);
    expect(r.physical.history.chronology.episodes).toHaveLength(1);
    expect(r.certification.certifiedContinuousIntervals).toBe(0);
    expect(() => bridge.reconstruct(query())).toThrow(/foreign|body/i);
  });

});
