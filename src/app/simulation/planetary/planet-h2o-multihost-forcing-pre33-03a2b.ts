import type {Planet} from '../../domain/planetary/planet';
import type {Atmosphere} from '../../domain/planetary/atmosphere';
import type {PlanetH2OFormationContractPRE3303A} from '../../domain/planetary/planet-h2o-formation-contract-pre33-03a';
import type {PlanetaryVolatilesHistoryResult32_3} from '../../domain/planetary-history/planetary-volatiles-history-32-3';
import {PRE3303A2B_MULTIPLE_FORCING,type MultipleStellarGeometryPRE3303A2B,
 type MultipleH2OStatusPRE3303A2B,type MultipleH2OResultPRE3303A2B,
 type KeplerOrbitPRE3303A2B} from '../../domain/planetary/planet-h2o-multihost-forcing-pre33-03a2b';
import type {H2ODatedSegmentPRE3303A1,H2ODatedTransferPRE3303A1,
 H2ODatedHistoryPRE3303A1} from '../../domain/planetary/planet-h2o-evolution-contract-pre33-03a1';
import {PlanetH2OEvolutionEnginePRE3303A1} from './planet-h2o-evolution-engine-pre33-03a1';
import {reconcilePlanetAtmosphericPressurePRE3302} from './planet-atmospheric-pressure-coherence-pre33-02';
const L_SUN=3.828e26, AU=149597870700, R_EARTH=6371000,G=6.6743e-11,M_EARTH=5.9722e24;
const H2O_TRIPLE_K=273.16,H2O_TRIPLE_PA=611.657;
const N_SAMPLES=192; // fixed, deterministic low-discrepancy quadrature, NO PRNG
const finite=(v:number)=>Number.isFinite(v)&&v>0;
const nameKey=(p:Planet)=>{const l=p.locator;return `G${l.galaxyIndex}/S${l.sectorKey}/O${l.galacticObjectIndex}/B${l.bodyIndex}`;};
const fract=(n:number)=>n-Math.floor(n);
const rad=(n:number)=>2*Math.PI*n;
const irrational=[0.7548776662466927,0.5698402909980532,0.4385790210744503,0.3281730529231793];
interface XY {x:number;y:number}
function atMean(orbit:KeplerOrbitPRE3303A2B,meanPhase:number):XY {
  const m=rad(meanPhase); let e=m;
  for(let i=0;i<9;i++){const delta=(e-orbit.eccentricity*Math.sin(e)-m)/(1-orbit.eccentricity*Math.cos(e)); e-=delta;}
  return {x:orbit.semiMajorAxisAu*(Math.cos(e)-orbit.eccentricity),
    y:orbit.semiMajorAxisAu*Math.sqrt(1-orbit.eccentricity**2)*Math.sin(e)};
}
const subtract=(a:XY,b:XY):XY=>({x:a.x-b.x,y:a.y-b.y});
const add=(a:XY,b:XY):XY=>({x:a.x+b.x,y:a.y+b.y});
const scale=(a:XY,n:number):XY=>({x:a.x*n,y:a.y*n});
function validOrbit(o:KeplerOrbitPRE3303A2B|null):boolean {
 return !!o&&finite(o.semiMajorAxisAu)&&Number.isFinite(o.eccentricity)&&o.eccentricity>=0&&o.eccentricity<1;
}
function xuvHypothesis(year:number,h:MultipleStellarGeometryPRE3303A2B['hosts'][number]['source']):number|null {
 const ms=h.mainSequenceLifetimeBillionYears,post=h.postMainSequenceDurationBillionYears;
 if(h.stellarState==='BROWN_DWARF'||h.stellarState==='NEUTRON_STAR'||h.stellarState==='STELLAR_BLACK_HOLE')return null;
 if(!finite(h.initialMassSolar)||!finite(h.luminositySolar)||!finite(h.massSolar)||
    h.luminosityBasis!=='FROZEN_15_1_REFERENCE_NOT_HISTORICAL_TRACK'||
    !finite(ms!)||!finite(post!)||h.initialMassSolar<h.massSolar-1e-8)return null;
 const tms=ms!*1e9, tEnd=(ms!+post!)*1e9;
 if(h.stellarState==='MAIN_SEQUENCE'&&h.ageBillionYears*1e9>tms+1)return null;
 if((h.stellarState==='GIANT'||h.stellarState==='SUPERGIANT')&&
   !(h.ageBillionYears*1e9>=tms&&h.ageBillionYears*1e9<tEnd))return null;
 if(h.stellarState==='WHITE_DWARF'&&h.ageBillionYears*1e9<tEnd)return null;
 if(year<tms){const sat=h.initialMassSolar<.6?5e8:h.initialMassSolar<1.2?1e8:3e7;
   return h.luminositySolar*1e-3*Math.min(1,Math.pow(Math.max(1,year)/sat,-1.25));}
 if(year<tEnd){const f=Math.max(0,Math.min(1,(year-tms)/(tEnd-tms)));
   const supergiant=h.stellarState==='SUPERGIANT';
   const gain=supergiant?Math.min(30000,Math.max(30,500*h.initialMassSolar)):
     Math.min(1500,Math.max(8,35*Math.sqrt(h.initialMassSolar)));
   return h.luminositySolar*(1+gain*f*f)*(supergiant?1e-6:1e-5);}
 if(h.stellarState!=='WHITE_DWARF')return null;
 return Math.min(5,Math.max(1e-5,0.1*Math.pow(1+(year-tEnd)/1e8,-1.3)))*.10;
}
/** A coplanar, independent-phase *mean*, NOT a dated conjunction or N-body orbit. */
export function phaseAverageXuvPRE3303A2B(
  geometry:MultipleStellarGeometryPRE3303A2B, xuvLuminositySolar:readonly number[]):number {
 const hs=geometry.hosts,inner=geometry.innerOrbit,outer=geometry.outerOrbit;
 const a=hs[0].source.initialMassSolar,b=hs[1].source.initialMassSolar;
 if(!finite(a)||!finite(b)||xuvLuminositySolar.length!==hs.length||
    xuvLuminositySolar.some(x=>!Number.isFinite(x)||x<0))throw new RangeError('INVALID_XUV_LUMINOSITY');
 let sum=0;
 for(let i=0;i<N_SAMPLES;i++){
   const u=irrational.map((q,j)=>fract((i+.5)*q+j*.170334));
   const rAB=atMean(inner,u[0]);
   const A=scale(rAB,-b/(a+b)), B=scale(rAB,a/(a+b));
   const C=outer?atMean(outer,u[1]):null;
   const base=geometry.planetHost==='A'?A:geometry.planetHost==='B'?B:
     geometry.planetHost==='C'?C:{x:0,y:0};
   if(!base)throw new RangeError('NO_HOST_CENTER');
   const planetPosition=add(base,atMean(geometry.planetOrbit,u[2]));
   const positions=C?[A,B,C]:[A,B];
   let flux=0;
   for(let j=0;j<positions.length;j++){
     const d=subtract(planetPosition,positions[j]);const d2=d.x*d.x+d.y*d.y;
     if(!(d2>0)||!Number.isFinite(d2))throw new RangeError('SINGULAR_ORBIT_GEOMETRY');
     flux+=xuvLuminositySolar[j]/d2;
   }
   sum+=flux;
 }
 return sum/N_SAMPLES*L_SUN/(4*Math.PI*AU*AU);
}
function noCollision(g:MultipleStellarGeometryPRE3303A2B):boolean {
 const p=g.planetOrbit.semiMajorAxisAu,pe=p*(1+g.planetOrbit.eccentricity),
   peri=p*(1-g.planetOrbit.eccentricity),inner=g.innerOrbit,
   innerMax=inner.semiMajorAxisAu*(1+inner.eccentricity),
   innerMin=inner.semiMajorAxisAu*(1-inner.eccentricity),
   [A,B]=g.hosts,mA=A.source.initialMassSolar,mB=B.source.initialMassSolar,
   m=mA+mB,offsetA=innerMax*mB/m,offsetB=innerMax*mA/m;
 if(g.planetHost==='AB'){
   if(peri<=Math.max(offsetA,offsetB))return false;
   return !g.outerOrbit||pe<g.outerOrbit.semiMajorAxisAu*(1-g.outerOrbit.eccentricity);
 }
 if(g.planetHost==='A'||g.planetHost==='B'){
   if(pe>=innerMin)return false;
   if(g.outerOrbit&&pe+Math.max(offsetA,offsetB)>=g.outerOrbit.semiMajorAxisAu*(1-g.outerOrbit.eccentricity))return false;
   return true;
 }
 return !!g.outerOrbit && pe+Math.max(offsetA,offsetB)<g.outerOrbit.semiMajorAxisAu*(1-g.outerOrbit.eccentricity);
}
function vaporCap(planet:Planet,atm:Atmosphere):{state:'ICE'|'LIQUID'|null;mass:number}{
 const t=atm.climateState.meanSurfaceTemperatureKelvin,p=atm.waterInventory.sourceRetainedSurfacePressurePascal;
 if(t===null||p===null||t<=0||p<0||t>=647.096||p>1e6)return {state:null,mass:0};
 const ice=t<H2O_TRIPLE_K;
 const sat=Math.min(p,H2O_TRIPLE_PA*Math.exp(Math.max(-100,Math.min(100,(ice?6130:5420)*(1/H2O_TRIPLE_K-1/t)))));
 const r=planet.physicalProperties.radiusEarth*R_EARTH,g=G*planet.physicalProperties.massEarth*M_EARTH/(r*r),
   inverse=1/373.15-(8.314462618/40650)*Math.log(Math.max(p,1e-10)/101325);
 return {state:ice?'ICE':p>=H2O_TRIPLE_PA&&inverse>0&&t<=1/inverse?'LIQUID':null,
   mass:4*Math.PI*r*r*sat/g};
}
export class PlanetH2OMultihostForcingPRE3303A2B {
 private constructor(){}
 static project(planet:Planet,atm:Atmosphere,formation:PlanetH2OFormationContractPRE3303A,
  g:MultipleStellarGeometryPRE3303A2B,phase32?:PlanetaryVolatilesHistoryResult32_3):MultipleH2OResultPRE3303A2B {
  const body=nameKey(planet),l=planet.locator,
    key=`G${l.galaxyIndex}/S${l.sectorKey}/O${l.galacticObjectIndex}`;
  if(atm.hostPlanet!==planet||formation.bodyKey!==body||formation.lifeEvaluated||
     formation.physicalCT0WaterConserved||
     formation.formationHypothesis!=='DETERMINISTIC_ENDMEMBER_SPECIATION_NOT_MEASURED'||
     planet.orbitTopology!==(g.planetHost==='AB'?'CIRCUMBINARY':'CIRCUMSTELLAR')||g.systemSourceKey!==key||
     !validOrbit(g.innerOrbit)||!validOrbit(g.planetOrbit)||g.planetOrbit.semiMajorAxisAu!==planet.orbit.semiMajorAxisAu||
     g.planetOrbit.eccentricity!==planet.orbit.eccentricity||g.orbitalModel!=='FROZEN_16_KEPLERIAN_REFERENCE_NO_PHASE'||
     !(g.planetHost==='AB'||g.planetHost==='A'||g.planetHost==='B'||g.planetHost==='C')||
     (g.multiplicity==='TRIPLE')!==!!g.outerOrbit||
     (!!g.outerOrbit&&!validOrbit(g.outerOrbit))||
     (g.multiplicity==='TRIPLE'&&g.hosts.length!==3)||
     (g.multiplicity==='BINARY'&&g.hosts.length!==2)||
     g.hosts.some((h,i)=>h.label!=='ABC'[i]||h.source.sourceRecordKey!==
       (g.scientificChronologyRevision==='PRE-33.03a.2b.2/coeval-scientific-physical-revision/v1'?
         `COEVAL_VERSIONED_03A2B2/${key}/${h.label}`:`FROZEN_HOST_15_3/${key}/${h.label}`))||
     (g.planetHost==='C'&&g.multiplicity!=='TRIPLE')||
     reconcilePlanetAtmosphericPressurePRE3302(planet,atm).status==='INCONSISTENT')
     throw new RangeError('PRE-33.03a.2b FOREIGN_OR_INVALID_MULTIPLE_GEOMETRY');
  const ct0Ratios=g.hosts.map(h=>finite(h.source.ageBillionYears)&&h.source.ageBillionYears<=13.8?
    xuvHypothesis(h.source.ageBillionYears*1e9,h.source):null);
  const ct0PhaseAverage=validOrbit(g.outerOrbit??g.innerOrbit)&&noCollision(g)&&
    ct0Ratios.every(x=>x!==null)?phaseAverageXuvPRE3303A2B(g,ct0Ratios as number[]):null;
  const common={contractVersion:PRE3303A2B_MULTIPLE_FORCING,perspective:'INTERNAL_SIMULATED_REALITY' as const,
    bodyKey:body,systemSourceKey:key,planetHost:g.planetHost,
    ct0PhaseAverageXuvWattsPerSquareMeter:ct0PhaseAverage,
    ct0FluxProvenance:ct0PhaseAverage===null?'UNRESOLVED' as const:
      (g.scientificChronologyRevision==='PRE-33.03a.2b.2/coeval-scientific-physical-revision/v1'?
       'VERSIONED_COEVAL_STELLAR_AGES_XUV_HYPOTHESES' as const:
       'INDIVIDUAL_FROZEN_STELLAR_AGES_XUV_HYPOTHESES' as const),
    componentSourceKeys:Object.freeze(g.hosts.map(h=>h.source.sourceRecordKey)),
    orbitalEvolution:'FROZEN_ORBIT_NO_MASS_LOSS_RECONSTRUCTION' as const,
    ct0Certified:false as const,observedEvidenceGranted:false as const,lifeEvaluated:false as const};
  const pending=(status:MultipleH2OStatusPRE3303A2B):MultipleH2OResultPRE3303A2B=>Object.freeze({
    ...common,status,history:null,evolution:null,geometryMethod:ct0PhaseAverage===null?'NONE' as const:
      'COPLANAR_KEPLER_PHASE_AVERAGE_HYPOTHESIS' as const,samplesPerEpoch:ct0PhaseAverage===null?0:N_SAMPLES,
    ageAlignment:'UNRESOLVED' as const});
  if(atm.climateState.meanSurfaceTemperatureKelvin===null||
     atm.waterInventory.sourceRetainedSurfacePressurePascal===null)return pending('UNRESOLVED_SURFACE_DOMAIN');
  if(!g.hosts.every(h=>finite(h.source.ageBillionYears)&&h.source.ageBillionYears<=13.8))
    return pending('UNRESOLVED_COMPONENT_EVOLUTION_BOUNDARIES');
  const ages=g.hosts.map(h=>h.source.ageBillionYears),ageHost=g.planetHost==='AB'?ages[0]:ages['ABC'.indexOf(g.planetHost)];
  // Frozen V2 A/B/C private-source stellar ages are not necessarily coeval!
  // Never synthesize a shared epoch when the recorded ages contradict it.
  if(ages.some(a=>Math.abs(a-ageHost)>0.05))return pending('UNRESOLVED_COMPONENT_AGE_ALIGNMENT');
  if(g.hosts.some(h=>!finite(h.source.initialMassSolar)||!finite(h.source.massSolar)||
      !finite(h.source.luminositySolar)||!finite(h.source.mainSequenceLifetimeBillionYears!)||
      !finite(h.source.postMainSequenceDurationBillionYears!)||
      (h.source.stellarState==='MAIN_SEQUENCE')!==(h.source.evolutionState==='MAIN_SEQUENCE')))
    return pending('UNRESOLVED_COMPONENT_EVOLUTION_BOUNDARIES');
  if(g.hosts.some(h=>xuvHypothesis(ageHost*1e9*.95,h.source)===null))
    return pending('UNRESOLVED_COMPONENT_STELLAR_RADIATION');
  if(!noCollision(g))return pending('UNRESOLVED_ORBITAL_SEPARATION');
  const ct0=Math.round(ageHost*1e9),stages=g.hosts.flatMap(h=>{
    const ms=Math.round(h.source.mainSequenceLifetimeBillionYears!*1e9),
      terminal=Math.round((h.source.mainSequenceLifetimeBillionYears!+h.source.postMainSequenceDurationBillionYears!)*1e9);
    return [ms,terminal];
  });
  const limits=[...new Set([0,3e6,10e6,30e6,50e6,100e6,150e6,500e6,1e9,2e9,4e9,8e9,
    ...stages,ct0].filter(y=>y>=0&&y<=ct0))].sort((a,b)=>a-b);
  if(limits.at(-1)!==ct0)limits.push(ct0);
  const prefix=`PRE3303a2b/${body}/${g.hosts.map(h=>h.source.sourceRecordKey).join('+')}/${g.planetHost}`;
  const volatile=formation.formation.volatileCarrierH2OKilograms,
    tau=Math.min(3e9,Math.max(150e6,800e6*Math.sqrt(planet.physicalProperties.massEarth)));
  const segments:H2ODatedSegmentPRE3303A1[]=[];
  for(let i=0;i<limits.length-1;i++){
    const startYear=limits[i],endYear=limits[i+1],mid=(startYear+endYear)/2,last=i===limits.length-2;
    const lum=g.hosts.map(h=>xuvHypothesis(mid,h.source));
    if(lum.some(x=>x===null))return pending('UNRESOLVED_COMPONENT_STELLAR_RADIATION');
    const flux=phaseAverageXuvPRE3303A2B(g,lum as number[]);
    if(!Number.isFinite(flux)||flux<0)throw new RangeError('NONFINITE_MULTIPLE_XUV');
    const desgas=volatile*.35*(Math.exp(-startYear/tau)-Math.exp(-endYear/tau)),
      transfers:H2ODatedTransferPRE3303A1[]=desgas>0?[{process:'OUTGASS',from:'INTERIOR_UNSPECIFIED',
        to:'ATMOSPHERIC_VAPOR',massKilograms:desgas,
        sourceRecordKey:`${prefix}/interval${i}/FIRST_ORDER_OUTGASSING_HYPOTHESIS`}]:[];
    segments.push({startYear,endYear,sourceRecordKey:`${prefix}/interval${i}`,
      surfaceTemperatureKelvin:last?atm.climateState.meanSurfaceTemperatureKelvin:null,
      surfacePressurePascal:last?atm.waterInventory.sourceRetainedSurfacePressurePascal:null,
      transfers,xuvEscape:{sourceRecordKey:`${prefix}/interval${i}/ORBITAL_PHASE_AVERAGE_XUV_HYPOTHESIS`,
        incidentXuvWattsPerSquareMeter:flux,heatingEfficiency01:.1,
        absorptionRadiusMeters:planet.physicalProperties.radiusEarth*R_EARTH,
        rocheFactor01:1,escapingH2OMassFraction01:1}});
  }
  const makeHistory=(items:readonly H2ODatedSegmentPRE3303A1[]):H2ODatedHistoryPRE3303A1=>Object.freeze({
    bodyKey:body,ageYearsCT0:ct0,provenance:'DATED_PHYSICAL_H2O_MODEL' as const,
    sourceRecordKey:prefix,segments:Object.freeze(items.map(s=>Object.freeze({...s,transfers:Object.freeze([...s.transfers])}))),
    phase32Chronology:Object.freeze({bodyKey:body,ageYearsCT0:ct0})});
  let history=makeHistory(segments),evolution=PlanetH2OEvolutionEnginePRE3303A1.project(planet,atm,formation,history,phase32);
  const sat=vaporCap(planet,atm),excess=Math.max(0,(evolution.reservoirs.ATMOSPHERIC_VAPOR??0)-sat.mass);
  if(sat.state!==null&&excess>0){
    const j=segments.length-1,last=segments[j],ice=sat.state==='ICE';
    segments[j]={...last,transfers:[...last.transfers,{process:ice?'CONDENSE_ICE':'CONDENSE_LIQUID',
      from:'ATMOSPHERIC_VAPOR',to:ice?'SURFACE_ICE':'SURFACE_LIQUID',massKilograms:excess,
      sourceRecordKey:`${prefix}/CT0_SATURATION_HYPOTHESIS`}]};
    history=makeHistory(segments);
    evolution=PlanetH2OEvolutionEnginePRE3303A1.project(planet,atm,formation,history,phase32);
  }
  if(evolution.state!=='CONDITIONAL_EVOLUTION_COMPLETED'||
     !evolution.massBalance.conditionalConservationVerified)throw new RangeError('MULTIPLE_H2O_NOT_CONSERVED');
  return Object.freeze({...common,status:g.planetHost==='AB'?
      'MODELED_DATED_CONDITIONAL_MULTIPLE_P':'MODELED_DATED_CONDITIONAL_MULTIPLE_S',
    history,evolution,geometryMethod:'COPLANAR_KEPLER_PHASE_AVERAGE_HYPOTHESIS',
    samplesPerEpoch:N_SAMPLES,ageAlignment:'WITHIN_50_MYR_COEVAL_MODEL_ASSUMPTION'});
 }
}
