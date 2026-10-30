const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.cwd();
const content = name => fs.readFileSync(path.join(root, name), 'utf8');
const cloud = content('src/app/presentation/system/system-scene-planet-surface-texture.ts');
const refinement = content('src/app/presentation/system/system-scene-planet-texture-refinement.ts');
const scene = content('src/app/presentation/system/system-scene.ts');
const tests = content('src/app/presentation/system/system-scene-planet-clouds-vis3d2f.spec.ts');
for(const token of ['buildCloudTexture(fields, cloudTarget, width, height, seed)', 'const envelope = smootherStep', 'rgba[offset + 3] = toByte(density * 222)', 'copySeamColumn(rgba, width, height)']) {
 assert.ok(cloud.includes(token), `Falta ${token} en la textura de nubes`);
}
assert.ok(refinement.includes("'WEATHER_CLOUD'"), 'No existe el modo de nubes meteorológicas');
assert.ok(refinement.includes('periodicCloudNoise01('), 'Falta ruido nuboso periódico');
assert.ok(scene.includes("semanticSurface.height, 'WEATHER_CLOUD'"), 'La escena no usa el refinamiento meteorológico');
assert.ok(/alphaTest:\s*0,/.test(scene), 'Los bordes aún usan un recorte alfa duro');
assert.ok(tests.includes('deterministic cloud seam'), 'Falta prueba de determinismo/costura');
console.log('VIS3D.2f — auditoría estructural OK');
