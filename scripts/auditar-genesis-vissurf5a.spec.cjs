/* VISSURF.5a — auditoría portable de relieves sin curvas de nivel artificiales. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const root = process.cwd();
const modulePath = path.join(root, 'src/app/presentation/system/system-scene-planet-coherent-geography-vissurf5.ts');
const source = fs.readFileSync(modulePath, 'utf8');
assert.ok(!source.includes('Math.abs(regional - 0.5) / 0.18'), 'Regresión: aislíneas de crestas cerradas');
assert.ok(!source.includes('Math.abs(structural - 0.22) / 0.10'), 'Regresión: aislíneas de valles cerrados');
assert.ok(source.includes('regionalStress') && source.includes('orogeny'));

const prior = Module._extensions['.ts'];
Module._extensions['.ts'] = (mod, fileName) => {
  const result = ts.transpileModule(fs.readFileSync(fileName, 'utf8'), {
    fileName,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    reportDiagnostics: true,
  });
  assert.equal(result.diagnostics?.length ?? 0, 0, `TypeScript inválido: ${fileName}`);
  mod._compile(result.outputText, fileName);
};
let build;
try {
  ({ buildCoherentSolidPlanetSurfaceVISSURF5: build } = require(modulePath));
} finally {
  if (prior) Module._extensions['.ts'] = prior;
  else delete Module._extensions['.ts'];
}

const width = 256, height = 128;
const surfaceClassMask = new Uint8Array(width * height);
const rgba = new Uint8Array(width * height * 4);
const reliefRgba = new Uint8Array(rgba.length);
const roughnessRgba = new Uint8Array(rgba.length);
for (let i = 0; i < width * height; i++) {
  surfaceClassMask[i] = 3;
  rgba.set([120, 114, 107, 255], 4 * i);
  reliefRgba.set([128, 128, 128, 255], 4 * i);
  roughnessRgba.set([176, 176, 176, 255], 4 * i);
}
const input = { width, height, surfaceClassMask, rgba, reliefRgba, roughnessRgba };
for (const seed of [0x257691ab, 872311, 0x17e9bc41]) {
  const result = build(input, 1024, seed);
  let count = 0, extreme = 0, strength = 0;
  for (let y = 8; y < result.height - 8; y += 2) {
    for (let x = 8; x < result.width - 9; x += 2) {
      const p = (y * result.width + x) * 4;
      const contrast = Math.abs(result.normalRgba[p] - 128) + Math.abs(result.normalRgba[p + 1] - 128);
      if (contrast > 80) extreme++;
      strength += contrast;
      count++;
    }
  }
  const extremeFraction = extreme / count;
  const meanContrast = strength / count;
  assert.ok(extremeFraction < 0.022, `Anillos de normales excesivos: ${extremeFraction}`);
  assert.ok(meanContrast > 12 && meanContrast < 38, `Relieve demasiado plano o excesivo: ${meanContrast}`);
  assert.deepEqual(surfaceClassMask, new Uint8Array(surfaceClassMask.length).fill(3));
  console.log(`VISSURF.5a seed=${seed}: extremos ${(100 * extremeFraction).toFixed(2)}% · contraste ${meanContrast.toFixed(2)}`);
}
console.log('VISSURF.5a: PASS');
