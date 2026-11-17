'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const common = fs.readFileSync(path.join(root, 'src/app/presentation/system/system-scene-artificial-satellites-visciv2.ts'), 'utf8');
const lighting = fs.readFileSync(path.join(root, 'src/app/presentation/system/system-scene-orbital-illumination-visciv6j.ts'), 'utf8');
const test = fs.readFileSync(path.join(root, 'src/app/presentation/system/system-scene-orbital-illumination-visciv6j.spec.ts'), 'utf8');

for (const name of [
  'VISCIV6j architectural night lighting',
  'URBAN_WINDOWS', 'URBAN_BOULEVARDS', 'SHIPYARD_ACTIVITY',
  'GANTRY_SIGNALS', 'TRANSPORT_LANES', 'TRANSPORT_TERMINALS', 'MAJOR_NODES',
  'updateOrbitalArchitecturalNightLightsVISCIV6j',
  'mesh.setColorAt', 'mesh.instanceColor',
]) {
  assert.ok((lighting + common).includes(name), `VISCIV.6j: falta ${name}`);
}
assert.match(common, /createOrbitalArchitecturalLightsVISCIV6j\(plan, planetRadiusScene\)/);
assert.match(common, /updateOrbitalArchitecturalNightLightsVISCIV6j\(\s*visual\.architecturalLightsVISCIV6j, quaternion, stellarSources/);
assert.match(common, /nightBeaconsVISCIV6g/);
assert.match(common, /addMonumentalOrbitalArchitectureVISCIV6i/);
assert.match(lighting, /new THREE\.InstancedMesh\(/);
assert.doesNotMatch(lighting, /new THREE\.(PointLight|SpotLight|DirectionalLight)\(/);
assert.match(test, /ilumina|atenúa/i);
assert.match(test, /determinista/);

// Both renderers already call the shared VISCIV.6g updater; VISCIV.6j extends that exact
// path instead of duplicating render-specific lighting or replacing the old beacons.
for (const relative of [
  'src/app/presentation/system/system-scene.ts',
  'src/app/presentation/scientific-body-preview/scientific-body-preview.ts',
]) {
  const file = path.join(root, relative);
  if (fs.existsSync(file)) {
    assert.match(fs.readFileSync(file, 'utf8'), /updateOrbitalRingNightLightsVISCIV6g\(/,
      `VISCIV.6j: ${relative} perdió la actualización nocturna compartida`);
  }
}
console.log('VISCIV.6j — Auditoría portátil: PASS (integración, grupos, patrones y rutas de actualización).');
