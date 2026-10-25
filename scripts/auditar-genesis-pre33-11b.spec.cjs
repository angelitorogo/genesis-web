'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const ts=require('typescript');if(!require.extensions['.ts'])require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {calibrateGalaxyOpportunityPRE3311b:calibrate,radialRegionPRE3311b:radial,
 enumerateGalacticSectorFramePRE3311b:frame}=require('../src/app/simulation/planetary/galactic-statistical-calibration-pre33-11b.ts');
const {choose,index,parse,report,TAG}=require('./auditar-genesis-pre33-11b.cjs');
const regions=['CENTRAL','INNER','MIDDLE','OUTER'];
function make(){return regions.flatMap((region,i)=>[0,1].map(j=>({region,sectorX:i*10+j,sectorY:0,frameSectors:8,selectedSectors:2,locators:2,
 planets:1,detailedMoons:2,identityOnlyMoons:1,moonLiquidH2O:j===0?1:0,moonAbsentH2O:j===0?1:0,moonUnknownH2O:j===0?0:2,
 planetLiquidH2O:0,families:{ROCKY:1},architecture:'SINGLE',evidence:'SIMULATED_CT0_ONLY_NOT_BIOLOGY'})));}
test('diseño SRS auditable: semilla de muestreo independiente y sin duplicados',()=>{
 const c=frame(18);for(const r of regions)for(const p of c[r])assert.equal(radial(p.x,p.y,18),r);
 const original=c.INNER.slice(0,100);
 const a=choose(original,12,['CALIBRATION',0]);const b=choose(original,12,['CALIBRATION',0]);
 assert.deepEqual(a,b);assert.equal(new Set(a.map(x=>x.x+':'+x.y)).size,12);
 assert.notDeepEqual(a,choose(original,12,['CALIBRATION',1]));
 assert.throws(()=>choose(original,101,'X'),/UNDERSAMPLED/);
 assert.ok(index(3,['TEST',0])>=0&&index(3,['TEST',0])<3);
});
test('weights por sector y locator; identidad lunar no se vuelve negativa',()=>{
 const x=calibrate(make());assert.equal(x.expanded.planets,64);
 assert.equal(x.expanded.moonLiquidH2O,32);assert.equal(x.expanded.detailedMoons,128);
 assert.equal(x.expanded.identityOnlyMoons,64);
 assert.equal(x.amongDetailedMoons.point,.25);
 assert.equal(x.life,'NOT_EVALUATED');assert.equal(x.physicalEnergyAndRadiation,'NOT_CERTIFIED');
 assert.ok(x.potentialAllMoonEnvelope[1]>x.potentialAllMoonEnvelope[0]);
});
test('cero positivo no implica falsa certeza [0,0]',()=>{
 const input=make().map(x=>({...x,moonLiquidH2O:0,moonAbsentH2O:2,moonUnknownH2O:0}));
 const c=calibrate(input);assert.equal(c.amongDetailedMoons.point,0);
 assert.equal(c.amongDetailedMoons.interval95Approx,null);
 assert.ok(c.potentialAllMoonEnvelope[1]>0);
});
test('rechaza un estrato no cubierto y sin evidencia científica',()=>{
 assert.equal(calibrate(make().slice(0,6)).status,'INSUFFICIENT_PROBABILITY_SAMPLE');
 assert.throws(()=>calibrate(make().map((x,i)=>i?x:{...x,evidence:'LIFE'})),/INVALID_DESIGN_OBSERVATION/);
 assert.throws(()=>calibrate([...make(),make()[0]]),/DUPLICATE_SECTOR/);
 assert.throws(()=>calibrate(make().map((x,i)=>i?x:{...x,families:{ICE:3}})),/PLANET_FAMILY_PARTITION_INVALID/);
});
test('reporte reproducible, sin mutar datos de origen, ni vida positiva',()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'genesis-pre33-11b-'));
 try{
  const sample=make(),calibration=calibrate(sample);
  const gal={galaxy:'Fixture',galaxyIndex:0,gridHalfExtent:30,emptyFrame:{CENTRAL:0,INNER:0,MIDDLE:0,OUTER:0},calibration,errors:[],observations:sample};
  const opts={seed:'SEED_FOR_REPORT',samplingKey:'INDEPENDENT_DESIGN',perRegion:2,out:folder};
  const result=report([gal],opts);assert.equal(result.verdict,TAG);
  const body=fs.readFileSync(path.join(folder,'pre33-11b-auditoria.json'));
  report([gal],opts);assert.deepEqual(fs.readFileSync(path.join(folder,'pre33-11b-auditoria.json')),body);
  assert.equal(JSON.parse(body).life,'NOT_EVALUATED');
 }finally{fs.rmSync(folder,{recursive:true,force:true});}
});
test('validación de opciones no permite estratos de un solo sector',()=>{
 assert.equal(parse(['--systems-per-galaxy=20']).perRegion,5);
 assert.throws(()=>parse(['--sectors-per-region=1']),/INVALID_SAMPLING_OPTIONS/);
 assert.throws(()=>parse(['--galaxies=0,0']),/INVALID_SAMPLING_OPTIONS/);
});
