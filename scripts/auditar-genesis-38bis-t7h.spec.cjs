/** GENESIS 38.bis-T7h — auditoría portátil: CPU, superficie y no-oclusión. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {performance}=require('node:perf_hooks');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const src=(file)=>fs.readFileSync(path.join(root,file),'utf8');
const surface=src('src/app/presentation/infrastructure/colvis3-colony-context-surface-t7e.ts');
const camera=src('src/app/presentation/infrastructure/colvis3-colony-camera-t7e.ts');
const preview=src('src/app/presentation/scientific-body-preview/scientific-body-preview.ts');
const spec=src('src/app/presentation/infrastructure/colvis3-colony-context-t7e.spec.ts');
let passed=0;
const check=(fn)=>{fn();passed++;};
for(const s of [surface,camera,preview,spec]){
  const output=ts.transpileModule(s,{reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
  check(()=>assert.equal((output.diagnostics??[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0));
}
class FakeBufferAttribute {
  constructor(array,itemSize){this.array=array;this.itemSize=itemSize;this.count=array.length/itemSize;}
  getX(i){return this.array[i*3];}
  getY(i){return this.array[i*3+1];}
  getZ(i){return this.array[i*3+2];}
  setY(i,v){this.array[i*3+1]=v;}
}
class FakeGeometry {
  constructor(w,h,sx,sy){
    this.array=new Float32Array((sx+1)*(sy+1)*3);
    let j=0;
    for(let y=0;y<=sy;y++)for(let x=0;x<=sx;x++){
      this.array[j++]=(x/sx-.5)*w;
      this.array[j++]=0;
      this.array[j++]=(y/sy-.5)*h;
    }
    this.position=new FakeBufferAttribute(this.array,3);
  }
  rotateX(){}
  getAttribute(name){return name==='position'?this.position:null;}
  computeVertexNormals(){}
  dispose(){this.disposed=true;}
}
class FakeDataTexture {
  constructor(data,w,h){this.data=data;this.width=w;this.height=h;}
  dispose(){this.disposed=true;}
}
class FakeMaterial {
  constructor(args){Object.assign(this,args);}
  dispose(){this.disposed=true;}
}
class FakeMesh {
  constructor(geometry,material){this.geometry=geometry;this.material=material;this.scale={x:1};}
}
const three={
  PlaneGeometry:FakeGeometry, DataTexture:FakeDataTexture,
  MeshStandardMaterial:FakeMaterial,Mesh:FakeMesh,
  RGBAFormat:'rgba', SRGBColorSpace:'srgb',
  LinearMipmapLinearFilter:'linear-mipmap',LinearFilter:'linear',FrontSide:0,
};
const mod={exports:{}};
const transpiled=ts.transpileModule(surface,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
new Function('require','module','exports',transpiled)((name)=>{
  if(name==='three')return three;
  throw new Error('Import inesperado: '+name);
},mod,mod.exports);
const helper=mod.exports;
const cameraExports={};
const cameraCompiled=ts.transpileModule(camera,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
new Function('exports',cameraCompiled)(cameraExports);
check(()=>assert.equal(cameraExports.COLVIS3_MAX_INSPECTION_ZOOM_T7E,8));
for(const z of [1,4,8]){
  const framing=cameraExports.colvis3ColonyFramingT7e(.0002,1,z);
  check(()=>assert.equal(framing.bodyCentreBlend,0));
  check(()=>assert.ok(framing.nearScene>0&&framing.farScene>framing.distanceScene));
}
for(const fixture of [[0,1,1,42,true],[.001,0,1,42,true],[.001,1,0,42,false]]){
  check(()=>assert.equal(helper.createColvis3ColonyContextSurfaceT7e(...fixture),null));
}
const small=helper.colvis3SurfaceDetailPixelsT7e(42,true,64,true);
const repeat=helper.colvis3SurfaceDetailPixelsT7e(42,true,64,true);
check(()=>assert.deepEqual(small,repeat));
check(()=>assert.equal(small[3],0));
check(()=>assert.ok(small[(32*64+32)*4+3]>240));
check(()=>assert.notDeepEqual(small,helper.colvis3SurfaceDetailPixelsT7e(43,true,64,true)));
const colors=new Set();for(let i=0;i<small.length;i+=4)colors.add(small[i]);
check(()=>assert.ok(colors.size>30));
const start=performance.now();
const context=helper.createColvis3ColonyContextSurfaceT7e(.0002,1,1,18374,true);
const generationMs=performance.now()-start;
check(()=>assert.ok(context!==null));
check(()=>assert.equal(context.mesh.material.depthTest,true));
check(()=>assert.equal(context.detailMesh.material.depthTest,true));
check(()=>assert.equal(context.mesh.material.depthWrite,false));
check(()=>assert.equal(context.detailMesh.material.depthWrite,false));
check(()=>assert.ok(context.mesh.material.opacity<.85));
check(()=>assert.ok(context.detailMesh.material.opacity<.9));
check(()=>assert.equal(context.mesh.material.alphaTest,.015));
check(()=>assert.equal(context.detailMesh.renderOrder,0));
check(()=>assert.ok(context.material.bumpScale<=.0002*.04));
check(()=>assert.ok(context.detailRadiusScene>.0002*5));
const vertices=context.detailMesh.geometry.getAttribute('position');
const mid=vertices.getY(Math.floor(vertices.count/2));
check(()=>assert.ok(Math.abs(mid)<.0002*.04,`Relieve central excesivo: ${mid}`));
context.setZoom(8);
check(()=>assert.equal(context.detailMesh.material.opacity,0));
context.setZoom(1);
check(()=>assert.ok(context.detailMesh.material.opacity>.65));
check(()=>assert.ok(!preview.includes('this.colonySurfaceContextT7e.material.needsUpdate=true')));
for(const token of [
  'attachColvis3NativeTerrainT7i(',
  'this.colonySurfaceContextT7e?.dispose()',
  'this.colonySurfaceContextT7e?.setZoom(this.colonyInspectionZoomCOLVIS2)',
  'this.lockBackgroundScrollT7d()',
  'this.unlockBackgroundScrollT7d()',
]) check(()=>assert.ok(preview.includes(token),token));
for(const token of ['stampCraters(','const heights=new Float32Array(n*n)','footprintScene*.025','bodyRadiusScene*.000012','depthTest:true','mesh.renderOrder=0'])
  check(()=>assert.ok(surface.includes(token),token));
context.dispose();
check(()=>assert.ok(context.mesh.geometry.disposed));
check(()=>assert.ok(context.detailMesh.geometry.disposed));
check(()=>assert.ok(context.mesh.material.disposed));
check(()=>assert.ok(context.detailMesh.material.disposed));
console.log(`PASS GENESIS 38.bis-T7h: ${passed} verificaciones portátiles; generación inicial ${generationMs.toFixed(0)} ms (CPU aislada, sin WebGL).`);
