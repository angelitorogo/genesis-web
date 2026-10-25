import type { Planet } from '../../domain/planetary/planet';
import type { Atmosphere } from '../../domain/planetary/atmosphere';
import type {
  H2OForwardEnvironment, H2OForwardHistory, H2OForwardTimedTransfer,
  H2OForwardXuvInterval,
} from '../../domain/planetary/planet-h2o-forward-ct0-pre33-03a3';
import type { V3DiskWaterOrigin } from './planet-h2o-v3-formation-origin';

const AU_METERS=149_597_870_700;
const SOLAR_LUMINOSITY_W=3.828e26;
const EARTH_MASS_KG=5.9722e24;
const EARTH_RADIUS_M=6_371_000;
const G=6.67430e-11;
const finitePositive=(v:number|null):v is number=>v!==null&&Number.isFinite(v)&&v>0;
const clamp=(v:number,lo=0,hi=1)=>Math.max(lo,Math.min(hi,v));

/**
 * V3 source-driven forward timeline. The time coordinates are YEARS AFTER
 * actual stage-17.7 planet formation, never wall-clock time. This completes
 * the *specified simulation model*, not an observational reconstruction of
 * unknown impacts, spectra, disk abundance ratios, or mantle mineralogy.
 * All flux/efficiency/cooling laws are named model parameters. No random
 * events, imported Earth oceans, or CT0 back-projected mineral fractions.
 */
export class PlanetH2OV3CT0Evolution {
  private constructor() {}
  static fromOrigin(
    planet:Planet, atmosphere:Atmosphere, origin:V3DiskWaterOrigin,
  ):H2OForwardEnvironment {
    if(atmosphere.hostPlanet!==planet || origin.bodyIndex!==planet.locator.bodyIndex ||
       origin.sourceFormationOrdinals.join(',')!==planet.architectureSlot.sourceFormationOrdinals.join(','))
      throw new RangeError('CT0_V3_FOREIGN_SOURCE');
    const base:H2OForwardEnvironment={
      sourceId:origin.sourceId,
      metallicitySolarRatio:origin.metallicitySolarRatio,
      carbonOxygenRatio:origin.carbonOxygenRatio,
      formationWaterKilogramsFromDisk:origin.formationWaterKilograms,
      diskFormationTemperatureKelvin:origin.assemblyTemperatureKelvin,
      originChemistryContract:origin.contract,
    };
    const age=origin.timeSinceFormationYears,starM=origin.sourceStellarMassSolar,
      lum=origin.sourceBolometricLuminositySolar;
    if(!finitePositive(age)||!Number.isSafeInteger(age)||
       !finitePositive(starM)||!finitePositive(lum))return Object.freeze(base);
    const semimajor=planet.orbit.semiMajorAxisAu;
    const ecc=planet.orbit.eccentricity;
    if(!finitePositive(semimajor)||!Number.isFinite(ecc)||ecc<0||ecc>=1)
      throw new RangeError('CT0_V3_INVALID_ORBIT');
    const initial=origin.formationWaterKilograms;
    const mass=planet.physicalProperties.massEarth*EARTH_MASS_KG;
    const radius=planet.physicalProperties.radiusEarth*EARTH_RADIUS_M;
    if(!finitePositive(mass)||!finitePositive(radius)||initial>mass*(1+1e-10))
      throw new RangeError('CT0_V3_INVALID_PLANET_BUDGET');

    // Water trapped in early hot condensed materials (thermal release model).
    // The fraction is determined by the gravity well and formation temperature,
    // NOT by the final 19.5 endmember split. 0 <= fraction <= 0.45.
    const gravitationalTemperature=G*mass/(radius*2000);
    const trapped=clamp((origin.assemblyTemperatureKelvin+0.03*gravitationalTemperature-160)/1100,0,.45);
    const times=[0,1e6,3e6,10e6,30e6,100e6,300e6,1e9,3e9,7e9,age]
      .filter(t=>t>=0&&t<=age);
    if(!times.includes(age))times.push(age);
    const boundaries=[...new Set(times)].sort((a,b)=>a-b);
    const transfers:H2OForwardTimedTransfer[]=[];
    const intervals:H2OForwardXuvInterval[]=[];
    const tauRelease=Math.max(40e6,Math.min(3e9,350e6*Math.sqrt(mass/EARTH_MASS_KG)));
    const tauAccrete=30e6; // declining leftover-disk water flux, explicitly modeled
    const lateBudget=Math.min(origin.lateDeliveryWaterBudgetKilograms,
      Math.max(0,mass-initial)*0.001);
    const sourceId=`${origin.sourceId}/H2O_V3_TIME_EVOLUTION/v1`;
    const ageStarFormation=(origin.stellarAgeYearsCT0??age)-age;
    const saturate=starM<.6?500e6:starM<1.2?100e6:30e6;
    const referenceFlux=SOLAR_LUMINOSITY_W*lum/
      (4*Math.PI*(semimajor*AU_METERS)**2*Math.sqrt(1-ecc*ecc));
    for(let i=0;i<boundaries.length-1;i++){
      const fromYear=boundaries[i]!,toYear=boundaries[i+1]!;
      const midStellarAge=Math.max(1,ageStarFormation+(fromYear+toYear)/2);
      // Rotation-activity scaling as a transparent hypothesis; stellar bolometric
      // luminosity is only a CT0 reference, NOT a measured historic XUV curve.
      const xuvRatio=.001*Math.min(1,Math.pow(midStellarAge/saturate,-1.25));
      intervals.push(Object.freeze({sourceId:`${sourceId}/XUV/${i}`,
        fromYear,toYear,incidentXuvWattsPerSquareMeter:referenceFlux*xuvRatio,
        heatingEfficiency01:.10,escapingH2OMassFraction01:1,rocheFactor01:1}));
      const released=initial*trapped*.55*(Math.exp(-fromYear/tauRelease)-
        Math.exp(-toYear/tauRelease));
      if(released>0)transfers.push(Object.freeze({
        sourceId:`${sourceId}/INTERIOR_DEGASSING/${i}`,epochYears:fromYear,
        from:'INTERIOR_WATER',to:'ATMOSPHERIC_VAPOR',
        kilograms:released,process:'OUTGASS'}));
      const delivered=lateBudget*(Math.exp(-fromYear/tauAccrete)-Math.exp(-toYear/tauAccrete));
      if(delivered>0)transfers.push(Object.freeze({
        // Continuous leftover-disk reservoir: this is a RATE integral, not an
        // invented observed impact/catastrophe in phase 32.
        sourceId:`${sourceId}/RESIDUAL_DISK_ACCRETION/${i}`,epochYears:fromYear,
        from:'EXTERNAL',to:'ICE_OR_DEEP_UNSPECIFIED',
        kilograms:delivered,process:'DELIVERY'}));
    }
    const history:H2OForwardHistory=Object.freeze({
      sourceId,ageYearsCT0:age,intervals:Object.freeze(intervals),
      transfers:Object.freeze(transfers),complete:true,
    });
    // CT0 atmospheric surface climate is independent of our water-shell model.
    // It is NOT projected backwards to pre-CT0 epochs. Use a separate
    // interior-cooling reference ONLY for a *conditional* deep-water screen.
    const top=atmosphere.climateState.meanSurfaceTemperatureKelvin;
    const gas=planet.internalComposition.gaseousEnvelopeMassEarth*EARTH_MASS_KG;
    const accessibleSolidSurface=top!==null&&Number.isFinite(top)&&top>0&&
      gas/mass<0.1;
    const heatFlux=0.08*Math.pow(Math.max(1e6,age)/4.5e9,-.35)*
      Math.pow(mass/EARTH_MASS_KG,.2); // radiogenic secular heat-flux PRIOR
    const baseTemp=accessibleSolidSurface ? top!+
      Math.min(350,Math.max(0,heatFlux)*1400) : undefined;
    return Object.freeze({
      ...base,history,initialInteriorWaterFraction01:trapped,
      ...(accessibleSolidSurface?{
        waterShellTopTemperatureKelvin:top!,
        waterShellBaseTemperatureKelvin:baseTemp,
        waterShellThermalProvenance:'CT0_CLIMATE_PLUS_RADIogenic_COOLING_MODEL' as const,
      }:{})
    });
  }
}
