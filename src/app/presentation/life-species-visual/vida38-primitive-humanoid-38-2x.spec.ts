import {describe,it,expect} from 'vitest';
import {buildVida38PrimitiveHumanoidGallery38X,makeVida38PrimitiveHumanoidLaboratory38X} from './vida38-primitive-humanoid-fixtures-38-2x';
import {deriveVida38PrimitiveHumanoidPlan38X,isVida38PrimitiveHumanoid38X,VIDA38_PRIMITIVE_HUMANOID_WEAR_38X} from './vida38-primitive-humanoid-plan-38-2x';
import {createVida38SpeciesPreviewModelV1} from './vida38-species-visual-preview-scene';
import {VIDA38_PRIMITIVE_HUMANOID_RENDERER_REVISION_38X,inspectVida38PrimitiveHumanoid38X} from './vida38-primitive-humanoid-preview-38-2x';
import {buildVida38HumanoidGallery38R} from './vida38-civilized-humanoid-fixtures-38-2r';

describe('38.2x — Humanoides primitivos',()=>{
 const entries=buildVida38PrimitiveHumanoidGallery38X(24);
 it('12/24 reproducibles y 8 familias representadas',()=>{
   expect(entries).toHaveLength(24);
   expect(buildVida38PrimitiveHumanoidGallery38X(12).map(x=>x.serial)).toEqual(entries.slice(0,12).map(x=>x.serial));
   expect(new Set(entries.map(x=>x.plan.wear)).size).toBe(VIDA38_PRIMITIVE_HUMANOID_WEAR_38X.length);
   expect(new Set(entries.map(x=>x.plan.signature)).size).toBe(24);
   expect(new Set(entries.map(x=>x.plan.culture)).size).toBe(6);
 });
 it('cobertura VIDA.6 válida, mínimo corporal y guard aislado',()=>{
   const c=makeVida38PrimitiveHumanoidLaboratory38X(1).contract;
   const valid=buildVida38HumanoidGallery38R(12)[0]!.contract.morphology.covering;
   expect(entries.every(x=>x.contract.morphology.covering===valid&&x.contract.bodyLengthMeters>=1.5)).toBe(true);
   expect(isVida38PrimitiveHumanoid38X(c)).toBe(true);
   expect(isVida38PrimitiveHumanoid38X({...c,intelligence:{lineage:'HUMANOID',civilizationTier:'ADVANCED'}})).toBe(false);
   expect(isVida38PrimitiveHumanoid38X({...c,intelligence:{lineage:'HUMANOID',civilizationTier:'VERY_ADVANCED'}})).toBe(false);
   expect(isVida38PrimitiveHumanoid38X({...c,morphology:{...c.morphology,group:'REPTILES'}})).toBe(false);
   expect(deriveVida38PrimitiveHumanoidPlan38X(c).signature).toBe(deriveVida38PrimitiveHumanoidPlan38X(c).signature);
 });
 it('comparten renderer SDF, con ropa tribal visible en las ocho familias',()=>{
   const signatures=new Set<string>();
   for(const wear of VIDA38_PRIMITIVE_HUMANOID_WEAR_38X){
     const e=entries.find(x=>x.plan.wear===wear)!;
     const model=createVida38SpeciesPreviewModelV1(e.contract,{humanoidQuality:'LOW'});
     try{
       expect(model.subject.userData['vida38PrimitiveHumanoidRenderer38X']).toBe(VIDA38_PRIMITIVE_HUMANOID_RENDERER_REVISION_38X);
       expect(model.subject.userData['vida38PrimitiveHumanoidSdfReused38X']).toBe(true);
       const state=inspectVida38PrimitiveHumanoid38X(model.subject);
       expect(state.garments).toBeGreaterThanOrEqual(2);
       const names:string[]=[];model.subject.traverse(obj=>{if(obj.userData['vida38PrimitiveHumanoidPart38X']==='GARMENT')names.push(obj.name);});
       signatures.add(names.sort().join('|'));
     }finally{model.dispose();}
   }
   expect(signatures.size).toBe(8);
 },60_000);
 it('colgantes ceremoniales con sujeción visible',()=>{
   for(const wear of ['SHAMAN_REGALIA','CHIEF_MANTLE'] as const){
    const e=entries.find(x=>x.plan.wear===wear)!;
    const model=createVida38SpeciesPreviewModelV1(e.contract,{humanoidQuality:'LOW'});
    try{const names=new Set<string>();model.subject.traverse(obj=>{if(obj.name)names.add(obj.name);});
      expect(names.has('VIDA38_X_NECKLACE_PENDANT')).toBe(true);
      expect(names.has('VIDA38_X_NECKLACE_CORD')).toBe(true);
    }finally{model.dispose();}
   }
 },60_000);
});
