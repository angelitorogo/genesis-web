import { HABITABILITY_ROUTES_31_1 } from '../../domain/habitability/habitability-scenario';
import type { HabitabilityRoute } from '../../domain/habitability/habitability-scenario';
import type { HistoricalHabRoute31_7 } from '../../domain/habitability/habitability-historical-windows-31-7';
import type { PlanetaryHistoryEpisode32_1 } from '../../domain/planetary-history/planetary-history-32-1';
import type {
  CertifiedEnvironmentalResponse31_9, DocumentedEnvironmentalChange31_9,
  EvolutionaryStabilityRoute31_9, HabitabilityEvolutionaryStabilityReport31_9,
  HabitabilityEvolutionaryStabilityRequest31_9, HistoricalPerturbationContext31_9,
} from '../../domain/habitability/habitability-evolutionary-stability-31-9';
import { HabitabilityContinuityResolver31_8 } from './habitability-continuity-resolver-31-8';

const RELEVANT_KINDS = new Set<string>([
  'REALIZED_IMPACT', 'RESOLVED_TRANSIENT_EFFECT', 'STELLAR_ENVIRONMENT_CHANGE',
  'VOLCANIC_EPISODE', 'CLIMATE_GEOCHEMISTRY_TRANSITION', 'GLACIATION_TRANSITION',
  'ATMOSPHERE_TRANSITION', 'WATER_RESERVOIR_TRANSITION',
]);
const MAX_RECORDS = 4096;

/**
 * GENESIS 31.9 — Compares already certified dated environmental states (31.7,
 * 31.8) with bounded canonical physical episodes (32.12). Pure read-only.
 * Coincidence is not causation, absence of a recorded effect is not resilience,
 * and no result estimates evolutionary success, extinctions or probability of life.
 */
export class HabitabilityEvolutionaryStabilityResolver31_9 {
  private constructor() {}

  static assess(input: HabitabilityEvolutionaryStabilityRequest31_9): HabitabilityEvolutionaryStabilityReport31_9 {
    if (!input || !input.windows || !input.continuity) {
      throw new RangeError('31.9 requires historical windows and independent continuity results.');
    }
    // Recomputing also validates every dated route, missing slice and window.
    const canonical = HabitabilityContinuityResolver31_8.summarize({ historicalWindows: input.windows });
    if (JSON.stringify(input.continuity) !== JSON.stringify(canonical)) {
      throw new RangeError('31.9 continuity must match the same unmodified 31.7 interval report.');
    }
    if (canonical.access === 'SCIENTIFIC_FICHE_LOCKED') {
      // No inspection of history, versions, body identity, private events or responses.
      return Object.freeze({
        contractVersion: '31.9-CT0-v1',
        interpretation: 'PHYSICAL_ENVIRONMENTAL_STABILITY_NOT_BIOLOGICAL_EVOLUTION_OR_LIFE',
        perspective: canonical.perspective, access: canonical.access,
        bodyKind: null, bodyKey: null, multiplicity: null,
        startYear: null, endYear: null, routes: Object.freeze([]),
        historicalCompleteness: 'NOT_ESTABLISHED', lifePresence: 'NOT_EVALUATED',
        extinction: 'NOT_EVALUATED',
      });
    }
    validateHistory(input, canonical.bodyKind!, canonical.bodyKey!, canonical.multiplicity!,
      canonical.startYear!, canonical.endYear!);
    const episodes = input.history.chronology.episodes.filter(e => RELEVANT_KINDS.has(e.kind));
    const published = canonical.perspective === 'OBSERVED_KNOWLEDGE'
      ? new Set(input.observedEpisodeIds ?? []) : null;
    if (input.observedEpisodeIds !== undefined) {
      if (!Array.isArray(input.observedEpisodeIds) || input.observedEpisodeIds.length > MAX_RECORDS ||
          input.observedEpisodeIds.some(id => !validKey(id)) ||
          new Set(input.observedEpisodeIds).size !== input.observedEpisodeIds.length) {
        throw new RangeError('31.9 invalid observed-episode publication allow-list.');
      }
    }
    const visibleEpisodes = published ? episodes.filter(e => published.has(e.episodeId)) : episodes;
    const episodeById = new Map(episodes.map(e => [e.episodeId, e]));
    // The physical history is private. In the observational perspective a
    // published response is still unreportable when its supporting environmental
    // state transition has not been published. Filter BEFORE scientific-link
    // validation: errors and counts must not reveal hidden source records.
    const submitted = input.certifiedResponses ?? [];
    if (!Array.isArray(submitted) || submitted.length > MAX_RECORDS) {
      throw new RangeError('31.9 requires bounded source-certified physical responses.');
    }
    const accessibleResponses = published ? submitted.filter(r => r &&
      r.accessibleToObserver === true && published.has(r.eventEpisodeId) &&
      transitionMatches(r, input.windows.routes)) : submitted;
    const certified = validateResponses(accessibleResponses, episodeById,
      input.windows.routes, canonical.bodyKind!, canonical.bodyKey!, canonical.startYear!, canonical.endYear!);
    const routes: EvolutionaryStabilityRoute31_9[] = input.windows.routes.map(w => {
      const duration = canonical.routes.find(d => d.route === w.route)!;
      const contexts = contextsForRoute(w, visibleEpisodes);
      const responses = certified.filter(r => r.route === w.route)
        .map(r => Object.freeze({
          eventEpisodeId: r.eventEpisodeId, responseYear: r.responseYear, change: r.change,
          sourcePhase: r.sourcePhase, sourceModel: r.sourceModel,
          sourceRecordKey: r.sourceRecordKey,
          relation: 'EXPLICIT_PHYSICALLY_RESOLVED_CAUSAL_LINK' as const,
        }));
      const changes = Object.freeze(responses.sort((a, b) => a.responseYear - b.responseYear ||
        compare(a.eventEpisodeId, b.eventEpisodeId) || compare(a.sourceRecordKey, b.sourceRecordKey)));
      const transitions = countTransitions(w);
      return Object.freeze({
        route: w.route,
        compatibleYearSlots: duration.accumulatedCompatibleYearSlots,
        longestContinuousCompatibleYearSlots: duration.longestContinuousCompatibleYearSlots,
        incompatibleYearSlots: duration.incompatibleYearSlots,
        insufficientEvidenceYearSlots: duration.insufficientEvidenceYearSlots,
        uncoveredYearSlots: duration.uncoveredYearSlots,
        documentedCompatibilityInterruptions: transitions.interruptions,
        documentedCompatibilityRestorations: transitions.restorations,
        unknownContinuityBreaks: transitions.unknown,
        eventContexts: Object.freeze(contexts), certifiedChanges: changes,
        causalAssessment: changes.length ? 'EXPLICIT_PHYSICAL_RESPONSES_RECORDED' as const :
          contexts.length ? 'TEMPORAL_COINCIDENCES_ONLY' as const :
            'NO_CAUSAL_RESPONSE_ESTABLISHED' as const,
        evolutionaryStability: 'NOT_DETERMINED_BEYOND_DOCUMENTED_ENVIRONMENTAL_WINDOWS' as const,
      });
    });
    return Object.freeze({
      contractVersion: '31.9-CT0-v1',
      interpretation: 'PHYSICAL_ENVIRONMENTAL_STABILITY_NOT_BIOLOGICAL_EVOLUTION_OR_LIFE',
      perspective: canonical.perspective, access: canonical.access,
      bodyKind: canonical.bodyKind, bodyKey: canonical.bodyKey, multiplicity: canonical.multiplicity,
      startYear: canonical.startYear, endYear: canonical.endYear,
      routes: Object.freeze(routes), historicalCompleteness: 'NOT_ESTABLISHED',
      lifePresence: 'NOT_EVALUATED', extinction: 'NOT_EVALUATED',
    });
  }
}

function validateHistory(input: HabitabilityEvolutionaryStabilityRequest31_9,
  kind: string, key: string, multiplicity: string, from: number, to: number): void {
  const h = input.history, c = h?.chronology;
  if (!h || h.contractVersion !== '32.12-CT0-v1' || h.coverage !== 'QUERIED_INTERVAL_ONLY' ||
      h.historicalCompleteness !== 'NOT_ESTABLISHED' || !c || c.contractVersion !== '32.1-CT0' ||
      c.layer !== 'SIMULATED_REALITY' || c.historicalCompleteness !== 'NOT_ESTABLISHED' ||
      c.lifePresence !== 'NOT_EVALUATED' || c.coverage !== 'SUPPLIED_EPISODES_ONLY' ||
      c.bodyKind !== kind || c.bodyKey !== key || c.multiplicity !== multiplicity ||
      h.startYear !== from || h.endYear !== to || c.timeScale !== 'YEARS_SINCE_SYSTEM_FORMATION' ||
      !Array.isArray(c.episodes) || c.episodes.length > MAX_RECORDS ||
      !h.version || !validKey(h.version.universeKey) ||
      !validKey(h.version.physicsModelRevision) || !validKey(h.version.sourceRevision)) {
    throw new RangeError('31.9 requires the identical bounded versioned 32.12 CT-0 history.');
  }
  const ids = new Set<string>();
  for (const e of c.episodes) {
    if (!e || !validKey(e.episodeId) || ids.has(e.episodeId) ||
        e.targetBodyKind !== kind || e.targetBodyKey !== key ||
        !e.time || e.time.timeScale !== 'YEARS_SINCE_SYSTEM_FORMATION' ||
        !Number.isSafeInteger(e.time.startYear) || !Number.isSafeInteger(e.time.endYear) ||
        e.time.startYear > to || e.time.endYear < from || e.time.endYear < e.time.startYear ||
        !e.source || !validKey(e.source.sourcePhase) || !validKey(e.source.sourceModel) ||
        !validKey(e.source.sourceRecordKey)) {
      throw new RangeError('31.9 rejects foreign, duplicate, undated or unbounded physical episodes.');
    }
    ids.add(e.episodeId);
  }
}

function validateResponses(responses: readonly CertifiedEnvironmentalResponse31_9[],
  episodes: ReadonlyMap<string, PlanetaryHistoryEpisode32_1>,
  routes: readonly HistoricalHabRoute31_7[], kind: string, key: string,
  from: number, to: number): readonly CertifiedEnvironmentalResponse31_9[] {
  if (!Array.isArray(responses) || responses.length > MAX_RECORDS) {
    throw new RangeError('31.9 requires bounded source-certified physical responses.');
  }
  const seen = new Set<string>();
  for (const r of responses) {
    const episode = r && episodes.get(r.eventEpisodeId);
    if (!r || !episode || !RELEVANT_KINDS.has(episode.kind) ||
        episode.source.evidenceKind !== 'RESOLVED_PHYSICAL_EVENT' ||
        r.resolution !== 'RESOLVED_PHYSICAL_RESPONSE' ||
        r.targetBodyKind !== kind || r.targetBodyKey !== key ||
        !HABITABILITY_ROUTES_31_1.includes(r.route) ||
        !Number.isSafeInteger(r.responseYear) || r.responseYear <= from || r.responseYear > to ||
        r.responseYear < episode.time.startYear ||
        !['COMPATIBILITY_INTERRUPTED', 'COMPATIBILITY_RESTORED'].includes(r.change) ||
        !validKey(r.sourcePhase) || !validKey(r.sourceModel) || !validKey(r.sourceRecordKey) ||
        typeof r.accessibleToObserver !== 'boolean' ||
        seen.has(`${r.route}|${r.responseYear}|${r.eventEpisodeId}|${r.sourceRecordKey}`)) {
      throw new RangeError('31.9 rejects unsupported or duplicated causal attribution.');
    }
    if (!transitionMatches(r, routes)) {
      throw new RangeError('31.9 certified response must match a dated, physically resolved compatibility change.');
    }
    seen.add(`${r.route}|${r.responseYear}|${r.eventEpisodeId}|${r.sourceRecordKey}`);
  }
  return responses;
}

function transitionMatches(r: CertifiedEnvironmentalResponse31_9,
  routes: readonly HistoricalHabRoute31_7[]): boolean {
  const segments = routes.find(a => a.route === r.route)?.segments;
  if (!segments) return false;
  const i = segments.findIndex(s => s.startYear === r.responseYear);
  const prev = segments[i - 1], next = segments[i];
  const interruption = r.change === 'COMPATIBILITY_INTERRUPTED';
  return !!prev && !!next && prev.endYear + 1 === next.startYear &&
    prev.status === (interruption ? 'CONSTRAINTS_COMPATIBLE' : 'CONSTRAINTS_INCOMPATIBLE') &&
    next.status === (interruption ? 'CONSTRAINTS_INCOMPATIBLE' : 'CONSTRAINTS_COMPATIBLE') &&
    prev.temporalBasis !== null && next.temporalBasis !== null;
}

function contextsForRoute(route: HistoricalHabRoute31_7,
  episodes: readonly PlanetaryHistoryEpisode32_1[]): HistoricalPerturbationContext31_9[] {
  const windows = route.compatibleWindows;
  const contexts: HistoricalPerturbationContext31_9[] = [];
  let j = 0;
  for (const e of episodes) {
    while (j < windows.length && windows[j].endYear < e.time.startYear) j++;
    const intersect = j < windows.length && windows[j].startYear <= e.time.endYear;
    contexts.push(Object.freeze({
      episodeId: e.episodeId, kind: e.kind, startYear: e.time.startYear,
      endYear: e.time.endYear, sourcePhase: e.source.sourcePhase,
      sourceModel: e.source.sourceModel, sourceRecordKey: e.source.sourceRecordKey,
      temporalRelation: intersect ? 'INTERSECTS_DOCUMENTED_COMPATIBILITY' :
        'NO_DOCUMENTED_COMPATIBLE_OVERLAP',
      causality: 'TIMING_ONLY_NO_CAUSAL_INFERENCE',
    }));
  }
  return contexts;
}

function countTransitions(route: HistoricalHabRoute31_7): {
  interruptions: number; restorations: number; unknown: number;
} {
  let interruptions = 0, restorations = 0, unknown = 0;
  for (let i = 1; i < route.segments.length; i++) {
    const prev = route.segments[i - 1], next = route.segments[i];
    if (prev.status === 'CONSTRAINTS_COMPATIBLE' && next.status === 'CONSTRAINTS_INCOMPATIBLE') interruptions++;
    if (prev.status === 'CONSTRAINTS_INCOMPATIBLE' && next.status === 'CONSTRAINTS_COMPATIBLE') restorations++;
    if (prev.status === 'CONSTRAINTS_COMPATIBLE' &&
        (next.status === 'INSUFFICIENT_EVIDENCE' || next.status === 'MODEL_NOT_IMPLEMENTED')) unknown++;
  }
  return { interruptions, restorations, unknown };
}
function compare(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }
function validKey(x: unknown): x is string {
  return typeof x === 'string' && x.trim().length > 0 && x === x.trim() && !x.includes('\0');
}
