'use strict';
const fs = require('fs');
const path = require('path');

const checks = [
  ['src/app/presentation/planet-detail/planet-scientific-card.ts', [
    "from './planet-vegetation-preview-profile-visbio'",
    'resolvePlanetVegetationPreviewProfileV1(',
  ]],
  ['src/app/presentation/planet-detail/planet-vegetation-preview-profile-visbio.ts', [
    'export function resolvePlanetVegetationPreviewProfileV1(',
    'coverageFraction01:',
    'paletteEntries:',
  ]],
  ['src/app/presentation/system/system-scene-civilization-visuals.data-source.ts', [
    "from '../planet-detail/planet-vegetation-preview-profile-visbio'",
    'extractConfirmedCivilization(',
    'vegetationProfile: resolvePlanetVegetationPreviewProfileV1(record, undefined)',
  ]],
  ['src/app/presentation/system/system-scene-civilization-visuals.ts', [
    'readonly vegetationProfile?',
    'visualVegetationProfile: vegetationProfile',
  ]],
  ['src/app/presentation/system/system-scene-snapshot.ts', [
    'readonly visualVegetationProfile?: SystemScenePlanetVegetationProfileV1 | null;',
  ]],
  ['src/app/presentation/system/system.ts', [
    'ReadonlyMap<string, SystemSceneCivilizationVisualRecord>',
    'decorateSystemSceneSnapshotWithCivilizationTiers(',
  ]],
  ['src/app/presentation/system/system-scene-civilization-surface-parity-visciv1d.spec.ts', [
    'generates exactly the same land mask',
    'detects the old divergence',
  ]],
];
for (const [filename, markers] of checks) {
  const pathname = path.join(process.cwd(), filename);
  if (!fs.existsSync(pathname)) throw new Error(`Archivo ausente: ${filename}`);
  const source = fs.readFileSync(pathname, 'utf8');
  for (const marker of markers) {
    if (!source.includes(marker)) throw new Error(`${filename}: no contiene ${marker}`);
  }
}
console.log('VISCIV.1d audit passed: perfil VISBIO compartido y mascara nocturna vinculada');
