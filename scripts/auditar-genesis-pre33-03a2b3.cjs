#!/usr/bin/env node
'use strict';
/** PRE-33.03a.2b.3. NO writes to V2, 32.12, IndexedDB or player knowledge. */
const fs=require('node:fs'), path=require('node:path');
const {makeCandidates,identity}=require('./pre33/pre33-audit-core.cjs');
const {parse}=require('./auditar-genesis-pre33-03a2a.cjs');
function registerTS(){ const ts=require('typescript');if(!require.extensions['.ts'])require.extensions['.ts']=(mod,file)=>{
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
 const {StellarMultihostActivationPlannerPRE3303A2B3:Planner,
  StellarMultihostActivationSessionPRE3303A2B3:Session,
  frozenMultihostDigestPRE3303A2B3:digest}=src('simulation/stellar/stellar-multihost-activation-pre33-03a2b3.ts');
 const {MULTIHOST_LEGACY_BRANCH_PRE3303A2B3:LEGACY,
  MULTIHOST_REVIEW_BRANCH_PRE3303A2B3:PREVIEW}=src('domain/stellar/stellar-multihost-activation-pre33-03a2b3.ts');
 const key=new UniverseGenerationKey(UniverseSeed.parse(o.seed),GeneratorVersion.V2),galaxies=[];
 for(const index of o.galaxies){
  const galaxy=GalaxyGenerator.generate(key,BigInt(index)),grid=GalaxySectorGridGenerator.generate(galaxy);
  const candidates=makeCandidates(o.seed,index,grid.halfExtentInSectors,Math.max(1500,o.systems*100));
  const s={galaxyIndex:index,galaxy:galaxy.designation.name,systems:0,multipleSystems:0,
   planets:0,components:0,reviewableStellarSources:0,dependenciesNotRebuilt:0,
   inspectedLegacyAtmospheres:0,inspectedLegacyMoonSystems:0,
   separatePreviewActivations:0,previewRollbackPassed:0,canonicalMigrationBlocked:0,
   originalDigestUnchanged:0,materialMassBalancesVerified:0,moonPopulationCountsVerified:0,
   remnantSourceGateVerified:0,phase32GateVerified:0,
   v2DefaultUnchanged:0,scientificCt0Certified:0,errors:[],examples:[]};
  for(const pos of candidates){
   if(s.systems>=o.systems)break;
   const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(pos.x,pos.y));
   if(!sector.systemLocators.length)continue;
   const hash=identity([String(index),pos.x,pos.y,'SYSTEM_INDEX']);
   const loc=sector.systemLocators[parseInt(hash.slice(0,8),16)%sector.systemLocators.length];
   try{
    const mult=StellarMultihostFormation.generateOrNull(key,loc);s.systems++;
    if(!mult)continue;s.multipleSystems++;
    const before=digest(mult),plan=Planner.plan(mult),again=Planner.plan(mult);
    if(plan.originalSnapshotDigest!==before || JSON.stringify(plan)!==JSON.stringify(again) ||
       plan.revision.gameCutoverActivated || !plan.legacyGeneratorUntouched ||
       !plan.savedPlayerKnowledgeUntouched || plan.certifiedCT0Oceans)
      throw Error('PLAN_CHANGED_LEGACY_OR_NONDETERMINISTIC');
    if(plan.legacyBodyKeys.length!==mult.publicPlanets.length ||
       plan.originalAtmosphereCount!==mult.publicPlanets.length ||
       plan.originalMoonSystemCount!==mult.publicPlanets.length)
      throw Error('DEPENDENCY_CATALOG_INCOMPLETE');
    for(const e of mult.publicPlanets){
      const c=e.planet.internalComposition;
      const total=c.metallicCoreMassEarth+c.silicateInteriorMassEarth+
        c.condensedIceMassEarth+c.volatileRichInteriorMassEarth+c.gaseousEnvelopeMassEarth;
      const target=e.planet.physicalProperties.massEarth;
      if(!Number.isFinite(total)||!Number.isFinite(target)||target<=0||
         Math.abs(total-target)>Math.max(1e-9, target*1e-7))
        throw Error('LEGACY_PLANET_19_5_MASS_BUDGET_MISMATCH');
      s.materialMassBalancesVerified++;
      if(e.moonSystem.populationProfile.moonCount!==e.moonSystem.moonIdentities.length)
        throw Error('LEGACY_MOON_POPULATION_IDENTITY_MISMATCH');
      s.moonPopulationCountsVerified++;
    }
    s.planets+=mult.publicPlanets.length;s.components+=mult.components.length;
    s.inspectedLegacyAtmospheres+=plan.originalAtmosphereCount;
    s.inspectedLegacyMoonSystems+=plan.originalMoonSystemCount;
    s.dependenciesNotRebuilt+=plan.dependencies.filter(d=>d.status==='NOT_REBUILT_FOR_NEW_BRANCH').length;
    const remnant=plan.dependencies.find(d=>d.dependency==='REMNANTS_29_31');
    const history=plan.dependencies.find(d=>d.dependency==='HISTORICAL_EVENTS_32_12');
    if(remnant?.status!=='NOT_REBUILT_FOR_NEW_BRANCH'||
       history?.status!=='NOT_REBUILT_FOR_NEW_BRANCH')throw Error('PHYSICS_GATES_BYPASSED');
    s.remnantSourceGateVerified++;s.phase32GateVerified++;
    const session=new Session();
    if(session.resolve(mult).branch!==LEGACY)throw Error('V2_DEFAULT_CHANGED');
    s.v2DefaultUnchanged++;
    if(plan.status==='SCIENTIFIC_PREVIEW_AVAILABLE'){
      const science=session.activateScientificPreview(mult,plan,PREVIEW);
      if(science.planetSnapshots!=='UNAVAILABLE_IN_PREVIEW'||
         science.phase32History!=='UNAVAILABLE_IN_PREVIEW'||
         science.revisedStellarComponents?.length!==mult.components.length||
         science.persistentWrite||science.ct0OceansCertified)
         throw Error('SCIENTIFIC_PREVIEW_LEAKED_OLD_DEPENDENCIES');
      s.reviewableStellarSources++;s.separatePreviewActivations++;
      const restored=session.deactivate(mult);
      if(restored.branch!==LEGACY)throw Error('LEGACY_ROLLBACK_FAILED');
      s.previewRollbackPassed++;
    }
    try {session.commitCanonicalMigration(mult,plan);throw Error('ILLEGAL_CANONICAL_COMMIT');}
    catch(e){if(String(e.message).includes('CANONICAL_ATOMIC_MIGRATION_NOT_RELEASED'))
      s.canonicalMigrationBlocked++;else throw e;}
    if(digest(mult)!==before)throw Error('FROZEN_V2_MUTATED');
    s.originalDigestUnchanged++;
    if(s.examples.length<8)s.examples.push({system:plan.systemKey,components:plan.revisedStellarComponentCount,
      legacyPlanets:plan.originalPlanetCount,legacyDigest:before.slice(0,16),
      preview:plan.status,lockedDependencies:plan.dependencies.filter(d=>d.status!=='RECOMPUTED_PREVIEW')
        .map(d=>d.dependency),canonicalCommitBlocked:true});
   }catch(e){s.errors.push({sector:`${pos.x},${pos.y}`,error:String(e.stack||e)});}
  }
  if(s.systems!==o.systems)s.errors.push({issue:'INCOMPLETE_SYSTEM_SAMPLE'});
  if(s.planets!==s.materialMassBalancesVerified||s.planets!==s.moonPopulationCountsVerified)
    s.errors.push({issue:'INCOMPLETE_PLANET_OR_MOON_PHYSICAL_AUDIT'});
  if(s.multipleSystems!==s.originalDigestUnchanged||s.multipleSystems!==s.canonicalMigrationBlocked||
     s.multipleSystems!==s.phase32GateVerified||s.multipleSystems!==s.remnantSourceGateVerified||
     s.multipleSystems!==s.previewRollbackPassed)s.errors.push({issue:'INCOMPLETE_BRANCH_GUARD_COVERAGE'});
  console.log(`PRE-33.03a.2b.3 ${s.galaxy}: ${s.systems} sistemas, ${s.multipleSystems} múltiples, ${s.planets} planetas, ${s.previewRollbackPassed} activaciones revertidas, ${s.errors.length} errores`);
  galaxies.push(s);
 }
 const fail=galaxies.some(s=>s.errors.length||s.scientificCt0Certified||
   s.multipleSystems!==s.canonicalMigrationBlocked);
 const verdict=fail?'VERSIONED_MULTIPLE_ACTIVATION_GATE_FAILED':
  'SCIENTIFIC_PREVIEW_ACTIVATION_PASSED_CANONICAL_CUTOVER_BLOCKED';
 const result={contract:'PRE-33.03a.2b.3/multihost-physical-branch-gate/v1',seed:o.seed,
  scope:'Readonly public-V2 sample; no IndexedDB, no 32.12 write, not a census.',
  interpretation:'Versioned COEVAL scientific STELLAR preview can be explicitly activated/deactivated in ephemeral sessions. All dependent remnant/orbit/planet/atmosphere/moon/32.x models remain tied to frozen V2; CANONICAL migration is intentionally rejected until their coordinated regeneration AND separate public generator release. No saved game, planet, atmosphere, moon, historical event or ocean has been migrated or certified.',
  galaxies,legacyGameCutover:false,canonicalMigrationImplemented:false,
  scientificPreviewOptInReversible:true,verdict};
 fs.mkdirSync(o.out,{recursive:true});
 const json=path.join(o.out,'pre33-03a2b3-activacion-versionada.json');
 const md=path.join(o.out,'pre33-03a2b3-informe.md');
 fs.writeFileSync(json,JSON.stringify(result,null,2)+'\n');
 fs.writeFileSync(md,[
  '# PRE-33.03a.2b.3 — Activación científica explícita con bloqueo de migración canónica',
  '',`Semilla: ${o.seed} · ${verdict}`,'',
  '| Galaxia | Sistemas | Múltiples | Planetas V2 | Previews estelares opt-in | Rollbacks OK | Migraciones canónicas bloqueadas | Errores |',
  '|---|---:|---:|---:|---:|---:|---:|---:|',
  ...galaxies.map(s=>`| ${s.galaxy} | ${s.systems} | ${s.multipleSystems} | ${s.planets} | ${s.separatePreviewActivations} | ${s.previewRollbackPassed} | ${s.canonicalMigrationBlocked} | ${s.errors.length} |`),
  '', '**Únicamente está activable la revisión ESTELAR en PREVIEW CIENTÍFICA**, con selección explícita y rollback en memoria. El sistema V2 por defecto queda sin cambios.',
  '', 'La reconstrucción integral de remanentes (29/31), órbitas (16), planetas (18/19), atmósferas (20), lunas (21) e historia (32.7/32.12) NO ESTÁ IMPLEMENTADA en la nueva versión. El guard impide explícitamente mezclar snapshots y rechaza el cutover canónico.',
  '', 'La persistencia de partidas y la migración pública NO están activadas. Esta entrega no declara física CT-0 ni océanos certificados.',
  '', 'Próximo requisito: generadores de dependencias atómicas bajo una nueva versión PUBLICA y pruebas de migración/rollback de datos antes de activar juego real.',
 ].join('\n')+'\n');
 console.log(verdict,json);
 if(fail&&o.strict)process.exitCode=1;
 return result;
}
if(require.main===module)main();
module.exports={main,parse};
