'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'src/app/presentation/system/system-scene-orbital-surface-shadow-visciv6n.ts');
const testPath = path.join(root, 'src/app/presentation/system/system-scene-orbital-surface-shadow-visciv6n.spec.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const spec = fs.readFileSync(testPath, 'utf8');

for (const [name, text] of [[sourcePath, source], [testPath, spec]]) {
  const parsed = ts.createSourceFile(name, text, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  assert.equal(parsed.parseDiagnostics.length, 0, `Sintaxis inválida: ${name}`);
}

function numericConstant(name) {
  const match = source.match(new RegExp(`const\\s+${name}\\s*=\\s*([0-9.]+)`));
  assert.ok(match, `No se encuentra ${name}`);
  return Number(match[1]);
}
const minHalfWidth = numericConstant('VISUAL_MIN_HALF_WIDTH_VISCIV6na');
const penumbra = numericConstant('VISUAL_PENUMBRA_WIDTH_VISCIV6na');
assert.ok(minHalfWidth >= 0.14 && minHalfWidth <= 0.24, 'Ancho mínimo fuera de márgenes visuales');
assert.ok(penumbra > 0 && penumbra < 0.038, 'La penumbra no es más contenida que en 6n');
assert.ok(source.includes('Math.max(authoredHalfWidth, VISUAL_MIN_HALF_WIDTH_VISCIV6na)'));
assert.ok(source.includes('angleThicknessBoost'));
assert.ok(source.includes('float opacity = 0.80;'));
assert.ok(!source.includes('monumentalSectors'));
assert.ok(!source.includes('float trusses ='));
assert.ok(!source.includes('float nodes ='));
assert.ok(source.includes('outgoingLight *= (1.0 - 0.93 * occlusion);'));
assert.ok(source.includes('outgoingLight *= genesisNightVisibility * genesisNightTint;'));
assert.ok(source.includes('uGenesisLightDirectionsView[0]'));
assert.ok(source.includes('uGenesisLightDirectionsView[1]'));
assert.ok(source.includes('uGenesisLightDirectionsView[2]'));
assert.ok(spec.includes('refuerza visualmente la banda'));

// Reference visual profile. The astronomical ray/plane intersection is deliberately unchanged.
function profile(distance, bandHalfWidth) {
  const half = Math.max(bandHalfWidth, minHalfWidth);
  const near = Math.max(0, half - penumbra);
  const far = half + penumbra;
  const x = Math.max(0, Math.min(1, (distance - near) / Math.max(1e-6, far - near)));
  return 1 - x*x*(3-2*x);
}
assert.equal(profile(0, .02), 1);
assert.equal(profile(.27, .02), 0);
assert.ok(profile(.16, .02) > 0, 'La banda fina debe ser visible cerca del borde');
assert.ok(profile(.18, .02) === 0, 'Penumbra limitada');
assert.ok(profile(.12, .02) > .9, 'Núcleo de umbra insuficiente');

console.log('VISCIV.6n.a: PASS — anchura mínima, penumbra y umbra comprobadas; proyección base y luces preservadas');
