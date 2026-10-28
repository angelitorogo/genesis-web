'use strict';
const {test}=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'), ts=require('typescript');
if(!require.extensions['.ts'])require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(
 fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const app=path.resolve(__dirname,'../src/app');
const load=f=>require(path.join(app,f));
const {ProceduralEcologyVIDA4}=load('simulation/life/procedural-ecology-vida4.ts');
const {Vida5aEcologyAtmosphere}=load('simulation/life/vida5a-ecology-atmosphere.ts');
const {Vida5bEcologicalMaturation}=load('simulation/life/vida5b-ecological-maturation.ts');
const {Vida5cAdvancedBiospheres}=load('simulation/life/vida5c-advanced-biospheres.ts');
const {VIDA4_GROUPS}=load('domain/life/procedural-ecology-vida4.ts');
const C=load('domain/life/vida5c-advanced-biospheres.ts');
const seed='7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5';
const micro=(i,life=false,habitat='SURFACE_OPEN',plausibility='PLAUSIBLE')=>({
 revision:'VIDA.3/microbial/v3-aquifer-lunar-surface',
 identity:{universeSeed:seed,generatorVersionCode:3,kind:'PLANET',galaxyIndex:'0',sectorKey:'0',galacticObjectIndex:'0',bodyIndex:String(i),moonIndex:null},
 bodyStorageKey:`0:0:0:${i}:PLANET:-`,plausibility,selectedRoute:habitat==='SURFACE_OPEN'?'SURFACE':'SUBSURFACE',
 habitat,lifePresent:life,biology:life?'MICROBIAL':'NONE',biosphereId:life?`vida3:${i}`:null,digest:String(i).padStart(64,'0'),
});
const world=(pressure=101325)=>({detail:{surface:{hasDefinedSolidSurfaceBase:true},
 atmosphere:{retainedSurfacePressurePascal:pressure,retainedGasComposition:[
 {gas:'NITROGEN',moleFraction01:0.80},{gas:'OXYGEN',moleFraction01:0.03},{gas:'CARBON_DIOXIDE',moleFraction01:0.17}],
 retainedMeanMolarMassGramsPerMole:31.1,retainedReferenceDensityKilogramsPerCubicMeter:1.1,longwaveTrappingFraction01:0.4,
 isVacuum:false,isDeepEnvelope:false},climate:{meanSurfaceTemperatureKelvin:294,greenhouseSurfaceWarmingKelvin:22,equilibriumTemperatureKelvin:272}}});
function evaluate(m,w=world()){
 const e=ProceduralEcologyVIDA4.evaluate(m),a=Vida5aEcologyAtmosphere.evaluate(e,w),b=Vida5bEcologicalMaturation.evaluate(a);
 return {e,a,b,c:Vida5cAdvancedBiospheres.evaluate(m,e,b,w)};
}
test('VIDA.5c favorece hábitats previamente plausibles y físicamente respirables sin crear civilizaciones',()=>{
 let created=0,completed=0;
 for(let i=0;i<250;i++){
  const m=micro(i);const {a,b,c}=evaluate(m);
  assert(!a.nativeCivilizationPrerequisitesReady);assert(!b.nativeCivilizationPrerequisitesReady);
  assert.equal(c.digest,evaluate(m).c.digest);
  assert.deepEqual(c.effectiveGroups,VIDA4_GROUPS.slice(0,c.effectiveGroups.length));
  if(c.newlyEstablishedMicrobialLife)created++;
  if(c.nativeCivilizationPrerequisitesReady){completed++;assert(c.advancedAtmosphereSuitable);assert(c.atmosphericFeedback.oxygenFraction01>=.16);assert(c.atmosphericFeedback.oxygenPartialPressurePascal>=16000);}
  assert(!('civilizationPresent' in c));assert(!('intelligencePresent' in c));
 }
 assert(created>200);assert(completed>200);
});
test('VIDA.5c conserva mundos históricos y rechaza habitabilidad incompatible',()=>{
 const legacy=evaluate(micro(77,true));assert.equal(legacy.c.originalMicrobialLifePresent,true);
 assert.equal(legacy.c.effectiveMicrobialLifePresent,true);
 for(const m of [micro(80,false,'SURFACE_OPEN','NOT_PLAUSIBLE'),micro(81,false,'SUBSURFACE')]){
  const val=evaluate(m);assert.equal(val.c.effectiveMicrobialLifePresent,false);assert.equal(val.c.effectiveGroups.length,0);
 }
 const tooThin=evaluate(micro(80),world(1200)).c;
 assert.equal(tooThin.advancedAtmosphereSuitable,false);assert.equal(tooThin.nativeCivilizationPrerequisitesReady,false);
});
test('VIDA.5c congela proyección 65 % × 60 %, niveles tecnológicos 60/30/10',()=>{
 assert.equal(C.VIDA7_FUTURE_INTELLIGENCE_RATE_V5C,.65);
 assert.equal(C.VIDA7_FUTURE_CIVILIZATION_RATE_V5C,.60);
 assert.deepEqual(C.VIDA7_FUTURE_TECHNOLOGY_DISTRIBUTION_V5C,
  {PRIMITIVE:.60,ADVANCED:.30,ULTRA_ADVANCED:.10});
 assert(Math.abs(Object.values(C.VIDA7_FUTURE_TECHNOLOGY_DISTRIBUTION_V5C).reduce((a,b)=>a+b)-1)<1e-12);
});
test('Fichas y persistencia mantienen registros previos y nueva versión diferenciada',()=>{
 const card=fs.readFileSync(path.join(app,'presentation/planet-detail/planet-scientific-card.ts'),'utf8');
 const db=fs.readFileSync(path.join(app,'data/local/repository/dexie-vida5c-advanced-biospheres.repository.ts'),'utf8');
 assert(card.includes('Vida5cAdvancedBiospheres.evaluate('));
 assert(card.includes('ecologicalMaturationVIDA5b,'));
 assert(card.includes('ecologicalCalibrationVIDA5c,'));
 assert(db.includes('`${snapshot.revision}|${snapshot.bodyStorageKey}`'));
 assert(db.includes('privateEcologicalBiospheres'));
});
test('vista previa civilizatoria determinista respeta población elegible, sin garantizar cuota',()=>{
 const candidates=[];
 for(let i=0;i<250;i++){
  const m=micro(i);candidates.push(evaluate(m).c);
 }
 const forecast=Vida5cAdvancedBiospheres.forecastCivilizations(candidates);
 const rerun=Vida5cAdvancedBiospheres.forecastCivilizations([...candidates].reverse());
 assert.deepEqual(forecast,rerun);
 assert(forecast.civilizationSelected>0);
 assert(forecast.intelligenceSelected>=forecast.civilizationSelected);
 const levels=forecast.candidates.reduce((acc,item)=>{
  acc[item.tier]=(acc[item.tier]??0)+1;return acc;
 },{});
 assert.equal(Object.values(levels).reduce((a,b)=>a+b,0),forecast.civilizationSelected);
 assert.equal(Vida5cAdvancedBiospheres.forecastCivilizations([]).civilizationSelected,0);
});
