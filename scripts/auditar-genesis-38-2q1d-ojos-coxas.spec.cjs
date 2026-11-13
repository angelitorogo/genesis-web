'use strict';
/** GENESIS 38.2q1d · auditoría CT-0 sin WebGL. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const ts = require('typescript');

const root = process.cwd();
const base = path.join(root,'src/app/presentation/life-species-visual');
const files = [
  'vida38-civilized-insectoid-preview-38-2q.ts',
  'vida38-civilized-insectoid-ocular-coxal-38-2q1d.ts',
  'vida38-civilized-insectoid-38-2q1d.spec.ts',
];
for (const name of files) {
  const full = path.join(base,name);
  assert(fs.existsSync(full),`Falta ${full}`);
  const result = ts.transpileModule(fs.readFileSync(full,'utf8'),{
    fileName:full,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  });
  assert.equal(result.diagnostics?.length??0,0,`Sintaxis TS inválida en ${name}`);
}
const eyeSource=fs.readFileSync(path.join(base,files[0]),'utf8');
const coxaSource=fs.readFileSync(path.join(base,files[1]),'utf8');
for(const token of [
  'deriveVida38InsectoidDarkEyePlan38Q1D(plan)',
  'buildVida38InsectoidPelvis38Q1D(plan,quality)',
  'buildVida38InsectoidCoxalScute38Q1D(plan,side,quality)',
  'deriveVida38InsectoidCoxalFrame38Q1D(plan,side)',
  "'vida38InsectoidOcularCoxalRevision38Q1D'",
]) assert(eyeSource.includes(token),`Integración incompleta: ${token}`);
for(const token of [
  'VIDA38_INSECTOID_DARK_EYE_PALETTE_38Q1D',
  'buildVida38InsectoidPelvis38Q1D',
  'deriveVida38InsectoidCoxalFrame38Q1D',
  'buildVida38InsectoidCoxalScute38Q1D',
]) assert(coxaSource.includes(token),`Anatomía incompleta: ${token}`);
assert(!/Math\.random\s*\(/.test(eyeSource+coxaSource),'La variación no debe usar Math.random');
assert(!/new\s+THREE\.BoxGeometry\s*\(/.test(coxaSource),'Evitar bloques geométricos pegados en las caderas');

class MockVec {
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
}
class MockColor {
  constructor(hex='#000000'){
    const source=String(hex).replace('#','').padStart(6,'0');
    this.r=parseInt(source.slice(0,2),16)/255;
    this.g=parseInt(source.slice(2,4),16)/255;
    this.b=parseInt(source.slice(4,6),16)/255;
  }
  clone(){const c=new MockColor();c.r=this.r;c.g=this.g;c.b=this.b;return c;}
  lerp(that,alpha){this.r+=(that.r-this.r)*alpha;this.g+=(that.g-this.g)*alpha;this.b+=(that.b-this.b)*alpha;return this;}
  getStyle(){return `rgb(${Math.round(this.r*255)},${Math.round(this.g*255)},${Math.round(this.b*255)})`;}
}
const mockThree={Color:MockColor,Vector3:MockVec};
const cache=new Map();
function load(name){
  if(cache.has(name))return cache.get(name);
  if(name==='vida38-species-visual-contract.ts')return {VIDA38_SPECIES_VISUAL_REVISION:'AUDIT_ONLY'};
  // Esta auditoría solo ejecuta planes puros. Las mallas 38.2q1b se validan
  // con sus pruebas visual-estructurales en Angular; no necesitan Three aquí.
  if(name==='vida38-civilized-insectoid-organic-anatomy-38-2q1b.ts')return {};
  const module={exports:{}};
  cache.set(name,module.exports);
  const full=path.join(base,name);
  const js=ts.transpileModule(fs.readFileSync(full,'utf8'),{
    fileName:full,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},
  }).outputText;
  vm.runInNewContext(js,{
    module,exports:module.exports,
    require(id){
      if(id==='three')return mockThree;
      if(id.startsWith('./'))return load(id.slice(2)+'.ts');
      throw new Error(`Módulo no admitido: ${id}`);
    },Math,Object,Set,Map,console,
  },{filename:name});
  return module.exports;
}
const renderer=load(files[0]);
const details=load(files[1]);
const fixtures=load('vida38-civilized-insectoid-fixtures-38-2q.ts');
const gallery=fixtures.buildVida38InsectoidGallery38Q(24);
assert.equal(gallery.length,24);
const colors=new Set(), frames=new Set();
let total=0,embedded=0,minimum=Infinity;
const contracts=gallery.map(entry=>entry.contract);
for(let i=1;i<=4096;i++)contracts.push({
  speciesId:`38Q1D-AUDIT-${i}`,appearanceFingerprint:`38Q1D-VISUAL-${i}`,variantSeedUint32:i,
  morphology:{group:'INSECTS',appendagePairs:i%8===0?4:3,bodyPlan:i%5===0?'WINGED':'TETRAPOD'},
  intelligence:{lineage:'INSECTOID',civilizationLevel:'VERY_ADVANCED'},
  locomotion:i%7===0?'FLYING':'WALKING',
  pigmentation:{primaryColorHex:'#61887d',secondaryColorHex:'#9cb9aa'},
});
const allowed=new Set(Array.from(details.VIDA38_INSECTOID_DARK_EYE_PALETTE_38Q1D));
assert(allowed.size===4,'La paleta debe tener cuatro tonos oscuros');
for(const contract of contracts){
  const p=renderer.deriveVida38CivilizedInsectoidPlan38Q(contract);
  const e=details.deriveVida38InsectoidDarkEyePlan38Q1D(p);
  const repeat=details.deriveVida38InsectoidDarkEyePlan38Q1D(renderer.deriveVida38CivilizedInsectoidPlan38Q(contract));
  assert.equal(e.signature,repeat.signature,'Ojo no determinista');
  assert(allowed.has(e.baseHex),`Paleta ocular no autorizada: ${e.baseHex}`);
  assert(e.roughness>=.4&&e.roughness<=.53);
  colors.add(e.baseHex);
  for(const side of [-1,1]){
    const f=details.deriveVida38InsectoidCoxalFrame38Q1D(p,side);
    assert(f.embedDepth>.045,`Coxa insuficientemente embebida: ${p.speciesId}, ${side}, ${f.embedDepth}`);
    assert(f.embedDepth<.17,`Coxa demasiado hundida: ${p.speciesId}, ${side}, ${f.embedDepth}`);
    assert(Math.abs(f.inside.x)<f.pelvisSurfaceX,'Coxa fuera de la piel pélvica');
    assert(Math.abs(f.exit.x)>Math.abs(f.inside.x),'La pierna no emerge de la pelvis');
    assert(f.exit.y<f.inside.y,'Orientación vertical coxal incorrecta');
    minimum=Math.min(minimum,f.embedDepth);
    frames.add(side);
    embedded++;
  }
  total++;
}
assert(colors.size>=4,'La diversidad ocular oscura debe abarcar los cuatro tonos');
assert.equal(frames.size,2);
assert.equal(embedded,total*2);
console.log(`GENESIS_38_2Q1D_AUDIT_OK: ${total} identidades, ${embedded} coxas embebidas, 4 tonos oscuros; penetración mínima ${minimum.toFixed(4)} m`);
