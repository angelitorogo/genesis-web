'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {validate}=require('./auditar-genesis-pre33-06.cjs');
const ts=require('typescript');
if(!require.extensions['.ts'])require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{
 fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText,f);
const {MoonAtmosphereBalanceEnginePRE3306:Engine}=require('../src/app/simulation/planetary/moon-atmosphere-balance-engine-pre33-06.ts');
const geom={hostPlanetOrdinal:1,moonOrdinal:2,massEarth:.02,radiusEarth:.3,surfaceGravityEarth:.2};
const assessment={estimatedSurfacePressurePascal:320,pressureBasis:'CONDITIONAL_SCENARIO',species:[],
 volatileInventoryIndex01:1,thermalEscapeSupportIndex01:1,replenishmentSupportIndex01:1,
 condensationRemovalIndex01:0,irradiationReferenceEarth:8,chargedParticleEnvironment:'UNRESOLVED',hostMagnetosphereShielding:'UNRESOLVED'};
test('PRE-33.06: escenario no se convierte en presión física ni masa real',()=>{
 const m=Engine.fromMaterialized(geom,assessment);
 assert.equal(validate(m,geom,assessment).length,0);
 assert.equal(m.physicalSurfacePressurePascal,null);
 assert.equal(m.initialGasMassKilograms,null);
 assert.equal(m.scenarioPressurePascal,320);
});
test('PRE-33.06: pérdidas ausentes son desconocidas, nunca cero',()=>{
 const m=Engine.fromMaterialized(geom,assessment);
 assert.equal(m.replenishedMassKilograms,null);
 assert.equal(m.thermalEscapeMassKilograms,null);
 assert.equal(m.particleEscapeMassKilograms,null);
});
test('PRE-33.06: V3 no asume ausencia de atmósfera en una luna sin datos',()=>{
 const m=Engine.fromMaterialized(geom,null);
 assert.equal(m.status,'MISSING_INDEPENDENT_GAS_INVENTORY');
 assert.equal(m.actualAtmospherePresenceCertified,false);
 assert.equal(validate(m,geom,null).length,0);
});
test('PRE-33.06: auditor detecta fugas V1 y falsas presiones',()=>{
 const m=Engine.fromMaterialized(geom,assessment);
 assert.ok(validate({...m,physicalSurfacePressurePascal:500},geom,assessment).includes('UNAUTHORIZED_PHYSICAL_PRESSURE'));
 assert.ok(validate({...m,initialGasMassKilograms:12},geom,assessment).includes('V1_LEAK_INTO_RATES'));
});
test('PRE-33.06: persistencia/observación nunca certificadas por balance de intervalo',()=>{
 const m=Engine.fromMaterialized(geom,assessment);
 assert.ok(validate({...m,physicalSurfacePressureObserved:true},geom,assessment).includes('FALSE_CERTIFICATION'));
});
const {MoonAtmospherePhysicalEngine32F1:Physical}=require('../src/app/simulation/planetary/moon-atmosphere-physical-engine-32-f-1.ts');
const {AtmosphereGas}=require('../src/app/domain/planetary/atmosphere-gas.ts');
const gasForcing={sourceKind:'INDEPENDENT_MASS_AND_FLUXES',sourceId:'independent-interval-source',
 durationSeconds:86400,collisionCrossSectionSquareMeters:1e-19,gasForcings:[{
 gas:AtmosphereGas.NITROGEN,initialGasMassKilograms:1e12,
 replenishmentKilogramsPerSecond:1e4,thermalEscapeKilogramsPerSecond:1e3,
 particleEscapeKilogramsPerSecond:0,photolysisRatePerSecond:0,photolysisEscapingFraction01:0}]};
const exobase={sourceId:'independent-exobase-and-high-energy-spectrum',
 exobaseAltitudeMeters:10000,exobaseTemperatureKelvin:160,
 exobaseNumberDensityPerCubicMeter:1e14,collisionCrossSectionSquareMeters:1e-19,
 euvEnergyFluxWattsPerSquareMeter:0,incidentParticleNumberFluxPerSquareMeterPerSecond:0};
const physicalGeometry={hostPlanetOrdinal:1,moonOrdinal:1,massEarth:.01,radiusEarth:.27,surfaceGravityEarth:.1};
test('PRE-33.06: balance de fuente independiente y exobase autorizan P modelo, no observación',()=>{
 const b=Physical.evaluate(physicalGeometry,160,gasForcing);
 const a={physicalBalance32F1:b};
 const model=Engine.fromMaterialized(physicalGeometry,a,exobase);
 assert.equal(model.status,'INDEPENDENT_INTERVAL_MODEL_NOT_OBSERVATION');
 assert.ok(model.physicalSurfacePressurePascal>0);
 assert.ok(Math.abs(model.physicalSurfacePressurePascal-b.surfacePressurePascal)<1e-8);
 assert.equal(model.physicalSurfacePressureObserved,false);
 assert.equal(validate(model,physicalGeometry,a).length,0);
});
test('PRE-33.06: fotoproductos retenidos mantienen desconocida la presión',()=>{
 const gas={...gasForcing.gasForcings[0],photolysisRatePerSecond:1e-8,photolysisEscapingFraction01:0};
 const b=Physical.evaluate(physicalGeometry,160,{...gasForcing,gasForcings:[gas]});
 const model=Engine.fromMaterialized(physicalGeometry,{physicalBalance32F1:b},exobase);
 assert.equal(model.status,'PHOTOCHEMICAL_PRODUCTS_UNIDENTIFIED');
 assert.equal(model.physicalSurfacePressurePascal,null);
});
test('PRE-33.06: sin dominio exobase no se atribuye presión modelada',()=>{
 const b=Physical.evaluate(physicalGeometry,160,gasForcing);
 const model=Engine.fromMaterialized(physicalGeometry,{physicalBalance32F1:b},
  {...exobase,exobaseNumberDensityPerCubicMeter:1e20});
 assert.equal(model.status,'EXOBASE_OUTSIDE_COLLISIONAL_TRANSITION_DOMAIN');
 assert.equal(model.physicalSurfacePressurePascal,null);
});
