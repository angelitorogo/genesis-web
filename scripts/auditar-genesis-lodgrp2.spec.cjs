'use strict';
/** Portable GENESIS LODGRP.2 audit — Node.js, without Angular/WebGL. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const base='src/app/presentation/system/';
let checks=0;
const check=(label,condition)=>{assert.ok(condition,label);checks++;};
const equal=(label,actual,expected)=>{assert.deepEqual(actual,expected,label);checks++;};
const source=rel=>fs.readFileSync(path.join(root,base+rel),'utf8');
function moduleFromTs(rel,deps={}){
  const result=ts.transpileModule(source(rel),{fileName:rel,
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
    reportDiagnostics:true});
  check(`${rel}: sintaxis TypeScript`,result.diagnostics?.length===0);
  const module={exports:{}};
  const localRequire=id=>{
    if(Object.hasOwn(deps,id))return deps[id];
    throw new Error(`Dependencia no inyectada al auditor: ${id}`);
  };
  new Function('module','exports','require',result.outputText)(module,module.exports,localRequire);
  return module.exports;
}
const helper=moduleFromTs('system-scene-planetary-lod-acceleration-lodgrp2.ts');
const {lodgrpProximityV2:proximity,lodgrpPrioritiseMoonsV2:prioritise,
  lodgrpUnstagedAtlasesV2:unstaged,lodgrpTerminateWorkerV2:terminate,
  LodgrpTimingsV2}=helper;
const v1=moduleFromTs('system-scene-planetary-lod-group-lodgrp1.ts',{
  './system-scene-group-atlas-lodgrp1':{lodgrpAtlasByteSizeV1:r=>
    Object.values(r.maps).reduce((n,b)=>n+(b?.byteLength??0),0)},
});
for(const [pixels,followed,prev,expected] of [
 [0,false,'OUT','OUT'],[111,false,'OUT','OUT'],[112,false,'OUT','PREPARING'],
 [120,false,'OUT','PREPARING'],[159,false,'PREPARING','PREPARING'],
 [160,false,'PREPARING','IN'],[82,false,'IN','IN'],[81,false,'IN','PREPARING'],
 [65,false,'PREPARING','PREPARING'],[64,false,'PREPARING','OUT'],
 [0,true,'OUT','IN'],[Infinity,false,'OUT','OUT'],[-1,false,'OUT','OUT'],
 [NaN,false,'OUT','OUT'],
])equal(`umbral ${pixels}/${prev}/${followed}`,proximity(pixels,followed,prev),expected);
const arr=['lunaA','lunaB','lunaC'];
equal('prioridad luna seguida',prioritise(arr,'lunaC',new Map([
 ['lunaA',-20],['lunaB',-5],['lunaC',-40]])),['lunaC','lunaB','lunaA']);
equal('entrada sin mutación',arr,['lunaA','lunaB','lunaC']);
equal('prioridad luna más cercana',prioritise(arr,null,new Map([
 ['lunaA',-20],['lunaB',-5],['lunaC',-40]])),['lunaB','lunaA','lunaC']);
equal('orden estable sin distancias',prioritise(arr,null,new Map()),arr);
for(const [busy,force,expected] of [[false,false,false],[true,false,true],[false,true,true],[true,true,true]]){
 equal(`lifecycle worker ${busy}/${force}`,terminate(busy,force),expected);
}
const result=(id,gen)=>({type:id==='p'?'planet':'moon',bodyId:id,generation:gen,
  width:512,height:256,solid:false,maps:{albedo:new Uint8Array(16)}});
const c=new v1.PlanetaryLodGroupControllerV1();
const group={hostId:'p',moonIds:['a','b'],requestedBytes:v1.lodgrpEstimateBytesV1(2)};
check('nuevo grupo',c.begin(group));
const gen=c.status.generation;
check('acepta anfitrión',c.accept(result('p',gen)));
equal('CPU aún preparando',c.status.phase,'PREPARING');
equal('GPU puede preparar ya el anfitrión',unstaged(c.prepared,new Set()).map(a=>a.bodyId),['p']);
equal('no reencola el anfitrión',unstaged(c.prepared,new Set(['p'])).length,0);
check('acepta primera luna',c.accept(result('a',gen)));
equal('GPU recibe luna mientras sigue CPU',unstaged(c.prepared,new Set(['p'])).map(a=>a.bodyId),['a']);
check('acepta segunda luna',c.accept(result('b',gen)));
equal('grupo listo tras las tres',c.status.phase,'READY');
check('activación final',c.activate());
check('cambiar prioridad sin reiniciar',!c.begin({...group,moonIds:['b','a']}));
equal('generación se conserva',c.status.generation,gen);
equal('grupo sigue HIGH',c.status.phase,'HIGH');
check('no acepta atlas obsoleto',!c.accept(result('a',gen-1)));
const metrics=new LodgrpTimingsV2();metrics.begin(1000);
metrics.generated(32,50,1050);metrics.uploaded(3);metrics.generated(44,59,1110);
metrics.cpuCompleted(1110);metrics.uploaded(7);metrics.gpuCompleted(1120);metrics.activated(1122);
const m=metrics.snapshot(1125);
for(const [key,expected] of Object.entries({sinceStartMs:125,firstAtlasMs:50,
  generatedAtlases:2,totalCpuMs:76,totalWorkerRoundtripMs:109,
  totalGpuUploadMs:10,maxGpuUploadMs:7,uploadedMaps:2,
  cpuFinishedAtMs:110,gpuFinishedAtMs:120,activatedAtMs:122})){
 equal('métrica '+key,m[key],expected);
}
metrics.begin(2000);
equal('reinicio métricas tras cambio de grupo',metrics.snapshot(2000).generatedAtlases,0);
equal('sin activación anterior',metrics.snapshot(2000).activatedAtMs,null);
const scene=source('system-scene.ts');
const worker=source('system-scene-group-atlas-lodgrp1.worker.ts');
const stageAt=scene.indexOf('this.stagePlanetaryLodGpuLODGRP1();',scene.indexOf('worker.onmessage='));
const nextAt=scene.indexOf('this.requestNextPlanetaryLodBodyLODGRP1();',scene.indexOf('worker.onmessage='));
check('GPU se prepara al recibir atlas, antes del siguiente trabajo CPU',stageAt>=0 && nextAt>stageAt);
check('worker mide generación real',worker.includes('performance.now() - started'));
check('worker mantiene transferencia cero copias',worker.includes('postMessage({ok:true,result}, {transfer:buffers})'));
check('worker se preinicia al iniciar seguimiento',scene.includes('this.ensurePlanetaryLodWorkerLODGRP1();\n\n    const localOrbitExtent'));
check('worker reusable sin terminación al completar grupo',!scene.slice(scene.indexOf('worker.onmessage='),scene.indexOf('worker.onerror=')).includes('.terminate()'));
check('cancelación distingue ocupado de libre',scene.includes('lodgrpTerminateWorkerV2(this.planetaryLodBusyLODGRP1,force)'));
check('una textura por frame',scene.includes('this.planetaryLodGpuQueueLODGRP1.shift()'));
check('no hay activación antes de CPU READY',scene.includes("this.planetaryLodGroupLODGRP1.status.phase === 'READY' &&"));
check('GPU no duplica atlas',scene.includes('lodgrpUnstagedAtlasesV2('));
check('mantiene recursos preexistentes al salir',scene.includes('entry.material.map=entry.originalMap'));
check('conserva límite memoria LODGRP1',scene.includes('lodgrpEstimateBytesV1(members.length)'));
check('no modifica generación científica',!source('system-scene-planetary-lod-acceleration-lodgrp2.ts').includes('Math.random'));
check('diagnóstico separado CPU/GPU',scene.includes('planetaryLodTimingsLODGRP2.snapshot('));
check('modo detalle automático; no LODMAX',!scene.includes('genesisLod=max'));
console.log(`PASS GENESIS LODGRP.2 — ${checks} comprobaciones portátiles: umbrales, prioridad, solapamiento CPU/GPU, worker, métrica, estado de grupo y compatibilidad`);
