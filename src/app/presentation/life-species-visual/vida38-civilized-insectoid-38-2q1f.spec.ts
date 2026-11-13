import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildVida38InsectoidGallery38Q } from './vida38-civilized-insectoid-fixtures-38-2q';
import { createVida38CivilizedInsectoidPreview38Q } from './vida38-civilized-insectoid-preview-38-2q';
import {
  VIDA38_INSECTOID_EYE_FAMILIES_38Q1F,
  VIDA38_INSECTOID_OCULAR_DIVERSITY_REVISION_38Q1F,
  buildVida38InsectoidSpecialEyes38Q1F,
  collectVida38InsectoidOcularSignature38Q1F,
  createVida38InsectoidDiversePrimaryEye38Q1F,
  deriveVida38InsectoidOcularPlan38Q1F,
  isVida38InsectoidEyeHexDark38Q1F,
} from './vida38-civilized-insectoid-ocular-diversity-38-2q1f';
import { VIDA38_INSECTOID_DARK_EYE_PALETTE_38Q1D } from './vida38-civilized-insectoid-ocular-coxal-38-2q1d';

function dispose(objects: readonly THREE.Object3D[]): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  for (const object of objects) {
    if (!(object instanceof THREE.Mesh)) continue;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
  }
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}

describe('38.2q1f — diversificación morfológica ocular de insectoides civilizados', () => {
  const entries = buildVida38InsectoidGallery38Q(24);

  it('distribuye múltiples familias oculares y mantiene identidad determinista por especie', () => {
    const families = new Set<string>();
    const signatures = new Map<string, string>();
    for (const entry of entries) {
      const one = deriveVida38InsectoidOcularPlan38Q1F(entry.plan);
      const two = deriveVida38InsectoidOcularPlan38Q1F(entry.plan);
      expect(two).toEqual(one);
      expect(one.revision).toBe(VIDA38_INSECTOID_OCULAR_DIVERSITY_REVISION_38Q1F);
      expect(VIDA38_INSECTOID_EYE_FAMILIES_38Q1F).toContain(one.family);
      families.add(one.family);
      signatures.set(entry.plan.speciesId, one.signature);
      expect(collectVida38InsectoidOcularSignature38Q1F(entry.plan, 'MEDIUM')).toContain(one.family);
    }
    expect(families.size).toBeGreaterThanOrEqual(5);
    expect(signatures.size).toBe(entries.length);
  });

  it('mantiene dos ojos laterales principales y añade ojos especiales solo en familias que lo requieren', () => {
    let specialFamilies = 0;
    for (const entry of entries) {
      const root = new THREE.Group();
      const created = createVida38CivilizedInsectoidPreview38Q(root, entry.contract, 'LOW');
      try {
        const ocular = deriveVida38InsectoidOcularPlan38Q1F(entry.plan);
        const compound = created.filter(object => object.userData['civInsectoidPart38Q'] === 'COMPOUND_EYE');
        const special = created.filter(object => object.userData['civInsectoidPart38Q'] === 'SPECIAL_EYE');
        expect(compound).toHaveLength(2);
        if (ocular.specialEyeCount > 0) {
          specialFamilies++;
          expect(special).toHaveLength(ocular.specialEyeCount);
        } else {
          expect(special).toHaveLength(0);
        }
        for (const object of compound) {
          expect(object.userData['vida38InsectoidOcularDiversityRevision38Q1F'])
            .toBe(VIDA38_INSECTOID_OCULAR_DIVERSITY_REVISION_38Q1F);
          expect(VIDA38_INSECTOID_EYE_FAMILIES_38Q1F)
            .toContain(object.userData['vida38InsectoidEyeFamily38Q1F']);
          expect(VIDA38_INSECTOID_DARK_EYE_PALETTE_38Q1D)
            .toContain(object.userData['vida38InsectoidDarkEyeHex38Q1D']);
        }
      } finally { dispose(created); }
    }
    expect(specialFamilies).toBeGreaterThanOrEqual(2);
  }, 60_000);

  it('genera siluetas oculares primarias visualmente distintas entre familias', () => {
    const seen = new Map<string, THREE.Vector3>();
    for (const entry of entries) {
      const ocular = deriveVida38InsectoidOcularPlan38Q1F(entry.plan);
      if (seen.has(ocular.family)) continue;
      const eye = createVida38InsectoidDiversePrimaryEye38Q1F(entry.plan, 1, 'LOW');
      try {
        seen.set(ocular.family, eye.scale.clone().divideScalar(entry.plan.headScale));
      } finally { dispose([eye]); }
    }
    expect(seen.size).toBeGreaterThanOrEqual(5);
    expect(seen.get('LATERAL_COMPOUND')?.x ?? 0).toBeGreaterThan(seen.get('ROUNDED_COMPOUND')?.x ?? 999);
    expect(seen.get('OVAL_COMPOUND')?.y ?? 0).toBeGreaterThan(seen.get('ROUNDED_COMPOUND')?.y ?? 999);
    expect(seen.get('REDUCED_COMPOUND_OCELLI')?.x ?? 999).toBeLessThan(seen.get('ROUNDED_COMPOUND')?.x ?? 0);
  }, 60_000);

  it('mantiene gama negra/obsidiana en ojos principales y especiales', () => {
    for (const entry of entries) {
      const ocular = deriveVida38InsectoidOcularPlan38Q1F(entry.plan);
      const main = createVida38InsectoidDiversePrimaryEye38Q1F(entry.plan, -1, 'LOW');
      const specials = buildVida38InsectoidSpecialEyes38Q1F(entry.plan);
      try {
        expect(isVida38InsectoidEyeHexDark38Q1F(main.userData['vida38InsectoidDarkEyeHex38Q1D'])).toBe(true);
        if (ocular.specialEyeCount > 0) {
          expect(specials).toHaveLength(ocular.specialEyeCount);
          for (const eye of specials) {
            expect(isVida38InsectoidEyeHexDark38Q1F(eye.userData['vida38InsectoidDarkEyeHex38Q1D'])).toBe(true);
          }
        }
      } finally { dispose([main, ...specials]); }
    }
  }, 60_000);
});
