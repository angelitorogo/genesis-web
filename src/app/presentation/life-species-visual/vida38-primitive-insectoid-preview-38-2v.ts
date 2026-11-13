/** 38.2v — reutilización estricta de anatomía 38.2q, atuendo de nivel PRIMITIVE. */
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import {createVida38CivilizedInsectoidPreview38Q,deriveVida38CivilizedInsectoidPlan38Q} from './vida38-civilized-insectoid-preview-38-2q';
import {anatomicalVida38PrimitiveInsectContract38V,deriveVida38PrimitiveInsectPlan38V,
  isVida38PrimitiveInsectoid38V,VIDA38_PRIMITIVE_INSECT_REVISION_38V} from './vida38-primitive-insectoid-plan-38-2v';
import {buildVida38PrimitiveInsectWear38V,VIDA38_PRIMITIVE_INSECT_WARDROBE_REVISION_38V} from './vida38-primitive-insectoid-wardrobe-38-2v';
export {isVida38PrimitiveInsectoid38V} from './vida38-primitive-insectoid-plan-38-2v';
export const VIDA38_PRIMITIVE_INSECT_RENDERER_REVISION_38V='VIDA.38.2v/primitive-insectoid-renderer/v1' as const;
function discardLegacyWear38V(subject:THREE.Group,created:THREE.Object3D[]):void{
  const disposable=new Set<THREE.Object3D>();
  for(const obj of created){
    const part=String(obj.userData['civInsectoidPart38Q']??'');
    if(obj.userData['vida38WardrobeRevision38Q2']!==undefined||part==='ACCESSORY')disposable.add(obj);
  }
  const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
  for(const obj of disposable){
    subject.remove(obj);
    obj.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});
  }
  for(let i=created.length-1;i>=0;i--)if(disposable.has(created[i]!))created.splice(i,1);
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
}
export function createVida38PrimitiveInsectoidPreview38V(subject:THREE.Group,contract:Vida38SpeciesVisualContract,
  quality:'LOW'|'MEDIUM'|'HIGH'='HIGH'):THREE.Object3D[]{
  if(!isVida38PrimitiveInsectoid38V(contract))throw new Error('38.2v: no es INSECTOID/PRIMITIVE');
  const copy=anatomicalVida38PrimitiveInsectContract38V(contract);
  const anatomy=deriveVida38CivilizedInsectoidPlan38Q(copy);
  const plan=deriveVida38PrimitiveInsectPlan38V(contract);
  const created=createVida38CivilizedInsectoidPreview38Q(subject,copy,quality);
  discardLegacyWear38V(subject,created);
  for(const mesh of buildVida38PrimitiveInsectWear38V(anatomy,plan,quality)){subject.add(mesh);created.push(mesh);}
  // Descartamos metadatos de la base VERY_ADVANCED utilizada únicamente para construir anatomía.
  for(const key of ['civilizedRenderer38Q','civilizationLevel38Q','vida38InsectoidWardrobeRevision38Q2',
    'vida38InsectoidWardrobeStyle38Q2','vida38CivilInsectoidPlan38Q','vida38CivilInsectoidSignature38Q',
    'vida38CivilInsectoidRevision38Q'])delete subject.userData[key];
  subject.userData['vida38PrimitiveInsectoidRenderer38V']=VIDA38_PRIMITIVE_INSECT_RENDERER_REVISION_38V;
  subject.userData['vida38PrimitiveInsectoidRevision38V']=VIDA38_PRIMITIVE_INSECT_REVISION_38V;
  subject.userData['vida38PrimitiveInsectoidWardrobe38V']=VIDA38_PRIMITIVE_INSECT_WARDROBE_REVISION_38V;
  subject.userData['vida38PrimitiveInsectoidTier38V']='PRIMITIVE';
  subject.userData['vida38PrimitiveInsectoidPlan38V']=plan;
  subject.userData['vida38PrimitiveInsectoidSignature38V']=plan.signature;
  subject.userData['vida38PrimitiveInsectoidAnatomy38V']={armCount:anatomy.armCount,wingPairs:anatomy.wingPairs,
    stinger:anatomy.stinger,archetype:anatomy.archetype};
  subject.userData['vida38ScientificObservedImage']=false;
  return created;
}
export function inspectVida38PrimitiveInsectoid38V(subject:THREE.Group):{
  readonly anatomyCount:number;readonly wardrobeCount:number;readonly legacyCount:number;
}{
  let anatomyCount=0,wardrobeCount=0,legacyCount=0;
  subject.traverse(o=>{
    if(o.userData['civInsectoidPart38Q']==='CONTINUOUS_TORSO'||o.userData['civInsectoidPart38Q']==='HEAD')anatomyCount++;
    if(o.userData['vida38PrimitiveInsectWardrobe38V']===VIDA38_PRIMITIVE_INSECT_WARDROBE_REVISION_38V)wardrobeCount++;
    if(o.userData['vida38WardrobeRevision38Q2']!==undefined)legacyCount++;
  });
  return {anatomyCount,wardrobeCount,legacyCount};
}
