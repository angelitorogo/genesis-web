import { resolveVida38ReptilianTestEntry38S8C } from './vida38-reptilian-test-fixtures-38-2s8c';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildVida38ReptilianGallery38OE5 } from './vida38-reptilian-gallery-fixtures-38-2oe5';
import { createVida38CivilizedReptilianPreview38O } from './vida38-civilized-reptilian-preview-38-2o';
import {
  auditVida38WardrobeRendered38OE8B,
  deriveVida38WardrobeCoherencePlan38OE8B,
  getVida38WardrobeEngine38OE8B,
  selectVida38WardrobeFamily38OE8B,
} from './vida38-reptilian-wardrobe-coherence-38-2oe8b';

function release(created: readonly THREE.Object3D[]): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  for (const object of created) {
    if (!(object instanceof THREE.Mesh)) continue;
    geometries.add(object.geometry);
    for (const m of Array.isArray(object.material) ? object.material : [object.material]) materials.add(m);
  }
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}

describe('38.2o.e8b — coherencia del selector y auditoría de vestuario', () => {
  it('mantiene determinismo y no asigna túnicas rígidas a militares, exploradores ni colonizadores', () => {
    const families = new Set<string>();
    const lines = ['MILITARY', 'EXPLORER', 'INDUSTRIAL_COLONIZER', 'SCIENTIST', 'TECHNO_PRIEST', 'NOBLE'] as const;
    const cultures = ['STAR_KINGDOM', 'BASILICA_TECHNOCRACY', 'FRONTIER_HEGEMONY', 'PELAGIC_CONCORD', 'DUNE_MANDATE', 'OBSIDIAN_CLAN'] as const;
    for (let i = 0; i < 360; i++) {
      const garmentLine = lines[i % lines.length];
      const args = { seed: i * 1234567, level: 'VERY_ADVANCED' as const, garmentLine,
        culture: cultures[(i * 7) % cultures.length], profile: 'ROBUST_SENTINEL' as const };
      const family = selectVida38WardrobeFamily38OE8B(args);
      expect(selectVida38WardrobeFamily38OE8B(args)).toBe(family);
      families.add(family);
      if (garmentLine === 'MILITARY' || garmentLine === 'EXPLORER' || garmentLine === 'INDUSTRIAL_COLONIZER') {
        expect(['SEGMENTED_ARMOR', 'COLONIAL_RIG', 'TECH_SUIT']).toContain(family);
      }
    }
    expect(families.size).toBe(6);
  });

  it('da trazabilidad de familia, cultura y motor para las 24 muestras del laboratorio', () => {
    const entries = buildVida38ReptilianGallery38OE5(24);
    const plans = entries.map(entry => deriveVida38WardrobeCoherencePlan38OE8B(entry.contract));
    expect(new Set(plans.map(plan => plan.speciesId)).size).toBe(24);
    expect(new Set(plans.map(plan => plan.family)).size).toBeGreaterThanOrEqual(5);
    for (let index = 0; index < entries.length; index++) {
      const entry = entries[index]!;
      const plan = plans[index]!;
      expect(deriveVida38WardrobeCoherencePlan38OE8B(entry.contract)).toEqual(plan);
      expect(plan.culture).toBe(entry.culture);
      expect(plan.garmentLine).toBe(entry.garmentLine);
      expect(plan.engine).toBe(getVida38WardrobeEngine38OE8B(plan.family, 'VERY_ADVANCED'));
      if (plan.garmentLine === 'INDUSTRIAL_COLONIZER') expect(plan.softGarment).toBe(false);
    }
  });

  it('detecta discrepancias sin confundir un manto e7c con una armadura e8a', () => {
    const entry = resolveVida38ReptilianTestEntry38S8C(121);
    const plan = deriveVida38WardrobeCoherencePlan38OE8B(entry.contract);
    expect(plan.family).toBe('COLONIAL_RIG');
    expect(plan.engine).toBe('TECHNICAL_ARMOR_38OE8A');
    expect(auditVida38WardrobeRendered38OE8B(plan, {
      vida38ReptilianGarmentFamily38OE6: 'COLONIAL_RIG',
      vida38TechnicalGarmentRevision38OE8: 'VIDA.38.2o.e8a',
    }).status).toBe('MATCH');
    expect(auditVida38WardrobeRendered38OE8B(plan, {
      vida38ReptilianGarmentFamily38OE6: 'NOBLE_REGALIA',
      vida38OrganicGarmentRevision38OE7C: 'VIDA.38.2o.e7c',
    }).status).toBe('MISMATCH');
  });

  it('renderer real: el colonizador 121 utiliza equipamiento técnico y no la túnica anterior', () => {
    const entry = resolveVida38ReptilianTestEntry38S8C(121);
    const subject = new THREE.Group();
    const created = createVida38CivilizedReptilianPreview38O(subject, entry.contract, 'LOW');
    try {
      const plan = deriveVida38WardrobeCoherencePlan38OE8B(entry.contract);
      expect(auditVida38WardrobeRendered38OE8B(plan, subject.userData).status).toBe('MATCH');
      expect(subject.userData['vida38OrganicGarmentRevision38OE7C']).toBeUndefined();
      expect(typeof subject.userData['vida38TechnicalGarmentRevision38OE8']).toBe('string');
      expect(created.some(object => object.userData['garmentGeom38OE8'] === 'ANATOMICAL_CURVED_PLATE')).toBe(true);
      expect(subject.userData['vida38IntegratedSdfTail38OD5']).toBe(true);
      expect(subject.userData['vida38ReptilianOrbitalGlobe38OE4']).toBe(true);
    } finally {
      release(created);
    }
  }, 15000);
});
