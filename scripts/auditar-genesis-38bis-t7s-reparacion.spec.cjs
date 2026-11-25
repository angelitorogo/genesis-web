/* GENESIS 38.bis-T7s — reparación segura del preview planetario.
 * Auditoría portable: no requiere navegador ni ejecutar WebGL.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const base=path.resolve(__dirname,'..');
const read=(relative)=>fs.readFileSync(path.join(base,relative),'utf8');
const prefix='src/app/presentation/scientific-body-preview/';
const source=read(prefix+'scientific-body-preview.ts');
const spec=read(prefix+'scientific-body-preview.spec.ts');
const helper=read(prefix+'scientific-preview-daylight-camera-t7s.ts');
const helperSpec=read(prefix+'scientific-preview-daylight-camera-t7s.spec.ts');
let checked=0;
const check=(fn)=>{fn();checked++};
for(const [name,text] of Object.entries({source,spec,helper,helperSpec})){
  const result=ts.transpileModule(text,{reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
  check(()=>assert.deepEqual((result.diagnostics??[]).filter(d=>d.category===ts.DiagnosticCategory.Error).map(d=>d.code),[],name));
}
// Contract for every template binding lost by the faulty T7s ZIP.
for(const method of [
  'colonyInspectionChoicesCOLVIS2','colonyInspectionIndexCOLVIS2',
  'chooseColonyInspectionCOLVIS2','exitColonyInspectionCOLVIS2',
  'colonyInspectionDetailsT7c','colonyHostBodyLabelT7d',
  'orbitalInfrastructureDiagnosticVISCIV6e',
  'inspectColonyCOLVIS2','updateColonyInspectionCameraCOLVIS2',
  'lockBackgroundScrollT7d','unlockBackgroundScrollT7d',
  'attachColonySurfaceContextT7e','detachColonySurfaceContextT7e',
  'updateColonyNightLightsT7c','updateArtificialSatelliteBinding',
  'updateStellarLightBinding','updateInfrastructureLod386',
  'updateOrbitalRingNightLightsVISCIV6g',
]) check(()=>assert.ok(source.includes(method),`Falta ${method}`));
check(()=>assert.ok(source.includes('this.colonyInspectionIndexCOLVIS2() === null')));
check(()=>assert.ok(source.includes('!this.contextEnabled()')));
check(()=>assert.ok(source.includes('scientificPreviewDaylightCameraT7s(this.previewStellarSources())')));
check(()=>assert.ok(source.includes('this.camera.up.set(0, 1, 0)')));
check(()=>assert.ok(source.includes('this.camera.lookAt(0, 0, 0)')));
check(()=>assert.ok(!spec.includes('scientificBodyPreviewPlanetIlluminationYawV1')));
check(()=>assert.ok(helperSpec.includes('scientificPreviewDaylightCameraT7s')));
// Execute the actual pure helper after transpiling; inspect day-side invariants.
const emitted=ts.transpileModule(helper,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const tempModule={exports:{}};
new Function('module','exports',emitted)(tempModule,tempModule.exports);
const fn=tempModule.exports.scientificPreviewDaylightCameraT7s;
check(()=>assert.equal(typeof fn,'function'));
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
for(const star of [{x:1,y:0,z:0},{x:-1,y:0,z:0},{x:0,y:0,z:-1},{x:0,y:1,z:0},{x:0,y:-1,z:0}]){
  const view=fn([{...star,weight01:1,isOrbitalHost:true}]);
  check(()=>assert.ok(dot(view,star)>.98,`hemisferio nocturno para ${JSON.stringify(star)}`));
  check(()=>assert.ok(Math.abs(Math.hypot(view.x,view.y,view.z)-1)<1e-10));
}
const host=fn([{x:1,y:0,z:0,weight01:1,isOrbitalHost:false},{x:-1,y:0,z:0,weight01:.8,isOrbitalHost:true}]);
check(()=>assert.ok(host.x < -.98));
const fallback=fn(undefined);
check(()=>assert.ok(dot(fallback,{x:4.5,y:3,z:5})>6));
const canceled=fn([{x:1,y:0,z:0,weight01:1},{x:-1,y:0,z:0,weight01:1}]);
check(()=>assert.ok(Object.values(canceled).every(Number.isFinite)));
console.log(`PASS GENESIS 38.bis-T7s reparación: ${checked} comprobaciones portátiles OK (contrato COLVIS/VISCIV + cámara diurna)`);
