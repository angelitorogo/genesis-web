'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const cwd = process.cwd();
function file(relative) {
  const location = path.join(cwd, relative);
  assert(fs.existsSync(location), `Falta el archivo: ${relative}`);
  return fs.readFileSync(location, 'utf8');
}
const generator = file('src/app/presentation/system/system-scene-artificial-satellites-visciv2.ts');
const scene = file('src/app/presentation/system/system-scene.ts');
const preview = file('src/app/presentation/scientific-body-preview/scientific-body-preview.ts');
const test = file('src/app/presentation/system/system-scene-artificial-satellite-visual-visciv2c.spec.ts');
for (const symbol of [
  'export function createSystemSceneArtificialSatelliteVisualV1(',
  'export interface SystemSceneArtificialSatelliteMaterialBindingV1',
]) {
  assert(generator.includes(symbol), `No se encuentra la exportación: ${symbol}`);
}
assert(scene.includes('readonly resources: readonly { dispose(): void }[];'), 'SystemScene debe aceptar recursos desechables, no solo Material');
assert(scene.includes('const resources: Array<{ dispose(): void }> = [];'), 'La lista de recursos debe aceptar materiales y geometrías');
assert(scene.includes('createSystemSceneArtificialSatelliteVisualV1('), 'SystemScene no utiliza el constructor nuevo');
assert(preview.includes('createSystemSceneArtificialSatelliteVisualV1('), 'La ficha no utiliza el constructor nuevo');
assert(generator.includes('new THREE.BoxGeometry('), 'El satélite no está compuesto de elementos rectangulares');
assert(!generator.includes('new THREE.SphereGeometry('), 'Se sigue usando geometría esférica');
assert(test.includes('transparent === false'), 'Falta la prueba de opacidad');
console.log('VISCIV.2c: exports, contratos, renderizador opaco y tests — OK');
