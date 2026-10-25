'use strict';
/** Node regression using the project's TypeScript dev dependency. Does not start Angular or mutate any save. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = path.resolve(__dirname, '../src/app/simulation/planetary-history/planetary-coeval-formation-history-source-pre33.ts');
const text = fs.readFileSync(source, 'utf8');
const result = ts.transpileModule(text, {fileName:source,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},reportDiagnostics:true});
if(result.diagnostics?.some(d=>d.category===ts.DiagnosticCategory.Error)) throw new Error('TypeScript syntax error');
const m={exports:{}};
// The module imports only erased types and has no runtime external dependencies.
new Function('module','exports',result.outputText)(m,m.exports);
const episode=m.exports.coevalPlanetFormationEpisodePRE33;
const make=(start,end,now=13_000_000)=>episode('REVISION/G0/S1','REVISION/G0/S1/B0',0,{sourceDiskAgeMillionYears:start,formationCompletionAgeMillionYears:end},now);

test('17.7: dated formation interval is inferred from materialized blueprint',()=>{
  const record=make(0.2,8);
  assert.deepEqual(record.time,{timeScale:'YEARS_SINCE_SYSTEM_FORMATION',startYear:200000,endYear:8000000,resolution:'INFERRED_INTERVAL'});
  assert.equal(record.kind,'FORMATION');
  assert.equal(record.source.evidenceKind,'INFERRED_PHYSICAL_EPISODE');
  assert.equal(record.source.sourcePhase,'17.7');
});
test('17.7: never publishes a mature world before formation completes',()=>{
  assert.throws(()=>make(0.2,14),/NOT_MATURE_AT_SHARED_CT0/);
});
test('17.7: no phantom chronology with reversed dates or foreign identity',()=>{
  assert.throws(()=>make(9,2),/NOT_MATURE_AT_SHARED_CT0/);
  assert.throws(()=>episode('', 'foreign',0,{sourceDiskAgeMillionYears:0,formationCompletionAgeMillionYears:2},13000000),/INVALID_PHYSICAL_IDENTITY/);
});
test('17.7: stable ordinal-specific identity and no synthetic transients',()=>{
  const first=make(1,5);
  const second=episode('REVISION/G0/S1','REVISION/G0/S1/B1',1,{sourceDiskAgeMillionYears:1,formationCompletionAgeMillionYears:5},13000000);
  assert.notEqual(first.episodeKey,second.episodeKey);
  assert.deepEqual(first.causedByEpisodeKeys,[]);
  assert.ok(!['RESOLVED_TRANSIENT_EFFECT','REALIZED_IMPACT'].includes(first.kind));
});
