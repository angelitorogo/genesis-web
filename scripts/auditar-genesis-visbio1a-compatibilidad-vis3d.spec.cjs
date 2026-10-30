'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.cwd();
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const scene = read('src/app/presentation/system/system-scene.ts');
const preview = read('src/app/presentation/scientific-body-preview/scientific-body-preview.ts');
const semantic = read('src/app/presentation/system/system-scene-planet-surface-texture.ts');
const card = read('src/app/presentation/planet-detail/planet-scientific-card.ts');
const assertIncludes = (text, needle) => assert.ok(text.includes(needle), `Falta: ${needle}`);
for (const needle of [
  'export interface SystemScenePlanetTextureDimensionsV1',
  'textureDimensions: number | SystemScenePlanetTextureDimensionsV1',
  'const textureWidth = typeof textureDimensions',
  'refinePlanetRgbaTextureV1',
  'visualVegetationProfile',
  'vegetationProfile:',
]) assertIncludes(scene, needle);
for (const needle of [
  'type SystemScenePlanetTextureDimensionsV1',
  'SCIENTIFIC_PREVIEW_PLANET_TEXTURE_BALANCED',
  'visualVegetationProfile:',
]) assertIncludes(preview, needle);
assertIncludes(semantic, 'vegetationSelectionScore');
assertIncludes(card, 'resolvePlanetVegetationPreviewProfileV1');
assertIncludes(scene, "refine(semanticSurface.cloudRgba, semanticSurface.width, semanticSurface.height, 'CLOUD')");
console.log('VISBIO.1a / VIS3D.1–2d: CONTRATO Y ALCANCE OK');
