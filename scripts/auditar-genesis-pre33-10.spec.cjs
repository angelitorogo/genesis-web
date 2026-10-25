'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const ts=require('typescript');require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),
 {fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const root='../src/app/';
const {GeneratorVersion}=require(root+'domain/generation/generator-version.ts');
const {UniverseGenerationKey}=require(root+'domain/generation/universe-generation-key.ts');
const {UniverseSeed}=require(root+'domain/universe/universe-seed.ts');
const {GalaxyGenerator}=require(root+'simulation/universe/galaxy-generator.ts');
const {GalaxySectorContentGenerator}=require(root+'simulation/sector/galaxy-sector-content-generator.ts');
const {GalaxySectorCoordinates}=require(root+'domain/sector/galaxy-sector-coordinates.ts');
const {StellarMultihostFormation}=require(root+'simulation/stellar/stellar-multihost-formation.ts');
const {MinorMoonOnDemandPRE3310:Minor}=require(root+'simulation/planetary/minor-moon-on-demand-pre33-10.ts');
const key=new UniverseGenerationKey(UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),GeneratorVersion.V3);
const galaxy=GalaxyGenerator.generate(key,0n);
const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(23,24));
const locator=sector.systemLocators.find(s=>s.galacticObjectIndex===0n);
assert.ok(locator);
const single=StellarMultihostFormation.generateSingleOrNull(key,locator);assert.ok(single);
const system=single.moonSystems.find(m=>m.unmaterializedMinorMoonCount>0);assert.ok(system);
const first=BigInt(system.relevantMoonCount);
test('canónica: no crea otro MoonSeed ni modifica las lunas relevantes',()=>{
 const known=system.moonIdentities.map(m=>m.seed.normalizedValue);
 const created=Minor.materialize(system,first);
 assert.equal(created.identitySeed,known[Number(first)]);
 assert.deepEqual(system.moonIdentities.map(m=>m.seed.normalizedValue),known);
 assert.equal(system.relevantMoons.length,system.relevantMoonCount);
});
test('escenario orbital y material positivo pero NO vida, atmósfera ni H2O observada',()=>{
 const r=Minor.materialize(system,first);
 assert.equal(r.life,'NOT_EVALUATED');assert.equal(r.physicalModelResolved,false);
 assert.equal(r.bulkComposition,'UNKNOWN');assert.equal(r.atmosphere,'UNKNOWN');
 assert.equal(r.water,'UNKNOWN');assert.equal(r.radiation,'UNKNOWN');
 if(r.status==='CONDITIONAL_BOUNDS'){
   assert.ok(r.scenarioMassEarth>0&&r.scenarioRadiusEarth>0&&r.scenarioOrbitalPeriodDays>0);
   assert.ok(r.scenarioSemiMajorAxisPlanetRadii>r.stableOrbitInnerPlanetRadii);
   assert.ok(r.scenarioSemiMajorAxisPlanetRadii<r.stableOrbitOuterPlanetRadii);
 }
});
test('semilla, host, ordinal y época estables después de descargar caché',()=>{
 const a=Minor.materialize(system,first,100000);
 Minor.release(); const b=Minor.materialize(system,first,100000);
 assert.deepEqual(a,b);assert.ok(Object.isFrozen(a));
});
test('rechaza acceso fuera del rango e impide retratar lunas relevantes como menores',()=>{
 assert.equal(Minor.materialize(system,-1n),null);
 assert.equal(Minor.materialize(system,BigInt(system.moonCount)),null);
 assert.equal(Minor.materialize(system,0n),null);
 assert.equal(Minor.materialize(system,first,-1),null);
});
test('LRU con cota de 96, sin modificar un resultado físico al expulsarlo',()=>{
 const baseline=Minor.materialize(system,first,9);Minor.release();
 for(let i=0;i<170;i++)Minor.materialize(system,first,i);
 assert.ok(Minor.cachedCount<=96);
 Minor.release(); assert.equal(Minor.cachedCount,0);
 assert.deepEqual(Minor.materialize(system,first,9),baseline);
});
