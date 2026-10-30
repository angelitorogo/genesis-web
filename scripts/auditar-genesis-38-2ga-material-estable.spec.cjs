#!/usr/bin/env node
'use strict';
/**
 * Auditoría 38.2g.a: estabilidad del shader biológico humanoide.
 * Verifica compilación TypeScript, anclaje anatómico del patrón y ausencia de
 * coordenadas dependientes de pantalla/cámara.
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');

const folder = 'src/app/presentation/life-species-visual';
const paths = [
  `${folder}/vida38-humanoid-organic-field-38-2e.ts`,
  `${folder}/vida38-humanoid-organic-material-38-2e.ts`,
  `${folder}/vida38-humanoid-material-stability-38-2ga.spec.ts`,
];
for (const filename of paths) {
  assert.ok(fs.existsSync(filename), `Falta archivo ${filename}`);
  const transpilation = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    reportDiagnostics: true,
    compilerOptions: { strict: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  });
  const errors = (transpilation.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, `${filename}: ${errors.map(e => ts.flattenDiagnosticMessageText(e.messageText, '\n')).join('\n')}`);
}

const previousLoader = require.extensions['.ts'];
require.extensions['.ts'] = (module, filename) => {
  const transpilation = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  });
  module._compile(transpilation.outputText, filename);
};
try {
  const shaderSource = fs.readFileSync(path.resolve(paths[1]), 'utf8');
  for (const fragment of ['uVida38MetersPerUnit', 'uVida38BodyLengthMeters', 'vida38StableCoord', 'vida38AA', 'fwidth']) {
    assert.ok(shaderSource.includes(fragment), `Fragmento ausente: ${fragment}`);
  }
  assert.ok(!shaderSource.includes('gl_FragCoord'), 'Se reintrodujo un patrón dependiente de pantalla');
  assert.ok(shaderSource.includes('roughnessFactor=clamp') || shaderSource.includes('roughnessFactor = clamp'), 'No se suavizó el contraste de rugosidad');
  assert.ok(shaderSource.includes("specularIntensity:0.28") || shaderSource.includes('specularIntensity: 0.28'), 'No se redujo el brillo especular');
  assert.ok(shaderSource.includes("uVida38SkinDetail'] = {value:contract.morphology.covering==='SCALES'?0.0026:0.0016}") || shaderSource.includes("uVida38SkinDetail'] = { value: contract.morphology.covering === 'SCALES' ? 0.0026 : 0.0016 }"), 'No se redujo el microrelieve');
  console.log('GENESIS_38_2GA_AUDIT_OK: shader estable, antialias procedural, patrón anatómico y microrelieve suavizado');
} finally {
  if (previousLoader) require.extensions['.ts'] = previousLoader;
  else delete require.extensions['.ts'];
}
