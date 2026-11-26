#!/usr/bin/env node
'use strict';
/** GENESIS MOONCAD.2 — Node auditor for 12–30 s visual-only lunar periods. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const paths = {
  cadence: 'src/app/presentation/system/system-scene-secondary-motion.ts',
  preview: 'src/app/presentation/scientific-body-preview/scientific-body-preview.ts',
  single: 'src/app/presentation/system/system-scene-snapshot.ts',
  multihost: 'src/app/presentation/system/system-scene-multihost-composition.ts',
  circumbinary: 'src/app/presentation/system/system-scene-multihost-circumbinary-projection.ts',
  compact: 'src/app/presentation/system/system-compact-host-secondary-scene.ts',
  tests: 'src/app/presentation/system/system-scene-moon-cadence-2.spec.ts',
  orbital: 'src/app/simulation/orbital/system-orbital-motion-engine.ts',
};
const source = Object.fromEntries(Object.entries(paths)
  .map(([key, file]) => [key, fs.readFileSync(path.join(root, file), 'utf8')]));
let checks = 0;
function ok(condition, message) { assert.ok(condition, message); checks++; }
function near(actual, expected, message) {
  ok(Number.isFinite(actual) && Math.abs(actual - expected) <=
    1e-10 * Math.max(1, Math.abs(actual), Math.abs(expected)), message);
}
function load(name) {
  const file = paths[name];
  const parse = ts.createSourceFile(file, source[name], ts.ScriptTarget.Latest, true);
  ok(parse.parseDiagnostics.length === 0, `${name}: syntax TypeScript`);
  const transformed = ts.transpileModule(source[name], {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  ok(!(transformed.diagnostics ?? []).some(d => d.category === ts.DiagnosticCategory.Error),
    `${name}: TypeScript transform`);
  const module = { exports: {} };
  new Function('require', 'module', 'exports', transformed.outputText)(
    dep => { throw Error(`Unexpected dependency from ${name}: ${dep}`); },
    module, module.exports,
  );
  return module.exports;
}
const c = load('cadence');
const orbital = load('orbital');
ok(c.SCIENTIFIC_MOON_MIN_CYCLE_REAL_SECONDS_V2 === 12, '12-second min');
ok(c.SCIENTIFIC_MOON_MAX_CYCLE_REAL_SECONDS_V2 === 30, '30-second max');
const axes = Object.freeze([0.003, 0.008, 0.04]);
const cycles = axes.map(axis => c.scientificMoonOrbitCycleRealSecondsV2(axis, axes));
ok(JSON.stringify(cycles) === JSON.stringify([12, 21, 30]), '3 moons 12/21/30');
ok(c.scientificMoonOrbitCycleRealSecondsV2(4, [4]) === 21, 'single moon 21');
ok(JSON.stringify([1,2,3,4,5].map(a => c.scientificMoonOrbitCycleRealSecondsV2(a, [1,2,3,4,5]))) ===
  JSON.stringify([12,16.5,21,25.5,30]), 'five moons evenly ranked');
ok(c.scientificMoonOrbitCycleRealSecondsV2(0.008, [...axes].reverse()) === 21,
  'focus/order independent');
ok(c.scientificMoonOrbitCycleRealSecondsV2(0.003, [0.003,0.003,0.04]) === 12,
  'equal radii share speed');
ok(JSON.stringify(axes) === JSON.stringify([0.003, 0.008, 0.04]),
  'group input immutable');
for (const [axis, period, cycle] of [[0.003, 0.001, 12], [0.008, 38, 21], [0.04, 500, 30]]) {
  const previewRate = c.scientificMoonDaysPerRealSecondV2(period, axis, axes);
  near(period / previewRate, cycle, `preview ${cycle}s`);
  for (const playback of [0.01, 1, 60, 4000]) {
    const scale = c.systemSceneMoonPresentationTimeScaleV2(period, axis, axes, playback);
    near(scale * playback, previewRate, `host-independent rate playback=${playback}`);
    near(period / (scale * playback), cycle, `cycle ${cycle}s playback=${playback}`);
  }
}
for (const [axis, period] of [[0.003,0.001], [0.008,38], [0.04,500]]) {
  const motion = Object.freeze({ id: 'm', semiMajorAxisAu: axis, eccentricity: 0.31,
    periodDays: period, rotationDegrees: 22, inclinationDegrees: 14, epochMeanAnomalyDegrees: 51 });
  const before = JSON.stringify(motion);
  const ficheRate = c.scientificMoonDaysPerRealSecondV2(period, axis, axes);
  const sceneScale = c.systemSceneMoonPresentationTimeScaleV2(period, axis, axes, 500);
  for (const realSeconds of [0,0.2,1,4,12,21,30,61]) {
    const f = orbital.SystemOrbitalMotionEngine.positionAtSimulationDay(motion,
      realSeconds * ficheRate);
    const s = orbital.SystemOrbitalMotionEngine.positionAtSimulationDay(motion,
      realSeconds * 500 * sceneScale);
    near(f.xAu,s.xAu,'Kepler x parity');
    near(f.yAu,s.yAu,'Kepler y parity');
    near(f.zAu,s.zAu,'Kepler z parity');
  }
  ok(JSON.stringify(motion) === before, 'physical elements unchanged');
}
for (const invalid of [0,-1,Number.NaN,Infinity]) {
  assert.throws(() => c.scientificMoonOrbitCycleRealSecondsV2(invalid,[1]), RangeError); checks++;
}
assert.throws(() => c.scientificMoonOrbitCycleRealSecondsV2(1,[]),RangeError); checks++;
assert.throws(() => c.scientificMoonOrbitCycleRealSecondsV2(2,[1]),RangeError); checks++;
assert.throws(() => c.systemSceneMoonPresentationTimeScaleV2(1,1,[1],0),RangeError); checks++;
for (const [key, tokens] of Object.entries({
  preview: ['scientificMoonDaysPerRealSecondV3(', 'binding.orbitalDaysPerRealSecond', 'this.localOrbitEpochSimulationDay'],
  single: ['systemSceneMoonPresentationTimeScaleV3(', 'moon.orbit.semiMajorAxisKilometers'],
  multihost: ['axesByPlanetId.get(moon.hostPlanetId)', 'moonCadenceByMotionId.get(part.motionId)'],
  circumbinary: ['systemSceneMoonPresentationTimeScaleV3(', 'moon.orbit.semiMajorAxisKilometers'],
  compact: ['systemSceneMoonPresentationTimeScaleV3(', 'axesByHost.get(moon.parentPlanetOrdinal)'],
  tests: ['paridad Kepleriana', '12–30 s'],
})) {
  const parsed = ts.createSourceFile(paths[key], source[key], ts.ScriptTarget.Latest, true);
  ok(parsed.parseDiagnostics.length === 0, `${key}: TypeScript syntax`);
  for (const token of tokens) ok(source[key].includes(token), `${key}: ${token}`);
}
ok(source.single.includes('systemSceneMinorBodyPresentationTimeScale('),
  'minor body speeds not touched');
ok(source.multihost.includes('v2PlanetTimeScale('), 'planet speeds not touched');
console.log(`PASS GENESIS MOONCAD.2 — ${checks} comprobaciones · 12–30 s, variantes orbitales, ficha/escena, Kepler, reloj y datos inmutables`);
