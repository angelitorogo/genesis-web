'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const engine = read('src/app/simulation/life/life-plausibility-engine-vida2.ts');
const adapter = read('src/app/simulation/life/life-plausibility-physical-adapter-vida2.ts');
for (const kind of ['planet', 'moon']) {
  const card = read(`src/app/presentation/${kind}-detail/${kind}-scientific-card.ts`);
  const html = read(`src/app/presentation/${kind}-detail/${kind}-detail.html`);
  test(`VIDA.2 ${kind}: card consume datos tipados y ficha incluye las dos rutas`, () => {
    assert.match(card, new RegExp(`Vida2PhysicalInput\\.${kind}\\(target\\)`));
    assert.match(html, /card\.vida2/);
    assert.match(html, /Vida · Plausibilidad ambiental/);
    assert.match(html, /path\.factors\.water/);
    assert.match(html, /path\.factors\.temperature/);
    assert.match(html, /path\.factors\.protection/);
    assert.match(html, /path\.factors\.energy/);
    assert.match(html, /'SURFACE'/);
    assert.doesNotMatch(html, /Vida\.2\. No se presupone/);
  });
}
test('VIDA.2: cuatro factores con pesos explícitos y un resultado sin vida', () => {
  assert.match(engine, /water: 35, temperature: 25, protection: 20, energy: 20/);
  assert.match(engine, /lifeGenerated: false/);
  assert.match(engine, /'PLAUSIBLE' \| 'NOT_PLAUSIBLE' \| 'INDETERMINATE'/);
  assert.doesNotMatch(engine, /Math\.random|Date\.now|crypto|indexedDB|Dexie|localStorage/);
});
test('VIDA.2: no usa texto de las fichas ni bioquímica obsoleta como causa', () => {
  assert.match(adapter, /PlanetScientificResolvedTarget/);
  assert.match(adapter, /MoonScientificResolvedTarget/);
  assert.match(adapter, /oceanReality32F2c/);
  assert.match(adapter, /hasPersistentSurfaceLiquidWater/);
  assert.doesNotMatch(adapter, /parseFloat|parseInt|PRE3307|GeochemistryWorld|ABI0GENESIS|Math\.random/);
});
test('VIDA.2: sin persistencia, sin escritura de universo y sin alterar física', () => {
  assert.doesNotMatch(engine + adapter, /\.put\(|\.add\(|\.delete\(|openDatabase\(|\.save\(|createUniverse/);
});
test('VIDA.2: la luna de identidad solamente permanece indeterminada', () => {
  const html = read('src/app/presentation/moon-detail/moon-detail.html');
  assert.match(html, /IDENTITY_ONLY/);
  assert.match(html, /Indeterminado: esta luna solo tiene identidad/);
});
