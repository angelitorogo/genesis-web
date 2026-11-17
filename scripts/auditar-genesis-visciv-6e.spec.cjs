'use strict';
// VISCIV.6e — comprobación portable sin WebGL ni base de datos.
// Ejecutar en la raíz: node scripts/auditar-genesis-visciv-6e.spec.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const file = relative => path.join(root, 'src', 'app', 'presentation', 'system', relative);

function evaluate(sourceFile, deps = {}) {
  const source = fs.readFileSync(sourceFile, 'utf8');
  const transpiled = ts.transpileModule(source, {
    fileName: sourceFile,
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  });
  assert.ok(!transpiled.diagnostics?.length, `TS sintaxis: ${sourceFile}`);
  const module = { exports: {} };
  const requireLocal = id => {
    if (id === 'three') return {};
    if (id.endsWith('system-scene-orbital-detail-visciv5')) return {};
    if (Object.hasOwn(deps, id)) return deps[id];
    throw new Error(`Dependencia inesperada en auditoria VISCIV.6e: ${id}`);
  };
  vm.runInNewContext(`(function(require,module,exports){${transpiled.outputText}\n})`, { Object, Math })(requireLocal, module, module.exports);
  return module.exports;
}
const plans = evaluate(file('system-scene-artificial-satellites-visciv2.ts'));
const manifest = evaluate(file('system-scene-orbital-infrastructure-visciv6e.ts'), {
  './system-scene-artificial-satellites-visciv2': plans,
});
const build = manifest.buildSystemSceneOrbitalInfrastructureManifestVISCIV6e;
const rings = new Set();
for (let i = 0; i < 1024; i++) {
  const seed = Math.imul(i + 1, 7919) >>> 0;
  const advanced = build(seed, 'ADVANCED', 1);
  const very = build(seed, 'VERY_ADVANCED', 1);
  assert.ok(advanced.satelliteCount >= 3 && advanced.satelliteCount <= 5);
  assert.equal(advanced.stationCount, 0);
  assert.equal(advanced.ringCount, 0);
  assert.ok(very.satelliteCount >= 9);
  assert.ok(very.stationCount >= 1);
  assert.ok(very.ringCount >= 0 && very.ringCount <= 2);
  assert.equal(very.totalCount, very.satelliteCount + very.stationCount + very.ringCount);
  assert.equal(JSON.stringify(very), JSON.stringify(build(seed, 'VERY_ADVANCED', 1)));
  assert.equal(build(seed, 'PRIMITIVE', 1).totalCount, 0);
  assert.equal(build(seed, null, 1).totalCount, 0);
  rings.add(very.ringCount);
}
assert.deepEqual([...rings].sort(), [0, 1, 2]);
for (const relative of [
  'src/app/presentation/system/system-scene.ts',
  'src/app/presentation/scientific-body-preview/scientific-body-preview.ts',
]) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  assert.match(source, /const stationPlans = manifest\.stations;/);
  assert.match(source, /const ringPlans = manifest\.rings;/);
  assert.ok(!source.includes('const stationPlans: ReturnType<typeof buildSystemSceneOrbitalStationPlansV1> = []'));
  assert.ok(!source.includes('const ringPlans: ReturnType<typeof buildSystemSceneOrbitalRingPlansV1> = []'));
}
console.log('VISCIV.6e OK: 1024 semillas, ADVANCED/VERY_ADVANCED, 0/1/2 aros, determinismo y ambas rutas visuales.');
