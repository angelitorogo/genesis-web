import { describe, expect, it } from 'vitest';
import { buildVida38ReptilianGallery38OE5, VIDA38_REPTILIAN_GALLERY_REVISION_38OE5 } from './vida38-reptilian-gallery-fixtures-38-2oe5';
import { selectVida38ReptilianVariation38OE1 } from './vida38-civilized-reptilian-variation-38-2oe1';

describe('38.2o.e5 — galería comparativa del laboratorio',()=>{
  it('12 y 24 contratos completos con identidades reproducibles y sin duplicados',()=>{
    const small=buildVida38ReptilianGallery38OE5(12);
    const large=buildVida38ReptilianGallery38OE5(24);
    expect(VIDA38_REPTILIAN_GALLERY_REVISION_38OE5).toContain('38.2o.e5');
    expect(small).toHaveLength(12);
    expect(large).toHaveLength(24);
    expect(large.slice(0,12)).toEqual(small);
    expect(large).toEqual(buildVida38ReptilianGallery38OE5(24));
    expect(new Set(large.map(e=>e.contract.speciesId)).size).toBe(24);
  });
  it('todas las muestras usan la ruta reptiliana VERY_ADVANCED sin persistencia de universo',()=>{
    for(const e of buildVida38ReptilianGallery38OE5(24)){
      expect(e.contract.morphology.group).toBe('REPTILES');
      expect(e.contract.intelligence?.lineage).toBe('REPTILIAN');
      expect((e.contract.intelligence as unknown as Record<string,string>)['civilizationLevel']).toBe('VERY_ADVANCED');
      expect(e.contract.bodyLengthMeters).toBeGreaterThanOrEqual(1.5);
      expect(e.contract.provenance.bodyStorageKey).toContain('LAB_ONLY');
      const v=selectVida38ReptilianVariation38OE1(e.contract.speciesId,e.contract.appearanceFingerprint);
      expect([e.profile,e.garmentLine,e.culture]).toEqual([v.profile,v.garmentLine,v.culture]);
    }
  });
  it('la muestra de 12 cubre las 10 familias, 6 trajes y 6 culturas visuales',()=>{
    const entries=buildVida38ReptilianGallery38OE5(12);
    expect(new Set(entries.map(e=>e.profile)).size).toBe(10);
    expect(new Set(entries.map(e=>e.garmentLine)).size).toBe(6);
    expect(new Set(entries.map(e=>e.culture)).size).toBe(6);
  });
  it('las 24 muestras añaden diversidad sin alterar la selección anterior',()=>{
    const entries=buildVida38ReptilianGallery38OE5(24);
    expect(new Set(entries.map(e=>e.contract.pigmentation.primaryColorHex)).size).toBeGreaterThanOrEqual(6);
    expect(new Set(entries.map(e=>e.handheld)).size).toBeGreaterThanOrEqual(3);
    expect(new Set(entries.map(e=>e.eyewear)).size).toBeGreaterThanOrEqual(2);
  });
});
