'use strict';
/** Deterministic static audit; Angular/Vitest integration is verified separately. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const projectRoot = path.resolve(__dirname, '..');
const read = filename => fs.readFileSync(path.join(projectRoot, 'src/app/presentation/runtime', filename), 'utf8');
const adapter = read('vida9-v3-confirmed-physical-targets.ts');
const indexer = read('vida9-confirmed-system-biology-indexer.ts');
const fixture = read('galaxy-planet-moon-catalog-snapshot.runtime.spec.ts');

test('VIDA.9 biology indexing does not invoke the V1-only planet resolver', () => {
  assert.doesNotMatch(indexer, /PlanetScientificTargetResolver\.resolveDetailed\s*\(/);
  assert.match(indexer, /vida9V3ConfirmedPhysicalTargets\(/);
});
test('SINGLE materializes the same generated physical source as the planetary fiche', () => {
  assert.match(adapter, /StellarMultihostFormation\.generateSingleOrNull\(/);
  assert.match(adapter, /PlanetScientificTargetResolver\.projectGenerated\(/);
});
test('MULTI uses the same public-ordinal scientific adapter as the fiche', () => {
  assert.match(adapter, /StellarMultihostFormation\.generateOrNull\(/);
  assert.match(adapter, /new StellarMultihostScientificTargetResolver\(/);
  assert.match(adapter, /scientific\.resolveMoonDetailed\(/);
});
test('the public V3 test does not invent a fixed Phiater B-2 in an isolated seed', () => {
  assert.doesNotMatch(fixture, /expect\(planet\)\.toBeDefined\(\)/);
  assert.match(fixture, /legacy\)\.not\.toHaveBeenCalled\(\)/);
});
test('the indexer handles physical nonconvergence locally without ignoring persistence integrity', () => {
  assert.match(indexer, /NON_CONVERGED_PHASE_MODEL/);
  assert.match(indexer, /throw error;/);
  assert.match(indexer, /await this\.repository\.ensure\(record\)/);
});
