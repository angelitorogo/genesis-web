'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const archive = path.join(root, 'src/app/presentation/genesis-archive');
const facade = fs.readFileSync(path.join(archive, 'archive-discovery-detail.facade.ts'), 'utf8');
const tests = fs.readFileSync(path.join(archive, 'archive-scientific-stage-live-sync.spec.ts'), 'utf8');
const checks = [
  ['revisión del nivel persistido antes de ejecutar', /const persistedBeforeAction = await this\.repositories\.discoveryRepository\s*\.getState\(generationKey, locator\)/.test(facade)],
  ['comparación del nivel de la ficha con el persistido', /persistedBeforeAction\.code !== model\.discoveryState\.code/.test(facade)],
  ['reconstrucción solo de lectura para la ficha obsoleta', /const synchronized = await this\.resolveDetails\(\s*request, null, true, this\.lastCommittedGalacticObjectState/.test(facade)],
  ['operación de observación únicamente en la ruta habitual', (facade.match(/\.commitAction\(/g) || []).length === 1],
  ['sin doble concesión de PD en recuperación', /no se ha repetido la observación ni concedido PD/.test(facade)],
  ['reconocimiento de la elegibilidad rechazada en transacción', /isStateEligible=false/.test(facade)],
  ['lectura del estado real tras conflicto', /persistedAfterFailure = await this\.repositories\.discoveryRepository\s*\.getState/.test(facade)],
  ['recuperación sin desmontar el 3D', /this\.resolveDetails\(\s*request, null, true, this\.lastCommittedGalacticObjectState/.test(facade)],
  ['control de actualización cuando falla la conciliación', /this\.refreshRequiredSignal\.set\(true\)/.test(facade)],
  ['regresión detectado a descubierto', tests.includes('newly DETECTED extreme object')],
  ['regresión visitado a catalogado', tests.includes('VISITED/Identidad científica')],
  ['regresión previo a nueva acción', tests.includes('before submitting a stale action')],
  ['regresión conflicto de transacción', tests.includes('transactional recheck')],
  ...['archive-discovery-detail.facade.spec.ts', 'archive-discovery-detail.spec.ts', 'archive-scientific-stage-live-sync.spec.ts'].map(name => [
    'imports Vitest explícitos en ' + name,
    /import\s*\{[^}]*describe[^}]*\}\s*from\s*['"]vitest['"]/.test(fs.readFileSync(path.join(archive,name),'utf8')),
  ]),
];
for (const [label, ok] of checks) {assert.ok(ok,label); console.log('OK',label)}
console.log(`GENESIS LIVE-SCI.2: ${checks.length}/${checks.length} verificaciones estructurales superadas.`);
