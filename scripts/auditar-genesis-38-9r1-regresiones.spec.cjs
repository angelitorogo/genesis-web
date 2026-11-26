#!/usr/bin/env node
'use strict';
/** GENESIS 38.9R1: auditor estático. No sustituye ng test ni ng build. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const facade = read('src/app/presentation/genesis-archive/archive-discovery-detail.facade.ts');
const tests = read('src/app/presentation/genesis-archive/archive-discovery-detail.facade.spec.ts');
const archiveTests = read('src/app/presentation/genesis-archive/genesis-archive.spec.ts');
const layoutTests = read('src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-list-layout-38-bis-b2.spec.ts');
const template = read('src/app/presentation/genesis-archive/genesis-archive.html');
let checked = 0;
function check(description, condition) {
  assert.ok(condition, description);
  checked++;
  console.log('OK', description);
}
check('La plantilla usa progreso ARCHFAST.1 real', template.includes('facade.updateJobsArchfast1()'));
check('El mock de Archivo implementa la señal ARCHFAST.1', archiveTests.includes('updateJobsArchfast1,') && archiveTests.includes('const updateJobsArchfast1=signal'));
check('El mock de layout implementa la señal ARCHFAST.1', layoutTests.includes('updateJobsArchfast1:signal([])'));
check('Se prueba el progreso por campo, categoría y galaxia', archiveTests.includes('7 / 12') && archiveTests.includes('Erylaune') && archiveTests.includes('archive-maintenance-detail'));
check('El mock de progreso se reinicia entre pruebas', archiveTests.includes('updateJobsArchfast1.set([])'));
check('El resultado del análisis de jets se relee después de persistir', facade.includes('await this.relativisticJetAnalysisObservationRuntime.inspect('));
check('El resultado de lentes se relee después de persistir', facade.includes('await this.gravitationalLensingReconstructionObservationRuntime.inspect('));
check('Se preserva la sincronización no bloqueante de núcleos', facade.includes('void this.resolveNucleusSupplementaryScience('));
check('Se evita publicar respuestas obsoletas de otros núcleos', (facade.match(/if \(resolvedVersion !== this\.resolutionVersion\) return;/g)||[]).length === 2);
check('La ficha se conserva si el análisis auxiliar se actualiza', (facade.match(/model: Object\.freeze\(\{ \.\.\.current\.model,/g)||[]).length>=2);
check('No se interpreta ausencia de lectura como no detección', (facade.match(/if \(status === null \|\| !status\.analyzed\)/g)||[]).length===2);
check('El feedback de jets procede de los datos confirmados', facade.includes("fact.value === 'Firma de jet relativista colimado detectada'"));
check('El feedback de lentes procede de los datos confirmados', facade.includes("fact.value === 'Configuración de lente gravitacional reconstruible detectada'"));
check('Los tests esperan asincronía 28.5/28.6', (tests.match(/await vi\.waitFor/g)||[]).length >= 5);
check('Hay una regresión de lectura tardía con estado persistido', tests.includes('does not report a 28.5 non-detection'));
check('La acción científica original se conserva', facade.includes('this.relativisticJetAnalysisObservationRuntime.analyze(') && facade.includes('this.gravitationalLensingReconstructionObservationRuntime.analyze('));
console.log(`GENESIS 38.9R1: ${checked}/${checked} comprobaciones estáticas correctas.`);
