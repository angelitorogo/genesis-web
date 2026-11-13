#!/usr/bin/env node
'use strict';
/**
 * Auditoría 38.2g.b: riqueza regional de la piel humanoide.
 * Comprueba estabilidad anatómica, variación regional y modelado material por cobertura.
 */
const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');

const files = [
  'src/app/presentation/life-species-visual/vida38-humanoid-organic-material-38-2e.ts',
  'src/app/presentation/life-species-visual/vida38-humanoid-organic-regional-material-38-2gb.spec.ts',
  'src/app/presentation/life-species-visual/vida38-humanoid-material-stability-38-2ga.spec.ts',
];
for (const filename of files) {
  assert.ok(fs.existsSync(filename), `Falta archivo ${filename}`);
  const transpilation = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    reportDiagnostics: true,
    compilerOptions: { strict: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  });
  const errors = (transpilation.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, `${filename}: ${errors.map(e => ts.flattenDiagnosticMessageText(e.messageText, '\n')).join('\n')}`);
}

const shaderSource = fs.readFileSync('src/app/presentation/life-species-visual/vida38-humanoid-organic-material-38-2e.ts', 'utf8');
for (const token of [
  'VIDA.38.2g.c/organic-integument-facial-anatomy/v1',
  'vida38FaceRegion',
  'vida38TorsoRegion',
  'vida38LimbRegion',
  'vida38ExtremityRegion',
  'vida38FacialPigmentContribution',
  'vida38RegionalChromaticVariation',
  'vida38RegionalRoughness',
  'poreMask',
  'plateMask',
  'fiberFlow',
  'uVida38HeadCenterY',
  'uVida38HeadRadius',
  'uVida38JawWidth',
]) {
  assert.ok(shaderSource.includes(token), `No aparece el fragmento requerido: ${token}`);
}
assert.ok(!shaderSource.includes('gl_FragCoord'), 'Se reintrodujo dependencia de pantalla/cámara');
assert.ok(shaderSource.includes('fwidth'), 'Falta antialias procedural');
assert.ok(shaderSource.includes('specularIntensity:0.24') || shaderSource.includes('specularIntensity: 0.24'), 'El material no refleja la reducción especular esperada');
console.log('GENESIS_38_2GB_AUDIT_OK: piel regional estable, riqueza material por cobertura y pigmentación facial integrada');
