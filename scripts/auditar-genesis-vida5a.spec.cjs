'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
if(!require.extensions['.ts'])require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(
 fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const app=path.resolve(__dirname,'../src/app');
const {Vida5aEcologyAtmosphere:V}=require(path.join(app,'simulation/life/vida5a-ecology-atmosphere.ts'));
const {VIDA4_GROUPS}=require(path.join(app,'domain/life/procedural-ecology-vida4.ts'));
const eco=(id,n=1,habitat='SURFACE_OPEN')=>({revision:'VIDA.4/ecology/v2-advanced-calibration',
 identity:{kind:'PLANET',generatorVersionCode:3,universeSeed:'7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'},
 bodyStorageKey:`planet-${id}`,lifePresent:n>0,habitat,groups:VIDA4_GROUPS.slice(0,n),
 digest:String(id).padStart(64,'0'),nativeCivilizationEcosystemReady:n===8});
const world=(p=101325)=>({detail:{surface:{hasDefinedSolidSurfaceBase:true},
 atmosphere:{retainedSurfacePressurePascal:p,retainedGasComposition:[
 {gas:'NITROGEN',moleFraction01:.8},{gas:'OXYGEN',moleFraction01:.03},{gas:'CARBON_DIOXIDE',moleFraction01:.17}],
 retainedMeanMolarMassGramsPerMole:29,retainedReferenceDensityKilogramsPerCubicMeter:1.1,
 longwaveTrappingFraction01:.4,isVacuum:false,isDeepEnvelope:false},
 climate:{meanSurfaceTemperatureKelvin:294,greenhouseSurfaceWarmingKelvin:22}}});
test('V5a es determinista, preserva V4a y no genera vida sin VIDA3b',()=>{
 for(const n of [0,1,8]){const e=eco(n,n),old=JSON.stringify(e);
  const a=V.evaluate(e,world());assert.equal(JSON.stringify(e),old);
  assert.equal(a.digest,V.evaluate(e,world()).digest);
  assert.equal(a.originalEcologyDigest,e.digest);
  if(n===0)assert.deepEqual(a.effectiveGroups,[]);
 }
});
test('la complejidad se condiciona físicamente, no por cuota',()=>{
 const ready=V.evaluate(eco(1),world());const impossible=V.evaluate(eco(1),world(1000));
 assert.equal(ready.conditionalComplexProbability,.80);
 assert.equal(impossible.conditionalComplexProbability,.20);
 assert(!impossible.effectiveGroups.includes('PLANTS_TREES'));
});
test('O2 >= 12%; fauna avanzada O2 >= 16% y pO2 >=16kPa',()=>{
 let green=0,full=0;
 for(let i=0;i<180;i++){
  const x=V.evaluate(eco(i),world());
  assert.equal(x.effectiveGroups[0],'MICROORGANISMS');
  assert.deepEqual(x.effectiveGroups, VIDA4_GROUPS.slice(0,x.effectiveGroups.length));
  if(x.effectiveGroups.includes('PLANTS_TREES')){
   green++;assert.equal(x.atmosphericFeedback.status,'APPLIED');
   assert(x.atmosphericFeedback.oxygenFraction01>=.12);
   assert(x.atmosphericFeedback.oxygenFraction01<=.28);
  }
  if(x.effectiveGroups.includes('REPTILES')){
   assert(x.atmosphericFeedback.oxygenFraction01>=.16);
   assert(x.atmosphericFeedback.oxygenPartialPressurePascal>=16000);
  }
  if(x.nativeCivilizationPrerequisitesReady){full++;assert.equal(x.effectiveGroups.length,8);
    assert.doesNotThrow(()=>V.assertNativeCivilizationReady(x));}
 }
 assert(green>30);assert(full>0);
});
test('subsuelo no alcanza fotosíntesis y la ficha usa V5a sin retroalimentar VIDA2',()=>{
 const result=V.evaluate(eco(15,2,'SUBSURFACE'),world());
 assert.deepEqual(result.effectiveGroups,['MICROORGANISMS','FUNGI']);
 assert.equal(result.atmosphericFeedback.status,'NO_PHOTOSYNTHETIC_VEGETATION');
 const card=fs.readFileSync(path.join(app,'presentation/planet-detail/planet-scientific-card.ts'),'utf8');
 assert(card.indexOf('Vida2PhysicalInput.planet(target)')<card.indexOf('Vida5aEcologyAtmosphere.evaluate('));
 assert(card.includes('Vida5BiogenicAtmosphere.applyToTarget(target, atmosphericFeedbackVIDA5)'));
});

test('sumidero limitado de SO2/CO: corrige mezcla y presión sin crear gases',()=>{
 const p=world();
 p.detail.atmosphere.retainedGasComposition=[
  {gas:'NITROGEN',moleFraction01:.75},{gas:'OXYGEN',moleFraction01:.03},
  {gas:'CARBON_DIOXIDE',moleFraction01:.17},{gas:'SULFUR_DIOXIDE',moleFraction01:.03},
  {gas:'CARBON_MONOXIDE',moleFraction01:.02}];
 let established=null;
 for(let i=0;i<100;i++){const r=V.evaluate(eco(i),p);
  if(r.effectiveGroups.includes('PLANTS_TREES')){established=r;break;}
 }
 assert(established);assert(established.reactiveGasBurialFraction01>0);
 const a=established.atmosphericFeedback;
 assert(a.gasComposition.some(x=>x.gas==='SULFUR_DIOXIDE'&&x.moleFraction01<.001));
 assert(a.gasComposition.some(x=>x.gas==='CARBON_MONOXIDE'&&x.moleFraction01<.001));
 assert(Math.abs(a.gasComposition.reduce((sum,x)=>sum+x.moleFraction01,0)-1)<1e-10);
 assert(a.pressurePascal>0);
 assert.equal(p.detail.atmosphere.retainedSurfacePressurePascal,101325);
});
test('carga química extrema no produce plantas ni fauna avanzada',()=>{
 const p=world();
 p.detail.atmosphere.retainedGasComposition=[
  {gas:'NITROGEN',moleFraction01:.28},{gas:'OXYGEN',moleFraction01:.03},
  {gas:'CARBON_DIOXIDE',moleFraction01:.19},{gas:'SULFUR_DIOXIDE',moleFraction01:.50}];
 for(let i=0;i<30;i++){const x=V.evaluate(eco(i,8),p);
   assert(x.effectiveGroups.length<=2);
   assert.equal(x.nativeCivilizationPrerequisitesReady,false);
 }
});
