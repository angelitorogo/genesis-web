import { AtmosphereGas, atmosphereGasMolarMassGramsPerMole } from '../../domain/planetary/atmosphere-gas';
import type { Atmosphere } from '../../domain/planetary/atmosphere';
import type { Planet } from '../../domain/planetary/planet';
import type { MoonAtmosphereAssessment } from '../../domain/planetary/moon-atmosphere-assessment';
import type { MoonFormationInventory32F1d } from '../../domain/planetary/moon-formation-inventory-32-f-1d';
import type {
  AtmosphereClosureInputPRE3306, AtmosphereClosurePRE3306, AtmosphereClosureStatusPRE3306,
  AtmosphereForcingPRE3306, AtmosphereExobasePRE3306,
} from '../../domain/planetary/atmosphere-causal-closure-pre33-06';
import { condensableSaturationPressurePascal } from './atmosphere-condensable-thermodynamics';
import { waterSaturationVaporPressurePascal } from './atmosphere-radiative-column-model';

const RE=6_371_000, GE=9.80665, KB=1.380649e-23, NA=6.02214076e23;
const VALID=(n:number):boolean=>Number.isFinite(n)&&n>=0;
const CLOSE=(a:number,b:number):boolean=>Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(a),Math.abs(b));
const STAGES=128;
const LIMITATIONS=Object.freeze([
  'Presiones 20.x/21.x e índices V1/V2 son escenarios; no se convierten en masas de formación.',
  'El reservorio H2O/condensables es sólido o interior hasta justificar especies, liberación y tasas.',
  'No se infieren EUV, partículas ni exobase de la insolación bolométrica o la magnetosfera.',
  'Un balance CT-0 modelado no es una medición ni demuestra persistencia histórica o vida.',
]);

/**
 * Common forward species ledger. This engine never mutates generation or
 * knowledge state. To solve a gas column it needs *separate* identified V3
 * primordial mass, kg/s forcing and kinetic external-environment inputs.
 */
export class AtmosphereCausalClosureEnginePRE3306 {
  private constructor() {}

  static fromPlanet(planet:Planet,atmosphere:Atmosphere,
    reservoirSourceId:string|null=null,
    retainedH2OKilograms:number|null=null,
    forcing:AtmosphereForcingPRE3306|null=null,
    exobase:AtmosphereExobasePRE3306|null=null):AtmosphereClosurePRE3306 {
    if(atmosphere.hostPlanet!==planet)throw new RangeError('PRE-33.06 foreign planetary atmosphere.');
    // H2O in a crust/deep pool is NOT automatically gaseous (separate sources).
    return this.evaluate({bodyKind:'PLANET',radiusEarth:planet.radiusEarth,
      surfaceGravityEarth:planet.surfaceGravityEarth,
      hasDefinedSolidSurface:!atmosphere.isDeepEnvelope,
      legacyScenarioPressurePascal:atmosphere.retainedSurfacePressurePascal,
      legacyScenarioMoleFractions:atmosphere.retainedGasComposition.map(g=>({gas:g.gas,moleFraction01:g.moleFraction01})),
      conditionalVolatileReservoirCeilingKilograms:null,
      reservoirSourceId,referenceH2OCT0Kilograms:retainedH2OKilograms,forcing,exobase});
  }

  static fromMoon(moon:Readonly<{radiusEarth:number;surfaceGravityEarth:number;hostPlanetOrdinal:number;moonOrdinal:number}>,
    atmosphere:MoonAtmosphereAssessment|null,
    inventory:MoonFormationInventory32F1d|null=null,
    forcing:AtmosphereForcingPRE3306|null=null,
    exobase:AtmosphereExobasePRE3306|null=null):AtmosphereClosurePRE3306 {
    if(inventory&&(inventory.hostPlanetOrdinal!==moon.hostPlanetOrdinal||inventory.moonOrdinal!==moon.moonOrdinal))
      throw new RangeError('PRE-33.06 moon gas reservoir identity mismatch.');
    return this.evaluate({bodyKind:'MOON',radiusEarth:moon.radiusEarth,
      surfaceGravityEarth:moon.surfaceGravityEarth,hasDefinedSolidSurface:true,
      legacyScenarioPressurePascal:atmosphere?.pressureBasis==='CONDITIONAL_SCENARIO'
        ? atmosphere.estimatedSurfacePressurePascal : null,
      legacyScenarioMoleFractions:atmosphere?.pressureBasis==='CONDITIONAL_SCENARIO'
        ? (atmosphere.species??[]).map(g=>({gas:g.gas,moleFraction01:g.moleFraction01})) : [],
      conditionalVolatileReservoirCeilingKilograms:inventory?.maximumPotentialVolatileSupplyKilograms??null,
      reservoirSourceId:inventory?.contractVersion??null,referenceH2OCT0Kilograms:null,forcing,exobase});
  }

  static evaluate(i:AtmosphereClosureInputPRE3306):AtmosphereClosurePRE3306 {
    if(!Number.isFinite(i.radiusEarth)||i.radiusEarth<=0||
      !Number.isFinite(i.surfaceGravityEarth)||i.surfaceGravityEarth<=0)
      throw new RangeError('PRE-33.06 invalid body geometry.');
    if(i.legacyScenarioPressurePascal!==null&&!VALID(i.legacyScenarioPressurePascal))
      throw new RangeError('PRE-33.06 invalid legacy conditional pressure.');
    if(i.conditionalVolatileReservoirCeilingKilograms!==null&&!VALID(i.conditionalVolatileReservoirCeilingKilograms))
      throw new RangeError('PRE-33.06 invalid condensed/volatile reservoir ceiling.');
    if(i.referenceH2OCT0Kilograms!=null&&!VALID(i.referenceH2OCT0Kilograms))
      throw new RangeError('PRE-33.06 invalid water reference mass.');
    const area=4*Math.PI*(i.radiusEarth*RE)**2,kgPerPa=area/(i.surfaceGravityEarth*GE);
    let scenarioPartials:readonly Readonly<{gas:AtmosphereGas;pressurePascal:number}>[]=[];
    if(i.legacyScenarioPressurePascal!==null){
      const sum=i.legacyScenarioMoleFractions.reduce((s,g)=>{
        if(!Object.values(AtmosphereGas).includes(g.gas)||!VALID(g.moleFraction01)||g.moleFraction01>1)
          throw new RangeError('PRE-33.06 invalid scenario chemical fraction.');
        return s+g.moleFraction01;
      },0);
      if(sum>1+1e-8)throw new RangeError('PRE-33.06 scenario chemical fractions exceed 1.');
      scenarioPartials=Object.freeze(i.legacyScenarioMoleFractions.map(g=>Object.freeze({
        gas:g.gas,pressurePascal:i.legacyScenarioPressurePascal!*g.moleFraction01})));
    }
    const f=i.forcing??null,e=i.exobase??null;
    let status:AtmosphereClosureStatusPRE3306=i.hasDefinedSolidSurface
      ?'MISSING_PRIMORDIAL_GAS_INVENTORY_AND_FLUXES':'NO_SOLID_SURFACE_REFERENCE';
    let initial:number|null=null,supplied:number|null=null,thermal:number|null=null,
      particle:number|null=null,photoLost:number|null=null,photoProducts:number|null=null,
      condensed:number|null=null,remaining:number|null=null,residual:number|null=null,kn:number|null=null,
      candidatePressure:number|null=null,causalPressure:number|null=null;
    let finalPartials:readonly Readonly<{gas:AtmosphereGas;pressurePascal:number}>[]=[];
    if(f!==null){
      if(!f.initialInventorySourceId.trim()||!f.massRateSourceId.trim()||
        !Number.isFinite(f.intervalSeconds)||f.intervalSeconds<=0||
        !Number.isFinite(f.surfaceTemperatureKelvin)||f.surfaceTemperatureKelvin<=0||
        f.species.length===0)
        throw new RangeError('PRE-33.06 incomplete independently identified forcing.');
      const names=new Set<AtmosphereGas>();
      for(const g of f.species){
        if(!Object.values(AtmosphereGas).includes(g.gas)||names.has(g.gas))
          throw new RangeError('PRE-33.06 unknown or repeated gas.');
        names.add(g.gas);
        if(![g.initialGasKilograms,g.replenishmentKilogramsPerSecond,
          g.thermalEscapeKilogramsPerSecond,g.particleEscapeKilogramsPerSecond,
          g.photolysisPerSecond,g.photolysisEscapingFraction01].every(VALID)||g.photolysisEscapingFraction01>1)
          throw new RangeError('PRE-33.06 missing or invalid signed source/sink rate.');
      }
      // Products must be explicitly represented by other supported gases.
      for(const g of f.species){
        const products=g.photolysisProducts??[];
        if(products.length && products.reduce((a,p)=>a+p.retainedMassFraction01,0)>1+1e-10)
          throw new RangeError('PRE-33.06 photolysis products exceed original molecule mass.');
        for(const p of products){
          if(!names.has(p.gas)||!VALID(p.retainedMassFraction01)||p.retainedMassFraction01>1)
            throw new RangeError('PRE-33.06 photolysis needs a real destination gas and valid fraction.');
        }
      }
      const masses=f.species.map(g=>g.initialGasKilograms);
      initial=masses.reduce((s,v)=>s+v,0);supplied=0;thermal=0;particle=0;photoLost=0;photoProducts=0;condensed=0;
      const dt=f.intervalSeconds/STAGES;
      for(let step=0;step<STAGES;step++){
        const produced=new Array<number>(f.species.length).fill(0);
        f.species.forEach((g,j)=>{
        let mass=masses[j];
        const input=g.replenishmentKilogramsPerSecond*dt;
        mass+=input;supplied!+=input;
        const thermalOut=Math.min(mass,g.thermalEscapeKilogramsPerSecond*dt);
        mass-=thermalOut;thermal!+=thermalOut;
        const particleOut=Math.min(mass,g.particleEscapeKilogramsPerSecond*dt);
        mass-=particleOut;particle!+=particleOut;
        const dissociated=mass*(-Math.expm1(-g.photolysisPerSecond*dt));
        mass-=dissociated;photoLost!+=dissociated*g.photolysisEscapingFraction01;
        const retained=dissociated*(1-g.photolysisEscapingFraction01);
        const products=g.photolysisProducts??[];
        const accounted=products.reduce((sum,p)=>sum+p.retainedMassFraction01,0);
        photoProducts!+=retained*(1-accounted);
        for(const p of products){
          produced[f.species.findIndex(entry=>entry.gas===p.gas)]!+=retained*p.retainedMassFraction01;
        }
        const sat=g.gas===AtmosphereGas.WATER_VAPOR
          ?waterSaturationVaporPressurePascal(f.surfaceTemperatureKelvin)
          :condensableSaturationPressurePascal(g.gas,f.surfaceTemperatureKelvin);
        if(sat!==null&&sat!==undefined&&Number.isFinite(sat)){
          const taken=Math.max(0,mass-Math.max(0,sat)*kgPerPa);
          mass-=taken;condensed!+=taken;
        }
        masses[j]=mass;
        });
        // Apply photoproducts after ALL parent species to remove loop-order bias.
        for(let j=0;j<masses.length;j++)masses[j]!+=produced[j]!;
      }
      remaining=masses.reduce((s,v)=>s+v,0);
      const all=remaining+thermal!+particle!+photoLost!+photoProducts!+condensed!;
      residual=Math.abs(initial+supplied!-all)/Math.max(1,initial+supplied!);
      if(residual>1e-8||![...masses,all,residual].every(VALID))
        throw new RangeError('PRE-33.06 atmospheric species mass balance failed.');
      finalPartials=Object.freeze(f.species.map((g,j)=>Object.freeze({gas:g.gas,pressurePascal:masses[j]/kgPerPa})));
      candidatePressure=remaining/kgPerPa;
      if(i.hasDefinedSolidSurface){
        if(photoProducts!>1e-12*Math.max(1,remaining+photoProducts!))status='UNIDENTIFIED_PHOTOCHEMICAL_PRODUCTS';
        else if(f.kind==='CONDITIONAL_ENDMEMBER')status='CONDITIONAL_FORWARD_SCENARIO';
        else if(e===null)status='MISSING_EXOBASE_AND_STELLAR_FORCING';
        else {
          if(!e.sourceId.trim()||![e.altitudeMeters,e.temperatureKelvin,e.numberDensityPerCubicMeter,
            e.collisionCrossSectionSquareMeters,e.euvWattsPerSquareMeter,
            e.particleNumberFluxPerSquareMeterPerSecond].every(VALID)||
            e.temperatureKelvin===0||e.numberDensityPerCubicMeter===0||e.collisionCrossSectionSquareMeters===0)
            throw new RangeError('PRE-33.06 incomplete exobase/stellar high-energy forcing.');
          const molecules=f.species.reduce((s,g,j)=>s+masses[j]/
            (atmosphereGasMolarMassGramsPerMole(g.gas)/1000)*NA,0);
          if(molecules>0){
            const meanMass=remaining/molecules;
            const surfaceRadius=i.radiusEarth*RE;
            const gExo=i.surfaceGravityEarth*GE*Math.pow(surfaceRadius/(surfaceRadius+e.altitudeMeters),2);
            const height=KB*e.temperatureKelvin/(meanMass*gExo);
            kn=1/(Math.SQRT2*e.numberDensityPerCubicMeter*e.collisionCrossSectionSquareMeters*height);
          }
          if(remaining>0&&(!Number.isFinite(kn)||kn===null||kn<.01||kn>100))
            status='EXOBASE_OUTSIDE_KINETIC_DOMAIN';
          else{status='CAUSAL_INTERVAL_MODEL_RESOLVED';causalPressure=candidatePressure;}
        }
      }
    }
    const physicalPartials=causalPressure===null?[]:finalPartials;
    if(causalPressure!==null&&!CLOSE(causalPressure,physicalPartials.reduce((s,g)=>s+g.pressurePascal,0)))
      throw new RangeError('PRE-33.06 partial pressure sum mismatch.');
    return Object.freeze({
      contract:'PRE-33.06/V3-CROSS-BODY-ATMOSPHERIC-CLOSURE/v1' as const,
      bodyKind:i.bodyKind,status,hasDefinedSolidSurface:i.hasDefinedSolidSurface,
      areaSquareMeters:area,gasKilogramsPerPascal:kgPerPa,
      scenarioPressurePascal:i.legacyScenarioPressurePascal,
      scenarioEquivalentGasMassKilograms:i.legacyScenarioPressurePascal===null?null:i.legacyScenarioPressurePascal*kgPerPa,
      scenarioPartialsPascal:scenarioPartials,
      conditionalVolatileReservoirCeilingKilograms:i.conditionalVolatileReservoirCeilingKilograms,
      reservoirSourceId:i.reservoirSourceId,referenceH2OCT0Kilograms:i.referenceH2OCT0Kilograms??null,
      inventorySourceId:f?.initialInventorySourceId??null,
      ratesSourceId:f?.massRateSourceId??null,exobaseSourceId:e?.sourceId??null,
      intervalSeconds:f?.intervalSeconds??null,initialGasKilograms:initial,suppliedKilograms:supplied,
      thermalEscapedKilograms:thermal,particleEscapedKilograms:particle,
      photolysisEscapedKilograms:photoLost,unidentifiedPhotochemicalKilograms:photoProducts,
      condensedKilograms:condensed,remainingGasKilograms:remaining,relativeMassResidual01:residual,
      exobaseKnudsenNumber:kn,candidateForwardPressurePascal:candidatePressure,
      candidateForwardPartialsPascal:Object.freeze(finalPartials),
      causalModelPressurePascal:causalPressure,causalModelPartialsPascal:Object.freeze(physicalPartials),
      observedPressure:false as const,atmospherePresenceObserved:false as const,
      biologyAuthorized:false as const,limitations:LIMITATIONS,
    });
  }
}
