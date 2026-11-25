#!/usr/bin/env node
'use strict';
/** 38.8R: portable structural audit of the 44-test contract reconciliation.
 * This is not a replacement for the real Angular/Vitest test run. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
let passed = 0;
function check(name, file, contains) {
  const source = read(file);
  assert.ok(source.includes(contains), `${name}: ${file} missing ${contains}`);
  passed++;
  console.log(`OK ${String(passed).padStart(2, '0')} ${name}`);
}
check('38.8 remains installed',
  'src/app/presentation/visual-provenance/genesis-visual-provenance-38-8.ts',
  'genesisVisualTrace388');
check('Canonical VIDA tier has precedence over legacy aliases',
  'src/app/presentation/life-species-visual/vida38-species-visual-preview-scene.ts',
  "'civilizationTier' in intelligence");
check('Nested legacy lab aliases are parsed only after canonical check',
  'src/app/presentation/life-species-visual/vida38-species-visual-preview-scene.ts',
  "const nestedCivilization = intelligence['civilization']");
check('Explicit canonical null cannot turn into a colony',
  'src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2od4.spec.ts',
  "civilizationTier: null");
check('Colonial optical lamps use actual generated pieces',
  'src/app/presentation/infrastructure/vida38-infrastructure-render-38-6.ts',
  'const carriers = candidates.length > 0 ? candidates : parts;');
check('Ground fixture tests real triangulated terrain',
  'src/app/presentation/infrastructure/colvis3-colony-ground-contact-t7o.spec.ts',
  'surfaceHit!.point.y+.15+gap');
check('Colonial shader fixture uses the real Three.js vertex chunks',
  'src/app/presentation/infrastructure/vida38-colonial-radial-occlusion-38-6c4.spec.ts',
  '#include <defaultnormal_vertex>');
check('Lunar fixture follows VISSURF.6 stellar source shape',
  'src/app/presentation/moon-detail/moon-scientific-card.spec.ts',
  'stars: [], // VISSURF.6');
check('38.7 snapshot includes independent moons',
  'src/app/presentation/system/system-biology-knowledge-38-7.spec.ts',
  'moons: Object.freeze([])');
check('38.7x indexes lunar observations independently',
  'src/app/presentation/system/system-scene-civilization-visuals-38-7b.spec.ts',
  "indexed.get('3:MOON:0')");
check('VISCIV test requires persistent confirmed state',
  'src/app/presentation/system/system-scene-orbital-infrastructure-visciv6e.spec.ts',
  'discoveryStateCode: 5');
check('Archive fixture implements persistent sort-index signals',
  'src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-list-layout-38-bis-b2.spec.ts',
  'sortIndexStats38BisT3:signal({valid:0,stale:0})');
check('Archive population is expected in the latest colonial fields',
  'src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-list-layout-38-bis-b1.spec.ts',
  "'Población colonial total'");
check('Archive only invalidates confirmed knowledge',
  'src/app/data/local/repository/genesis-knowledge-commits-38-bis-b6.spec.ts',
  'T3b only invalidates the CONFIRMED catalog');
check('MOONCAD.1 tests group cadence shared with fiches',
  'src/app/presentation/laboratory/stellar-systems/stellar-system-laboratory.spec.ts',
  'systemSceneMoonGroupPresentationTimeScaleV1(');
console.log(`GENESIS 38.8R · auditoría estructural: ${passed}/${passed} comprobaciones. Ejecutar Vitest y build en el proyecto real.`);
