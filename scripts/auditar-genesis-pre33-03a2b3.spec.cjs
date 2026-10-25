'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parse}=require('./auditar-genesis-pre33-03a2b3.cjs');
test('requires an explicit valid seed',()=>assert.throws(()=>parse([]),/inválidos/));
test('rejects unsupported options',()=>assert.throws(()=>parse(['--seed=7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5','--delete-saved-data']),/Opción/));
test('preserves the three galaxy audit sampling scope',()=>{
 const a=parse(['--seed=7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5','--galaxies=0,1,2','--systems-per-galaxy=20','--strict']);
 assert.deepEqual(a.galaxies,[0,1,2]);assert.equal(a.systems,20);assert.equal(a.strict,true);
});
