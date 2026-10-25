import type { Planet } from '../../domain/planetary/planet';
import type { Atmosphere } from '../../domain/planetary/atmosphere';
import type { PlanetH2OFormationContractPRE3303A } from '../../domain/planetary/planet-h2o-formation-contract-pre33-03a';
import type { PlanetaryVolatilesHistoryResult32_3 } from '../../domain/planetary-history/planetary-volatiles-history-32-3';
import type { H2ODatedSegmentPRE3303A1, H2ODatedTransferPRE3303A1,
  H2ODatedHistoryPRE3303A1 } from '../../domain/planetary/planet-h2o-evolution-contract-pre33-03a1';
import { PRE3303A2A_STELLAR_EVOLUTION, type PlanetH2OStellarInputPRE3303A2A,
  type PRE3303A2AStatus, type PlanetH2OStellarEvolutionResultPRE3303A2A } from
  '../../domain/planetary/planet-h2o-stellar-evolution-pre33-03a2a';
import { PlanetH2OHistoricalSourcePRE3303A2 } from './planet-h2o-historical-source-pre33-03a2';
import { PlanetH2OEvolutionEnginePRE3303A1 } from './planet-h2o-evolution-engine-pre33-03a1';
import { reconcilePlanetAtmosphericPressurePRE3302 } from './planet-atmospheric-pressure-coherence-pre33-02';

const AU_METERS=149597870700, SOLAR_WATTS=3.828e26;
const GYR_YEARS=1e9, SECURE_UPPER_GYR=13.8;
const EARTH_KG=5.9722e24, EARTH_METERS=6371000, G=6.6743e-11;
const H2O_TRIPLE_K=273.16, H2O_TRIPLE_PA=611.657;
const finite=(v:number):boolean=>Number.isFinite(v)&&v>0;
const bodyKey=(p:Planet):string=>{const l=p.locator;return `G${l.galaxyIndex}/S${l.sectorKey}/O${l.galacticObjectIndex}/B${l.bodyIndex}`;};
const toYear=(gyr:number)=>Math.round(gyr*GYR_YEARS);
function stageLuminosity(referenceSolar:number, initialMassSolar:number, fraction:number, supergiant:boolean):number {
  // Bounded, declared toy envelope, NOT a post-MS stellar track from GENESIS.
  const gain = supergiant ? Math.min(30000, Math.max(30, 500*initialMassSolar)) :
    Math.min(1500, Math.max(8, 35*Math.sqrt(initialMassSolar)));
  return referenceSolar*(1+gain*fraction*fraction);
}
function whiteDwarfLuminosity(ageSinceFormationYears:number):number {
  // Explicit reference cooling hypothesis with no actual WD radius/temp track.
  // Do not mistake it for a history observed or stored in the frozen star.
  return Math.min(5,Math.max(1e-5, 0.1*Math.pow(1+ageSinceFormationYears/1e8,-1.3)));
}
function xuvRatioMS(midYear:number, massSolar:number):number {
  const saturatedYears=massSolar<.6?5e8:massSolar<1.2?1e8:3e7;
  return 1e-3*Math.min(1,Math.pow(Math.max(1,midYear)/saturatedYears,-1.25));
}
function xuvFlux(mid:number, tms:number, terminal:number, input:PlanetH2OStellarInputPRE3303A2A): {luminosity:number;ratio:number;stage:string} {
  let luminosity:number,ratio:number,stage:string;
  if(mid<tms){luminosity=input.luminositySolar;ratio=xuvRatioMS(mid,input.initialMassSolar);stage='MAIN_SEQUENCE';}
  else if(mid<terminal){
    const f=Math.min(1,Math.max(0,(mid-tms)/Math.max(1,terminal-tms)));
    const supergiant=input.stellarState==='SUPERGIANT'||input.stellarState==='NEUTRON_STAR'||input.stellarState==='STELLAR_BLACK_HOLE';
    luminosity=stageLuminosity(input.luminositySolar,input.initialMassSolar,f,supergiant);
    // This is an explicit atmospheric-escape sensitivity envelope, not
    // a measured post-MS spectrum. A boost in Lbol does not imply XUV boost.
    ratio=supergiant?1e-6:1e-5;stage=supergiant?'SUPERGIANT':'GIANT';
  }else{
    luminosity=whiteDwarfLuminosity(mid-terminal);
    ratio=.10;stage='WHITE_DWARF'; // conditional spectral-energy upper scenario
  }
  return {luminosity,ratio,stage};
}
function vaporCap(atmosphere:Atmosphere,planet:Planet):{state:'ICE'|'LIQUID'|null;mass:number}{
  const t=atmosphere.climateState.meanSurfaceTemperatureKelvin;
  const p=atmosphere.waterInventory.sourceRetainedSurfacePressurePascal;
  if(t===null||p===null||t<=0||p<0||t>=647.096||p>1e6)return {state:null,mass:0};
  const isIce=t<H2O_TRIPLE_K;
  const exponent=(isIce?6130:5420)*(1/H2O_TRIPLE_K-1/t);
  const saturationP=Math.min(p,H2O_TRIPLE_PA*Math.exp(Math.max(-100,Math.min(100,exponent))));
  const radius=planet.physicalProperties.radiusEarth*EARTH_METERS;
  const gravity=G*planet.physicalProperties.massEarth*EARTH_KG/(radius*radius);
  const inverseBoiling=1/373.15-(8.314462618/40650)*Math.log(Math.max(p,1e-10)/101325);
  return {state:isIce?'ICE': p>=H2O_TRIPLE_PA&&inverseBoiling>0&&t<=1/inverseBoiling?'LIQUID':null,
    mass:4*Math.PI*radius*radius*saturationP/gravity};
}
/** Evolved host conditional *testable model*; never a claim of actual stellar XUV history. */
export class PlanetH2OStellarEvolutionPRE3303A2A {
  private constructor(){}
  static project(planet:Planet,atmosphere:Atmosphere,formation:PlanetH2OFormationContractPRE3303A,
    host:PlanetH2OStellarInputPRE3303A2A,phase32?:PlanetaryVolatilesHistoryResult32_3):PlanetH2OStellarEvolutionResultPRE3303A2A {
    const id=bodyKey(planet), l=planet.locator;
    const expected=`FROZEN_HOST_15_3/G${l.galaxyIndex}/S${l.sectorKey}/O${l.galacticObjectIndex}/`;
    if(atmosphere.hostPlanet!==planet||formation.bodyKey!==id||formation.lifeEvaluated||
       !host.sourceRecordKey.startsWith(expected)||!/^[ABC]$/.test(host.sourceRecordKey.slice(expected.length)))
      throw new RangeError('PRE-33.03a.2a FOREIGN_PHYSICAL_LINEAGE');
    if(host.luminosityBasis!=='FROZEN_15_1_REFERENCE_NOT_HISTORICAL_TRACK'||
       !finite(host.initialMassSolar)||!finite(host.luminositySolar)||!finite(host.massSolar)||
       !Number.isFinite(host.ageBillionYears)||host.ageBillionYears<=0||host.ageBillionYears>SECURE_UPPER_GYR)
      throw new RangeError('PRE-33.03a.2a INVALID_FROZEN_HOST');
    if(reconcilePlanetAtmosphericPressurePRE3302(planet,atmosphere).status==='INCONSISTENT')
      throw new RangeError('PRE-33.03a.2a INCONSISTENT_PRESSURE');
    const age=toYear(host.ageBillionYears);
    const ms=host.mainSequenceLifetimeBillionYears===null?null:toYear(host.mainSequenceLifetimeBillionYears);
    const end=host.postMainSequenceDurationBillionYears===null||ms===null?null:
      ms+toYear(host.postMainSequenceDurationBillionYears);
    const base={contractVersion:PRE3303A2A_STELLAR_EVOLUTION,perspective:'INTERNAL_SIMULATED_REALITY' as const,
      bodyKey:id,stellarLineage:host.sourceRecordKey,stellarState:host.stellarState,
      phaseBoundaries:Object.freeze({ct0Year:age,mainSequenceEndYear:ms,terminalYear:end}),
      timeline:'FROZEN_14_8_PHASE_BOUNDARIES_NOT_OBSERVED_TRANSIENTS' as const,
      chronologyPreserved:true as const,observedEvidenceGranted:false as const,
      ct0Certified:false as const,lifeEvaluated:false as const};
    const pending=(status:PRE3303A2AStatus):PlanetH2OStellarEvolutionResultPRE3303A2A=>Object.freeze({
      ...base,status,history:null,evolution:null,mainSequenceReference:null,
      radiativeModel:'NONE' as const,orbitalHistory:'UNRESOLVED' as const});
    if((host.stellarState==='MAIN_SEQUENCE')!==(host.evolutionState==='MAIN_SEQUENCE'))
      return pending('UNRESOLVED_STELLAR_SOURCE_OR_TIMELINE');
    if(host.orbitalFluxGeometry!=='HOST_CIRCUMSTELLAR')return pending('UNRESOLVED_MULTIPLE_HOST_GEOMETRY');
    if(host.stellarState==='BROWN_DWARF')return pending('UNRESOLVED_BROWN_DWARF_COOLING');
    if(host.stellarState==='NEUTRON_STAR'||host.stellarState==='STELLAR_BLACK_HOLE')
      return pending('UNRESOLVED_COMPACT_HIGH_ENERGY_HISTORY');
    if(ms===null||end===null||ms<=0||end<=ms||
       !finite(host.mainSequenceLifetimeBillionYears!)||!finite(host.postMainSequenceDurationBillionYears!)||
       host.initialMassSolar<host.massSolar-1e-8)return pending('UNRESOLVED_STELLAR_SOURCE_OR_TIMELINE');
    if(host.stellarState==='MAIN_SEQUENCE'){
      if(age>ms)return pending('UNRESOLVED_STELLAR_SOURCE_OR_TIMELINE');
      const previous=PlanetH2OHistoricalSourcePRE3303A2.generate(planet,atmosphere,formation,host,phase32);
      const status=previous.status==='MODELED_DATED_CONDITIONAL_HISTORY'?
        'MODELED_DATED_CONDITIONAL_MAIN_SEQUENCE':
        previous.status==='UNRESOLVED_SURFACE_REFERENCE'?'UNRESOLVED_SURFACE_DOMAIN':
        'UNRESOLVED_STELLAR_SOURCE_OR_TIMELINE';
      return Object.freeze({...base,status,history:previous.history,evolution:previous.evolution,
        mainSequenceReference:previous,radiativeModel:previous.history?'LEGACY_03A2_MS_XUV' as const:'NONE' as const,
        orbitalHistory:previous.history?'FROZEN_ORBIT_APPROXIMATION_NOT_MASS_LOSS_EVOLUTION' as const:'UNRESOLVED' as const});
    }
    if((host.stellarState==='GIANT'||host.stellarState==='SUPERGIANT') ? !(age>=ms&&age<end) :
       host.stellarState==='WHITE_DWARF' ? age<end : true)
      return pending('UNRESOLVED_STELLAR_SOURCE_OR_TIMELINE');
    const temp=atmosphere.climateState.meanSurfaceTemperatureKelvin,
      pressure=atmosphere.waterInventory.sourceRetainedSurfacePressurePascal;
    if(temp===null||pressure===null)return pending('UNRESOLVED_SURFACE_DOMAIN');
    const a=planet.orbit.semiMajorAxisAu,e=planet.orbit.eccentricity;
    if(!finite(a)||!Number.isFinite(e)||e<0||e>=1||
       !finite(planet.physicalProperties.massEarth)||!finite(planet.physicalProperties.radiusEarth))
      throw new RangeError('PRE-33.03a.2a INVALID_ORBIT_BULK');
    const prefix=`PRE3303a2a/${id}/${host.sourceRecordKey}`;
    const sample=[0,3e6,10e6,30e6,50e6,100e6,150e6,500e6,1e9,2e9,4e9,8e9,ms,end,age]
      .filter(y=>y>=0&&y<=age);
    // Resolve the physically identified transition boundaries precisely, not at
    // arbitrary sampled dates. No transition episode is appended to phase 32.
    const limits=[...new Set(sample)].sort((x,y)=>x-y);
    if(limits.at(-1)!==age)limits.push(age);
    const volatile=formation.formation.volatileCarrierH2OKilograms;
    const tau=Math.min(3e9,Math.max(150e6,800e6*Math.sqrt(planet.physicalProperties.massEarth)));
    const segments:H2ODatedSegmentPRE3303A1[]=[];
    for(let i=0;i<limits.length-1;i++){
      const startYear=limits[i],endYear=limits[i+1],mid=(startYear+endYear)/2,
        last=i===limits.length-2;
      const stage=xuvFlux(mid,ms,end,host);
      const transfers:H2ODatedTransferPRE3303A1[]=[];
      const desgas=volatile*.35*(Math.exp(-startYear/tau)-Math.exp(-endYear/tau));
      if(desgas>0)transfers.push({process:'OUTGASS',from:'INTERIOR_UNSPECIFIED',to:'ATMOSPHERIC_VAPOR',
        massKilograms:desgas,sourceRecordKey:`${prefix}/interval${i}/FIRST_ORDER_OUTGASSING`});
      const flux=SOLAR_WATTS*stage.luminosity*stage.ratio/
        (4*Math.PI*(a*AU_METERS)**2*Math.sqrt(1-e*e));
      if(!Number.isFinite(flux)||flux<0)throw new RangeError('PRE-33.03a.2a NONFINITE_XUV');
      segments.push({startYear,endYear,sourceRecordKey:`${prefix}/interval${i}/${stage.stage}`,
        surfaceTemperatureKelvin:last?temp:null,surfacePressurePascal:last?pressure:null,
        transfers,xuvEscape:{sourceRecordKey:`${prefix}/interval${i}/XUV_${stage.stage}_MODEL_HYPOTHESIS`,
          incidentXuvWattsPerSquareMeter:flux,heatingEfficiency01:.1,
          absorptionRadiusMeters:planet.physicalProperties.radiusEarth*EARTH_METERS,
          rocheFactor01:1,escapingH2OMassFraction01:1}});
    }
    const history=(items:readonly H2ODatedSegmentPRE3303A1[]):H2ODatedHistoryPRE3303A1=>Object.freeze({
      bodyKey:id,ageYearsCT0:age,provenance:'DATED_PHYSICAL_H2O_MODEL' as const,sourceRecordKey:prefix,
      segments:Object.freeze(items.map(s=>Object.freeze({...s,transfers:Object.freeze([...s.transfers])}))),
      phase32Chronology:Object.freeze({bodyKey:id,ageYearsCT0:age}),
    });
    let h=history(segments);
    let evolution=PlanetH2OEvolutionEnginePRE3303A1.project(planet,atmosphere,formation,h,phase32);
    const saturation=vaporCap(atmosphere,planet);
    const excess=Math.max(0,(evolution.reservoirs.ATMOSPHERIC_VAPOR??0)-saturation.mass);
    if(saturation.state!==null&&excess>0){
      const j=segments.length-1,last=segments[j];
      const to=saturation.state==='ICE'?'SURFACE_ICE':'SURFACE_LIQUID';
      segments[j]={...last,transfers:[...last.transfers,{process:saturation.state==='ICE'?'CONDENSE_ICE':'CONDENSE_LIQUID',
        from:'ATMOSPHERIC_VAPOR',to,massKilograms:excess,sourceRecordKey:`${prefix}/CT0_SATURATION_LIMIT`}]};
      h=history(segments);
      evolution=PlanetH2OEvolutionEnginePRE3303A1.project(planet,atmosphere,formation,h,phase32);
    }
    if(evolution.state!=='CONDITIONAL_EVOLUTION_COMPLETED'||!evolution.massBalance.conditionalConservationVerified)
      throw new RangeError('PRE-33.03a.2a MASS_NOT_CONSERVED');
    const status=host.stellarState==='WHITE_DWARF'?'MODELED_DATED_CONDITIONAL_WHITE_DWARF':
      host.stellarState==='SUPERGIANT'?'MODELED_DATED_CONDITIONAL_SUPERGIANT':'MODELED_DATED_CONDITIONAL_GIANT';
    return Object.freeze({...base,status,history:h,evolution,mainSequenceReference:null,
      radiativeModel:host.stellarState==='WHITE_DWARF'?'WHITE_DWARF_COOLING_HYPOTHESIS' as const:
        'POST_MS_LUMINOSITY_HYPOTHESIS' as const,
      orbitalHistory:'FROZEN_ORBIT_APPROXIMATION_NOT_MASS_LOSS_EVOLUTION' as const});
  }
}
