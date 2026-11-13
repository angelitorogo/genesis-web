'use strict';
/** Trazabilidad de las fórmulas de species.id: informe conservador, sin certificar estabilidad por coincidencias. */
const fs=require('node:fs'),path=require('node:path');
const ROOT=process.cwd();
const BASE=path.join(ROOT,'src/app');
const OUTPUT=path.join(ROOT,'docs/audits/38-4a3');
const REL='src/app/presentation/life-species-visual/vida38-species-visual-contract.ts';
const SPATIAL=/\b(?:bodyStorageKey|planet(?:Id|Index|Key)?|moon(?:Id|Index|Key)?|system(?:Id|Index|Key)?|galaxy(?:Id|Index|Key)?|sector(?:Id|Index|X|Y)?|coordinates?|location|world(?:Id|Index|Key)?|universeSeed)\b/i;
function walk(dir,result){if(!fs.existsSync(dir))return;for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p,result);else if(e.isFile()&&p.endsWith('.ts')&&!p.endsWith('.spec.ts'))result.push(p);}}
function inspect(root=ROOT){const files=[];walk(path.join(root,'src/app'),files);const evidence=[];
 for(const f of files){const name=path.relative(root,f).replaceAll('\\','/');
  if(!/(?:life|vida6|vida38)/i.test(name))continue;
  const lines=fs.readFileSync(f,'utf8').split(/\r?\n/);
  for(let i=0;i<lines.length;i++){
   if(!/\b(?:speciesId|species\.id|\bid\s*:|\bid\s*=)/.test(lines[i]))continue;
   if(!/(?:species|ecosystem|vida6)/i.test(name))continue;
   const start=Math.max(0,i-3),end=Math.min(lines.length,i+4);
   const fragment=lines.slice(start,end).join('\n');
   evidence.push({file:name,line:i+1,fragment:fragment.slice(0,900),spatialCandidate:SPATIAL.test(fragment)});
  }
 }
 const mapper=path.join(root,REL);const mapperText=fs.existsSync(mapper)?fs.readFileSync(mapper,'utf8'):'';
 const confirmedMapper=mapperText.includes('`VIDA.38.1|${species.id}`')&&mapperText.includes('variantSeedUint32: hash32(identity)');
 const candidates=evidence.filter(e=>e.file.includes('/simulation/life/')||e.file.includes('/domain/life/'));
 return {revision:'GENESIS/38.4a3/vida6-id-trace/v1',filesReviewed:files.length,mapperIdentityDerivedFromSpeciesId:confirmedMapper,vida6Candidates:candidates,spatialCandidateCount:candidates.filter(c=>c.spatialCandidate).length,verdict:'REQUIERE_VALIDACION_GENERADOR',limitations:['Coincidencias textuales NO prueban la dependencia transitiva de species.id.','Un ID biológico puede codificar su origen natal legítimo: estabilidad entre vistas exige conservar ese mismo ID, no regenerarlo en otro mundo.','La prueba de JSON NO equivale a un backup/restore IndexedDB real.','Para certificar generación VIDA.6 son necesarios fixtures productivos y acceso al generador/repository real.']};
}
function main(){const result=inspect();fs.mkdirSync(OUTPUT,{recursive:true});fs.writeFileSync(path.join(OUTPUT,'38-4a3-identidad-vida6.json'),JSON.stringify(result,null,2)+'\n');
 const rows=['# GENESIS — 38.4a3 · Trazabilidad de `species.id` VIDA.6','',`Archivos TS revisados: ${result.filesReviewed}`,`Mapper anclado a species.id: ${result.mapperIdentityDerivedFromSpeciesId?'sí':'NO VERIFICADO'}`,`Candidatos de asignación/uso en VIDA: ${result.vida6Candidates.length}`,`Candidatos con términos espaciales cercanos: ${result.spatialCandidateCount}`,'','## Evidencias','',...result.vida6Candidates.slice(0,150).map(c=>`- \`${c.file}:${c.line}\` ${c.spatialCandidate?'[REVISAR CONTEXTO ESPACIAL]':''} — \`${c.fragment.split('\n').map(x=>x.trim()).join(' ').slice(0,300)}\``),'','## Límites de certificación','',...result.limitations.map(s=>'- '+s),'','**Veredicto:** REQUIERE_VALIDACION_GENERADOR (no bloquear build por un auditor conservador).',''];fs.writeFileSync(path.join(OUTPUT,'38-4a3-identidad-vida6.md'),rows.join('\n'));
 console.log(`38.4a3: ${result.filesReviewed} archivos; ${result.vida6Candidates.length} referencias VIDA; ${result.spatialCandidateCount} candidatas espaciales; ${result.verdict}`);
}
if(require.main===module)main();module.exports={inspect};
