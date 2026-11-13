import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildVida38AdvancedInsectoidGallery38T,
  makeVida38AdvancedInsectoidLaboratory38T } from './vida38-advanced-insectoid-fixtures-38-2t';
import { deriveVida38AdvancedInsectPlan38T, isVida38AdvancedInsectoid38T,
  VIDA38_ADV_INSECT_WEAR_38T } from './vida38-advanced-insectoid-plan-38-2t';
import { VIDA38_ADV_INSECT_RENDERER_REVISION_38T,
  inspectVida38AdvancedInsectoidModel38T } from './vida38-advanced-insectoid-preview-38-2t';
import { buildVida38InsectoidGallery38Q } from './vida38-civilized-insectoid-fixtures-38-2q';
import { createVida38SpeciesPreviewModelV1 } from './vida38-species-visual-preview-scene';

/** Contratos visuales: no se modifica la anatomía de VERY_ADVANCED ni se debilitan tests antiguos. */
describe('38.2t — insectoides ADVANCED, laboratorio y fichas',()=>{
  const entries=buildVida38AdvancedInsectoidGallery38T(24);
  it('la galería 12/24 es reproducible, cubre las ocho familias y tiene cuerpos y oficios diferentes',()=>{
    expect(entries.length).toBe(24);
    expect(buildVida38AdvancedInsectoidGallery38T(12).map(e=>e.serial))
      .toEqual(entries.slice(0,12).map(e=>e.serial));
    expect(buildVida38AdvancedInsectoidGallery38T(24).map(e=>e.serial))
      .toEqual(entries.map(e=>e.serial));
    const wears=new Set(entries.map(e=>e.plan.wear));
    const cultures=new Set(entries.map(e=>e.plan.culture));
    const archetypes=new Set(entries.map(e=>e.plan.archetype));
    const roles=new Set(entries.map(e=>e.plan.role));
    const signatures=new Set(entries.map(e=>e.plan.signature));
    expect(wears.size).toBe(VIDA38_ADV_INSECT_WEAR_38T.length);
    expect(cultures.size).toBe(6);
    expect(archetypes.size).toBeGreaterThanOrEqual(6);
    expect(roles.size).toBeGreaterThanOrEqual(9);
    expect(signatures.size).toBe(24);
    expect(entries.every(e=>e.plan.armCount>=4)).toBe(true);
    expect(entries.some(e=>e.plan.armCount===4)).toBe(true);
    expect(entries.some(e=>e.plan.armCount===6)).toBe(true);
    expect(entries.some(e=>e.plan.wingPairs>0)).toBe(true);
    expect(entries.some(e=>e.plan.wear==='ENVIRONMENTAL_EVA')).toBe(true);
  });
  it('el renderer exclusivo ADVANCED nunca captura VERY_ADVANCED ni otros linajes',()=>{
    const original=makeVida38AdvancedInsectoidLaboratory38T(11).contract;
    expect(isVida38AdvancedInsectoid38T(original)).toBe(true);
    expect(deriveVida38AdvancedInsectPlan38T(original).signature)
      .toBe(deriveVida38AdvancedInsectPlan38T(original).signature);
    expect(isVida38AdvancedInsectoid38T({...original,intelligence:{lineage:'INSECTOID',civilizationTier:'VERY_ADVANCED'}})).toBe(false);
    expect(isVida38AdvancedInsectoid38T({...original,intelligence:{lineage:'INSECTOID',civilizationTier:'PRIMITIVE'}})).toBe(false);
    expect(isVida38AdvancedInsectoid38T({...original,morphology:{...original.morphology,group:'REPTILES'}})).toBe(false);
    expect(isVida38AdvancedInsectoid38T({...original,intelligence:{lineage:'HUMANOID',civilizationTier:'ADVANCED'}})).toBe(false);
    expect(original.intelligence?.civilizationTier).toBe('ADVANCED');
  });
  it('el modelo REAL compartido por laboratorio/fichas contiene ropa avanzada y la anatomía insectoide',()=>{
    const specimen=entries.find(e=>e.plan.wear==='SCIENTIFIC_COAT')!;
    const model=createVida38SpeciesPreviewModelV1(specimen.contract,{humanoidQuality:'LOW'});
    try{
      expect(model.subject.userData['vida38AdvancedInsectoidRenderer38T'])
        .toBe(VIDA38_ADV_INSECT_RENDERER_REVISION_38T);
      expect(model.descriptor.specialistIntelligenceDeferred).toBe(false);
      const real=inspectVida38AdvancedInsectoidModel38T(model.subject);
      expect(real.anatomyCount).toBeGreaterThanOrEqual(2);
      expect(real.garmentCount).toBeGreaterThanOrEqual(6);
      expect(real.structuralCount).toBeGreaterThanOrEqual(2);
      expect(real.legacyWearCount).toBe(0);
      expect(model.subject.getObjectByName('VIDA38_T_LAB_COAT_LEFT')).toBeDefined();
      const boxes:THREE.Box3[]=[];
      model.subject.traverse(obj=>{
        if(obj instanceof THREE.Mesh&&obj.userData['vida38AdvancedInsectWardrobe38T']!==undefined){
          const geom=obj.geometry as THREE.BufferGeometry;
          expect(geom.getAttribute('position').count).toBeGreaterThan(10);
          boxes.push(new THREE.Box3().setFromObject(obj));
        }
      });
      expect(boxes.some(b=>b.getSize(new THREE.Vector3()).y > 0.25)).toBe(true);
    }finally{model.dispose();}
  },60_000);
  it('la fábrica conserva el renderer MUY AVANZADO ya aprobado',()=>{
    const specimen=buildVida38InsectoidGallery38Q(12)[0]!;
    const model=createVida38SpeciesPreviewModelV1(specimen.contract,{humanoidQuality:'LOW'});
    try{
      expect(model.subject.userData['vida38CivilInsectoidRevision38Q']).toBeTruthy();
      expect(model.subject.userData['vida38AdvancedInsectoidRenderer38T']).toBeUndefined();
      expect(model.subject.getObjectByName('VIDA38_Q_INTEGRATED_CORE')).toBeDefined();
    }finally{model.dispose();}
  },60_000);
});
