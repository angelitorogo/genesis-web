import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildVida38AdvancedReptilianGallery38S } from './vida38-advanced-reptilian-fixtures-38-2s';
import { isVida38AdvancedReptilian38S } from './vida38-advanced-reptilian-plan-38-2s';
import { createVida38AdvancedReptilianPreview38S2 } from './vida38-advanced-reptilian-preview-38-2s2';
import {
  VIDA38_ADVANCED_REPTILIAN_WARDROBE_REVISION_38S4,
  VIDA38_ADVANCED_REPTILIAN_WEAR_FAMILIES_38S4,
  deriveVida38AdvancedReptilianWardrobe38S4,
} from './vida38-advanced-reptilian-wardrobe-38-2s4';

function dispose(created:readonly THREE.Object3D[]):void{
  const geoms=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
  for(const o of created){
    if(!(o instanceof THREE.Mesh))continue;
    geoms.add(o.geometry);
    for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);
  }
  for(const g of geoms)g.dispose();for(const m of materials)m.dispose();
}

describe('38.2s4 — vestimenta y utilería real para reptilianos ADVANCED',()=>{
  const entries=buildVida38AdvancedReptilianGallery38S(24);
  it('sólo acepta REPTILIAN/ADVANCED, nunca los tres linajes VERY_ADVANCED',()=>{
    const c=entries[0]!.contract;
    expect(isVida38AdvancedReptilian38S(c)).toBe(true);
    for(const lineage of ['REPTILIAN','HUMANOID','INSECTOID'] as const){
      expect(isVida38AdvancedReptilian38S({...c,intelligence:{lineage,civilizationTier:'VERY_ADVANCED'}})).toBe(false);
    }
    expect(isVida38AdvancedReptilian38S({...c,intelligence:{lineage:'REPTILIAN',civilizationTier:'PRIMITIVE'}})).toBe(false);
  });
  it('produce planes deterministas con ropa moderna de varios oficios',()=>{
    const families=new Set<string>(),roles=new Set<string>(),accessories=new Set<string>(),signatures=new Set<string>();
    for(const entry of entries){
      const w=deriveVida38AdvancedReptilianWardrobe38S4(entry.plan);
      expect(w).toEqual(deriveVida38AdvancedReptilianWardrobe38S4(entry.plan));
      expect(w.revision).toBe(VIDA38_ADVANCED_REPTILIAN_WARDROBE_REVISION_38S4);
      expect(VIDA38_ADVANCED_REPTILIAN_WEAR_FAMILIES_38S4).toContain(w.family);
      families.add(w.family);roles.add(entry.plan.role);signatures.add(w.signature);
      for(const item of w.accessories)accessories.add(item);
    }
    expect(families.size).toBeGreaterThanOrEqual(6);
    expect(roles.size).toBeGreaterThanOrEqual(8);
    expect(accessories.size).toBeGreaterThanOrEqual(5);
    expect(signatures.size).toBe(entries.length);
    expect(families).toContain('ENVIRONMENTAL_SUIT');
    expect(families).toContain('SCIENTIFIC_ATTIRE');
    expect(families).toContain('TECH_WORKSUIT');
  });
  it('la rama avanzada genera ropa 360 y utilería volumétrica, no un recoloreado primitivo',()=>{
    const samples=['PRESSURE_SUIT','LAB_APPAREL','UTILITY_OVERALLS','EXECUTIVE_ATTIRE'] as const;
    for(const outfit of samples){
      const specimen=entries.find(e=>e.plan.outfit===outfit);
      expect(specimen).toBeDefined();
      if(!specimen)continue;
      const group=new THREE.Group(),created=createVida38AdvancedReptilianPreview38S2(group,specimen.contract,'LOW');
      try{
        const garments=created.filter(o=>o.userData['vida38AdvancedReptilianWardrobe38S4']===VIDA38_ADVANCED_REPTILIAN_WARDROBE_REVISION_38S4);
        expect(garments.length).toBeGreaterThanOrEqual(6);
        expect(garments.some(o=>String(o.name).includes('360'))).toBe(true);
        expect(garments.some(o=>String(o.name).includes('ACCESSORY_'))).toBe(true);
        expect(created.some(o=>o.name==='VIDA38_2OD_REPTILIAN_BODY')).toBe(true);
        expect(created.some(o=>o.name==='VIDA38_2OD_REPTILIAN_GARMENT')).toBe(false);
        expect(group.userData['vida38IntegratedSdfTail38OD5']).toBe(true);
        expect(group.userData['vida38AdvancedReptilianWardrobeRevision38S4'])
          .toBe(VIDA38_ADVANCED_REPTILIAN_WARDROBE_REVISION_38S4);
        if(outfit==='LAB_APPAREL')expect(garments.some(o=>o.userData['vida38AdvancedReptilianPart38S2']==='COAT_360')).toBe(true);
        if(outfit==='PRESSURE_SUIT'){
          expect(garments.some(o=>o.name==='VIDA38_S4_PRESSURE_HELMET')).toBe(true);
          expect(garments.some(o=>o.name==='VIDA38_S4_ACCESSORY_BREATHING_MODULE')).toBe(true);
        }
        for(const o of garments){
          if(!(o instanceof THREE.Mesh))continue;
          const positions=o.geometry.getAttribute('position');
          if(!positions)continue;
          for(let i=0;i<positions.count;i+=Math.max(1,Math.floor(positions.count/100))){
            expect(Number.isFinite(positions.getX(i))).toBe(true);
            expect(Number.isFinite(positions.getY(i))).toBe(true);
            expect(Number.isFinite(positions.getZ(i))).toBe(true);
          }
        }
      }finally{dispose(created);}
    }
  },60_000);
});
