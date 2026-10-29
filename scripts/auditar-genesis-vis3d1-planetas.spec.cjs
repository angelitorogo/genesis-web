const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const refinedPath = path.join(root, 'src/app/presentation/system/system-scene-planet-texture-refinement.ts');
const js = ts.transpileModule(readFileSync(refinedPath, 'utf8'), {
  compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS},
}).outputText;
const moduleFacade = {exports: {}};
new Function('module', 'exports', js)(moduleFacade, moduleFacade.exports);
const {refinePlanetRgbaTextureV1: refine, PLANET_TEXTURE_DETAIL_SIZES_V1: dimensions} = moduleFacade.exports;
const input = new Uint8Array(256 * 128 * 4);
for (let y=0; y<128; y++) for(let x=0;x<256;x++) {
 const i=(y*256+x)*4;
 input[i] = x<120?24:170; input[i+1]= y<64?67:185;
 input[i+2]= 117;input[i+3]=255;
}

test('VIS-3D.1: niveles 256 / 512 / 1024', () => {
 assert.deepEqual(dimensions.distant,{width:256,height:128});
 assert.deepEqual(dimensions.closeSystem,{width:512,height:256});
 assert.deepEqual(dimensions.scientificPreview,{width:1024,height:512});
});
test('VIS-3D.1: color 1024x512, determinismo y sin mutar atlas original',()=>{
 const before=Buffer.from(input);
 const a=refine(input,256,128,1024,0x12345678,'COLOR');
 const b=refine(input,256,128,1024,0x12345678,'COLOR');
 assert.equal(a.length,1024*512*4);
 assert.deepEqual(a,b);
 assert.deepEqual(Buffer.from(input),before);
});
test('VIS-3D.1: costura sin discontinuidades en superficies y gigantes',()=>{
 for(const kind of ['COLOR','GAS','DATA','CLOUD','EMISSION']) {
  const a=refine(input,256,128,512,1234,kind);
  for(let y=0;y<256;y++){
   const left=y*512*4,right=left+511*4;
   assert.deepEqual(a.subarray(left,left+4),a.subarray(right,right+4));
  }
 }
});
test('VIS-3D.1: un mapa opaco vacío no crea señales ni emisiones',()=>{
 const empty=new Uint8Array(input.length);
 for(const mode of ['CLOUD','EMISSION','DATA']) {
  const a=refine(empty,256,128,1024,999,mode);
  assert.equal(a.some(v=>v!==0),false);
 }
});
test('VIS-3D.1: el límite impide 4K y buffers inválidos',()=>{
 assert.throws(()=>refine(input,256,128,4096,1,'COLOR'), RangeError);
 assert.throws(()=>refine(input.subarray(0,4),256,128,512,1,'COLOR'), RangeError);
});
test('VIS-3D.1: integración compartida con vista científica y zoom, sin atlas masivo para todos',()=>{
 const sys = readFileSync(path.join(root,'src/app/presentation/system/system-scene.ts'),'utf8');
 const preview = readFileSync(path.join(root,'src/app/presentation/scientific-body-preview/scientific-body-preview.ts'),'utf8');
 assert.match(sys,/PLANET_TEXTURE_DETAIL_SIZES_V1\.closeSystem\.width/);
 assert.match(sys,/closestPlanet/);
 assert.match(sys,/this\.releaseDetailedPlanetTexture\(\)/);
 assert.match(sys,/planetTextureCache/);
 assert.match(preview,/1024, \/\/ VIS-3D\.1/);
});
