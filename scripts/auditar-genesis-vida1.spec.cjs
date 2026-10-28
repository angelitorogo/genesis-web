'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const file = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const planet = file('src/app/presentation/planet-detail/planet-detail.html');
const moon = file('src/app/presentation/moon-detail/moon-detail.html');
const projection = file('src/app/presentation/scientific/vida-1-compact-fiche.ts');

for (const [name, html] of [['planet', planet], ['moon', moon]]) {
  test(`VIDA.1 ${name}: la ficha conserva control de acceso y vista 3D`, () => {
    assert.match(html, new RegExp(`data-testid="${name}-detail-locked"`));
    assert.match(html, new RegExp(`data-testid="${name}-scientific-preview"`));
    assert.match(html, new RegExp(`data-testid="${name}-vida-plausibility"`));
    assert.match(html, /sourceQueryParams\(\)/);
  });
  test(`VIDA.1 ${name}: sin informes ni módulos científicos densos en la pantalla`, () => {
    assert.doesNotMatch(html, /observedHabitability|31\.12|PRE-33\.0|geoquímica|radiación ionizante|historia ambiental/i);
    assert.ok(html.split('\n').length < 200, `Plantilla no es compacta: ${html.split('\n').length} líneas`);
  });
}

test('VIDA.1: la ficha planetaria conserva todas las lunas (incluso solo identidad) con ruta propia', () => {
  assert.match(planet, /card\.sections\.allMoons/);
  assert.match(planet, /moonRoute\(moon\.moonIndex\)/);
  assert.match(planet, /planet-detail-moon-fiche-link/);
});

test('VIDA.1: identidad lunar no se interpreta como ausencia de agua o vida', () => {
  assert.match(moon, /IDENTITY_ONLY/);
  assert.match(moon, /no implica ausencia de vida/i);
});

test('VIDA.1: proyección sin física recalculada y sin campos históricos de la antigua interfaz', () => {
  assert.match(projection, /'No determinado'/);
  assert.match(projection, /'Composición dominante'/);
  assert.match(projection, /'Océano CT-0 del universo simulado/);
  assert.doesNotMatch(projection, /Math\.random|Date\.now|evaluate\(|createOcean|createBiosphere|generatedEvents/);
});

for (const [name, html] of [['planet', planet], ['moon', moon]]) {
  test(`VIDA.1a ${name}: comparación terrestre restaurada sin duplicar motores`, () => {
    assert.match(html, new RegExp(`data-testid="${name}-detail-earth-size-comparison"`));
    assert.match(html, /card\.sections\.comparison\.worldDiameterPercent/);
    assert.match(html, /card\.sections\.comparison\.earthDiameterPercent/);
    assert.match(html, /section\.id === 'comparison'/);
  });
}
