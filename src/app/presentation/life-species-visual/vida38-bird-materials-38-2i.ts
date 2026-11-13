/**
 * GENESIS 38.2i.a — plumaje aviar más diferenciado y estable.
 * Estable en espacio local: no depende de cámara, tiempo ni pantalla.
 * Las plumas largas son láminas queratínicas instanciadas y no primitivas rígidas.
 */
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import type { Vida38BirdRawMeshV1 } from './vida38-bird-organic-field-38-2i';
import { deriveVida38BirdLandmarks38I,isVida38BirdProtectedFace38IA2 } from './vida38-bird-organic-field-38-2i';

export const VIDA38_BIRD_MATERIAL_REVISION='VIDA.38.2i.a/avian-feather-material/v2' as const;
const unit=(seed:number,salt:number):number=>{
  let x=(seed^Math.imul(salt+31,0x9e3779b9))>>>0;
  x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;
  return (x>>>0)/4294967296;
};

export function createVida38BirdSkin38I(raw:Vida38BirdRawMeshV1,c:Vida38SpeciesVisualContract):THREE.Mesh {
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(raw.positions,3));
  geometry.setAttribute('normal',new THREE.BufferAttribute(raw.normals,3));
  geometry.setAttribute('uv',new THREE.BufferAttribute(raw.uvs,2));
  geometry.setIndex(new THREE.BufferAttribute(raw.indices,1));
  geometry.computeBoundingSphere();
  const material=new THREE.MeshPhysicalMaterial({
    color:0xffffff,metalness:0,
    roughness:c.morphology.covering==='FEATHERS'?.90:.83,
    sheen:c.morphology.covering==='FEATHERS'?.16:.03,sheenRoughness:.87,
    clearcoat:.007,clearcoatRoughness:.96,specularIntensity:.22,
    side:THREE.FrontSide,
  });
  material.onBeforeCompile=shader=>{
    shader.uniforms['uVida38BirdPrimary']={value:new THREE.Color(c.pigmentation.primaryColorHex)};
    shader.uniforms['uVida38BirdSecondary']={value:new THREE.Color(c.pigmentation.secondaryColorHex)};
    shader.uniforms['uVida38BirdSeed']={value:(raw.morphology.identitySeed%17231)/2117};
    shader.uniforms['uVida38BirdPattern']={value:['SOLID','BANDS','SPOTS','MOTTLED'].indexOf(c.pigmentation.pattern)};
    shader.uniforms['uVida38BirdBodyY']={value:deriveVida38BirdLandmarks38I(raw.morphology).bodyY};
    shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>\nvarying vec3 vVida38BirdLocal;`)
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvVida38BirdLocal=position;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
      varying vec3 vVida38BirdLocal;
      uniform vec3 uVida38BirdPrimary;
      uniform vec3 uVida38BirdSecondary;
      uniform float uVida38BirdSeed;
      uniform float uVida38BirdPattern;
      uniform float uVida38BirdBodyY;
      float vida38BirdHash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+31.17);return fract((p.x+p.z)*p.y);}
      float vida38BirdNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(mix(vida38BirdHash(i),vida38BirdHash(i+vec3(1,0,0)),f.x),
          mix(vida38BirdHash(i+vec3(0,1,0)),vida38BirdHash(i+vec3(1,1,0)),f.x),f.y),
          mix(mix(vida38BirdHash(i+vec3(0,0,1)),vida38BirdHash(i+vec3(1,0,1)),f.x),
          mix(vida38BirdHash(i+vec3(0,1,1)),vida38BirdHash(i+vec3(1,1,1)),f.x),f.y),f.z);
      }
      float vida38BirdFbm(vec3 p){float v=0.,a=.5;for(int i=0;i<4;i++){
        v+=a*vida38BirdNoise(p);p=p*2.01+vec3(7.1,3.8,1.9);a*=.5;}
        return v;
      }
      float vida38BirdAA(float value,float threshold){float w=max(fwidth(value)*1.6,.005);
        return smoothstep(threshold-w,threshold+w,value);}
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec3 anatomical=vVida38BirdLocal+vec3(uVida38BirdSeed,0.,uVida38BirdSeed*.17);
      float macro=vida38BirdFbm(anatomical*1.8),regional=vida38BirdFbm(anatomical*3.7);
      float marks=.05;
      if(uVida38BirdPattern>.5&&uVida38BirdPattern<1.5){
        float strips=sin(anatomical.z*8.2+anatomical.x*3.5+macro*3.6);
        marks=.06+.48*(1.-vida38BirdAA(abs(strips),.45));
      }else if(uVida38BirdPattern>1.5&&uVida38BirdPattern<2.5){
        marks=.05+.53*vida38BirdAA(regional,.53);
      }else if(uVida38BirdPattern>2.5){
        marks=.05+.49*vida38BirdAA(macro*.73+regional*.27,.51);
      }
      float dorsal=vida38BirdAA(anatomical.y-uVida38BirdBodyY,.0);
      float featherGrain=vida38BirdFbm(anatomical*5.2+vec3(4.,7.,2.));
      float variation=(featherGrain-.5)*.065;
      float regionalTint=(dorsal-.5)*.10;
      float pigment=clamp(marks+regionalTint+variation,.015,.86);
      vec3 appearance=mix(uVida38BirdPrimary,uVida38BirdSecondary,pigment);
      diffuseColor.rgb*=appearance*(.97+(macro-.5)*.065);
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      float r=vida38BirdFbm(vVida38BirdLocal*3.6+vec3(uVida38BirdSeed));
      roughnessFactor=clamp(roughnessFactor+(r-.5)*.045,.72,.98);
    `);
  };
  material.customProgramCacheKey=()=>VIDA38_BIRD_MATERIAL_REVISION;
  const mesh=new THREE.Mesh(geometry,material);
  mesh.name='VIDA38_2I_BIRD_ORGANIC_SKIN';mesh.castShadow=true;mesh.receiveShadow=true;
  mesh.userData['reconstructionHypothesis']=true;
  mesh.userData['morphologyFingerprint']=raw.morphology.fingerprint;
  mesh.userData['sourceLengthMeters']=c.bodyLengthMeters;
  return mesh;
}

/** Lámina estrecha curvada; se orienta según el crecimiento anatómico. */
function featherGeometry():THREE.BufferGeometry {
  const positions:number[]=[],indices:number[]=[],uvs:number[]=[];
  for(let row=0;row<=8;row++){
    const t=row/8;
    const width=.5*Math.pow(Math.max(0,Math.sin(Math.PI*(.02+.98*t))),.72)*(1-.20*t);
    for(let column=0;column<=4;column++){
      const s=column/4*2-1;
      positions.push(s*width,t,.026*(1-s*s)*Math.sin(Math.PI*t)+.04*t*t);
      uvs.push(column/4,t);
    }
  }
  for(let row=0;row<8;row++)for(let col=0;col<4;col++){
    const a=row*5+col,b=a+5;
    indices.push(a,b,a+1,b,b+1,a+1);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geo.setIndex(indices);geo.computeVertexNormals();
  return geo;
}
function featherMaterial():THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({color:0xffffff,vertexColors:false,metalness:0,
    roughness:.91,clearcoat:.003,side:THREE.DoubleSide,sheen:.18,sheenRoughness:.80});
}

/** Plumaje de contorno: instancias adheridas a la malla con LOD de densidad. */
export function createVida38BirdContourFeathers38I(raw:Vida38BirdRawMeshV1,c:Vida38SpeciesVisualContract):THREE.InstancedMesh|null {
  if(c.morphology.covering!=='FEATHERS'||raw.morphology.featherDensity<=0)return null;
  const maxCount=raw.quality==='HIGH'?1700:raw.quality==='MEDIUM'?650:160;
  const count=Math.max(40,Math.round(maxCount*raw.morphology.featherDensity));
  const geometry=featherGeometry(),material=featherMaterial();
  const result=new THREE.InstancedMesh(geometry,material,count);
  result.name='VIDA38_2I_BIRD_CONTOUR_PLUMAGE';result.frustumCulled=false;
  const seed=raw.morphology.identitySeed;
  const dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0);
  const p=new THREE.Vector3(),n=new THREE.Vector3(),dir=new THREE.Vector3();
  const primary=new THREE.Color(c.pigmentation.primaryColorHex);
  const secondary=new THREE.Color(c.pigmentation.secondaryColorHex);
  const faceCount=raw.indices.length/3;
  for(let i=0;i<count;i++){
    // Superficie real de la especie: no distribuir sobre un elipsoide ficticio.
    const f=Math.min(faceCount-1,Math.floor(unit(seed,i*17+1)*faceCount));
    const a=raw.indices[f*3]!,b=raw.indices[f*3+1]!,d=raw.indices[f*3+2]!;
    const r=Math.sqrt(unit(seed,i*17+2)),q=unit(seed,i*17+3);
    const w0=1-r,w1=r*(1-q),w2=r*q;
    const coord=(vertex:number,axis:number)=>raw.positions[vertex*3+axis]!;
    const norm=(vertex:number,axis:number)=>raw.normals[vertex*3+axis]!;
    p.set(coord(a,0)*w0+coord(b,0)*w1+coord(d,0)*w2,
      coord(a,1)*w0+coord(b,1)*w1+coord(d,1)*w2,
      coord(a,2)*w0+coord(b,2)*w1+coord(d,2)*w2);
    // Las fibras queratínicas no pueden tapar ojos ni pico. Se desactiva
    // solamente la instancia afectada, sin alterar el recuento ni el LOD.
    if(isVida38BirdProtectedFace38IA2(raw.morphology,p.x,p.y,p.z)){
      dummy.position.set(0,0,0);
      dummy.scale.set(0,0,0);
      dummy.updateMatrix();result.setMatrixAt(i,dummy.matrix);
      result.setColorAt(i,primary);
      continue;
    }
    n.set(norm(a,0)*w0+norm(b,0)*w1+norm(d,0)*w2,
      norm(a,1)*w0+norm(b,1)*w1+norm(d,1)*w2,
      norm(a,2)*w0+norm(b,2)*w1+norm(d,2)*w2).normalize();
    // Reposo de rémiges: plumón sigue la superficie hacia la cola.
    dir.copy(n).multiplyScalar(.38).add(new THREE.Vector3(0,.04,-.85)).normalize();
    dummy.position.copy(p).addScaledVector(n,-.005);
    dummy.quaternion.setFromUnitVectors(up,dir);
    const s=.018+.031*unit(seed,i*17+4);
    dummy.scale.set(s*(.21+.20*unit(seed,i*17+5)),s*raw.morphology.featherLength,1);
    dummy.updateMatrix();result.setMatrixAt(i,dummy.matrix);
    const tint=unit(seed,i*17+6);
    result.setColorAt(i,primary.clone().lerp(secondary,.13+.48*tint).multiplyScalar(.82+.24*unit(seed,i*17+7)));
  }
  result.instanceMatrix.needsUpdate=true;
  if(result.instanceColor)result.instanceColor.needsUpdate=true;
  result.userData['reconstructionHypothesis']=true;
  return result;
}

/** Rémiges/rectrices tridimensionales, raíces apoyadas sobre el ala y la cola. */
export function createVida38BirdFlightFeathers38I(raw:Vida38BirdRawMeshV1,c:Vida38SpeciesVisualContract):THREE.InstancedMesh|null {
  if(c.morphology.covering!=='FEATHERS')return null;
  const m=raw.morphology,a=deriveVida38BirdLandmarks38I(m);
  // Dos filas diferenciadas: secundarias desde el antebrazo y primarias
  // desde la mano alar; una fracción de especies presenta ala desplegada.
  const secondaries=raw.quality==='LOW'?7:raw.quality==='MEDIUM'?12:18;
  const primaries=raw.quality==='LOW'?8:raw.quality==='MEDIUM'?15:21;
  const perTail=raw.quality==='LOW'?7:raw.quality==='MEDIUM'?11:15;
  const streamers=m.tailOrnament>.78?2:0;
  const count=(secondaries+primaries)*2+perTail+streamers;
  const inst=new THREE.InstancedMesh(featherGeometry(),featherMaterial(),count);
  inst.name='VIDA38_2I_BIRD_FLIGHT_FEATHERS';inst.frustumCulled=false;
  const dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0);
  const seed=m.identitySeed,primary=new THREE.Color(c.pigmentation.primaryColorHex);
  const secondary=new THREE.Color(c.pigmentation.secondaryColorHex);
  let index=0;
  function add(root:THREE.Vector3,tip:THREE.Vector3,width:number,tint:number):void {
    const dir=tip.clone().sub(root),len=dir.length();
    dummy.position.copy(root);dummy.quaternion.setFromUnitVectors(up,dir.normalize());
    dummy.scale.set(width,len,1);dummy.updateMatrix();inst.setMatrixAt(index,dummy.matrix);
    inst.setColorAt(index,primary.clone().lerp(secondary,tint));index++;
  }
  for(const side of [-1,1]){
    // Secundarias más cortas, nacen a lo largo de la zona humeral / cubital.
    for(let i=0;i<secondaries;i++){
      const t=(i+.38)/(secondaries+.48);
      const root=new THREE.Vector3(
        side*(a.wingRootX+(a.wingElbowX-a.wingRootX)*t),
        a.wingRootY+m.wingLift*t*.23,
        a.wingRootZ+(a.wingElbowZ-a.wingRootZ)*t);
      const len=(.11+.13*m.wingSpan)*(1+.24*Math.sin(t*Math.PI))*m.primaryFeatherLength;
      const tip=root.clone().add(new THREE.Vector3(side*.065*m.wingSpan,
        -.018+.025*m.wingLift,
        -len));
      add(root,tip,(.08+.05*m.wingBreadth)*(1-.26*t),.15+.40*unit(seed,110+i+(side+1)*29));
    }
    // Primarias largas: abanico distal con gradación de longitud real. Las
    // planeadoras y parte de las rapaces exhiben una silueta memorable.
    for(let i=0;i<primaries;i++){
      const t=(i+.14)/(primaries+.26);
      const root=new THREE.Vector3(
        side*(a.wingElbowX+(a.wingTipX-a.wingElbowX)*t),
        a.wingRootY+.05+m.wingLift*(.24+.76*t),
        a.wingElbowZ+(a.wingTipZ-a.wingElbowZ)*t);
      const longWing=.17+.20*m.wingSpan*m.primaryFeatherLength*(.7+.47*t);
      const tip=root.clone().add(new THREE.Vector3(
        side*(.065+.19*t)*m.wingSpan*m.primaryFeatherLength,
        .025*m.wingLift-.065*t,
        -longWing*(.67+.52*t)));
      add(root,tip,(.072+.033*m.wingBreadth)*(1-.32*t),
        .28+.50*unit(seed,210+i+(side+1)*41));
    }
  }
  for(let i=0;i<perTail;i++){
    const spread=(i-(perTail-1)/2)/Math.max(1,(perTail-1)/2);
    const root=new THREE.Vector3(spread*.06*m.bodyWidth,a.bodyY+.035,-.43*m.bodyLength);
    const fan=.43+.15*m.tailFan;
    const tip=new THREE.Vector3(spread*fan*m.tailFan,
      a.bodyY-.15-.07*Math.abs(spread),
      -.43*m.bodyLength-(.67+.20*m.tailOrnament)*m.tailLength*(1-.17*Math.abs(spread)));
    add(root,tip,.065+.052*m.tailFan,.12+.52*unit(seed,401+i));
  }
  if(streamers){
    // Dos rectrices terminales prolongadas (solo perfiles ornamentados).
    for(const side of [-1,1]){
      const root=new THREE.Vector3(side*.035*m.bodyWidth,a.bodyY+.03,-.45*m.bodyLength);
      const tip=new THREE.Vector3(side*.18*m.tailFan,a.bodyY-.15,
        -.45*m.bodyLength-(.90+.39*m.tailOrnament)*m.tailLength);
      add(root,tip,.048+.014*m.tailFan,.33+.13*unit(seed,470+side));
    }
  }
  inst.instanceMatrix.needsUpdate=true;if(inst.instanceColor)inst.instanceColor.needsUpdate=true;
  inst.userData['reconstructionHypothesis']=true;
  return inst;
}
