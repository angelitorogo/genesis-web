/** GENESIS 38.2t — rama REAL de escenas INSECTOID/ADVANCED.
 * A partir de anatomía 38.2q (solo lectura); vestimenta y accesorios exclusivos 38.2t.
 * No cambia la fábrica ni la apariencia de VERY_ADVANCED, REPTILIAN o HUMANOID.
 */
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import {
  createVida38CivilizedInsectoidPreview38Q,
  deriveVida38CivilizedInsectoidPlan38Q,
} from './vida38-civilized-insectoid-preview-38-2q';
import {
  anatomicalVida38AdvancedInsectContract38T,
  deriveVida38AdvancedInsectPlan38T,
  isVida38AdvancedInsectoid38T,
  VIDA38_ADV_INSECT_REVISION_38T,
} from './vida38-advanced-insectoid-plan-38-2t';
import {
  buildVida38AdvancedInsectWardrobe38T,
  VIDA38_ADV_INSECT_WARDROBE_REVISION_38T,
} from './vida38-advanced-insectoid-wardrobe-38-2t';

export { isVida38AdvancedInsectoid38T } from './vida38-advanced-insectoid-plan-38-2t';
export const VIDA38_ADV_INSECT_RENDERER_REVISION_38T = 'VIDA.38.2t/advanced-insectoid-production-renderer/v1' as const;

/** Eliminar solo prendas Q2 y accesorios hipertecnológicos en la copia ADVANCED.
 * La cabeza, ojos compuestos, antenas, coxas, alas y aguijón NO se tocan. */
function removeVeryAdvancedWear38T(subject:THREE.Group,created:THREE.Object3D[]):void{
  const excluded = new Set<THREE.Object3D>();
  for (const obj of created) {
    const part = String(obj.userData['civInsectoidPart38Q'] ?? '');
    if (obj.userData['vida38WardrobeRevision38Q2'] !== undefined || part === 'ACCESSORY') excluded.add(obj);
  }
  const geometry = new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
  for(const obj of excluded){
    subject.remove(obj);
    if(obj instanceof THREE.Mesh){
      geometry.add(obj.geometry);
      for(const m of Array.isArray(obj.material)?obj.material:[obj.material])materials.add(m);
    }
  }
  for(let i=created.length-1;i>=0;i--)if(excluded.has(created[i]!))created.splice(i,1);
  geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
}

export function createVida38AdvancedInsectoidPreview38T(
  subject:THREE.Group,contract:Vida38SpeciesVisualContract,quality:'LOW'|'MEDIUM'|'HIGH'='HIGH',
):THREE.Object3D[]{
  if(!isVida38AdvancedInsectoid38T(contract))throw new Error('38.2t: solo INSECTOID/ADVANCED');
  const anatomyContract=anatomicalVida38AdvancedInsectContract38T(contract);
  const q=deriveVida38CivilizedInsectoidPlan38Q(anatomyContract);
  const plan=deriveVida38AdvancedInsectPlan38T(contract);
  // No se muta el contrato CT-0 original. El renderer 38.2q se invoca en una copia
  // efímera para obtener una base articulada de insectoide vertical.
  const created=createVida38CivilizedInsectoidPreview38Q(subject,anatomyContract,quality);
  removeVeryAdvancedWear38T(subject,created);
  for(const piece of buildVida38AdvancedInsectWardrobe38T(subject,q,plan,quality)){
    subject.add(piece);created.push(piece);
  }
  // El modelo final de laboratorio y fichas identifica explícitamente el nivel real,
  // nunca el de la copia temporal empleada para la anatomía.
  delete subject.userData['civilizedRenderer38Q'];
  delete subject.userData['civilizationLevel38Q'];
  delete subject.userData['vida38InsectoidWardrobeRevision38Q2'];
  delete subject.userData['vida38InsectoidWardrobeStyle38Q2'];
  delete subject.userData['vida38CivilInsectoidPlan38Q'];
  delete subject.userData['vida38CivilInsectoidSignature38Q'];
  delete subject.userData['vida38CivilInsectoidRevision38Q'];
  subject.userData['vida38AdvancedInsectoidRenderer38T']=VIDA38_ADV_INSECT_RENDERER_REVISION_38T;
  subject.userData['vida38AdvancedInsectoidRevision38T']=VIDA38_ADV_INSECT_REVISION_38T;
  subject.userData['vida38AdvancedInsectoidWardrobe38T']=VIDA38_ADV_INSECT_WARDROBE_REVISION_38T;
  subject.userData['vida38AdvancedInsectoidCivilizationTier38T']='ADVANCED';
  subject.userData['vida38AdvancedInsectoidPlan38T']=plan;
  subject.userData['vida38AdvancedInsectoidSignature38T']=plan.signature;
  subject.userData['vida38AdvancedInsectoidAnatomy38T']={armCount:plan.armCount,
    wingPairs:plan.wingPairs,stinger:plan.stinger,archetype:plan.archetype};
  subject.userData['vida38ScientificObservedImage']=false;
  return created;
}

export function inspectVida38AdvancedInsectoidModel38T(subject:THREE.Group):{
  readonly garmentCount:number;readonly structuralCount:number;readonly anatomyCount:number;
  readonly legacyWearCount:number;
}{
  let garmentCount=0,structuralCount=0,anatomyCount=0,legacyWearCount=0;
  subject.traverse(obj=>{
    if(obj.userData['vida38AdvancedInsectWardrobe38T']===VIDA38_ADV_INSECT_WARDROBE_REVISION_38T){
      garmentCount++;
      if(/BASE_360|COAT|VEST|JACKET|PONCHO|BACK/.test(obj.name))structuralCount++;
    }
    if(obj.userData['civInsectoidPart38Q']==='CONTINUOUS_TORSO' ||
      obj.userData['civInsectoidPart38Q']==='HEAD')anatomyCount++;
    if(obj.userData['vida38WardrobeRevision38Q2']!==undefined)legacyWearCount++;
  });
  return {garmentCount,structuralCount,anatomyCount,legacyWearCount};
}
