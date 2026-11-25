/** GENESIS 38.bis-T7e — sin WebGL/IndexedDB: geometría, cámara, conservación. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const prefix='src/app/presentation/';
const body=read(prefix+'scientific-body-preview/scientific-body-preview.ts');
const html=read(prefix+'scientific-body-preview/scientific-body-preview.html');
const render=read(prefix+'infrastructure/vida38-infrastructure-render-38-6.ts');
const cameraSrc=read(prefix+'infrastructure/colvis3-colony-camera-t7e.ts');
const surfaceSrc=read(prefix+'infrastructure/colvis3-colony-context-surface-t7e.ts');
const oldHelper=read(prefix+'infrastructure/colvis3-colony-visibility-t7c.ts');
let checks=0;const check=(f)=>{f();checks++;};
for(const src of [body,render,cameraSrc,surfaceSrc,oldHelper]){
  const d=ts.transpileModule(src,{reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
  check(()=>assert.equal((d.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0));
}
const load=(src)=>{
  const module={exports:{}};
  const compiled=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','module','exports',compiled)((x)=>x==='three'?{}:assert.fail('Unexpected import: '+x),module,module.exports);
  return module.exports;
};
const camera=load(cameraSrc),surface=load(surfaceSrc);
for(const zoom of [.32,1,4,8,9,12,18,24]){
  const a=camera.colvis3ColonyFramingT7e(.00015,1,zoom);
  check(()=>assert.ok(a!==null&&a.nearScene>0&&a.farScene>a.distanceScene));
}
const first=camera.colvis3ColonyFramingT7e(.00015,1,1);
const far=camera.colvis3ColonyFramingT7e(.00015,1,24);
check(()=>assert.equal(first.bodyCentreBlend,0));
check(()=>assert.equal(far.bodyCentreBlend,1));
check(()=>assert.ok(far.distanceScene>3.5));
check(()=>assert.ok(far.farScene>far.distanceScene+2));
check(()=>assert.equal(camera.colvis3ColonyFramingT7e(0,1,1),null));
const one=surface.colvis3SurfaceDetailPixelsT7e(123,true,64);
const two=surface.colvis3SurfaceDetailPixelsT7e(123,true,64);
check(()=>assert.deepEqual(one,two));
check(()=>assert.equal(one[3],0));
check(()=>assert.ok(one[(32*64+32)*4+3]>100));
check(()=>assert.notDeepEqual(one,surface.colvis3SurfaceDetailPixelsT7e(124,true,64)));
for(const token of ['attachColonySurfaceContextT7e','detachColonySurfaceContextT7e','colvis3ColonyFramingT7e',
    'this.colonySurfaceContextT7e.mesh.material.opacity','colonyInspectionIndexCOLVIS2','this.lockBackgroundScrollT7d()',
    'this.unlockBackgroundScrollT7d()','COLVIS3_MAX_INSPECTION_ZOOM_T7E']){
  check(()=>assert.ok(body.includes(token),token));
}
check(()=>assert.equal((body.match(/new THREE\.WebGLRenderer\(/g)||[]).length,1));
check(()=>assert.ok(!render.includes('addColonySurfacePatchT7d')));
check(()=>assert.ok(!render.includes('colonySurfacePatchGeometryT7d')));
check(()=>assert.ok(render.includes('colonyMarkerEnhancementT7c = false')));
check(()=>assert.ok(surfaceSrc.includes('groundRadiusScene*groundRadiusScene-length2')));
check(()=>assert.ok(surfaceSrc.includes('depthWrite:false')));
check(()=>assert.ok(surfaceSrc.includes('transparent:true')));
check(()=>assert.ok(surfaceSrc.includes('edge=1-smooth(')));
check(()=>assert.ok(!html.includes('Procedencia</dt>')));
check(()=>assert.ok(!html.includes('Nombre público</dt>')));
check(()=>assert.ok(oldHelper.includes('0xff4fd8')));
console.log(`PASS GENESIS 38.bis-T7e: ${checks} comprobaciones portátiles; esfericidad, microtextura, cámara y regresiones.`);
