import {
  HABITABILITY_REQUIREMENTS_31_1,
  type HabitabilityEvidence,
} from '../../domain/habitability/habitability-scenario';
import type {
  HistoricalEnvironmentalState31_7,
  HistoricalEnvironmentSource31_7,
  HistoricalHabContext31_7,
} from '../../domain/habitability/habitability-historical-windows-31-7';

/**
 * 31.F.c — input boundary for a real, INDEPENDENT physical temporal producer.
 *
 * A 32.x dated EVENT, a 32.10 collection of three point SAMPLES and the
 * CURRENT 19/20/21 aggregate do not satisfy this contract: the producer must
 * certify the physical constraints over every CT-0 year in [startYear,endYear].
 * Do not mint a record here from a present-day value, a risk, an event or a seed.
 */
export interface ResolvedPhysicalEnvironmentalInterval31Fc {
  readonly bodyKind: 'PLANET' | 'MOON';
  readonly bodyKey: string;
  readonly timeScale: 'YEARS_SINCE_SYSTEM_FORMATION';
  readonly startYear: number;
  readonly endYear: number;
  readonly resolution: 'MODELLED_INTERVAL' | 'INFERRED_INTERVAL';
  readonly coverage: 'ENVIRONMENT_RESOLVED_FOR_EVERY_CT0_YEAR';
  readonly sourcePhase: string;
  readonly sourceModel: string;
  readonly sourceRecordKey: string;
  /** The physically supported criteria over the WHOLE interval, not one sample. */
  readonly evidence: readonly HabitabilityEvidence[];
}

/**
 * Implemented by the materialized physical-history catalog (not the timeline
 * presentation). Absence of catalog records means unknown coverage, never
 * a stable or habitable interval. A caller must supply this catalog explicitly.
 */
export interface DatedPhysicalEnvironmentalCatalog31Fc {
  revision(context: HistoricalHabContext31_7): string;
  readInterval(
    context: HistoricalHabContext31_7,
    startYear: number, endYear: number, maxRecords: number,
  ): readonly ResolvedPhysicalEnvironmentalInterval31Fc[];
}

/**
 * Read-only, lazy, bounded, versioned bridge to 31.7. It does not regenerate,
 * resample, persist or invent the underlying physical environment.
 *
 * Publication is always DISABLED here. 31.F.e must supply a separate, verified
 * discovery/observation projection; physical catalog provenance is not access.
 */
const MAX_RECORDS_PER_WINDOW = 4097; // Matches the 31.7 default 4096 + overflow sentinel.

export class HabitabilityDatedPhysicalSource31Fc implements HistoricalEnvironmentSource31_7 {
  constructor(private readonly physical: DatedPhysicalEnvironmentalCatalog31Fc) {
    if (!physical || typeof physical.revision !== 'function' ||
        typeof physical.readInterval !== 'function') {
      throw new TypeError('31.F.c requires a real dated physical environment catalog.');
    }
  }

  revision(context: HistoricalHabContext31_7): string {
    validateContext(context);
    const revision = this.physical.revision(context);
    if (!validKey(revision)) throw new RangeError('31.F.c physical revision is not resolved.');
    return `31.F.c:${revision}`;
  }

  readInterval(
    context: HistoricalHabContext31_7,
    startYear: number, endYear: number, maxRecords: number,
  ): readonly HistoricalEnvironmentalState31_7[] {
    validateContext(context);
    const present = Math.round(context.time.systemAgeBillionYears! * 1e9);
    if (!Number.isSafeInteger(maxRecords) || maxRecords < 1 ||
        maxRecords > MAX_RECORDS_PER_WINDOW ||
        !Number.isSafeInteger(startYear) || !Number.isSafeInteger(endYear) ||
        startYear < 0 || endYear < startYear || endYear > present) {
      throw new RangeError('31.F.c requires a bounded CT-0 interval.');
    }
    const before = this.physical.revision(context);
    if (!validKey(before)) throw new RangeError('31.F.c physical revision is not resolved.');
    const records = this.physical.readInterval(context, startYear, endYear, maxRecords);
    if (!Array.isArray(records) || records.length > maxRecords) {
      throw new RangeError('31.F.c physical source exceeded the requested record budget.');
    }
    const sorted = records.map(item => snapshot(item, context, startYear, endYear, present))
      .sort((a, b) => a.startYear - b.startYear || a.endYear - b.endYear ||
        cmp(a.sourceRecordKey, b.sourceRecordKey));
    let previous: HistoricalEnvironmentalState31_7 | null = null;
    const keys = new Set<string>();
    for (const item of sorted) {
      if (keys.has(item.sourceRecordKey) ||
          (previous !== null && item.startYear <= previous.endYear)) {
        throw new RangeError('31.F.c duplicate or overlapping physical environment coverage.');
      }
      keys.add(item.sourceRecordKey);
      previous = item;
    }
    if (this.physical.revision(context) !== before) {
      throw new RangeError('31.F.c physical environment changed mid-query.');
    }
    return Object.freeze(sorted);
  }
}

function snapshot(
  item: ResolvedPhysicalEnvironmentalInterval31Fc,
  context: HistoricalHabContext31_7,
  from: number, to: number, present: number,
): HistoricalEnvironmentalState31_7 {
  if (!item || item.bodyKind !== context.bodyKind || item.bodyKey !== context.bodyKey ||
      item.timeScale !== 'YEARS_SINCE_SYSTEM_FORMATION' ||
      item.coverage !== 'ENVIRONMENT_RESOLVED_FOR_EVERY_CT0_YEAR' ||
      !Number.isSafeInteger(item.startYear) || !Number.isSafeInteger(item.endYear) ||
      item.startYear < 0 || item.endYear <= item.startYear || item.endYear > present ||
      item.startYear > to || item.endYear < from ||
      !['MODELLED_INTERVAL', 'INFERRED_INTERVAL'].includes(item.resolution) ||
      !validKey(item.sourcePhase) || !validKey(item.sourceModel) ||
      !validKey(item.sourceRecordKey) || !Array.isArray(item.evidence)) {
    throw new RangeError('31.F.c refused an undated, instantaneous, foreign or unproven trajectory.');
  }
  const seen = new Set<string>();
  const evidence = item.evidence.map((e: HabitabilityEvidence) => {
    if (!e || !['SURFACE_AQUEOUS', 'SUBSURFACE_AQUEOUS'].includes(e.route) ||
        !(HABITABILITY_REQUIREMENTS_31_1[e.route] as readonly string[]).includes(e.constraint) ||
        !['SUPPORTS', 'CONTRADICTS', 'UNRESOLVED'].includes(e.verdict) ||
        !['PHYSICAL_MODEL', 'INFERRED_MODEL', 'UNRESOLVED'].includes(e.basis) ||
        (e.verdict === 'UNRESOLVED') !== (e.basis === 'UNRESOLVED') ||
        (item.resolution === 'INFERRED_INTERVAL' && e.verdict !== 'UNRESOLVED' &&
          e.basis !== 'INFERRED_MODEL') ||
        !validKey(e.sourceKey)) {
      throw new RangeError('31.F.c refused unsourced, overconfident or invalid interval evidence.');
    }
    const key = `${e.route}/${e.constraint}`;
    if (seen.has(key)) throw new RangeError('31.F.c duplicate environmental constraint.');
    seen.add(key);
    // Never trust accessibility copied from a physical record. 31.F.e owns it.
    return Object.freeze({
      route: e.route, constraint: e.constraint,
      verdict: e.verdict, basis: e.basis,
      sourceKey: e.sourceKey, accessibleToObserver: false,
    });
  });
  return Object.freeze({
    bodyKind: item.bodyKind, bodyKey: item.bodyKey,
    startYear: item.startYear, endYear: item.endYear,
    temporalBasis: item.resolution === 'MODELLED_INTERVAL'
      ? 'DATED_PHYSICAL_TRAJECTORY' : 'DATED_INFERRED_ENVELOPE',
    sourcePhase: item.sourcePhase, sourceModel: item.sourceModel,
    sourceRecordKey: item.sourceRecordKey,
    accessibleToObserver: false, evidence: Object.freeze(evidence),
  });
}

function validateContext(ctx: HistoricalHabContext31_7): void {
  if (!ctx || !['PLANET', 'MOON'].includes(ctx.bodyKind) || !validKey(ctx.bodyKey) ||
      !['SINGLE', 'BINARY', 'TRIPLE', 'UNKNOWN'].includes(ctx.multiplicity) ||
      ctx.time?.kind !== 'CURRENT_SNAPSHOT' ||
      ctx.time.systemAgeBillionYears === null ||
      !Number.isFinite(ctx.time.systemAgeBillionYears) ||
      ctx.time.systemAgeBillionYears! < 0 ||
      !Number.isSafeInteger(Math.round(ctx.time.systemAgeBillionYears! * 1e9))) {
    throw new RangeError('31.F.c requires an identified body and a dated system age.');
  }
}
function validKey(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0 && v.trim() === v && !v.includes('\0');
}
function cmp(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }
