import {describe,it,expect} from 'vitest';
import {assessPhysicalLifeRoutePRE3311c as assess,prepareLifeReadinessPRE3311c as prepare,
  bridgeGalacticLifeCalibrationPRE3311c as bridge,assessSignalDetectabilityPRE3311c as detect,
  type PhysicalFactorEvidencePRE3311c,type SignalObservationPRE3311c} from './galactic-life-readiness-pre33-11c';
import type {GalacticBodyEnvironmentPRE3311a} from './galactic-environment-distribution-pre33-11a';
import {calibrateGalaxyOpportunityPRE3311b} from './galactic-statistical-calibration-pre33-11b';
const facts=['LIQUID_SOLVENT','REACTANTS_AND_CHEMICAL_POWER','PRESSURE_OR_CONFINEMENT','IONIZING_EXPOSURE','DATED_ENVIRONMENTAL_CONTINUITY'] as const;
const unknown=()=>facts.map(factor=>({factor,state:'UNKNOWN' as const,sourceKey:null,scope:'UNKNOWN' as const}));
const supported=(factor:typeof facts[number]):PhysicalFactorEvidencePRE3311c=>({factor,state:'SUPPORTED_BY_MODEL',scope:'DATED_MODEL',sourceKey:'evidence:'+factor});
const aqueous:GalacticBodyEnvironmentPRE3311a={contract:'PRE-33.11a/V3-GALACTIC-ENVIRONMENT/v1',sectorKey:'5:7',
 hostPlanetOrdinal:2,moonOrdinal:3,bodyKind:'MOON_DETAILED',family:'MOON',niche:'MOON_INTERIOR',
 routes:(['H2O','NH3','CH4'] as const).map(solvent=>({solvent,phase:solvent==='H2O'?'CT0_LIQUID_IN_SIMULATED_MODEL' as const:'UNRESOLVED_PHASE_OR_INVENTORY' as const,
  reactantsAndKinetics:'UNRESOLVED' as const,doseAndHistory:'UNRESOLVED' as const,life:'NOT_EVALUATED' as const,observed:false as const})),
 biosphere:'NOT_EVALUATED',observation:'PRIVATE_GENERATIVE_GROUND_TRUTH_NOT_DISCOVERY',issues:[]};
const signal:SignalObservationPRE3311c={channel:'BIOSIGNATURE',observableKey:'MODEL:SPECTRAL:TEST',sourceProvenance:'physical-signal',
 instrumentProvenance:'instrument-response',observingGeometryProvenance:'geometry',signalElectronRate:10,
 backgroundElectronRate:30,darkElectronRate:2,readNoiseElectronsRms:3,exposureSeconds:100,
 alternativeAbioticExplanation:'PLAUSIBLE',independentEvidenceKey:null};
describe('PRE-33.11c: puertas 33–38, sin vida antes de certificación',()=>{
 it('H2O CT-0 no acredita bioenergética, radiación, continuidad ni vida; alternativas abiertas',()=>{
   const r=prepare(aqueous);
   expect(r.routes).toHaveLength(4);expect(r.routes[0]?.status).toBe('INPUTS_UNRESOLVED');
   expect(r.routes[0]?.physicalFactors[0]?.state).toBe('SUPPORTED_BY_MODEL');
   expect(r.routes[1]?.physicalFactors[0]?.state).toBe('UNKNOWN');
   expect(r.routes[3]?.solvent).toBe('OTHER');
   expect(r.lifeFrequency).toBe('NOT_ESTIMABLE_FROM_ENVIRONMENT');
   expect(r.futurePhases.map(x=>x.phase)).toEqual([33,34,35,36,37,38]);
   expect(r.futurePhases.every(x=>x.biologicalGroundTruth==='NOT_SIMULATED'&&x.observedKnowledge==='NOT_INFERRED')).toBe(true);
 });
 it('ausencia CT-0 bloquea solamente esa ruta solvente; no significa esterilidad total',()=>{
   const body={...aqueous,routes:aqueous.routes.map(x=>x.solvent==='H2O'?{...x,phase:'CT0_LIQUID_ABSENT_IN_SIMULATED_MODEL' as const}:x)};
   const r=prepare(body);expect(r.routes[0]?.status).toBe('ROUTE_INCOMPATIBLE_IN_MODEL');
   expect(r.routes[1]?.status).toBe('INPUTS_UNRESOLVED');
 });
 it('reacciona a entradas físicas completas sin deducir abiogénesis',()=>{
   const r=assess('NH3',facts.map(supported));
   expect(r.status).toBe('INPUTS_COMPLETE_FOR_FUTURE_HYPOTHESIS');
   expect(r.livingOrganisms).toBe('NOT_SIMULATED');expect(r.candidateBiosignatures).toBe('NOT_INFERRED');
   expect(assess('NH3',[{...supported(facts[0]),state:'CONDITIONAL'},...facts.slice(1).map(supported)]).status).toBe('CONDITIONALLY_PREPARED');
   expect(assess('NH3',[{...supported(facts[0]),state:'CONTRADICTED_FOR_ROUTE'},...unknown().slice(1)]).status).toBe('ROUTE_INCOMPATIBLE_IN_MODEL');
 });
 it('rechaza entradas duplicadas, evidencia UNKNOWN con procedencia falsa y fuga biológica',()=>{
   expect(()=>assess('H2O',[...unknown().slice(1),unknown()[1]!])).toThrow();
   expect(()=>assess('H2O',[{...unknown()[0]!,sourceKey:'made-up'},...unknown().slice(1)])).toThrow();
   expect(()=>prepare({...aqueous,issues:['MODEL_MISMATCH']})).toThrow();
   expect(()=>prepare({...aqueous,routes:aqueous.routes.map(x=>({...x,life:'PRESENT' as typeof x.life}))})).toThrow();
 });
 it('detectabilidad instrumental: señal/ruido cuantificable, cero inferencia de vida',()=>{
   const a=detect(signal),b=detect(signal);
   expect(a).toEqual(b);expect(a.signalToNoiseRatio).toBeCloseTo(1000/Math.sqrt(4209));
   expect(a.status).toBe('INSTRUMENT_SIGNAL_ESTIMABLE');
   expect(a.alternativeAbioticExplanation).toBe('PLAUSIBLE');
   expect(a.observedLife).toBe('NOT_INFERRED');expect(a.detectedCivilization).toBe('NOT_INFERRED');
 });
 it('falta instrumento, fuente o geometría -> sin SNR; nunca falso positivo confirmado',()=>{
   for(const key of ['sourceProvenance','instrumentProvenance','observingGeometryProvenance'] as const)
     expect(detect({...signal,[key]:null}).signalToNoiseRatio).toBeNull();
   expect(detect({...signal,exposureSeconds:0}).status).toBe('INSUFFICIENT_INSTRUMENTAL_INPUT');
   expect(()=>detect({...signal,readNoiseElectronsRms:-1})).toThrow();
   expect(()=>detect({...signal,alternativeAbioticExplanation:'RULED_OUT_WITH_INDEPENDENT_EVIDENCE'})).toThrow();
   expect(detect({...signal,channel:'TECHNOSIGNATURE'}).detectedCivilization).toBe('NOT_INFERRED');
 });
 it('calibración de agua líquida no genera una probabilidad de vida, inteligencia ni civilización',()=>{
   const calibrated=calibrateGalaxyOpportunityPRE3311b(
     (['CENTRAL','INNER','MIDDLE','OUTER'] as const).flatMap((region,i)=>[0,1].map(j=>({
       region,sectorX:i*10+j,sectorY:0,frameSectors:4,selectedSectors:2,locators:2,
       planets:1,detailedMoons:2,identityOnlyMoons:1,moonLiquidH2O:j===0?1:0,
       moonAbsentH2O:j===0?1:0,moonUnknownH2O:j===0?0:2,
       planetLiquidH2O:0,families:{ROCKY:1},architecture:'SINGLE' as const,
       evidence:'SIMULATED_CT0_ONLY_NOT_BIOLOGY' as const,
     }))));
   const r=bridge(calibrated);expect(r.aqueousModeledAmongDetailed).toBe(0.25);
   expect(r.lifeRate).toBeNull();expect(r.intelligenceRate).toBeNull();expect(r.civilizationRate).toBeNull();
   expect(bridge({...calibrated,status:'INSUFFICIENT_PROBABILITY_SAMPLE'}).aqueousModeledAmongDetailed).toBeNull();
   expect(()=>bridge({...calibrated,life:'DETECTED' as typeof calibrated.life})).toThrow();
 });
 it('serialización determinista y las entradas no se mutan',()=>{
   const frozen=Object.freeze(aqueous);const before=JSON.stringify(frozen);
   expect(JSON.stringify(prepare(frozen))).toBe(JSON.stringify(prepare(frozen)));
   expect(JSON.stringify(frozen)).toBe(before);
   expect(Object.isFrozen(prepare(frozen))).toBe(true);
 });
});
