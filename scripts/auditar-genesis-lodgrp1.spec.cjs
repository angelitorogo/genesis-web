'use strict';
/** Portable Node 22 + project TypeScript: executes REAL pure controllers and
 * atlas generation with no Three.js/WebGL/Angular runtime required. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
let ts;
try {ts=require('typescript');}
catch {console.error('ERROR: instalar dependencias del proyecto (typescript) antes de auditar.');process.exit(2);}
require.extensions['.ts']=(module,filename)=>{
  const code=fs.readFileSync(filename,'utf8');
  const t=ts.transpileModule(code,{fileName:filename,compilerOptions:{
    module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,
    esModuleInterop:true},reportDiagnostics:true});
  if(t.diagnostics?.some(d=>d.category===ts.DiagnosticCategory.Error))
    throw new Error('Transpilación fallida '+filename);
  module._compile(t.outputText,filename);
};
const root=path.resolve(__dirname,'../src/app/presentation/system');
const mod=(name)=>require(path.join(root,name+'.ts'));
const {PlanetaryLodGroupControllerV1,lodgrpEstimateBytesV1,lodgrpProximityV1,
  LODGRP_MAX_BYTES_V1,LODGRP_CACHE_BYTES_V1}=mod('system-scene-planetary-lod-group-lodgrp1');
const {buildLodgrpAtlasV1,lodgrpAtlasByteSizeV1}=mod('system-scene-group-atlas-lodgrp1');
const {buildSystemSceneMoonPresentationV1}=mod('system-scene-moon-presentation');
const {buildSystemSceneMoonTextureV1}=mod('system-scene-moon-texture');
const {refinePlanetRgbaTextureV1}=mod('system-scene-planet-texture-refinement');
let checks=0;
const check=(value,message)=>{assert.ok(value,message);checks++;};
const eq=(actual,expected,label)=>{assert.deepEqual(actual,expected,label);checks++;};
const host='planet-xephus-b11';
const moonIds=['moon-b11-1','moon-b11-2','moon-b11-3'];
const count=moonIds.length;
const group={hostId:host,moonIds,requestedBytes:lodgrpEstimateBytesV1(count)};
const controller=new PlanetaryLodGroupControllerV1();
check(controller.begin(group),'create group');
eq(controller.status.phase,'PREPARING','prep state');
eq(controller.status.total,4,'planet + three moons');
eq(controller.memberIds,[host,...moonIds],'authorized members');
check(!controller.activate(),'do not show partial HD');
const gen=controller.status.generation;
const atlasResult=(id,generation=gen)=>({type:id===host?'planet':'moon',generation,bodyId:id,
  width:512,height:256,solid:false,maps:{albedo:new Uint8Array(16)}});
check(controller.accept(atlasResult(host)),'planet ready');
check(controller.accept(atlasResult(moonIds[0])),'first moon ready');
eq(controller.status.phase,'PREPARING','remain low until all ready');
eq(controller.status.ready,2,'progress');
check(controller.accept(atlasResult(moonIds[1])),'second moon ready');
check(controller.accept(atlasResult(moonIds[2])),'third moon ready');
eq(controller.status.phase,'READY','all prepared');
check(controller.activate(),'commit high');
check(controller.isHigh,'shared high');
check(!controller.begin(group),'no repeat while following moons');
check(controller.leave(),'leave active group');
check(controller.begin(group),'re-enter group');
eq(controller.status.phase,'READY','reuse CPU atlas cache');
check(controller.cacheStats.entries===4,'cached members');
check(controller.cacheStats.bytes<=LODGRP_CACHE_BYTES_V1,'bounded cache');
const oldGeneration=controller.status.generation;
controller.begin({hostId:'planet-droveria',moonIds:[],requestedBytes:lodgrpEstimateBytesV1(0)});
check(!controller.accept(atlasResult(host,oldGeneration)),'reject obsolete worker response');
eq(controller.memberIds,['planet-droveria'],'new host');
controller.reset();
eq(controller.cacheStats.entries,0,'cache invalidated at snapshot change');
eq(controller.status.phase,'LOW','reset visual state');
const huge=Array.from({length:20},(_,i)=>`moon-heavy-${i}`);
controller.begin({hostId:'planet-heavy',moonIds:huge,requestedBytes:lodgrpEstimateBytesV1(huge.length)});
eq(controller.status.phase,'BUDGET_LIMITED','large system safe stable fallback');
check(controller.status.requestedBytes>LODGRP_MAX_BYTES_V1,'bounded working set');
check(!controller.activate(),'do not partially activate oversized group');
controller.reset();
controller.begin({hostId:'planet-fail',moonIds:[],requestedBytes:lodgrpEstimateBytesV1(0)});
controller.fail();
eq(controller.status.phase,'FAILED','failed worker marks fallback');
check(!controller.activate(),'cannot activate failed worker');
// Spatial trigger + hysteresis + forced host for direct moon following.
eq(lodgrpProximityV1(72,false,'OUT'),'PREPARING','anticipated prep');
eq(lodgrpProximityV1(110,false,'PREPARING'),'IN','entry');
eq(lodgrpProximityV1(64,false,'IN'),'IN','hysteresis stay');
eq(lodgrpProximityV1(49,false,'IN'),'PREPARING','exit boundary');
eq(lodgrpProximityV1(20,false,'PREPARING'),'OUT','exit');
eq(lodgrpProximityV1(1,true,'OUT'),'IN','tracked planet or moon');
// Same low/high atlas dimensions as LOD2.1, never 1024 for scene gas.
const base=new Uint8Array(256*128*4);
for(let i=0;i<base.length;i+=4){base[i]=30;base[i+1]=81;base[i+2]=132;base[i+3]=255;}
const basic={type:'planet',generation:7,bodyId:'planet-gas',seed:123,
  solidSeed:123,giantAtmosphere:null,solidSource:null,source:{albedo:{width:256,height:128,pixels:base}}};
const planet=buildLodgrpAtlasV1(basic);
eq(planet.width,512,'two-level planet high');
eq(planet.height,256,'two-level planet high height');
eq(planet.maps.albedo.length,512*256*4,'planet atlas length');
const expected=refinePlanetRgbaTextureV1(base,256,128,512,123,'COLOR');
eq(planet.maps.albedo,expected,'identical existing atlas engine');
eq(lodgrpAtlasByteSizeV1(planet),512*256*4,'CPU accounting');
const lunarInput={moonIdentity:'LODGRP1-TEST',hostPlanetType:'GAS_GIANT',
  radiusEarth:.27,massEarth:.025,meanDensityGramsPerCubicCentimeter:2.8,
  surfaceGravityEarth:.24,atmosphereRetentionIndex01:.01,atmosphereRegime:'NONE',
  atmosphereScenarioPressurePascal:null,atmosphereScenarioSpecies:[],
  waterInventoryIndex01:.34,inferredIceRichnessIndex01:.41,
  subsurfaceOceanPotentialIndex01:.20,surfaceLiquidWaterPotentialIndex01:0,
  waterRegime:'NONE',estimatedSurfaceTemperatureKelvin:145,
  geologicalActivityIndex01:.35,tidalHeatingIndex01:.15,
  geologyRegime:'ACTIVE',overallHabitabilityIndex01:.05,
  isPotentiallyHabitable:false,giantHostSpecialization:true,
  giantCompositionRegime:'MIXED_ROCK_ICE',isLargeGiantMoon:false,
  isTidallyActiveGiantMoon:false,isOceanBearingGiantMoonCandidate:false};
const presentation=buildSystemSceneMoonPresentationV1(lunarInput);
const moon=buildLodgrpAtlasV1({type:'moon',generation:9,bodyId:'moon-valid',presentation});
eq(moon.width,1024,'original lunar high resolution');
eq(moon.height,512,'lunar high height');
eq(moon.maps.albedo.length,1024*512*4,'moon albedo');
eq(moon.maps.normal.length,1024*512*4,'moon normals');
eq(moon.maps.roughness.length,1024*512*4,'moon roughness');
const authoritative=buildSystemSceneMoonTextureV1(presentation,{width:1024,height:512});
eq(moon.maps.albedo,authoritative.albedoRgba,'moon atlas deterministic parity');
// Inspect integration to prevent a false-positive pure-domain-only delivery.
const runtime=fs.readFileSync(path.join(root,'system-scene.ts'),'utf8');
const worker=fs.readFileSync(path.join(root,'system-scene-group-atlas-lodgrp1.worker.ts'),'utf8');
const requires=[
  'this.updatePlanetaryLodGroupLODGRP1()',
  'const groupHoldsLodLODGRP1',
  'this.planetaryLodGroupLODGRP1.memberIds',
  'new Worker(',
  "new URL('./system-scene-group-atlas-lodgrp1.worker.ts',import.meta.url)",
  'this.renderer.initTexture(entry.texture)',
  'this.commitPlanetaryLodGroupLODGRP1()',
  'this.releasePlanetaryLodGpuLODGRP1()',
  'this.cancelPlanetaryLodWorkerLODGRP1()',
  'this.resetPlanetaryLodGroupLODGRP1(true)',
  '!groupHoldsLodLODGRP1 && closestMoonLUNSURF1',
  'closestPlanet?.projectedDiameter !== undefined &&\n      !groupHoldsLodLODGRP1',
];
for(const fragment of requires) check(runtime.includes(fragment),`real integration missing: ${fragment}`);
check(worker.includes('postMessage({ok:true,result}, {transfer:buffers})'),'zero-copy worker response');
check(!runtime.includes('system-scene-max-lod-experiment.ts'),'no LODMAX.1 reactivation');
const sourceFiles=['system-scene.ts','system-scene-planetary-lod-group-lodgrp1.ts',
  'system-scene-group-atlas-lodgrp1.ts','system-scene-group-atlas-lodgrp1.worker.ts',
  'system-scene-planetary-lod-group-lodgrp1.spec.ts',
  'system-scene-group-atlas-lodgrp1.spec.ts'];
for(const name of sourceFiles){
  const src=ts.createSourceFile(name,fs.readFileSync(path.join(root,name),'utf8'),
    ts.ScriptTarget.Latest,true);
  eq(src.parseDiagnostics.length,0,`TS AST ${name}`);
}
console.log(`PASS GENESIS LODGRP.1 — ${checks} comprobaciones portátiles: grupo, worker, atlas reales, presupuesto y regresiones`);
