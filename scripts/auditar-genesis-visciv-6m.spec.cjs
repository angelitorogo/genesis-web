'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const vm = require('node:vm');

const base = path.resolve(__dirname, '../src/app/presentation/system');
const shaderPath = path.join(base, 'system-scene-orbital-planet-shadow-visciv6m.ts');
const source = fs.readFileSync(shaderPath, 'utf8');
const integration = fs.readFileSync(path.join(base, 'system-scene-artificial-satellites-visciv2.ts'), 'utf8');

for (const marker of [
  'createOrbitalPlanetShadowVISCIV6m',
  'updateOrbitalPlanetShadowVISCIV6m',
  'rotationPivot.updateWorldMatrix',
  'stellarSources',
  'mesh.setColorAt',
]) assert.ok(source.includes(marker), `Falta contrato VISCIV.6m: ${marker}`);
assert.ok(integration.includes('planetShadowVISCIV6m: planetShadow'));
assert.ok(integration.includes('updateOrbitalPlanetShadowVISCIV6m('));

const output = ts.transpileModule(source, { fileName: shaderPath,
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  reportDiagnostics: true });
assert.equal(output.diagnostics.length, 0);
const context = { exports: {}, require: name => {
  if (name === 'three') return { MathUtils: { clamp: (n, min, max) => Math.min(max, Math.max(min, n)) } };
  throw new Error('Dependencia inesperada: ' + name);
} };
vm.runInNewContext(output.outputText, context, { filename: 'orbital-shadow-visciv6m.compiled.cjs' });
const transmission = context.exports.planetShadowTransmissionVISCIV6m;
assert.equal(typeof transmission, 'function');
const v = (x, y, z) => ({ x, y, z, lengthSq() { return this.x * this.x + this.y * this.y + this.z * this.z; } });

for (let i = 0; i < 4096; i++) {
  const radius = 0.2 + (i % 19) / 9;
  const distance = radius + 0.12 + (i % 11) / 10;
  const source = v(10, 0, 0);
  assert.equal(transmission(v(distance, 0, 0), source, radius), 1);
  assert.equal(transmission(v(-distance, 0, 0), source, radius), 0);
  assert.equal(transmission(v(-distance, radius * 1.2, 0), source, radius), 1);
  assert.ok(Math.abs(transmission(v(-distance, radius, 0), source, radius) - 0.5) < 1e-10);
}
console.log('VISCIV.6m: PASS — 4096 radios, cara diurna, umbra, borde, y exterior; integración estática correcta.');
