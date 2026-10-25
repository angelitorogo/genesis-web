'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const ts=require('typescript');
if(!require.extensions['.ts'])require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{
  fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText,f);
const {AtmosphereGas:G}=require('../src/app/domain/planetary/atmosphere-gas.ts');
const {AtmosphereCausalClosureEnginePRE3306:E}=require('../src/app/simulation/planetary/atmosphere-causal-closure-engine-pre33-06.ts');
const geom={bodyKind:'PLANET',radiusEarth:1,surfaceGravityEarth:1,hasDefinedSolidSurface:true,
 legacyScenarioPressurePascal:100000,legacyScenarioMoleFractions:[{gas:G.NITROGEN,moleFraction01:1}],
 conditionalVolatileReservoirCeilingKilograms:1e22,reservoirSourceId:'H2O-CT0-NOT-A-GAS'};
const f={kind:'INDEPENDENT_PROCEDURAL_FORMATION_AND_RATE_MODEL',initialInventorySourceId:'FORMATION-N2',massRateSourceId:'FLUX-MODEL',
 intervalSeconds:86400,surfaceTemperatureKelvin:300,species:[{gas:G.NITROGEN,initialGasKilograms:1e16,
 replenishmentKilogramsPerSecond:1e7,thermalEscapeKilogramsPerSecond:1e6,particleEscapeKilogramsPerSecond:0,
 photolysisPerSecond:0,photolysisEscapingFraction01:0}]};
const ex={sourceId:'HIGH-ENERGY-SPECTRUM-EXOBASE',altitudeMeters:10000,temperatureKelvin:300,
 numberDensityPerCubicMeter:1e14,collisionCrossSectionSquareMeters:1e-19,euvWattsPerSquareMeter:0,
 particleNumberFluxPerSquareMeterPerSecond:0};
test('PRE33.06 transversal refuses V1 20.x as initial gas',()=>{const x=E.evaluate(geom);
 assert.equal(x.initialGasKilograms,null);assert.equal(x.causalModelPressurePascal,null);
 assert.equal(x.status,'MISSING_PRIMORDIAL_GAS_INVENTORY_AND_FLUXES');});
test('PRE33.06 transversal causal independent pressure with kinetic boundary',()=>{
 const x=E.evaluate({...geom,forcing:f,exobase:ex});
 assert.equal(x.status,'CAUSAL_INTERVAL_MODEL_RESOLVED');assert.ok(x.causalModelPressurePascal>0);
 assert.ok(x.relativeMassResidual01<1e-10);assert.equal(x.biologyAuthorized,false);
});
test('PRE33.06 transversal gas partition sums all partial pressures',()=>{
 const x=E.evaluate({...geom,forcing:f,exobase:ex});
 const total=x.causalModelPartialsPascal.reduce((s,v)=>s+v.pressurePascal,0);
 assert.ok(Math.abs(total-x.causalModelPressurePascal)<1e-8);
});
test('PRE33.06 transversal chemical mass is not silently deleted',()=>{
 const species=[{...f.species[0],photolysisPerSecond:1e-7}];
 const x=E.evaluate({...geom,forcing:{...f,species},exobase:ex});
 assert.equal(x.status,'UNIDENTIFIED_PHOTOCHEMICAL_PRODUCTS');
 assert.equal(x.causalModelPressurePascal,null);assert.ok(x.unidentifiedPhotochemicalKilograms>0);
});
test('PRE33.06 transversal exobase and rate sources are mandatory',()=>{
 assert.equal(E.evaluate({...geom,forcing:f}).causalModelPressurePascal,null);
 assert.throws(()=>E.evaluate({...geom,forcing:{...f,massRateSourceId:''},exobase:ex}));
});
test('PRE33.06 transversal no solid surface means no rocky-surface pressure',()=>{
 const x=E.evaluate({...geom,hasDefinedSolidSurface:false,forcing:f,exobase:ex});
 assert.equal(x.status,'NO_SOLID_SURFACE_REFERENCE');assert.equal(x.causalModelPressurePascal,null);
});
test('PRE33.06 transversal conditional source never masquerades as causal',()=>{
 const x=E.evaluate({...geom,forcing:{...f,kind:'CONDITIONAL_ENDMEMBER'},exobase:ex});
 assert.equal(x.causalModelPressurePascal,null);assert.ok(x.candidateForwardPressurePascal>0);
});
test('PRE33.06 transversal invalid abundances and negative sinks rejected',()=>{
 assert.throws(()=>E.evaluate({...geom,legacyScenarioMoleFractions:[{gas:G.NITROGEN,moleFraction01:2}]}));
 assert.throws(()=>E.evaluate({...geom,forcing:{...f,species:[{...f.species[0],particleEscapeKilogramsPerSecond:-1}]},exobase:ex}));
});
test('PRE33.06 transversal deterministic inputs produce identical immutable result',()=>{
 assert.equal(JSON.stringify(E.evaluate(geom)),JSON.stringify(E.evaluate({...geom})));
 assert.ok(Object.isFrozen(E.evaluate(geom)));
});
test('PRE33.06 planet CT0 H2O stays separate from total gaseous reservoir',()=>{
 const planet={radiusEarth:1,surfaceGravityEarth:1};
 const a={hostPlanet:planet,isDeepEnvelope:false,retainedSurfacePressurePascal:2e5,
  retainedGasComposition:[{gas:G.NITROGEN,moleFraction01:1}]};
 const x=E.fromPlanet(planet,a,'MODELLED_FORMATION_WATER',1e21);
 assert.equal(x.referenceH2OCT0Kilograms,1e21);
 assert.equal(x.conditionalVolatileReservoirCeilingKilograms,null);
 assert.equal(x.initialGasKilograms,null);
 assert.equal(x.causalModelPressurePascal,null);
});
test('PRE33.06 lunar 32.F.1d mass ceiling never becomes atmosphere',()=>{
 const moon={radiusEarth:.25,surfaceGravityEarth:.15,hostPlanetOrdinal:1,moonOrdinal:2};
 const inventory={hostPlanetOrdinal:1,moonOrdinal:2,contractVersion:'32.F.1d-density-endmember-scenario-v1',
  maximumPotentialVolatileSupplyKilograms:1e15};
 const x=E.fromMoon(moon,null,inventory);
 assert.equal(x.conditionalVolatileReservoirCeilingKilograms,1e15);
 assert.equal(x.initialGasKilograms,null);
 assert.equal(x.causalModelPressurePascal,null);
 assert.throws(()=>E.fromMoon(moon,null,{...inventory,moonOrdinal:4}));
});
