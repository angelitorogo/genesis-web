'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const sourcePath = 'src/app/presentation/system/system-scene-planet-surface-detail-vissurf2.ts';
const src = fs.readFileSync(path.join(root, sourcePath), 'utf8');
const compiled = ts.transpileModule(src, {fileName:sourcePath, compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true});
assert.equal(compiled.diagnostics?.length ?? 0, 0, 'TypeScript syntax');
const m = new Module(path.join(root, 'scripts/vissurf2-runtime.cjs'), module);
m.filename = path.join(root, 'scripts/vissurf2-runtime.cjs');
m.paths = module.paths;
m._compile(compiled.outputText, m.filename);
const build = m.exports.buildMultiresolutionSolidPlanetSurfaceVISSURF2;
assert.equal(typeof build, 'function');
const scene = fs.readFileSync(path.join(root,'src/app/presentation/system/system-scene.ts'),'utf8');
const preview = fs.readFileSync(path.join(root,'src/app/presentation/scientific-body-preview/scientific-body-preview.ts'),'utf8');
assert.ok(scene.includes('buildMultiresolutionSolidPlanetSurfaceVISSURF2('));
assert.ok(scene.includes('SOLID_PLANET_DETAIL_WIDTH_VISSURF2.closeSystem'));
assert.ok(preview.includes('SCIENTIFIC_PREVIEW_SOLID_SURFACE_DETAIL_VISSURF2'));
assert.ok(scene.includes("'WEATHER_CLOUD'"), 'unchanged cloud path');
assert.ok(scene.includes('this.detailedPlanetTexture = {'), 'one focused planet LOD binding');
const w=256,h=128, classes=new Uint8Array(w*h),rgba=new Uint8Array(w*h*4),rough=new Uint8Array(w*h*4),relief=new Uint8Array(w*h*4);
for(let y=0;y<h;y++)for(let x=0;x<w;x++){
 const lon=x/(w-1),lat=y/h; const coast=.47+.12*Math.sin(lon*6*Math.PI);
 const kind=lat<.14||lat>.88?2:lat<coast?1:lat<.63?5:lat<.77?4:3;
 classes[y*w+x]=kind;
 const rgb=kind===1?[18,69,157]:kind===2?[219,228,237]:kind===5?[56,122,62]:kind===4?[168,136,91]:[118,112,108];
 rgba.set([...rgb,255],(y*w+x)*4);
 rough.set([kind===1?50:175,kind===1?50:175,kind===1?50:175,255],(y*w+x)*4);
 relief.set([kind===1?96:141,kind===1?96:141,kind===1?96:141,255],(y*w+x)*4);
}
const fixture={width:w,height:h,surfaceClassMask:classes,rgba,roughnessRgba:rough,reliefRgba:relief};
function counts(mask,width,height){const a=new Uint32Array(7);for(let y=0;y<height;y++)for(let x=0;x<width-1;x++)a[mask[y*width+x]]++;return a;}
const original=counts(classes,w,h);
const before=Buffer.from(rgba);
for(const outW of [512,1024,2048]){
 const start=performance.now();const result=build(fixture,outW,0x41a992ed);const result2=build(fixture,outW,0x41a992ed);
 assert.deepEqual(result.rgba,result2.rgba,`determinismo ${outW}`);
 const total=(outW-1)*(outW/2),old=(w-1)*h;
 const got=counts(result.classMask,outW,outW/2);
 for(const code of [1,2,4,5,6])assert.equal(got[code],Math.round(original[code]*total/old),`área clase ${code} en ${outW}`);
 assert.equal(result.width,outW);
 for(let y=0;y<outW/2;y++) {
   const first=y*outW,last=first+outW-1;
   assert.equal(result.classMask[first],result.classMask[last]);
   assert.deepEqual(result.rgba.subarray(first*4,first*4+4),result.rgba.subarray(last*4,last*4+4));
 }
 console.log(`VISSURF.2 ${outW}x${outW/2}: PASS · ${Math.round(performance.now()-start)} ms (2 ejecuciones)`);
}
assert.deepEqual(Buffer.from(rgba),before,'el atlas original no se muta');
console.log('VISSURF.2: PASS — geografía visual multiresolución, coberturas, determinismo, costura y LOD');
