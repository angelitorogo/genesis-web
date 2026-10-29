'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const file=path.resolve(__dirname,'../src/app/presentation/galaxy-knowledge-catalog/galaxy-civilization-known-index.ts');
const source=fs.readFileSync(file,'utf8');
const unit=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);
const pure=['shouldRecoverPersistedCivilizations','mergeKnownCivilizations','planetVida9KeysInGalaxy'];
const declarations=unit.statements.filter(node=>ts.isFunctionDeclaration(node)&&pure.includes(node.name?.text));
assert.equal(declarations.length,3,'El índice debe conservar las tres funciones comprobables');
const sample=declarations.map(node=>node.getText(unit)).join('\n');
const js=ts.transpileModule(sample,{fileName:'civilization-test.ts',compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const isolated={};new Function('exports',js)(isolated);
const worker=isolated.shouldRecoverPersistedCivilizations;
const merge=isolated.mergeKnownCivilizations;
const keys=isolated.planetVida9KeysInGalaxy;

test('un Worker parcial debe recuperar registros confirmados de VIDA.9',()=>{
  assert.equal(worker({workerComplete:false,indexed:100,candidateCount:0}),true);
  assert.equal(worker({workerComplete:true,indexed:100,candidateCount:0}),true);
  assert.equal(worker({workerComplete:true,indexed:100,candidateCount:3}),false);
});
test('no se mezclan planetas de galaxias con índices prefijo común',()=>{
  const all=[['seed',3,'1:10:1:2:PLANET:-'],['seed',3,'10:10:1:2:PLANET:-'],['seed',3,'1:10:1:2:MOON:1']];
  assert.deepEqual(keys(all,1n),[all[0]]);
  assert.deepEqual(keys(all,10n),[all[1]]);
});
test('las civilizaciones válidas persistidas se fusionan sin duplicarse',()=>{
  const worker=[{id:'1:10:1:2:PLANET:-',tier:'ADVANCED',speciesName:'A'}];
  const indexed=[{...worker[0],speciesName:'B'},{id:'1:10:1:3:PLANET:-',tier:'PRIMITIVE'}];
  assert.deepEqual(merge(worker,indexed).map(x=>x.id),['1:10:1:2:PLANET:-','1:10:1:3:PLANET:-']);
  assert.equal(merge(worker,indexed)[0].speciesName,'B');
});
test('el rescate no genera civilizaciones ni recalcula vida, lee sólo planetas confirmados',()=>{
  assert.match(source,/private async readPersistedConfirmedPlanets\(/);
  assert.match(source,/if\(!row \|\| !confirmed\.has\(row\.systemStorageKey\)\)continue;/);
  assert.match(source,/planetVida9KeysInGalaxy\(/);
  assert.match(source,/this\.readPersistedConfirmedPlanets\(key,galaxyIndex,confirmed,progress\)/);
  assert.match(source,/if\(present && present\.knowledgeRevision!==currentRevision\)return;/);
});
