import type { Planet } from '../../domain/planetary/planet';
import type { Atmosphere } from '../../domain/planetary/atmosphere';
import type { PlanetH2OFormationContractPRE3303A } from '../../domain/planetary/planet-h2o-formation-contract-pre33-03a';
import type { PlanetaryVolatilesHistoryResult32_3 } from '../../domain/planetary-history/planetary-volatiles-history-32-3';
import type { H2ODatedSegmentPRE3303A1, H2ODatedTransferPRE3303A1,
  H2ODatedHistoryPRE3303A1 } from '../../domain/planetary/planet-h2o-evolution-contract-pre33-03a1';
import { PLANET_H2O_HISTORICAL_PRE3303A2,
  type PlanetH2OHostSourcePRE3303A2, type PlanetH2OHistoricalResultPRE3303A2,
  type PlanetH2OHistoricalStatusPRE3303A2,
} from '../../domain/planetary/planet-h2o-historical-source-pre33-03a2';
import { PlanetH2OEvolutionEnginePRE3303A1 } from './planet-h2o-evolution-engine-pre33-03a1';
import { reconcilePlanetAtmosphericPressurePRE3302 } from './planet-atmospheric-pressure-coherence-pre33-02';

const AU=149597870700, L_SUN=3.828e26;
const R_EARTH=6371000, G=6.67430e-11, M_EARTH=5.9722e24;
const H2O_TRIPLE_T=273.16, H2O_TRIPLE_P=611.657;
const sourceKey=(p:Planet):string=>{
  const l=p.locator;return `G${l.galaxyIndex}/S${l.sectorKey}/O${l.galacticObjectIndex}/B${l.bodyIndex}`;
};
const finitePositive=(x:number):boolean=>Number.isFinite(x)&&x>0;
const physical=(source:PlanetH2OHostSourcePRE3303A2):boolean=>
  Number.isSafeInteger(Math.round(source.ageBillionYears*1e9)) &&
  finitePositive(source.ageBillionYears)&&source.ageBillionYears<=13.8&&
  finitePositive(source.massSolar)&&source.massSolar<=150&&
  finitePositive(source.luminositySolar)&&finitePositive(source.mainSequenceLifetimeBillionYears??NaN) &&
  source.ageBillionYears <= (source.mainSequenceLifetimeBillionYears??-1)+1e-9 &&
  source.evolutionState==='MAIN_SEQUENCE' &&
  /^FROZEN_HOST_15_3\//.test(source.sourceRecordKey);

/**
 * Build a DATED, mass-conserving conditional process forcing from genuinely
 * frozen stellar mass/luminosity/age plus a declared XUV *model*; it does NOT
 * turn bolometric irradiance into observed XUV, create impacts or reconstruct
 * undocumented historical surface temperatures. No changes to phases 19–32.
 */
export class PlanetH2OHistoricalSourcePRE3303A2 {
  private constructor() {}
  static generate(planet:Planet, atmosphere:Atmosphere,
      formation:PlanetH2OFormationContractPRE3303A,
      host:PlanetH2OHostSourcePRE3303A2,
      phase32Volatiles?:PlanetaryVolatilesHistoryResult32_3):PlanetH2OHistoricalResultPRE3303A2 {
    if (atmosphere.hostPlanet!==planet || formation.bodyKey!==sourceKey(planet) ||
      formation.formationHypothesis!=='DETERMINISTIC_ENDMEMBER_SPECIATION_NOT_MEASURED' ||
      formation.physicalCT0WaterConserved || formation.lifeEvaluated)
      throw new RangeError('PRE-33.03a.2 FOREIGN_OR_PROMOTED_PLANET');
    const pressure=reconcilePlanetAtmosphericPressurePRE3302(planet,atmosphere);
    if (pressure.status==='INCONSISTENT')
      throw new RangeError('PRE-33.03a.2 INCONSISTENT_SOURCE_20X');
    if (!host?.sourceRecordKey || typeof host.sourceRecordKey!=='string')
      throw new RangeError('PRE-33.03a.2 MISSING_STELLAR_SOURCE');
    // A host's physical lineage must be exactly that of the planet being projected.
    const l=planet.locator;
    const hostPrefix=`FROZEN_HOST_15_3/G${l.galaxyIndex}/S${l.sectorKey}/O${l.galacticObjectIndex}/`;
    if (host.sourceRecordKey.startsWith('FROZEN_HOST_15_3/') &&
        (!host.sourceRecordKey.startsWith(hostPrefix) ||
          !/^[ABC]$/.test(host.sourceRecordKey.slice(hostPrefix.length))))
      throw new RangeError('PRE-33.03a.2 FOREIGN_STELLAR_LINEAGE');
    if (![host.ageBillionYears,host.massSolar,host.luminositySolar].every(x=>
      typeof x==='number'&&Number.isFinite(x)))
      throw new RangeError('PRE-33.03a.2 INVALID_HOST_VALUES');
    const body=sourceKey(planet);
    const common={contractVersion:PLANET_H2O_HISTORICAL_PRE3303A2,
      perspective:'INTERNAL_SIMULATED_REALITY' as const,bodyKey:body,
      chronologyPreserved:true as const,playerKnowledgeUpdated:false as const,
      ct0Certified:false as const,lifeEvaluated:false as const,
      phase32VolatileSourceValidated:phase32Volatiles!==undefined};
    const pending=(status:PlanetH2OHistoricalStatusPRE3303A2):PlanetH2OHistoricalResultPRE3303A2=>Object.freeze({
      ...common,status,sourceKey:null,history:null,evolution:null,
      physics:Object.freeze({xuv:'UNRESOLVED' as const,outgassing:'UNRESOLVED' as const,
        surfacePhases:'UNRESOLVED' as const,
        externalImpacts:'NO_INDEPENDENT_DATED_DELIVERY_SOURCE' as const,
        initialInventory:'BACKPROJECTED_MATURE_19_5_CHEMISTRY_ONLY' as const,
        historicalClimate:'NOT_RECONSTRUCTED' as const}),
    });
    if(host.orbitalFluxGeometry!=='HOST_CIRCUMSTELLAR')return pending('UNRESOLVED_STELLAR_FLUX_GEOMETRY');
    if(!physical(host))return pending('UNRESOLVED_STELLAR_AGE_OR_EVOLUTION');
    const tCT0=Math.round(host.ageBillionYears*1e9);
    if(tCT0<1)return pending('UNRESOLVED_STELLAR_AGE_OR_EVOLUTION');
    const a=planet.orbit.semiMajorAxisAu;
    const mass=planet.physicalProperties.massEarth, radius=planet.physicalProperties.radiusEarth;
    if(!finitePositive(a)||!finitePositive(mass)||!finitePositive(radius))
      throw new RangeError('PRE-33.03a.2 INVALID_ORBIT_OR_BULK');
    const domain=atmosphere.climateState.meanSurfaceTemperatureKelvin!==null;
    // Phase-33.03b owns deep pressure/temperature/EOS. Without an exposed solid
    // surface, do not apply a terrestrial vapor/outgassing column.
    if(!domain)return pending('UNRESOLVED_SURFACE_REFERENCE');
    const ct0T=atmosphere.climateState.meanSurfaceTemperatureKelvin;
    const ct0P=atmosphere.waterInventory.sourceRetainedSurfacePressurePascal;
    if ((ct0T===null)!==(ct0P===null))return pending('UNRESOLVED_SURFACE_REFERENCE');
    const base=`PRE3303a2/${body}/${host.sourceRecordKey}`;
    // These are fixed physical epoch cut points, not arbitrary dated catastrophes.
    const splits=Array.from(new Set([0, 3_000_000,10_000_000,50_000_000,
      150_000_000,500_000_000,1_000_000_000,2_000_000_000,tCT0]
      .filter(y=>y<=tCT0))).sort((a,b)=>a-b);
    if(splits[splits.length-1]!==tCT0)splits.push(tCT0);
    const R=radius*R_EARTH, g=G*mass*M_EARTH/(R*R), area=4*Math.PI*R*R;
    // A conservative species upper limit for saturated vapor at CT-0; unlike
    // 20.7's water index, this depends on actual units P/T/g/area.
    const saturationKg=():{state:'ICE'|'LIQUID'|null;mass:number}=>{
      if(!domain||ct0T===null||ct0P===null||ct0T<=0||ct0P<0||ct0T>=647.096 || ct0P>1e6)
        return {state:null,mass:0};
      const isIce=ct0T<H2O_TRIPLE_T;
      const exponent=(isIce?6130:5420)*(1/H2O_TRIPLE_T-1/ct0T);
      const satP=Math.min(ct0P,H2O_TRIPLE_P*Math.exp(Math.max(-100,Math.min(100,exponent))));
      // Total-column hydrostatic cap with pure-water vapor (not mass from 20.4).
      const massVapor=Math.max(0,area*satP/g);
      if(isIce)return {state:'ICE',mass:massVapor};
      const inverseBoiling=1/373.15-(8.314462618/40650)*Math.log(Math.max(ct0P,1e-10)/101325);
      const boiling=inverseBoiling>0?1/inverseBoiling:0;
      return {state:ct0P>=H2O_TRIPLE_P && ct0T<=boiling?'LIQUID':null,mass:massVapor};
    };
    const saturation=saturationKg();
    const volatile=formation.formation.volatileCarrierH2OKilograms;
    // Model parameters below are explicit hypotheses (not dated measurements or
    // the ordinal-20.8 volcanic potential index). A first-order cooling law is
    // applied to water initially resident in volatile-rich interior materials.
    const tauYears=Math.min(3e9,Math.max(150e6,800e6*Math.sqrt(mass)));
    const releaseFraction=0.35; // dimensionless model efficiency, not observed.
    const satYears=(host.massSolar<0.6?500e6:host.massSolar<1.2?100e6:30e6);
    const tDecay=1.25; // XUV saturation-decay hypothesis, not optical flux.
    const satXuvRatio=1e-3;
    const bolometric=L_SUN*host.luminositySolar/(4*Math.PI*(a*AU)**2);
    const segments:H2ODatedSegmentPRE3303A1[]=[];
    for(let i=0;i<splits.length-1;i++){
      const startYear=splits[i],endYear=splits[i+1],last=i===splits.length-2;
      const transfers:H2ODatedTransferPRE3303A1[]=[];
      const release=volatile*releaseFraction*(Math.exp(-startYear/tauYears)-Math.exp(-endYear/tauYears));
      if(release>0)transfers.push({process:'OUTGASS',from:'INTERIOR_UNSPECIFIED',
        to:'ATMOSPHERIC_VAPOR',massKilograms:release,
        sourceRecordKey:`${base}/interval${i}/FIRST_ORDER_OUTGASSING`});
      // The current P/T snapshot supports only the LAST phase boundary; no
      // unobserved historical climate records are fabricated for earlier bins.
      if(last&&saturation.state!==null){
        // CT-0 vapor cannot exceed hydrostatic saturated water column. To
        // conserve mass, a deposited phase remains a conditional scenario.
        // Upper bound of vapor available at the final boundary (earlier XUV may
        // have removed some); use a separate local replay below for exact kg.
      }
      const mid=Math.max(1,(startYear+endYear)/2);
      const xuvRatio=satXuvRatio*Math.min(1,Math.pow(mid/satYears,-tDecay));
      const xuvWattsPerSquareMeter=bolometric*xuvRatio;
      segments.push({startYear,endYear,sourceRecordKey:`${base}/interval${i}`,
        surfaceTemperatureKelvin:last?ct0T:null,
        surfacePressurePascal:last?ct0P:null,transfers,
        xuvEscape:{sourceRecordKey:`${base}/interval${i}/MODELED_STELLAR_XUV_BOUND`,
          incidentXuvWattsPerSquareMeter:xuvWattsPerSquareMeter,
          heatingEfficiency01:0.10,absorptionRadiusMeters:R,
          rocheFactor01:1,escapingH2OMassFraction01:1},
      });
    }
    // Evolve first to obtain the exact remaining vapor before optional CT-0
    // deposition; no externally invented impacts or arbitrary ocean fraction.
    const history=(items:readonly H2ODatedSegmentPRE3303A1[]):H2ODatedHistoryPRE3303A1=>Object.freeze({
      bodyKey:body,ageYearsCT0:tCT0,provenance:'DATED_PHYSICAL_H2O_MODEL' as const,
      sourceRecordKey:base,segments:Object.freeze(items.map(s=>Object.freeze({...s,transfers:Object.freeze([...s.transfers])}))),
      phase32Chronology:Object.freeze({bodyKey:body,ageYearsCT0:tCT0}),
    });
    let h=history(segments);
    let evolution=PlanetH2OEvolutionEnginePRE3303A1.project(planet,atmosphere,formation,h,phase32Volatiles);
    const vapor=evolution.reservoirs.ATMOSPHERIC_VAPOR ?? 0;
    const excess=Math.max(0,vapor-saturation.mass);
    if(saturation.state!==null && excess>0){
      const last=segments[segments.length-1];
      const condensation:H2ODatedTransferPRE3303A1={
        process:saturation.state==='ICE'?'CONDENSE_ICE':'CONDENSE_LIQUID',
        from:'ATMOSPHERIC_VAPOR',to:saturation.state==='ICE'?'SURFACE_ICE':'SURFACE_LIQUID',
        massKilograms:excess,sourceRecordKey:`${base}/CT0_SATURATION_LIMIT`};
      // This transfer happens after outgassing, before the last segment's XUV.
      // Recompute final pass. It remains conditional, not a measured ocean.
      segments[segments.length-1]={...last,transfers:Object.freeze([...last.transfers,condensation])};
      h=history(segments);
      evolution=PlanetH2OEvolutionEnginePRE3303A1.project(planet,atmosphere,formation,h,phase32Volatiles);
    }
    if(evolution.state!=='CONDITIONAL_EVOLUTION_COMPLETED' ||
       !evolution.massBalance.conditionalConservationVerified)
      throw new RangeError('PRE-33.03a.2 EVOLUTION_DID_NOT_CLOSE');
    return Object.freeze({...common,status:'MODELED_DATED_CONDITIONAL_HISTORY',
      sourceKey:base,history:h,evolution,
      physics:Object.freeze({xuv:'MASS_AND_AGE_PARAMETERIZED_SATURATION_DECAY_HYPOTHESIS' as const,
        outgassing:'VOLATILE_RESERVOIR_FIRST_ORDER_HYPOTHESIS' as const,
        surfacePhases:saturation.state!==null?'ONLY_CT0_SATURATION_COLUMN_ESTIMATE' as const:'UNRESOLVED' as const,
        externalImpacts:'NO_INDEPENDENT_DATED_DELIVERY_SOURCE' as const,
        initialInventory:'BACKPROJECTED_MATURE_19_5_CHEMISTRY_ONLY' as const,
        historicalClimate:'NOT_RECONSTRUCTED' as const}),
    });
  }
}
