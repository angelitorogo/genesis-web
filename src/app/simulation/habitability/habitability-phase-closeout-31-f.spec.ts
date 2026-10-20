import { describe, expect, it } from 'vitest';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { HABITABILITY_REQUIREMENTS_31_1, type HabitabilityEvidence } from '../../domain/habitability/habitability-scenario';
import type { HabitabilityKnowledgeInput31_12 } from '../../domain/habitability/habitability-knowledge-31-12';
import type { HistoricalEnvironmentalState31_7, HistoricalEnvironmentSource31_7 } from '../../domain/habitability/habitability-historical-windows-31-7';
import type { PlanetaryHistorySourceEpisode32_1 } from '../../domain/planetary-history/planetary-history-32-1';
import { HabitabilityKnowledgeResolver31_12 } from './habitability-knowledge-resolver-31-12';
import { HabitabilityHistoricalWindowsResolver31_7 } from './habitability-historical-windows-resolver-31-7';
import { HabitabilityContinuityResolver31_8 } from './habitability-continuity-resolver-31-8';
import { HabitabilityEvolutionaryStabilityResolver31_9 } from './habitability-evolutionary-stability-resolver-31-9';
import { PlanetaryHistoryIntervalEngine32_12 } from '../planetary-history/planetary-history-interval-engine-32-12';

/** 31.F is a cross-contract regression, NOT evidence of a live game integration. */
const context = {
  bodyKind: 'PLANET' as const, bodyKey: 'audit-synthetic-31F', multiplicity: 'TRIPLE' as const,
  time: { kind: 'CURRENT_SNAPSHOT' as const, systemAgeBillionYears: 4.2 },
};
const version = { universeKey: 'audit-universe', physicsModelRevision: 'audit-physics', sourceRevision: 'audit-source-v1' };
const evidence = (route: 'SURFACE_AQUEOUS' | 'SUBSURFACE_AQUEOUS',
  hiddenContradiction = false): HabitabilityEvidence[] =>
  HABITABILITY_REQUIREMENTS_31_1[route].map(constraint => ({
    route, constraint, verdict: hiddenContradiction && constraint === 'TEMPERATURE'
      ? 'CONTRADICTS' as const : 'SUPPORTS' as const,
    basis: 'PHYSICAL_MODEL' as const,
    accessibleToObserver: !(hiddenContradiction && constraint === 'TEMPERATURE'),
    sourceKey: `auditoria.sintetica.${route}.${constraint}`,
  }));
const knowledge: HabitabilityKnowledgeInput31_12 = {
  ...context, aqueousEvidence: [...evidence('SURFACE_AQUEOUS',true),...evidence('SUBSURFACE_AQUEOUS')],
  alternativeEvidence: [],
};
function history(events: readonly PlanetaryHistorySourceEpisode32_1[] = []) {
  const engine = new PlanetaryHistoryIntervalEngine32_12({
    revision: () => version.sourceRevision,
    readInterval: (_ctx,a,b) => events.filter(e => e.time.startYear <= b && e.time.endYear >= a),
    readByKey: (_ctx,k) => events.find(e=>e.episodeKey===k) ?? null,
  });
  return engine.read({context,version,startYear:100,endYear:149});
}
function trajectory(from:number,to:number,visible=true):HistoricalEnvironmentalState31_7 {
  return {bodyKind:context.bodyKind,bodyKey:context.bodyKey,startYear:from,endYear:to,
    temporalBasis:'DATED_PHYSICAL_TRAJECTORY',sourcePhase:'test-only',
    sourceModel:'SyntheticTemporalSource',sourceRecordKey:`test-${from}-${to}`,
    accessibleToObserver:visible,evidence:[...evidence('SURFACE_AQUEOUS'),...evidence('SUBSURFACE_AQUEOUS')]};
}
function reports(states:readonly HistoricalEnvironmentalState31_7[],
  perspective:'SIMULATED_REALITY'|'OBSERVED_KNOWLEDGE'='SIMULATED_REALITY',
  episodes: readonly PlanetaryHistorySourceEpisode32_1[]=[]){
  const historic=history(episodes);
  const source: HistoricalEnvironmentSource31_7={
    revision:()=> 'audit-env-v1',
    readInterval:(_ctx,from,to)=>states.filter(s=>s.startYear<=to&&s.endYear>=from),
  };
  const windows=HabitabilityHistoricalWindowsResolver31_7.reconstruct({
    history:historic,perspective,environmentSourceRevision:'audit-env-v1',
    observationAccess:{discoveryState:'CONFIRMED',scientificFicheAccessible:true},
  },source);
  const continuity=HabitabilityContinuityResolver31_8.summarize({historicalWindows:windows});
  const stability=HabitabilityEvolutionaryStabilityResolver31_9.assess({
    windows,continuity,history:historic,observedEpisodeIds:[],
  });
  return {windows,continuity,stability};
}
function route<T extends {readonly route:string}>(routes:readonly T[],id='SURFACE_AQUEOUS'):T|undefined {return routes.find(x=>x.route===id);}

describe('GENESIS 31.F — cross-phase scientific closure regression, synthetic inputs only',()=>{
  it('keeps internal incompatibility separate from observed insufficient evidence even in CONFIRMED',()=>{
    const internal=HabitabilityKnowledgeResolver31_12.assessInternal(knowledge);
    const observed=HabitabilityKnowledgeResolver31_12.projectObserved(knowledge,{
      discoveryState:DiscoveryState.CONFIRMED,scientificFicheAccessible:true,
    });
    expect(route(internal.physicalPotential.aqueousIndices.routes)?.['status']).toBe('CONSTRAINTS_INCOMPATIBLE');
    expect(route(observed.aqueousIndices!.routes)?.['status']).toBe('INSUFFICIENT_EVIDENCE');
    expect(observed.lifePresence).toBe('NOT_EVALUATED');
    expect(internal.physicalPotential.lifeProbability).toBe('NOT_DEFINED');
  });
  it('does not publish secret scientific data just because a system is CONFIRMED',()=>{
    const inaccessible=HabitabilityKnowledgeResolver31_12.projectObserved(knowledge,{
      discoveryState:DiscoveryState.CONFIRMED,scientificFicheAccessible:false,
    });
    expect(inaccessible.access).toBe('SCIENTIFIC_FICHE_LOCKED');
    expect(inaccessible.aqueousIndices).toBeNull();
    expect(inaccessible.bodyKey).toBeNull();
  });
  it('does not turn the historical source absence into a compatible interval',()=>{
    const r=reports([]);
    expect(route(r.windows.routes)?.['compatibleWindows']).toEqual([]);
    expect(route(r.continuity.routes)?.['accumulatedCompatibleYearSlots']).toBe(0);
    expect(r.stability.historicalCompleteness).toBe('NOT_ESTABLISHED');
  });
  it('keeps historical continuity separate from accumulated years when source has gaps',()=>{
    const r=reports([trajectory(100,109),trajectory(120,129)]);
    expect(route(r.windows.routes)?.['compatibleWindows']).toHaveLength(2);
    expect(route(r.continuity.routes)?.['accumulatedCompatibleYearSlots']).toBe(20);
    expect(route(r.continuity.routes)?.['longestContinuousCompatibleYearSlots']).toBe(10);
    expect(route(r.stability.routes)?.['unknownContinuityBreaks']).toBe(2);
  });
  it('does not transform a dated impact into an extinction or an environmental response',()=>{
    const event:PlanetaryHistorySourceEpisode32_1={
      episodeKey:'impact-1',targetBodyKind:context.bodyKind,targetBodyKey:context.bodyKey,
      kind:'REALIZED_IMPACT', time:{timeScale:'YEARS_SINCE_SYSTEM_FORMATION',startYear:115,endYear:115,
        resolution:'MODELLED_INSTANT'},
      source:{sourcePhase:'23.13',sourceModel:'RealizedImpact',sourceRecordKey:'impact-source',
        evidenceKind:'RESOLVED_PHYSICAL_EVENT'},causedByEpisodeKeys:[],
    };
    const r=reports([trajectory(100,149)],'SIMULATED_REALITY',[event]);
    expect(route(r.stability.routes)?.['certifiedChanges']).toHaveLength(0);
    expect(r.stability.extinction).toBe('NOT_EVALUATED');
    expect(r.stability.lifePresence).toBe('NOT_EVALUATED');
  });
  it('hidden historic trajectory does not leak a public compatibility window',()=>{
    const r=reports([trajectory(100,149,false)],'OBSERVED_KNOWLEDGE');
    expect(route(r.windows.routes)?.['compatibleWindows']).toEqual([]);
    expect(route(r.continuity.routes)?.['accumulatedCompatibleYearSlots']).toBe(0);
    expect(JSON.stringify(r)).not.toMatch(/test-100-149/);
  });
  it('rejects foreign physical records rather than reconstructing a different planet',()=>{
    expect(()=>reports([{...trajectory(100,110),bodyKey:'foreign-planet'}])).toThrow();
  });
  it('repeated reconstruction is deterministic without changing synthetic sources',()=>{
    const src=Object.freeze([Object.freeze(trajectory(100,109)),Object.freeze(trajectory(120,149))]);
    expect(reports(src)).toEqual(reports([...src].reverse()));
  });
});
