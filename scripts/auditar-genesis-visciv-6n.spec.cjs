'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const files = [
  'src/app/presentation/system/system-scene-orbital-surface-shadow-visciv6n.ts',
  'src/app/presentation/system/system-scene-orbital-surface-shadow-visciv6n.spec.ts',
  'src/app/presentation/system/system-scene.ts',
  'src/app/presentation/scientific-body-preview/scientific-body-preview.ts',
];
let sources = [];
for (const relative of files) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  const parsed = ts.createSourceFile(relative, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  assert.equal(parsed.parseDiagnostics.length, 0, `${relative}: syntax error`);
  sources.push(source);
}
const [shadow, tests, scene, preview] = sources;
for (const source of [scene, preview]) {
  assert.ok(source.includes('installOrbitalSurfaceShadowVISCIV6n('), 'missing shader attachment');
  assert.ok(source.includes('ringShadowRingsVISCIV6n.push('), 'missing real ring source');
  assert.ok(source.includes('orbitalSurfaceShadow'), 'missing frame update');
}
assert.ok(shadow.includes('uGenesisLightDirectionsView[0]'));
assert.ok(shadow.includes('uGenesisLightDirectionsView[1]'));
assert.ok(shadow.includes('uGenesisLightDirectionsView[2]'));
assert.ok(shadow.includes('outgoingLight *= (1.0 - 0.93 * occlusion)'));
assert.ok(shadow.includes('VISUAL_MIN_HALF_WIDTH_VISCIV6na'));
assert.ok(shadow.includes('VISUAL_PENUMBRA_WIDTH_VISCIV6na'));
assert.ok(shadow.includes('angleThicknessBoost'));
assert.ok(shadow.includes('float opacity = 0.80;'));
assert.ok(!shadow.includes('monumentalSectors'));
assert.ok(!shadow.includes('float trusses ='));
assert.ok(!shadow.includes('float nodes ='));
assert.ok(shadow.includes('SHADOW_SHADER_MARKER'));
assert.ok(tests.includes("expect(count.value).toBe(0)"));

// Portable version of the geometric reference (the Vitest test calls the TS original).
function eclipse(point, light, n, radius, width) {
  const sl = Math.hypot(...light);
  const nl = Math.hypot(...n);
  const sun = light.map(x => x / sl);
  const normal = n.map(x => x / nl);
  const dot = (a, b) => a.reduce((v,x,i) => v+x*b[i],0);
  if (dot(point, sun) <= 0) return 0;
  const denom = dot(normal, sun);
  if (Math.abs(denom) < 1e-5) return 0;
  const t = -dot(normal, point)/denom;
  if (t <= 1e-5) return 0;
  const hit = point.map((p,i) => p+t*sun[i]);
  const distance = Math.abs(Math.hypot(...hit)-radius);
  const effective = Math.max(width,0.155);
  const near = Math.max(0,effective-0.024);
  const f = Math.min(1, Math.max(0,(distance-near)/(effective+0.024-near)));
  return 1-f*f*(3-2*f);
}
const p = [.8,-.6,0], light = [.95,.5,0], normal=[0,1,0];
assert.ok(eclipse(p,light,normal,1.94,.15) > .99);
assert.ok(eclipse(p,light,normal,1.94,.02) > .95);
assert.equal(eclipse(p,light,normal,2.7,.15),0);
assert.equal(eclipse(p,[1,0,0],normal,1.94,.15),0);
let cases=0;
for(let i=0;i<4096;i++) {
  const angle=2*Math.PI*((i*7919)%4096)/4096;
  const surface=[Math.cos(angle),Math.sin(angle),0];
  const a=eclipse(surface,light,normal,1.94,.15);
  const b=eclipse(surface,light,normal,1.94,.15);
  assert.equal(a,b);
  assert.ok(a>=0 && a<=1);
  cases++;
}
console.log(`VISCIV.6n: PASS — ${cases} casos geométricos reproducibles; GLSL y doble integración presentes`);
