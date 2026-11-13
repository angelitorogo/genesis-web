/**
 * GENESIS 38.2s7 — rama única y visible REPTILIAN/ADVANCED.
 * No cambia el renderer 38.2o (VERY_ADVANCED aprobado).
 * Reutiliza únicamente su cuerpo/órganos/cola, elimina TODO el vestuario heredado
 * y coloca la ropa avanzada en coordenadas de la anatomía SDF original.
 */
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { deriveVida38HumanoidAnatomy, type Vida38HumanoidAnatomy,
  type Vida38HumanoidQuality } from './vida38-humanoid-organic-field-38-2e';
import { createVida38CivilizedReptilianPreview38O } from './vida38-civilized-reptilian-preview-38-2o';
import { deriveVida38AdvancedReptilianPlan38S, isVida38AdvancedReptilian38S,
  type Vida38AdvancedReptilianPlan38S } from './vida38-advanced-reptilian-plan-38-2s';
import { VIDA38_ADVANCED_REPTILIAN_WARDROBE_REVISION_38S4,
  buildVida38AdvancedReptilianGarments38S4, buildVida38AdvancedReptilianAccessories38S4,
  deriveVida38AdvancedReptilianWardrobe38S4 } from './vida38-advanced-reptilian-wardrobe-38-2s4';
import { buildVida38AdvancedReptilianVisibleWear38S7,
  VIDA38_ADVANCED_REPTILIAN_VISIBLE_WEAR_38S7 } from './vida38-advanced-reptilian-visible-wear-38-2s7';
import { buildVida38AdvancedReptilianDiverseClothing38S8, deriveVida38AdvancedReptilianDesign38S8,
  VIDA38_ADV_REPT_DIVERSITY_REVISION_38S8 } from './vida38-advanced-reptilian-diversity-38-2s8';

export { isVida38AdvancedReptilian38S } from './vida38-advanced-reptilian-plan-38-2s';
export const VIDA38_ADVANCED_REPTILIAN_RENDER_REVISION_38S2 =
  'VIDA.38.2s7/reptilian-advanced-visible-apparel/v1' as const;

function cloneAnatomyContract(contract: Vida38SpeciesVisualContract): Vida38SpeciesVisualContract {
  return {...contract,morphology:{...contract.morphology,group:'HUMANOIDS',bodyPlan:'BIPED',
    covering:'SCALES',appendagePairs:2},locomotion:'WALKING'};
}

function isLegacyClothing(part:THREE.Object3D):boolean {
  // Los antiguos ADVANCED usan este nombre. Las familias muy avanzadas no llegan a esta función.
  return part.name==='VIDA38_2OD_REPTILIAN_GARMENT' ||
    part.userData['garmentPart38OE6'] !== undefined ||
    part.userData['garmentFamily38OE6'] !== undefined ||
    part.name.startsWith('VIDA38_2OE7_') || part.name.startsWith('VIDA38_2OE8_');
}
function releaseMesh(part:THREE.Object3D):void {
  if(!(part instanceof THREE.Mesh))return;
  part.geometry.dispose();
  for(const mat of Array.isArray(part.material)?part.material:[part.material])mat.dispose();
}
function detachLegacyClothing(subject:THREE.Group,created:THREE.Object3D[]):void {
  for(let i=created.length-1;i>=0;i--){
    const part=created[i]!;
    if(!isLegacyClothing(part))continue;
    subject.remove(part);
    created.splice(i,1);
    releaseMesh(part);
  }
}
function add(subject:THREE.Group,created:THREE.Object3D[],parts:readonly THREE.Object3D[]):void {
  for(const part of parts){subject.add(part);created.push(part);}
}
function buildAdvancedClothing(subject:THREE.Group,created:THREE.Object3D[],body:THREE.Mesh,
  anatomy:Vida38HumanoidAnatomy,plan:Vida38AdvancedReptilianPlan38S):void {
  // Generador 38.2s4 (tejidos técnicos y 360).
  add(subject,created,buildVida38AdvancedReptilianGarments38S4(body,anatomy,plan));
  add(subject,created,buildVida38AdvancedReptilianAccessories38S4(anatomy,plan));
  // 38.2s7: prendas exteriores gruesas, botas, mangas y equipos macroscópicos,
  // deliberadamente distintos para médico, astronauta, militar, técnico, etc.
  add(subject,created,buildVida38AdvancedReptilianVisibleWear38S7(anatomy,plan));
}

/** Construcción llamada desde la misma fábrica por las fichas y el laboratorio. */
export function createVida38AdvancedReptilianPreview38S2(
  subject:THREE.Group,contract:Vida38SpeciesVisualContract,quality:Vida38HumanoidQuality='HIGH',
):THREE.Object3D[] {
  if(!isVida38AdvancedReptilian38S(contract)){
    throw new Error('38.2s7: renderer exclusivo REPTILIAN / ADVANCED');
  }
  const created=createVida38CivilizedReptilianPreview38O(subject,contract,quality);
  // Nunca dejar la camiseta, banda diagonal o faldón antiguo en ADVANCED.
  detachLegacyClothing(subject,created);
  const body=created.find((obj):obj is THREE.Mesh=>
    obj instanceof THREE.Mesh && obj.name==='VIDA38_2OD_REPTILIAN_BODY');
  if(!body)throw new Error('38.2s7: falta el cuerpo orgánico del reptiliano');
  const anatomy=deriveVida38HumanoidAnatomy(cloneAnatomyContract(contract));
  const plan=deriveVida38AdvancedReptilianPlan38S(contract);
  buildAdvancedClothing(subject,created,body,anatomy,plan);
  // 38.2s8: las dos cúpulas antiguas usaban una anchura craneal teórica y podían
  // dejar fuera hocico/coronilla. Conservar los objetos para regresiones antiguas,
  // pero desactivarlos y mostrar únicamente el casco ajustado al SDF real.
  for(const part of created){
    if(part.name==='VIDA38_S4_PRESSURE_HELMET'||part.name==='VIDA38_S7_ACCESSORY_SPACE_HELMET'){
      part.visible=false;part.castShadow=false;
    }
  }
  const design38S8=deriveVida38AdvancedReptilianDesign38S8(plan);
  add(subject,created,buildVida38AdvancedReptilianDiverseClothing38S8(anatomy,body,plan,created));
  const wardrobe=deriveVida38AdvancedReptilianWardrobe38S4(plan);
  subject.userData['vida38AdvancedReptilianRenderer38S2']=VIDA38_ADVANCED_REPTILIAN_RENDER_REVISION_38S2;
  subject.userData['vida38AdvancedReptilianPlan38S2']=[plan.archetype,plan.culture,plan.role,
    plan.outfit,plan.material,plan.accessory].join('|');
  subject.userData['vida38AdvancedReptilianWardrobeRevision38S4']=VIDA38_ADVANCED_REPTILIAN_WARDROBE_REVISION_38S4;
  subject.userData['vida38AdvancedReptilianWardrobeFamily38S4']=wardrobe.family;
  subject.userData['vida38AdvancedReptilianWardrobeSignature38S4']=wardrobe.signature;
  subject.userData['vida38AdvancedReptilianVisibleWear38S7']=VIDA38_ADVANCED_REPTILIAN_VISIBLE_WEAR_38S7;
  subject.userData['vida38AdvancedReptilianVisibleWearCount38S7']=created.filter(o=>
    o.userData['vida38AdvancedReptilianWear38S7']===VIDA38_ADVANCED_REPTILIAN_VISIBLE_WEAR_38S7).length;
  subject.userData['vida38AdvancedReptilianDiversity38S8']=VIDA38_ADV_REPT_DIVERSITY_REVISION_38S8;
  subject.userData['vida38AdvancedReptilianStyle38S8']=design38S8.style;
  subject.userData['vida38AdvancedReptilianHelmet38S8']=design38S8.helmet;
  subject.userData['vida38AdvancedReptilianSignature38S8']=design38S8.signature;
  return created;
}
