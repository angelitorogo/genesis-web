#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const checks = [
  {
    file: 'src/app/presentation/system/system-scene-artificial-satellites-visciv2.ts',
    includes: [
      'buildSystemSceneOrbitalStationPlansV1',
      'createSystemSceneOrbitalStationVisualV1',
      "tier !== 'VERY_ADVANCED'",
    ],
  },
  {
    file: 'src/app/presentation/system/system-scene.ts',
    includes: [
      'buildSystemSceneOrbitalStationPlansV1',
      'createSystemSceneOrbitalStationVisualV1',
      'orbital infrastructure',
    ],
  },
  {
    file: 'src/app/presentation/scientific-body-preview/scientific-body-preview.ts',
    includes: [
      'buildSystemSceneOrbitalStationPlansV1',
      'createSystemSceneOrbitalStationVisualV1',
      'orbital infrastructure',
    ],
  },
];

for (const check of checks) {
  const absolute = path.join(root, check.file);
  if (!fs.existsSync(absolute)) {
    throw new Error(`Falta archivo: ${check.file}`);
  }
  const content = fs.readFileSync(absolute, 'utf8');
  for (const token of check.includes) {
    if (!content.includes(token)) {
      throw new Error(`No se encontró "${token}" en ${check.file}`);
    }
  }
}

console.log('VISCIV3_ORBITAL_INFRASTRUCTURE_AUDIT_OK');
