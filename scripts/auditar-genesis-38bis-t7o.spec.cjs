/** 38.bis-T7o — auditoría portátil, sin navegador ni IndexedDB. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const prefix='src/app/presentation/';
const helper=read(prefix+'infrastructure/colvis3-colony-ground-contact-t7o.ts');
const spec=read(prefix+'infrastructure/colvis3-colony-ground-contact-t7o.spec.ts');
const preview=read(prefix+'scientific-body-preview/scientific-body-preview.ts');
const infra=read(prefix+'infrastructure/vida38-infrastructure-render-38-6.ts');
const orbit=read(prefix+'infrastructure/colvis3-colony-orbit-camera-t7n.ts');
let checks=0;const check=fn=>{fn();checks++;};
for(const source of [helper,spec,preview,infra,orbit]){
  const d=ts.transpileModule(source,{reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
  check(()=>assert.equal((d.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0));
}
const mod={exports:{}};
new Function('require','module','exports',ts.transpileModule(helper,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(
  name=>name==='three'?{}:assert.fail('Import no esperado '+name),mod,mod.exports);
const ground=mod.exports.colvis3GroundingCorrectionT7o;
for(const [base,actual,footprint,delta] of [[1.04,1,.2,-.04],[.98,1,.2,.02],[1,1,.2,0],[1.8,1,.2,null],[0,0,0,null]]){
  const result=ground(base,actual,footprint);
  check(()=>assert.ok(delta===null?result===null:Math.abs(result-delta)<1e-8));
}
check(()=>assert.equal(ground(NaN,1,.2),null));
check(()=>assert.equal(ground(1,Infinity,.2),null));
for(const word of ['object instanceof THREE.InstancedMesh','raycaster.intersectObject(surface,false)',
 'object.worldToLocal(desiredLocal)','object.instanceMatrix.needsUpdate=true','matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix))',
 "object.userData['colvis2GroundEligibleT7o']"])
  check(()=>assert.ok(helper.includes(word),word));
for(const word of ['bucket.groundable.push','colvis2GroundEligibleT7o:bucket.groundable'])
  check(()=>assert.ok(infra.includes(word),word));
for(const word of ['this.colonyGroundContactT7o?.dispose()','attachColvis3ColonyGroundContactT7o(',
 'this.updateColonyInspectionCameraCOLVIS2();'])
  check(()=>assert.ok(preview.includes(word),word));
check(()=>assert.ok(orbit.includes('clamp(elevationRadians,.20,1.48)')));
check(()=>assert.ok(preview.includes('deltaY*.006,.20,1.48')));
check(()=>assert.ok(!preview.includes('new THREE.PlaneGeometry(')));
check(()=>assert.ok(!helper.includes('new THREE.Mesh(')));
console.log(`PASS GENESIS 38.bis-T7o: ${checks} comprobaciones portátiles, contacto, cámara y restauración.`);
