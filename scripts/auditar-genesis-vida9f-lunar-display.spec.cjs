'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const adapter = read('src/app/presentation/moon-detail/moon-scientific-compact-vida9e.ts');
const scss = read('src/app/presentation/moon-detail/moon-detail.scss');
const html = read('src/app/presentation/moon-detail/moon-detail.html');
const preview = read('src/app/presentation/scientific-body-preview/scientific-body-preview.html');
test('VIDA.9f — los resultados lunares conservan datos y ocultan detalles de los motores', () => {
  assert.match(adapter, /moonScientificDisplayTextVIDA9f\(value\.value\)/);
  assert.match(adapter, /Océano subsuperficial presente/);
  assert.doesNotMatch(adapter, /Math\.random\s*\(/);
});
test('VIDA.9f — los valores 0–1 se formatean como porcentaje español', () => {
  assert.match(adapter, /Intl\.NumberFormat\('es-ES'/);
  assert.match(adapter, /part \* 100/);
});
test('VIDA.9f — botones se adaptan sin desbordamiento horizontal', () => {
  assert.match(scss, /\.moon-detail__section-nav\s*\{[^}]*flex-wrap:\s*wrap;/s);
  assert.match(scss, /\.moon-detail__section-nav\s*\{[^}]*overflow:\s*visible;/s);
});
test('VIDA.9f — no se muestran notas técnicas en cabecera lunar 3D', () => {
  assert.match(preview, /model\.kind !== 'PLANET' && model\.kind !== 'MOON'/);
  assert.match(html, /displayScientificText\(badge\)/);
});
