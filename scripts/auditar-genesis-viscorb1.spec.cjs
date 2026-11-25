#!/usr/bin/env node
'use strict';
// GENESIS VISCORB.1 — auditoría portable (Windows/Linux), Node + TypeScript local.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const ts = require('typescript');
let checks=0;
const ok=(condition,label)=>{assert.ok(condition,label);checks++;};
const files={
  orbit:'src/app/presentation/system/viscorb-local-orbit-projection.ts',
  runtime:'src/app/presentation/system/viscorb-system-local-presentation.ts',
  system:'src/app/presentation/system/system-scene.ts',
  camera:'src/app/presentation/system/system-scene-camera-controller.ts',
  preview:'src/app/presentation/scientific-body-preview/scientific-body-preview.ts',
  source:'src/app/presentation/scientific/scientific-body-preview.ts',
  lighting:'src/app/presentation/scientific-body-preview/viscorb-preview-stellar-illumination.ts',
  star:'src/app/presentation/system/viscorb-stellar-frame.ts',
};
const source = Object.fromEntries(Object.entries(files).map(([key,filepath])=>[key,fs.readFileSync(path.join(root,filepath),'utf8')]));
for(const [name,content] of Object.entries(source)){
  const ast=ts.createSourceFile(name+'.ts',content,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
  ok(ast.parseDiagnostics.length===0,`${name}: TS syntax`);
}
function load(file,requireMock={}){
  const js=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true,
  });
  assert.equal((js.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
  const m={exports:{}};
  const fn=new Function('require','module','exports',js.outputText);
  fn(id=>{if(id in requireMock)return requireMock[id];throw new Error(`Unexpected dependency ${id}`);},m,m.exports);
  return m.exports;
}
const baseDaylight=load('src/app/presentation/scientific-body-preview/scientific-preview-daylight-camera-t7s.ts');
const stellar=load(files.star,{'../scientific-body-preview/scientific-preview-daylight-camera-t7s':baseDaylight});
const daylight=stellar.viscorbStellarViewDirectionV1({x:0,y:0,z:0},
  [{id:'A',x:4,y:0,z:0,sourceLuminositySolar:1},{id:'B',x:-3,y:0,z:0,sourceLuminositySolar:.2}],['A']);
ok(daylight!==null&&daylight.x>.8,'binary host illumination');
const triple=stellar.viscorbStellarViewDirectionV1({x:0,y:0,z:0},
  [{id:'A',x:4,y:0,z:0,sourceLuminositySolar:1},{id:'B',x:-3,y:0,z:0,sourceLuminositySolar:.2},
  {id:'C',x:0,y:3,z:0,sourceLuminositySolar:.1}],['A','B']);
ok(triple!==null&&Number.isFinite(triple.y),'stable triple camera');
ok(stellar.viscorbStellarViewDirectionV1({x:0,y:0,z:0},
  [{id:'BH',x:1,y:0,z:0,sourceLuminositySolar:0}])===null,'quiescent black hole never invents light');
const proj=load(files.orbit);
const moons=[{periapsisPlanetRadii:3,apoapsisPlanetRadii:5,radiusEarth:0.20},
  {periapsisPlanetRadii:8,apoapsisPlanetRadii:12,radiusEarth:0.10}];
const before=JSON.stringify(moons);
const plan=proj.viscorbLocalOrbitLayoutV1(moons);
ok(plan!==null,'plan available');
ok(Math.abs(plan.scenePerPlanetRadius-4.35/12)<1e-12,'outer orbit mapping');
ok(plan.planetRadius>=0.18&&plan.planetRadius<=0.78,'planet readable radius');
ok(plan.maximumMoonRadiusEarth===0.2,'moon radius provenance');
ok(proj.viscorbPresentedMoonRadiusV1(plan,.20)>proj.viscorbPresentedMoonRadiusV1(plan,.10),'size ordering');
ok(JSON.stringify(moons)===before,'immutable orbit inputs');
ok(proj.viscorbLocalOrbitLayoutV1([])===null,'empty orbit gating');
ok(proj.viscorbLocalOrbitLayoutV1([{periapsisPlanetRadii:4,apoapsisPlanetRadii:3,radiusEarth:1}])===null,'invalid orbit rejection');
ok(proj.viscorbBlendOrbitTransformV1(1,4,0)===1,'blend zero');
ok(proj.viscorbBlendOrbitTransformV1(1,4,1)===4,'blend one');
ok(Math.abs(proj.viscorbBlendOrbitTransformV1(1,4,.5)-2.5)<1e-10,'blend smooth');
ok(proj.viscorbBlendOrbitTransformV1(1,4,3)===4,'blend clamped');

class Vector3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}copy(p){return this.set(p.x,p.y,p.z);}sub(p){this.x-=p.x;this.y-=p.y;this.z-=p.z;return this;}add(p){this.x+=p.x;this.y+=p.y;this.z+=p.z;return this;}multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this;}lerp(p,t){this.x+=(p.x-this.x)*t;this.y+=(p.y-this.y)*t;this.z+=(p.z-this.z)*t;return this;}setScalar(s){return this.set(s,s,s);}}
class LineBasicMaterial{constructor(options={}){this.opacity=options.opacity??1;}}
const runtime=load(files.runtime,{'three':{Vector3,LineBasicMaterial},'./viscorb-local-orbit-projection':proj});
const ctl=new runtime.ViscorbSystemLocalPresentationV1();
const planet={id:'planet-a',kind:'planet',radiusScene:.30,specialPresentation:null};
const moon={id:'moon-a',kind:'moon',hostPlanetId:'planet-a',orbitId:'orbit-a',radiusScene:.08,
  position:{x:1.2,y:0,z:0},motionContributions:[],visualPresentation:{sourceRadiusEarth:.12}};
const orbit={id:'orbit-a',kind:'moon',anchorMotionContributions:[]};
const orbitPositions=Array.from({length:80},(_,i)=>[Math.cos(i*Math.PI/40)*1.2,0,Math.sin(i*Math.PI/40)*.85]);
const attr={count:orbitPositions.length,getX:i=>orbitPositions[i][0],getY:i=>orbitPositions[i][1],getZ:i=>orbitPositions[i][2]};
const geometry={getAttribute:key=>key==='position'?attr:null};
const planetGroup={position:new Vector3(),scale:new Vector3(1,1,1)};
const moonGroup={position:new Vector3(1.2,0,0),scale:new Vector3(1,1,1)};
const line={geometry,position:new Vector3(),scale:new Vector3(1,1,1),material:new LineBasicMaterial({opacity:.3})};
const radii=runtime.viscorbOrbitGeometryRadiiV1(geometry);
ok(Math.abs(radii.periapsis-.85)<.005,'ellipse periapsis retained');
ok(Math.abs(radii.apoapsis-1.2)<.005,'ellipse apoapsis retained');
const objects=new Map([[planet.id,planetGroup],[moon.id,moonGroup]]);
const lines=new Map([[orbit.id,line]]);
const frame=ctl.begin(planet,[planet],[moon],[orbit],{},objects,lines);
ok(Number.isFinite(frame)&&frame>0,'framing extent');
const originalMoon=JSON.stringify(moon);
const project=()=>new Vector3(1.2,0,0);
for(let ms=0;ms<=640;ms+=80)ctl.update(0,ms,project);
ok(ctl.hostId===planet.id,'tracked system identity');
ok(Math.abs(moonGroup.position.x-line.scale.x*1.2)<1e-8,'orbit line matches moon');
ok(line.scale.x!==1,'local visual transform used');
ok(line.material.opacity>.3,'local orbit contrast');
ok(JSON.stringify(moon)===originalMoon,'scientific moon unchanged');
ctl.release();
for(let ms=720;ms<=1440;ms+=80)ctl.update(0,ms,project);
ok(ctl.hostId===null,'local frame released');
ok(Math.abs(moonGroup.position.x-1.2)<1e-10,'moon restored');
ok(moonGroup.scale.x===1&&line.scale.x===1,'scales restored');
ok(Math.abs(line.material.opacity-.3)<1e-10,'orbital material restored');
ok(ctl.begin(planet,[planet],[],[],{},objects,lines)===null,'no hidden moons materialized');

for(const [piece,needle] of [
  ['preview','viscorbPreviewStellarSourcesV1(this.model)'],
  ['preview','viscorbLocalOrbitLayoutV1('],
  ['source','stellarLightSources: buildPreviewStellarLightSourcesVISSURF6('],
  ['system','this.viscorbLocalPresentation.begin('],
  ['system','this.viscorbLocalPresentation.update('],
  ['system','this.viscorbLocalPresentation.release()'],
  ['system','this.selectionProxyRadii[index]! * group.scale.x'],
  ['camera','framingRadiusScene: number = bodyRadiusScene'],
  ['lighting','model.hostPlanet?.stellarLightSources'],
  ['system','this.viscorbLocalPresentation.physicalMoonPosition(body.id)'],
  ['system','binding.radiusScene * ('],
  ['camera','preferredViewDirection: THREE.Vector3 | null = null'],
]) ok(source[piece].includes(needle),`${piece}: ${needle}`);
console.log(`PASS GENESIS VISCORB.1 — ${checks} comprobaciones portátiles · orientación, órbitas, escala, selección, determinismo y retorno global`);
