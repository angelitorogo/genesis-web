#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
let ts;
try { ts = require('typescript'); }
catch { console.error('Falta typescript: instala las dependencias del proyecto antes de ejecutar la auditoría.'); process.exit(1); }

const source = fs.readFileSync(path.resolve(__dirname, '../src/app/presentation/system/system-scene-artificial-satellites-visciv2.ts'), 'utf8');
const result = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }, reportDiagnostics: true });
assert.equal(result.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error).length ?? 0, 0, 'Transpilación TS');
const orbitalExports = {};
const ctx = {
  exports: orbitalExports, Math, Object, Number, Array, Set, Map,
  require(name) {
    if (name === 'three' || name.endsWith('system-scene-orbital-detail-visciv5')) return {};
    throw new Error('Dependencia inesperada: ' + name);
  },
};
vm.runInNewContext(result.outputText, ctx, { filename: 'system-scene-artificial-satellites-visciv2.js' });
const rings = orbitalExports.buildSystemSceneOrbitalRingPlansV1;
const stations = orbitalExports.buildSystemSceneOrbitalStationPlansV1;
const satellites = orbitalExports.buildSystemSceneArtificialSatellitePlansV1;
const counts = new Set();
const kinds = new Set();
let samples = 0;
for (let i = 0; i < 2048; i++) {
  const seed = Math.imul(7919, i + 1) >>> 0;
  const plans = rings(seed, 'VERY_ADVANCED');
  counts.add(plans.length);
  assert(plans.length >= 1 && plans.length <= 3);
  assert(stations(seed, 'VERY_ADVANCED', 1).length >= 1);
  assert(satellites(seed, 'VERY_ADVANCED', 1).length >= 9);
  assert.equal(rings(seed, 'ADVANCED').length, 0);
  assert.equal(stations(seed, 'ADVANCED', 1).length, 0);
  assert.equal(JSON.stringify(plans), JSON.stringify(rings(seed, 'VERY_ADVANCED')), 'CT-0 determinista');
  plans.forEach(p => { kinds.add(p.ringKind); assert(p.structuralThicknessFactor > 0.5); assert(p.bandWidthPlanetRadii > 0.07); });
  for (let j = 1; j < plans.length; j++) {
    const previous = plans[j-1], current = plans[j];
    assert(current.orbitRadiusPlanetRadii - previous.orbitRadiusPlanetRadii -
      (current.bandWidthPlanetRadii + previous.bandWidthPlanetRadii) / 2 > 0.30);
  }
  samples++;
}
assert.equal([...counts].sort().join(','), '1,2,3');
assert.equal([...kinds].sort().join(','), 'HABITAT,INDUSTRIAL,TRANSPORT');
console.log(`VISCIV.6g OK: ${samples} semillas, anillos 1/2/3, tres tipologías, sin solapamiento radial, ADVANCED intacta.`);
