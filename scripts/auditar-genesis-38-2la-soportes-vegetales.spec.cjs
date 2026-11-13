'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const base = path.join(__dirname, '..', 'src/app/presentation/life-species-visual');
const preview = fs.readFileSync(path.join(base, 'vida38-species-visual-preview-scene.ts'), 'utf8');
const architecture = fs.readFileSync(path.join(base, 'vida38-plant-architecture-38-2l.ts'), 'utf8');
const morphology = fs.readFileSync(path.join(base, 'vida38-plant-morphology-38-2l.ts'), 'utf8');
const visual = fs.readFileSync(path.join(base, 'vida38-plant-preview-38-2l.ts'), 'utf8');
// Prueba estructural: el único atrezzo en CANOPY tiene una guarda que excluye PLANT_FORM.
assert.match(preview, /descriptor\.habitatCue === 'CANOPY' && descriptor\.family !== 'PLANT_FORM'/);
assert.match(preview, /branch\.name = 'VIDA38_CANOPY_DECORATIVE_REFERENCE_BRANCH'/);
assert.equal((preview.match(/new THREE\.CylinderGeometry\(0\.11, 0\.14, 1\.95, 16, 1\)/g) || []).length, 1);
assert.match(preview, /createVida38PlantPreview38L\(subject, contract/);
// El soporte no se traslada al generador vegetal y la ramificación real sigue presente.
assert.doesNotMatch(visual, /CANOPY_DECORATIVE_REFERENCE_BRANCH/);
assert.match(visual, /createVida38PlantStemsGeometry38L/);
assert.match(architecture, /const branchPoints=\[base,p1,p2,p3\] as const;/);
assert.match(morphology, /meters<=1\?'HERB':meters<=2\?'SHRUB':'TREE'/);
console.log('GENESIS_38_2LA_AUDIT_OK: sin soporte de atrezzo en PLANTS_TREES; arquitectura vegetal conservada');
