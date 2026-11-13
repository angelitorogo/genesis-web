'use strict';
// Auditoría portable: verifica la selección determinista, escalas y el anclaje
// de los ojos en la cabeza, sin crear una escena WebGL.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = process.cwd();
const srcDir = path.join(root, 'src/app/presentation/life-species-visual');
const names = [
  'vida38-civilized-insectoid-ocular-diversity-38-2q1f.ts',
  'vida38-civilized-insectoid-preview-38-2q.ts',
  'vida38-civilized-insectoid-38-2q1f1.spec.ts',
];
for (const name of names) {
  const filepath = path.join(srcDir, name);
  assert(fs.existsSync(filepath), `Falta ${name}`);
  const result = ts.transpileModule(fs.readFileSync(filepath, 'utf8'), {
    fileName: filepath, reportDiagnostics: true,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  assert.equal(result.diagnostics?.length ?? 0, 0, `Error de transpilación en ${name}`);
}
const ocularText = fs.readFileSync(path.join(srcDir, names[0]), 'utf8');
const previewText = fs.readFileSync(path.join(srcDir, names[1]), 'utf8');
assert(ocularText.includes('findVida38InsectoidFrontalCraniumPoint38Q1F'), 'Falta anclaje sobre cráneo');
assert(ocularText.includes('raycaster.intersectObject(head, false)'), 'No se proyectan los ojos contra el cráneo');
assert(previewText.includes('createVida38InsectoidDiversePrimaryEye38Q1F(plan,side,quality,head)'), 'El renderer no pasa el cráneo');
assert(previewText.includes('buildVida38InsectoidSpecialEyes38Q1F(plan,head)'), 'Los ojos secundarios no usan el cráneo');
assert(!ocularText.includes('Math.random('), 'La diversificación no puede usar azar global');

const js = ts.transpileModule(ocularText, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
}}).outputText;
const mod = { exports: {} };
vm.runInNewContext(js, { module: mod, exports: mod.exports, require(id) {
  if (id === 'three' || id.startsWith('./')) return {};
  throw new Error(`Import inesperado ${id}`);
}}, { filename: names[0] });
const { deriveVida38InsectoidOcularPlan38Q1F } = mod.exports;
const archetypes = [
  'MANTID_SENTINEL', 'BEETLE_BASTION', 'WASP_DIPLOMAT', 'ANT_ENGINEER',
  'MOTH_ORACLE', 'DRAGONFLY_EXPLORER', 'CICADA_ARCHIVIST', 'STICK_SCHOLAR',
];
const families = new Set();
for (let i = 0; i < 4096; i++) {
  const plan = { speciesId: `Q1F1-CASE-${i}`, signature: `seed-${i}`, archetype: archetypes[i % archetypes.length] };
  const a = deriveVida38InsectoidOcularPlan38Q1F(plan);
  const b = deriveVida38InsectoidOcularPlan38Q1F(plan);
  assert.equal(a.signature, b.signature, 'Plan ocular no determinista');
  assert(a.lateralScale.x > .75 && a.lateralScale.x < 1.21, `Anchura fuera de rango: ${i}`);
  assert(a.lateralScale.y > .80 && a.lateralScale.y < 1.16, `Altura fuera de rango: ${i}`);
  assert(a.lateralScale.z > .77 && a.lateralScale.z < .93, `Profundidad fuera de rango: ${i}`);
  assert(a.frontalAnchorFactor >= .86 && a.frontalAnchorFactor <= .94, `Anclaje lateral fuera de rango: ${i}`);
  assert(a.surfaceEmbedDepth >= .015 && a.surfaceEmbedDepth <= .030, `Ojo mal incrustado: ${i}`);
  families.add(a.family);
}
assert.equal(families.size, 6, 'No se preservan las seis familias oculares');
console.log(`GENESIS_38_2Q1F1_AUDIT_OK: 4096 identidades, ${families.size} familias y anclaje craneal calibrado`);
