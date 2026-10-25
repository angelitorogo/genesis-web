#!/usr/bin/env node
'use strict';
const fs=require('node:fs'), path=require('node:path');
const {makeCandidates,identity}=require('./pre33/pre33-audit-core.cjs');
const {parse}=require('./auditar-genesis-pre33-03a2a.cjs');
function registerTS(){const ts=require('typescript'); if(!require.extensions['.ts'])require.extensions['.ts']=(mod,file)=>{
 const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{
 module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true,
 useDefineForClassFields:false}}).outputText;mod._compile(js,file);};}
function src(p){return require(path.resolve('src/app',p));}
function main(){
 const o=parse(process.argv.slice(2));registerTS();
 const {UniverseSeed}=src('domain/universe/universe-seed.ts');
 const {UniverseGenerationKey}=src('domain/generation/universe-generation-key.ts');
 const {GeneratorVersion}=src('domain/generation/generator-version.ts');
 const {GalaxyGenerator}=src('simulation/universe/galaxy-generator.ts');
 const {GalaxySectorGridGenerator}=src('simulation/sector/galaxy-sector-grid-generator.ts');
 const {GalaxySectorContentGenerator}=src('simulation/sector/galaxy-sector-content-generator.ts');
 const {GalaxySectorCoordinates}=src('domain/sector/galaxy-sector-coordinates.ts');
 const {StellarMultihostFreshCandidatePRE3303A2B3A:Fresh}=src('simulation/stellar/stellar-multihost-fresh-candidate-pre33-03a2b3a.ts');
 const {MULTIHOST_FRESH_COEVAL_CANDIDATE_PRE3303A2B3A:CONTRACT}=src('domain/stellar/stellar-multihost-fresh-candidate-pre33-03a2b3a.ts');
 const key=new UniverseGenerationKey(UniverseSeed.parse(o.seed),GeneratorVersion.V2),galaxies=[];
 for(const index of o.galaxies){
  const galaxy=GalaxyGenerator.generate(key,BigInt(index)),grid=GalaxySectorGridGenerator.generate(galaxy);
  const candidates=makeCandidates(o.seed,index,grid.halfExtentInSectors,Math.max(1500,o.systems*100));
  const s={galaxyIndex:index,galaxy:galaxy.designation.name,systems:0,multipleSystems:0,
   singleSystems:0,componentsRegenerated:0,phaseChangedSystems:0,planetReferencesRebuilt:0,
   originalPlanets:0,freshPlanets:0,legacyPlanetsAbsentAtRevisedCT0:0,
   atmospheresRebuilt:0,moonSystemsRebuilt:0,
   materialMassValidated:0,moonCountValidated:0,coevalSources:0,
   history29_31Blockers:0,history32Blockers:0,publicReleaseBlocked:0,
   errors:[],examples:[]};
  for(const pos of candidates){
   if(s.systems>=o.systems)break;
   const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(pos.x,pos.y));
   if(!sector.systemLocators.length)continue;
   const hash=identity([String(index),pos.x,pos.y,'SYSTEM_INDEX']);
   const loc=sector.systemLocators[parseInt(hash.slice(0,8),16)%sector.systemLocators.length];
   try{
    const candidate=Fresh.materializeOrNull(key,loc,CONTRACT);
    s.systems++;
    if(!candidate){s.singleSystems++;continue;}
    const m=candidate.manifest;
    s.multipleSystems++;
    if(m.newlyGeneratedGameIsPublic||m.persistable||m.savedUniverseMutated||m.ct0WaterCertified||
       m.privateObjectReferenceReuse||m.sourceGeneratorVersion!=='V2'||
       m.revisedAgesBillionYears.some(a=>a!==m.primaryFormationAgeBillionYears)||
       m.planetaryMaterialMassValidated!==m.regeneratedPlanetCount||
       m.moonPopulationValidated!==m.regeneratedPlanetCount||
       m.regeneratedAtmospheres!==m.regeneratedPlanetCount||
       m.regeneratedMoonSystems!==m.regeneratedPlanetCount||
       m.readiness!=='FRESH_PHYSICS_STAGED_CANONICAL_RELEASE_BLOCKED')
       throw Error('FRESH_GENERATION_PHYSICAL_INVARIANT_FAILED');
    const blocked=m.dependencies.filter(d=>d.status==='NOT_REGENERATED_RELEASE_BLOCKER').map(d=>d.dependency);
    if(!blocked.includes('REMNANT_TRANSIENT_HISTORY_29_31')||
       !blocked.includes('INTERVAL_RECONSTRUCTION_32_7_32_12')||
       !blocked.includes('PUBLIC_VERSION_AND_PERSISTENCE')||
       !blocked.includes('STELLAR_EVOLVED_CURRENT_PROPERTIES_15')||
       !blocked.includes('ORBITAL_HISTORY_MASS_LOSS_16'))
       throw Error('CANONICAL_GAME_RELEASE_GUARDS_MISSING');
    s.publicReleaseBlocked++;
    s.history29_31Blockers++;s.history32Blockers++;
    s.originalPlanets+=m.originalPlanetCount;s.freshPlanets+=m.regeneratedPlanetCount;
    // Counts may differ legitimately because the new branch respects 17.7
    // formation completion at the revised shared CT-0 (never copy V2 quotas).
    s.legacyPlanetsAbsentAtRevisedCT0+=Math.max(0,
      m.originalPlanetCount - m.regeneratedPlanetCount);
    s.atmospheresRebuilt+=m.regeneratedAtmospheres;
    s.moonSystemsRebuilt+=m.regeneratedMoonSystems;
    s.planetReferencesRebuilt+=m.regeneratedPlanetCount;
    s.materialMassValidated+=m.planetaryMaterialMassValidated;
    s.moonCountValidated+=m.moonPopulationValidated;
    s.componentsRegenerated+=m.revisedAgesBillionYears.length;
    s.phaseChangedSystems+=Number(m.stellarPhasesChanged.length>0);
    s.coevalSources++;
    if(s.examples.length<8)s.examples.push({system:m.parentSystemKey,components:m.revisedAgesBillionYears.length,
     originalAgesGyr:m.originalAgesBillionYears,revisedAgesGyr:m.revisedAgesBillionYears,
     originalPlanets:m.originalPlanetCount,regeneratedPlanets:m.regeneratedPlanetCount,
     originalDigest:m.oldSnapshotDigest.slice(0,16),newDigest:m.candidateSnapshotDigest.slice(0,16),
     stellarPhasesChanged:m.stellarPhasesChanged,releaseBlocked:true});
   }catch(e){s.errors.push({sector:`${pos.x},${pos.y}`,error:String(e.stack||e)});}
  }
  if(s.systems!==o.systems||s.multipleSystems+s.singleSystems!==s.systems||
     s.coevalSources!==s.multipleSystems||s.publicReleaseBlocked!==s.multipleSystems||
     s.history32Blockers!==s.multipleSystems||s.history29_31Blockers!==s.multipleSystems||
     s.materialMassValidated!==s.freshPlanets||s.moonCountValidated!==s.freshPlanets)
    s.errors.push({issue:'INCOMPLETE_FRESH_GRAPH_COVERAGE'});
  console.log(`PRE33.03a.2b.3a ${s.galaxy}: ${s.systems} systems, ${s.multipleSystems} multihost, ${s.freshPlanets} fresh planets, ${s.errors.length} errors`);
  galaxies.push(s);
 }
 const bad=galaxies.some(g=>g.errors.length);
 const verdict=bad?'FRESH_COEVAL_PHYSICAL_STAGING_FAILED':
  'FRESH_COEVAL_14_TO_21_PASSED_PUBLIC_29_31_32_BLOCKED';
 const result={contract:'PRE-33.03a.2b.3a/fresh-coeval-14-to-21/v2',seed:o.seed,
  generator:'V2 frozen reference; private coeval NEW-GAME candidate is NOT public V3',
  interpretation:'A/B/C share the actual same formation clock before rebuilding phase 18/19/20/21 in a version-isolated graph. Stage 17.7 prevents mature planets from appearing before formation completion at the revised CT0; differences from V2 counts are allowed. No new public V3 routing or persistence; time-dependent evolved spectra/mass loss, phase29 transients/exposures and complete historical 32 coverage remain explicit BLOCKERS.',
  galaxies,publicGeneratorV3Released:false,legacyDataMutated:false,canonicalNewGameAvailable:false,
  verdict};
 fs.mkdirSync(o.out,{recursive:true});
 const json=path.join(o.out,'pre33-03a2b3a-fresh-coeval.json');
 const md=path.join(o.out,'pre33-03a2b3a-informe.md');
 fs.writeFileSync(json,JSON.stringify(result,null,2)+'\n');
 fs.writeFileSync(md,[
  '# PRE-33.03a.2b.3a — Materialización de candidatos físicos coetáneos', '',
  `Semilla: ${o.seed} · ${verdict}`, '',
  '| Galaxia | Sistemas | Múltiples | Componentes | Planetas anteriores | Planetas recién generados | Atmósferas | Sistemas lunares | Errores |',
  '|---|---:|---:|---:|---:|---:|---:|---:|---:|',
  ...galaxies.map(g=>`| ${g.galaxy} | ${g.systems} | ${g.multipleSystems} | ${g.componentsRegenerated} | ${g.originalPlanets} | ${g.freshPlanets} | ${g.atmospheresRebuilt} | ${g.moonSystemsRebuilt} | ${g.errors.length} |`),
  '', 'Se establece edad A/B/C coetánea ANTES de regenerar las dependencias; las arquitecturas 17.7 que aún no han completado su formación en CT-0 NO se materializan como planetas maduros. Por eso el número de planetas candidatos puede diferir legítimamente del legado V2. Se comprueban conservación 19.5 e identidades sin reutilización de objetos antiguos.',
  '', '**No se libera V3 ni se habilita una partida nueva con esta física todavía**. Faltan luminosidad/masa evolucionada corriente, evolución orbital histórica, remanentes y transitorios (29/31), cronología 32.7/32.12 y nueva identidad pública/persistencia. Emplear un V2 con diferentes edades pero el mismo nombre de versión sería una mutación oculta, y se prohíbe.',
  '', 'Los escenarios condicionales de H2O no equivalen a inventarios CT-0 certificados. Sin cambios en IndexedDB, V1/V2 o conocimiento del jugador. No borres la base de datos.'
 ].join('\n')+'\n');
 console.log(`PRE33.03a.2b.3a ${verdict}; ${json}; ${md}`);
 if(o.strict&&bad)process.exitCode=1;
}
if(require.main===module) main();
module.exports={parse};
