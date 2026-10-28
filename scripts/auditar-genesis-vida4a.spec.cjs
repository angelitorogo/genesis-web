'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
if(!require.extensions['.ts'])require.extensions['.ts']=(m,file)=>m._compile(ts.transpileModule(
 readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const root=path.resolve(__dirname,'../src/app');
const {ProceduralEcologyVIDA4:E}=require(path.join(root,'simulation/life/procedural-ecology-vida4.ts'));
const config=require(path.join(root,'domain/life/procedural-ecology-vida4.ts'));
const {sha256}=require('@noble/hashes/sha2.js');
const {utf8ToBytes}=require('@noble/hashes/utils.js');
function evolutionRoll(m) {
 const d=[config.VIDA4_ROLL_NAMESPACE,m.identity.universeSeed,
  String(m.identity.generatorVersionCode),m.bodyStorageKey,'EVOLUTION_LEVEL'].join('|');
 const b=sha256(utf8ToBytes(d));
 return (b[0]*0x1000000+b[1]*0x10000+b[2]*0x100+b[3])/0x100000000;
}
const {VIDA3_MODEL_REVISION}=require(path.join(root,'domain/life/procedural-microbial-vida3.ts'));
function micro(i, habitat='SURFACE_OPEN') { return {
 revision:VIDA3_MODEL_REVISION, identity:{universeSeed:'7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',generatorVersionCode:3,
 kind:'PLANET',galaxyIndex:'0',sectorKey:'1',galacticObjectIndex:'0',bodyIndex:String(i),moonIndex:null},
 bodyStorageKey:`body:${i}`,plausibility:'PLAUSIBLE',selectedRoute:habitat==='SUBSURFACE'?'SUBSURFACE':'SURFACE',
 habitat,lifePresent:true,biology:'MICROBIAL',biosphereId:'vida3:test',digest:'a'.repeat(64)}; }
test('VIDA.4a retains 30% complexity on a stable roll namespace and has no quotas',()=>{
 const source=Array.from({length:8192},(_,i)=>E.evaluate(micro(i)));
 const c=source.filter(x=>x.complexRollSelected);
 assert.ok(c.length>2300&&c.length<2600,`selected=${c.length}`);
 assert.ok(source.every(x=>x.revision===config.VIDA4_MODEL_REVISION));
 const full=c.filter(x=>x.nativeCivilizationEcosystemReady);
 assert.ok(full.length/c.length>0.30&&full.length/c.length<0.36,`full=${full.length} complex=${c.length}`);
 assert.ok(source.every(x=>!x.nativeCivilizationPresent));
 assert.ok(source.every(x=>x.groups.every((g,j)=>g===config.VIDA4_GROUPS[j])));
 });
test('VIDA.4a subsurface and protected lunar habitats cannot reach advanced life',()=>{
 const xs=Array.from({length:512},(_,i)=>E.evaluate(micro(i,'SUBSURFACE')));
 assert.ok(xs.every(x=>x.groups.length<=2&&!x.nativeCivilizationEcosystemReady));
 });
test('VIDA.4a revisioned persistence remains V9; v1 and v2 keys differ',()=>{
 const store=readFileSync(path.join(root,'data/local/repository/dexie-procedural-ecology-vida4.repository.ts'),'utf8');
 const schema=readFileSync(path.join(root,'data/local/indexed-db/genesis-indexed-db-schema.ts'),'utf8');
 assert.ok(store.includes('`${snapshot.revision}|${snapshot.bodyStorageKey}`'));
 assert.ok(schema.includes('GENESIS_INDEXED_DB_SCHEMA_VERSION_V9 = 9'));
 assert.equal(config.VIDA4_ROLL_NAMESPACE,'VIDA.4/ecology/v1');
 assert.equal(config.VIDA4_MODEL_REVISION,'VIDA.4/ecology/v2-advanced-calibration');
 });
test('VIDA.4a future rates are only targets; no intelligence or civilization generated',()=>{
 assert.equal(config.VIDA4A_FUTURE_INTELLIGENCE_RATE_TARGET,.20);
 assert.equal(config.VIDA4A_FUTURE_CIVILIZATION_RATE_TARGET,.60);
 assert.equal(E.evaluate(micro(123)).nativeCivilizationPresent,false);
 });

test('VIDA.4a never removes ecological groups present under v1 thresholds',()=>{
 const previous=[0.08,0.22,0.38,0.55,0.72,0.88];
 for(let i=0;i<4096;i++){
   const parent=micro(i), now=E.evaluate(parent);
   if(!now.complexRollSelected)continue;
   const r=evolutionRoll(parent);
   const oldLevel=2+previous.filter(t=>r>=t).length;
   assert.ok(now.groups.length>=oldLevel, `body=${i} old=${oldLevel} new=${now.groups.length}`);
 }
});
