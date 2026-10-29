'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const ts=require('typescript');
const filename=path.resolve(__dirname,'../src/app/presentation/runtime/vida9-background-materializer.worker.ts');
const source=fs.readFileSync(filename,'utf8');
const sourceFile=ts.createSourceFile(filename,source,ts.ScriptTarget.Latest,true);
const stripped=sourceFile.statements.filter(node=>!ts.isImportDeclaration(node))
  .map(node=>source.slice(node.getStart(sourceFile),node.end)).join('\n');
const javascript=ts.transpileModule(stripped,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
function prepare(){
 const sent=[];
 class UniverseSeed{static parse(value){return value;}}
 class UniverseGenerationKey{constructor(seed){this.universeSeed=seed;}}
 class SystemLocator{constructor(g,s,o){Object.assign(this,{galaxyIndex:g,sectorKey:s,galacticObjectIndex:o});}}
 class BodyLocator extends SystemLocator{constructor(g,s,o,b){super(g,s,o);this.bodyIndex=b;}}
 class MoonLocator extends BodyLocator{constructor(g,s,o,b,m){super(g,s,o,b);this.moonIndex=m;}}
 class GenesisIndexedDb{}
 class Vida9ConfirmedSystemBiologyIndexer{
  async ensureConfirmedCatalog(_key,snapshot){
   const ids=snapshot.planets.map(p=>[p.locator.galaxyIndex,p.locator.sectorKey,
    p.locator.galacticObjectIndex,p.locator.bodyIndex,'PLANET','-'].join(':'));
   return {indexed:snapshot.planets.length+snapshot.moons.length,withoutPhysicalModel:0,
     civilizationBodyKeys:ids.filter(id=>id.endsWith(':0:PLANET:-'))};
  }
 }
 const context={setTimeout,clearTimeout,Promise,BigInt,Set,Error,UniverseSeed,UniverseGenerationKey,
  GeneratorVersion:{V3:{code:3}},SystemLocator,BodyLocator,MoonLocator,GenesisIndexedDb,
  Vida9ConfirmedSystemBiologyIndexer,
  vida9V3ConfirmedPhysicalTargets:(_key,system)=>system.sectorKey===99n?null:{planetCount:2},
  postMessage:(message)=>sent.push(message),};
 context.globalThis=context;
 vm.runInNewContext(javascript,context,{filename});
 return {sent,context};
}
const finish=()=>new Promise(resolve=>setTimeout(resolve,30));
test('el worker recupera civilizaciones planetarias sin inventar vida en sistemas sin modelo',async()=>{
 const {context,sent}=prepare();
 context.onmessage({data:{requestId:5,kind:'planets',seed:'ABCD',version:3,galaxyIndex:'0',
   systems:['0/2/3','0/99/3']}});
 await finish();
 assert.equal(sent.length,1);
 assert.equal(sent[0].kind,'done');
 assert.equal(sent[0].value.indexed,2);
 assert.equal(sent[0].value.expected,2);
 assert.equal(sent[0].value.missingPhysical,1);
 assert.deepEqual([...sent[0].value.candidates],['0:2:3:0:PLANET:-']);
});
test('el worker mantiene la indexación lunar separada de la planetaria',async()=>{
 const {context,sent}=prepare();
 context.onmessage({data:{requestId:2,kind:'moons',seed:'ABCD',version:3,galaxyIndex:'0',
   moons:['0/2/3/0/1','0/2/3/1/0']}});
 await finish();
 assert.equal(sent[0].kind,'done');
 assert.equal(sent[0].value.indexed,2);
 assert.equal(sent[0].value.candidates.length,0);
});
