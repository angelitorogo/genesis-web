'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const ts=require('typescript');
const root=path.join(__dirname,'..');
const read=x=>fs.readFileSync(path.join(root,x),'utf8');
const source='src/app/presentation/galaxy-knowledge-catalog/galaxy-civilization-known-index.ts';
const js=ts.transpileModule(read(source),{fileName:source,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true},reportDiagnostics:true});
assert.equal(js.diagnostics?.length??0,0);
function digest(data){let h=2166136261;for(const c of JSON.stringify(data))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h.toString(16).padStart(8,'0').toUpperCase();}
const mock={
 '@angular/core':{Injectable:()=>cls=>cls,inject:()=>({})},
 '../../domain/generation/generator-version':{GeneratorVersion:{V3:'V3'}},
 '../../domain/discovery/discovery-state':{DiscoveryState:{CONFIRMED:{code:5}}},
 '../../domain/generation/procedural-locator':{SystemLocator:class{}},
 '../../domain/life/vida9-biology-exploration':{VIDA9_REVISION:'VIDA.9/biology-exploration/v1',vida9DigestForRecord:digest},
 '../../data/local/indexed-db/genesis-indexed-db':{GenesisIndexedDb:class{}},
 '../runtime/genesis-local-repositories':{GENESIS_LOCAL_REPOSITORIES:{}},
 '../runtime/galaxy-planet-moon-catalog-snapshot.runtime':{GALAXY_PLANET_MOON_CATALOG_SNAPSHOT_RUNTIME:{}},
};
const moduleExports={};new Function('require','exports',js.outputText)((s)=>{if(!(s in mock))throw Error('Unknown '+s);return mock[s]},moduleExports);
function fixture(){const identity={universeSeed:'7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',generatorVersionCode:3,galaxyIndex:'0',sectorKey:'1',galacticObjectIndex:'2',bodyIndex:'3',kind:'PLANET',moonIndex:null};
const data={revision:'VIDA.9/biology-exploration/v1',identity,bodyStorageKey:'0:1:2:3:PLANET:-',epoch:'CT-0',epochOffsetYears:0,revealPolicy:'FULL_SYSTEM_REVEAL_ON_CONFIRMED',
ecosystem:{species:[{id:'species-a',proceduralName:'Alivar a1'}]},intelligence:{civilizationPresent:true,civilization:{founderSpeciesId:'species-a',tier:'VERY_ADVANCED',lineage:'REPTILIAN'}},colonization:{colonies:[]},nativeCivilizationPresent:true};
const record={...data,digest:digest(data)};return {data,record,row:{universeSeed:identity.universeSeed,generatorVersionCode:3,bodyStorageKey:data.bodyStorageKey,systemStorageKey:'0/1/2',revision:data.revision,epochOffsetYears:0,payloadJson:JSON.stringify(record),digest:record.digest}};}
test('solo una civilización válida de un sistema confirmado',()=>{const {record,row}=fixture();assert.deepEqual(moduleExports.extractConfirmedCivilization(row,new Set(['0/1/2'])),record);assert.equal(moduleExports.extractConfirmedCivilization(row,new Set()),null)});
test('no se revela la civilización en un planeta sin confirmar ni en una luna',()=>{const {row}=fixture();assert.equal(moduleExports.extractConfirmedCivilization({...row,systemStorageKey:'0/1/3'},new Set(['0/1/2'])),null);assert.equal(moduleExports.extractConfirmedCivilization({...row,bodyStorageKey:'0:1:2:3:MOON:0'},new Set(['0/1/2'])),null)});
test('rechaza registros alterados o con fundador inexistente',()=>{const {row,data}=fixture();assert.throws(()=>moduleExports.extractConfirmedCivilization({...row,digest:'BAD'},new Set(['0/1/2'])));const missing={...data,ecosystem:{species:[]}};const altered={...missing,digest:digest(missing)};assert.throws(()=>moduleExports.extractConfirmedCivilization({...row,payloadJson:JSON.stringify(altered),digest:altered.digest},new Set(['0/1/2'])))});
test('la ficha y el explorador enlazan con la misma categoría y tres niveles',()=>{const a=read('src/app/presentation/galaxy-detail/galaxy-civilizations-inventory.ts'),b=read('src/app/presentation/galaxy-knowledge-catalog/galaxy-knowledge-civilizations-catalog.data-source.ts');for(const t of ['PRIMITIVE','ADVANCED','VERY_ADVANCED'])assert.ok(a.includes(t));assert.ok(b.includes('civilizations'));assert.ok(read('src/app/presentation/galaxy-knowledge-catalog/galaxy-knowledge-catalog.html').includes('gkc__civilization-card'));});
test('la navegación pública al planeta y la especie no modifica IndexedDB',()=>{const src=read('src/app/presentation/galaxy-knowledge-catalog/galaxy-knowledge-civilizations-catalog.data-source.ts');assert.ok(src.includes("'/system'"));assert.ok(src.includes("'species'"));assert.ok(!src.includes('setState('));assert.ok(!src.includes('.put('));});
