#!/usr/bin/env node
'use strict';
/** Read-only multihost clock audit. Shadows must NEVER write frozen V2/Phase32. */
const fs=require('node:fs'),path=require('node:path');
const {makeCandidates,identity}=require('./pre33/pre33-audit-core.cjs');
const {parse}=require('./auditar-genesis-pre33-03a2a.cjs');
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
 const {PlanetH2OMultihostChronologyPRE3303A2B1}=src('simulation/planetary/planet-h2o-multihost-chronology-pre33-03a2b1.ts');
 const {PlanetaryVolatilesHistoryResolver32_3}=src('simulation/planetary-history/planetary-volatiles-history-resolver-32-3.ts');
 const {validatePlanetH2OEvolutionPRE3303A1}=src('domain/planetary/planet-h2o-evolution-contract-pre33-03a1.ts');
 const key=new UniverseGenerationKey(UniverseSeed.parse(o.seed),GeneratorVersion.V2),galaxies=[];
 for(const index of o.galaxies){
  const galaxy=GalaxyGenerator.generate(key,BigInt(index)),grid=GalaxySectorGridGenerator.generate(galaxy);
  const candidates=makeCandidates(o.seed,index,grid.halfExtentInSectors,Math.max(1500,o.systems*100));
  const s={galaxyIndex:index,galaxy:galaxy.designation.name,systems:0,multipleSystems:0,multiplePlanets:0,
   distinctFrozenAges:0,frozenAlreadyCoeval:0,coevalReferenceCompleted:0,
   phaseConflict:0,missingInputs:0,missingPrimaryAge:0,forcingOrSurface:0,
   physicalConservationPassed:0,mutationFailures:0,ct0WaterCertified:0,errors:[],examples:[]};
  for(const pos of candidates){
   if(s.systems>=o.systems)break;
   const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(pos.x,pos.y));
   if(!sector.systemLocators.length)continue;
   const digest=identity([String(index),pos.x,pos.y,'SYSTEM_INDEX']);
   const loc=sector.systemLocators[parseInt(digest.slice(0,8),16)%sector.systemLocators.length];
   try{
    const mult=StellarMultihostFormation.generateOrNull(key,loc);
    if(!mult){s.systems++;continue;}
    s.multipleSystems++;
    for(const p of mult.publicPlanets){
     s.multiplePlanets++;
     try{
      const formation=PlanetH2OFormationEnginePRE3303A.project(p.planet,p.atmosphere);
      const h32=PlanetaryVolatilesHistoryResolver32_3.resolve({atmosphere:p.atmosphere,
       time:{kind:'CURRENT_SNAPSHOT',systemAgeBillionYears:null}});
      const frozenAges=mult.components.map(c=>c.lifetime.ageBillionYears);
      const snapshot=JSON.stringify({ages:frozenAges,phases:mult.components.map(c=>c.lifetime.evolutionAssessment.evolutionState.name),
       body:String(p.planet.locator.galaxyIndex)+'/'+String(p.planet.locator.sectorKey)+'/'+String(p.planet.locator.galacticObjectIndex)+'/'+String(p.planet.locator.bodyIndex),orbit:[p.planet.orbit.semiMajorAxisAu,p.planet.orbit.eccentricity]});
      const a=PlanetH2OMultihostChronologyPRE3303A2B1.project(mult,p,formation,h32);
      const b=PlanetH2OMultihostChronologyPRE3303A2B1.project(mult,p,formation,h32);
      if(JSON.stringify(a)!==JSON.stringify(b))throw Error('NONDETERMINISTIC_COEVAL_SHADOW');
      const after=JSON.stringify({ages:mult.components.map(c=>c.lifetime.ageBillionYears),
       phases:mult.components.map(c=>c.lifetime.evolutionAssessment.evolutionState.name),
       body:String(p.planet.locator.galaxyIndex)+'/'+String(p.planet.locator.sectorKey)+'/'+String(p.planet.locator.galacticObjectIndex)+'/'+String(p.planet.locator.bodyIndex),orbit:[p.planet.orbit.semiMajorAxisAu,p.planet.orbit.eccentricity]});
      if(snapshot!==after||a.editsFrozenV2||a.editsPhase32||a.editsPlayerKnowledge)
       {s.mutationFailures++;throw Error('FROZEN_V2_OR_PHASE32_MUTATED');}
      if(a.waterCT0Certified||a.realMultiHostHistoryCertified)throw Error('FALSE_HISTORY_CERTIFICATION');
      if(!a.frozenComponentsCoEval)s.distinctFrozenAges++;
      switch(a.status){
       case 'FROZEN_COMPONENTS_ALREADY_COEVAL':s.frozenAlreadyCoeval++;break;
       case 'COEVAL_REFERENCE_CONDITIONAL_COMPLETED':s.coevalReferenceCompleted++;break;
       case 'UNRESOLVED_COEVAL_PHASE_CONFLICT':s.phaseConflict++;break;
       case 'UNRESOLVED_COEVAL_INPUT':s.missingInputs++;break;
       case 'UNRESOLVED_PRIMARY_AGE':s.missingPrimaryAge++;break;
       case 'UNRESOLVED_FORCING_OR_SURFACE':s.forcingOrSurface++;break;
       default:throw Error('UNKNOWN_STATUS '+a.status);
      }
      if(a.conditionalReference?.evolution){
       const r=a.conditionalReference;
       if(!r.evolution.massBalance.conditionalConservationVerified||
        validatePlanetH2OEvolutionPRE3303A1(r.evolution).length)throw Error('WATER_MASS_NOT_CONSERVED');
       s.physicalConservationPassed++;
      }
      if(s.examples.length<12)s.examples.push({body:p.planet.name,host:p.host,status:a.status,
       originalAgesGyr:frozenAges,referenceAgeGyr:a.sharedAgeReferenceBillionYears,
       componentPhaseCompatible:a.components.map(c=>c.phaseCompatible),
       waterCT0Certified:false});
     }catch(e){s.errors.push({body:p.planet.name,error:String(e.stack||e)});}
    }
    s.systems++;
   }catch(e){s.errors.push({sector:`${pos.x},${pos.y}`,error:String(e.stack||e)});}
  }
  if(s.systems!==o.systems)s.errors.push({issue:'INCOMPLETE_SAMPLE'});
  console.log(`PRE-33.03a.2b.1 ${s.galaxy}: ${s.systems} sistemas, ${s.multiplePlanets} planetas, ${s.coevalReferenceCompleted} escenarios coetáneos, ${s.phaseConflict} conflictos fase, ${s.errors.length} errores`);
  galaxies.push(s);
 }
 const failed=galaxies.some(g=>g.errors.length||g.mutationFailures||g.ct0WaterCertified||
  g.multiplePlanets!==g.frozenAlreadyCoeval+g.coevalReferenceCompleted+g.phaseConflict+
  g.missingInputs+g.missingPrimaryAge+g.forcingOrSurface);
 const verdict=failed?'COEVAL_SHADOW_AUDIT_FAILED':'COEVAL_SHADOW_AUDIT_PASSED_FROZEN_V2_UNCHANGED';
 const report={contract:'PRE-33.03a.2b.1/coeval-shadow/v1',seed:o.seed,generator:'V2',
  interpretation:'Public V2 uses independent private V1 scopes for components B/C. Coeval primary-A reference is an alternative counterfactual; state recomputed from frozen initial mass/metallicity; only coarse-phase-compatible branches may produce conditional H2O histories. NOT a correction/migration of frozen V2; no CT0 water certified.',
  galaxies,verdict};
 fs.mkdirSync(o.out,{recursive:true});
 const json=path.join(o.out,'pre33-03a2b1-cronologia-multihost.json'),md=path.join(o.out,'pre33-03a2b1-informe.md');
 fs.writeFileSync(json,JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync(md,[`# PRE-33.03a.2b.1 — Diagnóstico y escenario cronológico multihost`, '',
  `Semilla: ${o.seed} · Veredicto: ${verdict}`,'',
  '| Galaxia | Sistemas | Múltiples | Planetas | Edades independientes | Escenarios coetáneos condicionales | Fases incompatibles | Otros no resueltos | Errores |',
  '|---|---:|---:|---:|---:|---:|---:|---:|---:|',
  ...galaxies.map(g=>`| ${g.galaxy} | ${g.systems} | ${g.multipleSystems} | ${g.multiplePlanets} | ${g.distinctFrozenAges} | ${g.coevalReferenceCompleted} | ${g.phaseConflict} | ${g.missingInputs+g.missingPrimaryAge+g.forcingOrSurface} | ${g.errors.length} |`),
  '', 'Origen: StellarMultihostFormation genera componentes privadas A/B/C usando fuentes SINGLE independientes de 15.3; StellarBinaryCompanionGenerator de 16.2 sí hereda edad A, pero NO es el generador usado en esta ruta.',
  '', 'El escenario coetáneo usa como referencia la edad A y recalcula el estado de B/C con 14.8; lo rechaza ante incompatibilidad de fase. No corrige ni sobreescribe los sistemas V2. El resultado es ALTERNATIVO/CONDICIONAL, NO historia real certificada.',
  '', 'Para corregir el pasado V2 canónico será necesaria una transición de versión de los perfiles físicos con migración explícita y regresión integral de fichas, planetas e historia 32; no está autorizada por este parche.',
  '', 'PRE-33.03a.3 sigue pendiente de certificación CT0; PRE-33.03b cubrirá las envolturas profundas.'
 ].join('\n')+'\n');
 console.log(verdict, json);
 if(failed&&o.strict)process.exitCode=1;
 return report;
}
if(require.main===module)main();
module.exports={main,parse};
