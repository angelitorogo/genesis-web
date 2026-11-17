#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
let ts;
try { ts = require('typescript'); } catch {
  console.error('Falta typescript. Ejecuta npm ci en GENESIS antes de la auditoría.');
  process.exit(1);
}
const source = fs.readFileSync(path.join(__dirname,
  '../src/app/presentation/system/system-scene-artificial-satellites-visciv2.ts'), 'utf8');
const result = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
}, reportDiagnostics: true });
assert.equal(result.diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);
const outputs = {};
vm.runInNewContext(result.outputText, {
  exports: outputs,
  require: name => name === 'three' || name.endsWith('system-scene-orbital-detail-visciv5')
    ? {} : (() => { throw new Error('Dependencia inesperada: ' + name); })(),
  Math, Array, Object, Number, Set, Map,
});
const plans = outputs.buildSystemSceneOrbitalRingPlansV1;
const sats = outputs.buildSystemSceneArtificialSatellitePlansV1;
const stations = outputs.buildSystemSceneOrbitalStationPlansV1;
const reference = [
  { seed: 0, incl: 0.4350150234715746, node: 1.881757117072377 },
  { seed: 7919, incl: 0.41744936615717954, node: 2.320943614392238 },
];
for (const p of reference) {
  const [ring] = plans(p.seed, 'VERY_ADVANCED');
  assert.equal(plans(p.seed, 'VERY_ADVANCED').length, 1);
  assert(Math.abs(ring.inclinationRadians - p.incl) < 1e-12, 'anillo único conserva inclinación');
  assert(Math.abs(ring.ascendingNodeRadians - p.node) < 1e-12, 'anillo único conserva nodo');
}
const normal = ring => {
  // Three.js Euler order XYZ used by ring.group.rotation.x/z
  const x = ring.inclinationRadians, z = ring.ascendingNodeRadians;
  return [-Math.sin(z), Math.cos(z) * Math.cos(x), Math.cos(z) * Math.sin(x)];
};
const degreesBetween = (a, b) => {
  const na = normal(a), nb = normal(b);
  const dot = Math.max(-1, Math.min(1, na.reduce((sum, val, i) => sum + val * nb[i], 0)));
  return Math.acos(dot) * (180 / Math.PI);
};
const counts = new Set();
let minimumAngular = Infinity, maximumAngular = 0, minimumShellClearance = Infinity;
for (let i = 0; i < 4096; i++) {
  const seed = Math.imul(i+1, 7919) >>> 0;
  const rings = plans(seed, 'VERY_ADVANCED');
  counts.add(rings.length);
  assert(rings.length >= 1 && rings.length <= 3);
  assert.equal(JSON.stringify(rings), JSON.stringify(plans(seed, 'VERY_ADVANCED')), 'determinismo');
  assert(sats(seed, 'VERY_ADVANCED', 1).length >= 9);
  assert(stations(seed, 'VERY_ADVANCED', 1).length >= 1);
  assert.equal(plans(seed, 'ADVANCED').length, 0);
  assert.equal(stations(seed, 'ADVANCED', 1).length, 0);
  for (let j = 0; j < rings.length; j++) {
    const ring = rings[j];
    assert(Number.isFinite(ring.inclinationRadians));
    assert(Number.isFinite(ring.ascendingNodeRadians));
    assert(ring.inclinationRadians > 0 && ring.inclinationRadians < 0.7);
    assert(ring.ascendingNodeRadians >= 0 && ring.ascendingNodeRadians < 2*Math.PI);
    for (let k = 0; k < j; k++) {
      const angle = degreesBetween(rings[k], ring);
      minimumAngular = Math.min(minimumAngular, angle);
      maximumAngular = Math.max(maximumAngular, angle);
      assert(angle > 5 && angle < 35, `separación angular inadecuada: ${angle.toFixed(2)}°`);
    }
    if (j === 0) continue;
    const prev = rings[j - 1];
    const shellA = prev.bandWidthPlanetRadii / 2 + 0.12;
    const shellB = ring.bandWidthPlanetRadii / 2 + 0.12;
    const clearance = ring.orbitRadiusPlanetRadii - prev.orbitRadiusPlanetRadii - shellA - shellB;
    minimumShellClearance = Math.min(minimumShellClearance, clearance);
    assert(clearance > 0.06, `separación insuficiente: ${clearance.toFixed(4)} R⊕`);
  }
}
assert.equal([...counts].sort().join(','), '1,2,3');
console.log(`VISCIV.6h OK: 4096 semillas; anillos 1/2/3; distancias entre planos `+
  `${minimumAngular.toFixed(1)}°–${maximumAngular.toFixed(1)}°; separación radial mínima `+
  `${minimumShellClearance.toFixed(3)} radios planetarios; CT-0 determinista; ADVANCED sin anillos.`);
