'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const source = file => fs.readFileSync(path.join(root, file), 'utf8');
const runtime = source('src/app/presentation/runtime/galaxy-knowledge-snapshot.runtime.ts');
const repository = source('src/app/data/local/repository/dexie-galaxy-knowledge-snapshot.repository.ts');
const entity = source('src/app/data/local/entity/galaxy-knowledge-snapshot.entity.ts');
const facade = source('src/app/presentation/galaxy-detail/galaxy-detail.facade.ts');
const discovery = source('src/app/presentation/runtime/galaxy-discovery-read-cache.runtime.ts');
const spec = source('src/app/presentation/runtime/galaxy-confirmed-telemetry-cache-gal3.spec.ts');
let checks = 0;
function check(description, test) {
  assert.ok(test, description);
  checks++;
}

// This audit is structural and portable. Vitest/Angular provide the actual
// runtime and integration verification; do not mistake regexes for E2E proof.
check('Entity persistente: telemetría', /readonly confirmedScientificTelemetryJson\?: string/.test(entity));
check('Entity persistente: revisión', /readonly confirmedScientificTelemetryRevision\?: string/.test(entity));
check('Contrato expone runtime persistente opcional', /resolveConfirmedTelemetry\?\(/.test(runtime));
check('Runtime concreto implementa método', /async resolveConfirmedTelemetry\(/.test(runtime));
check('Runtime comprueba revisión antes de leer', /persisted\?\.knowledgeRevision === knowledgeRevision/.test(runtime));
check('Runtime comprueba revisión específica de proyección', /persisted\.confirmedScientificTelemetryRevision === revision/.test(runtime));
check('Runtime lee fragmento de IndexedDB', /restoreTelemetryJson\(persisted\.confirmedScientificTelemetryJson\)/.test(runtime));
check('Runtime no reconstruye en acierto persistido', runtime.indexOf('return restoreTelemetryJson(') < runtime.indexOf('const confirmedDiscoveries = confirmedScientificDiscoveries38BisB7'));
check('Proyección usa exclusivamente confirmados', /confirmedScientificDiscoveries38BisB7\(knownDiscoveries\)/.test(runtime));
check('No altera estado de conocimiento', /DiscoveryState\.CONFIRMED/.test(runtime) && !/setState\(/.test(runtime));
check('Runtime serializa BigInt', /stringifyBigIntTree\(computed\)/.test(runtime));
check('Runtime restaura invariantes de telemetría', /new GalaxyExplorationTelemetry\(/.test(runtime));
check('Existe actualización atómica', /transaction\('rw', this\.database\.galaxyKnowledgeSnapshots/.test(repository));
check('La actualización exige revisión actual', /stored\.knowledgeRevision !== expectedKnowledgeRevision/.test(repository));
check('La escritura es parcial, no put entero', /\.galaxyKnowledgeSnapshots\.update\(key,/.test(repository));
check('El caché de memoria es limitado', /maxConfirmedTelemetryHot = 6/.test(runtime));
check('Se comparten requests concurrentes', /confirmedTelemetryInflight\.get\(pendingKey\)/.test(runtime));
check('No se restaura hot obsoleto tras petición nueva', /latestConfirmedTelemetryRevision\.get\(identity\) === revision/.test(runtime));
check('Facade utiliza el runtime persistente', /galaxyKnowledgeSnapshotRuntime\.resolveConfirmedTelemetry\(/.test(facade));
check('Facade valida loadId tras espera', /if \(loadId !== this\.loadSequence\) return;\s*const scientificProfile/.test(facade));
check('Facade tiene fallback compatible para dobles de test', /Compatibility with older runtime mocks/.test(facade));
check('El número de lecturas retenidas supera 12', /maxGalaxyEntries = 64/.test(discovery));
check('Lecturas dentro de transacción Dexie no usan cache', /if \(this\.inTransaction\(\)\)/.test(discovery));
check('El cambio de conocimiento limpia caches', /invalidate\(\): void \{[\s\S]*?universeResults\.clear\(\);[\s\S]*?galaxyResults\.clear\(\)/.test(discovery));
check('Test con 18 galaxias', /i < 18n/.test(spec));
check('Test contra nueva instancia', /const freshInstance = new DexieGalaxyKnowledgeSnapshotRuntime/.test(spec));
check('Test de invalidación por conocimiento nuevo', /rechaza un snapshot previo tras nueva evidencia/.test(spec));
check('Test de protección frente a escrituras atrasadas', /no escribe telemetría atrasada/.test(spec));

const vm = require('node:vm');
const ts = require('typescript');
const js = ts.transpileModule(runtime, {
  compilerOptions: {module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText;
let rebuilds = 0;
class FakeTelemetry {
  constructor(totalSectors, percentage, inventory, breakdown, compactHostSystems, compactHostPlanets) {
    Object.assign(this, {totalSectors,exploredPercentageBasisPoints:percentage,inventory,breakdown,
      compactHostSystems,compactHostPlanets});
  }
}
const fakeModules = {
  'galaxy-known-discoveries-canonical': {canonicalGalaxyKnownDiscoveries:(_,__,known)=>known},
  'scientific-confirmation-38-bis-b7': {confirmedScientificDiscoveries38BisB7:rows=>rows.filter(r=>r.state.code===4)},
  '@angular/core': {InjectionToken:class {constructor(label, options){this.label=label;this.options=options;}}},
  '@noble/hashes/sha2.js': {sha256:bytes=>bytes},
  '@noble/hashes/utils.js': {utf8ToBytes:text=>Buffer.from(text),bytesToHex:bytes=>Buffer.from(bytes).toString('hex')},
  'discovery-state': {DiscoveryState:{CONFIRMED:{code:4}}},
  'galaxy-exploration-telemetry': {GalaxyExplorationTelemetry:FakeTelemetry},
  'galaxy-knowledge-statistics': {GalaxyKnowledgeStatistics:class {}},
  'procedural-locator': {},
  'galaxy-known-compact-host-catalog-generator': {generateKnownCompactHostCatalog:()=>[]},
  'galaxy-exploration-telemetry-engine': {GalaxyExplorationTelemetryEngine:{build:()=>{
    rebuilds++;
    return new FakeTelemetry(100n,20n,{sectors:1n},{systems:{single:0n}},undefined,0n);
  }}},
  'galaxy-knowledge-statistics-engine': {GalaxyKnowledgeStatisticsEngine:{build:()=>({})}},
  'genesis-indexed-db': {GenesisIndexedDb:class {}},
  'dexie-galaxy-knowledge-snapshot.repository': {DexieGalaxyKnowledgeSnapshotRepository:class {}},
};
const exportsObj = {};
vm.runInNewContext(js, {
  exports:exportsObj,module:{exports:exportsObj},Buffer,Object,Promise,Map,BigInt,JSON,
  require(name) {
    const matched = Object.entries(fakeModules).find(([key]) => name === key || name.endsWith('/'+key));
    if (!matched) throw new Error('Dependencia inesperada: '+name);
    return matched[1];
  },
}, {filename:'galaxy-knowledge-snapshot.runtime.js'});

async function checkPersistence() {
  const {DexieGalaxyKnowledgeSnapshotRuntime:Runtime} = exportsObj;
  const saved = new Map();
  const key = {universeSeed:{serialize:()=> 'SEED-TEST'},generatorVersionCode:3};
  const repo = {
    async get(_,index) { return saved.get(index.toString()); },
    async put(entity) {saved.set(entity.galaxyIndex,entity);},
    async updateConfirmedScientificTelemetryIfRevisionMatches(_,index,_version,revision,telemetryRevision,json) {
      const id = index.toString();
      const existing = saved.get(id);
      if (!existing || existing.knowledgeRevision !== revision) return false;
      saved.set(id,{...existing,confirmedScientificTelemetryRevision:telemetryRevision,confirmedScientificTelemetryJson:json});
      return true;
    },
  };
  const hot = new Runtime(repo);
  for(let index=0n; index<19n; index++) {
    saved.set(index.toString(),{knowledgeRevision:`rev-${index}`,galaxyIndex:index.toString()});
    await hot.resolveConfirmedTelemetry(key,index,{code:1},[],`rev-${index}`);
  }
  check('19 galaxias calculadas una sola vez',rebuilds===19);
  await hot.resolveConfirmedTelemetry(key,0n,{code:1},[],'rev-0');
  check('El regreso a A tras 18 otras galaxias no recalcula',rebuilds===19);
  await new Runtime(repo).resolveConfirmedTelemetry(key,0n,{code:1},[],'rev-0');
  check('Un nuevo runtime recupera A desde IndexedDB simulado',rebuilds===19);
  saved.set('0',{knowledgeRevision:'rev-new',galaxyIndex:'0'});
  await hot.resolveConfirmedTelemetry(key,0n,{code:2},[],'rev-new');
  check('Revisión de conocimiento nueva recalcula una sola vez',rebuilds===20);
  check('Se guarda la nueva revisión autorizada',saved.get('0').confirmedScientificTelemetryRevision==='rev-new/2');
  console.log(`PASS GENESIS CACHE-GAL.3 — ${checks} comprobaciones portátiles (incluye ejecución real del runtime con 19 galaxias)`);
}
checkPersistence().catch(error=>{console.error(error);process.exitCode=1;});
