import {describe,it,expect} from 'vitest';
import {PlanetaryRealizedImpactHistoryResolver32_8} from './planetary-realized-impact-history-resolver-32-8';
import {PlanetaryTransientEffectsHistoryResolver32_9} from './planetary-transient-effects-history-resolver-32-9';
import {PlanetaryBiosphereHistoryResolver32_10 as Resolver} from './planetary-biosphere-history-resolver-32-10';
import type {
  PlanetaryBiosphereHistoryInput32_10 as Input,
  ResolvedBiospherePresence32_10 as Biosphere,
  ResolvedBiologicalHistoryEvent32_10 as BiologicalEvent,
  ResolvedEnvironmentalRecoveryEvidence32_10 as Environmental,
} from '../../domain/planetary-history/planetary-biosphere-history-32-10';

const loc={galaxyIndex:0,sectorKey:-47n,galacticObjectIndex:2n,bodyIndex:0n};
const P='G0/S-47/O2/B0';
const M=P+'/M0';
const SYSTEM='G0/S-47/O2';
const causeYear=3999999900;
const eventYear=3999999980;
const instant=(year:number)=>({timeScale:'YEARS_SINCE_SYSTEM_FORMATION' as const,
  startYear:year,endYear:year,resolution:'MODELLED_INSTANT' as const});
function prior(multiplicity:'SINGLE'|'BINARY'|'TRIPLE'='SINGLE',lunar=false,age:number|null=4){
  const system={hostStellarSystem:{locator:loc,multiplicity:{name:multiplicity}}};
  const planet={hostPlanetarySystem:system,planetOrdinal:1,locator:loc,
    seed:{kind:'body',normalizedValue:'AA'}};
  const moon={hostPlanetOrdinal:1,hostPlanetLocator:loc,hostPlanetSeed:planet.seed,
    moonOrdinal:1,identity:{hostPlanetOrdinal:1,moonOrdinal:1,hostPlanetLocator:loc,
      hostPlanetSeed:planet.seed,locator:{...loc,moonIndex:0n},
      seed:{kind:'moon',normalizedValue:'BB'}}};
  const base=PlanetaryRealizedImpactHistoryResolver32_8.resolve({planet:planet as never,
    ...(lunar?{moon:moon as never}:{}),time:{kind:'CURRENT_SNAPSHOT',systemAgeBillionYears:age}});
  if(age===null)return PlanetaryTransientEffectsHistoryResolver32_9.resolve({preceding:base});
  const target=lunar?M:P;
  return PlanetaryTransientEffectsHistoryResolver32_9.resolve({preceding:base,
    events:[{eventId:'flare1',kind:'STELLAR_FLARE',realization:'RESOLVED_PHYSICAL_EVENT',
      sourcePhase:'29.9',sourceModel:'flare-event',sourceRecordKey:'flare-source',
      sourceLocation:{kind:'HOST_COMPONENT',hostComponent:'A',sourceSystemKey:SYSTEM,
        externalSourceKey:null},time:instant(causeYear)}],
    exposures:[{exposureId:'ex1',eventId:'flare1',targetBodyKind:lunar?'MOON':'PLANET',
      targetBodyKey:target,sourceModel:'irradiation-exposure',sourceRecordKey:'ex1',
      resolution:'RESOLVED_TARGET_EXPOSURE',distanceMeters:1e11,
      emissionGeometry:'ISOTROPIC_MODEL',beamIntersectsTarget:null,
      receivedFluenceJoulesPerSquareMeter:500}],
    responses:[{responseId:'damage1',exposureId:'ex1',targetBodyKind:lunar?'MOON':'PLANET',
      targetBodyKey:target,responseKind:'SURFACE_IRRADIATION',sourceModel:'surface-response',
      sourceRecordKey:'damage1',realization:'RESOLVED_PHYSICAL_RESPONSE',
      responseIndex01:.35,time:instant(causeYear)}]});
}
const causeKey='transient-effect:damage1';
function biosphere(target=P,kind:'PLANET'|'MOON'='PLANET',patch:Partial<Biosphere>={}):Biosphere{
  return {targetBodyKind:kind,targetBodyKey:target,realization:'RESOLVED_EXISTING_BIOSPHERE',
    establishedYear:3900000000,sourcePhase:'33.4',sourceModel:'future-biosphere-engine',
    sourceRecordKey:'future-source-biosphere',...patch};
}
function bio(id='ext1',kind:'MASS_EXTINCTION'|'BIOTIC_RECOVERY'='MASS_EXTINCTION',
  target=P,bodyKind:'PLANET'|'MOON'='PLANET',patch:Partial<BiologicalEvent>={}):BiologicalEvent{
  return {eventId:id,targetBodyKind:bodyKind,targetBodyKey:target,kind,
    realization:'RESOLVED_BIOLOGICAL_EVENT',sourcePhase:'34.5',
    sourceModel:'future-evolution-engine',sourceRecordKey:id,time:instant(eventYear),
    causedByPhysicalEpisodeKey:kind==='MASS_EXTINCTION'?causeKey:null,
    causedByExtinctionEventId:kind==='BIOTIC_RECOVERY'?'ext1':null,...patch};
}
function env(target=P,bodyKind:'PLANET'|'MOON'='PLANET',patch:Partial<Environmental>={}):Environmental{
  return {recordId:'recovery1',targetBodyKind:bodyKind,targetBodyKey:target,
    realization:'RESOLVED_PHYSICAL_COMPARISON',sourcePhase:'32.6',
    sourceModel:'future-climate-time-slices',sourceRecordKey:'climate1',
    disturbanceEpisodeKey:causeKey,metric:'MEAN_SURFACE_TEMPERATURE_K',
    before:{year:causeYear-1,value:280},disturbed:{year:causeYear,value:330},
    later:{year:causeYear+10,value:300},...patch};
}
function run(input:Input={preceding:prior()}){return Resolver.resolve(input);}

describe('GENESIS 32.10 — extinction/recovery gated by actual biosphere',()=>{
  it('keeps absent biosphere source distinct from absent life',()=>{
    const r=run();expect(r.biosphereCoverage).toBe('NOT_SUPPLIED');
    expect(r.lifePresence).toBe('NOT_EVALUATED_BY_32_10');
    expect(r.biologicalEvents).toHaveLength(0);
  });
  it('distinguishes explicit missing resolved biosphere from knowledge of no life',()=>{
    const r=run({preceding:prior(),biosphere:null});
    expect(r.biosphereCoverage).toBe('NO_RESOLVED_BIOSPHERE');
    expect(r.lifePresence).toBe('NOT_EVALUATED_BY_32_10');
  });
  it('never creates extinction from resolved physical damage alone',()=>{
    const r=run();expect(r.chronology.episodes).toHaveLength(1);
    expect(r.biologicalEvents).toHaveLength(0);
  });
  it('never creates extinction just because the source says biosphere existed',()=>{
    const r=run({preceding:prior(),biosphere:biosphere()});
    expect(r.biologicalEvents).toHaveLength(0);
  });
  it('does not call an explicit empty biological list complete history',()=>{
    const r=run({preceding:prior(),biosphere:biosphere(),biologicalEvents:[]});
    expect(r.biologicalEventCoverage).toBe('SUPPLIED_RECORDS_ONLY');
    expect(r.historicalCompleteness).toBe('NOT_ESTABLISHED');
  });
  it('rejects invented extinction without prior resolved biosphere',()=>{
    expect(()=>run({preceding:prior(),biologicalEvents:[bio()]})).toThrow();
    expect(()=>run({preceding:prior(),biosphere:null,biologicalEvents:[bio()]})).toThrow();
  });
  it('accepts a source-backed extinction after a future resolved biosphere record',()=>{
    const r=run({preceding:prior(),biosphere:biosphere(),biologicalEvents:[bio()]});
    expect(r.biologicalEvents).toHaveLength(1);
    expect(r.biologicalEvents[0].kind).toBe('MASS_EXTINCTION');
    expect(r.biologicalEvents[0].lossFraction).toBeNull();
  });
  it('rejects an extinction dated before actual biosphere presence',()=>{
    expect(()=>run({preceding:prior(),biosphere:biosphere(P,'PLANET',{establishedYear:eventYear+1}),
      biologicalEvents:[bio()]})).toThrow();
  });
  it('requires a recoverable biological episode, not a climate recovery index',()=>{
    expect(()=>run({preceding:prior(),biosphere:biosphere(),
      biologicalEvents:[bio('rec1','BIOTIC_RECOVERY')]})).toThrow();
  });
  it('accepts an actual recovery following a resolved extinction',()=>{
    const r=run({preceding:prior(),biosphere:biosphere(),biologicalEvents:[
      bio(),bio('rec1','BIOTIC_RECOVERY',P,'PLANET',{time:instant(eventYear+5)})]});
    expect(r.biologicalEvents).toHaveLength(2);
    expect(r.biologicalEvents[1].causedByExtinctionEventId).toBe('ext1');
    expect(r.biologicalEvents[1].recoveryDurationYears).toBeNull();
  });
  it('rejects biological recovery before the extinction has finished',()=>{
    expect(()=>run({preceding:prior(),biosphere:biosphere(),biologicalEvents:[
      bio(),bio('rec1','BIOTIC_RECOVERY')]})).toThrow();
  });
  it('rejects a recovered event that references another recovery',()=>{
    const events=[bio(),bio('rec1','BIOTIC_RECOVERY',P,'PLANET',{time:instant(eventYear+2)}),
      bio('rec2','BIOTIC_RECOVERY',P,'PLANET',{
        time:instant(eventYear+4),causedByExtinctionEventId:'rec1'})];
    expect(()=>run({preceding:prior(),biosphere:biosphere(),biologicalEvents:events})).toThrow();
  });
  it('does not assume a catastrophe caused a mass extinction absent a declared link',()=>{
    const r=run({preceding:prior(),biosphere:biosphere(),
      biologicalEvents:[bio('ext1','MASS_EXTINCTION',P,'PLANET',{causedByPhysicalEpisodeKey:null})]});
    expect(r.biologicalEvents[0].causedByPhysicalEpisodeId).toBeNull();
  });
  it('rejects fabricated physical episode links',()=>{
    expect(()=>run({preceding:prior(),biosphere:biosphere(),biologicalEvents:[
      bio('ext1','MASS_EXTINCTION',P,'PLANET',{causedByPhysicalEpisodeKey:'unknown'})]})).toThrow();
  });
  it('rejects a physical cause occurring after the biological event',()=>{
    expect(()=>run({preceding:prior(),biosphere:biosphere(),biologicalEvents:[
      bio('ext1','MASS_EXTINCTION',P,'PLANET',{time:instant(causeYear-1)})]})).toThrow();
  });
  it('rejects false biological realization or pre-biology provenance',()=>{
    expect(()=>run({preceding:prior(),biosphere:biosphere(),biologicalEvents:[
      bio('ext1','MASS_EXTINCTION',P,'PLANET',{realization:'POTENTIAL_ONLY' as never})]})).toThrow();
    expect(()=>run({preceding:prior(),biosphere:biosphere(),biologicalEvents:[
      bio('ext1','MASS_EXTINCTION',P,'PLANET',{sourcePhase:'32.9'})]})).toThrow();
  });
  it('rejects invented biosphere from habitability rather than biological source',()=>{
    expect(()=>run({preceding:prior(),biosphere:biosphere(P,'PLANET',{
      sourcePhase:'31.6'})})).toThrow();
  });
  it('rejects mismatched planetary or lunar biosphere identity',()=>{
    expect(()=>run({preceding:prior(),biosphere:biosphere(M,'MOON')})).toThrow();
    expect(()=>run({preceding:prior(),biosphere:biosphere(),
      biologicalEvents:[bio('ext1','MASS_EXTINCTION',M,'MOON')]})).toThrow();
  });
  it('accepts lunar source-backed extinction independently from parent planet',()=>{
    const r=run({preceding:prior('TRIPLE',true),biosphere:biosphere(M,'MOON'),
      biologicalEvents:[bio('ext1','MASS_EXTINCTION',M,'MOON')]});
    expect(r.bodyKind).toBe('MOON');expect(r.bodyKey).toBe(M);
    expect(r.biologicalEvents).toHaveLength(1);
  });
  it('rejects duplicate biological event IDs and duplicate provenance',()=>{
    const b=biosphere();
    expect(()=>run({preceding:prior(),biosphere:b,biologicalEvents:[bio(),bio()]})).toThrow();
    expect(()=>run({preceding:prior(),biosphere:b,biologicalEvents:[bio(),
      bio('ext2','MASS_EXTINCTION',P,'PLANET',{sourceRecordKey:'ext1'})]})).toThrow();
  });
  it('sorts biological events deterministically despite input order',()=>{
    const events=[bio('e3','MASS_EXTINCTION',P,'PLANET',{time:instant(eventYear+7)}),
      bio(),bio('e2','MASS_EXTINCTION',P,'PLANET',{time:instant(eventYear+1)})];
    const a=run({preceding:prior(),biosphere:biosphere(),biologicalEvents:events});
    const b=run({preceding:prior(),biosphere:biosphere(),biologicalEvents:[...events].reverse()});
    expect(a.biologicalEvents).toEqual(b.biologicalEvents);
  });
  it('does not generate environmental restoration without resolved time series',()=>{
    expect(run().environmentalRecoveries).toHaveLength(0);
  });
  it('permits verified physical improvement without any biology',()=>{
    const r=run({preceding:prior(),environmentalRecoveries:[env()]});
    expect(r.environmentalRecoveries).toHaveLength(1);
    expect(r.environmentalRecoveries[0].biologicalConsequence).toBe('NOT_EVALUATED');
    expect(r.environmentalRecoveries[0].returnedFractionOfDisturbance).toBeCloseTo(.6);
    expect(r.biologicalEvents).toHaveLength(0);
  });
  it('requires source-backed disturbance for environmental comparison',()=>{
    expect(()=>run({preceding:prior(),environmentalRecoveries:[
      env(P,'PLANET',{disturbanceEpisodeKey:'inferred-risk-only'})]})).toThrow();
  });
  it('rejects non-improving, fixed or worse environmental states',()=>{
    for(const value of [330,335]){
      expect(()=>run({preceding:prior(),environmentalRecoveries:[
        env(P,'PLANET',{later:{year:causeYear+5,value}})]})).toThrow();
    }
    expect(()=>run({preceding:prior(),environmentalRecoveries:[
      env(P,'PLANET',{disturbed:{year:causeYear,value:280}})]})).toThrow();
  });
  it('rejects future epochs, inverted or undated environmental samples',()=>{
    expect(()=>run({preceding:prior(),environmentalRecoveries:[
      env(P,'PLANET',{later:{year:4000000001,value:300}})]})).toThrow();
    expect(()=>run({preceding:prior(),environmentalRecoveries:[
      env(P,'PLANET',{before:{year:causeYear,value:280}})]})).toThrow();
    expect(()=>run({preceding:prior(),environmentalRecoveries:[
      env(P,'PLANET',{later:{year:causeYear,value:300}})]})).toThrow();
  });
  it('rejects invalid metric dimensions or nonphysical values',()=>{
    expect(()=>run({preceding:prior(),environmentalRecoveries:[
      env(P,'PLANET',{metric:'ICE_COVERAGE_01',later:{year:causeYear+2,value:1.4}})]})).toThrow();
    expect(()=>run({preceding:prior(),environmentalRecoveries:[
      env(P,'PLANET',{metric:'GAS_PRESSURE_PA',disturbed:{year:causeYear,value:-1}})]})).toThrow();
  });
  it('rejects a physical recovery attached to a foreign body',()=>{
    expect(()=>run({preceding:prior(),environmentalRecoveries:[env(M,'MOON')]})).toThrow();
  });
  it('rejects duplicate environmental observations and provenance',()=>{
    expect(()=>run({preceding:prior(),environmentalRecoveries:[env(),env()]})).toThrow();
    expect(()=>run({preceding:prior(),environmentalRecoveries:[env(),
      env(P,'PLANET',{recordId:'rec2'})]})).toThrow();
  });
  it('preserves exactly the physical chronology and CT-0 source episodes from 32.9',()=>{
    const p=prior();const r=run({preceding:p,biosphere:biosphere(),biologicalEvents:[bio()],
      environmentalRecoveries:[env()]});
    expect(r.chronology).toBe(p.chronology);
    expect(r.sourceEpisodes).toBe(p.sourceEpisodes);
    expect(r.chronology.episodes).toHaveLength(p.chronology.episodes.length);
    expect(r.chronology.lifePresence).toBe('NOT_EVALUATED');
  });
  it('works in SINGLE, BINARY and TRIPLE without changing the rules',()=>{
    for(const mul of ['SINGLE','BINARY','TRIPLE'] as const){
      const r=run({preceding:prior(mul),environmentalRecoveries:[env()]});
      expect(r.environmentalRecoveries).toHaveLength(1);
      expect(r.chronology.multiplicity).toBe(mul);
    }
  });
  it('rejects materialized episodes when CT-0 system age is unknown',()=>{
    expect(()=>run({preceding:prior('SINGLE',false,null),biosphere:biosphere()})).toThrow();
    expect(run({preceding:prior('SINGLE',false,null)}).biologicalEvents).toHaveLength(0);
  });
  it('does not mutate source observations',()=>{
    const b=biosphere(),e=bio(),r=env(),p=prior();
    const before=[b.establishedYear,e.time.startYear,r.later.value];
    run({preceding:p,biosphere:b,biologicalEvents:[e],environmentalRecoveries:[r]});
    expect([b.establishedYear,e.time.startYear,r.later.value]).toEqual(before);
  });
  it('sorts 512 supplied recoveries in stable order and preserves coverage',()=>{
    const records=Array.from({length:512},(_,i)=>env(P,'PLANET',{
      recordId:'rec-'+i,sourceRecordKey:'src-'+i,
      later:{year:causeYear+1+(i%90),value:300}}));
    const r=run({preceding:prior(),environmentalRecoveries:records.reverse()});
    expect(r.environmentalRecoveries).toHaveLength(512);
    expect(r.environmentalRecoveries[0].later.year).toBe(causeYear+1);
    expect(r.environmentalCoverage).toBe('SUPPLIED_RECORDS_ONLY');
  });
});
