'use strict';
// VISCIV.6l — portable audit: verifies actual TS pure plans without WebGL.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const base = path.join(root, 'src/app/presentation/system');
const file = name => fs.readFileSync(path.join(base, name), 'utf8');
const compile = (src, name) => {
  const compiled = ts.transpileModule(src, { fileName: name, compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  }, reportDiagnostics: true });
  const errors = (compiled.diagnostics ?? []).filter(d => d.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, `${name}: sintaxis TypeScript`);
  return compiled.outputText;
};
const evaluate = (source, name, mocks = {}) => {
  const exports = {};
  vm.runInNewContext(compile(source, name), {
    exports,
    require(id) {
      if (id === 'three') return {}; // Only pure procedural plan builders called.
      if (id.endsWith('system-scene-orbital-detail-visciv5')) return {};
      if (id.endsWith('system-scene-orbital-illumination-visciv6j')) return {};
      if (Object.prototype.hasOwnProperty.call(mocks, id)) return mocks[id];
      throw new Error(`VISCIV.6l: dependencia inesperada: ${id}`);
    },
  }, { filename: name });
  return exports;
};

const tempoSource = file('system-scene-orbital-tempo-visciv6l.ts');
const tempo = evaluate(tempoSource, 'system-scene-orbital-tempo-visciv6l.ts');
const rates = tempo.ORBITAL_VISUAL_TEMPO_VISCIV6l;
assert.deepEqual(Object.keys(rates).sort(), ['CONVOY', 'SATELLITE', 'SHUTTLE', 'STATION', 'TERMINAL']);
for (const rate of Object.values(rates)) assert(rate > 0 && rate < 0.5);
const orbits = file('system-scene-artificial-satellites-visciv2.ts');
const traffic = file('system-scene-orbital-traffic-visciv6k.ts');
const mockedTraffic = {
  createOrbitalTrafficVisualVISCIV6k() { throw new Error('No se debe generar WebGL en el auditor'); },
  updateOrbitalTrafficVISCIV6k() { throw new Error('No se debe generar WebGL en el auditor'); },
};
const orbitalExports = evaluate(orbits, 'system-scene-artificial-satellites-visciv2.ts', {
  './system-scene-orbital-tempo-visciv6l': tempo,
  './system-scene-orbital-traffic-visciv6k': mockedTraffic,
});
const trafficExports = evaluate(traffic, 'system-scene-orbital-traffic-visciv6k.ts', {
  './system-scene-orbital-tempo-visciv6l': tempo,
});
const buildSatellites = orbitalExports.buildSystemSceneArtificialSatellitePlansV1;
const buildStations = orbitalExports.buildSystemSceneOrbitalStationPlansV1;
const buildRings = orbitalExports.buildSystemSceneOrbitalRingPlansV1;
const buildTraffic = trafficExports.buildOrbitalTrafficPlansVISCIV6k;
const eps = 1e-9;
let orbitalBodies = 0;
let craftTotal = 0;
for (let index = 0; index < 2048; index += 1) {
  const seed = Math.imul(index + 1, 7919) >>> 0;
  for (const tier of ['ADVANCED', 'VERY_ADVANCED']) {
    const satellites = buildSatellites(seed, tier, 1);
    for (const plan of satellites) {
      const oldUnit = Math.abs(plan.angularSpeedRadiansPerDay) / rates.SATELLITE
        * Math.max(1.1, plan.orbitRadiusPlanetRadii ** 2);
      assert(oldUnit >= 0.7 - eps && oldUnit <= 1.8 + eps, 'satélite: velocidad inesperada');
      assert(plan.angularSpeedRadiansPerDay !== 0, 'satélite: movimiento parado');
      orbitalBodies++;
    }
    const stations = buildStations(seed, tier, 1);
    if (tier === 'ADVANCED') assert.equal(stations.length, 0);
    else assert(stations.length >= 1);
    for (const plan of stations) {
      const oldUnit = Math.abs(plan.angularSpeedRadiansPerDay) / rates.STATION
        * Math.max(1.4, plan.orbitRadiusPlanetRadii ** 2);
      assert(oldUnit >= 0.24 - eps && oldUnit <= 0.66 + eps, 'estación: velocidad inesperada');
      assert(plan.angularSpeedRadiansPerDay !== 0, 'estación: movimiento parado');
      orbitalBodies++;
    }
  }
  const rings = buildRings(seed, 'VERY_ADVANCED');
  for (const ring of rings) {
    const first = buildTraffic(ring);
    assert.equal(JSON.stringify(first), JSON.stringify(buildTraffic(ring)), 'tráfico no determinista');
    for (const craft of first) {
      const oldSpeed = craft.speedCyclesPerDay / rates[craft.role];
      const [lower, upper] = craft.role === 'CONVOY' ? [0.035, 0.051]
        : craft.role === 'SHUTTLE' ? [0.052, 0.074] : [0.12, 0.168];
      assert(oldSpeed >= lower - eps && oldSpeed <= upper + eps, 'tráfico: velocidad inesperada');
      assert(craft.speedCyclesPerDay > 0, 'tráfico parado');
      craftTotal++;
    }
  }
}
const scene = file('system-scene.ts');
const preview = fs.readFileSync(
  path.join(root, 'src/app/presentation/scientific-body-preview/scientific-body-preview.ts'), 'utf8',
);
for (const [where, src] of [['SystemScene', scene], ['ficha 3D', preview]]) {
  assert(src.includes('binding.angularSpeedRadiansPerDay'), `${where}: falta giro orbital`);
  assert(src.includes('updateOrbitalRingTrafficVISCIV6k'), `${where}: falta tráfico orbital`);
}
console.log(`VISCIV.6l: PASS — ${orbitalBodies} satélites/estaciones, ${craftTotal} vehículos, velocidad lenta positiva y determinismo.`);
console.log('Multiplicadores:', rates);
