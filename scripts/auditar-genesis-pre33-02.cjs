#!/usr/bin/env node
'use strict';
/** Auditoría de SOLO LECTURA, repetible, del balance de presión gaseosa 20.3–20.7. */
const fs=require('node:fs');
const path=require('node:path');
const {makeCandidates,identity}=require('./pre33/pre33-audit-core.cjs');
function registerTS(){
 const ts=require('typescript');
 if (!require.extensions['.ts']) require.extensions['.ts']=(mod,file)=>{
  const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{
   module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true,
   useDefineForClassFields:false}}).outputText;
  mod._compile(output,file);
 };
}
function src(p){return require(path.resolve('src/app',p));}
function parse(argv){
 const opt={seed:null,galaxies:[0,1,2],systems:20,out:'pre33-audit',strict:false};
 for(const arg of argv){
  if(arg==='--strict')opt.strict=true;
  else if(arg.startsWith('--seed='))opt.seed=arg.slice(7).toUpperCase();
  else if(arg.startsWith('--galaxies='))opt.galaxies=arg.slice(11).split(',').map(Number);
  else if(arg.startsWith('--systems-per-galaxy='))opt.systems=Number(arg.slice(21));
  else if(arg.startsWith('--out='))opt.out=arg.slice(6);
  else throw Error(`Opción desconocida: ${arg}`);
 }
 if(!opt.seed||!/^[0-9A-F]{4}(?:-[0-9A-F]{4}){7}$/.test(opt.seed)||
  !Number.isSafeInteger(opt.systems)||opt.systems<1||opt.systems>200||
  !opt.galaxies.length||opt.galaxies.some(v=>!Number.isSafeInteger(v)||v<0))
  throw Error('Argumentos PRE-33.02 inválidos');
 return opt;
}
function main(){
 const opt=parse(process.argv.slice(2));registerTS();
 const {UniverseSeed}=src('domain/universe/universe-seed.ts');
 const {UniverseGenerationKey}=src('domain/generation/universe-generation-key.ts');
 const {GeneratorVersion}=src('domain/generation/generator-version.ts');
 const {GalaxyGenerator}=src('simulation/universe/galaxy-generator.ts');
 const {GalaxySectorGridGenerator}=src('simulation/sector/galaxy-sector-grid-generator.ts');
 const {GalaxySectorContentGenerator}=src('simulation/sector/galaxy-sector-content-generator.ts');
 const {GalaxySectorCoordinates}=src('domain/sector/galaxy-sector-coordinates.ts');
 const {StellarMultihostFormation}=src('simulation/stellar/stellar-multihost-formation.ts');
 const {multihostPhysicalSourceKey}=src('simulation/stellar/stellar-multihost-physical-source-key.ts');
 const {StellarDesignationGenerator}=src('simulation/stellar/stellar-designation-generator.ts');
 const {reconcilePlanetAtmosphericPressurePRE3302:reconcile}=src(
  'simulation/planetary/planet-atmospheric-pressure-coherence-pre33-02.ts');
 const {EnvironmentalPhysicalProjectionPRE3301:projection}=src(
  'simulation/planetary/environmental-physical-projection-pre33-01.ts');
 const key=new UniverseGenerationKey(UniverseSeed.parse(opt.seed),GeneratorVersion.V2);
 const galaxies=[];
 const physicalKey=multihostPhysicalSourceKey(key);
 for(const index of opt.galaxies){
  const galaxy=GalaxyGenerator.generate(key,BigInt(index));
  const grid=GalaxySectorGridGenerator.generate(galaxy);
  const candidates=makeCandidates(opt.seed,index,grid.halfExtentInSectors,Math.max(1500,opt.systems*100));
  const summary={galaxyIndex:index,galaxy:galaxy.designation.name,systems:0,planets:0,
   byStatus:{},differenceCount:0,justifiedDifferences:0,unexplainedDifferences:0,
   observedPhysicalEvidenceGranted:0,issues:{},examples:[],errors:[],sampleSystems:[]};
  for(const pos of candidates){
   if(summary.systems>=opt.systems)break;
   const coords=new GalaxySectorCoordinates(pos.x,pos.y);
   const sector=GalaxySectorContentGenerator.generate(galaxy,coords);
   if(!sector.systemLocators.length)continue;
   const digest=identity([BigInt(index).toString(),pos.x,pos.y,'SYSTEM_INDEX']);
   const locator=sector.systemLocators[parseInt(digest.slice(0,8),16)%sector.systemLocators.length];
   try{
    const mult=StellarMultihostFormation.generateOrNull(key,locator);
    const hosts=mult?.components??[StellarMultihostFormation.generateV2SingleOrNull(key,locator)];
    if(hosts.some(h=>!h))throw Error('Anfitrión no resuelto');
    const planets=mult?.publicPlanets?.map(x=>({p:x.planet,a:x.atmosphere}))??
      hosts.flatMap(h=>h.planets.map((p,i)=>({p,a:h.atmospheres[i]})));
    for(const {p,a} of planets){
     summary.planets++;
     const diagnostic=reconcile(p,a);
     const contract=projection.planet(p,a);
     summary.byStatus[diagnostic.status]=(summary.byStatus[diagnostic.status]||0)+1;
     const differs=contract.atmosphere.columnRelation==='DIVERGENT';
     if(differs){
      summary.differenceCount++;
      if(diagnostic.status==='CONSISTENT_PHASE_PARTITION')summary.justifiedDifferences++;
      else summary.unexplainedDifferences++;
     }
     if(contract.atmosphere.physicallySupportedSurfacePressurePascal.state==='MODELLED_CT0')
      summary.observedPhysicalEvidenceGranted++;
     for(const issue of diagnostic.issues)summary.issues[issue]=(summary.issues[issue]||0)+1;
     if(diagnostic.status==='INCONSISTENT' || diagnostic.status==='UNRESOLVED_PHASE_BASIS')
      summary.errors.push({sector:`${pos.x},${pos.y}`,body:p.name,issues:diagnostic.issues,status:diagnostic.status});
     if(summary.examples.length<12 && (differs||diagnostic.status==='INCONSISTENT'))
      summary.examples.push({body:p.name,diagnostic});
    }
    summary.sampleSystems.push({sector:`${pos.x},${pos.y}`,system:StellarDesignationGenerator.generate(physicalKey,locator).name,planets:planets.length});
    summary.systems++;
   }catch(error){summary.errors.push({sector:`${pos.x},${pos.y}`,error:String(error.stack||error)});}
  }
  if(summary.systems!==opt.systems)summary.errors.push({error:'Muestra incompleta'});
  console.log(`PRE-33.02 ${summary.galaxy}: ${summary.systems} sistemas / ${summary.planets} planetas; ${summary.justifiedDifferences}/${summary.differenceCount} diferencias justificadas; ${summary.errors.length} incidencias`);
  galaxies.push(summary);
 }
 const verdict=galaxies.some(g=>g.errors.length||g.unexplainedDifferences||g.observedPhysicalEvidenceGranted)
   ? 'PRESSURE_RECONCILIATION_FAILED' : 'PRESSURE_RECONCILIATION_PASSED';
 const report={contract:'PRE-33.02/v1',universeSeed:opt.seed,generator:'V2',
  interpretation:'20.3 retained gas -> 20.4 condensed phase partition -> 20.6 climate / 20.7 water. Not an independent mass/flux atmospheric balance.',
  galaxies,verdict};
 fs.mkdirSync(opt.out,{recursive:true});
 const jsonFile=path.join(opt.out,'pre33-02-presiones.json');
 const mdFile=path.join(opt.out,'pre33-02-informe.md');
 fs.writeFileSync(jsonFile,JSON.stringify(report,null,2)+'\n','utf8');
 const lines=['# PRE-33.02 — Conciliación de presiones planetarias','',`Semilla: ${opt.seed}. Estado: ${verdict}.`,
  '','| Galaxia | Sistemas | Planetas | Divergencias | Justificadas por condensación | Sin justificar | Incidencias |',
  '|---|---:|---:|---:|---:|---:|---:|',...galaxies.map(g=>`| ${g.galaxy} | ${g.systems} | ${g.planets} | ${g.differenceCount} | ${g.justifiedDifferences} | ${g.unexplainedDifferences} | ${g.errors.length} |`),
  '','El valor de 20.3 es previo a la condensación. El de 20.4/20.6/20.7 es la columna gaseosa efectiva.',
  'La presión equivalente condensada es un diagnóstico de inventario, no presión superficial adicional ni masa de océano.',
  'Las columnas 20.x siguen siendo condicionales y no constituyen un balance físico independiente de masa/flujo.',
  'Esta auditoría es una muestra determinista, no el censo total ni un análisis de vida.',''];
 fs.writeFileSync(mdFile,lines.join('\n'),'utf8');
 console.log(`PRE-33.02: ${verdict}; ${jsonFile}; ${mdFile}`);
 if(opt.strict&&verdict!=='PRESSURE_RECONCILIATION_PASSED')process.exitCode=1;
}
try{main();}catch(e){console.error(e.stack||e);process.exitCode=1;}
