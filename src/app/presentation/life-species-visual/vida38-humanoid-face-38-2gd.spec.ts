import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import {
  deriveVida38HumanoidFace38GD, deriveVida38HumanoidHairColor38GD,
} from './vida38-humanoid-face-38-2gd';
import {
  buildVida38HumanoidRawMesh, deriveVida38HumanoidAnatomy,
  auditVida38HumanoidRawMesh, measureVida38HumanoidMeshV1,
} from './vida38-humanoid-organic-field-38-2e';
import { createVida38HumanoidHairV1, createVida38HumanoidTeethV1 } from './vida38-humanoid-hair-dentition-38-2gd';
import { createVida38SpeciesPreviewModelV1 } from './vida38-species-visual-preview-scene';

const nutrition = ['PREDATOR', 'OMNIVORE', 'HERBIVORE', 'PHOTOSYNTHETIC'] as const;
function contract(id: string, food: Vida38SpeciesVisualContract['ecology']['nutrition'] = 'OMNIVORE',
  covering: Vida38SpeciesVisualContract['morphology']['covering'] = 'LEATHERY'): Vida38SpeciesVisualContract {
  return {
    revision: VIDA38_SPECIES_VISUAL_REVISION,
    speciesId: `vida6:${id}`, speciesName: id,
    variantSeedUint32: 0x12efab84,
    appearanceFingerprint: `test-face-${id}`,
    provenance: {
      status: 'CONFIRMED_SYSTEM_CT0', representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',
      observedImageAvailable: false, bodyStorageKey: 'V3:face-test', ecosystemDigest: 'test',
    },
    morphology: { group: 'HUMANOIDS', bodyPlan: 'BIPED', covering, appendagePairs: 2 },
    ecology: { habitat: 'SURFACE_SOIL', nutrition: food, niche: `SURFACE_SOIL/${food}` },
    locomotion: 'WALKING', bodyLengthMeters: 1.75,
    pigmentation: { primaryColorHex: '#b89a80', secondaryColorHex: '#697f80', pattern: 'MOTTLED', bioluminescent: false },
    adaptations: ['SENSORY_ORIENTATION'], intelligence: null,
  };
}

function disposeObjects(objects: readonly THREE.Object3D[]): void {
  for (const o of objects) o.traverse(child => {
    const mesh = child as THREE.Mesh;
    mesh.geometry?.dispose();
    if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose());
    else mesh.material?.dispose();
  });
}

describe('VIDA 38.2g.d — identidad craneofacial y reconstrucción humanoide', () => {
  it('es determinista, independiente del color/patrón y estable ante el orden de adaptaciones', () => {
    const a = contract('Kamera ix1');
    const recolor = { ...a, appearanceFingerprint: 'otro', pigmentation: {
      ...a.pigmentation, primaryColorHex: '#ff0000', secondaryColorHex: '#0019ff', pattern: 'BANDS' as const,
    }, adaptations: [...a.adaptations].reverse() };
    expect(deriveVida38HumanoidFace38GD(a)).toEqual(deriveVida38HumanoidFace38GD(recolor));
    expect(deriveVida38HumanoidAnatomy(a)).toEqual(deriveVida38HumanoidAnatomy(recolor));
    expect(deriveVida38HumanoidHairColor38GD(a)).not.toEqual(deriveVida38HumanoidHairColor38GD(recolor));
  });

  it('genera variedad REAL en pelo, arcos, expresión, rasgos y dentición', () => {
    const profiles = Array.from({length: 85}, (_, i) => deriveVida38HumanoidFace38GD(contract(`test-38gd-${i}`)));
    expect(new Set(profiles.map(x => x.fingerprint)).size).toBe(profiles.length);
    expect(new Set(profiles.map(x => x.hairStyle)).size).toBeGreaterThanOrEqual(5);
    expect(profiles.some(x => x.hairStyle === 'BALD')).toBe(true);
    expect(profiles.some(x => x.hairStyle === 'DENSE')).toBe(true);
    expect(profiles.some(x => x.browRidge === 0)).toBe(true);
    expect(profiles.some(x => x.browRidge > 1.2)).toBe(true);
    expect(new Set(profiles.map(x => x.restingExpression)).size).toBeGreaterThanOrEqual(4);
    expect(profiles.some(x => x.teethVisible)).toBe(true);
    expect(profiles.some(x => !x.teethVisible)).toBe(true);
    expect(new Set(profiles.map(x => x.facialWidth)).size).toBeGreaterThan(60);
  });

  it('respeta ecología: depredación, omnivoría y herbivoría tienen denticiones diferentes', () => {
    const profiles = nutrition.map(food => deriveVida38HumanoidFace38GD(contract('diet-38gd', food)));
    expect(profiles.map(p => p.dentition)).toEqual(['CANINES', 'MIXED', 'FLAT', 'REDUCED']);
    expect(profiles[0]!.toothScale).toBeGreaterThan(profiles[2]!.toothScale);
    expect(profiles[2]!.toothScale).toBeGreaterThan(profiles[3]!.toothScale);
    expect(profiles.every(x => x.mouthCurve >= -0.028 && x.mouthCurve <= 0.028)).toBe(true);
  });

  it('mantiene malla SDF cerrada, conectada, sin errores numéricos y sin cambiar longitud VIDA', () => {
    for (const id of ['Kamera ix1', 'Sania on1', 'Fasyl a3']) {
      const c = contract(id);
      const a = deriveVida38HumanoidAnatomy(c);
      const raw = buildVida38HumanoidRawMesh(a, 'LOW');
      const audit = auditVida38HumanoidRawMesh(raw);
      expect(audit.invalid).toBe(0);
      expect(audit.components).toBe(1);
      expect(audit.boundaryEdges).toBe(0);
      expect(audit.nonManifoldEdges).toBe(0);
      expect(audit.inconsistentEdges).toBe(0);
      expect(measureVida38HumanoidMeshV1(raw).actualHeightMeters).toBe(c.bodyLengthMeters);
    }
  }, 25000);

  it('el pelo se ancla a SDF y se agrupa en una sola malla; no aparece en perfiles calvos', () => {
    const hairy = Array.from({length: 80},(_,i) => contract(`hairy-${i}`))
      .find(c => deriveVida38HumanoidFace38GD(c).hairStyle === 'DENSE');
    expect(hairy).toBeDefined();
    const a = deriveVida38HumanoidAnatomy(hairy!);
    const objects = createVida38HumanoidHairV1(a, hairy!, 'LOW');
    expect(objects).toHaveLength(1);
    const hair = objects[0] as THREE.Mesh;
    expect(hair.geometry.getAttribute('position').count).toBeGreaterThan(30);
    expect(hair.geometry.getAttribute('color')).toBeDefined();
    expect((hair.material as THREE.MeshPhysicalMaterial).transparent).toBe(false);
    expect((hair.material as THREE.MeshPhysicalMaterial).metalness).toBe(0);
    disposeObjects(objects);
    const bald = Array.from({length: 80},(_,i) => contract(`bald-${i}`, 'OMNIVORE', 'SCALES'))
      .find(c => deriveVida38HumanoidFace38GD(c).hairStyle === 'BALD' && deriveVida38HumanoidFace38GD(c).eyebrowHair === 0);
    expect(bald).toBeDefined();
    expect(createVida38HumanoidHairV1(deriveVida38HumanoidAnatomy(bald!), bald!, 'LOW')).toHaveLength(0);
  }, 25000);

  it('la dentición visible es moderada, interna y usa instancing sin geometría flotante por diente', () => {
    const c = Array.from({length: 100},(_,i) => contract(`canines-${i}`, 'PREDATOR'))
      .find(c => deriveVida38HumanoidFace38GD(c).teethVisible);
    expect(c).toBeDefined();
    const objects = createVida38HumanoidTeethV1(deriveVida38HumanoidAnatomy(c!), c!);
    expect(objects).toHaveLength(1);
    const teeth = objects[0] as THREE.InstancedMesh;
    expect(teeth.isInstancedMesh).toBe(true);
    expect(teeth.count).toBeLessThanOrEqual(8);
    expect(teeth.userData['dentition']).toBe('CANINES');
    disposeObjects(objects);
  });

  it('la escena real incluye metadatos visuales 38.2g.d y conserva el estado no observado', () => {
    const model = createVida38SpeciesPreviewModelV1(contract('Kamera ix1'), {humanoidQuality:'LOW'});
    expect(model.subject.userData['vida38ReconstructionRevision']).toBe('38.2g.e');
    expect(model.subject.userData['vida38TorsoFingerprint']).toBeDefined();
    expect(model.subject.userData['vida38FacialFingerprint']).toBeDefined();
    expect(model.subject.userData['vida38ScientificObservedImage']).toBe(false);
    model.dispose();
  }, 25000);
});
