import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { buildVida38HumanoidRawMesh, deriveVida38HumanoidAnatomy } from './vida38-humanoid-organic-field-38-2e';
import {
  VIDA38_HUMANOID_PBR_REVISION,
  buildVida38HumanoidPbrShader38G,
  createVida38HumanoidSkinV1,
} from './vida38-humanoid-organic-material-38-2e';

function contract(speciesId: string): Vida38SpeciesVisualContract {
  return {
    revision: VIDA38_SPECIES_VISUAL_REVISION,
    speciesId,
    speciesName: speciesId,
    variantSeedUint32: 0x51a7b1e2,
    appearanceFingerprint: 'stable-material-preview',
    provenance: {
      status: 'CONFIRMED_SYSTEM_CT0',
      representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',
      observedImageAvailable: false,
      bodyStorageKey: 'v3:38-2ga-test',
      ecosystemDigest: 'test-material-stability',
    },
    morphology: { group: 'HUMANOIDS', bodyPlan: 'BIPED', covering: 'LEATHERY', appendagePairs: 2 },
    ecology: { habitat: 'SURFACE_SOIL', nutrition: 'OMNIVORE', niche: 'SURFACE_SOIL/OMNIVORE' },
    locomotion: 'WALKING',
    bodyLengthMeters: 1.6126,
    pigmentation: {
      primaryColorHex: '#9d846f',
      secondaryColorHex: '#657b86',
      pattern: 'MOTTLED',
      bioluminescent: false,
    },
    adaptations: ['SENSORY_ORIENTATION', 'THERMAL_BUFFERING'],
    intelligence: null,
  };
}

describe('GENESIS 38.2g.a — estabilización de materiales biológicos humanoides', () => {
  it('versiona el shader estable y usa coordenadas anatómicas en metros', () => {
    const shader = buildVida38HumanoidPbrShader38G();
    expect(VIDA38_HUMANOID_PBR_REVISION).toContain('38.2g.a');
    expect(shader.fragmentCommon).toContain('uVida38MetersPerUnit');
    expect(shader.fragmentCommon).toContain('uVida38BodyLengthMeters');
    expect(shader.fragmentCommon).toContain('vida38StableCoord');
    expect(shader.fragmentCommon).toContain('fwidth');
    expect(shader.fragmentCommon).toContain('vida38AA');
    expect(shader.fragmentCommon).not.toContain('gl_FragCoord');
  });

  it('sustituye el ruido de alta frecuencia por transiciones suaves y reduce brillo especular', () => {
    const shader = buildVida38HumanoidPbrShader38G();
    expect(shader.colorFragment).toContain('vida38StableCoord');
    expect(shader.roughnessFragment).toContain('roughnessFactor=clamp');
    expect(shader.roughnessFragment).toContain('* 0.08');
    expect(shader.normalFragment).toContain('uVida38SkinDetail');
    expect(shader.fragmentCommon).toContain('pattern = 0.04 + cloudMask * 0.46');
  });

  it('inyecta uniforms de estabilidad en onBeforeCompile y conserva el material no metálico', () => {
    const raw = buildVida38HumanoidRawMesh(deriveVida38HumanoidAnatomy(contract('vida6:material-stable')), 'LOW');
    const mesh = createVida38HumanoidSkinV1(raw, contract('vida6:material-stable'));
    const material = mesh.material as THREE.MeshPhysicalMaterial;
    expect(material.metalness).toBe(0);
    expect(material.clearcoat).toBeLessThan(0.02);
    expect(material.specularIntensity).toBeLessThan(0.4);

    const fake = {
      uniforms: {} as Record<string, unknown>,
      vertexShader: '#include <common>\n#include <begin_vertex>',
      fragmentShader: '#include <common>\n#include <color_fragment>\n#include <roughnessmap_fragment>\n#include <normal_fragment_maps>',
    };
    material.onBeforeCompile(fake as Parameters<typeof material.onBeforeCompile>[0], {} as Parameters<typeof material.onBeforeCompile>[1]);

    expect(fake.uniforms['uVida38MetersPerUnit']).toBeDefined();
    expect(fake.uniforms['uVida38BodyLengthMeters']).toBeDefined();
    expect(fake.uniforms['uVida38SkinDetail']).toBeDefined();
    expect(fake.fragmentShader).toContain('vida38StableCoord');
    expect(fake.fragmentShader).toContain('vida38AA');
    expect(fake.fragmentShader).not.toContain('gl_FragCoord');

    mesh.geometry.dispose();
    material.dispose();
  });
});
