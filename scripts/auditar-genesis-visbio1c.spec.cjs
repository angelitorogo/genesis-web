'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const root = process.cwd();
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const card = read('src/app/presentation/planet-detail/planet-scientific-card.ts');
const surface = read('src/app/presentation/system/system-scene-planet-surface-texture.ts');
const preview = read('src/app/presentation/scientific-body-preview/scientific-body-preview.ts');
const scene = read('src/app/presentation/system/system-scene.ts');
const model = read('src/app/presentation/scientific/scientific-body-preview.ts');
for (const token of [
  'resolvePlanetVegetationPreviewProfileV1', 'floraSpeciesCount.length',
  'coverage += 0.045', 'paletteHexes', 'Math.min(0.86, coverage)',
]) assert.ok(card.includes(token), `Falta perfil vegetal: ${token}`);
for (const token of [
  'vegetationLatitudeEligibleV1', 'selectRegionalVegetationV1',
  'vegetationProfile', 'buildVegetationPaletteColorsV1',
  'vegetatedSelected.has(field.uniqueIndex)',
]) assert.ok(surface.includes(token), `Falta máscara vegetal: ${token}`);
assert.ok(surface.indexOf('selectRegionalVegetationV1(\n') < surface.indexOf('const desertSelected = selectTop('),
  'La vegetación ha de preceder la selección de desiertos');
assert.ok(scene.includes('visualVegetationProfile'));
assert.ok(preview.includes('visualVegetationProfile:'));
assert.ok(model.includes('ScientificPlanetVegetationPreviewProfile'));
assert.ok(scene.includes('export interface SystemScenePlanetTextureDimensionsV1'));
console.log('VISBIO.1c: auditoría estructural OK');
