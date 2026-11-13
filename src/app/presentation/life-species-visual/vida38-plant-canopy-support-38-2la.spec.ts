import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { createVida38SpeciesPreviewModelV1 } from './vida38-species-visual-preview-scene';
import { deriveVida38PlantMorphology38L } from './vida38-plant-morphology-38-2l';
import { buildVida38PlantArchitecture38L } from './vida38-plant-architecture-38-2l';

function plant(id: string, height: number, habitat: Vida38SpeciesVisualContract['ecology']['habitat']): Vida38SpeciesVisualContract {
  return {
    revision: VIDA38_SPECIES_VISUAL_REVISION,
    speciesId: id, speciesName: id, variantSeedUint32: 0x8cae2481, appearanceFingerprint: '38.2la-cue',
    provenance: {
      status: 'CONFIRMED_SYSTEM_CT0', representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',
      observedImageAvailable: false, bodyStorageKey: 'V3:vegetation', ecosystemDigest: 'digest:vegetation',
    },
    morphology: { group: 'PLANTS_TREES', bodyPlan: 'STEMMED', covering: 'FIBROUS', appendagePairs: 0 },
    ecology: { habitat, nutrition: 'PHOTOSYNTHETIC', niche: `${habitat}/PHOTOSYNTHETIC` },
    locomotion: 'SESSILE', bodyLengthMeters: height,
    pigmentation: { primaryColorHex: '#648d74', secondaryColorHex: '#ba8d68', pattern: 'SOLID', bioluminescent: false },
    adaptations: ['HUMIDITY_TOLERANCE'], intelligence: null,
  };
}

const isOversizedCanopyProp = (obj: THREE.Object3D): boolean => {
  if (!(obj instanceof THREE.Mesh)) return false;
  return obj.name === 'VIDA38_CANOPY_DECORATIVE_REFERENCE_BRANCH' ||
    (obj.geometry instanceof THREE.CylinderGeometry && obj.geometry.parameters.height > 1.5);
};

describe('38.2l.a — eliminación de soportes espurios en la vegetación', () => {
  it('no añade el palo CANOPY a herbáceas, arbustos ni árboles', () => {
    for (const [height, form] of [[0.7, 'HERB'], [1.8, 'SHRUB'], [3.2, 'TREE']] as const) {
      const source = plant(`canopy-plant-${form}`, height, 'SURFACE_CANOPY');
      const model = createVida38SpeciesPreviewModelV1(source, { humanoidQuality: 'LOW' });
      const objects: THREE.Object3D[] = [];
      model.root.traverse(object => objects.push(object));
      expect(objects.filter(isOversizedCanopyProp)).toHaveLength(0);
      expect(objects.some(object => object.name === 'VIDA38_2L_PLANT_BRANCH_ARCHITECTURE')).toBe(true);
      expect(objects.some(object => object.name === 'VIDA38_2L_PLANT_LEAVES')).toBe(true);
      expect(model.subject.userData['plantGrowthForm']).toBe(form);
      model.dispose();
    }
  }, 15_000);

  it('conserva la arquitectura procedural y el determinismo vegetal', () => {
    const source = plant('repeat-38-2la', 1.8, 'SURFACE_CANOPY');
    const morphology = deriveVida38PlantMorphology38L(source);
    const before = buildVida38PlantArchitecture38L(morphology);
    const after = buildVida38PlantArchitecture38L(deriveVida38PlantMorphology38L(source));
    expect(after).toEqual(before);
    expect(before.stems.length).toBeGreaterThan(2);
    expect(before.leaves.length).toBeGreaterThan(10);
  });

  it('no reintroduce el decorado CANOPY en especies no vegetales', () => {
    const source: Vida38SpeciesVisualContract = {
      ...plant('fungal-on-canopy', 0.25, 'SURFACE_CANOPY'),
      morphology: { group: 'FUNGI', bodyPlan: 'FILAMENTOUS', covering: 'FIBROUS', appendagePairs: 0 },
      ecology: { habitat: 'SURFACE_CANOPY', nutrition: 'DECOMPOSER', niche: 'CANOPY/DECOMPOSER' },
    };
    const model = createVida38SpeciesPreviewModelV1(source, { humanoidQuality: 'LOW' });
    const props: THREE.Object3D[] = [];
    model.root.traverse(object => { if (object.name === 'VIDA38_CANOPY_DECORATIVE_REFERENCE_BRANCH') props.push(object); });
    expect(props).toHaveLength(0);

    model.dispose();
  }, 15_000);
});
