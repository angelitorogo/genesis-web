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
  'paletteEntries',
  'buildWeightedVegetationPaletteEntriesV1',
  'blendHexColorsV1',
]);

mustContain('src/app/presentation/scientific/scientific-body-preview.ts', [
  'ScientificPlanetVegetationPalettePreviewEntry',
  'paletteEntries?:',
]);

mustContain('src/app/presentation/system/system-scene-planet-surface-texture.ts', [
  'SystemScenePlanetVegetationPaletteEntryV1',
  'resolveWeightedPaletteEntriesV1',
  'normalizeVegetationSpeciesColorV1',
  'rgbToHslV1',
  'hslToRgbV1',
  'selectVegetationToneV1',
]);

mustContain('src/app/presentation/system/system-scene-planet-surface-vegetation-visbio1d.spec.ts', [
  'procedural vegetation palette derived from species',
  'weighted palette dominance',
]);

console.log('VISBIO.1d audit passed');
