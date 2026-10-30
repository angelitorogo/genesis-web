'use strict';
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const files = {
  visibility: 'src/app/presentation/system/system-scene-artificial-orbit-guide-visibility-visciv5c.ts',
  runtime: 'src/app/presentation/system/system-scene.ts',
  test: 'src/app/presentation/system/system-scene-artificial-orbit-guide-visibility-visciv5c.spec.ts',
};
const sources = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, fs.readFileSync(path.join(root, file), 'utf8')]),
);
const ensure = (ok, message) => { if (!ok) throw new Error(message); };

ensure(sources.visibility.includes('layers.orbits ?? true'), 'Debe respetarse el control global ÓRBITAS');
ensure(sources.visibility.includes('layers.planets'), 'Debe respetarse la visibilidad del planeta');
ensure(sources.visibility.includes('layers.artificialSatellites'), 'Debe respetarse la capa SAT. ART.');
ensure(sources.runtime.includes('this.artificialSatelliteOrbitGuides.push(orbitLine)'), 'Falta registrar las trazas artificiales');
ensure(sources.runtime.includes('applySystemSceneArtificialOrbitGuideVisibilityV1(\n      this.artificialSatelliteOrbitGuides,\n      this.layerVisibility,'), 'Falta aplicar la visibilidad de guías');
ensure(sources.runtime.includes('this.artificialSatelliteOrbitGuides.length =\n      0'), 'Falta limpiar los registros de guías');
ensure(sources.runtime.includes('orbitMaterial: null'), 'Los anillos físicos deben mantenerse independientes de la traza');
ensure(sources.test.includes('constructedRing.visible'), 'Falta regresión sobre los anillos construidos');
console.log('VISCIV5C_ARTIFICIAL_ORBIT_GUIDES_OK');
