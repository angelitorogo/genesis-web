'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

function source(relativePath) {
  const fullPath = path.join(process.cwd(), relativePath);
  assert.ok(fs.existsSync(fullPath), `Falta ${relativePath}`);
  return fs.readFileSync(fullPath, 'utf8');
}

const card = source('src/app/presentation/planet-detail/planet-scientific-card.ts');
const texture = source('src/app/presentation/system/system-scene-planet-surface-texture.ts');

assert.doesNotMatch(card, /\bimport\s*\{[^}]*\bScientificPlanetVegetationPalettePreviewEntry\b/s,
  'No se debe importar un tipo auxiliar que pueda faltar en versiones previas del contrato');
assert.match(card, /buildWeightedVegetationPaletteEntriesV1\(/);
assert.match(card, /\): readonly \{ readonly hex: string; readonly weight01: number \}\[\] \{/);
assert.match(texture, /function normalizeVegetationSpeciesColorV1\([\s\S]*?fallback: readonly \[number, number, number\]/);
assert.match(texture, /resolveWeightedPaletteEntriesV1\(/);
assert.match(texture, /normalizeVegetationSpeciesColorV1\(/);
assert.match(texture, /function vegetationLatitudeEligibleV1\(/,
  'Debe conservarse la distribución geográfica de VISBIO.1c');

console.log('VISBIO.1d.1 hotfix TypeScript: auditoría de compatibilidad OK');
