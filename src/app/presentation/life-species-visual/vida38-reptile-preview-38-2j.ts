/** GENESIS 38.2j — presentación de reptiles cuadrúpedos confirmados. */
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import {deriveVida38ReptileMorphology38J} from './vida38-reptile-morphology-38-2j';
import {
  buildVida38ReptileRawMesh38J,deriveVida38ReptileLandmarks38J,
  type Vida38ReptileQuality,type Vida38ReptileRawMeshV1,
} from './vida38-reptile-organic-field-38-2j';
import {createVida38ReptileSkin38J} from './vida38-reptile-materials-38-2j';
import {createVida38ReptileOcularDetails38P} from './vida38-reptile-eyes-38-2p';

const rawCache=new Map<string,Vida38ReptileRawMeshV1>();
export function getVida38ReptileRawMeshCached38J(profile:ReturnType<typeof deriveVida38ReptileMorphology38J>,quality:Vida38ReptileQuality):Vida38ReptileRawMeshV1{
  const key=`${profile.fingerprint}|${quality}`;
  const existing=rawCache.get(key);
  if(existing){rawCache.delete(key);rawCache.set(key,existing);return existing;}
  const mesh=buildVida38ReptileRawMesh38J(profile,quality);
  rawCache.set(key,mesh);
  while(rawCache.size>3){const first=rawCache.keys().next().value;if(typeof first==='string')rawCache.delete(first);else break;}
  return mesh;
}

export function createVida38ReptilePreview38J(parent:THREE.Group,contract:Vida38SpeciesVisualContract,quality:Vida38ReptileQuality='HIGH'):THREE.Object3D[]{
  const m=deriveVida38ReptileMorphology38J(contract);
  const raw=getVida38ReptileRawMeshCached38J(m,quality);
  const a=deriveVida38ReptileLandmarks38J(m);
  const result:THREE.Object3D[]=[];
  const add=(object:THREE.Object3D)=>{parent.add(object);result.push(object);};
  const skin=createVida38ReptileSkin38J(raw,contract);
  add(skin);
  // 38.2p2a: globo ocular rellena la cavidad tallada en el SDF; iris y
  // pupila se apoyan en una superficie curva que mira también al frente.
  for(const eye of createVida38ReptileOcularDetails38P(skin,m,a))add(eye);
  // 38.2p2a: la mandíbula SDF actual está cerrada. No colocar dientes
  // individuales sobre coordenadas nominales: aparecían como fragmentos
  // flotantes fuera del labio (especialmente en perfiles largos).
  // La dentición sigue existiendo en el contrato morfológico científico;
  // su representación visual queda reservada para bocas realmente abiertas.
  parent.userData['reptileDentition38J'] = m.dentition;
  parent.userData['reptileArchetype']=m.archetype;
  parent.userData['reptileMorphologyFingerprint']=m.fingerprint;
  parent.userData['reptileScientificLengthMeters']=contract.bodyLengthMeters;
  parent.userData['reptileRepresentation']='ARTISTIC_HYPOTHESIS';
  return result;
}
