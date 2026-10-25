#!/usr/bin/env node
'use strict';
/** PRE-33.03a.2 — read-only, reproducible public V2 physical-history scenario audit. */
const fs=require('node:fs'),path=require('node:path');
const {makeCandidates,identity}=require('./pre33/pre33-audit-core.cjs');
function registerTS(){
 const ts=require('typescript');
 if(!require.extensions['.ts'])require.extensions['.ts']=(mod,file)=>{
  const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{
   module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true,
   useDefineForClassFields:false}}).outputText;
  mod._compile(js,file);
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
/** Accept only frozen *generated* 15.3 values; not star age guessed from galaxy age. */
function sourceFromHost(host,circumbinary,sourceSystemKey){
 const age=host.lifetime.ageBillionYears;
 const assessment=host.lifetime.evolutionAssessment;
 return {
  ageBillionYears:age,massSolar:host.physical.currentMassSolar,
  luminositySolar:host.physical.luminositySolar,
  mainSequenceLifetimeBillionYears:assessment.mainSequenceLifetimeBillionYears,
  evolutionState:assessment.evolutionState.name==='MAIN_SEQUENCE'?'MAIN_SEQUENCE':'OTHER',
  sourceRecordKey:`FROZEN_HOST_15_3/${sourceSystemKey}/${host.label}`,
  orbitalFluxGeometry:circumbinary?'UNRESOLVED_MULTIPLE_FLUX':'HOST_CIRCUMSTELLAR',
 };
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
 const {PlanetH2OFormationEnginePRE3303A}=src('simulation/planetary/planet-h2o-formation-engine-pre33-03a.ts');
 const {PlanetaryVolatilesHistoryResolver32_3}=src('simulation/planetary-history/planetary-volatiles-history-resolver-32-3.ts');
 const {PlanetH2OHistoricalSourcePRE3303A2}=src('simulation/planetary/planet-h2o-historical-source-pre33-03a2.ts');
 const {validatePlanetH2OEvolutionPRE3303A1}=src('domain/planetary/planet-h2o-evolution-contract-pre33-03a1.ts');
 const key=new UniverseGenerationKey(UniverseSeed.parse(o.seed),GeneratorVersion.V2);
 const galaxies=[];
 for(const index of o.galaxies){
  const galaxy=GalaxyGenerator.generate(key,BigInt(index));
  const grid=GalaxySectorGridGenerator.generate(galaxy);
  const candidates=makeCandidates(o.seed,index,grid.halfExtentInSectors,Math.max(1500,o.systems*100));
  const s={galaxyIndex:index,galaxy:galaxy.designation.name,systems:0,planets:0,
    datedConditional:0,missingStellarAge:0,unresolvedMultiple:0,unresolvedDeep:0,
    phase32ReconstructionClaimed:0,certifiedCT0:0,physicalConservationPassed:0,phase32VolatileSourceValidated:0,
    inventedImpactEvents:0,errors:[],examples:[]};
  for(const pos of candidates){
   if(s.systems>=o.systems)break;
   const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(pos.x,pos.y));
   if(!sector.systemLocators.length)continue;
   const digest=identity([BigInt(index).toString(),pos.x,pos.y,'SYSTEM_INDEX']);
   const loc=sector.systemLocators[parseInt(digest.slice(0,8),16)%sector.systemLocators.length];
   try{
    const mult=StellarMultihostFormation.generateOrNull(key,loc);
    const hosts=mult?.components??[StellarMultihostFormation.generateV2SingleOrNull(key,loc)];
    if(hosts.some(h=>!h))throw Error('Anfitrión físico no resuelto');
    const planets=mult?.publicPlanets?.map(x=>({planet:x.planet,atm:x.atmosphere,
      host:hosts.find(h=>h.label===x.host)??hosts[0],circumbinary:x.host==='AB'}))??
      hosts.flatMap(h=>h.planets.map((p,i)=>({planet:p,atm:h.atmospheres[i],host:h,circumbinary:false})));
    for(const {planet,atm,host,circumbinary} of planets){
     s.planets++;
     try{
      const f=PlanetH2OFormationEnginePRE3303A.project(planet,atm);
      const l=planet.locator;
      const physicalId=`G${l.galaxyIndex}/S${l.sectorKey}/O${l.galacticObjectIndex}`;
      const stellar=sourceFromHost(host,circumbinary,physicalId);
      const h32=PlanetaryVolatilesHistoryResolver32_3.resolve({atmosphere:atm,
        time:{kind:'CURRENT_SNAPSHOT',systemAgeBillionYears:null}});
      const a=PlanetH2OHistoricalSourcePRE3303A2.generate(planet,atm,f,stellar,h32);
      const b=PlanetH2OHistoricalSourcePRE3303A2.generate(planet,atm,f,stellar,h32);
      if(a.phase32VolatileSourceValidated)s.phase32VolatileSourceValidated++;
      if(JSON.stringify(a)!==JSON.stringify(b))throw Error('NONDETERMINISTIC_HISTORY');
      if(a.ct0Certified||a.playerKnowledgeUpdated||a.lifeEvaluated)
       throw Error('UNSUPPORTED_CT0_OR_BIOLOGY_PROMOTION');
      if(a.status==='MODELED_DATED_CONDITIONAL_HISTORY'){
       s.datedConditional++;
       const ev=a.evolution;
       const bad=validatePlanetH2OEvolutionPRE3303A1(ev);
       if(bad.length||ev.state!=='CONDITIONAL_EVOLUTION_COMPLETED'||
         !ev.massBalance.conditionalConservationVerified)throw Error(`INVALID_BALANCE: ${bad.join(',')}`);
       s.physicalConservationPassed++;
       if(a.history.segments.some(seg=>seg.transfers.some(t=>t.process==='EXTERNAL_DELIVERY')))
        s.inventedImpactEvents++;
      }else if(a.status==='UNRESOLVED_STELLAR_AGE_OR_EVOLUTION')s.missingStellarAge++;
      else if(a.status==='UNRESOLVED_STELLAR_FLUX_GEOMETRY')s.unresolvedMultiple++;
      else if(a.status==='UNRESOLVED_SURFACE_REFERENCE')s.unresolvedDeep++;
      if(s.examples.length<12)s.examples.push({body:planet.name,
        state:a.status,source:stellar.sourceRecordKey,
        escapedH2OKilograms:a.evolution?.massBalance.escapedH2OKilograms??null,
        oceanCertified:a.ct0Certified});
     }catch(e){s.errors.push({body:planet.name,sector:`${pos.x},${pos.y}`,error:String(e.stack||e)});}
    }
    s.systems++;
   }catch(e){s.errors.push({sector:`${pos.x},${pos.y}`,error:String(e.stack||e)});}
  }
  if(s.systems!==o.systems)s.errors.push({issue:'INCOMPLETE_SAMPLE'});
  console.log(`PRE-33.03a.2 ${s.galaxy}: ${s.systems} sistemas, ${s.planets} planetas, ${s.datedConditional} historiales condicionales, ${s.errors.length} errores`);
  galaxies.push(s);
 }
 const bad=galaxies.some(s=>s.errors.length||
    s.phase32VolatileSourceValidated!==s.planets||s.physicalConservationPassed!==s.datedConditional||s.inventedImpactEvents||s.certifiedCT0||
    s.datedConditional+s.missingStellarAge+s.unresolvedMultiple+s.unresolvedDeep!==s.planets);
 const verdict=bad?'DATED_H2O_SCENARIO_FAILED':'DATED_H2O_SCENARIO_PASSED_CT0_NOT_CERTIFIED';
 const report={contract:'PRE-33.03a.2/physical-forcing/v1',seed:o.seed,generator:'V2',
  scope:'Read-only deterministic PUBLIC V2 sample, not census nor IndexedDB',
  interpretation:'Parametrized stellar-XUV/outgassing histories are dated physical MODEL HYPOTHESES, not independently observed stellar XUV or historical climate. 19.5 carrier H2O is backprojected. No impact, player discovery or CT0 ocean certified.',
  galaxies,verdict};
 fs.mkdirSync(o.out,{recursive:true});
 const json=path.join(o.out,'pre33-03a2-historia-h2o.json');
 const md=path.join(o.out,'pre33-03a2-informe.md');
 fs.writeFileSync(json,JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync(md,[`# PRE-33.03a.2 — Generación histórica de H₂O (hipótesis físicas fechadas)`,'',
  `Semilla: ${o.seed} · Estado: ${verdict}`,'',
  '| Galaxia | Sistemas | Planetas | Historias condicionales | Edad/evolución no resuelta | Geometría múltiple no resuelta | Envoltura profunda | Errores |',
  '|---|---:|---:|---:|---:|---:|---:|---:|',
  ...galaxies.map(g=>`| ${g.galaxy} | ${g.systems} | ${g.planets} | ${g.datedConditional} | ${g.missingStellarAge} | ${g.unresolvedMultiple} | ${g.unresolvedDeep} | ${g.errors.length} |`),
  '', 'La fuente de 15.3 se usa como edad/masa/luminosidad, NO como XUV histórico medido. La historia XUV y la desgasificación son hipótesis de tasa explícitas; no se generan impactos. La única fase térmica ligada al clima es CT-0; no se inventan temperaturas históricas.',
  '', 'El total H₂O parte de una composición hipotética RETROPROYECTADA de las clases maduras 19.5. Aun con flujos fechados y balances cerrados, todas las masas CT-0 siguen etiquetadas CONDICIONALES y ninguna es océano físico certificado.',
  '', 'No modifica Fase 32, V1/V2, IndexedDB, fichas observadas ni motores de generación. PRE-33.03a.3 deberá cerrar composición inicial independiente y acoplamiento actual de atmósfera, superficie y fases antes de certificar CT-0.'
 ].join('\n')+'\n');
 console.log(`PRE-33.03a.2: ${verdict}; JSON: ${json}; informe: ${md}`);
 if(o.strict&&bad)process.exitCode=1;
}
if(require.main===module)main();
module.exports={parse,sourceFromHost};
