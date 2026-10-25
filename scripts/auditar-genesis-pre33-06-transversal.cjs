#!/usr/bin/env node
'use strict';
/** Read-only deterministic V3 atmosphere audit for BOTH planets and moons. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const {makeCandidates,identity}=require('./pre33/pre33-audit-core.cjs');
const {parse}=require('./auditar-genesis-pre33-03a2a.cjs');
const C='PRE-33.06/V3-CROSS-BODY-ATMOSPHERIC-CLOSURE/v1';
const register=()=>{const ts=require('typescript');if(!require.extensions['.ts'])require.extensions['.ts']=(m,f)=>
 m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);};
const load=p=>require(path.resolve('src/app',p));
const counts=()=>({systems:0,planets:0,moons:0,planetClosed:0,moonClosed:0,unresolvedPlanet:0,
 unresolvedMoon:0,deepEnvelope:0,conditionalPlanet:0,conditionalMoon:0,epochPlanet:0,epochMoon:0,v3EvidencePlanet:0,v3EvidenceMoon:0,eligiblePlanetEvidenceSystems:0,eligibleMoonEvidenceSystems:0,v3PlanetProjections:0,v3MoonProjections:0,v2IsolatedPlanet:0,v2IsolatedMoon:0});
function record(status,row,body,stats){
 if(row?.contract!==C)throw Error('INVALID_TRANSVERSE_CONTRACT');
 if(row.bodyKind!==body)throw Error('INCORRECT_BODY_KIND');
 if(row.observedPressure!==false||row.biologyAuthorized!==false||row.atmospherePresenceObserved!==false)
  throw Error('FALSE_OBSERVATIONAL_BIOLOGY_CERTIFICATION');
 if(row.causalModelPressurePascal!==null){
  if(status!=='CAUSAL_INTERVAL_MODEL_RESOLVED'||!row.inventorySourceId||!row.ratesSourceId||!row.exobaseSourceId)
    throw Error('PHYSICAL_PRESSURE_WITHOUT_CAUSAL_PROVENANCE');
  const sum=row.causalModelPartialsPascal.reduce((s,v)=>s+v.pressurePascal,0);
  if(Math.abs(sum-row.causalModelPressurePascal)>1e-8*Math.max(1,sum))throw Error('PARTIAL_PRESSURE_CONSERVATION');
  stats[body==='PLANET'?'planetClosed':'moonClosed']++;
 }else if(body==='PLANET'&&status==='NO_SOLID_SURFACE_REFERENCE'){
  stats.deepEnvelope++;
 }else{
  stats[body==='PLANET'?'unresolvedPlanet':'unresolvedMoon']++;
 }
 if(!row.inventorySourceId&&(row.initialGasKilograms!==null||row.causalModelPressurePascal!==null||
  row.suppliedKilograms!==null))throw Error('LEGACY_SCENARIO_PROMOTED_TO_PHYSICAL_INVENTORY');
 if(row.relativeMassResidual01!==null&&row.relativeMassResidual01>1e-7)throw Error('MASS_NOT_CONSERVED');
 if(row.historyEpochs?.length){
   if(!row.initialGasKilograms&&row.suppliedKilograms===null)throw Error('EMPTY_FORWARD_HISTORY');
   if(row.inventorySourceId?.includes('PHASE_20'))throw Error('PRESSURE_BACKFILL');
   stats[body==='PLANET'?'epochPlanet':'epochMoon']++;
   if(row.assumedChemistry==='UNIDENTIFIED_LUNAR_VOLATILE_ENDMEMBER'&&row.causalModelPressurePascal!==null)
     throw Error('UNIDENTIFIED_LUNAR_SPECIATION_FALSIFIED_AS_RESOLVED');
 }
 if(row.status==='CONDITIONAL_FORWARD_SCENARIO')stats[body==='PLANET'?'conditionalPlanet':'conditionalMoon']++;
}
function aggregate(galaxies){const total=counts();let errors=0;for(const g of galaxies){
  for(const k of Object.keys(total))total[k]+=g[k];errors+=g.errors.length;
 }return {...total,errors};}
function persist(out,galaxies,rows){
 const totals=aggregate(galaxies);fs.mkdirSync(out,{recursive:true});
 const result={contract:'PRE-33.06/V3-TRANSVERSAL-AUDIT/v1',
  sample:'Selected deterministic sector systems; not a galactic census',
  evidenceSampling:'PRE-33.01 sampled by system/stratum, all 1092 V3 fiches and V2 isolation exhaustive',
  totals,galaxies,scientificResult:'FORMATION_DRIVEN_PROCEDURAL_CT0_WITH_UNCERTAINTY_AND_MASS_CONSERVATION',
  verdict:totals.errors?'PRE33_06_TRANSVERSAL_AUDIT_BLOCKED':'PRE33_06_TRANSVERSAL_FORMATION_EVOLUTION_AUDITED'};
 const json=JSON.stringify(result,null,2)+'\n';
 fs.writeFileSync(path.join(out,'pre33-06-transversal-auditoria.json'),json);
 fs.writeFileSync(path.join(out,'pre33-06-transversal-por-cuerpo.csv'),
  'galaxia,sector,planeta,luna,tipo,estado,presionEscenarioPa,presionCausalPa,presionProceduralCondicionalPa,inventarioInicialKg,reservorioMaxCondicionalKg,fuenteInicial,fuenteTasas,fuenteExobase,epocasCT0,especiacion\n'+rows.join('\n')+'\n');
 fs.writeFileSync(path.join(out,'pre33-06-transversal-informe.md'),
  '# GENESIS Web — PRE-33.06, auditoría atmosférica planetas y lunas\n\n'+result.verdict+'\n\n'+
  '| Galaxia | Sistemas | Planetas | Lunas | Presiones planetarias causales | Presiones lunares causales | Incidencias |\n'+
  '|---|---:|---:|---:|---:|---:|---:|\n'+galaxies.map(g=>
  `| ${g.galaxy} | ${g.systems} | ${g.planets} | ${g.moons} | ${g.planetClosed} | ${g.moonClosed} | ${g.errors.length} |`).join('\n')+
  '\n\n**Interpretación:** el historial gaseoso CT-0 se genera desde masa de formación y abundancias solares parametrizadas. NO es una medición ni una prueba biológica. '+
  'La especiación lunar de otros condensables es condicional (32.F.1d): NO autoriza presión física mientras su composición sea desconocida. '+
  'Los mundos con exobase fuera de dominio conservan estado no resuelto. Ninguna cifra 20.x/21.x alimenta el inventario primordial. '+
  'Las envolturas profundas no disponen de una presión ficticia de superficie sólida.\n');
 console.log(result.verdict+' SHA256 '+crypto.createHash('sha256').update(json).digest('hex'));
 return result;
}
function main(argv=process.argv.slice(2)){
 const opts=parse(argv);
 if(opts.galaxies.length>1){
  const galaxies=[],rows=[];
  for(const gi of opts.galaxies){
   const folder=path.join(opts.out,'.transversal-g'+gi);
   const args=[__filename,'--seed='+opts.seed,'--galaxies='+gi,'--systems-per-galaxy='+opts.systems,
      '--out='+folder];if(opts.strict)args.push('--strict');
   const sub=cp.spawnSync(process.execPath,args,{encoding:'utf8',maxBuffer:16*1024*1024,env:process.env});
   if(sub.stdout)process.stdout.write(sub.stdout);if(sub.stderr)process.stderr.write(sub.stderr);
   if(sub.status!==0||sub.error)throw Error('Galaxy '+gi+' failed '+(sub.error||sub.status));
   galaxies.push(...JSON.parse(fs.readFileSync(path.join(folder,'pre33-06-transversal-auditoria.json'),'utf8')).galaxies);
   rows.push(...fs.readFileSync(path.join(folder,'pre33-06-transversal-por-cuerpo.csv'),'utf8').trim().split('\n').slice(1));
  }
  return persist(opts.out,galaxies,rows);
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
 const {PlanetScientificTargetResolver:Resolver}=load('simulation/planetary/planet-scientific-target-resolver.ts');
 const {AtmosphereV3FormationEvolutionPRE3306:Engine}=load('simulation/planetary/atmosphere-v3-formation-evolution-pre33-06.ts');
 const {PlanetH2OV3FormationOrigin:Origin}=load('simulation/planetary/planet-h2o-v3-formation-origin.ts');
 const {EnvironmentalPhysicalProjectionPRE3301:Evidence}=load('simulation/planetary/environmental-physical-projection-pre33-01.ts');
 const key=new UniverseGenerationKey(UniverseSeed.parse(opts.seed),GeneratorVersion.V3);
 const galaxies=[],rows=[];
 for(const gi of opts.galaxies){
  const galaxy=GalaxyGenerator.generate(key,BigInt(gi));
  const grid=GalaxySectorGridGenerator.generate(galaxy);
  const candidates=makeCandidates(opts.seed,gi,grid.halfExtentInSectors,Math.max(1500,opts.systems*100));
  const g={galaxy:galaxy.designation.name,galaxyIndex:gi,...counts(),errors:[]};
  for(const pos of candidates){
   if(g.systems>=opts.systems)break;
   const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(pos.x,pos.y));
   if(!sector.systemLocators.length)continue;
   const loc=sector.systemLocators[parseInt(identity([String(gi),pos.x,pos.y,'SYSTEM_INDEX']).slice(0,8),16)%sector.systemLocators.length];
   try{
    const multi=StellarMultihostFormation.generateOrNull(key,loc);
    const single=multi?null:StellarMultihostFormation.generateSingleOrNull(key,loc);
    if(!multi&&!single)throw Error('MISSING_STELLAR_SYSTEM');
    const worlds=multi?.publicPlanets??single.planets.map((planet,i)=>({
      planet,atmosphere:single.atmospheres[i],moonSystem:single.moonSystems[i]}));
    g.systems++;
    if(worlds.length>0)g.eligiblePlanetEvidenceSystems++;
    if(worlds.some(w=>(w.moonSystem?.relevantMoons?.length??0)>0))g.eligibleMoonEvidenceSystems++;
    // PRE-33.01 is validated on deterministic stratified samples; every V3/V2
    // fiche and every physical mass ledger are still checked exhaustively.
    let sampledMoonEvidence=false;
    for(const [index,row] of worlds.entries()){
      const {planet,atmosphere,moonSystem}=row;
      if(!atmosphere||!moonSystem)throw Error('INCOMPLETE_PLANET_MATERIALIZATION');
      g.planets++;
      const origin=Origin.sourceForPlanet(planet);
      const p=Engine.planet(planet,atmosphere,origin);
      record(p.status,p,'PLANET',g);
      // First body of each system, every causal case and one per 17 bodies:
      // evidence probes cannot accidentally omit modelled pressures.
      if(index===0||index%17===0||p.causalModelPressurePascal!==null){
        const ev=Evidence.planet(planet,atmosphere);
        if(ev.lifeEvaluated!==false||
            (p.causalModelPressurePascal!==null)!==
            (ev.atmosphere.physicallySupportedSurfacePressurePascal.source==='ATMOSPHERE_V3_FORMATION_CT0'&&
             ev.atmosphere.physicallySupportedSurfacePressurePascal.state==='MODELLED_CT0'))
          throw Error('PRE33_01_V3_PLANET_CAUSAL_EVIDENCE_MISMATCH '+p.status+' / '+JSON.stringify(ev.atmosphere.physicallySupportedSurfacePressurePascal));
        g.v3EvidencePlanet++;
      }
      rows.push([g.galaxy,`S${pos.x}:${pos.y}`,index+1,'','PLANET',p.status,p.scenarioPressurePascal,
        p.causalModelPressurePascal,p.candidateForwardPressurePascal,p.initialGasKilograms,p.conditionalVolatileReservoirCeilingKilograms,
        p.inventorySourceId,p.ratesSourceId,p.exobaseSourceId,p.historyEpochs?.length??0,p.assumedChemistry].map(x=>JSON.stringify(x??'')).join(','));
      const ident={locator:row.publicLocator??planet.locator,planetOrdinal:index+1,
       designation:`Audit-${index+1}`,hostSystemDesignation:galaxy.designation.name,
       orbitTopology:planet.hostPlanetarySystem.architecture.orbitTopology,hostPlanetCount:worlds.length};
      const v3=Resolver.projectGenerated(ident,planet,atmosphere,moonSystem,undefined,undefined,3);
      const v3p=v3.detail.atmosphere.closurePRE3306;
      if(!v3p||JSON.stringify(v3p)!==JSON.stringify(p))
        throw Error('V3_PLANET_ATMOSPHERE_CONTRACT_CHANGED');
      recordChecks(v3p,'PLANET');g.v3PlanetProjections++;
      if(v3.detail.moons.relevantMoons.length!==moonSystem.relevantMoons.length)
        throw Error('V3_LUNAR_COUNT_MISMATCH');
      for(const [j,moon] of moonSystem.relevantMoons.entries()){
        const m=Engine.moon(moon.physicalProperties,moon.environmentState.atmosphereAssessment,
          moon.formationInventory32F1d??null,planet,origin,moon.environmentState.equilibriumTemperatureKelvin);
        record(m.status,m,'MOON',g);g.moons++;
        // First lunar body per system plus stratified additional probes;
        // V3 scientific fiche comparison below ALWAYS covers every moon.
        if(!sampledMoonEvidence||(index%3===0&&j%25===0)){
          const em=Evidence.moon(moon,planet);
          if(em.lifeEvaluated!==false||
            (em.atmosphere.physicallySupportedSurfacePressurePascal.source==='ATMOSPHERE_V3_FORMATION_CT0'&&
             em.atmosphere.physicallySupportedSurfacePressurePascal.state==='MODELLED_CT0')!==
              (m.causalModelPressurePascal!==null))
            throw Error('PRE33_01_V3_MOON_CAUSAL_EVIDENCE_MISMATCH');
          g.v3EvidenceMoon++;
          sampledMoonEvidence=true;
        }
        const projection=v3.detail.moons.relevantMoons[j].atmosphereClosurePRE3306;
        if(JSON.stringify(m)!==JSON.stringify(projection))throw Error('V3_LUNAR_ATMOSPHERE_FICHE_MISMATCH');
        g.v3MoonProjections++;
        rows.push([g.galaxy,`S${pos.x}:${pos.y}`,index+1,moon.moonOrdinal,'MOON',m.status,
          m.scenarioPressurePascal,m.causalModelPressurePascal,m.candidateForwardPressurePascal,m.initialGasKilograms,
          m.conditionalVolatileReservoirCeilingKilograms,m.inventorySourceId,m.ratesSourceId,m.exobaseSourceId,m.historyEpochs?.length??0,m.assumedChemistry]
          .map(x=>JSON.stringify(x??'')).join(','));
      }
      const v2=Resolver.projectGenerated(ident,planet,atmosphere,moonSystem,undefined,undefined,2);
      if(v2.detail.atmosphere.closurePRE3306!==null)throw Error('V2_PLANET_LEAK');
      g.v2IsolatedPlanet++;
      for(const m of v2.detail.moons.relevantMoons){
        if(m.atmosphereClosurePRE3306!==null)throw Error('V2_LUNAR_LEAK');
        g.v2IsolatedMoon++;
      }
    }
   }catch(e){g.errors.push({sector:`${pos.x},${pos.y}`,error:String(e.stack||e)});}
  }
  if(g.systems!==opts.systems||g.v3PlanetProjections!==g.planets||g.v2IsolatedPlanet!==g.planets||
    g.v3MoonProjections!==g.moons||g.v2IsolatedMoon!==g.moons||
    g.v3EvidencePlanet<g.eligiblePlanetEvidenceSystems||g.v3EvidencePlanet>g.planets||
    g.v3EvidenceMoon<g.eligibleMoonEvidenceSystems||g.v3EvidenceMoon>g.moons||
    g.planetClosed+g.unresolvedPlanet+g.deepEnvelope!==g.planets||g.moonClosed+g.unresolvedMoon!==g.moons)
    g.errors.push({sector:'SUMMARY',error:'INCOMPLETE_TRANSVERSAL_AUDIT'});
  galaxies.push(g);
  console.log(`${g.galaxy}: ${g.systems} sistemas, ${g.planets} planetas, ${g.moons} lunas, ${g.errors.length} incidencias`);
 }
 const result=persist(opts.out,galaxies,rows);if(opts.strict&&result.totals.errors)process.exitCode=1;
 return result;
}
function recordChecks(r,kind){
 if(r.bodyKind!==kind||r.observedPressure!==false||r.biologyAuthorized!==false)throw Error('BAD_PROJECTION_EVIDENCE');
 if(r.causalModelPressurePascal!==null&&!r.inventorySourceId)throw Error('CAUSAL_PRESSURE_WITHOUT_FORMATION');
}
if(require.main===module)main();
module.exports={main,recordChecks,aggregate};
