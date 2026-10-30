'use strict';
const fs = require('node:fs');
const path = require('node:path');

function read(relative) {
  return fs.readFileSync(path.join(process.cwd(), relative), 'utf8');
}
function requireMarker(text, marker, file) {
  if (!text.includes(marker)) {
    throw new Error(`Contrato ausente en ${file}: ${marker}`);
  }
}

const cacheFile = 'src/app/presentation/system/system-scene-civilization-cache-visciv1b.spec.ts';
const parityFile = 'src/app/presentation/system/system-scene-civilization-surface-parity-visciv1d.spec.ts';
const cache = read(cacheFile);
const parity = read(parityFile);
requireMarker(cache, 'type CivilizationCacheTestResource = Readonly<{', cacheFile);
requireMarker(cache, 'new SystemSceneBoundedResourceCacheV1<CivilizationCacheTestResource>(8, 8192)', cacheFile);
requireMarker(parity, 'vegetationProfile: vegetationProfile ?? undefined,', parityFile);

// Check that the production renderer is left untouched by this incremental.
const production = read('src/app/presentation/system/system-scene-planet-surface-texture.ts');
requireMarker(production, 'readonly vegetationProfile?: SystemScenePlanetVegetationProfileV1;', 'system-scene-planet-surface-texture.ts');
console.log('VISCIV.1e: contratos de tipos de los tests OK; renderer sin cambios.');
