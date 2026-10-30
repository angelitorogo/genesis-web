const fs = require('node:fs');
const path = require('node:path');

const requirements = new Map([
  ['src/app/presentation/system/system-scene-artificial-satellites-visciv2.ts', [
    'buildSystemSceneArtificialSatellitePlansV1',
    "'ADVANCED'", "'VERY_ADVANCED'",
  ]],
  ['src/app/presentation/system/system-scene.ts', [
    'artificialSatellitesVisibleSignal',
    'createArtificialSatelliteVisuals',
    'artificialSatelliteBindings.length =',
    'updateArtificialSatelliteLighting',
    'artificialSatelliteCount():',
  ]],
  ['src/app/presentation/system/system-scene.html', [
    'system-scene-layer-artificial-satellites',
    'SAT. ART. · {{ artificialSatelliteCount() }}',
  ]],
  ['src/app/presentation/scientific-body-preview/scientific-body-preview.ts', [
    'artificialSatellitesAvailable',
    'toggleArtificialSatellites',
    'createArtificialSatellites',
  ]],
  ['src/app/presentation/scientific-body-preview/scientific-body-preview.html', [
    'scientific-body-preview-artificial-satellites-toggle',
  ]],
]);

for (const [filename, tokens] of requirements.entries()) {
  const fullPath = path.join(process.cwd(), filename);
  if (!fs.existsSync(fullPath)) throw new Error(`Falta ${filename}; revisa la raíz de extracción`);
  const source = fs.readFileSync(fullPath, 'utf8');
  for (const token of tokens) {
    if (!source.includes(token)) throw new Error(`Falta ${token} en ${filename}`);
  }
}
console.log('VISCIV.2: archivos aplicados en la raíz, contratos estructurales correctos');
