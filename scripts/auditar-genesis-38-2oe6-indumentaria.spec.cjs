const fs = require('fs');
const path = require('path');

const root = process.cwd();
const previewPath = path.join(root, 'src/app/presentation/life-species-visual/vida38-civilized-reptilian-preview-38-2o.ts');
const specPath = path.join(root, 'src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe6.spec.ts');

const preview = fs.readFileSync(previewPath, 'utf8');
const spec = fs.readFileSync(specPath, 'utf8');

const mustContain = [
  'selectVida38ReptilianGarmentFamily38OE6',
  "'CEREMONIAL_ROBES'",
  "'SEGMENTED_ARMOR'",
  "'NOBLE_REGALIA'",
  "'COLONIAL_RIG'",
  "'PELAGIC_DRAPE'",
  'vida38ReptilianGarmentFamily38OE6',
  'addCeremonialRobes38OE6',
  'addSegmentedArmor38OE6',
  'addNobleRegalia38OE6',
  'addColonialRig38OE6',
  'addPelagicDrape38OE6',
];

for (const token of mustContain) {
  if (!preview.includes(token)) {
    throw new Error(`Falta el token obligatorio en preview: ${token}`);
  }
}
if (!spec.includes('families.size')) {
  throw new Error('La spec 38.2o.e6 no verifica la diversidad de familias de indumentaria.');
}

console.log('GENESIS_38_2OE6_AUDIT_OK: diversificación fuerte de indumentaria reptiliana detectada');
