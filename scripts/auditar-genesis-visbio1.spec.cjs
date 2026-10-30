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

mustContain(
  'src/app/presentation/planet-detail/planet-scientific-card.ts',
  [
    'resolvePlanetVegetationPreviewProfileV1',
    'confirmedBiologyVIDA9',
  ],
);

mustContain(
  'src/app/presentation/scientific/scientific-body-preview.ts',
  [
    'vegetationProfile',
  ],
);

mustContain(
  'src/app/presentation/system/system-scene-planet-surface-texture.ts',
  [
    'vegetationProfile',
    'vegetationSelectionScore',
    'vegetationColor',
  ],
);

mustContain(
  'src/app/presentation/system/system-scene.ts',
  [
    'visualVegetationProfile',
  ],
);

console.log('VISBIO.1 audit passed');
