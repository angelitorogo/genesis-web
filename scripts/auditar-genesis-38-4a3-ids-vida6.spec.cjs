'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {inspect}=require('./auditar-genesis-38-4a3-ids-vida6.cjs');
function fixture(code){const root=fs.mkdtempSync(path.join(os.tmpdir(),'vida38-4a3-'));const target=path.join(root,'src/app/simulation/life');fs.mkdirSync(target,{recursive:true});fs.writeFileSync(path.join(target,'vida6-generator.ts'),code);return root;}
test('el auditor encuentra candidatos VIDA.6 sin inventar conformidad',()=>{const root=fixture("const speciesId = hash(species.id);\n");try{const result=inspect(root);assert.equal(result.vida6Candidates.length,1);assert.equal(result.verdict,'REQUIERE_VALIDACION_GENERADOR');}finally{fs.rmSync(root,{recursive:true,force:true});}});
test('detecta dependencias espaciales potenciales, no las certifica como defectos',()=>{const root=fixture("const speciesId = hash(planetIndex + species.id);\n");try{const result=inspect(root);assert.ok(result.spatialCandidateCount>=1);assert.equal(result.verdict,'REQUIERE_VALIDACION_GENERADOR');}finally{fs.rmSync(root,{recursive:true,force:true});}});
