// Auditoría estructural aislada: no modifica ni carga IndexedDB.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
function source(relative) { return fs.readFileSync(path.join(root, relative), 'utf8'); }
const ex = () => source('src/app/presentation/exploration/exploration.html');
const gx = () => source('src/app/presentation/galaxy-detail/galaxy-detail.html');
const es = () => source('src/app/presentation/exploration/exploration.scss');
const gs = () => source('src/app/presentation/galaxy-detail/galaxy-detail.scss');
test('Navegación de Home y decisiones de foco usan botones visualmente homogéneos', () => {
  const h=ex(), css=es();
  assert.match(h,/class="exploration__back exploration__action" routerLink="\/"/);
  assert.match(h,/class="exploration__action exploration__action--full"\s+data-testid="external-galaxy-remain-action"/);
  assert.match(h,/class="exploration__action exploration__action--full"\s+data-testid="external-galaxy-validate-detection-action"/);
  assert.match(css,/\.exploration__reading \.exploration__action--full/);
  assert.match(h,/\(click\)="remainOnCurrentGalaxy\(\)"/);
  assert.match(h,/\[routerLink\]="\[\s*'\/galaxies',\s*preliminary\.galaxyIndex\.toString\(\)\s*\]"/);
});
test('Sin códigos internos ni referencias de desarrollo en la búsqueda', () => {
  const h=ex();
  for(const forbidden of [
    'SECUENCIA 7.4–7.8','Límite 7.4–7.8','Cada intento es determinista',
    'El intento queda registrado únicamente','La detección se registra como DETECTED',
    'preliminary.designationCode','Identificador interno','Ground Truth', 'FTL',
  ]) assert.ok(!h.includes(forbidden), `No debe mostrarse: ${forbidden}`);
  assert.match(h,/Galaxia \{\{ preliminary\.galaxyIndex \}\}/);
  assert.match(h,/data-testid="external-galaxy-search-action"/);
  assert.match(h,/data-testid="external-galaxy-detection-reward"/);
  assert.match(h,/data-testid="external-galaxy-search-effective-probability"/);
});
test('Título provisional compacto sin cambiar el nombre conocido ni el número', () => {
  const h=gx(), css=gs();
  assert.match(h,/class="gd__identity-name--pending"\s+data-testid="galaxy-detail-index"/);
  assert.match(h,/\{\{ model\.profile\.galaxyIndex \}\}/);
  assert.match(h,/data-testid="galaxy-detail-name"/);
  assert.match(css,/\.gd__identity h2\.gd__identity-name--pending/);
  assert.match(css,/overflow-wrap: anywhere/);
  assert.match(css,/minmax\(0, 1\.25fr\) minmax\(0, \.75fr\)/);
});
test('No se cambia el estado ni los mecanismos de detección', () => {
  const h=ex();
  for(const token of ['facade.externalSearchResult()', 'facade.externalFocusChoiceRequired()',
    'facade.externalSearchPending()', 'searchExternalGalaxy()',
    'preliminary.morphologyHint','preliminary.scaleHint','facade.externalFocusPending()'])
    assert.ok(h.includes(token), `${token} debe conservarse`);
});
