import type { Planet } from '../../domain/planetary/planet';
import type { Atmosphere } from '../../domain/planetary/atmosphere';
import {
  H2O_FORWARD_CT0_PRE3303A3, FORWARD_H2O_POOLS,
  type H2OForwardEnvironment, type H2OForwardCT0Result,
  type H2OForwardPool, type H2OForwardHistory,
  validateH2OForwardCT0Result,
} from '../../domain/planetary/planet-h2o-forward-ct0-pre33-03a3';

const ME=5.9722e24, RE=6_371_000, G=6.67430e-11, YEAR=365.25*86400;
const WATER_FUSION_REFERENCE_PA=2e8;
const VALID=(x:number)=>Number.isFinite(x)&&x>=0;
const NONZERO=(x:number)=>Number.isFinite(x)&&x>0;
const key=(p:Planet)=>{const l=p.locator;return `G${l.galaxyIndex}/S${l.sectorKey}/O${l.galacticObjectIndex}/B${l.bodyIndex}`;};
const blank=()=>Object.freeze(Object.fromEntries(FORWARD_H2O_POOLS.map(k=>[k,null])) as Record<H2OForwardPool,null>);
const sum=(v:Record<H2OForwardPool,number>)=>FORWARD_H2O_POOLS.reduce((a,k)=>a+v[k],0);
const cap=(v:number)=>Math.min(1,Math.max(0,v));
const fail=(id:string):never=>{throw new RangeError(`PRE-33.03a.3 ${id}`);};
/**
 * Forward chemical source from formation-era disk energy balance, solar-scaled
 * elemental abundances and local planetary solid/gas mass budgets. Unlike the
 * earlier random 19.5 endmembers this performs no H2O fraction draw.
 * No H2O abundance measurements are present in 17.x: solar-scaled chemistry is
 * an explicit MODEL, not an independently certified physical truth.
 */
export class PlanetH2OForwardCT0EnginePRE3303A3 {
  private constructor() {}
  static project(planet:Planet, atmosphere:Atmosphere,
    environment?:H2OForwardEnvironment): H2OForwardCT0Result {
    if(atmosphere.hostPlanet!==planet) fail('FOREIGN_ATMOSPHERE');
    const identity=key(planet);
    const source=environment??this.environmentFromFormation(planet);
    const unresolved:string[]=[];
    const m=planet.internalComposition;
    const solid=planet.physicalProperties.inheritedSolidCoreMassEarth*ME;
    const radius=planet.physicalProperties.radiusEarth*RE;
    const mass=planet.physicalProperties.massEarth*ME;
    if(!NONZERO(solid)||!NONZERO(radius)||!NONZERO(mass))fail('INVALID_BULK');
    let formation:number|null=null,iceWater=0,interiorWater=0,boundWater=0;
    let temperature:number|null=null,freeze:number|null=null,oxygen:number|null=null,co:number|null=null;
    const assembly=(planet as Planet).architectureSlot?.referenceAssemblyRadiusAu??null;
    if(source && assembly!==null && NONZERO(assembly)){
      if(!source.sourceId.trim() || !NONZERO(source.metallicitySolarRatio) ||
        (source.diskFormationTemperatureKelvin === undefined &&
         !NONZERO(source.stellarLuminosityAtFormationSolar ?? NaN))) fail('INVALID_DISK_SOURCE');
      co=source.carbonOxygenRatio??(2.69/4.90);
      if(!Number.isFinite(co)||co<=0||co>=1.5)fail('INVALID_ELEMENTAL_C_TO_O');
      temperature=source.diskFormationTemperatureKelvin ??
        280*Math.pow(source.stellarLuminosityAtFormationSolar!,0.25)/Math.sqrt(assembly);
      if (source.formationWaterKilogramsFromDisk !== undefined &&
          (source.originChemistryContract !== 'PRE-33.03a.3/V3-DISK-FORMATION-ORIGIN/v1' ||
           !VALID(source.formationWaterKilogramsFromDisk) ||
           source.formationWaterKilogramsFromDisk > solid * (1+1e-8))) {
        fail('INVALID_V3_FORMATION_SOURCE');
      }
      // Taper in a physical disk with an ice sublimation front near 170 K.
      // This is a model equilibrium, not a measured snow line or migrated orbit.
      freeze=cap((190-temperature)/40);
      // Solar abundances per H nucleus, adjusted by supplied stellar metallicity.
      const oxygenTotal=4.90e-4*source.metallicitySolarRatio;
      const carbon=oxygenTotal*co;
      const silicateOxygen=3*3.24e-5*source.metallicitySolarRatio;
      oxygen=Math.max(0,oxygenTotal-carbon-silicateOxygen);
      // Stoichiometric H2O share of condensed volatile species; CO and silicate O
      // cannot be assigned a second time. NH3 and CH4 compete for condensate mass.
      const waterMolecules=oxygen*freeze;
      const competingCO2=Math.max(0,Math.min(carbon*.18,oxygen*.15));
      const competingNitrogen=6.76e-5*source.metallicitySolarRatio*.45;
      const candidateShare=waterMolecules===0?0:18*waterMolecules/
        (18*waterMolecules+44*competingCO2+17*competingNitrogen);
      const iceCapacity=m.condensedIceMassEarth*ME;
      const volatileCapacity=m.volatileRichInteriorMassEarth*ME;
      const combinedCapacity=iceCapacity+volatileCapacity;
      // The chemical abundance of oxygen in the forming SOLIDS constrains the
      // total usable H2O, instead of declaring a percentage of CT0 ice to be water.
      const diskSolidWaterCeiling=solid*18*waterMolecules/
        Math.max(1e-12, 1.35e-2*source.metallicitySolarRatio);
      const waterInCondensed=Math.min(combinedCapacity*candidateShare,diskSolidWaterCeiling);
      iceWater=source.formationWaterKilogramsFromDisk === undefined
        ? combinedCapacity>0?waterInCondensed*iceCapacity/combinedCapacity:0
        : source.formationWaterKilogramsFromDisk;
      interiorWater=source.formationWaterKilogramsFromDisk === undefined
        ? Math.max(0,waterInCondensed-iceWater)
        : iceWater*cap(source.initialInteriorWaterFraction01??0);
      if(source.formationWaterKilogramsFromDisk!==undefined)iceWater-=interiorWater;
      // Only mineral hydration compatible with oxygen not already in silicates;
      // no forced hydration for hot/anhydrous formation sites.
      boundWater=0;
      formation=iceWater+interiorWater+boundWater;
      if(![formation,temperature,freeze,oxygen].every(VALID)) fail('NONFINITE_FORMATION_CHEMISTRY');
      unresolved.push('SOLAR_SCALED_C_O_AND_MINERAL_CHEMISTRY_MODEL_NOT_INDEPENDENT_ABUNDANCE');
      unresolved.push('ASSEMBLY_RADIUS_NOT_TIME_RESOLVED_MIGRATION_HISTORY');
    } else {
      unresolved.push('FORMATION_DISK_LUMINOSITY_OR_ASSEMBLY_RADIUS_MISSING');
    }
    let status:H2OForwardCT0Result['status']=formation===null?'NO_FORMATION_ENVIRONMENT':'MODELED_FORMATION_NO_COMPLETE_HISTORY';
    let pools:Record<H2OForwardPool,number|null>=blank();
    let delivered:null|number=null, escaped:null|number=null,retained:null|number=null,residual:null|number=null;
    const history=source?.history;
    if(formation!==null && history!==undefined) {
      const p=Object.fromEntries(FORWARD_H2O_POOLS.map(k=>[k,0])) as Record<H2OForwardPool,number>;
      p.ICE_OR_DEEP_UNSPECIFIED=iceWater;p.INTERIOR_WATER=interiorWater;p.MINERAL_BOUND=boundWater;
      const result=this.evolve(planet,atmosphere,history,p);
      // CT0 phase partition is calculated at CT0 ONLY, using the independently
      // materialized atmospheric climate/pressure. No past ocean is inferred.
      // Limits follow saturation and hydrostatic overburden; the remainder
      // stays in an explicitly unlocated deep H2O pool, NOT a certified ocean.
      this.partitionAtCT0(planet,atmosphere,p);
      pools=Object.freeze({...p});delivered=result.delivered;escaped=result.escaped;
      retained=sum(p);residual=Math.abs(formation+delivered-escaped-retained)/Math.max(1,formation+delivered);
      if(residual>1e-9)fail('MASS_NOT_CONSERVED');
      status='MODELED_CT0_RESERVOIRS';
      unresolved.push('HISTORICAL_INPUT_IS_PARAMETERIZED_MODEL_NOT_OBSERVATION');
      if(delivered>0||escaped>0)unresolved.push('FROZEN_19_2_BULK_REQUIRES_RECONCILIATION_AFTER_EXCHANGE');
    }else unresolved.push('NO_COMPLETE_DATED_H2O_HISTORY');
    const deep=this.deepStructure(planet,atmosphere,pools,source);
    if(deep.shellThicknessMeters===null)unresolved.push('DEEP_LAYER_EOS_OR_MASS_BUDGET_NOT_RESOLVED');
    if(deep.liquidLayerThicknessMeters===null)unresolved.push('H2O_PRESSURE_TEMPERATURE_PHASE_NOT_ESTABLISHED');
    const res:H2OForwardCT0Result=Object.freeze({
      contractVersion:H2O_FORWARD_CT0_PRE3303A3,bodyKey:identity,status,
      source:Object.freeze({diskId:source?.sourceId??null,historyId:history?.sourceId??null,
        chemistry:formation===null?'UNRESOLVED' as const:
          source?.formationWaterKilogramsFromDisk!==undefined?'V3_FORMATION_DISK_ELEMENTAL_MODEL' as const:
          'SOLAR_SCALED_ELEMENTAL_BUDGET_MODEL' as const,
        waterSpeciesIndependentlyDetermined:false as const}),
      chemistry:Object.freeze({assemblyRadiusAu:assembly,diskTemperatureKelvin:temperature,
        waterIceCondensationFraction01:freeze,oxygenAfterCOAndSilicatesMolesPerHydrogen:oxygen,
        carbonOxygenRatio:co}),
      waterKilograms:Object.freeze({modeledFormation:formation,modeledCT0:retained,
        externalDelivery:delivered,escaped,pools}),deepWater:deep,
      v3TimeEvolutionClosed:source?.originChemistryContract===
        'PRE-33.03a.3/V3-DISK-FORMATION-ORIGIN/v1' && !!history,
      v3ModelBalanceCertified:source?.originChemistryContract===
        'PRE-33.03a.3/V3-DISK-FORMATION-ORIGIN/v1' && !!history &&
        status==='MODELED_CT0_RESERVOIRS' && residual!==null && residual<=1e-9,
      relativeMassResidual01:residual,unresolved:Object.freeze([...new Set(unresolved)]),
      physicalCT0InventoryCertified:false as const,oceanExistenceCertified:false as const,
      observedEvidenceGranted:false as const,
    });
    const problems=validateH2OForwardCT0Result(res);
    if(problems.length)fail('VALIDATION_'+problems.join(','));
    return res;
  }
  /** The native 16.x host carries only a reference luminosity, NOT a chemical abundance record. */
  static environmentFromFormation(planet:Planet):H2OForwardEnvironment|null {
    const host=planet.hostPlanetarySystem?.hostStellarSystem;
    const luminosity=host?.primaryReferenceLuminositySolar;
    if(luminosity===null||luminosity===undefined||!NONZERO(luminosity))return null;
    return Object.freeze({sourceId:`MODEL_DISK_REFERENCE_16/${key(planet)}`,
      stellarLuminosityAtFormationSolar:luminosity,metallicitySolarRatio:1});
  }
  private static evolve(planet:Planet,atmosphere:Atmosphere,history:H2OForwardHistory,
    pools:Record<H2OForwardPool,number>):{delivered:number;escaped:number} {
    if(!history.sourceId.trim()||!Number.isSafeInteger(history.ageYearsCT0)||history.ageYearsCT0<=0||
      history.complete!==true||!history.intervals.length)fail('INVALID_TIME_SOURCE');
    const seen=new Set<string>([history.sourceId]);
    const intervals=[...history.intervals].sort((a,b)=>a.fromYear-b.fromYear);
    let elapsed=0,delivered=0,escaped=0;
    const transfers=[...history.transfers].sort((a,b)=>a.epochYears-b.epochYears);
    let cursor=0;
    for(const x of intervals){
      if(!x.sourceId.trim()||seen.has(x.sourceId)||x.fromYear!==elapsed||
        !Number.isSafeInteger(x.fromYear)||!Number.isSafeInteger(x.toYear)||
        x.toYear<=x.fromYear||x.toYear>history.ageYearsCT0||
        !VALID(x.incidentXuvWattsPerSquareMeter)||!VALID(x.heatingEfficiency01)||
        x.heatingEfficiency01>1||!VALID(x.escapingH2OMassFraction01)||
        x.escapingH2OMassFraction01>1||!NONZERO(x.rocheFactor01)||x.rocheFactor01>1)
        fail('NONCONTIGUOUS_OR_INVALID_XUV_HISTORY');
      seen.add(x.sourceId);
      // Events precede loss in the interval; reject sub-interval event timing
      // unless the caller explicitly splits the corresponding XUV interval.
      while(cursor<transfers.length && transfers[cursor]!.epochYears===x.fromYear){
        const t=transfers[cursor++]!;
        if(!t.sourceId.trim()||seen.has(t.sourceId)||!VALID(t.kilograms)||
          t.from===t.to || t.to==='ATMOSPHERIC_VAPOR'&&t.process==='CONDENSATION' ||
          t.from==='EXTERNAL'&&t.process!=='DELIVERY'||
          t.from!=='EXTERNAL'&&t.process==='DELIVERY')fail('INVALID_DATED_TRANSFER');
        seen.add(t.sourceId);
        if(t.from==='EXTERNAL')delivered+=t.kilograms;
        else {
          if(pools[t.from]<t.kilograms-1e-9*Math.max(1,t.kilograms))fail('INSUFFICIENT_RESERVOIR');
          pools[t.from]=Math.max(0,pools[t.from]-t.kilograms);
        }
        pools[t.to]+=t.kilograms;
      }
      const R=planet.physicalProperties.radiusEarth*RE;
      const M=planet.physicalProperties.massEarth*ME;
      const possible=x.heatingEfficiency01*Math.PI*R**3*x.incidentXuvWattsPerSquareMeter*
        (x.toYear-x.fromYear)*YEAR/(G*M*x.rocheFactor01)*x.escapingH2OMassFraction01;
      if(!VALID(possible))fail('INVALID_XUV_LOSS');
      const loss=Math.min(possible,pools.ATMOSPHERIC_VAPOR);
      pools.ATMOSPHERIC_VAPOR-=loss;escaped+=loss;elapsed=x.toYear;
    }
    if(elapsed!==history.ageYearsCT0||cursor!==transfers.length)fail('INCOMPLETE_DATED_FORCING');
    // Real CT0 atmosphere is not overwritten. Conservation ≠ consistency
    // with an atmospheric partial-pressure or current planet bulk measurement.
    const pressure=atmosphere.waterInventory?.sourceRetainedSurfacePressurePascal;
    if(pressure!==null&&pressure!==undefined&&(!VALID(pressure)))fail('INVALID_CT0_PRESSURE');
    return {delivered,escaped};
  }
  private static partitionAtCT0(
    planet:Planet,atmosphere:Atmosphere,p:Record<H2OForwardPool,number>):void {
    const t=atmosphere.climateState.meanSurfaceTemperatureKelvin;
    const pressure=atmosphere.waterInventory.sourceRetainedSurfacePressurePascal;
    const totalMass=planet.physicalProperties.massEarth*ME;
    const gas=planet.internalComposition.gaseousEnvelopeMassEarth*ME;
    if(t===null||pressure===null||!NONZERO(t)||!VALID(pressure)||
       gas/totalMass>=.1||t>=647.096)return;
    const r=planet.physicalProperties.radiusEarth*RE;
    const g=G*totalMass/(r*r),area=4*Math.PI*r*r;
    if(!NONZERO(g))return;
    // Clausius-Clapeyron first-order vapor-pressure model, constrained to
    // 20.x TOTAL surface pressure (not an asserted H2O partial pressure).
    const satPressure=611.657*Math.exp(Math.max(-90,Math.min(90,
      (t<273.16?6130:5420)*(1/273.16-1/t))));
    const vaporCapacity=Math.min(pressure,satPressure)*area/g;
    if(!VALID(vaporCapacity))return;
    if(p.ATMOSPHERIC_VAPOR>vaporCapacity){
      const condensed=p.ATMOSPHERIC_VAPOR-vaporCapacity;
      p.ATMOSPHERIC_VAPOR-=condensed;p.ICE_OR_DEEP_UNSPECIFIED+=condensed;
    }else if(p.ATMOSPHERIC_VAPOR<vaporCapacity){
      const vaporized=Math.min(vaporCapacity-p.ATMOSPHERIC_VAPOR,
        p.ICE_OR_DEEP_UNSPECIFIED);
      p.ATMOSPHERIC_VAPOR+=vaporized;p.ICE_OR_DEEP_UNSPECIFIED-=vaporized;
    }
    if(t>=273.16 && pressure>=611.657){
      // Above a few hundred MPa the solid/fluid phase needs a proper EOS;
      // only the top low-pressure layer can be assigned liquid here.
      const maxLowPressureLiquidKg=area*WATER_FUSION_REFERENCE_PA/g;
      const liquid=Math.min(p.ICE_OR_DEEP_UNSPECIFIED,maxLowPressureLiquidKg);
      p.SURFACE_LIQUID+=liquid;p.ICE_OR_DEEP_UNSPECIFIED-=liquid;
    }else if(t<273.16){
      // An upper geometry for exposed surface ice, rather than assigning
      // the entire mantle-water reservoir to arbitrary surface glaciers.
      const maxExposedIceKg=area*1000*917;
      const frozen=Math.min(p.ICE_OR_DEEP_UNSPECIFIED,maxExposedIceKg);
      p.SURFACE_ICE+=frozen;p.ICE_OR_DEEP_UNSPECIFIED-=frozen;
    }
  }
  private static deepStructure(planet:Planet,atmosphere:Atmosphere,
    pools:Readonly<Record<H2OForwardPool,number|null>>,
    source:H2OForwardEnvironment|null|undefined): H2OForwardCT0Result['deepWater'] {
    const unresolved={modeledShellKilograms:null,shellThicknessMeters:null,
      basePressurePascal:null,highPressureIceDomainPossible:null,
      liquidLayerThicknessMeters:null,hasIndependentlySourcedThermalProfile:false} as const;
    if(pools.ICE_OR_DEEP_UNSPECIFIED===null)return Object.freeze(unresolved);
    const water=pools.ICE_OR_DEEP_UNSPECIFIED+pools.SURFACE_LIQUID!+
      pools.SURFACE_ICE!+pools.SUBSURFACE_LIQUID!;
    const composition=planet.internalComposition;
    const total=planet.physicalProperties.massEarth*ME;
    const gas=composition.gaseousEnvelopeMassEarth*ME;
    const dry=total-gas-water;
    if(water<=0||dry<=0)return Object.freeze({...unresolved,modeledShellKilograms:water});
    // Constant density reference, deliberately limited to solid-surface models.
    if(atmosphere.climateState?.meanSurfaceTemperatureKelvin===null)return Object.freeze({...unresolved,modeledShellKilograms:water});
    const rhoDry=4400,rhoWater=1100;
    const rDry=Math.cbrt(3*dry/(4*Math.PI*rhoDry));
    const rOut=Math.cbrt(rDry**3+3*water/(4*Math.PI*rhoWater));
    if(rOut>planet.physicalProperties.radiusEarth*RE*(1+1e-6))
      return Object.freeze({...unresolved,modeledShellKilograms:water});
    const thickness=rOut-rDry;
    const pressure=G*rhoWater*dry*(1/rDry-1/rOut)+
      4*Math.PI*G*rhoWater**2/3*((rOut*rOut-rDry*rDry)/2+rDry**3*(1/rOut-1/rDry));
    if(!VALID(pressure))fail('NONFINITE_SHELL');
    const tempTop=source?.waterShellTopTemperatureKelvin;
    const tempBottom=source?.waterShellBaseTemperatureKelvin;
    let liquid:null|number=null;
    // A CT0 surface temperature plus parametrized radiogenic-cooling PRIOR is
    // not an independent deep pressure-temperature profile. Never promote it
    // to a solved liquid/hydrostatic phase thickness during closure audit.
    const hasT=tempTop!==undefined&&tempBottom!==undefined&&NONZERO(tempTop)&&NONZERO(tempBottom)&&
      source?.waterShellThermalProvenance!=='CT0_CLIMATE_PLUS_RADIogenic_COOLING_MODEL';
    if(hasT){
      // Screening only: NOT a water EOS. A separate liquid/ice phase boundary
      // cannot be certified by a two-temperature linear interpolation.
      let result=0;for(let i=0;i<256;i++){
        const x=(i+.5)/256,p=pressure*x,t=tempTop!+(tempBottom!-tempTop!)*x;
        const melt=p<=2e8?273.15-22*p/2e8:251.15+104*(p-2e8)/8e8;
        if(p<=1e9 && t>melt && t<647.096)result++;
      }liquid=thickness*result/256;
    }
    return Object.freeze({modeledShellKilograms:water,shellThicknessMeters:thickness,
      basePressurePascal:pressure,highPressureIceDomainPossible:pressure>=WATER_FUSION_REFERENCE_PA,
      liquidLayerThicknessMeters:liquid,hasIndependentlySourcedThermalProfile:hasT});
  }
}
