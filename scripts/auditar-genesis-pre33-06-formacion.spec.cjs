'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
if(!require.extensions['.ts'])require.extensions['.ts']=(module,file)=>module._compile(
 ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {AtmosphereGas:G}=require('../src/app/domain/planetary/atmosphere-gas.ts');
const {AtmosphereV3FormationEvolutionPRE3306:Forward}=require('../src/app/simulation/planetary/atmosphere-v3-formation-evolution-pre33-06.ts');
const {AtmosphereCausalClosureEnginePRE3306:Core}=require('../src/app/simulation/planetary/atmosphere-causal-closure-engine-pre33-06.ts');
const form=Object.freeze({contract:'PRE-33.03a.3/V3-DISK-FORMATION-ORIGIN/v1',
  sourceId:'TEST/REAL_V3_FORMATION',bodyIndex:0n,sourceFormationOrdinals:[1],
  formationWaterKilograms:1e21,assemblyTemperatureKelvin:160,initialDiskDustKilograms:1e26,
  diskWaterBudgetKilograms:1e25,carbonOxygenRatio:.54,metallicitySolarRatio:1,
  sourceDiskTemperatureAt1AuKelvin:180,chemicalProvenance:'17_2_DISK_AND_SECTOR_METALLICITY_WITH_SOLAR_ELEMENT_PATTERN_PRIOR',
  stellarAgeYearsCT0:4.5e9,timeSinceFormationYears:4.49e9,
  sourceStellarMassSolar:1,sourceBolometricLuminositySolar:1,
  lateDeliveryWaterBudgetKilograms:0,diskSolidMassShare01:.2,datedHistoryComplete:true,certifiedCT0:false});
const planet=Object.freeze({massEarth:1,radiusEarth:1,surfaceGravityEarth:1,
  orbit:{semiMajorAxisAu:1},internalComposition:{sourceSolidMassEarth:1,sourceEnvelopeMassEarth:0}});
const atm=Object.freeze({hostPlanet:planet,isDeepEnvelope:false,retainedSurfacePressurePascal:125000,
  retainedGasComposition:[{gas:G.NITROGEN,moleFraction01:1}],
  climateState:{meanSurfaceTemperatureKelvin:289}});
const lunar={massEarth:.013,radiusEarth:.27,surfaceGravityEarth:.17,hostPlanetOrdinal:1,moonOrdinal:1};
const inv={hostPlanetOrdinal:1,moonOrdinal:1,contractVersion:'32.F.1d-density-endmember-scenario-v1',
  otherCondensableMassKilograms:8e20,waterIceMassKilograms:2e21,
  maximumPotentialVolatileSupplyKilograms:2.8e21};
const r=()=>Forward.planet(planet,atm,form);
const m=()=>Forward.moon(lunar,null,inv,planet,form,160);
test('PRE-33.06 formation: gas atmospheric origin is not 20.x pressure',()=>{
 const a=r(),b=Forward.planet(planet,{...atm,retainedSurfacePressurePascal:9900000},form);
 assert.equal(a.candidateForwardPressurePascal,b.candidateForwardPressurePascal);
 assert.notEqual(a.scenarioPressurePascal,b.scenarioPressurePascal);
 assert.match(a.inventorySourceId,/ATMOSPHERIC_FORMATION_V3/);
 assert.equal(a.observedPressure,false);
});
test('PRE-33.06 formation: forward chronological mass ledger',()=>{
 const a=r(); assert.ok(a.historyEpochs.length>=5);
 assert.equal(a.historyEpochs[0].fromYears,0);
 assert.equal(a.historyEpochs.at(-1).toYears,form.timeSinceFormationYears);
 assert.ok(a.relativeMassResidual01<1e-7);
 assert.ok(a.formationReservoirKilograms>=a.initialGasKilograms+a.suppliedKilograms);
 assert.ok(a.historyEpochs.every(e=>e.fromYears<e.toYears&&e.xuvWattsPerSquareMeter>0));
});
test('PRE-33.06 formation: deterministic inputs equal output; no history browser clock',()=>{
 assert.equal(JSON.stringify(r()),JSON.stringify(r()));assert.equal(JSON.stringify(m()),JSON.stringify(m()));
});
test('PRE-33.06 formation: age-driven stellar high-energy forcing evolves',()=>{
 const v=r().historyEpochs;
 assert.ok(v[0].xuvWattsPerSquareMeter>v.at(-1).xuvWattsPerSquareMeter);
});
test('PRE-33.06 formation: lunar other ice is an upper mass budget, not copied gas',()=>{
 const x=m(); assert.equal(x.status,'CONDITIONAL_FORWARD_SCENARIO');
 assert.equal(x.assumedChemistry,'UNIDENTIFIED_LUNAR_VOLATILE_ENDMEMBER');
 assert.ok(x.formationReservoirKilograms<inv.otherCondensableMassKilograms);
 assert.ok(x.initialGasKilograms<inv.otherCondensableMassKilograms);
 assert.ok(x.historyEpochs.length>0);assert.equal(x.causalModelPressurePascal,null);
 assert.equal(x.observedPressure,false);
});
test('PRE-33.06 formation: moon with zero unidentified volatiles stays unresolved',()=>{
 const x=Forward.moon(lunar,null,{...inv,otherCondensableMassKilograms:0},planet,form,160);
 assert.equal(x.initialGasKilograms,null);assert.equal(x.causalModelPressurePascal,null);
});
test('PRE-33.06 formation: without dated stellar origin cannot fabricate XUV',()=>{
 const x=Forward.planet(planet,atm,{...form,datedHistoryComplete:false});
 assert.equal(x.causalModelPressurePascal,null);
 assert.equal(x.initialGasKilograms,null);
});
test('PRE-33.06 formation: deep gas envelope has no rocky-surface pressure',()=>{
 const x=Forward.planet(planet,{...atm,isDeepEnvelope:true},form);
 assert.equal(x.status,'NO_SOLID_SURFACE_REFERENCE');assert.equal(x.causalModelPressurePascal,null);
 assert.ok(x.historyEpochs.length>0);
});
test('PRE-33.06 formation: explicit photoproducts conserved as CO and O2',()=>{
 const input={bodyKind:'PLANET',radiusEarth:1,surfaceGravityEarth:1,hasDefinedSolidSurface:true,
   legacyScenarioPressurePascal:null,legacyScenarioMoleFractions:[],
   conditionalVolatileReservoirCeilingKilograms:null,reservoirSourceId:null,
   forcing:{kind:'INDEPENDENT_PROCEDURAL_FORMATION_AND_RATE_MODEL',
   initialInventorySourceId:'C','massRateSourceId':'PHOTONS',intervalSeconds:1e7,
   surfaceTemperatureKelvin:380,species:[
    {gas:G.CARBON_DIOXIDE,initialGasKilograms:1e12,replenishmentKilogramsPerSecond:0,
     thermalEscapeKilogramsPerSecond:0,particleEscapeKilogramsPerSecond:0,
     photolysisPerSecond:1e-8,photolysisEscapingFraction01:0,
     photolysisProducts:[{gas:G.CARBON_MONOXIDE,retainedMassFraction01:28.0101/44.0095},
       {gas:G.OXYGEN,retainedMassFraction01:1-28.0101/44.0095}]},
    ...[G.CARBON_MONOXIDE,G.OXYGEN].map(gas=>({gas,initialGasKilograms:0,
     replenishmentKilogramsPerSecond:0,thermalEscapeKilogramsPerSecond:0,
     particleEscapeKilogramsPerSecond:0,photolysisPerSecond:0,photolysisEscapingFraction01:0}))]}};
 const x=Core.evaluate(input);
 assert.ok(x.relativeMassResidual01<1e-8);
 assert.equal(x.unidentifiedPhotochemicalKilograms,0);
 assert.ok(x.candidateForwardPartialsPascal.some(g=>g.gas===G.OXYGEN&&g.pressurePascal>0));
 assert.ok(x.candidateForwardPartialsPascal.some(g=>g.gas===G.CARBON_MONOXIDE&&g.pressurePascal>0));
});
test('PRE-33.06 formation: rejects foreign lunar formation identity',()=>{
 assert.throws(()=>Forward.moon(lunar,null,{...inv,moonOrdinal:2},planet,form,160));
});
