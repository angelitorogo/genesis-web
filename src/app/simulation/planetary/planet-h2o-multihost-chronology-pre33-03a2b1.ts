import type {PlanetH2OFormationContractPRE3303A} from '../../domain/planetary/planet-h2o-formation-contract-pre33-03a';
import type {PlanetaryVolatilesHistoryResult32_3} from '../../domain/planetary-history/planetary-volatiles-history-32-3';
import {PRE3303A2B1_CHRONOLOGY,type MultihostChronologyPRE3303A2B1,
  type MultihostChronologyStatusPRE3303A2B1,type MultihostComponentChronologyPRE3303A2B1}
  from '../../domain/planetary/planet-h2o-multihost-chronology-pre33-03a2b1';
import type {MultipleStellarGeometryPRE3303A2B} from '../../domain/planetary/planet-h2o-multihost-forcing-pre33-03a2b';
import type {StellarEvolutionStateName} from '../../domain/stellar/stellar-evolution-state';
import {StellarEvolutionInput} from '../../domain/stellar/stellar-evolution-input';
import {StellarEvolutionEngine} from '../stellar/stellar-evolution-engine';
import type {GeneratedMultipleHost,GeneratedPublicPlanet} from '../stellar/stellar-multihost-formation';
import {PlanetH2OMultihostForcingPRE3303A2B} from './planet-h2o-multihost-forcing-pre33-03a2b';

const validAge=(x:number)=>Number.isFinite(x)&&x>0&&x<=13.8;
const validPositive=(x:number)=>Number.isFinite(x)&&x>0;
const ROOT='FROZEN_HOST_15_3/';
const sourceKey=(system:string,label:string)=>`${ROOT}${system}/${label}`;
const bodyKey=(p:GeneratedPublicPlanet)=>{const l=p.planet.locator;return `G${l.galaxyIndex}/S${l.sectorKey}/O${l.galacticObjectIndex}/B${l.bodyIndex}`;};
/** Never rewrites A/B/C, public planets, generator seeds or 32.12 historical events.
 * A reference at primary-A age is an ALTERNATIVE scenario only. Even if each
 * component's coarse evolutionary family matches, its frozen detailed
 * activity, atmosphere and history are NOT thereby revalidated.
 */
export class PlanetH2OMultihostChronologyPRE3303A2B1 {
 private constructor(){}
 static project(mult:GeneratedMultipleHost, entry:GeneratedPublicPlanet,
   formation:PlanetH2OFormationContractPRE3303A,
   phase32?:PlanetaryVolatilesHistoryResult32_3):MultihostChronologyPRE3303A2B1 {
  if(!mult.publicPlanets.includes(entry)||mult.components.length<2||mult.components.length>3||
    entry.atmosphere.hostPlanet!==entry.planet||formation.bodyKey!==bodyKey(entry)||
    mult.parentLocator.galaxyIndex!==entry.planet.locator.galaxyIndex||
    mult.parentLocator.sectorKey!==entry.planet.locator.sectorKey||
    mult.parentLocator.galacticObjectIndex!==entry.planet.locator.galacticObjectIndex)
    throw new RangeError('PRE33A2B1_FOREIGN_PUBLIC_BODY');
  const id=bodyKey(entry),locator=entry.planet.locator;
  const system=`G${locator.galaxyIndex}/S${locator.sectorKey}/O${locator.galacticObjectIndex}`;
  const primaryAge=mult.components[0]!.lifetime.ageBillionYears;
  const usable=validAge(primaryAge);
  const frozenAges=mult.components.map(c=>c.lifetime.ageBillionYears);
  const alreadyCoEval=usable&&frozenAges.every(age=>validAge(age)&&Math.abs(age-primaryAge)<=.05);
  const components:MultihostComponentChronologyPRE3303A2B1[]=[];
  let validInputs=true;
  for(const c of mult.components){
   const original=c.lifetime.evolutionAssessment;
   const input=original.input;
   let assessment:ReturnType<typeof StellarEvolutionEngine.evaluate>|null=null;
   if(usable&&validPositive(c.physical.initialMassSolar)&&
      Number.isFinite(input.metallicitySolarRatio)&&input.metallicitySolarRatio>=0){
    try{assessment=StellarEvolutionEngine.evaluate(c.internalGenerationKey,
      new StellarEvolutionInput(c.physical.initialMassSolar,input.metallicitySolarRatio,primaryAge));}
    catch {assessment=null;}
   }
   if(assessment===null)validInputs=false;
   const main=assessment?.mainSequenceLifetimeBillionYears??null;
   const post=assessment?.postMainSequenceDurationBillionYears??null;
   components.push(Object.freeze({component:c.label,frozenSourceKey:sourceKey(system,c.label),
    frozenAgeBillionYears:c.lifetime.ageBillionYears,
    frozenState:original.evolutionState.name as StellarEvolutionStateName,
    recomputedAtPrimaryAgeState:assessment?.evolutionState.name as StellarEvolutionStateName|null??null,
    mainSequenceEndBillionYears:main,
    terminalAgeBillionYears:main!==null&&post!==null?main+post:null,
    phaseCompatible:assessment!==null&&assessment.evolutionState.name===original.evolutionState.name}));
  }
  const result=(status:MultihostChronologyStatusPRE3303A2B1,
    conditionalReference:MultihostChronologyPRE3303A2B1['conditionalReference']=null):MultihostChronologyPRE3303A2B1=>Object.freeze({
      contractVersion:PRE3303A2B1_CHRONOLOGY,bodyKey:id,systemSourceKey:system,
      status,sharedAgeReferenceBillionYears:usable?primaryAge:null,
      frozenComponentsCoEval:alreadyCoEval,components:Object.freeze(components),conditionalReference,
      provenance:'PRIMARY_A_15_3_COEVAL_SHADOW_NOT_FROZEN_V2' as const,
      editsFrozenV2:false as const,editsPhase32:false as const,editsPlayerKnowledge:false as const,
      waterCT0Certified:false as const,realMultiHostHistoryCertified:false as const});
  if(!usable)return result('UNRESOLVED_PRIMARY_AGE');
  if(!validInputs)return result('UNRESOLVED_COEVAL_INPUT');
  if(components.some(c=>!c.phaseCompatible))return result('UNRESOLVED_COEVAL_PHASE_CONFLICT');
  const hosts=mult.components.map((c,i)=>{
    const phase=components[i]!;
    const original=c.lifetime.evolutionAssessment;
    return Object.freeze({label:c.label,source:Object.freeze({
      ageBillionYears:primaryAge,massSolar:c.physical.currentMassSolar,
      initialMassSolar:c.physical.initialMassSolar,luminositySolar:c.physical.luminositySolar,
      mainSequenceLifetimeBillionYears:phase.mainSequenceEndBillionYears,
      postMainSequenceDurationBillionYears:phase.terminalAgeBillionYears!==null&&phase.mainSequenceEndBillionYears!==null?
        phase.terminalAgeBillionYears-phase.mainSequenceEndBillionYears:null,
      evolutionState:original.evolutionState.name==='MAIN_SEQUENCE'?'MAIN_SEQUENCE' as const:'OTHER' as const,
      stellarState:original.evolutionState.name,
      sourceRecordKey:sourceKey(system,c.label),orbitalFluxGeometry:'UNRESOLVED_MULTIPLE_FLUX' as const,
      luminosityBasis:'FROZEN_15_1_REFERENCE_NOT_HISTORICAL_TRACK' as const})});
  });
  const geometry:MultipleStellarGeometryPRE3303A2B={systemSourceKey:system,
   multiplicity:mult.components.length===3?'TRIPLE':'BINARY',hosts,
   innerOrbit:mult.innerOrbit,outerOrbit:mult.outerOrbit,
   planetHost:entry.host,planetOrbit:entry.planet.orbit,
   orbitalModel:'FROZEN_16_KEPLERIAN_REFERENCE_NO_PHASE'};
  const model=PlanetH2OMultihostForcingPRE3303A2B.project(entry.planet,entry.atmosphere,
    formation,geometry,phase32);
  if(!model.status.startsWith('MODELED_DATED_CONDITIONAL_MULTIPLE_'))
    return result('UNRESOLVED_FORCING_OR_SURFACE',model);
  // Conditional model is a COUNTERFACTUAL reference, not a correction applied to V2.
  return result(alreadyCoEval?'FROZEN_COMPONENTS_ALREADY_COEVAL':
    'COEVAL_REFERENCE_CONDITIONAL_COMPLETED',model);
 }
}
