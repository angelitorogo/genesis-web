#!/usr/bin/env node
'use strict';
/** PRE-33.11 read-only, reproducible diversity audit. Not a census or prevalence estimate. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const {makeCandidates,identity,accumulate}=require('./pre33/pre33-audit-core.cjs');
const {parse}=require('./auditar-genesis-pre33-03a2a.cjs');
const OUTPUT='PRE33_11_V3_DIVERSITY_AUDITED';
const TYPES=['ROCKY','SUPER_EARTH','DESERT','OCEAN','ICE','VOLCANIC','MINI_NEPTUNE','GAS_GIANT','ICE_GIANT'];
const PHENOTYPE_NOTE='OCEAN/DESERT/VOLCANIC are formation phenotypes, not proof of ocean, dryness or eruptions. NO life inference.';
const compactLimit=500; // Independent targeted case-finding panel, NEVER folded into demographic counts.
const counted=(x,k)=>x[k]||0;
const encode=(...xs)=>xs.map(x=>JSON.stringify(x??'')).join(',');
const HEAD=['galaxia','sector','sistema','arquitectura','anfitrion','topologia','ordinal','tipo','nicho','lunas','detalladas','soloIdentidad','coherencia','vida'];
function register(){const ts=require('typescript');if(!require.extensions['.ts'])require.extensions['.ts']=(m,f)=>
  m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);}
const load=p=>require(path.resolve('src/app',p));
function aggregate(galaxies,rows,out,seed){
 const total={systems:0,planets:0,moons:0,detailedMoons:0,identityOnlyMoons:0,
   compactProbes:0,compactHostSystems:0,compactPlanetarySystems:0,compactPlanets:0,errors:0};
 const byType=Object.fromEntries(TYPES.map(x=>[x,0])),byArchitecture={},byTopology={},byNiche={},byStratum={},
   byCompactHostType={},byMoonWaterRegime={},byMoonGeologyRegime={},byMoonOceanCT0={},byMoonHostFamily={},
   oceanGate={withinHZ:0,solidIcyFormation:0,simultaneouslyAdmissible:0},missing=[];
 for(const g of galaxies){
   for(const k of Object.keys(total))total[k]+=(k==='errors'?g.errors.length:g[k]);
   for(const gate of Object.keys(oceanGate))oceanGate[gate]+=(g.oceanGate[gate]||0);
   for(const [category,dest] of [['byType',byType],['byArchitecture',byArchitecture],
      ['byTopology',byTopology],['byNiche',byNiche],['byStratum',byStratum],
      ['byCompactHostType',byCompactHostType],['byMoonWaterRegime',byMoonWaterRegime],
      ['byMoonGeologyRegime',byMoonGeologyRegime],['byMoonOceanCT0',byMoonOceanCT0],
      ['byMoonHostFamily',byMoonHostFamily]])
     for(const [k,v] of Object.entries(g[category]))dest[k]=(dest[k]||0)+v;
 }
 for(const t of TYPES)if(byType[t]===0)missing.push('NO_SAMPLED_'+t);
 for(const k of ['SINGLE','BINARY','TRIPLE'])if(!counted(byArchitecture,k))missing.push('NO_SAMPLED_'+k);
 if(!counted(byTopology,'CIRCUMBINARY'))missing.push('NO_SAMPLED_P_TYPE');
 if(total.compactPlanets===0)missing.push('NO_TARGETED_COMPACT_PLANET');
 const ordinaryGiant=counted(byType,'GAS_GIANT'),iceGiant=counted(byType,'ICE_GIANT');
 const ratios={gasGiantAmongStandardPlanets:total.planets?ordinaryGiant/total.planets:null,
   allGiantsAmongStandardPlanets:total.planets?(ordinaryGiant+iceGiant)/total.planets:null};
 const result={contract:'PRE-33.11/V3-STRATIFIED-DIVERSITY/v1',seed,
  selection:'20 systems per galaxy by deterministic sector-rings (nonprobabilistic); separate rare compact-host probe of at most 500 locators per galaxy',
  totals:total,byType,byArchitecture,byTopology,byNiche,byStratum,byCompactHostType,byMoonWaterRegime,byMoonGeologyRegime,byMoonOceanCT0,
  byMoonHostFamily,oceanGate,ratios,missingStrata:missing,galaxies,
  scientificLimits:[PHENOTYPE_NOTE,'A missing sampled class is not an error and cannot justify quota changes.',
   'The compact-host probe is conditional ascertainment, not representative prevalence; do not merge with the 60-system denominator.',
   'S/P orbital geometry and Roche/Hill screening do not establish long-term N-body stability.',
   'No planet/moon in this audit receives a habitability or life verdict; identity-only moons stay NOT_EVALUATED.',
   'Count ratios are descriptive ONLY; sector/system clustering and deterministic selection prevent population-level confidence inference.'],
  verdict:total.errors?'PRE33_11_BLOCKED':OUTPUT};
 fs.mkdirSync(out,{recursive:true});const body=JSON.stringify(result,null,2)+'\n';
 fs.writeFileSync(path.join(out,'pre33-11-auditoria.json'),body);
 fs.writeFileSync(path.join(out,'pre33-11-por-planeta.csv'),HEAD.join(',')+'\n'+rows.join('\n')+'\n');
 const lines=[`# PRE-33.11 — Diversidad planetaria y lunar V3`,``,result.verdict,``,
 `## Muestra y cobertura`,
 `| Galaxia | Sistemas | Planetas | Lunas | Detalladas | Solo identidad | Candidatos compactos | Planetas compactos | Incidencias |`,
 `|---|---:|---:|---:|---:|---:|---:|---:|---:|`,
 ...galaxies.map(g=>`| ${g.galaxy} | ${g.systems} | ${g.planets} | ${g.moons} | ${g.detailedMoons} | ${g.identityOnlyMoons} | ${g.compactHostSystems} | ${g.compactPlanets} | ${g.errors.length} |`),
 `| **TOTAL** | **${total.systems}** | **${total.planets}** | **${total.moons}** | **${total.detailedMoons}** | **${total.identityOnlyMoons}** | **${total.compactHostSystems}** | **${total.compactPlanets}** | **${total.errors}** |`,
 ``,`## Familias planetarias estándar`,`| Familia | Casos |`,`|---|---:|`,
 ...TYPES.map(t=>`| ${t} | ${byType[t]} |`),
 ``,`GAS_GIANT: ${ordinaryGiant}/${total.planets}; ICE_GIANT: ${iceGiant}/${total.planets}. **No ajustar cuotas** sin analizar formación y sesgo de selección.`,
 ``,`## Restricciones para el fenotipo OCEAN`,
 `El clasificador 19.4 exige planeta dominado por sólidos, con fracción heredada de hielo ≥ 0,35, íntegramente dentro de la zona radiativa y contexto térmico no meramente de referencia. Dentro HZ: ${oceanGate.withinHZ}; formación sólida/helada: ${oceanGate.solidIcyFormation}; cumplen simultáneamente: ${oceanGate.simultaneouslyAdmissible}. Los tipos gigantes/minineptunos y condiciones precedentes tienen prioridad. Esto NO indica océano líquido CT-0.`,
 ``,`## Diversidad lunar`,
 `Agua 21.5 (índices): ${JSON.stringify(byMoonWaterRegime)}. Geología 21.5 (índices): ${JSON.stringify(byMoonGeologyRegime)}. Océanos CT-0 simulados 32.F.2c: ${JSON.stringify(byMoonOceanCT0)}. Lunas por familia anfitriona (incluye solo identidad): ${JSON.stringify(byMoonHostFamily)}.`,
 ``,`Los diagnósticos 21.5 son índices heredados, no pruebas de agua o erupciones reales; CT-0 32.F.2c corresponde a modelo simulado, no observación.`,
 ``,`## Arquitecturas y nichos`, `Arquitecturas: ${JSON.stringify(byArchitecture)}. Topologías: ${JSON.stringify(byTopology)}. Nichos: ${JSON.stringify(byNiche)}.`,
 ``,`## Panel independiente: anfitriones compactos`,
 `${total.compactProbes} locators V3 examinados; ${total.compactHostSystems} anfitriones detectados; ${total.compactPlanetarySystems} con planetas; ${total.compactPlanets} planetas. Tipos: ${JSON.stringify(byCompactHostType)}.`,
 ``,`**Nunca sumar estos planetas a la demografía estándar.**`,
 ``,`## Estratos no encontrados en esta selección`,
 missing.length?missing.map(s=>'- '+s).join('\n'):'Ninguno dentro de las categorías solicitadas.',
 ``,`## Límites y aceptación`,...result.scientificLimits.map(s=>'- '+s),
 ``,`El catálogo PRE-33.10 conserva la identidad y el acceso diferido de TODAS las lunas de un sistema confirmado; PRE-33.11 no cambia generación, mundos observados, historial o persistencia.`,
 ``,`Resultado: **${result.verdict}**. La puerta de vida efectiva sigue siendo PRE-33.13; PRE-33.12 requiere auditoría integral de rutas/caché y rendimiento.`];
 fs.writeFileSync(path.join(out,'pre33-11-informe.md'),lines.join('\n')+'\n');
 const sha=crypto.createHash('sha256').update(body).digest('hex');console.log(`${result.verdict} SHA256 ${sha}`);
 return result;
}
function main(argv=process.argv.slice(2)){
 const args=parse(argv);let all=[],rows=[];
 if(args.galaxies.length>1){
   for(const gi of args.galaxies){const subdir=path.join(args.out,'.diversity-g'+gi);
    const child=cp.spawnSync(process.execPath,[__filename,'--seed='+args.seed,'--galaxies='+gi,
      '--systems-per-galaxy='+args.systems,'--out='+subdir,...args.strict?['--strict']:[]],
      {cwd:process.cwd(),encoding:'utf8',maxBuffer:32*1024*1024});
    if(child.stdout)process.stdout.write(child.stdout);if(child.stderr)process.stderr.write(child.stderr);
    if(child.status!==0 || child.error)throw Error(`PRE33_11_GALAXY_FAILED ${gi} ${child.error||child.status}`);
    const single=JSON.parse(fs.readFileSync(path.join(subdir,'pre33-11-auditoria.json'),'utf8'));
    all.push(...single.galaxies);
    rows.push(...fs.readFileSync(path.join(subdir,'pre33-11-por-planeta.csv'),'utf8').trim().split('\n').slice(1));
   }
   return aggregate(all,rows,args.out,args.seed);
 }
 register();
 const {UniverseSeed}=load('domain/universe/universe-seed');
 const {UniverseGenerationKey}=load('domain/generation/universe-generation-key');
 const {GeneratorVersion}=load('domain/generation/generator-version');
 const {GalaxyGenerator}=load('simulation/universe/galaxy-generator');
 const {GalaxySectorGridGenerator}=load('simulation/sector/galaxy-sector-grid-generator');
 const {GalaxySectorContentGenerator}=load('simulation/sector/galaxy-sector-content-generator');
 const {GalaxySectorCoordinates}=load('domain/sector/galaxy-sector-coordinates');
 const {StellarMultihostFormation}=load('simulation/stellar/stellar-multihost-formation');
 const {CompactHostPlanetarySystemGenerator}=load('simulation/planetary/compact-host-planetary-system-generator');
 const {PlanetaryDiversityCoveragePRE3311:Coverage}=load('simulation/planetary/planetary-diversity-coverage-pre33-11');
 const key=new UniverseGenerationKey(UniverseSeed.parse(args.seed),GeneratorVersion.V3);
 for(const gi of args.galaxies){
  const galaxy=GalaxyGenerator.generate(key,BigInt(gi));
  const grid=GalaxySectorGridGenerator.generate(galaxy);
  const positions=makeCandidates(args.seed,gi,grid.halfExtentInSectors,Math.max(1500,args.systems*100));
  const g={galaxy:galaxy.designation.name,galaxyIndex:gi,systems:0,planets:0,moons:0,detailedMoons:0,
    identityOnlyMoons:0,compactProbes:0,compactHostSystems:0,compactPlanetarySystems:0,compactPlanets:0,
    byType:{},byArchitecture:{},byTopology:{},byNiche:{},byStratum:{},byCompactHostType:{},byMoonWaterRegime:{},byMoonGeologyRegime:{},
    byMoonOceanCT0:{},byMoonHostFamily:{},oceanGate:{withinHZ:0,solidIcyFormation:0,simultaneouslyAdmissible:0},errors:[]};
  // Exact same first-N-system procedure as PRE-33.10; compact targets are counted separately.
  for(const pos of positions){if(g.systems>=args.systems)break;
    const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(pos.x,pos.y));
    if(!sector.systemLocators.length)continue;
    const loc=sector.systemLocators[parseInt(identity([String(gi),pos.x,pos.y,'SYSTEM_INDEX']).slice(0,8),16)%sector.systemLocators.length];
    try{
      const multi=StellarMultihostFormation.generateOrNull(key,loc);
      const single=multi?null:StellarMultihostFormation.generateSingleOrNull(key,loc);
      if(!multi&&!single)throw Error('MISSING_SYSTEM');
      const arch=multi?multi.multiplicity.name:'SINGLE';
      accumulate(g.byArchitecture,arch);
      const worlds=multi?multi.publicPlanets.map(w=>({planet:w.planet,moonSystem:w.moonSystem,host:w.host})):
        single.planets.map((planet,i)=>({planet,moonSystem:single.moonSystems[i],host:'A'}));
      for(const w of worlds){
        if(!w.moonSystem)throw Error('NO_MOON_SYSTEM');
        const r=Coverage.standard(w.planet,w.moonSystem,arch,w.host);
        if(r.issues.length)throw Error(`PRE33_11_${r.issues.join('+')}: ${w.planet.name}`);
        g.planets++;g.moons+=r.moonCount;g.detailedMoons+=r.detailedMoonCount;g.identityOnlyMoons+=r.identityOnlyMoonCount;
        accumulate(g.byType,r.family);accumulate(g.byTopology,r.topology);
        accumulate(g.byNiche,r.niche);accumulate(g.byStratum,`${r.architecture}/${r.host}/${r.family}`);
        accumulate(g.byMoonHostFamily,r.family,r.moonCount);
        const cl=w.planet.typeClassification;
        const withinHZ=cl.radiativeHabitableZoneRelation==='WHOLLY_WITHIN_ZONE' &&
          cl.stellarEvolutionRegime!=='REFERENCE_ONLY';
        const solidIcy=cl.sourceEnvelopeMassFraction01<.03 &&
          cl.sourceIceBearingSolidFraction01>=.35;
        if(withinHZ)g.oceanGate.withinHZ++;
        if(solidIcy)g.oceanGate.solidIcyFormation++;
        if(withinHZ&&solidIcy)g.oceanGate.simultaneouslyAdmissible++;
        for(const moon of w.moonSystem.relevantMoons){
          accumulate(g.byMoonWaterRegime,moon.environmentState.waterRegime);
          accumulate(g.byMoonGeologyRegime,moon.environmentState.geologyRegime);
          accumulate(g.byMoonOceanCT0,moon.oceanReality32F2c?.state??'NO_CT0_OCEAN_SOURCE');
        }
        rows.push(encode(g.galaxy,`${pos.x}:${pos.y}`,String(loc.galacticObjectIndex),r.architecture,
          r.host,r.topology,r.ordinal,r.family,r.niche,r.moonCount,r.detailedMoonCount,r.identityOnlyMoonCount,
          r.physicallyCoherent,r.biology));
      }
      if(multi){
        const p=worlds.filter(x=>x.host==='AB');
        // Existing S/P public mapping must never be confused with private A/B/C orbital slots.
        if(p.some(x=>x.planet.orbitTopology!=='CIRCUMBINARY'))throw Error('P_TYPE_TOPOLOGY');
        if(multi.circumbinary.status==='NO_STABLE_REGION'&&p.length)throw Error('P_TYPE_INSIDE_NO_STABLE_REGION');
        const inner=multi.circumbinary.stableInnerAu, outer=multi.circumbinary.stableOuterAu;
        if(p.length && (!(inner>0) || !(outer>inner)))throw Error('P_TYPE_STABLE_INTERVAL_MISSING');
        for(const w of p){
          const peri=w.planet.orbit.periastronAu,apo=w.planet.orbit.apoastronAu;
          // Both boundaries are conditional geometric/stability screens, NOT an N-body proof.
          if(peri<inner-1e-9*Math.max(1,inner) || apo>outer+1e-9*Math.max(1,outer))
            throw Error('P_TYPE_OUTSIDE_SCREENED_INTERVAL');
        }
      }
      g.systems++;
    }catch(e){g.errors.push({sector:`${pos.x}:${pos.y}`,code:String(e?.stack||e)});}
  }
  if(g.systems!==args.systems)g.errors.push({sector:'COVERAGE',code:'INCOMPLETE_STANDARD_SAMPLE'});
  // Rare-population probe: independent deterministic search on real V3 SINGLE locators.
  // NEVER mix these cases with the 60-system demographic denominator.
  for(const pos of positions){if(g.compactProbes>=compactLimit)break;
    const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(pos.x,pos.y));
    if(!sector.systemLocators.length)continue;
    const loc=sector.systemLocators[parseInt(identity([String(gi),pos.x,pos.y,'COMPACT_PANEL']).slice(0,8),16)%sector.systemLocators.length];
    g.compactProbes++;
    try{
      const compact=CompactHostPlanetarySystemGenerator.generateOrNull(key,loc);
      if(!compact)continue;
      g.compactHostSystems++;accumulate(g.byCompactHostType,compact.host.type);
      if(compact.planets.length)g.compactPlanetarySystems++;
      const r=Coverage.compact(compact);g.compactPlanets+=r.length;
      for(const item of r)if(item.issues.length)throw Error('COMPACT_'+item.issues.join('+'));
      // Intrinsic compact products are NEVER reinterpreted as normal PlanetType or classic stellar HZ.
      if(compact.planets.length!==compact.environments.length||
          compact.planets.length!==compact.characterizations.length)throw Error('COMPACT_CHARACTERIZATION_MISMATCH');
    }catch(e){g.errors.push({sector:`${pos.x}:${pos.y}`,code:'COMPACT_PANEL '+String(e?.stack||e)});}
  }
  console.log(`${g.galaxy}: ${g.systems} sistemas, ${g.planets} planetas, ${g.moons} lunas; compactos ${g.compactHostSystems}/${g.compactProbes} con ${g.compactPlanets} planetas; ${g.errors.length} incidencias`);
  all.push(g);
 }
 const res=aggregate(all,rows,args.out,args.seed);if(args.strict&&res.totals.errors)process.exitCode=1;return res;
}
if(require.main===module)main();module.exports={main,aggregate,TYPES,compactLimit};
