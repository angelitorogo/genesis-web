const fs = require('fs');
const path = require('path');
const root = process.cwd();
const previewPath = path.join(root, 'src/app/presentation/life-species-visual/vida38-civilized-reptilian-preview-38-2o.ts');
const specPath = path.join(root, 'src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe7.spec.ts');
const preview = fs.readFileSync(previewPath, 'utf8');
const spec = fs.readFileSync(specPath, 'utf8');
for (const token of [
  'createOrganicGarmentMaterial38OE7',
  'createOrganicDrapePanel38OE7',
  'createOrganicCollar38OE7',
  'FRONT_DRAPE_OE7',
  'BACK_CAPE_OE7',
  'SHOULDER_CAPE_OE7',
  'garmentGeom38OE7',
]) {
  if (!preview.includes(token)) throw new Error(`Falta token obligatorio 38.2o.e7: ${token}`);
}
if (!spec.includes('denseOrganicMeshes') || !spec.includes('BASILICA_TECHNOCRACY') || !spec.includes('PELAGIC_CONCORD')) {
  throw new Error('La spec 38.2o.e7 no valida suficientemente la nueva vestimenta orgánica.');
}
console.log('GENESIS_38_2OE7_AUDIT_OK: motor geométrico de vestimenta orgánica detectado');
