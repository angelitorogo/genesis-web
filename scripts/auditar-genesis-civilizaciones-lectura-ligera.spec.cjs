const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const ts=require('typescript');
const test=require('node:test');
const assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'..','src','app','presentation','galaxy-knowledge-catalog','galaxy-civilization-known-index.ts'),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,experimentalDecorators:true}}).outputText;
const makeRecord=(system='0/1/2',body=0,tier='PRIMITIVE',name='Nor al2')=>{
 const [g,s,o]=system.split('/');const identity={universeSeed:'SEED',generatorVersionCode:3,galaxyIndex:g,sectorKey:s,galacticObjectIndex:o,bodyIndex:String(body),kind:'PLANET',moonIndex:null};const bodyStorageKey=[g,s,o,body,'PLANET','-'].join(':');const species={id:'s1',proceduralName:name};const civil={tier,founderSpeciesId:'s1',lineage:'HUMANOID'};const payload={revision:'REV',identity,bodyStorageKey,epoch:'CT-0',epochOffsetYears:0,revealPolicy:'FULL_SYSTEM_REVEAL_ON_CONFIRMED',nativeCivilizationPresent:true,intelligence:{civilizationPresent:true,civilization:civil},ecosystem:{species:[species]},digest:'DIGEST'};return {universeSeed:'SEED',generatorVersionCode:3,systemStorageKey:system,bodyStorageKey,payloadJson:JSON.stringify(payload),digest:'DIGEST'};
};
const rows=[makeRecord('0/1/2',3,'VERY_ADVANCED','Nasyl al2'),makeRecord('0/1/2',5,'ADVANCED','Kania on6')];const keys=[];const lookup=new Map();for(let i=0;i<10000;i++){const key=`0:1:2:${i}:MOON:0`;keys.push(['SEED',3,key]);}for(let i=0;i<1024;i++){const key=`0:1:2:${i}:PLANET:-`;keys.push(['SEED',3,key]);lookup.set(key,null);}for(const row of rows)lookup.set(row.bodyStorageKey,row);
class SystemLocator {constructor(g,s,o){this.galaxyIndex=g;this.sectorKey=s;this.galacticObjectIndex=o;}}
let repositoryCalls=0,physicalCalls=0,requestKeys=0,requestedMoon=false;
const db={openDatabase:async()=>{},privateBiologicalRecordsVIDA9:{where:()=>({between:()=>({primaryKeys:async()=>keys})}),bulkGet:async(keys)=>{requestKeys+=keys.length; if(keys.some(k=>k[2].includes(':MOON:')))requestedMoon=true;return keys.map(k=>lookup.get(k[2])??undefined);}}};
const mock={
 '@angular/core':{Injectable:()=>x=>x,inject:()=>({discoveryRepository:{getKnownDiscoveriesInGalaxy:async()=>{repositoryCalls++;return [{locator:new SystemLocator(0n,1n,2n),state:{code:5}}];}}})},
 '../../domain/generation/generator-version':{GeneratorVersion:{V3:3}},
 '../../domain/discovery/discovery-state':{DiscoveryState:{CONFIRMED:{code:4}}},
 '../../domain/discovery/discovery-target-type':{DiscoveryTargetType:{SYSTEM:{code:1}}},
 '../../domain/generation/procedural-locator':{SystemLocator},
 '../../simulation/stellar/stellar-designation-generator':{StellarDesignationGenerator:{generate:()=>({name:'Glavara'})}},
 '../../simulation/stellar/stellar-multihost-formation':{StellarMultihostFormation:{generateOrNull:()=>{physicalCalls++;return {publicPlanets:Array.from({length:1024},(_,i)=>({publicLocator:{bodyIndex:BigInt(i)},host:'B',sourcePlanetOrdinal:i+1}))};},generateSingleOrNull:()=>null}},
 '../../simulation/stellar/stellar-multihost-public-designation':{stellarMultihostPublicPlanetDesignation:(n,h,i)=>`${n} ${h}-${i}`},
 '../../simulation/stellar/stellar-multihost-physical-source-key':{multihostPhysicalSourceKey:k=>k},
 '../../domain/life/vida9-biology-exploration':{VIDA9_REVISION:'REV',vida9DigestForRecord:()=> 'DIGEST'},
 '../../data/local/indexed-db/genesis-indexed-db':{GenesisIndexedDb:class{constructor(){return db}}},
 '../runtime/genesis-local-repositories':{GENESIS_LOCAL_REPOSITORIES:{}},
};
const context={exports:{},require:(k)=>{if(!(k in mock))throw Error('Unexpected import '+k);return mock[k]},setTimeout,clearTimeout,console,BigInt,Date,Intl,Promise,Map,Set,Object};vm.runInNewContext(js,context);
const Index=context.exports.GalaxyCivilizationKnownIndex;
test('Civilizaciones: lectura por lotes, progreso, nombres, aislamiento y caché sin catálogo galáctico completo',async()=>{
 const index=new Index(),key={universeSeed:{serialize:()=> 'SEED'},generatorVersionCode:3,generatorVersion:3};
 let progress=0;const partial=[];const [a,b]=await Promise.all([index.read(key,0n,c=>{progress++;partial.push(c.entries.length);}),index.read(key,0n)]);
 assert.equal(a.entries.length,2);assert.equal(b.entries.length,2);
 assert.equal(a.veryAdvanced,1);assert.equal(a.advanced,1);
 assert.equal(a.entries[0].planetName,'Glavara B-4');assert.equal(a.entries[1].planetName,'Glavara B-6');
 assert.equal(requestedMoon,false);assert.equal(requestKeys,1024);assert.equal(physicalCalls,2);assert.equal(repositoryCalls,1);
 assert.ok(progress>1);
 const c=await index.read(key,0n);assert.equal(c.entries.length,2);assert.equal(repositoryCalls,1);
 assert.equal(a.complete,false);
});
