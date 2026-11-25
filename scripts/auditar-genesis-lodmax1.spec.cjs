'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const rel = 'src/app/presentation/system/';
const main = fs.readFileSync(path.join(root, rel, 'system-scene.ts'), 'utf8');
const helper = fs.readFileSync(path.join(root, rel, 'system-scene-max-lod-experiment.ts'), 'utf8');
let typescript;
try { typescript = require('typescript'); } catch { /* Optional: static checks still run. */ }
let checks = 0;
function check(test, message) { assert.ok(test, message); checks++; }
function has(pattern, title) { check(pattern.test(main), title); }
if (typescript) {
  for (const [name, source] of [['SystemScene', main], ['Config', helper]]) {
    const parsed = typescript.createSourceFile(name + '.ts', source, typescript.ScriptTarget.Latest, true, typescript.ScriptKind.TS);
    check(parsed.parseDiagnostics.length === 0, name + ' syntax must be valid TypeScript');
  }
}
const context = { exports: {}, URLSearchParams, RangeError, Object, Number };
vm.runInNewContext(helper.replace(/export\s+/g, '' ).replace(/:\s*(?:string|number|boolean)(?=\s*[,\){])/g, '') +
  '\nexports.enabled=systemSceneMaxLodExperimentEnabledV1;' +
  'exports.budget=systemSceneMaxLodTextureBudgetMiBV1;' +
  'exports.telemetry=systemSceneLodBenchmarkTelemetryEnabledV1;' +
  'exports.resolution=SYSTEM_SCENE_MAX_LOD_TEXTURE_V1;', context);
const { enabled, budget, resolution, telemetry } = context.exports;
for (const input of ['', '?genesisLod=high', '?genesisLod=MAX', '?other=max']) {
  check(enabled(input) === false, `disabled by default: ${input}`);
}
for (const input of ['?genesisLod=max', '?foo=bar&genesisLod=max']) {
  check(enabled(input) === true, `explicit opt-in: ${input}`);
}
check(telemetry('?genesisLod=adaptive') === true, 'adaptive reference telemetry only');
check(telemetry('?genesisLod=max') === true, 'max telemetry');
check(telemetry('') === false, 'no default telemetry overhead');
check(enabled('?genesisLod=adaptive') === false, 'adaptive reference preserves original LOD');
check(resolution.width === 1024 && resolution.height === 512, 'HD texture resolution');
check(Object.isFrozen(resolution), 'immutable resolution');
check(budget(5, 12, 2) === 208, 'VRAM upper-bound estimate');
check(budget(0, 0, 0) === 0, 'zero bodies');
check(budget(1, 1, 1) === 26, 'combined-body estimate');
for (const input of [[-1, 0, 0], [1.5, 0, 0], [1, NaN, 1]]) {
  let threw = false;
  try { budget(...input); } catch (err) { threw = err.name === 'RangeError'; }
  check(threw, 'invalid body counts rejected');
}
has(/private readonly maxLodExperimentV1 = systemSceneMaxLodExperimentEnabledV1/, 'opt-in runtime flag');
has(/this\.maxLodExperimentV1\s*\?\s*SYSTEM_SCENE_MAX_LOD_TEXTURE_V1\.width/, 'all planet textures HD upfront');
has(/this\.maxLodExperimentV1\s*\?\s*SYSTEM_SCENE_MAX_LOD_TEXTURE_V1 : null/, 'all moon textures HD upfront');
has(/this\.maxLodExperimentV1\) this\.materializePendingMoonVisuals\(\)/, 'pre-materialize even hidden moons');
has(/private activateMaxLodExperimentV1\(\): void/, 'all-scene max activation');
has(/this\.installFocusedMinorBodyAtlas387x\(id\)/, 'all minor-body atlases prepared');
has(/this\.maxLodMinorReleasesV1\.push\(/, 'separately held minor atlases');
has(/for \(const release of this\.maxLodMinorReleasesV1\) release\(\)/, 'minor atlas disposal');
has(/binding\.mesh\.geometry = fine/, 'shared high poly geometry');
has(/shell\.mesh\.geometry = fine/, 'giant shells use fine geometry');
has(/if \(this\.maxLodExperimentV1\) return; \/\/ The whole scene is already HD/, 'no zoom dependent swapping');
has(/private updateInfrastructureLod386\(\): void \{\s*if \(this\.maxLodExperimentV1\) return;/, 'infrastructure LOD fixed');
has(/visual\.updateProjectedDiameterPixels\(1300\)/, 'infrastructure HD one-shot');
has(/this\.maxLodHudV1\?\.remove\(\)/, 'benchmark HUD cleanup');
has(/this\.maxLodHudV1\.textContent = line/, 'runtime benchmark display');
has(/this\.lodBenchmarkTelemetryV1 && this\.currentSnapshot !== null/, 'FPS recorded in both benchmark modes');
has(/p95: \${p95} ms/, 'p95 stutter metric');
has(/loadSeconds: Number\(\(this\.maxLodLoadMsV1/, 'load timing report');
has(/info\.memory\.textures/, 'GPU texture counter');
has(/info\.render\.triangles/, 'triangle counter');
has(/this\.maxLodLoadMsV1 = performance\.now\(\) - maxLodLoadStartV1/, 'load includes first frame upload');
check(!/as unknown as/.test(main.slice(main.indexOf('private activateMaxLodExperimentV1'), main.indexOf('private updateBodyLod'))), 'no unsafe type assertion in benchmark');
console.log(`PASS GENESIS LODMAX.1 — ${checks} comprobaciones · modo opt-in, HD global, restauración, métricas y ciencia inalterada`);
