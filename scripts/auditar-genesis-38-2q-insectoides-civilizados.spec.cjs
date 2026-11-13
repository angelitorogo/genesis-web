'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const ts=require('typescript');
const root=process.cwd();
const base='src/app/presentation/life-species-visual/';
const paths=[
  'vida38-civilized-insectoid-preview-38-2q.ts',
  'vida38-civilized-insectoid-fixtures-38-2q.ts',
  'vida38-civilized-insectoid-gallery-38-2q.component.ts',
  'vida38-reptilian-gallery-laboratory-38-2oe5b.component.ts',
  'vida38-civilized-insectoid-38-2q.spec.ts',
];
for(const name of paths){
  const file=path.join(root,base,name),src=fs.readFileSync(file,'utf8');
  const out=ts.transpileModule(src,{fileName:file,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
  assert.equal(out.diagnostics?.length??0,0,`Transpile TS inválido: ${name}`);
}
const modulePath=path.join(root,base,paths[0]);
const out=ts.transpileModule(fs.readFileSync(modulePath,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
const sandbox={exports:{}};
vm.runInNewContext(out.outputText,{module:sandbox,exports:sandbox.exports,require:id=>{if(id==='three')return {};throw Error(id);},Math,Object,Set,Map,console});
const is=sandbox.exports.isVida38VeryAdvancedInsectoid38Q;
const derive=sandbox.exports.deriveVida38CivilizedInsectoidPlan38Q;
assert.equal(typeof derive,'function');
const cultures=new Set(),roles=new Set(),archetypes=new Set(),wardrobes=new Set(),signatures=new Set(),accessories=new Set();
for(let k=1;k<=4096;k++){
  const contract={speciesId:`GENESIS-38Q-AUDIT-${k}`,appearanceFingerprint:`AUDIT:${k}`,variantSeedUint32:k,
    morphology:{group:'INSECTS',appendagePairs:k%6===0?4:3,bodyPlan:'TETRAPOD'},
    intelligence:{lineage:'INSECTOID',civilizationLevel:'VERY_ADVANCED'},pigmentation:{primaryColorHex:'#608c82',secondaryColorHex:'#9bb2a1'},
    locomotion:'WALKING'};
  assert(is(contract));
  const p=derive(contract),q=derive(contract);
  assert.equal(p.signature,q.signature);
  assert.equal(p.armCount,(contract.morphology.appendagePairs-1)*2);
  cultures.add(p.culture);roles.add(p.role);archetypes.add(p.archetype);wardrobes.add(p.wardrobe);signatures.add(p.signature);accessories.add(p.accessory);
}
assert.equal(cultures.size,6);assert.equal(roles.size,6);assert.equal(archetypes.size,8);
assert.equal(wardrobes.size,6);assert.equal(signatures.size,4096);assert(accessories.size>=4);
const lab=fs.readFileSync(path.join(root,base,'vida38-reptilian-gallery-laboratory-38-2oe5b.component.ts'),'utf8');
for(const tok of ['Civilizaciones','Insectoides · Muy avanzados','Reptilianos · Muy avanzados','app-vida38-civilized-insectoid-gallery-38q'])assert(lab.includes(tok),tok);
const sceneFile=path.join(root,base,'vida38-species-visual-preview-scene.ts');
const scene=fs.readFileSync(sceneFile,'utf8');
assert(scene.includes('isVida38VeryAdvancedInsectoid38Q(contract)'),'Falta integración del renderer 38q; ejecuta el integrador');
assert(scene.includes('createVida38InsectPreview38K(subject, contract'),'Debe preservarse 38.2k para insectos normales');
console.log(`GENESIS_38_2Q_AUDIT_OK: ${signatures.size} identidades, ${archetypes.size} arquetipos, ${cultures.size} culturas, ${wardrobes.size} familias de ropa`);
