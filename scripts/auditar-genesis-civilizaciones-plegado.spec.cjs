const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const component=fs.readFileSync(path.join(root,'src/app/presentation/galaxy-detail/galaxy-civilizations-inventory.ts'),'utf8');
const index=fs.readFileSync(path.join(root,'src/app/presentation/galaxy-knowledge-catalog/galaxy-civilization-known-index.ts'),'utf8');
test('desplegable idéntico en estructura al inventario y sin tarjetas internas',()=>{
  assert.match(component,/class="gci__rail-facts"/);
  assert.match(component,/:host\(\.gci-expanded\) \{ grid-column: 1 \/ -1/);
  assert.match(component,/\(toggle\)="onDetailsToggle\(\$event\)"/);
  assert.doesNotMatch(component,/gci__levels|gci__notice|Ver todas las civilizaciones|Actualizar recuento/);
});
test('tres categorías enlazan al explorador y el total también es un enlace',()=>{
  for(const level of ['PRIMITIVE','ADVANCED','VERY_ADVANCED'])assert.ok(component.includes(`type: '${level}'`));
  assert.match(component,/galaxy-detail-civilizations-catalog-link/);
  assert.match(component,/\(click\)="\$event\.stopPropagation\(\)"/);
});
test('el inventario no publica progreso de lotes, solamente el resultado final',()=>{
  assert.match(component,/\.index\.read\(generationKey, this\.galaxyIndex\)\.then/);
  assert.doesNotMatch(component,/partial\s*=>|this\.census\.set\(partial\)/);
  assert.match(component,/if \(n !== this\.sequence\) return;/);
});
test('índice de conocimiento persistido sin recuentos temporales obsoletos',()=>{
  assert.doesNotMatch(index,/this\.recent\.get/);
  assert.match(index,/civilizationKnowledgeRevision/);
  assert.match(index,/key\.universeSeed\.serialize\(\),key\.generatorVersionCode,galaxyIndex/);
  assert.match(index,/confirmed\.has\(row\.systemStorageKey\)/);
});
