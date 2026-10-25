'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {
  parseArgs,makeCandidates,expectedComparison,checkSnapshotCounts,
  different,fraction,asMarkdown,identity,
}=require('./pre33/pre33-audit-core.cjs');
const reference=require('./pre33/elixisis-v2-reference.json');
const SEED=reference.seed;

test('PRE-33.00 valida formato semilla V2 y flags',()=>{
  const opts=parseArgs([`--seed=${SEED.toLowerCase()}`,'--galaxies=0,2,2,5','--systems-per-galaxy=12','--strict']);
  assert.equal(opts.seed,SEED);assert.deepEqual(opts.galaxies,[0,2,5]);assert.equal(opts.systemsPerGalaxy,12);assert.equal(opts.strict,true);
  assert.throws(()=>parseArgs(['--seed=incorrecta']),/seed/);
  assert.throws(()=>parseArgs([`--seed=${SEED}`,'--galaxies=0,-1']),/galaxies/);
  assert.throws(()=>parseArgs([`--seed=${SEED}`,'--systems-per-galaxy=0']),/systems-per-galaxy/);
  assert.throws(()=>parseArgs([`--seed=${SEED}`,'--foo=5']),/Opción no reconocida/);
});
test('PRE-33.00 la selección es idéntica por seed, índice y tamaño de malla',()=>{
  const a=makeCandidates(SEED,0,71,320);
  assert.deepEqual(a,makeCandidates(SEED,0,71,320));
  assert.notDeepEqual(a,makeCandidates(SEED,1,71,320));
  assert.notDeepEqual(a,makeCandidates('0F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',0,71,320));
  assert.equal(new Set(a.map(x=>`${x.x},${x.y}`)).size,a.length);
  assert.ok(a.length>0 && a.length<=320);
  assert.ok(a.every(p=>Number.isInteger(p.x)&&Number.isInteger(p.y)&&Math.abs(p.x)<=71&&Math.abs(p.y)<=71));
});
test('PRE-33.00 referencia galáctica contrasta identidad y redondeos físicos',()=>{
  const fake={designation:{name:reference.name,proceduralCode:reference.proceduralCode},type:{name:reference.type},physicalProperties:{
    ageBillionYears:12.123294893716025,diameterLightYears:142970.6,totalMassSolarMasses:1.348e12,
    stellarPopulation:124428709493n,metallicitySolarRatio:.927,starFormationRateSolarMassesPerYear:5.7322
  }};
  assert.equal(expectedComparison(fake,reference).status,'MATCH');
  const bad={...fake,designation:{...fake.designation,name:'Otra'}};
  assert.equal(expectedComparison(bad,reference).status,'MISMATCH');
  assert.equal(expectedComparison(fake,null).status,'NOT_CONFIGURED');
});
test('PRE-33.00 totales persistidos requieren snapshot independiente, no se inventa censo',()=>{
  assert.equal(checkSnapshotCounts(reference,null).status,'REFERENCE_ONLY_NOT_READ_FROM_INDEXEDDB');
  const snapshot={galaxyIndex:0,universeSeed:SEED,generatorVersion:'V2',persistedKnowledge:{...reference.persistedKnowledge}};
  assert.equal(checkSnapshotCounts(reference,snapshot).status,'MATCH');
  assert.equal(checkSnapshotCounts(reference,{...snapshot,universeSeed:'OTRA'}).status,'IDENTITY_MISMATCH');
  assert.equal(checkSnapshotCounts(reference,{...snapshot,persistedKnowledge:{...snapshot.persistedKnowledge,moons:1}}).status,'MISMATCH');
});
test('PRE-33.00 física incierta se separa de errores estructurales',()=>{
  assert.equal(different(100000,110000),true);
  assert.equal(different(100000,100000.01),false);
  assert.equal(different(null,110000),false);
  assert.equal(fraction(null),true);
  assert.equal(fraction(0),true);assert.equal(fraction(1),true);assert.equal(fraction(1.1),false);
  assert.equal(fraction(-0.1),false);
});
test('PRE-33.00 informe reproducible y sin filtración de ground truth a IndexedDB',()=>{
  const mock={universeSeed:SEED,generatorVersion:'V2',contract:'PRE-33.00/v1',overallStatus:'STRUCTURAL_SAMPLE_PASSED_WITH_PHYSICAL_GAPS',blockers:[],
    persistedComparison:{status:'REFERENCE_ONLY_NOT_READ_FROM_INDEXEDDB'},galaxies:[{galaxyIndex:0,designation:{name:'Elixisis',proceduralCode:reference.proceduralCode},referenceCheck:{status:'MATCH'},issues:[],sample:{systems:1,planets:1,moons:2,relevantMoons:1,identityOnlyMoons:1,pressureColumnDifferences:0,moonPhysicalBalances:0,moonChemicalPowerResolved:0,moonSurfaceDoseResolved:0,moonSubsurfaceDoseResolved:0,moonOceanStates:{UNRESOLVED_IN_SIMULATED_MODEL:1}}}]};
  const text=asMarkdown(mock);
  assert.match(text,/no.*censo galáctico/i);
  assert.match(text,/no se han verificado frente a IndexedDB/i);
  assert.equal(identity(mock),identity(JSON.parse(JSON.stringify(mock))));
});
