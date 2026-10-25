#!/usr/bin/env node
'use strict';
/** PRE-33.04: deterministic READ-ONLY audit of lunar water-domain V3 sources.
 * Checks physical source identities, pressure monotonicity, reservoir closure,
 * public V3 projection and no observed/biological certification. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {makeCandidates,identity}=require('./pre33/pre33-audit-core.cjs');
const {parse}=require('./auditar-genesis-pre33-03a2a.cjs');
const register=()=>{const ts=require('typescript');if(!require.extensions['.ts'])require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true,useDefineForClassFields:false}}).outputText,f);};
const load=p=>require(path.resolve('src/app',p));
function validate(physical, formation, interior, ocean, result) {
 const errors=[];
 const add=(cond,code)=>{if(cond)errors.push(code);};
 add(result.contractVersion!=='PRE-33.04/V3-LUNAR-SUBSURFACE-DOMAIN/v1','CONTRACT');
 add(result.hostPlanetOrdinal!==physical.hostPlanetOrdinal||result.moonOrdinal!==physical.moonOrdinal,'IDENTITY');
 add(result.waterMassKilograms!==interior.waterMassKilograms||
  Math.abs(result.waterMassKilograms-formation.waterIceMassKilograms)>1e-9*Math.max(1,result.waterMassKilograms) ||
  Math.abs(result.waterMassKilograms-ocean.waterInventoryKilograms)>1e-9*Math.max(1,result.waterMassKilograms),'WATER_ORIGIN');
 add(result.actualPhaseCertified||result.actualSalinityResolved||result.lunarHistoryWaterBudgetResolved||result.observationalOceanConfirmed,'FALSE_CERTIFICATION');
 add(result.thermalEvaluation==='THREE_CONDITIONAL_CASES' && result.thermalScenarios.length!==3,'THERMAL_CASE_COVERAGE');
 add(result.thermalEvaluation!=='THREE_CONDITIONAL_CASES' && result.thermalScenarios.length!==0,'INVENTED_THERMAL_CASE');
 const p=result.pressureProfile;
 add(p.some((v,i)=>!Number.isFinite(v.pressurePascal)||v.pressurePascal<0||(i>0&&v.pressurePascal<p[i-1].pressurePascal)),'PRESSURE_PROFILE');
 add(result.domain==='EXTENDED_2_TO_10_GPA' && (!(result.basalPressurePascal>2e9)||result.basalPressurePascal>1e10),'EXTENDED_PRESSURE_DOMAIN');
 add(result.domain==='BEYOND_10_GPA_UNRESOLVED' && !(result.basalPressurePascal>1e10),'EXTRAPOLATION');
 add(result.domain==='NO_FORMATION_H2O' && (result.waterMassKilograms!==0||result.thermalScenarios.length!==0),'DRY_MOON');
 for(const s of result.thermalScenarios) {
  add(!Number.isFinite(s.liquidMassKilograms)||s.liquidMassKilograms<0||s.solidMassKilograms<0||
   Math.abs(s.liquidMassKilograms+s.solidMassKilograms-result.waterMassKilograms)>1e-8*Math.max(1,result.waterMassKilograms),'PHASE_CONSERVATION');
  add(s.liquidLayerKilometers<0||s.highPressureIceKilometers<0||s.iceCoverKilometers<0||
    s.liquidLayerKilometers+s.highPressureIceKilometers+s.iceCoverKilometers>result.shellThicknessKilometers+1e-5,'RADIAL_GEOMETRY');
 }
 return errors;
}
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
 const {MoonSubsurfaceDomainEnginePRE3304:Engine}=load('simulation/planetary/moon-subsurface-domain-engine-pre33-04.ts');
 const {PlanetScientificTargetResolver:Projection}=load('simulation/planetary/planet-scientific-target-resolver.ts');
 const key=new UniverseGenerationKey(UniverseSeed.parse(o.seed),GeneratorVersion.V3);
 const galaxies=[];
 for(const gi of o.galaxies) {
  const galaxy=GalaxyGenerator.generate(key,BigInt(gi));
  const grid=GalaxySectorGridGenerator.generate(galaxy);
  const candidates=makeCandidates(o.seed,gi,grid.halfExtentInSectors,Math.max(1500,o.systems*100));
  const g={galaxy:galaxy.designation.name,galaxyIndex:gi,systems:0,single:0,binary:0,triple:0,
   planets:0,moons:0,dry:0,below2GPa:0,between2And10GPa:0,beyond10GPa:0,otherUnresolved:0,
   thermalScenarios:0,thermalMissing:0,publicV3Projected:0,legacyProjected:0,errors:[]};
  for(const pos of candidates) {
   if(g.systems>=o.systems)break;
   const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(pos.x,pos.y));
   if(!sector.systemLocators.length)continue;
   const id=identity([String(gi),pos.x,pos.y,'SYSTEM_INDEX']);
   const loc=sector.systemLocators[parseInt(id.slice(0,8),16)%sector.systemLocators.length];
   try {
    const multi=StellarMultihostFormation.generateOrNull(key,loc);
    const single=multi?null:StellarMultihostFormation.generateSingleOrNull(key,loc);
    if(!multi&&!single)throw Error('NO_V3_SYSTEM');
    const rows=multi?.publicPlanets??single.planets.map((planet,i)=>({
      planet,atmosphere:single.atmospheres[i],moonSystem:single.moonSystems[i],host:'A',
    }));
    g.systems++;
    if(multi?.components.length===2)g.binary++;
    else if(multi?.components.length===3)g.triple++;
    else g.single++;
    for(const [pi,row] of rows.entries()) {
     const {planet,atmosphere,moonSystem}=row;
     if(!moonSystem||!atmosphere)throw Error('INCOMPLETE_PLANET_SOURCES');
     g.planets++;
     // Use already materialized V3 public system's lunar physical sources.
     const extended=moonSystem.relevantMoons.map(moon => {
      const result=Engine.fromMaterialized(moon.physicalProperties,moon.formationInventory32F1d,
       moon.interiorStructure32F2b,moon.oceanReality32F2c,moon.environmentState.internalWaterAssessment);
      const errors=validate(moon.physicalProperties,moon.formationInventory32F1d,moon.interiorStructure32F2b,moon.oceanReality32F2c,result);
      if(errors.length)g.errors.push({at:`S${pos.x},${pos.y}/P${pi}/M${moon.moonOrdinal}`,errors});
      g.moons++;
      if(result.domain==='NO_FORMATION_H2O')g.dry++;
      else if(result.domain==='LEGACY_BELOW_2_GPA')g.below2GPa++;
      else if(result.domain==='EXTENDED_2_TO_10_GPA')g.between2And10GPa++;
      else if(result.domain==='BEYOND_10_GPA_UNRESOLVED')g.beyond10GPa++;
      else g.otherUnresolved++;
      g.thermalScenarios+=result.thermalScenarios.length;
      if(result.thermalEvaluation==='MISSING_THERMAL_INPUTS')g.thermalMissing++;
      return result;
     });
     if(extended.length) {
      const target={locator:row.publicLocator??planet.locator,planetOrdinal:pi+1,
       designation:`Audited-V3-${pi}`,hostSystemDesignation:galaxy.designation.name,
       orbitTopology:planet.hostPlanetarySystem.architecture.orbitTopology,
       hostPlanetCount:rows.length};
      const fiche=Projection.projectGenerated(target,planet,atmosphere,moonSystem,undefined,undefined,3);
      if(fiche.detail.moons.relevantMoons.length!==extended.length)throw Error('MOON_FICHE_COUNT');
      for(const [i,m] of fiche.detail.moons.relevantMoons.entries()) {
       if(JSON.stringify(m.subsurfaceDomainPRE3304)!==JSON.stringify(extended[i]))
        throw Error('V3_FICHE_PROVENANCE');
       g.publicV3Projected++;
      }
      // The same physically frozen source cannot grow PRE-33.04 fields on a V2 fiche.
      const legacy=Projection.projectGenerated(target,planet,atmosphere,moonSystem,undefined,undefined,2);
      for(const m of legacy.detail.moons.relevantMoons) {
       if(m.subsurfaceDomainPRE3304!==null)throw Error('LEGACY_FICHE_MODIFIED');
       g.legacyProjected++;
      }
     }
    }
   } catch(e) { g.errors.push({at:`S${pos.x},${pos.y}`,errors:[String(e.stack||e)]}); }
  }
  if(g.systems!==o.systems||g.moons!==g.dry+g.below2GPa+g.between2And10GPa+g.beyond10GPa+g.otherUnresolved||
    g.publicV3Projected!==g.moons||g.legacyProjected!==g.moons)g.errors.push({at:'SUMMARY',errors:['INCOMPLETE_AUDIT']});
  console.log(`${g.galaxy}: ${g.systems} sistemas, ${g.planets} planetas, ${g.moons} lunas, ${g.errors.length} incidencias`);
  galaxies.push(g);
 }
 const totals={systems:0,planets:0,moons:0,publicV3Projected:0,legacyProjected:0,between2And10GPa:0,errors:0};
 for(const g of galaxies){for(const k of Object.keys(totals))if(k!=='errors')totals[k]+=g[k];totals.errors+=g.errors.length;}
 const output={contract:'PRE-33.04/V3-LUNAR-SUBSURFACE-AUDIT/v1',seed:o.seed,version:'V3',
  sample:'3 galaxies, reproducible selected-sector systems (not galaxy-wide census)',
  totals,galaxies,
  scientificCertification:'CONDITIONAL_MELTING_PRESSURE_AND_TIDAL_PRIORS_NOT_AN_OBSERVED_OCEAN',
  verdict:totals.errors?'AUDIT_BLOCKED':'PRE33_04_V3_LUNAR_CONDITIONAL_DOMAIN_AUDITED'};
 fs.mkdirSync(o.out,{recursive:true});
 const json=JSON.stringify(output,null,2)+'\n';
 fs.writeFileSync(path.join(o.out,'pre33-04-auditoria.json'),json);
 fs.writeFileSync(path.join(o.out,'pre33-04-informe.md'),`# PRE-33.04 — Auditoría lunar V3\n\n${output.verdict}\n\n`+
   galaxies.map(g=>`- ${g.galaxy}: ${g.systems} sistemas, ${g.moons} lunas; ${g.between2And10GPa} en 2–10 GPa, ${g.errors.length} errores.`).join('\n')+
   '\n\nDominio de fusión H2O pura 0–10 GPa, modelo condicional; sin certificación observacional o de habitabilidad.\n');
 console.log(`${output.verdict} SHA-256 ${crypto.createHash('sha256').update(json).digest('hex')}`);
 if(o.strict&&totals.errors)process.exitCode=1;
 return output;
}
if(require.main===module)main();
module.exports={main,validate};
