'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = process.cwd();
function read(relativePath) {
  const fullPath = path.join(root, relativePath);
  assert.ok(fs.existsSync(fullPath), `No existe ${relativePath}; comprueba que has extraído el ZIP en la raíz del proyecto`);
  return fs.readFileSync(fullPath, 'utf8');
}
const engine = read('src/app/presentation/system/system-scene-artificial-satellites-visciv2.ts');
const detail = read('src/app/presentation/system/system-scene-orbital-detail-visciv5.ts');
const system = read('src/app/presentation/system/system-scene.ts');
const preview = read('src/app/presentation/scientific-body-preview/scientific-body-preview.ts');
const regression = read('src/app/presentation/system/system-scene-orbital-engineering-visciv5.spec.ts');

for (const exported of [
  'buildSystemSceneArtificialSatellitePlansV1',
  'buildSystemSceneOrbitalInfrastructureProfileV1',
  'buildSystemSceneOrbitalStationPlansV1',
  'buildSystemSceneOrbitalRingPlansV1',
  'createSystemSceneArtificialSatelliteVisualV1',
  'createSystemSceneOrbitalStationVisualV1',
  'createSystemSceneOrbitalRingVisualV1',
]) {
  assert.match(engine, new RegExp(`export function ${exported}\\(`), `Exportación ausente: ${exported}`);
}
for (const token of [
  'new THREE.MeshStandardMaterial(',
  'new THREE.DataTexture(',
  'new THREE.InstancedMesh(',
  'finishOrbitalMaterialsV5(',
  'addOrbitalEngineeringDetailV5(',
  'addOrbitalRingEngineeringDetailV5(',
  "kind === 'SATELLITE'",
  "kind === 'INDUSTRIAL'",
  "kind === 'HABITAT'",
]) {
  const combined = `${engine}\n${detail}`;
  assert.ok(combined.includes(token), `Falta contrato visual: ${token}`);
}
assert.match(engine, /stationScaleScene \* 0\.87/, 'Falta reducción de escala de las megaplaformas');
assert.match(engine, /finishOrbitalMaterialsV5\(materials, resources, seedUint32\)/);
assert.match(engine, /finishOrbitalMaterialsV5\(materials, resources, ringSeed\)/);
assert.ok(system.includes('createSystemSceneArtificialSatelliteVisualV1'));
assert.ok(system.includes('createSystemSceneOrbitalStationVisualV1'));
assert.ok(system.includes('createSystemSceneOrbitalRingVisualV1'));
assert.ok(preview.includes('createSystemSceneArtificialSatelliteVisualV1'));
assert.ok(preview.includes('createSystemSceneOrbitalStationVisualV1'));
assert.ok(preview.includes('createSystemSceneOrbitalRingVisualV1'));
assert.ok(regression.includes('THREE.MeshStandardMaterial'));
console.log('VISCIV5_ORBITAL_METALLIC_PBR_AUDIT_PASSED');
