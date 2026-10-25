#!/usr/bin/env node
'use strict';
/** PRE-33.03c integrated, read-only V3 chain audit: 17->18->19.5->CT0->03b.
 * Strict fails on independent structural/scientific contradictions. Claims do
 * not extend to remote IndexedDB, observed oceans, or all unsampled systems. */
const fs=require('node:fs'),path=require('node:path');
const {makeCandidates,identity}=require('./pre33/pre33-audit-core.cjs');
const {parse}=require('./auditar-genesis-pre33-03a2a.cjs');
const {validateRecord,validateSharedDisk,validateCoEval}=require('./pre33/pre33-03c-integrity.cjs');
function register(){const ts=require('typescript');if(!require.extensions['.ts'])require.extensions['.ts']=(m,f)=>{
 const js=ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true,useDefineForClassFields:false}}).outputText;m._compile(js,f);};}
const load=p=>require(path.resolve('src/app',p));
const error=(s,where,issues)=>s.errors.push({where,issues:issues.map(x=>typeof x==='string'?x:x.code)});
function main(argv=process.argv.slice(2)) {
 const o=parse(argv);register();
 const {UniverseSeed}=load('domain/universe/universe-seed.ts');
 const {UniverseGenerationKey}=load('domain/generation/universe-generation-key.ts');
 const {GeneratorVersion}=load('domain/generation/generator-version.ts');
 const {GalaxyGenerator}=load('simulation/universe/galaxy-generator.ts');
 const {GalaxySectorGridGenerator}=load('simulation/sector/galaxy-sector-grid-generator.ts');
 const {GalaxySectorContentGenerator}=load('simulation/sector/galaxy-sector-content-generator.ts');
 const {GalaxySectorCoordinates}=load('domain/sector/galaxy-sector-coordinates.ts');
 const {StellarMultihostFormation}=load('simulation/stellar/stellar-multihost-formation.ts');
 const {PlanetH2OV3FormationOrigin:Origin}=load('simulation/planetary/planet-h2o-v3-formation-origin.ts');
 const {PlanetH2OForwardCT0EnginePRE3303A3:Forward}=load('simulation/planetary/planet-h2o-forward-ct0-pre33-03a3.ts');
 const {PlanetDeepOceanEnvelopeEnginePRE3303B:Deep}=load('simulation/planetary/planet-deep-ocean-envelope-pre33-03b.ts');
 const {validateH2OForwardCT0Result}=load('domain/planetary/planet-h2o-forward-ct0-pre33-03a3.ts');
 const {validatePlanetDeepOceanEnvelopePRE3303B}=load('domain/planetary/planet-deep-ocean-envelope-pre33-03b.ts');
 if(GeneratorVersion.V3?.code!==3)throw Error('V3_DEFAULT_CONTRACT_MISSING');
 const key=new UniverseGenerationKey(UniverseSeed.parse(o.seed),GeneratorVersion.V3);
 const galaxies=[];const globalBodies=new Set();
 for(const gi of o.galaxies){
  const galaxy=GalaxyGenerator.generate(key,BigInt(gi));
  const grid=GalaxySectorGridGenerator.generate(galaxy);
  const candidates=makeCandidates(o.seed,gi,grid.halfExtentInSectors,Math.max(1500,o.systems*100));
  const g={galaxyIndex:gi,galaxy:galaxy.designation.name,systems:0,single:0,binary:0,triple:0,
   planets:0,modeledCT0Closed:0,positiveFormation:0,waterAtCT0:0,deepGasEnvelope:0,
   radialScenario:0,radialUnresolved:0,coevalSystems:0,sourceDiskCount:0,
   modeledLiquidThicknessShown:0,independentThermalProfiles:0,
   kg:{formation:0,delivered:0,escaped:0,retained:0},maxResidual01:0,
   issueCodes:{},errors:[]};
  for(const pos of candidates){
   if(g.systems>=o.systems)break;
   const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(pos.x,pos.y));
   if(!sector.systemLocators.length)continue;
   const digest=identity([String(gi),pos.x,pos.y,'SYSTEM_INDEX']);
   const loc=sector.systemLocators[parseInt(digest.slice(0,8),16)%sector.systemLocators.length];
   const where=`G${gi}/S${pos.x},${pos.y}`;
   try{
    const mult=StellarMultihostFormation.generateOrNull(key,loc);
    const single=mult?null:StellarMultihostFormation.generateSingleOrNull(key,loc);
    if(!mult&&!single)throw Error('NO_V3_FORMATION');
    const hosts=mult?.components??[single];
    const types=hosts.length;
    if(![1,2,3].includes(types))throw Error('BAD_MULTIPLICITY');
    const ageIssues=validateCoEval(hosts);
    if(ageIssues.length)error(g,where,ageIssues);else if(types>1)g.coevalSystems++;
    if(types===1)g.single++;if(types===2)g.binary++;if(types===3)g.triple++;
    const rows=mult?.publicPlanets??single.planets.map((planet,i)=>({planet,atmosphere:single.atmospheres[i],host:'A'}));
    const disks=new Map();
    g.systems++;
    for(const {planet,atmosphere,host,publicLocator} of rows){
     // Multihost Planet objects deliberately retain PRIVATE source locators.
     // Global identity must use the PUBLIC locator (A/B/C/AB ordering).
     const pub=publicLocator??planet.locator;
     const body=`G${pub.galaxyIndex}/S${pub.sectorKey}/O${pub.galacticObjectIndex}/B${pub.bodyIndex}`;
     try{
      if(globalBodies.has(body))throw Error('DUPLICATE_PUBLIC_BODY_LOCATOR');
      globalBodies.add(body);
      if(!atmosphere)throw Error('ATMOSPHERE_MISSING');
      const origin=Origin.sourceForPlanet(planet);
      if(!origin)throw Error('NO_NATIVE_DISK_ORIGIN');
      const environment=Origin.environmentForPlanet(planet,atmosphere);
      const forward=Forward.project(planet,atmosphere,environment);
      const deep=Deep.project(planet,atmosphere);
      const issues=[...validateRecord({planet,atmosphere,origin,environment,forward,deep}),
        ...validateH2OForwardCT0Result(forward).map(code=>({code})),
        ...validatePlanetDeepOceanEnvelopePRE3303B(deep).map(code=>({code}))];
      if(issues.length)error(g,body,issues);
      const diskOrigins=disks.get(planet.hostPlanetarySystem)??[];
      diskOrigins.push(origin);disks.set(planet.hostPlanetarySystem,diskOrigins);
      g.planets++;if(origin.formationWaterKilograms>0)g.positiveFormation++;
      if(forward.v3ModelBalanceCertified===true)g.modeledCT0Closed++;
      if(forward.waterKilograms.modeledCT0>0)g.waterAtCT0++;
      if(deep.classification==='DEEP_GAS_ENVELOPE_NO_SOLID_SURFACE')g.deepGasEnvelope++;
      if(deep.candidateWaterShell.status==='CONDITIONAL_GEOMETRY')g.radialScenario++;
      else g.radialUnresolved++;
      if(forward.deepWater.liquidLayerThicknessMeters!==null)g.modeledLiquidThicknessShown++;
      if(forward.deepWater.hasIndependentlySourcedThermalProfile)g.independentThermalProfiles++;
      g.kg.formation+=origin.formationWaterKilograms;
      g.kg.delivered+=forward.waterKilograms.externalDelivery??0;
      g.kg.escaped+=forward.waterKilograms.escaped??0;
      g.kg.retained+=forward.waterKilograms.modeledCT0??0;
      g.maxResidual01=Math.max(g.maxResidual01,forward.relativeMassResidual01??0);
     }catch(e){error(g,body,[String(e.message||e)]);}
    }
    for(const records of disks.values()){
     g.sourceDiskCount++;
     const errors=validateSharedDisk(records);
     if(errors.length)error(g,where,errors);
    }
   }catch(e){error(g,where,[String(e.message||e)]);}
  }
  if(g.systems!==o.systems||g.systems!==g.single+g.binary+g.triple||
     g.modeledCT0Closed!==g.planets||g.radialScenario+g.radialUnresolved!==g.planets||
     g.coevalSystems!==g.binary+g.triple)
     error(g,'SUMMARY',['INCOMPLETE_V3_OR_CT0_COVERAGE']);
  for(const e of g.errors)for(const code of e.issues)g.issueCodes[code]=(g.issueCodes[code]||0)+1;
  console.log(`${g.galaxy}: ${g.systems} sistemas, ${g.planets} planetas, ${g.modeledCT0Closed} balances, ${g.errors.length} incidencias`);
  galaxies.push(g);
 }
 const failures=galaxies.flatMap(g=>g.errors.map(e=>({galaxy:g.galaxy,...e})));
 const totals={systems:0,planets:0,binary:0,triple:0,modeledCT0Closed:0,errors:failures.length};
 for(const g of galaxies)for(const k of Object.keys(totals))if(k!=='errors')totals[k]+=g[k];
 const report={contract:'PRE-33.03c/V3-H2O-INTEGRAL-CLOSURE/v1',
  seed:o.seed,version:'V3',sample:'Deterministic 4-ring sector sampling, not full galaxy census',
  status:failures.length?'BLOCKED_BY_AUDIT_FINDINGS':'MODELED_V3_WATER_CHAIN_AUDITED',
  totals,galaxies,
  evidence:{diskChemistry:'SOLAR_ELEMENTAL_ABUNDANCE_PATTERN_MODEL_NOT_INDEPENDENT_OBSERVATION',
   waterHistory:'DATED_PARAMETERIZED_XUV_OUTGASSING_RESIDUAL_DISK_NOT_OBSERVED_IMPACTS',
   waterCT0:'CLOSED_MODELED_MASS_BALANCE_NOT_INDEPENDENT_CHEMICAL_MEASUREMENT',
   thermal:'CONDITIONAL_DEPTH_PRESSURE_NOT_CERTIFIED_ICE_PHASE',
   playerKnowledge:'READ_ONLY_NO_DISCOVERIES_GRANTED',
   legacy:'V1_AND_V2_GENERATORS_NOT_MODIFIED_BY_THIS_AUDITOR'},
  remainingScientificLimits:[
   'No individually generated/observed native disk C/O abundance distribution beyond solar-pattern metallicity scaling',
   'No independently reconstructed impact chronology or spectrally measured historical XUV',
   'No solved compressible interior EOS or independently constrained deep P-T phase diagram',
   'No observational certification of oceans; UI and IndexedDB not audited by this read-only Node runner'],
  failures};
 fs.mkdirSync(o.out,{recursive:true});
 const base='pre33-03c-auditoria-integral';
 fs.writeFileSync(path.join(o.out,base+'.json'),JSON.stringify(report,null,2)+'\n');
 const row=g=>`| ${g.galaxy} | ${g.systems} | ${g.single} | ${g.binary} | ${g.triple} | ${g.planets} | ${g.modeledCT0Closed} | ${g.deepGasEnvelope} | ${g.radialScenario} | ${g.errors.length} |`;
 fs.writeFileSync(path.join(o.out,base+'.md'),[
  '# PRE-33.03c — Auditoría integral de cierre de H₂O V3','',
  `**Veredicto del muestreo:** ${report.status}`,'',
  `Semilla: \`${o.seed}\`. **Solo lectura**: no accede a IndexedDB, no cambia conocimiento.`,'',
  '| Galaxia | Sistemas | SINGLE | BINARY | TRIPLE | Planetas | CT-0 modelo cerrado | Gas profundo | Estructura radial condicional | Incidencias |',
  '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',...galaxies.map(row),'',
  `Totales: ${totals.systems} sistemas; ${totals.planets} planetas; ${totals.modeledCT0Closed} CT-0 modelados cerrados; ${failures.length} incidencias.`,
  '', '## Qué certifica esta auditoría','',
  'Que los planetas V3 **muestreados** conservan identidad y procedencia 17.7, presupuestos químicos comunes de disco, historia fechada continua, reparto y conservación de masa H₂O CT-0, multihost coetáneos y escenarios estructurales 33.03b sin observación fingida.',
  '', '## Límites científicos que NO se han cerrado mediante este muestreo','',
  ...report.remainingScientificLimits.map(x=>`- ${x}`),'',
  ...(failures.length?['## Incidencias','',...failures.slice(0,30).map(x=>`- ${x.galaxy} ${x.where}: ${x.issues.join(', ')}`),'']:[]),
  '## Regresión oficial requerida','',
  'Ejecutar en Angular/Vitest/Playwright del usuario las pruebas dirigidas, `npm run test:architecture`, `npm run test:worker`, `npm run test:e2e:typecheck`, `npx ng build` y `npm run test:e2e`.',
  'La auditoría Node no sustituye esas pruebas ni demuestra persistencia real en el navegador.'
 ].join('\n')+'\n');
 console.log(report.status);
 if(o.strict&&failures.length)process.exitCode=1;
 return report;
}
if(require.main===module)main();module.exports={main};
