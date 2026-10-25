#!/usr/bin/env node
'use strict';
/** PRE-33.07 — reproducible, read-only V3 chemistry audit. Never grants life/discovery. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const {makeCandidates,identity}=require('./pre33/pre33-audit-core.cjs');
const {parse}=require('./auditar-genesis-pre33-03a2a.cjs');
const register=()=>{const ts=require('typescript');if(!require.extensions['.ts'])require.extensions['.ts']=(m,f)=>
 m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,
 target:ts.ScriptTarget.ES2022}}).outputText,f);};
const load=p=>require(path.resolve('src/app',p));
function fresh(galaxy,gi){return {galaxy,galaxyIndex:gi,systems:0,planets:0,moons:0,modeledLiquidNiches:0,
  conditionalNiches:0,positiveChemicalRoutes:0,powerUnresolved:0,scenarioUpperPositive:0,
  scenarioUnresolved:0,planetProjections:0,moonProjections:0,
  v2PlanetsIsolated:0,v2MoonsIsolated:0,observedOrLifeGrants:0,evidenceProbes:0,errors:[]};}
function validate(r,kind,g){
 if(r?.contract!=='PRE-33.07/V3-CAUSAL-GEOCHEMISTRY/v1'||r.niche.bodyKind!==kind||
    r.lifeEvaluated!==false||r.observationallyConfirmed!==false||r.globalChemicalPowerWatts!==null||
    r.reactions.length!==6)throw Error('UNSAFE_CHEMISTRY_PROJECTION');
 if(r.hasPositiveResolvedPower&&r.reactions.every(x=>x.chemicalPowerWatts===null||x.chemicalPowerWatts===0))
   throw Error('POWER_WITHOUT_REACTION');
 if(r.quantifiedPathwayPowerWatts!==null&&(!Number.isFinite(r.quantifiedPathwayPowerWatts)||
    r.quantifiedPathwayPowerWatts<0))throw Error('NON_PHYSICAL_CHEMICAL_POWER');
 for(const rx of r.reactions){
  if(rx.chargeAndAtomsBalanced!==true)throw Error('STOICHIOMETRY_UNBALANCED');
  if(rx.chemicalPowerWatts!==null&&(!rx.sourceIds.length||rx.gibbsJoulesPerMole===null||
     rx.forwardRateMolesPerSecond===null))throw Error('UNSOURCED_POWER');
  if(rx.status==='HYPOTHETICAL_PATHWAY'&&rx.chemicalPowerWatts!==null)
     throw Error('HYPOTHESIS_AS_PHYSICAL_POWER');
 }
 const source=r.formationSensitivityPRE3307;
 if(!source || source.physicallyResolvedPowerWatts!==null || source.lowerBoundPowerWatts!==0 ||
    source.contract!=='PRE-33.07/V3-FORMATION-MINERAL-TRANSPORT-SENSITIVITY/v1')
    throw Error('MISSING_FORMATION_CHEMICAL_SENSITIVITY');
 if(source.conditionalUpperPowerWatts!==null){
  if(!Number.isFinite(source.conditionalUpperPowerWatts)||source.conditionalUpperPowerWatts<0||
    source.conservationResidual01===null||source.conservationResidual01>1e-8||
    source.modeledDeltaGJoulesPerMole===null||source.assumedUpperReactionRateMolesPerSecond===null)
    throw Error('INVALID_CONDITIONAL_CHEMISTRY');
  if(source.conditionalUpperPowerWatts>0)g.scenarioUpperPositive++;
 }else g.scenarioUnresolved++;
 if(source.conditionalUpperPowerWatts!==null&&r.quantifiedPathwayPowerWatts!==null&&
    source.status==='CONDITIONAL_CONTACT_UPPER_BOUND')
    throw Error('HYPOTHESIS_PROMOTED_TO_REAL_POWER');
 if(r.niche.solventState==='MODELLED_LIQUID_CT0')g.modeledLiquidNiches++;
 else g.conditionalNiches++;
 if(r.hasPositiveResolvedPower)g.positiveChemicalRoutes++;
 if(r.quantifiedPathwayPowerWatts===null)g.powerUnresolved++;
}
function persist(out,galaxies,lines){
 const totals={systems:0,planets:0,moons:0,modeledLiquidNiches:0,conditionalNiches:0,
  positiveChemicalRoutes:0,powerUnresolved:0,scenarioUpperPositive:0,
  scenarioUnresolved:0,planetProjections:0,moonProjections:0,
  v2PlanetsIsolated:0,v2MoonsIsolated:0,observedOrLifeGrants:0,evidenceProbes:0,errors:0};
 for(const g of galaxies){for(const k of Object.keys(totals))totals[k]+=k==='errors'?g.errors.length:g[k];}
 const result={contract:'PRE-33.07/V3-REACTION-AUDIT/v1',
  sample:'Selected deterministic-sector systems, NOT a complete-galaxy census',totals,galaxies,
  scientificScope:'CT0 solvents, conditional pathways, independent Gibbs/activity/rate gate; no heat-to-chemical conversion',
  verdict:totals.errors?'PRE33_07_V3_REACTION_AUDIT_BLOCKED':'PRE33_07_V3_REACTION_COVERAGE_AUDITED'};
 const json=JSON.stringify(result,null,2)+'\n';fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'pre33-07-auditoria.json'),json);
 fs.writeFileSync(path.join(out,'pre33-07-por-cuerpo.csv'),
  'galaxia,sector,planeta,luna,tipo,nicho,solvente,estadoSolvente,contacto,fuentes,hipotesis,rutasPotenciaPositiva,potenciaRutaW,potenciaEscenarioCotaSuperiorW,estadoEscenarioMineral\n'+lines.join('\n')+'\n');
 fs.writeFileSync(path.join(out,'pre33-07-informe.md'),
  '# PRE-33.07 — Geoquímica y potencia química, auditoría V3\n\n'+result.verdict+'\n\n'+
  '| Galaxia | Sistemas | Planetas | Lunas | Nichos con H₂O líquido CT-0 modelado | Escenarios superiores positivos, NO reales | Rutas positivas independientes | Incidencias |\n'+
  '|---|---:|---:|---:|---:|---:|---:|---:|\n'+galaxies.map(g=>`| ${g.galaxy} | ${g.systems} | ${g.planets} | ${g.moons} | ${g.modeledLiquidNiches} | ${g.scenarioUpperPositive} | ${g.positiveChemicalRoutes} | ${g.errors.length} |`).join('\n')+'\n\n'+
  'Los escenarios de sensibilidad geoquímica introducen hipótesis explícitas de FeO reactivo, barrera de transporte, química de H₂ y tasa de disolución. Sus cotas superiores NO son potencia física certificada ni habilitan vida. La cota inferior permanece cero. No se infieren actividades, minerales, gradientes redox, ΔG(T,P), cinéticas o vatios metabólicos como hechos a partir de H₂O, gas, rocas o flujo térmico. El modelo de reacciones permite resolver una ruta solo con entradas independientes y conserva átomos/carga. Una ruta en hipótesis es científicamente distinta de una potencia física. Los estados CT-0 no representan evidencias observadas ni continuidad temporal. Se verifica la proyección V3 de todos los cuerpos materializados y el aislamiento V2.\n');
 console.log(result.verdict+' SHA256 '+crypto.createHash('sha256').update(json).digest('hex'));
 return result;
}
function main(argv=process.argv.slice(2)){
 const o=parse(argv);
 if(o.galaxies.length>1){const galaxies=[],lines=[];
  for(const gi of o.galaxies){const dir=path.join(o.out,'.geochemistry-g'+gi);
   const args=[__filename,'--seed='+o.seed,'--galaxies='+gi,'--systems-per-galaxy='+o.systems,'--out='+dir];
   if(o.strict)args.push('--strict');
   const sub=cp.spawnSync(process.execPath,args,{encoding:'utf8',maxBuffer:32*1024*1024});
   if(sub.stdout)process.stdout.write(sub.stdout);if(sub.stderr)process.stderr.write(sub.stderr);
   if(sub.error||sub.status!==0)throw Error('PRE33_07_GALAXY_FAILED '+gi+' '+(sub.error||sub.status));
   galaxies.push(...JSON.parse(fs.readFileSync(path.join(dir,'pre33-07-auditoria.json'),'utf8')).galaxies);
   lines.push(...fs.readFileSync(path.join(dir,'pre33-07-por-cuerpo.csv'),'utf8').trim().split('\n').slice(1));
  }
  return persist(o.out,galaxies,lines);
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
 const {PlanetScientificTargetResolver:Resolver}=load('simulation/planetary/planet-scientific-target-resolver.ts');
 const {GeochemistryWorldPRE3307:Geo}=load('simulation/planetary/geochemistry-world-pre33-07.ts');
 const {GeochemistryReactionEnginePRE3307:Engine}=load('simulation/planetary/geochemistry-reaction-engine-pre33-07.ts');
 const {EnvironmentalPhysicalProjectionPRE3301:Evidence}=load('simulation/planetary/environmental-physical-projection-pre33-01.ts');
 Engine.verifyStoichiometry();
 const key=new UniverseGenerationKey(UniverseSeed.parse(o.seed),GeneratorVersion.V3);
 const galaxies=[],lines=[];
 for(const gi of o.galaxies){
  const galaxy=GalaxyGenerator.generate(key,BigInt(gi)),grid=GalaxySectorGridGenerator.generate(galaxy);
  const candidates=makeCandidates(o.seed,gi,grid.halfExtentInSectors,Math.max(1500,o.systems*100));
  const g=fresh(galaxy.designation.name,gi);
  for(const pos of candidates){
   if(g.systems>=o.systems)break;
   const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(pos.x,pos.y));
   if(!sector.systemLocators.length)continue;
   const loc=sector.systemLocators[parseInt(identity([String(gi),pos.x,pos.y,'SYSTEM_INDEX']).slice(0,8),16)%sector.systemLocators.length];
   try{
    const multi=StellarMultihostFormation.generateOrNull(key,loc);
    const single=multi?null:StellarMultihostFormation.generateSingleOrNull(key,loc);
    if(!multi&&!single)throw Error('MISSING_SYSTEM');
    const worlds=multi?.publicPlanets??single.planets.map((planet,i)=>({planet,atmosphere:single.atmospheres[i],moonSystem:single.moonSystems[i]}));
    g.systems++;
    let checkedEvidencePlanet=false,checkedEvidenceMoon=false;
    for(const [i,w] of worlds.entries()){
     const {planet,atmosphere,moonSystem}=w;
     const ident={locator:w.publicLocator??planet.locator,planetOrdinal:i+1,
      designation:`Auditoría-${i+1}`,hostSystemDesignation:g.galaxy,
      orbitTopology:planet.hostPlanetarySystem.architecture.orbitTopology,hostPlanetCount:worlds.length};
     const v3=Resolver.projectGenerated(ident,planet,atmosphere,moonSystem,undefined,undefined,3);
     const p=v3.detail.geochemistryPRE3307;
     validate(p,'PLANET',g);g.planets++;g.planetProjections++;
     if(!checkedEvidencePlanet){const ev=Evidence.planet(planet,atmosphere);
      if(ev.lifeEvaluated!==false||ev.energy.chemicalPowerUpperScenarioWatts?.state==='MODELLED_CT0'||
       ev.energy.extractableChemicalPowerWatts.state==='MODELLED_CT0'&&
         p.quantifiedPathwayPowerWatts===null)throw Error('PRE33_01_CHEMICAL_ENERGY_MISMATCH');
      g.evidenceProbes++;checkedEvidencePlanet=true;}
     lines.push([g.galaxy,`S${pos.x}:${pos.y}`,i+1,'','PLANET',p.niche.niche,p.niche.solvent,
       p.niche.solventState,p.niche.waterRockContact,p.inventorySourceIds.length,
       p.reactions.filter(r=>r.status==='HYPOTHETICAL_PATHWAY').length,
       p.reactions.filter(r=>r.status==='POWER_MODELLED_CT0'&&r.chemicalPowerWatts>0).length,
       p.quantifiedPathwayPowerWatts,p.formationSensitivityPRE3307?.conditionalUpperPowerWatts,
       p.formationSensitivityPRE3307?.status].map(x=>JSON.stringify(x??'')).join(','));
     if(v3.detail.moons.relevantMoons.length!==moonSystem.relevantMoons.length)throw Error('MISSING_MOON_FICHE');
     for(const [j,moon] of moonSystem.relevantMoons.entries()){
      const cm=v3.detail.moons.relevantMoons[j].geochemistryPRE3307,expected=Geo.moon(moon.geochemicalEnergy32F4,null,
        moon.formationInventory32F1d??null,moon.interiorStructure32F2b??null);
      validate(cm,'MOON',g);if(JSON.stringify(expected)!==JSON.stringify(cm))throw Error('MOON_MODEL_FICHE_MISMATCH');
      g.moons++;g.moonProjections++;
      if(!checkedEvidenceMoon){const ev=Evidence.moon(moon,planet);
       if(ev.lifeEvaluated!==false||ev.energy.chemicalPowerUpperScenarioWatts?.state==='MODELLED_CT0'||
          ev.energy.extractableChemicalPowerWatts.state==='MODELLED_CT0'&&
          cm.quantifiedPathwayPowerWatts===null)throw Error('PRE33_01_MOON_CHEMICAL_MISMATCH');
       g.evidenceProbes++;checkedEvidenceMoon=true;}
      lines.push([g.galaxy,`S${pos.x}:${pos.y}`,i+1,moon.moonOrdinal,'MOON',cm.niche.niche,
       cm.niche.solvent,cm.niche.solventState,cm.niche.waterRockContact,cm.inventorySourceIds.length,
       cm.reactions.filter(r=>r.status==='HYPOTHETICAL_PATHWAY').length,
       cm.reactions.filter(r=>r.status==='POWER_MODELLED_CT0'&&r.chemicalPowerWatts>0).length,
       cm.quantifiedPathwayPowerWatts,cm.formationSensitivityPRE3307?.conditionalUpperPowerWatts,
       cm.formationSensitivityPRE3307?.status].map(x=>JSON.stringify(x??'')).join(','));
     }
     const v2=Resolver.projectGenerated(ident,planet,atmosphere,moonSystem,undefined,undefined,2);
     if(v2.detail.geochemistryPRE3307!==null)throw Error('V2_PLANET_CHEMICAL_LEAK');g.v2PlanetsIsolated++;
     for(const m of v2.detail.moons.relevantMoons){if(m.geochemistryPRE3307!==null)throw Error('V2_MOON_CHEMICAL_LEAK');g.v2MoonsIsolated++;}
    }
   }catch(e){g.errors.push({sector:`${pos.x},${pos.y}`,error:String(e?.stack??e)});}
  }
  if(g.systems!==o.systems||g.planets!==g.planetProjections||g.moons!==g.moonProjections||
     g.planets!==g.v2PlanetsIsolated||g.moons!==g.v2MoonsIsolated||
     g.positiveChemicalRoutes>g.planets+g.moons)g.errors.push({sector:'SUMMARY',error:'INCOMPLETE_AUDIT'});
  console.log(`${g.galaxy}: ${g.systems} sistemas, ${g.planets} planetas, ${g.moons} lunas, ${g.errors.length} incidencias`);
  galaxies.push(g);
 }
 const result=persist(o.out,galaxies,lines);
 if(o.strict&&result.totals.errors)process.exitCode=1;
 return result;
}
if(require.main===module)main();
module.exports={main,validate};
