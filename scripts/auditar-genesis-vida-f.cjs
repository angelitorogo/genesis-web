#!/usr/bin/env node
'use strict';
/** VIDA.F: muestreo fisico-biologico V3 de solo lectura. Nunca abre IndexedDB.
 * Replica la cadena VIDA.2–9 y los origenes coloniales del indexador VIDA.9.
 * El muestreo no sustituye la cobertura de TODOS los cuerpos de una galaxia.
 */
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const originalLoader=require.extensions['.ts'];
if(!originalLoader)require.extensions['.ts']=(module,file)=>{
  const result=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,
      experimentalDecorators:true,useDefineForClassFields:false}});
  module._compile(result.outputText,file);
};
const root=path.resolve(__dirname,'../src/app');
const load=x=>require(path.join(root,x));
const {UniverseSeed}=load('domain/universe/universe-seed.ts');
const {UniverseGenerationKey}=load('domain/generation/universe-generation-key.ts');
const {GeneratorVersion}=load('domain/generation/generator-version.ts');
const {GalaxyGenerator}=load('simulation/universe/galaxy-generator.ts');
const {GalaxySectorGridGenerator}=load('simulation/sector/galaxy-sector-grid-generator.ts');
const {GalaxySectorContentGenerator}=load('simulation/sector/galaxy-sector-content-generator.ts');
const {GalaxySectorCoordinates}=load('domain/sector/galaxy-sector-coordinates.ts');
const {BodyLocator}=load('domain/generation/procedural-locator.ts');
const {vida9V3ConfirmedPhysicalTargets}=load('presentation/runtime/vida9-v3-confirmed-physical-targets.ts');
const {Vida2PhysicalInput}=load('simulation/life/life-plausibility-physical-adapter-vida2.ts');
const {ProceduralMicrobialLifeVIDA3}=load('simulation/life/procedural-microbial-life-vida3.ts');
const {ProceduralEcologyVIDA4}=load('simulation/life/procedural-ecology-vida4.ts');
const {Vida5aEcologyAtmosphere}=load('simulation/life/vida5a-ecology-atmosphere.ts');
const {Vida5bEcologicalMaturation}=load('simulation/life/vida5b-ecological-maturation.ts');
const {Vida5cAdvancedBiospheres}=load('simulation/life/vida5c-advanced-biospheres.ts');
const {Vida6EcosystemsSpecies}=load('simulation/life/vida6-ecosystems-species.ts');
const {Vida7IntelligenceCivilizations}=load('simulation/life/vida7-intelligence-civilizations.ts');
const {Vida8TechnologicalColonization}=load('simulation/life/vida8-technological-colonization.ts');
const {Vida8LocalOriginDiscovery}=load('simulation/life/vida8-local-origin-discovery.ts');
const {Vida9BiologyExploration}=load('simulation/life/vida9-biology-exploration.ts');
const {VidaFClosureAudit}=load('simulation/life/vida-f-closure-audit.ts');
const opts={seed:'7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',galaxyIndex:0,
  limitSystems:250,maxMoonsPerPlanet:4,
  out:path.resolve('auditoria-vida-f-resultado.json')};
for(const arg of process.argv.slice(2)){
  const [flag,...value]=arg.split('='); const str=value.join('=');
  if(flag==='--seed')opts.seed=str;
  else if(flag==='--galaxy-index')opts.galaxyIndex=Number(str);
  else if(flag==='--limit-systems')opts.limitSystems=Number(str);
  else if(flag==='--max-moons-per-planet')opts.maxMoonsPerPlanet=Number(str);
  else if(flag==='--out')opts.out=path.resolve(str);
  else throw Error('Argumento desconocido: '+arg);
}
for(const n of ['galaxyIndex','limitSystems','maxMoonsPerPlanet']){
  if(!Number.isSafeInteger(opts[n]) || opts[n]<0 || (n==='limitSystems' && opts[n]===0))
    throw Error('Argumento entero invalido: '+n);
}
const key=new UniverseGenerationKey(UniverseSeed.parse(opts.seed),GeneratorVersion.V3);
const galaxy=GalaxyGenerator.generate(key,BigInt(opts.galaxyIndex));
const grid=GalaxySectorGridGenerator.generate(galaxy);
const half=grid.halfExtentInSectors;
const result={revision:'VIDA.F/cierre-auditable/v1',semilla:opts.seed,
  galaxia:galaxy.designation.name,galaxyIndex:opts.galaxyIndex,
  alcance:{limiteSistemas:opts.limitSystems,maxLunasFisicasPorPlaneta:opts.maxMoonsPerPlanet},
  cobertura:{sectoresVisitados:0,sistemasVisitados:0,sistemasSinModelo:0,
    planetasEvaluados:0,lunasEvaluadas:0,planetasSinModelo:0,lunasSinModelo:0,
    erroresFisicos:0,erroresBiologicos:0},
  diversidad:{planetasConVida:0,lunasConVida:0,planetasSinVida:0,lunasSinVida:0,
    jerarquiasCompletas:0,planetasConInteligencia:0,civilizaciones:0,
    niveles:{PRIMITIVE:0,ADVANCED:0,VERY_ADVANCED:0},
    coloniasEnPlanetas:0,coloniasEnLunas:0,coloniasEnCuerposNoPlausibles:0,
    civilizacionesConOxigenoValidado:0},
  hallazgos:[],sinModelo:[],muestras:[],
  evaluacion:'PENDIENTE'};
const issue=(kind,body,error)=>{
  if(kind==='FISICO')result.cobertura.erroresFisicos++;else result.cobertura.erroresBiologicos++;
  if(result.hallazgos.length<70)result.hallazgos.push({kind,body,error:String(error?.message??error)});
};
const missing=(type,body)=>{
  result.cobertura[type==='PLANETA'?'planetasSinModelo':'lunasSinModelo']++;
  if(result.sinModelo.length<35)result.sinModelo.push({type,body});
};
const known=new Set();
const sourcesKey=loc=>({universeSeed:opts.seed,generatorVersionCode:3,
  galaxyIndex:String(loc.galaxyIndex),sectorKey:String(loc.sectorKey),
  galacticObjectIndex:String(loc.galacticObjectIndex)});
const identity=(loc,kind,moonIndex)=>({...sourcesKey(loc),kind,
  bodyIndex:String(loc.bodyIndex),moonIndex});
const isNonConverged=e=>String(e?.message??e).includes('NON_CONVERGED_PHASE_MODEL');
function physicalOrNull(resolve,body){
  try{return resolve();}catch(e){
    if(isNonConverged(e))return null;
    issue('FISICO',body,e);return null;
  }
}
function biology(id,physical,planet){
  const m=ProceduralMicrobialLifeVIDA3.evaluate(id,physical);
  const ecology=ProceduralEcologyVIDA4.evaluate(m);
  const coupled=planet && Array.isArray(planet.detail.atmosphere.retainedGasComposition)
    ?Vida5aEcologyAtmosphere.evaluate(ecology,planet):null;
  const mature=coupled?Vida5bEcologicalMaturation.evaluate(coupled):null;
  const cal=mature?Vida5cAdvancedBiospheres.evaluate(m,ecology,mature,planet):undefined;
  const eco=Vida6EcosystemsSpecies.evaluate(m,ecology,cal);
  const intel=Vida7IntelligenceCivilizations.evaluate(eco,cal);
  return {microbial:m,calibration:cal,ecosystem:eco,intelligence:intel};
}
const physicalFingerprint=target=>JSON.stringify(target,(_key,value)=>
  typeof value==='bigint'?`#bigint:${value.toString()}`:value);
function inspect(id,target,assess,planet,origins,originIndex,solidSurface,type,description){
  const before=physicalFingerprint(target);
  try{
    const b=biology(id,assess,planet);
    const c=Vida8TechnologicalColonization.evaluate({ecosystem:b.ecosystem,
      nativeCivilization:b.intelligence,physical:assess,solidSurface},origins);
    const record=Vida9BiologyExploration.evaluate(b.ecosystem,b.intelligence,c);
    const r=VidaFClosureAudit.evaluate({...b,colonization:c,record,physicalAssessment:assess,
      originSpeciesByBody:originIndex,physicalBefore:before,physicalAfter:physicalFingerprint(target)});
    const repeated=Vida9BiologyExploration.evaluate(b.ecosystem,b.intelligence,
      Vida8TechnologicalColonization.evaluate({ecosystem:b.ecosystem,
        nativeCivilization:b.intelligence,physical:assess,solidSurface},[...origins].reverse()));
    if(repeated.digest!==record.digest)issue('DETERMINISMO',description,'VIDA.8–9 dependen del orden de origen');
    if(r.findings.length)for(const finding of r.findings)issue('BIOLOGIA',description,`${finding.code}: ${finding.explanation}`);
    const d=result.diversidad;
    if(type==='PLANETA')result.cobertura.planetasEvaluados++;
    else result.cobertura.lunasEvaluadas++;
    if(b.ecosystem.biospherePresent)d[type==='PLANETA'?'planetasConVida':'lunasConVida']++;
    else d[type==='PLANETA'?'planetasSinVida':'lunasSinVida']++;
    if(r.observed.fullHierarchy)d.jerarquiasCompletas++;
    if(b.intelligence.intelligencePresent)d.planetasConInteligencia++;
    if(b.intelligence.civilization){d.civilizaciones++;
      d.niveles[b.intelligence.civilization.tier]++;
      if(r.observed.oxygenChecked)d.civilizacionesConOxigenoValidado++;}
    d[type==='PLANETA'?'coloniasEnPlanetas':'coloniasEnLunas']+=c.colonies.length;
    if(r.observed.uninhabitableWithColony)d.coloniasEnCuerposNoPlausibles+=c.colonies.length;
    if(result.muestras.length<25 && (b.intelligence.civilizationPresent||c.colonies.length||
      (type==='LUNA'&&b.ecosystem.biospherePresent)))
      result.muestras.push({cuerpo:description,tipo:type,vida:b.ecosystem.biospherePresent,
        especies:b.ecosystem.species.length,civilizacion:b.intelligence.civilization?.tier??null,
        colonias:c.colonies.length,digestVIDA9:record.digest});
  }catch(e){issue('BIOLOGIA',description,e);}
}
console.log(`VIDA.F — muestreo de ${result.galaxia}, G${opts.galaxyIndex}; tope ${opts.limitSystems} sistemas; solo lectura.`);
let reached=false;
outer:for(let x=-half;x<=half;x++)for(let y=-half;y<=half;y++){
  const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(x,y));
  result.cobertura.sectoresVisitados++;
  for(const loc of sector.systemLocators){
    if(result.cobertura.sistemasVisitados>=opts.limitSystems){reached=true;break outer;}
    const systemId=[loc.galaxyIndex,loc.sectorKey,loc.galacticObjectIndex].join('/');
    if(known.has(systemId)){issue('FISICO',systemId,'Sistema duplicado');continue;}
    known.add(systemId);result.cobertura.sistemasVisitados++;
    let adapter;
    try{adapter=vida9V3ConfirmedPhysicalTargets(key,loc);}catch(e){
      issue('FISICO',systemId,e);continue;}
    if(!adapter){result.cobertura.sistemasSinModelo++;continue;}
    const planets=[];
    for(let p=0;p<adapter.planetCount;p++){
      const body=new BodyLocator(loc.galaxyIndex,loc.sectorKey,loc.galacticObjectIndex,BigInt(p));
      const description=systemId+'/'+p;
      const target=physicalOrNull(()=>adapter.resolvePlanet(body),'planeta '+description);
      if(!target){missing('PLANETA',description);continue;}
      planets.push({body,target,description});
    }
    // Mismo descubridor de civilizaciones de origen que VIDA.9; ninguna fuente externa.
    let origins=[];
    try{origins=Vida8LocalOriginDiscovery.findInSystem(sourcesKey(loc),adapter.planetCount,
      (i)=>{
        const saved=planets.find(p=>p.body.bodyIndex===i);
        return saved?.target??null;
      });}
    catch(e){issue('BIOLOGIA',systemId+' origen colonial',e);continue;}
    const originIndex=Object.fromEntries(origins.map(s=>[
      s.ecosystem.bodyStorageKey,s.ecosystem.species.map(sp=>sp.id)]));
    for(const {body,target,description} of planets){
      const id=identity(body,'PLANET',null);
      const physical=Vida2PhysicalInput.planet(target);
      inspect(id,target,physical,target,origins,originIndex,
        target.detail.surface.hasDefinedSolidSurfaceBase,'PLANETA',description);
      if(opts.maxMoonsPerPlanet>0){
        for(const moon of target.detail.moons.relevantMoons.slice(0,opts.maxMoonsPerPlanet)){
          const label='luna '+description+'/'+moon.moonIndex;
          const lunar=physicalOrNull(()=>adapter.resolveMoon(body,BigInt(moon.moonIndex)),label);
          if(!lunar){missing('LUNA',label);continue;}
          const lunaId=identity(body,'MOON',String(moon.moonIndex));
          inspect(lunaId,lunar,Vida2PhysicalInput.moon(lunar),null,origins,originIndex,true,
            'LUNA',label);
        }
      }
    }
    if(result.cobertura.sistemasVisitados%50===0){
      console.log(`Sistemas ${result.cobertura.sistemasVisitados}; planetas ${result.cobertura.planetasEvaluados}; lunas ${result.cobertura.lunasEvaluadas}; incidencias ${result.cobertura.erroresFisicos+result.cobertura.erroresBiologicos}`);
    }
  }
}
result.cobertura.sectoresTotales=(half*2+1)**2;
result.cobertura.galaxiaCompleta=!reached && result.cobertura.sectoresVisitados===result.cobertura.sectoresTotales;
const c=result.cobertura;
result.evaluacion=c.erroresBiologicos||c.erroresFisicos?'HALLAZGOS_PENDIENTES':
  c.planetasSinModelo||c.lunasSinModelo||c.sistemasSinModelo?'MUESTRA_CON_HUECOS':
    c.galaxiaCompleta?'SIN_HALLAZGOS_EN_CUERPOS_EVALUADOS':'MUESTRA_SIN_HALLAZGOS';
result.limitaciones=[
  'Lectura procedural V3; no se ha consultado la IndexedDB de la partida.',
  'El limite de sistemas y lunas define la muestra; no se equipara a cobertura galactica completa.',
  'Los escenarios que no aparecen en la muestra deben comprobarse mediante pruebas controladas.',
  'El estado VIDA.F no queda cerrado hasta ejecutar arquitectura, unitarios, worker, build y E2E.',
];
fs.mkdirSync(path.dirname(opts.out),{recursive:true});
fs.writeFileSync(opts.out,JSON.stringify(result,null,2)+'\n','utf8');
console.log('\n=== RESULTADO VIDA.F ===');
console.log(`Planetas ${c.planetasEvaluados}, lunas ${c.lunasEvaluadas}; vida en planetas ${result.diversidad.planetasConVida}, vida en lunas ${result.diversidad.lunasConVida}.`);
console.log(`Civilizaciones ${result.diversidad.civilizaciones}; colonias ${result.diversidad.coloniasEnPlanetas+result.diversidad.coloniasEnLunas}; colonias en destinos no plausibles ${result.diversidad.coloniasEnCuerposNoPlausibles}.`);
console.log(`Errores biologicos ${c.erroresBiologicos}; errores fisicos ${c.erroresFisicos}; cuerpos sin modelo ${c.planetasSinModelo+c.lunasSinModelo}.`);
console.log(`Estado: ${result.evaluacion}. Archivo: ${opts.out}`);
if(c.erroresBiologicos||c.erroresFisicos)process.exitCode=1;
