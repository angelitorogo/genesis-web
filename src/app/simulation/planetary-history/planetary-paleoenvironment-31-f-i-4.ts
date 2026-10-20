import type { HistoricalHabContext31_7 } from '../../domain/habitability/habitability-historical-windows-31-7';
import type { PhysicalRange31Fh } from './planetary-environmental-evolution-31-f-h';

/**
 * 31.F.i.4 — bounded, dated mass-conservation and radiation-transfer model.
 * Inputs MUST be independent CT-0 initial masses/rates and ionising exposure
 * models. Phase-20/21/32.3 present inventories, water indices and 32.9 event
 * indices cannot be repurposed as palaeo-masses or historical rates.
 * A range is a conditional physical envelope, never a detected paleoclimate.
 */
export interface DatedPaleoSource31Fi4 {
  readonly bodyKey: string;
  readonly sourcePhase: string;
  readonly sourceModel: string;
  readonly sourceRecordKey: string;
  readonly temporalSupport: 'CONTINUOUS_DATED_INDEPENDENT_PHYSICAL_MODEL';
}
export interface DatedMassBalance31Fi4 {
  readonly provenance: DatedPaleoSource31Fi4;
  /** kg, dated at this interval's start, mandatory after a gap. */
  readonly initialMassKilograms?: PhysicalRange31Fh;
  /** kg/year, modelled continuously throughout the entire interval. */
  readonly supplyKilogramsPerYear: PhysicalRange31Fh;
  readonly lossKilogramsPerYear: PhysicalRange31Fh;
}
export interface DatedRadiation31Fi4 {
  readonly provenance: DatedPaleoSource31Fi4;
  /** Unshielded ionising dose rate, Gy/year, in the model's declared spectrum. */
  readonly unshieldedDoseGrayPerYear: PhysicalRange31Fh;
  /** Dated magnetic/other shielding transmission, NOT a present magnetosphere proxy. */
  readonly nonAtmosphericTransmission01: PhysicalRange31Fh;
  /** Effective mass attenuation m²/kg, calibrated for the declared spectrum. */
  readonly atmosphericMassAttenuationSquareMetersPerKilogram: PhysicalRange31Fh;
}
export interface DatedPaleoEpoch31Fi4 {
  readonly startYear: number;
  readonly endYear: number;
  readonly atmosphere?: DatedMassBalance31Fi4;
  /** Total water mass only; never extrapolate liquid/ice/underground phases. */
  readonly water?: DatedMassBalance31Fi4;
  readonly radiation?: DatedRadiation31Fi4;
}
export interface DatedPaleoModel31Fi4 {
  readonly context: HistoricalHabContext31_7;
  readonly sourceRevision: string;
  /** Frozen, materialized SI body geometry: no recomputation of bodies. */
  readonly geometry: { readonly radiusMeters: number; readonly gravityMetersPerSecondSquared: number };
  readonly epochs: readonly DatedPaleoEpoch31Fi4[];
  /** Events whose physical effects are not temporally resolved. Never bridge across them. */
  readonly unresolvedEvents?: readonly { readonly startYear: number; readonly endYear: number; readonly sourceRecordKey: string }[];
}
export interface PaleoQuantityInterval31Fi4 {
  readonly startYear: number;
  readonly endYear: number;
  readonly envelope: PhysicalRange31Fh;
  readonly sourceRecordKey: string;
}
export interface PaleoEnvironmentalResult31Fi4 {
  readonly contractVersion: '31.F.i.4-v1';
  readonly bodyKind: 'PLANET' | 'MOON';
  readonly bodyKey: string;
  readonly sourceRevision: string;
  readonly surfacePressurePascal: readonly PaleoQuantityInterval31Fi4[];
  readonly totalWaterMassKilograms: readonly PaleoQuantityInterval31Fi4[];
  readonly surfaceIonisingDoseGrayPerYear: readonly PaleoQuantityInterval31Fi4[];
  readonly unknownIntervals: {
    readonly pressure: readonly { readonly startYear: number; readonly endYear: number }[];
    readonly water: readonly { readonly startYear: number; readonly endYear: number }[];
    readonly radiation: readonly { readonly startYear: number; readonly endYear: number }[];
  };
  readonly waterPhases: 'UNKNOWN';
  readonly habitability: 'UNKNOWN';
  readonly historicalCompleteness: 'NOT_ESTABLISHED';
  readonly playerVisible: false;
}
const MAX_EPOCHS = 256;
const positive = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0;
const key = (s: unknown): s is string => typeof s === 'string' && s.length > 0 && s.trim() === s && !s.includes('\0');
const valid = (v: PhysicalRange31Fh | undefined, max = 1e50): v is PhysicalRange31Fh =>
  !!v && Number.isFinite(v.min) && Number.isFinite(v.max) && v.min >= 0 && v.max >= v.min && v.max <= max;
const frozen = (v: PhysicalRange31Fh): PhysicalRange31Fh => Object.freeze({min: v.min, max: v.max});

function validateSource(p: DatedPaleoSource31Fi4 | undefined, bodyKey: string, keys: Set<string>): void {
  if (!p || p.bodyKey !== bodyKey || !key(p.sourcePhase) || !key(p.sourceModel) ||
      !key(p.sourceRecordKey) || keys.has(p.sourceRecordKey) ||
      p.temporalSupport !== 'CONTINUOUS_DATED_INDEPENDENT_PHYSICAL_MODEL' ||
      /^(?:20\.|21\.|32\.3|32\.6|CURRENT|PRESENT)/i.test(p.sourceModel) ||
      /^(?:20\.|21\.|32\.3|32\.6|CURRENT|PRESENT)/i.test(p.sourcePhase)) {
    throw new RangeError('31.F.i.4 requires unique independently dated body-specific source models.');
  }
  keys.add(p.sourceRecordKey);
}
function gapList(now: number, records: readonly PaleoQuantityInterval31Fi4[]) {
  const gaps: {startYear: number; endYear: number}[] = [];
  let cursor = 0;
  for (const r of records) {
    if (r.startYear > cursor) gaps.push(Object.freeze({startYear: cursor, endYear: r.startYear - 1}));
    cursor = r.endYear + 1;
  }
  if (cursor <= now) gaps.push(Object.freeze({startYear: cursor, endYear: now}));
  return Object.freeze(gaps);
}

export class PlanetaryPaleoenvironment31Fi4 {
  private constructor() {}

  static produce(input: DatedPaleoModel31Fi4): PaleoEnvironmentalResult31Fi4 {
    const ctx = input?.context;
    const age = ctx?.time?.systemAgeBillionYears;
    if (!ctx || !key(ctx.bodyKey) || !['PLANET','MOON'].includes(ctx.bodyKind) ||
        !['SINGLE','BINARY','TRIPLE'].includes(ctx.multiplicity) ||
        ctx.time?.kind !== 'CURRENT_SNAPSHOT' || age === null ||
        !Number.isFinite(age) || age < 0 || !Number.isSafeInteger(Math.round(age * 1e9)) ||
        !key(input.sourceRevision) || !positive(input.geometry?.radiusMeters) ||
        !positive(input.geometry?.gravityMetersPerSecondSquared) ||
        !Array.isArray(input.epochs) || input.epochs.length > MAX_EPOCHS) {
      throw new RangeError('31.F.i.4 requires a valid materialized body and dated CT-0 provenance.');
    }
    const now = Math.round(age * 1e9);
    const area = 4 * Math.PI * input.geometry.radiusMeters ** 2;
    const gravity = input.geometry.gravityMetersPerSecondSquared;
    if (!positive(area) || !Number.isFinite(gravity / area)) throw new RangeError('31.F.i.4 invalid body geometry.');
    const epochs = [...input.epochs].sort((a,b) => a.startYear - b.startYear);
    const events = [...(input.unresolvedEvents ?? [])].sort((a,b) => a.startYear - b.startYear);
    let eventEnd = -1;
    for (const e of events) {
      if (!Number.isSafeInteger(e.startYear) || !Number.isSafeInteger(e.endYear) ||
          e.startYear < 0 || e.endYear < e.startYear || e.endYear > now ||
          e.startYear <= eventEnd || !key(e.sourceRecordKey)) {
        throw new RangeError('31.F.i.4 invalid unresolved CT-0 event.');
      }
      eventEnd = e.endYear;
    }
    const pressure: PaleoQuantityInterval31Fi4[] = [];
    const water: PaleoQuantityInterval31Fi4[] = [];
    const radiation: PaleoQuantityInterval31Fi4[] = [];
    const keys = new Set(events.map(e=>e.sourceRecordKey));
    let previous = -1;
    let lastAtmosphere: PhysicalRange31Fh | null = null;
    let lastWater: PhysicalRange31Fh | null = null;
    let atmosphereLastEnd = -1;
    let waterLastEnd = -1;
    for (const e of epochs) {
      if (!Number.isSafeInteger(e?.startYear) || !Number.isSafeInteger(e.endYear) ||
          e.startYear < 0 || e.endYear < e.startYear || e.endYear > now ||
          e.startYear <= previous ||
          !e.atmosphere && !e.water && !e.radiation) {
        throw new RangeError('31.F.i.4 invalid, overlapping or empty CT-0 epoch.');
      }
      previous = e.endYear;
      if (events.some(event => event.startYear <= e.endYear && event.endYear >= e.startYear)) {
        // A physical event without resolved effects invalidates this complete
        // input epoch. Callers may model either side with separate dated anchors.
        throw new RangeError('31.F.i.4 cannot bridge an unresolved physical event.');
      }
      const duration = e.endYear - e.startYear + 1;
      const balance = (b: DatedMassBalance31Fi4 | undefined, previousMass: PhysicalRange31Fh | null,
        previousEnd: number, name: string): PhysicalRange31Fh | null => {
        if (!b) return null;
        validateSource(b.provenance, ctx.bodyKey, keys);
        if (!valid(b.supplyKilogramsPerYear) || !valid(b.lossKilogramsPerYear) ||
            (b.initialMassKilograms !== undefined && !valid(b.initialMassKilograms))) {
          throw new RangeError(`31.F.i.4 invalid dated ${name} mass balance.`);
        }
        const contiguous = e.startYear === previousEnd + 1;
        if (!b.initialMassKilograms && (!contiguous || !previousMass)) {
          throw new RangeError(`31.F.i.4 ${name} needs an independent dated mass after every gap.`);
        }
        if (b.initialMassKilograms && contiguous && previousMass &&
            (b.initialMassKilograms.max < previousMass.min || b.initialMassKilograms.min > previousMass.max)) {
          throw new RangeError(`31.F.i.4 ${name} contradicts its previous mass balance.`);
        }
        const initial = b.initialMassKilograms ?? previousMass!;
        const end = {
          min: Math.max(0, initial.min + (b.supplyKilogramsPerYear.min - b.lossKilogramsPerYear.max) * duration),
          max: Math.max(0, initial.max + (b.supplyKilogramsPerYear.max - b.lossKilogramsPerYear.min) * duration),
        };
        if (!valid(end)) throw new RangeError(`31.F.i.4 nonfinite ${name} evolution.`);
        return frozen(end);
      };
      const atmEnd = balance(e.atmosphere, lastAtmosphere, atmosphereLastEnd, 'atmosphere');
      const waterEnd = balance(e.water, lastWater, waterLastEnd, 'water');
      if (e.atmosphere) {
        const anchor = e.atmosphere.initialMassKilograms ?? lastAtmosphere!;
        const minMass = Math.min(anchor.min, atmEnd!.min);
        const maxMass = Math.max(anchor.max, atmEnd!.max);
        const envelope = frozen({min: minMass * gravity / area, max: maxMass * gravity / area});
        if (!valid(envelope, 1e12)) throw new RangeError('31.F.i.4 impossible hydrostatic pressure.');
        pressure.push(Object.freeze({startYear: e.startYear, endYear:e.endYear,
          envelope, sourceRecordKey: e.atmosphere.provenance.sourceRecordKey}));
        lastAtmosphere = atmEnd;
        atmosphereLastEnd = e.endYear;
      } else { lastAtmosphere = null; atmosphereLastEnd = -1; }
      if (e.water) {
        const anchor = e.water.initialMassKilograms ?? lastWater!;
        const envelope = frozen({min: Math.min(anchor.min, waterEnd!.min),
          max: Math.max(anchor.max, waterEnd!.max)});
        water.push(Object.freeze({startYear: e.startYear, endYear:e.endYear,
          envelope, sourceRecordKey: e.water.provenance.sourceRecordKey}));
        lastWater = waterEnd;
        waterLastEnd = e.endYear;
      } else { lastWater = null; waterLastEnd = -1; }
      if (e.radiation) {
        const r = e.radiation;
        validateSource(r.provenance, ctx.bodyKey, keys);
        if (!valid(r.unshieldedDoseGrayPerYear,1e12) ||
            !valid(r.nonAtmosphericTransmission01,1) ||
            !valid(r.atmosphericMassAttenuationSquareMetersPerKilogram,1e3)) {
          throw new RangeError('31.F.i.4 invalid dated radiation model.');
        }
        // With nonzero atmospheric attenuation, a dated atmospheric column
        // must actually exist; neither vacuum nor an invented column is assumed.
        if (!e.atmosphere && r.atmosphericMassAttenuationSquareMetersPerKilogram.max > 0) {
          throw new RangeError('31.F.i.4 cannot infer atmospheric radiation protection without dated column.');
        }
        const p = pressure[pressure.length - 1];
        const columnMin = e.atmosphere ? p.envelope.min / gravity : 0;
        const columnMax = e.atmosphere ? p.envelope.max / gravity : 0;
        const attenMin = Math.exp(-r.atmosphericMassAttenuationSquareMetersPerKilogram.max * columnMax);
        const attenMax = Math.exp(-r.atmosphericMassAttenuationSquareMetersPerKilogram.min * columnMin);
        const envelope = frozen({min: r.unshieldedDoseGrayPerYear.min * r.nonAtmosphericTransmission01.min * attenMin,
          max: r.unshieldedDoseGrayPerYear.max * r.nonAtmosphericTransmission01.max * attenMax});
        radiation.push(Object.freeze({startYear:e.startYear, endYear:e.endYear,
          envelope, sourceRecordKey:r.provenance.sourceRecordKey}));
      }
    }
    return Object.freeze({contractVersion:'31.F.i.4-v1', bodyKind:ctx.bodyKind, bodyKey:ctx.bodyKey,
      sourceRevision:input.sourceRevision, surfacePressurePascal:Object.freeze(pressure),
      totalWaterMassKilograms:Object.freeze(water), surfaceIonisingDoseGrayPerYear:Object.freeze(radiation),
      unknownIntervals:Object.freeze({pressure:gapList(now,pressure),water:gapList(now,water),
        radiation:gapList(now,radiation)}), waterPhases:'UNKNOWN', habitability:'UNKNOWN',
      historicalCompleteness:'NOT_ESTABLISHED', playerVisible:false});
  }
}
