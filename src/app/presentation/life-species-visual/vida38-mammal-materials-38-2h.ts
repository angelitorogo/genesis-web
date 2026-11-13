/**
 * GENESIS 38.2h — piel/pelaje mamífero, sin recursos persistidos.
 * Ruido anclado a la anatomía, antialias por derivadas y fibras instanciadas.
 * Las reconstrucciones son hipotéticas y no implican nuevos taxones.
 */
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import type { Vida38MammalMorphologyV1 } from './vida38-mammal-morphology-38-2h';
import type { Vida38MammalRawMeshV1 } from './vida38-mammal-organic-field-38-2h';

export const VIDA38_MAMMAL_MATERIAL_REVISION='VIDA.38.2h/mammal-skin-fur/v1' as const;

const hash=(seed:number,salt:number):number=>{
  let x=(seed^Math.imul(salt+41,0x9e3779b9))>>>0;
  x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;
  return (x>>>0)/4294967295;
};
export function createVida38MammalSkin38H(raw:Vida38MammalRawMeshV1,contract:Vida38SpeciesVisualContract):THREE.Mesh {
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(raw.positions,3));
  geometry.setAttribute('normal',new THREE.BufferAttribute(raw.normals,3));
  geometry.setIndex(new THREE.BufferAttribute(raw.indices,1));
  geometry.computeBoundingSphere();
  const material=new THREE.MeshPhysicalMaterial({
    color:0xffffff,metalness:0,
    roughness:contract.morphology.covering==='FUR'?.93:.82,
    specularIntensity:.23,clearcoat:.006,clearcoatRoughness:.95,
    sheen:contract.morphology.covering==='FUR'?.10:0,
    sheenRoughness:.98,side:THREE.FrontSide,
  });
  material.onBeforeCompile=shader=>{
    shader.uniforms['uVida38MammalPrimary']={value:new THREE.Color(contract.pigmentation.primaryColorHex)};
    shader.uniforms['uVida38MammalSecondary']={value:new THREE.Color(contract.pigmentation.secondaryColorHex)};
    shader.uniforms['uVida38MammalSeed']={value:(raw.morphology.identitySeed%16381)*.001};
    shader.uniforms['uVida38MammalPattern']={value:['SOLID','BANDS','SPOTS','MOTTLED'].indexOf(contract.pigmentation.pattern)};
    shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>\nvarying vec3 vVida38MammalP;`)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvVida38MammalP = position;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
      varying vec3 vVida38MammalP;
      uniform vec3 uVida38MammalPrimary;
      uniform vec3 uVida38MammalSecondary;
      uniform float uVida38MammalSeed;
      uniform float uVida38MammalPattern;
      float vida38MammalHash(vec3 p){p=fract(p*0.1031);p+=dot(p,p.yzx+31.32);return fract((p.x+p.y)*p.z);}
      float vida38MammalNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
        return mix(mix(mix(vida38MammalHash(i),vida38MammalHash(i+vec3(1,0,0)),f.x),
          mix(vida38MammalHash(i+vec3(0,1,0)),vida38MammalHash(i+vec3(1,1,0)),f.x),f.y),
          mix(mix(vida38MammalHash(i+vec3(0,0,1)),vida38MammalHash(i+vec3(1,0,1)),f.x),
          mix(vida38MammalHash(i+vec3(0,1,1)),vida38MammalHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
      float vida38MammalFbm(vec3 p){float a=.5,v=0.;for(int i=0;i<4;i++){v+=a*vida38MammalNoise(p);p=p*1.99+vec3(12.4,4.5,8.7);a*=.5;}return v;}
      float vida38MammalAA(float n,float threshold){float aa=max(fwidth(n)*1.55,.004);return smoothstep(threshold-aa,threshold+aa,n);}
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec3 mammalLocal=vVida38MammalP + vec3(uVida38MammalSeed,0.,uVida38MammalSeed*.35);
      vec3 warp=vec3(vida38MammalFbm(mammalLocal*1.25+vec3(5,1,7)),
        vida38MammalFbm(mammalLocal*1.25+vec3(2,9,3)),
        vida38MammalFbm(mammalLocal*1.25+vec3(1,4,6)))-.5;
      vec3 q=mammalLocal+warp*.23;
      float macro=vida38MammalFbm(q*1.65), regional=vida38MammalFbm(q*3.1);
      float mark=0.05;
      if(uVida38MammalPattern>.5&&uVida38MammalPattern<1.5){
        float wave=sin(q.z*9.5 + q.y*2.0 + macro*4.0);
        mark=.04+.48*(1.0-vida38MammalAA(abs(wave),.48));
      }else if(uVida38MammalPattern>1.5&&uVida38MammalPattern<2.5){
        float spots=vida38MammalFbm(q*4.15 + vec3(1,7,3));
        mark=.06+.55*vida38MammalAA(spots,.52);
      }else if(uVida38MammalPattern>2.5){
        mark=.05+.51*vida38MammalAA(macro*.7+regional*.3,.52);
      }
      float dorsal=vida38MammalAA(vVida38MammalP.y,.92)*.055;
      float ventral=1.0-vida38MammalAA(vVida38MammalP.y,.78);
      float nuance=(vida38MammalFbm(q*6.0)-.5)*.075;
      float pigment=clamp(mark+dorsal+nuance,0.,.76);
      vec3 pigmentColor=mix(uVida38MammalPrimary,uVida38MammalSecondary,pigment);
      pigmentColor=mix(pigmentColor,pigmentColor*1.065,ventral*.28);
      diffuseColor.rgb*=pigmentColor;
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      float grain=vida38MammalFbm(vVida38MammalP*4.3+vec3(uVida38MammalSeed));
      roughnessFactor=clamp(roughnessFactor+(grain-.5)*.045,.64,.98);
    `);
  };
  material.customProgramCacheKey=()=>VIDA38_MAMMAL_MATERIAL_REVISION;
  const mesh=new THREE.Mesh(geometry,material);
  mesh.castShadow=true;mesh.receiveShadow=true;
  mesh.name='VIDA38_2H_MAMMAL_ORGANIC_SKIN';
  mesh.userData['reconstructionHypothesis']=true;
  mesh.userData['morphologyFingerprint']=raw.morphology.fingerprint;
  mesh.userData['sourceLengthMeters']=contract.bodyLengthMeters;
  return mesh;
}

/** Fibras instanciadas sobre triángulos reales, dispersión estratificada y LOD. */
export function createVida38MammalFur38H(raw:Vida38MammalRawMeshV1,contract:Vida38SpeciesVisualContract):THREE.InstancedMesh|null {
  const profile=raw.morphology;
  if(contract.morphology.covering!=='FUR'||profile.furDensity<=0) return null;
  const limit=raw.quality==='HIGH'?2600:raw.quality==='MEDIUM'?900:320;
  const count=Math.round(limit*(.35+.65*profile.furDensity));
  if(count<=0)return null;
  const geometry=new THREE.ConeGeometry(1,1,4,1);
  // base en y=0: los mechones nacen en piel y se inclinan hacia el dorso.
  geometry.translate(0,.5,0);
  const hairBase=new THREE.Color(contract.pigmentation.primaryColorHex);
  const hairAccent=new THREE.Color(contract.pigmentation.secondaryColorHex);
  const material=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.97,metalness:0,side:THREE.DoubleSide});
  const instances=new THREE.InstancedMesh(geometry,material,count);
  instances.name='VIDA38_2H_MAMMAL_INSTANCED_FUR';
  instances.frustumCulled=false;
  const faceCount=raw.indices.length/3;
  const dummy=new THREE.Object3D();
  const normal=new THREE.Vector3(),p=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
  const meshP=(i:number)=>new THREE.Vector3(raw.positions[i*3]!,raw.positions[i*3+1]!,raw.positions[i*3+2]!);
  const meshN=(i:number)=>new THREE.Vector3(raw.normals[i*3]!,raw.normals[i*3+1]!,raw.normals[i*3+2]!);
  const selected=raw.morphology.identitySeed;
  for(let i=0;i<count;i++){
    const tri=Math.min(faceCount-1,Math.floor(hash(selected,i*13+1)*faceCount));
    const i0=raw.indices[tri*3]!,i1=raw.indices[tri*3+1]!,i2=raw.indices[tri*3+2]!;
    const r=Math.sqrt(hash(selected,i*13+2)), s=hash(selected,i*13+3);
    const w0=1-r,w1=r*(1-s),w2=r*s;
    p.copy(meshP(i0)).multiplyScalar(w0).addScaledVector(meshP(i1),w1).addScaledVector(meshP(i2),w2);
    normal.copy(meshN(i0)).multiplyScalar(w0).addScaledVector(meshN(i1),w1).addScaledVector(meshN(i2),w2).normalize();
    // dirección desde epidermis hacia fuera y ligeramente hacia atrás.
    const tip=normal.clone().multiplyScalar(.84).add(new THREE.Vector3(0,.07,-.23)).normalize();
    dummy.position.copy(p).addScaledVector(normal,-.004);
    dummy.quaternion.setFromUnitVectors(up,tip);
    const len=(.017+.025*hash(selected,i*13+4))*profile.furLength;
    const radius=.0008+.0010*hash(selected,i*13+5);
    dummy.scale.set(radius,len,radius);
    dummy.updateMatrix();instances.setMatrixAt(i,dummy.matrix);
    const hue=hash(selected,i*13+6);
    instances.setColorAt(i,hairBase.clone().lerp(hairAccent,.15+.50*hue).multiplyScalar(.72+.32*hash(selected,i*13+7)));
  }
  instances.instanceMatrix.needsUpdate=true;
  if(instances.instanceColor)instances.instanceColor.needsUpdate=true;
  instances.userData['reconstructionHypothesis']=true;
  instances.userData['morphologyFingerprint']=profile.fingerprint;
  return instances;
}
