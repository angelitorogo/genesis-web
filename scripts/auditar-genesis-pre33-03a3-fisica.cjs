#!/usr/bin/env node
'use strict';
/** PRE-33.03a.3 physical forward model V3 audit. Read-only. */
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
 const {PlanetH2OForwardCT0EnginePRE3303A3:Engine}=source('simulation/planetary/planet-h2o-forward-ct0-pre33-03a3.ts');
 const {validateH2OForwardCT0Result:validate}=source('domain/planetary/planet-h2o-forward-ct0-pre33-03a3.ts');
 const key=new UniverseGenerationKey(UniverseSeed.parse(o.seed),GeneratorVersion.V3),galaxies=[];
 for(const gi of o.galaxies){const galaxy=GalaxyGenerator.generate(key,BigInt(gi));
  const grid=GalaxySectorGridGenerator.generate(galaxy);
  const candidates=makeCandidates(o.seed,gi,grid.halfExtentInSectors,Math.max(1500,o.systems*100));
  const g={galaxyIndex:gi,galaxy:galaxy.designation.name,systems:0,planets:0,
   forwardFormed:0,noFormationSource:0,modeledWaterPositive:0,
   historicalCT0Modeled:0,ct0Certified:0,issues:[]};
  for(const pos of candidates){if(g.systems>=o.systems)break;
   const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(pos.x,pos.y));
   if(!sector.systemLocators.length)continue;
   const h=identity([String(gi),pos.x,pos.y,'SYSTEM_INDEX']);
   const loc=sector.systemLocators[parseInt(h.slice(0,8),16)%sector.systemLocators.length];
   try {const multiple=StellarMultihostFormation.generateOrNull(key,loc);
    const single=multiple?null:StellarMultihostFormation.generateSingleOrNull(key,loc);
    if(!multiple&&!single)throw Error('NO_GENERATOR');
    const rows=multiple?.publicPlanets??single.planets.map((planet,i)=>({planet,atmosphere:single.atmospheres[i]}));
    g.systems++;
    for(const {planet,atmosphere} of rows){const a=Engine.project(planet,atmosphere),b=Engine.project(planet,atmosphere);
     const issues=validate(a);
     if(issues.length||JSON.stringify(a)!==JSON.stringify(b)||a.physicalCT0InventoryCertified||a.oceanExistenceCertified)
      throw Error('INVALID_FORMATION_OR_DETERMINISM '+issues.join(','));
     g.planets++;
     if(a.waterKilograms.modeledFormation===null)g.noFormationSource++;else {
      g.forwardFormed++;if(a.waterKilograms.modeledFormation>0)g.modeledWaterPositive++;}
     if(a.waterKilograms.modeledCT0!==null)g.historicalCT0Modeled++;
    }
   }catch(e){g.issues.push({sector:[pos.x,pos.y],error:String(e.stack||e)});}
  }
  if(g.systems!==o.systems||g.forwardFormed+g.noFormationSource!==g.planets)g.issues.push({error:'INCOMPLETE'});
  galaxies.push(g);console.log(`${g.galaxy} ${g.systems} sistemas, ${g.planets} planetas, ${g.forwardFormed} química del disco, ${g.issues.length} errores`);
 }
 const error=galaxies.some(g=>g.issues.length);
 const result={contract:'PRE-33.03a.3/forward-disk-chemistry-history/v1',generator:'V3',seed:o.seed,galaxies,
  certification:'No CT0 certified: source stellar H2O abundances, dated independent XUV/deliveries and P-T not present in native V3 records.',
  verdict:error?'FORWARD_H2O_PHYSICS_FAILED':'FORWARD_CHEMISTRY_AUDITED_CT0_CERTIFICATION_UNRESOLVED'};
 fs.mkdirSync(o.out,{recursive:true});const file=path.join(o.out,'pre33-03a3-fisica.json');
 fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n');
 fs.writeFileSync(path.join(o.out,'pre33-03a3-fisica.md'),`# PRE-33.03a.3 — Formación química y balance hídrico V3\n\n${result.verdict}\n\n`+
 galaxies.map(g=>`- ${g.galaxy}: ${g.planets} planetas, ${g.forwardFormed} con modelo de formación, ${g.historicalCT0Modeled} CT0 modelados, ${g.issues.length} errores.`).join('\n')+'\n\n'+result.certification+'\n');
 console.log(result.verdict,file);if(o.strict&&error)process.exitCode=1;
}
if(require.main===module)main();module.exports={main};
