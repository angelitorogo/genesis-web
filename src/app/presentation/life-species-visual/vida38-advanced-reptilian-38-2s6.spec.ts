import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createVida38SpeciesPreviewModelV1 } from './vida38-species-visual-preview-scene';
import { buildVida38AdvancedReptilianGallery38S } from './vida38-advanced-reptilian-fixtures-38-2s';
import { isVida38AdvancedReptilian38S } from './vida38-advanced-reptilian-plan-38-2s';
import {
  VIDA38_ADVANCED_REPTILIAN_RUNTIME_REVISION_38S6,
  assertVida38AdvancedReptilianActualModel38S6,
  enforceVida38AdvancedReptilianVisibleRenderer38S6,
} from './vida38-advanced-reptilian-runtime-38-2s6';
import { VIDA38_ADVANCED_REPTILIAN_WARDROBE_REVISION_38S4 } from './vida38-advanced-reptilian-wardrobe-38-2s4';

const entries = buildVida38AdvancedReptilianGallery38S(24);

describe('38.2s6 — verificar la ropa en el modelo real, sin falsas certificaciones', () => {
  it('detecta un modelo antiguo aunque tenga un plan de ropa moderno', () => {
    const subject = new THREE.Group();
    subject.add(new THREE.Mesh(new THREE.BoxGeometry(.5,.6,.3),new THREE.MeshBasicMaterial()));
    subject.userData['vida38AdvancedReptilianWardrobeFamily38S4'] = 'SCIENTIFIC_ATTIRE';
    expect(() => assertVida38AdvancedReptilianActualModel38S6(subject)).toThrow('NO visible');
    (subject.children[0] as THREE.Mesh).geometry.dispose();
    ((subject.children[0] as THREE.Mesh).material as THREE.Material).dispose();
  });

  it('crea prendas y accesorios realmente visibles en el resultado de la fábrica de escena', () => {
    const visualFamilies = new Set<string>();
    for (const outfit of ['PRESSURE_SUIT','LAB_APPAREL','UTILITY_OVERALLS','EXECUTIVE_ATTIRE'] as const) {
      const entry=entries.find(e=>e.plan.outfit===outfit);
      expect(entry,`Falta muestra ${outfit}`).toBeDefined();
      if(!entry) continue;
      const model=createVida38SpeciesPreviewModelV1(entry.contract,{humanoidQuality:'LOW'});
      try {
        const subject=model.subject;
        expect(subject.userData['vida38AdvancedReptilianRuntime38S6'])
          .toBe(VIDA38_ADVANCED_REPTILIAN_RUNTIME_REVISION_38S6);
        expect(subject.userData['vida38AdvancedReptilianWardrobeRevision38S4'])
          .toBe(VIDA38_ADVANCED_REPTILIAN_WARDROBE_REVISION_38S4);
        const diagnostics=assertVida38AdvancedReptilianActualModel38S6(subject);
        expect(diagnostics.garmentCount).toBeGreaterThanOrEqual(6);
        expect(diagnostics.structuralCount).toBeGreaterThanOrEqual(1);
        expect(diagnostics.accessoryCount).toBeGreaterThanOrEqual(1);
        expect(diagnostics.legacyGarmentCount).toBe(0);
        expect(diagnostics.structuralBounds.width).toBeGreaterThan(.24);
        expect(diagnostics.structuralBounds.height).toBeGreaterThan(.18);
        expect(diagnostics.structuralBounds.depth).toBeGreaterThan(.14);
        const structural=subject.children.filter(o=>o.name.includes('JACKET_360')||o.name.includes('WORKSUIT_360')||o.name.includes('COAT_360'));
        expect(structural.length).toBeGreaterThan(0);
        const first=structural[0];
        expect(first).toBeInstanceOf(THREE.Mesh);
        const garment=first as THREE.Mesh;
        const positions=garment.geometry.getAttribute('position');
        expect(positions.count).toBeGreaterThan(400);
        visualFamilies.add(subject.userData['vida38AdvancedReptilianWardrobeFamily38S4'] as string);
      } finally { model.dispose(); }
    }
    expect(visualFamilies.size).toBeGreaterThanOrEqual(3);
  }, 60_000);

  it('el control no añade ropa nueva a los tres linajes muy avanzados, ni al nivel primitivo', () => {
    const base=entries[0]!.contract;
    for (const lineage of ['REPTILIAN','INSECTOID','HUMANOID'] as const) {
      const contract={...base,intelligence:{lineage,civilizationTier:'VERY_ADVANCED' as const}};
      expect(isVida38AdvancedReptilian38S(contract)).toBe(false);
      const marker=new THREE.Group();
      const child=new THREE.Object3D();marker.add(child);
      expect(enforceVida38AdvancedReptilianVisibleRenderer38S6(marker,contract,'LOW')).toBeNull();
      expect(marker.children).toHaveLength(1);
      expect(marker.children[0]).toBe(child);
    }
    const primitive={...base,intelligence:{lineage:'REPTILIAN' as const,civilizationTier:'PRIMITIVE' as const}};
    expect(enforceVida38AdvancedReptilianVisibleRenderer38S6(new THREE.Group(),primitive,'LOW')).toBeNull();
  });

  it('no reconstruye dos veces una escena avanzada ya verificada', () => {
    const model=createVida38SpeciesPreviewModelV1(entries[0]!.contract,{humanoidQuality:'LOW'});
    try {
      const before=[...model.subject.children];
      const result=enforceVida38AdvancedReptilianVisibleRenderer38S6(model.subject,entries[0]!.contract,'LOW');
      expect(result?.wasRebuilt).toBe(false);
      expect(model.subject.children.length).toBe(before.length);
      expect(model.subject.children.every((x,i)=>x===before[i])).toBe(true);
    } finally {model.dispose();}
  },60_000);
});
