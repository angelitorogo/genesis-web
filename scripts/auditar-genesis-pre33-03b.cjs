#!/usr/bin/env node
'use strict';
/** PRE-33.03b physical *conditional* depth survey: public V3, read-only. */
const fs=require('node:fs'),path=require('node:path');
const {makeCandidates,identity}=require('./pre33/pre33-audit-core.cjs');
const {parse}=require('./auditar-genesis-pre33-03a2a.cjs');
function registerTS(){const ts=require('typescript');if(!require.extensions['.ts'])require.extensions['.ts']=(mod,file)=>{
 const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{
 module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true,
 useDefineForClassFields:false}}).outputText;mod._compile(js,file);};}
function src(p){return require(path.resolve('src/app',p));}
function main(){const o=parse(process.argv.slice(2));registerTS();
 const {UniverseSeed}=src('domain/universe/universe-seed.ts');
 const {UniverseGenerationKey}=src('domain/generation/universe-generation-key.ts');
 const {GeneratorVersion}=src('domain/generation/generator-version.ts');
 const {GalaxyGenerator}=src('simulation/universe/galaxy-generator.ts');
 const {GalaxySectorGridGenerator}=src('simulation/sector/galaxy-sector-grid-generator.ts');
 const {GalaxySectorContentGenerator}=src('simulation/sector/galaxy-sector-content-generator.ts');
 const {GalaxySectorCoordinates}=src('domain/sector/galaxy-sector-coordinates.ts');
 const {StellarMultihostFormation}=src('simulation/stellar/stellar-multihost-formation.ts');
 const {PlanetDeepOceanEnvelopeEnginePRE3303B:Engine}=src('simulation/planetary/planet-deep-ocean-envelope-pre33-03b.ts');
 const {validatePlanetDeepOceanEnvelopePRE3303B:validate}=src('domain/planetary/planet-deep-ocean-envelope-pre33-03b.ts');
 const key=new UniverseGenerationKey(UniverseSeed.parse(o.seed),GeneratorVersion.V3),galaxies=[];
 for(const gi of o.galaxies){const galaxy=GalaxyGenerator.generate(key,BigInt(gi));
  const grid=GalaxySectorGridGenerator.generate(galaxy);
  const candidates=makeCandidates(o.seed,gi,grid.halfExtentInSectors,Math.max(1500,o.systems*100));
  const s={galaxyIndex:gi,galaxy:galaxy.designation.name,systems:0,single:0,multiple:0,
    planets:0,solid:0,deep:0,geometryConditional:0,radialUnresolved:0,zeroShell:0,
    possibleHighPressureDomain:0,verifiedMaterialMass:0,ct0OceansCertified:0,errors:[],examples:[]};
  for(const pos of candidates){if(s.systems>=o.systems)break;
   const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(pos.x,pos.y));
   if(!sector.systemLocators.length)continue;
   const h=identity([String(gi),pos.x,pos.y,'SYSTEM_INDEX']);
   const loc=sector.systemLocators[parseInt(h.slice(0,8),16)%sector.systemLocators.length];
   try{const m=StellarMultihostFormation.generateOrNull(key,loc);
    const a=m?.publicPlanets??null;
    const single=a?null:StellarMultihostFormation.generateSingleOrNull(key,loc);
    if(!a&&!single)throw Error('NO_STELLAR_PHYSICAL_SOURCE');
    const rows=a??single.planets.map((planet,i)=>({planet,atmosphere:single.atmospheres[i],host:'A'}));
    s.systems++;if(a)s.multiple++;else s.single++;
    for(const row of rows){const {planet,atmosphere}=row;
      const p=Engine.project(planet,atmosphere),again=Engine.project(planet,atmosphere);
      const issues=validate(p);
      if(issues.length||JSON.stringify(p)!==JSON.stringify(again)||p.oceanExistenceCertified||
       p.currentH2OTotalCertified||p.observedEvidenceGranted||p.lifeEvaluated)
        throw Error('INVALID_CONSERVATION_DETERMINISM_OR_EVIDENCE '+issues.join(','));
      s.planets++;s.verifiedMaterialMass++;
      if(p.classification==='DEEP_GAS_ENVELOPE_NO_SOLID_SURFACE')s.deep++;else s.solid++;
      if(p.candidateWaterShell.status==='CONDITIONAL_GEOMETRY'){
        s.geometryConditional++;
        if(p.candidateWaterShell.couldReachHighPressureIceDomain)s.possibleHighPressureDomain++;
      }else if(p.candidateWaterShell.status==='RADIAL_REFERENCE_INCOMPATIBLE')s.radialUnresolved++;
      else if(p.candidateWaterShell.status==='NO_MODELED_SHELL_SOURCE')s.zeroShell++;
      else throw Error('UNEXPECTED_UNRESOLVED_WATER_STRUCTURE');
      if(s.examples.length<9) s.examples.push({body:planet.name,host:row.host,
        status:p.candidateWaterShell.status,domain:p.classification,
        layerMeters:p.candidateWaterShell.geometryBracket.map(g=>g.waterLayerThicknessMeters),
        highPressurePossible:p.candidateWaterShell.couldReachHighPressureIceDomain,waterCertified:false});
    }
   }catch(e){s.errors.push({sector:[pos.x,pos.y],error:String(e.stack||e)});}
  }
  if(s.systems!==o.systems||s.systems!==s.single+s.multiple||s.planets!==s.solid+s.deep||
    s.planets!==s.geometryConditional+s.radialUnresolved+s.zeroShell||
    s.verifiedMaterialMass!==s.planets||s.ct0OceansCertified)
    s.errors.push({error:'SURVEY_INCOMPLETE_OR_INCONSISTENT'});
  galaxies.push(s);
  console.log(`PRE-33.03b ${s.galaxy}: ${s.systems} sistemas, ${s.planets} planetas, ${s.deep} envolturas profundas, ${s.geometryConditional} escenarios radiales, ${s.errors.length} errores`);
 }
 const fail=galaxies.some(g=>g.errors.length);
 const verdict=fail?'DEEP_OCEAN_STRUCTURE_AUDIT_FAILED':'DEEP_OCEAN_CONDITIONAL_STRUCTURE_PASSED_CT0_NOT_CERTIFIED';
 const result={contract:'PRE-33.03b/deep-layers/v1',generator:'V3',seed:o.seed,
  scope:'Read-only deterministic physical sample. Water volumes/pressure are conditional endmember scenarios, not physical H2O inventory.',
  interpretation:'Structural candidate brackets for a water-rich shell, with explicit separation from 19.5 bulk gas. High pressure alone cannot confirm ice or liquid; no independent deep thermal profile or certified H2O CT0. Does not alter player knowledge.',
  galaxies,oceansCertified:0,playerKnowledgeModified:false,verdict};
 fs.mkdirSync(o.out,{recursive:true});
 const json=path.join(o.out,'pre33-03b-oceanos-envolturas.json');
 const md=path.join(o.out,'pre33-03b-informe.md');
 fs.writeFileSync(json,JSON.stringify(result,null,2)+'\n');
 fs.writeFileSync(md,[`# PRE-33.03b — Océanos profundos y envolturas (V3)`, '',
  `Semilla: ${o.seed} · ${verdict}`, '',
  '| Galaxia | Sistemas | SINGLE | Múltiples | Planetas | Envolturas profundas | Estructura condicional | Radios incompatibles | HP hielo posible, no certificado | Errores |',
  '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
  ...galaxies.map(g=>`| ${g.galaxy} | ${g.systems} | ${g.single} | ${g.multiple} | ${g.planets} | ${g.deep} | ${g.geometryConditional} | ${g.radialUnresolved} | ${g.possibleHighPressureDomain} | ${g.errors.length} |`),
  '', 'Modelo interno CONDICIONAL: desglosa masa gruesa de 19.5, química de H2O 03a y ecuación hidrostática de capa esférica homogénea. No se infieren masas H/He ni océanos a partir del índice 20.7. El cálculo de hielo de alta presión requiere perfil P-T fechado y una ecuación de estado más completa para certificación.',
  '', 'No se alteran V1/V2/V3, IndexedDB, ni el conocimiento observado. PRE-33.03a.3 queda pendiente para cuantificar H2O CT-0.'
  ].join('\n')+'\n');
 console.log(verdict, json, md);
 if(o.strict&&fail)process.exitCode=1;
}
if(require.main===module)main();module.exports={main};
