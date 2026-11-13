'use strict';
const assert=require('node:assert/strict');const {test}=require('node:test');
const {analyzeFile}=require('./auditar-genesis-38-4a1-semilla.cjs');
test('una semilla dependiente de planetIndex se marca para investigación',()=>{
 const h=analyzeFile('const visual={speciesId:species.id,variantSeedUint32:hash(species.id + planetIndex)};','src/app/simulation/vida-real.ts');
 assert.equal(h.length,1);assert.equal(h[0].state,'DEPENDENCIA_ESPACIAL_POTENCIAL');
});
test('las galerías son laboratorio, no pruebas de producción',()=>{
 const h=analyzeFile('const c={variantSeedUint32:hash(speciesId)};','src/app/presentation/life-species-visual/vida38-example-fixtures.ts');
 assert.equal(h[0].state,'LABORATORIO');
});
test('una variable intermedia nunca equivale a procedencia demostrada',()=>{
 const h=analyzeFile('const c={variantSeedUint32:visualSeed};','src/app/presentation/vida-mapper.ts');
 assert.equal(h[0].state,'PROCEDENCIA_NO_DEMOSTRADA');
});
test('una referencia de identidad con llamada hash se mantiene bajo revisión',()=>{
 const h=analyzeFile('const c={variantSeedUint32:hash(speciesId)};','src/app/presentation/vida-mapper.ts');
 assert.ok(h[0].unresolved.length>0);
});
