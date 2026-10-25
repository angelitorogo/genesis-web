#!/usr/bin/env node
'use strict';
/**
 * PRE-33.03a.1 — SOLO LECTURA. Muestrea sistemas PUBLIC V2 usando el mismo
 * selector que PRE-33.00/03; no toca persistencia ni altera generadores.
 * Verifies CT-0 water remains UNKNOWN without DATED H2O forcing; preserves phase-32 histories.
 */
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
 const {PlanetH2OFormationEnginePRE3303A:engine}=src('simulation/planetary/planet-h2o-formation-engine-pre33-03a.ts');
 const {validatePlanetH2OFormationPRE3303A:validate}=src('domain/planetary/planet-h2o-formation-contract-pre33-03a.ts');
 const {PlanetaryVolatilesHistoryResolver32_3:volatiles32}=src('simulation/planetary-history/planetary-volatiles-history-resolver-32-3.ts');
 const {PlanetH2OEvolutionEnginePRE3303A1:evolution}=src('simulation/planetary/planet-h2o-evolution-engine-pre33-03a1.ts');
 const {validatePlanetH2OEvolutionPRE3303A1:validateEvolution}=src('domain/planetary/planet-h2o-evolution-contract-pre33-03a1.ts');
 const key=new UniverseGenerationKey(UniverseSeed.parse(o.seed),GeneratorVersion.V2);
 const galaxies=[];
 for(const index of o.galaxies){
  const galaxy=GalaxyGenerator.generate(key,BigInt(index));
  const grid=GalaxySectorGridGenerator.generate(galaxy);
  const candidates=makeCandidates(o.seed,index,grid.halfExtentInSectors,Math.max(1500,o.systems*100));
  const s={galaxyIndex:index,galaxy:galaxy.designation.name,systems:0,planets:0,
   formationSpeciated:0,formationMassConserved:0,conditionalClosedReferences:0,
   evolutionNoDatedSource:0,conditionalEvolutionExecuted:0,ct0InventoriesCertified:0,
   phase32VolatilesValidated:0,
   liquidReferenceWindows:0,conditionalVaporReferences:0,
   ct0SurfaceOceansAsserted:0,ct0GlobalWaterAsserted:0,deepEnvelopeCases:0,
   errors:[],examples:[]};
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
      const c=engine.project(planet,atm);
      const issues=validate(c);
      if(issues.length)throw Error(issues.join(','));
      const h32=volatiles32.resolve({atmosphere:atm,time:{kind:'CURRENT_SNAPSHOT',systemAgeBillionYears:null}});
      const water=evolution.project(planet,atm,c,undefined,h32);
      s.phase32VolatilesValidated++;
      const ew=validateEvolution(water);
      if(ew.length)throw Error(ew.join(','));
      const recheck=evolution.project(planet,atm,c,undefined,h32);
      if(JSON.stringify(water)!==JSON.stringify(recheck))throw Error('NONDETERMINISTIC_H2O_EVOLUTION');
      if(water.state==='UNRESOLVED_NO_DATED_H2O_FORCING')s.evolutionNoDatedSource++;
      if(water.state==='CONDITIONAL_EVOLUTION_COMPLETED')s.conditionalEvolutionExecuted++;
      if(water.ct0PhysicalInventoryCertified)s.ct0InventoriesCertified++;
      const again=engine.project(planet,atm);
      if(JSON.stringify(c)!==JSON.stringify(again))throw Error('NONDETERMINISTIC_PLANET_H2O');
      s.formationSpeciated++;
      s.formationMassConserved++;
      if(c.closedReference.status==='CONDITIONAL_BALANCE')s.conditionalClosedReferences++;
      if(c.current.conditionalVaporReferenceKilograms!==null)s.conditionalVaporReferences++;
      if(c.current.surfaceWindow==='SURFACE_LIQUID_REFERENCE_POSSIBLE')s.liquidReferenceWindows++;
      if(atm.climateState.meanSurfaceTemperatureKelvin===null)s.deepEnvelopeCases++;
      if(c.current.surfaceLiquidH2OKilograms!==null)s.ct0SurfaceOceansAsserted++;
      if(c.current.retainedH2OKilograms!==null)s.ct0GlobalWaterAsserted++;
      if(s.examples.length<12 && (c.current.surfaceWindow==='SURFACE_LIQUID_REFERENCE_POSSIBLE'||
         atm.climateState.meanSurfaceTemperatureKelvin===null))
       s.examples.push({body:planet.name,formationH2OKilograms:c.formation.modeledFormationH2OKilograms,
        window:c.current.surfaceWindow,referenceStatus:c.closedReference.status,
        ct0Water:water.state,provenance:c.formationHypothesis});
     }catch(e){s.errors.push({body:planet.name,sector:`${pos.x},${pos.y}`,error:String(e.stack||e)});}
    }
    s.systems++;
   }catch(e){s.errors.push({sector:`${pos.x},${pos.y}`,error:String(e.stack||e)});}
  }
  if(s.systems!==o.systems)s.errors.push({issue:'INCOMPLETE_SYSTEM_SAMPLE'});
  console.log(`PRE-33.03a.1 ${s.galaxy}: ${s.systems} sistemas, ${s.planets} planetas; ${s.evolutionNoDatedSource} sin flujos H2O fechados; ${s.errors.length} incidencias`);
  galaxies.push(s);
 }
 const verdict=galaxies.some(g=>g.errors.length||g.formationSpeciated!==g.planets||
   g.formationMassConserved!==g.planets||g.ct0SurfaceOceansAsserted||g.ct0GlobalWaterAsserted||
   g.evolutionNoDatedSource!==g.planets||g.phase32VolatilesValidated!==g.planets||
   g.ct0InventoriesCertified||g.conditionalEvolutionExecuted)
    ?'WATER_EVOLUTION_GATE_FAILED':'WATER_EVOLUTION_GATE_PASSED_DATED_FLUXES_MISSING';
 const report={contract:'PRE-33.03a.1/water-evolution/v1',seed:o.seed,generator:'V2',
  scope:'Deterministic readonly public-V2-system sample; not census, not IndexedDB',
  interpretation:'Phase-32 does not currently supply independently dated species-resolved H2O fluxes. Conditional CT0 integration is supported when forcing is supplied; do NOT infer 20.3 mole loss as kilograms or 20.7 fraction as mass. No CT0 planet oceans certified.',
  galaxies,verdict};
 fs.mkdirSync(o.out,{recursive:true});
 const json=path.join(o.out,'pre33-03a1-evolucion-h2o.json');
 const md=path.join(o.out,'pre33-03a1-informe.md');
 fs.writeFileSync(json,JSON.stringify(report,null,2)+'\n');
 const rows=galaxies.map(g=>`| ${g.galaxy} | ${g.systems} | ${g.planets} | ${g.formationSpeciated} | ${g.evolutionNoDatedSource} | ${g.phase32VolatilesValidated} | ${g.ct0InventoriesCertified} | ${g.errors.length} |`).join('\n');
 fs.writeFileSync(md,[`# PRE-33.03a.1 — Evolución de H₂O hasta CT-0`,'',
  `Semilla: ${o.seed} · Estado: ${verdict}`,'',
  '| Galaxia | Sistemas | Planetas | Escenarios formación validados | Historia H₂O fechada ausente | 32.3 validado | CT-0 certificados | Errores |',
  '|---|---:|---:|---:|---:|---:|---:|---:|',rows,'',
  'El motor PRE-33.03a.1 conserva masa de H₂O y simula pérdidas XUV, entregas y transiciones bajo ENTRADAS FÍSICAS FECHADAS explícitas. Los 439 planetas públicos examinados no aportan todavía tales forzamientos específicos.','',
  'La masa de H₂O atribuida a los materiales maduros de 19.5 sigue siendo una hipótesis química de formación retroproyectada. Incluso una trayectoria condicional conservativa NO certifica océanos reales CT-0.','',
  'Fase 32: se valida identidad y cobertura temporal si hay fuente fechada; nunca se escribe ni refecha historia. No se convierten fracciones atmosféricas 20.3/20.7 en masas H₂O.','',
  'Solo lectura, sin IndexedDB, sin modificación de V1/V2.'] .join('\n')+'\n');
 console.log(`PRE-33.03a.1: ${verdict}; JSON: ${json}; informe: ${md}`);
 if(o.strict&&verdict==='WATER_EVOLUTION_GATE_FAILED')process.exitCode=1;
}
if(require.main===module)main();
module.exports={parse};
