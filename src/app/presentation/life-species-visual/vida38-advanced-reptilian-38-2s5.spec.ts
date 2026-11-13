import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createVida38SpeciesPreviewModelV1 } from './vida38-species-visual-preview-scene';
import { buildVida38AdvancedReptilianGallery38S } from './vida38-advanced-reptilian-fixtures-38-2s';
import { VIDA38_ADVANCED_REPTILIAN_WARDROBE_REVISION_38S4,
  deriveVida38AdvancedReptilianWardrobe38S4 } from './vida38-advanced-reptilian-wardrobe-38-2s4';
import { getVida38AdvancedReptilianThumbnails38S3,
  storeVida38AdvancedReptilianThumbnails38S3 } from './vida38-advanced-reptilian-thumbnails-38-2s3';

const entries = buildVida38AdvancedReptilianGallery38S(24);

function isGarment38S4(obj: THREE.Object3D): boolean {
  return obj.userData['vida38AdvancedReptilianWardrobe38S4'] === VIDA38_ADVANCED_REPTILIAN_WARDROBE_REVISION_38S4;
}

describe('38.2s5 — el modelo de producción usa realmente la ropa reptiliana ADVANCED', () => {
  it('renderiza ropa 38.2s4 a través de createVida38SpeciesPreviewModelV1, no solo llamando al renderer directamente', () => {
    for (const outfit of ['PRESSURE_SUIT','LAB_APPAREL','UTILITY_OVERALLS','EXECUTIVE_ATTIRE']) {
      const entry=entries.find(e=>e.plan.outfit===outfit);
      expect(entry).toBeDefined();
      if (!entry) continue;
      const model=createVida38SpeciesPreviewModelV1(entry.contract,{humanoidQuality:'LOW'});
      try {
        expect(model.subject.userData['vida38AdvancedReptilianWardrobeRevision38S4'])
          .toBe(VIDA38_ADVANCED_REPTILIAN_WARDROBE_REVISION_38S4);
        const wardrobe=deriveVida38AdvancedReptilianWardrobe38S4(entry.plan);
        expect(model.subject.userData['vida38AdvancedReptilianWardrobeFamily38S4']).toBe(wardrobe.family);
        const pieces=model.subject.children.filter(isGarment38S4);
        expect(pieces.length).toBeGreaterThanOrEqual(5);
        expect(pieces.some(p=>p.name.includes('360'))).toBe(true);
        expect(pieces.some(p=>p.name.includes('ACCESSORY_'))).toBe(true);
        expect(model.subject.children.some(p=>p.name==='VIDA38_2OD_REPTILIAN_BODY')).toBe(true);
      } finally {model.dispose();}
    }
  }, 60_000);

  it('ninguna civilización VERY_ADVANCED entra en la rama ADVANCED', () => {
    const entry=entries[0]!;
    for (const lineage of ['REPTILIAN','INSECTOID','HUMANOID'] as const) {
      const sample={...entry.contract,intelligence:{lineage,civilizationTier:'VERY_ADVANCED' as const}};
      const model=createVida38SpeciesPreviewModelV1(sample,{humanoidQuality:'LOW'});
      try {
        expect(model.subject.userData['vida38AdvancedReptilianWardrobeRevision38S4']).toBeUndefined();
        expect(model.subject.children.filter(isGarment38S4)).toHaveLength(0);
      } finally {model.dispose();}
    }
  }, 60_000);

  it('mantiene miniaturas de tres vistas en caché y distintas del resultado de versiones anteriores', () => {
    const entry=entries[0]!;
    const contract={...entry.contract,speciesId:'LAB-38S5-REPTILIAN-CACHE-TEST'};
    const images={FRONT:'data:image/png;base64,new-front',SIDE:'data:image/png;base64,new-side',BACK:'data:image/png;base64,new-back'};
    expect(getVida38AdvancedReptilianThumbnails38S3(contract)).toBeNull();
    storeVida38AdvancedReptilianThumbnails38S3(contract, images);
    expect(getVida38AdvancedReptilianThumbnails38S3(contract)).toEqual(images);
  });
});
