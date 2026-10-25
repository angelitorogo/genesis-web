'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {parse}=require('./auditar-genesis-pre33-03a2b2.cjs');
const seed='7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5';
test('seed + sample multi-galaxy and strict mode',()=>{
 const a=parse([`--seed=${seed}`,'--galaxies=0,1,2','--systems-per-galaxy=20','--strict']);
 assert.deepEqual(a.galaxies,[0,1,2]);assert.equal(a.systems,20);assert.equal(a.strict,true);
});
test('rejects bad seed',()=>assert.throws(()=>parse(['--seed=BAD']),/inválid/));
test('rejects attempt to override canonical V2',()=>assert.throws(()=>parse([`--seed=${seed}`,'--overwrite-V2']),/Opción/));
