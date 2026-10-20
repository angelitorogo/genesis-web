'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {assess,decodeLog} = require('./reportar-genesis-31-cierre.cjs');
const {mkdtempSync,writeFileSync,rmSync} = require('node:fs');
const {tmpdir} = require('node:os');
const {join} = require('node:path');
const {execFileSync} = require('node:child_process');
const record = (e) => `GENESIS_31_FINAL_EVIDENCE ${JSON.stringify(e)}`;
const good = () => {
 const records = ['SINGLE','BINARY','TRIPLE','LUNAR_V2'].map(scenario=>({
   scenario, ageYearsCT0:100,irradianceYears:80,unknownYears:21,
   environment:'UNKNOWN_BY_DESIGN', life:'NOT_EVALUATED',certification:'NOT_CERTIFIED',private:true,
   radiativeScope:scenario==='SINGLE'||scenario==='LUNAR_V2'
    ? 'HOST_STELLAR_SYSTEM_CONDITIONAL':'ONE_COMPONENT_ONLY_NOT_MULTIPLE_TOTAL',
   integrated31_7_8_9:true,deterministic:true,parentKey:'planet',moonKey:'planet/M0'
 }));
 records.push({scenario:'COMPACT_V2',illustrationNotPhysical:true,
   datedHistory:'UNKNOWN_BY_DESIGN',certification:'NOT_CERTIFIED'});
 records.push({scenario:'PERMISSIONS_V2',lockedDenied:true,privateNotSerialized:true,
   copiedTargetCannotAccess:true});
 records.push({scenario:'EVENT_DISRUPTION',eventYear:30,ageYearsCT0:100,irradiationStopsAt:29,
   unknownFromEvent:true,deterministic:true,life:'NOT_EVALUATED',certification:'NOT_CERTIFIED'});
 return `Test Files  1 passed (1)\nTests  8 passed (8)\n${records.map(record).join('\n')}`;
};
test('scope passes but never masquerades as full scientific certification',()=>{
 const r=assess(good());assert.equal(r.status,'SCOPED_VALIDATION_PASSED');
 assert.equal(r.scientificPhaseClosure,'NOT_CERTIFIED');
 assert.equal(r.scenarios.find(x=>x.scenario==='COMPACT_V2').result,'UNKNOWN_BY_DESIGN');
});
test('missing lunar evidence fails rather than receiving invented coverage',()=>{
 const s=good().split('\n').filter(l=>!l.includes('"scenario":"LUNAR_V2"')).join('\n');
 assert.equal(assess(s).status,'FAIL');
});
test('failing Vitest exit or false date totals fail closed',()=>{
 assert.equal(assess(good().replace('1 passed (1)','1 failed (1)')).status,'FAIL');
 assert.equal(assess(good().replace('"unknownYears":21','"unknownYears":20')).status,'FAIL');
});
test('duplicate evidence and forged positive compact are rejected',()=>{
 const s=good();const first=s.split('\n').find(l=>l.includes('"scenario":"SINGLE"'));
 assert.equal(assess(s+'\n'+first).status,'FAIL');
 assert.equal(assess(s.replace('"illustrationNotPhysical":true','"illustrationNotPhysical":false')).status,'FAIL');
});

// Windows PowerShell 5.1 Tee-Object writes UTF-16 LE with BOM by default.
test('PowerShell UTF-16 LE Tee-Object log preserves all seven E2E evidence records',()=>{
 const raw='\x1b[32m'+good().replace('Test Files', '\x1b[0mTest Files');
 const bytes=Buffer.concat([Buffer.from([0xff,0xfe]),Buffer.from(raw,'utf16le')]);
 assert.equal(assess(decodeLog(bytes)).status,'SCOPED_VALIDATION_PASSED');
});
test('the CLI itself reads Windows PowerShell UTF-16 LE reports',()=>{
 const dir=mkdtempSync(join(tmpdir(),'genesis-31-report-'));
 try {
  const source=join(dir,'output.txt');
  writeFileSync(source,Buffer.concat([Buffer.from([0xff,0xfe]),Buffer.from(good(),'utf16le')]));
  const stdout=execFileSync(process.execPath,[require.resolve('./reportar-genesis-31-cierre.cjs'),source],{encoding:'utf8'});
  const report=JSON.parse(stdout);
  assert.equal(report.status,'SCOPED_VALIDATION_PASSED');
  assert.equal(report.scenarios.length,7);
  assert.equal(report.scientificPhaseClosure,'NOT_CERTIFIED');
 } finally { rmSync(dir,{recursive:true,force:true}); }
});
test('UTF-8 and UTF-8 BOM logs remain supported and corrupt encoding is rejected',()=>{
 assert.equal(assess(decodeLog(Buffer.from(good(),'utf8'))).status,'SCOPED_VALIDATION_PASSED');
 assert.equal(assess(decodeLog(Buffer.from('\uFEFF'+good(),'utf8'))).status,'SCOPED_VALIDATION_PASSED');
 assert.throws(()=>decodeLog(Buffer.from([0xff,0xfe,0x41])),/Incomplete UTF-16 LE/);
});
