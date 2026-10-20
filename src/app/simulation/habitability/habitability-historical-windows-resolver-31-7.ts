import {
  HABITABILITY_ROUTES_31_1,
  type HabitabilityRoute, type HabitabilityScenarioStatus,
  type HabitabilitySupportResolution,
} from '../../domain/habitability/habitability-scenario';
import type {
  HabitabilityHistoricalRequest31_7, HistoricalEnvironmentalState31_7,
  HistoricalEnvironmentSource31_7, HistoricalHabitabilityReport31_7,
  HistoricalHabRoute31_7, HistoricalHabRouteSegment31_7,
  HistoricalHabitableWindow31_7,
} from '../../domain/habitability/habitability-historical-windows-31-7';
import { HabitabilityEngine } from './habitability-engine';
import { HabitabilityIndicesResolver31_6 } from './habitability-indices-resolver-31-6';

/**
 * GENESIS 31.7 — Read-only, bounded reconstruction of dated environmental
 * compatibility. Uses the actual 31.1 + 31.6 criterion contracts at each
 * physically supported interval, never derives history from 32.x event counts
 * or extrapolates current conditions to the past. Does not compute duration,
 * cumulative habitable time, biological evolution, or a life probability.
 * Those questions belong to 31.8, 31.9 and phase 33 respectively.
 */
export class HabitabilityHistoricalWindowsResolver31_7 {
  private constructor() {}

  static reconstruct(
    request: HabitabilityHistoricalRequest31_7,
    source: HistoricalEnvironmentSource31_7,
    maxRecords = 4096,
  ): HistoricalHabitabilityReport31_7 {
    validateRequest(request, source, maxRecords);
    const { history, perspective } = request;
    const { chronology, startYear, endYear } = history;
    const locked = perspective === 'OBSERVED_KNOWLEDGE' && (
      request.observationAccess?.discoveryState !== 'CONFIRMED' ||
      request.observationAccess.scientificFicheAccessible !== true
    );
    if (locked) {
      // Crucial: no query, source revision, count or body identity read from
      // the private physical catalog, even when the current system exists.
      return Object.freeze({
        contractVersion: '31.7-CT0-v1',
        interpretation: 'HISTORICAL_ENVIRONMENTAL_COMPATIBILITY_NOT_LIFE_PROBABILITY',
        perspective, access: 'SCIENTIFIC_FICHE_LOCKED',
        bodyKind: null, bodyKey: null, multiplicity: null,
        startYear: null, endYear: null, routes: Object.freeze([]),
        historicalCompleteness: 'NOT_ESTABLISHED', lifePresence: 'NOT_EVALUATED',
      });
    }

    const ctx = {
      bodyKind: chronology.bodyKind, bodyKey: chronology.bodyKey,
      multiplicity: chronology.multiplicity, time: chronology.time,
    };
    const revision = source.revision(ctx);
    if (revision !== request.environmentSourceRevision) {
      throw new RangeError('31.7 environmental revision changed; reconstruct using a fresh manifest.');
    }
    const records = source.readInterval(ctx, startYear, endYear, maxRecords + 1);
    if (!Array.isArray(records) || records.length > maxRecords) {
      throw new RangeError('31.7 requires bounded dated environmental records.');
    }
    const presentYear = chronology.presentYearAfterFormation;
    const selected = records.map((s) => snapshotAndValidate(s, ctx.bodyKind, ctx.bodyKey,
      startYear, endYear, presentYear));
    selected.sort((a, b) => a.startYear - b.startYear ||
      a.endYear - b.endYear || (a.sourceRecordKey < b.sourceRecordKey ? -1 :
        a.sourceRecordKey > b.sourceRecordKey ? 1 : 0));
    const seenRecords = new Set<string>();
    for (const s of selected) {
      if (seenRecords.has(s.sourceRecordKey)) {
        throw new RangeError('31.7 duplicate dated environmental record identity.');
      }
      seenRecords.add(s.sourceRecordKey);
    }
    for (let i = 1; i < selected.length; i++) {
      if (selected[i].startYear <= selected[i - 1].endYear) {
        throw new RangeError('31.7 overlapping environmental trajectories are ambiguous.');
      }
    }
    if (source.revision(ctx) !== request.environmentSourceRevision) {
      throw new RangeError('31.7 environmental source changed during reconstruction.');
    }

    // The observer sees only explicitly published temporal segments. A hidden
    // segment is indistinguishable from missing historical coverage.
    const accessible = selected.filter(s => perspective === 'SIMULATED_REALITY' ||
      s.accessibleToObserver);
    const routes: HistoricalHabRoute31_7[] = HABITABILITY_ROUTES_31_1.map((route) => {
      const segments: HistoricalHabRouteSegment31_7[] = [];
      const gaps: { startYear: number; endYear: number }[] = [];
      let cursor = startYear;
      for (const s of accessible) {
        const from = Math.max(startYear, s.startYear);
        const to = Math.min(endYear, s.endYear);
        if (cursor < from) {
          gaps.push(Object.freeze({ startYear: cursor, endYear: from - 1 }));
          segments.push(unknown(cursor, from - 1, route));
        }
        const assessment = HabitabilityEngine.evaluate({
          bodyKind: ctx.bodyKind, bodyKey: ctx.bodyKey,
          multiplicity: ctx.multiplicity, time: ctx.time,
          perspective, evidence: s.evidence,
        });
        const indices = HabitabilityIndicesResolver31_6.summarize(assessment);
        const result = indices.routes.find(r => r.route === route)!;
        segments.push(Object.freeze({
          startYear: from, endYear: to,
          status: result.status, resolution: result.resolution,
          temporalBasis: s.temporalBasis, sourcePhase: s.sourcePhase,
          sourceModel: s.sourceModel, sourceRecordKey: s.sourceRecordKey,
          missingConstraints: Object.freeze([...result.missingConstraints]),
          decisiveContradictions: Object.freeze([...result.decisiveContradictions]),
        }));
        cursor = to + 1;
      }
      if (cursor <= endYear) {
        gaps.push(Object.freeze({ startYear: cursor, endYear }));
        segments.push(unknown(cursor, endYear, route));
      }
      return Object.freeze({
        route, segments: Object.freeze(segments),
        compatibleWindows: Object.freeze(mergeAdjacentCompatible(segments)),
        uncoveredIntervals: Object.freeze(gaps),
      });
    });
    return Object.freeze({
      contractVersion: '31.7-CT0-v1',
      interpretation: 'HISTORICAL_ENVIRONMENTAL_COMPATIBILITY_NOT_LIFE_PROBABILITY',
      perspective,
      access: perspective === 'SIMULATED_REALITY' ? 'INTERNAL' : 'SCIENTIFIC_FICHE_AVAILABLE',
      bodyKind: ctx.bodyKind, bodyKey: ctx.bodyKey, multiplicity: ctx.multiplicity,
      startYear, endYear, routes: Object.freeze(routes),
      historicalCompleteness: 'NOT_ESTABLISHED', lifePresence: 'NOT_EVALUATED',
    });
  }
}

function unknown(startYear: number, endYear: number, route: HabitabilityRoute): HistoricalHabRouteSegment31_7 {
  return Object.freeze({
    startYear, endYear,
    status: (route === 'ALTERNATIVE_CHEMISTRY' ?
      'MODEL_NOT_IMPLEMENTED' : 'INSUFFICIENT_EVIDENCE') as HabitabilityScenarioStatus,
    resolution: 'NOT_DETERMINED' as HabitabilitySupportResolution,
    temporalBasis: null, sourcePhase: null, sourceModel: null, sourceRecordKey: null,
    missingConstraints: Object.freeze([]), decisiveContradictions: Object.freeze([]),
  });
}

function mergeAdjacentCompatible(
  segments: readonly HistoricalHabRouteSegment31_7[],
): HistoricalHabitableWindow31_7[] {
  const windows: HistoricalHabitableWindow31_7[] = [];
  for (const s of segments) {
    if (s.status !== 'CONSTRAINTS_COMPATIBLE' || !s.temporalBasis || !s.sourceRecordKey) continue;
    const last = windows[windows.length - 1];
    if (last && last.endYear + 1 === s.startYear &&
        last.temporalBasis === s.temporalBasis && last.resolution === s.resolution) {
      windows[windows.length - 1] = Object.freeze({
        ...last, endYear: s.endYear,
        sourceRecordKeys: Object.freeze([...last.sourceRecordKeys, s.sourceRecordKey]),
      });
    } else {
      windows.push(Object.freeze({
        startYear: s.startYear, endYear: s.endYear,
        temporalBasis: s.temporalBasis, resolution: s.resolution,
        sourceRecordKeys: Object.freeze([s.sourceRecordKey]),
        interpretation: 'CONSTRAINT_COMPATIBILITY_NOT_LIFE_OR_CONTINUITY_PROOF',
      }));
    }
  }
  return windows;
}

function snapshotAndValidate(
  s: HistoricalEnvironmentalState31_7,
  kind: string, key: string, from: number, to: number, presentYear: number | null,
): HistoricalEnvironmentalState31_7 {
  if (!s || s.bodyKind !== kind || s.bodyKey !== key ||
      !Number.isSafeInteger(s.startYear) || !Number.isSafeInteger(s.endYear) ||
      s.startYear < 0 || s.endYear < s.startYear ||
      presentYear === null || s.endYear > presentYear ||
      s.endYear < from || s.startYear > to ||
      !['DATED_PHYSICAL_TRAJECTORY', 'DATED_INFERRED_ENVELOPE'].includes(s.temporalBasis) ||
      !validKey(s.sourcePhase) || !validKey(s.sourceModel) || !validKey(s.sourceRecordKey) ||
      typeof s.accessibleToObserver !== 'boolean' || !Array.isArray(s.evidence)) {
    throw new RangeError('31.7 invalid, undated, foreign or out-of-window environmental record.');
  }
  return Object.freeze({ ...s, evidence: Object.freeze(s.evidence.map(e => Object.freeze({ ...e }))) });
}

function validateRequest(
  request: HabitabilityHistoricalRequest31_7,
  source: HistoricalEnvironmentSource31_7,
  limit: number,
): void {
  if (!request || !request.history || !request.history.chronology ||
      !source || typeof source.revision !== 'function' ||
      typeof source.readInterval !== 'function' ||
      !Number.isSafeInteger(limit) || limit < 1 ||
      !validKey(request.environmentSourceRevision) ||
      !['SIMULATED_REALITY', 'OBSERVED_KNOWLEDGE'].includes(request.perspective)) {
    throw new RangeError('31.7 requires a bounded, versioned historical environmental source.');
  }
  const h = request.history, c = h.chronology;
  if (h.contractVersion !== '32.12-CT0-v1' ||
      h.coverage !== 'QUERIED_INTERVAL_ONLY' ||
      h.historicalCompleteness !== 'NOT_ESTABLISHED' ||
      c.contractVersion !== '32.1-CT0' || c.layer !== 'SIMULATED_REALITY' ||
      c.coverage !== 'SUPPLIED_EPISODES_ONLY' ||
      c.historicalCompleteness !== 'NOT_ESTABLISHED' ||
      !['PLANET', 'MOON'].includes(c.bodyKind) || !validKey(c.bodyKey) ||
      !['SINGLE', 'BINARY', 'TRIPLE', 'UNKNOWN'].includes(c.multiplicity) ||
      !c.time || c.time.kind !== 'CURRENT_SNAPSHOT' ||
      c.time.systemAgeBillionYears === null ||
      !Number.isFinite(c.time.systemAgeBillionYears) || c.time.systemAgeBillionYears < 0 ||
      (c.presentYearAfterFormation === null ||
       !Number.isSafeInteger(c.presentYearAfterFormation)) ||
      !Number.isSafeInteger(h.startYear) || !Number.isSafeInteger(h.endYear) ||
      h.startYear < 0 || h.endYear < h.startYear ||
      h.endYear > c.presentYearAfterFormation ||
      c.presentYearAfterFormation !== Math.round(c.time.systemAgeBillionYears * 1e9) ||
      !validKey(h.version.universeKey) || !validKey(h.version.physicsModelRevision) ||
      !validKey(h.version.sourceRevision)) {
    throw new RangeError('31.7 requires a validated 32.12 CT-0 interval for the same body.');
  }
  if (request.perspective === 'OBSERVED_KNOWLEDGE' &&
      (!request.observationAccess ||
       !['DETECTED', 'DISCOVERED', 'VISITED', 'CATALOGUED', 'CONFIRMED'].includes(
         request.observationAccess.discoveryState) ||
       typeof request.observationAccess.scientificFicheAccessible !== 'boolean')) {
    throw new RangeError('31.7 requires explicit observational access from the discovery layer.');
  }
}

function validKey(key: unknown): key is string {
  return typeof key === 'string' && key.trim().length > 0 && key.trim() === key &&
    !key.includes('\u0000');
}
