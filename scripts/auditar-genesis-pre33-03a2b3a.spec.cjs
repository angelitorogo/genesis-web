const {test}=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'), os=require('node:os'),cp=require('node:child_process');
const {parse}=require('./auditar-genesis-pre33-03a2b3a.cjs');
test('accepts strict deterministic multigalaxy arguments',()=>{
 const p=parse(['--seed=7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5','--galaxies=0,1,2','--systems-per-galaxy=20','--out=pre33-audit','--strict']);
 assert.deepEqual(p.galaxies,[0,1,2]);assert.equal(p.strict,true);
});
test('fresh-graph auditor produces a structured report with release explicitly blocked',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pre33a2b3a-'));
 try{
  const r=cp.spawnSync(process.execPath,['scripts/auditar-genesis-pre33-03a2b3a.cjs',
   '--seed=7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5', '--galaxies=0',
   '--systems-per-galaxy=1',`--out=${dir}`,'--strict'],{encoding:'utf8',timeout:60000});
  assert.equal(r.status,0,r.stderr+' '+r.stdout);
  const data=JSON.parse(fs.readFileSync(path.join(dir,'pre33-03a2b3a-fresh-coeval.json'),'utf8'));
  assert.equal(data.publicGeneratorV3Released,false);
  assert.equal(data.canonicalNewGameAvailable,false);
  assert.equal(data.legacyDataMutated,false);
  assert.equal(data.galaxies[0].errors.length,0);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
