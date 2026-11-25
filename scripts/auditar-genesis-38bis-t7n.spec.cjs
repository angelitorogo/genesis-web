/** Auditoría portable T7n: sin navegador ni escritura científica. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const base='src/app/presentation/';
const scene=read(base+'system/system-scene.ts');
const html=read(base+'system/system-scene.html');
const preview=read(base+'scientific-body-preview/scientific-body-preview.ts');
const previewHtml=read(base+'scientific-body-preview/scientific-body-preview.html');
const infra=read(base+'infrastructure/vida38-infrastructure-render-38-6.ts');
const colonies=read(base+'system/system-scene-colonies-t7n.ts');
const orbit=read(base+'infrastructure/colvis3-colony-orbit-camera-t7n.ts');
const spec=read(base+'system/system-scene-colonies-t7n.spec.ts');
let checks=0;const check=(f)=>{f();checks++;};
for(const source of [scene,preview,infra,colonies,orbit,spec]){
  const out=ts.transpileModule(source,{reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
  check(()=>assert.equal((out.diagnostics??[]).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0));
}
const exportedModule={exports:{}};
new Function('module','exports',ts.transpileModule(colonies,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(exportedModule,exportedModule.exports);
const {systemSceneHasConfirmedColonyT7n:has,systemSceneColonyBodyRingDiameterT7n:diameter}=exportedModule.exports;
const plan={provenance:'VIDA8_COLONIAL_SETTLEMENT',locationStatus:'RECONSTRUCTED_NOT_OBSERVED',colonyArchitectureCOLVIS1:{}};
check(()=>assert.equal(has([plan]),true));
check(()=>assert.equal(has(undefined),false));
check(()=>assert.equal(has([{...plan,provenance:'VIDA7_NATIVE_SETTLEMENT'}]),false));
check(()=>assert.equal(has([{...plan,locationStatus:'UNKNOWN'}]),false));
check(()=>assert.equal(has([{...plan,colonyArchitectureCOLVIS1:null}]),true));
check(()=>assert.equal(diameter(1),3.2));
check(()=>assert.equal(diameter(0),0));
check(()=>assert.equal(diameter(.01),.14));
for(const s of ['system-scene-layer-colonies','toggleColoniesT7n()','COLONIAS · {{ colonialBodiesCountT7n() }}','[attr.aria-pressed]="coloniesVisibleT7n()"'])
  check(()=>assert.ok(html.includes(s),s));
for(const s of ['readonly colonies?: boolean','private readonly coloniesVisibleSignalT7n=signal(false)','...(this.coloniesVisibleSignalT7n()?{colonies:true}:{})','addColonyBodyMarkerT7n(','colonyBodyMarkerBindingsT7n.length=0','systemSceneHasConfirmedColonyT7n(moonInfrastructure)','systemSceneHasConfirmedColonyT7n(planet.visualInfrastructurePlans)'])
  check(()=>assert.ok(scene.includes(s),s));
check(()=>assert.equal((scene.match(/this.addColonyBodyMarkerT7n\(spinPivot/g)||[]).length,2));
check(()=>assert.ok(scene.includes('color:0x33ff7a')));
check(()=>assert.ok(scene.includes('marker.visible=false')));
check(()=>assert.ok(scene.includes('showColonyLocationRingsT7n')===false));
check(()=>assert.ok(scene.includes('},false,false);')));
check(()=>assert.ok(infra.includes('showColonyLocationRingsT7n = true')));
check(()=>assert.ok(infra.includes('hasCOLVIS2 && showColonyLocationRingsT7n')));
check(()=>assert.ok(infra.includes('Math.min(5,lampBudget)')));
for(const s of ['colonyOrbitAzimuthT7n','colonyOrbitElevationT7n','this.updateColonyInspectionCameraCOLVIS2();','this.colonyInspectionIndexCOLVIS2()!==null','camera.position.copy(target)','colvis3ColonyOrbitOffsetT7n(normal,tangent'])
  check(()=>assert.ok(preview.includes(s),s));
check(()=>assert.ok(previewHtml.includes('Arrastra para orbitar alrededor de la colonia')));
check(()=>assert.ok(orbit.includes('outwardNormal.clone().normalize()')));
// Test de cámara ORBITAL real con álgebra vectorial aislada: ninguna luna gira.
class V3 {
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  clone(){return new V3(this.x,this.y,this.z);}
  dot(v){return this.x*v.x+this.y*v.y+this.z*v.z;}
  addScaledVector(v,k){this.x+=v.x*k;this.y+=v.y*k;this.z+=v.z*k;return this;}
  multiplyScalar(k){this.x*=k;this.y*=k;this.z*=k;return this;}
  normalize(){return this.multiplyScalar(1/(Math.hypot(this.x,this.y,this.z)||1));}
  crossVectors(a,b){this.x=a.y*b.z-a.z*b.y;this.y=a.z*b.x-a.x*b.z;this.z=a.x*b.y-a.y*b.x;return this;}
  length(){return Math.hypot(this.x,this.y,this.z);}
}
const orbitModule={exports:{}};
new Function('require','module','exports',ts.transpileModule(orbit,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(
  name=>name==='three'?{Vector3:V3,MathUtils:{clamp:(v,lo,hi)=>Math.min(hi,Math.max(lo,v))}}:assert.fail(name),orbitModule,orbitModule.exports);
const getOffset=orbitModule.exports.colvis3ColonyOrbitOffsetT7n;
const normal=new V3(0,1,0),tangent=new V3(0,0,1);
for(const yaw of [0,.5,1.4,Math.PI,2*Math.PI]){
  const o=getOffset(normal,tangent,yaw,.75,2);
  check(()=>assert.ok(Math.abs(o.length()-2)<1e-8));
  check(()=>assert.ok(o.dot(normal)>0));
}
const before=getOffset(normal,tangent,0,.75,1);
const after=getOffset(normal,tangent,Math.PI/2,.75,1);
check(()=>assert.ok(before.z>.6&&after.x>.6));
check(()=>assert.equal(normal.y,1));
check(()=>assert.equal(tangent.z,1));
check(()=>assert.ok(!previewHtml.includes('Arrastra para orientar · rueda')));
check(()=>assert.ok(!preview.includes('site.site.add(context.mesh')));
console.log(`PASS GENESIS 38.bis-T7n: ${checks} comprobaciones portátiles; cámara orbital, UI, iluminación y marcadores.`);
