#!/usr/bin/env node
'use strict';
/** Read-only audit PRE-33.03a.2b: MULTIPLE systems and their public planets, never IndexedDB. */
const fs=require('node:fs'),path=require('node:path');
const {makeCandidates,identity}=require('./pre33/pre33-audit-core.cjs');
const {parse,sourceFromHost}=require('./auditar-genesis-pre33-03a2a.cjs');
function registerTS(){const ts=require('typescript');if(!require.extensions['.ts'])require.extensions['.ts']=(mod,file)=>{
 const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{
 module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true,
 useDefineForClassFields:false}}).outputText;mod._compile(js,file);};}
function src(p){return require(path.resolve('src/app',p));}
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
 const {PlanetH2OMultihostForcingPRE3303A2B}=src('simulation/planetary/planet-h2o-multihost-forcing-pre33-03a2b.ts');
 const {validatePlanetH2OEvolutionPRE3303A1}=src('domain/planetary/planet-h2o-evolution-contract-pre33-03a1.ts');
 const key=new UniverseGenerationKey(UniverseSeed.parse(o.seed),GeneratorVersion.V2),galaxies=[];
 for(const index of o.galaxies){
  const galaxy=GalaxyGenerator.generate(key,BigInt(index)),grid=GalaxySectorGridGenerator.generate(galaxy);
  const candidates=makeCandidates(o.seed,index,grid.halfExtentInSectors,Math.max(1500,o.systems*100));
  const s={galaxyIndex:index,galaxy:galaxy.designation.name,systems:0,multipleSystems:0,
   singleSystems:0,planets:0,multiplePlanets:0,sType:0,pType:0,modeledS:0,modeledP:0,ct0ConditionalFlux:0,ct0FluxUnresolved:0,
   unresolvedComponentAge:0,unresolvedStellarRadiation:0,unresolvedEvolution:0,
   unresolvedOrbitalSeparation:0,unresolvedDeep:0,physicalConservationPassed:0,
   pendingCount:0,ct0Certified:0,inventedImpactEvents:0,identityFailures:0,errors:[],examples:[]};
  for(const pos of candidates){
   if(s.systems>=o.systems)break;
   const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(pos.x,pos.y));
   if(!sector.systemLocators.length)continue;
   const digest=identity([String(index),pos.x,pos.y,'SYSTEM_INDEX']);
   const loc=sector.systemLocators[parseInt(digest.slice(0,8),16)%sector.systemLocators.length];
   try{
    const mult=StellarMultihostFormation.generateOrNull(key,loc);
    if(!mult){s.singleSystems++;s.systems++;continue;}
    s.multipleSystems++;
    const keyBase=`G${index}/S${loc.sectorKey}/O${loc.galacticObjectIndex}`;
    const geometryBase={systemSourceKey:keyBase,multiplicity:mult.components.length===3?'TRIPLE':'BINARY',
      hosts:mult.components.map(h=>({label:h.label,source:sourceFromHost(h,false,keyBase)})),
      innerOrbit:mult.innerOrbit,outerOrbit:mult.outerOrbit,
      orbitalModel:'FROZEN_16_KEPLERIAN_REFERENCE_NO_PHASE'};
    for(const p of mult.publicPlanets){
     s.planets++;s.multiplePlanets++;
     const isP=p.host==='AB';if(isP)s.pType++;else s.sType++;
     try{
      const f=PlanetH2OFormationEnginePRE3303A.project(p.planet,p.atmosphere);
      const h32=PlanetaryVolatilesHistoryResolver32_3.resolve({atmosphere:p.atmosphere,
       time:{kind:'CURRENT_SNAPSHOT',systemAgeBillionYears:null}});
      const geo={...geometryBase,planetHost:p.host,planetOrbit:p.planet.orbit};
      const a=PlanetH2OMultihostForcingPRE3303A2B.project(p.planet,p.atmosphere,f,geo,h32);
      const b=PlanetH2OMultihostForcingPRE3303A2B.project(p.planet,p.atmosphere,f,geo,h32);
      if(JSON.stringify(a)!==JSON.stringify(b))throw Error('NONDETERMINISTIC_MULTIPLE_H2O');
      if(a.ct0Certified||a.observedEvidenceGranted||a.lifeEvaluated)throw Error('GROUND_TRUTH_PROMOTED');
      if(a.ct0PhaseAverageXuvWattsPerSquareMeter===null)s.ct0FluxUnresolved++;
      else if(Number.isFinite(a.ct0PhaseAverageXuvWattsPerSquareMeter)&&a.ct0PhaseAverageXuvWattsPerSquareMeter>=0)s.ct0ConditionalFlux++;
      else throw Error('NONFINITE_CT0_XUV_SNAPSHOT');
      if(a.status.startsWith('MODELED_DATED_CONDITIONAL_MULTIPLE')){
       if(isP)s.modeledP++;else s.modeledS++;
       const errors=validatePlanetH2OEvolutionPRE3303A1(a.evolution);
       if(errors.length||!a.evolution.massBalance.conditionalConservationVerified)throw Error('INVALID_MASS_BALANCE: '+errors);
       s.physicalConservationPassed++;
       if(a.history.segments.some(x=>x.transfers.some(t=>t.process==='EXTERNAL_DELIVERY')))s.inventedImpactEvents++;
      } else {
       s.pendingCount++;
       switch(a.status){
        case 'UNRESOLVED_COMPONENT_AGE_ALIGNMENT':s.unresolvedComponentAge++;break;
        case 'UNRESOLVED_COMPONENT_STELLAR_RADIATION':s.unresolvedStellarRadiation++;break;
        case 'UNRESOLVED_COMPONENT_EVOLUTION_BOUNDARIES':s.unresolvedEvolution++;break;
        case 'UNRESOLVED_ORBITAL_SEPARATION':s.unresolvedOrbitalSeparation++;break;
        case 'UNRESOLVED_SURFACE_DOMAIN':s.unresolvedDeep++;break;
        default:throw Error('UNKNOWN_MULTIPLE_STATUS '+a.status);
       }
      }
      if(s.examples.length<14 || (s.examples.length<24&&a.status==='UNRESOLVED_COMPONENT_AGE_ALIGNMENT'))
       s.examples.push({body:p.planet.name,host:p.host,multiplicity:geometryBase.multiplicity,
        status:a.status,stellarAgesGyr:mult.components.map(h=>h.lifetime.ageBillionYears),
        avgFluxFirstBin:a.history?.segments[0]?.xuvEscape?.incidentXuvWattsPerSquareMeter??null,
        ct0PhaseAverageXuvWattsPerSquareMeter:a.ct0PhaseAverageXuvWattsPerSquareMeter,
        waterCT0Certified:false});
     }catch(e){s.errors.push({body:p.planet.name,host:p.host,sector:`${pos.x},${pos.y}`,error:String(e.stack||e)});}
    }
    s.systems++;
   }catch(e){s.errors.push({sector:`${pos.x},${pos.y}`,error:String(e.stack||e)});}
  }
  if(s.systems!==o.systems)s.errors.push({issue:'INCOMPLETE_SAMPLE'});
  console.log(`PRE-33.03a.2b ${s.galaxy}: ${s.systems} sistemas, ${s.multipleSystems} múltiples, ${s.multiplePlanets} planetas múltiples, ${s.modeledS+s.modeledP} historiales, ${s.errors.length} errores`);
  galaxies.push(s);
 }
 const fail=galaxies.some(g=>g.errors.length||g.systems!==g.singleSystems+g.multipleSystems||
   g.multiplePlanets!==g.sType+g.pType||g.multiplePlanets!==g.ct0ConditionalFlux+g.ct0FluxUnresolved||g.multiplePlanets!==g.modeledS+g.modeledP+g.pendingCount||
   g.pendingCount!==g.unresolvedComponentAge+g.unresolvedStellarRadiation+
    g.unresolvedEvolution+g.unresolvedOrbitalSeparation+g.unresolvedDeep||
   g.physicalConservationPassed!==g.modeledS+g.modeledP||g.inventedImpactEvents||g.ct0Certified);
 const verdict=fail?'MULTIPLE_ORBITAL_H2O_AUDIT_FAILED':'MULTIPLE_ORBITAL_H2O_MODEL_PASSED_CHRONOLOGY_GAPS';
 const output={contract:'PRE-33.03a.2b/multihost-orbital-forcing/v1',seed:o.seed,generator:'V2',
  scope:'Deterministic read-only PUBLIC V2 sample, NOT galactic census or persisted knowledge.',
  interpretation:'Fixed Keplerian relative orbits, phase-averaged coplanar hypothesis; A/B/C ages are generated independently and may not define a coeval history. Only within 50 Myr allows a conditional approximation; no exact phase, N-body, historical mass-loss orbit or observed XUV. No oceans CT0 certified.',
  galaxies,verdict};
 fs.mkdirSync(o.out,{recursive:true});
 const json=path.join(o.out,'pre33-03a2b-irradiacion-multiple.json'),
   md=path.join(o.out,'pre33-03a2b-informe.md');
 fs.writeFileSync(json,JSON.stringify(output,null,2)+'\n');
 fs.writeFileSync(md,[
  '# PRE-33.03a.2b — Irradiación histórica modelada en sistemas binarios y triples','',
  `Semilla: ${o.seed} · Veredicto: ${verdict}`,'',
  '| Galaxia | Sistemas | Múltiples | Planetas S | Planetas P | XUV CT-0 condicional | Historias S | Historias P | Cronología incoherente | Radiación | Evolución | Geometría | Envoltura | Errores |',
  '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
  ...galaxies.map(g=>`| ${g.galaxy} | ${g.systems} | ${g.multipleSystems} | ${g.sType} | ${g.pType} | ${g.ct0ConditionalFlux} | ${g.modeledS} | ${g.modeledP} | ${g.unresolvedComponentAge} | ${g.unresolvedStellarRadiation} | ${g.unresolvedEvolution} | ${g.unresolvedOrbitalSeparation} | ${g.unresolvedDeep} | ${g.errors.length} |`),'',
  'La irradiación usa fuentes individuales A/B/C y sus órbitas congeladas de Fase 16; promedia fases con cuadratura determinista, sin inventar conjunciones. Las masas iniciales fijan posiciones baricéntricas de referencia, NO la evolución orbital ante pérdida de masa. La XUV CT-0 de cada estrella usa su edad estelar congelada y sigue siendo condicional, NO demuestra historia común.','',
  'IMPORTANTE: los anfitriones privados múltiples V2 pueden tener edades muy diferentes; nunca se suponen coetáneos al margen del umbral explícito de 50 Myr. Una geometría resuelta por sí sola NO resuelve la historia compartida.','',
  'Todos los historiales permanecen CONDICIONALES: XUV, inclinación coplanar, química H₂O de formación y desgasificación son hipótesis. PRE-33.03a.3 debe abordar cronología común y CT-0. No se escribe Fase 32, ni IndexedDB, ni historia observada.'
 ].join('\n')+'\n');
 console.log(`PRE-33.03a.2b: ${verdict}; JSON: ${json}; informe: ${md}`);
 if(fail&&o.strict)process.exitCode=1;
}
if(require.main===module)main();
module.exports={parse};
