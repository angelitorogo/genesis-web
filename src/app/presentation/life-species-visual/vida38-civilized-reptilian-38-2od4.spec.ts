import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { createVida38SpeciesPreviewModelV1 } from './vida38-species-visual-preview-scene';

function reptilian(id: string, levelBlob: unknown): Vida38SpeciesVisualContract {
  return {
    revision: VIDA38_SPECIES_VISUAL_REVISION,
    speciesId: id, speciesName: id, variantSeedUint32: 382004, appearanceFingerprint: `38-2od4:${id}`,
    provenance: { status: 'CONFIRMED_SYSTEM_CT0', representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION', observedImageAvailable: false, bodyStorageKey: 'V3:38.2od4', ecosystemDigest: 'digest:38.2od4' },
    morphology: { group: 'REPTILES', bodyPlan: 'TETRAPOD', covering: 'SCALES', appendagePairs: 2 },
    ecology: { habitat: 'SURFACE_WET_MARGIN', nutrition: 'OMNIVORE', niche: 'SURFACE_WET_MARGIN/OMNIVORE' },
    locomotion: 'WALKING', bodyLengthMeters: 2.25,
    pigmentation: { primaryColorHex: '#718d90', secondaryColorHex: '#b39a87', pattern: 'BANDS', bioluminescent: false },
    adaptations: ['SENSORY_ORIENTATION'],
    intelligence: levelBlob as NonNullable<Vida38SpeciesVisualContract['intelligence']>,
  };
}

describe('38.2o.d4 — ropa futurista, ojos visibles y cola del color corporal', () => {
  it('detecta VERY_ADVANCED incluso con blobs alternativos', () => {
    const model = createVida38SpeciesPreviewModelV1(reptilian('rep:blob', { lineage: 'REPTILIAN', civilization: { level: 'VERY_ADVANCED' } }), { humanoidQuality: 'LOW' });
    expect(model.subject.userData['vida38ReptilianLevel38OD']).toBe('VERY_ADVANCED');
    model.dispose();
  });

  it('cola y base usan el mismo color base del cuerpo', () => {
    const model = createVida38SpeciesPreviewModelV1(reptilian('rep:tail', { lineage: 'REPTILIAN', civilizationLevel: 'VERY_ADVANCED' }), { humanoidQuality: 'LOW' });
    expect(model.subject.userData['vida38IntegratedSdfTail38OD5']).toBe(true);
    const body = model.subject.getObjectByName('VIDA38_2OD_REPTILIAN_BODY') as THREE.Mesh;
    const positions = (body.geometry as THREE.BufferGeometry).getAttribute('position') as THREE.BufferAttribute;
    let tailVertices = 0;
    for (let i = 0; i < positions.count; i++) if (positions.getZ(i) < -0.9) tailVertices++;
    expect(tailVertices).toBeGreaterThan(10);
    model.dispose();
  });

  it('very advanced añade varias prendas y cobertura de botas', () => {
    const model = createVida38SpeciesPreviewModelV1(reptilian('rep:garment', { lineage: 'REPTILIAN', civilizationLevel: 'VERY_ADVANCED' }), { humanoidQuality: 'LOW' });
    let garments = 0;
    model.subject.traverse((obj: THREE.Object3D) => {
      if (obj.name === 'VIDA38_2OD_REPTILIAN_GARMENT') {
        garments++;
      }
    });
    expect(garments).toBeGreaterThan(0);
    expect(model.subject.userData['vida38Full360Suit38OD5']).toBe(true);
    model.dispose();
  });
});
