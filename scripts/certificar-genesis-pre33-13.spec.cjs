'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {args,checksFromReports,historical,replayHistoricFixtures,evaluate,writeReport,sourceIdentity}=require('./certificar-genesis-pre33-13.cjs');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const b=read('docs/audits/pre33-11b/pre33-11b-auditoria.json');
const c=read('docs/audits/pre33-11c/pre33-11c-auditoria.json');
const d=read('docs/audits/pre33-12/pre33-12-auditoria.json');
const opt=args(['--quick']);
const src=sourceIdentity();
function evalBase(override={}){return evaluate({options:opt,source:src,oldPanel:{status:'HISTORIC_45_REPRODUCED',verified:true,issues:[],systemsChecked:45},
 full:d,upstream11b:b,upstream11c:c,quality:[],commandLog:[],liveEvidence:true,referenceFingerprint:true,...override});}
test('PRE-33.13: no autoriza G2 en una copia sin HEAD y sin pruebas oficiales',()=>{
 const r=evalBase();assert.equal(r.verdict,'G2_PENDIENTE_EVIDENCIA');
 assert.equal(r.authorization,'NO_SE_AUTORIZA_VIDA_EFECTIVA');
 assert.ok(r.missingChecks.includes('workerUnitBuildE2EPassed'));
});
test('PRE-33.13: verifica relaciones de cobertura 11b/11c/12 sin inventar biología',()=>{
 assert.deepEqual(checksFromReports(b,c,d),[]);
 assert.equal(d.totals.moons,d.totals.detailedMoons+d.totals.identityOnlyMoons);
});
test('PRE-33.13: rechaza biología simulada falsificada en informe 11c',()=>{
 const wrong={...c,galaxies:[{...c.galaxies[0],biosphere:'CONFIRMED'}]};
 assert.ok(checksFromReports(b,wrong,d).includes('LIFE_READINESS_GROUND_TRUTH_LEAK'));
 assert.equal(evalBase({upstream11c:wrong}).verdict,'G2_BLOQUEADA');
});
test('PRE-33.13: rechaza una ficha lunar perdida o Ground Truth observado incorrecto',()=>{
 const wrong={...d,totals:{...d.totals,moonCards:d.totals.moonCards-1}};
 assert.ok(checksFromReports(b,c,wrong).includes('PLANET_MOON_OR_OBSERVED_INTEGRATION_BROKEN'));
 assert.equal(evalBase({full:wrong}).verdict,'G2_BLOQUEADA');
});
test('PRE-33.13: 45 originales exigen 45 identidades, no meros contadores',()=>{
 const x=historical(null,opt.seed);assert.equal(x.verified,false);
 assert.equal(x.status,'MISSING_ORIGINAL_45_IDENTITIES');
});
test('PRE-33.13: no equipara panel histórico 45 con nuevo muestreo 60',()=>{
 const r=evalBase();assert.equal(r.previousReference.reported20261020.systems,45);
 assert.notEqual(r.referencePanel60.totals.systems,r.previousReference.reported20261020.systems);
});
test('PRE-33.13: no permite cambiar una salida UNKNOWN en dosis, química o historia por certeza',()=>{
 const r=evalBase();for(const id of ['POTENCIA_QUIMICA_NO_RESUELTA','DOSIMETRIA_GLOBAL_NO_RESUELTA','CONTINUIDAD_GLOBAL_NO_CERTIFICADA']){
  const f=r.findings.find(x=>x.code===id);assert.equal(f.state,'NO_EVALUABLE_JUSTIFICADA');assert.equal(f.permittedUse,'HYPOTHESIS_ONLY');
 }
});
test('PRE-33.13: produce PDF/JSON/MD reproducibles y legibles sin escribir simulación',()=>{
 const a=fs.mkdtempSync(path.join(os.tmpdir(),'pre33-13-a-')),b=fs.mkdtempSync(path.join(os.tmpdir(),'pre33-13-b-'));
 try{const r=evalBase();writeReport(r,a);writeReport(r,b);
 for(const f of ['pre33-13-certificacion.json','pre33-13-dossier.md','pre33-13-dossier.pdf']){
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(a,f))).digest('hex'),crypto.createHash('sha256').update(fs.readFileSync(path.join(b,f))).digest('hex'));
 }
 assert.ok(fs.readFileSync(path.join(a,'pre33-13-dossier.pdf')).subarray(0,8).toString().startsWith('%PDF-'));
 }finally{fs.rmSync(a,{recursive:true,force:true});fs.rmSync(b,{recursive:true,force:true});}
});
test('PRE-33.13: valida opciones estrictas y semillas deterministas',()=>{
 const o=args(['--run-live','--historical-systems=45','--galaxies=0,1,2','--systems-per-galaxy=20','--strict']);
 assert.equal(o.historicalSystems,45);assert.equal(o.runLive,true);assert.equal(o.strict,true);assert.deepEqual(o.galaxies,[0,1,2]);
 assert.throws(()=>args(['--galaxies=invalid']),/Galaxias/);
});

// PRE-33.13a: historical fixtures must replay both canonical V2 sector lineages.
test('PRE-33.13a: 45 originales reales, 9 fixtures físicos congelados y 36 sectores públicos V2',()=>{
 const h=historical('docs/audits/pre33-13/pre33-13-45-historicos-Elixisis.json',opt.seed);
 assert.equal(h.status,'READY_FOR_INDEPENDENT_REPLAY');
 const r=replayHistoricFixtures(h,opt.seed);
 assert.equal(r.status,'HISTORIC_45_REPRODUCED',JSON.stringify(r.issues));
 assert.equal(r.verified,true);assert.equal(r.systemsChecked,45);
 assert.equal(r.lineageCounts['FROZEN_PHYSICAL_V2'],9);
 assert.equal(r.lineageCounts['PUBLIC_V2'],36);
 assert.deepEqual(r.issues,[]);
});
test('PRE-33.13a: alterar recuentos históricos bloquea reproducción aun con identidad válida',()=>{
 const source=read('docs/audits/pre33-13/pre33-13-45-historicos-Elixisis.json');
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'pre33-13-mismatch-'));
 try{
  const wrong={...source,systems:source.systems.map((s,i)=>i===0?{...s,planets:s.planets+1}:s)};
  const filename=path.join(tmp,'wrong.json');fs.writeFileSync(filename,JSON.stringify(wrong));
  const result=replayHistoricFixtures(historical(filename,opt.seed),opt.seed);
  assert.equal(result.verified,false);
  assert.equal(result.status,'HISTORIC_REPLAY_MISMATCH');
  assert.ok(result.issues.includes('PLANETS_CHANGED:Pulaer'));
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
