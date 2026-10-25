'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const os=require('node:os'),path=require('node:path');const {execFileSync}=require('node:child_process');
const script=path.resolve(__dirname,'auditar-genesis-pre33-03a3-fisica.cjs');
const seed='7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5';
function run(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'genesis-pre33h2o-'));
 try {execFileSync(process.execPath,[script,`--seed=${seed}`,'--galaxies=0','--systems-per-galaxy=3',`--out=${dir}`,'--strict'],{
   env:{...process.env},stdio:'pipe',timeout:120000});
 return fs.readFileSync(path.join(dir,'pre33-03a3-fisica.json'),'utf8');
 }finally{fs.rmSync(dir,{force:true,recursive:true});}}
test('forward formation: V3 generates chemistry source without claiming ocean evidence',()=>{
 const a=JSON.parse(run());assert.equal(a.verdict,'FORWARD_CHEMISTRY_AUDITED_CT0_CERTIFICATION_UNRESOLVED');
 assert.equal(a.galaxies[0].systems,3);assert.equal(a.galaxies[0].issues.length,0);
 assert.equal(a.galaxies[0].forwardFormed+a.galaxies[0].noFormationSource,a.galaxies[0].planets);
 assert.equal(a.galaxies[0].ct0Certified,0);
});
test('V3 forward chemistry audit is repeatable by seed',()=>{assert.equal(run(),run());});
