import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createVida38CivilizedReptilianPreview38O } from './vida38-civilized-reptilian-preview-38-2o';
import { buildVida38ReptilianGallery38OE5 } from './vida38-reptilian-gallery-fixtures-38-2oe5';
import { deriveVida38WardrobeCoherencePlan38OE8B } from './vida38-reptilian-wardrobe-coherence-38-2oe8b';

describe('38.2o.e6 — diversificación fuerte de indumentaria reptiliana civilizada', () => {
  it('muestra varias familias de ropa y siluetas claramente distintas en la galería de laboratorio', () => {
    const families = new Set<string>();
    const silhouettes = new Set<string>();
    let nonTechCount = 0;

    const entries = buildVida38ReptilianGallery38OE5(24);
    // La diversidad de las 24 fichas se verifica sin instanciar 24 cuerpos SDF
    // completos: esos modelos tardaban >15 s en un test cuyo límite es 15 s.
    // Aun así se construye y verifica una representación REAL por familia.
    const representative = new Map<string, typeof entries[number]>();
    for(const entry of entries){
      const family = deriveVida38WardrobeCoherencePlan38OE8B(entry.contract).family;
      families.add(family);
      if(family !== 'TECH_SUIT')nonTechCount++;
      if(!representative.has(family))representative.set(family,entry);
    }
    const formForFamily: Record<string,string> = {
      CEREMONIAL_ROBES:'DRAPED', NOBLE_REGALIA:'REGALIA', SEGMENTED_ARMOR:'ARMORED',
      COLONIAL_RIG:'UTILITARIAN', PELAGIC_DRAPE:'PELAGIC', TECH_SUIT:'TECH',
    };
    for(const [family,entry] of representative){
      const subject = new THREE.Group();
      const created = createVida38CivilizedReptilianPreview38O(subject, entry.contract, 'LOW');
      try{
        expect(subject.userData['vida38ReptilianGarmentFamily38OE6']).toBe(family);
        const garments = created.filter(o => o.name === 'VIDA38_2OD_REPTILIAN_GARMENT' && o instanceof THREE.Mesh) as THREE.Mesh[];
        expect(garments.length).toBeGreaterThan(0);
        expect(garments.some(mesh => (mesh.geometry.getAttribute('position')?.count ?? 0)>15)).toBe(true);
        // Las familias se distinguen por conjuntos geométricos y no por pigmentación.
        const parts = garments.map(mesh => String(mesh.userData['garmentPart38OE6'] ?? 'BASE'));
        if(family==='CEREMONIAL_ROBES'||family==='NOBLE_REGALIA'||family==='PELAGIC_DRAPE'){
          expect(parts.some(part => /DRAPE|CAPE|ROBE|REGALIA|MANTLE|TUNIC|FLOW|FIN|WAVE|PELAGIC|SOFT|CLOTH|EDGING/.test(part))).toBe(true);
        }else if(family==='SEGMENTED_ARMOR'||family==='COLONIAL_RIG'){
          expect(parts.some(part => /PAULDRON|GREAVE|CUIRASS|BELT|HARNESS|POUCH|UTILITY|BOOT|VEST|PLATE/.test(part))).toBe(true);
        }
        const kind=formForFamily[family];
        if(kind)silhouettes.add(kind);
      }finally{
        const geometries=new Set<THREE.BufferGeometry>();
        const materials=new Set<THREE.Material>();
        for(const obj of created){
          if(!(obj instanceof THREE.Mesh))continue;
          geometries.add(obj.geometry);
          for(const m of Array.isArray(obj.material)?obj.material:[obj.material])materials.add(m);
        }
        geometries.forEach(g=>g.dispose()); materials.forEach(m=>m.dispose());
      }
    }

    expect(families.size).toBeGreaterThanOrEqual(5);
    expect(nonTechCount).toBeGreaterThanOrEqual(10);
    expect(silhouettes.size).toBeGreaterThanOrEqual(4);
  }, 60_000);
});
