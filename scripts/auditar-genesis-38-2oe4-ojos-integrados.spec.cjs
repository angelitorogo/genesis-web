'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..', 'src/app/presentation/life-species-visual');
const ocular = fs.readFileSync(path.join(root, 'vida38-civilized-reptilian-ocular-38-2oe4.ts'), 'utf8');
const renderer = fs.readFileSync(path.join(root, 'vida38-civilized-reptilian-preview-38-2o.ts'), 'utf8');
const required = [
  /deriveVida38CivilReptilianOrbitalFrame38OE4/, /curvedOcularPatch38OE4/,
  /VIDA38_2OE4_REPTILIAN_/, /SphereGeometry\(1, 24, 16\)/,
];
for (const pattern of required) assert.match(ocular, pattern);
assert.match(renderer, /openOptics38OE4/);
assert.match(renderer, /TorusGeometry\(ringRadius/);
assert.doesNotMatch(renderer.slice(renderer.indexOf('function addVeryAdvancedAccessories38OE3'), renderer.indexOf('const wristY =', renderer.indexOf('function addVeryAdvancedAccessories38OE3'))), /new THREE\.BoxGeometry/);
assert.match(renderer, /vida38ReptilianOrbitalGlobe38OE4/);
console.log('GENESIS_38_2OE4_AUDIT_OK: globos integrados, iris curvado, ópticas abiertas');
