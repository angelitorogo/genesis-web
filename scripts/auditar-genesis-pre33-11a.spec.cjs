'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const ts=require('typescript');
if(!require.extensions['.ts'])require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {GalacticEnvironmentDistributionPRE3311a:Coverage}=require('../src/app/simulation/planetary/galactic-environment-distribution-pre33-11a.ts');
const sector=Object.freeze({sectorKey:'test-sector'});
const fn=()=>Coverage.minorMoon(7,10,sector);
test('minor moon identity-only remains known, physically uncharacterized and biologically not evaluated',()=>{
 const a=fn();assert.equal(a.bodyKind,'MOON_IDENTITY_ONLY');assert.equal(a.niche,'NOT_CHARACTERIZED');
 assert.equal(a.biosphere,'NOT_EVALUATED');assert.equal(a.observation,'PRIVATE_GENERATIVE_GROUND_TRUTH_NOT_DISCOVERY');
 assert.deepEqual(a.routes.map(x=>x.solvent),['H2O','NH3','CH4']);
 assert.equal(a.routes[0].phase,'IDENTITY_ONLY_NOT_CHARACTERIZED');
 assert.ok(a.routes.every(x=>x.reactantsAndKinetics==='UNRESOLVED'&&x.doseAndHistory==='UNRESOLVED'&&x.observed===false));
});
test('minor moon deterministic, immutable, never consumes a seed',()=>{
 assert.deepEqual(fn(),fn());assert.ok(Object.isFrozen(fn()));assert.ok(Object.isFrozen(fn().routes));
 assert.ok(Object.isFrozen(fn().routes[0]));
});
test('rejects invalid canonical minor identity',()=>{
 for(const ordinal of [0,-1,1.5,NaN,Infinity])assert.throws(()=>Coverage.minorMoon(7,ordinal,sector),RangeError);
 assert.throws(()=>Coverage.minorMoon(0,1,sector),RangeError);
});
const moon=(state,contact=null)=>({hostPlanetOrdinal:7,moonOrdinal:10,
 oceanReality32F2c:state===null?null:{hostPlanetOrdinal:7,moonOrdinal:10,state},
 geochemicalEnergy32F4:contact===null?null:{actualChemicalPowerWatts:contact}});
test('explicit CT0 liquid H2O stays modeled, not evidence of life or metabolism',()=>{
 const x=Coverage.moon(moon('PRESENT_IN_SIMULATED_MODEL'),sector);
 assert.equal(x.routes[0].phase,'CT0_LIQUID_IN_SIMULATED_MODEL');
 assert.equal(x.biosphere,'NOT_EVALUATED');assert.equal(x.routes[0].reactantsAndKinetics,'UNRESOLVED');
 assert.ok(x.routes.slice(1).every(x=>x.phase==='UNRESOLVED_PHASE_OR_INVENTORY'));
});
test('absence of CT0 lunar liquid is model-specific, not biological sterility',()=>{
 const x=Coverage.moon(moon('ABSENT_IN_SIMULATED_MODEL'),sector);
 assert.equal(x.routes[0].phase,'CT0_LIQUID_ABSENT_IN_SIMULATED_MODEL');
 assert.equal(x.biosphere,'NOT_EVALUATED');
});
test('unknown lunar model and alt solvents remain unknown, not absent',()=>{
 const x=Coverage.moon(moon(null),sector);assert.ok(x.routes.every(x=>x.phase==='UNRESOLVED_PHASE_OR_INVENTORY'));
});
test('rejects mismatch of modelled moon ocean identity',()=>{
 const m=moon('PRESENT_IN_SIMULATED_MODEL');m.oceanReality32F2c.moonOrdinal=9;
 assert.deepEqual(Coverage.moon(m,sector).issues,['MOON_OCEAN_IDENTITY_MISMATCH']);
});
test('rejects wrongly promoted chemical watts from 32F4',()=>{
 assert.deepEqual(Coverage.moon(moon('PRESENT_IN_SIMULATED_MODEL',1000),sector).issues,
 ['UNEXPECTED_CERTIFIED_CHEMICAL_POWER_IN_32F4']);
});
test('aggregate rejects incomplete provenance counts',()=>{
 const {summarize}=require('./auditar-genesis-pre33-11a.cjs');
 const g={galaxy:'Unit',systems:1,planets:1,planetModeledLiquidH2O:0,planetModeledAbsentH2O:0,planetUnknownH2O:1,
  detailedMoons:0,identityOnlyMoons:0,moons:1,moonModeledLiquidH2O:0,moonModeledAbsentH2O:0,
  moonUnknownH2O:0,unresolvedNH3:0,unresolvedCH4:0,issues:0,
  byRegion:{},byRegionEnvironment:{},byRegionFamily:{},byArchitecture:{},byPlanetFamily:{},minMetallicity:null,maxMetallicity:null,
  minRadius:null,maxRadius:null,radialMonotonicityIssues:0};
 const out=require('node:os').tmpdir()+'/genesis-pre33-11a-unit';
 const x=summarize([g],['"x"'],'seed',out);assert.equal(x.verdict,'PRE33_11A_BLOCKED');
});
test('actual V3 sector gradients feed exactly the frozen metallicity-to-formation chain',()=>{
 const {UniverseSeed}=require('../src/app/domain/universe/universe-seed.ts');
 const {UniverseGenerationKey}=require('../src/app/domain/generation/universe-generation-key.ts');
 const {GeneratorVersion}=require('../src/app/domain/generation/generator-version.ts');
 const {GalaxyGenerator}=require('../src/app/simulation/universe/galaxy-generator.ts');
 const {GalaxySectorGridGenerator}=require('../src/app/simulation/sector/galaxy-sector-grid-generator.ts');
 const {GalaxySectorContentGenerator}=require('../src/app/simulation/sector/galaxy-sector-content-generator.ts');
 const {GalaxySectorCoordinates}=require('../src/app/domain/sector/galaxy-sector-coordinates.ts');
 const key=new UniverseGenerationKey(UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),GeneratorVersion.V3);
 const galaxy=GalaxyGenerator.generate(key,0n),grid=GalaxySectorGridGenerator.generate(galaxy);
 const a=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(3,3));
 const far=Math.max(5,Math.floor(grid.halfExtentInSectors*.7));
 const b=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(far,0));
 const inner=Coverage.sector(galaxy,a),outer=Coverage.sector(galaxy,b);
 assert.ok(inner.normalizedRadius<outer.normalizedRadius);
 assert.ok(inner.sectorMetallicitySolarRatio>=outer.sectorMetallicitySolarRatio);
 assert.equal(inner.formationMetallicitySolarRatio,inner.sectorMetallicitySolarRatio);
 assert.equal(outer.formationMetallicitySolarRatio,outer.sectorMetallicitySolarRatio);
 assert.ok(inner.giantFormationPropensity>=outer.giantFormationPropensity);
 assert.deepEqual(Coverage.sector(galaxy,a),inner);
 assert.equal(inner.life,'NOT_EVALUATED');
 const badV2={generationKey:{generatorVersion:GeneratorVersion.V2}};
 assert.throws(()=>Coverage.sector(badV2,a),/PRE33_11A_REQUIRES_PUBLIC_V3/);
});
