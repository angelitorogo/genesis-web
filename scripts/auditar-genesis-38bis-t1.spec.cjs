'use strict';
/** Auditoría portátil de integración 38.bis-T1, sin tocar IndexedDB real. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const archive = 'src/app/presentation/genesis-archive/38-bis/';
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const check = relative => {
  const code = read(relative);
  const parsed = ts.createSourceFile(relative, code, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  assert.equal(parsed.parseDiagnostics.length, 0, `Error de sintaxis: ${relative}`);
  return code;
};

const store = check(archive + 'genesis-universal-archive-38-bis.store.ts');
assert.match(store, /constructor\(name='genesis-web-archive-38bis',[\s\S]*?dependencies\?/);
assert.match(store, /super\(name,\{autoOpen:false,\.\.\.dependencies\}\)/);
const helper = check(archive + 'genesis-universal-archive-test-db-38bis.ts');
assert.match(helper, /from 'fake-indexeddb'/);
assert.match(helper, /new GenesisUniversalArchiveStore38Bis\(name,\{indexedDB,IDBKeyRange\}\)/);
const dbTests = [
  'genesis-universal-archive-38-bis.store.spec.ts',
  'genesis-universal-archive-38-bis-colonization-stats.spec.ts',
  'genesis-universal-archive-38-bis-reconciliation.spec.ts',
  'genesis-universal-archive-sort-38-bis-b3.store.spec.ts',
  'genesis-universal-archive-progress-38-bis-b4.spec.ts',
  'genesis-universal-archive-autoindex-38-bis-b6.spec.ts',
  'genesis-universal-archive-confirmed-38-bis-b7.store.spec.ts',
];
for (const filename of dbTests) {
  const source = check(archive + filename);
  assert.match(source, /createArchiveTestStore38Bis\(/, filename);
  assert.ok(!source.includes('new GenesisUniversalArchiveStore38Bis('), filename);
}

const layout = check(archive + 'genesis-universal-archive-list-layout-38-bis-b2.spec.ts');
for (const attribute of ['indexProgress:', 'indexProgressStored:', 'indexProgressTotal:', 'progressDetails:', 'sortKey:', 'sortOptions:']) {
  assert.ok(layout.includes(attribute), `Falta propiedad del mock: ${attribute}`);
}
const galaxy = check('src/app/presentation/galaxy-detail/galaxy-detail.spec.ts');
assert.match(galaxy, /Inventario confirmado y exploración/);
const orbit = check('src/app/presentation/system/system-scene-orbital-architecture-visciv6i.spec.ts');
assert.match(orbit, /visual\.group\.rotation\.set\(0, 0, 0\)/);
assert.match(orbit, /expect\(heights\[1\]!\)\.toBeGreaterThan\(heights\[2\]!\)/);
for (const file of ['vida38-civilized-reptilian-38-2o.spec.ts', 'vida38-civilized-reptilian-38-2od2.spec.ts']) {
  const source = check('src/app/presentation/life-species-visual/' + file);
  assert.match(source, /vida38PrimitiveReptilianPart38U/);
  assert.match(source, /vida38AdvancedReptilianWardrobe38S4/);
  assert.match(source, /civilizationTier: level/);
}
assert.match(check('src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2od2.spec.ts'), /validateVida38PrimitiveReptilianModel38U/);
console.log('38.bis-T1: PASS — inyección IndexedDB por instancia (7 suites), mock del Archivo, título confirmado, 3 niveles reptilianos, y cotas orbitales locales.');
