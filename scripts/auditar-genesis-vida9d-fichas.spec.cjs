const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const planet = fs.readFileSync(path.join(root,'src/app/presentation/planet-detail/planet-detail.html'),'utf8');
const styles = fs.readFileSync(path.join(root,'src/app/presentation/planet-detail/planet-detail.scss'),'utf8');
const preview = fs.readFileSync(path.join(root,'src/app/presentation/scientific-body-preview/scientific-body-preview.html'),'utf8');
test('hero en cuadrícula y sin localizador ni acceso',()=>{
  assert.match(styles, /\.planet-detail__hero\s*\{\s*display:\s*grid;/);
  assert.match(styles, /\.planet-detail__facts\s*\{\s*display:\s*grid;/);
  assert.doesNotMatch(planet, /\{\{\s*card\.locatorLabel\s*\}\}/);
  assert.doesNotMatch(planet, /<dt>Acceso<\/dt>/);
});
test('sin panel de auditoría VIDA.9a ni conocimiento observado en la ficha',()=>{
  assert.doesNotMatch(planet, /<app-vida9a-physical-biology-audit-panel/);
  assert.doesNotMatch(planet, /FASE 31\.12 · CONOCIMIENTO OBSERVADO/);
  assert.match(planet, /<app-vida9-full-system-biology-panel/);
});
test('lunas visibles solo si hay inventario detallado o menor',()=>{
  const guard = "section.id !== 'moons' || (card.sections.totalMoonCount ?? 0) > 0 || card.sections.allMoons.length > 0";
  assert.equal(planet.split(guard).length - 1, 2, 'misma condición para navegación y artículo');
  assert.match(planet, /section\.id === 'geology'/);
  assert.match(planet, /card\.sections\.allMoons\.length === 0/);
  assert.match(planet, /planet-section-vida/);
});
test('sin leyenda de escala comparativa, 3D limpio para planetas',()=>{
  assert.doesNotMatch(planet, /Escala lineal por diámetro\. El cuerpo mayor/);
  assert.match(preview, /@if \(model\.kind !== 'PLANET'\)/);
  assert.match(preview, /<small>REPRESENTACIÓN 3D<\/small>/);
});
