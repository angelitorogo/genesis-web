'use strict';
const {test}=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const t=fs.readFileSync(path.resolve(__dirname,'auditar-genesis-pre33-03a3.cjs'),'utf8');
test('PRE33.03a.3: V3 verificada sin escrituras de persistencia',()=>{
  assert.match(t,/GeneratorVersion\.V3/);
  assert.doesNotMatch(t,/indexedDB\.|localStorage\.|\.put\(/);
});
test('PRE33.03a.3: distingue cierre condicional y certificación no obtenida',()=>{
  assert.match(t,/validateLedger/);assert.match(t,/physicalCT0InventoryCertified/);
  assert.match(t,/CT0_WATER_LEDGER_VALIDATED_PHYSICAL_CERTIFICATION_UNRESOLVED/);
});
