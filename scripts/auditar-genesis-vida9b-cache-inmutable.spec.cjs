/** VIDA.9b: portable regression without browser/Angular, using only project TypeScript.
 * No IndexedDB deletion, no filesystem mutation, no changes to simulated worlds.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(relative, mocks = {}) {
  const input = fs.readFileSync(path.join(root, relative), 'utf8');
  const compiled = ts.transpileModule(input, {
    fileName:relative,
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,strict:true},
    reportDiagnostics:true,
  });
  const errors=(compiled.diagnostics ?? []).filter(d=>d.category===ts.DiagnosticCategory.Error);
  assert.deepEqual(errors.map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n')),[]);
  const instance={exports:{}};
  new Function('require','module','exports',compiled.outputText)((name)=>{
    if(Object.prototype.hasOwnProperty.call(mocks,name)) return mocks[name];
    throw Error('Unexpected runtime dependency in independent audit: '+name);
  },instance,instance.exports);
  return instance.exports;
}
const domain=load('src/app/domain/life/vida9-biology-exploration.ts');
const {DexieVida9BiologyExplorationRepository}=load(
  'src/app/data/local/repository/dexie-vida9-biology-exploration.repository.ts',
  {'../../../domain/life/vida9-biology-exploration':domain});
const seed='7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5';
const identity=(kind,moonIndex)=>({
  universeSeed:seed,generatorVersionCode:3,kind,galaxyIndex:'0',sectorKey:'1',
  galacticObjectIndex:'2',bodyIndex:'3',moonIndex,
});
const storageKey=id=>[id.galaxyIndex,id.sectorKey,id.galacticObjectIndex,
  id.bodyIndex,id.kind,id.moonIndex??'-'].join(':');
function record(id) {
  const contents={revision:domain.VIDA9_REVISION,identity:id,bodyStorageKey:storageKey(id),
    epoch:'CT-0',epochOffsetYears:0,revealPolicy:domain.VIDA9_REVEAL_POLICY,
    ecosystem:{sentinel:'prior VIDA.6'},intelligence:{sentinel:'prior VIDA.7'},
    colonization:{sentinel:'prior VIDA.8'},nativeLifePresent:true,
    nativeIntelligencePresent:false,nativeCivilizationPresent:false,
    introducedLifePresent:false,colonialPopulationPresent:false,historicalOriginEpochYears:null};
  return {...contents,digest:domain.vida9DigestForRecord(contents)};
}
function memoryDatabase(){
  const rows=new Map();const tuple=k=>JSON.stringify(k);
  const table={
    async get(key){return rows.get(tuple(key));},
    async add(row){const key=tuple([row.universeSeed,row.generatorVersionCode,row.bodyStorageKey]);
      if(rows.has(key)) throw Object.assign(new Error('Duplicate key'),{name:'ConstraintError'});
      rows.set(key,row);},
    async put(row){rows.set(tuple([row.universeSeed,row.generatorVersionCode,row.bodyStorageKey]),row);},
  };
  return {rows,privateBiologicalRecordsVIDA9:table,async openDatabase(){},
    async transaction(_mode,_table,fn){return await fn();}};
}
function indexerClass(){
  class BodyLocator{constructor(galaxyIndex,sectorKey,galacticObjectIndex,bodyIndex){
    Object.assign(this,{galaxyIndex,sectorKey,galacticObjectIndex,bodyIndex});}}
  class SystemLocator{constructor(galaxyIndex,sectorKey,galacticObjectIndex){
    Object.assign(this,{galaxyIndex,sectorKey,galacticObjectIndex});}}
  return {BodyLocator,indexer:load('src/app/presentation/runtime/vida9-confirmed-system-biology-indexer.ts',{
    '../../domain/generation/generator-version':{GeneratorVersion:{V3:3}},
    '../../domain/generation/procedural-locator':{BodyLocator,SystemLocator},
    '../../data/local/repository/dexie-vida9-biology-exploration.repository':{DexieVida9BiologyExplorationRepository},
    './vida9-v3-confirmed-physical-targets':{
      vida9V3ConfirmedPhysicalTargets(){throw Error('Existing snapshot was needlessly regenerated');}},
    '../../simulation/life/procedural-microbial-life-vida3':{
      ProceduralMicrobialLifeVIDA3:{bodyStorageKey:storageKey}},
    '../../simulation/life/life-plausibility-physical-adapter-vida2':{Vida2PhysicalInput:{}},
    '../../simulation/life/procedural-ecology-vida4':{ProceduralEcologyVIDA4:{}},
    '../../simulation/life/vida5a-ecology-atmosphere':{Vida5aEcologyAtmosphere:{}},
    '../../simulation/life/vida5b-ecological-maturation':{Vida5bEcologicalMaturation:{}},
    '../../simulation/life/vida5c-advanced-biospheres':{Vida5cAdvancedBiospheres:{}},
    '../../simulation/life/vida6-ecosystems-species':{Vida6EcosystemsSpecies:{}},
    '../../simulation/life/vida7-intelligence-civilizations':{Vida7IntelligenceCivilizations:{}},
    '../../simulation/life/vida8-technological-colonization':{Vida8TechnologicalColonization:{}},
    '../../simulation/life/vida8-local-origin-discovery':{Vida8LocalOriginDiscovery:{}},
    '../../simulation/life/vida9-biology-exploration':{Vida9BiologyExploration:{}},
  }).Vida9ConfirmedSystemBiologyIndexer};
}
const planetIdentity=identity('PLANET',null);
const moonIdentity=identity('MOON','0');
const genKey={generatorVersion:3,universeSeed:{serialize:()=>seed}};
function catalogue(BodyLocator){const locator=new BodyLocator(0n,1n,2n,3n);
 return {planets:[{locator,stateName:'CONFIRMED',id:'planet-3'}],
   moons:[{locator:{...locator,moonIndex:0n},stateName:'CONFIRMED',id:'moon-0'}]};}

test('CT-0: escritura idempotente, lectura validada y rechazo de segundo contenido',async()=>{
  const db=memoryDatabase(),repo=new DexieVida9BiologyExplorationRepository(db),prior=record(planetIdentity);
  assert.deepEqual(await repo.ensure(prior),prior);
  assert.deepEqual(await repo.get(seed,3,prior.bodyStorageKey),prior);
  const {digest:_,...content}=prior;
  const otherContent={...content,nativeLifePresent:false};
  const other={...otherContent,digest:domain.vida9DigestForRecord(otherContent)};
  await assert.rejects(repo.ensure(other),/immutable biological record mismatch/);
  assert.deepEqual(await repo.get(seed,3,prior.bodyStorageKey),prior);
  assert.equal(db.rows.size,1);
});
test('CT-0: el indexador respeta planeta y luna persistidos sin recálculo físico',async()=>{
  const db=memoryDatabase(),repo=new DexieVida9BiologyExplorationRepository(db);
  await repo.ensure(record(planetIdentity));await repo.ensure(record(moonIdentity));
  const {BodyLocator,indexer}=indexerClass();
  const result=await new indexer(db).ensureConfirmedCatalog(genKey,catalogue(BodyLocator));
  assert.deepEqual(result,{indexed:2,withoutPhysicalModel:0});
  assert.equal(db.rows.size,2);
});
test('CT-0: registro manipulado se rechaza antes de recrear el planeta',async()=>{
  const db=memoryDatabase(),repo=new DexieVida9BiologyExplorationRepository(db);
  const original=record(planetIdentity);await repo.ensure(original);
  const tuple=JSON.stringify([seed,3,original.bodyStorageKey]);
  const row=db.rows.get(tuple);db.rows.set(tuple,{...row,payloadJson:JSON.stringify({...original,nativeLifePresent:false})});
  const {BodyLocator,indexer}=indexerClass();
  await assert.rejects(new indexer(db).ensureConfirmedCatalog(genKey,catalogue(BodyLocator)),
    /stored biological digest mismatch/);
  assert.equal(db.rows.size,1);
});
test('V3: la suite no exige revisiones obsoletas 1 para la proyección efectiva',()=>{
  const source=fs.readFileSync(path.join(root,
    'src/app/presentation/runtime/galaxy-planet-moon-catalog-snapshot.runtime.spec.ts'),'utf8');
  assert.match(source,/effectivePhysicalProjectionVIDA5:\s*2 as const/);
  assert.doesNotMatch(source,/expect\((restored|result)\.effectivePhysicalProjectionVIDA5\)\.toBe\(1\)/);
  assert.match(source,/reconstruye una revisión V3 VIDA\.5=1 exactamente una vez a revisión 2/);
});
