#!/usr/bin/env node
'use strict';
/** Read-only CT0 radiation audit: no radiation index, bolometric flux or one-MeV
 * primary photon transmission may be promoted to real Gy/year. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const {makeCandidates,identity}=require('./pre33/pre33-audit-core.cjs');
const {parse}=require('./auditar-genesis-pre33-03a2a.cjs');
const register=()=>{const ts=require('typescript');if(!require.extensions['.ts'])require.extensions['.ts']=(m,f)=>
 m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,
 target:ts.ScriptTarget.ES2022}}).outputText,f);};
const load=p=>require(path.resolve('src/app',p));
const cols=['galaxia','sector','planeta','luna','tipo','superficie','atmosferaKgM2','hieloKgM2','transmisionGamma1MeV','fuenteFotonica','fuenteParticulas','dosisSuperficieGyAno','dosisSubsueloGyAno','estado','biologia'];
function fresh(galaxy,index){return {galaxy,galaxyIndex:index,systems:0,planets:0,moons:0,
  planetProjections:0,moonProjections:0,v2PlanetsIsolated:0,v2MoonsIsolated:0,
  planetPhysicalColumns:0,positiveAtmosphereColumns:0,moonOceanIceColumns:0,reportedDoses:0,unknownDoses:0,
  envelopeWithoutSolidSurface:0,independentlyQuantifiedSpectra:0,evidenceProbes:0,errors:[]};}
function assertWorld(w,kind,g){
 if(w?.contract!=='PRE-33.08/V3-SOURCED-SPECTRAL-RADIATION/v1'||w.bodyKind!==kind||
    w.epoch!=='CT0'||w.observationallyConfirmed!==false||w.biologyEvaluated!==false||
    w.stellarBolometricIsIonizingSource!==false||w.magneticParticleTransmission01!==null)
   throw Error('UNSAFE_RADIATION_CONTRACT');
 if(w.atmosphereColumn!==null){const c=w.atmosphereColumn;
  if(!Number.isFinite(c.kilogramsPerSquareMeter)||c.kilogramsPerSquareMeter<0||
     !c.sourceRecordKey||c.provenance!=='CT0_CONSTITUTIVE')throw Error('INVALID_GAS_COLUMN');
  if(kind==='PLANET'){g.planetPhysicalColumns++;if(c.kilogramsPerSquareMeter>0)g.positiveAtmosphereColumns++;}
 }
 if(w.oceanIceColumn!==null){if(kind!=='MOON'||w.oceanIceColumn.material!=='H2O_ICE'||
  !Number.isFinite(w.oceanIceColumn.kilogramsPerSquareMeter)||w.oceanIceColumn.kilogramsPerSquareMeter<0)
   throw Error('INVALID_ICE_COLUMN');g.moonOceanIceColumns++;}
 if(w.gammaOneMeVReferenceDirectTransmission01!==null){const x=w.gammaOneMeVReferenceDirectTransmission01;
  if(kind!=='MOON'||!Number.isFinite(x)||x<0||x>1)throw Error('INVALID_REFERENCE_GAMMA');}
 if(!w.hasSolidSurface){if(w.surface.status!=='NO_SURFACE_REFERENCE'||w.surface.doseGrayPerYear!==null)
  throw Error('ENVELOPE_HAS_FAKE_SOLID_SURFACE_DOSE');g.envelopeWithoutSolidSurface++;}
 for(const d of [w.surface,w.subsurface,w.envelope]){
  if(d.lifeOrSafetyCertified!==false || d.eventDoseGray!==null)throw Error('LIFE_OR_EVENT_GRANTED');
  if(d.doseGrayPerYear!==null){
   if(d.status!=='MODELLED_CT0_DOSE'||d.sourceRecordKeys.length<4 ||
     !Number.isFinite(d.doseGrayPerYear)||d.doseGrayPerYear<0 ||
     w.photonSource==='UNRESOLVED'||w.particleSource==='UNRESOLVED')
    throw Error('DOSE_WITHOUT_COMPLETE_SPECTRAL_SOURCE');
   g.reportedDoses++;
  }else g.unknownDoses++;
 }
 if(w.photonSource==='QUANTIFIED'||w.particleSource==='QUANTIFIED')g.independentlyQuantifiedSpectra++;
}
function write(out,galaxies,lines){
 const totals={systems:0,planets:0,moons:0,planetProjections:0,moonProjections:0,
  v2PlanetsIsolated:0,v2MoonsIsolated:0,planetPhysicalColumns:0,positiveAtmosphereColumns:0,moonOceanIceColumns:0,
  reportedDoses:0,unknownDoses:0,envelopeWithoutSolidSurface:0,
  independentlyQuantifiedSpectra:0,evidenceProbes:0,errors:0};
 for(const g of galaxies)for(const k of Object.keys(totals))totals[k]+=k==='errors'?g.errors.length:g[k];
 const r={contract:'PRE-33.08/V3-RADIATION-CT0-AUDIT/v1',
  sample:'60 reproducible selected-sector systems, not a galaxy-wide census',totals,galaxies,
  scope:'Spectral source + complete dosimetry gate; CT0 shield columns and independent source provenance; no biology',
  verdict:totals.errors?'PRE33_08_RADIATION_AUDIT_BLOCKED':'PRE33_08_V3_SPECTRAL_SHIELDING_AUDITED'};
 const json=JSON.stringify(r,null,2)+'\n';fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'pre33-08-auditoria.json'),json);
 fs.writeFileSync(path.join(out,'pre33-08-por-cuerpo.csv'),cols.join(',')+'\n'+lines.join('\n')+'\n');
 fs.writeFileSync(path.join(out,'pre33-08-informe.md'),
  '# PRE-33.08 — Radiación, espectros y blindaje físico V3\n\n**'+r.verdict+'**\n\n'+
  '| Galaxia | Sistemas | Planetas | Lunas | Columna gaseosa causal planetaria | Columnas gaseosas >0 | Cubiertas lunares CT-0 | Dosis CT-0 | Errores |\n'+
  '|---|---:|---:|---:|---:|---:|---:|---:|---:|\n'+
  galaxies.map(g=>`| ${g.galaxy} | ${g.systems} | ${g.planets} | ${g.moons} | ${g.planetPhysicalColumns} | ${g.positiveAtmosphereColumns} | ${g.moonOceanIceColumns} | ${g.reportedDoses} | ${g.errors.length} |`).join('\n')+'\n\n'+
  '**Interpretación:** la fuente bolométrica no identifica fotones ionizantes ni partículas. Se preservan los perfiles de columna y la transmisión primaria γ de referencia 32.F.3, sin convertirlos a dosis. Una dosis en Gy/año necesita espectro completo, geometría y respuesta dosimétrica calibrada para todos los canales energéticos; en caso contrario es UNKNOWN. No se genera vida, seguridad radiológica ni protección magnetosférica ficticia. Los eventos transitorios fechados dan Gy/episodio y nunca Gy/año sin su forzamiento completo. V1/V2 intactos, fichas V3 muestreadas, evidencia PRE-33.01 de solo lectura.\n');
 console.log(r.verdict+' SHA256 '+crypto.createHash('sha256').update(json).digest('hex'));return r;
}
function csvLine(...xs){return xs.map(x=>JSON.stringify(x??'')).join(',');}
function main(argv=process.argv.slice(2)){
 const o=parse(argv);
 if(o.galaxies.length>1){const galaxies=[],lines=[];
  for(const gi of o.galaxies){const dir=path.join(o.out,'.radiation-g'+gi);
   const sub=cp.spawnSync(process.execPath,[__filename,'--seed='+o.seed,'--galaxies='+gi,
    '--systems-per-galaxy='+o.systems,'--out='+dir,...(o.strict?['--strict']:[])],
    {encoding:'utf8',maxBuffer:32*1024*1024});
   if(sub.stdout)process.stdout.write(sub.stdout);if(sub.stderr)process.stderr.write(sub.stderr);
   if(sub.error||sub.status!==0)throw Error('PRE33_08_GALAXY_FAILED '+gi+' '+(sub.error||sub.status));
   galaxies.push(...JSON.parse(fs.readFileSync(path.join(dir,'pre33-08-auditoria.json'),'utf8')).galaxies);
   lines.push(...fs.readFileSync(path.join(dir,'pre33-08-por-cuerpo.csv'),'utf8').trim().split('\n').slice(1));
  }
  return write(o.out,galaxies,lines);
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
 const {EnvironmentalPhysicalProjectionPRE3301:Evidence}=load('simulation/planetary/environmental-physical-projection-pre33-01.ts');
 const key=new UniverseGenerationKey(UniverseSeed.parse(o.seed),GeneratorVersion.V3);
 const galaxies=[],lines=[];
 for(const gi of o.galaxies){const galaxy=GalaxyGenerator.generate(key,BigInt(gi));
  const grid=GalaxySectorGridGenerator.generate(galaxy);
  const candidates=makeCandidates(o.seed,gi,grid.halfExtentInSectors,Math.max(1500,o.systems*100));
  const g=fresh(galaxy.designation.name,gi);
  for(const pos of candidates){if(g.systems>=o.systems)break;
   const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(pos.x,pos.y));
   if(!sector.systemLocators.length)continue;
   const loc=sector.systemLocators[parseInt(identity([String(gi),pos.x,pos.y,'SYSTEM_INDEX']).slice(0,8),16)%sector.systemLocators.length];
   try{
    const multi=StellarMultihostFormation.generateOrNull(key,loc);
    const single=multi?null:StellarMultihostFormation.generateSingleOrNull(key,loc);
    if(!multi&&!single)throw Error('MISSING_SYSTEM');
    const worlds=multi?.publicPlanets??single.planets.map((planet,i)=>({planet,atmosphere:single.atmospheres[i],moonSystem:single.moonSystems[i]}));
    g.systems++;let probePlanet=false,probeMoon=false;
    for(const [i,w] of worlds.entries()){
     const {planet,atmosphere,moonSystem}=w;
     const ident={locator:w.publicLocator??planet.locator,planetOrdinal:i+1,
      designation:`Radiación-${i+1}`,hostSystemDesignation:g.galaxy,
      orbitTopology:planet.hostPlanetarySystem.architecture.orbitTopology,hostPlanetCount:worlds.length};
     const v3=Resolver.projectGenerated(ident,planet,atmosphere,moonSystem,undefined,undefined,3);
     const r=v3.detail.radiationPRE3308;assertWorld(r,'PLANET',g);g.planets++;g.planetProjections++;
     if(!probePlanet){const ev=Evidence.planet(planet,atmosphere);
      if(ev.lifeEvaluated!==false||ev.radiation.surfaceIonizingDoseGrayPerYear.state==='MODELLED_CT0'&&
         r.surface.doseGrayPerYear===null)throw Error('PRE33_01_FAKE_PLANET_DOSE');
      probePlanet=true;g.evidenceProbes++;}
     lines.push(csvLine(g.galaxy,`S${pos.x}:${pos.y}`,i+1,'','PLANET',r.hasSolidSurface,
      r.atmosphereColumn?.kilogramsPerSquareMeter,null,null,r.photonSource,r.particleSource,
      r.surface.doseGrayPerYear,r.subsurface.doseGrayPerYear,r.surface.status,r.biologyEvaluated));
     if(v3.detail.moons.relevantMoons.length!==moonSystem.relevantMoons.length)
      throw Error('MISSING_MOON_FICHE');
     for(const [j,moon] of moonSystem.relevantMoons.entries()){
      const q=v3.detail.moons.relevantMoons[j].radiationPRE3308;
      assertWorld(q,'MOON',g);g.moons++;g.moonProjections++;
      if(!probeMoon){const ev=Evidence.moon(moon,planet);
       if(ev.lifeEvaluated!==false||ev.radiation.subsurfaceIonizingDoseGrayPerYear.state==='MODELLED_CT0'&&
         q.subsurface.doseGrayPerYear===null)throw Error('PRE33_01_FAKE_MOON_DOSE');
       probeMoon=true;g.evidenceProbes++;}
      lines.push(csvLine(g.galaxy,`S${pos.x}:${pos.y}`,i+1,moon.moonOrdinal,'MOON',
       q.hasSolidSurface,q.atmosphereColumn?.kilogramsPerSquareMeter,
       q.oceanIceColumn?.kilogramsPerSquareMeter,q.gammaOneMeVReferenceDirectTransmission01,
       q.photonSource,q.particleSource,q.surface.doseGrayPerYear,q.subsurface.doseGrayPerYear,
       q.subsurface.status,q.biologyEvaluated));
     }
     const v2=Resolver.projectGenerated(ident,planet,atmosphere,moonSystem,undefined,undefined,2);
     if(v2.detail.radiationPRE3308!==null)throw Error('V2_PLANET_RADIATION_LEAK');g.v2PlanetsIsolated++;
     for(const m of v2.detail.moons.relevantMoons){
      if(m.radiationPRE3308!==null)throw Error('V2_MOON_RADIATION_LEAK');g.v2MoonsIsolated++;}
    }
   }catch(e){g.errors.push({sector:`${pos.x},${pos.y}`,error:String(e?.stack??e)});}
  }
  if(g.systems!==o.systems||g.planets!==g.planetProjections||g.moons!==g.moonProjections||
     g.planets!==g.v2PlanetsIsolated||g.moons!==g.v2MoonsIsolated)
   g.errors.push({sector:'SUMMARY',error:'INCOMPLETE_AUDIT'});
  console.log(`${g.galaxy}: ${g.systems} sistemas, ${g.planets} planetas, ${g.moons} lunas, ${g.errors.length} incidencias`);
  galaxies.push(g);
 }
 const r=write(o.out,galaxies,lines);
 if(o.strict&&r.totals.errors)process.exitCode=1;
 return r;
}
if(require.main===module)main();
module.exports={main,assertWorld};
