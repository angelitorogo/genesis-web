#!/usr/bin/env node
'use strict';
/** Release preflight on the REAL current GENESIS codebase; never calls IndexedDB. */
const fs=require('node:fs'),path=require('node:path');
const {makeCandidates,identity}=require('./pre33/pre33-audit-core.cjs');
const {parse}=require('./auditar-genesis-pre33-03a2a.cjs');
function registerTS(){const ts=require('typescript');if(!require.extensions['.ts'])require.extensions['.ts']=(mod,file)=>{
  const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{
    module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,useDefineForClassFields:false}}).outputText;
  mod._compile(js,file);};}
function source(p){return require(path.resolve('src/app',p));}
function publicRouteProof(){
 const read=p=>fs.readFileSync(path.resolve('src/app',p),'utf8');
 const version=read('domain/generation/generator-version.ts');
 const bootstrap=read('presentation/universe/universe-bootstrap.service.ts');
 const repository=read('data/local/repository/dexie-universe.repository.ts');
 const facade=read('presentation/universe/universe-seed.facade.ts');
 return {
  publicV3Defined:/\bV3\s*=\s*Object\.freeze/.test(version),
  fromCode3Accepted:/code\s*===\s*V3\.code/.test(version),
  bootstrapGuard:bootstrap.includes('GeneratorVersion.isReleasedForNewUniverses'),
  repositoryGuard:repository.includes('GeneratorVersion.isReleasedForNewUniverses'),
  seedSelectionGuard:facade.includes('GeneratorVersion.isReleasedForNewUniverses'),
 };
}
function main(argv=process.argv.slice(2)){
 const requirePublicV3=argv.includes('--require-public-v3');
 const opts=parse(argv.filter(arg=>arg!=='--require-public-v3'));registerTS();
 const {UniverseSeed}=source('domain/universe/universe-seed.ts');
 const {UniverseGenerationKey}=source('domain/generation/universe-generation-key.ts');
 const {GeneratorVersion}=source('domain/generation/generator-version.ts');
 const {GalaxyGenerator}=source('simulation/universe/galaxy-generator.ts');
 const {GalaxySectorGridGenerator}=source('simulation/sector/galaxy-sector-grid-generator.ts');
 const {GalaxySectorContentGenerator}=source('simulation/sector/galaxy-sector-content-generator.ts');
 const {GalaxySectorCoordinates}=source('domain/sector/galaxy-sector-coordinates.ts');
 const {StellarMultihostHistoricalBridgePRE3303A2B3B:Bridge}=
  source('simulation/stellar/stellar-multihost-historical-bridge-pre33-03a2b3b.ts');
 const {MULTIHOST_HISTORICAL_BRIDGE_PRE3303A2B3B:TOKEN}=
  source('domain/stellar/stellar-multihost-historical-bridge-pre33-03a2b3b.ts');
 const {StellarMultihostFormation:Legacy}=source('simulation/stellar/stellar-multihost-formation.ts');
 const {frozenMultihostDigestPRE3303A2B3:digest}=source('simulation/stellar/stellar-multihost-activation-pre33-03a2b3.ts');
 const key=new UniverseGenerationKey(UniverseSeed.parse(opts.seed),GeneratorVersion.V2);
 const route=publicRouteProof(),galaxies=[];
 for(const gi of opts.galaxies){
  const gal=GalaxyGenerator.generate(key,BigInt(gi));
  const grid=GalaxySectorGridGenerator.generate(gal);
  const candidates=makeCandidates(opts.seed,gi,grid.halfExtentInSectors,Math.max(1500,opts.systems*100));
  const r={galaxy:gal.designation.name,galaxyIndex:gi,systems:0,multipleSystems:0,
   coevalComponents:0,referenceV2Planets:0,freshMaturePlanets:0,
   planetsChronologicallyValid:0,componentReferenceMassNotPassedAsCurrent:0,
   evolvedMassNotResolved:0,compactCurrentMassSourceBacked:0,referenceOrbitsNotPassedAsCurrent:0,
   historicalEventsWithSource:0,formationHistoryEpisodes17_7:0,unresolvedDatedHistories:0,originalV2Preserved:0,
   releaseBlocked:0,errors:[],examples:[]};
  for(const p of candidates){if(r.systems>=opts.systems)break;
   const sec=GalaxySectorContentGenerator.generate(gal,new GalaxySectorCoordinates(p.x,p.y));
   if(!sec.systemLocators.length)continue;
   const h=identity([String(gi),p.x,p.y,'SYSTEM_INDEX']);
   const loc=sec.systemLocators[parseInt(h.slice(0,8),16)%sec.systemLocators.length];
   r.systems++;
   try{
    const before=Legacy.generateOrNull(key,loc);
    if(!before)continue;
    const oldDigest=digest(before);
    const bridge=Bridge.prepareOrNull(key,loc,TOKEN);
    if(!bridge)throw Error('MISSING_CANDIDATE');
    const m=bridge.manifest,e=bridge.physicalEpoch;
    if(e.contract!=='PRE-33.03a.2b.3b/V3_PHYSICAL_EPOCH/v1'||e.publishable||
       e.presentDayHistoryCompleteness!=='NOT_ESTABLISHED'||
       e.components.length!==bridge.candidate.components.length||
       !e.components.every(c=>c.currentBolometricLuminositySolar===null)||
       e.orbits.length!==e.components.length-1||
       e.orbits.some(o=>o.resolvedCurrentSemimajorAxisAu!==null||o.resolvedCurrentEccentricity!==null)||
       bridge.candidate.publicPlanets.some(v=>v.planet.hostPlanetarySystem.formationBlueprint
        .formationCompletionAgeMillionYears >m.sharedSystemAgeGyr*1000+1e-9)||
       m.legacyDigestBefore!==oldDigest ||m.legacyDigestAfter!==oldDigest||
       digest(Legacy.generateOrNull(key,loc))!==oldDigest)
       throw Error('INCOHERENT_EPOCH_OR_V2_SOURCE');
    r.multipleSystems++;
    r.coevalComponents+=e.components.length;
    r.referenceV2Planets+=before.publicPlanets.length;
    r.freshMaturePlanets+=m.planetCount;
    r.planetsChronologicallyValid+=m.planetCount;
    r.componentReferenceMassNotPassedAsCurrent+=e.components.filter(c=>
      c.gravityMassProvenance==='REFERENCE_PROGENITOR_NOT_CURRENT'&&
      c.resolvedCurrentGravityMassSolar===null).length;
    r.evolvedMassNotResolved+=e.components.filter(c=>
      c.gravityMassProvenance==='UNRESOLVED_EVOLVED_MASS'&&
      c.resolvedCurrentGravityMassSolar===null).length;
    r.compactCurrentMassSourceBacked+=e.components.filter(c=>
      c.gravityMassProvenance==='COMPACT_REMNANT_27_1_OR_27_4'&&
      c.resolvedCurrentGravityMassSolar>0).length;
    r.referenceOrbitsNotPassedAsCurrent+=e.orbits.length;
    r.historicalEventsWithSource+=m.compactFormationEpisodes32_12;
    for(let n=0;n<m.planetCount;n++){
      const history=bridge.readHistoryWindow(n,0,Math.round(m.sharedSystemAgeGyr*1e9));
      const formed=history.chronology.episodes.filter(e=>e.kind==='FORMATION' &&
        e.source.sourcePhase==='17.7' &&
        e.source.evidenceKind==='INFERRED_PHYSICAL_EPISODE');
      if(formed.length!==1 || history.historicalCompleteness!=='NOT_ESTABLISHED')
        throw Error('FORMATION_HISTORY_NOT_COHERENT_WITH_V3_CANDIDATE');
      r.formationHistoryEpisodes17_7++;
    }
    r.unresolvedDatedHistories+=m.missingDatedPhysicalEpisodeSources;
    r.originalV2Preserved++;
    r.releaseBlocked+=Number(!m.gamePublicationAllowed && !e.publishable);
    if(r.examples.length<4)r.examples.push({system:`G${gi}/S${loc.sectorKey}/O${loc.galacticObjectIndex}`,
      referencePlanets:before.publicPlanets.length,freshMature:m.planetCount,
      currentMass: e.components.map(c=>c.gravityMassProvenance),
      currentOrbit:e.orbits.map(o=>o.status)});
   }catch(e){r.errors.push({sector:[p.x,p.y],error:String(e.stack||e)});}
  }
  if(r.systems!==opts.systems||r.originalV2Preserved!==r.multipleSystems||
     r.releaseBlocked!==r.multipleSystems||r.formationHistoryEpisodes17_7!==r.freshMaturePlanets)r.errors.push({error:'INCOMPLETE_SAMPLE_OR_INVALID_GATE'});
  galaxies.push(r);
  process.stdout.write(`${r.galaxy}: ${r.multipleSystems} multi; ${r.freshMaturePlanets} mature; ${r.errors.length} errors\n`);
 }
 const scientificErrors=galaxies.reduce((n,g)=>n+g.errors.length,0);
 const publicReleased=route.publicV3Defined&&route.fromCode3Accepted;
 const result={contract:'PRE-33.03a.2b.3b/v3-physical-integration-preflight/v1',
  seed:opts.seed,source:'actual uploaded project + validated incremental 3b',
  publicRoutes:route,galaxies,
  scientificErrors,publicV3Released:publicReleased,
  interpretation:'Candidate CT0 host ages, mature planets and 17.7 formation episodes have coherent fresh provenance; 15.1 baseline luminosity/current mass is not an evolved present-day source. 27.1/27.4 compact remnant masses, if present, are source-backed. History 29/31/32 and orbital mass-loss/recoil remain incomplete; no V3 universe may be created/saved.',
  verdict:scientificErrors?'V3_SCIENTIFIC_EPOCH_FAILED':
    publicReleased?'PUBLIC_V3_PATH_PRESENT_REQUIRES_END_TO_END_TEST':
      'SCIENTIFIC_EPOCH_AUDITED_PUBLIC_V3_NOT_RELEASED'};
 fs.mkdirSync(opts.out,{recursive:true});
 const jp=path.join(opts.out,'pre33-v3-integracion-preflight.json');
 const mp=path.join(opts.out,'pre33-v3-integracion-preflight.md');
 fs.writeFileSync(jp,JSON.stringify(result,null,2)+'\n');
 fs.writeFileSync(mp,['# PRE-33.03a.2b.3b — auditoría real de integración física V3','',
  `**${result.verdict}**`,'',
  '| Galaxia | Múltiples | Estrellas coetáneas | V2 referencia | Planetas maduros nuevos | Masas evolucionadas sin resolver | Órbitas solo referencia | Errores |',
  '|---|---:|---:|---:|---:|---:|---:|---:|',
  ...galaxies.map(g=>`| ${g.galaxy} | ${g.multipleSystems} | ${g.coevalComponents} | ${g.referenceV2Planets} | ${g.freshMaturePlanets} | ${g.evolvedMassNotResolved} | ${g.referenceOrbitsNotPassedAsCurrent} | ${g.errors.length} |`),
  '', '**No hay publicación V3.** V1/V2 e IndexedDB sin modificar. Las propiedades 15.1 no se elevan a valores actuales, y 27.x sí puede dar masa de remanentes compactos cuando corresponde. Las órbitas 16 siguen siendo referencias sin historia dinámica de pérdida de masa. La Fase 32 no queda certificada a partir de una ausencia de fuentes 29. Las rutas públicas de arranque, navegación y persistencia siguen sin versión V3, y no se ha creado ninguna partida nueva.',
  '', 'No borrar IndexedDB. Necesario finalizar la integración física, publicación y prueba end-to-end reales antes de abrir V3.'
 ].join('\n')+'\n');
 console.log(result.verdict,jp,mp);
 if((opts.strict&&scientificErrors)||(requirePublicV3&&!publicReleased))process.exitCode=1;
 return result;
}
if(require.main===module)main(); module.exports={main,publicRouteProof};
