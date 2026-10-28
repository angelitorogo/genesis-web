'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
// Local, isolated test harness for pure VIDA.9 model; no Angular/Dexie required.
require.extensions['.ts'] = (module,filename)=>{
  const source = fs.readFileSync(filename,'utf8');
  const output = ts.transpileModule(source,{fileName:filename,compilerOptions:{target:ts.ScriptTarget.ES2022,
    module:ts.ModuleKind.CommonJS}});
  module._compile(output.outputText,filename);
};
const {vida9TestSources} = require('../src/app/simulation/life/vida9-test-fixture.ts');
const {Vida9BiologyExploration}=require('../src/app/simulation/life/vida9-biology-exploration.ts');
const {vida9DigestForRecord}=require('../src/app/domain/life/vida9-biology-exploration.ts');
const make=()=>{const s=vida9TestSources();return Vida9BiologyExploration.evaluate(s.ecosystem,s.intelligence,s.colonization)};
test('VIDA.9: CT-0 and immutable result are identical across regeneration and JSON reload',()=>{
  const a=make(),b=make();assert.deepEqual(a,b);assert.equal(a.epoch,'CT-0');
  assert.equal(a.epochOffsetYears,0);assert.equal(a.historicalOriginEpochYears,null);
  assert.deepEqual(JSON.parse(JSON.stringify(a)),a);
  const {digest,...content}=a;assert.equal(digest,vida9DigestForRecord(content));
});
test('VIDA.9: FULL reveal only on CONFIRMED, no accidental life promotion',()=>{
  for(let state=0;state<5;state++)assert.equal(Vida9BiologyExploration.mayReveal(state,5),false);
  assert.equal(Vida9BiologyExploration.mayReveal(5,5),true);
  const a=make();assert.equal(a.nativeLifePresent,true);
  assert.equal(a.nativeIntelligencePresent,false);
  assert.equal(a.nativeCivilizationPresent,false);
  assert.equal(a.colonialPopulationPresent,false);
});
test('VIDA.9: cross-body identities, broken chain and renamed colonies rejected',()=>{
  const s=vida9TestSources();
  assert.throws(()=>Vida9BiologyExploration.evaluate(s.ecosystem,
    {...s.intelligence,bodyStorageKey:'other'},s.colonization));
  assert.throws(()=>Vida9BiologyExploration.evaluate(s.ecosystem,s.intelligence,
    {...s.colonization,nativeCivilizationDigest:'other'}));
  assert.throws(()=>Vida9BiologyExploration.evaluate(s.ecosystem,s.intelligence,
    {...s.colonization,nativeLifePresent:false}));
});
