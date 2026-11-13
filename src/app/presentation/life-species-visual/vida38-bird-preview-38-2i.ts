/** GENESIS 38.2i — integración exclusiva de especies BIRDS confirmadas. */
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { deriveVida38BirdMorphology38I } from './vida38-bird-morphology-38-2i';
import {
  buildVida38BirdRawMeshV1,deriveVida38BirdEyeSurface38IA2,VIDA38_BIRD_MESH_REVISION,
  type Vida38BirdRawMeshV1,type Vida38BirdQuality,
} from './vida38-bird-organic-field-38-2i';
import {
  createVida38BirdSkin38I,createVida38BirdContourFeathers38I,
  createVida38BirdFlightFeathers38I,
} from './vida38-bird-materials-38-2i';

const cache=new Map<string,Vida38BirdRawMeshV1>();
export function getVida38BirdRawMeshCached38I(
  morphology:ReturnType<typeof deriveVida38BirdMorphology38I>,quality:Vida38BirdQuality,
):Vida38BirdRawMeshV1 {
  const key=`${VIDA38_BIRD_MESH_REVISION}|${morphology.fingerprint}|${quality}`;
  const hit=cache.get(key);
  if(hit){cache.delete(key);cache.set(key,hit);return hit;}
  const raw=buildVida38BirdRawMeshV1(morphology,quality);
  cache.set(key,raw);
  while(cache.size>3){
    const oldest=cache.keys().next().value;
    if(typeof oldest==='string')cache.delete(oldest);else break;
  }
  return raw;
}

export function createVida38BirdPreview38I(parent:THREE.Group,c:Vida38SpeciesVisualContract,quality:Vida38BirdQuality='HIGH'):THREE.Object3D[] {
  const morphology=deriveVida38BirdMorphology38I(c);
  const raw=getVida38BirdRawMeshCached38I(morphology,quality);
  const visual:THREE.Object3D[]=[];
  const skin=createVida38BirdSkin38I(raw,c);
  parent.add(skin);visual.push(skin);
  const contour=createVida38BirdContourFeathers38I(raw,c);
  if(contour){parent.add(contour);visual.push(contour);}
  const flight=createVida38BirdFlightFeathers38I(raw,c);
  if(flight){parent.add(flight);visual.push(flight);}

  // Las córneas son superficies independientes por razones ópticas; las órbitas
  // forman parte de la malla SDF, nunca son piezas geométricas articuladas.
  const eyeColor=new THREE.Color(c.pigmentation.secondaryColorHex).lerp(new THREE.Color('#7b786b'),.58);
  const irisColor=new THREE.Color(c.pigmentation.secondaryColorHex).lerp(new THREE.Color('#171b1c'),.82);
  for(const side of [-1,1]){
    const anchor=deriveVida38BirdEyeSurface38IA2(morphology,side as -1|1);
    const radius=anchor.radius;
    const eye=new THREE.Mesh(
      new THREE.SphereGeometry(radius,24,16),
      new THREE.MeshPhysicalMaterial({color:eyeColor,metalness:0,roughness:.19,clearcoat:.36,clearcoatRoughness:.15}),
    );
    eye.position.set(...anchor.center);
    eye.scale.set(1,.91,.95);
    eye.name=`VIDA38_2I_BIRD_EYE_${side}`;
    eye.userData['reconstructionHypothesis']=true;
    parent.add(eye);visual.push(eye);
    const iris=new THREE.Mesh(
      new THREE.SphereGeometry(radius*.24,18,12),
      new THREE.MeshPhysicalMaterial({color:irisColor,metalness:0,roughness:.17,clearcoat:.38}),
    );
    iris.position.set(...anchor.irisCenter);
    iris.name=`VIDA38_2I_BIRD_IRIS_${side}`;
    iris.userData['reconstructionHypothesis']=true;
    parent.add(iris);visual.push(iris);
  }
  parent.userData['birdArchetype']=morphology.archetype;
  parent.userData['birdMorphologyFingerprint']=morphology.fingerprint;
  parent.userData['birdScientificLengthMeters']=c.bodyLengthMeters;
  parent.userData['birdRepresentation']='ARTISTIC_HYPOTHESIS';
  return visual;
}
