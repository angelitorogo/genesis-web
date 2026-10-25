#!/usr/bin/env node
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const resolver=read('src/app/simulation/planetary/planet-scientific-target-resolver.ts');
const projection=read('src/app/presentation/planet-detail/planet-scientific-sections.ts');
const html=read('src/app/presentation/planet-detail/planet-detail.html');
const scss=read('src/app/presentation/planet-detail/planet-detail.scss');

test('La proyección V3 enumera identidades reales sin regenerar física ni semillas',()=>{
 assert.match(resolver,/publicGeneratorVersionCode === 3[\s\S]*?moonSystem\.moonIdentities/);
 assert.match(resolver,/slice\(moonSystem\.relevantMoonCount\)/);
 assert.match(resolver,/identity\.designation\.name/);
 assert.match(resolver,/moonIndex: identity\.moonOrdinal - 1/);
 const snippet=resolver.slice(resolver.indexOf('minorMoonIdentities:',resolver.indexOf('moons:\n            Object.freeze')));
 assert.ok(!snippet.slice(0,snippet.indexOf('relevantMoons:')).includes('MinorMoonOnDemandPRE3310.materialize'));
});
test('La sección lista las dos clases de lunas por ordinal real',()=>{
 assert.match(projection,/allMoons: readonly PlanetScientificMoonListEntry\[\]/);
 assert.match(projection,/kind: 'IDENTITY_ONLY' as const/);
 assert.match(projection,/kind: 'DETAILED' as const/);
 assert.match(projection,/sort\(\(a, b\) => a\.moonIndex - b\.moonIndex\)/);
 assert.match(projection,/fields: Object\.freeze\(\[\]\)/);
});
test('Las subfichas empiezan plegadas, admiten teclado, y diferencian estado físico',()=>{
 assert.match(html,/<details\s+[\s\S]*?planet-detail__moon-card/);
 assert.match(html,/<summary class="planet-detail__moon-summary">/);
 assert.doesNotMatch(html,/<details[^>]*\sopen(?:\s|=|>)/);
 assert.match(html,/Solo identidad · Física pendiente/);
 assert.match(html,/Caracterización individual/);
 assert.match(html,/moonRoute\(moon\.moonIndex\)/);
 assert.match(scss,/planet-detail__moon-summary:focus-visible/);
});
test('La subficha de identidad no inventa masa, agua, dosis o vida',()=>{
 assert.match(html,/moon\.kind === 'DETAILED'/);
 assert.match(html,/composición, habitabilidad y vida no están físicamente resueltos/);
 assert.match(html,/escenarios dinámicos condicionales/);
 assert.match(projection,/minorMoonIdentities \?\? \[\]/);
});
