'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
if(!require.extensions['.ts'])require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(
 fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const app=path.resolve(__dirname,'../src/app');
const {Vida5BiogenicAtmosphere:V}=require(path.join(app,'simulation/life/vida5-biogenic-atmosphere.ts'));
const {VIDA4_GROUPS}=require(path.join(app,'domain/life/procedural-ecology-vida4.ts'));
const fake=(n,habitat='SURFACE_OPEN')=>({revision:'VIDA.4/ecology/v2-advanced-calibration',identity:{kind:'PLANET',generatorVersionCode:3},habitat,digest:'a'.repeat(64),groups:VIDA4_GROUPS.slice(0,n),nativeCivilizationEcosystemReady:n===8&&habitat==='SURFACE_OPEN'});
const atmosphere=(p=101325,o=.03,co2=.15)=>({detail:{surface:{hasDefinedSolidSurfaceBase:true},
 atmosphere:{retainedSurfacePressurePascal:p,retainedGasComposition:[{gas:'NITROGEN',moleFraction01:1-o-co2},
 {gas:'OXYGEN',moleFraction01:o},{gas:'CARBON_DIOXIDE',moleFraction01:co2}],retainedMeanMolarMassGramsPerMole:29,
 retainedReferenceDensityKilogramsPerCubicMeter:1.2,longwaveTrappingFraction01:.5,isVacuum:false,isDeepEnvelope:false},
 climate:{meanSurfaceTemperatureKelvin:296,greenhouseSurfaceWarmingKelvin:25,
 minimumSurfaceTemperatureKelvin:280,maximumSurfaceTemperatureKelvin:320}}});
test('vegetación >=12% O2 y balance total gaseoso =100%',()=>{
 for(let n=3;n<=8;n++){
  const r=V.evaluate(fake(n),atmosphere());assert.equal(r.status,'APPLIED');
  assert(r.oxygenFraction01>=.12&&r.oxygenFraction01<=.28);
  assert(Math.abs(r.gasComposition.reduce((a,b)=>a+b.moleFraction01,0)-1)<1e-10);
  if(n>=5){assert(r.oxygenFraction01>=.16);assert(r.oxygenPartialPressurePascal>=15999);}
 }
});
test('V5 no cambia los mundos sin vegetación',()=>{
 const p=atmosphere();for(const n of [0,1,2]){
  const x=V.evaluate(fake(n),p);assert.equal(x.status,'NO_PHOTOSYNTHETIC_VEGETATION');
  assert.equal(V.applyToTarget(p,x),p);
 }
});
test('el presupuesto físico incompatible no fabrica oxígeno',()=>{
 const x=V.evaluate(fake(8),atmosphere(1200));assert.equal(x.status,'UNRESOLVED_PHYSICAL_BUDGET');
 assert.equal(x.pressurePascal,1200);assert.equal(x.pressureBalanceFactor,null);
 assert.equal(x.stablePhotosyntheticVegetation,false);assert.deepEqual(x.effectiveGroups,['MICROORGANISMS','FUNGI']);
 assert.equal(x.nativeCivilizationAtmosphereReady,false);
 assert.throws(()=>V.assertNativeCivilizationAtmosphereReady(fake(8),x));
});
test('recomposición reproducible, presión/clima efectivos y referencia intacta',()=>{
 const p=atmosphere();const a=V.evaluate(fake(8),p);const b=V.evaluate(fake(8),p);
 assert.equal(a.digest,b.digest);const q=V.applyToTarget(p,a);
 assert.notEqual(q,p);assert.equal(q.detail.atmosphere.retainedSurfacePressurePascal,a.pressurePascal);
 assert.equal(q.detail.climate.meanSurfaceTemperatureKelvin,a.meanSurfaceTemperatureKelvin);
 assert.equal(p.detail.atmosphere.retainedGasComposition[1].moleFraction01,.03);
 assert.equal(a.nativeCivilizationAtmosphereReady,true);
 assert.doesNotThrow(()=>V.assertNativeCivilizationAtmosphereReady(fake(8),a));
});
test('la ficha utiliza el escenario V5 posterior a VIDA.4a, no retroalimenta VIDA.2',()=>{
 const card=fs.readFileSync(path.join(app,'presentation/planet-detail/planet-scientific-card.ts'),'utf8');
 const i=card.indexOf('Vida2PhysicalInput.planet(target)');
 assert(i>=0&&i<card.indexOf('Vida5aEcologyAtmosphere.evaluate('));
 assert(card.includes('PlanetScientificSectionsAssembler'));
 assert(card.includes('currentTarget,'));
});
