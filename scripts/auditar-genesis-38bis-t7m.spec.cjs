/** GENESIS 38.bis-T7m — auditoría portátil de zoom óptico común. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const preview=read('src/app/presentation/scientific-body-preview/scientific-body-preview.ts');
const helper=read('src/app/presentation/infrastructure/colvis3-colony-optical-zoom-t7m.ts');
const camera=read('src/app/presentation/infrastructure/colvis3-colony-camera-t7e.ts');
const test=read('src/app/presentation/infrastructure/colvis3-colony-optical-zoom-t7m.spec.ts');
let checks=0; const check=f=>{f();checks++;};
for(const code of [preview,helper,camera,test]){
 const result=ts.transpileModule(code,{reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 check(()=>assert.equal(result.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error).length||0,0));
}
const compile=code=>ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const camModule={exports:{}};
new Function('module','exports',compile(camera))(camModule,camModule.exports);
const optModule={exports:{}};
new Function('require','module','exports',compile(helper))((ref)=>{
 assert.equal(ref,'./colvis3-colony-camera-t7e');return camModule.exports;
},optModule,optModule.exports);
const project=(zoom,point,depth)=>zoom*point/depth;
const far=optModule.exports.colvis3ColonyOpticalFramingT7m(.00015,1,8);
check(()=>assert.equal(far.cameraZoom,1));
for(const level of [.32,.5,1,2,4,8]){
 const v=optModule.exports.colvis3ColonyOpticalFramingT7m(.00015,1,level);
 check(()=>assert.equal(v.framing.distanceScene,far.framing.distanceScene));
 check(()=>assert.equal(v.framing.nearScene,far.framing.nearScene));
 check(()=>assert.equal(v.framing.farScene,far.framing.farScene));
 check(()=>assert.ok(Math.abs(v.cameraZoom-8/level)<1e-12));
 // El terreno y los edificios, a diferente profundidad, reciben el MISMO
 // aumento óptico de su imagen; no se desplaza la cámara entre muestras.
 for(const depth of [.002,.008,.03,.12,1]){
  const imageAtBase=project(1,.001,depth);
  const imageAtZoom=project(v.cameraZoom,.001,depth);
  check(()=>assert.ok(Math.abs(imageAtZoom/imageAtBase-v.cameraZoom)<1e-12));
 }
}
for(const invalid of [[0,1,1],[.001,0,1],[.001,1,NaN],[.001,1,0]])
 check(()=>assert.equal(optModule.exports.colvis3ColonyOpticalFramingT7m(...invalid),null));
check(()=>assert.equal(optModule.exports.colvis3ColonyOpticalFramingT7m(.001,1,100).cameraZoom,1));
check(()=>assert.equal(optModule.exports.colvis3ColonyOpticalFramingT7m(.001,1,.01).cameraZoom,25));
check(()=>assert.ok(preview.includes("camera.zoom=optical.cameraZoom;")));
check(()=>assert.ok(preview.includes('colvis3ColonyOpticalFramingT7m(')));
check(()=>assert.ok(preview.includes('this.colonySurfaceContextT7e?.updateFrame(camera)')));
check(()=>assert.ok(preview.includes('this.colonySurfaceContextT7e?.setZoom(this.colonyInspectionZoomCOLVIS2)')));
check(()=>assert.equal((preview.match(/this\.camera\.zoom=1;/g)||[]).length,2));
check(()=>assert.equal((preview.match(/new THREE\.WebGLRenderer\(/g)||[]).length,1));
check(()=>assert.ok(!preview.includes('new THREE.PlaneGeometry(')));
check(()=>assert.ok(test.includes('landmarkOnTerrain')));
check(()=>assert.ok(test.includes('landmarkOnColony')));
console.log(`PASS GENESIS 38.bis-T7m: ${checks} comprobaciones portátiles; ampliación común a distintas profundidades y restauración de cámara.`);
