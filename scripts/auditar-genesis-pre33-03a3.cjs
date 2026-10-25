#!/usr/bin/env node
'use strict';
/** PRE-33.03a.3 CT-0 water provenance, conservation and certification audit: V3 READ ONLY. */
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
 const {PlanetH2OCT0InventoryEnginePRE3303A3:Ledger}=src('simulation/planetary/planet-h2o-ct0-inventory-pre33-03a3.ts');
 const {validatePlanetH2OCT0InventoryPRE3303A3:validateLedger}=src('domain/planetary/planet-h2o-ct0-inventory-pre33-03a3.ts');
 const key=new UniverseGenerationKey(UniverseSeed.parse(o.seed),GeneratorVersion.V3),galaxies=[];
 for(const gi of o.galaxies){const galaxy=GalaxyGenerator.generate(key,BigInt(gi));
  const grid=GalaxySectorGridGenerator.generate(galaxy);
  const candidates=makeCandidates(o.seed,gi,grid.halfExtentInSectors,Math.max(1500,o.systems*100));
  const s={galaxyIndex:gi,galaxy:galaxy.designation.name,systems:0,single:0,multiple:0,
    planets:0,solid:0,deep:0,geometryConditional:0,radialUnresolved:0,zeroShell:0,
    possibleHighPressureDomain:0,verifiedMaterialMass:0,ct0OceansCertified:0,conditionalSourceMassValidated:0,ct0RetainedQuantified:0,
    unclosedHistoricalForcing:0,certificationBlockersValidated:0,errors:[],examples:[]};
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
      const ledger=Ledger.project(planet,atmosphere,undefined,undefined,p);
      const ledgerAgain=Ledger.project(planet,atmosphere,undefined,undefined,p);
      const ledgerErrors=validateLedger(ledger);
      if(ledgerErrors.length || JSON.stringify(ledger)!==JSON.stringify(ledgerAgain) ||
        ledger.physicalCT0InventoryCertified || ledger.oceanExistenceCertified ||
        ledger.playerObservationUpdated || ledger.lifeEvaluated ||
        !ledger.blockers.includes('FORMATION_SPECIES_IS_BACKPROJECTED_MATURE_19_5'))
        throw Error('CT0_LEDGER_INVALID '+ledgerErrors.join(','));
      if(ledger.waterKilograms.retainedCT0===null)s.unclosedHistoricalForcing++;
      else s.ct0RetainedQuantified++;
      s.conditionalSourceMassValidated++;
      s.certificationBlockersValidated++;
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
    s.verifiedMaterialMass!==s.planets || s.conditionalSourceMassValidated!==s.planets ||
    s.certificationBlockersValidated!==s.planets ||
    s.ct0RetainedQuantified+s.unclosedHistoricalForcing!==s.planets || s.ct0OceansCertified)
    s.errors.push({error:'SURVEY_INCOMPLETE_OR_INCONSISTENT'});
  galaxies.push(s);
  console.log(`PRE-33.03a.3 ${s.galaxy}: ${s.systems} sistemas, ${s.planets} planetas, ${s.deep} envolturas profundas, ${s.geometryConditional} escenarios radiales, ${s.errors.length} errores`);
 }
 const fail=galaxies.some(g=>g.errors.length);
 const verdict=fail?'CT0_WATER_LEDGER_AUDIT_FAILED':'CT0_WATER_LEDGER_VALIDATED_PHYSICAL_CERTIFICATION_UNRESOLVED';
 const result={contract:'PRE-33.03a.3/ct0-species-ledger/v1',generator:'V3',seed:o.seed,
  scope:'Read-only V3 planet inventory: physical carrier H2O is chemically hypothetical until formation, escape and delivery sources are independent.',
  interpretation:'PRE-33.03a.3 checks deterministic species mass ledgers and conservation. 19.5 carrier endmembers are conditional; dated H2O forcing not established by this public V3 sample. Unresolved does not mean zero water. No oceans CT0 or observed discovery certified.',
  galaxies,oceansCertified:0,playerKnowledgeModified:false,verdict};
 fs.mkdirSync(o.out,{recursive:true});
 const json=path.join(o.out,'pre33-03a3-inventario-ct0.json');
 const md=path.join(o.out,'pre33-03a3-informe.md');
 fs.writeFileSync(json,JSON.stringify(result,null,2)+'\n');
 fs.writeFileSync(md,[`# PRE-33.03a.3 — Balance H₂O CT-0 (V3)`, '',
  `Semilla: ${o.seed} · ${verdict}`, '',
  '| Galaxia | Sistemas | SINGLE | Múltiples | Planetas | Especiación condicional validada | Historia CT0 sin cerrar | CT0 cuantificado condicional | Inventarios certificados | Errores |',
  '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
  ...galaxies.map(g=>`| ${g.galaxy} | ${g.systems} | ${g.single} | ${g.multiple} | ${g.planets} | ${g.conditionalSourceMassValidated} | ${g.unclosedHistoricalForcing} | ${g.ct0RetainedQuantified} | ${g.ct0OceansCertified} | ${g.errors.length} |`),
  '', 'PRE-33.03a.3: el libro de masa H2O separa fuentes condicionales, retención, escape y reservorios; el CT-0 cuantitativo requiere una historia completa. La química inicial 03a se infiere de clases maduras 19.5; no hay fuente independiente de formación ni cierre de XUV/entregas/clima. No confundir balance matemático con certificación.',
  '', 'No se alteran V1/V2/V3, IndexedDB ni conocimiento observado. La infraestructura CT-0 está integrada; la certificación física real permanece abierta hasta incorporar fuentes independientes. No inventar masas oceánicas.'
  ].join('\n')+'\n');
 console.log(verdict, json, md);
 if(o.strict&&fail)process.exitCode=1;
}
if(require.main===module)main();module.exports={main};
