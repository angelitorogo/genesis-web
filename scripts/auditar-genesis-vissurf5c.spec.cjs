const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const scene = fs.readFileSync(path.join(root, 'src/app/presentation/system/system-scene.ts'), 'utf8');
const moduleFile = path.join(root, 'src/app/presentation/system/system-scene-planet-render-pipeline-vissurf5c.ts');
const source = fs.readFileSync(moduleFile, 'utf8');

for (const required of [
  'readPlanetSurfaceRenderModeVISSURF5c',
  'calibrateSolidRoughnessForRendererVISSURF5c',
  'configureSolidSurfaceNormalDetailVISSURF5c',
  'prepareSolidSurfaceDataTextureVISSURF5c',
  'installSolidSurfaceDebugShaderVISSURF5c',
  'showPlanetOpticalLayerVISSURF5c',
  'buildCoherentSolidPlanetSurfaceVISSURF5',
]) assert.ok(scene.includes(required), `No está integrado: ${required}`);
assert.ok(scene.includes('showPlanetOpticalLayerVISSURF5c'),
  'El render de nubes/atmósfera debe distinguir los modos de diagnóstico');
assert.ok(scene.includes('cloudLayerMeshOrNull(') && scene.includes('atmosphereLayerMeshOrNull('),
  'La composición normal debe conservar sus capas');
assert.ok(scene.includes('installSystemSceneDayNightMaterialV1(') && scene.includes('installOrbitalSurfaceShadowVISCIV6n('),
  'No deben eliminarse las cadenas GLSL de día/noche y sombras orbitales');
const emitted = ts.transpileModule(source, {
  fileName: moduleFile,
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  reportDiagnostics: true,
});
assert.equal((emitted.diagnostics || []).filter(item => item.category === ts.DiagnosticCategory.Error).length, 0);
const moduleExports = {};
const fakeThree = { SRGBColorSpace: 'srgb', NoColorSpace: 'linear', LinearFilter: 1, LinearMipmapLinearFilter: 2 };
vm.runInNewContext(emitted.outputText, {
  exports: moduleExports,
  require: name => {
    if (name === 'three') return fakeThree;
    throw new Error(`Unexpected dependency: ${name}`);
  },
  URLSearchParams,
  Uint8Array,
  Math,
}, { filename: moduleFile });

assert.equal(moduleExports.readPlanetSurfaceRenderModeVISSURF5c(''), 'COMPOSITE');
assert.equal(moduleExports.readPlanetSurfaceRenderModeVISSURF5c('?genesisSurfaceDebug=surface'), 'SURFACE');
assert.equal(moduleExports.readPlanetSurfaceRenderModeVISSURF5c('?genesisSurfaceDebug=clouds'), 'CLOUDS');
assert.equal(moduleExports.readPlanetSurfaceRenderModeVISSURF5c('?genesisSurfaceDebug=atmosphere'), 'ATMOSPHERE');
assert.equal(moduleExports.readPlanetSurfaceRenderModeVISSURF5c('?genesisSurfaceDebug=albedo'), 'ALBEDO');
assert.equal(moduleExports.readPlanetSurfaceRenderModeVISSURF5c('?genesisSurfaceDebug=normals'), 'NORMALS');
assert.equal(moduleExports.readPlanetSurfaceRenderModeVISSURF5c('?genesisSurfaceDebug=roughness'), 'ROUGHNESS');
assert.equal(moduleExports.showPlanetOpticalLayerVISSURF5c('COMPOSITE', 'CLOUDS'), true);
assert.equal(moduleExports.showPlanetOpticalLayerVISSURF5c('SURFACE', 'CLOUDS'), false);
assert.equal(moduleExports.showPlanetOpticalLayerVISSURF5c('CLOUDS', 'ATMOSPHERE'), false);

const mask = Uint8Array.from([1, 3, 1, 2, 4, 5]);
const rough = Uint8Array.from([111,111,111,255, 150,150,150,255, 130,130,130,255,
  120,120,120,255, 185,185,185,255, 172,172,172,255]);
const expectedLand = rough.slice(4, 8);
const maskClone = mask.slice();
moduleExports.calibrateSolidRoughnessForRendererVISSURF5c(rough, mask);
assert.ok(rough[1] > 145 && rough[9] > 145, 'El agua debe dispersar más el reflejo');
assert.deepEqual(rough.slice(4, 8), expectedLand, 'No debe cambiar la rugosidad mineral');
assert.deepEqual(mask, maskClone, 'La máscara científica no cambia');
const material = {
  normalScale: { x: 0, y: 0, set(x, y) { this.x = x; this.y = y; } },
  bumpMap: 'bump',
  normalMap: null,
  onBeforeCompile() {},
  customProgramCacheKey() { return 'genesis-base'; },
  userData: {},
};
moduleExports.configureSolidSurfaceNormalDetailVISSURF5c(material, 'normal', 'bump');
assert.equal(material.normalMap, 'normal');
assert.equal(material.bumpMap, null);
assert.equal(material.normalScale.x, moduleExports.PLANET_SURFACE_NORMAL_STRENGTH_VISSURF5c);
const frag = 'void main() {\n#include <opaque_fragment>\n}';
assert.ok(moduleExports.patchSolidSurfaceDebugFragmentVISSURF5c(frag, 'ALBEDO').includes('outgoingLight = diffuseColor.rgb;'));
assert.ok(moduleExports.patchSolidSurfaceDebugFragmentVISSURF5c(frag, 'NORMALS').includes('normalize(normal)'));
assert.ok(moduleExports.patchSolidSurfaceDebugFragmentVISSURF5c(frag, 'ROUGHNESS').includes('roughnessFactor'));
assert.equal(moduleExports.patchSolidSurfaceDebugFragmentVISSURF5c(frag, 'COMPOSITE'), frag);
const texture = { colorSpace: 'initial', anisotropy: 1, generateMipmaps: false };
moduleExports.prepareSolidSurfaceDataTextureVISSURF5c(texture, 'NORMAL');
assert.equal(texture.colorSpace, 'linear');
assert.equal(texture.anisotropy, 4);
assert.equal(texture.generateMipmaps, true);
const colorTexture = { colorSpace: 'initial' };
moduleExports.prepareSolidSurfaceDataTextureVISSURF5c(colorTexture, 'COLOR');
assert.equal(colorTexture.colorSpace, 'srgb');
moduleExports.installSolidSurfaceDebugShaderVISSURF5c(material, 'ALBEDO');
assert.ok(material.customProgramCacheKey().includes('GENESIS-VISSURF-5c-ALBEDO'));
const shader = { fragmentShader: frag, uniforms: {} };
material.onBeforeCompile(shader, {});
assert.ok(shader.fragmentShader.includes('outgoingLight = diffuseColor.rgb;'));
console.log('VISSURF.5c: PASS — integración, diagnóstico, color/normal/roughness, máscara y shader');
