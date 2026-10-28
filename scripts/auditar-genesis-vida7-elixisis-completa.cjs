#!/usr/bin/env node
'use strict';
/** GENESIS VIDA.7 — censo fisico-biologico COMPLETO y de solo lectura de Elixisis.
 * No abre Dexie/IndexedDB; reproduce la ruta V3 de la ficha y del indexador VIDA.9.
 * Evita el pronostico antiguo 60/30/10 de VIDA.5c: cuenta niveles EFECTIVOS 65/30/5.
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
if (!require.extensions['.ts']) require.extensions['.ts'] = (module, file) => {
  const compiled = ts.transpileModule(fs.readFileSync(file,'utf8'), {
    fileName:file, compilerOptions: {
      module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2022,
      experimentalDecorators:true, useDefineForClassFields:false,
    },
  });
  module._compile(compiled.outputText,file);
};
const root = path.resolve(__dirname,'../src/app');
const load = x => require(path.join(root,x));
const {UniverseSeed} = load('domain/universe/universe-seed.ts');
const {UniverseGenerationKey} = load('domain/generation/universe-generation-key.ts');
const {GeneratorVersion} = load('domain/generation/generator-version.ts');
const {GalaxyGenerator} = load('simulation/universe/galaxy-generator.ts');
const {GalaxySectorGridGenerator} = load('simulation/sector/galaxy-sector-grid-generator.ts');
const {GalaxySectorContentGenerator} = load('simulation/sector/galaxy-sector-content-generator.ts');
const {GalaxySectorCoordinates} = load('domain/sector/galaxy-sector-coordinates.ts');
const {BodyLocator} = load('domain/generation/procedural-locator.ts');
const {vida9V3ConfirmedPhysicalTargets} = load('presentation/runtime/vida9-v3-confirmed-physical-targets.ts');
const {Vida2PhysicalInput} = load('simulation/life/life-plausibility-physical-adapter-vida2.ts');
const {ProceduralMicrobialLifeVIDA3} = load('simulation/life/procedural-microbial-life-vida3.ts');
const {ProceduralEcologyVIDA4} = load('simulation/life/procedural-ecology-vida4.ts');
const {Vida5aEcologyAtmosphere} = load('simulation/life/vida5a-ecology-atmosphere.ts');
const {Vida5bEcologicalMaturation} = load('simulation/life/vida5b-ecological-maturation.ts');
const {Vida5cAdvancedBiospheres} = load('simulation/life/vida5c-advanced-biospheres.ts');
const {Vida6EcosystemsSpecies} = load('simulation/life/vida6-ecosystems-species.ts');
const {Vida7IntelligenceCivilizations} = load('simulation/life/vida7-intelligence-civilizations.ts');
const SEED = '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5';
const opts={limit:Infinity,out:path.resolve('auditoria-elixisis-vida7.json'),seed:SEED};
for(const arg of process.argv.slice(2)){
  if(arg.startsWith('--limit-systems=')) opts.limit=Number(arg.slice(16));
  else if(arg.startsWith('--out=')) opts.out=path.resolve(arg.slice(6));
  else if(arg.startsWith('--seed=')) opts.seed=arg.slice(7);
  else throw Error('Argumento desconocido: '+arg);
}
if((!Number.isSafeInteger(opts.limit) && opts.limit!==Infinity) || opts.limit<=0)
  throw Error('--limit-systems debe ser un entero positivo');
const key=new UniverseGenerationKey(UniverseSeed.parse(opts.seed),GeneratorVersion.V3);
const galaxy=GalaxyGenerator.generate(key,0n);
const grid=GalaxySectorGridGenerator.generate(galaxy);
const half=grid.halfExtentInSectors;
const result={
  auditoria:'VIDA.7/Elixisis/full-physical-census/v1',seed:opts.seed,
  galaxia:galaxy.designation.name,versionGenerador:3,
  modo:opts.limit===Infinity?'COMPLETO':'MUESTRA',
  sistemasEncontrados:0,sistemasSinFisica:0,sistemasConError:0,sectoresAnalizados:0,
  planetasProyectados:0,planetasNoEvaluables:0,planetasElegibles:0,
  inteligenciasNativas:0,civilizacionesNativas:0,
  niveles:{PRIMITIVE:0,ADVANCED:0,VERY_ADVANCED:0},
  civilizacionesMuyAvanzadas:[],muestrasDeError:[],
};
const knownSystems=new Set();
const identityOf=loc=>({universeSeed:opts.seed,generatorVersionCode:3,kind:'PLANET',
  galaxyIndex:String(loc.galaxyIndex),sectorKey:String(loc.sectorKey),
  galacticObjectIndex:String(loc.galacticObjectIndex),bodyIndex:String(loc.bodyIndex),moonIndex:null});
const handleError=(description,error)=>{
  result.planetasNoEvaluables++;
  if(result.muestrasDeError.length<80)
    result.muestrasDeError.push({cuerpo:description,error:String(error?.message??error)});
};
const hostKey=s=>`${s.galaxyIndex}/${s.sectorKey}/${s.galacticObjectIndex}`;
const maxSystems=opts.limit;
console.log(`Auditoría VIDA.7 en ${result.galaxia} — galaxia 0, semilla ${opts.seed}`);
console.log(`Cuadrícula de sectores: ${(half*2+1)**2}. Lectura procedural, sin cambios en IndexedDB.`);
outer: for(let x=-half;x<=half;x++)for(let y=-half;y<=half;y++){
  const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(x,y));
  result.sectoresAnalizados++;
  for(const loc of sector.systemLocators){
    const sid=hostKey(loc);
    if(result.sistemasEncontrados>=maxSystems)break outer;
    if(knownSystems.has(sid))throw Error('Sistema duplicado: '+sid);
    knownSystems.add(sid);result.sistemasEncontrados++;
    try {
      const source=vida9V3ConfirmedPhysicalTargets(key,loc);
      if(!source){result.sistemasSinFisica++;continue;}
      for(let i=0;i<source.planetCount;i++){
        const body=new BodyLocator(loc.galaxyIndex,loc.sectorKey,loc.galacticObjectIndex,BigInt(i));
        const bid=`${sid}/${i}`;
        let target;
        try{target=source.resolvePlanet(body);}catch(e){handleError(bid,e);continue;}
        if(!target){handleError(bid,'Sin modelo físico individual');continue;}
        result.planetasProyectados++;
        try {
          const id=identityOf(body);
          const m=ProceduralMicrobialLifeVIDA3.evaluate(id,Vida2PhysicalInput.planet(target));
          const e=ProceduralEcologyVIDA4.evaluate(m);
          const a=Vida5aEcologyAtmosphere.evaluate(e,target);
          const b=Vida5bEcologicalMaturation.evaluate(a);
          const c=Vida5cAdvancedBiospheres.evaluate(m,e,b,target);
          // La comprobación de elegibilidad de VIDA.7 es la fuente de verdad.
          const ecos=Vida6EcosystemsSpecies.evaluate(m,e,c);
          const v7=Vida7IntelligenceCivilizations.evaluate(ecos,c);
          if(v7.eligibility==='ELIGIBLE')result.planetasElegibles++;
          if(v7.intelligencePresent)result.inteligenciasNativas++;
          if(v7.civilizationPresent){
            result.civilizacionesNativas++;
            const civilization=v7.civilization;
            assert(civilization);
            result.niveles[civilization.tier]++;
            if(civilization.tier==='VERY_ADVANCED'){
              const species=ecos.species.find(s=>s.id===civilization.founderSpeciesId);
              if(!species)throw Error(`Especie fundadora inexistente en ${bid}`);
              result.civilizacionesMuyAvanzadas.push({
                planeta:target.identity.designation,
                sistema:target.identity.hostSystemDesignation,
                especieFundadora:species.proceduralName,
                linaje:civilization.lineage,
                nivel:'MUY AVANZADA',
                localizador:{galaxia:id.galaxyIndex,sector:id.sectorKey,
                  objeto:id.galacticObjectIndex,planeta:id.bodyIndex},
                digestVIDA7:v7.digest,
              });
            }
          }
        }catch(e){handleError(bid,e);}
      }
    }catch(e){
      result.sistemasConError++;
      if(result.muestrasDeError.length<80)result.muestrasDeError.push({sistema:sid,error:String(e?.message??e)});
    }
    if(result.sistemasEncontrados%250===0)
      console.log(`Sistemas: ${result.sistemasEncontrados}; mundos evaluados: ${result.planetasProyectados}; muy avanzadas: ${result.niveles.VERY_ADVANCED}`);
  }
}
result.civilizacionesMuyAvanzadas.sort((a,b)=>a.planeta.localeCompare(b.planeta));
// No llamar "0 civilizaciones" a lo que puede ser una muestra o una población parcial.
result.coberturaCompleta=opts.limit===Infinity && result.sectoresAnalizados===(half*2+1)**2;
result.veredicto=!result.coberturaCompleta||result.sistemasEncontrados!==4758?'MUESTRA_O_COBERTURA_INCOMPLETA':
  result.planetasNoEvaluables||result.sistemasConError?'AUDITORIA_CON_HUECOS_FISICOS':'CENSO_COMPLETO_SIN_ERRORES';
fs.mkdirSync(path.dirname(opts.out),{recursive:true});
fs.writeFileSync(opts.out,JSON.stringify(result,null,2)+'\n','utf8');
console.log('\n=== CIVILIZACIONES MUY AVANZADAS DE ELIXISIS (VIDA.7) ===');
if(!result.civilizacionesMuyAvanzadas.length)console.log('Ninguna identificada entre los cuerpos evaluables.');
for(const [i,c] of result.civilizacionesMuyAvanzadas.entries())
 console.log(`${i+1}. ${c.planeta} — sistema ${c.sistema} — linaje ${c.linaje} — especie ${c.especieFundadora}`);
console.log(`Totales: ${result.civilizacionesNativas} civilizaciones; primitivas ${result.niveles.PRIMITIVE}; avanzadas ${result.niveles.ADVANCED}; muy avanzadas ${result.niveles.VERY_ADVANCED}.`);
console.log(`Cobertura: ${result.sistemasEncontrados} sistemas; ${result.planetasProyectados} planetas; ${result.planetasNoEvaluables} planetas no evaluables; ${result.sistemasConError} sistemas con error.`);
console.log(`Veredicto: ${result.veredicto}\nArchivo: ${opts.out}`);
