const fs = require('fs');
const path = require('path');

const root = process.cwd();
const file = path.join(root, 'src/app/presentation/system/system-scene.ts');
if (!fs.existsSync(file)) {
  throw new Error('Falta src/app/presentation/system/system-scene.ts');
}
const text = fs.readFileSync(file, 'utf8');
const required = [
  'const canonicalNightLightsAtlas = planet.visualCivilizationTier &&',
  "canonicalNightLightsAtlas.rgba",
  "GENESIS VISCIV.1c canonical civilization night lights",
];
for (const token of required) {
  if (!text.includes(token)) {
    throw new Error(`No se encontró la marca requerida: ${token}`);
  }
}
if (text.includes('downsampleSystemScenePlanetNightLightsV1(')) {
  throw new Error('La escena del sistema sigue downsampleando las luces nocturnas; debe usar el atlas canónico de la ficha.');
}
console.log('VISCIV.1c audit passed');
