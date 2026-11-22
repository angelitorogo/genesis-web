'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const file = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
let assertions = 0;
function ok(value, message) { assertions++; assert.ok(value, message); }
function equal(actual, expected, message) { assertions++; assert.deepEqual(actual, expected, message); }
function getFunction(relative, functionName, extraContext={}) {
  const code = file(relative);
  const source = ts.createSourceFile(relative, code, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  const fn = source.statements.find(stmt => ts.isFunctionDeclaration(stmt) && stmt.name?.text === functionName);
  ok(fn, `Missing exported function ${functionName}`);
  const generated = ts.transpileModule(fn.getText(source), {
    compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS},
  }).outputText;
  const context = vm.createContext({exports:{}, Math, Object, Set, RangeError, ...extraContext});
  vm.runInContext(generated, context, {timeout: 1000});
  const result = context.exports[functionName] ?? context[functionName];
  ok(typeof result === 'function', `Cannot execute ${functionName}`);
  return result;
}
const atmosPath = 'src/app/presentation/system/system-scene-atmosphere-material.ts';
const atmos = file(atmosPath);
const geom = getFunction(atmosPath,'patchSystemSceneDayNightVertexShaderVISSURF6',{
  GLSL_COMMON_MARKER:'#include <common>',
  GLSL_DEFAULT_NORMAL_VERTEX_MARKER:'#include <defaultnormal_vertex>',
});
const vertex = geom('#include <common>\nvoid main(){\n#include <defaultnormal_vertex>\n}');
ok(vertex.includes('vGenesisGeometricNormalView = normalize(transformedNormal);'),'Missing geometry varying source');
const frag = getFunction(atmosPath, 'patchSystemSceneDayNightFragmentShaderV1', {
  GLSL_COMMON_MARKER:'#include <common>', GLSL_OPAQUE_MARKER:'#include <opaque_fragment>',
});
const output = frag('#include <common>\nvoid main(){\nvec3 normal=vec3(1.0);\n#include <opaque_fragment>\n}', true);
ok(output.includes('varying vec3 vGenesisGeometricNormalView;'),'Missing geometry varying sink');
ok(output.includes('dot(genesisGeometricNormal, normalize(uGenesisLightDirectionsView[0]))'),'Daylight still uses bump normals');
ok(output.includes('dot(genesisGeometricNormal, normalize(uGenesisOrbitalHomeDirectionsView[0]))'),'Native urban lights still use bump normals');
ok(!output.includes('dot(normalize(normal),'),'A terminator still uses bump normals');
ok(output.includes('genesisTwilightEnergy'),'Twilight removed');
const scientificPath = 'src/app/presentation/scientific/scientific-body-preview.ts';
const scientific = file(scientificPath);
ok(scientific.includes('stellarLightSources: resolvePreviewStellarLightSourcesVISSURF6(scene, source)'), 'Stellar data still civilization-gated');
ok(!scientific.includes('civilizationStarSources: nightCivilizationTier === null'), 'Civilization gating not removed');
const sources = getFunction(scientificPath,'buildPreviewStellarLightSourcesVISSURF6');
const stars = [
  {id:'a',position:{x:2,y:0,z:0},sourceLuminositySolar:4},
  {id:'b',position:{x:0,y:3,z:0},sourceLuminositySolar:9},
  {id:'c',position:{x:0,y:0,z:4},sourceLuminositySolar:4},
];
for (const count of [1,2,3]) {
  const result=sources(stars.slice(0,count),{x:0,y:0,z:0},new Set(['a','b']));
  equal(result.length,count,`Expected ${count} star sources`);
  ok(Math.abs(result.reduce((acc,s)=>acc+s.weight01,0)-1)<1e-9,'Star weights not normalized');
}
const result = sources(stars,{x:0,y:0,z:0},new Set(['a','b']));
ok(Math.abs(result[0].weight01-0.4)<1e-10,'SystemScene compressed flux mismatch');
ok(Math.abs(result[2].weight01-0.2)<1e-10,'SystemScene dim star flux mismatch');
const previewPath='src/app/presentation/scientific-body-preview/scientific-body-preview.ts';
const preview=file(previewPath);
ok(preview.includes('this.stellarLightBinding = appearance.lightBinding;'),'Planet light binding still gated');
ok(preview.includes('this.addLighting();\n      this.rebuildScene();'),'Lights not rebuilt on route changes');
ok(preview.includes('updatePreviewStellarLightBindingVISSURF6('),'Camera update helper not used');
const binding=file('src/app/presentation/scientific-body-preview/scientific-body-preview-stellar-binding-vissurf6.ts');
ok(binding.includes('cameraMatrixWorldInverse'),'Camera view matrix not used');
ok(binding.includes('homeFlags?.set(0, 0)'),'Home flags not reset');
const untouched=['src/app/presentation/system/system-scene-planet-material-composition-vissurf5d.ts',
 'src/app/presentation/system/system-scene-planet-coherent-geography-vissurf5.ts'];
for (const name of untouched) ok(fs.existsSync(path.join(root,name)),`Missing preserved VISSURF asset ${name}`);
const checkedFiles=[atmosPath,scientificPath,previewPath,
 'src/app/presentation/scientific-body-preview/scientific-body-preview-stellar-binding-vissurf6.ts',
 'src/app/presentation/system/system-scene-stellar-terminator-vissurf6.spec.ts',
 'src/app/presentation/scientific-body-preview/scientific-body-preview-stellar-binding-vissurf6.spec.ts',
 'src/app/presentation/scientific/scientific-body-preview-parity.spec.ts'];
for(const name of checkedFiles){
 const report=ts.transpileModule(file(name),{fileName:name,reportDiagnostics:true,
  compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
 equal(report.diagnostics.length,0,`TS syntax ${name}`);
}
console.log(`VISSURF.6 · AUDITORÍA PORTABLE PASS (${assertions} comprobaciones).`);
