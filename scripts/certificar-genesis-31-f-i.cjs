#!/usr/bin/env node
'use strict';
/**
 * GENESIS 31.F.i -- static runtime-wiring evidence and honest scientific gate.
 * It is NOT a simulation runner and never certifies physical correctness.
 * Runtime/physical certification additionally requires Angular + E2E tests
 * with actual saved dated forcing sources.
 */
const fs = require('node:fs');
const path = require('node:path');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    const full = path.join(dir, d.name);
    return d.isDirectory() ? walk(full) : /\.ts$/.test(d.name) && !/\.spec\.ts$|\.d\.ts$/.test(d.name) ? [full] : [];
  });
}
function withoutComments(code) {
  // Removes TS comments while preserving strings (no call sites can occur
  // in the ignored comment spans). This is heuristic, not an AST proof.
  return code.replace(/\/\*[\s\S]*?\*\/|(^|\s)\/\/[^\n]*/gm, (m, prefix) => prefix || '');
}
function findCalls(files, token, root) {
  const re = token === 'HabitabilityPhysicalIntegration31Fb'
    ? /HabitabilityPhysicalIntegration31Fb\s*\.\s*assessMaterialized\s*\(/g
    : token === 'ObservedHabitabilityFiche31Fe'
      ? /ObservedHabitabilityFiche31Fe\s*\.\s*(?:planet|moon|unresolved)\s*\(/g
      : new RegExp('new\\s+' + token + '\\s*\\(', 'g');
  return files.flatMap(file => {
    const source = withoutComments(fs.readFileSync(file, 'utf8'));
    if (!re.test(source)) return [];
    // Definitions/method bodies inside the component's OWN file are not an
    // external invocation. An imported but unused class is also insufficient.
    if (path.basename(file) === 'habitability-physical-integration-31-f-b.ts' && token === 'HabitabilityPhysicalIntegration31Fb' ||
        path.basename(file) === 'observed-habitability-fiche-31-f-e.ts' && token === 'ObservedHabitabilityFiche31Fe' ||
        path.basename(file) === 'planetary-environmental-evolution-31-f-h.ts' && token === 'PlanetaryEnvironmentalEvolution31Fh' ||
        path.basename(file) === 'planetary-environmental-history-certification-31-f-g.ts' && token === 'PlanetaryEnvironmentalHistoryCertification31Fg') return [];
    return [path.relative(root, file).replaceAll(path.sep, '/')];
  });
}
function audit(root) {
  const source = path.join(root, 'src', 'app');
  const files = walk(source);
  const currentCalls = findCalls(files, 'HabitabilityPhysicalIntegration31Fb', root);
  const observedCalls = findCalls(files, 'ObservedHabitabilityFiche31Fe', root);
  const historyBridgeCalls = findCalls(files, 'PlanetaryEnvironmentalHistoryCertification31Fg', root);
  const evolutionCalls = findCalls(files, 'PlanetaryEnvironmentalEvolution31Fh', root);
  const checks = Object.freeze({
    physicalCurrent: Object.freeze({ state: currentCalls.length ? 'RUNTIME_CALL_DETECTED' : 'NOT_DETECTED', files: currentCalls }),
    observedCards: Object.freeze({ state: observedCalls.length ? 'RUNTIME_CALL_DETECTED' : 'NOT_DETECTED', files: observedCalls }),
    historicalReconstruction: Object.freeze({ state: historyBridgeCalls.length ? 'RUNTIME_CALL_DETECTED' : 'NOT_DETECTED', files: historyBridgeCalls }),
    historicalEvolution: Object.freeze({ state: evolutionCalls.length ? 'RUNTIME_CALL_DETECTED' : 'NOT_DETECTED', files: evolutionCalls }),
  });
  // No scenario permits a static scan to declare an actual dated-trajectory
  // catalog or a scientifically justified history. Even detecting new() isn't
  // proof that a data source exists or the code is reached at runtime.
  return Object.freeze({
    contractVersion: '31.F.i-audit-v1',
    kind: 'STATIC_WIRING_EVIDENCE_NOT_PHYSICAL_CERTIFICATION',
    checks,
    historicalEnvironmentalCoverage: 'NOT_CERTIFIED_BY_STATIC_AUDIT',
    scientificPhaseClosure: 'NOT_CERTIFIED',
    requiredEvidence: Object.freeze([
      'E2E_MATERIALIZED_V2_SINGLE_BINARY_TRIPLE_AND_COMPACT',
      'ACTUAL_DATED_INDEPENDENT_ENVIRONMENTAL_FORCING_CATALOG',
      'DATED_PRESSURE_WATER_RADIATION_STABILITY_AND_CROSS_EVENT_COVERAGE',
      'REPRODUCIBLE_HISTORICAL_31_7_31_8_31_9_AND_OBSERVATION_PERMISSIONS',
    ]),
  });
}
if (require.main === module) {
  const rootIndex = process.argv.indexOf('--root');
  const root = rootIndex < 0 ? path.resolve(__dirname, '..') : path.resolve(process.argv[rootIndex + 1] || '.');
  const result = audit(root);
  if (process.argv.includes('--json')) console.log(JSON.stringify(result, null, 2));
  else {
    console.log('GENESIS — 31.F.i: Certificacion cientifica (NO_CERTIFICADA)');
    for (const [key, entry] of Object.entries(result.checks)) {
      console.log('  ' + key + ': ' + entry.state);
      for (const file of entry.files) console.log('    - ' + file);
    }
    console.log('  Cobertura historica: ' + result.historicalEnvironmentalCoverage);
    console.log('  Cierre fase 31: ' + result.scientificPhaseClosure);
    console.log('  Nota: un auditor estatico nunca sustituye pruebas fisicas reales ni E2E.');
  }
  if (process.argv.includes('--strict')) process.exitCode = result.scientificPhaseClosure === 'CERTIFIED' ? 0 : 1;
}
module.exports = { audit };
