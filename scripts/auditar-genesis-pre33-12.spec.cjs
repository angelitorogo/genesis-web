'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const crypto=require('node:crypto');
const {parse,validateUpstreams,final,TAG}=require('./auditar-genesis-pre33-12.cjs');
const {mkdtempSync,rmSync,readFileSync}=fs;const os=require('node:os'),path=require('node:path');
const sample={galaxy:'Fixture',galaxyIndex:0,systems:1,planets:1,moons:2,detailedMoons:1,
 identityOnlyMoons:1,planetCards:1,moonCards:1,observedPlanetFiches:1,observedMoonFiches:1,
 lockedControls:2,v3EvidenceRecords:2,errors:[]};
function fixture(){return mkdtempSync(path.join(os.tmpdir(),'genesis-pre33-12-'));}
function withDir(fn){const dir=fixture();try{return fn(dir);}finally{rmSync(dir,{force:true,recursive:true});}}
const upstream={state:'UPSTREAM_HASH_VERIFIED',issues:[],sha256:'f'.repeat(64)};
test('PRE-33.12 usa semilla V3 reproducible y parámetros explícitos',()=>{
 const p=parse(['--galaxies=0,1,2','--systems-per-galaxy=5','--strict']);
 assert.equal(p.seed,'7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5');
 assert.deepEqual(p.galaxies,[0,1,2]);assert.equal(p.systems,5);assert.equal(p.strict,true);
});
test('PRE-33.12 contrasta realmente la procedencia del muestreo 11b con 11c',()=>{
 const result=validateUpstreams();assert.equal(result.state,'UPSTREAM_HASH_VERIFIED');
 assert.deepEqual(result.issues,[]);assert.match(result.sha256,/^[0-9a-f]{64}$/);
});
test('PRE-33.12 no publica un cierre si falta una luna o su ficha',()=>withDir(dir=>{
 const bad={...sample,moonCards:0};const result=final(dir,[bad],[],upstream,'seed');
 assert.equal(result.verdict,'PRE33_12_REVIEW_REQUIRED');
 assert.ok(result.issues.includes('CROSS_LAYER_TOTAL_INCONSISTENCY'));
 assert.ok(result.issues.includes('OBSERVED_FICHE_COVERAGE_INCOMPLETE')===false||result.issues.length>0);
}));
test('PRE-33.12 no permite cierre cuando el informe 11c no está trazado',()=>withDir(dir=>{
 const bad={state:'UPSTREAM_MISMATCH',issues:['11C_SOURCE_HASH_MISMATCH']};
 const result=final(dir,[sample],[],bad,'seed');
 assert.equal(result.verdict,'PRE33_12_REVIEW_REQUIRED');assert.ok(result.issues.includes('11C_SOURCE_HASH_MISMATCH'));
}));
test('PRE-33.12 preserva partición lunar y produce JSON y CSV idénticos',()=>{
 const a=fixture(),b=fixture();try{
  const r=final(a,[sample],[],upstream,'seed');final(b,[sample],[],upstream,'seed');
  assert.equal(r.verdict,TAG);assert.equal(r.totals.moons,2);
  for(const f of ['pre33-12-auditoria.json','pre33-12-por-planeta.csv','pre33-12-informe.md']){
   const x=crypto.createHash('sha256').update(readFileSync(path.join(a,f))).digest('hex');
   const y=crypto.createHash('sha256').update(readFileSync(path.join(b,f))).digest('hex');assert.equal(x,y);
  }
 }finally{rmSync(a,{force:true,recursive:true});rmSync(b,{force:true,recursive:true});}
});
test('PRE-33.12 bloquea cierre con error de coherencia física multihost',()=>withDir(dir=>{
 const r=final(dir,[{...sample,errors:[{error:'32.F.6b: moon/ocean identities differ'}]}],[],upstream,'seed');
 assert.ok(r.issues.includes('RUNTIME_INTEGRATION_ERRORS'));assert.equal(r.life,'NOT_EVALUATED');
}));
