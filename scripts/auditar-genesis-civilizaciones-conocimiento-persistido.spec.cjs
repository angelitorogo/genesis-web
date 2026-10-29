'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const ts=require('typescript');
const base=path.resolve(__dirname,'..');
const filename=path.join(base,'src/app/presentation/galaxy-knowledge-catalog/galaxy-civilization-known-index.ts');
const src=fs.readFileSync(filename,'utf8');
const ast=ts.createSourceFile(filename,src,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
const names=new Set(['censusOf','confirmedCivilizationKnowledgeRevision',
  'restoreCivilizationKnowledgeIndex','confirmedPhysicalPlanetCount']);
const helpers=ast.statements.filter(x=>ts.isFunctionDeclaration(x)&&x.name&&names.has(x.name.text))
  .map(x=>src.slice(x.getStart(ast),x.end)).join('\n');
const js=ts.transpileModule(helpers,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const context={exports:{},sha256:(b)=>crypto.createHash('sha256').update(b).digest(),
  utf8ToBytes:(s)=>Buffer.from(s,'utf8'),bytesToHex:(b)=>Buffer.from(b).toString('hex')};
vm.runInNewContext(js+'\nthis.exposed={censusOf,confirmedCivilizationKnowledgeRevision,restoreCivilizationKnowledgeIndex,confirmedPhysicalPlanetCount};',context);
const {confirmedCivilizationKnowledgeRevision:revision,restoreCivilizationKnowledgeIndex:restore,
  confirmedPhysicalPlanetCount:count}=context.exposed;
const known=new Set(['0/1/2','0/7/8']);
const entry={id:'0:1:2:3:PLANET:-',systemKey:'0/1/2',planetName:'Glavara B-4',systemName:'Glavara',
  speciesName:'Arvor al5',speciesId:'s1',lineage:'Reptiliana',tier:'VERY_ADVANCED',
  locator:{galaxyIndex:'0',sectorKey:'1',galacticObjectIndex:'2',bodyIndex:'3'}};
const original={entries:[entry],primitive:0,advanced:0,veryAdvanced:1,complete:true,
  planetsWithBiologicalRecord:2,knownPhysicalPlanets:2};
test('confirmar otro sistema invalida el índice galáctico (orden independiente)',()=>{
 assert.equal(revision(known),revision(new Set(['0/7/8','0/1/2'])));
 assert.notEqual(revision(known),revision(new Set(['0/1/2'])));
});
test('el snapshot completo se restaura con especies/niveles sin tocar Vida 9',()=>{
 const c=restore(JSON.stringify(original),known,0n);
 assert.equal(c.entries[0].speciesName,'Arvor al5'); assert.equal(c.veryAdvanced,1);
 assert.equal(c.complete,true);
});
test('no filtra civilizaciones de un sistema NO confirmado o de otra galaxia',()=>{
 assert.throws(()=>restore(JSON.stringify(original),new Set(['0/7/8']),0n));
 assert.throws(()=>restore(JSON.stringify(original),known,1n));
});
test('identidades, recuentos y coberturas alteradas se rechazan',()=>{
 assert.throws(()=>restore(JSON.stringify({...original,primitive:3}),known,0n));
 assert.throws(()=>restore(JSON.stringify({...original,complete:false}),known,0n));
 assert.throws(()=>restore(JSON.stringify({...original,entries:[entry,entry]}),known,0n));
});
test('solo cuentan cuerpos físicos de sistemas confirmados',()=>{
 const locator={galaxyIndex:{__genesisBigInt:'0'},sectorKey:{__genesisBigInt:'1'},
   galacticObjectIndex:{__genesisBigInt:'2'}};
 const raw=JSON.stringify({planets:[{locator,stateName:'CONFIRMED'},
   {locator,stateName:'CONFIRMED'},{locator,stateName:'DISCOVERED'}]});
 assert.equal(count(raw,known),2);
 assert.equal(count(raw,new Set(['0/7/8'])),null);
 assert.equal(count(undefined,known),null);
});
test('el índice persistido se consulta antes de abrir la tabla biológica',()=>{
 const saved=src.indexOf('const saved=await this.db.galaxyKnowledgeSnapshots.get(cacheKey)');
 const privateTable=src.indexOf('const keys=await this.db.privateBiologicalRecordsVIDA9');
 assert.ok(saved>0 && privateTable>saved);
 assert.ok(src.slice(saved,privateTable).includes('return restoreCivilizationKnowledgeIndex'));
 assert.ok(src.includes("this.db.transaction('rw',this.db.galaxyKnowledgeSnapshots"));
});
