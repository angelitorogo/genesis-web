'use strict';
/** Auditoría portable de cobertura/identidad 38.2q2, sin WebGL. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = process.cwd();
const dir = path.join(root, 'src/app/presentation/life-species-visual');
const files = [
  'vida38-civilized-insectoid-wardrobe-38-2q2.ts',
  'vida38-civilized-insectoid-preview-38-2q.ts',
  'vida38-civilized-insectoid-gallery-38-2q.component.ts',
  'vida38-civilized-insectoid-38-2q2.spec.ts',
  'vida38-civilized-insectoid-fixtures-38-2q.ts',
];
for (const name of files) {
  const file = path.join(dir, name);
  assert.ok(fs.existsSync(file), `Falta ${name}`);
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    fileName: file, reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  });
  assert.equal(compiled.diagnostics?.length ?? 0, 0, `Error sintáctico en ${name}`);
}
const code = fs.readFileSync(path.join(dir, files[0]), 'utf8');
const preview = fs.readFileSync(path.join(dir, files[1]), 'utf8');
for (const name of ['EXO_SUIT', 'SEGMENTED_BIO_ARMOR', 'SCIENTIFIC_HARNESS',
  'ROYAL_MANTLE', 'CEREMONIAL_VESTMENTS', 'EXPLORER_KIT']) {
  assert.ok(code.includes(`case '${name}':`), `Falta familia de ropa ${name}`);
}
for (const key of ['sampleSurface', 'generateSurface', 'wingOpening', 'sideSlits',
  'VIDA38_Q2_OPEN_LAB_COAT', 'VIDA38_Q2_WIDE_DORSAL_MANTLE',
  'VIDA38_Q2_CEREMONIAL_ROBE_360', 'VIDA38_Q2_ASYMMETRIC_FIELD_PONCHO']) {
  assert.ok(code.includes(key), `No se detecta construcción ${key}`);
}
assert.ok(!code.includes('Math.random('), 'Se debe conservar la selección determinista');
assert.ok(!code.includes('new THREE.BoxGeometry('), 'La ropa no debe construirse con cajas');
assert.ok(preview.includes('buildVida38InsectoidWardrobe38Q2(plan, quality)'), 'Renderer no utiliza la ropa 38.2q2');
assert.ok(preview.includes("subject.userData['vida38InsectoidWardrobeRevision38Q2']"), 'Falta revision en userData');
const cache = new Map();
function transpile(name) {
  return ts.transpileModule(fs.readFileSync(path.join(dir, name), 'utf8'), {
    fileName: name, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
}
function load(name) {
  if (name === 'vida38-species-visual-contract.ts') return { VIDA38_SPECIES_VISUAL_REVISION: 'AUDIT_ONLY' };
  if (cache.has(name)) return cache.get(name);
  const result = {};
  cache.set(name, result);
  const js = transpile(name);
  vm.runInNewContext(js, {
    exports: result, module: { exports: result },
    require(id) {
      // Three.js no necesita un contexto WebGL para importar geometría ni calcular planes.
      // Devolver {} provocaba TypeError al evaluar el HEAD_CENTER de 38.2q1b.
      if (id === 'three') return require('three');
      if (!id.startsWith('./')) throw new Error(`Dependencia inesperada: ${id}`);
      const next = id.slice(2) + '.ts';
      if (!fs.existsSync(path.join(dir, next))) return {};
      return load(next);
    },
    Math, Object, Set, Map, String, Number, Array, JSON, console,
  }, { filename: name, timeout: 10000 });
  return result;
}
const {buildVida38InsectoidGallery38Q} = load('vida38-civilized-insectoid-fixtures-38-2q.ts');
const {deriveVida38CivilizedInsectoidPlan38Q} = load('vida38-civilized-insectoid-preview-38-2q.ts');
const {deriveVida38InsectoidWardrobeStyle38Q2} = load(files[0]);
const gallery = buildVida38InsectoidGallery38Q(24);
assert.equal(gallery.length, 24);
const families = new Set(), cultures = new Set(), signatures = new Set(), fabrics = new Set();
for (const entry of gallery) {
  const s = deriveVida38InsectoidWardrobeStyle38Q2(entry.plan);
  const again = deriveVida38InsectoidWardrobeStyle38Q2(deriveVida38CivilizedInsectoidPlan38Q(entry.contract));
  assert.equal(s.signature, again.signature, 'Identidad de ropa no determinista');
  families.add(s.family); cultures.add(s.culture); signatures.add(s.signature); fabrics.add(s.textile);
  assert.equal(s.wingOpening, entry.plan.wingPairs > 0);
  assert.ok(s.length > .4 && s.flare > 0);
}
assert.equal(families.size, 6, `Cobertura de prendas: ${families.size}`);
assert.equal(cultures.size, 6, `Cobertura de culturas: ${cultures.size}`);
assert.ok(fabrics.size >= 5, `Cobertura textil: ${fabrics.size}`);
assert.equal(signatures.size, 24, `Firmas únicas: ${signatures.size}`);
let samples = 0;
const uniqueStyles = new Set();
for (let i = 0; i < 4096; i++) {
  const previous = gallery[i % 24];
  const contract = {
    ...previous.contract,
    speciesId: `Q2-AUDIT-SPECIES-${i}`,
    appearanceFingerprint: `Q2-APPEARANCE-${i}`,
    variantSeedUint32: i,
  };
  const plan = deriveVida38CivilizedInsectoidPlan38Q(contract);
  const s = deriveVida38InsectoidWardrobeStyle38Q2(plan);
  const same = deriveVida38InsectoidWardrobeStyle38Q2(deriveVida38CivilizedInsectoidPlan38Q(contract));
  assert.equal(s.signature, same.signature);
  uniqueStyles.add(s.signature);
  samples++;
}
assert.ok(uniqueStyles.size > 4000, `Diversidad insuficiente en auditoría: ${uniqueStyles.size}`);
console.log(`GENESIS_38_2Q2_AUDIT_OK: ${samples} identidades; 24 galería; ${families.size} familias, ${cultures.size} culturas, ${fabrics.size} tejidos, ${uniqueStyles.size} firmas`);
