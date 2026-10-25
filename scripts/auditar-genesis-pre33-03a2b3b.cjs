#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {makeCandidates,identity}=require('./pre33/pre33-audit-core.cjs');
const {parse}=require('./auditar-genesis-pre33-03a2a.cjs');
function registerTS(){const ts=require('typescript');if(!require.extensions['.ts'])require.extensions['.ts']=(mod,file)=>{
 const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{
 module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true,
 useDefineForClassFields:false}}).outputText;mod._compile(js,file);};}
function src(p){return require(path.resolve('src/app',p));}
function main(){const opts=parse(process.argv.slice(2));registerTS();
 const {UniverseSeed}=src('domain/universe/universe-seed.ts');
 const {UniverseGenerationKey}=src('domain/generation/universe-generation-key.ts');
 const {GeneratorVersion}=src('domain/generation/generator-version.ts');
 const {GalaxyGenerator}=src('simulation/universe/galaxy-generator.ts');
 const {GalaxySectorGridGenerator}=src('simulation/sector/galaxy-sector-grid-generator.ts');
 const {GalaxySectorContentGenerator}=src('simulation/sector/galaxy-sector-content-generator.ts');
 const {GalaxySectorCoordinates}=src('domain/sector/galaxy-sector-coordinates.ts');
 const {StellarMultihostHistoricalBridgePRE3303A2B3B:Bridge}=src('simulation/stellar/stellar-multihost-historical-bridge-pre33-03a2b3b.ts');
 const {MULTIHOST_HISTORICAL_BRIDGE_PRE3303A2B3B:TOKEN}=src('domain/stellar/stellar-multihost-historical-bridge-pre33-03a2b3b.ts');
 const key=new UniverseGenerationKey(UniverseSeed.parse(opts.seed),GeneratorVersion.V2);
 const galaxies=[];
 for(const gi of opts.galaxies){const gal=GalaxyGenerator.generate(key,BigInt(gi));
 const grid=GalaxySectorGridGenerator.generate(gal);
 const candidates=makeCandidates(opts.seed,gi,grid.halfExtentInSectors,Math.max(1500,opts.systems*100));
 const result={galaxyIndex:gi,galaxy:gal.designation.name,systems:0,multipleSystems:0,
    components:0,planets:0,historyWindows32_12:0,sourceBackedEvents:0,sourceBackedFormation17_7:0,
    unresolvedDatedSources:0,projectedCompactRemnants:0,notResolvedWhiteDwarfMasses:0,
    legacyMutationDetected:0,canonicalReleaseBlocked:0,errors:[],examples:[]};
 for(const p of candidates){if(result.systems>=opts.systems)break;
 const sec=GalaxySectorContentGenerator.generate(gal,new GalaxySectorCoordinates(p.x,p.y));
 if(!sec.systemLocators.length)continue;
 const h=identity([String(gi),p.x,p.y,'SYSTEM_INDEX']);
 const loc=sec.systemLocators[parseInt(h.slice(0,8),16)%sec.systemLocators.length];
 try {const bridge=Bridge.prepareOrNull(key,loc,TOKEN);result.systems++;
  if(!bridge)continue;
  const m=bridge.manifest;result.multipleSystems++;result.components+=m.remnantProfiles.length;
  result.planets+=m.planetCount;result.historyWindows32_12+=m.history32_12WindowsValidated;
  for(let n=0;n<m.planetCount;n++){
    const history=bridge.readHistoryWindow(n,0,Math.round(m.sharedSystemAgeGyr*1e9));
    if(history.chronology.episodes.filter(e=>e.kind==='FORMATION' &&
      e.source.sourcePhase==='17.7' && e.source.evidenceKind==='INFERRED_PHYSICAL_EPISODE').length!==1 ||
      history.historicalCompleteness!=='NOT_ESTABLISHED')throw Error('MISSING_SOURCE_BACKED_FORMATION_17_7');
    result.sourceBackedFormation17_7++;
  }
  result.unresolvedDatedSources+=m.missingDatedPhysicalEpisodeSources;
  result.projectedCompactRemnants+=m.remnantProfiles.filter(r=>r.remnantType==='NEUTRON_STAR'||r.remnantType==='STELLAR_BLACK_HOLE').length;
  result.notResolvedWhiteDwarfMasses+=m.remnantProfiles.filter(r=>r.remnantType==='WHITE_DWARF').length;
  result.legacyMutationDetected+=Number(m.legacyDigestBefore!==m.legacyDigestAfter);
  result.canonicalReleaseBlocked+=Number(!m.gamePublicationAllowed);
  if(m.status!=='REBUILT_CT0_AND_HISTORY_INTERFACE_PUBLICATION_BLOCKED'||m.legacyMutated||
     m.gamePublicationAllowed||m.canonicalMigrationPerformed||m.waterCT0Certified||
     m.history32_12WindowsValidated!==m.planetCount||
     m.missingDatedPhysicalEpisodeSources!==m.planetCount||
     m.dependencies.filter(d=>d.status==='UNRESOLVED_RELEASE_BLOCKER').length<3)
    throw Error('INVALID_HISTORY_PHYSICAL_RELEASE_GATE');
  if(result.examples.length<6)result.examples.push({system:m.physicalNamespace,
    components:m.remnantProfiles.map(r=>({label:r.component,state:r.state,remnant:r.remnantType})),
    planets:m.planetCount,revision: m.contract,history32:'FORMATION_17_7_SOURCE_BACKED_TRANSIENTS_UNRESOLVED',release:false});
 }catch(e){result.errors.push({sector:[p.x,p.y],error:String(e.stack||e)});}}
 if(result.systems!==opts.systems||result.legacyMutationDetected||
   result.canonicalReleaseBlocked!==result.multipleSystems||
   result.historyWindows32_12!==result.planets||
   result.unresolvedDatedSources!==result.planets||
   result.sourceBackedFormation17_7!==result.planets)result.errors.push({error:'INCOMPLETE_REVISIONS'});
 galaxies.push(result);
 console.log(`PRE33.03a.2b.3b ${result.galaxy}: ${result.systems} systems; ${result.multipleSystems} multiples; ${result.planets} histories; ${result.errors.length} errors`);
 }
 const failed=galaxies.some(g=>g.errors.length>0);
 const verdict=failed?'COEVAL_HISTORICAL_BRIDGE_FAILED':
  'COEVAL_REMNANT_CT0_AND_32_12_BRIDGE_PASSED_PUBLIC_RELEASE_BLOCKED';
 const doc={contract:'PRE-33.03a.2b.3b/coeval-historical-bridge/v1',seed:opts.seed,
  scope:'Deterministic read-only public V2 reference sample for future separate V3 candidate; NOT public V3 census.',
  interpretation:'Fresh coeval stars, planets, atmospheres, moons from 3a; present NS/BH remnant projection via canonical 27.1/27.4 and actual bounded 32.12 source interface. NO independently dated phase29 events/planet exposures, stellar evolution radiation, mass-loss orbit or public V3 generator. Missing events must NOT be interpreted as zero real events.',
  galaxies,publicGeneratorV3Released:false,savedUniverseMutated:false,
  historicalCompletenessEstablished:false,certifiedCT0WaterInventories:0,verdict};
 fs.mkdirSync(opts.out,{recursive:true});
 const json=path.join(opts.out,'pre33-03a2b3b-historias.json');
 const md=path.join(opts.out,'pre33-03a2b3b-informe.md');
 fs.writeFileSync(json,JSON.stringify(doc,null,2)+'\n');
 fs.writeFileSync(md,['# PRE-33.03a.2b.3b — Puente histórico y verificación de publicación','',
 `Semilla ${opts.seed} · ${verdict}`,'',
 '| Galaxia | Sistemas | Múltiples | Componentes | Planetas con fuente 32.12 validada | Eventos históricos fechados recibidos | Errores |',
 '|---|---:|---:|---:|---:|---:|---:|',
 ...galaxies.map(g=>`| ${g.galaxy} | ${g.systems} | ${g.multipleSystems} | ${g.components} | ${g.historyWindows32_12} | ${g.sourceBackedEvents} | ${g.errors.length} |`),
 '', 'Proyecciones CT0 de remanentes compactos usan los motores físicos existentes 27.1/27.4 y perfiles estelares revisados. 32.12 se ejecuta con una identidad física por planeta y versión de fuente propia. Un catálogo de episodios vacío NO prueba ausencia de eventos: historial incompleto.',
 '', '**La publicación V3 y la creación de partidas nuevas con física coetánea continúan BLOQUEADAS**. Faltan fuentes fechadas de 29/31/32, masa y radiación de estrellas evolucionadas, dinámica orbital histórica y enrutamiento/persistencia V3. No borrar IndexedDB. No se certifica H2O CT0.'].join('\n')+'\n');
 console.log(verdict, json, md);if(opts.strict&&failed)process.exitCode=1;
}
if(require.main===module) main();module.exports={parse};
