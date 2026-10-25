'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const text=fs.readFileSync(path.resolve(__dirname,'auditar-genesis-pre33-03b.cjs'),'utf8');
test('PRE33.03b: solo universos V3, sin acceder a IndexedDB',()=>{
 assert.match(text,/GeneratorVersion\.V3/);assert.doesNotMatch(text,/indexedDB\.|localStorage\.|\.put\(/);
});
test('PRE33.03b: exige cierre sin océanos certificados',()=>{
 assert.match(text,/ct0OceansCertified/);assert.match(text,/DEEP_OCEAN_CONDITIONAL_STRUCTURE_PASSED_CT0_NOT_CERTIFIED/);
});
