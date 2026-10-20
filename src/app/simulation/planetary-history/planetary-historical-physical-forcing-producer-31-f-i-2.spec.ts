import { describe, expect, it } from 'vitest';
import { PlanetaryHistoricalPhysicalForcingProducer31Fi2 as Producer,
  type DatedPhysicalIrradiationSegment31Fi2,
  type HistoricalPhysicalForcingInput31Fi2,
} from './planetary-historical-physical-forcing-producer-31-f-i-2';
import { PlanetaryEnvironmentalEvolution31Fh } from './planetary-environmental-evolution-31-f-h';

const context = { bodyKind: 'PLANET' as const, bodyKey: 'G0/S9/O1/B0',
  multiplicity: 'SINGLE' as const,
  time: { kind: 'CURRENT_SNAPSHOT' as const, systemAgeBillionYears: 4.1 } };
const dated = (key: string) => ({ sourcePhase: 'HISTORICAL_STELLAR_ORBITAL_PHYSICS',
  sourceModel: 'TIME_RESOLVED_PHYSICAL_ENVELOPE', sourceRecordKey: key,
  temporalSupport: 'CONTINUOUS_DATED_PHYSICAL_MODEL' as const });
const host = (label: 'A' | 'B' | 'C', fluxScale = 1) => ({
  label, luminositySolar: { min: fluxScale, max: fluxScale },
  distanceAu: { min: 1, max: 1 },
  luminositySource: dated(`${label}-luminosity-1`),
  orbitalSource: { ...dated(`${label}-orbit-1`), bodyKey: context.bodyKey },
});
const interval = (start = 100, end = 119): DatedPhysicalIrradiationSegment31Fi2 => ({
  startYear: start, endYear: end, hosts: [host('A')],
});
const input = (segments: readonly DatedPhysicalIrradiationSegment31Fi2[],
  ctx: HistoricalPhysicalForcingInput31Fi2['context'] = context): HistoricalPhysicalForcingInput31Fi2 => ({
  context: ctx, sourceRevision: 'independent-dated-physics-r1', intervals: segments,
});
const therm = (start = 100) => ({
  provenance: { ...dated(`thermal-${start}`), bodyKey: context.bodyKey },
  bondAlbedo01: { min: 0.25, max: 0.35 },
  additionalHeatWattsPerSquareMeter: { min: 0, max: 0 },
  longwaveEmissivity01: { min: 0.6, max: 0.7 },
  effectiveHeatCapacityJoulesPerSquareMeterKelvin: { min: 1e9, max: 1e9 },
  initialMeanTemperatureKelvin: { min: 275, max: 300 },
  initialTemperatureSource: { sourceModel: 'INDEPENDENT_DATED_THERMAL_ANCHOR',
    sourceRecordKey: `initial-${start}`, atYear: start, bodyKey: context.bodyKey,
    temporalSupport: 'DATED_PHYSICAL_INITIAL_TEMPERATURE' as const },
});

describe('31.F.i.2 — productor temporal de irradiación físicamente fechada', () => {
  it('calcula luminosidad sobre distancia al cuadrado y no infiere atmósfera pasada', () => {
    const result = Producer.produce(input([interval()]));
    expect(result.irradiance).toHaveLength(1);
    expect(result.irradiance[0].wattsPerSquareMeter.min).toBeGreaterThan(1360);
    expect(result.irradiance[0].wattsPerSquareMeter.max).toBeLessThan(1363);
    expect(result.forcing).toHaveLength(0);
    expect(result.missingEnvironmentalForcing).toEqual([{ startYear: 100, endYear: 119 }]);
    expect(result.environmentalHistoryComplete).toBe(false);
    expect(result.missingStellarOrbitalHistory).toEqual([
      { startYear: 0, endYear: 99 }, { startYear: 120, endYear: 4100000000 },
    ]);
    expect(result.playerVisible).toBe(false);
  });

  it('calcula cotas físicamente conservadoras para luminosidad y órbita variables', () => {
    const variant = { ...interval(), hosts: [{ ...host('A'),
      luminositySolar: { min: 0.8, max: 1.2 }, distanceAu: { min: 0.9, max: 1.1 } }] };
    const [flux] = Producer.produce(input([variant])).irradiance;
    const unit = Producer.produce(input([interval()])).irradiance[0].wattsPerSquareMeter.min;
    expect(flux.wattsPerSquareMeter.min / unit).toBeCloseTo(0.8 / 1.1 ** 2, 10);
    expect(flux.wattsPerSquareMeter.max / unit).toBeCloseTo(1.2 / 0.9 ** 2, 10);
  });

  it('soporta BINARY y TRIPLE sumando anfitriones separados, no copiando SINGLE', () => {
    const binary = { ...context, multiplicity: 'BINARY' as const };
    const triple = { ...context, multiplicity: 'TRIPLE' as const };
    const two = { ...interval(), hosts: [host('A'), host('B', 0.5)] };
    const three = { ...interval(), hosts: [...two.hosts, host('C', 0.25)] };
    const f1 = Producer.produce(input([interval()])).irradiance[0].wattsPerSquareMeter.min;
    const f2 = Producer.produce(input([two], binary)).irradiance[0].wattsPerSquareMeter.min;
    const f3 = Producer.produce(input([three], triple)).irradiance[0].wattsPerSquareMeter.min;
    expect(f2 / f1).toBeCloseTo(1.5, 10);
    expect(f3 / f1).toBeCloseTo(1.75, 10);
    expect(() => Producer.produce(input([two]))).toThrow();
    expect(() => Producer.produce(input([three], binary))).toThrow();
    expect(() => Producer.produce(input([{ ...two, hosts: [host('B'), host('A')] }], binary))).toThrow();
  });

  it('respeta fuentes lunares propias sin asumir la distancia ni atmósfera del planeta', () => {
    const lunar = { ...context, bodyKind: 'MOON' as const,
      bodyKey: `${context.bodyKey}/M0` };
    const r = Producer.produce(input([{ ...interval(), hosts: [{ ...host('A'),
      orbitalSource: { ...host('A').orbitalSource, bodyKey: lunar.bodyKey },
      distanceAu: { min: 1.1, max: 1.2 } }] }], lunar));
    expect(r.irradiance[0].wattsPerSquareMeter.max).toBeLessThan(1200);
    expect(r.forcing).toEqual([]);
    expect(r.lifePresence).toBe('NOT_EVALUATED');
    expect(() => Producer.produce(input([interval()], lunar))).toThrow(/another planet or moon/i);
  });

  it('entrega a 31.F.h un forzamiento acotado SOLO con frontera térmica independiente', () => {
    const complete = { ...interval(), thermal: therm() };
    const result = Producer.produce(input([complete]));
    expect(result.forcing).toHaveLength(1);
    const evolution = new PlanetaryEnvironmentalEvolution31Fh({ context,
      sourceRevision: result.sourceRevision, stepYears: 10, forcing: result.forcing });
    expect(evolution.result.intervals).toHaveLength(2);
    expect(evolution.result.lifePresence).toBe('NOT_EVALUATED');
    expect(evolution.result.gaps).toContainEqual({ startYear: 120, endYear: 4100000000 });
    expect(result.environmentalHistoryComplete).toBe(false);
  });

  it('rechaza extrapolaciones del estado presente y muestras puntuales', () => {
    const st = interval();
    expect(() => Producer.produce(input([{ ...st, hosts: [{ ...host('A'),
      luminositySource: { ...dated('A-luminosity-1'), sourceModel: '32.6' } }] }]))).toThrow();
    expect(() => Producer.produce(input([{ ...st, hosts: [{ ...host('A'),
      orbitalSource: { ...dated('A-orbit-1'), bodyKey: context.bodyKey, temporalSupport: 'POINT_SAMPLE' as never } }] }]))).toThrow();
    expect(() => Producer.produce(input([{ ...st, hosts: [{ ...host('A'),
      distanceAu: { min: 0, max: 1 } }] }]))).toThrow();
    expect(() => Producer.produce(input([{ ...st, hosts: [{ ...host('A'),
      luminositySolar: { min: -1, max: 1 } }] }]))).toThrow();
  });

  it('rechaza discontinuidades no delimitadas, duplicados, fuera de época y ausencia de edad', () => {
    const a = interval();
    expect(() => Producer.produce(input([a, a]))).toThrow();
    expect(() => Producer.produce(input([a, { ...interval(120, 139) }]))).toThrow(/duplicated/i);
    expect(() => Producer.produce(input([{ ...a, endYear: 4_200_000_000 }]))).toThrow();
    expect(() => Producer.produce(input([a], { ...context, time: {
      kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: null } }))).toThrow();
    const valid = Producer.produce(input([{ ...a, startYear: 100, endYear: 109 },
      { ...interval(200, 209), hosts: [{ ...host('A'),
        luminositySource: dated('A-luminosity-2'), orbitalSource: { ...dated('A-orbit-2'), bodyKey: context.bodyKey } }] }]));
    expect(valid.irradiance).toHaveLength(2);
    expect(valid.forcing).toHaveLength(0);
  });

  it('es inmutable y determinista; revisiones inválidas o frontera actual se rechazan', () => {
    const original = input([interval()]);
    const a = Producer.produce(original);
    expect(Producer.produce(original)).toEqual(a);
    expect(() => Producer.produce(input([{ ...interval(), thermal: {
      ...therm(), provenance: { ...dated('thermal-100'), bodyKey: context.bodyKey, sourceModel: 'CURRENT_SNAPSHOT' },
    } }]))).toThrow();
    expect(() => Producer.produce({ ...original, sourceRevision: 'CURRENT_SNAPSHOT' })).toThrow();
    expect(Object.isFrozen(a.irradiance[0].wattsPerSquareMeter)).toBe(true);
  });
});
