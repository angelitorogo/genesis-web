const fs = require('fs');
const path = require('path');

const root = process.cwd();
const ocularPath = path.join(root, 'src/app/presentation/life-species-visual/vida38-civilized-insectoid-ocular-diversity-38-2q1f.ts');
const previewPath = path.join(root, 'src/app/presentation/life-species-visual/vida38-civilized-insectoid-preview-38-2q.ts');
const specPath = path.join(root, 'src/app/presentation/life-species-visual/vida38-civilized-insectoid-38-2q1f.spec.ts');

for (const file of [ocularPath, previewPath, specPath]) {
  if (!fs.existsSync(file)) throw new Error(`Falta archivo requerido: ${path.relative(root, file)}`);
}

const ocular = fs.readFileSync(ocularPath, 'utf8');
const preview = fs.readFileSync(previewPath, 'utf8');
const spec = fs.readFileSync(specPath, 'utf8');

const families = [
  'ROUNDED_COMPOUND',
  'OVAL_COMPOUND',
  'ANGULAR_COMPOUND',
  'LATERAL_COMPOUND',
  'PSEUDO_ARACHNOID',
  'REDUCED_COMPOUND_OCELLI',
];

for (const family of families) {
  if (!ocular.includes(family)) throw new Error(`No aparece la familia ocular ${family}`);
}
for (const token of [
  'buildVida38InsectoidSpecialEyes38Q1F',
  'createVida38InsectoidDiversePrimaryEye38Q1F',
  'SPECIAL_EYE',
  'vida38InsectoidOcularDiversityRevision38Q1F',
]) {
  if (!preview.includes(token) && !ocular.includes(token)) throw new Error(`Falta integración ${token}`);
}
if (!spec.includes('distribuye múltiples familias oculares')) throw new Error('No se detecta spec de diversidad ocular');

console.log('GENESIS_38_2Q1F_AUDIT_OK: diversidad morfológica ocular insectoide detectada');
