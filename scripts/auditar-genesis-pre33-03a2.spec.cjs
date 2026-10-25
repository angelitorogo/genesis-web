const {test}=require('node:test'),assert=require('node:assert/strict');
const cli=require('./auditar-genesis-pre33-03a2.cjs');
test('PRE-33.03a.2 exige semilla V2 correcta',()=>{
 assert.throws(()=>cli.parse(['--seed=BAD']));
 assert.doesNotThrow(()=>cli.parse(['--seed=7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5']));
});
test('PRE-33.03a.2 valida flags y no admite galaxias negativas',()=>{
 assert.throws(()=>cli.parse(['--seed=7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5','--galaxies=-1']));
 assert.throws(()=>cli.parse(['--seed=7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5','--foo']));
});
test('PRE-33.03a.2 fuente estelar identificable sin resembrar',()=>{
 const info=cli.sourceFromHost({label:'A',lifetime:{ageBillionYears:4.5,
  evolutionAssessment:{evolutionState:{name:'MAIN_SEQUENCE'},mainSequenceLifetimeBillionYears:10}},
  physical:{currentMassSolar:1,luminositySolar:1}},false,'G0/S4/O2');
 assert.equal(info.ageBillionYears,4.5);assert.equal(info.orbitalFluxGeometry,'HOST_CIRCUMSTELLAR');
 assert.ok(info.sourceRecordKey.startsWith('FROZEN_HOST_15_3/'));
});
