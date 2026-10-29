'use strict';

// Complemento estructural portable a los tests Vitest de VIS3D.2e.
// Comprueba la segregación entre ficha detallada y SystemScene sin lanzar WebGL.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const preview = read('src/app/presentation/scientific-body-preview/scientific-body-preview.ts');
const atlas = read('src/app/presentation/scientific-body-preview/scientific-minor-body-texture-vis3d2e.ts');
const moonTexture = read('src/app/presentation/system/system-scene-moon-texture.ts');
const moonRenderer = read('src/app/presentation/system/system-scene-moon-renderable.ts');
const scene = read('src/app/presentation/system/system-scene.ts');

assert.match(atlas, /width:\s*1024/);
assert.match(atlas, /height:\s*512/);
for (const kind of ['ASTEROID', 'COMET', 'TNO', 'CAPTURED']) {
  assert.ok(atlas.includes(`'${kind}'`), `Falta ${kind}`);
  assert.ok(preview.includes(`'${kind}'`), `Falta llamada de ficha para ${kind}`);
}
assert.ok(preview.includes('this.model.primary.moonOrdinal === moon.moonOrdinal'));
assert.ok(preview.includes('SCIENTIFIC_BODY_TEXTURE_VIS3D2E'));
assert.ok(preview.includes('attachScientificMinorBodyAtlasVis3d2e'));
assert.ok(moonTexture.includes('dimensions?.width'));
assert.ok(moonRenderer.includes('textureDimensions: SystemSceneMoonTextureDimensionsV1 | null = null'));
assert.ok(moonRenderer.includes('dimensions === null ? \'SYSTEM_SCENE\''));
assert.ok(!scene.includes('VIS3D2e') && !scene.includes('vis3d2e'), 'SystemScene no debe depender del atlas de ficha');
assert.ok(atlas.includes('texture.generateMipmaps = true'));
assert.ok(atlas.includes('texture.wrapS = THREE.RepeatWrapping'));
console.log('VIS3D2E_SCOPE_PASSED: 5 tipos, 1024x512, ficha aislada de SystemScene');
