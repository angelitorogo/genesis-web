'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parse}=require('./auditar-genesis-pre33-03a1.cjs');
const seed='7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5';
test('PRE-33.03a.1 exige seed V2 canónica',()=>{
  assert.equal(parse([`--seed=${seed}`]).seed,seed);
  assert.throws(()=>parse(['--seed=INVALIDA']));
});
test('PRE-33.03a.1 conserva un muestreo deterministicamente definido',()=>{
  assert.deepEqual(parse([`--seed=${seed}`,'--galaxies=0,1,2','--systems-per-galaxy=20']),
    parse([`--seed=${seed}`,'--galaxies=0,1,2','--systems-per-galaxy=20']));
});
test('PRE-33.03a.1 --strict no permite muestras imposibles',()=>{
  assert.throws(()=>parse([`--seed=${seed}`,'--systems-per-galaxy=201','--strict']));
  assert.throws(()=>parse([`--seed=${seed}`,'--galaxies=-1','--strict']));
});
test('PRE-33.03a.1 rechaza opciones desconocidas',()=>{
  assert.throws(()=>parse([`--seed=${seed}`,'--disable-uncertainty']));
});
