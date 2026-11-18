'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const modulePath = 'src/app/presentation/system/system-scene-planet-surface-detail-vissurf1.ts';
const testPath = 'src/app/presentation/system/system-scene-planet-surface-detail-vissurf1.spec.ts';
for (const relative of [modulePath, testPath]) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  const node = ts.createSourceFile(relative, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  assert.equal(node.parseDiagnostics.length, 0, `${relative}: sintaxis TypeScript`);
}
const source = fs.readFileSync(path.join(root, modulePath), 'utf8');
const compiled = ts.transpileModule(source, {
  fileName: modulePath,
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  reportDiagnostics: true,
});
assert.equal(compiled.diagnostics?.length ?? 0, 0);
const exportsObject = { exports: {} };
new Function('module', 'exports', compiled.outputText)(exportsObject, exportsObject.exports);
const refine = exportsObject.exports.refineSolidPlanetSurfaceVISSURF1;
assert.equal(typeof refine, 'function');

const sw = 256, sh = 128, tw = 1024;
const rgba = new Uint8Array(sw * sh * 4);
const surfaceClassMask = new Uint8Array(sw * sh);
for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
  const i = y * sw + x;
  const water = x < 128;
  surfaceClassMask[i] = water ? 1 : 5;
  rgba.set(water ? [20, 70, 180, 255] : [145, 115, 45, 255], i * 4);
}
const snapshot = new Uint8Array(rgba);
const input = { width: sw, height: sh, rgba, surfaceClassMask, roughnessRgba: null, reliefRgba: null };
const rendered = refine(input, tw, 713);
const repeated = refine(input, tw, 713);
assert.deepEqual(rendered.rgba, repeated.rgba, 'la semilla debe ser determinista');
assert.deepEqual(rgba, snapshot, 'el atlas original no debe alterarse');
const row = 256;
const colors = Array.from({ length: 40 }, (_, i) => rendered.rgba[((row * tw + 490 + i) * 4) + 2]);
const maximumJump = Math.max(...colors.slice(1).map((v, i) => Math.abs(v - colors[i])));
const mixed = colors.filter(value => value > 65 && value < 160).length;
assert.ok(maximumJump < 65, `transición cuadrada excesiva: ${maximumJump}`);
assert.ok(mixed >= 2, `no se han generado suficientes píxeles antialias: ${mixed}`);
assert.equal(rendered.classMask[row * tw + 490], 1);
assert.equal(rendered.classMask[row * tw + 529], 5);
for (let y = 0; y < rendered.height; y++) {
  const left = y * rendered.width * 4;
  const right = left + (rendered.width - 1) * 4;
  for (let c = 0; c < 4; c++) assert.equal(rendered.rgba[left + c], rendered.rgba[right + c]);
}
console.log(`VISSURF.1a: PASS — borde antialias, salto máximo ${maximumJump}, ${mixed} muestras de transición, determinismo y costura`);
