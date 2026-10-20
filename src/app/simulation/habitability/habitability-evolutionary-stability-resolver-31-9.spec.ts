import { describe, it, expect } from 'vitest';
import { HABITABILITY_REQUIREMENTS_31_1, type HabitabilityEvidence } from '../../domain/habitability/habitability-scenario';
import type { HistoricalEnvironmentalState31_7, HistoricalEnvironmentSource31_7 } from '../../domain/habitability/habitability-historical-windows-31-7';
import type { PlanetaryHistoryInput32_1, PlanetaryHistorySourceEpisode32_1 } from '../../domain/planetary-history/planetary-history-32-1';
import type { CertifiedEnvironmentalResponse31_9 } from '../../domain/habitability/habitability-evolutionary-stability-31-9';
import { PlanetaryHistoryIntervalEngine32_12 } from '../planetary-history/planetary-history-interval-engine-32-12';
import { HabitabilityHistoricalWindowsResolver31_7 } from './habitability-historical-windows-resolver-31-7';
import { HabitabilityContinuityResolver31_8 } from './habitability-continuity-resolver-31-8';
import { HabitabilityEvolutionaryStabilityResolver31_9 as Resolver } from './habitability-evolutionary-stability-resolver-31-9';

const baseContext: Omit<PlanetaryHistoryInput32_1, 'episodes'> = {
  bodyKind: 'PLANET', bodyKey: 'G0/S4/O1/B2', multiplicity: 'SINGLE',
  time: { kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: 4.3 },
};
const version = { universeKey: 'u-31-9', physicsModelRevision: 'p-32', sourceRevision: 'source-a' };
function support(route: 'SURFACE_AQUEOUS' | 'SUBSURFACE_AQUEOUS',
  verdict: 'SUPPORTS' | 'CONTRADICTS' = 'SUPPORTS', visible = true): HabitabilityEvidence[] {
  return HABITABILITY_REQUIREMENTS_31_1[route].map(constraint => ({
    route, constraint, verdict, basis: 'PHYSICAL_MODEL',
    accessibleToObserver: visible, sourceKey: `${route}.${constraint}`,
  }));
}
function environmental(from: number, to: number,
  mode: 'BOTH' | 'INCOMPATIBLE_SURFACE' | 'HIDDEN' | 'SUBSURFACE' = 'BOTH',
  ctx = baseContext): HistoricalEnvironmentalState31_7 {
  return {
    bodyKind: ctx.bodyKind, bodyKey: ctx.bodyKey, startYear: from, endYear: to,
    temporalBasis: 'DATED_PHYSICAL_TRAJECTORY', sourcePhase: '32.6', sourceModel: 'ClimateTrajectory',
    sourceRecordKey: `climate-${from}-${to}`, accessibleToObserver: mode !== 'HIDDEN',
    evidence: mode === 'INCOMPATIBLE_SURFACE' ? [
      ...support('SURFACE_AQUEOUS', 'CONTRADICTS'), ...support('SUBSURFACE_AQUEOUS'),
    ] : mode === 'SUBSURFACE' ? support('SUBSURFACE_AQUEOUS') :
      [...support('SURFACE_AQUEOUS'), ...support('SUBSURFACE_AQUEOUS')],
  };
}
function physicalEvent(key: string, at: number,
  kind: PlanetaryHistorySourceEpisode32_1['kind'] = 'REALIZED_IMPACT',
  ctx = baseContext): PlanetaryHistorySourceEpisode32_1 {
  return {
    episodeKey: key, targetBodyKind: ctx.bodyKind, targetBodyKey: ctx.bodyKey,
    kind, time: { timeScale: 'YEARS_SINCE_SYSTEM_FORMATION', startYear: at,
      endYear: at, resolution: 'MODELLED_INSTANT' },
    source: { sourcePhase: '23.13', sourceModel: 'RealizedImpactCatalog',
      sourceRecordKey: `impact-${key}`, evidenceKind: 'RESOLVED_PHYSICAL_EVENT' },
    causedByEpisodeKeys: [],
  };
}
function build(opts: {
  states?: readonly HistoricalEnvironmentalState31_7[];
  events?: readonly PlanetaryHistorySourceEpisode32_1[];
  responses?: readonly CertifiedEnvironmentalResponse31_9[];
  published?: readonly string[];
  perspective?: 'SIMULATED_REALITY' | 'OBSERVED_KNOWLEDGE';
  discoveryState?: 'DETECTED' | 'CONFIRMED'; fiche?: boolean;
  context?: typeof baseContext; from?: number; to?: number;
} = {}) {
  const ctx = opts.context ?? baseContext;
  const startYear = opts.from ?? 100, endYear = opts.to ?? 149;
  const records = opts.events ?? [];
  const history = new PlanetaryHistoryIntervalEngine32_12({
    revision: () => version.sourceRevision,
    readInterval: (_ctx, a, b) => records.filter(x => x.time.startYear <= b && x.time.endYear >= a),
    readByKey: (_ctx, key) => records.find(x => x.episodeKey === key) ?? null,
  }).read({ context: ctx, version, startYear, endYear });
  const states = opts.states ?? [environmental(100, 149, 'BOTH', ctx)];
  const envSource: HistoricalEnvironmentSource31_7 = {
    revision: () => 'env-31.9-v1',
    readInterval: (_ctx, a, b) => states.filter(s => s.startYear <= b && s.endYear >= a),
  };
  const windows = HabitabilityHistoricalWindowsResolver31_7.reconstruct({
    history, perspective: opts.perspective ?? 'SIMULATED_REALITY',
    environmentSourceRevision: 'env-31.9-v1',
    observationAccess: { discoveryState: opts.discoveryState ?? 'CONFIRMED',
      scientificFicheAccessible: opts.fiche ?? true },
  }, envSource);
  const continuity = HabitabilityContinuityResolver31_8.summarize({ historicalWindows: windows });
  const assess = (changes = opts.responses ?? []) => Resolver.assess({
    windows, continuity, history, certifiedResponses: changes, observedEpisodeIds: opts.published,
  });
  return { windows, continuity, history, assess };
}
function resultRoute(report: ReturnType<ReturnType<typeof build>['assess']>,
  route = 'SURFACE_AQUEOUS') {
  const found = report.routes.find(x => x.route === route);
  if (!found) throw new Error('Missing route');
  return found;
}
function response(episodeId: string, responseYear = 110,
  change: CertifiedEnvironmentalResponse31_9['change'] = 'COMPATIBILITY_INTERRUPTED',
  overrides: Partial<CertifiedEnvironmentalResponse31_9> = {}): CertifiedEnvironmentalResponse31_9 {
  return {
    eventEpisodeId: episodeId, targetBodyKind: baseContext.bodyKind,
    targetBodyKey: baseContext.bodyKey, route: 'SURFACE_AQUEOUS', responseYear, change,
    sourcePhase: '32.9', sourceModel: 'PhysicalEnvironmentResponse',
    sourceRecordKey: `effect-${episodeId}-${responseYear}`, resolution: 'RESOLVED_PHYSICAL_RESPONSE',
    accessibleToObserver: true, ...overrides,
  };
}
const interruptedStates = () => [
  environmental(100, 109), environmental(110, 119, 'INCOMPATIBLE_SURFACE'),
  environmental(120, 149),
];

// Explicit tests of the 31.9 contract. The events are test fixtures, NOT
// actual history assigned to any real GENESIS planet or moon.
describe('GENESIS 31.9 — sourced environmental stability, not biological evolution', () => {
  it('preserves 31.8 inclusive compatible year-slot totals', () => {
    const route = resultRoute(build().assess());
    expect(route.compatibleYearSlots).toBe(50);
    expect(route.longestContinuousCompatibleYearSlots).toBe(50);
  });
  it('an empty event window does not establish immunity from catastrophes', () => {
    const r = build().assess();
    expect(resultRoute(r).causalAssessment).toBe('NO_CAUSAL_RESPONSE_ESTABLISHED');
    expect(resultRoute(r).evolutionaryStability).toBe('NOT_DETERMINED_BEYOND_DOCUMENTED_ENVIRONMENTAL_WINDOWS');
    expect(r.historicalCompleteness).toBe('NOT_ESTABLISHED');
  });
  it('a realized impact inside compatible years is only coincident, not harmful or harmless', () => {
    const s = build({ events: [physicalEvent('impact', 120)] });
    const r = resultRoute(s.assess());
    expect(r.eventContexts).toHaveLength(1);
    expect(r.eventContexts[0].temporalRelation).toBe('INTERSECTS_DOCUMENTED_COMPATIBILITY');
    expect(r.eventContexts[0].causality).toBe('TIMING_ONLY_NO_CAUSAL_INFERENCE');
    expect(r.certifiedChanges).toHaveLength(0);
  });
  it('a transient also is not an extinction or incompatibility event by itself', () => {
    const s = build({ events: [physicalEvent('grb', 120, 'RESOLVED_TRANSIENT_EFFECT')] });
    const r = s.assess();
    expect(resultRoute(r).certifiedChanges).toHaveLength(0);
    expect(r.lifePresence).toBe('NOT_EVALUATED');
    expect(r.extinction).toBe('NOT_EVALUATED');
  });
  it('counts environmental incompatibility separately from source-certified causal effects', () => {
    const s = build({ states: interruptedStates(), events: [physicalEvent('event', 110)] });
    const r = resultRoute(s.assess());
    expect(r.compatibleYearSlots).toBe(40);
    expect(r.longestContinuousCompatibleYearSlots).toBe(30);
    expect(r.documentedCompatibilityInterruptions).toBe(1);
    expect(r.documentedCompatibilityRestorations).toBe(1);
    expect(r.certifiedChanges).toHaveLength(0);
  });
  it('only a resolved source link can associate an episode with an interruption', () => {
    const s = build({ states: interruptedStates(), events: [physicalEvent('impact', 110)] });
    const eventId = s.history.chronology.episodes[0].episodeId;
    const r = resultRoute(s.assess([response(eventId)]));
    expect(r.certifiedChanges).toHaveLength(1);
    expect(r.certifiedChanges[0].relation).toBe('EXPLICIT_PHYSICALLY_RESOLVED_CAUSAL_LINK');
    expect(r.causalAssessment).toBe('EXPLICIT_PHYSICAL_RESPONSES_RECORDED');
  });
  it('accepts physically certified restoration only at incompatible -> compatible boundary', () => {
    const s = build({ states: interruptedStates(), events: [physicalEvent('change', 119)] });
    const eid = s.history.chronology.episodes[0].episodeId;
    expect(resultRoute(s.assess([response(eid, 120, 'COMPATIBILITY_RESTORED')])).certifiedChanges).toHaveLength(1);
  });
  it('a gap between compatible intervals breaks continuity without asserting a catastrophe', () => {
    const s = build({ states: [environmental(100, 109), environmental(120, 149)] });
    const r = resultRoute(s.assess());
    expect(r.unknownContinuityBreaks).toBe(1);
    expect(r.documentedCompatibilityInterruptions).toBe(0);
    expect(r.uncoveredYearSlots).toBe(10);
  });
  it('rejects claiming an interruption from a gap rather than incompatibility', () => {
    const s = build({ states: [environmental(100, 109), environmental(120, 149)],
      events: [physicalEvent('impact', 110)] });
    const eid = s.history.chronology.episodes[0].episodeId;
    expect(() => s.assess([response(eid, 110)])).toThrow();
  });
  it('rejects a link in which the physical event happens after the alleged effect', () => {
    const s = build({ states: interruptedStates(), events: [physicalEvent('impact', 125)] });
    const eid = s.history.chronology.episodes[0].episodeId;
    expect(() => s.assess([response(eid)])).toThrow();
  });
  it('rejects a wrong target body even with a correct episode', () => {
    const s = build({ states: interruptedStates(), events: [physicalEvent('impact', 110)] });
    const eid = s.history.chronology.episodes[0].episodeId;
    expect(() => s.assess([response(eid, 110, 'COMPATIBILITY_INTERRUPTED',
      { targetBodyKey: 'a-foreign-moon' })])).toThrow();
  });
  it('rejects a made-up event identifier', () => {
    const s = build({ states: interruptedStates(), events: [physicalEvent('impact', 110)] });
    expect(() => s.assess([response('invented')])).toThrow();
  });
  it('rejects inferred transitions as certified physical causal events', () => {
    const a = physicalEvent('inferred', 110, 'CLIMATE_GEOCHEMISTRY_TRANSITION');
    const s = build({ states: interruptedStates(), events: [{ ...a, source: {
      ...a.source, evidenceKind: 'INFERRED_PHYSICAL_EPISODE',
    } }] });
    const eid = s.history.chronology.episodes[0].episodeId;
    expect(() => s.assess([response(eid)])).toThrow();
  });
  it('rejects claimed responses that are not physically resolved', () => {
    const s = build({ states: interruptedStates(), events: [physicalEvent('impact', 110)] });
    const eid = s.history.chronology.episodes[0].episodeId;
    expect(() => s.assess([response(eid, 110, 'COMPATIBILITY_INTERRUPTED', {
      resolution: 'UNRESOLVED' as CertifiedEnvironmentalResponse31_9['resolution'],
    })])).toThrow();
  });
  it('rejects reusing one effect record for two separate link assertions', () => {
    const s = build({ states: interruptedStates(), events: [physicalEvent('impact', 110)] });
    const eid = s.history.chronology.episodes[0].episodeId;
    expect(() => s.assess([response(eid), response(eid)])).toThrow();
  });
  it('rejects claiming a recovery when environmental evidence shows interruption', () => {
    const s = build({ states: interruptedStates(), events: [physicalEvent('impact', 110)] });
    const eid = s.history.chronology.episodes[0].episodeId;
    expect(() => s.assess([response(eid, 110, 'COMPATIBILITY_RESTORED')])).toThrow();
  });
  it('does not label the requested end year as the present epoch', () => {
    const r = resultRoute(build({ from: 100, to: 149 }).assess());
    expect(r.compatibleYearSlots).toBe(50);
    expect(r.evolutionaryStability).toBe('NOT_DETERMINED_BEYOND_DOCUMENTED_ENVIRONMENTAL_WINDOWS');
  });
  it('keeps surface and subsurface routes independent', () => {
    const s = build({ states: [environmental(100, 149, 'SUBSURFACE')] });
    expect(resultRoute(s.assess()).compatibleYearSlots).toBe(0);
    expect(resultRoute(s.assess(), 'SUBSURFACE_AQUEOUS').compatibleYearSlots).toBe(50);
  });
  it('does not promote alternative chemistry before its dated physical criteria exist', () => {
    const r = resultRoute(build().assess(), 'ALTERNATIVE_CHEMISTRY');
    expect(r.compatibleYearSlots).toBe(0);
    expect(r.certifiedChanges).toHaveLength(0);
  });
  it('locks all historical metadata before CONFIRMED', () => {
    const s = build({ perspective: 'OBSERVED_KNOWLEDGE', discoveryState: 'DETECTED',
      events: [physicalEvent('private', 110)] });
    const r = s.assess();
    expect(r.bodyKey).toBeNull();
    expect(r.startYear).toBeNull();
    expect(r.routes).toHaveLength(0);
    expect(JSON.stringify(r).includes('private')).toBe(false);
  });
  it('CONFIRMED without fiche authorization remains entirely locked', () => {
    const r = build({ perspective: 'OBSERVED_KNOWLEDGE', fiche: false }).assess();
    expect(r.routes).toHaveLength(0);
    expect(r.bodyKind).toBeNull();
  });
  it('CONFIRMED never automatically publishes a private event', () => {
    const s = build({ perspective: 'OBSERVED_KNOWLEDGE',
      events: [physicalEvent('private', 110)] });
    const r = s.assess();
    expect(resultRoute(r).eventContexts).toHaveLength(0);
    expect(JSON.stringify(r).includes('private')).toBe(false);
  });
  it('publishes only allow-listed event identities after discovery', () => {
    const s = build({ perspective: 'OBSERVED_KNOWLEDGE',
      events: [physicalEvent('secret', 105), physicalEvent('public', 110)] });
    const ids = s.history.chronology.episodes;
    const publicId = ids.find(e => e.episodeKey === 'public')!.episodeId;
    const r = s.assess();
    const visible = Resolver.assess({ windows: s.windows, continuity: s.continuity,
      history: s.history, observedEpisodeIds: [publicId] });
    expect(resultRoute(r).eventContexts).toHaveLength(0);
    expect(resultRoute(visible).eventContexts).toHaveLength(1);
    expect(JSON.stringify(visible).includes('secret')).toBe(false);
  });
  it('hides source-certified responses when their event is not published', () => {
    const s = build({ perspective: 'OBSERVED_KNOWLEDGE',
      states: interruptedStates(), events: [physicalEvent('private', 110)] });
    const id = s.history.chronology.episodes[0].episodeId;
    const r = s.assess([response(id)]);
    expect(resultRoute(r).certifiedChanges).toHaveLength(0);
  });
  it('does not expose a certified change when the observer cannot see its environmental transition', () => {
    const s = build({ perspective: 'OBSERVED_KNOWLEDGE',
      states: [environmental(100, 109, 'HIDDEN'),
        environmental(110, 119, 'INCOMPATIBLE_SURFACE'), environmental(120, 149)],
      events: [physicalEvent('published', 110)] });
    const id = s.history.chronology.episodes[0].episodeId;
    const observed = Resolver.assess({ windows: s.windows, continuity: s.continuity,
      history: s.history, observedEpisodeIds: [id], certifiedResponses: [response(id)] });
    expect(resultRoute(observed).eventContexts).toHaveLength(1);
    expect(resultRoute(observed).certifiedChanges).toHaveLength(0);
    expect(resultRoute(observed).documentedCompatibilityInterruptions).toBe(0);
  });
  it('does not leak hidden invalid causal source records through observer errors', () => {
    const s = build({ perspective: 'OBSERVED_KNOWLEDGE', states: interruptedStates(),
      events: [physicalEvent('public', 110)] });
    const r = s.assess([response('private-source-event', 110, 'COMPATIBILITY_INTERRUPTED', {
      accessibleToObserver: false,
    })]);
    expect(resultRoute(r).certifiedChanges).toHaveLength(0);
  });
  it('does not mistake a formation episode for a catastrophe or physical perturbation', () => {
    const s = build({ events: [physicalEvent('formation', 110, 'FORMATION')] });
    expect(resultRoute(s.assess()).eventContexts).toHaveLength(0);
  });
  it('hides source-certified responses when the response itself is not published', () => {
    const s = build({ perspective: 'OBSERVED_KNOWLEDGE', states: interruptedStates(),
      events: [physicalEvent('event', 110)] });
    const id = s.history.chronology.episodes[0].episodeId;
    const visible = Resolver.assess({ windows: s.windows, continuity: s.continuity,
      history: s.history, certifiedResponses: [response(id, 110, 'COMPATIBILITY_INTERRUPTED', {
        accessibleToObserver: false,
      })], observedEpisodeIds: [id] });
    expect(resultRoute(visible).certifiedChanges).toHaveLength(0);
  });
  it('hidden environmental evidence remains unknown to the observer', () => {
    const s = build({ perspective: 'OBSERVED_KNOWLEDGE',
      states: [environmental(100, 129, 'HIDDEN'), environmental(130, 149)] });
    const r = resultRoute(s.assess());
    expect(r.compatibleYearSlots).toBe(20);
    expect(r.uncoveredYearSlots).toBe(30);
  });
  it.each(['SINGLE', 'BINARY', 'TRIPLE'] as const)('applies identical logic to %s', (multiplicity) => {
    const context = { ...baseContext, multiplicity };
    const s = build({ context, states: [environmental(100, 149, 'BOTH', context)] });
    expect(resultRoute(s.assess()).compatibleYearSlots).toBe(50);
  });
  it('keeps moon events attached to the moon and not its parent planet', () => {
    const context = { ...baseContext, bodyKind: 'MOON' as const, bodyKey: 'G0/S4/O1/B2/M1' };
    const s = build({ context, states: [environmental(100, 149, 'BOTH', context)],
      events: [physicalEvent('moon-crater', 110, 'REALIZED_IMPACT', context)] });
    expect(s.assess().bodyKind).toBe('MOON');
    expect(resultRoute(s.assess()).eventContexts).toHaveLength(1);
  });
  it('rejects mismatched continuity summaries, never recalculates fictional years', () => {
    const s = build();
    const copy = { ...s.continuity, startYear: 101 };
    expect(() => Resolver.assess({ windows: s.windows, continuity: copy, history: s.history })).toThrow();
  });
  it('rejects mismatched history identity and interval', () => {
    const s = build();
    const wrong = { ...s.history, endYear: 148 };
    expect(() => Resolver.assess({ windows: s.windows, continuity: s.continuity, history: wrong })).toThrow();
  });
  it('rejects duplicate published episode IDs', () => {
    const s = build({ perspective: 'OBSERVED_KNOWLEDGE', events: [physicalEvent('e', 120)] });
    const id = s.history.chronology.episodes[0].episodeId;
    expect(() => Resolver.assess({ windows: s.windows, continuity: s.continuity,
      history: s.history, observedEpisodeIds: [id, id] })).toThrow();
  });
  it('does not modify the 31.7 windows, 31.8 duration or physical chronology', () => {
    const s = build({ states: interruptedStates(), events: [physicalEvent('impact', 110)] });
    const before = JSON.stringify([s.windows, s.continuity, s.history]);
    const r = s.assess();
    expect(JSON.stringify([s.windows, s.continuity, s.history])).toBe(before);
    expect(Object.isFrozen(r)).toBe(true);
    expect(Object.isFrozen(r.routes[0])).toBe(true);
  });
  it('handles a bounded 1,024-episode physical source without expanding history', () => {
    const events = Array.from({length: 1024}, (_, i) => physicalEvent(`event-${i}`, 100 + i));
    const ctx = baseContext;
    const until = 1223;
    const states = [environmental(100, until)];
    const s = build({ events, states, from: 100, to: until, context: ctx });
    const r = resultRoute(s.assess());
    expect(r.eventContexts).toHaveLength(1024);
    expect(r.certifiedChanges).toHaveLength(0);
  });
});
