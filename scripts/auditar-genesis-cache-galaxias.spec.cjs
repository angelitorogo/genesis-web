'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const src = (pathName) => fs.readFileSync(path.join(root, pathName), 'utf8');
const cachePath = 'src/app/presentation/runtime/galaxy-discovery-read-cache.runtime.ts';
const cacheTs = src(cachePath);
const repositoryTs = src('src/app/presentation/runtime/genesis-local-repositories.ts');
const listTs = src('src/app/presentation/discovered-galaxies/discovered-galaxies.facade.ts');
const detailTs = src('src/app/presentation/galaxy-detail/galaxy-detail.facade.ts');
let checked = 0;
function check(ok, message) { assert.ok(ok, message); checked++; }
for (const [name, code] of [
  [cachePath,cacheTs], ['genesis-local-repositories.ts',repositoryTs],
  ['discovered-galaxies.facade.ts',listTs],['galaxy-detail.facade.ts',detailTs],
]) {
  const output = ts.transpileModule(code, {fileName:name, compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},reportDiagnostics:true});
  const errors = (output.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
  check(errors.length===0, `${name}: ${errors.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')).join('; ')}`);
}
check(repositoryTs.includes('new GalaxyDiscoveryReadCacheRuntime('), 'El cache debe usarse por el repositorio raiz');
check(repositoryTs.includes("Dexie.on('storagemutated'"), 'Debe invalidarse mediante cambios IndexedDB');
check(listTs.includes('getStaticGalaxyMetadata('), 'El listado reutiliza datos deterministas');
check(detailTs.includes('knowledgeSnapshot.knowledgeRevision'), 'La telemetria se vincula a revision persistida');
check(detailTs.includes('confirmedScientificDiscoveries38BisB7'), 'El cache nunca incluye contenido no confirmado');
check(cacheTs.includes('maxEntries = 6') ||
  (cacheTs.includes('maxUniverseEntries = 2') && cacheTs.includes('maxGalaxyEntries = 64')),
  'Cache de descubrimientos acotada, incluyendo la separación U/G');
check(cacheTs.includes('if (this.inTransaction())'), 'No usar snapshots durante transacciones Dexie');
check(cacheTs.includes('getKnownDiscoveriesInSector('), 'Los sectores preservan su ruta de lectura original');
check(!/this\.source\.getKnownDiscoveriesInSector\([^;]+this\.resolve\(/s.test(cacheTs), 'No se cachea exploracion sectorial');

const transpiled = ts.transpileModule(cacheTs,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const moduleObject={exports:{}};
vm.runInNewContext(transpiled,{
  module:moduleObject,exports:moduleObject.exports,
  require(name) {
    if(name.includes('discovery-target-type')) return {DiscoveryTargetType:{fromLocator(locator){return {code:locator.type};}}};
    throw Error(`Dependencia inesperada en cache portatil: ${name}`);
  },Promise,Map,Set,Object,Error,console,
},{filename:cachePath});
const {GalaxyDiscoveryReadCacheRuntime:Cache,galaxyDiscoveryCacheAffectedByMutation:mutationAffects}=moduleObject.exports;
const mk=(version)=>({universeSeed:{serialize:()=> 'SEED-X'},generatorVersionCode:version});
async function main(){
  let full=0,galaxy=0,writes=0;
  const rows=[{locator:{galaxyIndex:0n,type:1},state:{code:4}}];
  const source={
    getState:async()=>({code:4}),setState:async()=>{writes++;},
    getKnownDiscoveries:async()=>{full++;return rows;},
    getKnownDiscoveriesInGalaxy:async()=>{galaxy++;return rows;},
    getKnownDiscoveriesInSector:async()=>rows,
    getObservationProgressMilestones:async()=>[],
  };
  const cached=new Cache(source),a=mk(3),b=mk(2);
  const [one,two]=await Promise.all([cached.getKnownDiscoveries(a),cached.getKnownDiscoveries(a)]);
  check(one===two && full===1,'Lecturas concurrentes y secuenciales comparten snapshot');
  const third=await cached.getKnownDiscoveries(a);
  check(third===one && full===1,'Navegacion caliente evita segunda hidratacion IndexedDB');
  await cached.getKnownDiscoveries(b);
  check(full===2,'Identidad del generador aisla cache');
  await cached.getKnownDiscoveriesInGalaxy(a,0n);
  await cached.getKnownDiscoveriesInGalaxy(a,0n);
  await cached.getKnownDiscoveriesInGalaxy(a,0n,4);
  check(galaxy===2,'Galaxia y filtro de tipo tienen entradas independientes');
  await cached.setState(a,{galaxyIndex:0n},{code:4});
  await cached.getKnownDiscoveries(a);
  check(writes===1&&full===3,'Escritura local invalida datos antiguos');
  let inTransaction=false;
  const txCache=new Cache(source,()=>inTransaction);
  await txCache.getKnownDiscoveries(a);
  inTransaction=true;
  await txCache.getKnownDiscoveries(a);
  inTransaction=false;
  check(full===5,'Las transacciones no utilizan datos previos de cache');
  cached.invalidate();
  await cached.getKnownDiscoveriesInGalaxy(a,0n);
  check(galaxy===3,'Evento remoto invalida el cache de galaxia');
  check(mutationAffects({'idb://genesis-web/discoveries/':{}}),'Cambio descubrimientos invalida');
  check(mutationAffects({'idb://genesis-web/universes/':{}}),'Borrado/restauracion universo invalida');
  check(!mutationAffects({'idb://genesis-web/privateBiologicalRecordsVIDA9/':{}}),'Materializacion VIDA9 no borra cache galactica');
  check(!mutationAffects({'idb://genesis-web/galaxyKnowledgeSnapshots/':{}}),'Escritura derivados no invalida descubrimientos');
  check(mutationAffects(null),'Evento desconocido invalida de forma segura');
  let fault=true,reads=0;
  const retry=new Cache({...source,getKnownDiscoveries:async()=>{reads++;if(fault){fault=false;throw Error('temporal');}return rows;}});
  await assert.rejects(()=>retry.getKnownDiscoveries(a));
  await retry.getKnownDiscoveries(a);
  check(reads===2,'Errores no quedan cacheados');
  let release;
  let requests=0;
  const racing=new Cache({...source,getKnownDiscoveries:()=>{requests++;return requests===1?new Promise(res=>release=res):Promise.resolve(rows);}});
  const before=racing.getKnownDiscoveries(a);
  racing.invalidate();
  release(rows);await before;await racing.getKnownDiscoveries(a);
  check(requests===2,'Lectura anterior al cambio no reintroduce valores obsoletos');
  console.log(`PASS GENESIS CACHE-GAL.1 — ${checked} comprobaciones portátiles`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
