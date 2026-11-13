'use strict';
/** Auditoría portable sin WebGL: 4096 identidades, reglas de selección, motores y enlace de galería. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = process.cwd();
const base = path.join(root, 'src/app/presentation/life-species-visual');
const variationPath = path.join(base, 'vida38-civilized-reptilian-variation-38-2oe1.ts');
const wardrobePath = path.join(base, 'vida38-reptilian-wardrobe-coherence-38-2oe8b.ts');
const previewPath = path.join(base, 'vida38-civilized-reptilian-preview-38-2o.ts');
const galleryPath = path.join(base, 'vida38-reptilian-gallery-38-2oe5.component.ts');
function load(file, requireImpl = () => { throw new Error('Import inesperado'); }) {
  const source = fs.readFileSync(file, 'utf8');
  const out = ts.transpileModule(source, { fileName: file, reportDiagnostics: true,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  assert.equal(out.diagnostics?.length ?? 0, 0, `${file} contiene errores de sintaxis TS`);
  const mod = { exports: {} };
  vm.runInNewContext(out.outputText, { module: mod, exports: mod.exports, require: requireImpl, Math, Object, Array, Set, Map }, { filename: file });
  return mod.exports;
}
const variation = load(variationPath);
const wardrobe = load(wardrobePath, id => {
  if (id === './vida38-civilized-reptilian-variation-38-2oe1') return variation;
  throw new Error(`Import no previsto: ${id}`);
});
const levels = ['STAR_KINGDOM', 'BASILICA_TECHNOCRACY', 'FRONTIER_HEGEMONY', 'PELAGIC_CONCORD', 'DUNE_MANDATE', 'OBSIDIAN_CLAN'];
const families = new Set(); const engines = new Set();
const counts = new Map();
for (let i = 0; i < 4096; i++) {
  const id = `AUDIT-REPT-${i}`;
  const fingerprint = `audit:38oe8b:${id}`;
  const variationPlan = variation.selectVida38ReptilianVariation38OE1(id, fingerprint);
  const args = { seed: variationPlan.anatomySeed ^ id.length ^ fingerprint.length, level: 'VERY_ADVANCED',
    garmentLine: variationPlan.garmentLine, culture: variationPlan.culture, profile: variationPlan.profile };
  const family = wardrobe.selectVida38WardrobeFamily38OE8B(args);
  assert.equal(wardrobe.selectVida38WardrobeFamily38OE8B(args), family, 'Selección no determinista');
  const engine = wardrobe.getVida38WardrobeEngine38OE8B(family, 'VERY_ADVANCED');
  if (['MILITARY', 'EXPLORER', 'INDUSTRIAL_COLONIZER'].includes(args.garmentLine)) {
    assert(['SEGMENTED_ARMOR', 'COLONIAL_RIG', 'TECH_SUIT'].includes(family), `${args.garmentLine} vestido con prenda blanda`);
  }
  families.add(family); engines.add(engine);
  counts.set(family, (counts.get(family) ?? 0) + 1);
}
assert.equal(families.size, 6, 'No aparecen las seis familias de indumentaria');
assert.equal(engines.size, 3, 'No aparecen los tres motores de vestuario de nivel muy avanzado');
function ordinalFamily(n) {
  const id = `LAB-38OE5-REPTILIAN-${String(n).padStart(5,'0')}`;
  const fp = `lab38oe5:v1:${id}`;
  const v = variation.selectVida38ReptilianVariation38OE1(id, fp);
  return wardrobe.selectVida38WardrobeFamily38OE8B({
    seed: v.anatomySeed ^ id.length ^ fp.length, level: 'VERY_ADVANCED',
    garmentLine: v.garmentLine, culture: v.culture, profile: v.profile,
  });
}
assert.equal(ordinalFamily(7), 'CEREMONIAL_ROBES', 'La muestra 7 debe seguir validando la túnica');
assert.equal(ordinalFamily(121), 'COLONIAL_RIG', 'La muestra 121 debe validar equipo industrial, no una campana');
const preview = fs.readFileSync(previewPath, 'utf8');
const gallery = fs.readFileSync(galleryPath, 'utf8');
for (const name of ['selectVida38WardrobeFamily38OE8B', 'vida38WardrobeSelectionRevision38OE8B',
  'getVida38WardrobeEngine38OE8B', 'addOrganicSoftGarments38OE7B', 'addAdvancedTechnicalArmor38OE8']) {
  assert(preview.includes(name), `Falta integración del renderer: ${name}`);
}
for (const name of ['deriveVida38WardrobeCoherencePlan38OE8B', 'auditVida38WardrobeRendered38OE8B',
  'garmentStats38OE7C', 'familyLabel', 'engineLabel', 'wardrobeAudit']) {
  assert(gallery.includes(name), `Falta trazabilidad de galería: ${name}`);
}
assert(!gallery.includes('[(ngModel)]'), 'El laboratorio no debe añadir formularios/filtros');
console.log(`GENESIS_38_2OE8B_AUDIT_OK: 4096 identidades, ${families.size} familias, ${engines.size} motores, e7c/e8a/d5 conservados`);
for (const [family, count] of counts) console.log(`  ${family}: ${count}`);
