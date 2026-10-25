#!/usr/bin/env node
'use strict';
/** PRE33a2b2: audit explicit versioned scientific lineage; does NOT migrate V2. */
const fs=require('node:fs'),path=require('node:path');
const {makeCandidates,identity}=require('./pre33/pre33-audit-core.cjs');
const {parse}=require('./auditar-genesis-pre33-03a2a.cjs');
function registerTS(){const ts=require('typescript');if(!require.extensions['.ts'])require.extensions['.ts']=(mod,file)=>{
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
 const {StellarMultihostFormation}=src('simulation/stellar/stellar-multihost-formation.ts');
 const {StellarMultihostCoEvalRevisionPRE3303A2B2}=src('simulation/stellar/stellar-multihost-coeval-revision-pre33-03a2b2.ts');
 const {MULTIHOST_COEVAL_REVISION_PRE3303A2B2}=src('domain/stellar/stellar-multihost-coeval-revision-pre33-03a2b2.ts');
 const {PlanetH2OMultihostRevisedPRE3303A2B2}=src('simulation/planetary/planet-h2o-multihost-revised-pre33-03a2b2.ts');
 const {PlanetH2OFormationEnginePRE3303A}=src('simulation/planetary/planet-h2o-formation-engine-pre33-03a.ts');
 const {PlanetaryVolatilesHistoryResolver32_3}=src('simulation/planetary-history/planetary-volatiles-history-resolver-32-3.ts');
 const {validatePlanetH2OEvolutionPRE3303A1}=src('domain/planetary/planet-h2o-evolution-contract-pre33-03a1.ts');
 const key=new UniverseGenerationKey(UniverseSeed.parse(o.seed),GeneratorVersion.V2),galaxies=[];
 for(const index of o.galaxies){
  const galaxy=GalaxyGenerator.generate(key,BigInt(index)),grid=GalaxySectorGridGenerator.generate(galaxy);
  const candidates=makeCandidates(o.seed,index,grid.halfExtentInSectors,Math.max(1500,o.systems*100));
  const s={galaxyIndex:index,galaxy:galaxy.designation.name,systems:0,multipleSystems:0,
   planets:0,scientificRevisions:0,revisionComponents:0,revisedAgesCoEval:0,
   oldComponentAgeDisagreements:0,stellarPhaseChanged:0,requiringAtomicMigration:0,
   conditionalWaterHistories:0,unresolvedForcing:0,unresolvedVersionedChronology:0,
   massConserved:0,canonicalV2Modified:0,certifiedOceans:0,errors:[],examples:[]};
  for(const pos of candidates){
   if(s.systems>=o.systems)break;
   const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(pos.x,pos.y));
   if(!sector.systemLocators.length)continue;
   const digest=identity([String(index),pos.x,pos.y,'SYSTEM_INDEX']);
   const loc=sector.systemLocators[parseInt(digest.slice(0,8),16)%sector.systemLocators.length];
   try{
    const mult=StellarMultihostFormation.generateOrNull(key,loc);
    s.systems++;
    if(!mult)continue;
    s.multipleSystems++;
    const before=JSON.stringify({ages:mult.components.map(c=>c.lifetime.ageBillionYears),
      states:mult.components.map(c=>c.lifetime.evolutionAssessment.evolutionState.name),
      sources:mult.components.map(c=>c.internalGenerationKey.universeSeed.normalizedValue),
      planets:mult.publicPlanets.map(p=>[String(p.publicLocator.bodyIndex),p.host,p.planet.name])});
    const revision=StellarMultihostCoEvalRevisionPRE3303A2B2.fromFrozenSource(mult,MULTIHOST_COEVAL_REVISION_PRE3303A2B2);
    const repeat=StellarMultihostCoEvalRevisionPRE3303A2B2.fromFrozenSource(mult,MULTIHOST_COEVAL_REVISION_PRE3303A2B2);
    if(JSON.stringify(revision)!==JSON.stringify(repeat))throw Error('NONDETERMINISTIC_VERSIONED_SOURCE');
    if(!revision.coevalPhysicsRecomputed||revision.status!=='COEVAL_PHYSICAL_SOURCE_READY'||
      !revision.migrationRequiresAtomicRegeneration||revision.gameCutoverActivated||
      revision.planetRecordsCompatibleWithoutMigration||revision.ct0WaterCertified)throw Error('ILLEGAL_REVISION_ACTIVATION');
    s.scientificRevisions++;s.revisionComponents+=revision.components.length;
    s.stellarPhaseChanged+=revision.components.filter(c=>c.phaseChanged).length;
    if(revision.components.every(c=>c.revisedAgeBillionYears===revision.sharedFormationAgeBillionYears))
      s.revisedAgesCoEval++;
    else throw Error('NON_COEVAL_REVISED_CLOCK');
    if(revision.components.some(c=>c.frozenAgeBillionYears!==revision.sharedFormationAgeBillionYears))
      s.oldComponentAgeDisagreements++;
    for(const p of mult.publicPlanets){
     s.planets++;
     try{
      const formation=PlanetH2OFormationEnginePRE3303A.project(p.planet,p.atmosphere);
      const h32=PlanetaryVolatilesHistoryResolver32_3.resolve({atmosphere:p.atmosphere,
       time:{kind:'CURRENT_SNAPSHOT',systemAgeBillionYears:null}});
      const r=PlanetH2OMultihostRevisedPRE3303A2B2.project(mult,p,formation,h32);
      if(r.scientificSource.contractVersion!==revision.contractVersion||r.oceanCT0Certified||
         !r.noAutomaticSavedUniverseMigration||!r.copiedFrozenPlanetSnapshot)throw Error('UNSAFE_WATER_PROJECTION');
      if(r.status==='VERSIONED_COEVAL_HISTORY_CONDITIONAL'){
       s.conditionalWaterHistories++;
       if(!r.conditionalH2O?.evolution?.massBalance.conditionalConservationVerified||
          validatePlanetH2OEvolutionPRE3303A1(r.conditionalH2O.evolution).length)throw Error('WATER_NOT_CONSERVED');
       s.massConserved++;
      } else if(r.status==='REQUIRES_ATOMIC_PLANET_REGENERATION')s.requiringAtomicMigration++;
      else if(r.status==='REVISED_CHRONOLOGY_UNRESOLVED')s.unresolvedVersionedChronology++;
      else if(r.status==='NO_RESOLVED_FORCING_OR_SURFACE')s.unresolvedForcing++;
      else throw Error('UNKNOWN_VERSIONED_H2O_STATUS');
      if(s.examples.length<12)s.examples.push({body:p.planet.name,host:p.host,status:r.status,
       sharedAgeGyr:revision.sharedFormationAgeBillionYears,
       frozenAgesGyr:revision.components.map(c=>c.frozenAgeBillionYears),
       revisedAgesGyr:revision.components.map(c=>c.revisedAgeBillionYears),
       phaseChanged:revision.components.map(c=>c.phaseChanged),waterCT0Certified:false});
     }catch(e){s.errors.push({body:p.planet.name,error:String(e.stack||e)});}
    }
    const after=JSON.stringify({ages:mult.components.map(c=>c.lifetime.ageBillionYears),
      states:mult.components.map(c=>c.lifetime.evolutionAssessment.evolutionState.name),
      sources:mult.components.map(c=>c.internalGenerationKey.universeSeed.normalizedValue),
      planets:mult.publicPlanets.map(p=>[String(p.publicLocator.bodyIndex),p.host,p.planet.name])});
    if(before!==after){s.canonicalV2Modified++;throw Error('FROZEN_V2_MUTATED');}
   }catch(e){s.errors.push({sector:`${pos.x},${pos.y}`,error:String(e.stack||e)});}
  }
  if(s.systems!==o.systems)s.errors.push({issue:'INCOMPLETE_SAMPLE'});
  if(s.planets!==s.conditionalWaterHistories+s.requiringAtomicMigration+
       s.unresolvedForcing+s.unresolvedVersionedChronology)s.errors.push({issue:'INCOMPLETE_CLASSIFICATION'});
  console.log(`PRE-33.03a.2b.2 ${s.galaxy}: ${s.systems} sistemas, ${s.multipleSystems} múltiples, ${s.planets} planetas, ${s.conditionalWaterHistories} H₂O condicionales, ${s.errors.length} errores`);
  galaxies.push(s);
 }
 const failed=galaxies.some(g=>g.errors.length||g.canonicalV2Modified||g.certifiedOceans||
   g.scientificRevisions!==g.revisedAgesCoEval);
 const verdict=failed?'VERSIONED_COEVAL_SOURCE_FAILED':'VERSIONED_COEVAL_SCIENTIFIC_SOURCE_PASSED_LEGACY_UNCHANGED';
 const report={contract:'PRE-33.03a.2b.2/coeval-scientific-physical-revision/v1',seed:o.seed,generator:'V2',
  interpretation:'Opt-in versioned PHYSICAL stellar chronology built from primary age plus independent component initial mass/metallicity. All components are reevaluated with 14.8 and revised lifetime records; old V2 records, private seeds and Phase32 are NOT migrated. Frozen planetary snapshots only provide conditional H2O reference on phase-compatible branches. Atomic regeneration/versioned public migration is required before canonical CT0 certification.',
  galaxies,legacyGameCutover:false,atomicMigrationRequired:true,verdict};
 fs.mkdirSync(o.out,{recursive:true});
 const json=path.join(o.out,'pre33-03a2b2-cronologia-versionada.json');
 const md=path.join(o.out,'pre33-03a2b2-informe.md');
 fs.writeFileSync(json,JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync(md,[
  '# PRE-33.03a.2b.2 — Fuente física coetánea versionada (sin cutover)',
  '',`Semilla: ${o.seed} · ${verdict}`,'',
  '| Galaxia | Sistemas | Múltiples | Planetas | Fuente nueva coetánea | H₂O condicional | Cambio de fase: migración necesaria | Otros pendientes | Errores |',
  '|---|---:|---:|---:|---:|---:|---:|---:|---:|',
  ...galaxies.map(g=>`| ${g.galaxy} | ${g.systems} | ${g.multipleSystems} | ${g.planets} | ${g.scientificRevisions} | ${g.conditionalWaterHistories} | ${g.requiringAtomicMigration} | ${g.unresolvedForcing+g.unresolvedVersionedChronology} | ${g.errors.length} |`),
  '', 'La fuente científica revisada utiliza la edad de formación de A para TODAS las componentes; recalcula 14.8 y StellarLifetimeProfile sin copiar edades B/C. Masas iniciales, metalicidades e identificadores físicos privados se conservan.',
  '', 'NO es una actualización automática de GeneratorVersion.V2 ni una mutación del pasado. No puede insertarse un perfil revisado en los planetas, atmósferas, orbitas e historia 32 ya persistidos sin regeneración atómica y un cutover de versión público autorizado.',
  '', 'Las estimaciones de H₂O son CONDICIONALES: edad A como referencia de formación, XUV histórico parametrizado, órbitas sin evolución por pérdida de masa e inventario 19.5 retroproyectado. No se certifican océanos CT-0 ni vida.',
  '', 'Pendiente de versión pública/migración física con regresión integral. La revisión científica es explícita, optativa, de solo lectura y jamás se aplica por defecto al juego.'
 ].join('\n')+'\n');
 console.log(verdict,json);
 if(failed&&o.strict)process.exitCode=1;
 return report;
}
if(require.main===module)main();
module.exports={main,parse};
