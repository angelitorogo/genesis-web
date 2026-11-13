import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import {
  auditVida38HumanoidRawMesh,
  buildVida38HumanoidRawMesh,
  deriveVida38HumanoidAnatomy,
  deriveVida38HumanoidFaceLandmarks38GC,
  evaluateVida38HumanoidField,
  measureVida38HumanoidMeshV1,
} from './vida38-humanoid-organic-field-38-2e';
import {
  buildVida38HumanoidPbrShader38G,
  createVida38HumanoidOcularDetailsV1,
  createVida38HumanoidSkinV1,
  VIDA38_HUMANOID_PBR_REVISION,
} from './vida38-humanoid-organic-material-38-2e';

function contract(id: string, covering: Vida38SpeciesVisualContract['morphology']['covering'] = 'LEATHERY'): Vida38SpeciesVisualContract {
  return {
    revision: VIDA38_SPECIES_VISUAL_REVISION,
    speciesId: `vida6:${id}`, speciesName: id,
    variantSeedUint32: 0xf003201a, appearanceFingerprint: '38gc-controlled-test',
    provenance: {
      status: 'CONFIRMED_SYSTEM_CT0', representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',
      observedImageAvailable: false, bodyStorageKey: 'v3:38gc-test', ecosystemDigest: '38gc-test',
    },
    morphology: { group: 'HUMANOIDS', bodyPlan: 'BIPED', covering, appendagePairs: 2 },
    ecology: { habitat: 'SURFACE_SOIL', nutrition: 'OMNIVORE', niche: 'SURFACE_SOIL/OMNIVORE' },
    locomotion: 'WALKING', bodyLengthMeters: 1.6126,
    pigmentation: { primaryColorHex: '#8f7776', secondaryColorHex: '#a9a081', pattern: 'MOTTLED', bioluminescent: false },
    adaptations: ['SENSORY_ORIENTATION', 'THERMAL_BUFFERING'], intelligence: null,
  };
}

describe('GENESIS 38.2g.c — craneofacial, manos/pies y materiales biológicos', () => {
  it('mantiene ojos hundidos detrás del borde orbital; el SDF y la esfera comparten coordenadas', () => {
    for (const id of ['Kamera ix1', 'Sania on1', 'Fasyl a3']) {
      const c = contract(id);
      const a = deriveVida38HumanoidAnatomy(c);
      const face = deriveVida38HumanoidFaceLandmarks38GC(a);
      const eyes = createVida38HumanoidOcularDetailsV1(a, c);
      expect(eyes).toHaveLength(2);
      expect(face.eyeCenterZ + face.globeRadius).toBeLessThan(face.socketZ + 0.006);
      expect(face.globeRadius).toBeLessThan(a.eyeRadius * 0.85);
      for (const object of eyes) {
        const eye = object as THREE.Mesh;
        expect(eye.position.y).toBeCloseTo(face.eyeY, 7);
        expect(eye.position.z).toBeCloseTo(face.eyeCenterZ + a.postureLean * (face.eyeY - a.legLength), 7);
        expect(eye.userData['orbitallyRecessed']).toBe(true);
        expect(eye.geometry.getAttribute('color')).toBeDefined();
        eye.geometry.dispose();
        (eye.material as THREE.Material).dispose();
      }
      const centerField = evaluateVida38HumanoidField(a, a.eyeSpacing, face.eyeY, face.eyeCenterZ);
      expect(Number.isFinite(centerField)).toBe(true);
      expect(centerField).toBeGreaterThan(-0.02);
    }
  });

  it('la malla principal sigue siendo una pieza cerrada, conexa y con escala VIDA exacta', () => {
    for (const id of ['Kamera ix1', 'Sania on1', 'Fasyl a3']) {
      const c = contract(id);
      const a = deriveVida38HumanoidAnatomy(c);
      const mesh = buildVida38HumanoidRawMesh(a, 'LOW');
      const audit = auditVida38HumanoidRawMesh(mesh);
      expect(audit.invalid).toBe(0);
      expect(audit.components).toBe(1);
      expect(audit.boundaryEdges).toBe(0);
      expect(audit.nonManifoldEdges).toBe(0);
      expect(audit.inconsistentEdges).toBe(0);
      expect(measureVida38HumanoidMeshV1(mesh).actualHeightMeters).toBe(c.bodyLengthMeters);
    }
  }, 60_000);

  it('diferencia perfiles faciales sin depender de pigmentos', () => {
    const a = deriveVida38HumanoidAnatomy(contract('Kamera ix1'));
    const b = deriveVida38HumanoidAnatomy(contract('Fasyl a3'));
    expect(a.morphology.anatomyFingerprint).not.toEqual(b.morphology.anatomyFingerprint);
    expect(a.headWidth).not.toBe(b.headWidth);
    const c = contract('Kamera ix1');
    const recolor: Vida38SpeciesVisualContract = {
      ...c,
      appearanceFingerprint: 'recolored-only',
      pigmentation: { ...c.pigmentation, primaryColorHex: '#ff0000', secondaryColorHex: '#00aaff' },
    };
    expect(deriveVida38HumanoidAnatomy(c)).toEqual(deriveVida38HumanoidAnatomy(recolor));
  });

  it('material filtrado y estable, con microdetalle que desaparece según escala proyectada', () => {
    const shader = buildVida38HumanoidPbrShader38G();
    expect(VIDA38_HUMANOID_PBR_REVISION).toContain('38.2g.c');
    expect(shader.fragmentCommon).toContain('vida38MicroscopicLod');
    expect(shader.fragmentCommon).toContain('vida38CutaneousMottle');
    expect(shader.fragmentCommon).toContain('fwidth');
    expect(shader.colorFragment).toContain('vida38Epidermal');
    expect(shader.normalFragment).toContain('vida38BiologicalRelief');
    expect(shader.fragmentCommon).not.toContain('gl_FragCoord');
    expect(shader.fragmentCommon).not.toContain('uTime');
    const c = contract('Sania on1', 'SCALES');
    const raw = buildVida38HumanoidRawMesh(deriveVida38HumanoidAnatomy(c), 'LOW');
    const skin = createVida38HumanoidSkinV1(raw, c);
    const material = skin.material as THREE.MeshPhysicalMaterial;
    expect(material.metalness).toBe(0);
    expect(material.specularIntensity).toBeLessThan(0.3);
    expect(skin.geometry.getAttribute('color')).toBeUndefined();
    expect(skin.userData['pbrRevision']).toBe(VIDA38_HUMANOID_PBR_REVISION);
    skin.geometry.dispose();
    material.dispose();
  }, 60_000);
});
