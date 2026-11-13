'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src/app/presentation/life-species-visual');
const ocular = fs.readFileSync(path.join(srcDir, 'vida38-civilized-reptilian-ocular-38-2oe4.ts'), 'utf8');
const spec3 = fs.readFileSync(path.join(srcDir, 'vida38-civilized-reptilian-38-2oe3.spec.ts'), 'utf8');
assert.match(ocular, /body\.updateWorldMatrix\(true, false\)/);
assert.match(ocular, /body\.localToWorld\(originLocal\)/);
assert.match(ocular, /body\.worldToLocal\(hit\.point\.clone\(\)\)/);
assert.match(ocular, /skinPoint = new THREE\.Vector3\(position\.getX\(bestIndex\)/);
const statCase = spec3.slice(spec3.indexOf("it('muestra variedad"), spec3.indexOf("it('no añade accesorios"));
assert.match(statCase, /selectVida38ReptilianVariation38OE1/);
assert.doesNotMatch(statCase, /createVida38SpeciesPreviewModelV1/);

// Ejecuta realmente los módulos TS puros (sin instanciar mallas SDF).
const cache = new Map();
function loadPure(filename) {
  filename = path.join(srcDir, filename);
  if (cache.has(filename)) return cache.get(filename);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
    reportDiagnostics: true,
  });
  const issues = code.diagnostics ?? [];
  assert.equal(issues.filter(d => d.category === ts.DiagnosticCategory.Error).length, 0, `TS transpile: ${filename}`);
  const module = {exports: {}};
  cache.set(filename, module.exports);
  new Function('require', 'module', 'exports', code.outputText)(
    (mod) => {
      assert.ok(mod.startsWith('./'), 'Solo imports locales');
      return loadPure(mod.slice(2) + '.ts');
    }, module, module.exports,
  );
  return module.exports;
}
const {selectVida38ReptilianVariation38OE1} = loadPure('vida38-civilized-reptilian-variation-38-2oe1.ts');
const {deriveVida38ReptilianAccessoryPlan38OE3} = loadPure('vida38-civilized-reptilian-accessories-38-2oe3.ts');
const signatures = new Set(), eyewear = new Set(), handheld = new Set();
for (let i = 0; i < 48; i++) {
  const speciesId = `rep:acc:${i}`;
  const appearanceFingerprint = `38-2oe3:${speciesId}`;
  const variation = selectVida38ReptilianVariation38OE1(speciesId, appearanceFingerprint);
  const args = {speciesId, appearanceFingerprint, ...variation};
  const p = deriveVida38ReptilianAccessoryPlan38OE3(args);
  assert.deepEqual(p, deriveVida38ReptilianAccessoryPlan38OE3(args), 'No determinismo');
  signatures.add(p.exactAccessorySignature);
  eyewear.add(p.eyewear);
  handheld.add(p.handheld);
}
assert.ok(signatures.size >= 10, `Signatures=${signatures.size}`);
assert.ok(eyewear.size >= 2, `Eyewear=${eyewear.size}`);
assert.ok(handheld.size >= 3, `Handheld=${handheld.size}`);
console.log(`GENESIS_38_2OE4A_AUDIT_OK: 48 identidades, ${signatures.size} firmas, ${eyewear.size} gafas, ${handheld.size} accesorios de mano. Anclaje world->local auditado.`);
