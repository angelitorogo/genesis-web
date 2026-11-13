'use strict';
/** Audita la UI real sin alterarla. No concede visibilidad ni declara conformidad automática. */
const fs=require('node:fs');
const path=require('node:path');
const root=process.cwd();
const rel='src/app/presentation/life-species-detail/life-species-detail.ts';
const file=path.join(root,rel);
if(!fs.existsSync(file)) {console.error(`No existe ${rel}; no se certifica la ficha`);process.exitCode=2;}
else {
 const lines=fs.readFileSync(file,'utf8').split(/\r?\n/);
 const patterns={
  'VIDA.6 ecosistema':/registro\(\)\?\.ecosystem|\.ecosystem\.species|e\.habitat/,
  'VIDA.6 relaciones':/ecosystem\.relations|relaciones\(\)/,
  'VIDA.7 cultura':/civ\.culture/,
  'VIDA.7 tecnología':/civ\.technology/,
  'Orígenes sin fecha inventada':/No se ha generado una fecha histórica certificada de origen|historicalOriginEpochYears/,
  'Control de acceso explícito':/confirmed|CONFIRMED|confirmado|Confirmado|discovery|descubrimiento|conocimiento|knowledge/,
  'Riesgo de laboratorio':/LAB_ONLY|advanced.*-plan-38-2|fixture/i,
  'Acceso directo a Ground Truth':/privateBiologicalRecordsVIDA9|privateBiospheres|privateEcologicalBiospheres/,
 };
 const checks=Object.fromEntries(Object.entries(patterns).map(([name,re])=>[name,lines.flatMap((text,i)=>re.test(text)?[{line:i+1,text:text.trim().slice(0,220)}]:[])]));
 const report={revision:'GENESIS/38.5/fichas/auditoria-no-destructiva-v1',file:rel,checks,
 verdict:'REVISAR_POLITICA_Y_ENLACE_PRODUCTIVO',
 warnings:['La coincidencia textual no demuestra que una ruta tenga autorización','El nuevo proyector 38.5 no reemplaza automáticamente el componente Angular','No cerrar 38.5 sin probar navegación a fichas desde sistema NO confirmado y confirmado']};
 const dir=path.join(root,'docs/audits/38-5');fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'38-5-fichas-evidencia.json'),JSON.stringify(report,null,2)+'\n');
 const md=['# GENESIS 38.5 — auditoría no destructiva de ficha real','',`Archivo: \`${rel}\``,'',
 ...Object.entries(checks).flatMap(([name,hits])=>[`## ${name}`,`Coincidencias: ${hits.length}`,...hits.slice(0,12).map(h=>`- L${h.line}: \`${h.text.replaceAll('`',"'")}\``),'']),
 '## Estado','No certificada la política de navegación hasta integrar/verificar el proyector en la ficha real.'];
 fs.writeFileSync(path.join(dir,'38-5-fichas-evidencia.md'),md.join('\n')+'\n');
 console.log('38.5: informe de ficha generado; conformidad de acceso NO certificada');
}
