import type { RelevantMoon } from '../../domain/planetary/relevant-moon';
import type { PhysicalWorldHistory31Fi3 } from '../planetary-history/planetary-v2-dated-physics-31-f-i-3';
import type { LunarDatedPhysicalInterval32F5, LunarDatedEnvironmentalEvent32F5 } from '../../domain/planetary/moon-environmental-history-32-f-5';
import { MoonEnvironmentalHistoryEngine32F5 as Engine } from './moon-environmental-history-engine-32-f-5';

const KEY = 'G3/S-17/O8/B7/M2';
const moon = (): RelevantMoon => ({
  hostPlanetLocator: { galaxyIndex: 3n, sectorKey: -17n, galacticObjectIndex: 8n, bodyIndex: 7n },
  hostPlanetOrdinal: 8, moonOrdinal: 3,
  oceanReality32F2c: { hostPlanetOrdinal: 8, moonOrdinal: 3,
    state: 'PRESENT_IN_SIMULATED_MODEL', waterInventoryKilograms: 2e20,
    generatedTotalSurfaceHeatFluxWattsPerSquareMeter: 0.1144 },
  geochemicalEnergy32F4: { moonOrdinal: 3 },
} as unknown as RelevantMoon);
const irradiance = (lo: number, hi: number, n: number) => ({
  startYear: lo, endYear: hi,
  wattsPerSquareMeter: {min: n, max: n + 1},
  provenanceKeys: [`lum/${lo}/${hi}`, `orbit/${lo}/${hi}`],
});
const world = (): PhysicalWorldHistory31Fi3 => ({
  bodyKind: 'MOON', bodyKey: KEY,
  source: { sourceRevision: 'physical-r1', intervals: [{}, {}], context: {
    bodyKind: 'MOON', bodyKey: KEY, multiplicity: 'SINGLE',
    time: {kind:'CURRENT_SNAPSHOT', systemAgeBillionYears: 1e-8},
  } },
  irradiation: { sourceRevision: 'physical-r1', irradiance: [
    irradiance(3, 5, 100), irradiance(6, 10, 105),
  ] },
  gaps: [{startYear:0,endYear:2,reason:'PRE_MAIN_SEQUENCE_OR_FORMATION'}],
  pressureHistory:'UNKNOWN', waterHistory:'UNKNOWN', radiationHistory:'UNKNOWN',
  dynamicalHistory:'CONDITIONAL_KEPLERIAN_BOUNDS_NOT_SECULAR_EVOLUTION',
  historicalHabitability:'UNKNOWN', playerVisible:false,
} as unknown as PhysicalWorldHistory31Fi3);
const scenario = (a: number,b: number, partial: Partial<LunarDatedPhysicalInterval32F5> = {}): LunarDatedPhysicalInterval32F5 => ({
  startYear:a, endYear:b, sourceRecordKey:`environment-${a}`, sourceModel:'DATED_INDEPENDENT_LUNAR_STATE',
  temporalSupport:'CONTINUOUS_DATED_PHYSICAL_MODEL', ...partial,
});
const event = (a: number,b: number): LunarDatedEnvironmentalEvent32F5 => ({
  episodeKey:`impact-${a}`, bodyKey:KEY, startYear:a, endYear:b,
  kind:'REALIZED_IMPACT', sourcePhase:'32.8', sourceModel:'DATED_IMPACT_MODEL',
  sourceRecordKey:`impact-physical-${a}`, evidenceKind:'RESOLVED_PHYSICAL_EVENT',
});

describe('32.F.5 — historia lunar fechada sin extrapolación de CT-0', () => {
  it('sin edad ni fuente devuelve historia desconocida sin fabricar episodios', () => {
    const x = Engine.fromMaterialized(moon());
    expect(x.ageYearsCT0).toBeNull();
    expect(x.intervals).toEqual([]);
    expect(x.events).toEqual([]);
    expect(x.currentOceanStateCT0).toBe('PRESENT');
    expect(x.currentHeatFluxCT0WattsPerSquareMeter).toBe(.1144);
    expect(x.historicalOceanContinuity).toBe('UNKNOWN');
    expect(x.historicalHabitability).toBe('UNKNOWN');
  });
  it('consume irradiancia fechada independiente, pero no retropropaga mareas ni océanos', () => {
    const x = Engine.fromMaterialized(moon(), world(), 10);
    expect(x.intervals.map(s => [s.startYear, s.endYear])).toEqual([[0,2],[3,5],[6,10]]);
    expect(x.intervals[0].irradianceWattsPerSquareMeter).toBeNull();
    expect(x.intervals[1].irradianceWattsPerSquareMeter).toEqual({min:100,max:101});
    expect(x.intervals.every(s => s.heatFluxWattsPerSquareMeter === null &&
      s.surfaceTemperatureKelvin === null && s.oceanState === 'UNKNOWN')).toBe(true);
    expect(x.datedOceanTransitionCount).toBe(0);
    expect(x.historicalOceanContinuity).toBe('UNKNOWN');
    expect(x.datedModelInterruptions[0].reason).toBe('PRE_MAIN_SEQUENCE_OR_FORMATION');
    expect(Engine.fromMaterialized(moon(), world(), 10)).toEqual(x);
  });
  it('consume intervalos ambientales independientes, detecta cambios de fase fechados y deja huecos desconocidos', () => {
    const x = Engine.fromMaterialized(moon(), world(), 10, [
      scenario(3,5,{liquidH2OMassKilograms:{min:0,max:0},heatFluxWattsPerSquareMeter:{min:.01,max:.02}}),
      scenario(6,8,{liquidH2OMassKilograms:{min:1e17,max:2e17},heatFluxWattsPerSquareMeter:{min:.02,max:.04}}),
    ]);
    expect(x.datedOceanTransitionCount).toBe(1);
    expect(x.intervals.map(s=>s.oceanState)).toEqual([
      'UNKNOWN','ABSENT_IN_DATED_MODEL','PRESENT_IN_DATED_MODEL','UNKNOWN',
    ]);
    expect(x.historicalOceanContinuity).toBe('UNKNOWN');
    expect(x.intervals[3].liquidH2OMassKilograms).toBeNull();
    expect(x.intervals[3].heatFluxWattsPerSquareMeter).toBeNull();
  });
  it('no presenta efectos supuestos: episodio fechado sin magnitud conserva incertidumbre', () => {
    const x = Engine.fromMaterialized(moon(), world(), 10, [], [event(4,4)]);
    expect(x.events[0].environmentalConsequence).toBe('UNKNOWN_NOT_ZERO');
    expect(x.events[0].effectDelta).toBeNull();
    expect(x.intervals.find(s=>s.startYear === 4)?.overlappingEventKeys).toEqual(['impact-4']);
    expect(x.intervals.find(s=>s.startYear === 4)?.oceanState).toBe('UNKNOWN');
  });
  it('no convierte el delta térmico de un impacto en flujo absoluto o años posteriores', () => {
    const x = Engine.fromMaterialized(moon(), world(), 10, [], [{...event(4,4),
      resolvedEffect: {kind:'HEAT_FLUX_CHANGE', delta:{min: 0.1,max:0.8},
        sourceRecordKey:'impact-heating-model',temporalSupport:'DATED_PHYSICAL_EVENT_CONSEQUENCE'},
    }]);
    expect(x.events[0].effectDelta).toEqual({min:.1,max:.8});
    expect(x.events[0].environmentalConsequence).toBe('DATED_DELTA_ONLY_NO_STATE_EXTRAPOLATION');
    expect(x.intervals.every(s => s.heatFluxWattsPerSquareMeter === null)).toBe(true);
    expect(x.intervals.find(s => s.startYear === 5)?.overlappingEventKeys).toEqual([]);
  });
  it('interrumpe irradiancia antecedente en evento estelar o transitorio fechado', () => {
    const x = Engine.fromMaterialized(moon(), world(), 10, [], [{...event(7,8),
      kind:'STELLAR_ENVIRONMENT_CHANGE'}]);
    expect(x.intervals.find(s=>s.startYear===7)?.irradianceWattsPerSquareMeter).toBeNull();
    expect(x.intervals.find(s=>s.startYear===7)?.radiativeModelInterrupted).toBe(true);
    expect(x.intervals.find(s=>s.startYear===9)?.irradianceWattsPerSquareMeter).toBeNull();
    const transient = Engine.fromMaterialized(moon(), world(), 10, [], [{...event(7,8),
      kind:'RESOLVED_TRANSIENT_EFFECT'}]);
    expect(transient.intervals.find(s=>s.startYear===9)?.irradianceWattsPerSquareMeter)
      .toEqual({min:105,max:106});
  });
  it('convierte episodios físicos lunares 32.1 en eventos fechados sin inventar sus consecuencias', () => {
    const episode = Engine.fromDatedHistoricalEpisode32_1({
      episodeKey: 'impact-4', targetBodyKind: 'MOON', targetBodyKey: KEY,
      kind: 'REALIZED_IMPACT', time:{timeScale:'YEARS_SINCE_SYSTEM_FORMATION',
        startYear:4,endYear:4,resolution:'MODELLED_INSTANT'},
      source:{sourcePhase:'32.8',sourceModel:'PHYSICAL_IMPACT_RECORD',
        sourceRecordKey:'impact-resolved-4',evidenceKind:'RESOLVED_PHYSICAL_EVENT'},
      causedByEpisodeKeys:[],
    });
    expect(episode?.resolvedEffect).toBe(undefined);
    expect(Engine.fromMaterialized(moon(), world(), 10, [], [episode!]).events[0]
      .environmentalConsequence).toBe('UNKNOWN_NOT_ZERO');
  });
  it('rechaza fuentes cruzadas, edad incoherente, ventanas solapadas o masa H₂O imposible', () => {
    expect(() => Engine.fromMaterialized(moon(), {...world(),bodyKey:'foreign'},10)).toThrow();
    expect(() => Engine.fromMaterialized(moon(), world(),null)).toThrow();
    expect(() => Engine.fromMaterialized(moon(), world(),11)).toThrow();
    expect(() => Engine.fromMaterialized(moon(),world(),10,[scenario(2,4,{surfacePressurePascal:{min:1,max:2}}),
      scenario(4,6,{surfacePressurePascal:{min:1,max:2}})])).toThrow();
    expect(() => Engine.fromMaterialized(moon(),world(),10,[scenario(2,4,{
      liquidH2OMassKilograms:{min:1e20,max:3e20}})])).toThrow();
    expect(() => Engine.fromMaterialized(moon(),world(),10,[],[{...event(4,4), bodyKey:'foreign'}])).toThrow();
    expect(() => Engine.fromMaterialized(moon(),world(),10,[],[{...event(4,4),
      evidenceKind:'INFERRED_PHYSICAL_EPISODE',
      resolvedEffect:{kind:'IRRADIANCE_CHANGE',delta:{min:1,max:2},
        sourceRecordKey:'fictitious',temporalSupport:'DATED_PHYSICAL_EVENT_CONSEQUENCE'},
    }])).toThrow();
  });
});
