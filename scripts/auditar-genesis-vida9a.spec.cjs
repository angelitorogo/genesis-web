'use strict';
/** Regresión autónoma sin dependencias de Angular: compila el módulo puro antes de cargarlo. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');
const out=fs.mkdtempSync(path.join(os.tmpdir(),'genesis-vida9a-'));
const project=path.resolve(__dirname,'..');
const entry=path.join(project,'src/app/presentation/scientific/vida9a-physical-biology-coherence.ts');
// TypeScript local del proyecto: API directa, sin invocar tsc ni mezclar
// archivos de la línea de comandos con tsconfig.json (TS5112, TS 6).
// Este módulo de auditoría es puro y se compila de forma aislada sin Angular.
const ts = require(require.resolve('typescript', { paths: [project] }));
const program = ts.createProgram({
  rootNames: [entry],
  options: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
    strict: true,
    skipLibCheck: true,
    types: [], // No arrastrar tipos globales de Vitest/Angular: módulo puro.
    noEmitOnError: true,
    rootDir: path.dirname(entry),
    outDir: out,
  },
});
const emitted = program.emit();
const diagnostics = [...ts.getPreEmitDiagnostics(program), ...emitted.diagnostics];
if (diagnostics.length || emitted.emitSkipped) {
  const formatHost = {
    getCanonicalFileName: file => file,
    getCurrentDirectory: () => project,
    getNewLine: () => '\n',
  };
  throw new Error('VIDA.9a: compilación TypeScript fallida:\n' +
    ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost));
}
const {Vida9aPhysicalBiologyCoherence}=require(path.join(out,'vida9a-physical-biology-coherence.js'));
const empty={nativeLife:false,nativeIntelligence:false,nativeCivilization:false,introducedLife:false,
  colonialPopulation:false,speciesIds:[],relationCount:0,intelligenceSpeciesId:null,
  civilizationFounderSpeciesId:null,colonyCount:0};
const good={...empty,nativeLife:true,nativeIntelligence:true,nativeCivilization:true,
  speciesIds:['founder'],intelligenceSpeciesId:'founder',civilizationFounderSpeciesId:'founder'};
const planet=(b=good)=>({kind:'PLANET',baseline:{temperatureKelvin:300.3,pressurePascal:225787},
  effective:{temperatureKelvin:289.22,pressurePascal:151907.46},
  feedback:{status:'APPLIED',climateDeltaKelvin:-11.08,sourcePressurePascal:225787,
    pressurePascal:151907.46,oxygenFraction01:.229,oxygenPartialPressurePascal:34785,
    nativeCivilizationAtmosphereReady:true},surface:{hasDefinedSolidSurface:true,hasPersistentLiquidWater:true,coverage01:.196},
  surfaceDiverseEcosystem:true,
  geochemistry:{niche:'SOLID_SURFACE',solventState:'UNRESOLVED',liquidWaterKilograms:0,
    hasPositiveResolvedPower:false},biology:b});
test('Hiorus B-6: PRE-VIDA5 vs VIDA5 es una transición trazable',()=>{
  const original=planet();const before=JSON.stringify(original);
  const result=Vida9aPhysicalBiologyCoherence.planet(original);
  assert.equal(result.status,'COHERENT');
  assert(result.findings.some(x=>x.id==='BIOGENIC_TEMPERATURE_STAGE'));
  assert(result.findings.some(x=>x.id==='BIOGENIC_PRESSURE_STAGE'));
  assert(result.findings.some(x=>x.id==='GEOCHEMISTRY_NICHE_SCOPE'));
  assert.equal(before,JSON.stringify(original));
});
test('ruptura real de delta y jerarquía biológica detectada',()=>{
  const broken=planet({...good,nativeIntelligence:false});
  broken.effective.temperatureKelvin=299;
  const result=Vida9aPhysicalBiologyCoherence.planet(broken);
  assert.equal(result.status,'REVIEW_REQUIRED');
  assert(result.findings.some(x=>x.id==='CLIMATE_DELTA_MISMATCH'));
  assert(result.findings.some(x=>x.id==='CIVILIZATION_WITHOUT_INTELLIGENCE'));
});
test('Aaekar: océano físico sin vida sigue siendo coherente',()=>{
  const result=Vida9aPhysicalBiologyCoherence.moon({kind:'MOON',
    oceanState:'PRESENT_IN_SIMULATED_MODEL',geochemistry:null,biology:empty});
  assert.equal(result.status,'COHERENT');
  assert(result.findings.some(x=>x.id==='OCEAN_WITHOUT_LIFE'));
});
test('una luna colonial no adquiere vida nativa',()=>{
  const result=Vida9aPhysicalBiologyCoherence.moon({kind:'MOON',oceanState:null,
    geochemistry:null,biology:{...empty,introducedLife:true,colonialPopulation:true,colonyCount:1}});
  assert.equal(result.status,'COHERENT');
  assert.equal(result.findings.some(x=>x.id==='BIOLOGY_WITHOUT_NATIVE_LIFE'),false);
});

test('referencias ecológicas huérfanas siguen siendo un error real',()=>{
  const result=Vida9aPhysicalBiologyCoherence.moon({kind:'MOON',oceanState:null,
    geochemistry:null,biology:{...empty,relationCount:0,
      relationEndpoints:[{sourceSpeciesId:'legacy:1',targetSpeciesId:'legacy:2'}]}});
  assert.equal(result.status,'REVIEW_REQUIRED');
  assert(result.findings.some(x=>x.id==='DANGLING_ECOLOGICAL_RELATION'));
});
