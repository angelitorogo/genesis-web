import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { VIDA38_REPTILE_ARCHETYPES, deriveVida38ReptileMorphology38J } from './vida38-reptile-morphology-38-2j';
import { deriveVida38ReptileLandmarks38J } from './vida38-reptile-organic-field-38-2j';
import { createVida38ReptilePreview38J } from './vida38-reptile-preview-38-2j';
import { deriveVida38ReptileEyePlan38P, deriveVida38ReptileOrbitalFrame38P2A, measureVida38ReptileEyeExposure38P2A } from './vida38-reptile-eyes-38-2p';

function specimen(id: string): Vida38SpeciesVisualContract {
  return {
    revision: VIDA38_SPECIES_VISUAL_REVISION,
    speciesId: id, speciesName: id, variantSeedUint32: 382022,
    appearanceFingerprint: `38-2p2a:${id}`,
    provenance: { status: 'CONFIRMED_SYSTEM_CT0', representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION', observedImageAvailable: false, bodyStorageKey: 'V3:38.2p2a', ecosystemDigest: '38.2p2a' },
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

describe('38.2p2a — visibilidad ocular frontal y perfil', () => {
  it('mantiene la misma forma ocular al regenerar la misma especie', () => {
    const m = deriveVida38ReptileMorphology38J(specimen('rept:repeat'));
    const a = deriveVida38ReptileLandmarks38J(m);
    expect(deriveVida38ReptileEyePlan38P(m)).toEqual(deriveVida38ReptileEyePlan38P(m));
    const p = deriveVida38ReptileOrbitalFrame38P2A(m, a, -1);
    const q = deriveVida38ReptileOrbitalFrame38P2A(m, a, -1);
    expect(p.center.toArray()).toEqual(q.center.toArray());
    expect(p.gaze.toArray()).toEqual(q.gaze.toArray());
  });

  it('los nueve arquetipos admiten exposición geométrica frontal y lateral de ambas cavidades', () => {
    for (const kind of VIDA38_REPTILE_ARCHETYPES) {
      const m = deriveVida38ReptileMorphology38J(specimen(`rept:${kind}`), kind);
      const landmarks = deriveVida38ReptileLandmarks38J(m);
      for (const side of [-1, 1] as const) {
        const exposure = measureVida38ReptileEyeExposure38P2A(m, landmarks, side);
        expect(exposure.cavityClear, `${kind}/${side} cavidad`).toBe(true);
        expect(exposure.frontClear, `${kind}/${side} frente`).toBe(true);
        expect(exposure.sideClear, `${kind}/${side} lateral`).toBe(true);
      }
    }
  }, 15000);

  it('iris y pupila tienen superficie curvada delante del globo; sin discos blancos ni colmillos flotantes', () => {
    const group = new THREE.Group();
    const created = createVida38ReptilePreview38J(group, specimen('rept:integrated'), 'LOW');
    const meshes = (prefix: string) => created.filter(o => o.name.startsWith(prefix)) as THREE.Mesh[];
    expect(meshes('VIDA38_2P_REPTILE_GLOBE_')).toHaveLength(2);
    expect(meshes('VIDA38_2P_REPTILE_IRIS_')).toHaveLength(2);
    expect(meshes('VIDA38_2P_REPTILE_PUPIL_')).toHaveLength(2);
    expect(meshes('VIDA38_2P_REPTILE_SOCKET_')).toHaveLength(0);
    expect(meshes('VIDA38_2J_TOOTH_')).toHaveLength(0);
    const iris = meshes('VIDA38_2P_REPTILE_IRIS_')[0]!;
    const pupil = meshes('VIDA38_2P_REPTILE_PUPIL_')[0]!;
    const eye = meshes('VIDA38_2P_REPTILE_GLOBE_')[0]!;
    const vertex = (mesh: THREE.Mesh) => mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    expect(vertex(iris).count).toBeGreaterThan(100);
    expect(vertex(pupil).count).toBeGreaterThan(100);
    expect(vertex(iris).getZ(0)).toBeGreaterThan(0);
    expect(vertex(pupil).getZ(0)).toBeGreaterThan(vertex(iris).getZ(0));
    expect(eye.geometry).toBeInstanceOf(THREE.SphereGeometry);
    disposeMeshes(created);
  }, 15000);
});
