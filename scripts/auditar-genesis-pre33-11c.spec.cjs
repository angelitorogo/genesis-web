'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const ts=require('typescript');
if(!require.extensions['.ts'])require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{
 fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const engine=require('../src/app/simulation/planetary/galactic-life-readiness-pre33-11c.ts');
const audit=require('./auditar-genesis-pre33-11c.cjs');
const all=['LIQUID_SOLVENT','REACTANTS_AND_CHEMICAL_POWER','PRESSURE_OR_CONFINEMENT','IONIZING_EXPOSURE','DATED_ENVIRONMENTAL_CONTINUITY'];
const physical=()=>all.map(factor=>({factor,state:'UNKNOWN',sourceKey:null,scope:'UNKNOWN'}));
test('fases 33–38 quedan bloqueadas, sin resultados canónicos',()=>{
 const body={contract:'PRE-33.11a/V3-GALACTIC-ENVIRONMENT/v1',sectorKey:'test-sector',hostPlanetOrdinal:1,moonOrdinal:1,
 bodyKind:'MOON_DETAILED',family:'MOON',niche:'MOON_INTERIOR',biosphere:'NOT_EVALUATED',
 observation:'PRIVATE_GENERATIVE_GROUND_TRUTH_NOT_DISCOVERY',issues:[],routes:['H2O','NH3','CH4'].map((solvent,i)=>({
 solvent,phase:i===0?'CT0_LIQUID_IN_SIMULATED_MODEL':'UNRESOLVED_PHASE_OR_INVENTORY',
 reactantsAndKinetics:'UNRESOLVED',doseAndHistory:'UNRESOLVED',life:'NOT_EVALUATED',observed:false}))};
 const r=engine.prepareLifeReadinessPRE3311c(body);
 assert.deepEqual(r.futurePhases.map(x=>x.phase),[33,34,35,36,37,38]);
 assert.equal(r.routes[0].status,'INPUTS_UNRESOLVED');
 assert.equal(r.routes[1].physicalFactors[0].state,'UNKNOWN');
 assert.equal(r.lifeFrequency,'NOT_ESTIMABLE_FROM_ENVIRONMENT');
 assert.equal(r.observerView,'NO_AUTOMATIC_DISCOVERY');
 assert.equal(r.routes[0].livingOrganisms,'NOT_SIMULATED');
});
test('una entrada completamente favorable no simula abiogénesis',()=>{
 const x=engine.assessPhysicalLifeRoutePRE3311c('OTHER',all.map(factor=>({factor,state:'SUPPORTED_BY_MODEL',scope:'DATED_MODEL',sourceKey:factor})));
 assert.equal(x.status,'INPUTS_COMPLETE_FOR_FUTURE_HYPOTHESIS');assert.equal(x.abiogenesis,'NOT_EVALUATED');
 assert.equal(x.candidateBiosignatures,'NOT_INFERRED');
 assert.throws(()=>engine.assessPhysicalLifeRoutePRE3311c('CH4',[...physical().slice(1),physical()[1]]),/INVALID_PHYSICAL_EVIDENCE/);
});
test('señal instrumental y falso positivo abiótico nunca confirman vida',()=>{
 const x=engine.assessSignalDetectabilityPRE3311c({channel:'TECHNOSIGNATURE',observableKey:'FAKE_SIGNAL',
  sourceProvenance:'src',instrumentProvenance:'inst',observingGeometryProvenance:'geometry',
  signalElectronRate:2,backgroundElectronRate:9,darkElectronRate:0,readNoiseElectronsRms:1,exposureSeconds:25,
  alternativeAbioticExplanation:'PLAUSIBLE',independentEvidenceKey:null});
 assert.equal(x.status,'INSTRUMENT_SIGNAL_ESTIMABLE');assert.equal(x.detectedCivilization,'NOT_INFERRED');
 assert.equal(x.alternativeAbioticExplanation,'PLAUSIBLE');
});
test('auditoría conserva los tres calibradores, vida no estimable y 4 regiones × 4 solventes',()=>{
 const a=audit.build();assert.equal(a.galaxies.length,3);assert.equal(a.regions.length,48);
 assert.equal(a.issues.length,0);assert.equal(a.verdict,audit.TAG);
 for(const g of a.galaxies){assert.equal(g.sectorsSampled,40);assert.equal(g.calibration.lifeRate,null);
 assert.equal(g.calibration.intelligenceRate,null);assert.equal(g.calibration.civilizationRate,null);}
});
test('misma entrada auditada = mismos bytes JSON, CSV y Markdown',()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'pre33-11c-'));
 try{const a=audit.build();const x=audit.write(d,a),first=fs.readFileSync(path.join(d,'pre33-11c-auditoria.json'));
 const y=audit.write(d,a);assert.deepEqual(x,y);
 assert.deepEqual(fs.readFileSync(path.join(d,'pre33-11c-auditoria.json')),first);
 }finally{fs.rmSync(d,{recursive:true,force:true});}
});
test('no acepta un informe con biología concedida',()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'pre33-11c-invalid-'));
 try{const source=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/audits/pre33-11b/pre33-11b-auditoria.json'),'utf8'));
 source.life='CONFIRMED';const file=path.join(d,'bad.json');fs.writeFileSync(file,JSON.stringify(source));
 assert.throws(()=>audit.read(file),/INVALID_UPSTREAM/);
 }finally{fs.rmSync(d,{recursive:true,force:true});}
});
