'use strict';
/** Portable audit of actual pure VISCIV.6k plan builder, not a token search. */
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');

const src = fs.readFileSync(path.resolve(__dirname,
  '../src/app/presentation/system/system-scene-orbital-traffic-visciv6k.ts'), 'utf8');
const compiled = ts.transpileModule(src, { compilerOptions: {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2022,
}, reportDiagnostics: true });
const errors = (compiled.diagnostics ?? []).filter(item => item.category === ts.DiagnosticCategory.Error);
if (errors.length) throw new Error(errors.map(error => ts.flattenDiagnosticMessageText(error.messageText, '\n')).join('\n'));
// VISCIV.6l: load the real shared visual tempo module for the pure-plan audit.
// The traffic source now imports this pure helper; neither module needs WebGL.
const tempoSrc = fs.readFileSync(path.resolve(__dirname,
  '../src/app/presentation/system/system-scene-orbital-tempo-visciv6l.ts'), 'utf8');
const tempoCompiled = ts.transpileModule(tempoSrc, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
}, reportDiagnostics: true });
const tempoErrors = (tempoCompiled.diagnostics ?? []).filter(item => item.category === ts.DiagnosticCategory.Error);
if (tempoErrors.length) throw new Error(tempoErrors.map(error => ts.flattenDiagnosticMessageText(error.messageText, '\n')).join('\n'));
const tempoContext = { exports: {} };
vm.runInNewContext(tempoCompiled.outputText, tempoContext, { filename: 'orbital-tempo-visciv6l.js' });
const context = { exports: {}, require(name) {
  if (name === 'three') return {}; // Pure plan function never constructs Three.js objects.
  if (name === './system-scene-orbital-tempo-visciv6l') return tempoContext.exports;
  throw new Error(`Unexpected runtime import: ${name}`);
} };
vm.runInNewContext(compiled.outputText, context, { filename: 'orbital-traffic-visciv6k.js' });
const build = context.exports.buildOrbitalTrafficPlansVISCIV6k;
if (typeof build !== 'function') throw new Error('VISCIV.6k: builder not exported');
let inspected = 0;
for (const kind of ['HABITAT', 'INDUSTRIAL', 'TRANSPORT']) {
  for (let seed = 0; seed < 4096; seed += 1) {
    const plan = {
      orbitRadiusPlanetRadii: 1.74 + (seed % 17) * 0.08,
      inclinationRadians: 0.18, ascendingNodeRadians: (seed % 29) * 0.04,
      phaseRadians: 0.2, angularSpeedRadiansPerDay: 0.02,
      ringKind: kind, structureColorHex: '#abbfdb', moduleColorHex: '#d4efff',
      moduleCount: 20, structuralThicknessFactor: 1.2,
      bandWidthPlanetRadii: kind === 'TRANSPORT' ? 0.11 : kind === 'HABITAT' ? 0.19 : 0.24,
    };
    const first = build(plan), second = build(plan);
    const normalize = data => JSON.stringify(Array.from(data));
    if (normalize(first) !== normalize(second)) throw new Error(`${kind}: non deterministic ${seed}`);
    const roles = new Set(Array.from(first, craft => craft.role));
    if (roles.size !== 3) throw new Error(`${kind}: missing family ${seed}`);
    if (first.length < 20 || first.length > 40) throw new Error(`${kind}: bad fleet size ${seed}`);
    for (const craft of first) {
      if (!(craft.speedCyclesPerDay > 0) || !(craft.nodeCount >= 6) ||
          Math.abs(craft.laneRadiusPlanetRadii - plan.orbitRadiusPlanetRadii) >= plan.bandWidthPlanetRadii * 0.8) {
        throw new Error(`${kind}: out-of-bounds craft ${seed}`);
      }
    }
    inspected++;
  }
}
const main = fs.readFileSync(path.resolve(__dirname,
  '../src/app/presentation/system/system-scene-artificial-satellites-visciv2.ts'), 'utf8');
const system = fs.readFileSync(path.resolve(__dirname,
  '../src/app/presentation/system/system-scene.ts'), 'utf8');
const fiche = fs.readFileSync(path.resolve(__dirname,
  '../src/app/presentation/scientific-body-preview/scientific-body-preview.ts'), 'utf8');
if (!main.includes('createOrbitalTrafficVisualVISCIV6k(plan, planetRadiusScene)') ||
    !main.includes('updateOrbitalTrafficVISCIV6k(visual.orbitalTrafficVISCIV6k, simulationDay)') ||
    !system.includes('updateOrbitalRingTrafficVISCIV6k(') ||
    !fiche.includes('updateOrbitalRingTrafficVISCIV6k(')) {
  throw new Error('VISCIV.6k: conexión de movimiento incompleta en alguna escena');
}
console.log(`VISCIV.6k: PASS · ${inspected} configurations (3 types × 4096 seeds), deterministic plans, bounded lanes and both scenes wired`);
