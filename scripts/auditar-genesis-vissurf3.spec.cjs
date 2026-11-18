'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'src/app/presentation');
const sourceFiles = [
  'system/system-scene.ts',
  'system/system-scene-planet-surface-detail-vissurf2.ts',
  'system/system-scene-planet-structured-geography-vissurf3.ts',
  'system/system-scene-planet-structured-geography-vissurf3.spec.ts',
  'scientific-body-preview/scientific-body-preview.ts',
];
for (const relative of sourceFiles) {
  const file = path.join(sourceRoot, relative);
  const code = fs.readFileSync(file, 'utf8');
  const ast = ts.createSourceFile(relative, code, ts.ScriptTarget.ES2022, true);
  assert.equal(ast.parseDiagnostics.length, 0, `${relative}: sintaxis inválida`);
}
const scene = fs.readFileSync(path.join(sourceRoot, 'system/system-scene.ts'), 'utf8');
const preview = fs.readFileSync(path.join(sourceRoot, 'scientific-body-preview/scientific-body-preview.ts'), 'utf8');
assert.equal((scene.match(/build(?:StructuredSolidPlanetSurfaceVISSURF3|NaturalSolidPlanetSurfaceVISSURF4|CoherentSolidPlanetSurfaceVISSURF5)\(/g) || []).length, 2, 'La escena conserva dos llamadas a un generador de sólidos integrado');
assert.ok(scene.includes('normalTexture?.dispose()'));
assert.ok(scene.includes('previous.material.normalMap = previous.originalNormal'));
assert.ok(scene.includes('materialOptions.normalMap = textureResource.normalTexture'));
assert.ok(scene.includes("'WEATHER_CLOUD'"), 'Las nubes existentes deben conservarse');
assert.ok(preview.includes('createSystemScenePlanetAppearanceV1('), 'La ficha usa el mismo motor compartido');
assert.ok(scene.includes('SOLID_PLANET_DETAIL_WIDTH_VISSURF2.closeSystem'), 'Se conserva el LOD');

// Execute the ORIGINAL TypeScript through a temporary runtime loader: no code
// duplication, test global IndexedDB, Angular, DOM, nor network dependencies.
require.extensions['.ts'] = function (module, filename) {
  const src = fs.readFileSync(filename, 'utf8');
  const converted = ts.transpileModule(src, {fileName:filename, compilerOptions:{
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
  }, reportDiagnostics:true});
  assert.equal(converted.diagnostics?.length ?? 0, 0, `TS: ${filename}`);
  module._compile(converted.outputText, filename);
};
const {buildStructuredSolidPlanetSurfaceVISSURF3: build} = require(
  path.join(sourceRoot, 'system/system-scene-planet-structured-geography-vissurf3.ts'));
const {buildMultiresolutionSolidPlanetSurfaceVISSURF2: v2} = require(
  path.join(sourceRoot, 'system/system-scene-planet-surface-detail-vissurf2.ts'));
const w = 256, h = 128, mask = new Uint8Array(w*h);
const rgba = new Uint8Array(w*h*4), rough = new Uint8Array(rgba.length), relief = new Uint8Array(rgba.length);
const colors = [[], [23,76,166], [216,229,233], [126,111,98], [173,136,93], [73,139,83], [91,79,72]];
for (let y=0;y<h;y++) for(let x=0;x<w-1;x++) {
  const u=x/(w-1), v=y/h;
  const coast=.46+.1*Math.sin(u*6*Math.PI);
  const kind=v<.12||v>.93 ? 2 : v<coast ? 1 : v<.59 ? 5 : v<.71 ? 3 : v<.81 ? 4 : 6;
  mask[y*w+x]=kind;
  rgba.set([...colors[kind],255],(y*w+x)*4);
  rough.set([kind===1?45:155,kind===1?45:155,kind===1?45:155,255],(y*w+x)*4);
  relief.set([kind===1?90:137,kind===1?90:137,kind===1?90:137,255],(y*w+x)*4);
}
for(let y=0;y<h;y++) {
  mask[y*w+w-1]=mask[y*w];
  for(const buffer of [rgba,rough,relief])buffer.set(buffer.subarray(y*w*4,y*w*4+4),(y*w+w-1)*4);
}
const source={width:w,height:h,rgba,roughnessRgba:rough,reliefRgba:relief,surfaceClassMask:mask};
const originalRgba=Buffer.from(rgba), originalMask=Buffer.from(mask);
const base = v2(source,1024,0x52a91873);
let start=performance.now();
const regular=build(source,1024,0x52a91873);
const firstMs=performance.now()-start;
const repeat=build(source,1024,0x52a91873);
assert.deepEqual(regular.rgba, repeat.rgba, 'Determinismo del albedo');
assert.deepEqual(regular.normalRgba, repeat.normalRgba, 'Determinismo de normales');
assert.deepEqual(regular.classMask,base.classMask,'Coberturas exactas');
assert.notDeepEqual(regular.rgba,base.rgba,'Nuevos materiales visibles');
assert.notDeepEqual(regular.reliefRgba,base.reliefRgba,'Relieve geográfico nuevo');
assert.notDeepEqual(regular.roughnessRgba,base.roughnessRgba,'Rugosidad material nueva');
assert.equal(regular.normalRgba.length,1024*512*4);
assert.ok(!Object.hasOwn(regular,'cloudRgba'),'No se modifica el clima ni las nubes');
assert.deepEqual(Buffer.from(rgba),originalRgba);
assert.deepEqual(Buffer.from(mask),originalMask);
let waterNormal=0, nonFlatNormal=0, coast=0;
for(let i=0;i<regular.classMask.length;i++){
  const code=regular.classMask[i], o=i*4;
  if(code===1 && regular.normalRgba[o]===128 && regular.normalRgba[o+1]===128)waterNormal++;
  if(code===3 && Math.abs(regular.normalRgba[o]-128)>5)nonFlatNormal++;
  if(code===1 && regular.rgba[o+1]>base.rgba[o+1]+3)coast++;
}
assert.ok(waterNormal>10000,'Océanos con normal óptica suave');
assert.ok(nonFlatNormal>100,'Terreno con normales procedurales reales');
assert.ok(coast>100,'Litorales distinguidos por profundidad');
for(let y=0;y<512;y++)for (const buffer of [regular.rgba, regular.normalRgba, regular.roughnessRgba, regular.reliefRgba])
  assert.deepEqual(buffer.subarray(y*1024*4,y*1024*4+4),buffer.subarray((y*1024+1023)*4,(y*1024+1024)*4));
start=performance.now();
const high=build(source,2048,0x52a91873);
const highMs=performance.now()-start;
let agree=0,total=0;
for(let y=20;y<490;y+=11)for(let x=12;x<1000;x+=17){
 const xx=Math.round(x/1023*2047),yy=Math.round((y+.5)/512*1024-.5);
 if(regular.classMask[y*1024+x]===high.classMask[yy*2048+xx])agree++;
 total++;
}
assert.ok(agree/total>.94,'Coherencia geomorfológica LOD');
assert.throws(()=>build(source,4096,1),RangeError);
console.log(`VISSURF.3 PASS — áreas D.4d intactas, nuevos materiales, normales, costura, semillas y LOD; 1024: ${Math.round(firstMs)} ms, 2048: ${Math.round(highMs)} ms; concordancia LOD ${Math.round(agree/total*1000)/10}%`);
