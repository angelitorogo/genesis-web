'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const prefix = 'src/app/presentation/genesis-archive/';
const component = read(prefix + 'archive-discovery-detail.ts');
const facade = read(prefix + 'archive-discovery-detail.facade.ts');
const html = read(prefix + 'archive-discovery-detail.html');
const scientificSpec = read(prefix + 'archive-nucleus-sync-v3.spec.ts');
const routeSpec = read(prefix + 'archive-nucleus-route-sync.spec.ts');
const checks = [
  ['angular route observable', () => assert.match(component, /combineLatest\(\[/)],
  ['route listener disposal', () => assert.match(component, /nucleusRouteSubscription\?\.unsubscribe\(\)/)],
  ['nucleus-only navigation refresh', () => assert.match(component, /if \(!this\.routedNucleus && !isNucleus\) return/)],
  ['frozen galactic-centre identity', () => assert.match(component, /request\.sectorKey === '0' && request\.galacticObjectIndex === '0'/)],
  ['initial request maintained', () => assert.match(component, /void this\.facade\.load\(initial\)/)],
  ['scientific stage read before aux', () => assert.match(facade, /const isConfirmedActiveNucleus[\s\S]*?this\.stateSignal\s*\.set/)],
  ['aux only when confirmed', () => assert.match(facade, /galacticObjectCard\?\.knowledgeLevel === 'CONFIRMED'/)],
  ['aux guarded by canonical galactic-centre locator', () => assert.match(facade, /isGalacticNucleusLocator\(locator\)/)],
  ['async follow-up after primary publication', () => assert.match(facade, /this\.stateSignal\s*\.set\(\{[\s\S]*?if \(isConfirmedActiveNucleus &&[\s\S]*?void this\.resolveNucleusSupplementaryScience/)],
  ['all three aux operations isolated', () => assert.match(facade, /Promise\.allSettled\(\[/)],
  ['discard stale results on a newer route', () => assert.match(facade, /if \(version !== this\.resolutionVersion\) return;[\s\S]*?const current = this\.stateSignal\(\)/)],
  ['allow independent retry without scientific commit', () => assert.match(html, /archive-nucleus-retry-supplementary[\s\S]*?retryScientificCardRefresh\(\)/)],
  ['V3 representative route', () => assert.match(scientificSpec, /GeneratorVersion\.V3/)],
  ['full staged scientific progression', () => assert.match(scientificSpec, /DETECTED[\s\S]*?DISCOVERED[\s\S]*?CATALOGUED[\s\S]*?CONFIRMED/)],
  ['nuclear rendering stays stable', () => assert.match(scientificSpec, /galacticObjectCard\?\.render\.kind\)\.toBe\(renderKind\)/)],
  ['aux fails without losing confirmation', () => assert.match(scientificSpec, /keep[s]? the confirmed scientific state when jets, lensing and completion each reject/)],
  ['route-reuse regression', () => assert.match(routeSpec, /params\.next\(convertToParamMap/)],
];
let pass = 0;
for (const [label, check] of checks) {
  try { check(); console.log('OK', label); pass++; }
  catch (error) { console.error('FALLO', label, error.message); process.exitCode = 1; }
}
console.log(`NUCLEUS-SYNC.1: ${pass}/${checks.length} verificaciones estructurales.`);
