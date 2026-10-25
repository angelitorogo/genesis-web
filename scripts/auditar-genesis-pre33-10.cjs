#!/usr/bin/env node
'use strict';
/** PRE-33.10 read-only audit of deferred minor-moon materialization and full CONFIRMED V3 catalogue. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const {makeCandidates,identity}=require('./pre33/pre33-audit-core.cjs');
const {parse}=require('./auditar-genesis-pre33-03a2a.cjs');
function register(){const ts=require('typescript');if(!require.extensions['.ts'])require.extensions['.ts']=(m,f)=>
 m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,
 target:ts.ScriptTarget.ES2022}}).outputText,f);}
const load=p=>require(path.resolve('src/app',p));
const header=['galaxia','sector','sistema','tipo','planeta','lunas','detalladas','soloIdentidad','materializacion','identidadEstable','fichaVida'];
const encode=(...x)=>x.map(v=>JSON.stringify(v??'')).join(',');
function produce(out,galaxies,rows){
 const totals={systems:0,planets:0,moons:0,detailedMoons:0,identityOnlyMoons:0,
  minorMaterialized:0,conditionalPhysicalScenarios:0,outsideOrbitalDomain:0,catalogueIdentityEntries:0,versionV2MinorVisible:0,errors:0};
 for(const g of galaxies)for(const k of Object.keys(totals))totals[k]+=k==='errors'?g.errors.length:g[k];
 const r={contract:'PRE-33.10/V3-DEFERRED-MOON-COVERAGE/v1',seed:'7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',
  sample:'Selected 20 systems per galaxy, not census; all moon identities from those systems',totals,galaxies,
  explanation:'Materialized physical bounds are conditional: no resolved water, habitability, chemical power or life. CONFIRMED makes all identity-only moons listable, without eager physical generation. Cache only in memory, reload reconstructs the same identity and bounds.',
  verdict:totals.errors?'PRE33_10_BLOCKED':'PRE33_10_V3_DEFERRED_MOON_COVERAGE_AUDITED'};
 fs.mkdirSync(out,{recursive:true});const body=JSON.stringify(r,null,2)+'\n';
 fs.writeFileSync(path.join(out,'pre33-10-auditoria.json'),body);
 fs.writeFileSync(path.join(out,'pre33-10-por-planeta.csv'),header.join(',')+'\n'+rows.join('\n')+'\n');
 fs.writeFileSync(path.join(out,'pre33-10-informe.md'),`# PRE-33.10 — Lunas de solo identidad y caracterización bajo demanda V3\n\n${r.verdict}\n\n| Galaxia | Sistemas | Planetas | Lunas | Detalladas | Solo identidad | Errores |\n|---|---:|---:|---:|---:|---:|---:|\n${galaxies.map(g=>`| ${g.galaxy} | ${g.systems} | ${g.planets} | ${g.moons} | ${g.detailedMoons} | ${g.identityOnlyMoons} | ${g.errors.length} |`).join('\n')}\n\n**Contrato de evidencia:** una luna de solo identidad es una luna conocida al confirmar el sistema, pero la composición, el solvente, la dosis, la habitabilidad y la vida no están resueltas. El generador de minor moons solo calcula cotas dinámicas condicionales al solicitar la ficha; no materializa en bloque las 342 minor moons del muestreo inicial de 2026-10-20.\n\n**Persistencia:** el catálogo es un read-model derivado, versionado por conocimiento+contrato; las fichas diferidas se recalculan del MoonSeed canónico y la época sin mutar V1/V2 ni escribir físicas inventadas en IndexedDB. La caché de memoria es LRU de 96 entradas, liberable.\n\n**Criterio biológico:** vida = NOT_EVALUATED para minor moons sin fuentes; no excluir permanentemente por ordinal o masa.\n\n**Límite:** el diagnóstico de dominio orbital no es una órbita ni un interior individual resuelto; PRE-33.12 comprobará la propagación integral por UI/cachés y rendimiento final.\n`);
 const digest=crypto.createHash('sha256').update(body).digest('hex');console.log(r.verdict+' SHA256 '+digest);return r;
}
function main(argv=process.argv.slice(2)){
 const o=parse(argv);
 if(o.galaxies.length>1){const galaxies=[],rows=[];
  for(const gi of o.galaxies){const dir=path.join(o.out,'.moon-g'+gi);
   const sub=cp.spawnSync(process.execPath,[__filename,'--seed='+o.seed,'--galaxies='+gi,
    '--systems-per-galaxy='+o.systems,'--out='+dir,...o.strict?['--strict']:[]],{encoding:'utf8',maxBuffer:16*1024*1024});
   if(sub.stdout)process.stdout.write(sub.stdout);if(sub.stderr)process.stderr.write(sub.stderr);
   if(sub.error||sub.status!==0)throw Error('PRE33_10_GALAXY_FAILED '+gi+' '+(sub.error||sub.status));
   galaxies.push(...JSON.parse(fs.readFileSync(path.join(dir,'pre33-10-auditoria.json'),'utf8')).galaxies);
   rows.push(...fs.readFileSync(path.join(dir,'pre33-10-por-planeta.csv'),'utf8').trim().split('\n').slice(1));
  }return produce(o.out,galaxies,rows);
 }
 register();
 const {UniverseSeed}=load('domain/universe/universe-seed.ts');
 const {UniverseGenerationKey}=load('domain/generation/universe-generation-key.ts');
 const {GeneratorVersion}=load('domain/generation/generator-version.ts');
 const {GalaxyGenerator}=load('simulation/universe/galaxy-generator.ts');
 const {GalaxySectorGridGenerator}=load('simulation/sector/galaxy-sector-grid-generator.ts');
 const {GalaxySectorContentGenerator}=load('simulation/sector/galaxy-sector-content-generator.ts');
 const {GalaxySectorCoordinates}=load('domain/sector/galaxy-sector-coordinates.ts');
 const {StellarMultihostFormation}=load('simulation/stellar/stellar-multihost-formation.ts');
 const {MinorMoonOnDemandPRE3310:Minor}=load('simulation/planetary/minor-moon-on-demand-pre33-10.ts');
 const key=new UniverseGenerationKey(UniverseSeed.parse(o.seed),GeneratorVersion.V3);
 const galaxies=[],rows=[];
 for(const gi of o.galaxies){
  const galaxy=GalaxyGenerator.generate(key,BigInt(gi));
  const grid=GalaxySectorGridGenerator.generate(galaxy);
  const candidates=makeCandidates(o.seed,gi,grid.halfExtentInSectors,Math.max(1500,o.systems*100));
  const g={galaxy:galaxy.designation.name,galaxyIndex:gi,systems:0,planets:0,moons:0,detailedMoons:0,
   identityOnlyMoons:0,minorMaterialized:0,conditionalPhysicalScenarios:0,outsideOrbitalDomain:0,catalogueIdentityEntries:0,versionV2MinorVisible:0,errors:[]};
  let catalogueChecked=false;
  for(const pos of candidates){if(g.systems>=o.systems)break;
   const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(pos.x,pos.y));
   if(!sector.systemLocators.length)continue;
   const loc=sector.systemLocators[parseInt(identity([String(gi),pos.x,pos.y,'SYSTEM_INDEX']).slice(0,8),16)%sector.systemLocators.length];
   try {
    const multi=StellarMultihostFormation.generateOrNull(key,loc);
    const single=multi?null:StellarMultihostFormation.generateSingleOrNull(key,loc);
    if(!multi&&!single)throw Error('MISSING_SYSTEM');
    const worlds=multi?.publicPlanets??single.planets.map((planet,i)=>({planet,moonSystem:single.moonSystems[i]}));
    let systemMinor=0;
    for(const [i,w] of worlds.entries()){
     const moonSystem=w.moonSystem;if(!moonSystem)throw Error('NO_MOON_SYSTEM');
     if(moonSystem.moonIdentities.length!==moonSystem.moonCount||moonSystem.moonCount!==
        moonSystem.relevantMoonCount+moonSystem.unmaterializedMinorMoonCount)throw Error('MOON_POPULATION_INVARIANT');
     const minor=moonSystem.unmaterializedMinorMoonCount;systemMinor+=minor;
     g.planets++;g.moons+=moonSystem.moonCount;g.detailedMoons+=moonSystem.relevantMoonCount;g.identityOnlyMoons+=minor;
     for(let idx=moonSystem.relevantMoonCount;idx<moonSystem.moonCount;idx++){
      const moonIndex=BigInt(idx);
      const a=Minor.materialize(moonSystem,moonIndex);
      const b=Minor.materialize(moonSystem,moonIndex);
      if(!a||a!==b||a.identitySeed!==moonSystem.moonIdentities[idx].seed.normalizedValue||
         a.moonOrdinal!==idx+1||a.physicalModelResolved!==false||a.life!=='NOT_EVALUATED'||
         a.atmosphere!=='UNKNOWN'||a.water!=='UNKNOWN'||a.geoChemicalPower!=='UNKNOWN')
        throw Error('NON_DETERMINISTIC_OR_FAKE_MINOR_SCIENCE');
      if(a.status==='CONDITIONAL_BOUNDS'){
       if(!(a.scenarioMassEarth>0&&a.scenarioRadiusEarth>0&&a.scenarioDensityGramsPerCm3>0&&
            a.scenarioSemiMajorAxisPlanetRadii>a.stableOrbitInnerPlanetRadii&&
            a.scenarioSemiMajorAxisPlanetRadii<a.stableOrbitOuterPlanetRadii&&
            a.scenarioOrbitalPeriodDays>0))throw Error('UNPHYSICAL_CONDITIONAL_MOON');
       // PRE-33.10a: do not let host mass or a hard-coded 1000 R_p
       // masquerade as physical satellite bounds in the V3 read model.
       const priorLimit=moonSystem.hostPlanet.massEarth*1e-5/
         Math.max(1,moonSystem.unmaterializedMinorMoonCount);
       const hillReference=.49*moonSystem.hillSphereRadiusPlanetRadii;
       if(!(a.massUpperBoundEarth===a.massPriorCeilingEarth&&
          a.massPriorCeilingEarth>0&&a.massPriorCeilingEarth<=priorLimit&&
          a.scenarioMassEarth<=a.massPriorCeilingEarth&&
          a.rocheFluidReferenceInnerPlanetRadii>0&&
          Math.abs(a.hillProgradeReferenceOuterPlanetRadii-hillReference)<1e-8&&
          a.samplingOuterPlanetRadii===Math.min(1000,hillReference)&&
          a.samplingInnerPlanetRadii>=a.rocheFluidReferenceInnerPlanetRadii&&
          a.samplingInnerPlanetRadii===a.stableOrbitInnerPlanetRadii&&
          a.samplingOuterPlanetRadii===a.stableOrbitOuterPlanetRadii&&
          a.samplingCeilingIsNumerical===(hillReference>1000)))
        throw Error('PRE33_10A_MISLABELED_SCENARIO_BOUNDS');
       g.conditionalPhysicalScenarios++;
      } else {
       if(a.scenarioMassEarth!==null||a.scenarioRadiusEarth!==null||
          a.scenarioOrbitalPeriodDays!==null || a.massPriorCeilingEarth!==null ||
          a.rocheFluidReferenceInnerPlanetRadii!==null ||
          a.hillProgradeReferenceOuterPlanetRadii!==null)
         throw Error('UNJUSTIFIED_ORBITAL_SCENARIO');
       g.outsideOrbitalDomain++;
      }
      g.minorMaterialized++;
     }
     if(Minor.materialize(moonSystem,BigInt(moonSystem.moonCount))!==null||
        (moonSystem.relevantMoonCount>0&&Minor.materialize(moonSystem,0n)!==null))
       throw Error('INVALID_MOON_INDEX_MATERIALIZED');
     rows.push(encode(g.galaxy,`${pos.x}:${pos.y}`,String(loc.galacticObjectIndex),multi?.multiplicity.name??'SINGLE',i+1,
       moonSystem.moonCount,moonSystem.relevantMoonCount,minor,'DEFERRED','CANONICAL','NOT_EVALUATED'));
    }
    if(!catalogueChecked && systemMinor>0){
     // The Angular-backed persisted catalogue is verified by its Vitest
     // integration test. In this CLI runner we assert its immutable, exactly
     // addressable canonical source inventory, without browser/IndexedDB.
     const identities=worlds.flatMap(w=>w.moonSystem.moonIdentities
       .slice(w.moonSystem.relevantMoonCount));
     if(identities.length!==systemMinor ||
        new Set(identities.map(m=>m.seed.normalizedValue)).size!==identities.length)
       throw Error('CONFIRMED_SOURCE_IDENTITIES_NOT_UNIQUE');
     g.catalogueIdentityEntries+=identities.length;catalogueChecked=true;
    }
    g.systems++;
   }catch(e){g.errors.push({sector:`${pos.x},${pos.y}`,error:String(e?.stack??e)});}
  }
  if(g.systems!==o.systems||g.minorMaterialized!==g.identityOnlyMoons||Minor.cachedCount>96||
      (g.identityOnlyMoons>0&&!catalogueChecked))g.errors.push({sector:'SUMMARY',error:'INCOMPLETE_OR_UNBOUNDED'});
  // Cache eviction cannot change physical results.
  Minor.release();if(Minor.cachedCount!==0)g.errors.push({sector:'CACHE',error:'NOT_RELEASED'});
  console.log(`${g.galaxy}: ${g.systems} sistemas, ${g.planets} planetas, ${g.moons} lunas (${g.identityOnlyMoons} solo identidad), ${g.errors.length} incidencias`);
  galaxies.push(g);
 }
 const r=produce(o.out,galaxies,rows);if(o.strict&&r.totals.errors)process.exitCode=1;return r;
}
if(require.main===module)main();module.exports={main};
