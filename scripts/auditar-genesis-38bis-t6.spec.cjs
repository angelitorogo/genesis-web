'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const sourceFile = 'src/app/presentation/system/system-scene-body-render-state.ts';
const source = read(sourceFile);
const emitted = ts.transpileModule(source, {
  fileName: sourceFile,
  reportDiagnostics: true,
  compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS},
});
assert.equal(emitted.diagnostics?.length ?? 0, 0);
const context = vm.createContext({exports: {}, Math, Number, Object, RangeError});
vm.runInContext(emitted.outputText, context, {timeout: 2500});
const api = context.exports;
let count = 0;
function check(actual, expected, tolerance = 1e-10) {
  count++;
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `Expected ${expected}, received ${actual} (tolerance ${tolerance})`);
}
const TAU = Math.PI * 2;
const advance = (a, b) => ((b - a) % TAU + TAU) % TAU;
const spin = Object.freeze({source: 'PLANET_19_3', rotationPeriodHours: 318.913,
  axialTiltDegrees: 1.59, epochPhaseDegrees: 18, isRetrograde: false, isSynchronized: true});
const timing = {epochSimulationDay: 73.25, playbackDaysPerRealSecond: 5};
check(api.SYSTEM_SCENE_SYNCHRONIZED_PLANET_DISPLAY_CYCLE_SECONDS_38BIS_T6, 240, 0);
const display = (seconds, sp = spin, t = timing) => api.systemSceneBodyDisplaySpinRadians(
  sp, t.epochSimulationDay + seconds * t.playbackDaysPerRealSecond, t,
);
for (const [seconds, radians] of [[1,TAU/240],[60,TAU/4],[180,TAU*0.75]]) {
  check(advance(display(0), display(seconds)), radians, 2e-10);
}
check(display(0), api.systemSceneBodySpinRadians(spin, timing.epochSimulationDay));
for (const rate of [1,5,100]) {
  const t={...timing, playbackDaysPerRealSecond:rate};
  check(advance(display(0,spin,t), display(25,spin,t)), TAU*25/240,2e-10);
}
const slow = {...timing, playbackDaysPerRealSecond:0.00001};
const physicallySlowAdvance=TAU * slow.playbackDaysPerRealSecond * 24 / spin.rotationPeriodHours;
count++;
assert.ok(advance(display(0,spin,slow),display(1,spin,slow)) <= physicallySlowAdvance+1e-11);
// Free planets still follow the pre-T6 30s ceiling, stars and moons keep their own contract.
const free={...spin,isSynchronized:false};
check(advance(display(0,free),display(1,free)),TAU/30,2e-10);
const unavailable={...spin,source:'UNAVAILABLE',rotationPeriodHours:null};
check(display(1,unavailable),api.systemSceneBodySpinRadians(unavailable,timing.epochSimulationDay));
count++;assert.equal(spin.isSynchronized,true);
count++;assert.equal(spin.rotationPeriodHours,318.913);
count++;assert.throws(()=>api.systemSceneBodyDisplaySpinRadians(spin,NaN,timing),RangeError);
count++;assert.throws(()=>api.systemSceneBodyDisplaySpinRadians(spin,74,{...timing,playbackDaysPerRealSecond:0}),RangeError);
const scene = read('src/app/presentation/system/system-scene.ts');
count++;assert.match(scene,/body\.kind\s*===\s*'moon'[\s\S]*?systemSceneBodyDisplaySpinRadians\(\s*body\.spin,\s*simulationDay,\s*snapshot\.simulation,/);
count++;assert.match(scene,/spinPivot\.add\(infra\.group\);/);
const fiche = read('src/app/presentation/scientific-body-preview/scientific-body-preview-planet-spin-38bis-t5.ts');
count++;assert.match(fiche,/SCIENTIFIC_PLANET_SYNCHRONIZED_PREVIEW_CYCLE_SECONDS_38BIS_T5 = 240/);
const newTest = read('src/app/presentation/system/system-scene-planet-synchronized-spin-38bis-t6.spec.ts');
count++;assert.match(newTest,/Chakos B-2/);
const modified = [sourceFile,
  'src/app/presentation/system/system-scene-body-render-state.spec.ts',
  'src/app/presentation/system/system-scene-planet-synchronized-spin-38bis-t6.spec.ts',
  'src/app/presentation/scientific-body-preview/scientific-body-preview-planet-spin-38bis-t5.spec.ts',
  'src/app/presentation/scientific-body-preview/scientific-body-preview-planet-spin-38bis-t5.ts'];
for(const file of modified){
  const report=ts.transpileModule(read(file),{fileName:file,reportDiagnostics:true,
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
  count++;assert.equal(report.diagnostics?.length??0,0,`TS syntax ${file}`);
}
console.log(`PASS 38.bis-T6: ${count} comprobaciones, SystemScene sincronizados <= 0,25 rpm, periodo físico intacto; fichas y lunas preservadas.`);
