#!/usr/bin/env node
'use strict';
/** PRE-33.06 V3 read-only audit: inventories and mass/flux provenance, scenario
 * separation, photolysis/exobase limits, projection and V2 noninterference. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const {makeCandidates,identity}=require('./pre33/pre33-audit-core.cjs');
const {parse}=require('./auditar-genesis-pre33-03a2a.cjs');
const register=()=>{const ts=require('typescript');if(!require.extensions['.ts'])require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true,useDefineForClassFields:false}}).outputText,f);};
const load=p=>require(path.resolve('src/app',p));
const close=(a,b)=>Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b));
function validate(model,physical,source) {
 const errors=[];
 const bad=(test,code)=>{if(test)errors.push(code);};
 bad(model.contractVersion!=='PRE-33.06/V3-INDEPENDENT-LUNAR-ATMOSPHERE/v1','CONTRACT');
 bad(model.hostPlanetOrdinal!==physical.hostPlanetOrdinal||model.moonOrdinal!==physical.moonOrdinal,'IDENTITY');
 bad(model.actualAtmospherePresenceCertified!==false||model.physicalSurfacePressureObserved!==false||
  model.historicalPersistenceCertified!==false,'FALSE_CERTIFICATION');
 const kgPerPa=4*Math.PI*(physical.radiusEarth*6371000)**2/(physical.surfaceGravityEarth*9.80665);
 bad(!close(model.kilogramsOfGasPerPascal,kgPerPa),'GEOMETRY');
 const scenario=(source?.pressureBasis==='CONDITIONAL_SCENARIO'&&source.estimatedSurfacePressurePascal!==null)
  ?source.estimatedSurfacePressurePascal:null;
 bad(scenario!==model.scenarioPressurePascal,'SCENARIO_ORIGIN');
 bad(scenario===null?model.scenarioEquivalentGasMassKilograms!==null:
  !close(model.scenarioEquivalentGasMassKilograms,scenario*kgPerPa),'CONDITIONAL_EQUIVALENT_MASS');
 const independent=source?.physicalBalance32F1?.sourceKind==='INDEPENDENT_MASS_AND_FLUXES'
  ?source.physicalBalance32F1:null;
 bad(model.independentSourceId!==(independent?.sourceId??null),'INDEPENDENT_SOURCE_ORIGIN');
 bad(model.physicalSurfacePressurePascal!==null && model.status!=='INDEPENDENT_INTERVAL_MODEL_NOT_OBSERVATION','UNAUTHORIZED_PHYSICAL_PRESSURE');
 bad(model.physicalSurfacePressurePascal!==null && model.independentExobaseSourceId===null,'MISSING_EXOBASE_EVIDENCE');
 bad(model.independentSourceId===null && (model.initialGasMassKilograms!==null||model.replenishedMassKilograms!==null||
    model.thermalEscapeMassKilograms!==null||model.particleEscapeMassKilograms!==null),'V1_LEAK_INTO_RATES');
 bad(model.independentSourceId===null && model.status!=='MISSING_INDEPENDENT_GAS_INVENTORY','UNJUSTIFIED_ATMOSPHERE');
 if(model.independentSourceId===null)bad(model.physicalSurfacePressurePascal!==null,'INVENTED_PRESSURE');
 if(model.physicalSurfacePressurePascal!==null)bad(!close(model.physicalSurfacePressurePascal,
  model.physicalPartialPressuresPascal.reduce((s,g)=>s+g.pressurePascal,0)),'PARTIAL_PRESSURE_CLOSURE');
 return errors;
}
function aggregate(galaxies){
 const totals={systems:0,planets:0,moons:0,independentPressureResolved:0,
  missingIndependentInventory:0,missingIndependentExobase:0,otherUnresolved:0,
  publicV3Projected:0,legacyV2Isolated:0,errors:0};
 for(const g of galaxies){for(const key of Object.keys(totals)){
  if(key==='errors')totals.errors+=g.errors.length;else totals[key]+=g[key];
 }}return totals;
}
function save(o,galaxies,rows){
 const totals=aggregate(galaxies);
 const result={contract:'PRE-33.06/V3-LUNAR-ATMOSPHERE-INDEPENDENT-AUDIT/v1',seed:o.seed,
  version:'V3',sample:'Selected sectors, not a complete galactic census',totals,galaxies,
  pressureCertificate:'ONLY_INDEPENDENT_INVENTORY_FLUXES_AND_EXOBASE_IN_DOMAIN',
  verdict:totals.errors?'PRE33_06_AUDIT_BLOCKED':'PRE33_06_V3_INDEPENDENT_ATMOSPHERE_AUDITED'};
 fs.mkdirSync(o.out,{recursive:true});
 const json=JSON.stringify(result,null,2)+'\n';
 fs.writeFileSync(path.join(o.out,'pre33-06-auditoria.json'),json);
 fs.writeFileSync(path.join(o.out,'pre33-06-balance-por-luna.csv'),
  'galaxy,systemSector,planetOrdinal,moonOrdinal,status,scenarioPa,physicalPa,sourceId,exobaseSourceId\n'+
  rows.map(r=>r.map(x=>JSON.stringify(x??'')).join(',')).join('\n')+'\n');
 fs.writeFileSync(path.join(o.out,'pre33-06-informe.md'),
  '# PRE-33.06 — Balance atmosférico lunar V3\n\n'+result.verdict+'\n\n'+
  galaxies.map(g=>`- ${g.galaxy}: ${g.systems} sistemas, ${g.planets} planetas, ${g.moons} lunas; ${g.independentPressureResolved} presiones físicas autorizadas, ${g.missingIndependentInventory} inventarios sin resolver, ${g.errors.length} incidencias.`).join('\n')+
  '\n\nEl inventario de H₂O y los índices de retención no implican una atmósfera conocida. La presión condicional y su masa equivalente no justifican por sí mismas una presión física.\n');
 console.log(result.verdict+' SHA-256 '+crypto.createHash('sha256').update(json).digest('hex'));
 if(o.strict&&totals.errors)process.exitCode=1;
 return result;
}
function main(argv=process.argv.slice(2)){
 const o=parse(argv);
 if(o.galaxies.length>1){
  const galaxies=[],rows=[];
  for(const gi of o.galaxies){
   const folder=path.join(o.out,'.pre33-06-galaxy-'+gi);
   const args=[__filename,'--seed='+o.seed,'--galaxies='+gi,
    '--systems-per-galaxy='+o.systems,'--out='+folder];
   if(o.strict)args.push('--strict');
   const sub=cp.spawnSync(process.execPath,args,{encoding:'utf8',maxBuffer:16*1024*1024,env:process.env});
   if(sub.stdout)process.stdout.write(sub.stdout);
   if(sub.stderr)process.stderr.write(sub.stderr);
   if(sub.error||sub.status!==0)throw Error('Galaxy '+gi+' failed: '+(sub.error||sub.status));
   galaxies.push(...JSON.parse(fs.readFileSync(path.join(folder,'pre33-06-auditoria.json'),'utf8')).galaxies);
   const content=fs.readFileSync(path.join(folder,'pre33-06-balance-por-luna.csv'),'utf8').trim().split('\n').slice(1);
   for(const line of content)rows.push(line); // CSV rows retain their original quotes
  }
  const totals=aggregate(galaxies);
  const result={contract:'PRE-33.06/V3-LUNAR-ATMOSPHERE-INDEPENDENT-AUDIT/v1',seed:o.seed,
   version:'V3',sample:'Selected sectors, not a complete galactic census',totals,galaxies,
   pressureCertificate:'ONLY_INDEPENDENT_INVENTORY_FLUXES_AND_EXOBASE_IN_DOMAIN',
   verdict:totals.errors?'PRE33_06_AUDIT_BLOCKED':'PRE33_06_V3_INDEPENDENT_ATMOSPHERE_AUDITED'};
  fs.mkdirSync(o.out,{recursive:true});
  const json=JSON.stringify(result,null,2)+'\n';
  fs.writeFileSync(path.join(o.out,'pre33-06-auditoria.json'),json);
  fs.writeFileSync(path.join(o.out,'pre33-06-balance-por-luna.csv'),
   'galaxy,systemSector,planetOrdinal,moonOrdinal,status,scenarioPa,physicalPa,sourceId,exobaseSourceId\n'+rows.join('\n')+'\n');
  fs.writeFileSync(path.join(o.out,'pre33-06-informe.md'),
   '# PRE-33.06 — Auditoría lunar V3\n\n'+result.verdict+'\n\n'+
   galaxies.map(g=>`- ${g.galaxy}: ${g.systems} sistemas, ${g.planets} planetas, ${g.moons} lunas; ${g.independentPressureResolved} balances físicos, ${g.errors.length} incidencias.`).join('\n')+
   '\n\nSin EUV, partículas, inventario y exobase independientes no hay presión superficial física certificada.\n');
  console.log(result.verdict+' SHA-256 '+crypto.createHash('sha256').update(json).digest('hex'));
  return result;
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
 const {MoonAtmosphereBalanceEnginePRE3306:Engine}=load('simulation/planetary/moon-atmosphere-balance-engine-pre33-06.ts');
 const {PlanetScientificTargetResolver:Projection}=load('simulation/planetary/planet-scientific-target-resolver.ts');
 const key=new UniverseGenerationKey(UniverseSeed.parse(o.seed),GeneratorVersion.V3);
 const galaxies=[],rows=[];
 for(const gi of o.galaxies){
  const galaxy=GalaxyGenerator.generate(key,BigInt(gi));
  const grid=GalaxySectorGridGenerator.generate(galaxy);
  const candidates=makeCandidates(o.seed,gi,grid.halfExtentInSectors,Math.max(1500,o.systems*100));
  const g={galaxy:galaxy.designation.name,galaxyIndex:gi,systems:0,single:0,binary:0,triple:0,
   planets:0,moons:0,independentPressureResolved:0,missingIndependentInventory:0,
   missingIndependentExobase:0,otherUnresolved:0,publicV3Projected:0,legacyV2Isolated:0,errors:[]};
  for(const pos of candidates){
   if(g.systems>=o.systems)break;
   const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(pos.x,pos.y));
   if(!sector.systemLocators.length)continue;
   const id=identity([String(gi),pos.x,pos.y,'SYSTEM_INDEX']);
   const loc=sector.systemLocators[parseInt(id.slice(0,8),16)%sector.systemLocators.length];
   try{
    const multi=StellarMultihostFormation.generateOrNull(key,loc);
    const single=multi?null:StellarMultihostFormation.generateSingleOrNull(key,loc);
    if(!multi&&!single)throw Error('NO_V3_SYSTEM');
    const worlds=multi?.publicPlanets??single.planets.map((planet,i)=>({
     planet,atmosphere:single.atmospheres[i],moonSystem:single.moonSystems[i],host:'A'}));
    g.systems++;
    if(multi?.components.length===2)g.binary++;else if(multi?.components.length===3)g.triple++;else g.single++;
    for(const [pi,row] of worlds.entries()){
     const {planet,atmosphere,moonSystem}=row;
     if(!moonSystem||!atmosphere)throw Error('INCOMPLETE_PLANET_SOURCES');
     g.planets++;
     const direct=moonSystem.relevantMoons.map(m=>{
      const model=Engine.fromMaterialized(m.physicalProperties,m.environmentState.atmosphereAssessment);
      g.errors.push(...validate(model,m.physicalProperties,m.environmentState.atmosphereAssessment)
        .map(code=>({at:`S${pos.x},${pos.y}/P${pi}/M${m.moonOrdinal}`,errors:[code]})));
      g.moons++;
      if(model.status==='INDEPENDENT_INTERVAL_MODEL_NOT_OBSERVATION')g.independentPressureResolved++;
      else if(model.status==='MISSING_INDEPENDENT_GAS_INVENTORY')g.missingIndependentInventory++;
      else if(model.status==='MISSING_INDEPENDENT_EXOBASE_AND_HIGH_ENERGY_FORCING')g.missingIndependentExobase++;
      else g.otherUnresolved++;
      rows.push([g.galaxy,`S${pos.x}:${pos.y}`,pi+1,m.moonOrdinal,model.status,
       model.scenarioPressurePascal,model.physicalSurfacePressurePascal,
       model.independentSourceId,model.independentExobaseSourceId]);
      return model;
     });
     if(direct.length){
      const target={locator:row.publicLocator??planet.locator,planetOrdinal:pi+1,
       designation:`Audited-V3-${pi}`,hostSystemDesignation:galaxy.designation.name,
       orbitTopology:planet.hostPlanetarySystem.architecture.orbitTopology,hostPlanetCount:worlds.length};
      const v3=Projection.projectGenerated(target,planet,atmosphere,moonSystem,undefined,undefined,3);
      if(v3.detail.moons.relevantMoons.length!==direct.length)throw Error('MOON_V3_FICHE_COUNT');
      for(const [i,m] of v3.detail.moons.relevantMoons.entries()){
       if(JSON.stringify(m.atmosphereBalancePRE3306)!==JSON.stringify(direct[i]))throw Error('V3_FICHE_PRE33_06_PROVENANCE');
       g.publicV3Projected++;
      }
      const v2=Projection.projectGenerated(target,planet,atmosphere,moonSystem,undefined,undefined,2);
      for(const m of v2.detail.moons.relevantMoons){
       if(m.atmosphereBalancePRE3306!==null)throw Error('V2_ATMOSPHERIC_FICHE_LEAK');
       g.legacyV2Isolated++;
      }
     }
    }
   }catch(e){g.errors.push({at:`S${pos.x},${pos.y}`,errors:[String(e.stack||e)]});}
  }
  if(g.systems!==o.systems||g.moons!==g.independentPressureResolved+g.missingIndependentInventory+
    g.missingIndependentExobase+g.otherUnresolved||g.publicV3Projected!==g.moons||g.legacyV2Isolated!==g.moons){
   g.errors.push({at:'SUMMARY',errors:['INCOMPLETE_AUDIT']});
  }
  galaxies.push(g);
  console.log(`${g.galaxy}: ${g.systems} sistemas, ${g.planets} planetas, ${g.moons} lunas, ${g.errors.length} incidencias`);
 }
 return save(o,galaxies,rows);
}
if(require.main===module)main();
module.exports={main,validate};
