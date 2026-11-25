/** T7r — auditoría portable de emisión colonial nocturna sin marcadores UI. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const base='src/app/presentation/';
const infra=read(base+'infrastructure/vida38-infrastructure-render-38-6.ts');
const scene=read(base+'system/system-scene.ts');
const helper=read(base+'infrastructure/vida38-colonial-night-visibility-38bis-t7r.ts');
const spec=read(base+'infrastructure/vida38-colonial-night-visibility-38bis-t7r.spec.ts');
let n=0;const check=(fn)=>{fn();n++;};
for(const source of [infra,scene,helper,spec]){
 const out=ts.transpileModule(source,{reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 check(()=>assert.equal(out.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error).length??0,0));
}
const m={exports:{}};
new Function('module','exports',ts.transpileModule(helper,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m,m.exports);
const {colonialNightVisibilityT7r:visibility,colonialNightGlowSceneSizeT7r:size}=m.exports;
for(const bodyDiameter of [2,10,100,600,1500]){
 const night=visibility(0,1,bodyDiameter),day=visibility(1,1,bodyDiameter);
 check(()=>assert.ok(night.opacity>day.opacity));
 check(()=>assert.ok(night.diameterPixels>=2.6&&night.diameterPixels<=7));
 check(()=>assert.ok(size(night.diameterPixels,4,50,900)>0));
 check(()=>assert.equal(visibility(0,-.5,bodyDiameter).opacity,0));
}
for(const exposure of [0,.2,.5,.8,1]){
 const v=visibility(exposure,1,500);
 check(()=>assert.ok(v.opacity>=0&&v.opacity<=1));
}
for(const token of ['colonialNightBeaconsT7r','new THREE.SpriteMaterial','depthTest:true',
 'depthWrite:false','nightGlowTextureT7r()','showColonyLocationRingsT7n',
 'colonialNightVisibilityT7r(exposure,facing,bodyPixels)','getWorldPosition(beaconViewPositionT7r)',
 'sprite.visible=visibility.opacity>.015','sprite.renderOrder=4'])
 check(()=>assert.ok(infra.includes(token),token));
for(const token of ['this.camera,this.viewportHeightPixels','updateColonialNightLighting386c3(','toggleColoniesT7n()'])
 check(()=>assert.ok(scene.includes(token),token));
check(()=>assert.ok(!infra.includes('new THREE.PointLight')));
check(()=>assert.ok(!infra.includes('new THREE.RingGeometry')));
check(()=>assert.ok(helper.includes('frontFacingCos<=0')));
check(()=>assert.ok(helper.includes('bodyDiameterPixels<2')));
console.log(`PASS GENESIS 38.bis-T7r: ${n} comprobaciones portátiles; noche, cara oculta, tamaño en píxeles, sin aros.`);
