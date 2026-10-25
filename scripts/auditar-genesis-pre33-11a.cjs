#!/usr/bin/env node
'use strict';
/** Read-only galactic distribution audit; not a galactic census or a biology generator. */
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const {parse}=require('./auditar-genesis-pre33-03a2a.cjs');
const {identity,makeCandidates,accumulate}=require('./pre33/pre33-audit-core.cjs');
const TAG='PRE33_11A_V3_GALACTIC_BIOCHEMICAL_COVERAGE_AUDITED';
const SOLVENTS=['H2O','NH3','CH4'];
function register(){const ts=require('typescript');if(!require.extensions['.ts'])require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);}
const load=p=>require(path.resolve('src/app',p));
const add=(obj,key,n=1)=>accumulate(obj,key,n);
const csv=(...items)=>items.map(x=>JSON.stringify(x??'')).join(',');
const columns=['galaxia','region','radioNormalizado','cuadrante','sector','sistema','arquitectura','anfitrion','planetaOrdinal','familia','nicho','metallicidadSectorSolar','indiceSolidos','propensionGigantes','lunasDetalladas','lunasSoloIdentidad','liquidoH2OModelado','H2Odesconocido','planetaH2O' ,'NH3noResuelto','CH4noResuelto','vida'];
function summarize(galaxies,rows,seed,dir){
 const total={systems:0,planets:0,planetModeledLiquidH2O:0,planetModeledAbsentH2O:0,planetUnknownH2O:0,detailedMoons:0,identityOnlyMoons:0,moons:0,moonModeledLiquidH2O:0,moonModeledAbsentH2O:0,moonUnknownH2O:0,unresolvedNH3:0,unresolvedCH4:0,issues:0};
 const byRegion={},byRegionEnvironment={},byRegionFamily={},byArchitecture={},byPlanetFamily={},missing=[],gradients={};
 for(const g of galaxies){
  for(const k of Object.keys(total))total[k]+=g[k];
  for(const [src,dest] of [['byRegion',byRegion],['byArchitecture',byArchitecture],['byPlanetFamily',byPlanetFamily],['byRegionFamily',byRegionFamily]])
   for(const [k,v] of Object.entries(g[src]))add(dest,k,v);
  for(const [region,stats] of Object.entries(g.byRegionEnvironment)){
    const dest=byRegionEnvironment[region]??(byRegionEnvironment[region]={});
    for(const [k,v] of Object.entries(stats))add(dest,k,v);
  }
  gradients[g.galaxy]={minMetallicity:g.minMetallicity,maxMetallicity:g.maxMetallicity,
    minRadialRadius:g.minRadius,maxRadialRadius:g.maxRadius,radialMonotonicityIssues:g.radialMonotonicityIssues};
 }
 for(const a of ['SINGLE','BINARY','TRIPLE'])if(!byArchitecture[a])missing.push('NO_SAMPLED_'+a);
 for(const a of ['ROCKY','SUPER_EARTH','DESERT','OCEAN','ICE','VOLCANIC','MINI_NEPTUNE','GAS_GIANT','ICE_GIANT'])if(!byPlanetFamily[a])missing.push('NO_SAMPLED_'+a);
 if(total.planets!==rows.length)total.issues++;
 if(total.planetModeledLiquidH2O+total.planetModeledAbsentH2O+total.planetUnknownH2O!==total.planets)total.issues++;
 if(total.moons!==total.detailedMoons+total.identityOnlyMoons)total.issues++;
 if(total.moonModeledLiquidH2O+total.moonModeledAbsentH2O+total.moonUnknownH2O!==total.detailedMoons)total.issues++;
 if(total.unresolvedNH3!==total.moons||total.unresolvedCH4!==total.moons)total.issues++;
 const result={contract:'PRE-33.11a/V3-GALACTIC-ENVIRONMENT/v1',seed,
  sampling:'Deterministic ring/quadrant system discovery; NONPROBABILISTIC, NOT a galactic census',
  totals:total,byRegion,byRegionEnvironment,byRegionFamily,byArchitecture,byPlanetFamily,gradients,galaxies,missingStrata:missing,
  physicalCausality:'GALAXY_BASELINE_TO_SECTOR_RADIAL_METALLICITY_TO_17_FORMATION_PROFILE',
  solventPolicy:{H2O:'32.F.2c simulated moon CT-0 phase only; NOT liquid on a planet inferred from its phenotype',
    NH3:'UNKNOWN: no independent liquid NH3 P-T/composition model',CH4:'UNKNOWN: no independent liquid CH4 P-T/composition model',
    all:'Reaction reactants, actual chemical power, ionising dose, historic continuity and LIFE remain NOT_EVALUATED'},
  scientificLimits:['No global life probabilities or artificial quotas. Galaxy radial metallicity is a characteristic proxy, not per-star elemental measurements.',
    'Galactic radial/age gradients are existing V1 physics reused through private frozen source, not a newly calibrated V3 law.',
    'Zero OCEAN phenotype does not imply zero liquid water; 32.F.2c is CT-0 constitutive model, not observation.',
    'Lunar identity-only population is not sterile. Biological evaluation is deferred, not automatically positive.',
    'Sector/system clustering invalidates treating planets as independent draws; PRE-33.11b handles calibration and representative sampling.',
    'Extreme/compact host prevalence is from separate PRE-33.11 panel and cannot be folded into these spatial proportions.',
    'No public discovery, persistent saves or V1/V2/V3 generative outcomes are written or modified.'],
  verdict:total.issues?'PRE33_11A_BLOCKED':TAG};
 fs.mkdirSync(dir,{recursive:true});
 const body=JSON.stringify(result,null,2)+'\n';
 fs.writeFileSync(path.join(dir,'pre33-11a-auditoria.json'),body);
 fs.writeFileSync(path.join(dir,'pre33-11a-por-planeta.csv'),columns.join(',')+'\n'+rows.join('\n')+'\n');
 const sha=crypto.createHash('sha256').update(body).digest('hex');
 const lines=['# GENESIS Web — PRE-33.11a · Distribución galáctica física y rutas bioquímicas', '',
  `Veredicto: **${result.verdict}** · SHA256 JSON: \`${sha}\``, '',
  '## Universo simulado y cobertura',
  '| Galaxia | Sistemas | Planetas | Lunas detalladas | Solo identidad | H₂O líquida CT-0 | Incidencias |',
  '|---|---:|---:|---:|---:|---:|---:|',
  ...galaxies.map(g=>`| ${g.galaxy} | ${g.systems} | ${g.planets} | ${g.detailedMoons} | ${g.identityOnlyMoons} | ${g.moonModeledLiquidH2O} | ${g.issues} |`),
  `| **TOTAL** | **${total.systems}** | **${total.planets}** | **${total.detailedMoons}** | **${total.identityOnlyMoons}** | **${total.moonModeledLiquidH2O}** | **${total.issues}** |`, '',
  `Regiones galácticas (planetas, no sectores): ${JSON.stringify(byRegion)}.`,
  `Arquitecturas: ${JSON.stringify(byArchitecture)}. Familias: ${JSON.stringify(byPlanetFamily)}.`,
  `Distribución de entornos por región (solvente H₂O CT-0): ${JSON.stringify(byRegionEnvironment)}.`,
  `Familias por región: ${JSON.stringify(byRegionFamily)}.`, '',
  '## Cadena causal espacial',
  'Gradiente radial del sector 5.x → metallicidad estelar característica → perfil de formación 17.x → composición planetaria 19.x. No se modifican parámetros ni cuotas.',
  ...galaxies.map(g=>`- ${g.galaxy}: metallicidad de sector Z/Z☉ ${g.minMetallicity?.toPrecision(4)??'N/A'}–${g.maxMetallicity?.toPrecision(4)??'N/A'}; ${g.radialMonotonicityIssues} incoherencias de gradiente radial; sectores ${g.sampledSectors}.`),'',
  '## Tres posibilidades de solvente, sin imponer bioquímica terrestre',
  `- H₂O planetaria CT-0: ${total.planetModeledLiquidH2O} cuerpos con líquido modelado, ${total.planetModeledAbsentH2O} sin líquido modelado, ${total.planetUnknownH2O} no resueltos.`,
  `- H₂O lunar: ${total.moonModeledLiquidH2O} nichos lunares con líquido en el modelo CT-0; ${total.moonModeledAbsentH2O} ausentes; ${total.moonUnknownH2O} no resueltos; ${total.identityOnlyMoons} lunas solo identidad sin fase evaluada.`,
  `- NH₃ y CH₄: fase líquida NO RESUELTA en ${total.moons} lunas cada una, no falsamente descartada.`,
  '- No se afirma disponibilidad de reactivos, tasas, dosis segura, estabilidad histórica ni vida.', '',
  '## Hallazgos ausentes',...(missing.map(s=>'- '+s).length?missing.map(s=>'- '+s):['- Ninguno en los estratos auditados.']),'',
  '## Límites científicos',...result.scientificLimits.map(x=>'- '+x),'',
  'La muestra es determinista y estratificada por sectores; no permite inferir frecuencias poblacionales galácticas. La calibración corresponde a PRE-33.11b; vida efectiva continúa bloqueada hasta PRE-33.13.'];
 fs.writeFileSync(path.join(dir,'pre33-11a-informe.md'),lines.join('\n')+'\n');
 console.log(result.verdict,sha);return result;
}
function main(argv=process.argv.slice(2)){
 const args=parse(argv), galaxies=[],rows=[];
 if(args.galaxies.length>1){
  for(const gi of args.galaxies){const dir=path.join(args.out,'.galaxy-'+gi);
   const child=cp.spawnSync(process.execPath,[__filename,'--seed='+args.seed,'--galaxies='+gi,
    '--systems-per-galaxy='+args.systems,'--out='+dir,...(args.strict?['--strict']:[])],
    {cwd:process.cwd(),encoding:'utf8',maxBuffer:24*1024*1024});
   if(child.stdout)process.stdout.write(child.stdout);if(child.stderr)process.stderr.write(child.stderr);
   if(child.status!==0||child.error)throw new Error('GALAXY_AUDIT_FAILED_'+gi+'_'+(child.error||child.status));
   const r=JSON.parse(fs.readFileSync(path.join(dir,'pre33-11a-auditoria.json'),'utf8'));
   galaxies.push(...r.galaxies);
   rows.push(...fs.readFileSync(path.join(dir,'pre33-11a-por-planeta.csv'),'utf8').trim().split('\n').slice(1));
  }
  return summarize(galaxies,rows,args.seed,args.out);
 }
 register();
 const {UniverseSeed}=load('domain/universe/universe-seed');
 const {UniverseGenerationKey}=load('domain/generation/universe-generation-key');
 const {GeneratorVersion}=load('domain/generation/generator-version');
 const {GalaxyGenerator}=load('simulation/universe/galaxy-generator');
 const {GalaxySectorGridGenerator}=load('simulation/sector/galaxy-sector-grid-generator');
 const {GalaxySectorContentGenerator}=load('simulation/sector/galaxy-sector-content-generator');
 const {GalaxySectorCoordinates}=load('domain/sector/galaxy-sector-coordinates');
 const {StellarMultihostFormation}=load('simulation/stellar/stellar-multihost-formation');
 const {GalacticEnvironmentDistributionPRE3311a:Projection}=load('simulation/planetary/galactic-environment-distribution-pre33-11a');
 const {PlanetH2OV3FormationOrigin:Origin}=load('simulation/planetary/planet-h2o-v3-formation-origin');
 const {PlanetH2OForwardCT0EnginePRE3303A3:Forward}=load('simulation/planetary/planet-h2o-forward-ct0-pre33-03a3');
 const key=new UniverseGenerationKey(UniverseSeed.parse(args.seed),GeneratorVersion.V3);
 for(const gi of args.galaxies){
  const galaxy=GalaxyGenerator.generate(key,BigInt(gi));
  const grid=GalaxySectorGridGenerator.generate(galaxy);
  const posList=makeCandidates(args.seed,gi,grid.halfExtentInSectors,Math.max(1500,args.systems*100));
  const g={galaxy:galaxy.designation.name,galaxyIndex:gi,systems:0,planets:0,planetModeledLiquidH2O:0,planetModeledAbsentH2O:0,planetUnknownH2O:0,detailedMoons:0,
    identityOnlyMoons:0,moons:0,moonModeledLiquidH2O:0,moonModeledAbsentH2O:0,moonUnknownH2O:0,
    unresolvedNH3:0,unresolvedCH4:0,issues:0,sampledSectors:0,minRadius:null,maxRadius:null,
    minMetallicity:null,maxMetallicity:null,radialMonotonicityIssues:0,
    byRegion:{},byRegionEnvironment:{},byRegionFamily:{},byArchitecture:{},byPlanetFamily:{},errors:[]};
  const spatial=[];
  for(const pos of posList){if(g.systems>=args.systems)break;
   const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(pos.x,pos.y));
   if(!sector.systemLocators.length)continue;
   g.sampledSectors++;
   const loc=sector.systemLocators[parseInt(identity([String(gi),pos.x,pos.y,'SYSTEM_INDEX']).slice(0,8),16)%sector.systemLocators.length];
   try{
    const env=Projection.sector(galaxy,sector);
    spatial.push({radius:Math.min(1,env.normalizedRadius),metal:env.sectorMetallicitySolarRatio});
    g.minRadius=Math.min(g.minRadius??env.normalizedRadius,env.normalizedRadius);
    g.maxRadius=Math.max(g.maxRadius??env.normalizedRadius,env.normalizedRadius);
    g.minMetallicity=Math.min(g.minMetallicity??env.sectorMetallicitySolarRatio,env.sectorMetallicitySolarRatio);
    g.maxMetallicity=Math.max(g.maxMetallicity??env.sectorMetallicitySolarRatio,env.sectorMetallicitySolarRatio);
    const multi=StellarMultihostFormation.generateOrNull(key,loc);
    const single=multi?null:StellarMultihostFormation.generateSingleOrNull(key,loc);
    if(!multi&&!single)throw Error('NO_SYSTEM');
    const arch=multi?multi.multiplicity.name:'SINGLE';add(g.byArchitecture,arch);
    const worlds=multi?multi.publicPlanets.map(w=>({planet:w.planet,moonSystem:w.moonSystem,atmosphere:w.atmosphere,host:w.host})):
      single.planets.map((planet,i)=>({planet,moonSystem:single.moonSystems[i],atmosphere:single.atmospheres[i],host:'A'}));
    const sectorKey=env.sectorKey;
    for(const w of worlds){
      if(!w.atmosphere)throw Error('MISSING_PLANET_ATMOSPHERE');
      const source=Origin.sourceForPlanet(w.planet);
      if(!source)throw Error('MISSING_PLANET_V3_FORMATION_ORIGIN');
      const forward=Forward.project(w.planet,w.atmosphere,Origin.environmentForPlanet(w.planet,w.atmosphere));
      const r=Projection.planet(w.planet,w.moonSystem,env,arch,w.host,forward);
      if(r.issues.length)throw Error('PLANET_'+r.issues.join('+'));
      if(r.sectorKey!==sectorKey||r.biosphere!=='NOT_EVALUATED')throw Error('GALACTIC_IDENTITY');
      const planetPhase=r.routes[0].phase;
      if(planetPhase==='CT0_LIQUID_IN_SIMULATED_MODEL')g.planetModeledLiquidH2O++;
      else if(planetPhase==='CT0_LIQUID_ABSENT_IN_SIMULATED_MODEL')g.planetModeledAbsentH2O++;
      else g.planetUnknownH2O++;
      const count={present:0,absent:0,unknown:0};
      for(const moon of w.moonSystem.relevantMoons){
        const m=Projection.moon(moon,env);
        if(m.issues.length||m.biosphere!=='NOT_EVALUATED')throw Error('MOON_PROJECTION_INVALID');
        if(m.routes.length!==SOLVENTS.length||m.routes.some(x=>x.life!=='NOT_EVALUATED'||x.observed))throw Error('BIOLOGICAL_LEAK');
        if(m.routes[0].phase==='CT0_LIQUID_IN_SIMULATED_MODEL')count.present++;
        else if(m.routes[0].phase==='CT0_LIQUID_ABSENT_IN_SIMULATED_MODEL')count.absent++;
        else count.unknown++;
      }
      for(const id of w.moonSystem.moonIdentities.slice(w.moonSystem.relevantMoonCount)){
        const m=Projection.minorMoon(w.planet.planetOrdinal,id.moonOrdinal,env);
        if(m.bodyKind!=='MOON_IDENTITY_ONLY'||m.routes.some(x=>x.phase!=='IDENTITY_ONLY_NOT_CHARACTERIZED'&&x.solvent==='H2O'))throw Error('MINOR_MOON_EVIDENCE_LEAK');
      }
      g.planets++;g.moons+=w.moonSystem.moonCount;g.detailedMoons+=w.moonSystem.relevantMoonCount;
      g.identityOnlyMoons+=w.moonSystem.unmaterializedMinorMoonCount;
      g.moonModeledLiquidH2O+=count.present;g.moonModeledAbsentH2O+=count.absent;g.moonUnknownH2O+=count.unknown;
      g.unresolvedNH3+=w.moonSystem.moonCount;g.unresolvedCH4+=w.moonSystem.moonCount;
      add(g.byRegion,env.region);add(g.byPlanetFamily,r.family);
      add(g.byRegionFamily,env.region+'/'+r.family);
      const reg=g.byRegionEnvironment[env.region]??(g.byRegionEnvironment[env.region]={});
      add(reg,'planets');add(reg,'detailedMoons',w.moonSystem.relevantMoonCount);
      add(reg,'identityOnlyMoons',w.moonSystem.unmaterializedMinorMoonCount);
      add(reg,'moonLiquidH2O',count.present);add(reg,'moonUnknownH2O',count.unknown);
      if(planetPhase==='CT0_LIQUID_IN_SIMULATED_MODEL')add(reg,'planetLiquidH2O');
      if(planetPhase==='UNRESOLVED_PHASE_OR_INVENTORY')add(reg,'planetUnknownH2O');
      rows.push(csv(g.galaxy,env.region,env.normalizedRadius,`${pos.x>=0?'+':'-'}${pos.y>=0?'+':'-'}`,
        `${pos.x}:${pos.y}`,String(loc.galacticObjectIndex),arch,w.host,w.planet.planetOrdinal,
        r.family,r.niche,env.sectorMetallicitySolarRatio,env.solidMaterialIndex,env.giantFormationPropensity,
        w.moonSystem.relevantMoonCount,w.moonSystem.unmaterializedMinorMoonCount,
        count.present,count.unknown,planetPhase,w.moonSystem.moonCount,w.moonSystem.moonCount,'NOT_EVALUATED'));
    }
    g.systems++;
   }catch(e){g.issues++;g.errors.push({sector:`${pos.x}:${pos.y}`,message:String(e?.stack||e)});}
  }
  spatial.sort((a,b)=>a.radius-b.radius);
  for(let i=1;i<spatial.length;i++)if(spatial[i].metal>spatial[i-1].metal+1e-10){g.radialMonotonicityIssues++;g.issues++;}
  if(g.systems!==args.systems){g.issues++;g.errors.push({message:'INCOMPLETE_SECTOR_SAMPLE'});}
  console.log(`${g.galaxy}: ${g.systems} systems, ${g.planets} planets, ${g.moons} moons; ${g.moonModeledLiquidH2O} CT0 aqueous lunar niches; ${g.issues} issues`);
  galaxies.push(g);
 }
 const out=summarize(galaxies,rows,args.seed,args.out);
 if(args.strict&&out.totals.issues)process.exitCode=1;
 return out;
}
if(require.main===module)main();module.exports={main,summarize,TAG,SOLVENTS};
