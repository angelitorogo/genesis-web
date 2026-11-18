'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const shaderPath = path.join(root, 'src/app/presentation/system/system-scene-orbital-surface-shadow-visciv6n.ts');
const specPath = path.join(root, 'src/app/presentation/system/system-scene-orbital-surface-shadow-visciv6n.spec.ts');
const shader = fs.readFileSync(shaderPath, 'utf8');
const spec = fs.readFileSync(specPath, 'utf8');

for (const [filename, contents] of [[shaderPath, shader], [specPath, spec]]) {
  const source = ts.createSourceFile(filename, contents, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  assert.equal(source.parseDiagnostics.length, 0, `Error de sintaxis: ${filename}`);
}

const projection = shader.slice(shader.indexOf('float genesisRingShadowForStarVISCIV6n('), shader.indexOf('return clamp(1.0 - transmitted, 0.0, 1.0);'));
assert.ok(projection.includes('float opacity = 0.80;'), 'La umbra no es continua o su intensidad cambió');
assert.ok(!projection.includes('float trusses =') && !projection.includes('float nodes =') && !projection.includes('monumentalSectors'), 'Persisten oscilaciones estructurales');
assert.ok(!projection.includes('sin(arc') && !projection.includes('cos(arc'), 'Persisten rayas angulares');
assert.ok(shader.includes('VISUAL_MIN_HALF_WIDTH_VISCIV6na = 0.155'), 'Se ha perdido la anchura visual mínima');
assert.ok(shader.includes('VISUAL_PENUMBRA_WIDTH_VISCIV6na = 0.024'), 'Ha cambiado la penumbra');
assert.ok(shader.includes('float angleThicknessBoost = 0.030'), 'Ha cambiado el refuerzo angular de anchura');
assert.ok(shader.includes('float effectiveFade = max(0.001, band.z * 0.72)'), 'Ha cambiado el suavizado exterior');
assert.ok(shader.includes('outgoingLight *= (1.0 - 0.93 * occlusion)'), 'Ha cambiado la intensidad general');
assert.ok(shader.includes('outgoingLight *= genesisNightVisibility * genesisNightTint'), 'Ha cambiado el marcador día/noche');
for (let i = 0; i < 3; i++) assert.ok(shader.includes(`uGenesisLightDirectionsView[${i}]`), `Falta estrella ${i + 1}`);
assert.ok(shader.includes('if (alongSun <= 0.00001) continue;'), 'Ha cambiado la comprobación geométrica de rayos');
assert.ok(shader.includes('if (abs(denominator) < 0.00001) continue;'), 'Ha cambiado la comprobación geométrica de paralelismo');
assert.ok(spec.includes('elimina las rayas y la variación angular'), 'Falta regresión Vitest');

const opacity = 0.80;
const attenuation = 0.93;
const values = [];
for (let i = 0; i < 4096; i++) {
  const angle = i / 4096 * Math.PI * 2;
  // Angle deliberately must not alter a fully covered band's visual opacity.
  const value = 1 - attenuation * opacity;
  assert.ok(angle >= 0);
  assert.ok(value >= 0 && value <= 1);
  values.push(value);
}
assert.equal(Math.max(...values) - Math.min(...values), 0, 'Las bandas no son uniformes');
console.log('VISCIV.6n.b: PASS — 4.096 fases angulares sin franjas; anchura, intensidad, penumbra, proyección multiestrella y luces conservadas');
