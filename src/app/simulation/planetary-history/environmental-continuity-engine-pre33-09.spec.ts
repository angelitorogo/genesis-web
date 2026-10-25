import { describe, it, expect } from 'vitest';
import { HABITABILITY_REQUIREMENTS_31_1, type HabitabilityEvidence } from '../../domain/habitability/habitability-scenario';
import { PlanetaryHistoryIntervalEngine32_12 } from './planetary-history-interval-engine-32-12';
import { HabitabilityHistoricalWindowsResolver31_7 } from '../habitability/habitability-historical-windows-resolver-31-7';
import { EnvironmentalContinuityEnginePRE3309 as Engine } from './environmental-continuity-engine-pre33-09';
import type { PlanetaryHistorySourceEpisode32_1 } from '../../domain/planetary-history/planetary-history-32-1';
import type { HistoricalEnvironmentalState31_7 } from '../../domain/habitability/habitability-historical-windows-31-7';

const context = {bodyKind:'MOON' as const,bodyKey:'G7/S8/O9/B2/M0',multiplicity:'TRIPLE' as const,
 time:{kind:'CURRENT_SNAPSHOT' as const,systemAgeBillionYears:2}};
const version={universeKey:'V3-EXAMPLE',physicsModelRevision:'v3-33',sourceRevision:'dated-32-12'};
const e:PlanetaryHistorySourceEpisode32_1={
 episodeKey:'DATED-GRB',targetBodyKind:'MOON',targetBodyKey:context.bodyKey,
 kind:'RESOLVED_TRANSIENT_EFFECT',time:{timeScale:'YEARS_SINCE_SYSTEM_FORMATION',startYear:15,endYear:15,resolution:'MODELLED_INSTANT'},
 source:{sourcePhase:'29.7',sourceModel:'GRB-PHYSICAL',sourceRecordKey:'GRB-FLUENCE',evidenceKind:'RESOLVED_PHYSICAL_EVENT'},
 causedByEpisodeKeys:[],
};
const evidence:HabitabilityEvidence[]=(['SURFACE_AQUEOUS','SUBSURFACE_AQUEOUS'] as const).flatMap(route=>
 HABITABILITY_REQUIREMENTS_31_1[route].map(constraint=>({route,constraint,verdict:'SUPPORTS' as const,
 basis:'PHYSICAL_MODEL' as const,accessibleToObserver:true,sourceKey:`dated-${route}-${constraint}`})));
const environment=(a:number,b:number):HistoricalEnvironmentalState31_7=>({bodyKind:context.bodyKind,bodyKey:context.bodyKey,
 startYear:a,endYear:b,temporalBasis:'DATED_PHYSICAL_TRAJECTORY',sourcePhase:'31.F',sourceModel:'PHYSICAL_TRAJECTORY',
 sourceRecordKey:`dated-${a}-${b}`,accessibleToObserver:true,evidence});
function history(episodes:readonly PlanetaryHistorySourceEpisode32_1[]=[e]) {
 return new PlanetaryHistoryIntervalEngine32_12({revision:()=>version.sourceRevision,
 readInterval:()=>episodes,readByKey:(_c,k)=>episodes.find(item=>item.episodeKey===k)??null})
 .read({context,version,startYear:10,endYear:20});
}
function report(states:readonly HistoricalEnvironmentalState31_7[]=[environment(10,20)]){
 return HabitabilityHistoricalWindowsResolver31_7.reconstruct({history:history(),environmentSourceRevision:'E31',
 perspective:'SIMULATED_REALITY'}, {revision:()=> 'E31',readInterval:()=>states});
}
const surface=(x:ReturnType<typeof Engine.reconstruct>)=>x.routes.find(r=>r.route==='SURFACE_AQUEOUS')!;
const subsurface=(x:ReturnType<typeof Engine.reconstruct>)=>x.routes.find(r=>r.route==='SUBSURFACE_AQUEOUS')!;
describe('PRE-33.09 — intervalos CT-0, episodios y continuidad',()=>{
 it('la duración inclusiva no nace del estado CT-0 y no certifica vida',()=>{
  const x=Engine.reconstruct(report());expect(surface(x).compatibleYearSlots).toBe(11);
  expect(x.historicalCompleteness).toBe('NOT_ESTABLISHED');expect(x.lifePresence).toBe('NOT_EVALUATED');
 });
 it('el GRB sin dosimetría interrumpe la certeza pero no causa extinción',()=>{
  const x=Engine.reconstruct(report(),history());expect(surface(x).unknownYearSlots).toBe(1);
  expect(surface(x).incompatibleYearSlots).toBe(0);expect(surface(x).longestContinuousYearSlots).toBe(5);
 });
 it('un efecto cuantificado limita solo la ruta que afecta',()=>{
  const x=Engine.reconstruct(report(),history(),[{episodeKey:e.episodeKey,outcome:'QUANTIFIED_DISRUPTION',
   affectedRoutes:['SURFACE_AQUEOUS'],physicalResponseSourceKey:'SPECTRALLY_MODELED_GY',physicalCriterion:'IONIZING_DOSE'}]);
  expect(surface(x).incompatibleYearSlots).toBe(1);expect(subsurface(x).compatibleYearSlots).toBe(11);
 });
 it('no une segmentos separados por un año sin historia',()=>{
  const x=Engine.reconstruct(report([environment(10,14),environment(16,20)]));
  expect(surface(x).compatibleYearSlots).toBe(10);expect(surface(x).longestContinuousYearSlots).toBe(5);
 });
 it('rechaza una consecuencia no física y no aumenta la cobertura',()=>{
  expect(()=>Engine.reconstruct(report(),history(),[{episodeKey:e.episodeKey,
   outcome:'QUANTIFIED_DISRUPTION',affectedRoutes:['SURFACE_AQUEOUS'],
   physicalResponseSourceKey:null,physicalCriterion:'IONIZING_DOSE'}])).toThrow();
 });
});
