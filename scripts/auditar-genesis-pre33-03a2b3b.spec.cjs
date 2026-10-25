'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {parse}=require('./auditar-genesis-pre33-03a2b3b.cjs');
test('requires one exact seed and explicit galaxy list',()=>{
 const p=parse(['--seed=7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5','--galaxies=0,1,2','--systems-per-galaxy=20','--out=pre33-audit','--strict']);
 assert.deepEqual(p.galaxies,[0,1,2]);assert.equal(p.systems,20);assert.equal(p.strict,true);
});
test('rejects incomplete/invalid physical address inputs',()=>{
 assert.throws(()=>parse(['--seed=invalid']));
});
