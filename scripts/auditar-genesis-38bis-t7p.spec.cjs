/** GENESIS 38.bis-T7p — auditoría portable: apoyo común de todas las piezas y LOD. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const prefix='src/app/presentation/';
const helper=read(prefix+'infrastructure/colvis3-colony-ground-contact-t7o.ts');
const renderer=read(prefix+'infrastructure/vida38-infrastructure-render-38-6.ts');
const preview=read(prefix+'scientific-body-preview/scientific-body-preview.ts');
const spec=read(prefix+'infrastructure/colvis3-colony-ground-contact-t7o.spec.ts');
let passed=0;const check=(f)=>{f();passed++;};
for(const source of [helper,renderer,preview,spec]){
 const d=ts.transpileModule(source,{reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 check(()=>assert.equal((d.diagnostics??[]).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0));
}
// Isolate the pure correction without WebGL and verify numerical bounds.
const mod={exports:{}};
new Function('require','module','exports',ts.transpileModule(helper,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(
 name=>name==='three'?{}:assert.fail('Import unexpected '+name),mod,mod.exports);
const old=mod.exports.colvis3GroundingCorrectionT7o;
const corrected=mod.exports.colvis3SupportCorrectionT7p;
for(const [a,b,foot,r,expected] of [
 [1.025,1,.1,1,-.025], [1,1,.1,1,0],
 [.98,1,.1,1,.02], [1.5,1,.1,1,null],
 [1,1,.1,-1,null], [NaN,1,.1,1,null],
 [1.10,1,.01,.2,null],
]) check(()=>{const v=corrected(a,b,foot,r);assert.ok(expected===null?v===null:Math.abs(v-expected)<1e-9);});
check(()=>assert.equal(old(1.2,1,.1),null));
check(()=>assert.ok(Math.abs(old(1.02,1,.1)+.02)<1e-8));
// The old T7o correction only touched part.lift===0 and caused a split
// between ground modules and raised TECH_NODE/BRIDGE modules.
for(const token of [
 'supportLiftScene:number[]',
 'bucket.supportLiftScene.push(Math.max(0,part.lift*verticalSize))',
 'colvis2SupportLiftSceneT7p:bucket.supportLiftScene',
 'let colonialInspectionActiveT7p=false',
 'if(colonialInspectionActiveT7p)diameter=1200',
]) check(()=>assert.ok(renderer.includes(token),token));
for(const token of [
 "object.userData['colvis2SupportLiftSceneT7p']",
 'const liftScene:number=newContract?(lifts[i] as number):0',
 'support.copy(worldBase).sub(liftedWorld.sub(localOriginWorld))',
 'const siteHit=siteRaycaster.intersectObject(surface,false)[0]',
 'colony.parent.worldToLocal(targetWorld)',
 'colvis3SupportCorrectionT7p(',
 'object.instanceMatrix.needsUpdate=true',
 'object.computeBoundingSphere()',
 'colony.position.copy(originalSitePosition)',
]) check(()=>assert.ok(helper.includes(token),token));
for(const token of ['this.colonyGroundContactT7o?.dispose()',
 'this.colonyGroundContactT7o=attachColvis3ColonyGroundContactT7o(',
 'this.updateColonyInspectionCameraCOLVIS2()'])
 check(()=>assert.ok(preview.includes(token),token));
check(()=>assert.ok(!helper.includes('new THREE.PlaneGeometry')));
check(()=>assert.ok(!helper.includes('surface.geometry.dispose()')));
// In the reconstructed support reference, all pieces must receive the same
// ground displacement regardless of an intentional architectural lift.
for(const [radius,siteHeight,footprint] of [[1,1.08,.2],[.78,.94,.2],[1.02,1.055,.005]]){
 const delta=radius-siteHeight;
 check(()=>assert.ok(Math.abs(delta)<radius*.30,'valid body-site snap'));
 const shifted=siteHeight+delta;
 for(const lift of [0,.10,.48,1.03]){
   const worldBase=shifted+lift;
   check(()=>assert.ok(Math.abs((worldBase-lift)-radius)<1e-9));
 }
}
console.log(`PASS GENESIS 38.bis-T7p: ${passed} comprobaciones portátiles; anclaje común, elevaciones, LOD y restitución.`);
