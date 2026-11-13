import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { createVida38SpeciesPreviewModelV1 } from './vida38-species-visual-preview-scene';
import { deriveVida38HumanoidAnatomy } from './vida38-humanoid-organic-field-38-2e';
import { deriveVida38CivilReptilianOrbitalFrame38OE4, createVida38CivilReptilianEyeMeshes38OE4, type Vida38CivilReptilianOrbitalFrame38OE4 } from './vida38-civilized-reptilian-ocular-38-2oe4';

function specimen(id: string, level: 'VERY_ADVANCED' | 'ADVANCED' = 'VERY_ADVANCED'): Vida38SpeciesVisualContract {
  return {
    revision: VIDA38_SPECIES_VISUAL_REVISION,
    speciesId: id, speciesName: id, variantSeedUint32: 382004,
    appearanceFingerprint: `38-2oe4:${id}`,
    provenance: { status: 'CONFIRMED_SYSTEM_CT0', representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION', observedImageAvailable: false, bodyStorageKey: 'V3:38.2oe4', ecosystemDigest: 'digest:38.2oe4' },
    morphology: { group: 'REPTILES', bodyPlan: 'TETRAPOD', covering: 'SCALES', appendagePairs: 2 },
    ecology: { habitat: 'SURFACE_WET_MARGIN', nutrition: 'OMNIVORE', niche: 'SURFACE_WET_MARGIN/OMNIVORE' },
    locomotion: 'WALKING', bodyLengthMeters: 2.25,
    pigmentation: { primaryColorHex: '#6b8f97', secondaryColorHex: '#8da7b2', pattern: 'BANDS', bioluminescent: false },
    adaptations: ['SENSORY_ORIENTATION'],
    intelligence: { lineage: 'REPTILIAN', civilizationLevel: level } as unknown as NonNullable<Vida38SpeciesVisualContract['intelligence']>,
  };
}

describe('38.2o.e4 — globos oculares integrados en reptilianos civilizados', () => {
  it('dos globos, dos iris curvados y dos pupilas verticales; sin placas planas', () => {
    const model = createVida38SpeciesPreviewModelV1(specimen('reptilian:eye-volume'), { humanoidQuality: 'LOW' });
    const globes: THREE.Mesh[] = [], irises: THREE.Mesh[] = [], pupils: THREE.Mesh[] = [];
    model.subject.traverse(obj => {
      if (obj.name.startsWith('VIDA38_2OE4_REPTILIAN_GLOBE_')) globes.push(obj as THREE.Mesh);
      if (obj.name.startsWith('VIDA38_2OE4_REPTILIAN_IRIS_')) irises.push(obj as THREE.Mesh);
      if (obj.name.startsWith('VIDA38_2OE4_REPTILIAN_PUPIL_')) pupils.push(obj as THREE.Mesh);
    });
    expect(globes).toHaveLength(2);
    expect(irises).toHaveLength(2);
    expect(pupils).toHaveLength(2);
    expect(globes.every(g => g.geometry instanceof THREE.SphereGeometry)).toBe(true);
    expect(irises.every(g => !(g.geometry instanceof THREE.CircleGeometry))).toBe(true);
    expect(pupils.every(g => !(g.geometry instanceof THREE.PlaneGeometry))).toBe(true);
    expect(model.subject.userData['vida38ReptilianOrbitalGlobe38OE4']).toBe(true);
    model.dispose();
  }, 60_000);

  it('el globo sobresale menos de 2 cm respecto al punto de anclaje facial', () => {
    const model = createVida38SpeciesPreviewModelV1(specimen('reptilian:eye-inset'), { humanoidQuality: 'LOW' });
    const body = model.subject.getObjectByName('VIDA38_2OD_REPTILIAN_BODY') as THREE.Mesh;
    const base = specimen('reptilian:eye-inset');
    const a = deriveVida38HumanoidAnatomy({ ...base, morphology: { ...base.morphology, group: 'HUMANOIDS', bodyPlan: 'BIPED' } });
    for (const side of [-1, 1] as const) {
      const frame = deriveVida38CivilReptilianOrbitalFrame38OE4(body, a, { eyeSizeScale: 1, eyeSpacingScale: 1, eyeHueHex: '#79dbd1' }, side);
      expect(frame).not.toBeNull();
      if (!frame) continue;
      const front = frame.center.clone().addScaledVector(frame.gaze, frame.radiusZ);
      const proud = front.clone().sub(frame.skinPoint).dot(frame.gaze);
      expect(proud).toBeGreaterThan(0.002);
      expect(proud).toBeLessThan(0.020);
    }
    model.dispose();
  }, 60_000);

  it('mantiene el mismo anclaje local después del centrado y escala del visor', () => {
    const model = createVida38SpeciesPreviewModelV1(specimen('reptilian:normalized-frame'), { humanoidQuality: 'LOW' });
    const body = model.subject.getObjectByName('VIDA38_2OD_REPTILIAN_BODY') as THREE.Mesh;
    const base = specimen('reptilian:normalized-frame');
    const anatomy = deriveVida38HumanoidAnatomy({ ...base, morphology: { ...base.morphology, group: 'HUMANOIDS', bodyPlan: 'BIPED' } });
    const traits = { eyeSizeScale: 1, eyeSpacingScale: 1, eyeHueHex: '#79dbd1' };
    const clone = body.clone();
    for (const side of [-1, 1] as const) {
      const normalized = deriveVida38CivilReptilianOrbitalFrame38OE4(body, anatomy, traits, side);
      const untransformed = deriveVida38CivilReptilianOrbitalFrame38OE4(clone, anatomy, traits, side);
      expect(normalized).not.toBeNull();
      expect(untransformed).not.toBeNull();
      if (normalized && untransformed) {
        expect(normalized.skinPoint.distanceTo(untransformed.skinPoint)).toBeLessThan(0.001);
        expect(normalized.center.distanceTo(untransformed.center)).toBeLessThan(0.001);
      }
    }
    model.dispose();
  }, 60_000);

  it('iris y pupila siguen la curvatura: no quedan detrás del globo', () => {
    const frame: Vida38CivilReptilianOrbitalFrame38OE4 = {
      side: 1,
      center: new THREE.Vector3(0.1, 2.0, 0.3), gaze: new THREE.Vector3(0, 0, 1),
      radiusX: 0.040, radiusY: 0.032, radiusZ: 0.035, skinPoint: new THREE.Vector3(0.1, 2.0, 0.329),
    };
    const [globe, iris, pupil] = createVida38CivilReptilianEyeMeshes38OE4(frame, '#72d6ef');
    expect(globe).toBeTruthy();
    for (const patch of [iris!, pupil!]) {
      const positions = (patch.geometry as THREE.BufferGeometry).getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
        const sphereZ = frame.radiusZ * Math.sqrt(Math.max(0, 1 - (x / frame.radiusX) ** 2 - (y / frame.radiusY) ** 2));
        expect(z).toBeGreaterThan(sphereZ + 0.0005);
      }
    }
    for (const mesh of [globe!, iris!, pupil!]) {
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose());
      else mesh.material.dispose();
    }
  });

  it('las gafas VERY_ADVANCED usan monturas abiertas, no cajas opacas', () => {
    const model = createVida38SpeciesPreviewModelV1(specimen('reptilian:open-visor'), { humanoidQuality: 'LOW' });
    const optics: THREE.Mesh[] = [];
    model.subject.traverse(obj => {
      if (obj.name === 'VIDA38_2OE3_REPTILIAN_ACCESSORY_EYEWEAR') optics.push(obj as THREE.Mesh);
    });
    expect(optics.length).toBeGreaterThan(0);
    expect(optics.every(mesh => mesh.userData['openOptics38OE4'] === true)).toBe(true);
    expect(optics.some(mesh => mesh.geometry instanceof THREE.TorusGeometry)).toBe(true);
    expect(optics.some(mesh => mesh.geometry instanceof THREE.BoxGeometry)).toBe(false);
    model.dispose();
  }, 60_000);

  it('la anatomía y la identidad visual permanecen deterministas', () => {
    const a = createVida38SpeciesPreviewModelV1(specimen('reptilian:stable'), { humanoidQuality: 'LOW' });
    const b = createVida38SpeciesPreviewModelV1(specimen('reptilian:stable'), { humanoidQuality: 'LOW' });
    expect(a.subject.userData['vida38ReptilianProfile38OD']).toBe(b.subject.userData['vida38ReptilianProfile38OD']);
    expect(a.subject.userData['vida38ReptilianVisualSignature38OE2']).toBe(b.subject.userData['vida38ReptilianVisualSignature38OE2']);
    const ga = a.subject.getObjectByName('VIDA38_2OE4_REPTILIAN_GLOBE_1')!;
    const gb = b.subject.getObjectByName('VIDA38_2OE4_REPTILIAN_GLOBE_1')!;
    expect(ga.position.toArray()).toEqual(gb.position.toArray());
    a.dispose(); b.dispose();
  }, 60_000);
});
