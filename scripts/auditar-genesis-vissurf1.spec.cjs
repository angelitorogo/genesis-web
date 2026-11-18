'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const system = 'src/app/presentation/system/';
const paths = [
  system + 'system-scene-planet-surface-texture.ts',
  system + 'system-scene-planet-surface-detail-vissurf1.ts',
  system + 'system-scene-planet-surface-detail-vissurf1.spec.ts',
  system + 'system-scene.ts',
  'src/app/presentation/scientific-body-preview/scientific-body-preview.ts',
];
for (const relative of paths) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  const parsed = ts.createSourceFile(relative, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  assert.equal(parsed.parseDiagnostics.length, 0, `VISSURF.1: error de sintaxis en ${relative}`);
}
const resource = fs.readFileSync(path.join(root, paths[3]), 'utf8');
const preview = fs.readFileSync(path.join(root, paths[4]), 'utf8');
assert.ok(resource.includes('refineSolidPlanetSurfaceVISSURF1(semanticSurface, textureWidth'));
assert.ok(resource.includes('SOLID_PLANET_DETAIL_WIDTH_VISSURF1.closeSystem'));
assert.ok(resource.includes('cloudWidth = Math.min(textureWidth, PLANET_TEXTURE_DETAIL_SIZES_V1.scientificPreview.width)'));
assert.ok(preview.includes('SCIENTIFIC_PREVIEW_SOLID_SURFACE_DETAIL_VISSURF1'));
assert.ok(preview.includes('planet.surface?.solidSurfaceAvailable === true && planet.giantAtmosphere === null'));
const file = path.join(root, paths[1]);
const out = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  fileName: file,
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  reportDiagnostics: true,
});
assert.equal(out.diagnostics?.length ?? 0, 0);
const m = { exports: {} };
new Function('module', 'exports', out.outputText)(m, m.exports);
const { refineSolidPlanetSurfaceVISSURF1: refine } = m.exports;
const sw = 256, sh = 128;
const mask = new Uint8Array(sw * sh);
const color = new Uint8Array(sw * sh * 4);
const rough = new Uint8Array(sw * sh * 4);
const relief = new Uint8Array(sw * sh * 4);
for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
  const i = y * sw + x;
  const cl = x < 125 ? 1 : y < 22 ? 2 : 5;
  mask[i] = cl;
  for (let c = 0; c < 3; c++) {
    color[i * 4 + c] = cl === 1 ? (c === 2 ? 125 : 40) : cl === 2 ? 228 : c === 1 ? 137 : 70;
    rough[i * 4 + c] = cl === 1 ? 46 : 202;
    relief[i * 4 + c] = cl === 1 ? 93 : 155;
  }
  color[i * 4 + 3] = rough[i * 4 + 3] = relief[i * 4 + 3] = 255;
}
const originalColor = new Uint8Array(color);
const source = { width: sw, height: sh, rgba: color, roughnessRgba: rough, reliefRgba: relief, surfaceClassMask: mask };
const result = refine(source, 1024, 7120);
const repeated = refine(source, 1024, 7120);
assert.deepEqual(result.rgba, repeated.rgba, 'output must be deterministic');
assert.deepEqual(color, originalColor, 'canonical atlas must remain unchanged');
assert.equal(result.rgba.length, 1024 * 512 * 4);
assert.equal(result.classMask.length, 1024 * 512);
assert.ok(result.classMask.some(cl => cl === 1));
assert.ok(result.classMask.some(cl => cl === 5));
for (let y = 0; y < result.height; y++) {
  const left = y * result.width * 4;
  const right = left + (result.width - 1) * 4;
  for (let c = 0; c < 4; c++) assert.equal(result.rgba[left+c], result.rgba[right+c]);
}
console.log('VISSURF.1: PASS — síntesis reproducible, altas resoluciones, clase y costura; nubes intactas');
