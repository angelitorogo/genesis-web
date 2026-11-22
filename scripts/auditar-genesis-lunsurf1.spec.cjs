'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'src/app/presentation/system');
let checked = 0;
function ok(condition, message) { assert.ok(condition, message); checked++; }
require.extensions['.ts'] = (module, filename) => {
  const content = fs.readFileSync(filename, 'utf8');
  const result = ts.transpileModule(content, { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
  }, reportDiagnostics: true, fileName: filename });
  assert.equal((result.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0,
    'TypeScript syntactic error: ' + filename);
  module._compile(result.outputText, filename);
};
const { buildSystemSceneMoonPresentationV1: build } = require(path.join(source, 'system-scene-moon-presentation.ts'));
const { buildSystemSceneMoonTextureV1: texture } = require(path.join(source, 'system-scene-moon-texture.ts'));
const { buildMoonTangentNormalMapLUNSURF1: normals,
  moonMaterialRoughnessLUNSURF1: roughness,
  shouldUseMoonDetailLUNSURF1: focused } =
  require(path.join(source, 'system-scene-moon-surface-detail-lunsurf1.ts'));
function moon(icy) {
  return build({
    moonIdentity: icy ? 'AUDIT-LUNSURF1-ICE' : 'AUDIT-LUNSURF1-ROCK',
    hostPlanetType:'TERRESTRIAL', radiusEarth:0.12, massEarth:0.006,
    meanDensityGramsPerCubicCentimeter:3.2, surfaceGravityEarth:0.07,
    atmosphereRetentionIndex01:0, atmosphereRegime:'NONE', atmosphereScenarioPressurePascal:null,
    atmosphereScenarioSpecies:[], waterInventoryIndex01:icy?0.83:0.03,
    inferredIceRichnessIndex01:icy?0.96:0.10,
    subsurfaceOceanPotentialIndex01:0, surfaceLiquidWaterPotentialIndex01:0,
    waterRegime:icy?'SURFACE_ICE':'NONE', estimatedSurfaceTemperatureKelvin:icy?120:195,
    geologicalActivityIndex01:0.03, tidalHeatingIndex01:0, geologyRegime:'INERT',
    overallHabitabilityIndex01:0, isPotentiallyHabitable:false,
    giantHostSpecialization:false,giantCompositionRegime:icy?'ICE_RICH':'ROCK_RICH',
    isLargeGiantMoon:false,isTidallyActiveGiantMoon:false,isOceanBearingGiantMoonCandidate:false,
  });
}
for (const icy of [false,true]) {
  const m = moon(icy), before = JSON.stringify(m);
  const low = texture(m), a = texture(m,{width:512,height:256}), b = texture(m,{width:512,height:256});
  ok(low.width<=192 && low.normalRgba===null && low.roughnessRgba===null,'LOD distant stays native');
  ok(a.normalRgba.length===a.albedoRgba.length,'HD normal size');
  ok(a.roughnessRgba.length===a.albedoRgba.length,'HD roughness size');
  ok(Buffer.from(a.albedoRgba).equals(Buffer.from(b.albedoRgba)),'albedo deterministic');
  ok(Buffer.from(a.normalRgba).equals(Buffer.from(b.normalRgba)),'normal deterministic');
  ok(Buffer.from(a.roughnessRgba).equals(Buffer.from(b.roughnessRgba)),'roughness deterministic');
  ok(JSON.stringify(m)===before,'scientific immutable projection');
  let seam=true, nonflat=false;
  for(let y=0;y<a.height;y++)for(const field of ['albedoRgba','reliefRgba','normalRgba','roughnessRgba']) {
    const bytes=a[field], p=4*y*a.width, q=p+4*(a.width-1);
    if(!bytes.subarray(p,p+4).every((v,i)=>v===bytes[q+i]))seam=false;
  }
  ok(seam,'all atlases continuous at seam');
  for(let i=8;i<a.normalRgba.length;i+=4)if(a.normalRgba[i]!==128) {nonflat=true;break;}
  ok(nonflat,'normal map carries relief');
}
ok(roughness(moon(true),{iceMask01:1,liquidMask01:0,renewed01:0},0) <
   roughness(moon(false),{iceMask01:0,liquidMask01:0,renewed01:0},0), 'ice materially distinct');
ok(normals(new Uint8Array(8*4*4),8,4).length===128,'normal dimension contract');
ok(!focused(299,'m',null,null) && focused(300,'m',null,null),'HD focus threshold');
ok(focused(220,'m','m',null) && !focused(209,'m','m',null),'HD hysteresis');
ok(!focused(401,'m',null,450) && focused(460,'m',null,450),'single closest focus');
const scene = fs.readFileSync(path.join(source,'system-scene.ts'),'utf8');
ok(scene.includes('installFocusedLunarSurfaceLUNSURF1') &&
   scene.includes('releaseFocusedLunarSurfaceLUNSURF1'), 'focus resources release');
ok(scene.includes('lunarSurfaceFocusSourcesLUNSURF1.clear()'), 'focus source reset');
console.log(`LUNSURF.1 AUDITORÍA OK — ${checked} comprobaciones (roca y hielo, semilla, LOD, costuras).`);
