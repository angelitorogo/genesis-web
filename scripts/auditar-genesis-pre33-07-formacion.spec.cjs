'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),
  {fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {GeochemicalFormationSensitivityEnginePRE3307:Engine}=
  require('../src/app/simulation/planetary/geochemical-formation-sensitivity-pre33-07.ts');
const geo=()=>({contractVersion:'32.F.4-chemical-constraints-and-thermal-gradients-v1',
  hostPlanetOrdinal:1,moonOrdinal:2,solventState:'MODELLED_LIQUID_H2O_CT0',
  modeledLiquidH2OMassKilograms:1e18,modeledWaterRockContact:
  'LIQUID_SEPARATED_FROM_SILICATES_BY_UNIDENTIFIED_CONDENSABLES',
  modeledOceanBottomTemperatureKelvin:298.15,modeledOceanBottomPressurePascal:2e8,
  generatedHeatFluxWattsPerSquareMeter:1e20});
const formation=()=>({contractVersion:'32.F.1d-density-endmember-scenario-v1',
  hostPlanetOrdinal:1,moonOrdinal:2,totalMassKilograms:1e22,silicateMassKilograms:5e21});
const interior=()=>({contractVersion:'32.F.2b-differentiated-conditional-profile-v1',
  hostPlanetOrdinal:1,moonOrdinal:2,totalMassKilograms:1e22,layers:[
  {outerRadiusKilometers:1200}, {outerRadiusKilometers:1500},
  {outerRadiusKilometers:1750}, {outerRadiusKilometers:1900}]});
const e=(g=geo(),f=formation(),i=interior())=>Engine.moon(g,f,i);
test('resolución condicional identificada, nunca potencia real',()=>{
 const x=e();assert.equal(x.status,'CONDITIONAL_CONTACT_UPPER_BOUND');
 assert(x.conditionalUpperPowerWatts>0);assert.equal(x.lowerBoundPowerWatts,0);
 assert.equal(x.physicallyResolvedPowerWatts,null);assert(x.conservationResidual01<1e-10);
});
test('se conserva la geometría sin reinterpretar capa desconocida como contacto',()=>{
 assert.equal(e().physicalContact,'UNIDENTIFIED_SEPARATOR');
 assert.equal(e().assumedTransportFactor01,1e-4);
});
test('mismo caso con hielo de alta presión sin transporte demostrado da cota cero',()=>{
 const x=e({...geo(),modeledWaterRockContact:'LIQUID_ISOLATED_BY_HIGH_PRESSURE_ICE'});
 assert.equal(x.physicalContact,'ISOLATED_BY_ICE');assert.equal(x.conditionalUpperPowerWatts,0);
});
test('contacto directo modelado aumenta límite superior, sin acreditar mineralogía',()=>{
 const x=e({...geo(),modeledWaterRockContact:'DIRECT_LIQUID_SILICATE_INTERFACE_IN_MODEL'});
 assert.equal(x.status,'DIRECT_CONTACT_ENDMEMBER');
 assert(x.conditionalUpperPowerWatts>e().conditionalUpperPowerWatts);
 assert.equal(x.physicallyResolvedPowerWatts,null);
});
test('sin agua líquida no se habilita reacción acuosa',()=>{
 assert.equal(e({...geo(),solventState:'H2O_SOLID_IN_CT0_MODEL',modeledLiquidH2OMassKilograms:0}).conditionalUpperPowerWatts,null);
});
test('sin roca reactiva se niega la tasa',()=>{
 assert.equal(e(geo(),{...formation(),silicateMassKilograms:0}).status,'NO_REACTIVE_ROCK');
});
test('mineralogía y origen de otra luna no pueden mezclarse',()=>{
 assert.equal(e(geo(),{...formation(),moonOrdinal:3}).status,'MISSING_FORMATION_OR_GEOMETRY');
});
test('conservación de masa y reactivos aun cuando queda muy poca agua',()=>{
 const x=e({...geo(),modeledLiquidH2OMassKilograms:50});
 assert(x.possibleReactionExtentMoles <= 50/.018015*(1+1e-12));
 assert(x.conservationResidual01<1e-10);assert(x.assumedUpperReactionRateMolesPerSecond<=x.possibleReactionExtentMoles/31557600);
});
test('fuera de rango P/T no se extrapola termodinámica sin EOS',()=>{
 assert.equal(e({...geo(),modeledOceanBottomTemperatureKelvin:550}).status,'THERMODYNAMIC_DOMAIN_UNRESOLVED');
 assert.equal(e({...geo(),modeledOceanBottomPressurePascal:2e9}).conditionalUpperPowerWatts,null);
});
test('calor arbitrario no altera los vatios geoquímicos estimados',()=>{
 const a=e(),b=e({...geo(),generatedHeatFluxWattsPerSquareMeter:0});
 assert.equal(a.conditionalUpperPowerWatts,b.conditionalUpperPowerWatts);
});
test('modelo determinista y sin sorteos por seed',()=>assert.equal(JSON.stringify(e()),JSON.stringify(e())));
test('planeta sin agua líquida CT0 no obtiene escenario positivo por silicatos a granel',()=>{
 const p={internalComposition:{silicateInteriorMassEarth:1}};
 const x=Engine.planet(p,null,null);assert.equal(x.status,'MISSING_FORMATION_OR_GEOMETRY');
 assert.equal(x.conditionalUpperPowerWatts,null);
});
