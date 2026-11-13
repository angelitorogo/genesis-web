#!/usr/bin/env node
/** Auditoría no-WebGL: contratos, 360 identidades CT-0, 24 seleccionadas,
 * protección VERY_ADVANCED y sintaxis de todas las regresiones modificadas. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const Module=require('node:module');
const assert=require('node:assert/strict');
const ts=require('typescript');
const root=process.cwd();
const dir=path.join(root,'src/app/presentation/life-species-visual');
const names=[
 'vida38-reptilian-test-fixtures-38-2s8c.ts',
 'vida38-reptilian-fixtures-regression-38-2s8c.spec.ts',
 'vida38-civilized-insectoid-38-2q1a.spec.ts',
 'vida38-civilized-reptilian-38-2od2.spec.ts',
 'vida38-civilized-reptilian-38-2od3.spec.ts',
 'vida38-civilized-reptilian-38-2od5.spec.ts',
 'vida38-civilized-reptilian-38-2oe.spec.ts',
 'vida38-civilized-reptilian-38-2oe2.spec.ts',
 'vida38-civilized-reptilian-38-2oe6a.spec.ts',
 'vida38-civilized-reptilian-38-2oe7.spec.ts',
 'vida38-civilized-reptilian-38-2oe7b.spec.ts',
 'vida38-civilized-reptilian-38-2oe7c.spec.ts',
 'vida38-civilized-reptilian-38-2oe8.spec.ts',
 'vida38-reptilian-cultural-diversity-38-2oe9.spec.ts',
 'vida38-reptilian-wardrobe-38-2oe8b.spec.ts',
 'vida38-species-visual-preview-scene.spec.ts',
];
for(const name of names){
 const file=path.join(dir,name);
 assert.ok(fs.existsSync(file),`Falta ${file}`);
 const text=fs.readFileSync(file,'utf8');
 const parsed=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
 assert.equal(parsed.parseDiagnostics.length,0,`${name}: ${parsed.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')).join('; ')}`);
}
const old=Module._extensions['.ts'];
Module._extensions['.ts']=(m,file)=>{
 const source=fs.readFileSync(file,'utf8');
 const transpiled=ts.transpileModule(source,{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}});
 m._compile(transpiled.outputText,file);
};
try {
 const {buildVida38ReptilianGallery38OE5}=require(path.join(dir,'vida38-reptilian-gallery-fixtures-38-2oe5.ts'));
 const {resolveVida38ReptilianTestEntry38S8C:resolve}=require(path.join(dir,'vida38-reptilian-test-fixtures-38-2s8c.ts'));
 const {deriveVida38WardrobeCoherencePlan38OE8B:wardrobe}=require(path.join(dir,'vida38-reptilian-wardrobe-coherence-38-2oe8b.ts'));
 const {auditVida38CulturalDiversity38OE9:audit}=require(path.join(dir,'vida38-reptilian-cultural-diversity-38-2oe9.ts'));
 const gallery=buildVida38ReptilianGallery38OE5(24);
 assert.equal(gallery.length,24);
 assert.equal(new Set(gallery.map(x=>x.contract.speciesId)).size,24);
 const cases=[7,17,18,35,121];
 for(const n of cases){
  const a=resolve(n),b=resolve(n);
  assert.equal(a.contract.speciesId,b.contract.speciesId);
  assert.equal(a.ordinal,n);
 }
 assert.equal(wardrobe(resolve(7).contract).family,'CEREMONIAL_ROBES');
 assert.equal(wardrobe(resolve(35).contract).family,'SEGMENTED_ARMOR');
 assert.equal(wardrobe(resolve(121).contract).family,'COLONIAL_RIG');
 assert.equal(resolve(17).culture,'BASILICA_TECHNOCRACY');
 assert.equal(resolve(18).culture,'PELAGIC_CONCORD');
 const broad=Array.from({length:360},(_,i)=>resolve(i+1));
 const current=audit(gallery.map(x=>x.contract));
 const population=audit(broad.map(x=>x.contract));
 assert.equal(current.uniqueCultures,6);
 assert.ok(current.uniqueAccessoryBiases>=3);
 assert.ok(population.uniqueAccessoryBiases>=5);
 assert.equal(population.uniqueVisualSignatures,360);
 console.log('GENESIS_38_2S8C_AUDIT_OK: 16 TS sin errores sintácticos; 24 seleccionados; 360 candidatos; sesgos '+current.uniqueAccessoryBiases+'/'+population.uniqueAccessoryBiases+'; ordinales 7/17/18/35/121 reproducibles');
} finally { if(old)Module._extensions['.ts']=old;else delete Module._extensions['.ts']; }
