'use strict';
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const base='src/app/presentation/genesis-archive/';
const files=[
`${base}38-bis/genesis-universal-archive-38-bis.index.ts`,
`${base}38-bis/genesis-universal-archive-38-bis.store.ts`,
`${base}38-bis/genesis-universal-archive-autoindex-38-bis-b6.ts`,
`${base}38-bis/genesis-universal-archive-dirty-38-bis-b6.ts`,
`${base}38-bis/genesis-universal-archive-38-bis.facade.ts`,
`${base}38-bis/genesis-universal-archive-archfast1.spec.ts`,
`${base}genesis-archive.ts`,
];
let checks=0;
for(const file of files){
 const text=fs.readFileSync(path.join(root,file),'utf8');
 const parsed=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
 if(parsed.parseDiagnostics.length)throw new Error(`${file}: ${parsed.parseDiagnostics.map(e=>e.messageText).join('; ')}`);
 checks++;
}
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const index=read(files[0]);const store=read(files[1]);const auto=read(files[2]);
const facade=read(files[4]);const html=read(`${base}genesis-archive.html`);
const assertions=[
 [index.includes('archiveFastSnapshot') && index.includes('invalidateArchiveFastGalaxy'), 'instantánea galáctica invalidable'],
 [index.includes('previousFingerprint') && index.includes('this.archiveFastSnapshot.biological.set'), 'huellas biológicas compartidas'],
 [index.includes('ensureUsedSortsArchfast1') && index.includes('sourceRows=await this.store.sortSourceRowsArchfast1'), 'una lectura por conjunto de ordenaciones'],
 [store.includes('outdatedSortFieldsArchfast1') && store.includes('sortSourceRowsArchfast1'), 'revisión de campos sin leer filas'],
 [store.includes('current.serial!==claimed.serial'), 'progreso protegido ante cambios concurrentes'],
 [auto.includes('isBulkGalaxyConfirmationActive()'), 'barrera contra la confirmación activa'],
 [auto.includes('ensureUsedSortsArchfast1') && auto.includes('setKnowledgeChangeProgressArchfast1'), 'progreso por campo real'],
 [facade.includes('updateJobsSignalArchfast1'), 'estado de cola conectado a Angular'],
 [html.includes('archive-maintenance-detail') && html.includes('job.currentField'), 'detalle de galaxia/categoría/ordenación visible'],
 [html.includes('job.error'), 'errores de mantenimiento visibles'],
 [read(files[5]).includes("'una nueva revisión invalida") && read(files[5]).includes("'un error no destruye"), 'regresiones de revisión y errores'],
];
for(const [ok,label] of assertions){if(!ok)throw new Error(`ARCHFAST.1: ${label}`);checks++;}
console.log(`ARCHFAST.1: ${checks}/${checks} verificaciones estructurales y sintácticas correctas.`);
