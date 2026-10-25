#!/usr/bin/env node
'use strict';
/** PRE-33.12 cross-layer integration: read-only; uses real generated objects,
 * world environmental evidence, the published 26.x fiche and observed 31.F.e.
 * Never writes saves, changes an RNG or creates life. */
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');const cp=require('node:child_process');
const {makeCandidates,identity}=require('./pre33/pre33-audit-core.cjs');
const {parse:parseBase}=require('./auditar-genesis-pre33-03a2a.cjs');
const ROOT=path.resolve(__dirname,'..'),TAG='PRE33_12_V3_CROSS_LAYER_INTEGRATION_AUDITED';
const register=()=>{const ts=require('typescript');if(!require.extensions['.ts'])require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);};
const load=p=>require(path.resolve(ROOT,'src/app',p));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function parse(argv){return parseBase(['--seed=7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',...argv]);}
function validateUpstreams(){const audit11b=path.join(ROOT,'docs/audits/pre33-11b/pre33-11b-auditoria.json');
 const audit11c=path.join(ROOT,'docs/audits/pre33-11c/pre33-11c-auditoria.json');
 if(!fs.existsSync(audit11b)||!fs.existsSync(audit11c))return {state:'UPSTREAM_REPORTS_NOT_PRESENT',issues:['PRE33_11B_11C_ARTIFACTS_ABSENT']};
 const raw=fs.readFileSync(audit11b,'utf8'), b=JSON.parse(raw),c=JSON.parse(fs.readFileSync(audit11c,'utf8'));
 const issues=[];
 if(b.contract!=='PRE-33.11b/V3-GALACTIC-STATISTICAL-CALIBRATION/v1'||b.verdict!=='PRE33_11B_V3_GALACTIC_STATISTICAL_CALIBRATION_AUDITED')issues.push('11B_UNVERIFIED');
 if(c.contract!=='PRE-33.11c/V3-LIFE-READINESS-NON-GENERATING/v1'||c.verdict!=='PRE33_11C_V3_LIFE_READINESS_AUDITED'||c.upstreamAuditSha256!==sha(raw))issues.push('11C_SOURCE_HASH_MISMATCH');
 if(c.galaxies?.length!==b.galaxies?.length||c.galaxies?.some(g=>g.biosphere!=='NOT_SIMULATED'||g.biosignatures!=='NOT_INFERRED'||g.calibration?.lifeRate!==null))issues.push('11C_BIOLOGY_LEAK');
 return {state:issues.length?'UPSTREAM_MISMATCH':'UPSTREAM_HASH_VERIFIED',sha256:sha(raw),issues};}
function fresh(galaxy,gi){return {galaxy,galaxyIndex:gi,systems:0,planets:0,moons:0,detailedMoons:0,identityOnlyMoons:0,
 planetCards:0,moonCards:0,observedPlanetFiches:0,observedMoonFiches:0,lockedControls:0,
 deferredCachePeak:0,v3EvidenceRecords:0,v2MutationCalls:0,errors:[]};}
function final(out,galaxies,rows,upstream,seed){const totals={systems:0,planets:0,moons:0,detailedMoons:0,identityOnlyMoons:0,planetCards:0,moonCards:0,observedPlanetFiches:0,observedMoonFiches:0,lockedControls:0,v3EvidenceRecords:0,errors:0};
 for(const g of galaxies)for(const k of Object.keys(totals))totals[k]+=k==='errors'?g.errors.length:g[k];
 const issues=[...upstream.issues];
 if(totals.planets!==totals.planetCards||totals.detailedMoons!==totals.moonCards||totals.moons!==totals.detailedMoons+totals.identityOnlyMoons)issues.push('CROSS_LAYER_TOTAL_INCONSISTENCY');
 if(totals.planets!==totals.observedPlanetFiches||totals.detailedMoons!==totals.observedMoonFiches)issues.push('OBSERVED_FICHE_COVERAGE_INCOMPLETE');
 if(totals.errors>0)issues.push('RUNTIME_INTEGRATION_ERRORS');
 const report={contract:'PRE-33.12/V3-READONLY-INTEGRATION/v1',seed,sampling:'DETERMINISTIC_SECTOR_SYSTEM_PANEL_NOT_GALAXY_CENSUS',
 scope:['REAL_V3_FORMATION_AND_FROZEN_SOURCES','ENVIRONMENT_PRE33_01','PLANET_AND_MOON_FICHE_26X',
 'OBSERVED_HABITABILITY_31FE','MULTIHOST_PUBLIC_AND_PHYSICAL_IDENTITY','MOON_IDENTITY_ONLY_3310',
 'LIFE_GATE_3311C_AND_STATISTICAL_PROVENANCE'],upstream,totals,galaxies,issues,
 versionPolicy:'NO_GENERATION_OR_PERSISTENCE_MUTATIONS_IN_THIS_AUDIT',
 historicalCompleteness:'NOT_ESTABLISHED_BY_CT0',life:'NOT_EVALUATED',
 verdict:issues.length?'PRE33_12_REVIEW_REQUIRED':TAG};
 fs.mkdirSync(out,{recursive:true});const json=JSON.stringify(report,null,2)+'\n';
 const columns=['galaxy','sector','system','architecture','publicPlanetOrdinal','physicalPlanetOrdinal','moonCount','detailedMoons','minorMoons','planetFiche','observedPlanet','observedMoonFiches','integrationPassed'];
 const csv=columns.join(',')+'\n'+rows.map(row=>columns.map(k=>JSON.stringify(row[k]??'')).join(',')).join('\n')+'\n';
 fs.writeFileSync(path.join(out,'pre33-12-auditoria.json'),json);fs.writeFileSync(path.join(out,'pre33-12-por-planeta.csv'),csv);
 const md=['# PRE-33.12 · Integración científica, persistencia y regresión', '',`Veredicto: **${report.verdict}**`,
 '',`Semilla: ${seed}; muestreo dirigido: ${totals.systems} sistemas, ${totals.planets} planetas, ${totals.moons} lunas. No es un censo galáctico ni una certificación biológica.`,
 '', '| Galaxia | Sistemas | Planetas | Lunas detalladas | Lunas identidad | Fichas planetarias | Fichas lunares | Problemas |',
 '|---|---:|---:|---:|---:|---:|---:|---:|',...galaxies.map(g=>`| ${g.galaxy} | ${g.systems} | ${g.planets} | ${g.detailedMoons} | ${g.identityOnlyMoons} | ${g.planetCards} | ${g.moonCards} | ${g.errors.length} |`),
 '',`11b/11c: ${upstream.state}; SHA-256 11b: ${upstream.sha256??'no disponible'}.`,
 '', '## Control de separación científica',
 '- Productores físicos reales → PRE-33.01 → ficha V3: sin modificación de generadores.',
 '- PRE-33.09: ninguna instantánea CT-0 se presenta como duración histórica global.',
 '- 31.F.e: se prueba la ficha observada autorizada y se rechaza su acceso bloqueado; índices no son dosis ni vida.',
 '- Todos los satélites del anfitrión figuran por identidad en la ficha V3; los menores nunca obtienen física individual ficticia.',
 '- Multihost: se conservan ordinal público y físico separados. 32.F.6b rechaza océanos con procedencia física extraña.',
 '- Ni una oportunidad acuosa de 11b ni un ejemplo instrumental de 11c se promueven a vida o descubrimiento.',
 '', '## Persistencia, determinismo, rendimiento y límites',
 '- El auditor es de solo lectura y no invoca ningún repositorio de escritura. Pruebas Vitest del catálogo, snapshots y selección V3 cubren IndexedDB y cachés reales.',
 '- Para certificación de rendimiento, comparar tiempos/heap respecto al mismo HEAD sin cambios mediante la suite E2E: este informe no inventa métricas de navegador.',
 '- Ejecutar los tests de worker, arquitectura, typecheck, build, E2E y snapshot persistido para completar la puerta PRE-33.12.',
 '- Las magnitudes bioenergéticas, dosimétricas y temporales UNKNOWN siguen UNKNOWN, no se convierten en cero físico ni en habitabilidad.',
 '- PRE-33.13 deberá verificar la certificación independiente antes de activar vida efectiva.', ''];
 fs.writeFileSync(path.join(out,'pre33-12-informe.md'),md.join('\n')+'\n');
 const digests={json:sha(json),csv:sha(csv)};
 console.log(report.verdict,JSON.stringify(totals),`SHA256_JSON=${digests.json}`,`SHA256_CSV=${digests.csv}`);
 return report;}
function main(argv=process.argv.slice(2)){
 const o=parse(argv);const upstream=validateUpstreams();
 if(o.galaxies.length>1){const galaxies=[],rows=[];
  for(const gi of o.galaxies){const dir=path.join(o.out,`.galaxy-${gi}`);
   const p=cp.spawnSync(process.execPath,[__filename,`--seed=${o.seed}`,`--galaxies=${gi}`,`--systems-per-galaxy=${o.systems}`,`--out=${dir}`,...(o.strict?['--strict']:[])],{cwd:ROOT,encoding:'utf8',maxBuffer:40*1024*1024});
   if(p.stdout)process.stdout.write(p.stdout);if(p.stderr)process.stderr.write(p.stderr);
   if(p.status!==0||p.error)throw Error('PRE33_12_GALAXY_FAILED_'+gi+' '+String(p.error??p.status));
   galaxies.push(...JSON.parse(fs.readFileSync(path.join(dir,'pre33-12-auditoria.json'),'utf8')).galaxies);
   const lines=fs.readFileSync(path.join(dir,'pre33-12-por-planeta.csv'),'utf8').trim().split('\n').slice(1);
   for(const line of lines){const values=line.split(',').map(v=>JSON.parse(v));rows.push(Object.fromEntries(['galaxy','sector','system','architecture','publicPlanetOrdinal','physicalPlanetOrdinal','moonCount','detailedMoons','minorMoons','planetFiche','observedPlanet','observedMoonFiches','integrationPassed'].map((k,i)=>[k,values[i]])));}
  }const r=final(o.out,galaxies,rows,upstream,o.seed);if(o.strict&&r.issues.length)process.exitCode=1;return r;
 }
 register();const {UniverseSeed}=load('domain/universe/universe-seed');const {UniverseGenerationKey}=load('domain/generation/universe-generation-key');
 const {GeneratorVersion}=load('domain/generation/generator-version');const {GalaxyGenerator}=load('simulation/universe/galaxy-generator');
 const {GalaxySectorGridGenerator}=load('simulation/sector/galaxy-sector-grid-generator');const {GalaxySectorContentGenerator}=load('simulation/sector/galaxy-sector-content-generator');
 const {GalaxySectorCoordinates}=load('domain/sector/galaxy-sector-coordinates');const {StellarMultihostFormation}=load('simulation/stellar/stellar-multihost-formation');
 const {PlanetScientificTargetResolver:PlanetResolver}=load('simulation/planetary/planet-scientific-target-resolver');
 const {MoonScientificTargetResolver:MoonResolver}=load('simulation/planetary/moon-scientific-target-resolver');
 const {PlanetScientificSectionsAssembler:PlanetFiche}=load('presentation/planet-detail/planet-scientific-sections');
 const {MoonScientificSectionsAssembler:MoonFiche}=load('presentation/moon-detail/moon-scientific-sections');
 const {ObservedHabitabilityFiche31Fe:Observer}=load('presentation/scientific/observed-habitability-fiche-31-f-e');
 const {EnvironmentalPhysicalProjectionPRE3301:Env}=load('simulation/planetary/environmental-physical-projection-pre33-01');
 const {verifyScientificIntegrationPRE3312:check}=load('presentation/scientific/scientific-integration-regression-pre33-12');
 const {DiscoveryState}=load('domain/discovery/discovery-state');
 const key=new UniverseGenerationKey(UniverseSeed.parse(o.seed),GeneratorVersion.V3);const galaxies=[],rows=[];
 for(const gi of o.galaxies){const galaxy=GalaxyGenerator.generate(key,BigInt(gi));
  const grid=GalaxySectorGridGenerator.generate(galaxy);
  const candidates=makeCandidates(o.seed,gi,grid.halfExtentInSectors,Math.max(1500,o.systems*100));
  const g=fresh(galaxy.designation.name,gi);
  for(const pos of candidates){if(g.systems>=o.systems)break;
   const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(pos.x,pos.y));
   if(!sector.systemLocators.length)continue;
   const loc=sector.systemLocators[parseInt(identity([String(gi),pos.x,pos.y,'SYSTEM_INDEX']).slice(0,8),16)%sector.systemLocators.length];
   try{
    const multi=StellarMultihostFormation.generateOrNull(key,loc);
    const single=multi?null:StellarMultihostFormation.generateSingleOrNull(key,loc);
    if(!multi&&!single)throw Error('MISSING_SYSTEM');
    const worlds=multi?.publicPlanets??single.planets.map((planet,i)=>({planet,atmosphere:single.atmospheres[i],moonSystem:single.moonSystems[i]}));
    for(const [i,w] of worlds.entries()){
     const {planet,atmosphere,moonSystem}=w;
     const ident={locator:w.publicLocator??planet.locator,planetOrdinal:i+1,
      designation:`Audit-${i+1}`,hostSystemDesignation:g.galaxy,
      orbitTopology:planet.hostPlanetarySystem.architecture.orbitTopology,hostPlanetCount:worlds.length};
     const target=PlanetResolver.projectGenerated(ident,planet,atmosphere,moonSystem,undefined,undefined,3);
     const env=Env.planet(planet,atmosphere);const fiche=PlanetFiche.build(target);
     const result=check({environmental:env,access:'SCIENTIFIC_FICHE_AVAILABLE',planetFiche:fiche,
      moonInventory:{total:moonSystem.moonCount,detailed:moonSystem.relevantMoonCount,minorIdentityOnly:moonSystem.unmaterializedMinorMoonCount}});
     if(!result.passed)throw Error('PLANET_CHAIN:'+result.issues.join(','));
     const observed=Observer.planet(target,DiscoveryState.CONFIRMED,true,env.bodyKey,multi?.multiplicity.name??'SINGLE');
     if(!observed||observed.routes.length<2)throw Error('PLANET_OBSERVER_MISSING');
     if(Observer.planet(target,DiscoveryState.CATALOGUED,false,env.bodyKey,'UNKNOWN')!==null)throw Error('PLANET_OBSERVER_LEAK');
     g.planets++;g.planetCards++;g.v3EvidenceRecords++;g.observedPlanetFiches++;g.lockedControls++;
     let observedMoons=0;
     for(const moon of moonSystem.relevantMoons){
      const mtSource=MoonResolver.resolveDetailed(key,ident.locator,BigInt(moon.moonOrdinal-1),{resolveDetailed:()=>target});
      if(!mtSource)throw Error('MISSING_LUNAR_SCIENTIFIC_TARGET');
      // Mirror the real multihost adapter: 32.F.6b requires the frozen source
      // ordinal, which may differ from the public slot. Never derive it from
      // the ocean/radiation that the validator is supposed to check.
      const mt={...mtSource,physicalHostPlanetOrdinal:w.sourcePlanetOrdinal??planet.planetOrdinal};
      const phys=Env.moon(moon,planet),card=MoonFiche.build(mt);
      const ocean=moon.oceanReality32F2c?.hostPlanetOrdinal??null;
      const radiation=moon.radiationProtection32F3?.hostPlanetOrdinal??null;
      const outcome=check({environmental:phys,access:'SCIENTIFIC_FICHE_AVAILABLE',moonFiche:card,
       moonOrigin:{publicHostPlanetOrdinal:i+1,physicalHostPlanetOrdinal:planet.planetOrdinal,
        oceanHostPlanetOrdinal:ocean,radiationHostPlanetOrdinal:radiation}});
      if(!outcome.passed)throw Error('MOON_CHAIN:'+outcome.issues.join(','));
      const seen=Observer.moon(mt,DiscoveryState.CONFIRMED,true,`${env.bodyKey}/M${moon.moonOrdinal}`,
       multi?.multiplicity.name??'SINGLE');
      if(!seen)throw Error('MOON_OBSERVER_MISSING');
      if(Observer.moon(mt,DiscoveryState.CATALOGUED,false,`${env.bodyKey}/M${moon.moonOrdinal}`,'UNKNOWN')!==null)
       throw Error('MOON_OBSERVER_LEAK');
      observedMoons++;g.moonCards++;g.observedMoonFiches++;g.v3EvidenceRecords++;g.lockedControls++;
     }
     g.moons+=moonSystem.moonCount;g.detailedMoons+=moonSystem.relevantMoonCount;g.identityOnlyMoons+=moonSystem.unmaterializedMinorMoonCount;
     rows.push({galaxy:g.galaxy,sector:`${pos.x}:${pos.y}`,system:String(loc.galacticObjectIndex),
      architecture:multi?.multiplicity.name??'SINGLE',publicPlanetOrdinal:i+1,physicalPlanetOrdinal:planet.planetOrdinal,
      moonCount:moonSystem.moonCount,detailedMoons:moonSystem.relevantMoonCount,minorMoons:moonSystem.unmaterializedMinorMoonCount,
      planetFiche:'AVAILABLE',observedPlanet:true,observedMoonFiches:observedMoons,integrationPassed:result.passed});
    }
    g.systems++;
   }catch(e){g.errors.push({sector:`${pos.x},${pos.y}`,error:String(e?.stack??e)});}
  }
  if(g.systems!==o.systems)g.errors.push({error:'SYSTEM_SAMPLE_INCOMPLETE'});
  console.log(g.galaxy,g.systems,'systems',g.planets,'planets',g.moons,'moons',g.errors.length,'errors');
  galaxies.push(g);
 }
 const r=final(o.out,galaxies,rows,upstream,o.seed);if(o.strict&&r.issues.length)process.exitCode=1;return r;
}
if(require.main===module)main();module.exports={main,parse,validateUpstreams,final,TAG};
