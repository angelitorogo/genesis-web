/**
 * PRE-33.11b: two-stage, stratified *design* calibration of simulated galactic
 * opportunity indicators. Nothing here creates or detects life or alters a world.
 * The sample consists of independently drawn sector cells; a system is then
 * drawn uniformly from the sector's canonical locators. The known second-stage
 * expansion is M_s, the sector's locator count. All uncertainties remain visible.
 */
export const GALACTIC_STATISTICAL_CALIBRATION_PRE3311B = 'PRE-33.11b/V3-STRATIFIED-SECTOR-SAMPLING/v1' as const;
export type GalacticRegionPRE3311b = 'CENTRAL'|'INNER'|'MIDDLE'|'OUTER';
export interface SectorDesignObservationPRE3311b {
  readonly region:GalacticRegionPRE3311b;
  readonly sectorX:number;
  readonly sectorY:number;
  /** Exact first-stage frame size for this stratum, including empty sectors. */
  readonly frameSectors:number;
  readonly selectedSectors:number;
  /** Number of eligible canonical system locators, including zero. */
  readonly locators:number;
  /** One sampled system (if any); total bodies belong to that system alone. */
  readonly planets:number;
  readonly detailedMoons:number;
  readonly identityOnlyMoons:number;
  readonly moonLiquidH2O:number;
  readonly moonAbsentH2O:number;
  readonly moonUnknownH2O:number;
  readonly planetLiquidH2O:number;
  readonly families:Readonly<Record<string,number>>;
  readonly architecture: 'SINGLE'|'BINARY'|'TRIPLE'|'NO_SYSTEM';
  readonly evidence: 'SIMULATED_CT0_ONLY_NOT_BIOLOGY';
}
export interface CalibratedBandPRE3311b {
  readonly quantity:string;
  readonly point:number|null;
  readonly standardErrorApprox:number|null;
  readonly interval95Approx:readonly [number,number]|null;
  readonly interpretation:'DESIGN_APPROXIMATION_NOT_BIOLOGICAL_PROBABILITY'|'NOT_ESTIMABLE';
}
export interface GalacticCalibrationResultPRE3311b {
  readonly contract:typeof GALACTIC_STATISTICAL_CALIBRATION_PRE3311B;
  readonly inferenceScope:'GALAXY_SECTOR_GRID_V3_SIMULATED_UNIVERSE';
  readonly strategy:'STRATIFIED_SRS_OCCUPIED_SECTORS_WITHOUT_REPLACEMENT_PLUS_ONE_UNIFORM_LOCATOR';
  readonly regionFrames:Readonly<Record<GalacticRegionPRE3311b,number>>;
  readonly regionSampleSizes:Readonly<Record<GalacticRegionPRE3311b,number>>;
  readonly sectorsSampled:number;
  readonly emptySectors:number;
  readonly expanded:Readonly<Record<string,number>>;
  readonly regionalOpportunities:Readonly<Record<GalacticRegionPRE3311b,Readonly<{
    occupiedSectorCells:number;sampledSectorCells:number;
    expandedPlanets:number;expandedDetailedMoons:number;expandedIdentityOnlyMoons:number;
    expandedLiquidH2O:number;expandedUnknownH2O:number;
    modeledAqueousAmongDetailed:number|null;
  }>>>;
  readonly amongDetailedMoons:CalibratedBandPRE3311b;
  readonly amongAllMoonsLowerBound:CalibratedBandPRE3311b;
  readonly potentialAllMoonEnvelope:readonly [number,number]|null;
  readonly families:Readonly<Record<string,number>>;
  readonly status:'CALIBRATED_MODEL_OPPORTUNITY_INDICATORS'|'INSUFFICIENT_PROBABILITY_SAMPLE';
  readonly life:'NOT_EVALUATED';
  readonly alternativeSolvents:'PHASE_UNRESOLVED';
  readonly physicalEnergyAndRadiation:'NOT_CERTIFIED';
  readonly limitations:readonly string[];
}
const REGIONS: readonly GalacticRegionPRE3311b[] = Object.freeze(['CENTRAL','INNER','MIDDLE','OUTER']);
const metrics=['planets','detailedMoons','identityOnlyMoons','moonLiquidH2O','moonAbsentH2O','moonUnknownH2O','planetLiquidH2O'] as const;
type Metric=typeof metrics[number];
const Z=1.96;
const finite=(n:number)=>Number.isFinite(n)&&n>=0;
const num=(n:number)=>Number.isFinite(n)&&n>=0?n:0;
const square=(n:number)=>n*n;

/** For exact frame construction, use the current 5.x stellar-density ring boundaries. */
export function radialRegionPRE3311b(x:number,y:number,halfExtent:number):GalacticRegionPRE3311b|null {
  if(!Number.isSafeInteger(x)||!Number.isSafeInteger(y)||!Number.isSafeInteger(halfExtent)||halfExtent<0) throw new RangeError('INVALID_SECTOR_FRAME');
  const r=halfExtent===0?0:Math.hypot(x,y)/halfExtent;
  if(r>1)return null;
  if(r<0.15)return 'CENTRAL';
  if(r<0.40)return 'INNER';
  if(r<0.70)return 'MIDDLE';
  return 'OUTER';
}
/** Enumerates sector cells only: no materialization of stars, planets or moons. */
export function enumerateGalacticSectorFramePRE3311b(halfExtent:number):Readonly<Record<GalacticRegionPRE3311b,readonly Readonly<{x:number,y:number}>[]>> {
  if(!Number.isSafeInteger(halfExtent)||halfExtent<0||halfExtent>1000)throw new RangeError('UNSUPPORTED_CALIBRATION_FRAME');
  const frame:Record<GalacticRegionPRE3311b,{x:number,y:number}[]>={CENTRAL:[],INNER:[],MIDDLE:[],OUTER:[]};
  for(let x=-halfExtent;x<=halfExtent;x++)for(let y=-halfExtent;y<=halfExtent;y++){
    const r=radialRegionPRE3311b(x,y,halfExtent);
    if(r)frame[r].push(Object.freeze({x,y}));
  }
  return Object.freeze({CENTRAL:Object.freeze(frame.CENTRAL),INNER:Object.freeze(frame.INNER),
    MIDDLE:Object.freeze(frame.MIDDLE),OUTER:Object.freeze(frame.OUTER)});
}
function band(quantity:string,point:number|null,se:number|null,ratio:boolean):CalibratedBandPRE3311b {
  if(point===null||!Number.isFinite(point))return Object.freeze({quantity,point:null,standardErrorApprox:null,interval95Approx:null,interpretation:'NOT_ESTIMABLE'});
  // A zero (or one) rare-event sample has zero plug-in sample variance.
  // Returning [0,0] (or [1,1]) as a 95% interval would be scientifically false.
  if(ratio&&(point===0||point===1))return Object.freeze({quantity,point,standardErrorApprox:null,interval95Approx:null,interpretation:'NOT_ESTIMABLE'});
  const lower=Math.max(0,point-Z*(se??0));const upper=ratio?Math.min(1,point+Z*(se??0)):point+Z*(se??0);
  return Object.freeze({quantity,point,standardErrorApprox:se,
    interval95Approx:Object.freeze([lower,upper] as const),interpretation:'DESIGN_APPROXIMATION_NOT_BIOLOGICAL_PROBABILITY'});
}
export function calibrateGalaxyOpportunityPRE3311b(observations:readonly SectorDesignObservationPRE3311b[]):GalacticCalibrationResultPRE3311b {
  const frame={CENTRAL:0,INNER:0,MIDDLE:0,OUTER:0};
  const sizes={CENTRAL:0,INNER:0,MIDDLE:0,OUTER:0};
  const grouped:Record<GalacticRegionPRE3311b,SectorDesignObservationPRE3311b[]>={CENTRAL:[],INNER:[],MIDDLE:[],OUTER:[]};
  const seen=new Set<string>();
  for(const o of observations){
    if(!REGIONS.includes(o.region)||!Number.isSafeInteger(o.sectorX)||!Number.isSafeInteger(o.sectorY)||
      !Number.isSafeInteger(o.frameSectors)||o.frameSectors<1||!Number.isSafeInteger(o.selectedSectors)||o.selectedSectors<1||
      !Number.isSafeInteger(o.locators)||o.locators<0||o.evidence!=='SIMULATED_CT0_ONLY_NOT_BIOLOGY'||
      metrics.some(k=>!Number.isSafeInteger(o[k])||!finite(o[k]))||o.moonLiquidH2O+o.moonAbsentH2O+o.moonUnknownH2O!==o.detailedMoons||
      o.architecture==='NO_SYSTEM'&&o.locators>0||o.locators===0&&o.architecture!=='NO_SYSTEM')throw new RangeError('INVALID_DESIGN_OBSERVATION');
    if(o.locators===0&&metrics.some(k=>o[k]!==0))throw new RangeError('EMPTY_SECTOR_CANNOT_CONTAIN_BODIES');
    if(Object.values(o.families).some(v=>!Number.isSafeInteger(v)||v<0)||Object.values(o.families).reduce((s,v)=>s+v,0)!==o.planets)
      throw new RangeError('PLANET_FAMILY_PARTITION_INVALID');
    const k=o.sectorX+':'+o.sectorY;
    if(seen.has(k))throw new RangeError('DUPLICATE_SECTOR');seen.add(k);
    if(frame[o.region] && frame[o.region]!==o.frameSectors)throw new RangeError('INCONSISTENT_FRAME');
    if(sizes[o.region] && sizes[o.region]!==o.selectedSectors)throw new RangeError('INCONSISTENT_SAMPLE_SIZE');
    frame[o.region]=o.frameSectors;sizes[o.region]=o.selectedSectors;grouped[o.region].push(o);
  }
  const enough=REGIONS.every(r=>sizes[r]>=2&&frame[r]>=sizes[r]&&grouped[r].length===sizes[r]);
  const expanded:Record<string,number>={};
  const families:Record<string,number>={};
  const regionalOpportunities:Record<GalacticRegionPRE3311b,{
    occupiedSectorCells:number;sampledSectorCells:number;
    expandedPlanets:number;expandedDetailedMoons:number;expandedIdentityOnlyMoons:number;
    expandedLiquidH2O:number;expandedUnknownH2O:number;modeledAqueousAmongDetailed:number|null;
  }>={CENTRAL:null!,INNER:null!,MIDDLE:null!,OUTER:null!};
  const clusters:Record<GalacticRegionPRE3311b,Readonly<Record<string,number>>[]>={CENTRAL:[],INNER:[],MIDDLE:[],OUTER:[]};
  for(const r of REGIONS){
    const N=frame[r],n=sizes[r];
    if(n===0)continue;
    clusters[r]=grouped[r].map(o=>{
      const row:Record<string,number>={};
      for(const k of metrics)row[k]=o.locators*o[k];
      row['allMoons']=row['detailedMoons']+row['identityOnlyMoons'];
      for(const [f,v] of Object.entries(o.families)){
        if(!Number.isSafeInteger(v)||!finite(v))throw new RangeError('INVALID_FAMILY_COUNTS');
        row['FAMILY:'+f]=o.locators*v;
      }
      return row;
    });
    for(const key of [...metrics,'allMoons']){
      const mean=clusters[r].reduce((a,o)=>a+(o[key]??0),0)/n;
      expanded[key]=(expanded[key]??0)+N*mean;
    }
    const rTotal=(key:string)=>N*clusters[r].reduce((acc,row)=>acc+(row[key]??0),0)/n;
    const rDetailed=rTotal('detailedMoons');
    regionalOpportunities[r]=Object.freeze({occupiedSectorCells:N,sampledSectorCells:n,
      expandedPlanets:rTotal('planets'),expandedDetailedMoons:rDetailed,
      expandedIdentityOnlyMoons:rTotal('identityOnlyMoons'),expandedLiquidH2O:rTotal('moonLiquidH2O'),
      expandedUnknownH2O:rTotal('moonUnknownH2O'),
      modeledAqueousAmongDetailed:rDetailed>0?rTotal('moonLiquidH2O')/rDetailed:null});
    for(const row of clusters[r])for(const [key,v] of Object.entries(row))if(key.startsWith('FAMILY:'))
      families[key.slice(7)]=(families[key.slice(7)]??0)+(N/n)*v;
  }
  const variance=(transformed:(row:Readonly<Record<string,number>>)=>number):number|null=>{
    if(!enough)return null;
    let v=0;
    for(const r of REGIONS){
      const rows=clusters[r],N=frame[r],n=sizes[r];
      const vals=rows.map(transformed),mu=vals.reduce((a,b)=>a+b,0)/n;
      const s2=vals.reduce((a,b)=>a+square(b-mu),0)/(n-1);
      // Conservative 2-stage approximation: omit the first-stage finite-population
      // correction because one-system-per-sector adds within-sector uncertainty.
      v+=N*N*s2/n;
    }
    return v;
  };
  for(const r of REGIONS)if(!regionalOpportunities[r])regionalOpportunities[r]=Object.freeze({
    occupiedSectorCells:frame[r],sampledSectorCells:sizes[r],expandedPlanets:0,expandedDetailedMoons:0,
    expandedIdentityOnlyMoons:0,expandedLiquidH2O:0,expandedUnknownH2O:0,modeledAqueousAmongDetailed:null});
  const possible=enough && num(expanded['allMoons'])>0;
  const detailed=num(expanded['detailedMoons']),all=num(expanded['allMoons']),positive=num(expanded['moonLiquidH2O']);
  const amongDetailed=possible&&detailed>0?positive/detailed:null;
  const lowerAll=possible&&all>0?positive/all:null;
  const seRatio=(rate:number|null,denom:string)=>rate===null?null:Math.sqrt(num(variance(o=>(o['moonLiquidH2O']??0)-rate*(o[denom]??0))??0))/expanded[denom];
  const unresolved=num(expanded['moonUnknownH2O'])+num(expanded['identityOnlyMoons']);
  const upperAll=lowerAll===null?null:Math.min(1,(positive+unresolved)/all);
  const status=enough?'CALIBRATED_MODEL_OPPORTUNITY_INDICATORS':'INSUFFICIENT_PROBABILITY_SAMPLE';
  return Object.freeze({contract:GALACTIC_STATISTICAL_CALIBRATION_PRE3311B,
    inferenceScope:'GALAXY_SECTOR_GRID_V3_SIMULATED_UNIVERSE',
    strategy:'STRATIFIED_SRS_OCCUPIED_SECTORS_WITHOUT_REPLACEMENT_PLUS_ONE_UNIFORM_LOCATOR',
    regionFrames:Object.freeze(frame),regionSampleSizes:Object.freeze(sizes),
    sectorsSampled:observations.length,emptySectors:observations.filter(x=>x.locators===0).length,
    expanded:Object.freeze(expanded),regionalOpportunities:Object.freeze(regionalOpportunities),amongDetailedMoons:band('MODELED_H2O_CT0_AMONG_CHARACTERIZED_MOONS',amongDetailed,seRatio(amongDetailed,'detailedMoons'),true),
    amongAllMoonsLowerBound:band('MINIMUM_KNOWN_MODELED_H2O_CT0_AMONG_ALL_MOONS',lowerAll,seRatio(lowerAll,'allMoons'),true),
    potentialAllMoonEnvelope:lowerAll===null?null:Object.freeze([lowerAll,upperAll!] as const),
    families:Object.freeze(families),status,life:'NOT_EVALUATED',alternativeSolvents:'PHASE_UNRESOLVED',physicalEnergyAndRadiation:'NOT_CERTIFIED',
    limitations:Object.freeze([
      'Inference is about the generated V3 finite grid and a randomized sector/locator design, not real astrophysical frequencies.',
      'Expanded counts and approximate intervals are design-based model indicators; small strata, rare events and one locator per sector increase uncertainty.',
      'Unknown phases and identity-only moons are retained in an identification envelope, not recoded as absent or biologically compatible.',
      'CT-0 aqueous liquid is not chemical energy, survivable ionising dose, environmental historical continuity, abiogenesis, life or observed knowledge.',
      'NH3 and CH4 liquid states require independent physical source models; no alternative biochemistry frequency is inferred.',
      'An exact occupied-sector frame is enumerated from V3 locator lists only. Sampling uses an audit key independent of the universe seed.',
    ])});
}
