const fs = require('fs');
const path = require('path');

function expectContains(file, snippets) {
  const content = fs.readFileSync(file, 'utf8');
  for (const snippet of snippets) {
    if (!content.includes(snippet)) {
      throw new Error(`Falta el fragmento requerido en ${file}: ${snippet}`);
    }
  }
}

const root = process.cwd();
const target = path.join(root, 'src', 'app', 'presentation', 'system');
expectContains(path.join(target, 'system-scene-planet-natural-geography-vissurf4.ts'), [
  'buildNaturalSolidPlanetSurfaceVISSURF4',
  'smoothVisualFieldVISSURF4',
  'signedDistanceVISSURF4',
]);
const scene = fs.readFileSync(path.join(target, 'system-scene.ts'), 'utf8');
if (!scene.includes('buildNaturalSolidPlanetSurfaceVISSURF4')) {
  expectContains(path.join(target, 'system-scene.ts'), [
    'buildCoherentSolidPlanetSurfaceVISSURF5',
    'GENESIS VISSURF.5 coherent normals',
  ]);
} else {
  expectContains(path.join(target, 'system-scene.ts'), [
    'buildNaturalSolidPlanetSurfaceVISSURF4',
    'GENESIS VISSURF.4 natural normals',
  ]);
}
console.log('AUDITORÍA VISSURF.4: PASS');
