import {describe,it,expect} from 'vitest';
import {buildVida38AdvancedHumanoidGallery38W,makeVida38AdvancedHumanoidLaboratory38W} from './vida38-advanced-humanoid-fixtures-38-2w';
import {deriveVida38AdvancedHumanoidPlan38W,isVida38AdvancedHumanoid38W,VIDA38_ADV_HUMANOID_WEAR_38W} from './vida38-advanced-humanoid-plan-38-2w';
import {inspectVida38AdvancedHumanoid38W,VIDA38_ADV_HUMANOID_RENDERER_REVISION_38W} from './vida38-advanced-humanoid-preview-38-2w';
import {createVida38SpeciesPreviewModelV1} from './vida38-species-visual-preview-scene';
import {buildVida38HumanoidGallery38R} from './vida38-civilized-humanoid-fixtures-38-2r';

describe('38.2w2 — Civilizaciones humanoides ADVANCED con mayor diversidad',()=>{
 const entries=buildVida38AdvancedHumanoidGallery38W(24);
 it('galería 12/24 CT-0, ocho vestuarios y variedad cultural',()=>{
   expect(entries).toHaveLength(24);
   expect(buildVida38AdvancedHumanoidGallery38W(12).map(x=>x.serial)).toEqual(entries.slice(0,12).map(x=>x.serial));
   expect(new Set(entries.map(x=>x.plan.wear)).size).toBe(VIDA38_ADV_HUMANOID_WEAR_38W.length);
   expect(new Set(entries.map(x=>x.plan.culture)).size).toBe(6);
   expect(new Set(entries.map(x=>x.plan.signature)).size).toBe(24);
   expect(new Set(entries.map(x=>x.plan.overlay)).size).toBeGreaterThanOrEqual(5);
 });
 it('usa una cobertura válida y coherente con el fixture humanoide SDF de 38.2r',()=>{
   const reference=buildVida38HumanoidGallery38R(12)[0]!.contract.morphology.covering;
   expect(entries.every(e=>e.contract.morphology.covering===reference)).toBe(true);
 });
 it('solo activa HUMANOID ADVANCED; no captura VERY_ADVANCED ni PRIMITIVE',()=>{
   const contract=makeVida38AdvancedHumanoidLaboratory38W(1).contract;
   expect(isVida38AdvancedHumanoid38W(contract)).toBe(true);
   expect(isVida38AdvancedHumanoid38W({...contract,intelligence:{lineage:'HUMANOID',civilizationTier:'VERY_ADVANCED'}})).toBe(false);
   expect(isVida38AdvancedHumanoid38W({...contract,intelligence:{lineage:'HUMANOID',civilizationTier:'PRIMITIVE'}})).toBe(false);
   expect(isVida38AdvancedHumanoid38W({...contract,morphology:{...contract.morphology,group:'REPTILES'}})).toBe(false);
   expect(deriveVida38AdvancedHumanoidPlan38W(contract).signature).toBe(deriveVida38AdvancedHumanoidPlan38W(contract).signature);
 });
 it('renderer real compartido por laboratorio/fichas y prendas distintas por familia',()=>{
   const variants=new Set<string>();
   for(const wear of VIDA38_ADV_HUMANOID_WEAR_38W){
     const e=entries.find(x=>x.plan.wear===wear)!;
     const model=createVida38SpeciesPreviewModelV1(e.contract,{humanoidQuality:'LOW'});
     try{
       expect(model.subject.userData['vida38AdvancedHumanoidRenderer38W']).toBe(VIDA38_ADV_HUMANOID_RENDERER_REVISION_38W);
       expect(model.subject.userData['vida38AdvancedHumanoidSdfReused38W']).toBe(true);
       const inspected=inspectVida38AdvancedHumanoid38W(model.subject);
       expect(inspected.garments).toBeGreaterThanOrEqual(4);
       expect(inspected.equipment).toBeGreaterThanOrEqual(3);
       const labels:string[]=[];const equip:string[]=[];model.subject.traverse(obj=>{
         if(obj.userData['vida38AdvancedHumanoidPart38W']==='GARMENT')labels.push(obj.name);
         if(obj.userData['vida38AdvancedHumanoidPart38W']==='EQUIPMENT')equip.push(obj.name);
       });
       expect(equip.length).toBeGreaterThanOrEqual(3);
       variants.add(labels.sort().join('|')+'::'+equip.sort().join('|'));
     }finally{model.dispose();}
   }
   expect(variants.size).toBe(8);
 },60_000);
});
