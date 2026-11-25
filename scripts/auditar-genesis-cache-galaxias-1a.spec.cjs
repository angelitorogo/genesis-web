'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const file = 'src/app/presentation/runtime/galaxy-discovery-read-cache.runtime.ts';
const code = fs.readFileSync(path.join(root, file), 'utf8');
let checks = 0;
function check(value, msg) { assert.ok(value, msg); checks++; }

check(!code.includes('targetTypeCodeFor('), 'No quedan llamadas a targetTypeCodeFor inexistente');
check((code.match(/targetTypeFor\(row\)/g) || []).length === 2,
  'Las dos rutas alternativas utilizan el mismo resolvedor de tipo');
const output = ts.transpileModule(code, {
  fileName: file,
  reportDiagnostics: true,
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
});
check(!(output.diagnostics || []).some(d => d.category === ts.DiagnosticCategory.Error),
  'El archivo TypeScript transpila sin errores de sintaxis');

const cjs = { exports: {} };
vm.runInNewContext(output.outputText, {
  module: cjs, exports: cjs.exports, require(name) {
    if (name.includes('discovery-target-type')) {
      return { DiscoveryTargetType: { fromLocator(locator) { return { code: locator.type }; } } };
    }
    throw new Error(`Dependencia inesperada: ${name}`);
  }, Promise, Map, Object, Error, console,
}, { filename: file });
const { GalaxyDiscoveryReadCacheRuntime: Cache } = cjs.exports;
const generationKey = { universeSeed: { serialize: () => 'SEED-X' }, generatorVersionCode: 3 };
const rows = [
  { locator: { galaxyIndex: 0n, type: 1 } },
  { locator: { galaxyIndex: 0n, type: 4 } },
  { locator: { galaxyIndex: 1n, type: 1 } },
];
let reads = 0;
const source = {
  getState: async () => null,
  setState: async () => undefined,
  getKnownDiscoveries: async () => { reads++; return rows; },
  getKnownDiscoveriesInSector: async () => [],
};
async function main() {
  const cache = new Cache(source);
  const galaxies = await cache.getKnownDiscoveriesInGalaxy(generationKey, 0n, 1);
  check(galaxies.length === 1 && galaxies[0] === rows[0], 'Fallback por galaxia y tipo GALAXY');
  const systems = await cache.getKnownDiscoveriesInGalaxy(generationKey, 0n, 4);
  check(systems.length === 1 && systems[0] === rows[1], 'Fallback por galaxia y tipo SYSTEM');
  const filtered = await cache.getKnownDiscoveriesInGalaxy(generationKey, 1n, 4);
  check(filtered.length === 0, 'Fallback excluye tipos de otra galaxia');
  check(reads === 1, 'Fallback reutiliza la lectura global cacheada');
  const inside = new Cache(source, () => true);
  const transactional = await inside.getKnownDiscoveriesInGalaxy(generationKey, 0n, 4);
  check(transactional.length === 1 && transactional[0] === rows[1],
    'Fallback transaccional mantiene el filtrado sin usar caché');
  check(reads === 2, 'Transacción lee origen sin cachear');
  console.log(`PASS GENESIS CACHE-GAL.1a — ${checks} comprobaciones portátiles`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
