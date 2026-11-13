'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = process.cwd();
const modulePath = path.join(root, 'src/app/presentation/life-species-visual/vida38-reptilian-technical-garments-38-2oe8.ts');
const rendererPath = path.join(root, 'src/app/presentation/life-species-visual/vida38-civilized-reptilian-preview-38-2o.ts');
const source = fs.readFileSync(modulePath, 'utf8');
const renderer = fs.readFileSync(rendererPath, 'utf8');
const compiled = ts.transpileModule(source, {
  fileName: modulePath,
  reportDiagnostics: true,
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
assert.equal(compiled.diagnostics?.length ?? 0, 0, 'El módulo 38.2o.e8a debe transpilar sin errores');
const sandboxModule = { exports: {} };
vm.runInNewContext(compiled.outputText, {
  module: sandboxModule,
  exports: sandboxModule.exports,
  require: id => { if (id === 'three') return {}; throw new Error(`Módulo inesperado: ${id}`); },
  Math, Object, Set, Map, console,
}, { filename: 'vida38-reptilian-technical-garments-38-2oe8.compiled.js' });
const { deriveVida38TechArmorPlan38OE8 } = sandboxModule.exports;
assert.equal(typeof deriveVida38TechArmorPlan38OE8, 'function');
const requests = [
  { speciesId: 'mil', appearanceFingerprint: 'mil', family: 'SEGMENTED_ARMOR', garmentLine: 'MILITARY', culture: 'FRONTIER_HEGEMONY' },
  { speciesId: 'exp', appearanceFingerprint: 'exp', family: 'COLONIAL_RIG', garmentLine: 'EXPLORER', culture: 'PELAGIC_CONCORD' },
  { speciesId: 'col', appearanceFingerprint: 'col', family: 'COLONIAL_RIG', garmentLine: 'INDUSTRIAL_COLONIZER', culture: 'DUNE_MANDATE' },
  { speciesId: 'tec', appearanceFingerprint: 'tec', family: 'SEGMENTED_ARMOR', garmentLine: 'TECHNO_PRIEST', culture: 'BASILICA_TECHNOCRACY' },
  { speciesId: 'nob', appearanceFingerprint: 'nob', family: 'SEGMENTED_ARMOR', garmentLine: 'NOBLE', culture: 'STAR_KINGDOM' },
];
const disciplines = new Set();
const silhouettes = new Set();
for (const request of requests) {
  const a = deriveVida38TechArmorPlan38OE8(request);
  const b = deriveVida38TechArmorPlan38OE8(request);
  assert.equal(JSON.stringify(a), JSON.stringify(b), 'Plan no determinista');
  disciplines.add(a.discipline);
  silhouettes.add(a.silhouette);
  assert(a.shellThickness > 0 && a.shellThickness < 0.05);
  assert(a.bootBulk >= 0.95 && a.bootBulk <= 1.2);
  assert(a.gauntletBulk >= 0.95 && a.gauntletBulk <= 1.2);
}
assert.equal(disciplines.size, 5, 'Deben cubrirse las cinco disciplinas técnicas');
assert(silhouettes.size >= 4, 'Deben mantenerse al menos cuatro siluetas base');
for (const token of [
  'limbArmor38OE8', 'WAIST_GUARD', 'LEFT_GREAVE_SHELL', 'RIGHT_BOOT_SHELL',
  'TECHNO_PRIEST_ARMORED', 'CEREMONIAL_NOBLE', 'CHEST_SENSOR_BRIDGE',
  'vida38TechnicalGarmentDiscipline38OE8'
]) {
  assert(source.includes(token) || renderer.includes(token), `Falta el elemento esperado: ${token}`);
}
assert(!/new\s+THREE\.BoxGeometry\s*\(/.test(source), '38.2o.e8a no debe recurrir a BoxGeometry');
console.log(`GENESIS_38_2OE8A_AUDIT_OK: ${disciplines.size} disciplinas, ${silhouettes.size} siluetas base, renderer integrado`);
