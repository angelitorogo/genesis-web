const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = x => fs.readFileSync(path.join(root, 'src/app/presentation/galaxy-detail', x), 'utf8');

test('el panel de acreción carece de etiquetas de desarrollo', () => {
  const html = read('galaxy-accretion-disk-visualization.html');
  assert.doesNotMatch(html, /28\.1c|REFINAMIENTO VISUAL ESTRICTO/);
  assert.match(html, /REPRESENTACIÓN DEL NÚCLEO/);
});

test('se traducen las 16 familias AGN y cuásar sin alterar los motores', () => {
  const s = read('galaxy-accretion-disk-display.ts');
  const interpret = read('galaxy-accretion-disk-interpretation.ts');
  assert.equal((s.match(/: '[^']+',/g) || []).filter(x=>!x.includes('return')).length >= 16, true);
  for (const familia of ['LOW_LUMINOSITY_AGN', 'THIN_LUMINOUS_DISK', 'HYPERLUMINOUS_CORONA', 'TWIN_RELATIVISTIC_JETS']) {
    assert.match(s, new RegExp(familia + ':'));
  }
  assert.match(interpret, /regimenVisualGalactico\(model\.family\)/);
  assert.doesNotMatch(interpret, /model\.family\.replaceAll/);
});

test('se retiran los sufijos de los nombres de magnitudes en la vista', () => {
  const html = read('galaxy-detail.html');
  const ts = read('galaxy-detail.ts');
  assert.match(html, /etiquetaMagnitudAcrecion\(fact\.label\)/);
  assert.match(ts, /readonly etiquetaMagnitudAcrecion = etiquetaMagnitudAcrecion/);
  assert.doesNotMatch(html, /<dt>\{\{ fact\.label \}\}<\/dt>/);
});

test('mantiene valores, acciones y condicionantes originales de la observación', () => {
  const html = read('galaxy-detail.html');
  assert.match(html, /<dd>\{\{ fact\.value \}\}<\/dd>/);
  assert.match(html, /@if \(disk\.observed\)/);
  assert.match(html, /\[disabled\]="!disk\.canObserve \|\| facade\.accretionPending\(\)"/);
  assert.match(html, /\(click\)="observeAccretionDisk\(\)"/);
});
