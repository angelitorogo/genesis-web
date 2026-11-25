#!/usr/bin/env node
'use strict';
/** LOD2.1 — Portable Node audit, no WebGL or Angular test runner needed. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const sys = path.join(root, 'src/app/presentation/system');
let passed = 0;
function check(name, test) { try { test(); passed++; } catch (error) {console.error('FAIL '+name); throw error;} }
require.extensions['.ts'] = (module, filename) => {
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    reportDiagnostics: true,
  });
  assert.equal(code.diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);
  module._compile(code.outputText, filename);
};
const {giantAtmosphereFocusWidthVISCATM1:focused, refineGiantAtmosphereMultiresVISCATM1:refine,
  GIANT_ATMOSPHERE_DETAIL_VERSION_VISCATM1:version} = require(path.join(sys,'system-scene-giant-atmosphere-multires-viscatm1.ts'));
const {PLANET_TEXTURE_DETAIL_SIZES_V1:sizes} = require(path.join(sys,'system-scene-planet-texture-refinement.ts'));
const scene = fs.readFileSync(path.join(sys,'system-scene.ts'),'utf8');
check('atlas global 256',()=>assert.equal(sizes.distant.width,256));
check('atlas cercano sólidos y gaseosos 512',()=>assert.equal(sizes.closeSystem.width,512));
for(const current of [null,512,1024]) {
  for(const diameter of [0,210,299,300,350,370,390,500,1500]) {
    check(`foco constante ${current}/${diameter}`,()=>assert.equal(focused(diameter,current),512));
  }
}
check('diámetro inválido',()=>assert.throws(()=>focused(NaN,null),RangeError));
check('anchura previa inválida',()=>assert.throws(()=>focused(350,4096),RangeError));
check('preserva versión científica del generador',()=>assert.equal(version,3));
check('candidato con histéresis global sigue limitado a uno',()=>{
  assert(scene.includes('closestPlanet.projectedDiameter >= (previous?.id === closestPlanet.id ? 210 : 300)'));
  assert(scene.includes('this.installDetailedPlanetTexture(candidate.id, candidate.binding, detailWidth)'));
  assert(scene.includes('previous.detailWidth !== detailWidth'));
});
check('un único detalle gaseoso por foco',()=>{
  assert(scene.includes('giantAtmosphereFocusWidthVISCATM1(candidate!.projectedDiameter'));
  assert(scene.includes('this.releaseDetailedPlanetTexture()'));
});
check('revertido experimento LODMAX',()=>{
  assert(!scene.includes('maxLodExperimentV1'));
  assert(!scene.includes('activateMaxLodExperimentV1'));
  assert(!scene.includes('system-scene-max-lod-experiment'));
});
check('no se alteró la escala de otros planetas',()=>{
  assert(scene.includes('PLANET_TEXTURE_DETAIL_SIZES_V1.closeSystem.width'));
  assert(scene.includes('SOLID_PLANET_DETAIL_WIDTH_VISSURF2.closeSystem'));
});
check('atlas científico 1024 sigue disponible',()=>{
  assert.equal(sizes.scientificPreview.width,1024);
  assert.equal(typeof refine,'function');
});
console.log(`PASS GENESIS LOD2.1 — ${passed} comprobaciones: 256/512, reversión LODMAX, histéresis y compatibilidad.`);
