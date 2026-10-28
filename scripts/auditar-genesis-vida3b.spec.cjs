'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {readFileSync}=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
if(!require.extensions['.ts'])require.extensions['.ts']=(m,file)=>m._compile(
  ts.transpileModule(readFileSync(file,'utf8'),{fileName:file,
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const root=path.resolve(__dirname,'../src/app');
const {Vida2PhysicalInput}=require(path.join(root,'simulation/life/life-plausibility-physical-adapter-vida2.ts'));
const {ProceduralMicrobialLifeVIDA3:Microbes}=require(path.join(root,'simulation/life/procedural-microbial-life-vida3.ts'));
const {VIDA3_MODEL_REVISION,VIDA3_LIFE_ROLL_NAMESPACE}=require(path.join(root,'domain/life/procedural-microbial-vida3.ts'));
const planet=(extra={})=>({detail:{atmosphere:{isDeepEnvelope:false,retainedSurfacePressurePascal:90000},
  surface:{hasPersistentSurfaceLiquidWater:false,waterInventoryIndex01:.75,waterLiquidFraction01:0,
    surfaceLiquidWaterCoverageFraction01:0,hasDefinedSolidSurfaceBase:true},
  general:{condensedIceMassFraction01:.2},climate:{meanSurfaceTemperatureKelvin:225},
  orbit:{referenceMeanInsolationEarth:.05},
  geology:{isGeologicallyActive:true,geologicalActivityIndex01:.65,internalHeatRetentionIndex01:.62},...extra}});
const moon=(env={},tidal=.52)=>({detail:{environment:{estimatedSurfaceTemperatureKelvin:282,
  referenceMeanInsolationEarth:.6,hasSurfaceLiquidWater:false,
  surfaceLiquidWaterPotentialIndex01:.16,waterInventoryIndex01:.4,
  hasAtmosphere:true,atmosphereRetentionIndex01:.24,
  geologicalActivityIndex01:.48,isGeologicallyActive:true,
  inferredIceRichnessIndex01:.2,subsurfaceOceanPotentialIndex01:.1,
  oceanReality32F2c:{state:'UNRESOLVED_IN_SIMULATED_MODEL',
    generatedTotalSurfaceHeatFluxWattsPerSquareMeter:null,iceCoverThicknessKilometers:null},...env},
  tides:{tidalHeatingIndex01:tidal},habitability:{surfaceAtmosphereSupportIndex01:.4}}});
const id={universeSeed:'7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',generatorVersionCode:3,
 kind:'MOON',galaxyIndex:'0',sectorKey:'11',galacticObjectIndex:'0',bodyIndex:'2',moonIndex:'0'};
test('VIDA.3b: un acuífero planetario es plausible si agua + roca + actividad/geotermia coexisten',()=>{
 const p=planet(),original=JSON.stringify(p);const x=Vida2PhysicalInput.planet(p);
 assert.equal(x.routes[0].classification,'NOT_PLAUSIBLE');
 assert.equal(x.routes[1].classification,'PLAUSIBLE');
 assert.equal(x.routes[1].factors.water,'MARGINAL');
 assert.equal(x.routes[1].factors.energy,'MARGINAL');
 assert.equal(JSON.stringify(p),original);
});
test('VIDA.3b: mundo seco, mundo geológicamente inerte y gigante no habilitan acuífero',()=>{
 for(const p of [
  planet({surface:{hasPersistentSurfaceLiquidWater:false,waterInventoryIndex01:0,
    waterLiquidFraction01:0,hasDefinedSolidSurfaceBase:true},general:{condensedIceMassFraction01:0}}),
  planet({geology:{isGeologicallyActive:false,geologicalActivityIndex01:0,internalHeatRetentionIndex01:0}}),
  planet({atmosphere:{isDeepEnvelope:true,retainedSurfacePressurePascal:1000000}}),
 ]) assert.notEqual(Vida2PhysicalInput.planet(p).routes[1].classification,'PLAUSIBLE');
});
test('VIDA.3b: luna templada con salmuera protegida solo habilita microhábitat de superficie',()=>{
 const target=moon(),original=JSON.stringify(target),a=Vida2PhysicalInput.moon(target);
 assert.equal(a.routes[0].classification,'PLAUSIBLE');
 assert.equal(a.routes[0].factors.protection,'MARGINAL');
 assert.equal(a.routes[0].surfaceMicrohabitatKind,'PROTECTED_SEEP');
 const outcome=Microbes.evaluate(id,a);
 assert.equal(outcome.selectedRoute,'SURFACE');
 assert.equal(outcome.habitat,'SURFACE_PROTECTED_SEEP');
 assert.equal(outcome.lifePresent,Microbes.evaluate(id,a).lifePresent);
 assert.equal(JSON.stringify(target),original);
});
test('VIDA.3b: lunas frías, secas, inertes, sin marea o protección no son superficie plausible',()=>{
 for(const target of [moon({estimatedSurfaceTemperatureKelvin:25}),moon({waterInventoryIndex01:.01}),
  moon({geologicalActivityIndex01:0,isGeologicallyActive:false}),moon({hasAtmosphere:false,atmosphereRetentionIndex01:0}),
  moon({},0)]) assert.notEqual(Vida2PhysicalInput.moon(target).routes[0].classification,'PLAUSIBLE');
});
test('VIDA.3b: presión escenario lunar no convertida a física medida',()=>{
 const a=Vida2PhysicalInput.moon(moon({atmosphereAssessment:{pressureBasis:'CONDITIONAL_SCENARIO',
  estimatedSurfacePressurePascal:1000000}}));
 assert.equal(a.routes[0].factors.protection,'MARGINAL');
});
test('VIDA.3b: políticas V1/V2 intactas, nueva V3 y sorteo LIFE_PRESENT byte-identico',()=>{
 assert.equal(VIDA3_MODEL_REVISION,'VIDA.3/microbial/v3-aquifer-lunar-surface');
 assert.equal(VIDA3_LIFE_ROLL_NAMESPACE,'VIDA.3/microbial/v1');
 const a=Vida2PhysicalInput.moon(moon()),s=Microbes.evaluate(id,a);
 const domain=[VIDA3_LIFE_ROLL_NAMESPACE,id.universeSeed,'3',s.bodyStorageKey,'LIFE_PRESENT'].join('|');
 const draw=createHash('sha256').update(domain).digest().readUInt32BE(0)/0x100000000;
 assert.equal(s.lifePresent,draw<.2);
 const repository=readFileSync(path.join(root,'data/local/repository/dexie-procedural-microbial-vida3.repository.ts'),'utf8');
 assert.match(repository,/storageBodyKey\s*=\s*`\$\{snapshot\.revision\}\|\$\{snapshot\.bodyStorageKey\}`/);
 const entity=readFileSync(path.join(root,'data/local/entity/private-microbial-biosphere-vida3.entity.ts'),'utf8');
 for(const revision of ['VIDA.3/microbial/v1','VIDA.3/microbial/v2-subsurface','VIDA.3/microbial/v3-aquifer-lunar-surface'])
  assert.ok(entity.includes(revision));
});
test('VIDA.3b: 256 lunas protegidas plausibles permiten microbios sin cuota ni doble tirada',()=>{
 const assessment=Vida2PhysicalInput.moon(moon());
 const results=Array.from({length:256},(_,i)=>Microbes.evaluate({...id,bodyIndex:String(i)},assessment));
 const present=results.filter(s=>s.lifePresent);
 assert.ok(present.length>30 && present.length<75,`seleccionados=${present.length}`);
 assert.ok(present.every(s=>s.selectedRoute==='SURFACE'&&s.habitat==='SURFACE_PROTECTED_SEEP'));
 assert.equal(new Set(results.map(x=>x.bodyStorageKey)).size,256);
});
