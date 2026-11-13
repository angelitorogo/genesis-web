'use strict';
/** Auditoría geométrica sin DOM/WebGL: instancia el constructor TS real con un
 * adaptador mínimo de las clases Three.js, y verifica topología/espesores. */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const ts=require('typescript');
class Attribute{
  constructor(array,itemSize){this.array=Float32Array.from(array);this.itemSize=itemSize;this.count=this.array.length/itemSize;this.needsUpdate=false;}
  getX(i){return this.array[i*this.itemSize];}
  getY(i){return this.array[i*this.itemSize+1];}
  getZ(i){return this.array[i*this.itemSize+2];}
  setXYZ(i,x,y,z){this.array[i*this.itemSize]=x;this.array[i*this.itemSize+1]=y;this.array[i*this.itemSize+2]=z;}
  clone(){return new Attribute(this.array,this.itemSize);}
}
class Geometry{
  constructor(){this.attributes={};this.index=null;}
  setAttribute(k,v){this.attributes[k]=v;return this;}
  getAttribute(k){return this.attributes[k];}
  setIndex(index){this.index=Array.from(index);return this;}
  getIndex(){return this.index;}
  computeVertexNormals(){if(!this.attributes.normal)this.attributes.normal=new Attribute(Array(this.attributes.position.count*3).fill(0),3);}
  computeBoundingSphere(){}
  clone(){const g=new Geometry();for(const [k,v] of Object.entries(this.attributes))g.attributes[k]=v.clone();g.index=this.index?.slice()??null;return g;}
}
class Color{constructor(v){this.rgb=hexToRgb(v);}
  lerp(other,t){this.rgb=this.rgb.map((v,i)=>v*(1-t)+other.rgb[i]*t);return this;}
}
function hexToRgb(value){if(typeof value==='string'&&value[0]==='#'){const n=parseInt(value.slice(1),16);return [(n>>16)&255,(n>>8)&255,n&255];}return [32,48,64];}
class Material{constructor(opts){this.opts=opts;this.color=new Color(opts.color);}}
class Mesh{constructor(geo,mat){this.geometry=geo;this.material=mat;this.userData={};this.castShadow=false;this.receiveShadow=false;}}
class Vector4{constructor(x,y,z,w){this.x=x;this.y=y;this.z=z;this.w=w;}}
const THREE={
  BufferGeometry:Geometry,Float32BufferAttribute:Attribute,MeshPhysicalMaterial:Material,
  Color,Mesh,Vector4,DoubleSide:2,
};
function makeBody(){
  const g=new Geometry(),vertices=[],normals=[],indices=[];
  const around=40,high=30,centerY=1.39,halfH=.57;
  for(let j=0;j<=high;j++){
    const v=j/high;
    const y=centerY+(v-.5)*2*halfH;
    const t=(v-.5)*2;
    const radius=(1-t*t*.58);
    for(let i=0;i<=around;i++){
      const angle=i/around*Math.PI*2;
      const x=Math.sin(angle)*.28*radius,z=Math.cos(angle)*.205*radius;
      vertices.push(x,y,z);normals.push(Math.sin(angle),.08,Math.cos(angle));
    }
  }
  for(let j=0;j<high;j++)for(let i=0;i<around;i++){
    const a=j*(around+1)+i,b=a+1,c=a+around+1,d=c+1;
    indices.push(a,b,c,b,d,c);
  }
  g.setAttribute('position',new Attribute(vertices,3));g.setAttribute('normal',new Attribute(normals,3));g.setIndex(indices);
  return new Mesh(g,new Material({color:'#677688'}));
}
const file=path.join(process.cwd(),'src/app/presentation/life-species-visual/vida38-reptilian-technical-garments-38-2oe8.ts');
const transpiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const sandboxModule={exports:{}};
vm.runInNewContext(transpiled,{module:sandboxModule,exports:sandboxModule.exports,require:id=>id==='three'?THREE:(()=>{throw new Error(id)})()},
  {filename:'vida38-reptilian-technical-garments-38-2oe8.compiled.js'});
const {deriveVida38TechArmorPlan38OE8,createVida38ReptilianTechnicalGarments38OE8}=sandboxModule.exports;
const a={legLength:1.04,torsoLength:0.73,shoulderWidth:0.31,hipWidth:0.235,hipSpacing:0.96};
let checked=0,closed=0;
for(const family of ['SEGMENTED_ARMOR','COLONIAL_RIG']){
  const plan=deriveVida38TechArmorPlan38OE8({speciesId:`OE8-GEOMETRY-${family}`,appearanceFingerprint:'synthetic:1',family,
    garmentLine:family==='SEGMENTED_ARMOR'?'MILITARY':'INDUSTRIAL_COLONIZER',culture:'FRONTIER_HEGEMONY'});
  const items=createVida38ReptilianTechnicalGarments38OE8(makeBody(),a,plan,'LOW');
  assert(items.length>=7,'Debe haber varias piezas anatómicas reales');
  for(const m of items){
    const p=m.geometry.getAttribute('position');assert(p.count>=20);
    for(const n of p.array)assert(Number.isFinite(n),'Coordenada geométrica no finita');
    const ix=m.geometry.getIndex();
    if(!ix)continue;assert(ix.length%3===0);
    const edges=new Map();
    for(let i=0;i<ix.length;i+=3)for(const [v,w] of [[ix[i],ix[i+1]],[ix[i+1],ix[i+2]],[ix[i+2],ix[i]]]){
      assert(v<p.count&&w<p.count,'Índice fuera de geometría');
      const key=`${Math.min(v,w)}:${Math.max(v,w)}`;
      edges.set(key,(edges.get(key)||0)+1);
    }
    const part=String(m.userData['garmentPart38OE6']);
    if(m.userData['garmentGeom38OE8']==='ANATOMICAL_CURVED_PLATE'){
      const holes=[...edges.values()].filter(n=>n===1).length;
      const nonManifold=[...edges.values()].filter(n=>n>2).length;
      assert(holes===0,`Placa con borde abierto: ${part}: ${holes}`);
      assert(nonManifold===0,`Placa non-manifold: ${part}: ${nonManifold}`);
      assert(m.userData['armorSealedThickness38OE8']>0);
      closed++;
    }
    checked++;
  }
}
console.log(`GENESIS_38_2OE8_GEOMETRY_OK: ${checked} mallas sintéticas, ${closed} placas curvas con superficies cerradas, sin NaN ni índices inválidos`);
