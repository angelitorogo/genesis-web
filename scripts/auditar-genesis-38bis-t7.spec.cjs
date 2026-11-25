/** 38.bis-T7/T7a — auditoría portable; ejecuta helper y opciones reales del Archivo.
 * La auditoría no accede a IndexedDB privado, ni sustituye pruebas Angular/Dexie.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const dir=path.join(root,'src/app/presentation/genesis-archive/38-bis');
const read=(name)=>fs.readFileSync(path.join(dir,name+'.ts'),'utf8');
function load(name,imports={}){
  const code=ts.transpileModule(read(name),{fileName:name+'.ts',reportDiagnostics:true,
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
  assert.equal(code.diagnostics?.length??0,0,name+': sintaxis TS');
  const exports={};new Function('exports','require',code.outputText)(exports,id=>{
    assert.ok(id in imports,'Dependencia no esperada '+id+' de '+name);
    return imports[id];
  });
  return exports;
}
let checks=0;
const check=(callback)=>{callback();checks++;};
const population=load('genesis-universal-archive-colonial-population-38bis-t7');
const sort=load('genesis-universal-archive-sort-38-bis-b3',{
  './genesis-universal-archive-38-bis.model':{
    universalArchiveSearchKey38Bis:text=>text.normalize('NFD').replace(/[\u0300-\u036f]/gu,'').toLowerCase().trim(),
  },
});
const layout=load('genesis-universal-archive-list-layout-38-bis-b1',{
  './genesis-universal-archive-public-labels-a6':{archivePublicCopyA6:x=>x},
});
const colony=(low,high)=>({settlement:{colonialPopulationRange:[low,high]}});
const bands=[[12,150],[151,5000],[5001,120000],[120001,1500000]];
for(const [low,high] of bands){
 const result=population.archiveColonialPopulation38BisT7([colony(low,high)]);
 check(()=>assert.equal(result.minimum,low));
 check(()=>assert.equal(result.maximum,high));
 check(()=>assert.equal(result.midpoint,low+(high-low)/2));
 check(()=>assert.match(population.archiveColonialPopulationLabel38BisT7(result),/^[0-9.]+–[0-9.]+$/));
}
const aggregate=population.archiveColonialPopulation38BisT7([
  colony(151,5000),colony(5001,120000),colony(12,150)]);
check(()=>assert.deepEqual(aggregate,{minimum:5164,maximum:125150,midpoint:65157,colonyCount:3}));
check(()=>assert.equal(population.archiveColonialPopulation38BisT7([]),null));
for(const invalid of [[12,-1],[-1,12],[151,150],[NaN,20],[Infinity,100],[1.5,6]]){
 check(()=>assert.equal(population.archiveColonialPopulation38BisT7([colony(...invalid)]),null));
}
check(()=>assert.equal(population.archiveColonialPopulation38BisT7([colony(12,150),{settlement:{}}]),null));
check(()=>assert.equal(population.archiveColonialPopulation38BisT7([
  colony(Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER),colony(12,150)]),null));
check(()=>assert.equal(population.archiveColonialPopulationLabel38BisT7(null),'No evaluable'));
const categories=['colonies','colonized-planets','colonized-moons'];
for(const category of categories){
 const options=sort.archiveSortOptions38BisB3(category);
 check(()=>assert.equal(options.filter(x=>x.key==='population').length,1));
 const option=sort.archiveSortOption38BisB3(category,'population');
 check(()=>assert.equal(option.kind,'number'));
 const projected={id:category,scope:'s',galaxyIndex:'0',category,subtype:'MOON',
   title:'Colonia',sortTitle:'colonia',cells:{population:'5.164–125.150'},
   sortNumbers:{population:65157},actions:[]};
 check(()=>assert.equal(sort.archiveSortValue38BisB3(projected,option),65157));
 check(()=>assert.equal(sort.archiveSortValue38BisB3({...projected,sortNumbers:{population:null}},option),null));
 check(()=>assert.ok(layout.archiveCompactFields38BisB1(projected,'Galaxia')
    .some(x=>x.key==='population'&&x.value.startsWith('5.164–125.150'))));
}
for(const category of ['planets','moons','civilizations','systems']){
 check(()=>assert.equal(sort.archiveSortOption38BisB3(category,'population').key,'name'));
}
const index=read('genesis-universal-archive-38-bis.index');
// Ejecutar las funciones reales de proyección sin instanciar Angular/Dexie.
const ast=ts.createSourceFile('archive-index.ts',index,ts.ScriptTarget.ES2022,true);
const required=new Set(['archiveRowId','colonyLabel','colonyTechnology',
  'colonyFunction','archiveBodyRoute','projectColonyRow']);
const extracted=ast.statements.filter(statement=>ts.isFunctionDeclaration(statement)&&
  statement.name&&required.has(statement.name.text));
check(()=>assert.equal(extracted.length,required.size));
const moduleCode=ts.transpileModule(extracted.map(node=>node.getText(ast)).join('\n'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const actualProjection={};
new Function('exports','archiveColonialPopulation38BisT7',
  'archiveColonialPopulationLabel38BisT7','ARCHIVE_COLONY_ORIGIN_ISSUES_38BIS',
  'universalArchiveSearchKey38Bis',moduleCode)(actualProjection,
  population.archiveColonialPopulation38BisT7,
  population.archiveColonialPopulationLabel38BisT7,
  {NOT_DIAGNOSED:'No comprobable'},x=>x.toLowerCase().trim());
const record={bodyStorageKey:'0:1:2:3:MOON:1',identity:{kind:'MOON',galaxyIndex:'0',
  sectorKey:'1',galacticObjectIndex:'2',bodyIndex:'3',moonIndex:'1'}};
const entries=[{id:'a',origin:{tier:'ADVANCED'},settlement:{
  colonialPopulationRange:[151,5000],habitatTechnology:'SEALED_SURFACE',function:'RESEARCH'}},
  {id:'b',origin:{tier:'VERY_ADVANCED'},settlement:{
  colonialPopulationRange:[5001,120000],habitatTechnology:'SUBSURFACE_VAULT',function:'EXTRACTION'}}];
const individual=actualProjection.projectColonyRow('scope','colonies','0',record,
  'Luna A','Sistema A',entries,entries[0]);
const grouped=actualProjection.projectColonyRow('scope','colonized-moons','0',record,
  'Luna A','Sistema A',entries);
check(()=>assert.equal(individual.sortNumbers.population,2575.5));
check(()=>assert.equal(grouped.sortNumbers.population,65076));
check(()=>assert.match(individual.cells.population,/151–5\.000$/));
check(()=>assert.match(grouped.cells.population,/5\.152–125\.000$/));
check(()=>assert.equal(grouped.cells.count,'2'));
check(()=>assert.equal(grouped.cells.species,undefined));
check(()=>assert.equal(grouped.actions[0].label,'Abrir ficha del cuerpo'));
check(()=>assert.equal(sort.archiveSortValue38BisB3(grouped,
  sort.archiveSortOption38BisB3('colonized-moons','population')),65076));
const html=fs.readFileSync(path.join(root,'src/app/presentation/genesis-archive/genesis-archive.html'),'utf8');
const store=read('genesis-universal-archive-38-bis.store');
const facade=read('genesis-universal-archive-38-bis.facade');
for(const signal of ['archiveColonialPopulation38BisT7(colony?[colony]:colonies)',
  'population:archiveColonialPopulationLabel38BisT7(population)',
  'sortNumbers:Object.freeze({population:population?.midpoint??null})',
  'population-t7b-v2','colony-projection-population-t7b-v2'])check(()=>assert.ok(index.includes(signal),'Integración '+signal));
check(()=>assert.ok(!html.includes('archive-population-sort-note')));
check(()=>assert.ok(!html.includes('Se muestra el intervalo completo')));
check(()=>assert.ok(store.includes('ensureSortField(')));
check(()=>assert.ok(store.includes('this.sortRevisions.bulkDelete')));
check(()=>assert.ok(facade.includes('this.index.ensureSort38BisT3(')));
check(()=>assert.ok(index.includes('this.store.ensureSortField(scope,category,galaxyIndex,field,project)')));
check(()=>assert.ok(index.includes('validatedColonies38Bis(record)')));
check(()=>assert.ok(index.includes('confirmedSystems38Bis(known)')));
check(()=>assert.ok(index.includes('origin.tier')));
console.log(`PASS 38.bis-T7: ${checks} comprobaciones; 3 categorías, intervalos reales VIDA.8, agregación, ordenación y política CONFIRMED.`);
