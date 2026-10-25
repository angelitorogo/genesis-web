'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const ts=require('typescript');require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),
 {fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const root='../src/app/';
const {PlanetType}=require(root+'domain/planetary/planet-type.ts');
const {PlanetaryDiversityCoveragePRE3311:Coverage}=require(root+'simulation/planetary/planetary-diversity-coverage-pre33-11.ts');
const {aggregate,TYPES}=require('./auditar-genesis-pre33-11.cjs');
const {UniverseGenerationKey}=require(root+'domain/generation/universe-generation-key.ts');
const {UniverseSeed}=require(root+'domain/universe/universe-seed.ts');
const {GeneratorVersion}=require(root+'domain/generation/generator-version.ts');
const {GalaxyGenerator}=require(root+'simulation/universe/galaxy-generator.ts');
const {GalaxySectorContentGenerator}=require(root+'simulation/sector/galaxy-sector-content-generator.ts');
const {GalaxySectorCoordinates}=require(root+'domain/sector/galaxy-sector-coordinates.ts');
const {StellarMultihostFormation}=require(root+'simulation/stellar/stellar-multihost-formation.ts');
const key=new UniverseGenerationKey(UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),GeneratorVersion.V3);
const galaxy=GalaxyGenerator.generate(key,0n);
const singleLocator=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(23,24)).systemLocators.find(x=>x.galacticObjectIndex===0n);
const multiLocator=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(-7,24)).systemLocators.find(x=>x.galacticObjectIndex===0n);
assert.ok(singleLocator&&multiLocator);
const single=StellarMultihostFormation.generateSingleOrNull(key,singleLocator);assert.ok(single);
const multi=StellarMultihostFormation.generateOrNull(key,multiLocator);assert.ok(multi);
test('nueve familias, tres categorías de envoltura; OCEAN no implica océano CT-0',()=>{
 assert.equal(TYPES.length,9);assert.deepEqual(TYPES,Object.values(PlanetType));
 for(const type of TYPES)assert.equal(Coverage.familyDomain(type),
  ['MINI_NEPTUNE','GAS_GIANT','ICE_GIANT'].includes(type)?'DEEP_ENVELOPE':'SOLID_BASE');
 assert.throws(()=>Coverage.familyDomain('EXTRATERRESTRIAL_LIFE'));
});
test('SINGLE V3 real: identidad, coherencia física y 0 biología inferida',()=>{
 for(const [i,p] of single.planets.entries()){
  const r=Coverage.standard(p,single.moonSystems[i],'SINGLE','A');
  assert.deepEqual(r.issues,[]);assert.equal(r.biology,'NOT_EVALUATED');
  assert.equal(r.moonCount,r.detailedMoonCount+r.identityOnlyMoonCount);
 }
});
test('BINARY S/P reales: cada host conserva su topología y las identidades',()=>{
 assert.ok(multi.publicPlanets.some(p=>p.host==='AB'));
 for(const p of multi.publicPlanets){
  const r=Coverage.standard(p.planet,p.moonSystem,'BINARY',p.host);
  assert.deepEqual(r.issues,[]);assert.equal(r.topology,p.host==='AB'?'CIRCUMBINARY':'CIRCUMSTELLAR');
 }
});
test('no da positivo a una topología P-type falsamente S-type',()=>{
 const p=multi.publicPlanets.find(p=>p.host==='AB');assert.ok(p);
 const invalid=Coverage.standard(p.planet,p.moonSystem,'BINARY','A');
 assert.ok(invalid.issues.includes('PUBLIC_HOST_TOPOLOGY_MISMATCH'));
});
test('no concede nichos de superficie a mini-Neptunos y gigantes',()=>{
 assert.equal(Coverage.familyDomain(PlanetType.GAS_GIANT),'DEEP_ENVELOPE');
 assert.equal(Coverage.familyDomain(PlanetType.ICE_GIANT),'DEEP_ENVELOPE');
 assert.equal(Coverage.familyDomain(PlanetType.MINI_NEPTUNE),'DEEP_ENVELOPE');
});
test('compactos: sin zona habitable supuesta ni fotosfera derivada',()=>{
 const source={architecture:'SINGLE',status:'SNAPSHOT_MODEL_UNVALIDATED_N_BODY',
  planets:[{bulkKind:'SUPER_EARTH',ordinal:2,massEarth:3,radiusEarth:1.3,
  periastronAu:.9,semiMajorAxisAu:1,apoastronAu:1.1,rocheLimitAu:.01,eccentricity:.1}]};
 const [r]=Coverage.compact(source);assert.equal(r.niche,'COMPACT_SNAPSHOT');
 assert.equal(r.issues.length,0);assert.equal(r.biology,'NOT_EVALUATED');
 const broken=Coverage.compact({...source,planets:[{...source.planets[0],periastronAu:.001}]});
 assert.ok(broken[0].issues.includes('COMPACT_ORBIT_ROCHE_SCREEN'));
});
test('agregación no obliga cuotas: OCEAN ausente es un hueco, no un error',()=>{
 const g={galaxy:'Fixture',galaxyIndex:0,systems:1,planets:1,moons:0,detailedMoons:0,identityOnlyMoons:0,
 compactProbes:5,compactHostSystems:0,compactPlanetarySystems:0,compactPlanets:0,
 byType:{ROCKY:1},byArchitecture:{SINGLE:1},byTopology:{CIRCUMSTELLAR:1},byNiche:{SOLID_BASE:1},
 byStratum:{'SINGLE/A/ROCKY':1},byCompactHostType:{},
 byMoonWaterRegime:{},byMoonGeologyRegime:{},byMoonOceanCT0:{},byMoonHostFamily:{},
 oceanGate:{withinHZ:0,solidIcyFormation:0,simultaneouslyAdmissible:0},errors:[]};
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pre33-11-'));
 try{
  const a=aggregate([g],[],dir,'SEED_FIXTURE');const body=fs.readFileSync(path.join(dir,'pre33-11-auditoria.json'),'utf8');
  const b=aggregate([g],[],dir,'SEED_FIXTURE');
  assert.equal(body,fs.readFileSync(path.join(dir,'pre33-11-auditoria.json'),'utf8'));
  assert.equal(a.verdict,'PRE33_11_V3_DIVERSITY_AUDITED');
  assert.ok(a.missingStrata.includes('NO_SAMPLED_OCEAN'));
  assert.equal(a.ratios.gasGiantAmongStandardPlanets,0);
  assert.equal(b.totals.errors,0);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('TRIPLE V3 real B/C: fuentes aisladas y ordinarios íntegros',()=>{
 const tripleGalaxy=GalaxyGenerator.generate(key,1n);
 const sector=GalaxySectorContentGenerator.generate(tripleGalaxy,new GalaxySectorCoordinates(14,6));
 const loc=sector.systemLocators.find(x=>x.galacticObjectIndex===1n);assert.ok(loc);
 const triple=StellarMultihostFormation.generateOrNull(key,loc);
 assert.equal(triple?.multiplicity.name,'TRIPLE');
 const before=triple.publicPlanets.map(w=>[w.host,w.planet.name,w.planet.seed.normalizedValue,w.moonSystem.moonCount]);
 for(const w of triple.publicPlanets){
  const r=Coverage.standard(w.planet,w.moonSystem,'TRIPLE',w.host);
  assert.deepEqual(r.issues,[]);assert.equal(r.biology,'NOT_EVALUATED');
 }
 assert.deepEqual(triple.publicPlanets.map(w=>[w.host,w.planet.name,w.planet.seed.normalizedValue,w.moonSystem.moonCount]),before);
});
test('el informe no muta una población real V3 ni introduce RNG o identidades',()=>{
 const p=single.planets[4],moonSystem=single.moonSystems[4];
 const before=JSON.stringify({type:p.planetType,moonSeeds:moonSystem.moonIdentities.map(x=>x.seed.normalizedValue),count:moonSystem.moonCount});
 const one=Coverage.standard(p,moonSystem,'SINGLE','A');const two=Coverage.standard(p,moonSystem,'SINGLE','A');
 assert.deepEqual(one,two);assert.ok(Object.isFrozen(one));assert.ok(Object.isFrozen(one.issues));
 assert.equal(JSON.stringify({type:p.planetType,moonSeeds:moonSystem.moonIdentities.map(x=>x.seed.normalizedValue),count:moonSystem.moonCount}),before);
});
