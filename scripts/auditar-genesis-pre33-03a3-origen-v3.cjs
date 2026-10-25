#!/usr/bin/env node
'use strict';
/** PRE33.03a.3: audit V3 chemical disk source attached at stage 17.7 -> 18.
 * Read-only: no IndexedDB writes, observed knowledge or ocean certification. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {makeCandidates,identity}=require('./pre33/pre33-audit-core.cjs');
const {parse}=require('./auditar-genesis-pre33-03a2a.cjs');
function tsRegister(){const ts=require('typescript');if(!require.extensions['.ts'])require.extensions['.ts']=(m,f)=>{
 const js=ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true,useDefineForClassFields:false}}).outputText;m._compile(js,f);};}
const source=p=>require(path.resolve('src/app',p));
function main(){const o=parse(process.argv.slice(2));tsRegister();
 const {UniverseSeed}=source('domain/universe/universe-seed.ts');
 const {UniverseGenerationKey}=source('domain/generation/universe-generation-key.ts');
 const {GeneratorVersion}=source('domain/generation/generator-version.ts');
 const {GalaxyGenerator}=source('simulation/universe/galaxy-generator.ts');
 const {GalaxySectorGridGenerator}=source('simulation/sector/galaxy-sector-grid-generator.ts');
 const {GalaxySectorContentGenerator}=source('simulation/sector/galaxy-sector-content-generator.ts');
 const {GalaxySectorCoordinates}=source('domain/sector/galaxy-sector-coordinates.ts');
 const {StellarMultihostFormation}=source('simulation/stellar/stellar-multihost-formation.ts');
 const {PlanetH2OV3FormationOrigin:Origin}=source('simulation/planetary/planet-h2o-v3-formation-origin.ts');
 const {PlanetH2OForwardCT0EnginePRE3303A3:Forward}=source('simulation/planetary/planet-h2o-forward-ct0-pre33-03a3.ts');
 const key=new UniverseGenerationKey(UniverseSeed.parse(o.seed),GeneratorVersion.V3),galaxies=[];
 for(const gi of o.galaxies){
  const galaxy=GalaxyGenerator.generate(key,BigInt(gi));
  const grid=GalaxySectorGridGenerator.generate(galaxy);
  const candidates=makeCandidates(o.seed,gi,grid.halfExtentInSectors,Math.max(1500,o.systems*100));
  const g={galaxy:galaxy.designation.name,galaxyIndex:gi,systems:0,planets:0,originSources:0,
   modeledPositive:0,originKilograms:0,ct0Certified:0,errors:[]};
  for(const pos of candidates){if(g.systems>=o.systems)break;
   const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(pos.x,pos.y));
   if(!sector.systemLocators.length)continue;
   const h=identity([String(gi),pos.x,pos.y,'SYSTEM_INDEX']);
   const loc=sector.systemLocators[parseInt(h.slice(0,8),16)%sector.systemLocators.length];
   try{
    const multi=StellarMultihostFormation.generateOrNull(key,loc);
    const single=multi?null:StellarMultihostFormation.generateSingleOrNull(key,loc);
    if(!multi&&!single)throw Error('SOURCE_NOT_GENERATED');
    const rows=multi?.publicPlanets??single.planets.map((planet,i)=>({planet,atmosphere:single.atmospheres[i]}));
    g.systems++;
    for(const {planet,atmosphere} of rows){
     if(!atmosphere)throw Error('NO_PLANET_ATMOSPHERE');
     const src=Origin.sourceForPlanet(planet);
     if(!src)throw Error('NO_NATIVE_17_7_ORIGIN_SOURCE');
     const record=Forward.project(planet,atmosphere,Origin.environmentForPlanet(planet));
     if(record.source.chemistry!=='V3_FORMATION_DISK_ELEMENTAL_MODEL' ||
       record.waterKilograms.modeledFormation===null ||
       Math.abs(record.waterKilograms.modeledFormation-src.formationWaterKilograms)>
        1e-7*Math.max(1,src.formationWaterKilograms) ||
       record.physicalCT0InventoryCertified||record.observedEvidenceGranted)throw Error('H2O_ORIGIN_NOT_USED');
     g.planets++;g.originSources++;g.originKilograms+=src.formationWaterKilograms;
     if(src.formationWaterKilograms>0)g.modeledPositive++;
     if(record.physicalCT0InventoryCertified)g.ct0Certified++;
    }
   }catch(e){g.errors.push({sector:[pos.x,pos.y],message:String(e.stack||e)});}
  }
  if(g.systems!==o.systems||g.planets!==g.originSources)g.errors.push({message:'INCOMPLETE_SYSTEMS_OR_ORIGINS'});
  galaxies.push(g);console.log(`${g.galaxy}: ${g.systems} sistemas, ${g.planets} planetas con origen 17.7, ${g.errors.length} errores`);
 }
 const bad=galaxies.some(g=>g.errors.length);
 const result={contract:'PRE-33.03a.3/V3-DISK-FORMATION-ORIGIN/v1',seed:o.seed,version:'V3',galaxies,
  certifiedCT0:false,unresolved:'Native disk C/O priors and external/time-resolved water forcings remain modeled or unavailable; no observation or ocean is certified.',
  verdict:bad?'V3_FORMATION_ORIGIN_AUDIT_FAILED':'V3_FORMATION_ORIGIN_AUDITED_CT0_UNRESOLVED'};
 fs.mkdirSync(o.out,{recursive:true});
 const name='pre33-03a3-origen-v3';
 fs.writeFileSync(path.join(o.out,`${name}.json`),JSON.stringify(result,null,2)+'\n');
 fs.writeFileSync(path.join(o.out,`${name}.md`),`# Origen de H₂O en generación V3\n\n${result.verdict}\n\n`+
  galaxies.map(g=>`- ${g.galaxy}: ${g.planets} orígenes / ${g.systems} sistemas, ${g.errors.length} errores.`).join('\n')+'\n\n'+result.unresolved+'\n');
 console.log(result.verdict);if(o.strict&&bad)process.exitCode=1;
}
if(require.main===module)main();module.exports={main};
