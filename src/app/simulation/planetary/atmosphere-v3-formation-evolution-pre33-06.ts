import { AtmosphereGas, atmosphereGasMolarMassGramsPerMole } from '../../domain/planetary/atmosphere-gas';
import type { Atmosphere } from '../../domain/planetary/atmosphere';
import type { Planet } from '../../domain/planetary/planet';
import type { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import type { MoonFormationInventory32F1d } from '../../domain/planetary/moon-formation-inventory-32-f-1d';
import type { MoonAtmosphereAssessment } from '../../domain/planetary/moon-atmosphere-assessment';
import type { AtmosphereClosurePRE3306, AtmosphereForcingPRE3306, AtmosphereGasFluxPRE3306, AtmosphereExobasePRE3306 } from '../../domain/planetary/atmosphere-causal-closure-pre33-06';
import type { V3DiskWaterOrigin } from './planet-h2o-v3-formation-origin';
import { AtmosphereCausalClosureEnginePRE3306 } from './atmosphere-causal-closure-engine-pre33-06';

const ME=5.9722e24, RE=6_371_000, GE=9.80665, KB=1.380649e-23;
const YEAR=365.25*86_400, AU=149_597_870_700, LS=3.828e26;
const NA=6.02214076e23, G=6.67430e-11;
const SIGMA=2e-19;
const clamp=(x:number,a=0,b=1):number=>Math.min(b,Math.max(a,x));
const finite=(x:number):boolean=>Number.isFinite(x)&&x>=0;

type GasBudgets=Readonly<{gas:AtmosphereGas; formedKg:number; initiallyFree01:number; release01:number; tauYears:number}>;
type Body=Readonly<{bodyKind:'PLANET'|'MOON';radiusEarth:number;surfaceGravityEarth:number;massEarth:number;temperatureKelvin:number;
  orbitalRadiusAu:number;hasDefinedSolidSurface:boolean;formation:V3DiskWaterOrigin;gasBudgets:readonly GasBudgets[];sourceId:string;
  scenarioKind:AtmosphereForcingPRE3306['kind']; }>; 
const mkg=(gas:AtmosphereGas):number=>atmosphereGasMolarMassGramsPerMole(gas)/1000/NA;
const sum=(a:readonly number[])=>a.reduce((s,v)=>s+v,0);

/**
 * PRE-33.06: independently forward-generated *simulation* from V3 formation
 * masses/disk chemistry plus explicit stellar activity and atmospheric kinetics.
 * No 20.x/21.x pressure, habitability index or CT0 H2O inventory is an input.
 * Solar-pattern elemental abundances, release efficiencies, EUV/wind ages and
 * unmeasured lunar speciation are named scientific priors, NOT observations.
 * Both the original full formation budget and the residual rocky/ice pools are
 * conserved; deep envelopes have no false solid-surface reference.
 */
export class AtmosphereV3FormationEvolutionPRE3306 {
  private constructor(){}
  // Immutable computed V3 formation states; scenario columns are merged afresh
  // on each call so a different 20.x/21.x view cannot poison the physics cache.
  // Weak keys avoid strong references to regenerated systems/galaxies.
  private static readonly planetHistory=new WeakMap<Planet,{origin:V3DiskWaterOrigin;deep:boolean;computed:AtmosphereClosurePRE3306}>();
  private static readonly moonHistory=new WeakMap<MoonFormationInventory32F1d,{
    moon:MoonPhysicalProperties;host:Planet;origin:V3DiskWaterOrigin;temperature:number;
    computed:AtmosphereClosurePRE3306}>();

  static planet(planet:Planet,atm:Atmosphere,formation:V3DiskWaterOrigin|null):AtmosphereClosurePRE3306 {
    if(!formation||!formation.datedHistoryComplete||formation.timeSinceFormationYears===null||
       formation.sourceBolometricLuminositySolar===null||formation.sourceStellarMassSolar===null)
      return AtmosphereCausalClosureEnginePRE3306.fromPlanet(planet,atm,formation?.sourceId??null);
    const rock=planet.internalComposition.sourceSolidMassEarth*ME;
    const env=planet.internalComposition.sourceEnvelopeMassEarth*ME;
    // The common 17.x disk metallicity and oxygen/carbon pattern predate the
    // 19.x atmosphere. Retained fractions below are explicitly model priors.
    const z=formation.metallicitySolarRatio;
    const cMassCeiling=rock*(2.69e-4*12.011)/(0.0134);
    const nMassCeiling=rock*(6.76e-5*14.007)/(0.0134);
    const cold=clamp((270-formation.assemblyTemperatureKelvin)/210);
    const co2=Math.min(cMassCeiling*(44.0095/12.011)*(0.000012+0.00007*cold),rock*.001);
    const n2=Math.min(nMassCeiling*(0.000009+0.00004*cold),rock*.0001);
    const budgets:GasBudgets[]=[
      {gas:AtmosphereGas.NITROGEN,formedKg:n2,initiallyFree01:.10,release01:.55,tauYears:800e6},
      {gas:AtmosphereGas.CARBON_DIOXIDE,formedKg:co2,initiallyFree01:.08,release01:.56,tauYears:450e6},
      // 19.5 captured envelope mass is a separate genuine gas budget, NOT 20.3 pressure.
      {gas:AtmosphereGas.HYDROGEN,formedKg:env*.75,initiallyFree01:1,release01:0,tauYears:1},
      {gas:AtmosphereGas.HELIUM,formedKg:env*.25,initiallyFree01:1,release01:0,tauYears:1},
    ];
    if(rock<=0||!budgets.some(g=>g.formedKg>0)||
       !finite(env)||!finite(z))return AtmosphereCausalClosureEnginePRE3306.fromPlanet(planet,atm,formation.sourceId);
    const cached=this.planetHistory.get(planet);
    const forward=cached?.origin===formation&&cached.deep===atm.isDeepEnvelope?cached.computed:this.compute({bodyKind:'PLANET',radiusEarth:planet.radiusEarth,
      surfaceGravityEarth:planet.surfaceGravityEarth,massEarth:planet.massEarth,
      // Radiative equilibrium derived from the V3 stellar/orbit formation source;
      // avoid feedback from a phase-20 greenhouse built on old conditional pressure.
      temperatureKelvin:278.5*Math.pow(formation.sourceBolometricLuminositySolar, .25)/
        Math.sqrt(planet.orbit.semiMajorAxisAu)*
        Math.pow((1-clamp(planet.referenceBondAlbedo01 ?? .3))/.7,.25),
      orbitalRadiusAu:planet.orbit.semiMajorAxisAu,hasDefinedSolidSurface:!atm.isDeepEnvelope,formation,gasBudgets:budgets,
      sourceId:formation.sourceId+'/ATMOSPHERIC_FORMATION_V3',scenarioKind:'INDEPENDENT_PROCEDURAL_FORMATION_AND_RATE_MODEL'});
    if(!cached||cached.origin!==formation||cached.deep!==atm.isDeepEnvelope)
      this.planetHistory.set(planet,{origin:formation,deep:atm.isDeepEnvelope,computed:forward});
    const base=AtmosphereCausalClosureEnginePRE3306.fromPlanet(planet,atm,formation.sourceId);
    return Object.freeze({...base,...forward,scenarioPressurePascal:base.scenarioPressurePascal,
      scenarioEquivalentGasMassKilograms:base.scenarioEquivalentGasMassKilograms,
      scenarioPartialsPascal:base.scenarioPartialsPascal,
      referenceH2OCT0Kilograms:base.referenceH2OCT0Kilograms,
      limitations:Object.freeze([...forward.limitations,
        'CO2 y N2 primordial: asignaciones con patrón solar y eficiencias acotadas, no abundancias del disco medidas.',
        'Gas capturado de 19.5: presupuesto independiente de las columnas 20.x; sin recalcular clases u órbitas.'])});
  }

  static moon(moon:MoonPhysicalProperties,atm:MoonAtmosphereAssessment|null,
    inventory:MoonFormationInventory32F1d|null,hostPlanet:Planet,
    formation:V3DiskWaterOrigin|null,temperatureKelvin:number):AtmosphereClosurePRE3306 {
    const base=()=>AtmosphereCausalClosureEnginePRE3306.fromMoon(moon,atm,inventory);
    if(!inventory||!formation||!formation.datedHistoryComplete||
       formation.timeSinceFormationYears===null||formation.sourceStellarMassSolar===null||
       formation.sourceBolometricLuminositySolar===null)return base();
    const other=inventory.otherCondensableMassKilograms;
    const ice=inventory.waterIceMassKilograms;
    if(!finite(other)||!finite(ice)||!finite(temperatureKelvin)||temperatureKelvin<=0)return base();
    // 32.F.1d identifies an OTHER condensable mass, but NOT species. The
    // assumed split is therefore CONDITIONAL; never claim uniquely known N2/CO2.
    const c=formation.carbonOxygenRatio;
    const nFraction=clamp(.28+(1-c)*.12,.22,.40);
    // Only a bounded portion of the unidentified condensed budget is assumed
    // chemically releasable. Remaining condensables stay in the interior.
    const outgasShare=.10;
    const budgets:GasBudgets[]=[
      {gas:AtmosphereGas.NITROGEN,formedKg:other*outgasShare*nFraction,initiallyFree01:.03,release01:.72,tauYears:1.2e9},
      {gas:AtmosphereGas.CARBON_DIOXIDE,formedKg:other*outgasShare*(1-nFraction),initiallyFree01:.02,release01:.68,tauYears:600e6},
    ];
    if(!budgets.some(g=>g.formedKg>0))return base();
    const cachedMoon=this.moonHistory.get(inventory);
    const computed=cachedMoon?.moon===moon&&cachedMoon.host===hostPlanet&&
      cachedMoon.origin===formation&&cachedMoon.temperature===temperatureKelvin
      ?cachedMoon.computed:this.compute({bodyKind:'MOON',radiusEarth:moon.radiusEarth,
      surfaceGravityEarth:moon.surfaceGravityEarth,massEarth:moon.massEarth,
      temperatureKelvin,orbitalRadiusAu:hostPlanet.orbit.semiMajorAxisAu,hasDefinedSolidSurface:true,formation,
      gasBudgets:budgets,sourceId:`${formation.sourceId}/MOON${moon.moonOrdinal}/ATMOSPHERIC_ENDMEMBER_V3`,
      scenarioKind:'CONDITIONAL_ENDMEMBER'});
    if(!cachedMoon||cachedMoon.moon!==moon||cachedMoon.host!==hostPlanet||
      cachedMoon.origin!==formation||cachedMoon.temperature!==temperatureKelvin)
      this.moonHistory.set(inventory,{moon,host:hostPlanet,origin:formation,
        temperature:temperatureKelvin,computed});
    const existing=base();
    return Object.freeze({...existing,...computed,
      scenarioPressurePascal:existing.scenarioPressurePascal,
      scenarioEquivalentGasMassKilograms:existing.scenarioEquivalentGasMassKilograms,
      scenarioPartialsPascal:existing.scenarioPartialsPascal,
      referenceH2OCT0Kilograms:null,
      reservoirSourceId:inventory.contractVersion,
      conditionalVolatileReservoirCeilingKilograms:inventory.maximumPotentialVolatileSupplyKilograms,
      limitations:Object.freeze([...computed.limitations,
        'Lunar 32.F.1d no identifica químicamente otros condensables: N2/CO2 es un escenario solar, no composición resuelta.',
        'No se extrae H2O lunar del hielo sin una transferencia térmica identificada.'])});
  }

  private static compute(body:Body):AtmosphereClosurePRE3306 {
    const f=body.formation,age=f.timeSinceFormationYears!;
    const source=body.sourceId;
    if(!Number.isFinite(age)||age<=0||age>2e10||!Number.isFinite(body.temperatureKelvin)||
       body.temperatureKelvin<=0||!Number.isFinite(body.orbitalRadiusAu)||body.orbitalRadiusAu<=0)
      throw new RangeError('PRE33_06_INVALID_V3_STELLAR_TIME_OR_TEMPERATURE');
    const gasKg=Object.fromEntries(Object.values(AtmosphereGas).map(g=>[g,0])) as Record<AtmosphereGas,number>;
    const formationMass=sum(body.gasBudgets.map(b=>b.formedKg));
    for(const b of body.gasBudgets){if(!finite(b.formedKg)||!finite(b.release01)||
      b.initiallyFree01+b.release01>1+1e-12)throw new RangeError('PRE33_06_VOLATILE_MASS_BUDGET');
      gasKg[b.gas]+=b.formedKg*b.initiallyFree01;
    }
    const primordial=sum(Object.values(gasKg));
    const epochYears=[0,1e6,10e6,100e6,500e6,2e9,5e9,10e9,age]
      .filter(t=>t>=0&&t<=age).concat(age).filter((x,i,a)=>a.indexOf(x)===i).sort((a,b)=>a-b);
    const radius=body.radiusEarth*RE,area=4*Math.PI*radius*radius,
      g=body.surfaceGravityEarth*GE,kgPerPa=area/g;
    const hostM=f.sourceStellarMassSolar!,hostL=f.sourceBolometricLuminositySolar!;
    const incident=LS*hostL/(4*Math.PI*(body.orbitalRadiusAu*AU)**2);
    const windReference=2.2e12/(body.orbitalRadiusAu**2); // calibrated 1-AU solar wind model prior
    const species=Object.values(AtmosphereGas);
    let totalSupply=0,totalThermal=0,totalParticle=0,totalPhotoEscaped=0,totalUnknownPhoto=0,totalCondensed=0;
    const history:NonNullable<AtmosphereClosurePRE3306['historyEpochs']>[number][]=[];
    let last:AtmosphereClosurePRE3306|null=null;
    const sourceIDs:string[]=[];
    for(let step=0;step<epochYears.length-1;step++){
      const from=epochYears[step]!,to=epochYears[step+1]!,dt=(to-from)*YEAR;
      const midpoint=(from+to)/2+Math.max(0,(f.stellarAgeYearsCT0??age)-age);
      const saturated=hostM<.6?500e6:hostM<1.2?100e6:30e6;
      const xuv=incident*.001*Math.min(1,Math.pow(Math.max(1,midpoint)/saturated,-1.25));
      const wind=windReference*Math.min(30,Math.pow(Math.max(midpoint,10e6)/4.5e9,-.65));
      // Thermospheric EUV heating uses an explicit solar-calibrated XUV
      // activity law. NOT a claim that bolometric irradiance itself is EUV.
      const tempExo=clamp(body.temperatureKelvin + 300*Math.sqrt(xuv/.005),
        body.temperatureKelvin,Math.max(2200,body.temperatureKelvin));
      const molecules=species.reduce((s,sp)=>s+gasKg[sp]/mkg(sp),0);
      const gasMass=sum(Object.values(gasKg));
      const massParticle=molecules>0?gasMass/molecules:mkg(AtmosphereGas.NITROGEN);
      const H=KB*tempExo/(Math.max(1e-20,massParticle)*g);
      const n0=Math.max(0,gasMass/kgPerPa)/(KB*body.temperatureKelvin);
      const nExo=1/(Math.SQRT2*SIGMA*H);
      const altitude=n0>nExo?Math.max(0,H*Math.log(n0/nExo)):0;
      const exoValid=n0>nExo&&altitude<radius*.35&&H<radius*.25;
      const exo:AtmosphereExobasePRE3306|null=exoValid?{
        sourceId:`${source}/V3_KINETIC_BOUNDARY/${step}/XUV_STELLAR_AGE_PRIOR`,
        altitudeMeters:altitude,temperatureKelvin:tempExo,
        numberDensityPerCubicMeter:nExo,collisionCrossSectionSquareMeters:SIGMA,
        euvWattsPerSquareMeter:xuv,particleNumberFluxPerSquareMeterPerSecond:wind}:null;
      const mEscapePerSecond=xuv*Math.PI*radius*radius*radius*.08/(G*body.massEarth*ME);
      const rateSpecs:AtmosphereGasFluxPRE3306[]=species.map(sp=>{
        const budget=body.gasBudgets.find(x=>x.gas===sp);
        const release=budget?budget.formedKg*budget.release01*(Math.exp(-from/budget.tauYears)-
          Math.exp(-to/budget.tauYears))/dt:0;
        const molecularMass=mkg(sp);
        const lambda=G*body.massEarth*ME*molecularMass/(KB*tempExo*(radius+altitude));
        const molShare=molecules>0?(gasKg[sp]/molecularMass)/molecules:0;
        const jeans=exo&&lambda<150?4*Math.PI*(radius+altitude)**2*nExo*molShare*molecularMass*Math.sqrt(KB*tempExo/(2*Math.PI*molecularMass)) *
          (1+lambda)*Math.exp(-lambda):0;
        const hOrHe=sp===AtmosphereGas.HYDROGEN||sp===AtmosphereGas.HELIUM;
        const energy=exo&&hOrHe?mEscapePerSecond*(sp===AtmosphereGas.HYDROGEN?.75:.25):0;
        // Sputtering uses a particle-budget-limited (not bolometric) model prior.
        const sputter=exo?wind*Math.PI*(radius+altitude)**2*molecularMass*molShare*0.004:0;
        const photolyse=sp===AtmosphereGas.CARBON_DIOXIDE?Math.min(4e-17,xuv*1.2e-15):0;
        return {gas:sp,initialGasKilograms:gasKg[sp],replenishmentKilogramsPerSecond:Math.max(0,release),
          thermalEscapeKilogramsPerSecond:Math.min(1e30,Math.max(0,jeans+energy)),
          particleEscapeKilogramsPerSecond:Math.min(1e30,Math.max(0,sputter)),
          photolysisPerSecond:photolyse,photolysisEscapingFraction01:0,
          ...(sp===AtmosphereGas.CARBON_DIOXIDE?{photolysisProducts:[
            {gas:AtmosphereGas.CARBON_MONOXIDE,retainedMassFraction01:28.0101/44.0095},
            {gas:AtmosphereGas.OXYGEN,retainedMassFraction01:1-28.0101/44.0095}]}:{})};
      });
      const interval:AtmosphereForcingPRE3306={kind:body.scenarioKind,
        initialInventorySourceId:`${source}/FORMATION_BUDGET_V3`,
        massRateSourceId:`${source}/V3_STELLAR_XUV_WIND_COOLING/${step}`,
        intervalSeconds:dt,surfaceTemperatureKelvin:body.temperatureKelvin,species:rateSpecs};
      const result=AtmosphereCausalClosureEnginePRE3306.evaluate({bodyKind:body.bodyKind,
        radiusEarth:body.radiusEarth,surfaceGravityEarth:body.surfaceGravityEarth,
        hasDefinedSolidSurface:body.hasDefinedSolidSurface,legacyScenarioPressurePascal:null,
        legacyScenarioMoleFractions:[],conditionalVolatileReservoirCeilingKilograms:null,
        reservoirSourceId:source,forcing:interval,exobase:exo});
      const partials=result.causalModelPartialsPascal.length>0?result.causalModelPartialsPascal:
        rateSpecs.map((gas,j)=>({gas:gas.gas,pressurePascal:(result.candidateForwardPressurePascal===null?0:0)}));
      // The diagnostic closure hides provisional per-species columns. Rebuild
      // the terminal species inventory exactly from the underlying ledger's
      // *computed* partials; to avoid losing data, the balance engine exposes
      // candidate partials even when status is conditional (see shared kernel).
      const recorded=result.candidateForwardPartialsPascal??partials;
      for(const sp of species)gasKg[sp]=Math.max(0,
        (recorded.find(p=>p.gas===sp)?.pressurePascal??0)*kgPerPa);
      totalSupply+=result.suppliedKilograms??0;
      totalThermal+=result.thermalEscapedKilograms??0;
      totalParticle+=result.particleEscapedKilograms??0;
      totalPhotoEscaped+=result.photolysisEscapedKilograms??0;
      totalUnknownPhoto+=result.unidentifiedPhotochemicalKilograms??0;
      totalCondensed+=result.condensedKilograms??0;
      sourceIDs.push(interval.massRateSourceId);
      history.push(Object.freeze({fromYears:from,toYears:to,sourceId:interval.massRateSourceId,
        xuvWattsPerSquareMeter:xuv,replenishedKilograms:result.suppliedKilograms??0,
        escapedKilograms:(result.thermalEscapedKilograms??0)+(result.particleEscapedKilograms??0)+
          (result.photolysisEscapedKilograms??0),condensedKilograms:result.condensedKilograms??0,
        gasKilograms:result.remainingGasKilograms??0,pressurePascal:result.candidateForwardPressurePascal??0}));
      last=result;
    }
    if(!last)throw new RangeError('PRE33_06_EMPTY_HISTORY');
    const final=sum(Object.values(gasKg));
    const residual=Math.abs(primordial+totalSupply-final-totalThermal-totalParticle-totalPhotoEscaped-
      totalUnknownPhoto-totalCondensed)/Math.max(1,primordial+totalSupply);
    if(residual>1e-7||!finite(residual)||primordial+totalSupply>formationMass*(1+1e-9))
      throw new RangeError('PRE33_06_NONCONSERVATIVE_FORMATION_TO_CT0');
    const status=!body.hasDefinedSolidSurface?'NO_SOLID_SURFACE_REFERENCE':
      body.scenarioKind==='CONDITIONAL_ENDMEMBER'
      ?'CONDITIONAL_FORWARD_SCENARIO':last.status;
    const closed=status==='CAUSAL_INTERVAL_MODEL_RESOLVED';
    const candidate=final/kgPerPa;
    const partials=Object.freeze(species.map(gas=>Object.freeze({gas,pressurePascal:gasKg[gas]/kgPerPa})));
    return Object.freeze({...last,status,intervalSeconds:age*YEAR,
      inventorySourceId:`${source}/FORMATION_BUDGET_V3`,
      ratesSourceId:`${source}/DATED_STELLAR_AND_RELEASE_MODEL_V3`,
      initialGasKilograms:primordial,suppliedKilograms:totalSupply,
      thermalEscapedKilograms:totalThermal,particleEscapedKilograms:totalParticle,
      photolysisEscapedKilograms:totalPhotoEscaped,
      unidentifiedPhotochemicalKilograms:totalUnknownPhoto,
      condensedKilograms:totalCondensed,remainingGasKilograms:final,
      relativeMassResidual01:residual,candidateForwardPressurePascal:candidate,
      candidateForwardPartialsPascal:partials,
      causalModelPressurePascal:closed?candidate:null,
      causalModelPartialsPascal:closed?partials:Object.freeze([]),
      historyEpochs:Object.freeze(history),formationReservoirKilograms:formationMass,
      assumedChemistry:body.bodyKind==='PLANET'?'SOLAR_SCALED_FORMATION_MODEL':'UNIDENTIFIED_LUNAR_VOLATILE_ENDMEMBER',
      limitations:Object.freeze([
        'Evolución CT-0 simulada por épocas: EUV, viento, desgasificación y especiación son modelos paramétricos fechados, no medidas.',
        'El inventario al nacimiento procede de masa de formación y química de disco; ninguna presión 20.x/21.x alimenta el cálculo.',
        'Fotoproductos CO y O2 se conservan; recombinación, mineralogía y química atmosférica avanzada no resueltas.',
        'Temperatura de cierre V3: equilibrio radiativo orbital previo a presión 20.x; retroacción de invernadero no acoplada.',
        'Ni presencia de O2 ni presión modelada constituyen evidencia de biología ni descubrimiento observado.',
      ])});
  }
}
