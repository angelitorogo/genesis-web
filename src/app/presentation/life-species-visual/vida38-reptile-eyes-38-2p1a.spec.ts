import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { createVida38ReptilePreview38J } from './vida38-reptile-preview-38-2j';
import { deriveVida38ReptileMorphology38J } from './vida38-reptile-morphology-38-2j';
import { deriveVida38ReptileEyePlan38P, VIDA38_REPTILE_EYE_REVISION_38P } from './vida38-reptile-eyes-38-2p';

function specimen(id: string): Vida38SpeciesVisualContract {
  return {
    revision: VIDA38_SPECIES_VISUAL_REVISION,
    speciesId: id, speciesName: id, variantSeedUint32: 3820211,
    appearanceFingerprint: `38-2p1a:${id}`,
    provenance: { status: 'CONFIRMED_SYSTEM_CT0', representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION', observedImageAvailable: false, bodyStorageKey: 'V3:38.2p1a', ecosystemDigest: '38.2p1a' },
    morphology: { group: 'REPTILES', bodyPlan: 'TETRAPOD', covering: 'SCALES', appendagePairs: 2 },
    ecology: { habitat: 'SURFACE_OPEN_TERRAIN', nutrition: 'OMNIVORE', niche: 'SURFACE_OPEN_TERRAIN/OMNIVORE' },
    locomotion: 'WALKING', bodyLengthMeters: 1.75,
    pigmentation: { primaryColorHex: '#789487', secondaryColorHex: '#b5a87c', pattern: 'BANDS', bioluminescent: false },
    adaptations: ['RESOURCE_FORAGING'], intelligence: null,
  };
}

describe('38.2p1a — rollback visual seguro de los ojos de reptiles', () => {
  it('mantiene la variedad ocular determinista y la pupila vertical', () => {
    const m = deriveVida38ReptileMorphology38J(specimen('rept:eye-rollback'));
    const plan = deriveVida38ReptileEyePlan38P(m);
    expect(plan).toEqual(deriveVida38ReptileEyePlan38P(m));
    expect(plan.slitWidth).toBeGreaterThan(0);
    expect(VIDA38_REPTILE_EYE_REVISION_38P).toContain('38.2p2a');
  });

  it('los dos ojos tienen iris coloreados, pupilas negras y ninguna placa ocular blanca', () => {
    const root = new THREE.Group();
    const created = createVida38ReptilePreview38J(root, specimen('rept:eye-visual-rollback'), 'LOW');
    const find = (prefix: string) => created.filter(o => o.name.startsWith(prefix)) as THREE.Mesh[];
    expect(find('VIDA38_2P_REPTILE_GLOBE_')).toHaveLength(2);
    expect(find('VIDA38_2P_REPTILE_IRIS_')).toHaveLength(2);
    expect(find('VIDA38_2P_REPTILE_PUPIL_')).toHaveLength(2);
    expect(find('VIDA38_2P_REPTILE_GLINT_')).toHaveLength(0);
    expect(find('VIDA38_2P_REPTILE_ORBIT_')).toHaveLength(0);
    expect(find('VIDA38_2P_REPTILE_UPPER_LID_')).toHaveLength(0);
    expect(find('VIDA38_2P_REPTILE_LOWER_LID_')).toHaveLength(0);
    expect(find('VIDA38_2J_MOUTH_SEAM')).toHaveLength(0);
    const expectedHex = deriveVida38ReptileEyePlan38P(deriveVida38ReptileMorphology38J(specimen('rept:eye-visual-rollback'))).irisHex;
    for (const iris of find('VIDA38_2P_REPTILE_IRIS_')) {
      expect((iris.material as THREE.MeshPhysicalMaterial).color.getHexString()).toBe(expectedHex.slice(1));
    }
    for (const eye of find('VIDA38_2P_REPTILE_GLOBE_')) {
      expect(eye.geometry).toBeInstanceOf(THREE.SphereGeometry);
      expect((eye.material as THREE.MeshPhysicalMaterial).color.getHexString()).not.toBe('ffffff');
    }
    for (const obj of created) {
      if (!(obj instanceof THREE.Mesh)) continue;
      obj.geometry.dispose();
      if (Array.isArray(obj.material)) obj.material.forEach(mat => mat.dispose());
      else obj.material.dispose();
    }
  }, 15000);
});
