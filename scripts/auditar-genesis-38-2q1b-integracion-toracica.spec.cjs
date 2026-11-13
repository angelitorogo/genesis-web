'use strict';
/** Auditoría portable CT-0: sin WebGL ni dependencias de Three/Vitest. */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const ts=require('typescript');
const root=process.cwd();
const dir=path.join(root,'src/app/presentation/life-species-visual');
const names=[
  'vida38-civilized-insectoid-preview-38-2q.ts',
  'vida38-civilized-insectoid-organic-anatomy-38-2q1b.ts',
  'vida38-civilized-insectoid-38-2q1b.spec.ts',
];
for(const name of names){
  const f=path.join(dir,name);
  assert(fs.existsSync(f),`Falta ${name}`);
  const result=ts.transpileModule(fs.readFileSync(f,'utf8'),{
    fileName:f,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},
  });
  assert.equal(result.diagnostics?.length??0,0,`Error al transpilar ${name}`);
}
const anatomyCode=fs.readFileSync(path.join(dir,names[1]),'utf8');
const previewCode=fs.readFileSync(path.join(dir,names[0]),'utf8');
for(const id of [
  'buildSculptedHead','clypealShield','sculptHeadPoint','buildVida38InsectoidHead38Q1B',
  'deriveVida38InsectoidWingRootAnchor38Q1B','buildWingRootPlate','buildVida38InsectoidWings38Q1B',
  'deriveVida38InsectoidStingerBase38Q1B','buildVida38InsectoidStinger38Q1B',
]) assert(anatomyCode.includes(id),`No encuentro implementación geométrica de ${id}`);
for(const id of [
  'buildVida38InsectoidHead38Q1B(plan,quality)',
  'buildVida38InsectoidWings38Q1B(plan,quality)',
  'buildVida38InsectoidStinger38Q1B(plan)',
  'function addLegs(',
  "'vida38CivilInsectoidOrganicRevision38Q1B'",
]) assert(previewCode.includes(id),`El renderer no usa ${id}`);
assert(!anatomyCode.includes('Math.random('),'La anatomía no debe usar aleatoriedad global');
assert(!/new\s+THREE\.BoxGeometry\s*\(/.test(anatomyCode),'No deben añadirse cajas');
const transpile=name=>ts.transpileModule(fs.readFileSync(path.join(dir,name),'utf8'),{
  fileName:name,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText;
class MinimalVector3 {constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}}
const mockThree={Vector3:MinimalVector3};
const cache=new Map();
function loaded(name){
  if(cache.has(name))return cache.get(name);
  if(name==='vida38-species-visual-contract.ts')return {VIDA38_SPECIES_VISUAL_REVISION:'AUDIT-ONLY'};
  const module={exports:{}};
  cache.set(name,module.exports);
  const js=transpile(name);
  vm.runInNewContext(js,{
    module,exports:module.exports,
    require(id){
      if(id==='three')return mockThree;
      if(id.startsWith('./'))return loaded(id.slice(2)+'.ts');
      throw new Error(`Módulo inesperado: ${id}`);
    },
    Math,Object,Set,Map,console,
  },{filename:name});
  return module.exports;
}
const { deriveVida38CivilizedInsectoidPlan38Q }=loaded('vida38-civilized-insectoid-preview-38-2q.ts');
const { deriveVida38InsectoidAnatomicalStyle38Q1B }=loaded('vida38-civilized-insectoid-organic-anatomy-38-2q1b.ts');
const { buildVida38InsectoidGallery38Q }=loaded('vida38-civilized-insectoid-fixtures-38-2q.ts');
const heads=new Set(),wings=new Set(),stingers=new Set(),sig=new Set();
const gallery=buildVida38InsectoidGallery38Q(24);
assert.equal(gallery.length,24);
for(const sample of gallery){
  const p=deriveVida38CivilizedInsectoidPlan38Q(sample.contract);
  const style=deriveVida38InsectoidAnatomicalStyle38Q1B(p);
  const style2=deriveVida38InsectoidAnatomicalStyle38Q1B(deriveVida38CivilizedInsectoidPlan38Q(sample.contract));
  assert.equal(style.signature,style2.signature);
  heads.add(style.head);
  if(p.wingPairs>0)wings.add(style.wing);
  if(p.stinger!=='NONE')stingers.add(style.stinger);
  sig.add(`${p.signature}|${style.signature}`);
}
assert(heads.size>=7,`Cobertura de cabezas insuficiente: ${heads.size}`);
assert(wings.size>=3,`Cobertura de alas insuficiente: ${wings.size}`);
assert(stingers.size>=2,`Cobertura de aguijones insuficiente: ${stingers.size}`);
assert.equal(sig.size,24,'Firmas colisionadas en la galería');
const integrated=gallery.find(entry=>entry.plan.wingPairs>0 && entry.plan.stinger!=='NONE' && entry.plan.extraEyes>0);
assert(integrated,'La galería debe incluir un espécimen con alas, ojos extra y aguijón para la regresión');
console.log(`GENESIS_38_2Q1B_INTEGRATED_SAMPLE: ${integrated.serial}`);
let count=0;
const large=new Set();
for(let i=1;i<=4096;i++){
  const contract={
    speciesId:`Q1B-AUDIT-${i}`,
    appearanceFingerprint:`Q1B-APPEARANCE-${i}`,
    variantSeedUint32:i,
    morphology:{group:'INSECTS',appendagePairs:i%8===0?4:3,bodyPlan:i%5===0?'WINGED':'TETRAPOD'},
    intelligence:{lineage:'INSECTOID',civilizationLevel:'VERY_ADVANCED'},
    locomotion:i%7===0?'FLYING':'WALKING',
    pigmentation:{primaryColorHex:'#61887d',secondaryColorHex:'#9cb9aa'},
  };
  const a=deriveVida38CivilizedInsectoidPlan38Q(contract);
  const b=deriveVida38InsectoidAnatomicalStyle38Q1B(a);
  const again=deriveVida38InsectoidAnatomicalStyle38Q1B(deriveVida38CivilizedInsectoidPlan38Q(contract));
  assert.equal(b.signature,again.signature);
  large.add(`${a.signature}|${b.signature}`);
  count++;
}
assert.equal(large.size,count,'Firmas colisionadas en la auditoría sintética');
console.log(`GENESIS_38_2Q1B_AUDIT_OK: ${count} identidades, ${heads.size} cráneos, ${wings.size} alas, ${stingers.size} aguijones`);
