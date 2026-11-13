const fs = require('fs');
const path = require('path');

const root = process.cwd();
const required = [
  'src/app/presentation/life-species-visual/vida38-advanced-reptilian-plan-38-2s.ts',
  'src/app/presentation/life-species-visual/vida38-advanced-reptilian-fixtures-38-2s.ts',
  'src/app/presentation/life-species-visual/vida38-advanced-reptilian-gallery-38-2s.component.ts',
  'src/app/presentation/life-species-visual/vida38-advanced-reptilian-38-2s.spec.ts',
  'src/app/presentation/life-species-visual/vida38-reptilian-gallery-laboratory-38-2oe5b.component.ts',
];

for (const rel of required) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) throw new Error(`Falta archivo requerido: ${rel}`);
}

const plan = fs.readFileSync(path.join(root, required[0]), 'utf8');
const fixtures = fs.readFileSync(path.join(root, required[1]), 'utf8');
const gallery = fs.readFileSync(path.join(root, required[2]), 'utf8');
const lab = fs.readFileSync(path.join(root, required[4]), 'utf8');

if (!plan.includes("civilizationTier==='ADVANCED'")) throw new Error('El selector 38.2s no detecta REPTILIAN/ADVANCED.');
if (!fixtures.includes("Reptiliano avanzado de laboratorio")) throw new Error('La galería 38.2s no define especímenes de laboratorio avanzados.');
if (!plan.includes("PRESSURE_SUIT") || !plan.includes("UTILITY_OVERALLS")) throw new Error('No se detecta la mezcla esperada de ropa actual/técnica.');
if (!gallery.includes("Reptilianos · Avanzados")) throw new Error('La galería 38.2s no expone el título esperado.');
if (!lab.includes("REPTILIAN_ADVANCED") || !lab.includes("Reptilianos · Avanzados")) throw new Error('El laboratorio Civilizaciones no integra la nueva sección reptiliana avanzada.');

console.log('GENESIS_38_2S_AUDIT_OK');
