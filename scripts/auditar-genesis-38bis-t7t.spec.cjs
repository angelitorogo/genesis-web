/** GENESIS 38.bis-T7t — auditoría portable de círculos de colonias. */
'use strict';
const fs=require('node:fs');const path=require('node:path');
const assert=require('node:assert/strict');const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const scene=read('src/app/presentation/system/system-scene.ts');
const infra=read('src/app/presentation/infrastructure/vida38-infrastructure-render-38-6.ts');
const pure=read('src/app/presentation/system/system-scene-colony-sites-t7t.ts');
const spec=read('src/app/presentation/system/system-scene-colony-sites-t7t.spec.ts');
let count=0; const check=(fn)=>{fn();count++;};
for(const [name,src] of [['scene',scene],['infrastructure',infra],['helper',pure],['spec',spec]]){
  const result=ts.transpileModule(src,{reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
  check(()=>assert.equal((result.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0,name));
}
const sandboxModule={exports:{}};
const compiled=ts.transpileModule(pure,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
new Function('module','exports',compiled)(sandboxModule,sandboxModule.exports);
const p=sandboxModule.exports.systemSceneColonySiteMarkerPresentationT7t;
const diameter=sandboxModule.exports.systemSceneColonySiteMarkerWorldDiameterT7t;
for(const [enabled,layer,pixels,facing,expected] of [
  [false,true,400,.9,false],[true,false,400,.9,false],[true,true,400,-.8,false],
  [true,true,400,0,false],[true,true,40,.8,false],[true,true,400,.8,true],
  [true,true,100,.8,true],
])check(()=>assert.equal(p(enabled,layer,pixels,facing).visible,expected));
for(const px of [90,180,400,4000]){
  check(()=>assert.ok(p(true,true,px,.5).diameterPixels>=12));
  check(()=>assert.ok(p(true,true,px,.5).diameterPixels<=25));
}
check(()=>assert.equal(diameter(20,5,38,0,1),0));
check(()=>assert.ok(diameter(20,5,38,900,1)>0));
check(()=>assert.ok(diameter(20,5,38,900,1)<=.28));
for(const text of [
  'readonly colonialSiteAnchorsT7t?',
  'colonialSiteAnchorsT7t.push(Object.freeze({',
  'site:siteHigh',
  'colonialSiteAnchorsT7t:Object.freeze(colonialSiteAnchorsT7t)',
])check(()=>assert.ok(infra.includes(text),text));
for(const text of [
  'addColonySiteMarkersT7t(spinPivot,infra,planet.radiusScene',
  "addColonySiteMarkersT7t(spinPivot,infra,radius,'moon')",
  'this.updateColonySiteMarkersT7t();',
  'this.layerVisibility.colonies',
  'anchor.getWorldPosition(this.colonySiteWorldT7t)',
  'marker.visible=presentation.visible',
  'depthTest:true,depthWrite:false',
  'marker.raycast=()=>{}',
  'this.colonySiteMarkerBindingsT7t.length=0',
  "color:0x33ff7a",
])check(()=>assert.ok(scene.includes(text),text));
check(()=>assert.ok(infra.includes('if(!showColonyLocationRingsT7n){')));
console.log(`PASS GENESIS 38.bis-T7t: ${count} comprobaciones portátiles.`);
