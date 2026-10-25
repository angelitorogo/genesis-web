#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const ROOT=path.resolve(__dirname,'..'),TAG='PRE33_11B_V3_GALACTIC_STATISTICAL_CALIBRATION_AUDITED';
const REGIONS=['CENTRAL','INNER','MIDDLE','OUTER'];
function register(){const ts=require('typescript');if(!require.extensions['.ts'])require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);}
const load=p=>require(path.join(ROOT,'src/app',p));
const hash=o=>crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
function parse(argv){const o={seed:'7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',galaxies:[0,1,2],perRegion:10,out:'pre33-audit',samplingKey:'PRE33_11B_INDEPENDENT_AUDIT_SAMPLER_V1',strict:false};
 for(const arg of argv){if(arg==='--strict'){o.strict=true;continue;}const m=/^--([\w-]+)=(.*)$/.exec(arg);if(!m)throw Error('OPTION_INVALID '+arg);
 switch(m[1]){case 'seed':o.seed=m[2].toUpperCase();break;case 'galaxies':o.galaxies=m[2].split(',').map(Number);break;case 'sectors-per-region':o.perRegion=Number(m[2]);break;
 case 'systems-per-galaxy':if(Number(m[2])%4)throw Error('SYSTEMS_PER_GALAXY_MUST_BE_MULTIPLE_OF_4');o.perRegion=Number(m[2])/4;break;
 case 'out':o.out=m[2];break;case 'audit-sampling-key':o.samplingKey=m[2];break;default:throw Error('OPTION_INVALID '+arg);}}
 if(!/^[0-9A-F]{4}(?:-[0-9A-F]{4}){7}$/.test(o.seed)||!o.galaxies.length||o.galaxies.some(x=>!Number.isSafeInteger(x)||x<0)||new Set(o.galaxies).size!==o.galaxies.length||!Number.isSafeInteger(o.perRegion)||o.perRegion<2||o.perRegion>40||!o.samplingKey)throw Error('INVALID_SAMPLING_OPTIONS');return o;}
function choose(frame,n,key){if(frame.length<n)throw Error('STRATUM_UNDERSAMPLED_FRAME');return frame.map(c=>({c,h:hash([key,c.x,c.y])})).sort((a,b)=>a.h.localeCompare(b.h)).slice(0,n).map(x=>x.c);}
function index(max,key){return max?Math.floor(parseInt(hash(key).slice(0,13),16)/0x10000000000000*max):-1;}
const csv=x=>JSON.stringify(x??'');
function auditOne(gi,opts){
 register();
 const {UniverseSeed}=load('domain/universe/universe-seed'),{UniverseGenerationKey}=load('domain/generation/universe-generation-key');
 const {GeneratorVersion}=load('domain/generation/generator-version'),{GalaxyGenerator}=load('simulation/universe/galaxy-generator');
 const {GalaxySectorGridGenerator}=load('simulation/sector/galaxy-sector-grid-generator');
 const {GalaxySectorContentGenerator}=load('simulation/sector/galaxy-sector-content-generator');
 const {GalaxySectorCoordinates}=load('domain/sector/galaxy-sector-coordinates');
 const {StellarMultihostFormation}=load('simulation/stellar/stellar-multihost-formation');
 const {GalacticEnvironmentDistributionPRE3311a:Env}=load('simulation/planetary/galactic-environment-distribution-pre33-11a');
 const {PlanetH2OV3FormationOrigin:Origin}=load('simulation/planetary/planet-h2o-v3-formation-origin');
 const {PlanetH2OForwardCT0EnginePRE3303A3:Forward}=load('simulation/planetary/planet-h2o-forward-ct0-pre33-03a3');
 const {enumerateGalacticSectorFramePRE3311b:frameFor,calibrateGalaxyOpportunityPRE3311b:calibrate,radialRegionPRE3311b:regionFor}=load('simulation/planetary/galactic-statistical-calibration-pre33-11b');
 const key=new UniverseGenerationKey(UniverseSeed.parse(opts.seed),GeneratorVersion.V3);
 const galaxy=GalaxyGenerator.generate(key,BigInt(gi)),grid=GalaxySectorGridGenerator.generate(galaxy),geometricFrame=frameFor(grid.halfExtentInSectors),sample=[],errors=[];
 // Exact occupied-sector frame: materialize locator lists only (no systems/planets).
 // Sampling exclusively occupied sectors is valid because every biological
 // opportunity belongs to a system. Empty cells have a known zero contribution.
 const frame={CENTRAL:[],INNER:[],MIDDLE:[],OUTER:[]},emptyFrame={};
 for(const region of REGIONS){for(const pos of geometricFrame[region]){
   const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(pos.x,pos.y));
   if(sector.systemLocators.length)frame[region].push(pos);
  }
  emptyFrame[region]=geometricFrame[region].length-frame[region].length;
 }
 for(const region of REGIONS)for(const pos of choose(frame[region],opts.perRegion,[opts.samplingKey,gi,region])){
   const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(pos.x,pos.y));
   const obs={region,sectorX:pos.x,sectorY:pos.y,frameSectors:frame[region].length,selectedSectors:opts.perRegion,locators:sector.systemLocators.length,
    planets:0,detailedMoons:0,identityOnlyMoons:0,moonLiquidH2O:0,moonAbsentH2O:0,moonUnknownH2O:0,planetLiquidH2O:0,
    families:{},architecture:'NO_SYSTEM',evidence:'SIMULATED_CT0_ONLY_NOT_BIOLOGY'};
   if(sector.stellarDensity.region.name!==region||regionFor(pos.x,pos.y,grid.halfExtentInSectors)!==region)errors.push({region,sector:`${pos.x}:${pos.y}`,message:'RADIAL_STRATUM_V1_DISAGREEMENT'});
   if(obs.locators){try{
    const loc=sector.systemLocators[index(obs.locators,[opts.samplingKey,gi,region,pos.x,pos.y,'LOCATOR'])];
    const multi=StellarMultihostFormation.generateOrNull(key,loc),single=multi?null:StellarMultihostFormation.generateSingleOrNull(key,loc);
    if(!multi&&!single)throw Error('LOCATOR_NO_SYSTEM');obs.architecture=multi?multi.multiplicity.name:'SINGLE';
    const env=Env.sector(galaxy,sector),worlds=multi?multi.publicPlanets.map(w=>({planet:w.planet,moonSystem:w.moonSystem,atmosphere:w.atmosphere,host:w.host})):
     single.planets.map((planet,i)=>({planet,moonSystem:single.moonSystems[i],atmosphere:single.atmospheres[i],host:'A'}));
    for(const w of worlds){
     if(!w.atmosphere||!Origin.sourceForPlanet(w.planet))throw Error('PLANET_SOURCE_MISSING');
     const water=Forward.project(w.planet,w.atmosphere,Origin.environmentForPlanet(w.planet,w.atmosphere));
     const p=Env.planet(w.planet,w.moonSystem,env,obs.architecture,w.host,water);
     if(p.issues.length||p.biosphere!=='NOT_EVALUATED')throw Error('PLANET_CAUSAL_OR_BIOLOGY_ERROR:'+p.issues.join(','));
     obs.planets++;obs.families[p.family]=(obs.families[p.family]??0)+1;
     if(p.routes[0].phase==='CT0_LIQUID_IN_SIMULATED_MODEL')obs.planetLiquidH2O++;
     obs.detailedMoons+=w.moonSystem.relevantMoonCount;obs.identityOnlyMoons+=w.moonSystem.unmaterializedMinorMoonCount;
     for(const moon of w.moonSystem.relevantMoons){const m=Env.moon(moon,env);
      if(m.issues.length||m.biosphere!=='NOT_EVALUATED')throw Error('MOON_CAUSAL_OR_BIOLOGY_ERROR');
      switch(m.routes[0].phase){case 'CT0_LIQUID_IN_SIMULATED_MODEL':obs.moonLiquidH2O++;break;
      case 'CT0_LIQUID_ABSENT_IN_SIMULATED_MODEL':obs.moonAbsentH2O++;break;default:obs.moonUnknownH2O++;break;}}
    }
   }catch(e){errors.push({region,sector:`${pos.x}:${pos.y}`,message:String(e?.stack||e)});}}
   sample.push(obs);
 }
 return {galaxy:galaxy.designation.name,galaxyIndex:gi,gridHalfExtent:grid.halfExtentInSectors,emptyFrame,observations:sample,calibration:calibrate(sample),errors};
}
function report(galaxies,opts){
 const output={contract:'PRE-33.11b/V3-GALACTIC-STATISTICAL-CALIBRATION/v1',universeSeed:opts.seed,samplingKey:opts.samplingKey,
 sectorsPerRegion:opts.perRegion,universeGenerator:'V3',evidencePolicy:'GROUND_TRUTH_SIMULATED_ONLY_NEVER_OBSERVED',
 galaxies:galaxies.map(g=>({galaxy:g.galaxy,galaxyIndex:g.galaxyIndex,gridHalfExtent:g.gridHalfExtent,emptySectorCellsByRegion:g.emptyFrame,calibration:g.calibration,issues:g.errors})),
 PRE3311aComparison:'Its 60 systems are a nonprobabilistic ring/quadrant coverage sample, not a galaxy population census or confidence interval.',
 life:'NOT_EVALUATED',verdict:galaxies.some(g=>g.errors.length||g.calibration.status!=='CALIBRATED_MODEL_OPPORTUNITY_INDICATORS')?'PRE33_11B_REVIEW_REQUIRED':TAG};
 fs.mkdirSync(opts.out,{recursive:true});const body=JSON.stringify(output,null,2)+'\n';fs.writeFileSync(path.join(opts.out,'pre33-11b-auditoria.json'),body);
 const header=['galaxia','region','sectorX','sectorY','frameSectors','selectedSectors','systemLocators','planetasSistema','lunasDetalladas','lunasSoloIdentidad','lunasH2OCT0','lunasH2OAusentes','lunasH2ODesconocidas','arquitectura','estadoBiologico'];
 const rows=galaxies.flatMap(g=>g.observations.map(o=>[g.galaxy,o.region,o.sectorX,o.sectorY,o.frameSectors,o.selectedSectors,o.locators,o.planets,o.detailedMoons,o.identityOnlyMoons,o.moonLiquidH2O,o.moonAbsentH2O,o.moonUnknownH2O,o.architecture,'NOT_EVALUATED'].map(csv).join(',')));
 const data=header.join(',')+'\n'+rows.join('\n')+'\n';fs.writeFileSync(path.join(opts.out,'pre33-11b-sectores.csv'),data);
 const pct=x=>x===null?'No estimable':(100*x).toFixed(3)+' %';
 const lines=['# GENESIS Web — PRE-33.11b · Calibración estadística de oportunidades ambientales galácticas','',
 `Veredicto: **${output.verdict}** · SHA-256 JSON: \`${crypto.createHash('sha256').update(body).digest('hex')}\` · SHA-256 CSV: \`${crypto.createHash('sha256').update(data).digest('hex')}\``,'',
 '## Diseño probabilístico',`Universo V3: ${opts.seed}; clave INDEPENDIENTE del muestreo: ${opts.samplingKey}.`,
 `Sectores por región: ${opts.perRegion}. Primera etapa: censo exacto del marco de sectores OCUPADOS mediante localizadores V3 (no cuerpos); SRS sin reemplazo de sectores ocupados; segunda: un localizador uniforme por sector seleccionado. Las celdas vacías son ceros de contribución conocidos y no consumen muestra.`,
 'Las probabilidades de inclusión conocidas son n_h/N_h por sector ocupado y 1/M_s por localizador. La expansión usa N_h/n_h × M_s. El marco se obtiene de todos los sectores del disco geométrico V3, filtrando ocupación física procedimental exacta; no es un censo astronómico observado.',
 '', '## Resultados por galaxia',
 '| Galaxia | Sectores | Sin sistemas | Planetas estimados | Lunas estimadas | Fracción H₂O CT-0 entre detalladas | Intervalo exploratorio 95 % | Fracción mínima sobre todas |',
 '|---|---:|---:|---:|---:|---|---|---|',
 ...galaxies.map(g=>{const c=g.calibration,b=c.amongDetailedMoons.interval95Approx;
 return `| ${g.galaxy} | ${c.sectorsSampled} | ${c.emptySectors} | ${Math.round(c.expanded.planets??0).toLocaleString('es-ES')} | ${Math.round((c.expanded.detailedMoons??0)+(c.expanded.identityOnlyMoons??0)).toLocaleString('es-ES')} | ${pct(c.amongDetailedMoons.point)} | ${b?pct(b[0])+'–'+pct(b[1]):'No estimable'} | ${pct(c.amongAllMoonsLowerBound.point)} |`; }),
 '', '## Estratificación radial de oportunidades modeladas',
 '| Galaxia | Región | Sectores ocupados | Muestra | Planetas estimados | Lunas detalladas estimadas | H₂O CT-0 estimada | Tasa H₂O CT-0 en detalladas |',
 '|---|---|---:|---:|---:|---:|---:|---|',
 ...galaxies.flatMap(g=>REGIONS.map(r=>{const c=g.calibration.regionalOpportunities[r];return `| ${g.galaxy} | ${r} | ${c.occupiedSectorCells} | ${c.sampledSectorCells} | ${Math.round(c.expandedPlanets).toLocaleString('es-ES')} | ${Math.round(c.expandedDetailedMoons).toLocaleString('es-ES')} | ${Math.round(c.expandedLiquidH2O).toLocaleString('es-ES')} | ${pct(c.modeledAqueousAmongDetailed)} |`;})),
 '', 'Las tasas regionales son descripciones ponderadas de los estratos seleccionados, no probabilidades de vida ni índices de habitabilidad certificados.',
 '', 'Los totales son EXPANSIONES estadísticas del universo V3 generado, no conteos reales. Los intervalos normales son aproximaciones exploratorias: los estratos pequeños y los eventos raros pueden carecer de cobertura adecuada. Cero en una muestra NO significa ausencia galáctica.','',
 '## Distribución modelada de familias planetarias (totales expandidos)',
 '| Familia | Elixisis | Elisoune | Ilyzenia |', '|---|---:|---:|---:|',
 ...['ROCKY','SUPER_EARTH','DESERT','OCEAN','ICE','VOLCANIC','MINI_NEPTUNE','GAS_GIANT','ICE_GIANT'].map(f=>
   `| ${f} | ${galaxies.map(g=>Math.round(g.calibration.families[f]??0).toLocaleString('es-ES')).join(' | ')} |`),
 '', 'Una familia no observada puede existir con frecuencia baja; sus ceros NO son ausencia física demostrada. Estas cifras estimadas no son cuotas para el generador.',
 '',
 '## Envolvente de estados no resueltos (NO intervalo probabilístico)',
 ...galaxies.map(g=>{const p=g.calibration.potentialAllMoonEnvelope;return `- ${g.galaxy}: mínimo H₂O CT-0 ${p?pct(p[0]):'no estimable'}; máximo lógico ${p?pct(p[1]):'no estimable'} si todos los estados desconocidos fueran positivos. No se interpreta como probabilidad de vida.`;}),
 '', '## Separación física y biológica',
 '- Oportunidad medible: H₂O líquida lunar CT-0 modelada, nunca bioquímica demostrada.',
 '- La fase de NH₃ y CH₄ no está resuelta; no se pueden producir frecuencias biológicas con ellas.',
 '- Lunas solo identidad y episodios desconocidos conservan estado UNKNOWN, no 0 ni falso positivo.',
 '- Falta bioenergética certificada, dosimetría y continuidad histórica; ninguna vida se genera ni se descarta.',
 '- El panel de anfitriones compactos poco frecuentes no está representado adecuadamente por el tamaño actual de muestra: reportar como limitación, sin incluirlo como cuota.',
 '- La muestra PRE-33.11a no tiene diseño probabilístico y sus 43 lunas CT-0 siguen siendo descriptivas; no reemplazarla por una cifra de frecuencia inferida.',
 '- La varianza utiliza sectores completos como unidades primarias y mantiene variación adicional de muestreo de un sistema por sector, de forma conservadora.',
 '- No se modifica el generador, su RNG, ninguna semilla, identidad V1/V2, persistencia ni conocimiento del jugador.',
 '', '## Próximo bloque','PRE-33.11c: diversidad, frecuencia y detectabilidad de vida; vida efectiva bloqueada hasta PRE-33.13.'];
 fs.writeFileSync(path.join(opts.out,'pre33-11b-informe.md'),lines.join('\n')+'\n');
 console.log(output.verdict,crypto.createHash('sha256').update(body).digest('hex'));return output;
}
function main(argv=process.argv.slice(2)){
 const opts=parse(argv);
 if(opts.galaxies.length>1){const galaxies=[];
  for(const gi of opts.galaxies){const dir=path.join(opts.out,'.galaxy-'+gi);
   const r=cp.spawnSync(process.execPath,[__filename,'--seed='+opts.seed,'--galaxies='+gi,'--sectors-per-region='+opts.perRegion,'--audit-sampling-key='+opts.samplingKey,'--out='+dir,...(opts.strict?['--strict']:[])],
    {cwd:ROOT,encoding:'utf8',maxBuffer:20*1024*1024});
   if(r.stdout)process.stdout.write(r.stdout);if(r.stderr)process.stderr.write(r.stderr);
   if(r.status!==0||r.error)throw Error('GALAXY_SUBPROCESS_FAILED '+gi+' '+r.error+' '+r.status);
   const raw=JSON.parse(fs.readFileSync(path.join(dir,'pre33-11b-auditoria.json'),'utf8'));
   const lines=fs.readFileSync(path.join(dir,'pre33-11b-sectores.csv'),'utf8').trim().split('\n').slice(1);
   galaxies.push({galaxy:raw.galaxies[0].galaxy,galaxyIndex:gi,gridHalfExtent:raw.galaxies[0].gridHalfExtent,emptyFrame:raw.galaxies[0].emptySectorCellsByRegion,
    calibration:raw.galaxies[0].calibration,errors:raw.galaxies[0].issues,observations:lines.map(line=>{const q=line.split(',').map(JSON.parse);
      return {region:q[1],sectorX:q[2],sectorY:q[3],frameSectors:q[4],selectedSectors:q[5],locators:q[6],planets:q[7],detailedMoons:q[8],identityOnlyMoons:q[9],moonLiquidH2O:q[10],moonAbsentH2O:q[11],moonUnknownH2O:q[12],architecture:q[13]};})});
  }
  const out=report(galaxies,opts);if(opts.strict&&out.verdict!==TAG)process.exitCode=1;return out;
 }
 const g=auditOne(opts.galaxies[0],opts),out=report([g],opts);
 if(opts.strict&&out.verdict!==TAG)process.exitCode=1;return out;
}
if(require.main===module)main();module.exports={main,parse,choose,index,report,TAG};
