'use strict';
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const identity = object => crypto.createHash('sha256').update(JSON.stringify(object)).digest('hex');
const numberOrNull = value => typeof value === 'number' && Number.isFinite(value) ? value : null;
const safeJson = value => JSON.stringify(value, (_, item) => typeof item === 'bigint' ? item.toString() : item, 2);
const accumulate = (record, label, n=1) => { const k = String(label ?? 'UNKNOWN'); record[k] = (record[k] || 0) + n; };
const validNonNegative = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const fraction = value => value === null || (validNonNegative(value) && value <= 1);
const different = (a,b) => validNonNegative(a) && validNonNegative(b) && Math.abs(a-b) > 1e-6 * Math.max(1,Math.abs(a),Math.abs(b));

function parseArgs(argv) {
  const opts = { seed:null, galaxies:[0], systemsPerGalaxy:20, reportDir:'pre33-audit', reference:null, snapshot:null, strict:false, maxSectors:1500 };
  for (const item of argv) {
    if (item==='--strict') {opts.strict=true;continue;}
    if (item==='--help' || item==='-h'){opts.help=true;continue;}
    const m=/^--([a-z-]+)=(.*)$/.exec(item); if(!m)throw Error(`Opción no reconocida: ${item}`);
    const [,key,value]=m;
    if(key==='seed')opts.seed=value;
    else if(key==='galaxies'){
      const raw=value.split(','); if(!raw.length || raw.some(s=> !/^(0|[1-9]\d*)$/.test(s) || !Number.isSafeInteger(Number(s))))throw Error('galaxies requiere índices enteros no negativos');
      opts.galaxies=[...new Set(raw.map(Number))];
    } else if(key==='systems-per-galaxy')opts.systemsPerGalaxy=Number(value);
    else if(key==='max-sectors')opts.maxSectors=Number(value);
    else if(key==='out')opts.reportDir=value;
    else if(key==='reference')opts.reference=value;
    else if(key==='snapshot')opts.snapshot=value;
    else throw Error(`Opción no reconocida: --${key}`);
  }
  if(!opts.help){
    if(!opts.seed || !/^[0-9A-Fa-f]{4}(?:-[0-9A-Fa-f]{4}){7}$/.test(opts.seed))throw Error('Indica --seed=XXXX-... con 8 grupos de cuatro dígitos hexadecimales');
    opts.seed=opts.seed.toUpperCase();
    if(!Number.isSafeInteger(opts.systemsPerGalaxy) || opts.systemsPerGalaxy<1 || opts.systemsPerGalaxy>200)throw Error('systems-per-galaxy debe ser 1..200');
    if(!Number.isSafeInteger(opts.maxSectors) || opts.maxSectors<1 || opts.maxSectors>20000)throw Error('max-sectors debe ser 1..20000');
  }
  return opts;
}

function makeCandidates(seed, galaxyIndex, halfExtent, maximum) {
  // No Math.random / Date / PRNG state shared with GENESIS generation.
  const seedText=`${seed}|${galaxyIndex}|PRE33.00|v1`;
  let state=parseInt(crypto.createHash('sha256').update(seedText).digest('hex').slice(0,8),16)>>>0;
  const next=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/0x100000000;};
  const seen=new Set(), out=[];
  const radius=Math.max(1,halfExtent);
  // Radial rings x four quadrants: deterministic coverage, not statistical inference.
  for(let attempt=0;out.length<maximum && attempt<maximum*8;attempt++) {
    const ring=attempt%4, quadrant=Math.floor(attempt/4)%4;
    const low=ring*radius/4, high=(ring+1)*radius/4;
    const r=low+(high-low)*Math.sqrt(next()), angle=(quadrant+next())*Math.PI/2;
    const x=Math.max(-halfExtent,Math.min(halfExtent,Math.round(r*Math.cos(angle))));
    const y=Math.max(-halfExtent,Math.min(halfExtent,Math.round(r*Math.sin(angle))));
    if(x===0&&y===0)continue;
    const id=`${x},${y}`;if(seen.has(id))continue;seen.add(id);out.push({x,y,band:ring+1});
  }
  return out;
}
function expectedComparison(galaxy, reference){
  if (!reference) return {status:'NOT_CONFIGURED',differences:[]};
  const checks=[['name', galaxy.designation.name, reference.name], ['code',galaxy.designation.proceduralCode,reference.proceduralCode],
    ['type',galaxy.type.name,reference.type],['ageBillionYears',galaxy.physicalProperties.ageBillionYears,reference.ageBillionYears],
    ['diameterLightYears',galaxy.physicalProperties.diameterLightYears,reference.diameterLightYears],
    ['totalMassSolarMasses',galaxy.physicalProperties.totalMassSolarMasses,reference.totalMassSolarMasses],
    ['stellarPopulation',galaxy.physicalProperties.stellarPopulation.toString(),String(reference.stellarPopulation)],
    ['metallicitySolarRatio',galaxy.physicalProperties.metallicitySolarRatio,reference.metallicitySolarRatio],
    ['starFormationRateSolarMassesPerYear',galaxy.physicalProperties.starFormationRateSolarMassesPerYear,reference.starFormationRateSolarMassesPerYear]];
  const tolerances={ageBillionYears:0.005,diameterLightYears:1,totalMassSolarMasses:6e8,metallicitySolarRatio:0.0005,starFormationRateSolarMassesPerYear:0.0005};
  const differences=checks.filter(([key,actual,expected])=>expected!==undefined && (typeof actual==='number' ? Math.abs(actual-expected)>(tolerances[key]||0) : actual!==expected)).map(([field,actual,expected])=>({field,actual,expected}));
  return {status:differences.length?'MISMATCH':'MATCH',differences};
}
function checkSnapshotCounts(reference, snapshot) {
  if(!reference)return {status:'NO_REFERENCE',differences:[]};
  if(!snapshot) return {status:'REFERENCE_ONLY_NOT_READ_FROM_INDEXEDDB',differences:[],referenceCounts:reference.persistedKnowledge};
  if(snapshot.galaxyIndex!==reference.galaxyIndex || snapshot.universeSeed!==reference.seed || snapshot.generatorVersion!=='V2')return {status:'IDENTITY_MISMATCH',differences:[{field:'snapshotIdentity',actual:{galaxyIndex:snapshot.galaxyIndex,seed:snapshot.universeSeed,version:snapshot.generatorVersion}}]};
  const diffs=[]; for(const [key,value] of Object.entries(reference.persistedKnowledge||{})){
    if(snapshot.persistedKnowledge?.[key]!==value)diffs.push({field:key,expected:value,actual:snapshot.persistedKnowledge?.[key]??null});
  }
  return {status:diffs.length?'MISMATCH':'MATCH',differences:diffs};
}
function safeWrite(dir,baseName,body){
  fs.mkdirSync(dir,{recursive:true});const target=path.join(dir,baseName);fs.writeFileSync(target,body,'utf8');return target;
}
function asMarkdown(result) {
  const rows=result.galaxies.map(g=>`| ${g.galaxyIndex} | ${g.designation.name} | ${g.sample.systems} | ${g.sample.planets} | ${g.sample.moons} | ${g.sample.relevantMoons} | ${g.issues.length} |`).join('\n');
  const details=result.galaxies.map(g=>{
    const s=g.sample; const problems=g.issues.map(i=>`- **${i.severity}** ${i.code}: ${i.detail}`).join('\n')||'No se detectaron fallos estructurales en la muestra.';
    const states=Object.entries(s.moonOceanStates).map(([k,v])=>`  - ${k}: ${v}`).join('\n');
    return `## Galaxia ${g.galaxyIndex}: ${g.designation.name}\n\nIdentidad procedural: \`${g.designation.proceduralCode}\`. Contraste de referencia: ${g.referenceCheck.status}.\n\nSistemas ${s.systems}; planetas ${s.planets}; lunas ${s.moons}; lunas detalladas ${s.relevantMoons}; solo identidad ${s.identityOnlyMoons}.\n\nOcéanos lunares CT-0:\n${states||'  - Sin lunas detalladas'}\n\nPresiones planetarias potencialmente divergentes: ${s.pressureColumnDifferences} (NO se afirma que ambas columnas deban ser iguales sin revisar semántica).\n\nAtmósferas lunares con balance físico: ${s.moonPhysicalBalances}; energía química cuantificada: ${s.moonChemicalPowerResolved}; dosis lunar superficial: ${s.moonSurfaceDoseResolved}; dosis lunar subsuperficial: ${s.moonSubsurfaceDoseResolved}.\n\n${problems}\n`;
  }).join('\n');
  return `# PRE-33.00 — Auditoría reproducible de GENESIS Web\n\nSemilla: \`${result.universeSeed}\` · Generador: ${result.generatorVersion} · Contrato: ${result.contract}.\n\n## Alcance y límites\n\n- Regeneración **solo lectura** y sin acceso a IndexedDB; no se modifica universo, descubrimiento ni historia.\n- Muestreo determinista por anillos y cuadrantes, **no** censo galáctico ni estimador representativo de incidencia biológica.\n- Los valores de conocimiento persistido de Elixisis son **referencia aportada por el usuario**, no datos comprobados automáticamente. Para contrastarlos es necesaria una exportación específica de la persistencia (--snapshot).\n- No inferir vida, probabilidades de abiogénesis o evidencias positivas a partir de índices V1, flujo térmico o presión condicional.\n- Una salida física NO_RESUELTA es incertidumbre; no cuenta automáticamente como fallo de generación.\n\n## Resumen por galaxia\n\n| Índice | Galaxia | Sistemas | Planetas | Lunas | Detalladas | Incidencias estructurales |\n|---:|---|---:|---:|---:|---:|---:|\n${rows}\n\n## Persistencia de Elixisis\n\n${result.persistedComparison ? `Estado: **${result.persistedComparison.status}**. ${result.persistedComparison.status==='REFERENCE_ONLY_NOT_READ_FROM_INDEXEDDB'?'Los totales declarados no se han verificado frente a IndexedDB.':''}` : 'No se configuró referencia.'}\n\n${details}\n## Veredicto técnico\n\n${result.overallStatus}. Incidencias estructurales bloqueantes: ${result.blockers.length}. Los apartados PRE-33.01–PRE-33.13 siguen siendo necesarios para verificar y mejorar la cobertura física antes de generar vida efectiva.\n`;
}
module.exports={identity,numberOrNull,safeJson,accumulate,validNonNegative,fraction,different,parseArgs,makeCandidates,expectedComparison,checkSnapshotCounts,safeWrite,asMarkdown};
