'use strict';
/** Auditoría Node portable: sintaxis, integración y 4096 identidades sin WebGL. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = process.cwd();
const tsPath = path.join(root,'src/app/presentation/life-species-visual/vida38-reptilian-technical-garments-38-2oe8.ts');
const rendererPath = path.join(root,'src/app/presentation/life-species-visual/vida38-civilized-reptilian-preview-38-2o.ts');
const source=fs.readFileSync(tsPath,'utf8');
const renderer=fs.readFileSync(rendererPath,'utf8');
const compiled=ts.transpileModule(source,{fileName:tsPath,reportDiagnostics:true,
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
assert.equal(compiled.diagnostics?.length ?? 0,0,'El módulo 38.2o.e8 debe tener sintaxis TypeScript válida');
const sandboxModule={exports:{}};
vm.runInNewContext(compiled.outputText,{module:sandboxModule,exports:sandboxModule.exports,
  require:id=> {if(id==='three')return {};throw new Error(`Módulo inesperado: ${id}`);},Math,Object,Set,Map},
  {filename:'vida38-reptilian-technical-garments-38-2oe8.compiled.js'});
const {deriveVida38TechArmorPlan38OE8}=sandboxModule.exports;
assert.equal(typeof deriveVida38TechArmorPlan38OE8,'function');
const materials=new Set(),silhouettes=new Set(),signatures=new Set(),families=new Set();
const cultures=['STAR_KINGDOM','BASILICA_TECHNOCRACY','FRONTIER_HEGEMONY','PELAGIC_CONCORD','DUNE_MANDATE','OBSIDIAN_CLAN'];
for(let i=0;i<4096;i++){
  const family=i%2===0?'SEGMENTED_ARMOR':'COLONIAL_RIG';
  const culture=cultures[Math.floor(i/2)%cultures.length];
  const args={speciesId:`OE8-LAB-${i}`,appearanceFingerprint:`oe8:${i}`,family,
    garmentLine:family==='SEGMENTED_ARMOR'?'MILITARY':'INDUSTRIAL_COLONIZER',culture};
  const a=deriveVida38TechArmorPlan38OE8(args);
  const b=deriveVida38TechArmorPlan38OE8(args);
  assert.equal(JSON.stringify(a),JSON.stringify(b),'Identidad no determinista');
  materials.add(a.materialKind);silhouettes.add(a.silhouette);families.add(a.family);
  assert(a.plateCount>=2 && a.plateCount<=4);
  assert(a.shellThickness>0 && a.shellThickness<.05);
  assert(!signatures.has(a.signature),'Colisión exacta de plan en esta muestra de auditoría');
  signatures.add(a.signature);
}
for(const token of [
  "case 'SEGMENTED_ARMOR':", "case 'COLONIAL_RIG':", 'addAdvancedTechnicalArmor38OE8',
  'createVida38ReptilianTechnicalGarments38OE8', 'vida38TechnicalGarmentRevision38OE8',
  'addOrganicSoftGarments38OE7B', 'addVeryAdvancedSuit38OD5',
])assert(renderer.includes(token),`Falta integración/regresión: ${token}`);
for(const token of ['conformalLayer38OE8','curvedPlate38OE8','shoulderCap38OE8',
  'ANATOMICAL_CURVED_PLATE','CONFORMAL_BRACERS_GREAVES_BOOTS',
  'CUIRASS','BACKPLATE','UTILITY_VEST','HARNESS_LEFT','HARNESS_RIGHT'])
  assert(source.includes(token),`Falta elemento geométrico: ${token}`);
assert(!/new\s+THREE\.BoxGeometry\s*\(/.test(source),'Las protecciones e8 no deben utilizar cajas');
assert.equal(materials.size,3);
assert.equal(silhouettes.size,4);
assert.equal(families.size,2);
console.log(`GENESIS_38_2OE8_AUDIT_OK: ${signatures.size} identidades únicas, ${materials.size} materiales, ${silhouettes.size} siluetas, ${families.size} familias; renderer e7c conservado`);
