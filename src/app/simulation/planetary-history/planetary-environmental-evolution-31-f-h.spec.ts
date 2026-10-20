import { describe, expect, it } from 'vitest';
import { PlanetaryEnvironmentalEvolution31Fh, type DatedEnvironmentalForcing31Fh,
} from './planetary-environmental-evolution-31-f-h';
import { PlanetaryEnvironmentalHistoryCertification31Fg } from './planetary-environmental-history-certification-31-f-g';
import { PlanetaryHistoryEngine } from './planetary-history-engine';
import type { PlanetaryTransientEffectsHistoryResult32_9 } from '../../domain/planetary-history/planetary-transient-effects-history-32-9';
import type { HistoricalHabContext31_7 } from '../../domain/habitability/habitability-historical-windows-31-7';
import { HabitabilityDatedPhysicalSource31Fc } from '../habitability/habitability-dated-physical-source-31-f-c';

const planet = { bodyKind: 'PLANET' as const, bodyKey: 'G0/S9/O1/B0', multiplicity: 'SINGLE' as const,
  time: { kind: 'CURRENT_SNAPSHOT' as const, systemAgeBillionYears: 1 } };
const moon = { ...planet, bodyKind: 'MOON' as const, bodyKey: `${planet.bodyKey}/M0` };
const version = { universeKey: 'universe-v2', physicsModelRevision: 'physics-v2', sourceRevision: 'physical-v1' };
const query = (ctx: HistoricalHabContext31_7 = planet, startYear = 100, endYear = 299) => ({ context: ctx, version, startYear, endYear });
const forcing = (startYear: number, endYear: number): DatedEnvironmentalForcing31Fh => ({
  startYear, endYear,
  provenance: { sourcePhase: 'SOURCE_HISTORICAL_THERMODYNAMICS',
    sourceModel: 'DATED_RADIATIVE_BOUNDARY_MODEL',
    sourceRecordKey: `dated-physical/${startYear}`, temporalSupport: 'CONTINUOUS_DATED_PHYSICAL_FORCING' },
  stellarFluxWattsPerSquareMeter: { min: 1361, max: 1361 },
  bondAlbedo01: { min: 0.3, max: 0.3 },
  additionalHeatWattsPerSquareMeter: { min: 0, max: 0 },
  longwaveEmissivity01: { min: 0.61, max: 0.61 },
  effectiveHeatCapacityJoulesPerSquareMeterKelvin: { min: 1e9, max: 1e9 },
  initialMeanTemperatureKelvin: { min: 289, max: 300 },
  initialTemperatureSource: { sourceModel: 'DATED_EPOCH_TEMPERATURE',
    sourceRecordKey: `dated-initial/${startYear}`, atYear: startYear,
    temporalSupport: 'DATED_PHYSICAL_INITIAL_TEMPERATURE' },
  surfacePressurePascal: { min: 100000, max: 101000 },
  surfacePressureSource: { sourceModel: 'DATED_VOLATILE_INVENTORY',
    sourceRecordKey: `dated-pressure/${startYear}`,
    temporalSupport: 'CONTINUOUS_DATED_PHYSICAL_PRESSURE' },
});
const build = (windows: readonly DatedEnvironmentalForcing31Fh[], ctx: HistoricalHabContext31_7 = planet, stepYears = 10) =>
  new PlanetaryEnvironmentalEvolution31Fh({ context: ctx, sourceRevision: 'dated-physical-revision-1',
    forcing: windows, stepYears });
const materialized = (ctx: HistoricalHabContext31_7 = planet): PlanetaryTransientEffectsHistoryResult32_9 => ({
  contractVersion: '32.9-CT0', layer: 'SIMULATED_REALITY', bodyKind: ctx.bodyKind,
  bodyKey: ctx.bodyKey, responses: [], sourceEpisodes: [],
  chronology: PlanetaryHistoryEngine.build({ ...ctx, episodes: [] }),
  historicalCompleteness: 'NOT_ESTABLISHED',
} as unknown as PlanetaryTransientEffectsHistoryResult32_9);

// Read-only simulation tests: the forcing fixtures represent explicitly dated
// independent physical constraints, NOT time histories inferred from 32.6.
describe('31.F.h — evolución ambiental térmica acotada y trazable', () => {
  it('evoluciona con disipación física y certifica límites para CADA año, sin inventar agua', () => {
    const model = build([forcing(100, 139)]);
    expect(model.result.intervals).toHaveLength(4);
    const [first, second, third, fourth] = model.result.thermalEnvelopes;
    expect(first.maxKelvin).toBe(300);
    expect(second.maxKelvin).toBeLessThan(first.maxKelvin);
    expect(third.maxKelvin).toBeLessThan(second.maxKelvin);
    expect(fourth.minKelvin).toBeGreaterThan(280);
    expect(model.result.gaps).toEqual([
      { startYear: 0, endYear: 99 }, { startYear: 140, endYear: 1000000000 },
    ]);
    const item = model.result.intervals[1];
    expect(item.coverage).toBe('ENVIRONMENT_RESOLVED_FOR_EVERY_CT0_YEAR');
    expect(item.resolution).toBe('INFERRED_INTERVAL');
    expect(item.evidence.find(e => e.constraint === 'PRESSURE_OR_CONFINEMENT')?.verdict).toBe('SUPPORTS');
    expect(item.evidence.find(e => e.constraint === 'LIQUID_RESERVOIR')).toBeUndefined();
    expect(JSON.stringify(model.result)).not.toContain('DIRECT_OBSERVATION');
    expect(model.result.playerVisible).toBe(false);
  });

  it('propaga forzamiento cambiante por etapas y no rellena una laguna entre ellas', () => {
    const earlier = forcing(100, 119);
    const later = { ...forcing(150, 169), stellarFluxWattsPerSquareMeter: { min: 500, max: 500 },
      initialMeanTemperatureKelvin: { min: 250, max: 260 } };
    const model = build([later, earlier]);
    expect(model.result.intervals).toHaveLength(4);
    expect(model.result.gaps).toContainEqual({ startYear: 120, endYear: 149 });
    expect(model.result.thermalEnvelopes[3].maxKelvin).toBeLessThan(model.result.thermalEnvelopes[1].maxKelvin);
    expect(model.readInterval(planet, 110, 155, 20).map(r => [r.startYear, r.endYear]))
      .toEqual([[110, 119], [150, 159]]);
    expect(model.revision(planet)).toBe('31.F.h:dated-physical-revision-1');
  });

  it('prohibe convertir una fuente actual o un episodio puntual en radiación histórica', () => {
    expect(() => build([{ ...forcing(100, 120), provenance: {
      ...forcing(100, 120).provenance, sourceModel: '32.6',
    } }])).toThrow(/current proxies|dated/i);
    expect(() => build([{ ...forcing(100, 120), provenance: {
      ...forcing(100, 120).provenance, temporalSupport: 'CURRENT_SNAPSHOT' as never,
    } }])).toThrow(/dated/i);
    expect(() => build([{ ...forcing(100, 120), initialMeanTemperatureKelvin: undefined }]))
      .toThrow(/dated|forcing/i);
    expect(() => build([{ ...forcing(100, 120), startYear: 150, endYear: 149 }]))
      .toThrow(/dated|forcing/i);
  });

  it('rechaza discontinuidades de frontera, duplicados, revisiones y cuerpos ajenos', () => {
    expect(() => build([forcing(100, 130), forcing(120, 140)])).toThrow(/overlap/i);
    expect(() => build([forcing(100, 119), { ...forcing(120, 139),
      initialMeanTemperatureKelvin: { min: 500, max: 520 } }])).toThrow(/contradict/i);
    expect(() => build([forcing(100, 119), { ...forcing(150, 169),
      initialMeanTemperatureKelvin: undefined, initialTemperatureSource: undefined }])).toThrow(/initial/i);
    const model = build([forcing(100, 119)]);
    expect(() => model.readInterval(moon, 100, 119, 30)).toThrow(/different body/i);
    expect(() => model.readInterval(planet, 120, 119, 30)).toThrow(/bounded/i);
    expect(() => model.readInterval(planet, 100, 119, 5000)).toThrow(/bounded/i);
  });

  it('rechaza orígenes físicos reutilizados en etapas diferentes', () => {
    expect(() => build([forcing(100, 119), { ...forcing(120, 139),
      provenance: { ...forcing(120, 139).provenance,
        sourceRecordKey: 'dated-physical/100' },
      initialMeanTemperatureKelvin: undefined, initialTemperatureSource: undefined }])).toThrow(/duplicated/i);
  });

  it('31.F.g impide atravesar transitorios con consecuencias climáticas sin resolver', () => {
    const model = build([forcing(100, 139)]);
    const event = { episodeKey: 'impact-110', targetBodyKind: 'PLANET' as const,
      targetBodyKey: planet.bodyKey, kind: 'REALIZED_IMPACT' as const,
      time: { timeScale: 'YEARS_SINCE_SYSTEM_FORMATION' as const,
        startYear: 110, endYear: 110, resolution: 'MODELLED_INSTANT' as const },
      source: { sourcePhase: '32.8', sourceModel: 'dated-impact',
        sourceRecordKey: 'impact-110', evidenceKind: 'RESOLVED_PHYSICAL_EVENT' as const },
      causedByEpisodeKeys: [] as string[],
    };
    const actual = { ...materialized(), sourceEpisodes: [event],
      chronology: PlanetaryHistoryEngine.build({ ...planet, episodes: [event] }) };
    expect(() => new PlanetaryEnvironmentalHistoryCertification31Fg(actual,
      version.sourceRevision, model)).toThrow(/transient crossing/i);
  });

  it('soporta un catálogo vacío, sin generar tiempo habitable retroactivo', () => {
    const model = build([]);
    expect(model.result.intervals).toEqual([]);
    expect(model.result.gaps).toEqual([{ startYear: 0, endYear: 1000000000 }]);
    const bridge = new PlanetaryEnvironmentalHistoryCertification31Fg(materialized(),
      version.sourceRevision, model);
    expect(bridge.reconstruct(query()).certification.verdict).toBe('NO_CERTIFIED_ENVIRONMENTAL_TRAJECTORIES');
    expect(bridge.reconstruct(query()).physical.windows.routes[0].compatibleWindows).toEqual([]);
  });

  it('31.F.c → 31.F.d → 31.F.g consume cotas físicas reales, dejando restricciones insuficientes', () => {
    const model = build([forcing(100, 139)]);
    const source = new HabitabilityDatedPhysicalSource31Fc(model);
    const snapshots = source.readInterval(planet, 100, 139, 100);
    expect(snapshots).toHaveLength(4);
    expect(snapshots.every(r => r.accessibleToObserver === false &&
      r.evidence.every(e => e.accessibleToObserver === false))).toBe(true);
    const bridge = new PlanetaryEnvironmentalHistoryCertification31Fg(materialized(),
      version.sourceRevision, model);
    const result = bridge.reconstruct(query(planet, 90, 149));
    expect(result.certification.verdict).toBe('CONDITIONAL_DATED_THERMAL_ENVELOPES');
    expect(result.certification.boundedThermalIntervals).toBe(4);
    expect(result.certification.certifiedContinuousIntervals).toBe(0);
    expect(result.certification.historicalCoverage).toBe('PARTIAL');
    const surface = result.physical.windows.routes.find(r => r.route === 'SURFACE_AQUEOUS')!;
    expect(surface.segments.some(s => s.temporalBasis === 'DATED_INFERRED_ENVELOPE')).toBe(true);
    expect(surface.uncoveredIntervals).toEqual([
      { startYear: 90, endYear: 99 }, { startYear: 140, endYear: 149 },
    ]);
    expect(surface.compatibleWindows).toEqual([]); // No dated liquid reservoir or radiation protection.
    expect(result.physical.continuity.routes.find(r => r.route === 'SURFACE_AQUEOUS')!
      .accumulatedCompatibleYearSlots).toBe(0);
    expect(result.physical.lifePresence).toBe('NOT_EVALUATED');
    expect(bridge.reconstruct(query(planet, 90, 149))).toEqual(result);
  });

  it('lunas: fuente propia, sin heredar océanos o atmósfera del planeta', () => {
    const stage = { ...forcing(100, 119), surfacePressurePascal: undefined,
      surfacePressureSource: undefined,
      provenance: { ...forcing(100, 119).provenance, sourceRecordKey: 'moon-dated-thermal-1' } };
    const model = build([stage], moon);
    const lunar = model.result.intervals[0];
    expect(lunar.bodyKind).toBe('MOON');
    expect(lunar.evidence.some(e => e.constraint === 'PRESSURE_OR_CONFINEMENT')).toBe(false);
    expect(lunar.evidence.some(e => e.route === 'SUBSURFACE_AQUEOUS')).toBe(false);
    const bridge = new PlanetaryEnvironmentalHistoryCertification31Fg(materialized(moon),
      version.sourceRevision, model);
    const result = bridge.reconstruct(query(moon, 100, 129));
    expect(result.physical.windows.bodyKind).toBe('MOON');
    expect(result.physical.windows.routes[0].uncoveredIntervals).toEqual([{ startYear: 120, endYear: 129 }]);
    expect(() => bridge.reconstruct(query(planet, 100, 129))).toThrow(/foreign|body/i);
  });

  it('31.F.g rechaza una evolución fechada incompatible con el clima actual 32.6', () => {
    const now = 1000000000;
    const model = build([{ ...forcing(now - 19, now),
      initialMeanTemperatureKelvin: { min: 289, max: 300 } }]);
    const current = { ...materialized(), contractVersion: '32.6-CT0',
      snapshot: { interpretation: 'CURRENT_PHYSICAL_STATE_NOT_HISTORICAL_TREND',
        meanSurfaceTemperatureKelvin: 400 },
      drivers: [], resolvedClimateGeochemistryChanges: [],
    } as unknown as import('../../domain/planetary-history/planetary-climate-geochemistry-history-32-6')
      .PlanetaryClimateGeochemistryHistoryResult32_6;
    expect(() => new PlanetaryEnvironmentalHistoryCertification31Fg(current,
      version.sourceRevision, model)).toThrow(/current|disagrees/i);
  });

  it('determinismo: perturbación posterior de los forzamientos no modifica los intervalos retenidos', () => {
    const data = [forcing(100, 119)];
    const model = build(data);
    const prior = JSON.stringify(model.result);
    data[0] = { ...data[0], stellarFluxWattsPerSquareMeter: { min: 999, max: 999 } };
    expect(JSON.stringify(model.result)).toBe(prior);
    expect(build([forcing(100, 119)]).result).toEqual(model.result);
  });

  it('cotas frías contradicen temperatura, sin inventar una pérdida irreversible de habitabilidad', () => {
    const ice = { ...forcing(100, 119), stellarFluxWattsPerSquareMeter: { min: 200, max: 200 },
      initialMeanTemperatureKelvin: { min: 100, max: 150 } };
    const model = build([ice]);
    expect(model.result.intervals.every(r => r.evidence.some(e =>
      e.constraint === 'TEMPERATURE' && e.verdict === 'CONTRADICTS'))).toBe(true);
    const result = new PlanetaryEnvironmentalHistoryCertification31Fg(materialized(),
      version.sourceRevision, model).reconstruct(query(planet, 100, 129));
    expect(result.physical.windows.routes[0].compatibleWindows).toEqual([]);
    expect(result.physical.evolutionaryStability.lifePresence).toBe('NOT_EVALUATED');
  });
});
