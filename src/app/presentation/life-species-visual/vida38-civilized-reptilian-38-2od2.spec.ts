import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { createVida38SpeciesPreviewModelV1, describeVida38SpeciesPreviewV1 } from './vida38-species-visual-preview-scene';
import {inspectVida38PrimitiveReptilianModel38U,validateVida38PrimitiveReptilianModel38U} from './vida38-primitive-reptilian-preview-38-2u';

function reptilian(id: string, level: 'PRIMITIVE' | 'ADVANCED' | 'VERY_ADVANCED'): Vida38SpeciesVisualContract {
  return {
    revision: VIDA38_SPECIES_VISUAL_REVISION,
    speciesId: id,
    speciesName: id,
    variantSeedUint32: 382002,
    appearanceFingerprint: `38-2od2:${id}`,
    provenance: { status: 'CONFIRMED_SYSTEM_CT0', representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION', observedImageAvailable: false, bodyStorageKey: 'V3:38.2od2', ecosystemDigest: 'digest:38.2od2' },
    morphology: { group: 'REPTILES', bodyPlan: 'TETRAPOD', covering: 'SCALES', appendagePairs: 2 },
    ecology: { habitat: 'SURFACE_WET_MARGIN', nutrition: 'OMNIVORE', niche: 'SURFACE_WET_MARGIN/OMNIVORE' },
    locomotion: 'WALKING', bodyLengthMeters: 2.1,
    pigmentation: { primaryColorHex: '#7c9d8b', secondaryColorHex: '#b9a795', pattern: 'BANDS', bioluminescent: false },
    adaptations: ['SENSORY_ORIENTATION'],
    intelligence: { lineage: 'REPTILIAN', civilizationTier: level, civilizationLevel: level } as unknown as NonNullable<Vida38SpeciesVisualContract['intelligence']>,
  };
}

function boundsFor(obj: THREE.Object3D): THREE.Box3 { return new THREE.Box3().setFromObject(obj); }

describe('38.2o.d2 — anclaje anatómico SDF y encuadre sin objetos sueltos', () => {
  it('mantiene la ruta civilizada bípeda sin introducir atrezzo antiguo', () => {
    const descriptor = describeVida38SpeciesPreviewV1(reptilian('rep:route', 'PRIMITIVE'));
    expect(descriptor.family).toBe('BIPED_BODY');
    expect(descriptor.specialistIntelligenceDeferred).toBe(false);
  });

  it('para los tres niveles: prendas conformadas, accesorios anclados y pies sobre el escenario', () => {
    for (const level of ['PRIMITIVE', 'ADVANCED', 'VERY_ADVANCED'] as const) {
      const model = createVida38SpeciesPreviewModelV1(reptilian(`rep:${level}`, level), { humanoidQuality: 'LOW' });
      const body = model.subject.getObjectByName('VIDA38_2OD_REPTILIAN_BODY') as THREE.Mesh | undefined;
      expect(body).toBeTruthy();
      expect(model.subject.userData['vida38ReptilianSdfReuse38OD']).toBe(true);
      expect(model.subject.userData['vida38ReptilianAnchored38OD2']).toBe(true);
      // Primero actualizar el árbol completo: Box3(body) calculado antes que Box3(subject)
      // leía matrixWorld del cuerpo con el padre aún desactualizado.
      model.subject.updateWorldMatrix(true, true);
      const bodyBounds = boundsFor(body!);
      // No imponer la cota absoluta anterior a la normalización actual del visor.
      // El cuerpo debe ocupar la base de la envolvente visual efectiva.
      const subjectBounds = boundsFor(model.subject);
      expect(Number.isFinite(bodyBounds.min.y)).toBe(true);
      expect(bodyBounds.min.y).toBeGreaterThanOrEqual(subjectBounds.min.y - 0.02);
      expect(bodyBounds.min.y - subjectBounds.min.y).toBeLessThan(0.30);
      const details: THREE.Object3D[] = [];
      const garments: THREE.Mesh[] = [];
      model.subject.traverse((obj: THREE.Object3D) => {
        if (obj.name.startsWith('VIDA38_2OD_') && obj !== body) details.push(obj);
        if (obj instanceof THREE.Mesh && (
          obj.userData['vida38PrimitiveReptilianPart38U'] === 'GARMENT' ||
          obj.userData['vida38AdvancedReptilianWardrobe38S4'] !== undefined ||
          obj.userData['vida38AdvancedReptilianDiversity38S8'] !== undefined ||
          (level === 'VERY_ADVANCED' && (obj.name === 'VIDA38_2OD_REPTILIAN_GARMENT' ||
            obj.userData['garmentPart38OE6'] !== undefined || obj.userData['garmentGeom38OE7'] !== undefined ||
            obj.userData['vida38TechnicalGarmentDiscipline38OE8'] !== undefined)))) garments.push(obj);
        expect(obj.name).not.toBe('VIDA38_CANOPY_DECORATIVE_REFERENCE_BRANCH');
      });
      if (level !== 'VERY_ADVANCED') {
        expect(garments.length).toBeGreaterThan(0);
      } else {
        // El revestimiento avanzado puede ser una piel técnica 360º con shader,
        // no necesariamente una malla heredada independiente.
        expect(model.subject.userData['vida38WardrobeEngine38OE8B']).toBeDefined();
      }
      expect(model.subject.getObjectByName('VIDA38_2OD_REPTILIAN_TAIL')).toBeTruthy();
      for (const detail of details) {
        if (!(detail instanceof THREE.Mesh)) continue;
        const b = boundsFor(detail);
        // No hay objetos flotantes *debajo* de los pies ni accesorios sueltos bajo la base.
        expect(b.min.y).toBeGreaterThan(bodyBounds.min.y - 0.12);
        expect(b.max.y).toBeLessThan(bodyBounds.max.y + 0.22);
      }
      model.dispose();
    }
  }, 60_000);

  it('el vestuario primitivo usa la geometría SDF real y sus anclajes 38.2u7, no la prenda antigua', () => {
    const model = createVida38SpeciesPreviewModelV1(reptilian('rep:fitted', 'PRIMITIVE'), { humanoidQuality: 'LOW' });
    try {
      const body = model.subject.getObjectByName('VIDA38_2OD_REPTILIAN_BODY') as THREE.Mesh | undefined;
      expect(body).toBeTruthy();
      const diagnostics = inspectVida38PrimitiveReptilianModel38U(model.subject);
      expect(diagnostics.anatomyCount).toBe(1);
      expect(diagnostics.garmentCount).toBeGreaterThan(0);
      expect(model.subject.userData['vida38PrimitiveSurfaceFit38U7']).toBeTruthy();
      const plan = model.subject.userData['vida38PrimitiveReptilianPlan38U'] as
        import('./vida38-primitive-reptilian-plan-38-2u').Vida38PrimitiveReptilianPlan38U;
      expect(plan).toBeDefined();
      expect(validateVida38PrimitiveReptilianModel38U(model.subject, plan.wear)).toMatchObject({valid: true, problems: []});
      expect(model.subject.children.some(child => child.name === 'VIDA38_2OD_REPTILIAN_GARMENT')).toBe(false);
    } finally { model.dispose(); }
  }, 60_000);
});
