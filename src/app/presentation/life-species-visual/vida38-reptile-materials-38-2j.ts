/** GENESIS 38.2j — escamas y placas procedurales, adheridas a coordenadas locales. */
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import type { Vida38ReptileRawMeshV1 } from './vida38-reptile-organic-field-38-2j';
import {deriveVida38ReptileLandmarks38J} from './vida38-reptile-organic-field-38-2j';

export const VIDA38_REPTILE_MATERIAL_REVISION='VIDA.38.2j.a/reptile-scales/opaque-scoped-v2' as const;
export const VIDA38_REPTILE_SHADER_FRAGMENT_COMMON=`
varying vec3 vVida38ReptileP;
varying vec3 vVida38ReptileN;
uniform vec3 uVida38ReptilePrimary;
uniform vec3 uVida38ReptileSecondary;
uniform float uVida38ReptileSeed;
uniform float uVida38ReptilePattern;
uniform float uVida38ReptileScaleSize;
uniform float uVida38ReptileArmor;
uniform float uVida38ReptileBodyY;
uniform float uVida38ReptileBodyDepth;
uniform float uVida38ReptileBodyLength;
uniform float uVida38ReptileHeadZ;
uniform float uVida38ReptileCoverage;
float vida38ReptileHash(vec3 p){
  p=fract(p*.1031);p+=dot(p,p.yzx+31.12);return fract((p.x+p.z)*p.y);
}
float vida38ReptileNoise(vec3 p){
  vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(mix(vida38ReptileHash(i),vida38ReptileHash(i+vec3(1,0,0)),f.x),
      mix(vida38ReptileHash(i+vec3(0,1,0)),vida38ReptileHash(i+vec3(1,1,0)),f.x),f.y),
    mix(mix(vida38ReptileHash(i+vec3(0,0,1)),vida38ReptileHash(i+vec3(1,0,1)),f.x),
      mix(vida38ReptileHash(i+vec3(0,1,1)),vida38ReptileHash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float vida38ReptileFbm(vec3 p){
  float sum=0.,w=.5;
  for(int i=0;i<4;i++){sum+=w*vida38ReptileNoise(p);p=p*2.01+vec3(6.4,11.2,2.7);w*=.5;}
  return sum;
}
float vida38ReptileAA(float value,float limit){
  float width=max(fwidth(value)*1.40,.004);
  return smoothstep(limit-width,limit+width,value);
}
float vida38ReptileCells(vec2 p){
  vec2 row=vec2(p.x+mod(floor(p.y),2.)*.5,p.y);
  vec2 fracCell=fract(row)-.5;
  // Escamas algo elípticas, con ribete antialias y sin alta frecuencia en distancia.
  float d=length(fracCell*vec2(1.0,.83));
  return 1.-vida38ReptileAA(d,.405);
}
float vida38ReptileScaleMask(vec3 p,vec3 n,float frequency){
  vec3 w=pow(abs(n),vec3(3.));w/=max(.001,w.x+w.y+w.z);
  float x=vida38ReptileCells(p.yz*frequency);
  float y=vida38ReptileCells(p.zx*frequency);
  float z=vida38ReptileCells(p.xy*frequency);
  return x*w.x+y*w.y+z*w.z;
}
float vida38ReptileRegions(vec3 p){
  return smoothstep(uVida38ReptileBodyY-.22*uVida38ReptileBodyDepth,
    uVida38ReptileBodyY+.14*uVida38ReptileBodyDepth,p.y);
}
`;

export function createVida38ReptileSkin38J(raw:Vida38ReptileRawMeshV1,contract:Vida38SpeciesVisualContract):THREE.Mesh{
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(raw.positions,3));
  geometry.setAttribute('normal',new THREE.BufferAttribute(raw.normals,3));
  geometry.setIndex(new THREE.BufferAttribute(raw.indices,1));
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();
  const p=raw.morphology;
  const a=deriveVida38ReptileLandmarks38J(p);
  const material=new THREE.MeshPhysicalMaterial({
    color:0xffffff,metalness:0,roughness:contract.morphology.covering==='SCALES'?.85:.90,
    specularIntensity:.22,clearcoat:.008,clearcoatRoughness:.96,side:THREE.FrontSide,
    // 38.2j.a: el cuerpo no usa alpha; ojos y dientes siguen siendo submallas.
    transparent:false,opacity:1,alphaTest:0,depthWrite:true,depthTest:true,colorWrite:true,
  });
  material.onBeforeCompile=shader=>{
    // Si Three.js cambia alguno de los chunks, utilizar el material PBR
    // estándar opaco con el color VIDA, en vez de inyectar GLSL incompleto.
    if(!shader.vertexShader.includes('#include <common>') ||
      !shader.vertexShader.includes('#include <begin_vertex>') ||
      !shader.fragmentShader.includes('#include <common>') ||
      !shader.fragmentShader.includes('#include <color_fragment>') ||
      !shader.fragmentShader.includes('#include <roughnessmap_fragment>')){
      material.color.set(contract.pigmentation.primaryColorHex);
      return;
    }
    shader.uniforms['uVida38ReptilePrimary']={value:new THREE.Color(contract.pigmentation.primaryColorHex)};
    shader.uniforms['uVida38ReptileSecondary']={value:new THREE.Color(contract.pigmentation.secondaryColorHex)};
    shader.uniforms['uVida38ReptileSeed']={value:(p.identitySeed%15137)*.001};
    shader.uniforms['uVida38ReptilePattern']={value:['SOLID','BANDS','SPOTS','MOTTLED'].indexOf(contract.pigmentation.pattern)};
    shader.uniforms['uVida38ReptileScaleSize']={value:p.scaleSize};
    shader.uniforms['uVida38ReptileArmor']={value:p.dorsalArmor};
    shader.uniforms['uVida38ReptileBodyY']={value:a.bodyY};
    shader.uniforms['uVida38ReptileBodyDepth']={value:p.bodyDepth};
    shader.uniforms['uVida38ReptileBodyLength']={value:p.bodyLength};
    shader.uniforms['uVida38ReptileHeadZ']={value:a.headZ};
    shader.uniforms['uVida38ReptileCoverage']={value:contract.morphology.covering==='SCALES'?1:.65};
    shader.vertexShader=shader.vertexShader
      .replace('#include <common>','#include <common>\nvarying vec3 vVida38ReptileP;\nvarying vec3 vVida38ReptileN;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvVida38ReptileP=position;\nvVida38ReptileN=normal;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>\n${VIDA38_REPTILE_SHADER_FRAGMENT_COMMON}`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    // 38.2j.a: ámbito local; nunca compartir variables con roughnessmap_fragment.
    {
      vec3 p=vVida38ReptileP+vec3(uVida38ReptileSeed,uVida38ReptileSeed*.37,.0);
      vec3 n=normalize(vVida38ReptileN);
      float dorsal=vida38ReptileRegions(vVida38ReptileP);
      float head=smoothstep(uVida38ReptileHeadZ-.37,uVida38ReptileHeadZ+.08,vVida38ReptileP.z);
      float tail=1.-smoothstep(-uVida38ReptileBodyLength*.79,-uVida38ReptileBodyLength*.43,vVida38ReptileP.z);
      float scaleFrequency=(5.7/uVida38ReptileScaleSize)*mix(1.0,.67,head)*mix(1.0,1.25,tail);
      float scales=vida38ReptileScaleMask(p,n,scaleFrequency);
      float macro=vida38ReptileFbm(p*1.8+vec3(2.,7.,1.));
      float regional=vida38ReptileFbm(p*3.5+vec3(9.,1.,6.));
      float mark=.08;
      if(uVida38ReptilePattern>.5 && uVida38ReptilePattern<1.5){
        mark=.06+.49*(1.-vida38ReptileAA(abs(sin(p.z*9.0+macro*4.0)),.50));
      }else if(uVida38ReptilePattern>1.5 && uVida38ReptilePattern<2.5){
        mark=.06+.46*vida38ReptileAA(vida38ReptileFbm(p*4.2),.48);
      }else if(uVida38ReptilePattern>2.5){
        mark=.07+.49*vida38ReptileAA(macro*.70+regional*.30,.51);
      }
      float armor=clamp(uVida38ReptileArmor,0.,1.);
      float borderScales=(scales-.5)*uVida38ReptileCoverage*(.075+armor*.09);
      float colorMask=clamp(mark+.11*dorsal-.10*(1.-dorsal)+borderScales+(regional-.5)*.085,0.,.89);
      vec3 bio=mix(uVida38ReptilePrimary,uVida38ReptileSecondary,colorMask);
      bio*=mix(1.065,.96,dorsal);
      diffuseColor.rgb*=bio;
    }
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
    // 38.2j.a: ámbito separado; evita la redeclaración GLSL de p, n y dorsal.
    {
      vec3 p=vVida38ReptileP+vec3(uVida38ReptileSeed);
      vec3 n=normalize(vVida38ReptileN);
      float dorsal=vida38ReptileRegions(vVida38ReptileP);
      float scales=vida38ReptileScaleMask(p,n,5.7/uVida38ReptileScaleSize);
      float grain=vida38ReptileFbm(p*3.8);
      roughnessFactor=clamp(roughnessFactor+(grain-.5)*.055+(scales-.5)*.035*uVida38ReptileCoverage+dorsal*.035,.69,.98);
    }
    `);
  };
  material.customProgramCacheKey=()=>VIDA38_REPTILE_MATERIAL_REVISION;
  const mesh=new THREE.Mesh(geometry,material);
  mesh.castShadow=true;mesh.receiveShadow=true;
  mesh.name='VIDA38_2J_REPTILE_ORGANIC_SKIN';
  mesh.userData['morphologyFingerprint']=p.fingerprint;
  mesh.userData['sourceLengthMeters']=contract.bodyLengthMeters;
  mesh.userData['reconstructionHypothesis']=true;
  return mesh;
}
