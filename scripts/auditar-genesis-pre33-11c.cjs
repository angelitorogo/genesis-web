'use strict';
/** PRE-33.11c audit of the ACTUAL 11b probabilistic sample, NO new draws. */
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const ts=require('typescript');
if(!require.extensions['.ts'])require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{
 fileName:f,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,f);
const {bridgeGalacticLifeCalibrationPRE3311c:bridge,
 assessSignalDetectabilityPRE3311c:instrument}=require('../src/app/simulation/planetary/galactic-life-readiness-pre33-11c.ts');
const ROOT=path.resolve(__dirname,'..');
const INPUT=path.join(ROOT,'docs/audits/pre33-11b/pre33-11b-auditoria.json');
const TAG='PRE33_11C_V3_LIFE_READINESS_AUDITED';
const regions=['CENTRAL','INNER','MIDDLE','OUTER'];
function parse(argv){const opts={input:INPUT,out:path.join(ROOT,'pre33-audit'),strict:false};
 for(const arg of argv){if(arg==='--strict')opts.strict=true;
  else if(arg.startsWith('--input='))opts.input=path.resolve(ROOT,arg.slice(8));
  else if(arg.startsWith('--out='))opts.out=path.resolve(ROOT,arg.slice(6));
  else throw Error('INVALID_ARGUMENT:'+arg);
 }return opts;}
function read(input){const source=fs.readFileSync(input,'utf8');const doc=JSON.parse(source);
 if(doc.contract!=='PRE-33.11b/V3-GALACTIC-STATISTICAL-CALIBRATION/v1'||doc.universeGenerator!=='V3'||
 doc.life!=='NOT_EVALUATED'||!Array.isArray(doc.galaxies)||doc.galaxies.length!==3||
 new Set(doc.galaxies.map(g=>g.galaxyIndex)).size!==3||doc.galaxies.some(g=>g.issues?.length||!g.calibration))
 throw Error('PRE33_11C_INVALID_UPSTREAM_11B_AUDIT');
 return {doc,sourceHash:crypto.createHash('sha256').update(source).digest('hex')};}
function build(input=INPUT){const {doc,sourceHash}=read(input);const issues=[];const rows=[];
 const galaxies=doc.galaxies.map(g=>{const c=g.calibration,b=bridge(c);
   if(c.sectorsSampled!==4*doc.sectorsPerRegion||
      Object.values(c.regionFrames).some(v=>!Number.isSafeInteger(v)||v<0)||
      Object.values(c.regionSampleSizes).some(v=>v!==doc.sectorsPerRegion)||
      c.expanded['detailedMoons']<0||c.expanded['identityOnlyMoons']<0||
      c.expanded['moonLiquidH2O']<0||c.expanded['moonLiquidH2O']>c.expanded['detailedMoons']||
      c.expanded['moonUnknownH2O']>c.expanded['detailedMoons'])
     issues.push(g.galaxy+':INVALID_SAMPLING_COUNTS');
   for(const r of regions){const x=c.regionalOpportunities[r];if(!x){issues.push(g.galaxy+':MISSING_REGION_'+r);continue;}
     for(const solvent of ['H2O','NH3','CH4','OTHER'])rows.push({galaxy:g.galaxy,region:r,
      solvent,occupiedSectorCells:x.occupiedSectorCells,sampledSectorCells:x.sampledSectorCells,
      modeledLiquidCount:solvent==='H2O'?x.expandedLiquidH2O:null,
      characterizedMoonDenominator:x.expandedDetailedMoons,
      liquidFractionAmongDetailed:solvent==='H2O'?x.modeledAqueousAmongDetailed:null,
      solventPhase:solvent==='H2O'?'CT0_AQUEOUS_MODEL_ONLY':'UNRESOLVED',
      abiogenesis:'NOT_EVALUATED',life:'NOT_SIMULATED',biosignatures:'NOT_INFERRED'});
   }
   return {name:g.galaxy,galaxyIndex:g.galaxyIndex,sectorsSampled:c.sectorsSampled,
      calibration:b,missingPhysics:['CHEMICAL_POWER','IONIZING_DOSE','DATED_ENVIRONMENTAL_CONTINUITY','NH3_CH4_PHASE'],
      biosphere:'NOT_SIMULATED',intelligence:'NOT_SIMULATED',civilization:'NOT_SIMULATED',
      biosignatures:'NOT_INFERRED',technosignatures:'NOT_INFERRED'};});
 const stages=[33,34,35,36,37,38].map(phase=>({phase,activated:false,
   simulationState:'NOT_SIMULATED',observedEvidence:'NOT_INFERRED'}));
 // Controlled synthetic example to prove instrument interfaces; NOT a galaxy signal.
 const demo=instrument({channel:'BIOSIGNATURE',observableKey:'FIXTURE_ONLY',sourceProvenance:'fixture',
 instrumentProvenance:'fixture',observingGeometryProvenance:'fixture',signalElectronRate:3,
 backgroundElectronRate:12,darkElectronRate:1,readNoiseElectronsRms:2,exposureSeconds:120,
 alternativeAbioticExplanation:'PLAUSIBLE',independentEvidenceKey:null});
 if(demo.status!=='INSTRUMENT_SIGNAL_ESTIMABLE'||demo.observedLife!=='NOT_INFERRED'||
    galaxies.some(g=>g.calibration.lifeRate!==null||g.calibration.intelligenceRate!==null||g.calibration.civilizationRate!==null))
   issues.push('FORBIDDEN_BIOLOGICAL_PROMOTION');
 return {contract:'PRE-33.11c/V3-LIFE-READINESS-NON-GENERATING/v1',sourceAudit:'PRE-33.11b',
 upstreamAuditSha256:sourceHash,universeSeed:doc.universeSeed,
 study:'STAGED_READINESS_FOR_PHASES_33_TO_38',galaxies,regions:rows,stages,
 evidence:['ENVIRONMENTAL_OPPORTUNITY_ONLY','NO_CANONICAL_LIFE','NO_OBSERVED_BIOSIGNATURES'],
 instrumentalRegression:'SYNTHETIC_FIXTURE_TEST_ONLY_NOT_IN_UNIVERSE',
 instrumentResultStatus:demo.status,abioticFalsePositiveStillPlausible:demo.alternativeAbioticExplanation==='PLAUSIBLE',
 issues,verdict:issues.length?'PRE33_11C_REVIEW_REQUIRED':TAG};}
function write(out,report){fs.mkdirSync(out,{recursive:true});const asText=JSON.stringify(report,null,2)+'\n';
 const columns=['galaxy','region','solvent','occupiedSectorCells','sampledSectorCells','modeledLiquidCount',
 'characterizedMoonDenominator','liquidFractionAmongDetailed','solventPhase','abiogenesis','life','biosignatures'];
 const q=x=>JSON.stringify(x===null?'':x);
 const csv=columns.join(',')+'\n'+report.regions.map(x=>columns.map(k=>q(x[k])).join(',')).join('\n')+'\n';
 const pct=n=>n===null?'No estimable':(100*n).toFixed(3)+' %';
 const md=['# GENESIS Web — PRE-33.11c · Puerta científica hacia fases 33–38','','**'+report.verdict+'**',
 '',`Semilla V3: ${report.universeSeed}. Auditoría base PRE-33.11b SHA-256: \`${report.upstreamAuditSha256}\`.`,
 'No se ha generado ningún planeta, luna, organismo, biosignatura o civilización; las cifras proceden del muestreo 11b y son ambientales.',
 '', '## Calibración reutilizada: agua líquida lunar CT-0 del modelo simulado',
 '| Galaxia | Sectores probabilísticos | H₂O líquida entre lunas detalladas | Intervalo exploratorio 95 % | Frecuencia de vida |',
 '|---|---:|---:|---|---|',
 ...report.galaxies.map(g=>{const c=g.calibration;return `| ${g.name} | ${g.sectorsSampled} | ${pct(c.aqueousModeledAmongDetailed)} | ${c.aqueousInterval95Exploratory?pct(c.aqueousInterval95Exploratory[0])+'–'+pct(c.aqueousInterval95Exploratory[1]):'No estimable'} | **No estimable** |`;}),
 '', '## Contrato de preparación por fase',
 '| Fase | Responsabilidad futura | Estado |', '|---|---|---|',
 '| 33 | Hipótesis parametrizadas de origen, organismos canónicos y biosignaturas instrumentales separadas | Bloqueada antes de PRE-33.13 |',
 '| 34 | Metabolismo, evolución de biosferas y retroalimentación físico-química | No simulada |',
 '| 35 | Inteligencia posible, sin teleología ni dependencia terrestre necesaria | No simulada |',
 '| 36 | Civilizaciones condicionales, sin cuotas obligatorias | No simulada |',
 '| 37 | Tecnofirmas: fuentes, propagación, instrumento y falsos positivos | No inferidas |',
 '| 38 | Representación visual subordinada al conocimiento del jugador, sin revelar Ground Truth | No activada |',
 '', '## Separación de dominios',
 '- **Compatibilidad física** por solvente exige fase, reactivos y potencia, presión/confinamiento, exposición ionizante e historia fechada. Un solo dato CT-0 no satisface esos cinco criterios.',
 '- **Frecuencia de oportunidades** es una estimación ambiental sectorial del universo procedural. No mide P(vida), P(inteligencia) o P(civilización).',
 '- **Químicas NH₃, CH₄ y otras** permanecen desconocidas, no ausentes ni positivas por decreto.',
 '- **Observabilidad** solo admite señal/ruido cuando hay flujo de señal, fondo, detector, tiempo y geometría con procedencia. No se usa un umbral SNR universal para confirmar vida.',
 '- **Falsos positivos abióticos** se mantienen explícitos; incluso una anomalía con buena SNR no certifica su origen biológico.',
 '- **Vida y conocimiento observado** son canales diferentes: ni el motor ambiental ni la estadística emiten biología real u observada.',
 '- **Lunas de solo identidad** nunca se contabilizan como estériles ni como confirmadas; no se materializan masivamente.',
 '', '## Metodología y límites',
 'Las regiones se heredan del muestreo probabilístico de 11b. No se han sorteado sectores adicionales ni cambiado la calibración. Las frecuencias galácticas de vida siguen **no identificables**, pues faltan una función causal de abiogénesis, supervivencia y observación.',
 'El ejemplo de señal/ruido utilizado por el test es totalmente sintético y no describe ningún cuerpo del universo.',
 '', '## Regresión y trazabilidad',
 `Filas regionales/solventes: ${report.regions.length}; incidencias: ${report.issues.length}. Los archivos JSON y CSV son reproducibles con la misma auditoría PRE-33.11b.`,
 'Siguiente: PRE-33.12 integración completa; PRE-33.13 certificación independiente antes de activar vida efectiva.', ''];
 const markdown=md.join('\n');fs.writeFileSync(path.join(out,'pre33-11c-auditoria.json'),asText);
 fs.writeFileSync(path.join(out,'pre33-11c-por-region-solvente.csv'),csv);
 fs.writeFileSync(path.join(out,'pre33-11c-informe.md'),markdown);
 return {jsonSha256:crypto.createHash('sha256').update(asText).digest('hex'),
 csvSha256:crypto.createHash('sha256').update(csv).digest('hex'),mdSha256:crypto.createHash('sha256').update(markdown).digest('hex')};}
function main(argv=process.argv.slice(2)){const opts=parse(argv);const r=build(opts.input),sha=write(opts.out,r);
 console.log(r.verdict,`galaxies=${r.galaxies.length}`,`rows=${r.regions.length}`,`issues=${r.issues.length}`,
 `SHA256_JSON=${sha.jsonSha256}`,`SHA256_CSV=${sha.csvSha256}`);
 if(opts.strict&&r.verdict!==TAG)process.exitCode=1;return r;}
if(require.main===module)main();module.exports={main,parse,build,write,read,TAG};
