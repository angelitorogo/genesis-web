#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = process.cwd();
const scenePath = path.join(root, 'src/app/presentation/life-species-visual/vida38-species-visual-preview-scene.ts');
const testPath = path.join(root, 'src/app/presentation/life-species-visual/vida38-species-visual-preview-scene.spec.ts');
for (const file of [scenePath, testPath]) {
  assert.ok(fs.existsSync(file), `No existe: ${path.relative(root, file)}`);
}
const scene = fs.readFileSync(scenePath, 'utf8');
const tests = fs.readFileSync(testPath, 'utf8');
for (const expected of [
  'function createHumanoidSpecialized(',
  'function organicRelief(',
  'function organicCapsuleGeometry(',
  'function createEarGeometry(',
  'new THREE.LatheGeometry(',
  "contract.morphology.group === 'HUMANOIDS'",
  'createHumanoidSpecialized(subject, contract, rng)',
]) {
  assert.ok(scene.includes(expected), `No se ha aplicado 38.2d en el código: falta ${expected}`);
}
assert.ok(tests.includes('especializa los humanoides con geometría orgánica continua'), 'No se ha actualizado el test 38.2d');
console.log('GENESIS_38_2D_APLICADO_OK');
console.log('Se verificaron los archivos reales en src/app/presentation/life-species-visual/');
