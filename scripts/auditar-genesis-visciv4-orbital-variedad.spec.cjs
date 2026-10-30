'use strict';
const fs = require('node:fs');
const path = require('node:path');

const checks = new Map([
  ['src/app/presentation/system/system-scene-artificial-satellites-visciv2.ts', [
    'buildSystemSceneOrbitalInfrastructureProfileV1',
    'buildSystemSceneOrbitalRingPlansV1',
    'createSystemSceneOrbitalRingVisualV1',
    'createSpecializedOrbitalStationVisualV1',
    "profileId: 'DOUBLE_RING'",
    "profileId: 'PLATFORM'",
  ]],
  ['src/app/presentation/system/system-scene.ts', [
    'createSystemSceneOrbitalRingVisualV1',
    'buildSystemSceneOrbitalRingPlansV1',
    'ringVisual.rotationPivot',
  ]],
  ['src/app/presentation/scientific-body-preview/scientific-body-preview.ts', [
    'createSystemSceneOrbitalRingVisualV1',
    'buildSystemSceneOrbitalRingPlansV1',
    'ringVisual.rotationPivot',
  ]],
  ['src/app/presentation/system/system-scene-orbital-infrastructure-visciv4.spec.ts', [
    'realmente concéntricos',
    'no impone la misma infraestructura',
  ]],
]);
for (const [filename, tokens] of checks) {
  const file = path.join(process.cwd(), filename);
  if (!fs.existsSync(file)) throw new Error(`Falta: ${filename}`);
  const content = fs.readFileSync(file, 'utf8');
  for (const token of tokens) {
    if (!content.includes(token)) throw new Error(`Falta marca: ${token} en ${filename}`);
  }
}
console.log('VISCIV4_ORBITAL_VARIETY_AUDIT_OK');
