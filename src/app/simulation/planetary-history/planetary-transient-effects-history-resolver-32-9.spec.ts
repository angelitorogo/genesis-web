import { describe, it, expect } from 'vitest';
import { PlanetaryHistoryEngine } from './planetary-history-engine';
import { PlanetaryRealizedImpactHistoryResolver32_8 } from './planetary-realized-impact-history-resolver-32-8';
import { PlanetaryTransientEffectsHistoryResolver32_9 as Resolver } from './planetary-transient-effects-history-resolver-32-9';
import type {PlanetaryTransientEffectsHistoryInput32_9 as Input,
  HistoricalTransientEvent32_9 as Event, HistoricalTransientExposure32_9 as Exposure,
  HistoricalTransientResponse32_9 as Response} from '../../domain/planetary-history/planetary-transient-effects-history-32-9';
import type {PlanetaryHistorySourceEpisode32_1} from '../../domain/planetary-history/planetary-history-32-1';

const loc={galaxyIndex:0,sectorKey:-47n,galacticObjectIndex:2n,bodyIndex:0n};
const P='G0/S-47/O2/B0', M=P+'/M0', SYSTEM='G0/S-47/O2';
const when={timeScale:'YEARS_SINCE_SYSTEM_FORMATION' as const,startYear:3999999980,
  endYear:3999999980,resolution:'MODELLED_INSTANT' as const};
function fixture(multiplicity:'SINGLE'|'BINARY'|'TRIPLE'='SINGLE',age:number|null=4,lunar=false){
  const star={locator:loc,multiplicity:{name:multiplicity}};
  const system={hostStellarSystem:star};
  const planet={hostPlanetarySystem:system,planetOrdinal:1,locator:loc,seed:{kind:'body',normalizedValue:'AA'}};
  const moon={hostPlanetOrdinal:1,hostPlanetLocator:loc,hostPlanetSeed:planet.seed,
    moonOrdinal:1,identity:{hostPlanetOrdinal:1,moonOrdinal:1,hostPlanetLocator:loc,
      hostPlanetSeed:planet.seed,locator:{...loc,moonIndex:0n},seed:{kind:'moon',normalizedValue:'BB'}}};
  const time={kind:'CURRENT_SNAPSHOT' as const,systemAgeBillionYears:age};
  return PlanetaryRealizedImpactHistoryResolver32_8.resolve({planet:planet as never,
    ...(lunar?{moon:moon as never}:{}),time});
}
function event(id='event-1',patch:Partial<Event>={}):Event{
  return {eventId:id,kind:'SUPERNOVA',realization:'RESOLVED_PHYSICAL_EVENT',
    sourcePhase:'29.1',sourceModel:'supernova-event',sourceRecordKey:'record-'+id,
    sourceLocation:{kind:'HOST_COMPONENT',hostComponent:'A',sourceSystemKey:SYSTEM,externalSourceKey:null},
    time:when,...patch};
}
function exposure(id='exp-1',eventId='event-1',target=P,patch:Partial<Exposure>={}):Exposure{
  return {exposureId:id,eventId,targetBodyKind:target===M?'MOON':'PLANET',targetBodyKey:target,
    sourceModel:'transient-transport',sourceRecordKey:id,resolution:'RESOLVED_TARGET_EXPOSURE',
    distanceMeters:5e11,emissionGeometry:'ISOTROPIC_MODEL',beamIntersectsTarget:null,
    receivedFluenceJoulesPerSquareMeter:500,...patch};
}
function response(id='response-1',exp='exp-1',target=P,patch:Partial<Response>={}):Response{
  return {responseId:id,exposureId:exp,targetBodyKind:target===M?'MOON':'PLANET',
    targetBodyKey:target,responseKind:'ATMOSPHERIC_IONIZATION',
    sourceModel:'irradiation-response',sourceRecordKey:id,
    realization:'RESOLVED_PHYSICAL_RESPONSE',responseIndex01:.3,time:when,...patch};
}
function full(pre=fixture()):Input{
  return {preceding:pre,events:[event()],exposures:[exposure()],responses:[response()]};
}
function run(i:Input=full()){return Resolver.resolve(i);}
function oldEvent():PlanetaryHistorySourceEpisode32_1{
  return {episodeKey:'flare:event-1',targetBodyKind:'PLANET',targetBodyKey:P,
    kind:'STELLAR_ENVIRONMENT_CHANGE',time:when,
    source:{sourcePhase:'29.1',sourceModel:'supernova-event',sourceRecordKey:'record-event-1',
      evidenceKind:'RESOLVED_PHYSICAL_EVENT'},causedByEpisodeKeys:[]};
}
function priorWithCause(){
  const old=oldEvent(), prior=PlanetaryHistoryEngine.build({bodyKind:'PLANET',bodyKey:P,
    multiplicity:'SINGLE',time:{kind:'CURRENT_SNAPSHOT',systemAgeBillionYears:4},episodes:[old]});
  const star={locator:loc,multiplicity:{name:'SINGLE'}};
  const planet={hostPlanetarySystem:{hostStellarSystem:star},planetOrdinal:1,locator:loc,
    seed:{kind:'body',normalizedValue:'AA'}};
  return PlanetaryRealizedImpactHistoryResolver32_8.resolve({planet:planet as never,
    time:{kind:'CURRENT_SNAPSHOT',systemAgeBillionYears:4},
    preceding:prior,precedingSourceEpisodes:[old]});
}

describe('GENESIS 32.9 — actual transient exposure and physical response only',()=>{
  it('keeps missing 29 records distinct from supplied empty list',()=>{
    expect(run({preceding:fixture()}).sourceCoverage).toBe('NOT_SUPPLIED');
    expect(run({preceding:fixture(),events:[]}).sourceCoverage).toBe('SUPPLIED_RECORDS_ONLY');
  });
  it('does not turn a resolved supernova itself into planetary damage',()=>{
    const r=run({preceding:fixture(),events:[event()]});
    expect(r.responses).toHaveLength(0);expect(r.chronology.episodes).toHaveLength(0);
  });
  it('does not turn physical exposure alone into damage',()=>{
    const r=run({preceding:fixture(),events:[event()],exposures:[exposure()]});
    expect(r.exposureCount).toBe(1);expect(r.responses).toHaveLength(0);
  });
  it('keeps unknown irradiation unevaluated, not safe or lethal',()=>{
    const e=exposure('exp-1','event-1',P,{resolution:'NOT_EVALUABLE',distanceMeters:null,
      emissionGeometry:'UNRESOLVED',beamIntersectsTarget:null,receivedFluenceJoulesPerSquareMeter:null});
    const r=run({preceding:fixture(),events:[event()],exposures:[e]});
    expect(r.unresolvedExposureCount).toBe(1);expect(r.chronology.episodes).toHaveLength(0);
  });
  it('adds only a resolved response at its own dated CT-0 epoch',()=>{
    const r=run();expect(r.chronology.episodes).toHaveLength(1);
    expect(r.chronology.episodes[0].kind).toBe('RESOLVED_TRANSIENT_EFFECT');
    expect(r.chronology.episodes[0].time.startYear).toBe(3999999980);
    expect(r.chronology.episodes[0].source.sourcePhase).toBe('29.1');
  });
  it('keeps event, target exposure and response provenance separate',()=>{
    const r=run();expect(r.responses[0].sourceEventId).toBe('event-1');
    expect(r.responses[0].exposureId).toBe('exp-1');
    expect(r.responses[0].responseSourceModel).toBe('irradiation-response');
  });
  it('preserves received fluence without inventing atmospheric loss or extinction',()=>{
    const x=run().responses[0];expect(x.receivedFluenceJoulesPerSquareMeter).toBe(500);
    expect(x.atmosphericMassChangeKilograms).toBeNull();
    expect(x.climateTemperatureChangeKelvin).toBeNull();
    expect(x.biologicalEffect).toBe('NOT_EVALUATED');
  });
  it('does not require life or resolve any biology',()=>{
    expect(run().lifePresence).toBe('NOT_EVALUATED');
    expect(run().chronology.lifePresence).toBe('NOT_EVALUATED');
  });
  it('rejects a statistical frequency misrepresented as a physical event',()=>{
    expect(()=>run({...full(),events:[event('event-1',{realization:'STATISTICAL_ONLY' as never})]})).toThrow();
  });
  it('rejects source phases outside 29 and unsupported event kinds',()=>{
    expect(()=>run({...full(),events:[event('event-1',{sourcePhase:'15.4' as never})]})).toThrow();
    expect(()=>run({...full(),events:[event('event-1',{kind:'FAKE' as never})]})).toThrow();
  });
  it('rejects missing and duplicated event identities',()=>{
    expect(()=>run({...full(),events:[]})).toThrow();
    expect(()=>run({...full(),events:[event(),event()]})).toThrow();
  });
  it('rejects a duplicate authoritative event under a different event ID',()=>{
    expect(()=>run({...full(),events:[event(),event('event-2',{sourceRecordKey:'record-event-1'})]})).toThrow();
  });
  it('accepts a distinct external source with explicit identity',()=>{
    const e=event('event-1',{sourceLocation:{kind:'EXTERNAL_SOURCE',hostComponent:null,
      sourceSystemKey:null,externalSourceKey:'G1/S-30/O9'}});
    expect(run({...full(),events:[e]}).responses).toHaveLength(1);
  });
  it('rejects wrong host system identity instead of using another binary star',()=>{
    const e=event('event-1',{sourceLocation:{kind:'HOST_COMPONENT',hostComponent:'A',
      sourceSystemKey:'G0/S-999/O2',externalSourceKey:null}});
    expect(()=>run({...full(),events:[e]})).toThrow();
  });
  it('rejects component B in SINGLE and component C in BINARY',()=>{
    const a=full();
    expect(()=>run({...a,events:[event('event-1',{sourceLocation:{kind:'HOST_COMPONENT',
      hostComponent:'B',sourceSystemKey:SYSTEM,externalSourceKey:null}})]})).toThrow();
    const b=full(fixture('BINARY'));
    expect(()=>run({...b,events:[event('event-1',{sourceLocation:{kind:'HOST_COMPONENT',
      hostComponent:'C',sourceSystemKey:SYSTEM,externalSourceKey:null}})]})).toThrow();
  });
  it('permits B in BINARY and C in TRIPLE without treating them as A',()=>{
    for(const [m,c] of [['BINARY','B'],['TRIPLE','C']] as const){
      const i=full(fixture(m));i.events![0].sourceLocation.hostComponent;
      const r=run({...i,events:[event('event-1',{sourceLocation:{kind:'HOST_COMPONENT',
        hostComponent:c,sourceSystemKey:SYSTEM,externalSourceKey:null}})]});
      expect(r.responses[0].sourceComponent).toBe(c);
    }
  });
  it('forbids external sources masquerading as local components',()=>{
    expect(()=>run({...full(),events:[event('event-1',{sourceLocation:{kind:'EXTERNAL_SOURCE',
      hostComponent:'A',sourceSystemKey:null,externalSourceKey:'G1/S2/O3'}})]})).toThrow();
  });
  it('requires physically resolved distance and fluence for exposure',()=>{
    for(const patch of [{distanceMeters:null},{distanceMeters:0},
      {receivedFluenceJoulesPerSquareMeter:null},{receivedFluenceJoulesPerSquareMeter:-1}]){
      expect(()=>run({...full(),exposures:[exposure('exp-1','event-1',P,patch)]})).toThrow();
    }
  });
  it('does not claim a GRB beam hit when direction is unknown',()=>{
    const i=full();expect(()=>run({...i,events:[event('event-1',{kind:'GRB'})]})).toThrow();
  });
  it('supports a directionally resolved GRB intersecting the planet',()=>{
    const i=full();const r=run({...i,events:[event('event-1',{kind:'GRB'})],
      exposures:[exposure('exp-1','event-1',P,{emissionGeometry:'DIRECTIONALLY_RESOLVED',
        beamIntersectsTarget:true})]});
    expect(r.responses[0].sourceEventKind).toBe('GRB');
  });
  it('does not attribute nonzero fluence to a beam missing the planet',()=>{
    expect(()=>run({...full(),events:[event('event-1',{kind:'GRB'})],
      exposures:[exposure('exp-1','event-1',P,{emissionGeometry:'DIRECTIONALLY_RESOLVED',
        beamIntersectsTarget:false})]})).toThrow();
  });
  it('does not turn a physically missed beam into planetary damage',()=>{
    expect(()=>run({...full(),events:[event('event-1',{kind:'GRB'})],
      exposures:[exposure('exp-1','event-1',P,{emissionGeometry:'DIRECTIONALLY_RESOLVED',
        beamIntersectsTarget:false,receivedFluenceJoulesPerSquareMeter:0})]})).toThrow();
  });
  it('rejects a made-up response if the target fluence is unknown',()=>{
    const e=exposure('exp-1','event-1',P,{resolution:'NOT_EVALUABLE',distanceMeters:null,
      emissionGeometry:'UNRESOLVED',beamIntersectsTarget:null,receivedFluenceJoulesPerSquareMeter:null});
    expect(()=>run({...full(),exposures:[e]})).toThrow();
  });
  it('rejects responses on the wrong body or a missing exposure',()=>{
    expect(()=>run({...full(),responses:[response('response-1','exp-1',M)]})).toThrow();
    expect(()=>run({...full(),responses:[response('response-1','missing')]})).toThrow();
  });
  it('rejects a response with missing physical consequence or invalid proxy',()=>{
    expect(()=>run({...full(),responses:[response('response-1','exp-1',P,{realization:'RISK_ONLY' as never})]})).toThrow();
    expect(()=>run({...full(),responses:[response('response-1','exp-1',P,{responseIndex01:2})]})).toThrow();
    expect(()=>run({...full(),responses:[response('response-1','exp-1',P,{responseIndex01:0})]})).toThrow();
  });
  it('rejects duplicate response IDs and duplicated response provenance',()=>{
    const i=full();expect(()=>run({...i,responses:[response(),response()]})).toThrow();
    expect(()=>run({...i,responses:[response(),response('response-2','exp-1',P,
      {sourceRecordKey:'response-1'})]})).toThrow();
  });
  it('rejects duplicate exposures and duplicated target exposure provenance',()=>{
    const i=full();expect(()=>run({...i,exposures:[exposure(),exposure()]})).toThrow();
    expect(()=>run({...i,exposures:[exposure(),exposure('exp-2','event-1',P,
      {sourceRecordKey:'exp-1'})]})).toThrow();
  });
  it('rejects a physical consequence occurring before its source event',()=>{
    const earlier={...when,startYear:3999999970,endYear:3999999970};
    expect(()=>run({...full(),responses:[response('response-1','exp-1',P,{time:earlier})]})).toThrow();
  });
  it('rejects future dates and impossible intervals',()=>{
    const later={...when,startYear:4000000010,endYear:4000000010};
    expect(()=>run({...full(),responses:[response('response-1','exp-1',P,{time:later})]})).toThrow();
    const broken={...when,endYear:3999999981};
    expect(()=>run({...full(),responses:[response('response-1','exp-1',P,{time:broken})]})).toThrow();
  });
  it('retains a real but undated effect without creating a fake chronological episode',()=>{
    const r=run({...full(),responses:[response('response-1','exp-1',P,{time:null})]});
    expect(r.responses[0].dateStatus).toBe('RESPONSE_DATE_NOT_RESOLVED');
    expect(r.chronology.episodes).toHaveLength(0);
  });
  it('retains an unresolved source epoch if the response has its own justified date',()=>{
    const r=run({...full(),events:[event('event-1',{time:null})]});
    expect(r.chronology.episodes).toHaveLength(1);
  });
  it('supports unknown CT-0 age without manufacturing dated history',()=>{
    const i=full(fixture('SINGLE',null));
    const r=run({...i,events:[event('event-1',{time:null})],
      responses:[response('response-1','exp-1',P,{time:null})]});
    expect(r.responses).toHaveLength(1);expect(r.chronology.episodes).toHaveLength(0);
  });
  it('separates planet and moon target histories for the same outburst',()=>{
    const i=full();const r=run({...i,exposures:[exposure(),exposure('moon-ex','event-1',M)],
      responses:[response(),response('moon-re','moon-ex',M)]});
    expect(r.responses).toHaveLength(1);expect(r.responses[0].targetBodyKey).toBe(P);
    const lunar=fixture('SINGLE',4,true);
    const m=run({...i,preceding:lunar,exposures:[exposure(),exposure('moon-ex','event-1',M)],
      responses:[response(),response('moon-re','moon-ex',M)]});
    expect(m.bodyKind).toBe('MOON');expect(m.responses).toHaveLength(1);
    expect(m.responses[0].targetBodyKey).toBe(M);
  });
  it('preserves physically dated preceding stellar records and valid causal edges',()=>{
    const i=full(priorWithCause());const r=run({...i,responses:[response('response-1','exp-1',P,
      {causedByEpisodeKey:'flare:event-1'})]});
    expect(r.chronology.episodes).toHaveLength(2);
    expect(r.chronology.episodes[1].causedByEpisodeIds).toHaveLength(1);
  });
  it('rejects fabricated or unrelated stellar causal links',()=>{
    const i=full(priorWithCause());
    expect(()=>run({...i,responses:[response('response-1','exp-1',P,
      {causedByEpisodeKey:'unknown'})]})).toThrow();
    expect(()=>run({...full(),responses:[response('response-1','exp-1',P,
      {causedByEpisodeKey:'flare:event-1'})]})).toThrow();
  });
  it('does not overwrite the legitimate impact/stellar chronology',()=>{
    const preceding=priorWithCause(); const i=full(preceding);
    const r=run(i); expect(r.chronology.episodes.map(e=>e.kind).sort()).toEqual(
      ['RESOLVED_TRANSIENT_EFFECT','STELLAR_ENVIRONMENT_CHANGE']);
    expect(r.sourceEpisodes[0]).toEqual(preceding.sourceEpisodes[0]);
  });
  it('rejects forged preceding history even if it carries a correct version label',()=>{
    const i=full();
    expect(()=>run({...i,preceding:{...i.preceding,
      chronology:{...i.preceding.chronology,episodes:[{episodeKey:'spoof'}]}} as never})).toThrow();
  });
  it('is independent of caller insertion order for separate resolved responses',()=>{
    const i=full();const x=event('event-2',{sourceRecordKey:'record-event-2'}),
      y=exposure('exp-2','event-2',P),z=response('response-2','exp-2',P);
    const a=run({...i,events:[...i.events!,x],exposures:[...i.exposures!,y],responses:[...i.responses!,z]});
    const b=run({...i,events:[x,...i.events!],exposures:[y,...i.exposures!],responses:[z,...i.responses!]});
    expect(a.chronology).toEqual(b.chronology);expect(a.responses).toEqual(b.responses);
  });
  it('does not mutate event, exposure or response source objects',()=>{
    const i=full();const before=JSON.stringify({events:i.events,exposures:i.exposures,responses:i.responses});
    run(i);expect(JSON.stringify({events:i.events,exposures:i.exposures,responses:i.responses})).toBe(before);
  });
  it('bounds input arrays and rejects orphan response collections',()=>{
    const i=full();expect(()=>run({...i,events:undefined,responses:i.responses})).toThrow();
    expect(()=>run({...i,exposures:undefined,responses:i.responses})).toThrow();
  });
  it('handles multiple already-resolved events without quadratic cross-target scanning',()=>{
    const pre=fixture();const es:Event[]=[],xs:Exposure[]=[],rs:Response[]=[];
    for(let j=0;j<512;j++){
      const e='E'+j,x='X'+j,r='R'+j;
      es.push(event(e,{sourceRecordKey:e}));xs.push(exposure(x,e,P));rs.push(response(r,x,P));
    }
    const result=run({preceding:pre,events:es,exposures:xs,responses:rs});
    expect(result.responses).toHaveLength(512);
    expect(result.chronology.episodes).toHaveLength(512);
  });
});
