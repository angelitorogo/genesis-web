#!/usr/bin/env node
'use strict';
/** PRE-33.05: deterministic READ-ONLY audit of V3 tidal/radiogenic/confinement.
 * Checks physical source identities, pressure monotonicity, reservoir closure,
 * public V3 projection and no observed/biological certification. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const cp=require('node:child_process');
const {makeCandidates,identity}=require('./pre33/pre33-audit-core.cjs');
const {parse}=require('./auditar-genesis-pre33-03a2a.cjs');
const register=()=>{const ts=require('typescript');if(!require.extensions['.ts'])require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true,useDefineForClassFields:false}}).outputText,f);};
const load=p=>require(path.resolve('src/app',p));
function validateDeep(physical, formation, interior, ocean, result) {
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
function validateEnergy(physical, formation, interior, ocean, tidal, model, deep) {
 const errors=[];const bad=(cond,code)=>{if(cond)errors.push(code);};
 const close=(a,b)=>Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b));
 bad(model.contractVersion!=='PRE-33.05/V3-LUNAR-ENERGY-CONFINEMENT/v1','CONTRACT');
 bad(model.hostPlanetOrdinal!==physical.hostPlanetOrdinal||model.moonOrdinal!==physical.moonOrdinal,'IDENTITY');
 bad(model.oceanConfirmed||model.independentThermalHistoryResolved||model.tidalResonanceSustained,'FALSE_CERTIFICATION');
 bad(model.radiogenicFluxWattsPerSquareMeter!==ocean.generatedRadiogenicFluxWattsPerSquareMeter,'RADIOGENIC_ORIGIN');
 bad(model.confinementPressurePascal!==(interior.waterMassKilograms>0?ocean.pressureAtWaterShellBasePascal:null),'PRESSURE_ORIGIN');
 if(deep.basalPressurePascal!==null)bad(model.confinementPressurePascal===null||
  !close(deep.basalPressurePascal,model.confinementPressurePascal),'CONFINEMENT_CROSS_SOURCE');
 bad(model.pressureDomain==='NO_H2O' && (formation.waterIceMassKilograms!==0||model.thermalConfinement!=='DRY_NO_WATER'),'DRY_MOON');
 bad(model.pressureDomain==='BEYOND_10_GPA' && !(model.confinementPressurePascal>1e10),'EXTRAPOLATION');
 bad(model.tidalRegime==='BOUNDED_SYNCHRONOUS_LOW_E' && (!tidal.isTidallyLocked||tidal.sourceEccentricity>=.15),'TIDAL_DOMAIN');
 bad(model.tidalRegime==='UNRESOLVED_SPIN_OR_HIGH_E' &&
   [model.tidalFluxMinimumWattsPerSquareMeter,model.tidalFluxMaximumWattsPerSquareMeter,
    model.totalFluxMinimumWattsPerSquareMeter].some(x=>x!==null),'INVENTED_TIDAL_FLUX');
 const lo=model.tidalFluxMinimumWattsPerSquareMeter,hi=model.tidalFluxMaximumWattsPerSquareMeter;
 if(lo!==null && hi!==null){
  bad(!Number.isFinite(lo)||lo<0||!Number.isFinite(hi)||hi<lo,'TIDAL_INTERVAL');
  const factor=4*Math.PI*(physical.radiusEarth*6371000)**2;
  bad(!close(model.tidalPowerMinimumWatts,lo*factor)||!close(model.tidalPowerMaximumWatts,hi*factor),'TIDAL_POWER_AREA');
  if(tidal.sourceEccentricity===0)bad(hi!==0||model.eccentricityDampingYearsMinimum!==null,'CIRCULAR_HEAT');
 }
 const rad=model.radiogenicFluxWattsPerSquareMeter;
 if(rad!==null&&lo!==null&&hi!==null){
  bad(!close(model.totalFluxMinimumWattsPerSquareMeter,rad+lo)||
      !close(model.totalFluxMaximumWattsPerSquareMeter,rad+hi),'HEAT_DOUBLE_COUNT');
 }
 if(deep.thermalEvaluation==='THREE_CONDITIONAL_CASES'){
  bad(lo===null||hi===null||rad===null,'DEEP_MISSING_ENERGY');
  const f=deep.thermalScenarios;
  bad(f.length!==3||!close(f[0].heatFluxWattsPerSquareMeter,rad+lo)||
    !close(f[1].heatFluxWattsPerSquareMeter,model.totalFluxNominalWattsPerSquareMeter)||
    !close(f[2].heatFluxWattsPerSquareMeter,rad+hi),'DEEP_ENERGY_HANDOFF');
 }
 errors.push(...validateDeep(physical,formation,interior,ocean,deep));
 return errors;
}
function main(argv=process.argv.slice(2)) {
 const o=parse(argv);
 // Large audits are isolated by galaxy to avoid accumulating 60 full 3D/
 // science projection graphs in a single Node heap. Same seed and sample.
 if(o.galaxies.length>1) {
  const galaxies=[];
  for(const gi of o.galaxies) {
   const dir=path.join(o.out,'.pre33-05-galaxy-'+gi);
   const args=[__filename,'--seed='+o.seed,'--galaxies='+gi,
    '--systems-per-galaxy='+o.systems,'--out='+dir];
   if(o.strict)args.push('--strict');
   const run=cp.spawnSync(process.execPath,args,{encoding:'utf8',env:process.env,maxBuffer:16*1024*1024});
   if(run.stdout)process.stdout.write(run.stdout);
   if(run.stderr)process.stderr.write(run.stderr);
   if(run.error || run.status!==0)throw Error('Galactic audit '+gi+' failed: '+(run.error||run.status));
   const data=JSON.parse(fs.readFileSync(path.join(dir,'pre33-05-auditoria.json'),'utf8'));
   galaxies.push(...data.galaxies);
  }
  const totals={systems:0,planets:0,moons:0,energeticResolved:0,energeticUnresolved:0,
   publicV3Projected:0,legacyProjected:0,between2And10GPa:0,errors:0};
  for(const g of galaxies){for(const key of Object.keys(totals)){
   if(key==='errors')totals.errors+=g.errors.length;
   else totals[key]+=g[key];
  }}
  const output={contract:'PRE-33.05/V3-LUNAR-ENERGY-CONFINEMENT-AUDIT/v1',seed:o.seed,
   version:'V3',sample:'3 galaxies, reproducible selected-sector systems (not galaxy-wide census)',
   totals,galaxies,
   scientificCertification:'MODEL_BOUNDED_RHEOLOGY_AND_RADIOGENIC_PRIORS_NOT_OBSERVED_OR_INDEPENDENT_HISTORY',
   verdict:totals.errors?'AUDIT_BLOCKED':'PRE33_05_V3_LUNAR_ENERGY_AND_CONFINEMENT_AUDITED'};
  fs.mkdirSync(o.out,{recursive:true});const json=JSON.stringify(output,null,2)+'\n';
  fs.writeFileSync(path.join(o.out,'pre33-05-auditoria.json'),json);
  fs.writeFileSync(path.join(o.out,'pre33-05-informe.md'),
   '# PRE-33.05 — Auditoría lunar V3\n\n'+output.verdict+'\n\n'+
   galaxies.map(g=>'- '+g.galaxy+': '+g.systems+' sistemas, '+g.planets+' planetas, '+
    g.moons+' lunas, '+g.energeticResolved+' intervalos energéticos, '+g.errors.length+
    ' errores.').join('\n')+'\n\nLa energía lunar se calcula con incertidumbre reológica acotada y prior radiogénico CT-0 reutilizado, sin certificación observacional ni de habitabilidad.\n');
  const hash=crypto.createHash('sha256').update(json).digest('hex');
  console.log(output.verdict+' SHA-256 '+hash);
  if(o.strict && totals.errors)process.exitCode=1;
  return output;
 }
 register();
 const {UniverseSeed}=load('domain/universe/universe-seed.ts');
 const {UniverseGenerationKey}=load('domain/generation/universe-generation-key.ts');
 const {GeneratorVersion}=load('domain/generation/generator-version.ts');
 const {GalaxyGenerator}=load('simulation/universe/galaxy-generator.ts');
 const {GalaxySectorGridGenerator}=load('simulation/sector/galaxy-sector-grid-generator.ts');
 const {GalaxySectorContentGenerator}=load('simulation/sector/galaxy-sector-content-generator.ts');
 const {GalaxySectorCoordinates}=load('domain/sector/galaxy-sector-coordinates.ts');
 const {StellarMultihostFormation}=load('simulation/stellar/stellar-multihost-formation.ts');
 const {MoonEnergyConfinementEnginePRE3305:Energy}=load('simulation/planetary/moon-energy-confinement-engine-pre33-05.ts');
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
   thermalScenarios:0,thermalMissing:0,energeticResolved:0,energeticUnresolved:0,
   publicV3Projected:0,legacyProjected:0,errors:[]};
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
      const energy=Energy.fromMaterialized(moon.physicalProperties,moon.tidalState,
       moon.formationInventory32F1d,moon.interiorStructure32F2b,moon.oceanReality32F2c);
      const result=Engine.fromMaterialized(moon.physicalProperties,moon.formationInventory32F1d,
       moon.interiorStructure32F2b,moon.oceanReality32F2c,moon.environmentState.internalWaterAssessment,energy);
      const errors=validateEnergy(moon.physicalProperties,moon.formationInventory32F1d,
       moon.interiorStructure32F2b,moon.oceanReality32F2c,moon.tidalState,energy,result);
      if(energy.totalFluxMinimumWattsPerSquareMeter===null)g.energeticUnresolved++;
      else g.energeticResolved++;
      if(errors.length)g.errors.push({at:`S${pos.x},${pos.y}/P${pi}/M${moon.moonOrdinal}`,errors});
      g.moons++;
      if(result.domain==='NO_FORMATION_H2O')g.dry++;
      else if(result.domain==='LEGACY_BELOW_2_GPA')g.below2GPa++;
      else if(result.domain==='EXTENDED_2_TO_10_GPA')g.between2And10GPa++;
      else if(result.domain==='BEYOND_10_GPA_UNRESOLVED')g.beyond10GPa++;
      else g.otherUnresolved++;
      g.thermalScenarios+=result.thermalScenarios.length;
      if(result.thermalEvaluation==='MISSING_THERMAL_INPUTS')g.thermalMissing++;
      return {energy,result};
     });
     if(extended.length) {
      const target={locator:row.publicLocator??planet.locator,planetOrdinal:pi+1,
       designation:`Audited-V3-${pi}`,hostSystemDesignation:galaxy.designation.name,
       orbitTopology:planet.hostPlanetarySystem.architecture.orbitTopology,
       hostPlanetCount:rows.length};
      const fiche=Projection.projectGenerated(target,planet,atmosphere,moonSystem,undefined,undefined,3);
      if(fiche.detail.moons.relevantMoons.length!==extended.length)throw Error('MOON_FICHE_COUNT');
      for(const [i,m] of fiche.detail.moons.relevantMoons.entries()) {
       if(JSON.stringify(m.subsurfaceDomainPRE3304)!==JSON.stringify(extended[i].result))
        throw Error('V3_FICHE_PRE33_04_PROVENANCE');
       if(JSON.stringify(m.energyConfinementPRE3305)!==JSON.stringify(extended[i].energy))
        throw Error('V3_FICHE_PRE33_05_PROVENANCE');
       g.publicV3Projected++;
      }
      // The same physically frozen source cannot grow PRE-33.04 fields on a V2 fiche.
      const legacy=Projection.projectGenerated(target,planet,atmosphere,moonSystem,undefined,undefined,2);
      for(const m of legacy.detail.moons.relevantMoons) {
       if(m.subsurfaceDomainPRE3304!==null||m.energyConfinementPRE3305!==null)
         throw Error('LEGACY_FICHE_MODIFIED');
       g.legacyProjected++;
      }
     }
    }
   } catch(e) { g.errors.push({at:`S${pos.x},${pos.y}`,errors:[String(e.stack||e)]}); }
  }
  if(g.systems!==o.systems||g.moons!==g.dry+g.below2GPa+g.between2And10GPa+g.beyond10GPa+g.otherUnresolved||
    g.publicV3Projected!==g.moons||g.legacyProjected!==g.moons||
    g.energeticResolved+g.energeticUnresolved!==g.moons)g.errors.push({at:'SUMMARY',errors:['INCOMPLETE_AUDIT']});
  console.log(`${g.galaxy}: ${g.systems} sistemas, ${g.planets} planetas, ${g.moons} lunas, ${g.errors.length} incidencias`);
  galaxies.push(g);
 }
 const totals={systems:0,planets:0,moons:0,energeticResolved:0,energeticUnresolved:0,publicV3Projected:0,legacyProjected:0,between2And10GPa:0,errors:0};
 for(const g of galaxies){for(const k of Object.keys(totals))if(k!=='errors')totals[k]+=g[k];totals.errors+=g.errors.length;}
 const output={contract:'PRE-33.05/V3-LUNAR-ENERGY-CONFINEMENT-AUDIT/v1',seed:o.seed,version:'V3',
  sample:'3 galaxies, reproducible selected-sector systems (not galaxy-wide census)',
  totals,galaxies,
  scientificCertification:'MODEL_BOUNDED_RHEOLOGY_AND_RADIOGENIC_PRIORS_NOT_OBSERVED_OR_INDEPENDENT_HISTORY',
  verdict:totals.errors?'AUDIT_BLOCKED':'PRE33_05_V3_LUNAR_ENERGY_AND_CONFINEMENT_AUDITED'};
 fs.mkdirSync(o.out,{recursive:true});
 const json=JSON.stringify(output,null,2)+'\n';
 fs.writeFileSync(path.join(o.out,'pre33-05-auditoria.json'),json);
 fs.writeFileSync(path.join(o.out,'pre33-05-informe.md'),`# PRE-33.05 — Auditoría lunar V3\n\n${output.verdict}\n\n`+
   galaxies.map(g=>`- ${g.galaxy}: ${g.systems} sistemas, ${g.moons} lunas; ${g.between2And10GPa} en 2–10 GPa, ${g.energeticResolved} balances energéticos acotados, ${g.errors.length} errores.`).join('\n')+
   '\n\nMareas calculadas con k₂/Q reológico acotado; producción radiogénica reutilizada de 32.F.2c. Sin certificación observacional, historia dinámica independiente ni habitabilidad.\n');
 console.log(`${output.verdict} SHA-256 ${crypto.createHash('sha256').update(json).digest('hex')}`);
 if(o.strict&&totals.errors)process.exitCode=1;
 return output;
}
if(require.main===module)main();
module.exports={main,validateEnergy};
