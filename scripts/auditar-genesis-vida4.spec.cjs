'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
if(!require.extensions['.ts'])require.extensions['.ts']=(m,file)=>m._compile(ts.transpileModule(
  readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const root=path.join(__dirname,'../src/app');
const {ProceduralEcologyVIDA4:E,VIDA4_GROUPS}=require(path.join(root,'simulation/life/procedural-ecology-vida4.ts'));
const {VIDA3_MODEL_REVISION}=require(path.join(root,'domain/life/procedural-microbial-vida3.ts'));
const source=(i,habitat='SURFACE_OPEN',lifePresent=true)=>({
 revision:VIDA3_MODEL_REVISION,
 identity:{universeSeed:'7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',generatorVersionCode:3,
  kind:habitat==='SURFACE_PROTECTED_SEEP'?'MOON':'PLANET',galaxyIndex:'0',sectorKey:'1',
  galacticObjectIndex:'0',bodyIndex:String(i),moonIndex:habitat==='SURFACE_PROTECTED_SEEP'?'0':null},
 bodyStorageKey:`body:${i}`,plausibility:'PLAUSIBLE',selectedRoute:habitat==='SUBSURFACE'?'SUBSURFACE':'SURFACE',
 habitat,lifePresent,biology:lifePresent?'MICROBIAL':'NONE',biosphereId:lifePresent?'vida3:immutable':null,digest:'a'.repeat(64)});
test('VIDA4: deterministic and source immutable',()=>{
 const m=source(5),before=JSON.stringify(m),x=E.evaluate(m);
 assert.deepEqual(E.evaluate(m),x);assert.equal(JSON.stringify(m),before);
 assert.equal(x.microbialDigest,m.digest);assert.equal(x.nativeCivilizationPresent,false);
});
test('VIDA4: no life means no ecological groups',()=>assert.deepEqual(E.evaluate(source(1,'SURFACE_OPEN',false)).groups,[]));
test('VIDA4: cumulative eight-group prefix is invariant',()=>{
 for(let i=0;i<1024;i++){
  const x=E.evaluate(source(i));assert.deepEqual(x.groups,VIDA4_GROUPS.slice(0,x.groups.length));
  assert.equal(x.maximumGroup,x.groups.at(-1)??null);
 }
});
test('VIDA4: 30% independent complex-life draw, not quota',()=>{
 const n=Array.from({length:4096},(_,i)=>E.evaluate(source(i))).filter(x=>x.complexRollSelected).length;
 assert.ok(n>1100&&n<1350,`n=${n}`);
});
test('VIDA4: subsurface capped to microbial + decomposer analogues',()=>{
 const xs=Array.from({length:512},(_,i)=>E.evaluate(source(i,'SUBSURFACE')));
 assert.ok(xs.some(x=>x.complexLifePresent));assert.ok(xs.every(x=>x.groups.length<=2&&!x.nativeCivilizationEcosystemReady));
});
test('VIDA4: shallow protected lunar seeps remain microbial',()=>{
 const xs=Array.from({length:256},(_,i)=>E.evaluate(source(i,'SURFACE_PROTECTED_SEEP')));
 assert.ok(xs.some(x=>x.complexRollSelected));assert.ok(xs.every(x=>x.groups.length===1&&!x.complexLifePresent));
});
test('VIDA4: native civilization requires exact full hierarchy, never generated now',()=>{
 const xs=Array.from({length:4096},(_,i)=>E.evaluate(source(i)));
 const full=xs.find(x=>x.nativeCivilizationEcosystemReady);
 assert.ok(full);assert.equal(full.groups.length,8);assert.doesNotThrow(()=>E.assertNativeCivilizationPrerequisites(full));
 assert.throws(()=>E.assertNativeCivilizationPrerequisites(xs.find(x=>x.groups.length<8)),/complete open-surface/);
 assert.ok(xs.every(x=>x.nativeCivilizationPresent===false));
});
test('VIDA4: old VIDA3 snapshots prohibited',()=>{
 assert.throws(()=>E.evaluate({...source(4),revision:'VIDA.3/microbial/v2-subsurface'}),/VIDA.3b/);
});
test('VIDA4: V8→V9 is additive and deletion/restoration clean both private stores',()=>{
 const read=name=>readFileSync(path.join(root,name),'utf8');
 const schema=read('data/local/indexed-db/genesis-indexed-db-schema.ts');
 assert.match(schema,/V9_STORES = Object\.freeze\(\{\s*\.\.\.GENESIS_INDEXED_DB_V8_STORES/);
 assert.ok(schema.includes('privateEcologicalBiospheres'));
 const migrations=read('data/local/indexed-db/genesis-indexed-db-migrations.ts');
 assert.ok(migrations.includes("id: 'v8-to-v9-vida4-ecological-private'"));
 for(const name of ['data/local/repository/dexie-universe.repository.ts',
  'data/local/backup/dexie-genesis-backup.service.ts']){
  const s=read(name);assert.ok(s.includes('privateEcologicalBiospheres'));
  assert.ok(s.includes('privateMicrobialBiospheres'));
 }
});
test('VIDA4: runtime persists V3 parent first and V4 ecology privately',()=>{
 const s=readFileSync(path.join(root,'presentation/runtime/vida3-private-microbial.runtime.ts'),'utf8');
 assert.match(s,/this\.repository\.ensure\(snapshot\)[\s\S]*this\.ecology\.ensure\(ProceduralEcologyVIDA4\.evaluate\(microbial\)\)/);
});
