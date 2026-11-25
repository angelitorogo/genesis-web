#!/usr/bin/env node
'use strict';
/** Portable test of GENESIS MOONCAD.1 (TypeScript installed in project). */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.join(__dirname, '..');
const source = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const FILES = {
  cadence: 'src/app/presentation/system/system-scene-secondary-motion.ts',
  preview: 'src/app/presentation/scientific-body-preview/scientific-body-preview.ts',
  single: 'src/app/presentation/system/system-scene-snapshot.ts',
  multihost: 'src/app/presentation/system/system-scene-multihost-composition.ts',
  circumbinary: 'src/app/presentation/system/system-scene-multihost-circumbinary-projection.ts',
  compact: 'src/app/presentation/system/system-compact-host-secondary-scene.ts',
  spec: 'src/app/presentation/system/system-scene-moon-group-cadence-parity.spec.ts',
  orbital: 'src/app/simulation/orbital/system-orbital-motion-engine.ts',
  projection: 'src/app/presentation/system/system-scene-motion-projection.ts',
};
let checks = 0;
function ok(what, why) { assert.ok(what, why); checks++; }
function near(a,b,why,eps=1e-11) { ok(Number.isFinite(a) && Math.abs(a-b)<eps*Math.max(1,Math.abs(a),Math.abs(b)),why); }
const code = Object.fromEntries(Object.entries(FILES).map(([k,v])=>[k,source(v)]));
function transpile(file) {
 const t = ts.transpileModule(code[file],{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true,fileName:FILES[file]});
 const errors=(t.diagnostics??[]).filter(x=>x.category===ts.DiagnosticCategory.Error);
 ok(errors.length===0, `${file}: transpilation errors: ${errors.map(x=>x.messageText).join('; ')}`);
 return t.outputText;
}
const outputs = {};
for(const name of Object.keys(FILES)) {
 const text=code[name];
 const parsed=ts.createSourceFile(FILES[name],text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
 ok(parsed.parseDiagnostics.length===0,`${name}: syntax TS`);
 outputs[name]=transpile(name);
}
function load(name) {
 const mod={exports:{}};
 new Function('require','module','exports',outputs[name])(
   id=>{throw Error(`Unexpected dependency in standalone ${name}: ${id}`)},mod,mod.exports);
 return mod.exports;
}
const cadence=load('cadence');
const orbital=load('orbital');
ok(cadence.SCIENTIFIC_MOON_OUTERMOST_CYCLE_REAL_SECONDS_V1===90, '90 seconds preserved');
const periods=Object.freeze([2,8,24]);
const orig=JSON.stringify(periods);
const rate=cadence.scientificMoonGroupDaysPerRealSecondV1(periods);
near(rate,24/90,'preview rate');
for(const [period,expected] of [[24,90],[8,30],[2,7.5]]) near(period/rate,expected,`moon period ${period}`);
for(const playback of [0.05,1,36,100,3650]) {
 const scale=cadence.systemSceneMoonGroupPresentationTimeScaleV1(periods,playback);
 near(scale*playback,rate,`common clock at ${playback}`);
 for(const p of periods) near(p/(playback*scale),p/rate,`orbit speed at ${playback}, moon ${p}`);
}
near(cadence.systemSceneMoonGroupPresentationTimeScaleV1([8,2,24],2),
 cadence.systemSceneMoonGroupPresentationTimeScaleV1([24,8,2],2),'focus-independent order');
near(cadence.systemSceneMoonGroupPresentationTimeScaleV1([5],1),5/90,'one-moon group');
near(cadence.systemSceneMoonGroupPresentationTimeScaleV1([10,40],1),40/90,'group A');
near(cadence.systemSceneMoonGroupPresentationTimeScaleV1([10,15],1),15/90,'group B');
ok(JSON.stringify(periods)===orig,'no mutation of input periods');
for(const p of [0,-1,Infinity,NaN]) {
 assert.throws(()=>cadence.scientificMoonGroupDaysPerRealSecondV1([p]),RangeError);
 checks++;
}
assert.throws(()=>cadence.scientificMoonGroupDaysPerRealSecondV1([]),RangeError);checks++;
assert.throws(()=>cadence.systemSceneMoonGroupPresentationTimeScaleV1([2],0),RangeError);checks++;
const motion=Object.freeze({id:'m-1',semiMajorAxisAu:0.002,eccentricity:0.37,periodDays:8,
 rotationDegrees:52,inclinationDegrees:22,epochMeanAnomalyDegrees:30});
const before=JSON.stringify(motion);
for(const t of [0,0.5,8,22,45,75,90]) {
 const preview=orbital.SystemOrbitalMotionEngine.positionAtSimulationDay(motion,t*rate);
 const scene=orbital.SystemOrbitalMotionEngine.positionAtSimulationDay(motion,t*36*
   cadence.systemSceneMoonGroupPresentationTimeScaleV1(periods,36));
 near(preview.xAu,scene.xAu,`same orbit x at ${t}`);
 near(preview.yAu,scene.yAu,`same orbit y at ${t}`);
 near(preview.zAu,scene.zAu,`same orbit z at ${t}`);
}
ok(JSON.stringify(motion)===before,'Keplerian period/eccentricity/inclination/phase preserved');
// Real wiring: verify all public scene variants use the shared group, not 8s/42s/480-day per-moon speed.
ok(code.preview.includes('scientificMoonGroupDaysPerRealSecondV1('),'fiche uses same shared cadence');
ok(!code.preview.includes('LOCAL_OUTERMOST_ORBIT_CYCLE_SECONDS'),'no duplicated 90 seconds in fiche');
ok(code.single.includes('relevantMoons.map(moon => moon.orbit.orbitalPeriodDays)'),'single group periods');
ok(code.single.includes('presentationTimeScale: moonGroupTimeScale!'),'single group contribution');
ok(code.multihost.includes('periodsByPlanetId.get(moon.hostPlanetId)'),'multihost groups by host');
ok(code.multihost.includes('moonCadenceByMotionId.get(part.motionId)'),'multihost group cadence override');
ok(code.circumbinary.includes('moonSystem.relevantMoons.map(moon => moon.orbit.orbitalPeriodDays)'),'circumbinary group periods');
ok(code.circumbinary.includes('presentationTimeScale: moonGroupTimeScale!'),'circumbinary group contribution');
ok(code.compact.includes('periodsByHost.get(moon.parentPlanetOrdinal)'),'compact groups by host');
ok(code.compact.includes('systemSceneMoonGroupPresentationTimeScaleV1('),'compact host shared cadence');
ok(!code.compact.includes('moon.orbitalPeriodDays/480'),'compact host old cadence removed');
ok(!code.circumbinary.includes('MOON_ORBIT_SECONDS'),'circumbinary 42 sec old cadence removed');
ok(!code.multihost.includes('MOON_MIN_SECONDS'),'multihost 42 sec old cadence removed');
ok(code.single.includes('systemSceneMinorBodyPresentationTimeScale('),'minor-body cadence unchanged');
ok(code.multihost.includes('v2PlanetTimeScale('),'planet orbital cadence unchanged');
ok(code.projection.includes('presentationTimeScale ??'),'renderer still projects same immutable motion');
ok(code.spec.includes('no altera la cadencia de un planeta'),'regression coverage planet unchanged');
console.log(`PASS GENESIS MOONCAD.1 — ${checks} comprobaciones · paridad ficha/SystemScene, sistemas simples/múltiples, relojes, Kepler, determinismo`);
