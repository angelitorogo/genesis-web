#!/usr/bin/env node
'use strict';
/**
 * PRE-33.00. Solo lectura. Con npm instalado (TypeScript es devDependency).
 * Nodo de ejecución: node scripts/auditar-genesis-pre33-00.cjs --seed=... --galaxies=0,1,2
 * No guarda cuerpos, no altera descubrimientos, no usa Date ni Math.random para seleccionar.
 */
const fs=require('node:fs');
const path=require('node:path');
const Module=require('node:module');
const {
  identity,numberOrNull,safeJson,accumulate,validNonNegative,fraction,different,
  parseArgs,makeCandidates,expectedComparison,checkSnapshotCounts,safeWrite,asMarkdown,
}=require('./pre33/pre33-audit-core.cjs');

function enableTypescriptReadOnly() {
  // Carga de los mismos módulos TS de producción, sin escribir/transpilar en disco.
  // Para el entorno de auditoría Node CJS no hay que alterar tsconfig ni motores.
  const ts=require('typescript');
  if(!require.extensions['.ts']) require.extensions['.ts']=(mod,filename)=>{
    const source=fs.readFileSync(filename,'utf8');
    const compiled=ts.transpileModule(source,{fileName:filename,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true,useDefineForClassFields:false}}).outputText;
    mod._compile(compiled,filename);
  };
}
function source(rel){return require(path.join(process.cwd(),'src/app',rel));}
function requireInt(num,name){if(!Number.isSafeInteger(num)||num<0)throw Error(`${name} fuera de rango`);}
function readJson(file){return JSON.parse(fs.readFileSync(path.resolve(file),'utf8'));}
function issue(out,severity,code,detail,context={}) {out.push({severity,code,detail,...context});}
function auditPlanet(planet,atmos,moons,s) {
  const name=planet?.designation?.name||'SIN_IDENTIDAD';
  const type=planet?.planetType||'UNKNOWN';
  s.planets++; accumulate(s.planetTypes,type);
  if(!planet?.isTypePhysicallyCoherent)issue(s.issues,'ERROR','PLANET_TYPE_INCOHERENT','El motor declara incoherencia de tipo físico',{body:name});
  const mass=planet?.physicalProperties?.massEarth, radius=planet?.physicalProperties?.radiusEarth;
  if(mass!==undefined && (!validNonNegative(mass)||mass===0))issue(s.issues,'ERROR','PLANET_INVALID_MASS','Masa terrestre no positiva/finita',{body:name});
  if(radius!==undefined && (!validNonNegative(radius)||radius===0))issue(s.issues,'ERROR','PLANET_INVALID_RADIUS','Radio terrestre no positivo/finito',{body:name});
  const retained=atmos?.retentionState?.retainedSurfacePressurePascal ?? null;
  const water=atmos?.waterInventory?.sourceRetainedSurfacePressurePascal ?? null;
  const coverage=atmos?.waterInventory?.surfaceLiquidWaterCoverageFraction01 ?? null;
  if(retained!==null && !validNonNegative(retained))issue(s.issues,'ERROR','PLANET_INVALID_PRESSURE','Presión negativa o no finita',{body:name});
  if(!fraction(coverage))issue(s.issues,'ERROR','PLANET_INVALID_WATER_FRACTION','Cobertura líquida fuera de 0..1',{body:name});
  if(different(retained,water)){
    s.pressureColumnDifferences++;
    if(s.examples.pressureDifferences.length<8)s.examples.pressureDifferences.push({body:name,retainedPressurePascal:retained,waterAssessmentPressurePascal:water});
  }
  accumulate(s.planetPressureStatus,retained===null?'UNRESOLVED':'MODELLED');
  if(atmos?.waterInventory?.hasPersistentSurfaceLiquidWater){
    s.planetPersistentSurfaceLiquidWater++;
    if(s.examples.liquidPlanets.length<8)s.examples.liquidPlanets.push({body:name,planetType:type,liquidCoverageFraction:coverage});
  }
  try { s.integrator.assessMaterialized(planet,atmos,moons); }catch(e){issue(s.issues,'ERROR','HABITABILITY_INTEGRATION_EXCEPTION',e.message,{body:name});}
  const relevant=Array.isArray(moons?.relevantMoons)?moons.relevantMoons:[];
  const n=moons?.moonCount ?? 0;
  if(!Number.isSafeInteger(n)||n<relevant.length)issue(s.issues,'ERROR','MOON_COUNT_INCONSISTENT','Conteo lunar incompatible',{body:name});
  s.moons+=n;s.relevantMoons+=relevant.length;s.identityOnlyMoons+=Math.max(0,n-relevant.length);
  for(const moon of relevant)auditMoon(moon,s);
  return {name,planetType:type,moons:n,relevantMoons:relevant.length,pressureStatus:retained===null?'UNRESOLVED':'MODELLED',liquidWater:!!atmos?.waterInventory?.hasPersistentSurfaceLiquidWater};
}
function auditMoon(m,s){
  const name=m.name||'LUNA_SIN_IDENTIDAD',o=m.oceanReality32F2c,
    a=m.environmentState?.atmosphereAssessment,g=m.geochemicalEnergy32F4,r=m.radiationProtection32F3;
  const state=o?.state??'MISSING'; accumulate(s.moonOceanStates,state);
  accumulate(s.moonOceanReasons,o?.reason??'MISSING');
  accumulate(s.moonPressureBases,a?.pressureBasis??'MISSING');
  const p=a?.estimatedSurfacePressurePascal ?? null;
  if(p!==null&&!validNonNegative(p))issue(s.issues,'ERROR','MOON_INVALID_PRESSURE','Presión lunar no finita/no negativa',{body:name});
  const balance=a?.physicalBalance32F1;
  if(a?.pressureBasis==='PHYSICAL_BALANCE' && (!balance || balance.sourceKind!=='INDEPENDENT_MASS_AND_FLUXES'))
    issue(s.issues,'ERROR','MOON_UNSUPPORTED_PRESSURE_EVIDENCE','Presión física sin balance independiente',{body:name});
  if(balance?.status==='RESOLVED'||a?.pressureBasis==='PHYSICAL_BALANCE')s.moonPhysicalBalances++;
  if(numberOrNull(g?.actualChemicalPowerWatts)!==null)s.moonChemicalPowerResolved++;
  if(numberOrNull(g?.actualChemicalDisequilibriumJoulesPerMole)!==null)s.moonChemicalDisequilibriumResolved++;
  if(numberOrNull(r?.surfaceIonisingDoseGrayPerYear)!==null)s.moonSurfaceDoseResolved++;
  if(numberOrNull(r?.subsurfaceIonisingDoseGrayPerYear)!==null)s.moonSubsurfaceDoseResolved++;
  if(state==='PRESENT_IN_SIMULATED_MODEL'){
    s.moonOceanPresent++;
    if(s.examples.oceanMoons.length<8)s.examples.oceanMoons.push({body:name,heatFluxWattsPerSquareMeter:numberOrNull(o?.generatedTotalSurfaceHeatFluxWattsPerSquareMeter)});
    if(!validNonNegative(o?.liquidWaterMassKilograms) && o?.liquidWaterMassKilograms !== undefined && o?.liquidWaterMassKilograms !== null)
      issue(s.issues,'ERROR','MOON_INVALID_LIQUID_MASS','Masa líquida CT-0 inválida',{body:name});
  }
  if(s.examples.unresolvedMoons.length<5&&state==='UNRESOLVED_IN_SIMULATED_MODEL')s.examples.unresolvedMoons.push({body:name,reason:o?.reason??null});
}
function sampleLocator(key,galaxy,coordinates,content,fixtures,designations){
  const locators=content.systemLocators||[];if(!locators.length)return null;
  const named=fixtures.find(f=>f.x===coordinates.x && f.y===coordinates.y);
  if(named){const loc=locators.find(l=>designations.generate(key,l).name===named.name); if(!loc)throw Error(`Fixture ${named.name} no existe en ${coordinates.x},${coordinates.y}`);return loc;}
  const digest=identity([galaxy.index.toString(),coordinates.x,coordinates.y,'SYSTEM_INDEX']);
  return locators[parseInt(digest.slice(0,8),16)%locators.length];
}
function physicalFingerprint(planets) {
  // Estado observable físicamente desde el motor, nunca estado de descubrimiento.
  return identity(planets.map(({planet:p,atmosphere:a,moonSystem:m})=>({
    id:p.designation?.name, type:p.planetType,
    massEarth:numberOrNull(p.physicalProperties?.massEarth),radiusEarth:numberOrNull(p.physicalProperties?.radiusEarth),
    pressure:numberOrNull(a?.retentionState?.retainedSurfacePressurePascal),
    waterPressure:numberOrNull(a?.waterInventory?.sourceRetainedSurfacePressurePascal),
    persistentWater:!!a?.waterInventory?.hasPersistentSurfaceLiquidWater,
    waterCoverage:numberOrNull(a?.waterInventory?.surfaceLiquidWaterCoverageFraction01),
    moons:m?.moonCount ?? null, relevant:m?.relevantMoons?.map(moon=>({
      name:moon.name,ocean:moon.oceanReality32F2c?.state,reason:moon.oceanReality32F2c?.reason,
      heatFlux:numberOrNull(moon.oceanReality32F2c?.generatedTotalSurfaceHeatFluxWattsPerSquareMeter),
      pressureBasis:moon.environmentState?.atmosphereAssessment?.pressureBasis,
      chemPower:numberOrNull(moon.geochemicalEnergy32F4?.actualChemicalPowerWatts),
      dose:numberOrNull(moon.radiationProtection32F3?.subsurfaceIonisingDoseGrayPerYear),
    }))??[],
  })));
}
function audit(generationKey,index,reference,limit,maxSectors,modules){
  const {GalaxyGenerator,GalaxySectorGridGenerator,GalaxySectorContentGenerator,GalaxySectorCoordinates,
    StellarDesignationGenerator,StellarMultihostFormation,HabitabilityPhysicalIntegration31Fb,multihostPhysicalSourceKey}=modules;
  const physicalKey=multihostPhysicalSourceKey(generationKey);
  const galaxy=GalaxyGenerator.generate(generationKey,BigInt(index));
  const grid=GalaxySectorGridGenerator.generate(galaxy);
  const ref=reference && reference.galaxyIndex===index && reference.seed===generationKey.universeSeed.toString()?reference:null;
  // Explicit reference is checked for galaxy 0 and supplied seed in main. Never substitute name for identity.
  const issues=[],expected=expectedComparison(galaxy,ref), fixtures=ref?.namedFixtures||[];
  if(expected.status==='MISMATCH')issue(issues,'ERROR','GALAXY_REFERENCE_MISMATCH','Propiedades o identidad difieren de referencia',{differences:expected.differences});
  const s={systems:0,planets:0,moons:0,relevantMoons:0,identityOnlyMoons:0,
    planetTypes:{},planetPressureStatus:{},planetPersistentSurfaceLiquidWater:0,pressureColumnDifferences:0,
    moonOceanPresent:0,moonOceanStates:{},moonOceanReasons:{},moonPressureBases:{},moonPhysicalBalances:0,
    moonChemicalPowerResolved:0,moonChemicalDisequilibriumResolved:0,moonSurfaceDoseResolved:0,moonSubsurfaceDoseResolved:0,
    examples:{pressureDifferences:[],liquidPlanets:[],oceanMoons:[],unresolvedMoons:[]},issues, integrator:HabitabilityPhysicalIntegration31Fb};
  const selected=[], keys=new Set(), systemResults=[];
  function trySite(x,y,requiredName=null,band=null){
    if(s.systems>=limit)return;
    const id=`${x},${y}`;if(keys.has(id))return;keys.add(id);
    let content;
    try{
      const coords=new GalaxySectorCoordinates(x,y);
      content=GalaxySectorContentGenerator.generate(galaxy,coords);
      if(!content.systemLocators.length){if(requiredName)issue(issues,'ERROR','FIXTURE_SECTOR_EMPTY',`El sector del fixture ${requiredName} está vacío`);return;}
      const loc=sampleLocator(physicalKey,galaxy,{x,y},content,fixtures,StellarDesignationGenerator);
      const name=StellarDesignationGenerator.generate(physicalKey,loc).name;
      if(requiredName && name!==requiredName)issue(issues,'ERROR','FIXTURE_IDENTITY_CHANGED',`Fixture ${requiredName}, recibido ${name}`);
      const mult=StellarMultihostFormation.generateOrNull(generationKey,loc);
      const hosts=mult?.components ?? [StellarMultihostFormation.generateV2SingleOrNull(generationKey,loc)];
      if(hosts.some(h=>!h))throw Error('Anfitrión single no resuelto');
      const planets=mult?.publicPlanets?.map(p=>({planet:p.planet,atmosphere:p.atmosphere,moonSystem:p.moonSystem}))
        ?? hosts.flatMap(h=>h.planets.map((planet,i)=>({planet,atmosphere:h.atmospheres[i],moonSystem:h.moonSystems[i]})));
      const before=s.planets;const physicsChecksum=physicalFingerprint(planets);
      const simplified=planets.map(p=>auditPlanet(p.planet,p.atmosphere,p.moonSystem,s));
      const item={system:name,sector:{x,y,band},multiplicity:mult?.multiplicity?.name??'SINGLE',
        planets:simplified.length,planetDetails:simplified,checksum:physicsChecksum};
      selected.push({x,y,name,loc,checksum:physicsChecksum});systemResults.push(item);s.systems++;
      if(s.planets-before!==planets.length)throw Error('Conteo planetario inconsistente');
    }catch(e){issue(issues,'ERROR','SYSTEM_GENERATION_EXCEPTION',String(e.message||e),{sector:{x,y},requiredName});}
  }
  for(const f of fixtures)trySite(f.x,f.y,f.name,'NAMED_FIXTURE');
  const candidates=makeCandidates(generationKey.universeSeed.toString()||'unknown',index,grid.halfExtentInSectors,maxSectors);
  for(const c of candidates){if(s.systems>=limit)break;trySite(c.x,c.y,null,c.band);}
  if(s.systems<limit)issue(issues,'ERROR','INSUFFICIENT_SYSTEM_SAMPLE',`Se pidieron ${limit} sistemas pero se materializaron ${s.systems}; sectores intentados: ${keys.size}`);
  // Reproducir al menos una identidad por sistema, sin depender de timestamps o UI.
  const determinism=[];
  for(const item of selected.slice(0,Math.min(3,selected.length))){
    try{
      const content=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(item.x,item.y));
      const exists=content.systemLocators.some(l=>StellarDesignationGenerator.generate(physicalKey,l).name===item.name);
      const mult=StellarMultihostFormation.generateOrNull(generationKey,item.loc);
      const hosts=mult?.components ?? [StellarMultihostFormation.generateV2SingleOrNull(generationKey,item.loc)];
      const planets=mult?.publicPlanets?.map(p=>({planet:p.planet,atmosphere:p.atmosphere,moonSystem:p.moonSystem}))
        ?? hosts.flatMap(h=>h.planets.map((planet,i)=>({planet,atmosphere:h.atmospheres[i],moonSystem:h.moonSystems[i]})));
      const reproducible=exists && physicalFingerprint(planets)===item.checksum;
      determinism.push({system:item.name,stable:reproducible});
      if(!reproducible)issue(issues,'ERROR','NON_DETERMINISTIC_PHYSICS','Identidad o física CT-0 cambió al regenerar el mismo sistema',{body:item.name});
    }catch(e){issue(issues,'ERROR','DETERMINISM_RECHECK_EXCEPTION',String(e.message),{body:item.name});}
  }
  delete s.issues;delete s.integrator;
  const sampleFingerprint=identity(systemResults.map(v=>[v.system,v.multiplicity,v.planets,v.checksum]));
  return {galaxyIndex:index,designation:{name:galaxy.designation.name,proceduralCode:galaxy.designation.proceduralCode},
    morphology:galaxy.type.name,physical:{ageBillionYears:galaxy.physicalProperties.ageBillionYears,
      diameterLightYears:galaxy.physicalProperties.diameterLightYears,totalMassSolarMasses:galaxy.physicalProperties.totalMassSolarMasses,
      stellarPopulation:galaxy.physicalProperties.stellarPopulation.toString(),metallicitySolarRatio:galaxy.physicalProperties.metallicitySolarRatio,
      starFormationRateSolarMassesPerYear:galaxy.physicalProperties.starFormationRateSolarMassesPerYear},
    sectorGrid:{halfExtent:grid.halfExtentInSectors,fullGridSectors:(grid.halfExtentInSectors*2+1)**2},
    sectorCoordinatesAttempted:keys.size,sample:{...s,systemsDetails:systemResults,selection:'NAMED_FIXTURES_PLUS_DETERMINISTIC_RADIAL_QUADRANTS_NON_RANDOM_SAMPLE'},
    referenceCheck:expected,determinism,sampleFingerprint,issues};
}
function main(){
  const opts=parseArgs(process.argv.slice(2));if(opts.help){
    console.log('node scripts/auditar-genesis-pre33-00.cjs --seed=7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5 --galaxies=0,1,2 --systems-per-galaxy=20 --out=pre33-audit [--strict] [--reference=scripts/pre33/elixisis-v2-reference.json] [--snapshot=exportación.json]');return;
  }
  enableTypescriptReadOnly();
  const {UniverseSeed}=source('domain/universe/universe-seed.ts');
  const {UniverseGenerationKey}=source('domain/generation/universe-generation-key.ts');
  const {GeneratorVersion}=source('domain/generation/generator-version.ts');
  const k=new UniverseGenerationKey(UniverseSeed.parse(opts.seed),GeneratorVersion.V2);
  const modules={
    GalaxyGenerator:source('simulation/universe/galaxy-generator.ts').GalaxyGenerator,
    GalaxySectorGridGenerator:source('simulation/sector/galaxy-sector-grid-generator.ts').GalaxySectorGridGenerator,
    GalaxySectorContentGenerator:source('simulation/sector/galaxy-sector-content-generator.ts').GalaxySectorContentGenerator,
    GalaxySectorCoordinates:source('domain/sector/galaxy-sector-coordinates.ts').GalaxySectorCoordinates,
    StellarDesignationGenerator:source('simulation/stellar/stellar-designation-generator.ts').StellarDesignationGenerator,
    StellarMultihostFormation:source('simulation/stellar/stellar-multihost-formation.ts').StellarMultihostFormation,
    HabitabilityPhysicalIntegration31Fb:source('simulation/planetary/habitability-physical-integration-31-f-b.ts').HabitabilityPhysicalIntegration31Fb,
    multihostPhysicalSourceKey:source('simulation/stellar/stellar-multihost-physical-source-key.ts').multihostPhysicalSourceKey,
  };
  const reference=opts.reference?readJson(opts.reference):readJson(path.join(__dirname,'pre33/elixisis-v2-reference.json'));
  const applies=reference.seed===opts.seed && opts.galaxies.includes(reference.galaxyIndex);
  const selectedReference=applies?reference:null;
  const galaxies=[];
  for(const index of opts.galaxies){
    console.log(`PRE-33.00: auditando galaxia ${index}...`);
    const g=audit(k,index,index===reference.galaxyIndex?selectedReference:null,opts.systemsPerGalaxy,opts.maxSectors,modules);
    galaxies.push(g);console.log(`  ${g.designation.name}: ${g.sample.systems} sistemas / ${g.sample.planets} planetas / ${g.sample.moons} lunas; ${g.issues.length} incidencias`);
  }
  const snapshot=opts.snapshot?readJson(opts.snapshot):null;
  const persistedComparison=selectedReference?checkSnapshotCounts(selectedReference,snapshot):null;
  const allIssues=galaxies.flatMap(g=>g.issues.map(i=>({galaxyIndex:g.galaxyIndex,...i})));
  if(persistedComparison?.status==='IDENTITY_MISMATCH'||persistedComparison?.status==='MISMATCH')
    allIssues.push({severity:'ERROR',code:'PERSISTED_REFERENCE_MISMATCH',detail:persistedComparison.status});
  const blockers=allIssues.filter(i=>i.severity==='ERROR');
  const result={contract:'PRE-33.00/v1',universeSeed:opts.seed,generatorVersion:'V2',
    inputs:{galaxyIndices:opts.galaxies,systemsPerGalaxy:opts.systemsPerGalaxy,maxSectors:opts.maxSectors,fixtureSource:selectedReference?.source||null,
      persistenceMode:snapshot?'IMPORTED_REFERENCE_SNAPSHOT':'USER_REFERENCE_NOT_INDEXEDDB'},galaxies,
    persistedComparison,blockers,overallStatus:blockers.length?'REVIEW_REQUIRED':'STRUCTURAL_SAMPLE_PASSED_WITH_PHYSICAL_GAPS',
    fingerprint:identity(galaxies.map(g=>[g.galaxyIndex,g.sampleFingerprint,g.referenceCheck.status]))};
  const p1=safeWrite(opts.reportDir,'pre33-00-resultados.json',safeJson(result)+'\n');
  const p2=safeWrite(opts.reportDir,'pre33-00-informe.md',asMarkdown(result));
  console.log(`PRE-33.00: ${result.overallStatus}; JSON: ${p1}; informe: ${p2}`);
  if(opts.strict && blockers.length)process.exitCode=1;
}
try{main();}catch(e){console.error(`PRE-33.00 ERROR: ${e.stack||e}`);process.exitCode=1;}
