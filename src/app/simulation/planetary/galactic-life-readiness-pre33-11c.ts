/**
 * PRE-33.11c — Non-generative readiness contracts for phases 33–38.
 * These are hypothesis/observability interfaces, NEVER biology, discovery or
 * statistical probabilities of actual life. No RNG, persistence or browser clock.
 */
import type { GalacticBodyEnvironmentPRE3311a, SolventClassPRE3311a } from './galactic-environment-distribution-pre33-11a';
import type { GalacticCalibrationResultPRE3311b } from './galactic-statistical-calibration-pre33-11b';

export const GALACTIC_LIFE_READINESS_PRE3311C = 'PRE-33.11c/V3-LIFE-READINESS-NON-GENERATING/v1' as const;
export const SOLVENT_HYPOTHESES_PRE3311C = Object.freeze(['H2O','NH3','CH4','OTHER'] as const);
export type SolventHypothesisPRE3311c = typeof SOLVENT_HYPOTHESES_PRE3311C[number];
export type FuturePhasePRE3311c = 33|34|35|36|37|38;
export type PhysicalStatePRE3311c = 'SUPPORTED_BY_MODEL'|'CONTRADICTED_FOR_ROUTE'|'CONDITIONAL'|'UNKNOWN';
export type PhysicalFactorPRE3311c = 'LIQUID_SOLVENT'|'REACTANTS_AND_CHEMICAL_POWER'|'PRESSURE_OR_CONFINEMENT'|'IONIZING_EXPOSURE'|'DATED_ENVIRONMENTAL_CONTINUITY';
export type LifeReadinessStatePRE3311c = 'CONDITIONALLY_PREPARED'|'INPUTS_UNRESOLVED'|'ROUTE_INCOMPATIBLE_IN_MODEL'|'INPUTS_COMPLETE_FOR_FUTURE_HYPOTHESIS';
export interface PhysicalFactorEvidencePRE3311c {
  readonly factor:PhysicalFactorPRE3311c;
  readonly state:PhysicalStatePRE3311c;
  readonly sourceKey:string|null;
  /** Independent evidence provenance; even a model result is not observation. */
  readonly scope:'SIMULATED_CT0'|'DATED_MODEL'|'HYPOTHETICAL_SCENARIO'|'UNKNOWN';
}
export interface FuturePhaseGatePRE3311c {
  readonly phase:FuturePhasePRE3311c;
  readonly subject:'ABIOGENESIS_AND_BIOSIGNATURES'|'BIOSPHERE'|'INTELLIGENCE'|'CIVILIZATION'|'TECHNOSIGNATURES'|'VISUALIZATION';
  readonly implementation:'NOT_ACTIVATED_BEFORE_PRE33_13';
  readonly biologicalGroundTruth:'NOT_SIMULATED';
  readonly observedKnowledge:'NOT_INFERRED';
}
export interface RouteReadinessPRE3311c {
  readonly solvent:SolventHypothesisPRE3311c;
  readonly status:LifeReadinessStatePRE3311c;
  readonly physicalFactors:readonly PhysicalFactorEvidencePRE3311c[];
  readonly missingFactors:readonly PhysicalFactorPRE3311c[];
  readonly evidenceScope:'PRIVATE_SIMULATED_MODEL_NO_DISCOVERY';
  readonly abiogenesis:'NOT_EVALUATED';
  readonly livingOrganisms:'NOT_SIMULATED';
  readonly candidateBiosignatures:'NOT_INFERRED';
}
export interface LifeReadinessReportPRE3311c {
  readonly contract:typeof GALACTIC_LIFE_READINESS_PRE3311C;
  readonly bodyKey:string;
  readonly bodyKind:'PLANET'|'MOON_DETAILED'|'MOON_IDENTITY_ONLY';
  readonly routes:readonly RouteReadinessPRE3311c[];
  readonly futurePhases:readonly FuturePhaseGatePRE3311c[];
  readonly versionGate:'BIOLOGY_DISABLED_UNTIL_PRE33_13';
  readonly lifeFrequency:'NOT_ESTIMABLE_FROM_ENVIRONMENT';
  readonly observerView:'NO_AUTOMATIC_DISCOVERY';
}
const FACTORS:readonly PhysicalFactorPRE3311c[]=Object.freeze([
  'LIQUID_SOLVENT','REACTANTS_AND_CHEMICAL_POWER','PRESSURE_OR_CONFINEMENT',
  'IONIZING_EXPOSURE','DATED_ENVIRONMENTAL_CONTINUITY']);
const GATES:readonly FuturePhaseGatePRE3311c[]=Object.freeze([
  [33,'ABIOGENESIS_AND_BIOSIGNATURES'],[34,'BIOSPHERE'],[35,'INTELLIGENCE'],
  [36,'CIVILIZATION'],[37,'TECHNOSIGNATURES'],[38,'VISUALIZATION'],
].map(([phase,subject])=>Object.freeze({phase:phase as FuturePhasePRE3311c,
  subject:subject as FuturePhaseGatePRE3311c['subject'],
  implementation:'NOT_ACTIVATED_BEFORE_PRE33_13' as const,biologicalGroundTruth:'NOT_SIMULATED' as const,
  observedKnowledge:'NOT_INFERRED' as const})));
const evidence=(factor:PhysicalFactorPRE3311c,state:PhysicalStatePRE3311c,sourceKey:string|null,
  scope:PhysicalFactorEvidencePRE3311c['scope']):PhysicalFactorEvidencePRE3311c =>Object.freeze({factor,state,sourceKey,scope});
const validState=(x:PhysicalStatePRE3311c):boolean =>
  x==='SUPPORTED_BY_MODEL'||x==='CONTRADICTED_FOR_ROUTE'||x==='CONDITIONAL'||x==='UNKNOWN';

/** Assess a future route using only explicit physical inputs (all five independent).
 * A supported route means INPUTS are available, not that life originated.
 */
export function assessPhysicalLifeRoutePRE3311c(solvent:SolventHypothesisPRE3311c,
  physicalFactors:readonly PhysicalFactorEvidencePRE3311c[]):RouteReadinessPRE3311c {
  if(!SOLVENT_HYPOTHESES_PRE3311C.includes(solvent)||physicalFactors.length!==FACTORS.length||
    new Set(physicalFactors.map(x=>x.factor)).size!==FACTORS.length ||
    physicalFactors.some(x=>!FACTORS.includes(x.factor)||!validState(x.state)||
      (x.state==='UNKNOWN' && (x.sourceKey!==null||x.scope!=='UNKNOWN'))||
      (x.state!=='UNKNOWN'&&(!x.sourceKey?.trim()||x.scope==='UNKNOWN'))))
    throw new RangeError('PRE33_11C_INVALID_PHYSICAL_EVIDENCE');
  // Evidence order is canonical for deterministic serialization and comparison.
  const canonical=Object.freeze(FACTORS.map(f=>Object.freeze({...physicalFactors.find(x=>x.factor===f)!})));
  const status:LifeReadinessStatePRE3311c=canonical.some(x=>x.state==='CONTRADICTED_FOR_ROUTE')?'ROUTE_INCOMPATIBLE_IN_MODEL':
    canonical.some(x=>x.state==='UNKNOWN')?'INPUTS_UNRESOLVED':
    canonical.some(x=>x.state==='CONDITIONAL')?'CONDITIONALLY_PREPARED':
    'INPUTS_COMPLETE_FOR_FUTURE_HYPOTHESIS';
  return Object.freeze({solvent,status,physicalFactors:canonical,
    missingFactors:Object.freeze(canonical.filter(x=>x.state==='UNKNOWN').map(x=>x.factor)),
    evidenceScope:'PRIVATE_SIMULATED_MODEL_NO_DISCOVERY',abiogenesis:'NOT_EVALUATED',
    livingOrganisms:'NOT_SIMULATED',candidateBiosignatures:'NOT_INFERRED'});
}

/** Adapter of PRE-33.11a: water CT-0 is not a certified chemical process,
 * persistence, safety or biosphere. Other solvent phases remain UNKNOWN.
 */
export function prepareLifeReadinessPRE3311c(body:GalacticBodyEnvironmentPRE3311a):LifeReadinessReportPRE3311c {
  if(body.contract!=='PRE-33.11a/V3-GALACTIC-ENVIRONMENT/v1'||body.issues.length>0||
    body.observation!=='PRIVATE_GENERATIVE_GROUND_TRUTH_NOT_DISCOVERY'||
    body.biosphere!=='NOT_EVALUATED'||body.routes.length!==3||
    new Set(body.routes.map(x=>x.solvent)).size!==3||
    body.routes.some(x=>!['H2O','NH3','CH4'].includes(x.solvent))||
    !body.sectorKey.trim()||!Number.isSafeInteger(body.hostPlanetOrdinal)||body.hostPlanetOrdinal<1||
    (body.moonOrdinal!==null&&(!Number.isSafeInteger(body.moonOrdinal)||body.moonOrdinal<1))||
    (body.bodyKind==='PLANET')!==(body.moonOrdinal===null))
    throw new RangeError('PRE33_11C_UNTRUSTED_BIOLOGY_INPUT');
  const routes:RouteReadinessPRE3311c[]=body.routes.map(route=>{
    const liquid:PhysicalFactorEvidencePRE3311c =
      route.phase==='CT0_LIQUID_IN_SIMULATED_MODEL'?
        evidence('LIQUID_SOLVENT','SUPPORTED_BY_MODEL',body.sectorKey+':'+body.hostPlanetOrdinal+':'+(body.moonOrdinal??'P')+':'+route.solvent+':CT0','SIMULATED_CT0'):
      route.phase==='CT0_LIQUID_ABSENT_IN_SIMULATED_MODEL'?
        evidence('LIQUID_SOLVENT','CONTRADICTED_FOR_ROUTE',body.sectorKey+':'+body.hostPlanetOrdinal+':'+(body.moonOrdinal??'P')+':'+route.solvent+':CT0','SIMULATED_CT0'):
        evidence('LIQUID_SOLVENT','UNKNOWN',null,'UNKNOWN');
    if(route.reactantsAndKinetics!=='UNRESOLVED'||route.doseAndHistory!=='UNRESOLVED'||
       route.life!=='NOT_EVALUATED'||route.observed!==false)throw new RangeError('PRE33_11C_FORBIDDEN_EVIDENCE_PROMOTION');
    return assessPhysicalLifeRoutePRE3311c(route.solvent,[liquid,
      ...FACTORS.filter(f=>f!=='LIQUID_SOLVENT').map(f=>evidence(f,'UNKNOWN',null,'UNKNOWN'))]);
  });
  // OTHER remains open; absence of an explicit chemistry model is not physical absence.
  routes.push(assessPhysicalLifeRoutePRE3311c('OTHER',FACTORS.map(f=>evidence(f,'UNKNOWN',null,'UNKNOWN'))));
  return Object.freeze({contract:GALACTIC_LIFE_READINESS_PRE3311C,
    bodyKey:body.sectorKey+':'+body.hostPlanetOrdinal+':'+(body.moonOrdinal??'PLANET'),bodyKind:body.bodyKind,
    routes:Object.freeze(routes),futurePhases:GATES,versionGate:'BIOLOGY_DISABLED_UNTIL_PRE33_13',
    lifeFrequency:'NOT_ESTIMABLE_FROM_ENVIRONMENT',observerView:'NO_AUTOMATIC_DISCOVERY'});
}

/** Inference-safe summary of PRE-33.11b; NEVER a galactic life incidence estimate. */
export interface GalacticLifeCalibrationBridgePRE3311c {
  readonly contract:typeof GALACTIC_LIFE_READINESS_PRE3311C;
  readonly inferenceScope:'SIMULATED_ENVIRONMENT_ONLY';
  readonly aqueousModeledAmongDetailed:number|null;
  readonly aqueousInterval95Exploratory:readonly [number,number]|null;
  readonly aqueousLowerBoundAmongAll:number|null;
  readonly allMoonUnknownUpperLogical:number|null;
  readonly lifeRate:number|null;
  readonly intelligenceRate:number|null;
  readonly civilizationRate:number|null;
  readonly interpretation:'NO_BIOLOGICAL_RATE_WITHOUT_LATER_PHASES';
  readonly calibrationStatus:'ACCEPTED_ENVIRONMENTAL_DESIGN'|'INSUFFICIENT_DESIGN';
}
export function bridgeGalacticLifeCalibrationPRE3311c(c:GalacticCalibrationResultPRE3311b):GalacticLifeCalibrationBridgePRE3311c {
  if(c.contract!=='PRE-33.11b/V3-STRATIFIED-SECTOR-SAMPLING/v1'||
     c.life!=='NOT_EVALUATED'||c.alternativeSolvents!=='PHASE_UNRESOLVED'||
     c.physicalEnergyAndRadiation!=='NOT_CERTIFIED')
    throw new RangeError('PRE33_11C_CALIBRATION_EVIDENCE_LEAK');
  const good=c.status==='CALIBRATED_MODEL_OPPORTUNITY_INDICATORS';
  const rate=good?c.amongDetailedMoons.point:null;
  if(rate!==null&&(!Number.isFinite(rate)||rate<0||rate>1))throw new RangeError('PRE33_11C_INVALID_RATE');
  const envelope=good?c.potentialAllMoonEnvelope:null;
  if(envelope&&(!(envelope[0]>=0&&envelope[0]<=envelope[1]&&envelope[1]<=1)))throw new RangeError('PRE33_11C_INVALID_ENVELOPE');
  return Object.freeze({contract:GALACTIC_LIFE_READINESS_PRE3311C,
    inferenceScope:'SIMULATED_ENVIRONMENT_ONLY',aqueousModeledAmongDetailed:rate,
    aqueousInterval95Exploratory:good?c.amongDetailedMoons.interval95Approx:null,
    aqueousLowerBoundAmongAll:good?c.amongAllMoonsLowerBound.point:null,
    allMoonUnknownUpperLogical:envelope?.[1]??null,
    lifeRate:null,intelligenceRate:null,civilizationRate:null,
    interpretation:'NO_BIOLOGICAL_RATE_WITHOUT_LATER_PHASES',
    calibrationStatus:good?'ACCEPTED_ENVIRONMENTAL_DESIGN':'INSUFFICIENT_DESIGN'});
}

/** Instrument-only signal model. Can estimate photon-counting SNR when all
 * source, instrument and geometry values are independently supplied. It cannot
 * confirm biology or even decide detection without a declared decision rule.
 */
export interface SignalObservationPRE3311c {
  readonly channel:'BIOSIGNATURE'|'TECHNOSIGNATURE';
  readonly observableKey:string;
  readonly sourceProvenance:string|null;
  readonly instrumentProvenance:string|null;
  readonly observingGeometryProvenance:string|null;
  readonly signalElectronRate:number|null;
  readonly backgroundElectronRate:number|null;
  readonly darkElectronRate:number|null;
  readonly readNoiseElectronsRms:number|null;
  readonly exposureSeconds:number|null;
  readonly alternativeAbioticExplanation:'NOT_ASSESSED'|'PLAUSIBLE'|'RULED_OUT_WITH_INDEPENDENT_EVIDENCE';
  readonly independentEvidenceKey:string|null;
}
export interface SignalDetectabilityPRE3311c {
  readonly observableKey:string;
  readonly channel:'BIOSIGNATURE'|'TECHNOSIGNATURE';
  readonly status:'INSTRUMENT_SIGNAL_ESTIMABLE'|'INSUFFICIENT_INSTRUMENTAL_INPUT';
  readonly expectedSignalElectrons:number|null;
  readonly signalToNoiseRatio:number|null;
  readonly alternativeAbioticExplanation:SignalObservationPRE3311c['alternativeAbioticExplanation'];
  readonly interpretation:'SIGNAL_ONLY_NOT_LIFE'|'UNRESOLVED_SIGNAL';
  readonly biologicalOrigin:'NOT_ESTABLISHED';
  readonly observedLife:'NOT_INFERRED';
  readonly detectedCivilization:'NOT_INFERRED';
}
const validNonnegative=(x:number|null)=>x!==null&&Number.isFinite(x)&&x>=0;
export function assessSignalDetectabilityPRE3311c(x:SignalObservationPRE3311c):SignalDetectabilityPRE3311c {
  if(!x.observableKey.trim()||!['BIOSIGNATURE','TECHNOSIGNATURE'].includes(x.channel)||
    !['NOT_ASSESSED','PLAUSIBLE','RULED_OUT_WITH_INDEPENDENT_EVIDENCE'].includes(x.alternativeAbioticExplanation)||
    (x.alternativeAbioticExplanation==='RULED_OUT_WITH_INDEPENDENT_EVIDENCE'?!x.independentEvidenceKey?.trim():x.independentEvidenceKey!==null))
    throw new RangeError('PRE33_11C_INVALID_SIGNAL_IDENTITY_OR_ALTERNATIVES');
  const values=[x.signalElectronRate,x.backgroundElectronRate,x.darkElectronRate,x.readNoiseElectronsRms,x.exposureSeconds];
  if(values.some(v=>v!==null&&!validNonnegative(v)))throw new RangeError('PRE33_11C_INVALID_SIGNAL_VALUES');
  const ready=Boolean(x.sourceProvenance?.trim()&&x.instrumentProvenance?.trim()&&x.observingGeometryProvenance?.trim()&&
    values.every(validNonnegative)&&x.exposureSeconds!==null&&x.exposureSeconds>0);
  const signal=ready?x.signalElectronRate!*x.exposureSeconds!:null;
  const variance=ready?(x.signalElectronRate!+x.backgroundElectronRate!+x.darkElectronRate!)*x.exposureSeconds!+
    x.readNoiseElectronsRms!**2:null;
  // Zero noise with any signal is an unsupported idealisation, not infinite SNR.
  const computed=ready&&variance!==null&&variance>0&&Number.isFinite(signal)&&Number.isFinite(variance);
  const snr=computed?signal!/Math.sqrt(variance!):null;
  return Object.freeze({observableKey:x.observableKey,channel:x.channel,
    status:computed?'INSTRUMENT_SIGNAL_ESTIMABLE':'INSUFFICIENT_INSTRUMENTAL_INPUT',
    expectedSignalElectrons:computed?signal:null,signalToNoiseRatio:snr,
    alternativeAbioticExplanation:x.alternativeAbioticExplanation,
    interpretation:computed?'SIGNAL_ONLY_NOT_LIFE':'UNRESOLVED_SIGNAL',
    biologicalOrigin:'NOT_ESTABLISHED',observedLife:'NOT_INFERRED',detectedCivilization:'NOT_INFERRED'});
}
