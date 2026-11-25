/** GENESIS 38.bis-T7l · auditoría portátil frame camera/colony/surface. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const {performance}=require('node:perf_hooks');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const dir='src/app/presentation/infrastructure/';
const frame=read(dir+'colvis3-colony-terrain-frame-t7l.ts');
const terrain=read(dir+'colvis3-native-terrain-t7i.ts');
const atlas=read(dir+'colvis3-colony-terrain-atlas-t7k.ts');
const preview=read('src/app/presentation/scientific-body-preview/scientific-body-preview.ts');
const tests=read(dir+'colvis3-native-terrain-t7i.spec.ts');
const frameTests=read(dir+'colvis3-colony-terrain-frame-t7l.spec.ts');
let count=0;const check=f=>{f();count++};
const transpile=(s)=>ts.transpileModule(s,{reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
for(const s of [frame,terrain,atlas,preview,tests,frameTests]){
  const d=transpile(s).diagnostics??[];
  check(()=>assert.equal(d.filter(x=>x.category===ts.DiagnosticCategory.Error).length,0));
}
const evalModule=(s,dependencies={})=>{
  const module={exports:{}};
  new Function('require','module','exports',transpile(s).outputText)(name=>{
    if(Object.prototype.hasOwnProperty.call(dependencies,name))return dependencies[name];
    throw new Error('Dependencia no permitida: '+name);
  },module,module.exports);
  return module.exports;
};
const f=evalModule(frame);
for(const scale of [.000001,.00012,.01,.15,1,20]){
  const E={x:scale*.81,y:scale*.2,z:scale*.3},Z={x:scale*.27,y:scale*.5,z:scale*.87};
  const basis=f.colvis3TerrainDualBasisT7l(E,Z);
  check(()=>assert.ok(basis));
  for(const [a,b] of [[1,0],[0,1],[.8,-.45],[5.3,6.2]]){
    const d={x:a*E.x+b*Z.x,y:a*E.y+b*Z.y,z:a*E.z+b*Z.z};
    const uv=f.colvis3TerrainCoordinatesT7l(d,basis);
    check(()=>assert.ok(Math.abs(uv.x-a)<1e-9 && Math.abs(uv.z-b)<1e-9));
  }
}
check(()=>assert.equal(f.colvis3TerrainDualBasisT7l({x:1,y:0,z:0},{x:2,y:0,z:0}),null));
const atlasModule=evalModule(atlas);
const t0=performance.now();
const bytes=atlasModule.colvis3ColonyTerrainAtlasT7k(18374,true,512);
const atlasTime=performance.now()-t0;
check(()=>assert.equal(bytes.length,512*512*4));
check(()=>assert.deepEqual(bytes,atlasModule.colvis3ColonyTerrainAtlasT7k(18374,true,512)));
check(()=>assert.ok(atlasTime<3000,'El atlas no debe bloquear la inspección'));
// Portable Three.js double: enough to verify the shader contract AND updateFrame.
class V{
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
  copy(v){return this.set(v.x,v.y,v.z);}
  clone(){return new V(this.x,this.y,this.z);}
  sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;}
  dot(v){return this.x*v.x+this.y*v.y+this.z*v.z;}
  normalize(){const m=Math.hypot(this.x,this.y,this.z)||1;return this.set(this.x/m,this.y/m,this.z/m);}
  applyMatrix4(m){const x=this.x-m.tx,y=this.y-m.ty,z=this.z-m.tz;
    return this.set(m.scale*(m.c*x-m.s*z),m.scale*y,m.scale*(m.s*x+m.c*z));}
  applyQuaternion(){return this;}
  transformDirection(m){const x=this.x,z=this.z;this.set(m.c*x-m.s*z,this.y,m.s*x+m.c*z);return this.normalize();}
}
class Mat {
  constructor(opts={}){Object.assign(this,opts);this.map=opts.map??null;this.onBeforeCompile=()=>{};this.customProgramCacheKey=()=> 'standard';}
  clone(){const m=new Mat({map:this.map});m.onBeforeCompile=this.onBeforeCompile;return m;}
  dispose(){this.disposed=true;}
}
class Texture {constructor(b,w,h){this.data=b;this.width=w;this.height=h;}dispose(){this.disposed=true;}}
class Surface{constructor(){this.material=new Mat();this.children=[];}
  updateWorldMatrix(){}
  getWorldPosition(out){return out.set(0,0,0);}}
class Site{
  constructor(radius,scaleX,scaleZ){this.radius=radius;this.scaleX=scaleX;this.scaleZ=scaleZ;}
  updateWorldMatrix(){}
  getWorldPosition(out){return out.set(0,this.radius,0);}
  localToWorld(v){return new V(v.x*this.scaleX,this.radius,v.z*this.scaleZ);}
  getWorldQuaternion(){return {};}
}
class Camera{constructor(){this.matrixWorldInverse={tx:0,ty:0,tz:0,c:1,s:0,scale:1};}updateWorldMatrix(){}}
const three={Vector3:V,Quaternion:class{},MeshStandardMaterial:Mat,DataTexture:Texture,
  NoColorSpace:'none',RGBAFormat:'rgba',RepeatWrapping:'repeat',
  LinearMipmapLinearFilter:'mipmap',LinearFilter:'linear'};
const native=evalModule(terrain,{
  'three':three,
  './colvis3-colony-terrain-atlas-t7k':atlasModule,
  './colvis3-colony-terrain-frame-t7l':f,
});
for(const [radius,axisX,axisZ] of [[1,1,1],[.06,1,1],[.008,1.32,.74]]){
  const surface=new Surface(),site=new Site(radius,axisX,axisZ),footprint=radius*.00021;
  const original=surface.material;
  const binder=native.attachColvis3NativeTerrainT7i(surface,site,7,true,footprint,radius);
  check(()=>assert.ok(binder));
  const shader={vertexShader:'#include <common>\n#include <begin_vertex>',fragmentShader:'#include <common>\n#include <map_fragment>',uniforms:{}};
  surface.material.onBeforeCompile(shader,{});
  for(const token of ['vColvisTerrainViewPositionT7l','uColvisTerrainOriginViewT7l','uColvisTerrainDualXViewT7l','uColvisTerrainDualZViewT7l','colvisSiteT7l','diffuseColor.rgb*=']){
    check(()=>assert.ok(shader.vertexShader.includes(token)||shader.fragmentShader.includes(token),token));
  }
  const camera=new Camera();
  const initialStrength=shader.uniforms.uColvisTerrainStrengthT7l.value;
  for(const [zoom,theta,translation] of [[.32,0,0],[1,.2,radius*.006],[2,.5,radius*.04],[4,-.8,radius*.12],[8,1.2,radius*.2]]){
    const m=camera.matrixWorldInverse;m.c=Math.cos(theta);m.s=Math.sin(theta);m.ty=translation;
    binder.setZoom(zoom);binder.updateFrame(camera);
    const un=shader.uniforms;
    const origin=un.uColvisTerrainOriginViewT7l.value;
    const sample=site.localToWorld(new V(footprint*.8,0,footprint*-.45)).applyMatrix4(m).sub(origin);
    const x=sample.dot(un.uColvisTerrainDualXViewT7l.value);
    const z=sample.dot(un.uColvisTerrainDualZViewT7l.value);
    check(()=>assert.ok(Math.abs(x-.8)<1e-8 && Math.abs(z+.45)<1e-8,
      `Deslizamiento: radio=${radius} zoom=${zoom} UV=${x},${z}`));
    check(()=>assert.equal(un.uColvisTerrainExtentT7l.value,120));
  }
  check(()=>assert.ok(shader.uniforms.uColvisTerrainStrengthT7l.value<initialStrength));
  check(()=>assert.equal(surface.children.length,0));
  binder.dispose();binder.dispose();
  check(()=>assert.equal(surface.material,original));
  check(()=>assert.ok(!original.disposed));
}
check(()=>assert.ok(preview.includes('entry.surfaceMesh,colony.site,seed')));
check(()=>assert.ok(preview.includes('this.colonySurfaceContextT7e?.updateFrame(camera)')));
check(()=>assert.ok(!terrain.includes('new THREE.PlaneGeometry(')));
check(()=>assert.ok(!terrain.includes('uColvisTerrainFootprintT7k')));
check(()=>assert.ok(terrain.includes('COLVIS-T7l-VIEW-FRAME-LOCKED-v1')));
console.log(`PASS GENESIS 38.bis-T7l: ${count} comprobaciones; escala y anclaje estables en 3 tipos de luna, 5 niveles de zoom; atlas ${atlasTime.toFixed(0)} ms.`);
