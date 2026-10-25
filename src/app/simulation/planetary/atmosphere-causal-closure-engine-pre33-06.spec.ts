import { describe, expect, it } from 'vitest';
import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import { AtmosphereCausalClosureEnginePRE3306 as Engine } from './atmosphere-causal-closure-engine-pre33-06';
import type { AtmosphereClosureInputPRE3306, AtmosphereForcingPRE3306, AtmosphereExobasePRE3306 } from '../../domain/planetary/atmosphere-causal-closure-pre33-06';

const base: AtmosphereClosureInputPRE3306 = {
  bodyKind:'MOON',radiusEarth:0.27,surfaceGravityEarth:0.1,
  hasDefinedSolidSurface:true,legacyScenarioPressurePascal:320,
  legacyScenarioMoleFractions:[{gas:AtmosphereGas.NITROGEN,moleFraction01:0.7},
    {gas:AtmosphereGas.CARBON_DIOXIDE,moleFraction01:0.3}],
  reservoirSourceId:'32.F.1d-CONDENSATE-ENDMEMBER',
  conditionalVolatileReservoirCeilingKilograms:1e15,
};
const forcing: AtmosphereForcingPRE3306 = {
  kind:'INDEPENDENT_PROCEDURAL_FORMATION_AND_RATE_MODEL',
  initialInventorySourceId:'FORMATION-EXPLICIT-N2',massRateSourceId:'DYNAMIC-ESCAPE-AND-OUTGASSING',
  intervalSeconds:86400,surfaceTemperatureKelvin:160,
  species:[{gas:AtmosphereGas.NITROGEN,initialGasKilograms:1e12,
    replenishmentKilogramsPerSecond:1e4,thermalEscapeKilogramsPerSecond:1e3,
    particleEscapeKilogramsPerSecond:100,photolysisPerSecond:0,photolysisEscapingFraction01:0}],
};
const exobase: AtmosphereExobasePRE3306 = {
  sourceId:'KINETIC-EXOBASE-AND-EUV',altitudeMeters:10000,temperatureKelvin:160,
  numberDensityPerCubicMeter:1e14,collisionCrossSectionSquareMeters:1e-19,
  euvWattsPerSquareMeter:0,particleNumberFluxPerSquareMeterPerSecond:0,
};
describe('PRE-33.06 causal transverse planet/moon closure',()=>{
  it('does not turn inherited column into primordial mass or kg/s rates',()=>{
    const m=Engine.evaluate(base);
    expect(m.causalModelPressurePascal).toBeNull();
    expect(m.initialGasKilograms).toBeNull();
    expect(m.ratesSourceId).toBeNull();
    expect(m.scenarioEquivalentGasMassKilograms).toBeCloseTo(m.gasKilogramsPerPascal*320);
    expect(m.scenarioPartialsPascal.map(g=>g.pressurePascal)).toEqual([224,96]);
    expect(m.biologyAuthorized).toBe(false);
  });
  it('conserves mass independently for explicit quantified species fluxes',()=>{
    const m=Engine.evaluate({...base,forcing,exobase});
    expect(m.status).toBe('CAUSAL_INTERVAL_MODEL_RESOLVED');
    expect(m.causalModelPressurePascal).toBeGreaterThan(0);
    expect(m.relativeMassResidual01).toBeLessThan(1e-10);
    expect(m.causalModelPartialsPascal.reduce((s,g)=>s+g.pressurePascal,0))
      .toBeCloseTo(m.causalModelPressurePascal!,9);
    expect(m.observedPressure).toBe(false);
  });
  it('photochemical products are not discarded, nor certified as pressure',()=>{
    const chem={...forcing,species:[{...forcing.species[0],photolysisPerSecond:1e-8}]};
    const m=Engine.evaluate({...base,forcing:chem,exobase});
    expect(m.status).toBe('UNIDENTIFIED_PHOTOCHEMICAL_PRODUCTS');
    expect(m.causalModelPressurePascal).toBeNull();
    expect(m.unidentifiedPhotochemicalKilograms).toBeGreaterThan(0);
    expect(m.relativeMassResidual01).toBeLessThan(1e-10);
  });
  it('cannot use bolometric insolation as exobase input',()=>{
    expect(Engine.evaluate({...base,forcing}).status).toBe('MISSING_EXOBASE_AND_STELLAR_FORCING');
    expect(Engine.evaluate({...base,forcing}).causalModelPressurePascal).toBeNull();
  });
  it('does not promote an endmember even with filled forcing and exobase',()=>{
    const m=Engine.evaluate({...base,forcing:{...forcing,kind:'CONDITIONAL_ENDMEMBER'},exobase});
    expect(m.status).toBe('CONDITIONAL_FORWARD_SCENARIO');
    expect(m.candidateForwardPressurePascal).toBeGreaterThan(0);
    expect(m.causalModelPressurePascal).toBeNull();
  });
  it('exobase must lie in a valid kinetic regime',()=>{
    const m=Engine.evaluate({...base,forcing,exobase:{...exobase,numberDensityPerCubicMeter:1e22}});
    expect(m.status).toBe('EXOBASE_OUTSIDE_KINETIC_DOMAIN');
    expect(m.causalModelPressurePascal).toBeNull();
  });
  it('deep envelopes never receive fictitious pressure on exposed rock',()=>{
    const m=Engine.evaluate({...base,bodyKind:'PLANET',hasDefinedSolidSurface:false,forcing,exobase});
    expect(m.status).toBe('NO_SOLID_SURFACE_REFERENCE');
    expect(m.causalModelPressurePascal).toBeNull();
  });
  it('no listed gas is not proof of the absence of any atmosphere',()=>{
    const m=Engine.evaluate({...base,legacyScenarioPressurePascal:null,legacyScenarioMoleFractions:[]});
    expect(m.status).toBe('MISSING_PRIMORDIAL_GAS_INVENTORY_AND_FLUXES');
    expect(m.causalModelPressurePascal).toBeNull();
  });
  it('rejects missing species rates, duplicate gas and inconsistent pressure fractions',()=>{
    expect(()=>Engine.evaluate({...base,forcing:{...forcing,species:[
      {...forcing.species[0],thermalEscapeKilogramsPerSecond:NaN}]}})).toThrow();
    expect(()=>Engine.evaluate({...base,forcing:{...forcing,species:[forcing.species[0],forcing.species[0]]}})).toThrow();
    expect(()=>Engine.evaluate({...base,legacyScenarioMoleFractions:[
      {gas:AtmosphereGas.NITROGEN,moleFraction01:.8},
      {gas:AtmosphereGas.CARBON_DIOXIDE,moleFraction01:.8}]})).toThrow();
  });
  it('no clock, discoveries, random seed, or V1/2 mutation',()=>{
    const a=Engine.evaluate(base),b=Engine.evaluate({...base});
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
    expect(a.observedPressure).toBe(false);
    expect(a.atmospherePresenceObserved).toBe(false);
  });
});
