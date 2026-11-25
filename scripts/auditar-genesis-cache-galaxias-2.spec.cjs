'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const files = [
  'src/app/presentation/runtime/galaxy-discovery-read-cache.runtime.ts',
  'src/app/presentation/runtime/galaxy-discovery-read-cache.runtime.spec.ts',
  'src/app/presentation/runtime/galaxy-knowledge-snapshot.runtime.ts',
  'src/app/presentation/runtime/galaxy-knowledge-snapshot.runtime.spec.ts',
  'src/app/presentation/galaxy-detail/galaxy-detail.facade.ts',
  'src/app/presentation/galaxy-detail/galaxy-detail.spec.ts',
];
let passed = 0;
function check(name, fn) { fn(); passed++; console.log('  OK', name); }
for (const relative of files) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  check(`parse TS: ${path.basename(relative)}`, () => {
    const ast = ts.createSourceFile(relative, source, ts.ScriptTarget.Latest, true);
    assert.equal(ast.parseDiagnostics.length, 0, ast.parseDiagnostics.map(e => ts.flattenDiagnosticMessageText(e.messageText, '\n')).join('\n'));
  });
}
const cacheSource = fs.readFileSync(path.join(root,files[0]), 'utf8');
const facadeSource = fs.readFileSync(path.join(root,files[4]), 'utf8');
const snapshotSource = fs.readFileSync(path.join(root,files[2]), 'utf8');
check('Separate universe and galaxy LRU pools', () => {
  assert.match(cacheSource, /universeResults = new Map/);
  assert.match(cacheSource, /galaxyResults = new Map/);
  assert.match(cacheSource, /this\.universeResults\.clear\(\)/);
  assert.match(cacheSource, /this\.galaxyResults\.clear\(\)/);
});
check('Detail explicitly uses galaxy-scoped indexed repository', () => {
  assert.match(facadeSource, /discoveryRepository\.getKnownDiscoveriesInGalaxy\(/);
  assert.match(facadeSource, /galaxyIndex,/);
  assert.match(facadeSource, /: this\.repositories\.discoveryRepository\.getKnownDiscoveries\(/);
});
check('Snapshot LRU keyed by universe, version, galaxy and model version', () => {
  assert.match(snapshotSource, /private readonly hotSnapshots/);
  assert.match(snapshotSource, /galaxyIndex\.toString\(10\)/);
  assert.match(snapshotSource, /GALAXY_SCIENTIFIC_MODEL_VERSION/);
  assert.match(snapshotSource, /hot\?\.knowledgeRevision === knowledgeRevision/);
});
check('No forced discovery write or UI routing in added cache', () => {
  assert.doesNotMatch(cacheSource, /\.setNavigation\(|window\.location|\.reload\(/);
});
const js = ts.transpileModule(cacheSource, {
  compilerOptions: {module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2022},
}).outputText;
const moduleObj = { exports: {} };
vm.runInNewContext(js, {
  module: moduleObj, exports: moduleObj.exports,
  require(specifier) {
    if (specifier.includes('discovery-target-type')) {
      return {DiscoveryTargetType:{fromLocator:locator=>({code:locator.typeCode ?? 3})}};
    }
    throw new Error('Unexpected runtime import: '+specifier);
  },
}, {filename:'galaxy-discovery-read-cache.runtime.js'});
const {GalaxyDiscoveryReadCacheRuntime} = moduleObj.exports;
async function run() {
  let globalReads = 0;
  let galaxyReads = 0;
  let transaction = false;
  const key = {universeSeed:{serialize:()=> 'TEST-SEED'},generatorVersionCode:3};
  const repository = {
    async getKnownDiscoveries() {globalReads++;return [{locator:{galaxyIndex:0n, typeCode:3}}];},
    async getKnownDiscoveriesInGalaxy(_key, galaxyIndex, typeCode) {
      galaxyReads++;return [{locator:{galaxyIndex, typeCode:typeCode??3}}];
    },
  };
  const cache = new GalaxyDiscoveryReadCacheRuntime(repository, ()=>transaction);
  const initial = await cache.getKnownDiscoveries(key);
  check('Global universe read created once', () => assert.equal(globalReads, 1));
  for (let i=0; i<15; i++) {
    await cache.getKnownDiscoveriesInGalaxy(key, BigInt(i), 3);
    await cache.getKnownDiscoveriesInGalaxy(key, BigInt(i), 4);
  }
  const restored = await cache.getKnownDiscoveries(key);
  check('Universe data reused by identity after >18 galaxy misses', ()=>{
    assert.strictEqual(restored, initial);
    assert.equal(globalReads, 1);
  });
  const a1 = await cache.getKnownDiscoveriesInGalaxy(key, 0n);
  const b1 = await cache.getKnownDiscoveriesInGalaxy(key, 1n);
  const count = galaxyReads;
  const a2 = await cache.getKnownDiscoveriesInGalaxy(key, 0n);
  const b2 = await cache.getKnownDiscoveriesInGalaxy(key, 1n);
  check('Galaxy LRU retains A->B->A', ()=>{
    assert.strictEqual(a1,a2);assert.strictEqual(b1,b2);assert.equal(galaxyReads,count);
  });
  cache.invalidate();
  await cache.getKnownDiscoveries(key);
  await cache.getKnownDiscoveriesInGalaxy(key,0n);
  check('Knowledge invalidation clears both cache pools', ()=>{
    assert.equal(globalReads,2);assert.equal(galaxyReads,count+1);
  });
  transaction=true;
  await cache.getKnownDiscoveries(key);
  transaction=false;
  check('Transactions bypass the pinned snapshot', ()=>assert.equal(globalReads,3));
  console.log(`PASS GENESIS CACHE-GAL.2 — ${passed} verificaciones portátiles`);
}
run().catch(error=>{console.error(error);process.exitCode=1;});
