'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../src/app/presentation');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('sin leer materializaciones vacías como recuento definitivo en nueva partida',()=>{
 const src=read('galaxy-knowledge-catalog/galaxy-civilization-known-index.ts');
 assert.match(src,/ensureVida9PlanetsInBackground\(key,galaxyIndex,confirmed\)/);
 assert.match(src,/await backfill/);
 assert.match(src,/outcome\.indexed===outcome\.expected/);
 assert.match(src,/restoreCivilizationKnowledgeIndex\(saved\.civilizationKnowledgeJson/);
});
test('no se indexan 81.681 lunas en el hilo principal de la aplicación',()=>{
 const src=read('runtime/galaxy-planet-moon-catalog-snapshot.runtime.ts');
 assert.match(src,/scheduleVida9MoonsInBackground/);
 assert.match(src,/await planets;[\s\S]*?await scheduleVida9MoonsInBackground/);
 assert.match(src,/indexer instanceof Vida9ConfirmedSystemBiologyIndexer/);
});
test('los registros existentes son fuente autoritativa e inmutable',()=>{
 const src=read('runtime/vida9-confirmed-system-biology-indexer.ts');
 assert.match(src,/await existingFor\(identity\)/);
 assert.match(src,/getOrInsertPreservingExisting\(record\)/);
 assert.doesNotMatch(src,/privateBiologicalRecordsVIDA9\.put\(/);
});
test('el worker genera solo para sistemas confirmados y mantiene fuente V3',()=>{
 const src=read('runtime/vida9-background-materializer.worker.ts');
 assert.match(src,/vida9V3ConfirmedPhysicalTargets\(key,system\)/);
 assert.match(src,/ensureConfirmedCatalog\(key,empty\(/);
 assert.match(src,/missingPhysical\+\+/);
 assert.doesNotMatch(src,/DiscoveryState\.CONFIRMED\s*=|\.setState\(/);
});
test('la caché de conocimiento usa revisión real de sistemas confirmados',()=>{
 const src=read('galaxy-knowledge-catalog/galaxy-civilization-known-index.ts');
 assert.match(src,/confirmedCivilizationKnowledgeRevision\(newest\)!==revision/);
 assert.match(src,/this\.db\.galaxyKnowledgeSnapshots\.put\(payload\)/);
});
