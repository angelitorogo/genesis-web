'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const base = path.resolve(__dirname, '..');
const source6n = 'src/app/presentation/system/system-scene-orbital-surface-shadow-visciv6n.ts';
const source6m = 'src/app/presentation/system/system-scene-orbital-planet-shadow-visciv6m.ts';
const spec6o = 'src/app/presentation/system/system-scene-orbital-shadow-refinement-visciv6o.spec.ts';

class Vector3Mock {
  constructor(x=0, y=0, z=0) { this.x=x; this.y=y; this.z=z; }
  lengthSq() { return this.x*this.x + this.y*this.y + this.z*this.z; }
  length() { return Math.sqrt(this.lengthSq()); }
  clone() { return new Vector3Mock(this.x, this.y, this.z); }
  normalize() { const len=this.length() || 1; this.x/=len; this.y/=len; this.z/=len; return this; }
  dot(o) { return this.x*o.x + this.y*o.y + this.z*o.z; }
  addScaledVector(o, amount) { this.x+=o.x*amount; this.y+=o.y*amount; this.z+=o.z*amount; return this; }
}
const mockThree = {Vector3: Vector3Mock, MathUtils:{clamp:(x,a,b)=>Math.max(a,Math.min(b,x))}};
function compileWithMock(relative) {
  const source = fs.readFileSync(path.join(base, relative),'utf8');
  const parsed = ts.createSourceFile(relative,source,ts.ScriptTarget.ES2022,true,ts.ScriptKind.TS);
  assert.equal(parsed.parseDiagnostics.length,0,`${relative}: error de sintaxis`);
  const compiled = ts.transpileModule(source,{fileName:relative,reportDiagnostics:true,
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
  assert.equal(compiled.diagnostics.length,0,`${relative}: error TS`);
  const module={exports:{}};
  const requireLocal = name => {if(name==='three') return mockThree; throw new Error(`Unexpected import: ${name}`);};
  Function('module','exports','require',compiled.outputText)(module,module.exports,requireLocal);
  return {api:module.exports,source};
}
const m=compileWithMock(source6m);
const n=compileWithMock(source6n);
const specText=fs.readFileSync(path.join(base,spec6o),'utf8');
assert.equal(ts.createSourceFile(spec6o,specText,ts.ScriptTarget.ES2022,true,ts.ScriptKind.TS).parseDiagnostics.length,0);

const shadow6n=n.api;
const shadow6m=m.api;
const {orbitalMonumentalHubHalfWidthVISCIV6o:width,
       orbitalMonumentalHubSilhouetteVISCIV6o:bulge,
       orbitalRingSurfaceShadowOcclusionVISCIV6n:occlusion,
       patchOrbitalSurfaceShadowShaderVISCIV6n:patchShader}=shadow6n;

assert.ok(width('INDUSTRIAL',1)>width('HABITAT',1));
assert.ok(width('HABITAT',1)>width('TRANSPORT',1));
assert.equal(width('INDUSTRIAL',0),0);
let validated=0;
for(let i=0;i<4096;i++){
  const a=2*Math.PI*i/4096;
  const radial=new Vector3Mock(Math.cos(a),0,Math.sin(a));
  const hubAxis=new Vector3Mock(1,0,0);
  const v=bulge(radial,hubAxis,width('INDUSTRIAL',1));
  assert.ok(v>=0 && v<=width('INDUSTRIAL',1));
  assert.ok(Math.abs(v-bulge(new Vector3Mock(-radial.x,0,-radial.z),hubAxis,width('INDUSTRIAL',1)))<1e-12);
  validated++;
}
assert.equal(bulge(new Vector3Mock(1,0,0),new Vector3Mock(1,0,0),0.06),0.06);
assert.equal(bulge(new Vector3Mock(0,0,1),new Vector3Mock(1,0,0),0.06),0);
const point=new Vector3Mock(0.8,-0.6,0), sun=new Vector3Mock(0.95,0.5,0), normal=new Vector3Mock(0,1,0);
assert.ok(occlusion(point,sun,normal,1.94,0.15)>0.99);
assert.equal(occlusion(point,sun,normal,3,0.15),0);
assert.equal(occlusion(point,new Vector3Mock(-0.95,-0.5,0),normal,1.94,0.15),0);
assert.equal(shadow6m.planetShadowTransmissionVISCIV6m(new Vector3Mock(-2,0,0),new Vector3Mock(1,0,0),1),0);
assert.equal(shadow6m.planetShadowTransmissionVISCIV6m(new Vector3Mock(2,0,0),new Vector3Mock(1,0,0),1),1);
const frag = `#include <common>\nfloat genesisWeightedDay0 = 1.0;\nvec3 uGenesisLightDirectionsView[3];\noutgoingLight *= genesisNightVisibility * genesisNightTint;\noutgoingLight += genesisUrbanEmission;`;
const shader=patchShader(frag);
assert.ok(shader.includes('float opacity = 0.80;'));
assert.ok(shader.includes('outgoingLight *= (1.0 - 0.93 * occlusion)'));
assert.ok(shader.includes('smoothstep(0.78, 0.985, nodeAlignment)'));
assert.ok(shader.includes('smoothstep(0.0, 0.09, facing)'));
assert.ok(shader.includes('radiusSq < innerRadius * innerRadius || radiusSq > outerRadius * outerRadius'));
assert.ok(shader.indexOf('radiusSq < innerRadius') < shader.indexOf('float radialDistance = sqrt(radiusSq)'));
assert.ok(shader.indexOf('outgoingLight *= (1.0 - 0.93 * occlusion)') < shader.indexOf('outgoingLight += genesisUrbanEmission'));
for (const token of ['shadowW0','shadowW1','shadowW2','uGenesisRingShadowCountVISCIV6n']) assert.ok(shader.includes(token));
for (const token of ['sin(arc','cos(arc','float trusses','float monumentalSectors']) assert.ok(!shader.includes(token));
assert.ok(m.source.includes('scratchVISCIV6o'));
assert.ok(m.source.includes('const sources = scratch.sources;'));
assert.ok(m.source.includes('sourceCount'));
assert.ok(n.source.includes('ring.rotor.updateWorldMatrix'));
assert.ok(n.source.includes('orbitalMonumentalHubHalfWidthVISCIV6o(plan.ringKind, planetRadiusScene)'));
console.log(`VISCIV.6o: PASS — ${validated} orientaciones de nodos, penumbra, terminador, tres estrellas y buffers reutilizables`);
