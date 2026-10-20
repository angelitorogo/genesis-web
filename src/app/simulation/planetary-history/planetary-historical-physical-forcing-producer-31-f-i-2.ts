import type { HistoricalHabContext31_7 } from '../../domain/habitability/habitability-historical-windows-31-7';
import type { DatedEnvironmentalForcing31Fh, PhysicalRange31Fh } from './planetary-environmental-evolution-31-f-h';

/**
 * 31.F.i.2: produce physically computed CT-0 irradiance envelopes from
 * independently dated stellar luminosity AND host-to-body separation bounds.
 *
 * Flux is L/(4 pi r²), summed over all stellar hosts. Each input interval is
 * guaranteed by its *own* continuous physical model (not two snapshots and
 * interpolation). The current 15/20/32.6 state is NEVER substituted for dated
 * sources. This producer cannot create stellar evolution, atmospheric history,
 * water, radiation or thermal initial conditions that the simulator lacks.
 *
 * Full 31.F.h forcing is emitted only if a separate dated radiative model
 * supplies the remaining required terms. Otherwise only irradiance is resolved
 * and environmental/31.7 coverage remains UNKNOWN.
 */
export interface HistoricalSourceProvenance31Fi2 {
  readonly sourcePhase: string;
  readonly sourceModel: string;
  readonly sourceRecordKey: string;
  readonly temporalSupport: 'CONTINUOUS_DATED_PHYSICAL_MODEL';
}
export interface DatedStellarIrradiation31Fi2 {
  readonly label: 'A' | 'B' | 'C';
  readonly luminositySolar: PhysicalRange31Fh;
  readonly distanceAu: PhysicalRange31Fh;
  readonly luminositySource: HistoricalSourceProvenance31Fi2;
  readonly orbitalSource: HistoricalSourceProvenance31Fi2 & { readonly bodyKey: string };
}
export interface DatedThermalBoundary31Fi2 {
  readonly provenance: HistoricalSourceProvenance31Fi2 & { readonly bodyKey: string };
  readonly bondAlbedo01: PhysicalRange31Fh;
  readonly additionalHeatWattsPerSquareMeter: PhysicalRange31Fh;
  readonly longwaveEmissivity01: PhysicalRange31Fh;
  readonly effectiveHeatCapacityJoulesPerSquareMeterKelvin: PhysicalRange31Fh;
  readonly initialMeanTemperatureKelvin?: PhysicalRange31Fh;
  readonly initialTemperatureSource?: {
    readonly sourceModel: string;
    readonly sourceRecordKey: string;
    readonly atYear: number;
    readonly bodyKey: string;
    readonly temporalSupport: 'DATED_PHYSICAL_INITIAL_TEMPERATURE';
  };
  readonly surfacePressurePascal?: PhysicalRange31Fh;
  readonly surfacePressureSource?: {
    readonly sourceModel: string;
    readonly sourceRecordKey: string;
    readonly bodyKey: string;
    readonly temporalSupport: 'CONTINUOUS_DATED_PHYSICAL_PRESSURE';
  };
}
export interface DatedPhysicalIrradiationSegment31Fi2 {
  readonly startYear: number;
  readonly endYear: number;
  /** One independent dated luminosity and body-distance model per host. */
  readonly hosts: readonly DatedStellarIrradiation31Fi2[];
  /** Omission does NOT license copying current 20.x climate. */
  readonly thermal?: DatedThermalBoundary31Fi2;
}
export interface HistoricalPhysicalForcingInput31Fi2 {
  readonly context: HistoricalHabContext31_7;
  readonly sourceRevision: string;
  readonly intervals: readonly DatedPhysicalIrradiationSegment31Fi2[];
}
export interface HistoricalPhysicalForcingResult31Fi2 {
  readonly contractVersion: '31.F.i.2-CT0-v1';
  readonly interpretation: 'MODELLED_DATED_IRRADIANCE_NOT_CERTIFIED_HABITABILITY';
  readonly sourceRevision: string;
  readonly irradiance: readonly {
    readonly startYear: number;
    readonly endYear: number;
    readonly wattsPerSquareMeter: PhysicalRange31Fh;
    readonly provenanceKeys: readonly string[];
  }[];
  readonly forcing: readonly DatedEnvironmentalForcing31Fh[];
  readonly missingEnvironmentalForcing: readonly { readonly startYear: number; readonly endYear: number }[];
  /** CT-0 intervals without any independently dated irradiance model. */
  readonly missingStellarOrbitalHistory: readonly { readonly startYear: number; readonly endYear: number }[];
  readonly environmentalHistoryComplete: false;
  readonly lifePresence: 'NOT_EVALUATED';
  readonly playerVisible: false;
}

const SOLAR_LUMINOSITY_WATTS = 3.828e26;
const ASTRONOMICAL_UNIT_METERS = 149597870700;
const SOLAR_FLUX_AT_ONE_AU = SOLAR_LUMINOSITY_WATTS /
  (4 * Math.PI * ASTRONOMICAL_UNIT_METERS ** 2);
const MAX_INTERVALS = 256;
const HOSTS: Record<'SINGLE' | 'BINARY' | 'TRIPLE', readonly string[]> = {
  SINGLE: ['A'], BINARY: ['A', 'B'], TRIPLE: ['A', 'B', 'C'],
};
const allowed = (value: unknown): value is string => typeof value === 'string' &&
  value.length > 0 && value.trim() === value && !value.includes('\0') &&
  !/^(?:CURRENT_SNAPSHOT|32\.6|20\.|PRESENT[_-])/i.test(value);
const within = (value: PhysicalRange31Fh | undefined, lo: number, hi: number): boolean =>
  !!value && Number.isFinite(value.min) && Number.isFinite(value.max) &&
  value.min >= lo && value.max <= hi && value.min <= value.max;
function validateProvenance(p: HistoricalSourceProvenance31Fi2 | undefined): void {
  if (!p || p.temporalSupport !== 'CONTINUOUS_DATED_PHYSICAL_MODEL' ||
      !allowed(p.sourcePhase) || !allowed(p.sourceModel) || !allowed(p.sourceRecordKey)) {
    throw new RangeError('31.F.i.2 rejects undated/current-snapshot physical provenance.');
  }
}
function contextAge(ctx: HistoricalHabContext31_7): number {
  const age = ctx?.time?.systemAgeBillionYears;
  if (!ctx || !allowed(ctx.bodyKey) || !['PLANET', 'MOON'].includes(ctx.bodyKind) ||
      !(ctx.multiplicity in HOSTS) || ctx.time?.kind !== 'CURRENT_SNAPSHOT' ||
      age === null || !Number.isFinite(age) || age < 0 ||
      !Number.isSafeInteger(Math.round(age * 1e9))) {
    throw new RangeError('31.F.i.2 requires independently dated CT-0 and known host multiplicity.');
  }
  return Math.round(age * 1e9);
}

export class PlanetaryHistoricalPhysicalForcingProducer31Fi2 {
  private constructor() {}

  static produce(input: HistoricalPhysicalForcingInput31Fi2): HistoricalPhysicalForcingResult31Fi2 {
    if (!input || !allowed(input.sourceRevision) || !Array.isArray(input.intervals) ||
        input.intervals.length > MAX_INTERVALS) {
      throw new RangeError('31.F.i.2 requires bounded, versioned physical records.');
    }
    const now = contextAge(input.context);
    const expectedHosts = HOSTS[input.context.multiplicity as keyof typeof HOSTS];
    const sorted = [...input.intervals].sort((a, b) => a.startYear - b.startYear || a.endYear - b.endYear);
    const irradiance: HistoricalPhysicalForcingResult31Fi2['irradiance'][number][] = [];
    const forcing: DatedEnvironmentalForcing31Fh[] = [];
    const missing: { startYear: number; endYear: number }[] = [];
    const gaps: { startYear: number; endYear: number }[] = [];
    const keys = new Set<string>();
    let endOfPrevious = -1;
    for (const entry of sorted) {
      if (!Number.isSafeInteger(entry?.startYear) || !Number.isSafeInteger(entry.endYear) ||
          entry.startYear < 0 || entry.endYear <= entry.startYear || entry.endYear > now ||
          entry.startYear <= endOfPrevious || !Array.isArray(entry.hosts) ||
          entry.hosts.length !== expectedHosts.length) {
        throw new RangeError('31.F.i.2 rejects overlapping, unbounded or incomplete CT-0 host intervals.');
      }
      if (entry.startYear > endOfPrevious + 1) {
        gaps.push(Object.freeze({ startYear: endOfPrevious + 1, endYear: entry.startYear - 1 }));
      }
      let fluxMin = 0;
      let fluxMax = 0;
      const provenanceKeys: string[] = [];
      for (let i = 0; i < expectedHosts.length; i++) {
        const host = entry.hosts[i];
        if (!host || host.label !== expectedHosts[i] ||
            !within(host.luminositySolar, 0, 1e9) ||
            !within(host.distanceAu, 1e-9, 1e12)) {
          throw new RangeError('31.F.i.2 host order, luminosity or orbital distance invalid.');
        }
        validateProvenance(host.luminositySource);
        validateProvenance(host.orbitalSource);
        if (host.orbitalSource.bodyKey !== input.context.bodyKey) {
          throw new RangeError('31.F.i.2 orbital history belongs to another planet or moon.');
        }
        const sourcePair = [host.luminositySource.sourceRecordKey, host.orbitalSource.sourceRecordKey];
        for (const key of sourcePair) {
          if (keys.has(key)) throw new RangeError('31.F.i.2 duplicated physical source record.');
          keys.add(key);
          provenanceKeys.push(key);
        }
        fluxMin += SOLAR_FLUX_AT_ONE_AU * host.luminositySolar.min / host.distanceAu.max ** 2;
        fluxMax += SOLAR_FLUX_AT_ONE_AU * host.luminositySolar.max / host.distanceAu.min ** 2;
      }
      if (!Number.isFinite(fluxMin) || !Number.isFinite(fluxMax) ||
          fluxMin < 0 || fluxMax > 1e9) {
        throw new RangeError('31.F.i.2 nonphysical integrated stellar flux.');
      }
      irradiance.push(Object.freeze({
        startYear: entry.startYear, endYear: entry.endYear,
        wattsPerSquareMeter: Object.freeze({ min: fluxMin, max: fluxMax }),
        provenanceKeys: Object.freeze(provenanceKeys),
      }));
      if (entry.thermal) {
        const t = entry.thermal;
        validateProvenance(t.provenance);
        if (t.provenance.bodyKey !== input.context.bodyKey ||
            (t.initialTemperatureSource && t.initialTemperatureSource.bodyKey !== input.context.bodyKey) ||
            (t.surfacePressureSource && t.surfacePressureSource.bodyKey !== input.context.bodyKey)) {
          throw new RangeError('31.F.i.2 thermal history belongs to another planet or moon.');
        }
        if (keys.has(t.provenance.sourceRecordKey)) {
          throw new RangeError('31.F.i.2 duplicated thermal source.');
        }
        keys.add(t.provenance.sourceRecordKey);
        if ((t.initialTemperatureSource && (!allowed(t.initialTemperatureSource.sourceModel) ||
              !allowed(t.initialTemperatureSource.sourceRecordKey) ||
              t.initialTemperatureSource.atYear !== entry.startYear ||
              t.initialTemperatureSource.temporalSupport !== 'DATED_PHYSICAL_INITIAL_TEMPERATURE')) ||
            (t.surfacePressureSource && (!allowed(t.surfacePressureSource.sourceModel) ||
              !allowed(t.surfacePressureSource.sourceRecordKey) ||
              t.surfacePressureSource.temporalSupport !== 'CONTINUOUS_DATED_PHYSICAL_PRESSURE')) ||
            !within(t.bondAlbedo01, 0, 1) ||
            !within(t.additionalHeatWattsPerSquareMeter, 0, 1e9) ||
            !within(t.longwaveEmissivity01, 1e-8, 1) ||
            !within(t.effectiveHeatCapacityJoulesPerSquareMeterKelvin, 1, 1e20) ||
            (t.initialMeanTemperatureKelvin !== undefined && !within(t.initialMeanTemperatureKelvin, 1, 1e6)) ||
            (t.initialMeanTemperatureKelvin !== undefined) !== (t.initialTemperatureSource !== undefined) ||
            (t.surfacePressurePascal !== undefined && !within(t.surfacePressurePascal, 0, 1e12)) ||
            (t.surfacePressurePascal !== undefined) !== (t.surfacePressureSource !== undefined)) {
          throw new RangeError('31.F.i.2 invalid independent dated thermal boundary.');
        }
        // 31.F.h independently validates boundaries, pressure provenance and
        // contiguous thermodynamics before admitting ANY environmental interval.
        forcing.push(Object.freeze({
          startYear: entry.startYear, endYear: entry.endYear,
          provenance: Object.freeze({
            sourcePhase: '31.F.i.2', sourceModel: 'DATED_STELLAR_ORBITAL_RADIATIVE_FORCING',
            sourceRecordKey: t.provenance.sourceRecordKey,
            temporalSupport: 'CONTINUOUS_DATED_PHYSICAL_FORCING' as const,
          }),
          stellarFluxWattsPerSquareMeter: Object.freeze({ min: fluxMin, max: fluxMax }),
          bondAlbedo01: Object.freeze({ ...t.bondAlbedo01 }),
          additionalHeatWattsPerSquareMeter: Object.freeze({ ...t.additionalHeatWattsPerSquareMeter }),
          longwaveEmissivity01: Object.freeze({ ...t.longwaveEmissivity01 }),
          effectiveHeatCapacityJoulesPerSquareMeterKelvin:
            Object.freeze({ ...t.effectiveHeatCapacityJoulesPerSquareMeterKelvin }),
          ...(t.initialMeanTemperatureKelvin ? {
            initialMeanTemperatureKelvin: Object.freeze({ ...t.initialMeanTemperatureKelvin }),
            initialTemperatureSource: Object.freeze({ ...t.initialTemperatureSource! }),
          } : {}),
          ...(t.surfacePressurePascal ? {
            surfacePressurePascal: Object.freeze({ ...t.surfacePressurePascal }),
            surfacePressureSource: Object.freeze({ ...t.surfacePressureSource! }),
          } : {}),
        }));
      } else {
        missing.push(Object.freeze({ startYear: entry.startYear, endYear: entry.endYear }));
      }
      endOfPrevious = entry.endYear;
    }
    if (endOfPrevious < now) {
      gaps.push(Object.freeze({ startYear: endOfPrevious + 1, endYear: now }));
    }
    return Object.freeze({
      contractVersion: '31.F.i.2-CT0-v1',
      interpretation: 'MODELLED_DATED_IRRADIANCE_NOT_CERTIFIED_HABITABILITY',
      sourceRevision: input.sourceRevision, irradiance: Object.freeze(irradiance),
      forcing: Object.freeze(forcing), missingEnvironmentalForcing: Object.freeze(missing),
      missingStellarOrbitalHistory: Object.freeze(gaps),
      environmentalHistoryComplete: false, lifePresence: 'NOT_EVALUATED', playerVisible: false,
    });
  }
}
