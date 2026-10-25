import { HabitabilityContinuityResolver31_8 } from '../habitability/habitability-continuity-resolver-31-8';
import type { HistoricalHabitabilityReport31_7 } from '../../domain/habitability/habitability-historical-windows-31-7';
import type { PlanetaryHistoryIntervalResult32_12 } from '../../domain/planetary-history/planetary-history-interval-32-12';
import type { HabitabilityRoute } from '../../domain/habitability/habitability-scenario';
import type {
 DatedEventConsequencePRE3309, EnvironmentalContinuityReportPRE3309,
 EnvironmentalContinuityRoutePRE3309, EnvironmentalContinuitySegmentPRE3309,
 EnvironmentalContinuityVerdictPRE3309,
} from '../../domain/planetary/environmental-continuity-pre33-09';

const EVENT_KINDS = new Set([
 'ATMOSPHERE_TRANSITION', 'WATER_RESERVOIR_TRANSITION', 'GLACIATION_TRANSITION',
 'VOLCANIC_EPISODE', 'CLIMATE_GEOCHEMISTRY_TRANSITION', 'STELLAR_ENVIRONMENT_CHANGE',
 'REALIZED_IMPACT', 'RESOLVED_TRANSIENT_EFFECT',
]);
const allowedCriteria = new Set(['TEMPERATURE','SOLVENT','PRESSURE','CHEMICAL_ENERGY','IONIZING_DOSE','DYNAMICS']);
const safeYears = (a: number, b: number): number => {
 const length = b - a + 1;
 if (!Number.isSafeInteger(length) || length < 1) throw new RangeError('PRE-33.09 duration exceeds safe CT0 year slots.');
 return length;
};
const validKey = (x: unknown): x is string => typeof x === 'string' && !!x.trim() && x.trim() === x;

/** Read-only join of the canonical 31.7/31.8 dated environmental routes with
 * the real 32.12 interval event ledger. No CT0 snapshot is extrapolated.
 * All environmental history remains UNKNOWN where a sufficient dated source
 * does not exist; an event without quantified impact never causes "extinction".
 */
export class EnvironmentalContinuityEnginePRE3309 {
 private constructor() {}

 static reconstruct(
  history: HistoricalHabitabilityReport31_7,
  episodeSlice: PlanetaryHistoryIntervalResult32_12 | null = null,
  consequences: readonly DatedEventConsequencePRE3309[] = [],
 ): EnvironmentalContinuityReportPRE3309 {
  // This validates ALL 31.7 routes, coverage and inclusive durations and
  // prevents spoofed compatible windows from supplying positive durations.
  HabitabilityContinuityResolver31_8.summarize({historicalWindows:history});
  const header = {
   contractVersion:'PRE-33.09/CT0-DATED-CONTINUITY/v1' as const,
   perspective:history.perspective, access:history.access,
   historicalCompleteness:'NOT_ESTABLISHED' as const,
   eventCatalogCompleteness:'NOT_ESTABLISHED' as const,
   lifePresence:'NOT_EVALUATED' as const, biologicalContinuity:'NOT_EVALUATED' as const,
  };
  if(history.access==='SCIENTIFIC_FICHE_LOCKED') {
   if(episodeSlice!==null || consequences.length>0) throw new RangeError('PRE-33.09 private history cannot leak into locked knowledge.');
   return Object.freeze({...header,bodyKind:null,bodyKey:null,multiplicity:null,
    startYear:null,endYear:null,routes:Object.freeze([])});
  }
  if(history.perspective==='OBSERVED_KNOWLEDGE' && episodeSlice!==null)
   throw new RangeError('PRE-33.09 private 32.12 episode catalog is not an observed source.');
  if(!Array.isArray(consequences) || consequences.length>256)
   throw new RangeError('PRE-33.09 requires bounded event consequences.');
  if(episodeSlice===null && consequences.length) throw new RangeError('PRE-33.09 consequences require a real 32.12 episode source.');
  const from=history.startYear!, to=history.endYear!;
  if(to===Number.MAX_SAFE_INTEGER) throw new RangeError('PRE-33.09 requires a safe exclusive terminal boundary.');
  if(episodeSlice && (episodeSlice.contractVersion!=='32.12-CT0-v1' ||
   episodeSlice.startYear!==from || episodeSlice.endYear!==to ||
   episodeSlice.chronology.bodyKind!==history.bodyKind ||
   episodeSlice.chronology.bodyKey!==history.bodyKey ||
   episodeSlice.chronology.multiplicity!==history.multiplicity ||
   episodeSlice.chronology.layer!=='SIMULATED_REALITY' ||
   episodeSlice.chronology.coverage!=='SUPPLIED_EPISODES_ONLY' ||
   !validKey(episodeSlice.version.sourceRevision) ||
   !Array.isArray(episodeSlice.chronology.episodes) ||
   episodeSlice.chronology.episodes.some(e=>e.targetBodyKind!==history.bodyKind ||
      e.targetBodyKey!==history.bodyKey || e.time.startYear>to || e.time.endYear<from ||
      e.time.timeScale!=='YEARS_SINCE_SYSTEM_FORMATION') ||
   episodeSlice.historicalCompleteness!=='NOT_ESTABLISHED' ||
   episodeSlice.coverage!=='QUERIED_INTERVAL_ONLY'))
   throw new RangeError('PRE-33.09 rejected a foreign or inconsistent interval chronology.');
  const consequenceByKey=new Map<string,DatedEventConsequencePRE3309>();
  const episodes=episodeSlice?.chronology.episodes.filter(e=>EVENT_KINDS.has(e.kind)) ?? [];
  const episodesByKey=new Map(episodes.map(e=>[e.episodeKey,e]));
  for(const c of consequences) {
   const episode=episodesByKey.get(c.episodeKey);
   if(!episode || consequenceByKey.has(c.episodeKey) || !Array.isArray(c.affectedRoutes) ||
      !['UNRESOLVED','QUANTIFIED_DISRUPTION','QUANTIFIED_NON_DISRUPTIVE'].includes(c.outcome) ||
      (c.outcome==='UNRESOLVED' ?
       (c.affectedRoutes.length!==0 || c.physicalResponseSourceKey!==null || c.physicalCriterion!==null) :
       (!validKey(c.physicalResponseSourceKey) || !allowedCriteria.has(c.physicalCriterion ?? '') ||
         episode.source.evidenceKind!=='RESOLVED_PHYSICAL_EVENT' ||
         (c.outcome==='QUANTIFIED_DISRUPTION' && c.affectedRoutes.length===0) ||
         (c.outcome==='QUANTIFIED_NON_DISRUPTIVE' && c.affectedRoutes.length!==0))) ||
      new Set(c.affectedRoutes).size!==c.affectedRoutes.length ||
      c.affectedRoutes.some((route:HabitabilityRoute)=>!history.routes.some(r=>r.route===route)))
    throw new RangeError('PRE-33.09 invalid or unsourced physical consequence.');
   consequenceByKey.set(c.episodeKey,Object.freeze({...c,affectedRoutes:Object.freeze([...c.affectedRoutes])}));
  }
  const routes=history.routes.map(route=>{
   const points=new Set<number>([from,to+1]);
   for(const s of route.segments) {points.add(s.startYear);points.add(s.endYear+1);}
   for(const e of episodes) {points.add(Math.max(from,e.time.startYear));points.add(Math.min(to,e.time.endYear)+1);}
   const sorted=[...points].filter(n=>n>=from && n<=to+1).sort((a,b)=>a-b);
   if(sorted.length>8192) throw new RangeError('PRE-33.09 interval partition exceeds bounded budget.');
   const parts: EnvironmentalContinuitySegmentPRE3309[]=[];
   let origin=0;
   for(let i=0;i<sorted.length-1;i++) {
    const a=sorted[i],b=sorted[i+1]-1;
    if(b<a) continue;
    while(origin<route.segments.length-1 && route.segments[origin].endYear<a) origin++;
    const base=route.segments[origin];
    const overlapping=episodes.filter(e=>e.time.startYear<=b && e.time.endYear>=a);
    let verdict:EnvironmentalContinuityVerdictPRE3309=base.status==='CONSTRAINTS_COMPATIBLE'?'COMPATIBLE':
      base.status==='CONSTRAINTS_INCOMPATIBLE'?'INCOMPATIBLE':
      base.status==='MODEL_NOT_IMPLEMENTED'?'MODEL_NOT_IMPLEMENTED':'UNKNOWN';
    let reason=verdict==='COMPATIBLE'?'DATED_31_7_COMPATIBILITY_NOT_LIFE':
      verdict==='INCOMPATIBLE'?'DATED_31_7_CONTRADICTION':'INSUFFICIENT_DATED_ENVIRONMENT';
    for(const e of overlapping) {
     const c=consequenceByKey.get(e.episodeKey);
     if(c?.outcome==='QUANTIFIED_DISRUPTION' && c.affectedRoutes.includes(route.route)) {
      verdict='INCOMPATIBLE';reason='QUANTIFIED_DATED_ENVIRONMENTAL_DISRUPTION';break;
     }
     if(!c || c.outcome==='UNRESOLVED') {
      if(verdict==='COMPATIBLE') {verdict='UNKNOWN';reason='EVENT_EFFECT_NOT_QUANTIFIED';}
     }
    }
    const item:EnvironmentalContinuitySegmentPRE3309=Object.freeze({startYear:a,endYear:b,
      verdict,physicalEnvironmentRecordKey:base.sourceRecordKey,
      overlappingEventKeys:Object.freeze(overlapping.map(e=>e.episodeKey).sort()),reason});
    const previous=parts[parts.length-1];
    if(previous && previous.endYear+1===item.startYear && previous.verdict===item.verdict &&
       previous.reason===item.reason && previous.physicalEnvironmentRecordKey===item.physicalEnvironmentRecordKey &&
       JSON.stringify(previous.overlappingEventKeys)===JSON.stringify(item.overlappingEventKeys))
     parts[parts.length-1]=Object.freeze({...previous,endYear:item.endYear});
    else parts.push(item);
   }
   let compatible=0,incompatible=0,unknown=0,notImplemented=0,longest=0,run=0,ending=0;
   for(const s of parts) {
    const len=safeYears(s.startYear,s.endYear);
    switch(s.verdict) {
     case 'COMPATIBLE': compatible+=len;run+=len;longest=Math.max(longest,run);break;
     case 'INCOMPATIBLE': incompatible+=len;run=0;break;
     case 'UNKNOWN': unknown+=len;run=0;break;
     case 'MODEL_NOT_IMPLEMENTED': notImplemented+=len;run=0;break;
    }
   }
   ending=parts.at(-1)?.verdict==='COMPATIBLE'?run:0;
   if(![compatible,incompatible,unknown,notImplemented].every(Number.isSafeInteger) ||
      compatible+incompatible+unknown+notImplemented!==safeYears(from,to))
    throw new RangeError('PRE-33.09 temporal partition or duration invariant failed.');
   return Object.freeze({route:route.route,segments:Object.freeze(parts),
    compatibleYearSlots:compatible,longestContinuousYearSlots:longest,
    compatibleAtQueryEndYearSlots:ending,incompatibleYearSlots:incompatible,
    unknownYearSlots:unknown,modelNotImplementedYearSlots:notImplemented,
    coversEntireQueriedIntervalWithDocumentedCompatibility:compatible===safeYears(from,to),
   }) satisfies EnvironmentalContinuityRoutePRE3309;
  });
  return Object.freeze({...header,bodyKind:history.bodyKind,bodyKey:history.bodyKey,
   multiplicity:history.multiplicity,startYear:from,endYear:to,routes:Object.freeze(routes)});
 }
}
