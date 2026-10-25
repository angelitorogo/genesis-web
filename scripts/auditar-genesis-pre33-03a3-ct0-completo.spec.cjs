'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
function tsRegister(){const ts=require('typescript');if(!require.extensions['.ts'])require.extensions['.ts']=(m,f)=>{
 const js=ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 m._compile(js,f);};}
tsRegister();
const {PlanetH2OV3CT0Evolution:Evolution}=require('../src/app/simulation/planetary/planet-h2o-v3-ct0-evolution.ts');
const {PlanetH2OForwardCT0EnginePRE3303A3:Forward}=require('../src/app/simulation/planetary/planet-h2o-forward-ct0-pre33-03a3.ts');
const {validateH2OForwardCT0Result}=require('../src/app/domain/planetary/planet-h2o-forward-ct0-pre33-03a3.ts');
function fake(water=1e23,ageYears=4e9,lu=1,t=285){
 const slot={sourceFormationOrdinals:[1],referenceAssemblyRadiusAu:8};
 const planet={locator:{galaxyIndex:0n,sectorKey:1n,galacticObjectIndex:2n,bodyIndex:0n},architectureSlot:slot,
  orbit:{semiMajorAxisAu:1,eccentricity:.05},
  physicalProperties:{massEarth:1,radiusEarth:1,inheritedSolidCoreMassEarth:.95},
  internalComposition:{condensedIceMassEarth:.2,volatileRichInteriorMassEarth:.1,
   gaseousEnvelopeMassEarth:.001,metallicCoreMassEarth:.3,silicateInteriorMassEarth:.399},
  hostPlanetarySystem:{hostStellarSystem:{primaryReferenceLuminositySolar:lu}}};
 const atm={hostPlanet:planet,climateState:{meanSurfaceTemperatureKelvin:t},
  waterInventory:{sourceRetainedSurfacePressurePascal:101325}};
 const origin={sourceId:'PRE-33.03a.3/V3-DISK-FORMATION-ORIGIN/v1/test',
  contract:'PRE-33.03a.3/V3-DISK-FORMATION-ORIGIN/v1',bodyIndex:0n,sourceFormationOrdinals:[1],
  formationWaterKilograms:water,assemblyTemperatureKelvin:145,metallicitySolarRatio:1,carbonOxygenRatio:.549,
  timeSinceFormationYears:ageYears,stellarAgeYearsCT0:ageYears+4e7,
  sourceStellarMassSolar:1,sourceBolometricLuminositySolar:lu,
  lateDeliveryWaterBudgetKilograms:water*.02};
 return {planet,atm,origin};
}
const compute=x=>Forward.project(x.planet,x.atm,Evolution.fromOrigin(x.planet,x.atm,x.origin));
test('sourced 17.7 -> dated 4 Gyr -> CT0 closes every water reservoir',()=>{
 const f=fake(),env=Evolution.fromOrigin(f.planet,f.atm,f.origin),r=compute(f);
 assert.equal(env.history.complete,true);
 assert.equal(env.history.intervals[0].fromYear,0);
 assert.equal(env.history.intervals.at(-1).toYear,4e9);
 assert.equal(r.v3ModelBalanceCertified,true);assert.equal(r.v3TimeEvolutionClosed,true);
 assert.equal(r.waterKilograms.modeledFormation,1e23);
 assert.ok(r.waterKilograms.modeledCT0>=0);
 assert.ok(r.relativeMassResidual01<1e-9);
 assert.deepEqual(validateH2OForwardCT0Result(r),[]);
});
test('the same frozen inputs produce identical CT0 histories and numbers',()=>{
 const a=compute(fake()),b=compute(fake());assert.deepEqual(a,b);
});
test('the disk delivery budget is a hard upper limit; no invented observed impact',()=>{
 const x=fake(),env=Evolution.fromOrigin(x.planet,x.atm,x.origin);
 const deliveries=env.history.transfers.filter(x=>x.process==='DELIVERY');
 const received=deliveries.reduce((s,x)=>s+x.kilograms,0);
 assert.ok(received<=x.origin.lateDeliveryWaterBudgetKilograms*(1+1e-10));
 assert.ok(deliveries.every(x=>x.sourceId.includes('RESIDUAL_DISK_ACCRETION')));
 assert.ok(received>=0);
});
test('warm and cold CT0 climates partition surface water differently, without observed claims',()=>{
 const warm=compute(fake(1e23,4e9,1,285)),cold=compute(fake(1e23,4e9,1,240));
 assert.ok(warm.waterKilograms.pools.SURFACE_LIQUID>0);
 assert.equal(cold.waterKilograms.pools.SURFACE_LIQUID,0);
 assert.ok(cold.waterKilograms.pools.SURFACE_ICE>0);
 assert.equal(warm.oceanExistenceCertified,false);
 assert.equal(warm.physicalCT0InventoryCertified,false);
 assert.equal(warm.observedEvidenceGranted,false);
});
test('empty initial H2O does not spontaneously produce an ocean',()=>{
 const r=compute(fake(0));assert.equal(r.waterKilograms.modeledCT0,0);
 assert.equal(r.waterKilograms.pools.SURFACE_LIQUID,0);
});
test('physical escape depends on source irradiance, not a global seed exception',()=>{
 const low=compute(fake(1e22,4e9,.1));const high=compute(fake(1e22,4e9,500));
 assert.ok(high.waterKilograms.escaped >= low.waterKilograms.escaped);
});
test('foreign planet/atmosphere provenance rejected before conservation',()=>{
 const x=fake();const foreign=fake();foreign.atm.hostPlanet={};
 assert.throws(()=>Evolution.fromOrigin(foreign.planet,foreign.atm,foreign.origin),/FOREIGN_SOURCE/);
 const y=fake();y.origin.bodyIndex=4n;
 assert.throws(()=>Evolution.fromOrigin(y.planet,y.atm,y.origin),/FOREIGN_SOURCE/);
});
test('missing/too-young coeval history stays unresolved, never back-dated',()=>{
 const x=fake(1e23,0);const env=Evolution.fromOrigin(x.planet,x.atm,x.origin);
 assert.equal(env.history,undefined);
 const r=Forward.project(x.planet,x.atm,env);
 assert.equal(r.v3ModelBalanceCertified,false);assert.equal(r.waterKilograms.modeledCT0,null);
});

test('V3 conditional radiogenic cooling cannot become an independent deep-liquid phase',()=>{
 const x=fake(1e23,4e9,1,285);
 x.planet.physicalProperties.radiusEarth=1.6;
 const env=Evolution.fromOrigin(x.planet,x.atm,x.origin);
 assert.equal(env.waterShellThermalProvenance,'CT0_CLIMATE_PLUS_RADIogenic_COOLING_MODEL');
 const result=Forward.project(x.planet,x.atm,env);
 assert.ok(result.deepWater.shellThicknessMeters!==null);
 assert.equal(result.deepWater.hasIndependentlySourcedThermalProfile,false);
 assert.equal(result.deepWater.liquidLayerThicknessMeters,null);
 assert.deepEqual(validateH2OForwardCT0Result(result),[]);
});
