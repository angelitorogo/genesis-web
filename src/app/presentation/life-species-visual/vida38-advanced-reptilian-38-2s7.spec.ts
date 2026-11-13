import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildVida38AdvancedReptilianGallery38S } from './vida38-advanced-reptilian-fixtures-38-2s';
import { createVida38SpeciesPreviewModelV1 } from './vida38-species-visual-preview-scene';
import { createVida38AdvancedReptilianPreview38S2 } from './vida38-advanced-reptilian-preview-38-2s2';
import { VIDA38_ADVANCED_REPTILIAN_VISIBLE_WEAR_38S7 } from './vida38-advanced-reptilian-visible-wear-38-2s7';
import { assertVida38AdvancedReptilianActualModel38S6 } from './vida38-advanced-reptilian-runtime-38-2s6';
import { isVida38AdvancedReptilian38S } from './vida38-advanced-reptilian-plan-38-2s';

const entries = buildVida38AdvancedReptilianGallery38S(24);
const seenRoles = new Set(entries.map(e=>e.plan.role));

function releaseCreated(created:readonly THREE.Object3D[]):void {
  const geoms = new Set<THREE.BufferGeometry>();
  const mats = new Set<THREE.Material>();
  for (const item of created) {
    if (!(item instanceof THREE.Mesh))continue;
    geoms.add(item.geometry);
    for (const m of Array.isArray(item.material)?item.material:[item.material])mats.add(m);
  }
  geoms.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());
}

describe('38.2s7 — modelo final avanzado realmente vestido',()=>{
  it('mantiene exclusivamente REPTILIAN/ADVANCED y 24 identidades',()=>{
    expect(entries).toHaveLength(24);
    for (const e of entries) {
      expect(isVida38AdvancedReptilian38S(e.contract)).toBe(true);
      const v={...e.contract,intelligence:{lineage:'REPTILIAN' as const,civilizationTier:'VERY_ADVANCED' as const}};
      expect(isVida38AdvancedReptilian38S(v)).toBe(false);
    }
    expect(seenRoles.size).toBeGreaterThanOrEqual(8);
  });

  it('integra prendas contemporáneas reales dentro del mismo subject del visor/galería',()=>{
    for (const outfit of ['PRESSURE_SUIT','LAB_APPAREL','UTILITY_OVERALLS','EXECUTIVE_ATTIRE'] as const) {
      const e=entries.find(x=>x.plan.outfit===outfit);
      expect(e,`Falta caso ${outfit}`).toBeDefined();
      if(!e)continue;
      const model=createVida38SpeciesPreviewModelV1(e.contract,{humanoidQuality:'LOW'});
      try {
        const report=assertVida38AdvancedReptilianActualModel38S6(model.subject);
        expect(report.legacyGarmentCount).toBe(0);
        expect(report.structuralCount).toBeGreaterThan(0);
        expect(report.structuralBounds.width).toBeGreaterThan(.24);
        const visible:THREE.Object3D[]=[];
        model.subject.traverse(o=>{
          if(o.userData['vida38AdvancedReptilianWear38S7']===VIDA38_ADVANCED_REPTILIAN_VISIBLE_WEAR_38S7)visible.push(o);
        });
        expect(visible.length).toBeGreaterThanOrEqual(10);
        expect(visible.some(o=>o.name.includes('PROFESSIONAL_BOOT')||o.name.includes('SPACE_BOOT'))).toBe(true);
        expect(visible.some(o=>o.name.includes('SILHOUETTE_JACKET_360'))).toBe(true);
        expect(visible.some(o=>o.name.includes('ACCESSORY_'))).toBe(true);
        expect(visible.some(o=>o.name.includes('TROUSER_LEG_360'))).toBe(true);
      } finally {model.dispose();}
    }
  },60_000);

  it('constructor directo elimina la camiseta y la banda diagonal heredadas',()=>{
    const e=entries[0]!;
    const group=new THREE.Group();
    const created=createVida38AdvancedReptilianPreview38S2(group,e.contract,'LOW');
    try{
      expect(created.some(o=>o.name==='VIDA38_2OD_REPTILIAN_BODY')).toBe(true);
      expect(created.some(o=>o.name==='VIDA38_2OD_REPTILIAN_GARMENT')).toBe(false);
      expect(group.userData['vida38IntegratedSdfTail38OD5']).toBe(true);
      expect(group.userData['vida38AdvancedReptilianVisibleWear38S7']).toBe(VIDA38_ADVANCED_REPTILIAN_VISIBLE_WEAR_38S7);
      expect(assertVida38AdvancedReptilianActualModel38S6(group).legacyGarmentCount).toBe(0);
    } finally{releaseCreated(created);}
  },60_000);

  it('nunca envía a esta rama los tres linajes VERY_ADVANCED',()=>{
    const e=entries[0]!.contract;
    for (const lineage of ['REPTILIAN','INSECTOID','HUMANOID'] as const) {
      const c={...e,intelligence:{lineage,civilizationTier:'VERY_ADVANCED' as const}};
      expect(()=>createVida38AdvancedReptilianPreview38S2(new THREE.Group(),c,'LOW')).toThrow();
    }
  });
});
