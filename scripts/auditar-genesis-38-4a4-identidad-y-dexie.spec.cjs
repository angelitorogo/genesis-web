'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {inspect,inspectGenerator,report}=require('./auditar-genesis-38-4a4-identidad-y-dexie.cjs');
const sample=`export class Vida6 {\n generate(identity: string, origin: string) {\n const key = identity + '|lineage';\n const species=[];\n species.push(Object.freeze({id:\`vida6:\${hash(key).slice(0,24)}\`,phenotype:{}}));\n return species;\n }\n}`;
const spatial=`export class Vida6 {\n generate(speciesId:string, planetIndex:number){\n const key = speciesId + '|' + planetIndex;\n const species=[];\n species.push({id:\`vida6:\${hash(key).slice(0,24)}\`});\n return species;\n }\n}`;
test('rastrea la variable key y sus referencias locales desde la asignación del ID',()=>{
 const r=inspectGenerator(sample);assert.equal(r.matches.length,1);const s=r.matches[0];assert.ok(s.dependencies.some(x=>x.symbol==='key'));assert.ok(s.dependencies.some(x=>x.symbol==='identity'));assert.deepEqual(s.possibleSpatial,[]);
});
test('distingue referencia espacial potencial en la cadena de key',()=>{
 const r=inspectGenerator(spatial);const s=r.matches[0];assert.ok(s.possibleSpatial.includes('key')||s.possibleSpatial.includes('planetIndex'));
});
test('si no existen fuentes productivas, no inventa certificación',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'genesis-384a4-'));try{const r=inspect(tmp);assert.equal(r.verification.indexedDbRoundTrip,'NO_EJECUTADA_REPOSITORIOS_REALES');assert.equal(r.verification.identityTrace,'GENERADOR_NO_LOCALIZADO');assert.equal(r.verification.repositoryApiDiscovery,'NO_LOCALIZADAS');}finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
test('el reporte mantiene pendiente la operación de IndexedDB',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'genesis-384a4-'));try{const r=inspect(tmp);assert.match(report(r),/no certifica IndexedDB/i);}finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
