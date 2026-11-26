'use strict';
/* GENESIS 38.9: structural + runnable CPU budget audit without browser/WebGL. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = p => fs.readFileSync(path.join(root,p),'utf8');
const scene = source('src/app/presentation/system/system-scene.ts');
const groupSrc = source('src/app/presentation/system/system-scene-planetary-lod-group-lodgrp1.ts');
const resourceSrc = source('src/app/presentation/system/system-scene-resource-cache.ts');
const checks = [];
function check(name, fn){fn();checks.push(name);}
function contains(text, fragment){assert.ok(text.includes(fragment),`Ausente: ${fragment}`);}
check('La escena mantiene instanciación Three.js existente',()=>contains(scene,'new THREE.InstancedMesh'));
check('Mantiene el pool de geometrías LOD',()=>contains(scene,'this.sphereGeometryPool.get('));
check('Mantiene el control LODGRP con Worker',()=>contains(scene,'new Worker('));
check('Conserva la subida progresiva de texturas GPU',()=>contains(scene,'this.renderer.initTexture(entry.texture)'));
check('Conserva liberación GPU del grupo al abandonarlo',()=>contains(scene,'this.releasePlanetaryLodGpuLODGRP1()'));
check('Conserva liberación de contexto WebGL al destruir',()=>contains(scene,'.forceContextLoss()'));
check('Construye destinos de iluminación al cambiar de snapshot',()=>contains(scene,'this.lightingTargets389 = systemSceneLightingTargets(snapshot)'));
check('Limpia las referencias del snapshot al abandonar la escena',()=>contains(scene,'this.lightingTargets389 = [];'));
check('No crea una lista de iluminación en cada frame',()=>{
  const frame=scene.split('  private updateBodyLightDirections():')[1].split('  /** Visible bodies only.')[0];
  assert.ok(!frame.includes('systemSceneLightingTargets(snapshot)'));
  assert.ok(!frame.includes('resolveOrbitalHomeStarIdsVISCIV6d(body, snapshot.stars)'));
  contains(frame,'of this.lightingTargets389');
});
check('No crea un Set de miembros en cada frame LOD',()=>{
  const fn=scene.split('  private updateBodyLod():')[1].split('  private updateGiantAtmosphereFineGeometry')[0];
  assert.ok(!fn.includes('new Set(this.planetaryLodGroupLODGRP1.memberIds)'));
  contains(fn,'this.planetaryLodGroupLODGRP1.hasMember(bodyId)');
});
check('Conserva la identidad de estrellas anfitrionas',()=>contains(scene,'resolveOrbitalHomeStarIdsVISCIV6d(planet, snapshot.stars)'));
check('La caída de presupuesto no altera shaders',()=>contains(scene,"if (this.planetaryLodGroupLODGRP1.status.phase === 'BUDGET_LIMITED')"));
check('Contabiliza realmente los bytes CPU preparados',()=>contains(groupSrc,'this.readyBytes += size - oldSize'));
check('Acota también la memoria en el retorno desde caché',()=>contains(groupSrc,'this.readyBytes + stored.bytes > LODGRP_MAX_BYTES_V1'));
check('El caché de textura original conserva su límite LRU',()=>contains(resourceSrc,'this.evictUntilFits(estimatedBytes)'));

// Test the production LODGRP controller, not a reimplementation. TypeScript
// is a devDependency of GENESIS and also used by ng build.
const ts = require('typescript');
function transpile(code, filename) {
  const result = ts.transpileModule(code,{
    fileName: filename,reportDiagnostics:true,
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  });
  const errors=(result.diagnostics ?? []).filter(d=>d.category===ts.DiagnosticCategory.Error);
  assert.equal(errors.length,0,`${filename}: ${errors.map(e=>ts.flattenDiagnosticMessageText(e.messageText,' '))}`);
  return result.outputText;
}
const mod={exports:{}};
const mockRequire=(name)=>{
  if(name==='./system-scene-group-atlas-lodgrp1')return {lodgrpAtlasByteSizeV1:r=>
    Object.values(r.maps).reduce((sum,data)=>sum+(data?.byteLength??0),0)};
  throw Error(`Dependencia inesperada: ${name}`);
};
vm.runInNewContext(transpile(groupSrc,'system-scene-planetary-lod-group-lodgrp1.ts'),
  {module:mod,exports:mod.exports,require:mockRequire},
  {filename:'system-scene-planetary-lod-group-lodgrp1.ts'});
const {
  PlanetaryLodGroupControllerV1,LODGRP_MAX_BYTES_V1, LODGRP_CACHE_BYTES_V1,
  lodgrpEstimateBytesV1,
}=mod.exports;
const mb=1024*1024;
const atlas=(id,generation,size)=>({type:id.startsWith('planet')?'planet':'moon',bodyId:id,
  generation,width:512,height:256,solid:false,maps:{albedo:{byteLength:size}}});
check('Los miembros usan identidad estable en un mismo grupo',()=>{
  const c=new PlanetaryLodGroupControllerV1();
  const g={hostId:'planet-A',moonIds:['moon-A1'],requestedBytes:lodgrpEstimateBytesV1(1)};
  assert.equal(c.begin(g),true);const ids=c.memberIds;
  assert.equal(c.hasMember('moon-A1'),true);
  assert.equal(c.begin(g),false);assert.equal(c.memberIds,ids);
  c.leave();assert.equal(c.hasMember('moon-A1'),false);
});
check('El presupuesto real limita los atlas preparados sin activar HIGH',()=>{
  const c=new PlanetaryLodGroupControllerV1();
  c.begin({hostId:'planet-A',moonIds:['moon-A1'],requestedBytes:lodgrpEstimateBytesV1(1)});
  const g=c.status.generation;
  assert.equal(c.accept(atlas('planet-A',g,80*mb)),true);
  assert.equal(c.cacheStats.activeBytes,80*mb);
  assert.equal(c.accept(atlas('moon-A1',g,60*mb)),true);
  assert.equal(c.status.phase,'BUDGET_LIMITED');
  assert.equal(c.activate(),false);
  assert.ok(c.cacheStats.activeBytes<=LODGRP_MAX_BYTES_V1);
  assert.ok(c.cacheStats.bytes<=LODGRP_CACHE_BYTES_V1);
  c.reset();assert.equal(c.cacheStats.bytes,0);
});
check('El caché reutiliza atlas existentes y libera RAM al resetear',()=>{
  const c=new PlanetaryLodGroupControllerV1();
  const g={hostId:'planet-A',moonIds:[],requestedBytes:lodgrpEstimateBytesV1(0)};
  c.begin(g);c.accept(atlas('planet-A',c.status.generation,2*mb));
  assert.equal(c.activate(),true);
  c.leave();assert.equal(c.begin(g),true);
  assert.equal(c.status.phase,'READY');
  assert.equal(c.cacheStats.activeBytes,2*mb);
  c.reset();assert.equal(c.cacheStats.entries,0);
});
for(const name of ['src/app/presentation/system/system-scene.ts',
 'src/app/presentation/system/system-scene-planetary-lod-group-lodgrp1.ts',
 'src/app/presentation/system/system-scene-performance-38-9.spec.ts']){
  check(`Sintaxis TS: ${path.basename(name)}`,()=>{
    const file=ts.createSourceFile(name,source(name),ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
    assert.equal(file.parseDiagnostics.length,0);
  });
}
console.log(`GENESIS 38.9: ${checks.length}/${checks.length} comprobaciones OK`);
checks.forEach((name,i)=>console.log(`${String(i+1).padStart(2)}. ${name}`));
