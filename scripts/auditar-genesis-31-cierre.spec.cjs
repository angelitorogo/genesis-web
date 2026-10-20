'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {auditProject} = require('./auditar-genesis-31-cierre.cjs');
const CONTRACTS = [
  'habitability-engine.ts', 'habitability-environment-resolver-31-2.ts',
  'habitability-resources-resolver-31-3.ts', 'habitability-radiation-resolver-31-4.ts',
  'habitability-stability-resolver-31-5.ts', 'habitability-indices-resolver-31-6.ts',
  'habitability-historical-windows-resolver-31-7.ts', 'habitability-continuity-resolver-31-8.ts',
  'habitability-evolutionary-stability-resolver-31-9.ts', 'habitability-moon-resolver-31-10.ts',
  'habitability-alternative-routes-resolver-31-11.ts', 'habitability-knowledge-resolver-31-12.ts',
];
function fixture(complete = false) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'genesis-31F-'));
  const write = (file, content) => {
    const target = path.join(root, 'src', 'app', file);
    fs.mkdirSync(path.dirname(target), {recursive:true});
    fs.writeFileSync(target, content);
  };
  if (complete) {
    for (const file of CONTRACTS) write(`simulation/habitability/${file}`, 'export {};');
    for (const file of ['planetary-history-engine.ts', 'planetary-history-interval-engine-32-12.ts'])
      write(`simulation/planetary-history/${file}`, 'export {};');
  }
  return {root, write, remove: () => fs.rmSync(root, {recursive:true, force:true})};
}
function withFixture(complete, callback) {
  const f = fixture(complete);
  try {callback(f);} finally {f.remove();}
}
const check = (result, index) => result.checks[index];

test('does not close a phase without contracts', () => withFixture(false, f => {
  const result = auditProject(f.root);
  assert.equal(result.status, 'CONTRATOS_INCOMPLETOS');
  assert.equal(check(result, 1).status, 'SIN_REFERENCIAS');
  assert.equal(result.functionalClosureCertified, false);
}));

test('excludes comments, prose, dead imports and unit-test references from every runtime check', () =>
  withFixture(true, f => {
    f.write('presentation/view.spec.ts', 'HabitabilityKnowledgeResolver31_12.projectObserved({})');
    f.write('presentation/view.ts', `// HabitabilityKnowledgeResolver31_12.projectObserved({})
      /* HabitabilityKnowledgeResolver31_12.projectObserved({}) */
      import { HabitabilityKnowledgeResolver31_12 } from '../../simulation/habitability/habitability-knowledge-resolver-31-12';
      export const doc = 'HabitabilityKnowledgeResolver31_12.projectObserved({})';`);
    f.write('simulation/planetary/fake.ts', `// HabitabilityEnvironmentResolver31_2.assessPlanet({})
      import { HabitabilityEnvironmentResolver31_2 } from '../../simulation/habitability/habitability-environment-resolver-31-2';`);
    const result = auditProject(f.root);
    assert.equal(check(result, 4).status, 'SIN_REFERENCIAS');
    assert.equal(check(result, 1).status, 'SIN_REFERENCIAS');
  }));

test('all four physical stages must be called in one non-test assembly', () =>
  withFixture(true, f => {
    const calls = [
      'HabitabilityEnvironmentResolver31_2.assessPlanet(ctx, data)',
      'HabitabilityResourcesResolver31_3.assessPlanet(ctx, previous, data)',
      'HabitabilityRadiationResolver31_4.assessPlanet(ctx, previous, data)',
      'HabitabilityStabilityResolver31_5.assessPlanet(ctx, previous, data)',
    ];
    f.write('simulation/planetary/live-assembly.ts', calls.slice(0, 3).join(';'));
    assert.equal(check(auditProject(f.root), 1).status, 'SIN_REFERENCIAS');
    f.write('simulation/planetary/live-assembly.ts', calls.join(';'));
    assert.deepEqual(check(auditProject(f.root), 1).detail,
      ['src/app/simulation/planetary/live-assembly.ts']);
    assert.equal(auditProject(f.root).functionalClosureCertified, false);
  }));

test('historical source requires a typed producer implementing both operations', () =>
  withFixture(true, f => {
    f.write('simulation/planetary-history/fake.ts',
      'import type {HistoricalEnvironmentSource31_7} from "x";');
    assert.equal(check(auditProject(f.root), 2).status, 'SIN_REFERENCIAS');
    f.write('simulation/planetary-history/real.ts',
      'const source: HistoricalEnvironmentSource31_7 = {revision(){return "a";},readInterval(){return []}};');
    assert.deepEqual(check(auditProject(f.root), 2).detail,
      ['src/app/simulation/planetary-history/real.ts']);
  }));

test('history reconstruction must actually call 31.7, not just import it', () =>
  withFixture(true, f => {
    f.write('presentation/planet-detail/historical.ts',
      'HabitabilityHistoricalWindowsResolver31_7.reconstruct(req, source)');
    assert.equal(check(auditProject(f.root), 3).status, 'LLAMADAS_DETECTADAS');
    assert.equal(check(auditProject(f.root), 2).status, 'SIN_REFERENCIAS');
  }));

test('observed projection checks player-facing code and remains non-certifying', () =>
  withFixture(true, f => {
    f.write('presentation/planet-detail/observed.ts',
      'const fiche = HabitabilityKnowledgeResolver31_12.projectObserved(input, access);');
    const result = auditProject(f.root);
    assert.equal(check(result, 4).status, 'LLAMADAS_DETECTADAS');
    assert.notEqual(result.status, 'CERRADO');
    assert.equal(result.functionalClosureCertified, false);
  }));

test('CLI supports --json without a root and --strict fails safely', () =>
  withFixture(true, f => {
    const script = path.join(__dirname, 'auditar-genesis-31-cierre.cjs');
    const run = spawnSync(process.execPath, [script, '--json', f.root, '--strict'], {encoding:'utf8'});
    assert.equal(run.status, 1);
    const parsed = JSON.parse(run.stdout);
    assert.equal(parsed.root, f.root);
    assert.equal(parsed.unresolvedIntegrations.length, 4);
  }));

test('historical resolver declaring its own type is not a producer', () =>
  withFixture(true, f => {
    f.write('simulation/habitability/habitability-historical-windows-resolver-31-7.ts',
      'const source:HistoricalEnvironmentSource31_7={revision(){return "x"},readInterval(){return []}};');
    assert.equal(check(auditProject(f.root), 2).status, 'SIN_REFERENCIAS');
  }));
