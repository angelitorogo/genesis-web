/** GENESIS 38.2e — piel/coberturas procedurales integradas, PBR sin metal pintado. */
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import type { Vida38HumanoidAnatomy, Vida38HumanoidRawMesh } from './vida38-humanoid-organic-field-38-2e';
import { measureVida38HumanoidMeshV1 } from './vida38-humanoid-organic-field-38-2e';

function hash3(x:number,y:number,z:number,seed:number):number {
  let h=seed ^ Math.imul(x,0x8da6b343) ^ Math.imul(y,0xd8163841) ^ Math.imul(z,0xcb1ab31f);
  h=Math.imul(h^(h>>>16),0x7feb352d);
  h=Math.imul(h^(h>>>15),0x846ca68b);
  return ((h^(h>>>16))>>>0)/0xffffffff;
}
const smooth=(t:number)=>t*t*(3-2*t);
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
function noise3(x:number,y:number,z:number,s:number):number {
  const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z);
  const fx=smooth(x-xi),fy=smooth(y-yi),fz=smooth(z-zi);
  const n=(i:number,j:number,k:number)=>hash3(xi+i,yi+j,zi+k,s);
  const a=lerp(lerp(n(0,0,0),n(1,0,0),fx),lerp(n(0,1,0),n(1,1,0),fx),fy);
  const b=lerp(lerp(n(0,0,1),n(1,0,1),fx),lerp(n(0,1,1),n(1,1,1),fx),fy);
  return lerp(a,b,fz);
}
function fractal(x:number,y:number,z:number,seed:number):number {
  return noise3(x,y,z,seed)*0.55+noise3(x*2.08+1.5,y*2.08,z*2.08+2.4,seed+1)*0.30+
    noise3(x*4.12,y*4.12+0.4,z*4.12,seed+2)*0.15;
}
function pigmentFraction(contract:Vida38SpeciesVisualContract,a:Vida38HumanoidAnatomy,x:number,y:number,z:number):number {
  const seed=a.visualSeed;
  const warp=fractal(x*2.7,y*2.7,z*2.7,seed)-0.5;
  let pattern=0.12;
  switch(contract.pigmentation.pattern) {
    case 'BANDS': {
      const waveform=Math.sin((y*8.7+warp*2.0)+Math.sin(x*6.0+z*2.8)*0.34);
      pattern=smooth(Math.max(0,Math.min(1,0.5+waveform*0.58)))*0.62;
      break;
    }
    case 'MOTTLED': pattern=Math.pow(fractal(x*5.2,y*5.2,z*5.2,seed+3),1.25)*0.65;break;
    case 'SPOTS': {
      const cells=noise3(x*11.7,y*11.7,z*11.7,seed+4);
      pattern=(cells>0.62?0.72:0.11)+warp*0.12;
      break;
    }
    case 'SOLID': pattern=0.07+fractal(x*2.4,y*2.4,z*2.4,seed+5)*0.09;break;
  }
  // Diferencias anatómicas sutiles; no se dibujan manchas flotantes.
  const dorsal=Math.max(0,Math.min(1,(-z+0.10)*1.2));
  const face=y>a.legLength+1.02?0.06:0;
  return Math.max(0,Math.min(1,pattern*0.82+dorsal*0.18+face+warp*0.11));
}

function tileNoise(x:number,y:number,seed:number):number {
  // Función periódica para evitar una costura visible en normal/roughness map.
  const a=Math.sin(2*Math.PI*x), b=Math.cos(2*Math.PI*x);
  const c=Math.sin(2*Math.PI*y), d=Math.cos(2*Math.PI*y);
  return (Math.sin(a*6.7+c*8.2+seed*0.013)*Math.cos(b*9.4+d*4.9+seed*0.017)+
    Math.sin(a*17.1-d*13.2+seed*0.031)*0.35)/1.35;
}
function texturesForCovering(contract:Vida38SpeciesVisualContract,seed:number):{
  normalMap:THREE.DataTexture; roughnessMap:THREE.DataTexture;
} {
  const width=256,height=256;
  const normalPixels=new Uint8Array(width*height*4),roughnessPixels=new Uint8Array(width*height*4);
  const covering=contract.morphology.covering;
  const roughness=covering==='SCALES'?0.79:covering==='LEATHERY'?0.87:covering==='FUR'?0.94:0.89;
  const scale=covering==='SCALES'?0.17:covering==='FUR'?0.10:0.075;
  const step=1/width;
  for(let iy=0;iy<height;iy++) for(let ix=0;ix<width;ix++) {
    const u=ix/width,v=iy/height;
    const bump=(x:number,y:number)=>{
      const h=tileNoise(x,y,seed);
      if(covering==='SCALES'){
        const pattern=(Math.cos(u*2*Math.PI*32)*Math.cos(v*2*Math.PI*45));
        return h*0.35+pattern*0.65;
      }
      if(covering==='FUR')return h*0.52+Math.sin(v*2*Math.PI*61+u*7)*0.48;
      return h;
    };
    const dx=(bump((u+step)%1,v)-bump((u-step+1)%1,v))*scale;
    const dy=(bump(u,(v+step)%1)-bump(u,(v-step+1)%1))*scale;
    const nz=1/Math.sqrt(dx*dx+dy*dy+1);
    const i=(iy*width+ix)*4;
    normalPixels[i]=Math.round(((-dx*nz)*0.5+0.5)*255);
    normalPixels[i+1]=Math.round(((-dy*nz)*0.5+0.5)*255);
    normalPixels[i+2]=Math.round((nz*0.5+0.5)*255);
    normalPixels[i+3]=255;
    const varr=tileNoise(u,v,seed+19);
    const r=Math.max(0.32,Math.min(0.99,roughness+varr*0.065));
    roughnessPixels[i]=255;
    roughnessPixels[i+1]=Math.round(r*255);
    roughnessPixels[i+2]=255;
    roughnessPixels[i+3]=255;
  }
  const make=(data:Uint8Array)=>{
    const tex=new THREE.DataTexture(data,width,height,THREE.RGBAFormat,THREE.UnsignedByteType);
    tex.wrapS=THREE.RepeatWrapping;tex.wrapT=THREE.RepeatWrapping;
    tex.magFilter=THREE.LinearFilter;
    tex.minFilter=THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps=true;
    tex.needsUpdate=true;
    return tex;
  };
  return {normalMap:make(normalPixels),roughnessMap:make(roughnessPixels)};
}

export function createVida38HumanoidSkinV1(raw:Vida38HumanoidRawMesh,contract:Vida38SpeciesVisualContract):THREE.Mesh {
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(raw.positions,3));
  geometry.setAttribute('normal',new THREE.BufferAttribute(raw.normals,3));
  geometry.setAttribute('uv',new THREE.BufferAttribute(raw.uvs,2));
  geometry.setIndex(new THREE.BufferAttribute(raw.indices,1));
  const main=new THREE.Color(contract.pigmentation.primaryColorHex);
  const secondary=new THREE.Color(contract.pigmentation.secondaryColorHex);
  const vertexColors=new Float32Array(raw.positions.length);
  for(let i=0;i<raw.positions.length;i+=3){
    const x=raw.positions[i]!,y=raw.positions[i+1]!,z=raw.positions[i+2]!;
    const pattern=pigmentFraction(contract,raw.anatomy,x,y,z);
    const bright=0.88+fractal(x*25.1,y*25.1,z*25.1,raw.anatomy.visualSeed+7)*0.20;
    const mix=main.clone().lerp(secondary,pattern).multiplyScalar(bright);
    vertexColors[i]=mix.r;vertexColors[i+1]=mix.g;vertexColors[i+2]=mix.b;
  }
  geometry.setAttribute('color',new THREE.BufferAttribute(vertexColors,3));
  geometry.computeBoundingSphere();geometry.computeBoundingBox();
  const maps=texturesForCovering(contract,raw.anatomy.visualSeed);
  const mat=new THREE.MeshPhysicalMaterial({
    color:0xffffff,
    vertexColors:true,
    roughness:0.93,
    roughnessMap:maps.roughnessMap,
    normalMap:maps.normalMap,
    normalScale:new THREE.Vector2(0.35,0.35),
    metalness:0,
    clearcoat:0.026,
    clearcoatRoughness:0.87,
    sheen:contract.morphology.covering==='FUR'?0.18:0.045,
    sheenRoughness:0.85,
    side:THREE.FrontSide,
  });
  const mesh=new THREE.Mesh(geometry,mat);
  mesh.name='VIDA38_2E_ORGANIC_SKIN';
  mesh.castShadow=true;mesh.receiveShadow=true;
  mesh.userData['revision']='VIDA.38.2e/humanoid-implicit-mesh/v1';
  mesh.userData['meterLengthOriginal']=contract.bodyLengthMeters;
  mesh.userData['morphologyRevision']=raw.anatomy.morphology.revision;
  mesh.userData['anatomyFingerprint']=raw.anatomy.morphology.anatomyFingerprint;
  mesh.userData['metersPerUnit']=measureVida38HumanoidMeshV1(raw).metersPerUnit;
  mesh.userData['reconstructionHypothesis']=true;
  return mesh;
}

export function createVida38HumanoidOcularDetailsV1(a:Vida38HumanoidAnatomy,contract:Vida38SpeciesVisualContract):THREE.Object3D[] {
  // Órganos visuales en cavidades SDF, no esferas flotando sobre la cabeza.
  const objs:THREE.Object3D[]=[];
  const irisBase=new THREE.Color(contract.pigmentation.secondaryColorHex).lerp(new THREE.Color('#33404a'),0.55);
  const eyeballMat=new THREE.MeshPhysicalMaterial({color:0x29323a,roughness:0.17,clearcoat:0.64,clearcoatRoughness:0.18,metalness:0});
  const irisMat=new THREE.MeshPhysicalMaterial({color:irisBase,roughness:0.26,clearcoat:0.25,metalness:0});
  const pupilMat=new THREE.MeshPhysicalMaterial({color:0x071015,roughness:0.08,clearcoat:0.85,metalness:0});
  for(const side of [-1,1]){
    const cx=side*a.eyeSpacing;
    const cy=a.legLength+(1.18+(a.neckLength-1)*0.14)*a.torsoLength;
    const cz=0.248+a.faceProjection*0.12+a.postureLean*Math.max(0,cy-a.legLength);
    const bulb=new THREE.Mesh(new THREE.SphereGeometry(a.eyeRadius*0.93,28,20),eyeballMat);
    bulb.position.set(cx,cy,cz-0.012);
    bulb.scale.set(1.0,0.88,0.9);
    const iris=new THREE.Mesh(new THREE.SphereGeometry(a.eyeRadius*0.45,24,16),irisMat);
    iris.position.set(cx,cy,cz+a.eyeRadius*0.72);
    iris.scale.set(1,1,0.37);
    const pupil=new THREE.Mesh(new THREE.SphereGeometry(a.eyeRadius*0.20,20,14),pupilMat);
    pupil.position.set(cx,cy,cz+a.eyeRadius*0.84);
    pupil.scale.set(1,1,0.28);
    for(const o of [bulb,iris,pupil]){o.name=`VIDA38_2E_EYE_${side}`;objs.push(o);}
  }
  return objs;
}
