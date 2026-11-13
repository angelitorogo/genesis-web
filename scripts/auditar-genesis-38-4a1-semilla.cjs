'use strict';
/** 38.4a1: auditor de procedencia conservador. Nunca altera el repositorio. */
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const ROOT=path.resolve(process.cwd());
const SOURCE_ROOT=path.join(ROOT,'src','app');
const OUTPUT=path.join(ROOT,'docs','audits','38-4a1');
const SPATIAL=/\b(?:planet(?:Id|Index|Key|Name|Ordinal|Position|Coordinates)?|moon(?:Id|Index|Key|Name|Ordinal)?|system(?:Id|Index|Key|Name|Ordinal)?|galaxy(?:Id|Index|Key|Name|Ordinal)?|sector(?:Id|Index|X|Y)?|world(?:Id|Index|Key|Name)?|orbital(?:Index|Position)?|coordinates?|latitude|longitude|location|spatial|orbit(?:Id|Index)?|planetaryBody(?:Id|Index)?)\b/i;
const IDENTITY=/\b(?:speciesId|speciesIdentity|speciesFingerprint|appearanceFingerprint|morphology|pigmentation|bodyPlan|genetic|phenotype|traits|adaptations|lineage|species\.id|species\.identity)\b/i;
const FIXTURE=/(?:fixtures?|laboratory|gallery-fixtures|test|spec|mock)(?:[./\\-]|$)/i;
const TS_EXT=/\.(?:tsx?|mts|cts)$/;
function walk(dir,out=[]){if(!fs.existsSync(dir))return out;for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name==='node_modules'||e.name==='dist'||e.name==='coverage')continue;const f=path.join(dir,e.name);if(e.isDirectory())walk(f,out);else if(TS_EXT.test(e.name))out.push(f);}return out;}
function lineAt(s,offset){return 1+(s.slice(0,offset).match(/\n/g)||[]).length;}
function classify(hit){
 if(hit.isFixture)return 'LABORATORIO';
 if(hit.spatial.length)return 'DEPENDENCIA_ESPACIAL_POTENCIAL';
 if(hit.identity.length && !hit.unresolved.length)return 'IDENTIDAD_BIOLOGICA_INDICADA';
 return 'PROCEDENCIA_NO_DEMOSTRADA';
}
function analyzeFile(content,relativePath){
 const hits=[];const re=/(?:\bvariantSeedUint32\b\s*:\s*|\bvariantSeedUint32\b\s*=\s*)([^\r\n;]{1,320})/g;
 for(const m of content.matchAll(re)){
   const line=lineAt(content,m.index);const expression=m[1].trim();const isFixture=FIXTURE.test(relativePath)||/LAB_ONLY/.test(content.slice(Math.max(0,m.index-600),m.index+450));
   // Se inspecciona contexto inmediato, no se inventa una cadena de llamadas.
   const before=content.slice(Math.max(0,m.index-900),m.index);
   const context=before+'\n'+expression;
   const spatial=Array.from(new Set((context.match(new RegExp(SPATIAL.source,'gi'))||[]))).filter(x=>SPATIAL.test(x));
   const identity=Array.from(new Set(context.match(new RegExp(IDENTITY.source,'gi'))||[]));
   // Identificadores auxiliares o hash de variables hacen imprescindible revisar el origen aguas arriba.
   const unresolved=[];
   if(/(?:hash|seed|fingerprint|index|identity|variant|derive|build|compute)\s*\(/i.test(expression)||/\b[A-Za-z_$][\w$]*\b/.test(expression))unresolved.push('Requiere seguir símbolos y llamadas aguas arriba');
   if(/^[\w$]+\s*[,}]?$/.test(expression))unresolved.push('Valor asignado por variable sin expresión origen');
   const hit={file:relativePath,line,expression:expression.slice(0,250),isFixture,identity,spatial,unresolved};
   hit.state=classify(hit);hits.push(hit);
 }
 return hits;
}
function main(){const files=walk(SOURCE_ROOT);const hits=[];for(const file of files){const rel=path.relative(ROOT,file).replace(/\\/g,'/');hits.push(...analyzeFile(fs.readFileSync(file,'utf8'),rel));}
 const prod=hits.filter(x=>!x.isFixture);const summary={total: hits.length,fixtures:hits.length-prod.length,production:prod.length,spatialPotential:prod.filter(x=>x.state==='DEPENDENCIA_ESPACIAL_POTENCIAL').length,unresolved:prod.filter(x=>x.state==='PROCEDENCIA_NO_DEMOSTRADA').length};
 const result={revision:'GENESIS/38.4a1/procedencia-semilla/v1',generatedAt:new Date().toISOString(),filesReviewed:files.length,scope:'Análisis estático conservador. No demuestra dependencias transitivas ni permite cerrar 38.4.',summary,findings:hits,requiredVerification:['Inspeccionar mapper VIDA→Vida38SpeciesVisualContract y derivaciones aguas arriba','Crear caso de VIDA persistido real: mismo ID y rasgos, ubicación alternativa','Verificar fingerprint y variantSeedUint32 ante backup/restore real','Permitir variantes distintas solo con rasgos biológicos explícitos']};
 fs.mkdirSync(OUTPUT,{recursive:true});fs.writeFileSync(path.join(OUTPUT,'38-4a1-procedencia-semilla.json'),JSON.stringify(result,null,2)+'\n');
 const markdown=['# GENESIS 38.4a1 — Procedencia de la semilla visual','',`Archivos revisados: ${files.length}; asignaciones encontradas: ${hits.length}; laboratorio: ${summary.fixtures}; producción: ${summary.production}.`,'','**Este informe no certifica conformidad de variantes espaciales por sí solo.**','','| Archivo | Línea | Clasificación | Expresión |','|---|---:|---|---|',...prod.map(h=>`| \`${h.file.replace(/\|/g,'\\|')}\` | ${h.line} | ${h.state} | \`${h.expression.replace(/\|/g,'\\|').replace(/`/g,"'").slice(0,110)}\` |`),'','## Revisión obligatoria','',...result.requiredVerification.map(x=>'- '+x),'','## Asignaciones de laboratorio (no prueban producción)','',...hits.filter(h=>h.isFixture).map(h=>`- \`${h.file}:${h.line}\` · \`${h.expression.replace(/`/g,"'").slice(0,110)}\``),''];
 fs.writeFileSync(path.join(OUTPUT,'38-4a1-procedencia-semilla.md'),markdown.join('\n'));
 console.log(`[38.4a1] ${files.length} archivos; ${prod.length} asignaciones de producción; ${summary.spatialPotential} dependencia(s) espacial(es) potencial(es); ${summary.unresolved} origen(es) no demostrado(s).`);
 console.log('Informe: docs/audits/38-4a1/38-4a1-procedencia-semilla.md');
 // No devolver éxito de certificación: el proceso es recopilación, no gate científico.
}
if(require.main===module)main();
module.exports={analyzeFile,classify};
