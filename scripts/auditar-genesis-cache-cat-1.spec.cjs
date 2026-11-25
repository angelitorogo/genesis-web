'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
let checks=0;
function check(label,fn){fn();checks++;}
function load(rel,mocks={}){
  const file=path.join(root,rel);
  const source=fs.readFileSync(file,'utf8');
  const output=ts.transpileModule(source,{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,strict:true},reportDiagnostics:true});
  assert.equal(output.diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,`Syntax: ${rel}`);
  const mod={exports:{}};
  new Function('require','module','exports',output.outputText)((id)=>{
    if(id in mocks)return mocks[id];
    throw Error(`Unexpected import ${id} in ${rel}`);
  },mod,mod.exports);
  return mod.exports;
}
const modelPath='src/app/presentation/runtime/galaxy-knowledge-catalog-page-cache.model.ts';
const runtimePath='src/app/presentation/runtime/galaxy-knowledge-catalog-page-cache.runtime.ts';
const model=load(modelPath);
const fakeAngular={InjectionToken:class {constructor(label,options){this.label=label;this.options=options}},inject:()=>{throw Error('DI not used in audit')}};
const runtime=load(runtimePath,{
  '@angular/core':fakeAngular,
  '../../domain/exploration/galaxy-known-discoveries-canonical':{canonicalGalaxyKnownDiscoveries:(k,index,rows)=>rows.filter(row=>row.locator.galaxyIndex===index)},
  '../../data/local/indexed-db/genesis-indexed-db':{GenesisIndexedDb:class {}},
  '../../data/local/repository/dexie-galaxy-knowledge-snapshot.repository':{DexieGalaxyKnowledgeSnapshotRepository:class {}},
  './genesis-local-repositories':{GENESIS_LOCAL_REPOSITORIES:'repositories'},
  '../../data/local/repository/local-repository-support':{generationKeyStorageParts:key=>({universeSeed:key.universeSeed.serialize(),generatorVersionCode:key.generatorVersionCode})},
  './galaxy-knowledge-snapshot.runtime':{GALAXY_SCIENTIFIC_MODEL_VERSION:16,
    galaxyKnowledgeRevision:(index,rows)=>JSON.stringify(rows.map(row=>[String(row.locator.galaxyIndex),row.state.code]))},
  './galaxy-knowledge-catalog-page-cache.model':model,
});
const generation={universeSeed:{serialize:()=> '1234-5678'},generatorVersionCode:3};
const galaxyState={code:4};
const query=(galaxy,category='systems',search=null,key=generation,scientificOnly=true)=>({
  generationKey:key,galaxyIndex:BigInt(galaxy),galaxyState,scientificOnly,
  query:{category,subtype:null,sortKey:'designation',direction:'asc',page:1,pageSize:25,search},
});
const page=(id,complete=true)=>({kind:'page',page:{page:1,pageSize:25,totalPages:1,totalItems:1,knowledgeComplete:complete,
 items:[{id,title:id,cells:{},actions:[]}]}});
function fixture(){
  const records=new Map();const db=new Map();
  const identity=(k,i)=>`${k.universeSeed.serialize()}/${k.generatorVersionCode}/${i}`;
  const discoveries={
    async getKnownDiscoveriesInGalaxy(key,i){return Object.freeze([...(records.get(identity(key,i))??[])]);},
    async getKnownDiscoveries(key){return [...records.values()].flat().filter(row=>row.generationKey===key);},
  };
  const repository={
    async get(k,i){return db.get(identity(k,i));},
    async put(entity){db.set(`${entity.universeSeed}/${entity.generatorVersionCode}/${entity.galaxyIndex}`,entity);},
    async updateCatalogPageIfRevisionMatches(k,i,modelVersion,revision,pageKey,result){
      const id=identity(k,i), old=db.get(id);
      if(old && old.knowledgeRevision!==revision)return false;
      const json=model.appendGalaxyKnowledgeCatalogPageCAT1(old?.catalogPagesJson,pageKey,result);
      if(!json)return false;
      db.set(id,{...old,universeSeed:k.universeSeed.serialize(),generatorVersionCode:k.generatorVersionCode,
        galaxyIndex:String(i),scientificModelVersion:modelVersion,knowledgeRevision:revision,catalogPagesJson:json,
        updatedAtEpochMs:1});
      return true;
    },
  };
  return {records,db,discoveries,repository,identity,create:()=>new runtime.DexieGalaxyKnowledgeCatalogPageCacheRuntimeCAT1(repository,discoveries),
    set(i,state=4,k=generation){records.set(identity(k,i),[{generationKey:k,locator:{galaxyIndex:BigInt(i)},state:{code:state}}]);}};
}
async function main(){
  for(const rel of [modelPath,runtimePath,
    'src/app/presentation/galaxy-knowledge-catalog/galaxy-knowledge-catalog.data-source.ts',
    'src/app/data/local/repository/dexie-galaxy-knowledge-snapshot.repository.ts']){
    check(`TS syntax ${rel}`,()=>{const file=path.join(root,rel);const src=fs.readFileSync(file,'utf8');const out=ts.transpileModule(src,{fileName:file,compilerOptions:{target:ts.ScriptTarget.ES2022},reportDiagnostics:true}); assert.equal(out.diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);});
  }
  const f=fixture();for(let i=0;i<22;i++)f.set(i);
  const cache=f.create();let called=0;
  const loader=async()=>page(`record-${++called}`);
  check('key stable',()=>assert.equal(model.galaxyKnowledgeCatalogPageCacheKeyCAT1(query(0)),model.galaxyKnowledgeCatalogPageCacheKeyCAT1(query(1))));
  check('key query changes',()=>assert.notEqual(model.galaxyKnowledgeCatalogPageCacheKeyCAT1(query(0,'systems')),model.galaxyKnowledgeCatalogPageCacheKeyCAT1(query(0,'planets'))));
  await cache.resolve(query(0),loader);await cache.resolve(query(0),loader);
  check('cache memory hit',()=>assert.equal(called,1));
  for(let i=1;i<22;i++){
    await cache.resolve(query(i,'systems'),loader);
    await cache.resolve(query(i,'planets'),loader);
  }
  check('different categories are built',()=>assert.equal(called,43));
  await f.create().resolve(query(0),loader);
  check('restart persistence',()=>assert.equal(called,43));
  await f.create().resolve(query(10,'systems'),loader);
  check('cross galaxy persistence',()=>assert.equal(called,43));
  f.set(0,3);await f.create().resolve(query(0),loader);
  check('revision invalidation',()=>assert.equal(called,44));
  await cache.resolve(query(1,'civilizations'),async()=>{called++;return page('partial',false);});
  await cache.resolve(query(1,'civilizations'),async()=>{called++;return page('partial',false);});
  check('incomplete biography never cached',()=>assert.equal(called,46));
  const alt={universeSeed:{serialize:()=> '1234-5678'},generatorVersionCode:2}; f.set(1,4,alt);
  await cache.resolve(query(1,'systems',null,alt),loader);
  check('universe generation separation',()=>assert.equal(called,47));
  await cache.resolve(query(1,'systems','water'),loader);
  check('search separation',()=>assert.equal(called,48));
  await cache.resolve(query(1,'systems',null,generation,false),loader);
  check('exploration bypass',()=>assert.equal(called,49));
  const json=f.db.get(f.identity(generation,1)).catalogPagesJson;
  check('persisted fragment version',()=>assert.equal(model.restoreGalaxyKnowledgeCatalogPagesCAT1(json).version,1));
  check('corrupt fragment rejected',()=>assert.equal(model.restoreGalaxyKnowledgeCatalogPagesCAT1('{bad').entries.length,0));
  let serialized;
  for(let i=0;i<40;i++)serialized=model.appendGalaxyKnowledgeCatalogPageCAT1(serialized,`item${i}`,page(`r${i}`));
  check('bounded 24 pages',()=>assert.equal(model.restoreGalaxyKnowledgeCatalogPagesCAT1(serialized).entries.length,24));
  check('bounded disk bytes',()=>assert(serialized.length<750001));
  const original=fs.readFileSync(path.join(root,'src/app/presentation/galaxy-knowledge-catalog/galaxy-knowledge-catalog.data-source.ts'),'utf8');
  check('unified catalog interception',()=>assert(original.includes('this.pageCache.resolve(request, () => this.queryUncached(request))')));
  const repository=fs.readFileSync(path.join(root,runtimePath),'utf8');
  check('atomic IDB transaction',()=>assert(repository.includes("transaction('rw', this.database.galaxyKnowledgeSnapshots")));
  check('strict revision binding',()=>assert(repository.includes('stored.knowledgeRevision !== expectedKnowledgeRevision')));
  const entity=fs.readFileSync(path.join(root,'src/app/data/local/entity/galaxy-knowledge-snapshot.entity.ts'),'utf8');
  check('no schema change',()=>assert(entity.includes('readonly catalogPagesJson?: string;')));
  process.stdout.write(`PASS GENESIS CACHE-CAT.1 — ${checks} comprobaciones portátiles · múltiples galaxias, categorías, reinicio, revisión y seguridad\n`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
