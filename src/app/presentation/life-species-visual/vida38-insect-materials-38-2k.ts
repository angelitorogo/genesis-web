/** GENESIS 38.2k — quitina estable, opaca y con regiones anatómicas. */
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import type { Vida38InsectRawMesh38K } from './vida38-insect-organic-field-38-2k';
import { deriveVida38InsectLandmarks38K } from './vida38-insect-organic-field-38-2k';

export const VIDA38_INSECT_MATERIAL_REVISION='VIDA.38.2k/chitin/opaque-local-aa/v1' as const;
const fragmentCommon=`
  varying vec3 vVida38InsectLocal;
  uniform vec3 uVida38InsectPrimary;
  uniform vec3 uVida38InsectSecondary;
  uniform float uVida38InsectSeed;
  uniform float uVida38InsectPattern;
  uniform float uVida38InsectArmored;
  uniform float uVida38InsectBodyY;
  float vida38InsectHash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+31.17);return fract((p.x+p.z)*p.y);}
  float vida38InsectNoise(vec3 p){
    vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
    return mix(mix(mix(vida38InsectHash(i),vida38InsectHash(i+vec3(1,0,0)),f.x),
       mix(vida38InsectHash(i+vec3(0,1,0)),vida38InsectHash(i+vec3(1,1,0)),f.x),f.y),
      mix(mix(vida38InsectHash(i+vec3(0,0,1)),vida38InsectHash(i+vec3(1,0,1)),f.x),
       mix(vida38InsectHash(i+vec3(0,1,1)),vida38InsectHash(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  float vida38InsectAA(float value,float threshold){
    float w=max(fwidth(value)*1.5,.009);
    return smoothstep(threshold-w,threshold+w,value);
  }
  float vida38InsectPanel(vec3 p){
    float lines=abs(sin((p.z+uVida38InsectSeed*.10)*16.));
    return 1.-vida38InsectAA(lines,.16);
  }
`;

export function createVida38InsectSkin38K(raw:Vida38InsectRawMesh38K,c:Vida38SpeciesVisualContract):THREE.Mesh{
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(raw.positions,3));
  geometry.setAttribute('normal',new THREE.BufferAttribute(raw.normals,3));
  geometry.setAttribute('uv',new THREE.BufferAttribute(raw.uvs,2));
  geometry.setIndex(new THREE.BufferAttribute(raw.indices,1));
  geometry.computeBoundingSphere();geometry.computeBoundingBox();
  const m=raw.morphology,a=deriveVida38InsectLandmarks38K(m);
  // Color VIDA visible incluso si una versión futura de Three.js cambia chunks.
  const material=new THREE.MeshPhysicalMaterial({
    color:new THREE.Color(c.pigmentation.primaryColorHex),metalness:0,
    roughness:c.morphology.covering==='CHITINOUS'?.55:.69,
    specularIntensity:.40,clearcoat:.17+m.armored*.17,clearcoatRoughness:.45,
    side:THREE.FrontSide,transparent:false,opacity:1,alphaTest:0,
    depthWrite:true,depthTest:true,colorWrite:true,
  });
  material.onBeforeCompile=shader=>{
    if(!shader.vertexShader.includes('#include <common>')||
       !shader.vertexShader.includes('#include <begin_vertex>')||
       !shader.fragmentShader.includes('#include <common>')||
       !shader.fragmentShader.includes('#include <color_fragment>')||
       !shader.fragmentShader.includes('#include <roughnessmap_fragment>'))return;
    shader.uniforms['uVida38InsectPrimary']={value:new THREE.Color(c.pigmentation.primaryColorHex)};
    shader.uniforms['uVida38InsectSecondary']={value:new THREE.Color(c.pigmentation.secondaryColorHex)};
    shader.uniforms['uVida38InsectSeed']={value:(m.identitySeed%17317)/1009};
    shader.uniforms['uVida38InsectPattern']={value:['SOLID','BANDS','SPOTS','MOTTLED'].indexOf(c.pigmentation.pattern)};
    shader.uniforms['uVida38InsectArmored']={value:m.armored};
    shader.uniforms['uVida38InsectBodyY']={value:a.bodyY};
    shader.vertexShader=shader.vertexShader
      .replace('#include <common>','#include <common>\nvarying vec3 vVida38InsectLocal;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvVida38InsectLocal=position;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>\n${fragmentCommon}`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    {
      vec3 insectP=vVida38InsectLocal+vec3(uVida38InsectSeed*.13,.0,uVida38InsectSeed*.07);
      float insectMacro=vida38InsectNoise(insectP*2.9+vec3(2.,4.,7.));
      float insectGrain=vida38InsectNoise(insectP*6.2+vec3(1.,9.,3.));
      float insectDorsal=smoothstep(uVida38InsectBodyY-.24,uVida38InsectBodyY+.22,insectP.y);
      float insectAbdomen=1.-smoothstep(-.15,.12,insectP.z);
      float insectBands=vida38InsectPanel(insectP);
      float insectMark=.08;
      if(uVida38InsectPattern>.5&&uVida38InsectPattern<1.5)
        insectMark=.10+.45*insectBands;
      else if(uVida38InsectPattern>1.5&&uVida38InsectPattern<2.5)
        insectMark=.10+.43*vida38InsectAA(insectGrain,.54);
      else if(uVida38InsectPattern>2.5)
        insectMark=.11+.44*vida38InsectAA(insectMacro*.65+insectGrain*.35,.52);
      float insectPlate=insectAbdomen*insectBands*uVida38InsectArmored*.13;
      float insectMask=clamp(insectMark+.12*(insectDorsal-.5)+insectPlate+(insectMacro-.5)*.07,.02,.87);
      vec3 insectColor=mix(uVida38InsectPrimary,uVida38InsectSecondary,insectMask);
      diffuseColor.rgb=insectColor*(.96+.05*insectMacro);
    }
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
    {
      float insectGrain=vida38InsectNoise(vVida38InsectLocal*4.1+vec3(uVida38InsectSeed));
      float insectPlates=vida38InsectPanel(vVida38InsectLocal);
      roughnessFactor=clamp(roughnessFactor+(insectGrain-.5)*.045+insectPlates*uVida38InsectArmored*.035,.38,.91);
    }
    `);
  };
  material.customProgramCacheKey=()=>VIDA38_INSECT_MATERIAL_REVISION;
  const body=new THREE.Mesh(geometry,material);
  body.name='VIDA38_2K_INSECT_ORGANIC_BODY';body.castShadow=true;body.receiveShadow=true;
  body.userData['reconstructionHypothesis']=true;
  body.userData['morphologyFingerprint']=m.fingerprint;
  body.userData['sourceLengthMeters']=c.bodyLengthMeters;
  return body;
}
