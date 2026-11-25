/** GENESIS 38.bis-T7b — auditoría portátil contra regresión «No evaluable».
 * Lee fuente VIDA.8 y módulos reales del Archivo, sin modificar IndexedDB.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const dir=path.join(root,'src/app/presentation/genesis-archive/38-bis');
const get=name=>fs.readFileSync(path.join(dir,name+'.ts'),'utf8');
const transpile=(s,n='module.ts')=>{
  const result=ts.transpileModule(s,{fileName:n,reportDiagnostics:true,
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
  assert.equal(result.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error).length??0,0,n);
  return result.outputText;
};
let checks=0;
const test=f=>{f();checks++;};
const helper={};new Function('exports',transpile(get('genesis-universal-archive-colonial-population-38bis-t7')))(helper);
const base=(band,range)=>({settlement:{populationBand:band,...(range===undefined?{}:{colonialPopulationRange:range})}});
const official={OUTPOST:[12,150],SETTLEMENT:[151,5000],CITY:[5001,120000],NETWORK:[120001,1500000]};
const engine=fs.readFileSync(path.join(root,'src/app/simulation/life/vida8-technological-colonization.ts'),'utf8');
for(const [band,range] of Object.entries(official)){
  test(()=>assert.match(engine,new RegExp(`${band}\\s*:\\s*\\[${range.join('\\s*,\\s*')}\\]`)));
  const value=helper.archiveColonialPopulation38BisT7([base(band)]);
  test(()=>assert.deepEqual(value,{minimum:range[0],maximum:range[1],
    midpoint:range[0]+(range[1]-range[0])/2,colonyCount:1}));
  test(()=>assert.deepEqual(helper.archiveColonyPopulationInterval38BisT7b(base(band)),range));
}
const old=base('CITY');const current=base('OUTPOST',[12,150]);
const sum=helper.archiveColonialPopulation38BisT7([old,current]);
test(()=>assert.deepEqual(sum,{minimum:5013,maximum:120150,midpoint:62581.5,colonyCount:2}));
test(()=>assert.match(helper.archiveColonialPopulationLabel38BisT7(sum),/5\.013–120\.150$/));
for(const bad of [base('INVALID'),base(undefined),base('CITY',[150,12]),
  base('CITY',[-3,150]),base('CITY',[null,150]),{settlement:{}}]){
  test(()=>assert.equal(helper.archiveColonialPopulation38BisT7([bad]),null));
}
test(()=>assert.equal(helper.archiveColonialPopulation38BisT7([old,base('INVALID')]),null));
// Projection must use the helper for both individual colonies and body aggregates.
const index=get('genesis-universal-archive-38-bis.index');
const ast=ts.createSourceFile('index.ts',index,ts.ScriptTarget.ES2022,true);
const names=new Set(['archiveRowId','colonyLabel','colonyTechnology','colonyFunction','archiveBodyRoute','projectColonyRow']);
const functions=ast.statements.filter(s=>ts.isFunctionDeclaration(s)&&s.name&&names.has(s.name.text));
test(()=>assert.equal(functions.length,names.size));
const projected={};new Function('exports','archiveColonialPopulation38BisT7',
  'archiveColonialPopulationLabel38BisT7','ARCHIVE_COLONY_ORIGIN_ISSUES_38BIS','universalArchiveSearchKey38Bis',
  transpile(functions.map(f=>f.getText(ast)).join('\n')))(projected,
  helper.archiveColonialPopulation38BisT7,helper.archiveColonialPopulationLabel38BisT7,
  {NOT_DIAGNOSED:'Origen no verificable'},x=>x.toLowerCase().trim());
const body={bodyStorageKey:'1:2:3:4:PLANET:-',identity:{kind:'PLANET',galaxyIndex:'1',
  sectorKey:'2',galacticObjectIndex:'3',bodyIndex:'4',moonIndex:null}};
const colonies=[{id:'a',origin:{tier:'ADVANCED'},settlement:{...old.settlement,
  habitatTechnology:'SEALED_SURFACE',function:'RESEARCH'}},
 {id:'b',origin:{tier:'VERY_ADVANCED'},settlement:{...current.settlement,
  habitatTechnology:'SUBSURFACE_VAULT',function:'EXTRACTION'}}];
for(const category of ['colonies','colonized-planets','colonized-moons']){
  const record=category==='colonized-moons'?{...body,identity:{...body.identity,kind:'MOON',moonIndex:'0'}}:body;
  const row=projected.projectColonyRow('s',category,'1',record,'Destino','Sistema',colonies,
    category==='colonies'?colonies[0]:undefined);
  test(()=>assert.notEqual(row.cells.population,'No evaluable'));
  test(()=>assert.equal(row.sortNumbers.population,category==='colonies'?62500.5:62581.5));
  test(()=>assert.match(row.cells.population,/^[0-9.]+–[0-9.]+$/));
}
for(const tag of ['population-t7b-v2','colony-projection-population-t7b-v2'])
 test(()=>assert.ok(index.includes(tag)));
const facade=get('genesis-universal-archive-38-bis.facade');
for(const marker of ['staleColonialIndices38BisT7b','this.buildCategory(key,staleColonialIndices38BisT7b',
  "!s.sourceRevision.includes('population-t7b-v2')",'!staleColonialGalaxies38BisT7b.has(s.galaxyIndex)'])
 test(()=>assert.ok(facade.includes(marker),marker));
// Check the three complete production modules parse as TypeScript.
for(const filename of ['genesis-universal-archive-38-bis.index','genesis-universal-archive-38-bis.facade',
  'genesis-universal-archive-colonial-population-38bis-t7'])
 test(()=>assert.ok(transpile(get(filename),filename+'.ts').length>10));
console.log(`PASS 38.bis-T7b: ${checks} comprobaciones de fuente VIDA.8, recuperación, agregación, 3 vistas y autoactualización acotada.`);
