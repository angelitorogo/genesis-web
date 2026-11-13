import * as THREE from 'three';
import { describe,expect,it } from 'vitest';
import { createVida38SpeciesPreviewModelV1 } from './vida38-species-visual-preview-scene';
import { buildVida38InsectoidGallery38Q } from './vida38-civilized-insectoid-fixtures-38-2q';
import {
  VIDA38_CIV_INSECTOID_REVISION_38Q,createVida38CivilizedInsectoidPreview38Q,
  deriveVida38CivilizedInsectoidPlan38Q,isVida38VeryAdvancedInsectoid38Q,
} from './vida38-civilized-insectoid-preview-38-2q';
function release(objects:readonly THREE.Object3D[]):void{
  const gs=new Set<THREE.BufferGeometry>(),ms=new Set<THREE.Material>();
  for(const object of objects){
    if(!(object instanceof THREE.Mesh))continue;
    gs.add(object.geometry);
    for(const m of Array.isArray(object.material)?object.material:[object.material])ms.add(m);
  }
  for(const g of gs)g.dispose();for(const m of ms)m.dispose();
}
describe('38.2q — insectoides civilizados muy avanzados',()=>{
  it('reserva la rama erguida solo a civilizaciones INSECTOID/VERY_ADVANCED',()=>{
    const specimen=buildVida38InsectoidGallery38Q(12)[0]!;
    expect(isVida38VeryAdvancedInsectoid38Q(specimen.contract)).toBe(true);
    const lower: typeof specimen.contract = {
      ...specimen.contract,
      intelligence: { lineage: 'INSECTOID', civilizationTier: 'ADVANCED' },
    };
    expect(isVida38VeryAdvancedInsectoid38Q(lower)).toBe(false);
    const animal={...specimen.contract,intelligence:null} as typeof specimen.contract;
    expect(isVida38VeryAdvancedInsectoid38Q(animal)).toBe(false);
  });
  it('mantiene apéndices contractuales, firma CT-0 y diversidad significativa en 24 muestras',()=>{
    const entries=buildVida38InsectoidGallery38Q(24);
    const archetypes=new Set<string>(),cultures=new Set<string>(),roles=new Set<string>(),wardrobes=new Set<string>(),accessories=new Set<string>(),materials=new Set<string>(),signatures=new Set<string>(),winged=new Set<string>(),stingers=new Set<string>(),extraEyes=new Set<string>();
    for(const entry of entries){
      const a=deriveVida38CivilizedInsectoidPlan38Q(entry.contract),b=deriveVida38CivilizedInsectoidPlan38Q(entry.contract);
      expect(a).toEqual(b);
      expect(a.armCount).toBe((entry.contract.morphology.appendagePairs-1)*2);
      expect(a.armPairs+1).toBe(entry.contract.morphology.appendagePairs);
      expect(a.signature).toBe(b.signature);
      archetypes.add(a.archetype);cultures.add(a.culture);roles.add(a.role);wardrobes.add(a.wardrobe);
      accessories.add(a.accessory);materials.add(a.materialKind);signatures.add(a.signature);
      if(a.wingPairs>0)winged.add(a.speciesId);
      if(a.stinger!=='NONE')stingers.add(a.speciesId);
      if(a.extraEyes>0)extraEyes.add(a.speciesId);
    }
    expect(archetypes.size).toBeGreaterThanOrEqual(7);
    expect(cultures.size).toBe(6);
    expect(roles.size).toBe(6);
    expect(wardrobes.size).toBe(6);
    expect(accessories.size).toBeGreaterThanOrEqual(4);
    expect(materials.size).toBe(4);
    expect(signatures.size).toBe(24);
    expect(winged.size).toBeGreaterThanOrEqual(6);
    expect(stingers.size).toBeGreaterThanOrEqual(8);
    expect(extraEyes.size).toBeGreaterThanOrEqual(8);
  });
  it('crea morfología de pie, varios pares de brazos y vestimenta sin cajas',()=>{
    const entry=buildVida38InsectoidGallery38Q(24)[0]!;
    const subject=new THREE.Group();
    const created=createVida38CivilizedInsectoidPreview38Q(subject,entry.contract,'LOW');
    try{
      expect(subject.userData['civilizedRenderer38Q']).toBe('INSECTOID');
      expect(subject.userData['vida38CivilInsectoidRevision38Q']).toBe(VIDA38_CIV_INSECTOID_REVISION_38Q);
      expect(created.some(o=>o.userData['civInsectoidPart38Q']==='CONTINUOUS_TORSO')).toBe(true);
      expect(created.filter(o=>o.userData['civInsectoidPart38Q']==='COMPOUND_EYE').length).toBe(2);
      expect(created.filter(o=>o.userData['civInsectoidPart38Q']==='WING').length).toBeGreaterThanOrEqual(entry.plan.wingPairs*2);
      expect(created.filter(o=>o.userData['civInsectoidPart38Q']==='AUX_EYE').length).toBe(entry.plan.extraEyes);
      expect(created.filter(o=>o.userData['civInsectoidPart38Q']==='STINGER').length).toBeGreaterThanOrEqual(entry.plan.stinger==='NONE'?0:1);
      expect(created.filter(o=>o.userData['civInsectoidPart38Q']==='ARM').length).toBe(entry.plan.armCount*2);
      expect(created.some(o=>o.userData['civInsectoidPart38Q']==='BOOT')).toBe(true);
      expect(created.every(o=>!(o instanceof THREE.Mesh)||o.geometry.type!=='BoxGeometry')).toBe(true);
      const box=new THREE.Box3().setFromObject(subject);
      expect(box.max.y-box.min.y).toBeGreaterThan(1.7);
      expect(box.max.y-box.min.y).toBeGreaterThan(box.max.z-box.min.z);
    }finally{release(created);}
  },15000);
  it('conecta el renderer de producción de las fichas a la rama insectoide',()=>{
    const specimen=buildVida38InsectoidGallery38Q(12)[1]!;
    const model=createVida38SpeciesPreviewModelV1(specimen.contract,{humanoidQuality:'LOW'});
    try{
      expect(model.subject.userData['civilizedRenderer38Q']).toBe('INSECTOID');
      expect(model.subject.userData['vida38CivilInsectoidSignature38Q']).toBe(specimen.plan.signature);
    }finally{model.dispose();}
  },15000);
});
