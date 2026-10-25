#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {makeCandidates,identity}=require('./pre33/pre33-audit-core.cjs');
const {parse}=require('./auditar-genesis-pre33-03a2a.cjs');
function register(){const ts=require('typescript');if(!require.extensions['.ts'])require.extensions['.ts']=(m,f)=>{
 const js=ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true,useDefineForClassFields:false}}).outputText;m._compile(js,f);};}
const source=p=>require(path.resolve('src/app',p));
function main(){const o=parse(process.argv.slice(2));register();
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
 const {validateH2OForwardCT0Result}=source('domain/planetary/planet-h2o-forward-ct0-pre33-03a3.ts');
 const key=new UniverseGenerationKey(UniverseSeed.parse(o.seed),GeneratorVersion.V3),galaxies=[];
 for(const gi of o.galaxies){
  const galaxy=GalaxyGenerator.generate(key,BigInt(gi));const grid=GalaxySectorGridGenerator.generate(galaxy);
  const candidates=makeCandidates(o.seed,gi,grid.halfExtentInSectors,Math.max(1500,o.systems*100));
  const g={galaxy:galaxy.designation.name,galaxyIndex:gi,systems:0,planets:0,ct0ModelClosed:0,ct0Unresolved:0,
   deepLayerComputed:0,waterPositiveCT0:0,externalDeliveredKg:0,escapedKg:0,formationKg:0,retainedKg:0,
   maxMassResidual01:0,firstBlockers:{},errors:[]};
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
     if(!atmosphere)throw Error('ATMOSPHERE_MISSING');
     const origin=Origin.sourceForPlanet(planet);
     if(!origin)throw Error('ORIGIN_NOT_REGISTERED');
     const model=Forward.project(planet,atmosphere,Origin.environmentForPlanet(planet,atmosphere));
     const errors=validateH2OForwardCT0Result(model);
     if(errors.length||model.observedEvidenceGranted||model.physicalCT0InventoryCertified||
        model.oceanExistenceCertified)throw Error('INVALID_CERTIFICATION '+errors.join(','));
     if(model.waterKilograms.modeledFormation===null ||
       Math.abs(model.waterKilograms.modeledFormation-origin.formationWaterKilograms)>
        Math.max(1,origin.formationWaterKilograms)*1e-8)throw Error('FOREIGN_FORMATION');
     if(model.v3ModelBalanceCertified!==true||model.waterKilograms.modeledCT0===null||
        model.status!=='MODELED_CT0_RESERVOIRS'){
       g.ct0Unresolved++;for(const b of model.unresolved)g.firstBlockers[b]=(g.firstBlockers[b]||0)+1;
     }else{
       g.ct0ModelClosed++;
       if(model.waterKilograms.modeledCT0>0)g.waterPositiveCT0++;
       g.retainedKg+=model.waterKilograms.modeledCT0;
       g.externalDeliveredKg+=model.waterKilograms.externalDelivery??0;
       g.escapedKg+=model.waterKilograms.escaped??0;
       g.maxMassResidual01=Math.max(g.maxMassResidual01,model.relativeMassResidual01??0);
       if(model.deepWater.shellThicknessMeters!==null)g.deepLayerComputed++;
     }
     g.planets++;g.formationKg+=origin.formationWaterKilograms;
    }
   }catch(e){g.errors.push({sector:[pos.x,pos.y],message:String(e.stack||e)});}
  }
  if(g.systems!==o.systems||g.ct0ModelClosed+g.ct0Unresolved!==g.planets)
   g.errors.push({message:'SYSTEM_OR_MODEL_COVERAGE'});
  console.log(`${g.galaxy}: ${g.planets} planetas; ${g.ct0ModelClosed} balances CT0 modelados cerrados; ${g.ct0Unresolved} no resueltos; ${g.errors.length} errores`);
  galaxies.push(g);
 }
 const failed=galaxies.some(g=>g.errors.length||g.ct0Unresolved);
 const output={contract:'PRE-33.03a.3/V3-CT0-PHYSICAL-MODEL-INTEGRATION/v1',seed:o.seed,version:'V3',galaxies,
  observationalCertification:false,independentDiskChemistry:false,
  scope:'Full modeled forward CT0 evolution, NOT independently measured chemistry/impact history or observed oceans',
  verdict:failed?'V3_CT0_MODEL_CLOSURE_FAILED_OR_UNRESOLVED':'V3_CT0_MODEL_BALANCES_CLOSED_NOT_OBSERVATIONAL_CERTIFICATION'};
 fs.mkdirSync(o.out,{recursive:true});
 const base='pre33-03a3-ct0-completo';
 fs.writeFileSync(path.join(o.out,base+'.json'),JSON.stringify(output,null,2)+'\n');
 fs.writeFileSync(path.join(o.out,base+'.md'),`# PRE-33.03a.3 — Auditoría integral CT-0\n\n${output.verdict}\n\n`+
  galaxies.map(g=>`- ${g.galaxy}: ${g.systems} sistemas, ${g.planets} planetas, ${g.ct0ModelClosed} balances modelados cerrados, ${g.ct0Unresolved} no resueltos, ${g.errors.length} errores.`).join('\n')+
  '\n\n**Alcance científico:** '+output.scope+'\n');
 console.log(output.verdict);if(o.strict&&failed)process.exitCode=1;
 return output;
}
if(require.main===module)main();module.exports={main};
