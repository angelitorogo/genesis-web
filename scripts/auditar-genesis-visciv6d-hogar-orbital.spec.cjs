'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

const root = process.cwd();
const read = path => fs.readFileSync(path, 'utf8');
const src = name => read(path.join(root, name));
const helper = 'src/app/presentation/system/system-scene-civilization-host-light-visciv6d.ts';
const shader = src('src/app/presentation/system/system-scene-atmosphere-material.ts');
const system = src('src/app/presentation/system/system-scene.ts');
const preview = src('src/app/presentation/scientific-body-preview/scientific-body-preview.ts');
const adapter = src('src/app/presentation/scientific/scientific-body-preview.ts');
const composed = src('src/app/presentation/system/system-scene-multihost-composition.ts');
const circumbinary = src('src/app/presentation/system/system-scene-multihost-circumbinary-projection.ts');
const native = src('src/app/presentation/system/system-scene-snapshot.ts');

for (const token of [
  'uGenesisOrbitalHomeDirectionsView[2]',
  'uGenesisOrbitalHomeFlags',
  'genesisHomeDayFactor',
  'genesisHomeDarkness',
  'genesisForeignStarPenumbra',
]) assert.ok(shader.includes(token), 'Shader sin contrato ' + token);
assert.doesNotMatch(shader, /genesisDominantStarDayFactor/);
assert.match(system, /resolveOrbitalHomeStarIdsVISCIV6d\(body, snapshot\.stars\)/);
assert.match(system, /binding\.orbitalHomeDirectionsView\[hostIndex\]/);
assert.match(preview, /source\.isOrbitalHost/);
assert.match(adapter, /isOrbitalHost: homeStarIds\.has\(star\.id\)/);
assert.match(native, /orbitalHomeStarIds: Object\.freeze/);
assert.match(composed, /orbitalHomeStarIds: Object\.freeze\(\[namespaced\(star\.id\)\]\)/);
assert.match(circumbinary, /orbitalHomeStarIds: Object\.freeze\(base\.stars/);

const ts = require('typescript');
const abs = path.resolve(root, helper);
const js = ts.transpileModule(read(abs), { compilerOptions: {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2022,
  strict: true,
}, fileName: abs }).outputText;
const mod = new Module(abs, module);
mod.filename = abs;
mod.paths = Module._nodeModulePaths(path.dirname(abs));
mod._compile(js, abs);
const { civilizedLightsVisibilityVISCIV6d: city, resolveOrbitalHomeStarIdsVISCIV6d: hosts } = mod.exports;
const stars = [
  { id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' },
];
assert.deepEqual(hosts({ id: 'mh-a-planet-3' }, stars), ['a']);
assert.deepEqual(hosts({ id: 'mh-p-planet-5' }, stars), ['a', 'b']);
assert.equal(city([1,0],[0.1,0.9],[true,false]), 0);
assert.equal(city([1,1],[0.1,0.9],[true,false]), 0);
assert.ok(city([0,1],[0.1,0.9],[true,false]) > 0.1);
assert.equal(city([0,0],[0.1,0.9],[true,false]), 1);
assert.equal(city([1,0,0],[0.2,0.3,0.5],[true,true,false]),0);
assert.equal(city([0,1,0],[0.2,0.3,0.5],[true,true,false]),0);
assert.ok(city([0,0,1],[0.2,0.3,0.5],[true,true,false]) > 0.1);
console.log('VISCIV6D_HOME_ORBIT_STELLAR_IDENTITY_PASSED (9 checks + structural contracts)');
