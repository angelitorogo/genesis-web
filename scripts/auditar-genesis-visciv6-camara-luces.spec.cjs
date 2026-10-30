'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = process.cwd();
const cameraSource = 'src/app/presentation/system/system-scene-camera-controller.ts';
const shaderSource = 'src/app/presentation/system/system-scene-atmosphere-material.ts';

function loadPureExports(relativeFile) {
  const source = fs.readFileSync(path.join(root, relativeFile), 'utf8');
  const transformed = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.Node10,
    },
    reportDiagnostics: true,
  });
  const errors = transformed.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error) ?? [];
  assert.equal(errors.length, 0, `${relativeFile}: error de TypeScript`);
  const module = { exports: {} };
  const requireStub = specifier => {
    if (specifier === 'three') return {};
    if (specifier === 'three/addons/controls/OrbitControls.js') return { OrbitControls: class {} };
    throw new Error(`Import inesperado en auditoría: ${specifier}`);
  };
  const wrapper = vm.runInThisContext(
    `(function(require, module, exports) {\n${transformed.outputText}\n})`,
    { filename: relativeFile },
  );
  wrapper(requireStub, module, module.exports);
  return module.exports;
}

const camera = loadPureExports(cameraSource);
const shader = loadPureExports(shaderSource);
for (const extent of [4.8, 35, 280, 1000]) {
  assert.equal(camera.systemSceneCameraLimits(extent).minDistance, 0.08);
}
assert(Math.abs(camera.systemSceneTrackedBodyMinDistanceV1(0.04) - 0.0448) < 1e-8);
assert(Math.abs(camera.systemSceneTrackedBodyMinDistanceV1(0.3) - 0.336) < 1e-8);
assert(camera.systemSceneCameraLimits(280, true).minDistance < 0.08);

const fragment = '#include <common>\nvarying vec2 vMapUv;\nvec3 outgoingLight=vec3(1.0);\n#include <opaque_fragment>';
const civilized = shader.patchSystemSceneDayNightFragmentShaderV1(fragment, true);
const ordinary = shader.patchSystemSceneDayNightFragmentShaderV1(fragment);
assert(civilized.includes('genesisUrbanVisibility * 2.30'));
assert(civilized.includes('genesisPartialUrbanLight'));
assert(civilized.includes('genesisDayFactor2 * genesisWeight2'));
assert(!ordinary.includes('uGenesisCivilizationLights'));

function smoothstep(low, high, input) {
  const x = Math.max(0, Math.min(1, (input - low) / (high - low)));
  return x * x * (3 - 2 * x);
}
function visibility(day) {
  const deep = 1 - smoothstep(0.035, 0.18, day);
  const tail = 0.28 * (1 - smoothstep(0.18, 0.68, day)) * (1 - deep);
  return Math.max(0, Math.min(1, deep + tail));
}
assert.equal(visibility(0), 1);
assert(visibility(0.3) > 0 && visibility(0.3) < 0.3);
assert(visibility(0.5) > 0 && visibility(0.5) < 0.2);
assert.equal(visibility(0.68), 0);
assert.equal(visibility(1), 0);
console.log('VISCIV6_ZOOM_AND_MULTISTAR_CITY_LIGHTS_AUDIT_OK');
