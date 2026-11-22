/* 38.bis-T3c: auditoría portable de identidades de fixtures y semántica de desempate.
 * No reemplaza Vitest sobre Dexie / fake-indexeddb. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const spec=fs.readFileSync(path.join(root,'src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-t3-scientific-sorts.spec.ts'),'utf8');
const source=fs.readFileSync(path.join(root,'src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-38-bis.index.ts'),'utf8');
const store=fs.readFileSync(path.join(root,'src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-38-bis.store.ts'),'utf8');
assert.match(source,/function archiveRowId\([^)]*\)[^{]*\{return JSON\.stringify\(\[scope,category,galaxyIndex,id\]\);\}/s,'La identidad de producción ha cambiado');
assert.match(spec,/id:JSON\.stringify\(\[scope,category,galaxyIndex,id\]\)/,'Fixture no usa la identidad de producción');
assert.match(store,/\[scope\+category\+field\+available\+value\+rowId\]/,'El índice de ordenación persistida ha cambiado');
assert.match(spec,/\['A','D','B','C'\]/,'No deben suavizarse las aserciones de la ordenación ascendente');
assert.match(spec,/\['B','D','A','C'\]/,'No deben suavizarse las aserciones de la ordenación descendente');
assert.match(spec,/\['B','C','A'\]/,'No deben suavizarse las aserciones del incremento localizado');
const scope='GENESIS-38BIS-T3-TEST';
const data=[['A','0',0],['D','0',1],['B','1',1],['C','1',null]].map(([title,galaxy,value])=>({
 title, value,rowId:JSON.stringify([scope,'planets',galaxy,title]),
}));
const sorted=(descending)=>[
 ...data.filter(x=>x.value!==null).sort((a,b)=>
   ((a.value-b.value)||a.rowId.localeCompare(b.rowId))*(descending?-1:1)),
 ...data.filter(x=>x.value===null),
].map(x=>x.title);
assert.deepEqual(sorted(false),['A','D','B','C']);
assert.deepEqual(sorted(true),['B','D','A','C']);
const after=[['A','0',0],['C','0',1],['B','1',1]].map(([title,galaxy,value])=>({
 title,value,rowId:JSON.stringify([scope,'planets',galaxy,title]),
}));
assert.deepEqual(after.sort((a,b)=>(b.value-a.value)||b.rowId.localeCompare(a.rowId)).map(x=>x.title),['B','C','A']);
const typescript=require('typescript');
const parsed=typescript.createSourceFile('genesis-universal-archive-t3-scientific-sorts.spec.ts',spec,typescript.ScriptTarget.ES2022,true,typescript.ScriptKind.TS);
assert.equal(parsed.parseDiagnostics.length,0,'El spec tiene errores de sintaxis TypeScript');
console.log('38.bis-T3c PASS: identidad real, desempate global, aserciones originales y sintaxis TS.');
