const fs = require('fs');
const path = require('path');

const root = process.cwd();

function mustContain(file, expected) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) {
    throw new Error(`Falta el archivo requerido: ${file}`);
  }
  const text = fs.readFileSync(absolute, 'utf8');
  for (const token of expected) {
    if (!text.includes(token)) {
      throw new Error(`No se encontró la marca "${token}" en ${file}`);
    }
  }
}

mustContain('src/app/presentation/planet-detail/planet-scientific-card.ts', [
  'resolvePlanetVegetationPreviewProfileV1',
  'floraSpeciesCount',
  'paletteHexes',
  'lushness01',
]);

mustContain('src/app/presentation/scientific/scientific-body-preview.ts', [
  'ScientificPlanetVegetationPreviewProfile',
  'vegetationProfile',
]);

mustContain('src/app/presentation/system/system-scene.ts', [
  'visualVegetationProfile',
  'vegetationProfile:',
]);

mustContain('src/app/presentation/system/system-scene-planet-surface-texture.ts', [
  'SystemScenePlanetVegetationProfileV1',
  'buildVegetationPaletteColorsV1',
  'parseHexColorV1',
  'floraSpeciesCount',
]);

console.log('VISBIO.1b audit passed');
