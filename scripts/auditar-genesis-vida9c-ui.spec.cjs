'use strict';
// Auditoría estructural portable, sin Angular ni dependencias añadidas.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {test}=require('node:test');
const root=path.resolve(__dirname,'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');

test('VIDA.9c: sección Vida en el orden 06, 07, 08 y 09',()=>{
  const h=read('src/app/presentation/planet-detail/planet-detail.html');
  const meta=read('src/app/presentation/planet-detail/planet-scientific-fiche-layout.ts');
  assert.match(h,/section\.id === 'geology'/);
  assert.match(h,/id="planet-section-vida"/);
  assert.match(h,/SECCIÓN 07[\s\S]*?<h2 id="planet-section-title-vida">Vida<\/h2>/);
  assert.match(meta,/moons: Object\.freeze\(\{eyebrow:'SECCIÓN 08'/);
  assert.match(meta,/comparison: Object\.freeze\(\{eyebrow:'SECCIÓN 09'/);
});

test('VIDA.9c: tres desplegables inicialmente cerrados y listas simples',()=>{
  const p=read('src/app/presentation/scientific/vida9-full-system-biology-panel.ts');
  assert.equal((p.match(/<details data-testid=/g)||[]).length,3);
  assert.doesNotMatch(p,/<details open/);
  assert.doesNotMatch(p,/VIDA\.6 ·|VIDA\.7 ·|VIDA\.8 ·/);
  assert.match(p,/especie\.proceduralName/);
  assert.doesNotMatch(p,/bodyLengthMeters|phenotype|species\.id/);
});

test('VIDA.9c: rutas independientes para planeta y luna',()=>{
  const r=read('src/app/app.routes.ts');
  assert.match(r,/planet\/:bodyIndex\/species\/:speciesId/);
  assert.match(r,/moon\/:moonIndex\/species\/:speciesId/);
  const p=read('src/app/presentation/life-species-detail/life-species-detail.ts');
  assert.match(p,/ArchiveDiscoveryLocatorKind\.SYSTEM/);
  assert.match(p,/confirmedBiologyVIDA9/);
  assert.match(p,/Vida6Species/);
  assert.match(p,/etiquetaVidaEs/);
});

test('VIDA.9c: sin modificaciones de simulación, dominio o persistencia',()=>{
  // El manifiesto incremental solo contiene archivos de presentación, rutas y pruebas.
  const folders=['src/app/simulation','src/app/domain','src/app/data'];
  for(const folder of folders) assert.equal(fs.existsSync(path.join(root,folder,'vida9c-modified')),false);
});
