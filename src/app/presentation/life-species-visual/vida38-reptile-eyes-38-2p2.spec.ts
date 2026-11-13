import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { createVida38ReptilePreview38J } from './vida38-reptile-preview-38-2j';
import { VIDA38_REPTILE_EYE_REVISION_38P, deriveVida38ReptileEyePlan38P } from './vida38-reptile-eyes-38-2p';
import { deriveVida38ReptileMorphology38J } from './vida38-reptile-morphology-38-2j';

function specimen(id: string): Vida38SpeciesVisualContract {
  return {
    revision: VIDA38_SPECIES_VISUAL_REVISION,
    speciesId: id,
    speciesName: id,
    variantSeedUint32: 382022,
    appearanceFingerprint: `38-2p2:${id}`,
    provenance: { status: 'CONFIRMED_SYSTEM_CT0', representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION', observedImageAvailable: false, bodyStorageKey: 'V3:38.2p2', ecosystemDigest: '38.2p2' },
    morphology: { group: 'REPTILES', bodyPlan: 'TETRAPOD', covering: 'SCALES', appendagePairs: 2 },
    ecology: { habitat: 'SURFACE_OPEN_TERRAIN', nutrition: 'OMNIVORE', niche: 'SURFACE_OPEN_TERRAIN/OMNIVORE' },
    locomotion: 'WALKING', bodyLengthMeters: 1.9,
    pigmentation: { primaryColorHex: '#789487', secondaryColorHex: '#b5a87c', pattern: 'BANDS', bioluminescent: false },
    adaptations: ['RESOURCE_FORAGING'], intelligence: null,
  };
}

function disposeMeshes(objects: THREE.Object3D[]): void {
  for (const obj of objects) {
    if (!(obj instanceof THREE.Mesh)) continue;
    obj.geometry.dispose();
    if (Array.isArray(obj.material)) obj.material.forEach(mat => mat.dispose());
    else obj.material.dispose();
  }
}

describe('38.2p2 — globo ocular reptiliano integrado', () => {
  it('mantiene determinismo del plan ocular integrado', () => {
    const m = deriveVida38ReptileMorphology38J(specimen('rept:p2:a'));
    const a = deriveVida38ReptileEyePlan38P(m);
    const b = deriveVida38ReptileEyePlan38P(m);
    expect(a).toEqual(b);
    expect(a.globeInset).toBeGreaterThan(0.005);
    expect(typeof a.globeHex).toBe('string');
  });

  it('genera globo ocular, iris y pupila para ambos ojos', () => {
    const group = new THREE.Group();
    const created = createVida38ReptilePreview38J(group, specimen('rept:p2:visual'), 'LOW');
    expect(created.filter(o => o.name.startsWith('VIDA38_2P_REPTILE_GLOBE_'))).toHaveLength(2);
    expect(created.filter(o => o.name.startsWith('VIDA38_2P_REPTILE_IRIS_'))).toHaveLength(2);
    expect(created.filter(o => o.name.startsWith('VIDA38_2P_REPTILE_PUPIL_'))).toHaveLength(2);
    expect(created.filter(o => o.name.startsWith('VIDA38_2P_REPTILE_SOCKET_'))).toHaveLength(0);
    const globe = created.find(o => o.name.startsWith('VIDA38_2P_REPTILE_GLOBE_'))!;
    expect(globe.userData['reptileEyeRevision38P']).toBe(VIDA38_REPTILE_EYE_REVISION_38P);
    disposeMeshes(created);
  }, 15000);
});
