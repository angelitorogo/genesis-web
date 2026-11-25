#!/usr/bin/env node
'use strict';
// GENESIS VISCORB.1b — portable audit. Requires the project's local TypeScript.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const prefix = 'src/app/presentation/system/';
let count = 0;
const check = (value, label) => { assert.ok(value, label); count++; };
const source = fs.readFileSync(path.join(root, prefix, 'viscorb-local-orbit-projection.ts'), 'utf8');
const system = fs.readFileSync(path.join(root, prefix, 'viscorb-system-local-presentation.ts'), 'utf8');
const specs = [
  fs.readFileSync(path.join(root, prefix, 'viscorb-local-orbit-projection.spec.ts'), 'utf8'),
  fs.readFileSync(path.join(root, prefix, 'viscorb-local-orbit-projection-1b.spec.ts'), 'utf8'),
];
for (const [name, code] of [['projection', source], ['system', system], ['previous spec', specs[0]], ['1b spec', specs[1]]]) {
  const sf = ts.createSourceFile(name + '.ts', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  check(sf.parseDiagnostics.length === 0, `${name}: sintaxis válida`);
}
const js = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod = {exports:{}};
new Function('module','exports',js)(mod,mod.exports);
const {viscorbLocalOrbitLayoutV1,viscorbPresentedMoonRadiusV1,viscorbMoonOrbitPresentationScaleV1} = mod.exports;
const scenarios = [
  [{periapsisPlanetRadii:3,apoapsisPlanetRadii:5,radiusEarth:.25},{periapsisPlanetRadii:7,apoapsisPlanetRadii:12,radiusEarth:.12}],
  [{periapsisPlanetRadii:2,apoapsisPlanetRadii:3,radiusEarth:.2}],
  [{periapsisPlanetRadii:3,apoapsisPlanetRadii:4,radiusEarth:.3},{periapsisPlanetRadii:25,apoapsisPlanetRadii:50,radiusEarth:.04}],
];
for (const moons of scenarios) {
  const original = JSON.stringify(moons);
  const plan = viscorbLocalOrbitLayoutV1(moons);
  check(plan !== null, 'layout válido');
  const previousMaximum = Math.min(.145,Math.max(.052,plan.planetRadius*.21));
  for (const radiusEarth of [...moons.map(m=>m.radiusEarth), .0001]) {
    const previous = Math.max(.022,previousMaximum*radiusEarth/plan.maximumMoonRadiusEarth);
    const current = viscorbPresentedMoonRadiusV1(plan,radiusEarth);
    check(Math.abs(current-previous*.85)<1e-12,'exacto -15% sobre VISCORB.1a');
  }
  check(Math.abs(plan.maximumDisplayedMoonRadius - previousMaximum*.85)<1e-12, 'máximo también -15%');
  check(Math.abs(viscorbMoonOrbitPresentationScaleV1(plan) - plan.scenePerPlanetRadius/plan.planetRadius)<1e-12,'órbitas intactas');
  check(JSON.stringify(moons)===original,'parámetros científicos intactos');
}
check(Math.abs(.102-.12*.85)<1e-12,'mínimo SystemScene escalado');
check(Math.abs(5.1-6*.85)<1e-12,'máximo SystemScene escalado');
check(system.includes('sizeScale: Math.max(0.102, Math.min(5.1,'),'escala local de SystemScene comparte reducción');
check(specs[1].includes('previousMoonRadius1a'),'regresión VISCORB.1a explícita');
check(source.includes('LOCAL_MOON_READABILITY_FLOOR_VISCORB1B'),'mínimo del helper actualizado');
check(!source.includes('LOCAL_MOON_READABILITY_FLOOR_VISCORB1A'),'sin constantes anteriores activas');
console.log(`PASS GENESIS VISCORB.1b — ${count} comprobaciones portátiles · reducción adicional exacta del 15 %, órbitas y paridad`);
