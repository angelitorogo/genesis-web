#!/usr/bin/env node
'use strict';
/** PRE-33.03: readonly physical/material hydrosphere audit of public V2 systems. */
const fs=require('node:fs'),path=require('node:path');
const {makeCandidates,identity}=require('./pre33/pre33-audit-core.cjs');
function registerTS(){
 const ts=require('typescript');
 if(!require.extensions['.ts'])require.extensions['.ts']=(mod,file)=>{
  const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{
   module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true,
   useDefineForClassFields:false}}).outputText;
  mod._compile(output,file);
 };
}
function src(p){return require(path.resolve('src/app',p));}
function parse(argv){
 const o={seed:null,galaxies:[0,1,2],systems:20,out:'pre33-audit',strict:false};
 for(const a of argv){
  if(a==='--strict')o.strict=true;
  else if(a.startsWith('--seed='))o.seed=a.slice(7).toUpperCase();
  else if(a.startsWith('--galaxies='))o.galaxies=a.slice(11).split(',').map(Number);
  else if(a.startsWith('--systems-per-galaxy='))o.systems=Number(a.slice(21));
  else if(a.startsWith('--out='))o.out=a.slice(6);
  else throw Error(`Opción no reconocida: ${a}`);
 }
 if(!o.seed||!/^[0-9A-F]{4}(?:-[0-9A-F]{4}){7}$/.test(o.seed)||
  !o.galaxies.length||o.galaxies.some(n=>!Number.isSafeInteger(n)||n<0)||
  !Number.isSafeInteger(o.systems)||o.systems<1||o.systems>200)throw Error('Argumentos inválidos');
 return o;
}
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
 const {PlanetWaterReservoirProjectionPRE3303:project}=src('simulation/planetary/planet-water-reservoir-projection-pre33-03.ts');
 const {validatePlanetWaterReservoirPRE3303:validate}=src('domain/planetary/planet-water-reservoir-contract-pre33-03.ts');
 const key=new UniverseGenerationKey(UniverseSeed.parse(o.seed),GeneratorVersion.V2);
 const galaxies=[];
 for(const index of o.galaxies){
  const galaxy=GalaxyGenerator.generate(key,BigInt(index));
  const grid=GalaxySectorGridGenerator.generate(galaxy);
  const candidates=makeCandidates(o.seed,index,grid.halfExtentInSectors,Math.max(1500,o.systems*100));
  const s={galaxyIndex:index,galaxy:galaxy.designation.name,systems:0,planets:0,
   solidSurface:0,deepEnvelope:0,materialBudgetValidated:0,
   conditionalVaporColumns:0,unresolvedVaporColumns:0,
   physicalSurfaceWaterMassResolved:0,physicalSubsurfaceWaterMassResolved:0,
   deepEnvelopeWaterLayerResolved:0,physicalGlobalH2OMassResolved:0,
   candidateSurfaceLiquidEstimates:0,errors:[],examples:[]};
  for(const pos of candidates){
   if(s.systems>=o.systems)break;
   const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(pos.x,pos.y));
   if(!sector.systemLocators.length)continue;
   const digest=identity([BigInt(index).toString(),pos.x,pos.y,'SYSTEM_INDEX']);
   const loc=sector.systemLocators[parseInt(digest.slice(0,8),16)%sector.systemLocators.length];
   try{
    const mult=StellarMultihostFormation.generateOrNull(key,loc);
    const hosts=mult?.components??[StellarMultihostFormation.generateV2SingleOrNull(key,loc)];
    if(hosts.some(h=>!h))throw Error('Anfitrión no resuelto');
    const planets=mult?.publicPlanets?.map(x=>({planet:x.planet,atm:x.atmosphere}))??
      hosts.flatMap(h=>h.planets.map((p,i)=>({planet:p,atm:h.atmospheres[i]})));
    for(const {planet,atm} of planets){
     s.planets++;
     try{
      const c=project.planet(planet,atm);const errors=validate(c);
      if(errors.length)throw Error(errors.join(','));
      s.materialBudgetValidated++;
      if(c.surfaceDomain==='DEEP_ENVELOPE_NO_SOLID_SURFACE')s.deepEnvelope++;
      else s.solidSurface++;
      if(c.atmosphere.approximateWaterVaporColumnKilogramsPerSquareMeter.state==='CONDITIONAL_SCENARIO')
       s.conditionalVaporColumns++;
      else if(c.atmosphere.approximateWaterVaporColumnKilogramsPerSquareMeter.state==='UNRESOLVED')
       s.unresolvedVaporColumns++;
      if(c.water.estimatedSurfaceLiquidCoverage01.value>0)s.candidateSurfaceLiquidEstimates++;
      if(c.water.surfaceLiquidMassKilograms.state==='MODELLED_CT0')s.physicalSurfaceWaterMassResolved++;
      if(c.water.subsurfaceLiquidMassKilograms.state==='MODELLED_CT0')s.physicalSubsurfaceWaterMassResolved++;
      if(c.water.deepEnvelopeLiquidLayerMassKilograms.state==='MODELLED_CT0')s.deepEnvelopeWaterLayerResolved++;
      if(c.water.totalH2OMassKilograms.state==='MODELLED_CT0')s.physicalGlobalH2OMassResolved++;
      if(s.examples.length<10 && (c.water.estimatedSurfaceLiquidCoverage01.value>0 ||
        c.surfaceDomain==='DEEP_ENVELOPE_NO_SOLID_SURFACE'))
       s.examples.push({body:planet.name,domain:c.surfaceDomain,waterCoverage:c.water.estimatedSurfaceLiquidCoverage01,
        vaporColumn:c.atmosphere.approximateWaterVaporColumnKilogramsPerSquareMeter,
        waterMass:c.water.surfaceLiquidMassKilograms.state,deepLayer:c.deepEnvelope.waterPhaseBoundaryDepthMeters.state});
     }catch(e){s.errors.push({body:planet.name,sector:`${pos.x},${pos.y}`,error:String(e.stack||e)});}
    }
    s.systems++;
   }catch(e){s.errors.push({sector:`${pos.x},${pos.y}`,error:String(e.stack||e)});}
  }
  if(s.systems!==o.systems)s.errors.push({issue:'INCOMPLETE_SYSTEM_SAMPLE'});
  console.log(`PRE-33.03 ${s.galaxy}: ${s.systems} sistemas, ${s.planets} planetas; ${s.solidSurface} sólidos, ${s.deepEnvelope} envolturas profundas; ${s.errors.length} incidencias`);
  galaxies.push(s);
 }
 const verdict=galaxies.some(g=>g.errors.length||g.materialBudgetValidated!==g.planets||
   g.physicalSurfaceWaterMassResolved||g.physicalSubsurfaceWaterMassResolved||
   g.deepEnvelopeWaterLayerResolved||g.physicalGlobalH2OMassResolved)
    ? 'WATER_RESERVOIR_CONTRACT_FAILED' : 'WATER_RESERVOIR_CONTRACT_PASSED_WITH_UNRESOLVED_H2O';
 const report={contract:'PRE-33.03/CT0/v1',seed:o.seed,generator:'V2',
  scope:'Deterministic sample of PUBLIC V2 systems, not a census, not IndexedDB',
  interpretation:'19.5 material mass is NOT pure H2O; 20.7 indices are NOT kilograms; 20.4 vapor column is conditional; deep envelope has no solid-surface ocean claim. No biological verdict.',
  galaxies,verdict};
 fs.mkdirSync(o.out,{recursive:true});
 const json=path.join(o.out,'pre33-03-reservorios.json');
 const md=path.join(o.out,'pre33-03-informe.md');
 fs.writeFileSync(json,JSON.stringify(report,null,2)+'\n');
 const rows=galaxies.map(g=>`| ${g.galaxy} | ${g.systems} | ${g.planets} | ${g.solidSurface} | ${g.deepEnvelope} | ${g.conditionalVaporColumns} | ${g.candidateSurfaceLiquidEstimates} | ${g.errors.length} |`).join('\n');
 fs.writeFileSync(md,[`# PRE-33.03 — Reservorios y envolturas profundas planetarias`,'',
  `Semilla: ${o.seed} · Estado: ${verdict}`,'',
  '| Galaxia | Sistemas | Planetas | Superficie sólida | Envoltura profunda | Columnas H₂O condicionales | Cobertura líquida estimada | Errores |',
  '|---|---:|---:|---:|---:|---:|---:|---:|',rows,'',
  'Los balances materiales de 19.5 NO cuantifican masa de agua. Índices/cobertura 20.7 NO equivalen a océanos constitutivos.','',
  'Las columnas atmosféricas son hidrostáticas, condicionales y NO una atmósfera independiente ni masa oceánica.','',
  'Las capas líquidas en envolturas profundas permanecen NO_RESUELTAS hasta disponer de perfiles P-T, EOS y composición.','',
  'Auditoría de solo lectura; no consulta IndexedDB ni evalúa vida.'] .join('\n')+'\n');
 console.log(`PRE-33.03: ${verdict}; JSON: ${json}; informe: ${md}`);
 if(o.strict&&verdict==='WATER_RESERVOIR_CONTRACT_FAILED')process.exitCode=1;
}
if(require.main===module)main();
module.exports={parse};
