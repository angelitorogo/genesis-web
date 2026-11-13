'use strict';
/**
 * GENESIS 38.2g.c — auditoría real del SDF (Node, sin navegador ni Three.js).
 * Ejecuta geometría, determinismo, conectividad, métricas VIDA y alojamiento
 * ocular para 3 identidades de prueba; inspección WebGL sigue siendo necesaria.
 */
const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
const path = require('node:path');
const dir = path.resolve('src/app/presentation/life-species-visual');
const original = require.extensions['.ts'];
require.extensions['.ts'] = (module, file) => {
  const source = fs.readFileSync(file, 'utf8');
  const emitted = ts.transpileModule(source, {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, strict: true },
  });
  const problems = (emitted.diagnostics ?? []).filter(d => d.category === ts.DiagnosticCategory.Error);
  assert.equal(problems.length, 0, `Sintaxis TS inválida en ${file}`);
  module._compile(emitted.outputText, file);
};
try {
  const field = require(path.join(dir, 'vida38-humanoid-organic-field-38-2e.ts'));
  const colors = { primaryColorHex: '#7a7f95', secondaryColorHex: '#ad9973', pattern: 'MOTTLED', bioluminescent: false };
  const makeContract = speciesId => ({
    revision: 'VIDA.38.1/species-visual-contract/v1', speciesId,
    speciesName: speciesId, variantSeedUint32: 0x10012026,
    appearanceFingerprint: '38-2gc-auditoria',
    provenance: { status: 'CONFIRMED_SYSTEM_CT0', representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',
      observedImageAvailable: false, bodyStorageKey: 'v3:audit', ecosystemDigest: 'audit' },
    morphology: { group: 'HUMANOIDS', bodyPlan: 'BIPED', covering: 'LEATHERY', appendagePairs: 2 },
    ecology: { habitat: 'SURFACE_SOIL', nutrition: 'OMNIVORE', niche: 'SURFACE_SOIL/OMNIVORE' },
    locomotion: 'WALKING', bodyLengthMeters: 1.6126,
    pigmentation: colors, adaptations: ['SENSORY_ORIENTATION'], intelligence: null,
  });
  const ids = ['Kamera ix1', 'Sania on1', 'Fasyl a3'];
  for (const id of ids) {
    const c = makeContract(`vida6:${id}`);
    const a = field.deriveVida38HumanoidAnatomy(c);
    const landmarks = field.deriveVida38HumanoidFaceLandmarks38GC(a);
    assert.ok(landmarks.eyeCenterZ + landmarks.globeRadius < landmarks.socketZ + 0.006, 'Ojos salientes');
    const center = field.evaluateVida38HumanoidField(a, a.eyeSpacing, landmarks.eyeY, landmarks.eyeCenterZ);
    assert.ok(Number.isFinite(center) && center > -0.02, 'Globo fuera de la cavidad SDF');
    const mesh = field.buildVida38HumanoidRawMesh(a, 'LOW');
    const audit = field.auditVida38HumanoidRawMesh(mesh);
    assert.equal(audit.invalid, 0);
    assert.equal(audit.components, 1);
    assert.equal(audit.boundaryEdges, 0);
    assert.equal(audit.nonManifoldEdges, 0);
    assert.equal(audit.inconsistentEdges, 0);
    assert.equal(field.measureVida38HumanoidMeshV1(mesh).actualHeightMeters, c.bodyLengthMeters);
    const alt = field.deriveVida38HumanoidAnatomy({ ...c,
      pigmentation: { ...colors, primaryColorHex: '#ffffff', secondaryColorHex: '#000000' },
      appearanceFingerprint: 'color-irrelevante',
    });
    assert.equal(a.morphology.anatomyFingerprint, alt.morphology.anatomyFingerprint);
    console.log(`${id}: ${audit.vertexCount} vértices / ${audit.triangleCount} triángulos; SDF estanco; ojos alojados`);
  }
  const shader = fs.readFileSync(path.join(dir, 'vida38-humanoid-organic-material-38-2e.ts'), 'utf8');
  for (const feature of [
    '38.2g.c/organic-integument-facial-anatomy',
    'vida38MicroscopicLod', 'vida38CutaneousMottle', 'vida38BiologicalRelief',
    'vida38RegionalChromaticVariation', 'vida38FacialPigmentContribution',
    'fwidth', 'uVida38MetersPerUnit', 'deriveVida38HumanoidFaceLandmarks38GC',
  ]) assert.ok(shader.includes(feature), `Falta ${feature}`);
  assert.ok(!shader.includes('gl_FragCoord'), 'Se reintrodujo un ruido en pantalla');
  console.log('GENESIS_38_2GC_AUDIT_OK');
} finally {
  if (original) require.extensions['.ts'] = original;
  else delete require.extensions['.ts'];
}
