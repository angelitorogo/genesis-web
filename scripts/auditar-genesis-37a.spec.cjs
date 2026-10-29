'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Module=require('node:module');
const ts=require('typescript');
const base=path.resolve(__dirname,'..');
function loadTs(relative,dependencies={}){
  const file=path.join(base,relative);
  const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,
      experimentalDecorators:true}}).outputText;
  const m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));
  const natural=m.require.bind(m);
  m.require=id=>id in dependencies?dependencies[id]:natural(id);
  m._compile(js,file);return m.exports;
}
const pure=loadTs('src/app/domain/life/technosignatures-37a.ts');

test('37.A: primitiva sin radio ni aviso tecnológico',()=>{
  const p=pure.technosignatureProfile37a({tier:'PRIMITIVE'});
  assert.equal(p.radio,'NONE');assert.equal(p.sceneAlert,false);
  assert.equal(p.nightLight,'LOCAL_POSSIBLE');
  assert.equal(pure.systemTechnosignatureAlert37a([p]),null);
});
test('37.A: avanzada con capacidad, no transmisión observada',()=>{
  const p=pure.technosignatureProfile37a({tier:'ADVANCED'});
  assert.equal(p.radio,'POSSIBLE');assert.equal(p.observedRadioSignal,false);
  assert.equal(pure.systemTechnosignatureAlert37a([p]),'ADVANCED');
});
test('37.A: muy avanzada tiene precedencia en una única alerta por sistema',()=>{
  const a=pure.technosignatureProfile37a({tier:'ADVANCED'});
  const v=pure.technosignatureProfile37a({tier:'VERY_ADVANCED'});
  assert.equal(pure.systemTechnosignatureAlert37a([a,v]),'VERY_ADVANCED');
  assert.equal(pure.systemTechnosignatureAlert37a([]),null);
});
test('37.A: consulta puntual confirmada, sin leer lunas ni revelar planetas',async()=>{
  let requestedSystem=null,bulks=[];
  class FakeDb {
    async openDatabase(){}
    privateBiologicalRecordsVIDA9={
      where(index){assert.equal(index,'[universeSeed+generatorVersionCode+systemStorageKey]');return {
        equals(parts){requestedSystem=parts;return {primaryKeys:async()=>[
          ['seed',3,'0:1:2:5:MOON:0'],['seed',3,'0:1:2:4:PLANET:-'],
        ]};},
      };},
      async bulkGet(keys){bulks.push(keys);return [{bodyStorageKey:'0:1:2:4:PLANET:-',tier:'ADVANCED'}];},
    };
  }
  const deps={
    '@angular/core':{Injectable:()=>value=>value},
    '../../data/local/indexed-db/genesis-indexed-db':{GenesisIndexedDb:FakeDb},
    '../../domain/generation/generator-version':{GeneratorVersion:{V3:{code:3}}},
    '../../domain/generation/universe-generation-key':{UniverseGenerationKey:class{}},
    '../../domain/universe/universe-seed':{UniverseSeed:{}},
    '../../domain/life/technosignatures-37a':pure,
    '../galaxy-knowledge-catalog/galaxy-civilization-known-index':{
      extractConfirmedCivilization:(row,confirmed)=>{
        assert.ok(confirmed.has('0/1/2'));
        return {intelligence:{civilization:{tier:row.tier}}};
      },
    },
    '../runtime/vida9-background-materializer':{
      ensureVida9PlanetsInBackground:()=>{throw Error('No debe invocar generación');},
    },
  };
  const {SystemTechnosignature37aDataSource}=loadTs(
    'src/app/presentation/system/system-technosignature-37a.data-source.ts',deps);
  const source=new SystemTechnosignature37aDataSource();
  const request={universeSeed:'seed',generatorVersionCode:3,galaxyIndex:0n,
    sectorKey:1n,galacticObjectIndex:2n,confirmed:true};
  const result=await source.read(request);
  assert.deepEqual(requestedSystem,['seed',3,'0/1/2']);
  assert.deepEqual(bulks,[[['seed',3,'0:1:2:4:PLANET:-']]]);
  assert.equal(result.alert,'ADVANCED');
  assert.ok(!JSON.stringify(result).includes('4:PLANET'));
  assert.equal((await source.read({...request,confirmed:false})).alert,null);
});
test('37.A: integración solo en escena confirmada, aviso sin planeta',()=>{
  const page=fs.readFileSync(path.join(base,'src/app/presentation/system/system.html'),'utf8');
  const component=fs.readFileSync(path.join(base,'src/app/presentation/system/system-technosignature-alert-37a.ts'),'utf8');
  assert.match(page,/model\.discoveryState\.code === 5/);
  assert.match(page,/<app-system-technosignature-alert-37a/);
  assert.match(component,/Cerrar aviso tecnológico/);
  assert.doesNotMatch(component,/\.planetName|\.bodyIndex|\.speciesName/);
});
