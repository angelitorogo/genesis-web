/** GENESIS 38.bis-T7a — auditoría portable de regresiones T3/T7.
 * Prueba el método real extraído con AST TypeScript, sin Angular ni IndexedDB.
 * Ejecutar desde raíz: node scripts/auditar-genesis-38bis-t7a-regresiones.spec.cjs
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const dir=path.join(root,'src/app/presentation/genesis-archive/38-bis');
const read=name=>fs.readFileSync(path.join(dir,name+'.ts'),'utf8');
const checkSyntax=(name,code)=>{
 const result=ts.transpileModule(code,{fileName:name,reportDiagnostics:true,
   compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 assert.deepEqual(result.diagnostics?.filter(x=>x.category===ts.DiagnosticCategory.Error),[],name);
 return result.outputText;
};
const load=(name,imports)=>{
 const js=checkSyntax(name+'.ts',read(name));const exports={};
 new Function('exports','require',js)(exports,id=>{
   assert.ok(id in imports,`Dependencia inesperada ${id}`);return imports[id];
 });return exports;
};
let checks=0;
function test(fn){fn();checks++;}
const sort=load('genesis-universal-archive-sort-38-bis-b3',{
 './genesis-universal-archive-38-bis.model':{
  universalArchiveSearchKey38Bis:value=>value.normalize('NFD').replace(/[\u0300-\u036f]/gu,'').toLowerCase().trim(),
 },
});
const layout=load('genesis-universal-archive-list-layout-38-bis-b1',{
 './genesis-universal-archive-public-labels-a6':{archivePublicCopyA6:value=>value},
});
const options=c=>sort.archiveSortOptions38BisB3(c).map(x=>x.key);
for(const key of ['galaxy','life','colonies','civilization'])
 test(()=>assert.ok(options('planets').includes(key),`T3 planeta: ${key}`));
for(const key of ['galaxy','life','colonies'])
 test(()=>assert.ok(options('moons').includes(key),`T3 luna: ${key}`));
for(const category of ['colonies','colonized-planets','colonized-moons']){
 test(()=>assert.ok(options(category).includes('population'),`T7: ${category}`));
 test(()=>assert.equal(sort.archiveSortOption38BisB3(category,'population').kind,'number'));
}
for(const key of ['life','colonies','civilization']){
 const option=sort.archiveSortOption38BisB3('planets',key);
 const mk=word=>({category:'planets',sortTitle:'x',subtype:'ALL',cells:{[key]:word}});
 test(()=>assert.equal(sort.archiveSortValue38BisB3(mk('Sí'),option),1));
 test(()=>assert.equal(sort.archiveSortValue38BisB3(mk('No'),option),0));
 test(()=>assert.equal(sort.archiveSortValue38BisB3(mk('No evaluable'),option),null));
}
const popOption=sort.archiveSortOption38BisB3('colonies','population');
const popRow={category:'colonies',sortTitle:'x',subtype:'ALL',cells:{population:'151–5.000'}};
test(()=>assert.equal(sort.archiveSortValue38BisB3(popRow,popOption),null));
test(()=>assert.equal(sort.archiveSortValue38BisB3({...popRow,sortNumbers:{population:2575.5}},popOption),2575.5));
for(const c of ['planets','moons'])test(()=>assert.equal(sort.archiveSortOption38BisB3(c,'population').key,'name'));
const viewRow={category:'planets',cells:{life:'No evaluable',colonies:'No evaluable',civilization:'No evaluable'},actions:[]};
const fields=layout.archiveCompactFields38BisB1(viewRow,'Galaxia A');
for(const key of ['life','colonies','civilization'])
 test(()=>assert.equal(fields.find(x=>x.key===key)?.value,'Sin determinar'));
for(const category of ['colonies','colonized-planets','colonized-moons']){
 const row={category,cells:{population:'1.000–2.000'},actions:[]};
 test(()=>assert.ok(layout.archiveCompactFields38BisB1(row,'Galaxia A')
   .some(x=>x.key==='population'&&x.value.includes('1.000–2.000'))));
}
const index=read('genesis-universal-archive-38-bis.index');
const source=ts.createSourceFile('index.ts',index,ts.ScriptTarget.ES2022,true);
const cls=source.statements.find(node=>ts.isClassDeclaration(node)&&node.name?.text==='GenesisUniversalArchiveIndex38Bis');
assert.ok(cls,'Clase del índice');
const method=cls.members.find(node=>ts.isMethodDeclaration(node)&&node.name.getText(source)==='ensureSort38BisT3');
assert.ok(method,'Método T3 debe existir físicamente y ser público');
test(()=>assert.equal(method.parameters.length,5));
test(()=>assert.match(index,/private readonly sorting38BisT3=new Map<string,Promise<void>>/u));
test(()=>assert.match(index,/this\.store\.ensureSortField\(scope,category,galaxyIndex,field,project\)/u));
test(()=>assert.match(index,/const biological=category==='planets'\|\|category==='moons'/u));
test(()=>assert.match(index,/confirmedBiologicalSystems\.has\(row\.systemStorageKey\)/u));
test(()=>assert.match(index,/if\(consistentNative\)civilization=/u));
test(()=>assert.match(index,/population-t7b-v2/u));
test(()=>assert.match(index,/sortNumbers:Object\.freeze\(\{population:population\?\.midpoint\?\?null\}\)/u));
const html=fs.readFileSync(path.join(root,'src/app/presentation/genesis-archive/genesis-archive.html'),'utf8');
test(()=>assert.ok(html.includes('sortIndexStats38BisT3()')));
test(()=>assert.ok(html.includes('dirtyJobCount38BisT3()')));
test(()=>assert.ok(!html.includes('archive-population-sort-note')));
test(()=>assert.ok(html.includes('No primero / Sí después')));
test(()=>assert.ok(!html.includes('En planetas y lunas se suman únicamente las colonias verificadas')));
const facade=read('genesis-universal-archive-38-bis.facade');
const autoindex=read('genesis-universal-archive-autoindex-38-bis-b6');
test(()=>assert.ok(facade.includes('this.index.ensureSort38BisT3(')));
test(()=>assert.ok(autoindex.includes('this.index.ensureSort38BisT3(')));
for(const name of ['genesis-universal-archive-38-bis.index','genesis-universal-archive-list-layout-38-bis-b1'])
 test(()=>assert.ok(checkSyntax(name+'.ts',read(name)).length>0));
// Execute T3 method exactly as authored (transpiled from AST) with instrumented store.
(async()=>{
 const js=checkSyntax('extracted-T3-method.ts',
  `class Harness {constructor(){this.sorting38BisT3=new Map();}\n${method.getText(source)}\n} exports.Harness=Harness;`);
 const exports={};new Function('exports','archive38BisScope',js)(exports,()=> 'scientific-confirmed-scope');
 const h=new exports.Harness(); let calls=0,release;const gate=new Promise(done=>{release=done;});
 const row={category:'colonies',cells:{galaxy:'',population:'12–150 hab.'},sortNumbers:{population:81}};
 let projected=null;
 h.store={ensureSortField:async(scope,category,galaxy,field,project)=>{
   calls++; projected=await project([row]);await gate;
 }};
 h.enrichVisibleBiologyB1=async(_key,rows)=>rows.map(r=>({...r,cells:{...r.cells,life:'Sí'}}));
 const key={};
 const first=h.ensureSort38BisT3(key,'1','colonies','population','Galaxia Uno');
 const second=h.ensureSort38BisT3(key,'1','colonies','population','Galaxia Uno');
 assert.strictEqual(first,second);checks++;
 assert.equal(calls,1);checks++;
 await Promise.resolve();
 assert.equal(projected[0].sortNumbers.population,81);checks++;
 release();await Promise.all([first,second]);
 const life=await h.ensureSort38BisT3(key,'1','planets','life','Galaxia Uno');
 assert.equal(calls,2);checks++;
 assert.equal(projected[0].cells.life,'Sí');checks++;
 await life;
 await h.ensureSort38BisT3(key,'1','planets','galaxy','Galaxia Uno');
 assert.equal(projected[0].cells.galaxy,'Galaxia Uno');checks++;
 console.log(`PASS 38.bis-T7a: ${checks} comprobaciones T3/T7, método real, vistas y confirmación.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
