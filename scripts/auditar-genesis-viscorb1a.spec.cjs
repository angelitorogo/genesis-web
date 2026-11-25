#!/usr/bin/env node
'use strict';
// GENESIS VISCORB.1a — portable audit: no hardcoded paths, no npm scripts added.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const system = 'src/app/presentation/system/';
let checks = 0;
const ok = (assertion, description) => { assert.ok(assertion, description); checks++; };
const read = name => fs.readFileSync(path.join(root, system, name), 'utf8');
const source = read('viscorb-local-orbit-projection.ts');
const systemRuntime = read('viscorb-system-local-presentation.ts');
const sourceSpec = read('viscorb-system-local-presentation.spec.ts');
const localSpec = read('viscorb-local-orbit-projection.spec.ts');
for (const [name, contents] of Object.entries({source,systemRuntime,sourceSpec,localSpec})) {
  const file = ts.createSourceFile(`${name}.ts`, contents, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  ok(file.parseDiagnostics.length === 0, `${name} parses`);
}
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const m = { exports: {} };
new Function('module','exports',js)(m,m.exports);
const { viscorbLocalOrbitLayoutV1, viscorbPresentedMoonRadiusV1, viscorbMoonOrbitPresentationScaleV1 } = m.exports;
const variants = [
  [{periapsisPlanetRadii:3,apoapsisPlanetRadii:5,radiusEarth:.25},{periapsisPlanetRadii:7,apoapsisPlanetRadii:12,radiusEarth:.12}],
  [{periapsisPlanetRadii:2,apoapsisPlanetRadii:3,radiusEarth:.2}],
  [{periapsisPlanetRadii:3,apoapsisPlanetRadii:4,radiusEarth:.3},{periapsisPlanetRadii:25,apoapsisPlanetRadii:50,radiusEarth:.04}],
];
for (const moons of variants) {
  const original = JSON.stringify(moons);
  const plan = viscorbLocalOrbitLayoutV1(moons);
  ok(plan !== null, 'valid local orbit layout');
  const oldMaximum = Math.min(.18, Math.max(.065, plan.planetRadius * .26));
  const oldRadius = Math.max(.028, oldMaximum);
  const newRadius = viscorbPresentedMoonRadiusV1(plan,plan.maximumMoonRadiusEarth);
  ok(newRadius < oldRadius,'largest displayed moon is smaller than VISCORB.1');
  ok(newRadius / oldRadius >= .60 && newRadius / oldRadius <= .75,'VISCORB.1a reduction plus additional 15 percent');
  ok(plan.maximumDisplayedMoonRadius === newRadius, 'largest moon retains shared layout size');
  ok(Math.abs(viscorbMoonOrbitPresentationScaleV1(plan) - plan.scenePerPlanetRadius / plan.planetRadius) < 1e-12,'orbit scale untouched');
  ok(JSON.stringify(moons) === original,'physical orbital inputs unchanged');
}
const plan = viscorbLocalOrbitLayoutV1(variants[0]);
ok(viscorbPresentedMoonRadiusV1(plan,.25)>viscorbPresentedMoonRadiusV1(plan,.12),'moon radius ordering');
ok(Math.abs(viscorbPresentedMoonRadiusV1(plan, .0001) - .0187)<1e-12, 'visibility floor lowered further in 1b');
ok(systemRuntime.includes('sizeScale: Math.max(0.102, Math.min(5.1,'),'minimum visual scale permits reduced moon size');
ok(sourceSpec.includes("label:'Luna B-I'") && sourceSpec.includes('hostPlanetOrdinal:2') && sourceSpec.includes('spin:{source:'),'mock provides moon metadata and spin contract');
ok(sourceSpec.includes('hostPlanetId:') && sourceSpec.includes('buildSystemSceneMoonPresentationV1({'),'mock uses real canonical visual presentation builder');
ok(sourceSpec.includes('const moon: SystemSceneMoonSnapshot =') && !sourceSpec.includes('as unknown as SystemSceneMoonSnapshot'),'mock is fully typed without coercion');
ok(localSpec.includes('otro 15% sobre ella'),'unit regression asserts additional reduction');

// Strict-check the fixture structure with the actual canonical moon presentation
// source type returned by the builder. The real Angular/Vitest compile is still
// required to check all transitive project types.
const ast = ts.createSourceFile('spec.ts', sourceSpec, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
let moonDeclaration = null;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'moon' && node.type?.getText(ast) === 'SystemSceneMoonSnapshot') moonDeclaration = node;
  ts.forEachChild(node, visit);
}
visit(ast);
ok(moonDeclaration !== null, 'typed moon fixture identified');
const fragment = `const moon: SystemSceneMoonSnapshot = ${moonDeclaration.initializer.getText(ast)};`;
const typecheck = `
interface SystemSceneMoonSnapshot {
 readonly id: string; readonly kind:'moon'; readonly label:string; readonly title:string;
 readonly hostPlanetId:string; readonly hostPlanetOrdinal:number; readonly colorHex:string;
 readonly radiusScene:number; readonly orbitId:string;
 readonly position:{x:number;y:number;z:number}; readonly motionContributions:readonly unknown[];
 readonly spin:{source:'MOON_21_4'|'PLANET_19_3'|'UNAVAILABLE';rotationPeriodHours:number|null;axialTiltDegrees:number|null;isRetrograde:boolean|null;isSynchronized:boolean;epochPhaseDegrees:number};
 readonly visualPresentation:{sourceRadiusEarth:number; anotherRequiredScientificField:string};
}
declare function buildSystemSceneMoonPresentationV1(input:unknown): SystemSceneMoonSnapshot['visualPresentation'];
${fragment}
void moon;
`;
const dir = fs.mkdtempSync(path.join(require('node:os').tmpdir(),'viscorb1a-'));
try {
  const file = path.join(dir, 'contract.ts');
  fs.writeFileSync(file,typecheck);
  const compiler = ts.createProgram([file],{strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,types:[]});
  const errors = ts.getPreEmitDiagnostics(compiler).filter(d=>d.category===ts.DiagnosticCategory.Error);
  ok(errors.length===0,`TS strict moon fixture: ${errors.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')).join('; ')}`);
} finally { fs.rmSync(dir,{recursive:true,force:true}); }
console.log(`PASS GENESIS VISCORB.1a — ${checks} comprobaciones portátiles · fixture TS2352 y escala lunar local`);
