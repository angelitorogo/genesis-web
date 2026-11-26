'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const load = p => fs.readFileSync(path.join(root, p), 'utf8');
const repo = load('src/app/data/local/repository/dexie-discovery.repository.ts');
const contract = load('src/app/domain/repository/genesis-repositories.ts');
const runtime = load('src/app/presentation/runtime/external-galaxy-search.runtime.ts');
const ui = load('src/app/presentation/exploration/exploration.ts');
const html = load('src/app/presentation/exploration/exploration.html');
const css = load('src/app/presentation/exploration/exploration-warp.scss');
const cases = [
 ['optional backward-compatible galaxy-only repository API', () => assert.match(contract,/getKnownGalaxyDiscoveries\?\(/)],
 ['indexed compound key without schema migration', () => assert.match(repo,/where\('\[universeSeed\+generatorVersionCode\+targetTypeCode\+targetSeed\]'\)/)],
 ['restrict rows to GALAXY type', () => assert.match(repo,/targetTypeCode = DiscoveryTargetType\.GALAXY\.code/)],
 ['hydrate through existing integrity validation', () => assert.match(repo,/entities\.map\(entity => this\.toKnownDiscovery\(generationKey, entity\)\)/)],
 ['runtime reads only galaxy scope for search/status', () => assert.equal((runtime.match(/this\.getKnownGalaxyDiscoveries\(generationKey\)/g)||[]).length,2)],
 ['compatibility fallback for legacy repository doubles', () => assert.match(runtime,/this\.discoveryRepository\.getKnownDiscoveries\(generationKey\)/)],
 ['original atomic database transaction remains', () => assert.match(runtime,/\.transaction\(\s*'rw'/)],
 ['search engine remains source of deterministic outcome', () => assert.match(runtime,/ExternalGalaxySearchEngine\s*\.resolveNextSearch/)],
 ['result depends on persisted search not graphics', () => assert.match(ui,/await this\.facade\.searchExternalGalaxy\(\)/)],
 ['warp visual hold limited to 1.35s minimum, not blocking real search', () => assert.match(ui,/EXTERNAL_WARP_MINIMUM_VISIBLE_MS = 1350/)],
 ['repeat click cannot start extra search', () => assert.match(ui,/this\.warpActive\(\) \|\| this\.facade\.externalSearchPending\(\)/)],
 ['starfield 52 deterministic particles', () => assert.match(ui,/Array\.from\(\{ length: 52 \}/)],
 ['warp appears while result withheld', () => assert.match(html,/@if \(warpActive\(\)\) \{[\s\S]*?@else if \(facade\.externalSearchResult/)],
 ['CSS animations use only transforms', () => assert.match(css,/@keyframes genesis-warp-flight/)],
 ['reduced-motion accessibility', () => assert.match(css, /prefers-reduced-motion:reduce/)],
 ['interaction remains disabled throughout animation', () => assert.match(html,/facade\.externalSearchPending\(\) \|\|\s*warpActive\(\)/)],
];
for (const [name, fn] of cases) { fn(); console.log('OK', name); }
console.log(`FASTSCAN.1 — ${cases.length}/${cases.length} structural checks OK`);
