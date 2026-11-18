'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const system = path.join(root, 'src/app/presentation/system');
const scene = fs.readFileSync(path.join(system, 'system-scene.ts'), 'utf8');
const preview = fs.readFileSync(path.join(root, 'src/app/presentation/scientific-body-preview/scientific-body-preview.ts'), 'utf8');
const code = fs.readFileSync(path.join(system, 'system-scene-planet-coherent-geography-vissurf5.ts'), 'utf8');
for (const relative of [
  'src/app/presentation/system/system-scene-planet-coherent-geography-vissurf5.ts',
  'src/app/presentation/system/system-scene-planet-coherent-geography-vissurf5.spec.ts',
  'src/app/presentation/system/system-scene.ts',
]) {
  const text = fs.readFileSync(path.join(root, relative), 'utf8');
  const ast = ts.createSourceFile(relative, text, ts.ScriptTarget.ES2022, true);
  assert.equal(ast.parseDiagnostics.length, 0, `Sintaxis inválida: ${relative}`);
}
assert.equal((scene.match(/buildCoherentSolidPlanetSurfaceVISSURF5\(/g) || []).length, 2);
assert.ok(scene.includes('SOLID_PLANET_DETAIL_WIDTH_VISSURF2.closeSystem'), 'LOD de sistema cercano');
assert.ok(scene.includes('textureResource.normalTexture'), 'Mapa normal para superficie');
assert.ok(scene.includes("'WEATHER_CLOUD'"), 'Las nubes siguen en el módulo original');
assert.ok(scene.includes('cloudTexture?.dispose()'));
assert.ok(preview.includes('createSystemScenePlanetAppearanceV1('), 'La ficha comparte la generación');
assert.ok(!code.includes('cloudRgba'), 'El nuevo generador no contiene capas de nubes');
assert.ok(!code.includes('smoothVisualFieldVISSURF5'), 'No se debe aplicar desenfoque general');
require.extensions['.ts'] = (module, filename) => {
  const raw = fs.readFileSync(filename, 'utf8');
  const js = ts.transpileModule(raw, {fileName:filename,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true});
  assert.equal(js.diagnostics?.length || 0, 0, `Transpilación: ${filename}`);
  module._compile(js.outputText, filename);
};
const {buildCoherentSolidPlanetSurfaceVISSURF5: build} = require(path.join(system,'system-scene-planet-coherent-geography-vissurf5.ts'));
const {buildNaturalSolidPlanetSurfaceVISSURF4: build4} = require(path.join(system,'system-scene-planet-natural-geography-vissurf4.ts'));
const {buildStructuredSolidPlanetSurfaceVISSURF3: build3} = require(path.join(system,'system-scene-planet-structured-geography-vissurf3.ts'));
const {buildMultiresolutionSolidPlanetSurfaceVISSURF2: build2} = require(path.join(system,'system-scene-planet-surface-detail-vissurf2.ts'));
const w = 256, h = 128;
const mask=new Uint8Array(w*h),rgba=new Uint8Array(w*h*4),rough=new Uint8Array(rgba.length),relief=new Uint8Array(rgba.length);
const colors=[[],[21,75,168],[215,228,230],[127,117,103],[171,136,89],[64,135,75],[88,78,73]];
for(let y=0;y<h;y++){
  for(let x=0;x<w-1;x++){
    const u=x/(w-1),v=y/h,coast=.42+.1*Math.sin(u*6*Math.PI)+.025*Math.sin(u*17*Math.PI);
    const k=(v<.10||v>.91)?2:v<coast?1:v<.56?5:v<.70?3:v<.80?4:6;
    const offset=4*(y*w+x),r=k===1?50:k===2?110:178,e=k===1?94:128;
    mask[y*w+x]=k;rgba.set([...colors[k],255],offset);rough.set([r,r,r,255],offset);relief.set([e,e,e,255],offset);
  }
  const first=y*w*4,last=(y*w+w-1)*4;mask[y*w+w-1]=mask[y*w];
  for(const map of [rgba,rough,relief])map.set(map.subarray(first,first+4),last);
}
const src={width:w,height:h,rgba,roughnessRgba:rough,reliefRgba:relief,surfaceClassMask:mask};
const original=Buffer.from(rgba), originalMask=Buffer.from(mask);
const seed=872311, base=build2(src,1024,seed), old3=build3(src,1024,seed), old4=build4(src,1024,seed);
const start=performance.now(), newer=build(src,1024,seed),elapsed=performance.now()-start;
const repeat=build(src,1024,seed);
assert.deepEqual(newer.classMask,base.classMask,'Cobertura idéntica a VISSURF.2');
assert.deepEqual(newer.rgba,repeat.rgba,'Albedo determinista');
assert.deepEqual(newer.normalRgba,repeat.normalRgba,'Normales deterministas');
assert.deepEqual(Buffer.from(rgba),original,'Origen intacto');
assert.deepEqual(Buffer.from(mask),originalMask,'Clases científicas intactas');
const avgNorm = (atlas,kind) => {let s=0,n=0;for(let y=4;y<atlas.height-4;y+=3)for(let x=4;x<atlas.width-4;x+=3){const i=y*atlas.width+x;if(atlas.classMask[i]!==kind)continue;const o=i*4;s+=Math.abs(atlas.normalRgba[o]-128)+Math.abs(atlas.normalRgba[o+1]-128);n++;}return s/n;};
const n3=avgNorm(old3,3),n4=avgNorm(old4,3),n5=avgNorm(newer,3);
assert.ok(n5>n4*1.7 && n5<n3*.9,`Relieve no equilibrado: V3 ${n3}, V4 ${n4}, V5 ${n5}`);
let flatSea=0,rockVariation=0;for(let i=0;i<newer.classMask.length;i+=13){const c=newer.classMask[i],o=i*4;if(c===1&&Math.abs(newer.normalRgba[o]-128)<4)flatSea++;if(c===3&&Math.abs(newer.normalRgba[o]-128)>8)rockVariation++;}
assert.ok(flatSea>250,'Mar relativamente suave');
assert.ok(rockVariation>200,'Roca definida');
for(let y=0;y<512;y++)for(const map of [newer.rgba,newer.roughnessRgba,newer.reliefRgba,newer.normalRgba]){
  const a=y*1024*4,b=(y*1024+1023)*4;
  assert.deepEqual(map.subarray(a,a+4),map.subarray(b,b+4),'Costura');
}
const hdStart=performance.now(),hd=build(src,2048,seed),hdElapsed=performance.now()-hdStart;
assert.equal(hd.width,2048);assert.equal(hd.normalRgba.length,2048*1024*4);
let agree=0,total=0;for(let y=20;y<490;y+=13)for(let x=12;x<1000;x+=19){const xx=Math.round(x/1023*2047),yy=Math.round((y+.5)/512*1024-.5);agree+=newer.classMask[y*1024+x]===hd.classMask[yy*2048+xx]?1:0;total++;}
assert.ok(agree/total>.94,'Coherencia LOD');
assert.throws(()=>build(src,4096,1),RangeError);
console.log(`VISSURF.5 PASS — máscaras intactas, relieve V3/V4 equilibrado (${n3.toFixed(1)}/${n4.toFixed(1)}/${n5.toFixed(1)}), determinismo, costura, LOD ${(100*agree/total).toFixed(1)}%; 1024 ${Math.round(elapsed)} ms, 2048 ${Math.round(hdElapsed)} ms`);
