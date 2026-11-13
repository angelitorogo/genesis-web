const fs = require('fs');
const path = require('path');

const root = process.cwd();
const previewPath = path.join(root, 'src/app/presentation/life-species-visual/vida38-civilized-reptilian-preview-38-2o.ts');
const specPath = path.join(root, 'src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe6a.spec.ts');
const preview = fs.readFileSync(previewPath, 'utf8');
const spec = fs.readFileSync(specPath, 'utf8');

for (const token of [
  'addCultureSignature38OE6A',
  'BASILICA_STOLE_FRONT',
  'BASILICA_GLYPH',
  'PELAGIC_DORSAL_FIN',
  'PELAGIC_LEFT_VEIL',
  'PELAGIC_WAVE_OVERLAY',
  "vida38ReptilianCultureStyle38OE6A",
]) {
  if (!preview.includes(token)) throw new Error(`Falta token cultural: ${token}`);
}
if (!spec.includes('BASILICA_TECHNOCRACY') || !spec.includes('PELAGIC_CONCORD')) {
  throw new Error('La spec cultural no verifica BASILICA_TECHNOCRACY y PELAGIC_CONCORD.');
}
console.log('GENESIS_38_2OE6A_AUDIT_OK: refinamiento cultural de indumentaria reptiliana detectado');
