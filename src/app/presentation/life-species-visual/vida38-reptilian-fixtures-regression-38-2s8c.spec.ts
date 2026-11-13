import { describe,expect,it } from 'vitest';
import { buildVida38ReptilianGallery38OE5 } from './vida38-reptilian-gallery-fixtures-38-2oe5';
import { resolveVida38ReptilianTestEntry38S8C,findVida38ReptilianTestEntry38S8C } from './vida38-reptilian-test-fixtures-38-2s8c';
import { deriveVida38WardrobeCoherencePlan38OE8B } from './vida38-reptilian-wardrobe-coherence-38-2oe8b';
import { auditVida38CulturalDiversity38OE9 } from './vida38-reptilian-cultural-diversity-38-2oe9';
import { isVida38AdvancedReptilian38S } from './vida38-advanced-reptilian-plan-38-2s';

describe('38.2s8c — reconciliación de fixtures visuales (sin cambios de producción)',()=>{
  it('mantiene la galería de 24 sin forzar ordinales históricos fuera de su selección',()=>{
    const gallery=buildVida38ReptilianGallery38OE5(24);
    expect(gallery).toHaveLength(24);
    expect(new Set(gallery.map(x=>x.ordinal)).size).toBe(24);
    for(const ordinal of [7,17,18,35,121]){
      const reconstructed=resolveVida38ReptilianTestEntry38S8C(ordinal);
      expect(reconstructed.ordinal).toBe(ordinal);
      expect(reconstructed).toEqual(resolveVida38ReptilianTestEntry38S8C(ordinal));
      const selected=gallery.find(x=>x.ordinal===ordinal);
      if(selected)expect(reconstructed).toEqual(selected);
    }
  });
  it('conserva familias reales para los casos de regresión antiguos',()=>{
    expect(deriveVida38WardrobeCoherencePlan38OE8B(resolveVida38ReptilianTestEntry38S8C(7).contract).family).toBe('CEREMONIAL_ROBES');
    expect(deriveVida38WardrobeCoherencePlan38OE8B(resolveVida38ReptilianTestEntry38S8C(121).contract).family).toBe('COLONIAL_RIG');
    expect(resolveVida38ReptilianTestEntry38S8C(17).culture).toBe('BASILICA_TECHNOCRACY');
    expect(resolveVida38ReptilianTestEntry38S8C(18).culture).toBe('PELAGIC_CONCORD');
    expect(findVida38ReptilianTestEntry38S8C(e=>e.culture==='PELAGIC_CONCORD','pelagic').culture).toBe('PELAGIC_CONCORD');
  });
  it('comprueba diversidad cultural tanto en 24 seleccionados como en 360 candidatos',()=>{
    const compact=auditVida38CulturalDiversity38OE9(buildVida38ReptilianGallery38OE5(24).map(x=>x.contract));
    const broad=auditVida38CulturalDiversity38OE9(Array.from({length:360},(_,i)=>resolveVida38ReptilianTestEntry38S8C(i+1).contract));
    expect(compact.uniqueCultures).toBe(6);
    expect(compact.uniqueAccessoryBiases).toBeGreaterThanOrEqual(3);
    expect(broad.uniqueAccessoryBiases).toBeGreaterThanOrEqual(5);
    expect(compact.uniqueVisualSignatures).toBe(24);
  });
  it('no permite que el nuevo renderer ADVANCED capture los tres linajes VERY_ADVANCED',()=>{
    const contract=resolveVida38ReptilianTestEntry38S8C(7).contract;
    for(const lineage of ['REPTILIAN','INSECTOID','HUMANOID'] as const){
      expect(isVida38AdvancedReptilian38S({...contract,intelligence:{lineage,civilizationTier:'VERY_ADVANCED'}})).toBe(false);
    }
    expect(isVida38AdvancedReptilian38S({...contract,intelligence:{lineage:'REPTILIAN',civilizationTier:'ADVANCED'}})).toBe(true);
  });
});
