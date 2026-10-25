'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const audit=require('./auditar-genesis-pre33-03a2a.cjs');
test('PRE-33.03a.2a rechaza semillas inválidas',()=>assert.throws(()=>audit.parse(['--seed=INVALID'])));
test('PRE-33.03a.2a no permite geometría o índices arbitrarios',()=>assert.throws(()=>audit.parse(['--seed=7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5','--galaxies=-1'])));
test('PRE-33.03a.2a conserva identidad y límites estelares',()=>{
 const host={label:'A',lifetime:{ageBillionYears:12,evolutionAssessment:{
  evolutionState:{name:'WHITE_DWARF'},mainSequenceLifetimeBillionYears:10,postMainSequenceDurationBillionYears:1}},
  physical:{currentMassSolar:.6,initialMassSolar:1,luminositySolar:1}};
 const r=audit.sourceFromHost(host,false,'G0/S7/O2');
 assert.equal(r.stellarState,'WHITE_DWARF');assert.equal(r.initialMassSolar,1);
 assert.equal(r.mainSequenceLifetimeBillionYears,10);
 assert.equal(r.postMainSequenceDurationBillionYears,1);
 assert.equal(r.sourceRecordKey,'FROZEN_HOST_15_3/G0/S7/O2/A');
});
