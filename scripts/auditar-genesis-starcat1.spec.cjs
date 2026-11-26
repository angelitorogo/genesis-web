'use strict';
/** STARCAT.1 — Auditoría de contratos y sintaxis, ejecutable sin navegador. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
let total=0;
function check(label,condition){assert.ok(condition,label);total++;console.log('  OK',label);}
const src='src/app/presentation/';
const star=read(src+'galaxy-knowledge-catalog/galaxy-knowledge-stars-catalog.data-source.ts');
const cat=read(src+'galaxy-knowledge-catalog/galaxy-knowledge-catalog.model.ts');
const dispatch=read(src+'galaxy-knowledge-catalog/galaxy-knowledge-catalog.data-source.ts');
const archive=read(src+'genesis-archive/38-bis/genesis-universal-archive-38-bis.model.ts');
const dirty=read(src+'genesis-archive/38-bis/genesis-universal-archive-dirty-38-bis-b6.ts');
const store=read(src+'genesis-archive/38-bis/genesis-universal-archive-38-bis.store.ts');
const idx=read(src+'genesis-archive/38-bis/genesis-universal-archive-38-bis.index.ts');
const auto=read(src+'genesis-archive/38-bis/genesis-universal-archive-autoindex-38-bis-b6.ts');
const sort=read(src+'genesis-archive/38-bis/genesis-universal-archive-sort-38-bis-b3.ts');
const globalHtml=read(src+'genesis-archive/genesis-archive.html');
const galaxyHtml=read(src+'galaxy-detail/galaxy-detail.html');
const localHtml=read(src+'galaxy-knowledge-catalog/galaxy-knowledge-catalog.html');
console.log('GENESIS STARCAT.1 · Auditoría');
check('Categoría de conocimiento visible',cat.includes("category: 'stars', label: 'Estrellas'"));
check('Catálogo local despachado por la fuente real',dispatch.includes('this.stars.query(request)'));
check('Descripción de la fuente de Estrellas',star.includes('Estrellas conocidas'));
check('Confirmación individual obligatoria',star.includes('DiscoveryState.CONFIRMED.code'));
check('Repositorio de descubrimientos por galaxia',star.includes('getKnownDiscoveriesInGalaxy'));
check('Componentes A/B/C únicos',star.includes('ComponentLabel=')&&star.includes('component,sectorKey:'));
check('Fuentes múltiples coevolutivas V2/V3',star.includes('StellarMultihostFormation.generateOrNull(key,locator)'));
check('Perfil físico en componentes',star.includes('physical.radiusSolar')&&star.includes('physical.effectiveTemperatureKelvin'));
check('Evolución y RGB/AGB',star.includes('postMainSequenceStage')&&star.includes('RED_GIANT_BRANCH'));
check('Tipo espectral científico',star.includes('spectral.spectralType.designation'));
check('Ordenaciones numéricas de magnitudes reales',star.includes('radiusSolar')&&star.includes('sortNumbers:Object.freeze'));
check('Enlace público al sistema de origen',star.includes("'/archive/system',locator.galaxyIndex.toString()"));
check('Enlace completo a escena científica',star.includes("['/system',...record.route.slice(1)]"));
check('Instantáneas temporales acotadas',star.includes('expires:Date.now()+30_000'));
check('Notificaciones invalidan instantánea',star.includes('subscribeGenesisKnowledgeCommits38BisB6'));
check('Prevención de publicación obsoleta',star.includes('seenSerial===this.invalidationSerial'));
check('Rendimiento por sector compartido',star.includes('lastSector!==locator.sectorKey'));
check('Cede CPU durante generación de catálogo',star.includes('i%32===31'));
check('Nueva categoría global tras Sistemas',archive.indexOf("id:'stars'")>archive.indexOf("id:'systems'"));
check('Ordenación global por tipo y evolución',sort.includes('stars:[name,')&&sort.includes("text('evolution'"));
check('Ordenación global por radio y temperatura',sort.includes("number('radius','Radio (R☉)')")&&sort.includes("number('temperature'"));
check('Subtipo global derivado de evolución',idx.includes("category==='stars' ? (row.cells['evolution']"));
check('Revisión de fuente específica',idx.includes('individual-stellar-components-starcat1-v1'));
check('Notificación por confirmación de sistema',/SYSTEM:\[[^\]]*'stars'/.test(dirty));
check('Notificación por confirmación masiva',/GALAXY:\[[^\]]*'stars'/.test(dirty));
check('Notificación por restauración',/RESTORE:\[[^\]]*'stars'/.test(dirty));
check('Evita reindexado en cambios de cuerpo',/BODY:\[[^\]]*\]/.test(dirty)&&!/BODY:\[[^\]]*'stars'/.test(dirty));
check('Migración sólo para nuevas secciones',store.includes('enqueueMissingStarsStarcat1')&&store.includes("section.category==='systems'"));
check('Migración idempotente',store.includes('if(await this.dirtyJobs.get(id))continue'));
check('No se destruyen índices al migrar',!store.slice(store.indexOf('async enqueueMissingStarsStarcat1'),store.indexOf('async enqueueKnowledgeChange38BisB6')).includes('.delete('));
check('Migración invocada en arranque normal',auto.includes('this.index.store.enqueueMissingStarsStarcat1()'));
check('Archivo muestra selector evolutivo',globalHtml.includes('archive-star-evolution-filter'));
check('Ficha galáctica ofrece el enlace',galaxyHtml.includes('galaxy-detail-stars-catalog-link'));
check('Ficha galáctica calcula componentes A/B/C',read(src+'galaxy-detail/galaxy-detail.ts').includes('confirmedStellarComponents('));
check('Catálogo galáctico ofrece filtros RGB/AGB',localHtml.includes("type:'RGB'")&&localHtml.includes("type:'AGB'"));
check('No requiere cambios a esquema Dexie',!store.includes('this.version(5).stores'));
check('No altera los generadores científicos',!star.includes('writeDiscovery')&&!star.includes('saveDiscovery'));
let ts;
try {ts=require('typescript');}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');}
const tsPaths=[
'src/app/presentation/galaxy-knowledge-catalog/galaxy-knowledge-stars-catalog.data-source.ts',
'src/app/presentation/galaxy-knowledge-catalog/galaxy-knowledge-stars-catalog.data-source.spec.ts',
'src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-starcat1.spec.ts',
];
for(const p of tsPaths){
 const result=ts.transpileModule(read(p),{fileName:p,reportDiagnostics:true,
  compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
 const errors=(result.diagnostics??[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
 check('Sintaxis TypeScript: '+path.basename(p),errors.length===0);
}
console.log(`Auditoría STARCAT.1: ${total}/${total} correctas`);
