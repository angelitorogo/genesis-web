'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const audit = read('scripts/auditar-genesis-cache-cat-1.spec.cjs');
const spec = read('src/app/presentation/runtime/galaxy-knowledge-catalog-page-cache.runtime.spec.ts');
const runtime = read('src/app/presentation/runtime/galaxy-knowledge-catalog-page-cache.runtime.ts');
const state = read('src/app/domain/discovery/discovery-state.ts');
let checks = 0;
function check(label, fn) { fn(); checks++; }

check('TypeScript se resuelve mediante dependencias del proyecto', () => {
  assert.match(audit, /require\(['"]typescript['"]\)/);
  assert.doesNotMatch(audit, /\/opt\/nvm|node_modules\/typescript|[A-Za-z]:\\\\/);
});
check('El store CAT1 define el contrato de escritura opcional', () => {
  assert.match(runtime, /export interface GalaxyKnowledgeCatalogPageStoreCAT1/);
  assert.match(runtime, /updateCatalogPageIfRevisionMatches\?\s*\(/);
});
check('El fixture utiliza el store CAT1 y no un repositorio más restrictivo', () => {
  assert.match(spec, /const repository:\s*GalaxyKnowledgeCatalogPageStoreCAT1\s*=/);
  assert.doesNotMatch(spec, /const repository:\s*GalaxyKnowledgeSnapshotRepository\s*=/);
});
check('La actualización simulada continúa verificando la revisión', () => {
  assert.match(spec, /existing\.knowledgeRevision\s*!==\s*revision/);
  assert.match(spec, /updateCatalogPageIfRevisionMatches:\s*vi\.fn/);
});
check('El estado del fixture admite los estados conocidos de descubrimiento', () => {
  assert.match(state, /export type KnownDiscoveryState\s*=/);
  assert.match(spec, /state:\s*KnownDiscoveryState\s*=\s*DiscoveryState\.CONFIRMED/);
  assert.match(spec, /setRows\(generationKey,\s*3n,\s*DiscoveryState\.CATALOGUED\)/);
});
for (const file of [
  'src/app/presentation/runtime/galaxy-knowledge-catalog-page-cache.runtime.spec.ts',
  'src/app/presentation/runtime/galaxy-knowledge-catalog-page-cache.runtime.ts',
]) {
  check(`Sintaxis TypeScript: ${file}`, () => {
    const output = ts.transpileModule(read(file), {
      fileName: file,
      compilerOptions: {module:ts.ModuleKind.ESNext, target:ts.ScriptTarget.ES2022, strict:true},
      reportDiagnostics:true,
    });
    const errors = output.diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error);
    assert.equal(errors.length, 0, errors.map(d => ts.flattenDiagnosticMessageText(d.messageText,'\n')).join('\n'));
  });
}
process.stdout.write(`PASS GENESIS CACHE-CAT.1a — ${checks} comprobaciones · auditoría portable y fixtures corregidos\n`);
