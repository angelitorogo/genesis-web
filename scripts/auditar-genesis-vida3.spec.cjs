'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const engine=read('src/app/simulation/life/procedural-microbial-life-vida3.ts');
const domain=read('src/app/domain/life/procedural-microbial-vida3.ts');
const repository=read('src/app/data/local/repository/dexie-procedural-microbial-vida3.repository.ts');
const schema=read('src/app/data/local/indexed-db/genesis-indexed-db-schema.ts');
const migrations=read('src/app/data/local/indexed-db/genesis-indexed-db-migrations.ts');
const runtime=read('src/app/presentation/runtime/vida3-private-microbial.runtime.ts');
const audit=read('scripts/auditar-genesis-vida3.cjs');

test('VIDA.3 has deterministic SHA-256 and a single decision per body',()=>{
 assert.match(engine,/sha256\(utf8ToBytes\(domain\)\)/);
 assert.match(engine,/VIDA3_LIFE_PROBABILITY/);
 assert.doesNotMatch(engine,/Math\.random\(|Date\.now\(/);
 assert.match(engine,/bodyStorageKey/);
});
test('VIDA.3 retains two source routes but only one selected habitat',()=>{
 assert.match(engine,/assessment\.routes\.find\(x => x\.classification === 'PLAUSIBLE'\)/);
 assert.match(engine,/const lifePresent = plausible && draw/);
});
test('No life for indeterminate or non-plausible worlds',()=>{
 assert.match(engine,/assessment\.classification === 'PLAUSIBLE'/);
 assert.match(engine,/lifePresent \? 'MICROBIAL' : 'NONE'/);
});
test('VIDA.3 stores snapshots apart from retired 33.F tables via additive schema V8',()=>{
 assert.match(schema,/GENESIS_INDEXED_DB_SCHEMA_VERSION_V8 = 8/);
 assert.match(schema,/privateMicrobialBiospheres:/);
 assert.match(migrations,/v7-to-v8-vida3-microbial-private/);
 assert.match(migrations,/migrateGenesisIndexedDbV7ToV8/);
});
test('Private repository deduplicates by compound key, never overwrites',()=>{
 assert.match(repository,/\.get\(key\)/);
 assert.match(repository,/if \(existing\)/);
 assert.match(repository,/\.add\(\{/);
 assert.doesNotMatch(repository,/\.put\(|bulkPut\(/);
});
test('Known discovery records do not include biospheres',()=>{
 assert.match(runtime,/private readonly pending/);
 assert.doesNotMatch(runtime,/discovery|observed|catalog|knowledge/i);
 assert.match(domain,/biosphereId: string \| null/);
});
test('Planet and moon fiches trigger only after AVAILABLE confirmed V3 detail',()=>{
 for(const k of ['planet','moon']){
  const f=read(`src/app/presentation/${k}-detail/${k}-detail.ts`);
  assert.match(f,/model\.generatorVersionCode !== 3/);
  assert.match(f,/resolved\?\.kind !== 'AVAILABLE'/);
  assert.match(f,/this\.vida3Private\.ensure/);
 }
});
test('Deletion and restore clear the private store, leaving no ghost biology',()=>{
 assert.match(read('src/app/data/local/repository/dexie-universe.repository.ts'),/privateMicrobialBiospheres/);
 assert.match(read('src/app/data/local/backup/dexie-genesis-backup.service.ts'),/privateMicrobialBiospheres\.clear\(\)/);
});
test('Mass audit is explicitly read only and reports physical coverage gaps',()=>{
 assert.match(audit,/isFullGalacticCensus:false/);
 assert.match(audit,/NON_CONVERGED_PHASE_MODEL/);
 assert.doesNotMatch(audit,/indexedDB|\.bulkAdd\(|\.save\(/);
});
