import {
  HABITABILITY_ROUTES_31_1, type HabitabilityRoute,
  type HabitabilitySupportResolution,
} from '../../domain/habitability/habitability-scenario';
import type {
  HistoricalEnvironmentalState31_7, HistoricalHabRoute31_7,
  HistoricalHabRouteSegment31_7, HistoricalHabitabilityReport31_7,
} from '../../domain/habitability/habitability-historical-windows-31-7';
import type {
  DocumentedCompatibleRun31_8, HabitabilityContinuousRequest31_8,
  HabitabilityContinuityReport31_8, HabitabilityRouteDuration31_8,
} from '../../domain/habitability/habitability-continuity-31-8';

type Basis = HistoricalEnvironmentalState31_7['temporalBasis'];
type KnownResolution = Exclude<HabitabilitySupportResolution, 'NOT_DETERMINED'>;
const STATUSES = Object.freeze([
  'CONSTRAINTS_COMPATIBLE', 'CONSTRAINTS_INCOMPATIBLE',
  'INSUFFICIENT_EVIDENCE', 'MODEL_NOT_IMPLEMENTED',
]);
const RESOLUTIONS = Object.freeze(['RESOLVED_EVIDENCE', 'INFERRED_EVIDENCE', 'NOT_DETERMINED']);
const BASES = Object.freeze(['DATED_PHYSICAL_TRAJECTORY', 'DATED_INFERRED_ENVELOPE']);

/**
 * GENESIS 31.8 — Pure, linear-time aggregation of the bounded, already
 * knowledge-filtered 31.7 report. Does not read physical history, simulate
 * missing years, infer life or expose any extra observational information.
 */
export class HabitabilityContinuityResolver31_8 {
  private constructor() {}

  static summarize(request: HabitabilityContinuousRequest31_8): HabitabilityContinuityReport31_8 {
    const source = request?.historicalWindows;
    validateReport(source);
    if (source.access === 'SCIENTIFIC_FICHE_LOCKED') {
      return Object.freeze({
        contractVersion: '31.8-CT0-v1',
        interpretation: 'DOCUMENTED_COMPATIBILITY_DURATIONS_NOT_LIFE_OR_EVOLUTION',
        durationUnit: 'INCLUSIVE_CT0_YEAR_SLOTS',
        perspective: source.perspective, access: 'SCIENTIFIC_FICHE_LOCKED',
        bodyKind: null, bodyKey: null, multiplicity: null,
        startYear: null, endYear: null,
        routes: Object.freeze([]), historicalCompleteness: 'NOT_ESTABLISHED',
        lifePresence: 'NOT_EVALUATED',
      });
    }
    const start = source.startYear!;
    const end = source.endYear!;
    const queried = safeLength(start, end);
    const routes = source.routes.map(route => summarizeRoute(route, start, end, queried));
    return Object.freeze({
      contractVersion: '31.8-CT0-v1',
      interpretation: 'DOCUMENTED_COMPATIBILITY_DURATIONS_NOT_LIFE_OR_EVOLUTION',
      durationUnit: 'INCLUSIVE_CT0_YEAR_SLOTS',
      perspective: source.perspective, access: source.access,
      bodyKind: source.bodyKind, bodyKey: source.bodyKey,
      multiplicity: source.multiplicity,
      startYear: start, endYear: end,
      routes: Object.freeze(routes),
      historicalCompleteness: 'NOT_ESTABLISHED', lifePresence: 'NOT_EVALUATED',
    });
  }
}

function summarizeRoute(
  input: HistoricalHabRoute31_7, start: number, end: number, queried: number,
): HabitabilityRouteDuration31_8 {
  const runs: DocumentedCompatibleRun31_8[] = [];
  let accumulated = 0;
  let incompatible = 0;
  let insufficient = 0;
  let notImplemented = 0;
  let uncovered = 0;
  let dated = 0;
  let open: { startYear: number; endYear: number; bases: Set<Basis>; resolutions: Set<KnownResolution> } | null = null;
  const flush = () => {
    if (!open) return;
    const previous = open;
    runs.push(Object.freeze({
      startYear: previous.startYear, endYear: previous.endYear,
      compatibleYearSlots: safeLength(previous.startYear, previous.endYear),
      temporalBases: Object.freeze([...previous.bases].sort()),
      supportResolutions: Object.freeze([...previous.resolutions].sort()),
      interpretation: 'DOCUMENTED_UNINTERRUPTED_COMPATIBILITY_NOT_BIOLOGICAL_CONTINUITY',
    }));
    open = null;
  };
  for (const s of input.segments) {
    const length = safeLength(s.startYear, s.endYear);
    if (s.temporalBasis === null) uncovered = safeAdd(uncovered, length);
    else dated = safeAdd(dated, length);
    switch (s.status) {
      case 'CONSTRAINTS_COMPATIBLE': {
        accumulated = safeAdd(accumulated, length);
        // Adjacent compatible slices count as one uninterrupted documented run,
        // even if provenance or its certainty changes at the boundary.
        if (open && open.endYear + 1 === s.startYear) {
          open.endYear = s.endYear;
        } else {
          flush();
          open = { startYear: s.startYear, endYear: s.endYear,
            bases: new Set<Basis>(), resolutions: new Set<KnownResolution>() };
        }
        open!.bases.add(s.temporalBasis!);
        open!.resolutions.add(s.resolution as KnownResolution);
        break;
      }
      case 'CONSTRAINTS_INCOMPATIBLE': incompatible = safeAdd(incompatible, length); flush(); break;
      case 'INSUFFICIENT_EVIDENCE': insufficient = safeAdd(insufficient, length); flush(); break;
      case 'MODEL_NOT_IMPLEMENTED': notImplemented = safeAdd(notImplemented, length); flush(); break;
    }
  }
  flush();
  let longest: DocumentedCompatibleRun31_8 | null = null;
  for (const run of runs) {
    // Stable tie-breaking: prefer the earliest documented compatible run.
    if (!longest || run.compatibleYearSlots > longest.compatibleYearSlots) longest = run;
  }
  const last = runs[runs.length - 1];
  const tail = last && last.endYear === end ? last.compatibleYearSlots : 0;
  if (safeAdd(safeAdd(accumulated, incompatible), safeAdd(insufficient, notImplemented)) !== queried ||
      safeAdd(uncovered, dated) !== queried) {
    throw new RangeError('31.8 route durations do not partition the queried CT-0 interval.');
  }
  return Object.freeze({
    route: input.route, queriedYearSlots: queried,
    accumulatedCompatibleYearSlots: accumulated,
    longestContinuousCompatibleYearSlots: longest?.compatibleYearSlots ?? 0,
    longestContinuousRun: longest,
    continuousCompatibleYearSlotsAtQueryEnd: tail,
    queryEndIsPresentDay: 'NOT_ESTABLISHED',
    compatibleRuns: Object.freeze(runs),
    incompatibleYearSlots: incompatible,
    insufficientEvidenceYearSlots: insufficient,
    modelNotImplementedYearSlots: notImplemented,
    uncoveredYearSlots: uncovered, datedEvidenceYearSlots: dated,
    coversEntireQueriedIntervalWithCompatibility: accumulated === queried,
    interpretation: 'COMPATIBLE_ENVIRONMENTAL_YEAR_SLOTS_NOT_LIFE_PROBABILITY',
  });
}

/** Reject malformed or tampered 31.7 reports instead of estimating durations. */
function validateReport(report: HistoricalHabitabilityReport31_7): void {
  if (!report || report.contractVersion !== '31.7-CT0-v1' ||
      report.interpretation !== 'HISTORICAL_ENVIRONMENTAL_COMPATIBILITY_NOT_LIFE_PROBABILITY' ||
      report.historicalCompleteness !== 'NOT_ESTABLISHED' || report.lifePresence !== 'NOT_EVALUATED' ||
      !['SIMULATED_REALITY', 'OBSERVED_KNOWLEDGE'].includes(report.perspective) ||
      !['INTERNAL', 'SCIENTIFIC_FICHE_AVAILABLE', 'SCIENTIFIC_FICHE_LOCKED'].includes(report.access) ||
      !Array.isArray(report.routes)) {
    throw new RangeError('31.8 requires an authentic 31.7 historical compatibility report.');
  }
  if (report.access === 'SCIENTIFIC_FICHE_LOCKED') {
    if (report.perspective !== 'OBSERVED_KNOWLEDGE' || report.bodyKind !== null ||
        report.bodyKey !== null || report.multiplicity !== null ||
        report.startYear !== null || report.endYear !== null || report.routes.length !== 0) {
      throw new RangeError('31.8 locked knowledge may not expose historical body metadata.');
    }
    return;
  }
  if ((report.perspective === 'SIMULATED_REALITY') !== (report.access === 'INTERNAL') ||
      !['PLANET', 'MOON'].includes(report.bodyKind!) ||
      !validKey(report.bodyKey) ||
      !['SINGLE', 'BINARY', 'TRIPLE', 'UNKNOWN'].includes(report.multiplicity!) ||
      !Number.isSafeInteger(report.startYear) || !Number.isSafeInteger(report.endYear) ||
      report.startYear! < 0 || report.endYear! < report.startYear! ||
      !Number.isSafeInteger(report.endYear! - report.startYear! + 1) ||
      report.routes.length !== HABITABILITY_ROUTES_31_1.length) {
    throw new RangeError('31.8 requires bounded CT-0 identity and all canonical routes.');
  }
  const actual = new Set<HabitabilityRoute>();
  for (const route of report.routes) {
    if (!route || !HABITABILITY_ROUTES_31_1.includes(route.route) || actual.has(route.route) ||
        !Array.isArray(route.segments) || !Array.isArray(route.compatibleWindows) ||
        !Array.isArray(route.uncoveredIntervals)) {
      throw new RangeError('31.8 requires exactly one valid report for each environmental route.');
    }
    actual.add(route.route);
    validateRoute(route, report.startYear!, report.endYear!);
  }
}

function validateRoute(route: HistoricalHabRoute31_7, from: number, to: number): void {
  const expectedGaps: {startYear: number; endYear: number}[] = [];
  const expectedWindows: {startYear: number; endYear: number; temporalBasis: Basis;
    resolution: HabitabilitySupportResolution; sourceRecordKeys: string[]}[] = [];
  let cursor = from;
  for (const s of route.segments) {
    if (!s || !Number.isSafeInteger(s.startYear) || !Number.isSafeInteger(s.endYear) ||
        s.startYear !== cursor || s.endYear < s.startYear || s.endYear > to ||
        !STATUSES.includes(s.status) || !RESOLUTIONS.includes(s.resolution) ||
        !Array.isArray(s.missingConstraints) || !Array.isArray(s.decisiveContradictions)) {
      throw new RangeError('31.8 requires ordered, gap-explicit, non-overlapping 31.7 route segments.');
    }
    if (s.temporalBasis === null) {
      if (s.sourcePhase !== null || s.sourceModel !== null || s.sourceRecordKey !== null ||
          (s.status !== 'INSUFFICIENT_EVIDENCE' && s.status !== 'MODEL_NOT_IMPLEMENTED') ||
          s.resolution !== 'NOT_DETERMINED') {
        throw new RangeError('31.8 uncovered environmental years cannot contain physical claims.');
      }
      expectedGaps.push({ startYear: s.startYear, endYear: s.endYear });
    } else if (!BASES.includes(s.temporalBasis) || !validKey(s.sourceRecordKey) ||
               !validKey(s.sourcePhase) || !validKey(s.sourceModel)) {
      throw new RangeError('31.8 dated environment requires traceable provenance.');
    }
    if (s.status === 'CONSTRAINTS_COMPATIBLE') {
      if (s.temporalBasis === null || s.resolution === 'NOT_DETERMINED' ||
          s.decisiveContradictions.length || s.missingConstraints.length) {
        throw new RangeError('31.8 cannot call unresolved/contradictory years compatible.');
      }
      const last = expectedWindows[expectedWindows.length - 1];
      if (last && last.endYear + 1 === s.startYear && last.temporalBasis === s.temporalBasis &&
          last.resolution === s.resolution) {
        last.endYear = s.endYear;
        last.sourceRecordKeys.push(s.sourceRecordKey!);
      } else {
        expectedWindows.push({ startYear: s.startYear, endYear: s.endYear,
          temporalBasis: s.temporalBasis, resolution: s.resolution,
          sourceRecordKeys: [s.sourceRecordKey!] });
      }
    }
    cursor = s.endYear + 1;
  }
  if (cursor !== to + 1 || expectedGaps.length !== route.uncoveredIntervals.length ||
      expectedWindows.length !== route.compatibleWindows.length) {
    throw new RangeError('31.8 incomplete or inconsistent environmental coverage.');
  }
  for (let i = 0; i < expectedGaps.length; i++) {
    const a = expectedGaps[i], b = route.uncoveredIntervals[i];
    if (!b || a.startYear !== b.startYear || a.endYear !== b.endYear) {
      throw new RangeError('31.8 cannot silently bridge missing historical coverage.');
    }
  }
  for (let i = 0; i < expectedWindows.length; i++) {
    const a = expectedWindows[i], b = route.compatibleWindows[i];
    if (!b || a.startYear !== b.startYear || a.endYear !== b.endYear ||
        a.temporalBasis !== b.temporalBasis || a.resolution !== b.resolution ||
        b.interpretation !== 'CONSTRAINT_COMPATIBILITY_NOT_LIFE_OR_CONTINUITY_PROOF' ||
        !Array.isArray(b.sourceRecordKeys) || a.sourceRecordKeys.length !== b.sourceRecordKeys.length ||
        a.sourceRecordKeys.some((k, j) => k !== b.sourceRecordKeys[j])) {
      throw new RangeError('31.8 does not accept incompatible or invented compatible windows.');
    }
  }
}

function safeLength(a: number, b: number): number {
  const n = b - a + 1;
  if (!Number.isSafeInteger(n) || n < 1) throw new RangeError('31.8 invalid inclusive CT-0 duration.');
  return n;
}
function safeAdd(a: number, b: number): number {
  const sum = a + b;
  if (!Number.isSafeInteger(sum)) throw new RangeError('31.8 unsafe CT-0 cumulative duration.');
  return sum;
}
function validKey(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value === value.trim() &&
    !value.includes('\u0000');
}
