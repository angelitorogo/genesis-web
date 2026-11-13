'use strict';
/** Auditoría determinista portable: no requiere contexto gráfico ni acceso a IndexedDB. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const ts=require('typescript');
const base=path.join(process.cwd(),'src/app/presentation/life-species-visual');
const files=[
  'vida38-civilized-humanoid-plan-38-2r.ts','vida38-civilized-humanoid-preview-38-2r.ts',
  'vida38-civilized-humanoid-fixtures-38-2r.ts','vida38-civilized-humanoid-gallery-38-2r.component.ts',
  'vida38-reptilian-gallery-laboratory-38-2oe5b.component.ts','vida38-civilized-humanoid-38-2r.spec.ts',
];
for(const name of files){const filepath=path.join(base,name);assert(fs.existsSync(filepath),`Falta ${name}`);
 const result=ts.transpileModule(fs.readFileSync(filepath,'utf8'),{fileName:filepath,reportDiagnostics:true,
  compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
 assert.equal(result.diagnostics?.length??0,0,`Fallo de sintaxis ${name}`);
}
const planFile=fs.readFileSync(path.join(base,files[0]),'utf8');
assert(!planFile.includes('Math.random('),'CT-0 no permite Math.random');
const lab=fs.readFileSync(path.join(base,files[4]),'utf8');
assert(lab.includes("setLineage('HUMANOID')"),'No aparece la entrada Humanoides muy avanzados');
assert(lab.includes('app-vida38-civilized-insectoid-gallery-38q'),'Falta la galería insectoide');
assert(lab.includes('app-vida38-reptilian-gallery-38-2oe5'),'Falta la galería reptiliana');
const runtime=new Map();
function load(name){
 if(name==='vida38-species-visual-contract')return {VIDA38_SPECIES_VISUAL_REVISION:'VIDA.38.1'};
 if(runtime.has(name))return runtime.get(name);
 const file=path.join(base,name+'.ts'),code=ts.transpileModule(fs.readFileSync(file,'utf8'),
  {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 const module={exports:{}};runtime.set(name,module.exports);
 vm.runInNewContext(code,{module,exports:module.exports,require(ref){return load(ref.slice(2));},Object,Math,Set,Map,Array,Error,console},{filename:file});
 return module.exports;
}
const {buildVida38HumanoidGallery38R}=load('vida38-civilized-humanoid-fixtures-38-2r');
const {deriveVida38CivilHumanoidPlan38R}=load('vida38-civilized-humanoid-plan-38-2r');
for(const count of [12,24]){
 const entries=buildVida38HumanoidGallery38R(count);
 assert.equal(entries.length,count);const unique=key=>new Set(entries.map(e=>e.plan[key])).size;
 assert.equal(unique('archetype'),10);assert.equal(unique('garment'),10);assert.equal(unique('culture'),6);
 assert.equal(unique('signature'),count);console.log(`GENESIS_38_2R_GALLERY_${count}_OK: 10 anatomías, 10 vestimentas, 6 culturas`);
}
const gallery=buildVida38HumanoidGallery38R(24);
let checked=0;const signatures=new Set();
for(let i=1;i<=4096;i++){
 const sample=gallery[i%gallery.length].contract;
 const synthetic={...sample,speciesId:`VIDA38R_AUDIT_${i}`,appearanceFingerprint:`CT0_${i}`,variantSeedUint32:i};
 const a=deriveVida38CivilHumanoidPlan38R(synthetic),b=deriveVida38CivilHumanoidPlan38R(synthetic);
 assert.equal(a.signature,b.signature);signatures.add(a.signature);checked++;
}
assert(signatures.size>4000,`Diversidad sintética insuficiente: ${signatures.size}`);
const integrator=require('./integrar-genesis-38-2r-humanoides-civilizados.cjs');
const source=`import * as THREE from 'three';\nfunction f(){switch(descriptor.family){case 'BIPED_BODY': createBiped(subject, contract, rng, options.humanoidQuality ?? 'HIGH'); break;}}`;
const patched=integrator.patchScene(source);
assert(patched.includes('isVida38VeryAdvancedHumanoid38R(contract)'));
assert.equal(integrator.patchScene(patched),patched);
console.log(`GENESIS_38_2R_AUDIT_OK: ${checked} identidades, ${signatures.size} firmas, integración idempotente`);
