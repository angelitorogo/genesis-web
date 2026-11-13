import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { buildVida38HumanoidRawMesh, deriveVida38HumanoidAnatomy } from './vida38-humanoid-organic-field-38-2e';
import {
  VIDA38_HUMANOID_PBR_REVISION,
  buildVida38HumanoidPbrShader38G,
  createVida38HumanoidSkinV1,
} from './vida38-humanoid-organic-material-38-2e';

function contract(speciesId: string, covering: Vida38SpeciesVisualContract['morphology']['covering'] = 'LEATHERY'): Vida38SpeciesVisualContract {
  return {
    revision: VIDA38_SPECIES_VISUAL_REVISION,
    speciesId,
    speciesName: speciesId,
    variantSeedUint32: 0x88127ea1,
    appearanceFingerprint: 'regional-skin-preview',
    provenance: {
      status: 'CONFIRMED_SYSTEM_CT0',
      representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',
      observedImageAvailable: false,
      bodyStorageKey: 'v3:38-2gb-test',
      ecosystemDigest: 'test-regional-material',
    },
    morphology: { group: 'HUMANOIDS', bodyPlan: 'BIPED', covering, appendagePairs: 2 },
    ecology: { habitat: 'SURFACE_ROCK_SHELTER', nutrition: 'OMNIVORE', niche: 'SURFACE_ROCK_SHELTER/OMNIVORE' },
    locomotion: 'WALKING',
    bodyLengthMeters: 1.74,
    pigmentation: {
      primaryColorHex: '#7e6e63',
      secondaryColorHex: '#9faea1',
      pattern: 'MOTTLED',
      bioluminescent: false,
    },
    adaptations: ['SENSORY_ORIENTATION', 'THERMAL_BUFFERING', 'RESOURCE_FORAGING'],
    intelligence: null,
  };
}

describe('GENESIS 38.2g.b — piel regional y materiales biológicos humanoides', () => {
  it('versiona el material regional e incorpora funciones de rostro, torso y extremidades', () => {
    const shader = buildVida38HumanoidPbrShader38G();
    expect(VIDA38_HUMANOID_PBR_REVISION).toMatch(/38\.2g\.(?:b|c)/);
    for (const token of [
      'uVida38HeadCenterY',
      'uVida38HeadRadius',
      'uVida38ShoulderWidth',
      'uVida38HipWidth',
      'vida38FaceRegion',
      'vida38TorsoRegion',
      'vida38LimbRegion',
      'vida38FacialPigmentContribution',
      'vida38RegionalChromaticVariation',
      'vida38RegionalRoughness',
    ]) {
      expect(shader.fragmentCommon).toContain(token);
    }
    expect(shader.fragmentCommon).not.toContain('gl_FragCoord');
  });

  it('modela relieve biológico según cobertura y mantiene antialias procedural', () => {
    const shader = buildVida38HumanoidPbrShader38G();
    expect(shader.fragmentCommon).toContain('poreMask');
    expect(shader.fragmentCommon).toContain('plateMask');
    expect(shader.fragmentCommon).toContain('fiberFlow');
    expect(shader.fragmentCommon).toContain('vida38AABand');
    expect(shader.roughnessFragment).toContain('vida38RegionalRough');
    expect(shader.colorFragment).toContain('vida38FacialPigment');
    expect(shader.colorFragment).toContain('vida38Subsurface');
  });

  it('inyecta uniforms anatómicos regionales y mantiene material orgánico estable', () => {
    const raw = buildVida38HumanoidRawMesh(deriveVida38HumanoidAnatomy(contract('vida6:regional-skin', 'SCALES')), 'LOW');
    const mesh = createVida38HumanoidSkinV1(raw, contract('vida6:regional-skin', 'SCALES'));
    const material = mesh.material as THREE.MeshPhysicalMaterial;
    expect(material.metalness).toBe(0);
    expect(material.specularIntensity).toBeLessThan(0.3);
    expect(material.clearcoat).toBeLessThan(0.01);

    const fake = {
      uniforms: {} as Record<string, unknown>,
      vertexShader: '#include <common>\n#include <begin_vertex>',
      fragmentShader: '#include <common>\n#include <color_fragment>\n#include <roughnessmap_fragment>\n#include <normal_fragment_maps>',
    };
    material.onBeforeCompile(fake as Parameters<typeof material.onBeforeCompile>[0], {} as Parameters<typeof material.onBeforeCompile>[1]);

    for (const uniformName of [
      'uVida38HeadCenterY', 'uVida38HeadRadius', 'uVida38ShoulderWidth', 'uVida38HipWidth',
      'uVida38TorsoLength', 'uVida38ArmReach', 'uVida38LegLength', 'uVida38JawWidth', 'uVida38FaceProjection',
    ]) {
      expect(fake.uniforms[uniformName]).toBeDefined();
    }
    expect(fake.fragmentShader).toContain('vida38FaceRegion');
    expect(fake.fragmentShader).toContain('vida38RegionalChromaticVariation');
    expect(fake.fragmentShader).toContain('vida38BiologicalRelief');
    expect(fake.fragmentShader).not.toContain('gl_FragCoord');

    mesh.geometry.dispose();
    material.dispose();
  });
});
