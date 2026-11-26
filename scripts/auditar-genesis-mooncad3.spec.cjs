#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const paths = {
  motion: 'src/app/presentation/system/system-scene-secondary-motion.ts',
  fiche: 'src/app/presentation/scientific-body-preview/scientific-body-preview.ts',
  single: 'src/app/presentation/system/system-scene-snapshot.ts',
  multihost: 'src/app/presentation/system/system-scene-multihost-composition.ts',
  circumbinary: 'src/app/presentation/system/system-scene-multihost-circumbinary-projection.ts',
  compact: 'src/app/presentation/system/system-compact-host-secondary-scene.ts',
  spec: 'src/app/presentation/system/system-scene-moon-cadence-3.spec.ts',
};
let checks = 0;
const check = (truth, description) => { assert.ok(truth, description); checks++; };
const source = {};
for (const [key, file] of Object.entries(paths)) {
  const code = fs.readFileSync(path.join(root, file), 'utf8');
  source[key] = code;
  const parsed = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true);
  check(!parsed.parseDiagnostics.length, `${key}: TS sintaxis`);
}
const transpiled = ts.transpileModule(source.motion, {
  fileName: paths.motion, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  reportDiagnostics: true,
});
check(!transpiled.diagnostics?.some(d => d.category === ts.DiagnosticCategory.Error), 'transpilación contrato');
const m = { exports: {} };
new Function('exports','module',transpiled.outputText)(m.exports,m);
const c = m.exports;
check(c.SCIENTIFIC_MOON_INNER_MIN_CYCLE_REAL_SECONDS_V3 === 30, 'luna interior mínima 30 s');
check(c.SCIENTIFIC_MOON_OUTER_MIN_CYCLE_REAL_SECONDS_V3 === 120, 'luna exterior mínima 120 s');
check(c.SCIENTIFIC_MOON_SINGLE_MIN_CYCLE_REAL_SECONDS_V3 === 60, 'luna única mínima 60 s');
const groups = [[1],[1,2],[1,2,3],[1,5,20],[1,1,3],[.01,.04,.2,2]];
for (const axes of groups) {
  for (const a of new Set(axes)) {
    for (const e of [0,0.11,0.45,0.9]) {
      const T=c.scientificMoonOrbitCycleRealSecondsV3(a,axes,e);
      check(T>=30 && Number.isFinite(T),'período acotado por abajo');
      check(2*Math.PI*a/T*Math.sqrt((1+e)/(1-e)) <= 2*Math.PI*Math.min(...axes)/30*(1+1e-12),
        'velocidad tangencial máxima preservada incluso periapsis');
      for (const playback of [1,24,1000]) {
        const p=3+a*17;
        const rate=c.scientificMoonDaysPerRealSecondV3(p,a,axes,e);
        const scale=c.systemSceneMoonPresentationTimeScaleV3(p,a,axes,playback,e);
        check(Math.abs(rate-playback*scale) < Math.max(1,rate)*1e-12, 'paridad ficha/escena');
        check(Math.abs(p/rate-T) < Math.max(1,T)*1e-12, 'revolución temporal real');
      }
    }
  }
}
check(JSON.stringify([1,2,3].map(a=>c.scientificMoonOrbitCycleRealSecondsV3(a,[1,2,3],0)))===
  JSON.stringify([30,75,120]),'3 lunas 30/75/120');
check(JSON.stringify([1,5,20].map(a=>c.scientificMoonOrbitCycleRealSecondsV3(a,[1,5,20],0)))===
  JSON.stringify([30,150,600]),'radio exterior grande desacelerado');
for (const [key,token,ecctoken] of [
  ['fiche','scientificMoonDaysPerRealSecondV3(', 'moon.orbit.eccentricity'],
  ['single','systemSceneMoonPresentationTimeScaleV3(', 'moon.orbit.eccentricity'],
  ['multihost','systemSceneMoonPresentationTimeScaleV3(', 'motion.eccentricity'],
  ['circumbinary','systemSceneMoonPresentationTimeScaleV3(', 'moon.orbit.eccentricity'],
  ['compact','systemSceneMoonPresentationTimeScaleV3(', 'moon.eccentricity'],
]) {
  check(source[key].includes(token),`${key} usa contrato V3`);
  check(source[key].includes(ecctoken),`${key} utiliza excentricidad científica`);
}
check(source.motion.includes('scientificMoonOrbitCycleRealSecondsV2('), 'API V2 histórica intacta');
check(source.motion.includes('systemSceneMoonGroupPresentationTimeScaleV1('), 'API V1 histórica intacta');
check(source.single.includes('systemSceneMinorBodyPresentationTimeScale('),'otros cuerpos mantienen cadencia');
console.log(`PASS GENESIS MOONCAD.3 — ${checks} comprobaciones; velocidad lineal, excentricidad, ficha/escena y compatibilidad`);
