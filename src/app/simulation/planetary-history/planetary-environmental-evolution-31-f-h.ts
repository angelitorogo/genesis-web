import type { HistoricalHabContext31_7 } from '../../domain/habitability/habitability-historical-windows-31-7';
import type { HabitabilityEvidence } from '../../domain/habitability/habitability-scenario';
import {
  WATER_V1_FREEZING_TEMPERATURE_KELVIN,
  WATER_V1_TRIPLE_POINT_PRESSURE_PASCAL,
  waterBoilingTemperatureKelvinForPressurePascal,
} from '../planetary/planet-water-engine';
import type {
  DatedPhysicalEnvironmentalCatalog31Fc,
  ResolvedPhysicalEnvironmentalInterval31Fc,
} from '../habitability/habitability-dated-physical-source-31-f-c';

/**
 * 31.F.h: internal, conditional zero-dimensional energy-balance evolution.
 *
 * This integrates the conservative thermal enclosure of
 *   C dT/dt = (1-A) S/4 + G - epsilon*sigma*T^4
 * using time-bounded physical forcing envelopes and a DATED initial state.
 * It does NOT derive past S, A, G, C, emissivity, pressure or initial T from
 * the current 20.x/32.6 snapshot. Their independently modeled histories must
 * be supplied by a dated source. Without them, NO past interval is generated.
 *
 * The output certifies bounds under the explicitly supplied forcing models,
 * not measured paleoclimate, liquid water, life or a complete climate history.
 * Lunar records must have their own source: no parent-to-moon copying.
 */
export interface PhysicalRange31Fh {
  readonly min: number;
  readonly max: number;
}
export interface PhysicalInitialThermalProvenance31Fh {
  readonly sourceModel: string;
  readonly sourceRecordKey: string;
  readonly atYear: number;
  readonly temporalSupport: 'DATED_PHYSICAL_INITIAL_TEMPERATURE';
}
export interface PhysicalPressureProvenance31Fh {
  readonly sourceModel: string;
  readonly sourceRecordKey: string;
  readonly temporalSupport: 'CONTINUOUS_DATED_PHYSICAL_PRESSURE';
}
export interface DatedEnvironmentalForcing31Fh {
  readonly startYear: number;
  readonly endYear: number;
  /** Independent physical time model, covering every instant of these years. */
  readonly provenance: {
    readonly sourcePhase: string;
    readonly sourceModel: string;
    readonly sourceRecordKey: string;
    readonly temporalSupport: 'CONTINUOUS_DATED_PHYSICAL_FORCING';
  };
  /** Incoming mean stellar power, already summed over resolved host(s). */
  readonly stellarFluxWattsPerSquareMeter: PhysicalRange31Fh;
  readonly bondAlbedo01: PhysicalRange31Fh;
  /** Net nonstellar heat and greenhouse radiative forcing over the full interval. */
  readonly additionalHeatWattsPerSquareMeter: PhysicalRange31Fh;
  readonly longwaveEmissivity01: PhysicalRange31Fh;
  readonly effectiveHeatCapacityJoulesPerSquareMeterKelvin: PhysicalRange31Fh;
  /** Independent dated thermal boundary, required at the start of every gap. */
  readonly initialMeanTemperatureKelvin?: PhysicalRange31Fh;
  readonly initialTemperatureSource?: PhysicalInitialThermalProvenance31Fh;
  /** Independent dated pressure bounds; omitted means entirely unknown. */
  readonly surfacePressurePascal?: PhysicalRange31Fh;
  readonly surfacePressureSource?: PhysicalPressureProvenance31Fh;
}

export interface EnvironmentalEvolutionInput31Fh {
  readonly context: HistoricalHabContext31_7;
  readonly sourceRevision: string;
  readonly forcing: readonly DatedEnvironmentalForcing31Fh[];
  /** Maximum length of a calculated CT-0 segment; affects resolution, not physics. */
  readonly stepYears: number;
}

export interface EnvironmentalEvolutionResult31Fh {
  readonly contractVersion: '31.F.h-CT0-v1';
  readonly interpretation: 'CONDITIONAL_DATED_ENERGY_BALANCE_NOT_COMPLETE_PALEOCLIMATE';
  readonly intervals: readonly ResolvedPhysicalEnvironmentalInterval31Fc[];
  readonly thermalEnvelopes: readonly {
    readonly startYear: number;
    readonly endYear: number;
    readonly minKelvin: number;
    readonly maxKelvin: number;
    readonly sourceRecordKey: string;
  }[];
  readonly gaps: readonly { readonly startYear: number; readonly endYear: number }[];
  readonly historicalCompleteness: 'NOT_ESTABLISHED';
  readonly lifePresence: 'NOT_EVALUATED';
  readonly playerVisible: false;
}

const SIGMA = 5.670374419e-8;
const SECONDS_PER_JULIAN_YEAR = 31557600;
const MAX_INTERVALS = 256;

export class PlanetaryEnvironmentalEvolution31Fh implements DatedPhysicalEnvironmentalCatalog31Fc {
  readonly result: EnvironmentalEvolutionResult31Fh;
  private readonly context: HistoricalHabContext31_7;
  private readonly sourceRevision: string;

  constructor(input: EnvironmentalEvolutionInput31Fh) {
    if (!input || !input.context || !key(input.context.bodyKey) ||
        !['PLANET', 'MOON'].includes(input.context.bodyKind) ||
        !['SINGLE', 'BINARY', 'TRIPLE', 'UNKNOWN'].includes(input.context.multiplicity) ||
        input.context.time?.kind !== 'CURRENT_SNAPSHOT' ||
        !Number.isFinite(input.context.time.systemAgeBillionYears) ||
        input.context.time.systemAgeBillionYears === null ||
        input.context.time.systemAgeBillionYears < 0 ||
        !key(input.sourceRevision) ||
        !Number.isSafeInteger(input.stepYears) || input.stepYears < 1 ||
        !Array.isArray(input.forcing) || input.forcing.length > MAX_INTERVALS) {
      throw new RangeError('31.F.h requires a dated identified body and bounded model forcing.');
    }
    const now = Math.round(input.context.time.systemAgeBillionYears * 1e9);
    if (!Number.isSafeInteger(now)) throw new RangeError('31.F.h age outside CT-0 integer years.');
    this.context = Object.freeze({ ...input.context, time: Object.freeze({ ...input.context.time }) });
    this.sourceRevision = input.sourceRevision;
    const intervals: ResolvedPhysicalEnvironmentalInterval31Fc[] = [];
    const envelopes: EnvironmentalEvolutionResult31Fh['thermalEnvelopes'][number][] = [];
    const sorted = [...input.forcing].sort((a, b) => a.startYear - b.startYear || a.endYear - b.endYear);
    let lastEnd = -1;
    const provenanceKeys = new Set<string>();
    let lastLower: number | null = null;
    let lastUpper: number | null = null;
    for (const item of sorted) {
      validateForcing(item, now);
      if (provenanceKeys.has(item.provenance.sourceRecordKey)) {
        throw new RangeError('31.F.h duplicated dated physical provenance.');
      }
      provenanceKeys.add(item.provenance.sourceRecordKey);
      if (item.startYear <= lastEnd) throw new RangeError('31.F.h cannot overlap dated environmental models.');
      const contiguous = lastEnd >= 0 && item.startYear === lastEnd + 1;
      const anchored = item.initialMeanTemperatureKelvin;
      if (!anchored && !contiguous) {
        throw new RangeError('31.F.h requires a dated initial thermal state after every gap.');
      }
      if (anchored && contiguous && (lastLower === null || lastUpper === null ||
          anchored.max < lastLower - 1e-9 || anchored.min > lastUpper + 1e-9)) {
        throw new RangeError('31.F.h adjacent dated thermal anchors contradict the previous enclosure.');
      }
      let lower: number = anchored?.min ?? lastLower!;
      let upper: number = anchored?.max ?? lastUpper!;
      const absorbedMin = (1 - item.bondAlbedo01.max) * item.stellarFluxWattsPerSquareMeter.min / 4 +
        item.additionalHeatWattsPerSquareMeter.min;
      const absorbedMax = (1 - item.bondAlbedo01.min) * item.stellarFluxWattsPerSquareMeter.max / 4 +
        item.additionalHeatWattsPerSquareMeter.max;
      if (!(absorbedMin > 0) || !(absorbedMax >= absorbedMin)) {
        throw new RangeError('31.F.h requires a physically positive net radiative input envelope.');
      }
      const equilibriumLow = Math.pow(absorbedMin / (SIGMA * item.longwaveEmissivity01.max), .25);
      const equilibriumHigh = Math.pow(absorbedMax / (SIGMA * item.longwaveEmissivity01.min), .25);
      let start = item.startYear;
      let ordinal = 0;
      while (start <= item.endYear) {
        if (intervals.length >= MAX_INTERVALS) throw new RangeError('31.F.h bounded history record budget exceeded.');
        const end = Math.min(item.endYear, start + input.stepYears - 1);
        const thermalMin = Math.min(lower, equilibriumLow);
        const thermalMax = Math.max(upper, equilibriumHigh);
        const sourceRecordKey = `${item.provenance.sourceRecordKey}/31Fh/${ordinal}`;
        const evidence = thermalEvidence(item, thermalMin, thermalMax, sourceRecordKey);
        intervals.push(Object.freeze({
          bodyKind: input.context.bodyKind, bodyKey: input.context.bodyKey,
          timeScale: 'YEARS_SINCE_SYSTEM_FORMATION', startYear: start, endYear: end,
          resolution: 'INFERRED_INTERVAL', coverage: 'ENVIRONMENT_RESOLVED_FOR_EVERY_CT0_YEAR',
          sourcePhase: '31.F.h', sourceModel: 'DATED_BOUNDED_ENERGY_BALANCE',
          sourceRecordKey, evidence: Object.freeze(evidence),
        }));
        envelopes.push(Object.freeze({ startYear: start, endYear: end,
          minKelvin: thermalMin, maxKelvin: thermalMax, sourceRecordKey }));
        // Scalar ODE comparison with minimum forcing / maximum cooling and vice
        // versa. Conservative exponential contraction; NOT sampled point values.
        const duration = (end - start + 1) * SECONDS_PER_JULIAN_YEAR;
        const cMax = item.effectiveHeatCapacityJoulesPerSquareMeterKelvin.max;
        if (lower < equilibriumLow) {
          const rate = 4 * item.longwaveEmissivity01.max * SIGMA * Math.pow(lower, 3) / cMax;
          lower = equilibriumLow - (equilibriumLow - lower) * Math.exp(-rate * duration);
        } else {
          lower = equilibriumLow;
        }
        if (upper > equilibriumHigh) {
          const rate = 4 * item.longwaveEmissivity01.min * SIGMA * Math.pow(equilibriumHigh, 3) / cMax;
          upper = equilibriumHigh + (upper - equilibriumHigh) * Math.exp(-rate * duration);
        } else {
          upper = equilibriumHigh;
        }
        start = end + 1;
        ordinal++;
      }
      lastEnd = item.endYear;
      lastLower = lower;
      lastUpper = upper;
    }
    const gaps: { startYear: number; endYear: number }[] = [];
    let cursor = 0;
    for (const item of sorted) {
      if (item.startYear > cursor) gaps.push(Object.freeze({ startYear: cursor, endYear: item.startYear - 1 }));
      cursor = item.endYear + 1;
    }
    if (cursor <= now) gaps.push(Object.freeze({ startYear: cursor, endYear: now }));
    this.result = Object.freeze({
      contractVersion: '31.F.h-CT0-v1',
      interpretation: 'CONDITIONAL_DATED_ENERGY_BALANCE_NOT_COMPLETE_PALEOCLIMATE',
      intervals: Object.freeze(intervals), thermalEnvelopes: Object.freeze(envelopes),
      gaps: Object.freeze(gaps), historicalCompleteness: 'NOT_ESTABLISHED',
      lifePresence: 'NOT_EVALUATED', playerVisible: false,
    });
  }

  revision(ctx: HistoricalHabContext31_7): string {
    this.check(ctx);
    return `31.F.h:${this.sourceRevision}`;
  }

  readInterval(ctx: HistoricalHabContext31_7, from: number, to: number, max: number):
    readonly ResolvedPhysicalEnvironmentalInterval31Fc[] {
    this.check(ctx);
    const now = Math.round(this.context.time.systemAgeBillionYears! * 1e9);
    if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || from < 0 ||
        to < from || to > now || !Number.isSafeInteger(max) || max < 1 || max > 4097) {
      throw new RangeError('31.F.h requires a bounded CT-0 read.');
    }
    return Object.freeze(this.result.intervals.filter(i => i.startYear <= to && i.endYear >= from)
      .slice(0, max));
  }

  private check(ctx: HistoricalHabContext31_7): void {
    if (!ctx || ctx.bodyKind !== this.context.bodyKind || ctx.bodyKey !== this.context.bodyKey ||
        ctx.multiplicity !== this.context.multiplicity || ctx.time?.kind !== 'CURRENT_SNAPSHOT' ||
        ctx.time.systemAgeBillionYears !== this.context.time.systemAgeBillionYears) {
      throw new RangeError('31.F.h cannot serve a different body, system, host or CT-0 age.');
    }
  }
}

function thermalEvidence(item: DatedEnvironmentalForcing31Fh, minT: number, maxT: number,
  source: string): HabitabilityEvidence[] {
  const output: HabitabilityEvidence[] = [];
  const add = (constraint: 'TEMPERATURE' | 'PRESSURE_OR_CONFINEMENT',
    verdict: 'SUPPORTS' | 'CONTRADICTS' | 'UNRESOLVED') => output.push(Object.freeze({
      route: 'SURFACE_AQUEOUS', constraint, verdict,
      basis: verdict === 'UNRESOLVED' ? 'UNRESOLVED' : 'INFERRED_MODEL',
      sourceKey: `${source}/${constraint}`, accessibleToObserver: false,
    } as const));
  const p = item.surfacePressurePascal;
  if (p) {
    const pVerdict = p.min >= WATER_V1_TRIPLE_POINT_PRESSURE_PASCAL ? 'SUPPORTS'
      : p.max < WATER_V1_TRIPLE_POINT_PRESSURE_PASCAL ? 'CONTRADICTS' : 'UNRESOLVED';
    add('PRESSURE_OR_CONFINEMENT', pVerdict);
    const boilingLow = waterBoilingTemperatureKelvinForPressurePascal(p.min);
    const boilingHigh = waterBoilingTemperatureKelvinForPressurePascal(p.max);
    if (boilingLow !== null && boilingHigh !== null &&
        p.min >= WATER_V1_TRIPLE_POINT_PRESSURE_PASCAL &&
        minT >= WATER_V1_FREEZING_TEMPERATURE_KELVIN && maxT < boilingLow) {
      add('TEMPERATURE', 'SUPPORTS');
    } else if (maxT < WATER_V1_FREEZING_TEMPERATURE_KELVIN ||
        (boilingHigh !== null && minT >= boilingHigh)) {
      add('TEMPERATURE', 'CONTRADICTS');
    } else add('TEMPERATURE', 'UNRESOLVED');
  } else if (maxT < WATER_V1_FREEZING_TEMPERATURE_KELVIN) {
    add('TEMPERATURE', 'CONTRADICTS');
  } else add('TEMPERATURE', 'UNRESOLVED');
  // Reservoir presence, chemical cycles, protection from radiation, interior
  // oceans, etc. remain UNRESOLVED: temperature alone never supplies them.
  return output;
}

function validateForcing(item: DatedEnvironmentalForcing31Fh, now: number): void {
  if (!item || !Number.isSafeInteger(item.startYear) || !Number.isSafeInteger(item.endYear) ||
      item.startYear < 0 || item.endYear <= item.startYear || item.endYear > now ||
      item.provenance?.temporalSupport !== 'CONTINUOUS_DATED_PHYSICAL_FORCING' ||
      !key(item.provenance.sourcePhase) || !key(item.provenance.sourceModel) ||
      !key(item.provenance.sourceRecordKey) ||
      ['32.6', '20.5', '20.7', 'CURRENT_SNAPSHOT'].includes(item.provenance.sourceModel) ||
      !range(item.stellarFluxWattsPerSquareMeter, 0, 1e9) ||
      !range(item.bondAlbedo01, 0, 1) ||
      !range(item.additionalHeatWattsPerSquareMeter, 0, 1e9) ||
      !range(item.longwaveEmissivity01, 1e-8, 1) ||
      !range(item.effectiveHeatCapacityJoulesPerSquareMeterKelvin, 1, 1e20) ||
      (item.initialMeanTemperatureKelvin !== undefined &&
        !range(item.initialMeanTemperatureKelvin, 1, 1e6)) ||
      (item.initialMeanTemperatureKelvin !== undefined) !==
        (item.initialTemperatureSource !== undefined) ||
      (item.initialTemperatureSource !== undefined && (
        item.initialTemperatureSource.temporalSupport !== 'DATED_PHYSICAL_INITIAL_TEMPERATURE' ||
        item.initialTemperatureSource.atYear !== item.startYear ||
        !key(item.initialTemperatureSource.sourceModel) ||
        !key(item.initialTemperatureSource.sourceRecordKey) ||
        item.initialTemperatureSource.sourceRecordKey === item.provenance.sourceRecordKey)) ||
      (item.surfacePressurePascal !== undefined &&
        !range(item.surfacePressurePascal, 0, 1e12)) ||
      (item.surfacePressurePascal !== undefined) !== (item.surfacePressureSource !== undefined) ||
      (item.surfacePressureSource !== undefined && (
        item.surfacePressureSource.temporalSupport !== 'CONTINUOUS_DATED_PHYSICAL_PRESSURE' ||
        !key(item.surfacePressureSource.sourceModel) ||
        !key(item.surfacePressureSource.sourceRecordKey) ||
        item.surfacePressureSource.sourceRecordKey === item.provenance.sourceRecordKey))) {
    throw new RangeError('31.F.h requires physically dated, bounded forcing, not current proxies.');
  }
}
function range(x: PhysicalRange31Fh | undefined, min: number, max: number): boolean {
  return !!x && Number.isFinite(x.min) && Number.isFinite(x.max) &&
    x.min >= min && x.max <= max && x.max >= x.min;
}
function key(x: unknown): x is string {
  return typeof x === 'string' && x.length > 0 && x.trim() === x && !x.includes('\0');
}
