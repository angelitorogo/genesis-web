'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {parse}=require('./auditar-genesis-pre33-03a2b.cjs');
test('PRE-33.03a.2b acepta identidad seed y auditoría strict',()=>{
 const r=parse(['--seed=7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5','--galaxies=0,1,2','--systems-per-galaxy=20','--strict']);
 assert.equal(r.systems,20);assert.equal(r.strict,true);assert.deepEqual(r.galaxies,[0,1,2]);
});
test('PRE-33.03a.2b rechaza falta semilla y selecciones inválidas',()=>{
 assert.throws(()=>parse(['--galaxies=0']),/Argumentos inválidos/);
 assert.throws(()=>parse(['--seed=FFFF-FFFF-FFFF-FFFF-FFFF-FFFF-FFFF-FFFF','--systems-per-galaxy=0']),/Argumentos inválidos/);
});
test('PRE-33.03a.2b no permite opciones ignoradas',()=>{
 assert.throws(()=>parse(['--seed=FFFF-FFFF-FFFF-FFFF-FFFF-FFFF-FFFF-FFFF','--life=forced']),/Opción no reconocida/);
});
