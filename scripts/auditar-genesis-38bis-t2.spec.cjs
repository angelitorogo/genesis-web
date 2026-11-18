'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const base = 'src/app/presentation/genesis-archive/38-bis/';
const files = [
  base + 'genesis-universal-archive-38-bis.facade.ts',
  base + 'genesis-universal-archive-index-plan-38bis-t2.ts',
  base + 'genesis-universal-archive-index-plan-38bis-t2.spec.ts',
];
const sources = files.map(file => {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  assert.equal(parsed.parseDiagnostics.length, 0, `Syntax: ${file}`);
  return source;
});
const [facade, planner] = sources;
const js = ts.transpileModule(planner, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
}}).outputText;
const plannerExports = {};
vm.runInNewContext(js, { exports: plannerExports, Object, Set, Array });
const { archiveIndexPlan38BisT2, archiveIndexTaskKey38BisT2 } = plannerExports;
const categories = [ 'colonized-moons','colonized-planets','colonies','systems','civilizations',
  'extremes','clusters','nebulae','planets','moons','asteroids','comets','tno','captured' ];
const galaxies = Array.from({length: 15}, (_, i) => ({index:String(i)}));
const all = categories.flatMap(category => galaxies.map(g => archiveIndexTaskKey38BisT2(category,g.index)));
assert.equal(all.length,210);
const saved = new Set(all.slice(0,160));
// The missing fragments must always go first, without trusting saved data as freshly verified.
const planned = archiveIndexPlan38BisT2(categories,galaxies,saved);
assert.equal(planned.length,210);
assert.equal(planned.filter(j=>!saved.has(archiveIndexTaskKey38BisT2(j.category,j.galaxyIndex))).length,50);
assert.ok(planned.slice(0,50).every(j=>!saved.has(archiveIndexTaskKey38BisT2(j.category,j.galaxyIndex))));
assert.ok(planned.slice(50).every(j=>saved.has(archiveIndexTaskKey38BisT2(j.category,j.galaxyIndex))));
const checked = new Set(all.slice(0,15));
assert.equal(archiveIndexPlan38BisT2(categories,galaxies,saved,checked).length,195);
assert.ok(facade.includes('.finally(()=>{') && facade.includes('void this.backgroundIndex(key,galaxies,scope);'),
  'The visible-category route must resume background indexing');
assert.ok(facade.includes('const tasks=archiveIndexPlan38BisT2('),
  'Missing-first plan must be used');
assert.ok(facade.includes('failures++;') && facade.includes('fragmento no indexado'),
  'Per-fragment error isolation must be present');
assert.ok(facade.includes('acceptVerifiedSection38BisT2'),
  'Unchanged fragments must not reload all progress tables');
assert.ok(!facade.includes('backgroundIndex(key,this.galaxies(),this.scopeSignal(),true)'),
  'Refresh must not force regeneration of all saved fragments');
assert.ok(facade.includes('await this.index.ensure('),
  'Live confirmed-revision verification must remain the authority');
console.log('38.bis-T2: PASS — 210 fragments, 50 pending first, 160 preserved; continuation, error isolation and non-forced refresh verified');
