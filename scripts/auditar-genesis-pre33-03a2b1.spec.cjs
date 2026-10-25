'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {parse}=require('./auditar-genesis-pre33-03a2b1.cjs');
test('seed, 3 galaxias y muestreo estricto',()=>{
 const p=parse(['--seed=7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5','--galaxies=0,1,2','--systems-per-galaxy=20','--strict']);
 assert.deepEqual(p.galaxies,[0,1,2]);assert.equal(p.systems,20);assert.equal(p.strict,true);
});
test('rechaza seed inválida',()=>assert.throws(()=>parse(['--seed=NOPE']),/inválid/));
test('rechaza argumentos arbitrarios',()=>assert.throws(()=>parse(['--seed=7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5','--overwrite-V2']),/Opción/));
