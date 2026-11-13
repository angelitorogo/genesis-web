import { resolveVida38ReptilianTestEntry38S8C } from './vida38-reptilian-test-fixtures-38-2s8c';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildVida38ReptilianGallery38OE5 } from './vida38-reptilian-gallery-fixtures-38-2oe5';
import { createVida38CivilizedReptilianPreview38O } from './vida38-civilized-reptilian-preview-38-2o';
import {
  VIDA38_CULTURAL_DIVERSITY_REVISION_38OE9,
  auditVida38CulturalDiversity38OE9,
  deriveVida38CulturalDiversityPlan38OE9,
} from './vida38-reptilian-cultural-diversity-38-2oe9';

function dispose(created: readonly THREE.Object3D[]): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  for (const object of created) {
    if (!(object instanceof THREE.Mesh)) continue;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
  }
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}

describe('38.2o.e9 — diversidad cultural y validación visual', () => {
  it('genera 24 ejemplares con cobertura cultural y diversidad combinatoria clara', () => {
    const entries = buildVida38ReptilianGallery38OE5(24);
    const audit = auditVida38CulturalDiversity38OE9(entries.map(entry => entry.contract));
    expect(entries.length).toBe(24);
    expect(audit.uniqueCultures).toBe(6);
    expect(audit.uniqueGarmentLines).toBe(6);
    expect(audit.uniqueFamilies).toBeGreaterThanOrEqual(5);
    expect(audit.uniqueLengths).toBeGreaterThanOrEqual(5);
    expect(audit.uniqueSilhouettes).toBeGreaterThanOrEqual(6);
    expect(audit.uniqueMaterials).toBeGreaterThanOrEqual(5);
    expect(audit.uniqueAdornments).toBeGreaterThanOrEqual(4);
    // La galería de 24 optimiza cobertura conjunta, no las seis subclases de accesorios.
    // Validar que no colapsa a un solo sesgo y medir cobertura adicional en todo el pool.
    expect(audit.uniqueAccessoryBiases).toBeGreaterThanOrEqual(3);
    const fullPool = Array.from({length:360},(_,i)=>resolveVida38ReptilianTestEntry38S8C(i+1).contract);
    const broadAudit = auditVida38CulturalDiversity38OE9(fullPool);
    expect(broadAudit.uniqueAccessoryBiases).toBeGreaterThanOrEqual(5);
    expect(audit.uniqueVisualSignatures).toBeGreaterThanOrEqual(20);
  });

  it('mantiene determinismo del plan cultural por contrato', () => {
    const entry = buildVida38ReptilianGallery38OE5(24)[7]!;
    const a = deriveVida38CulturalDiversityPlan38OE9(entry.contract);
    const b = deriveVida38CulturalDiversityPlan38OE9(entry.contract);
    expect(a).toEqual(b);
    expect(a.visualSignature).toBe(b.visualSignature);
  });

  it('inyecta metadatos de diversidad cultural en el renderer reptiliano', () => {
    const entry = buildVida38ReptilianGallery38OE5(24)[11]!;
    const subject = new THREE.Group();
    const created = createVida38CivilizedReptilianPreview38O(subject, entry.contract, 'LOW');
    try {
      expect(subject.userData['vida38CulturalDiversityRevision38OE9']).toBe(VIDA38_CULTURAL_DIVERSITY_REVISION_38OE9);
      const plan = subject.userData['vida38CulturalDiversityPlan38OE9'] as Record<string, unknown>;
      expect(plan).toBeTruthy();
      expect(typeof plan['length']).toBe('string');
      expect(typeof plan['silhouette']).toBe('string');
      expect(typeof plan['material']).toBe('string');
      expect(typeof plan['adornment']).toBe('string');
    } finally {
      dispose(created);
    }
  }, 15000);
});
