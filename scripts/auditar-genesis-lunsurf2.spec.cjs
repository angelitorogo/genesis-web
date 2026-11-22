'use strict';
// Portable Node/TypeScript audit: no node_modules, WebGL or external libraries.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src/app/presentation/system');
let checks = 0;
function ok(test, name) { assert.ok(test, name); checks++; }
require.extensions['.ts'] = (module, filename) => {
  const result = ts.transpileModule(fs.readFileSync(filename,'utf8'), {fileName: filename,
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}, reportDiagnostics:true});
  assert.equal((result.diagnostics || []).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0,'Invalid TS '+filename);
  module._compile(result.outputText,filename);
};
const {buildSystemSceneMoonPresentationV1: project} = require(path.join(src,'system-scene-moon-presentation.ts'));
const {buildSystemSceneMoonTextureV1: atlas} = require(path.join(src,'system-scene-moon-texture.ts'));
const {interpretMoonHydricVisualLUNSURF2: interpret, sampleMoonHydricFaciesLUNSURF2: sample} =
  require(path.join(src,'system-scene-moon-hydric-facies-lunsurf2.ts'));
const testInput = {
  moonIdentity:'TRIPHER-IV-CANDIDATE-LUNSURF2', hostPlanetType:'GAS_GIANT',
  radiusEarth:0.275,massEarth:0.005,meanDensityGramsPerCubicCentimeter:1.36,
  surfaceGravityEarth:0.067,atmosphereRetentionIndex01:0.0,atmosphereRegime:'NONE',
  atmosphereScenarioPressurePascal:null,atmosphereScenarioSpecies:[],
  waterInventoryIndex01:0.9,inferredIceRichnessIndex01:0.85,
  subsurfaceOceanPotentialIndex01:0.4,surfaceLiquidWaterPotentialIndex01:1,
  waterRegime:'SURFACE_LIQUID',estimatedSurfaceTemperatureKelvin:311.3,
  geologicalActivityIndex01:0.74,tidalHeatingIndex01:0.97,geologyRegime:'EXTREME',
  overallHabitabilityIndex01:0,isPotentiallyHabitable:false,
  giantHostSpecialization:true, giantCompositionRegime:'ICE_RICH',
  isLargeGiantMoon:true,isTidallyActiveGiantMoon:true,isOceanBearingGiantMoonCandidate:true,
};
const warm = project(testInput), original = JSON.stringify(warm), classification=interpret(warm);
ok(classification.state==='POTENTIAL_ALTERED_MINERAL','Tripher-like warm uncertain -> mineral');
ok(classification.intensity01>.7,'non-trivial potential modulation strength');
ok(warm.presentationLiquidCoverage01===0,'unknown pressure cannot become ocean');
ok(warm.presentationIceCoverage01<=.05,'warm moon cannot grow global glaciers');
ok(!warm.presentationAtmospherePresent,'no invented atmosphere');
ok(warm.sourceSurfaceLiquidWaterPotentialIndex01===1,'potential stays scientific index not coverage');
const physical = {terrain01:.41,crater01:.3,scarp01:.14,renewed01:.3,province01:.4};
let positive=0, changedMin=1, changedMax=0;
for(let j=0;j<100;j++) {
  const lon=2*Math.PI*j/100, direction={x:Math.cos(lon),y:0,z:Math.sin(lon)};
  const a=sample(direction,warm,physical,classification);
  ok(a!==null,'hydric candidate can sample');
  if (a.blend01>0.005) positive++;
  changedMin=Math.min(changedMin,a.blend01);
  changedMax=Math.max(changedMax,a.blend01);
  ok(a.pigment.r>=a.pigment.g && a.pigment.g>=a.pigment.b,'no lake-blue pigment');
}
ok(positive>=12 && positive<100,'deposits spatially localised');
const dry=project({...testInput,moonIdentity:'LUNSURF2-DRY',
  surfaceLiquidWaterPotentialIndex01:0,waterInventoryIndex01:.01,waterRegime:'NONE'});
ok(interpret(dry).state==='NONE','dry stays dry');
ok(sample({x:1,y:0,z:0},dry,physical,interpret(dry))===null,'dry no added material');
const frozen=project({...testInput,moonIdentity:'LUNSURF2-ICE',
  estimatedSurfaceTemperatureKelvin:215,waterRegime:'SURFACE_ICE'});
ok(interpret(frozen).state==='POTENTIAL_COLD_DEPOSITS','cold potential -> partial volatile deposits');
const pressurised=project({...testInput,moonIdentity:'LUNSURF2-RESOLVED',
  estimatedSurfaceTemperatureKelvin:285,atmosphereRegime:'SUBSTANTIAL',
  atmosphereScenarioPressurePascal:40000,
  atmosphereScenarioSpecies:[{gas:'NITROGEN',moleFraction01:1}]});
ok(pressurised.presentationLiquidCoverage01>0,'B scenario physically supports liquid');
ok(interpret(pressurised).state==='SUPPORTED_LIQUID_SCENARIO','liquid scenario stays unclaimed observation');
const first=atlas(warm,{width:512,height:256});
const second=atlas(warm,{width:512,height:256});
for(const name of ['albedoRgba','reliefRgba','normalRgba','roughnessRgba']) {
  ok(Buffer.from(first[name]).equals(Buffer.from(second[name])),name+' determinism');
  for(let y=0;y<first.height;y++) {
    const l=4*y*first.width, r=l+4*(first.width-1);
    ok(Buffer.from(first[name].subarray(l,l+4)).equals(Buffer.from(first[name].subarray(r,r+4))),name+' seam');
  }
}
ok(JSON.stringify(warm)===original,'source immutable');
const small=atlas(warm);
ok(small.width<=192 && small.normalRgba===null && small.roughnessRgba===null,'distant moon LOD native');
const textureSource=fs.readFileSync(path.join(src,'system-scene-moon-texture.ts'),'utf8');
ok(textureSource.includes('sampleMoonHydricFaciesLUNSURF2') &&
   textureSource.includes('hydric?.roughnessDelta') ,'optical integration');
ok(!textureSource.includes('const exposedBasin = smoothstep(0.40, 0.83, t.liquidMask01)'),
  'D.3f impossible mask removed');
console.log('LUNSURF.2 AUDITORIA OK - '+checks+' verificaciones; campo regional '+positive+'/100 muestras, blend max '+changedMax.toFixed(3));
