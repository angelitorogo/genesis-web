import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { createVida38SpeciesPreviewModelV1, describeVida38SpeciesPreviewV1 } from './vida38-species-visual-preview-scene';

function reptilian(id: string, level: 'PRIMITIVE'|'ADVANCED'|'VERY_ADVANCED'): Vida38SpeciesVisualContract {
  return {
    revision: VIDA38_SPECIES_VISUAL_REVISION,
    speciesId: id, speciesName: id, variantSeedUint32: 996633, appearanceFingerprint: `38-2o:${id}`,
    provenance: { status: 'CONFIRMED_SYSTEM_CT0', representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION', observedImageAvailable: false, bodyStorageKey: 'V3:reptilian', ecosystemDigest: 'digest:38-2o' },
    morphology: { group: 'REPTILES', bodyPlan: 'TETRAPOD', covering: 'SCALES', appendagePairs: 2 },
    ecology: { habitat: 'SURFACE_WET_MARGIN', nutrition: 'OMNIVORE', niche: 'SURFACE_WET_MARGIN/OMNIVORE' },
    locomotion: 'WALKING', bodyLengthMeters: 2.2,
    pigmentation: { primaryColorHex: '#6b8f96', secondaryColorHex: '#c5ab9e', pattern: 'BANDS', bioluminescent: false },
    adaptations: ['SENSORY_ORIENTATION'],
    intelligence: { lineage: 'REPTILIAN', civilizationLevel: level } as unknown as NonNullable<Vida38SpeciesVisualContract['intelligence']>,
  };
}

describe('38.2o — regresión migrada a SDF humanoide 38.2o.d2', () => {
  it('clasifica correctamente el linaje reptiliano civilizado', () => {
    const d = describeVida38SpeciesPreviewV1(reptilian('rep:a','PRIMITIVE'));
    expect(d.family).toBe('BIPED_BODY');
    expect(d.specialistIntelligenceDeferred).toBe(false);
  });
  it('los tres niveles usan un solo cuerpo SDF y ropa anatómica en vez de cápsulas sueltas', () => {
    for (const level of ['PRIMITIVE','ADVANCED','VERY_ADVANCED'] as const) {
      const model = createVida38SpeciesPreviewModelV1(reptilian(`rep:${level}`,level), { humanoidQuality:'LOW' });
      const body = model.subject.getObjectByName('VIDA38_2OD_REPTILIAN_BODY') as THREE.Mesh | undefined;
      expect(body).toBeTruthy();
      expect(model.subject.userData['vida38ReptilianSdfReuse38OD']).toBe(true);
      expect(model.subject.userData['civilizationLevel38O']).toBe(level);
      expect(model.subject.userData['uprightPosture38O']).toBe(true);
      const garments = model.subject.children.filter((o: THREE.Object3D) => o.name === 'VIDA38_2OD_REPTILIAN_GARMENT');
      expect(garments.length).toBeGreaterThan(0);
      const size = new THREE.Box3().setFromObject(model.subject).getSize(new THREE.Vector3());
      expect(size.y).toBeGreaterThan(size.x * 1.25);
      model.dispose();
    }
  }, 60_000);
});
