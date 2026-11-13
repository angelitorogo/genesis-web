'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const modulePath = path.join(__dirname, '..', 'src/app/presentation/life-species-visual/vida38-civilized-reptilian-variation-38-2oe1.ts');
const rendererPath = path.join(__dirname, '..', 'src/app/presentation/life-species-visual/vida38-civilized-reptilian-preview-38-2o.ts');
const moduleText = fs.readFileSync(modulePath, 'utf8');
const rendererText = fs.readFileSync(rendererPath, 'utf8');
assert.match(moduleText, /avalanche32/);
assert.match(moduleText, /GARMENT\|/);
assert.match(moduleText, /CULTURE\|/);
assert.match(rendererText, /surfaceAnchor38OE1/);
assert.match(rendererText, /selectVida38ReptilianVariation38OE1/);
// Ejecutar de verdad la selección pura sin exigir instalación de dependencias.
let ts;
try { ts = require('typescript'); } catch {
  console.log('AUDIT_PARTIAL_38_2OE1: instalar TypeScript localmente para ejecutar la distribución');
  process.exitCode = 1;
  throw new Error('TypeScript local requerido para verificar la distribución');
}
const js = ts.transpileModule(moduleText, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const runner = new Function('exports', js);
const exportsObject = {};
runner(exportsObject);
const { selectVida38ReptilianVariation38OE1: select, hasReptilianOrnaments38OE1: ornament } = exportsObject;
const vals = Array.from({length: 48}, (_, i) => select(`rept:${i}`, `38-2oe:rept:${i}`));
const distinct = key => new Set(vals.map(v=>v[key])).size;
const ornamented = Array.from({length:24},(_,i)=>`rept:orn:${i}`)
  .filter(id=>ornament(select(id,`38-2oe:${id}`).profile)).length;
assert.ok(distinct('profile') >= 8, `profiles=${distinct('profile')}`);
assert.equal(distinct('garmentLine'), 6);
assert.ok(distinct('culture') >= 5, `cultures=${distinct('culture')}`);
assert.ok(ornamented > 8, `ornamented=${ornamented}`);
assert.deepEqual(select('fixed','fixed-fp'), select('fixed','fixed-fp'));
console.log(`GENESIS_38_2OE1_AUDIT_OK: ${distinct('profile')} perfiles, ${distinct('garmentLine')} indumentarias, ${distinct('culture')} culturas; ${ornamented}/24 con anatomía ornamental`);
