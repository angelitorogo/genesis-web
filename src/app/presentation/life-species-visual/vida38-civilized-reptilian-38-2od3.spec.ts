import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { createVida38SpeciesPreviewModelV1 } from './vida38-species-visual-preview-scene';

function reptilian(id: string, level: 'PRIMITIVE' | 'ADVANCED' | 'VERY_ADVANCED'): Vida38SpeciesVisualContract {
  return {
    revision: VIDA38_SPECIES_VISUAL_REVISION,
    speciesId: id, speciesName: id, variantSeedUint32: 382003, appearanceFingerprint: `38-2od3:${id}`,
    provenance: { status: 'CONFIRMED_SYSTEM_CT0', representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION', observedImageAvailable: false, bodyStorageKey: 'V3:38.2od3', ecosystemDigest: 'digest:38.2od3' },
    morphology: { group: 'REPTILES', bodyPlan: 'TETRAPOD', covering: 'SCALES', appendagePairs: 2 },
    ecology: { habitat: 'SURFACE_WET_MARGIN', nutrition: 'OMNIVORE', niche: 'SURFACE_WET_MARGIN/OMNIVORE' },
    locomotion: 'WALKING', bodyLengthMeters: 2.2,
    pigmentation: { primaryColorHex: '#6d988f', secondaryColorHex: '#b39a87', pattern: 'BANDS', bioluminescent: false },
    adaptations: ['SENSORY_ORIENTATION'],
    intelligence: { lineage: 'REPTILIAN', civilizationLevel: level } as unknown as NonNullable<Vida38SpeciesVisualContract['intelligence']>,
  };
}

describe('38.2o.d3 — mejora de cola, ojos y atuendo avanzado', () => {
  it('mantiene el cuerpo SDF y añade cola con base integrada', () => {
    const model = createVida38SpeciesPreviewModelV1(reptilian('rep:tail','VERY_ADVANCED'), { humanoidQuality: 'LOW' });
    expect(model.subject.userData['vida38ReptilianPolish38OD3']).toBe(true);
    expect(model.subject.getObjectByName('VIDA38_2OD_REPTILIAN_TAIL')).toBeTruthy();
    expect(model.subject.getObjectByName('VIDA38_2OD_REPTILIAN_TAIL_BASE')).toBeTruthy();
    model.dispose();
  });

  it('muy avanzada incorpora varias prendas y cobertura de pies', () => {
    const model = createVida38SpeciesPreviewModelV1(reptilian('rep:garment','VERY_ADVANCED'), { humanoidQuality: 'LOW' });
    let garments = 0;
    model.subject.traverse((obj: THREE.Object3D) => {
      if (obj.name === 'VIDA38_2OD_REPTILIAN_GARMENT') {
        garments++;
      }
    });
    expect(garments).toBeGreaterThan(0);
    const family = model.subject.userData['vida38ReptilianGarmentFamily38OE6'];
    expect(model.subject.userData['vida38Full360Suit38OD5']).toBe(family === 'TECH_SUIT');
    model.dispose();
  });

  it('ojos más integrados: siguen dentro del volumen de cabeza', () => {
    const model = createVida38SpeciesPreviewModelV1(reptilian('rep:eyes','VERY_ADVANCED'), { humanoidQuality: 'LOW' });
    const body = model.subject.getObjectByName('VIDA38_2OD_REPTILIAN_BODY') as THREE.Mesh;
    const bodyBounds = new THREE.Box3().setFromObject(body);
    const eyes: THREE.Object3D[] = [];
    model.subject.traverse((obj: THREE.Object3D) => { if (obj.name.startsWith('VIDA38_2OE4_REPTILIAN_')) eyes.push(obj); });
    expect(eyes.length).toBeGreaterThanOrEqual(4);
    for (const eye of eyes) {
      const b = new THREE.Box3().setFromObject(eye);
      expect(b.max.z).toBeLessThan(bodyBounds.max.z + 0.03);
    }
    model.dispose();
  });
});
