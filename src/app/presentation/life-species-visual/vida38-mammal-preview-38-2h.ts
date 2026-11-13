/** GENESIS 38.2h — integración 3D únicamente para mamíferos cuadrúpedos. */
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { deriveVida38MammalMorphologyV1 } from './vida38-mammal-morphology-38-2h';
import {
  buildVida38MammalRawMeshV1,deriveVida38MammalLandmarksV1,
  type Vida38MammalQuality,type Vida38MammalRawMeshV1,
} from './vida38-mammal-organic-field-38-2h';
import { createVida38MammalSkin38H,createVida38MammalFur38H } from './vida38-mammal-materials-38-2h';

// Caché estrictamente acotada: geometría CPU compartible por identidad/revisión,
// cada ficha crea su propio BufferGeometry GPU y lo libera al salir.
const rawCache=new Map<string,Vida38MammalRawMeshV1>();
export function getVida38MammalRawMeshCached38H(
  profile:ReturnType<typeof deriveVida38MammalMorphologyV1>,
  quality:Vida38MammalQuality,
):Vida38MammalRawMeshV1 {
  const key=`${profile.fingerprint}|${quality}`;
  const found=rawCache.get(key);
  if(found){rawCache.delete(key);rawCache.set(key,found);return found;}
  const generated=buildVida38MammalRawMeshV1(profile,quality);
  rawCache.set(key,generated);
  while(rawCache.size>4){
    const first=rawCache.keys().next().value;
    if(typeof first==='string')rawCache.delete(first);else break;
  }
  return generated;
}

export function createVida38MammalPreview38H(
  parent:THREE.Group,
  contract:Vida38SpeciesVisualContract,
  quality:Vida38MammalQuality='HIGH',
):THREE.Object3D[] {
  const profile=deriveVida38MammalMorphologyV1(contract);
  const raw=getVida38MammalRawMeshCached38H(profile,quality);
  const result:THREE.Object3D[]=[];
  const skin=createVida38MammalSkin38H(raw,contract);
  parent.add(skin);result.push(skin);
  const fur=createVida38MammalFur38H(raw,contract);
  if(fur){parent.add(fur);result.push(fur);}
  // Globo ocular en la cavidad SDF. Geometría separada por necesidad óptica,
  // NO es una articulación ni interrumpe la superficie anatómica principal.
  const anatomy=deriveVida38MammalLandmarksV1(profile);
  const sclera=new THREE.Color(contract.pigmentation.secondaryColorHex).lerp(new THREE.Color('#c6b8a6'),.55);
  const iris=new THREE.Color('#1d2223').lerp(new THREE.Color(contract.pigmentation.secondaryColorHex),.28);
  for(const side of [-1,1]){
    const radius=.045*profile.eyeRadius*profile.headScale;
    const cx=side*anatomy.headRadius*.71*profile.eyeSeparation;
    const cy=anatomy.headY+.095*profile.headScale;
    const cz=anatomy.headZ+.105*profile.headScale;
    const eye=new THREE.Mesh(
      new THREE.SphereGeometry(radius,22,14),
      new THREE.MeshPhysicalMaterial({color:sclera,metalness:0,roughness:.18,clearcoat:.33,clearcoatRoughness:.19}),
    );
    // La cavidad se abrió en el mismo campo; alojar el ojo parcialmente en ella.
    eye.position.set(cx,cy,cz-.024*profile.headScale);
    eye.scale.set(1,.92,.91);
    eye.name=`VIDA38_2H_EYE_${side}`;
    eye.userData['reconstructionHypothesis']=true;
    parent.add(eye);result.push(eye);
    const dark=new THREE.Mesh(
      new THREE.SphereGeometry(radius*.38,14,10),
      new THREE.MeshPhysicalMaterial({color:iris,roughness:.16,metalness:0,clearcoat:.40}),
    );
    dark.position.set(cx,cy,cz+radius*.73);
    dark.name=`VIDA38_2H_IRIS_${side}`;
    parent.add(dark);result.push(dark);
  }
  parent.userData['mammalMorphologyFingerprint']=profile.fingerprint;
  parent.userData['mammalArchetype']=profile.archetype;
  parent.userData['mammalScientificLengthMeters']=contract.bodyLengthMeters;
  parent.userData['mammalRepresentation']='ARTISTIC_HYPOTHESIS';
  return result;
}
