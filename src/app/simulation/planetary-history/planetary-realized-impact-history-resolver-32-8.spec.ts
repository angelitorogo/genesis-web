import { describe, it, expect } from 'vitest';
import { MinorBodyApproachTargetKind } from '../../domain/planetary/minor-body-approach-target-kind';
import { MinorBodyHistoricalImpactEvent } from '../../domain/planetary/minor-body-historical-impact-event';
import { PlanetaryHistoryEngine } from './planetary-history-engine';
import { PlanetaryRealizedImpactHistoryResolver32_8 as Resolver } from './planetary-realized-impact-history-resolver-32-8';
import type { PlanetaryRealizedImpactHistoryInput32_8 as Input } from '../../domain/planetary-history/planetary-realized-impact-history-32-8';
import type { PlanetaryHistorySourceEpisode32_1 } from '../../domain/planetary-history/planetary-history-32-1';
import type { MinorBodyEarlyDeliveryAssessment } from '../../domain/planetary/minor-body-early-delivery-assessment';
import type { PlanetaryImpactHistoryCatalog } from '../../domain/planetary/planetary-impact-history-catalog';

const A = 'A'.repeat(32);
const B = 'B'.repeat(32);
const C = 'C'.repeat(32);
const locator = {galaxyIndex: 0, sectorKey: -47n, galacticObjectIndex: 2n, bodyIndex: 0n};
const k = 'G0/S-47/O2/B0';
const M = `${k}/M0`;
function fixture(multiplicity: 'SINGLE' | 'BINARY' | 'TRIPLE' = 'SINGLE', age: number|null = 4) {
  const star = {multiplicity:{name:multiplicity}, locator};
  const system = {hostStellarSystem:star};
  const planet = {hostPlanetarySystem:system, planetOrdinal:1, locator, seed:{kind:'body',normalizedValue:A}};
  const moon = {hostPlanetOrdinal:1, hostPlanetLocator:locator, hostPlanetSeed:planet.seed,
    moonOrdinal:1, identity:{hostPlanetOrdinal:1, hostPlanetLocator:locator,
      hostPlanetSeed:planet.seed, moonOrdinal:1, locator:{...locator, moonIndex:0n},
      seed:{kind:'moon',normalizedValue:B}}};
  return {planet, moon, time:{kind:'CURRENT_SNAPSHOT' as const,systemAgeBillionYears:age}};
}
type Fixture = ReturnType<typeof fixture>;
function event(f: Fixture, opts: {id?:string; moon?:boolean; after?:number; window?:number;
   water?:number; solid?:boolean; minor?:string} = {}) {
  const kind = opts.moon ? MinorBodyApproachTargetKind.MOON : MinorBodyApproachTargetKind.PLANET;
  const chosen = opts.moon ? f.moon : null;
  const window=opts.window ?? 100, after=opts.after ?? 40, solid=opts.solid ?? true;
  const water=opts.water ?? 12;
  const fx = {impactScenarioApplicable:true, targetPlanet:f.planet, targetMoon:chosen,
    hasSolidSurface:solid, surfaceResponseRegime:{name: solid ? 'CRATERING':'NO_SOLID_SURFACE'},
    craterDiameterKilometers: solid ? 15 : null,
    atmosphericShockIndex01:.4, atmosphericLossPotentialIndex01:.3,
    hydrosphereShockIndex01:solid?.1:null, geologicalShockIndex01: solid?.2:null,
    surfaceWaterVaporizationPotentialIndex01:solid?.12:null,
    ejectaGenerationIndex01:solid?.1:null};
  const delivery={ deliveryScenarioApplicable:true, impactEffectsAssessment:fx,
    energyAssessment:{kineticEnergyJoules:1e18,consequenceRegime:{name:'MAJOR'}},
    targetPlanet:f.planet, targetMoon:chosen, targetKind:kind,
    minorBodyProceduralId:opts.minor ?? A, minorBodyDesignation:'C1',targetName:'target',
    timeWindowYears:window, conditionalRetainedWaterMassKilograms:water,
    conditionalRetainedOrganicCarrierMassProxyKilograms:3 };
  return new MinorBodyHistoricalImpactEvent(opts.id??A,delivery as unknown as MinorBodyEarlyDeliveryAssessment,
    {kind:'history',normalizedValue:C} as never,after,window-after,.6,water,3);
}
function catalog(f:Fixture, events: MinorBodyHistoricalImpactEvent[], extra: {event:MinorBodyHistoricalImpactEvent|null}[] = []):Input['impactHistory'] {
  return {planetarySystem:f.planet.hostPlanetarySystem,
    timeWindowYears:events[0]?.timeWindowYears ?? 100,
    historicalMinorBodyImpactEvents:events,
    minorBodyRealizations:[...events.map(e=>({event:e})),...extra]} as unknown as Pick<PlanetaryImpactHistoryCatalog,
      'planetarySystem'|'timeWindowYears'|'minorBodyRealizations'|'historicalMinorBodyImpactEvents'>;
}
function input(f: Fixture=fixture(), events:MinorBodyHistoricalImpactEvent[]|null=null,
   lunar=false): Input {
  return {planet:f.planet as never, ...(lunar?{moon:f.moon as never}:{}), time:f.time,
    ...(events!==null?{impactHistory:catalog(f,events)}:{})};
}
function prior(f:Fixture) {
  const old:PlanetaryHistorySourceEpisode32_1={episodeKey:'formation',kind:'FORMATION',targetBodyKind:'PLANET',
    targetBodyKey:k, time:{timeScale:'YEARS_SINCE_SYSTEM_FORMATION',startYear:0,endYear:5_000_000,
      resolution:'INFERRED_INTERVAL'},
    source:{sourcePhase:'17.7',sourceModel:'formation',sourceRecordKey:'ancestor',evidenceKind:'INFERRED_PHYSICAL_EPISODE'},
    causedByEpisodeKeys:[]};
  return {preceding:PlanetaryHistoryEngine.build({bodyKind:'PLANET',bodyKey:k,
    multiplicity:f.planet.hostPlanetarySystem.hostStellarSystem.multiplicity.name,
    time:f.time,episodes:[old]}), precedingSourceEpisodes:[old]};
}
function run(v:Input= input()) {return Resolver.resolve(v);}
describe('GENESIS 32.8 — only realized 23.13 impacts in CT-0 causal history',()=>{
  it('keeps missing impact catalogue distinct from supplied empty catalogue',()=>{
    expect(run().impactCoverage).toBe('SOURCE_NOT_SUPPLIED');
    expect(run(input(fixture(),[])).impactCoverage).toBe('SUPPLIED_EVENTS_ONLY');
    expect(run(input(fixture(),[])).chronology.historicalCompleteness).toBe('NOT_ESTABLISHED');
  });
  it('never produces impacts from current risk indicators or empty realizations',()=>{
    const f=fixture();const i=input(f,[]);
    expect(run({...i,impactHistory:catalog(f,[],[{event:null}])}).realizedImpacts).toHaveLength(0);
  });
  it('adds a realized planet impact at present minus source yearsBeforeWindowEnd',()=>{
    const f=fixture();const r=run(input(f,[event(f)]));
    expect(r.realizedImpacts[0].yearSinceFormation).toBe(3_999_999_940);
    expect(r.chronology.episodes[0].kind).toBe('REALIZED_IMPACT');
    expect(r.chronology.episodes[0].time.resolution).toBe('MODELLED_INSTANT');
    expect(r.chronology.episodes[0].source.sourcePhase).toBe('23.13');
  });
  it('retains source offsets and explicit one-year discretization',()=>{
    const f=fixture();const r=run(input(f,[event(f,{after:41.4})]));
    expect(r.realizedImpacts[0].yearsAfterWindowStart).toBe(41.4);
    expect(r.realizedImpacts[0].yearSinceFormation).toBe(3_999_999_941);
  });
  it('preserves actual source energy, atmospheric shock and payload without inventing climate change',()=>{
    const f=fixture();const r=run(input(f,[event(f,{water:90})]));const v=r.realizedImpacts[0];
    expect(v.kineticEnergyJoules).toBe(1e18);
    expect(v.atmosphericShockIndex01).toBe(.4);
    expect(v.realizedRetainedWaterMassKilograms).toBe(90);
    expect(v.radiativeForcingWattsPerSquareMeter).toBeNull();
    expect(v.climateDuration).toBe('NOT_QUANTIFIED');
    expect(v.biologicalEffect).toBe('NOT_EVALUATED');
  });
  it('does not invent crater or surface water on deep-envelope targets',()=>{
    const f=fixture();const r=run(input(f,[event(f,{solid:false})]));
    expect(r.realizedImpacts[0].hasSolidSurface).toBe(false);
    expect(r.realizedImpacts[0].craterDiameterKilometers).toBeNull();
    expect(r.realizedImpacts[0].hydrosphereShockIndex01).toBeNull();
  });
  it('keeps lunar impact out of planet history',()=>{
    const f=fixture();expect(run(input(f,[event(f,{moon:true})])).realizedImpacts).toHaveLength(0);
  });
  it('creates lunar history on canonical moon locator, without contaminating planet',()=>{
    const f=fixture();const r=run(input(f,[event(f,{moon:true})],true));
    expect(r.bodyKind).toBe('MOON');expect(r.bodyKey).toBe(M);
    expect(r.chronology.episodes[0].targetBodyKind).toBe('MOON');
    expect(r.realizedImpacts[0].yearSinceFormation).toBe(3_999_999_940);
  });
  it('does not put a planetary event in a moon chronology',()=>{
    const f=fixture();expect(run(input(f,[event(f)],true)).realizedImpacts).toHaveLength(0);
  });
  it('refuses foreign lunar locator and identity',()=>{
    const f=fixture();const i=input(f,[event(f,{moon:true})],true);
    expect(()=>run({...i,moon:{...f.moon,moonOrdinal:2} as never})).toThrow();
    expect(()=>run({...i,moon:{...f.moon,hostPlanetLocator:{...locator}} as never})).toThrow();
  });
  it('does not date an event before the system formed',()=>{
    const f=fixture('SINGLE', .00000005); const r=run(input(f,[event(f)]));
    expect(r.realizedImpacts[0].dateStatus).toBe('WINDOW_EXCEEDS_SYSTEM_AGE');
    expect(r.realizedImpacts[0].yearSinceFormation).toBeNull();
    expect(r.chronology.episodes).toHaveLength(0);
  });
  it('keeps realized event undated when CT-0 age is unknown',()=>{
    const f=fixture('SINGLE', null); const r=run(input(f,[event(f)]));
    expect(r.realizedImpacts[0].dateStatus).toBe('CT0_AGE_NOT_RESOLVED');
    expect(r.chronology.episodes).toHaveLength(0);
  });
  it('rejects a catalogue belonging to another system',()=>{
    const f=fixture();const i=input(f,[event(f)]);
    expect(()=>run({...i,impactHistory:{...i.impactHistory!,planetarySystem:{}} as never})).toThrow();
  });
  it('rejects fake 23.13 event absent from the realization list',()=>{
    const f=fixture();const ev=event(f),i=input(f,[ev]);
    expect(()=>run({...i,impactHistory:{...i.impactHistory!,minorBodyRealizations:[{event:null}]} as never})).toThrow();
  });
  it('rejects duplicated event in catalogue',()=>{
    const f=fixture();const ev=event(f);expect(()=>run(input(f,[ev,ev]))).toThrow();
  });
  it('rejects two realized impacts from the same minor body',()=>{
    const f=fixture();expect(()=>run(input(f,[event(f),event(f,{id:B})]))).toThrow();
  });
  it('rejects invalid event years, effects, and conditional-only events',()=>{
    const f=fixture(),e=event(f);
    for(const patch of [
      {yearsAfterWindowStart: 300}, {yearsBeforeWindowEnd: -2},
      {deliveryAssessment:{...e.deliveryAssessment, energyAssessment:{kineticEnergyJoules:0}}},
      {deliveryAssessment:{deliveryScenarioApplicable:false,targetPlanet:f.planet}},
    ]) {
      const invalid=Object.assign(Object.create(Object.getPrototypeOf(e)),e,patch);
      expect(()=>run(input(f,[invalid]))).toThrow();
    }
  });
  it('rejects another planet identity from same host system',()=>{
    const f=fixture();const i=input(f,[event(f)]);
    expect(()=>run({...i,planet:{...f.planet,planetOrdinal:2} as never})).toThrow();
    expect(()=>run({...i,planet:{...f.planet,locator:{...locator,sectorKey:-48n}} as never})).toThrow();
  });
  it('preserves preceding formation episode and original causal order',()=>{
    const f=fixture();const r=run({...input(f,[event(f)]),...prior(f)});
    expect(r.chronology.episodes.map(e=>e.kind)).toEqual(['FORMATION','REALIZED_IMPACT']);
    expect(r.sourceEpisodes[0].episodeKey).toBe('formation');
  });
  it('rejects a forged preceding chronology, wrong body and missing source data',()=>{
    const f=fixture();const i=input(f,[event(f)]);const p=prior(f);
    expect(()=>run({...i,preceding:p.preceding})).toThrow();
    expect(()=>run({...i,...p,preceding:{...p.preceding,bodyKey:'wrong'}})).toThrow();
    expect(()=>run({...i,...p,precedingSourceEpisodes:[]})).toThrow();
  });
  it('does not mutate input events, realizations, or preceding episodes',()=>{
    const f=fixture(),e=event(f),i={...input(f,[e]),...prior(f)};
    const old=e.yearsBeforeWindowEnd;
    const src=i.precedingSourceEpisodes[0];
    const r=run(i);expect(e.yearsBeforeWindowEnd).toBe(old);
    expect(i.precedingSourceEpisodes[0]).toBe(src);
    expect(r.realizedImpacts[0].eventId).toBe(A);
  });
  it('returns identical results after permuting event order',()=>{
    const f=fixture();const ea=event(f,{id:A,minor:A,after:33});
    const eb=event(f,{id:B,minor:B,after:74});
    const a=run(input(f,[ea,eb])),b=run(input(f,[eb,ea]));
    expect(a.realizedImpacts).toEqual(b.realizedImpacts);
    expect(a.chronology).toEqual(b.chronology);
  });
  it.each(['SINGLE','BINARY','TRIPLE'] as const)('is independent of host multiplicity: %s', arch=>{
    const f=fixture(arch),r=run(input(f,[event(f)]));
    expect(r.realizedImpacts[0].yearSinceFormation).toBe(3_999_999_940);
    expect(r.chronology.multiplicity).toBe(arch);
  });
  it('does not link unrelated formation collisions from 23.12 as minor-body events',()=>{
    const f=fixture();expect(run(input(f,[])).chronology.episodes).toHaveLength(0);
  });
  it('rejects 23.13 source window mismatch',()=>{
    const f=fixture(),i=input(f,[event(f)]);
    expect(()=>run({...i,impactHistory:{...i.impactHistory!,timeWindowYears:101} as never})).toThrow();
  });
  it('accepts zero-duration window-end collision without exceeding present year',()=>{
    const f=fixture(),r=run(input(f,[event(f,{after:100})]));
    expect(r.realizedImpacts[0].yearSinceFormation).toBe(4_000_000_000);
  });
  it('keeps modelled events private to simulated reality without claiming life',()=>{
    const f=fixture(),r=run(input(f,[event(f)]));
    expect(r.layer).toBe('SIMULATED_REALITY');
    expect(r.lifePresence).toBe('NOT_EVALUATED');
    expect(r.historicalCompleteness).toBe('NOT_ESTABLISHED');
  });
  it('keeps mixed planet and moon impacts in their respective chronicles',()=>{
    const f=fixture(),planetEvent=event(f,{id:A,minor:A,after:45}),
      moonEvent=event(f,{id:B,minor:B,moon:true,after:46});
    const planetHistory=run(input(f,[moonEvent,planetEvent]));
    const moonHistory=run(input(f,[moonEvent,planetEvent],true));
    expect(planetHistory.realizedImpacts.map(e=>e.eventId)).toEqual([A]);
    expect(moonHistory.realizedImpacts.map(e=>e.eventId)).toEqual([B]);
  });
  it('supports 512 source-backed collisions without O(N²) event membership checks',()=>{
    const f=fixture();
    const events=Array.from({length:512},(_,i)=>{
      const id=(i+1).toString(16).toUpperCase().padStart(32,'0');
      return event(f,{id,minor:id,after:(i+.5)/512*100});
    });
    const first=run(input(f,events));
    expect(first.realizedImpacts).toHaveLength(512);
    expect(first.chronology.episodes).toHaveLength(512);
    expect(run(input(f,[...events].reverse())).chronology).toEqual(first.chronology);
  });

});
