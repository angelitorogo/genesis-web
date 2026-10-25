#!/usr/bin/env node
'use strict';
// PRE-33.10b: exercise the real V3 physical input and read-only fiche projection.
// The UI is tested separately with Angular/Vitest in the user's full project.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{
  fileName:filename,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,filename);
const load=p=>require('../src/app/'+p+'.ts');
const {UniverseGenerationKey}=load('domain/generation/universe-generation-key');
const {GeneratorVersion}=load('domain/generation/generator-version');
const {UniverseSeed}=load('domain/universe/universe-seed');
const {GalaxyGenerator}=load('simulation/universe/galaxy-generator');
const {GalaxySectorContentGenerator}=load('simulation/sector/galaxy-sector-content-generator');
const {GalaxySectorCoordinates}=load('domain/sector/galaxy-sector-coordinates');
const {StellarMultihostFormation}=load('simulation/stellar/stellar-multihost-formation');
const {AtmosphereGenerator}=load('simulation/planetary/atmosphere-generator');
const {PlanetScientificTargetResolver}=load('simulation/planetary/planet-scientific-target-resolver');
const {PlanetScientificSectionsAssembler}=load('presentation/planet-detail/planet-scientific-sections');
const {MinorMoonOnDemandPRE3310}=load('simulation/planetary/minor-moon-on-demand-pre33-10');
const key=new UniverseGenerationKey(UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),GeneratorVersion.V3);
const galaxy=GalaxyGenerator.generate(key,0n);
const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(23,24));
const locator=sector.systemLocators.find(x=>x.galacticObjectIndex===0n);
assert.ok(locator,'fixture locator');
const single=StellarMultihostFormation.generateSingleOrNull(key,locator);
assert.ok(single,'fixture single V3');
const i=single.moonSystems.findIndex(moon=>moon.unmaterializedMinorMoonCount>0);
assert.ok(i>=0,'fixture planet with identity-only moons');
const planet=single.planets[i];
const moonSystem=single.moonSystems[i];
const atmosphere=AtmosphereGenerator.generate(planet.generationKey,planet);
const identity={locator:planet.locator,designation:planet.designation.name,
  planetOrdinal:i+1,hostSystemDesignation:'fixture',orbitTopology:single.orbitTopology,
  hostPlanetCount:single.planets.length};
const target=PlanetScientificTargetResolver.projectGenerated(
  identity,planet,atmosphere,moonSystem,undefined,undefined,3);
const sections=PlanetScientificSectionsAssembler.build(target);

test('V3 lista en una única ficha todas las identidades canónicas, sin duplicar ni omitir menores',()=>{
 assert.equal(sections.allMoons.length,moonSystem.moonCount);
 assert.equal(sections.relevantMoons.length,moonSystem.relevantMoonCount);
 assert.equal(sections.allMoons.filter(m=>m.kind==='IDENTITY_ONLY').length,moonSystem.unmaterializedMinorMoonCount);
 assert.deepEqual(sections.allMoons.map(m=>m.moonIndex),Array.from({length:moonSystem.moonCount},(_,i)=>i));
 for(const [n,moon] of sections.allMoons.entries()){
  assert.equal(moon.designation,moonSystem.moonIdentities[n].designation.name);
  assert.equal(moon.ordinalLabel,`Luna ${n+1}`);
 }
});
test('Ninguna identidad diferida trae un modelo físico o una evidencia inventada',()=>{
 MinorMoonOnDemandPRE3310.release();
 for(const moon of sections.allMoons.filter(m=>m.kind==='IDENTITY_ONLY')){
  assert.deepEqual(moon.fields,[]);
  assert.deepEqual(moon.badges,[]);
  assert.ok(Object.isFrozen(moon));
 }
 assert.equal(MinorMoonOnDemandPRE3310.cachedCount,0,'la lista no materializa escenarios de forma anticipada');
 assert.ok(Object.isFrozen(sections.allMoons));
 assert.doesNotMatch(JSON.stringify(sections.allMoons),/identitySeed|moonSeed|lifeProbability/);
});
