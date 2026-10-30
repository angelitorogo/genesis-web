#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');

const files = [
  'src/app/presentation/life-species-visual/vida38-species-visual-preview-scene.ts',
  'src/app/presentation/life-species-visual/vida38-species-visual-preview-scene.spec.ts',
  'src/app/presentation/life-species-visual/life-species-visual-preview.ts',
  'src/app/presentation/life-species-detail/life-species-detail.ts',
  'docs/vida38/38-2-representacion-3d-especies.md',
];
for (const rel of files) {
  assert.ok(fs.existsSync(path.resolve(rel)), `Falta archivo: ${rel}`);
}

const oldTsLoader = require.extensions['.ts'];
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      experimentalDecorators: true,
      emitDecoratorMetadata: false,
    },
    fileName: filename,
    reportDiagnostics: true,
  });
  const errors = (compiled.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, `Errores TypeScript en ${filename}`);
  module._compile(compiled.outputText, filename);
};

try {
  const sceneText = fs.readFileSync(path.resolve('src/app/presentation/life-species-visual/vida38-species-visual-preview-scene.ts'), 'utf8');
  const componentText = fs.readFileSync(path.resolve('src/app/presentation/life-species-visual/life-species-visual-preview.ts'), 'utf8');
  const ficheText = fs.readFileSync(path.resolve('src/app/presentation/life-species-detail/life-species-detail.ts'), 'utf8');

  assert.ok(sceneText.includes("export const VIDA38_SPECIES_VISUAL_PREVIEW_REVISION = 'VIDA.38.2/species-visual-preview/v1'"));
  for (const family of ['MICROBIAL_COLONY','FUNGAL_CLUSTER','PLANT_FORM','INSECT_BODY','AVIAN_BODY','QUADRUPED_BODY','BIPED_BODY']) {
    assert.ok(sceneText.includes(family), `Falta familia de render ${family}`);
  }
  for (const builder of ['createMicrobialColony','createFungalCluster','createPlant','createInsect','createQuadruped','createBird','createBiped']) {
    assert.ok(sceneText.includes(`function ${builder}`), `Falta constructor procedural ${builder}`);
  }
  assert.ok(sceneText.includes('normalizeSubject(subject);'));
  assert.ok(sceneText.includes('new THREE.MeshPhysicalMaterial'));
  assert.ok(componentText.includes('descriptor.specialistIntelligenceDeferred'));
  assert.ok(componentText.includes("selector: 'app-life-species-visual-preview'"));
  assert.ok(componentText.includes('Reconstrucción visual 38.2'));
  assert.ok(componentText.includes('toggleAnimation()'));
  assert.ok(componentText.includes('resetView()'));
  assert.ok(componentText.includes("canvas.addEventListener('pointerdown'"));
  assert.ok(componentText.includes("canvas.addEventListener('wheel'"));
  assert.ok(ficheText.includes('app-life-species-visual-preview'));
  assert.ok(ficheText.includes('muestra procedural 3D base disponible en 38.2'));

  console.log('VIDA38_2_SPECIES_3D_AUDIT_OK (familias, constructores, controles, integración en ficha)');
} finally {
  if (oldTsLoader) require.extensions['.ts'] = oldTsLoader;
  else delete require.extensions['.ts'];
}
