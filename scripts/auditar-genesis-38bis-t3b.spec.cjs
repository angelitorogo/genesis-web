'use strict';
/** Auditoría portable (sin node_modules) de los límites de apertura y confirmación. */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const facade=read('src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-38-bis.facade.ts');
const repo=read('src/app/data/local/repository/dexie-discovery.repository.ts');
const store=read('src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-38-bis.store.ts');
const test=read('src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-t3b-fast-opening.spec.ts');
const part=facade.split('  async load(raw:UniversalArchiveParameters38Bis)')[1]
  .split('  /** Only watch the small durable queue')[0];
assert(part,'No se encontró el flujo de apertura de Archivo');
assert(part.includes('this.index.store.openingSnapshot38BisT3b(scope)'), 'Apertura sin una lectura transaccional unificada');
assert(store.includes("this.transaction('r',this.sections,this.sortRevisions,this.progressCheckpoints,this.dirtyJobs"),
  'Snapshot no lee índices y cola en una transacción única');
assert(!part.includes('this.index.store.progressFor(scope)'), 'Apertura sigue con lecturas separadas');
assert(!part.includes('this.index.store.sectionsFor(scope)'), 'Apertura con doble lectura de secciones');
assert(!part.includes('this.reloadIndexProgress(scope)'), 'Apertura sigue releeyendo el progreso');
assert(!part.includes('await this.index.ensure('), 'Apertura sigue verificando ciencia');
assert(!part.includes('void this.backgroundIndex('), 'Apertura dispara barrido universal');
assert(repo.includes('archiveConfirmedStateChanged38BisT3b(existing?.discoveryStateCode,state.code)'),
  'El repositorio sigue notificando estados no confirmados');
assert(repo.includes('archiveConfirmedStateChanged38BisT3b(previous?.discoveryStateCode,undefined)'),
  'Baja de conocimiento sin comprobación de confirmación');
assert(test.includes('sections).toHaveLength(210)'),'Falta fixture de 210 fragmentos');
assert(test.includes('expect(openingSnapshot38BisT3b).toHaveBeenCalledTimes(1)'),'Falta test de única lectura');
assert(test.includes('expect(ensure).not.toHaveBeenCalled()'),'Falta test de no revisar ciencia');
console.log('GENESIS 38.bis-T3b · PASS · apertura unificada, 0 revisiones científicas, eventos CONFIRMED.');
