import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { createVida38SpeciesPreviewModelV1, describeVida38SpeciesPreviewV1 } from './vida38-species-visual-preview-scene';

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
    intelligence: { lineage: 'REPTILIAN', civilizationLevel: level } as unknown as NonNullable<Vida38SpeciesVisualContract['intelligence']>,
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
        if (obj instanceof THREE.Mesh && (obj.name === 'VIDA38_2OD_REPTILIAN_GARMENT' ||
          obj.userData['vida38AdvancedReptilianWardrobe38S4'] || obj.userData['vida38AdvancedReptilianDiversity38S8'])) garments.push(obj);
        expect(obj.name).not.toBe('VIDA38_CANOPY_DECORATIVE_REFERENCE_BRANCH');
      });
      expect(garments.length).toBeGreaterThan(0);
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

  it('la ropa nace de los mismos vértices del cuerpo y no de cilindros suspendidos', () => {
    const model = createVida38SpeciesPreviewModelV1(reptilian('rep:fitted', 'PRIMITIVE'), { humanoidQuality: 'LOW' });
    const body = model.subject.getObjectByName('VIDA38_2OD_REPTILIAN_BODY') as THREE.Mesh;
    const vertices = (body.geometry as THREE.BufferGeometry).getAttribute('position') as THREE.BufferAttribute;
    const garment = model.subject.children.find((obj: THREE.Object3D) => obj.name === 'VIDA38_2OD_REPTILIAN_GARMENT') as THREE.Mesh | undefined;
    expect(garment).toBeTruthy();
    const fitted = (garment!.geometry as THREE.BufferGeometry).getAttribute('position') as THREE.BufferAttribute;
    expect(fitted.count).toBeGreaterThan(15);
    for (let i = 0; i < fitted.count; i += Math.max(1, Math.floor(fitted.count / 15))) {
      const v = new THREE.Vector3().fromBufferAttribute(fitted, i);
      let nearest = Infinity;
      for (let j = 0; j < vertices.count; j++) {
        const dx = vertices.getX(j) - v.x, dy = vertices.getY(j) - v.y, dz = vertices.getZ(j) - v.z;
        nearest = Math.min(nearest, dx*dx + dy*dy + dz*dz);
      }
      expect(Math.sqrt(nearest)).toBeLessThan(0.025);
    }
    model.dispose();
  }, 60_000);
});
