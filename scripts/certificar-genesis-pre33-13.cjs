#!/usr/bin/env node
'use strict';
/**
 * PRE-33.13: G2 final independent certification. Read-only w.r.t. GENESIS.
 * Does NOT grant life, write saves, edit factories or set a biology feature flag.
 * It fails closed on missing HEAD, historic identities or live test evidence.
 * No third-party runtime dependency for the certificate or dossier.
 */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
const SEED='7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5';
const CONTRACT='PRE-33.13/G2-CERTIFICATION/v1';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const exists=p=>fs.existsSync(p);
const absolute=p=>path.resolve(ROOT,p);
const rel=p=>path.relative(ROOT,p).replaceAll('\\','/');
const relevant=[
  'src/app/domain/planetary/environmental-physical-contract-pre33-01.ts',
  'src/app/simulation/planetary/geochemistry-reaction-engine-pre33-07.ts',
  'src/app/simulation/planetary/radiation-transport-engine-pre33-08.ts',
  'src/app/simulation/planetary-history/environmental-continuity-engine-pre33-09.ts',
  'src/app/simulation/planetary/minor-moon-on-demand-pre33-10.ts',
  'src/app/simulation/planetary/galactic-life-readiness-pre33-11c.ts',
  'src/app/presentation/scientific/scientific-integration-regression-pre33-12.ts',
  'src/app/simulation/habitability/habitability-moon-integration-32-f-6b.ts',
  'src/app/simulation/stellar/stellar-multihost-scientific-target-resolver.ts',
  'scripts/auditar-genesis-pre33-12.cjs',
  'src/app/domain/biology/pre33-13-certification-gate.ts',
  'scripts/certificar-genesis-pre33-13.cjs',
];
const quote=x=>String(x).replace(/[\n\r]/g,' ');
function args(argv){const o={seed:SEED,galaxies:[0,1,2],systems:20,historicalSystems:45,out:'pre33-audit',historic45:null,runLive:false,runQuality:false,runScience:false,strict:false,quick:false};
 for(const a of argv){if(['--run-live','--run-quality','--run-science','--strict','--quick','--help'].includes(a)){if(a==='--help')o.help=true;else o[a.slice(2).replace(/-([a-z])/g,(_,b)=>b.toUpperCase())]=true;continue;}
 const m=/^--([a-z-]+)=(.*)$/.exec(a);if(!m)throw Error('Opción desconocida '+a);
 const [,k,v]=m;
 if(k==='seed')o.seed=v.toUpperCase();else if(k==='galaxies')o.galaxies=[...new Set(v.split(',').map(Number))];
 else if(k==='systems-per-galaxy')o.systems=Number(v);else if(k==='historical-systems')o.historicalSystems=Number(v);
 else if(k==='historical-fixtures')o.historic45=v;else if(k==='out')o.out=v;else throw Error('Opción desconocida '+a);
 }
 if(!/^[0-9A-F]{4}(?:-[0-9A-F]{4}){7}$/.test(o.seed))throw Error('Semilla inválida');
 if(!o.galaxies.length||o.galaxies.some(v=>!Number.isSafeInteger(v)||v<0||v>100))throw Error('Galaxias inválidas');
 if(!Number.isSafeInteger(o.systems)||o.systems<1||o.systems>80||!Number.isSafeInteger(o.historicalSystems)||o.historicalSystems<1||o.historicalSystems>80)throw Error('Tamaño de muestra inválido');
 return o;
}
function git(args){const p=cp.spawnSync('git',args,{cwd:ROOT,encoding:'utf8',timeout:15000});return p.status===0?p.stdout.trim():null;}
function sourceIdentity(){
 const files=relevant.map(p=>({path:p,sha256:exists(absolute(p))?sha(fs.readFileSync(absolute(p))):null}));
 const missing=files.filter(x=>!x.sha256).map(x=>x.path);
 const commit=git(['rev-parse','HEAD']);const dirty=git(['status','--porcelain','--untracked-files=no']);
 // HEAD captures the actual checkout; dirty is reported rather than hidden.
 return {gitCommit:commit,trackedWorkingTreeClean:dirty==='',sourceTreeSha256:sha(JSON.stringify(files)),files,missing,
  provenance:commit===null?'UNVERSIONED_COPY':'GIT_HEAD_WORKTREE',headVerified:!!commit&&dirty===''&&!missing.length};
}
function checksFromReports(report11b,report11c,report12){const issues=[];
 if(!report11b||!report11c||!report12)return ['MISSING_11B_11C_OR_12_REPORT'];
 if(report11b.contract!=='PRE-33.11b/V3-GALACTIC-STATISTICAL-CALIBRATION/v1'||
 report11b.verdict!=='PRE33_11B_V3_GALACTIC_STATISTICAL_CALIBRATION_AUDITED')issues.push('CALIBRATION_UNVERIFIED');
 if(report11c.contract!=='PRE-33.11c/V3-LIFE-READINESS-NON-GENERATING/v1'||
 report11c.verdict!=='PRE33_11C_V3_LIFE_READINESS_AUDITED'||report11c.galaxies?.some(g=>g.biosphere!=='NOT_SIMULATED'||g.biosignatures!=='NOT_INFERRED'||g.calibration?.lifeRate!==null))issues.push('LIFE_READINESS_GROUND_TRUTH_LEAK');
 if(report12.contract!=='PRE-33.12/V3-READONLY-INTEGRATION/v1'||report12.verdict!=='PRE33_12_V3_CROSS_LAYER_INTEGRATION_AUDITED'||report12.issues?.length)issues.push('CROSS_LAYER_NOT_CLEAN');
 if(report12.upstream?.state!=='UPSTREAM_HASH_VERIFIED'||report12.upstream?.issues?.length)issues.push('STATISTICAL_PROVENANCE_NOT_VERIFIED');
 const t=report12.totals||{};
 if(t.planets!==t.planetCards||t.detailedMoons!==t.moonCards||t.planets!==t.observedPlanetFiches||t.detailedMoons!==t.observedMoonFiches||t.moons!==t.detailedMoons+t.identityOnlyMoons||t.errors!==0||t.lockedControls<t.planets+t.detailedMoons)issues.push('PLANET_MOON_OR_OBSERVED_INTEGRATION_BROKEN');
 if(report12.life!=='NOT_EVALUATED'||report12.historicalCompleteness!=='NOT_ESTABLISHED_BY_CT0')issues.push('UNSUPPORTED_BIOLOGY_OR_HISTORY');
 return issues;
}
function runNode(script,params,log){const cmd=path.join('scripts',script);const t=process.hrtime.bigint();
 const p=cp.spawnSync(process.execPath,[cmd,...params],{cwd:ROOT,encoding:'utf8',timeout:720000,maxBuffer:16*1024*1024});
 const info={command:`node ${cmd} ${params.join(' ')}`,status:p.status,terminated:p.signal||null,
  seconds:Number(process.hrtime.bigint()-t)/1e9,error:p.error?.message||null,
  outputTail:(p.stdout+'\n'+p.stderr).slice(-2800)};log.push(info);
 console.log(`${script}: ${p.status===0?'OK':'FALLO'} ${info.seconds.toFixed(1)}s`);
 return p.status===0;
}
function runQuality(log){const tasks=[
 ['architecture','npm',['run','test:architecture']],
 ['unit-pre33-13','npx',['ng','test','--watch=false','--include=src/app/domain/biology/pre33-13-certification-gate.spec.ts','--include=src/app/presentation/scientific/scientific-integration-regression-pre33-12.spec.ts']],
 ['worker','npm',['run','test:worker']],
 ['e2e-typecheck','npm',['run','test:e2e:typecheck']],
 ['build','npx',['ng','build']],
 ['e2e','npm',['run','test:e2e']],
 ['v2-regression','node',['--test','scripts/auditar-genesis-pre33-00.spec.cjs']],
 ['v2-generative','node',['scripts/auditar-genesis-pre33-00.cjs',`--seed=${SEED}`,'--galaxies=0','--systems-per-galaxy=20','--out=pre33-audit/pre33-13/v2-orbits','--strict']],
 ];
 for(const [name,tool,argv] of tasks){const start=process.hrtime.bigint();
 const p=cp.spawnSync(tool,argv,{cwd:ROOT,encoding:'utf8',shell:process.platform==='win32',timeout:900000,maxBuffer:8*1024*1024});
 log.push({name,command:`${tool} ${argv.join(' ')}`,status:p.status,seconds:Number(process.hrtime.bigint()-start)/1e9,error:p.error?.message||null,outputTail:(p.stdout+'\n'+p.stderr).slice(-1000)});
 console.log(`QUALITY ${name}: ${p.status===0?'OK':'FALLO'}`);
 }
 return tasks.every(([name])=>log.some(x=>x.name===name&&x.status===0));
}
function historical(manifestFile,seed){if(!manifestFile)return {status:'MISSING_ORIGINAL_45_IDENTITIES',verified:false,count:0,issues:['HISTORIC_45_FIXTURE_IDENTITIES_NOT_PROVIDED']};
 let d;try{d=read(absolute(manifestFile));}catch(e){return {status:'INVALID_MANIFEST',verified:false,issues:[e.message]};}
 const imported=d.galaxies?.find(g=>g.galaxyIndex===0);
 const rows=d.systems??imported?.sample?.systemsDetails?.map(s=>({x:s.sector?.x,y:s.sector?.y,name:s.system,planets:s.planets,moons:s.planetDetails?.reduce((n,p)=>n+(p.moons||0),0)}))??[];
 if(!d.systems&&imported){d.systems=rows;d.seed=d.universeSeed;d.galaxyIndex=0;d.generatorVersion=d.generatorVersion||'V2';}
 const issues=[];
 if(d.seed!==seed||d.galaxyIndex!==0||!['V2','V3'].includes(d.generatorVersion))issues.push('HISTORIC_SEED_OR_VERSION_MISMATCH');
 if(rows.length!==45)issues.push('HISTORIC_FIXTURE_COUNT_NOT_45');
 const ids=new Set();
 for(const row of rows){if(!Number.isSafeInteger(row.x)||!Number.isSafeInteger(row.y)||typeof row.name!=='string'||!row.name.trim())issues.push('INVALID_HISTORIC_FIXTURE');
  const key=`${row.x},${row.y},${row.name}`;if(ids.has(key))issues.push('DUPLICATE_HISTORIC_FIXTURE');ids.add(key);}
 // This is a provenance validation only. Actual independent fixture replay is required below.
 return {status:issues.length?'INVALID_MANIFEST':'READY_FOR_INDEPENDENT_REPLAY',verified:false,count:rows.length,reference:manifestFile,
 generatorVersion:d.generatorVersion,issues};
}
function replayHistoricFixtures(info,seed){if(info.status!=='READY_FOR_INDEPENDENT_REPLAY')return info;
 // Replay each EXACT historical sector and system using actual V2 or V3 generator.
 const d=read(absolute(info.reference));
 if(!d.systems&&d.galaxies){const g=d.galaxies.find(g=>g.galaxyIndex===0);d.systems=g?.sample?.systemsDetails?.map(s=>({x:s.sector?.x,y:s.sector?.y,name:s.system,planets:s.planets,moons:s.planetDetails?.reduce((n,p)=>n+(p.moons||0),0)}))||[];}
 try{
  const ts=require('typescript'); if(!require.extensions['.ts'])require.extensions['.ts']=(mod,fn)=>mod._compile(ts.transpileModule(fs.readFileSync(fn,'utf8'),{fileName:fn,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,fn);
  const load=p=>require(absolute('src/app/'+p));
  const {UniverseSeed}=load('domain/universe/universe-seed');const {UniverseGenerationKey}=load('domain/generation/universe-generation-key');
  const {GeneratorVersion}=load('domain/generation/generator-version');const {GalaxyGenerator}=load('simulation/universe/galaxy-generator');
  const {GalaxySectorContentGenerator}=load('simulation/sector/galaxy-sector-content-generator');
  const {GalaxySectorCoordinates}=load('domain/sector/galaxy-sector-coordinates');
  const {StellarDesignationGenerator}=load('simulation/stellar/stellar-designation-generator');
  const {StellarMultihostFormation}=load('simulation/stellar/stellar-multihost-formation');
  const {multihostPhysicalSourceKey}=load('simulation/stellar/stellar-multihost-physical-source-key');
  const k=new UniverseGenerationKey(UniverseSeed.parse(seed),GeneratorVersion[d.generatorVersion]);
  const sourceKey=multihostPhysicalSourceKey(k);
  // The original 20/10 V2 audit combines 9 pre-existing frozen-source fixtures
  // and 36 sector-selected public V2 systems. Both are canonical V2 lineages.
  // Resolve by real designation in the actual sector, never by ordinal/fixture position.
  const sources=[{kind:'PUBLIC_V2',galaxy:GalaxyGenerator.generate(k,0n)}];
  if(d.generatorVersion==='V2')sources.push({kind:'FROZEN_PHYSICAL_V2',galaxy:GalaxyGenerator.generate(sourceKey,0n)});
  const issues=[],records=[],lineageCounts=Object.create(null);
  for(const f of d.systems){
   try{
    const matches=[];
    for(const source of sources){
     const sector=GalaxySectorContentGenerator.generate(source.galaxy,new GalaxySectorCoordinates(f.x,f.y));
     const locator=sector.systemLocators.find(l=>StellarDesignationGenerator.generate(sourceKey,l).name===f.name);
     if(locator)matches.push({locator,source:source.kind});
    }
    if(!matches.length){issues.push(`NOT_FOUND:${f.x},${f.y},${f.name}`);continue;}
    // A given physical locator may occur in both sector-population views. That
    // is the SAME system, not two distinct reference bodies.
    const identities=new Set(matches.map(m=>`${m.locator.galaxyIndex}/${m.locator.sectorKey}/${m.locator.galacticObjectIndex}`));
    if(identities.size!==1){issues.push(`AMBIGUOUS_HISTORIC_SOURCE:${f.x},${f.y},${f.name}`);continue;}
    const {locator,source}=matches.find(m=>m.source==='PUBLIC_V2')??matches[0];
    const m=StellarMultihostFormation.generateOrNull(k,locator);
    const s=m?null:(d.generatorVersion==='V2'?StellarMultihostFormation.generateV2SingleOrNull(k,locator):StellarMultihostFormation.generateSingleOrNull(k,locator));
    if(!m&&!s){issues.push('NO_SYSTEM:'+f.name);continue;}
    const worlds=m?.publicPlanets??s.planets.map((p,i)=>({planet:p,moonSystem:s.moonSystems[i]}));
    const counts={name:f.name,x:f.x,y:f.y,source,planets:worlds.length,moons:worlds.reduce((t,w)=>t+(w.moonSystem?.moonCount||0),0)};
    if(f.planets!==undefined&&f.planets!==counts.planets)issues.push('PLANETS_CHANGED:'+f.name);
    if(f.moons!==undefined&&f.moons!==counts.moons)issues.push('MOONS_CHANGED:'+f.name);
    if(f.planets===undefined||f.planets===counts.planets){
     if(f.moons===undefined||f.moons===counts.moons)lineageCounts[source]=(lineageCounts[source]||0)+1;
    }
    records.push(counts);
   }catch(e){issues.push('HISTORICAL_EXCEPTION:'+f.name+':'+e.message);}
  }
  return {...info,status:issues.length?'HISTORIC_REPLAY_MISMATCH':'HISTORIC_45_REPRODUCED',verified:!issues.length,
   systemsChecked:records.length,lineageCounts,physicalFingerprint:sha(JSON.stringify(records)),issues};
 }catch(e){return {...info,status:'HISTORIC_REPLAY_ERROR',verified:false,issues:[String(e.message||e)]};}
}
function findingsFromEvidence(flags,report12){const f=(code,state,source,explanation,permittedUse)=>({code,state,source,explanation,permittedUse});
 const corrected=flags.livePassed&&report12?.totals?.errors===0;
 const fixed=(code,source,reason)=>f(code,corrected?'CORREGIDA_TESTS_OK':'NO_VERIFICADA',source,reason,corrected?'PHYSICAL_EVIDENCE':'DO_NOT_USE');
 return [
  fixed('IDENTIDAD_Y_ORBITA_MULTISISTEMA','PRE33.12 / 32.F.6b','Ordinal público y físico diferenciados en fichas y validador'),
  fixed('OBSERVADO_NO_REVELA_REALIDAD_PRIVADA','31.F.e / PRE33.12','Accesos bloqueados y lecturas observadas comprobados en muestras'),
  fixed('LUNAS_CONFIRMED_E_IDENTIDAD_DIFERIDA','PRE33.10 / PRE33.12','Todas las identidades lunares por planeta sin física artificial'),
  fixed('PRESION_Y_NICHOS_FISICOS','PRE33.02 / PRE33.06 / PRE33.12','Evidencia diferenciada de presión-escenario y presión física'),
  f('POTENCIA_QUIMICA_NO_RESUELTA','NO_EVALUABLE_JUSTIFICADA','PRE33.07','No hay reactivos y tasas suficientes para potencia química positiva real en el panel; 36 cotas condicionales no son metabólicas','HYPOTHESIS_ONLY'),
  f('DOSIMETRIA_GLOBAL_NO_RESUELTA','NO_EVALUABLE_JUSTIFICADA','PRE33.08','Faltan espectros ionizantes, flujo y respuesta de dosimetría; atenuación gamma 1 MeV no es Gy/año','HYPOTHESIS_ONLY'),
  f('CONTINUIDAD_GLOBAL_NO_CERTIFICADA','NO_EVALUABLE_JUSTIFICADA','PRE33.09','No hay series fechadas completas; CT-0 no se extrapola a eones','HYPOTHESIS_ONLY'),
  f('LUNAS_IDENTIDAD_SOLO','FUERA_DOMINIO_FORMAL','PRE33.10','Caracterización individual no materializada: su identidad no certifica océano, química ni vida','DO_NOT_USE'),
  f('SOLVENTES_NH3_CH4_SIN_FASE','NO_EVALUABLE_JUSTIFICADA','PRE33.11a/11c','Sin perfil P-T composicional propio para un solvente alternativo','HYPOTHESIS_ONLY'),
  fixed('FRECUENCIAS_AMBIENTALES_NO_BIOLOGICAS','PRE33.11b/11c','Las tasas de H2O lunar nunca se transforman en probabilidades de vida'),
 ];
}
function pdfWrite(file,title,paragraphs){
 // Minimal deterministic native PDF (Helvetica, WinAnsi). No dependency on Python/ReportLab in Windows.
 const pages=[];let y=792-62;let cmds=[];function page(){if(cmds.length)pages.push(cmds.join('\n'));cmds=[];y=792-62;}
 const latin=s=>Buffer.from(s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E]/g,'?'),'latin1').toString('latin1');
 const esc=s=>latin(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
 function emit(line,font=10){let s=String(line);const width=font===17?65:95;const words=s.split(/\s+/);let curr='';const lines=[];
  for(const w of words){if((curr+' '+w).length>width&&curr){lines.push(curr);curr=w;}else curr=curr?curr+' '+w:w;}
  if(curr)lines.push(curr);
  for(const t of lines){if(y<55)page();cmds.push(`BT /F1 ${font} Tf 46 ${y} Td (${esc(t)}) Tj ET`);y-=font===17?27:17;}
 }
 emit(title,17);y-=8;
 for(const p of paragraphs){if(p===''){y-=9;continue;}emit(p,10);}page();
 const objs=[''];const add=x=>(objs.push(x),objs.length-1);
 const font=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
 const catalog=add('');const pagesId=add('');const pids=[];
 for(const content of pages){const b=Buffer.from(content,'latin1'),stream=add(`<< /Length ${b.length} >>\nstream\n${content}\nendstream`);
  pids.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${stream} 0 R >>`));}
 objs[catalog]=`<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
 objs[pagesId]=`<< /Type /Pages /Count ${pids.length} /Kids [${pids.map(i=>i+' 0 R').join(' ')}] >>`;
 const segments=['%PDF-1.4\n%GENESIS PRE33\n'];const offsets=[0];let cursor=Buffer.byteLength(segments[0]);
 for(let i=1;i<objs.length;i++){offsets[i]=cursor;const s=`${i} 0 obj\n${objs[i]}\nendobj\n`;segments.push(s);cursor+=Buffer.byteLength(s);}
 const start=cursor;segments.push(`xref\n0 ${objs.length}\n0000000000 65535 f \n`);
 for(let i=1;i<objs.length;i++)segments.push(String(offsets[i]).padStart(10,'0')+' 00000 n \n');
 segments.push(`trailer\n<< /Size ${objs.length} /Root ${catalog} 0 R >>\nstartxref\n${start}\n%%EOF\n`);
 fs.writeFileSync(file,segments.join(''),'latin1');
}
function evaluate({options,source,oldPanel,full,upstream11b,upstream11c,quality,commandLog,liveEvidence,referenceFingerprint}){
 const issues=[];const findings=findingsFromEvidence({livePassed:liveEvidence},full);
 const upIssues=checksFromReports(upstream11b,upstream11c,full);
 const raw11b=absolute('docs/audits/pre33-11b/pre33-11b-auditoria.json');
 if(exists(raw11b)&&upstream11c?.upstreamAuditSha256!==sha(fs.readFileSync(raw11b)))upIssues.push('11C_NOT_HASH_BOUND_TO_11B');
 if(exists(raw11b)&&full?.upstream?.sha256!==sha(fs.readFileSync(raw11b)))upIssues.push('12_NOT_HASH_BOUND_TO_11B');
 issues.push(...upIssues);
 if(!liveEvidence)issues.push('AUDIT_NOT_REPLAYED_ON_CURRENT_HEAD');
 if(source.missing.length)issues.push('REQUIRED_SOURCE_FILES_MISSING');
 if(oldPanel?.issues?.length)issues.push('HISTORICAL_REPRODUCTION_ERROR');
 const required={currentSourceReproduced:source.headVerified&&liveEvidence,
  scientificCoreAuditsPassed:['07','08','09','10','11','11a','11b','11c'].every(id=>quality.some(x=>x.name==='science-'+id&&x.status===0)),
  exactHistorical45Reproduced:oldPanel?.verified===true,
  multiGalaxyIndependentPassed:liveEvidence&&full?.galaxies?.length===options.galaxies.length&&full?.totals?.errors===0,
  v2IdentityAndOrbitRegressionPassed:['v2-regression','v2-generative'].every(n=>quality.some(x=>x.name===n&&x.status===0)),
  persistenceAndObservationPassed:quality.some(x=>x.name==='e2e'&&x.status===0)&&full?.totals?.lockedControls>0,
  workerUnitBuildE2EPassed:['architecture','unit-pre33-13','worker','e2e-typecheck','build','e2e'].every(n=>quality.some(x=>x.name===n&&x.status===0)),
  reproducibilityPassed:referenceFingerprint===true};
 const missingChecks=Object.entries(required).filter(([,v])=>!v).map(([k])=>k);
 const blockerFindings=findings.filter(f=>f.state==='BLOQUEANTE'||
   (f.state==='NO_EVALUABLE_JUSTIFICADA'&&f.permittedUse!=='HYPOTHESIS_ONLY')||
   (f.state==='FUERA_DOMINIO_FORMAL'&&f.permittedUse!=='DO_NOT_USE'));
 if(upIssues.length)for(const code of upIssues)findings.push({code,state:'BLOQUEANTE',source:'PRE33.11b/11c/12',explanation:'Integridad o evidencia científica insuficiente',permittedUse:'DO_NOT_USE'});
 if(oldPanel?.issues?.length)for(const code of oldPanel.issues)findings.push({code:'HISTORICAL_'+code,state:'NO_VERIFICADA',source:'PRE33.00',explanation:'Reproducción histórica pendiente de reconciliación',permittedUse:'DO_NOT_USE'});
 const blockers=[...new Set([...issues,...blockerFindings.map(f=>f.code)])];
 // Use the SAME pure versioned gate as the Angular implementation, rather
 // than maintaining a second, less strict decision algorithm in Node.
 const ts=require('typescript');
 if(!require.extensions['.ts'])require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
   fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
 const gate=require(absolute('src/app/domain/biology/pre33-13-certification-gate.ts'));
 const decision=gate.decideG2PRE3313({...required,findings});
 const verdict=decision.verdict;
 return {contract:CONTRACT,seed:options.seed,verdict,requested:'PRE-33.13 / final scientific gate',
  authorization:verdict==='G2_AUTORIZADA_CON_HIPOTESIS'?'33.2-33.5: SOLO HIPOTESIS EXPLICITAS Y VALIDADAS':'NO_SE_AUTORIZA_VIDA_EFECTIVA',
  never:'No es una demostracion de abiogenesis real ni licencia para revelar Ground Truth al jugador',
  originalHistoricalPanel:oldPanel,source,checks:required,missingChecks,blockers,findings,
  referencePanel60:full?{galaxies:full.galaxies?.map(g=>({name:g.galaxy,systems:g.systems,planets:g.planets,moons:g.moons,detailed:g.detailedMoons,minor:g.identityOnlyMoons})),totals:full.totals}:null,
  previousReference: {reported20261020:{systems:45,planets:341,moons:902,detailedMoons:560},
    note:'Referencia de otro panel y revision: NO comparable por igualdad de conteos sin lista exacta de localizadores'},
  evidencePolicy:{unresolvedNotSterile:true,aqueousNotLife:true,thermalNotChemical:true,bolometricNotDose:true,ct0NotHistory:true,
    statisticalIncidenceNotAbiogenesis:true,lifeStillDisabled:true},commandLog};
}
function writeReport(report,folder){fs.mkdirSync(folder,{recursive:true});
 const json=JSON.stringify(report,null,2)+'\n';fs.writeFileSync(path.join(folder,'pre33-13-certificacion.json'),json);
 const lines=[`# PRE-33.13 — Certificacion final de salida G2`, '',`**Decision: ${report.verdict}**`, '',
 `Semilla: ${report.seed}`,`Fuente: ${report.source.gitCommit||'sin HEAD de Git'}; arbol limpio: ${report.source.trackedWorkingTreeClean}; firma de archivos: ${report.source.sourceTreeSha256}`,
 '',`## Panel historico de 45 sistemas`,`Estado: ${report.originalHistoricalPanel.status}. Verificados: ${report.originalHistoricalPanel.systemsChecked??0}/45.`,
 'La referencia de 20/10/2026 no es el mismo panel que la muestra V3; no confundir su discrepancia de recuentos con un cambio fisico confirmado.',
 '',`## Panel multigalactico`,...(report.referencePanel60?.galaxies||[]).map(g=>`- ${g.name}: ${g.systems} sistemas, ${g.planets} planetas, ${g.moons} lunas (${g.detailed} detalladas, ${g.minor} solo identidad)`),
 '',`## Comprobaciones obligatorias`,...Object.entries(report.checks).map(([k,v])=>`- ${v?'OK':'PENDIENTE'}: ${k}`),
 '',`## Registro de hallazgos`,...report.findings.map(f=>`- **${f.state}** ${f.code} [${f.source}]: ${f.explanation}. Uso: ${f.permittedUse}`),
 '',`## Bloqueos y condiciones`,...(report.blockers.length?report.blockers.map(x=>'- '+x):['- Ningun bloqueo detectado en las pruebas disponibles.']),
 ...report.missingChecks.map(x=>'- EVIDENCIA PENDIENTE: '+x),
 '',`## Alcance de G2`,`G2 solo autoriza simulacion bajo hipotesis 33.2/33.3 con reactivos, energia, medio, exposicion e historia validados o marcados expresamente como condicionales.`,
 'No autoriza usar desconocidos como fisica resuelta ni asignar automaticamente vida, microbios, organismos, biosignaturas o tecnofirmas.',
 'La separacion Ground Truth / Observed Knowledge continua vigente. PRE-33.13 NO crea vida.',
 '',`## Certificacion oficial`, 'El auditor debe ejecutarse sobre HEAD real, con 45 identidades historicas, reauditoria y suite de calidad completas.',
 'El informe generado sin alguno de esos requisitos es PRELIMINAR, aunque las otras comprobaciones pasen.', ''];
 fs.writeFileSync(path.join(folder,'pre33-13-dossier.md'),lines.join('\n'));
 pdfWrite(path.join(folder,'pre33-13-dossier.pdf'),'GENESIS WEB - PRE-33.13 / G2',[`Decision: ${report.verdict}`,
 'Reauditoria final de Elixisis, contrastada con una muestra multigalactica.',
 `HEAD: ${report.source.gitCommit||'SIN GIT'}; arbol limpio: ${report.source.trackedWorkingTreeClean}`,
 `Panel original de 45: ${report.originalHistoricalPanel.status}`,
 ...(report.referencePanel60?.galaxies||[]).map(g=>`${g.name}: ${g.systems} sistemas, ${g.planets} planetas, ${g.moons} lunas.`),
 '', 'PUERTAS DE AUTORIZACION',...Object.entries(report.checks).map(([k,v])=>`${v?'OK':'PENDIENTE'} - ${k}`),
 '', 'REGISTRO CIENTIFICO',...report.findings.map(f=>`${f.state} - ${f.code}: ${f.explanation}`),
 '', 'PROHIBICIONES', 'Agua liquida NO implica vida; calor NO es potencia quimica;',
 'flujo bolometrico NO es dosis; CT-0 NO es continuidad;',
 'probabilidades ambientales NO son probabilidades de abiogenesis.',
 'G2 solo autoriza hipotesis 33.2/33.3 declaradas y auditables.',
 'La generacion biologica permanece desactivada hasta autorizacion valida.',
 ...report.blockers.map(x=>`BLOQUEO: ${x}`),...report.missingChecks.map(x=>`PENDIENTE: ${x}`)]);
 return {jsonSha256:sha(json),mdSha256:sha(fs.readFileSync(path.join(folder,'pre33-13-dossier.md'))),pdfSha256:sha(fs.readFileSync(path.join(folder,'pre33-13-dossier.pdf')))};
}
function runScience(o,folder,quality){
 const commands=[
  ['07','auditar-genesis-pre33-07.cjs'],
  ['08','auditar-genesis-pre33-08.cjs'],
  ['09','auditar-genesis-pre33-09.cjs'],
  ['10','auditar-genesis-pre33-10.cjs'],
  ['11','auditar-genesis-pre33-11.cjs'],
  ['11a','auditar-genesis-pre33-11a.cjs'],
 ];
 for(const [id,file] of commands){const log=[];const good=runNode(file,[`--seed=${o.seed}`,`--galaxies=${o.galaxies.join(',')}`,`--systems-per-galaxy=${o.systems}`,`--out=${path.join(folder,'science-'+id)}`,'--strict'],log);
   quality.push({name:'science-'+id,status:good?0:1,details:log[0]});}
 const logB=[];const goodB=runNode('auditar-genesis-pre33-11b.cjs',[`--seed=${o.seed}`,`--galaxies=${o.galaxies.join(',')}`,'--sectors-per-region=10',`--out=${path.join(folder,'science-11b')}`,'--strict'],logB);
 quality.push({name:'science-11b',status:goodB?0:1,details:logB[0]});
 const logC=[];const goodC=runNode('auditar-genesis-pre33-11c.cjs',[`--out=${path.join(folder,'science-11c')}`,'--strict'],logC);
 quality.push({name:'science-11c',status:goodC?0:1,details:logC[0]});
}
function main(argv=process.argv.slice(2)){
 const o=args(argv);if(o.help){console.log('node scripts/certificar-genesis-pre33-13.cjs --run-live --run-quality --run-science --historical-fixtures=... --strict --out=pre33-audit');return;}
 const out=absolute(o.out),audit=path.join(out,'pre33-13'),jobs=[];fs.mkdirSync(audit,{recursive:true});
 const source=sourceIdentity();const oldPanel=replayHistoricFixtures(historical(o.historic45,o.seed),o.seed);
 const upstream11b=exists(absolute('docs/audits/pre33-11b/pre33-11b-auditoria.json'))?read(absolute('docs/audits/pre33-11b/pre33-11b-auditoria.json')):null;
 const upstream11c=exists(absolute('docs/audits/pre33-11c/pre33-11c-auditoria.json'))?read(absolute('docs/audits/pre33-11c/pre33-11c-auditoria.json')):null;
 let live=false,repro=false,full=null;
 if(o.runLive){
  const params45=[`--seed=${o.seed}`,'--galaxies=0',`--systems-per-galaxy=${o.historicalSystems}`,`--out=${path.join(audit,'elixisis-v3-45')}`,'--strict'];
  const params60=[`--seed=${o.seed}`,`--galaxies=${o.galaxies.join(',')}`,`--systems-per-galaxy=${o.systems}`,`--out=${path.join(audit,'multigalactic-v3')}`,'--strict'];
  const p45=runNode('auditar-genesis-pre33-12.cjs',params45,jobs);
  const p60=runNode('auditar-genesis-pre33-12.cjs',params60,jobs);
  const p60Repro=runNode('auditar-genesis-pre33-12.cjs',params60.map(a=>a.startsWith('--out=')?`--out=${path.join(audit,'multigalactic-reproduction')}`:a),jobs);
  const a=path.join(audit,'multigalactic-v3'),b=path.join(audit,'multigalactic-reproduction');
  if(p60&&p60Repro){const names=['pre33-12-auditoria.json','pre33-12-por-planeta.csv','pre33-12-informe.md'];
   repro=names.every(n=>sha(fs.readFileSync(path.join(a,n)))===sha(fs.readFileSync(path.join(b,n))));}
  full=p60?read(path.join(a,'pre33-12-auditoria.json')):null;
  // A selected new V3 45-system panel does not replace the original archived 45.
  live=p45&&p60&&p60Repro&&repro;
 }else if(o.quick){const p=absolute('docs/audits/pre33-12/pre33-12-auditoria.json');full=exists(p)?read(p):null;}
 const quality=[];if(o.runQuality)runQuality(quality);if(o.runScience)runScience(o,audit,quality);
 const report=evaluate({options:o,source,oldPanel,full,upstream11b,upstream11c,quality,commandLog:jobs,liveEvidence:live,referenceFingerprint:repro});
 const digest=writeReport(report,audit);console.log('PRE33_13_G2_DECISION='+report.verdict);
 console.log('JSON_SHA256='+digest.jsonSha256,'PDF_SHA256='+digest.pdfSha256);
 console.log('DOSSIER='+path.join(audit,'pre33-13-dossier.pdf'));
 if(o.strict&&report.verdict!=='G2_AUTORIZADA_CON_HIPOTESIS')process.exitCode=2;
 return report;
}
if(require.main===module)try{main();}catch(e){console.error('PRE33_13_AUDITOR_EXCEPTION',e.stack||e);process.exitCode=1;}
module.exports={args,sourceIdentity,checksFromReports,historical,replayHistoricFixtures,evaluate,writeReport,main};
