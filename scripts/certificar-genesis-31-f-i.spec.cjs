'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { audit } = require('./certificar-genesis-31-f-i.cjs');
function sandbox(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'genesis-31-fi-'));
  try { return fn(root); } finally { fs.rmSync(root, { force: true, recursive: true }); }
}
function source(root, filename, code) {
  const file = path.join(root, 'src', 'app', filename);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, code);
}
test('an empty checkout never receives scientific certification', () => sandbox(root => {
  const result = audit(root);
  assert.equal(result.scientificPhaseClosure, 'NOT_CERTIFIED');
  assert.equal(result.checks.historicalEvolution.state, 'NOT_DETECTED');
  assert.equal(result.checks.physicalCurrent.state, 'NOT_DETECTED');
}));
test('dead imports, tests and comments are not treated as runtime calls', () => sandbox(root => {
  source(root, 'fake.ts', `import { PlanetaryEnvironmentalEvolution31Fh } from './nothing';\n// new PlanetaryEnvironmentalEvolution31Fh(x)\n/* new PlanetaryEnvironmentalHistoryCertification31Fg(x) */`);
  source(root, 'fake.spec.ts', 'new PlanetaryEnvironmentalEvolution31Fh(x)');
  const result = audit(root);
  assert.equal(result.checks.historicalEvolution.state, 'NOT_DETECTED');
  assert.equal(result.checks.historicalReconstruction.state, 'NOT_DETECTED');
}));
test('real call sites are located but never promoted to physical certification', () => sandbox(root => {
  source(root, 'a.ts', `function doIt(x){ return new PlanetaryEnvironmentalEvolution31Fh(x) }`);
  source(root, 'b.ts', `function doIt(x){ return new PlanetaryEnvironmentalHistoryCertification31Fg(x, 'rev') }`);
  source(root, 'c.ts', `function doIt(a,b,c){ return HabitabilityPhysicalIntegration31Fb.assessMaterialized(a,b,c) }`);
  source(root, 'd.ts', `function doIt(t,s){ return ObservedHabitabilityFiche31Fe.planet(t,s,true,'key','SINGLE') }`);
  const result = audit(root);
  for (const check of Object.values(result.checks)) assert.equal(check.state, 'RUNTIME_CALL_DETECTED');
  assert.equal(result.scientificPhaseClosure, 'NOT_CERTIFIED');
  assert.equal(result.historicalEnvironmentalCoverage, 'NOT_CERTIFIED_BY_STATIC_AUDIT');
}));
test('CLI strict has nonzero exit despite present static calls', () => sandbox(root => {
  source(root, 'a.ts', `new PlanetaryEnvironmentalHistoryCertification31Fg(x)`);
  const outcome = spawnSync(process.execPath, [path.join(__dirname, 'certificar-genesis-31-f-i.cjs'), '--root', root, '--strict', '--json'], { encoding: 'utf8' });
  assert.equal(outcome.status, 1);
  assert.equal(JSON.parse(outcome.stdout).scientificPhaseClosure, 'NOT_CERTIFIED');
}));
test('actual checkout cannot pass by counting 31.F.d internal construction from 31.F.g', () => {
  const result = audit(path.resolve(__dirname, '..'));
  assert.equal(result.checks.physicalCurrent.state, 'RUNTIME_CALL_DETECTED');
  assert.equal(result.checks.observedCards.state, 'RUNTIME_CALL_DETECTED');
  assert.equal(result.scientificPhaseClosure, 'NOT_CERTIFIED');
});
