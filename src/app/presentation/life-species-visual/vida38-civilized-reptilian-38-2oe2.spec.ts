import { deriveVida38WardrobeCoherencePlan38OE8B } from './vida38-reptilian-wardrobe-coherence-38-2oe8b';
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { createVida38SpeciesPreviewModelV1 } from './vida38-species-visual-preview-scene';
import {
  auditVida38ReptilianIdentity38OE2,
  auditVida38ReptilianPreparedPlans38OE2,
  deriveVida38ReptilianVisualPlan38OE2,
  distanceVida38ReptilianVisualPlans38OE2,
  type Vida38ReptilianIdentityInput38OE2,
} from './vida38-civilized-reptilian-identity-38-2oe2';

function input(i: number): Vida38ReptilianIdentityInput38OE2 {
  return {
    speciesId: `V3/reptilian/civilized/${i}`,
    appearanceFingerprint: `CT0:appearance:${i}`,
    primaryColorHex: '#719d91', secondaryColorHex: '#9aafb0',
    bodyLengthMeters: 2.2,
  };
}
function specimen(id: string): Vida38SpeciesVisualContract {
  const v = input(Number(id.slice(-1)) || 0);
  return {
    revision: VIDA38_SPECIES_VISUAL_REVISION,
    speciesId: id, speciesName: id, variantSeedUint32: 382007, appearanceFingerprint: v.appearanceFingerprint,
    provenance: { status: 'CONFIRMED_SYSTEM_CT0', representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION', observedImageAvailable: false, bodyStorageKey: 'V3:38.2oe2', ecosystemDigest: 'digest:38.2oe2' },
    morphology: { group: 'REPTILES', bodyPlan: 'TETRAPOD', covering: 'SCALES', appendagePairs: 2 },
    ecology: { habitat: 'SURFACE_WET_MARGIN', nutrition: 'OMNIVORE', niche: 'SURFACE_WET_MARGIN/OMNIVORE' },
    locomotion: 'WALKING', bodyLengthMeters: 2.2,
    pigmentation: { primaryColorHex: '#719d91', secondaryColorHex: '#9aafb0', pattern: 'BANDS', bioluminescent: false },
    adaptations: ['SENSORY_ORIENTATION'],
    intelligence: { lineage: 'REPTILIAN', civilizationLevel: 'VERY_ADVANCED' } as unknown as NonNullable<Vida38SpeciesVisualContract['intelligence']>,
  };
}

function techSuitContract38S8C(prefix:string):Vida38SpeciesVisualContract {
  for(let i=0;i<360;i++){
    const item=specimen(`${prefix}:${i}`);
    if(deriveVida38WardrobeCoherencePlan38OE8B(item).family==='TECH_SUIT')return item;
  }
  throw new Error('38.2s8c: no TECH_SUIT disponible para el test del shader de identidad');
}
describe('38.2o.e2 — identidad visual y diversidad inter-especie', () => {
  it('repite exactamente los mismos genes con igual identidad CT-0', () => {
    const a = deriveVida38ReptilianVisualPlan38OE2(input(7));
    const b = deriveVida38ReptilianVisualPlan38OE2(input(7));
    expect(a).toEqual(b);
    expect(distanceVida38ReptilianVisualPlans38OE2(a, b)).toBe(0);
  });

  it('detecta duplicados de identidad fuente en lugar de silenciarlos', () => {
    const a = input(13);
    const report = auditVida38ReptilianIdentity38OE2([a, a]);
    expect(report.exactAuditPassed).toBe(false);
    expect(report.uniqueSourceIds).toBe(1);
  });

  it('informa una colisión visual forzada entre dos identidades distintas', () => {
    const plan = deriveVida38ReptilianVisualPlan38OE2(input(8));
    const report = auditVida38ReptilianPreparedPlans38OE2([
      {input:input(8),plan},
      {input:input(9),plan},
    ]);
    expect(report.exactAuditPassed).toBe(false);
    expect(report.exactDuplicatePairs).toBe(1);
    expect(report.samplePairs[0]?.exact).toBe(true);
  });

  it('sin colisiones paramétricas exactas en una muestra grande de igual pigmentación y talla', () => {
    const population = Array.from({ length: 10000 }, (_, i) => input(i));
    const report = auditVida38ReptilianIdentity38OE2(population);
    expect(report.population).toBe(10000);
    expect(report.exactAuditPassed).toBe(true);
    expect(report.exactDuplicatePairs).toBe(0);
    expect(report.distinctVisualPlans).toBe(10000);
    expect(report.distribution.profiles).toBe(10);
    expect(report.distribution.garmentLines).toBe(6);
    expect(report.distribution.cultures).toBe(6);
    expect(report.method).toBe('PARAMETRIC_VISUAL_PLAN_NOT_RENDERED_PIXELS');
  }, 60_000);

  it('integra el marcador en el traje SDF, sin alterar cola ni cobertura 360 grados', () => {
    const contract = techSuitContract38S8C('rept:visual:1');
    const model = createVida38SpeciesPreviewModelV1(contract, { humanoidQuality: 'LOW' });
    const skin = model.subject.getObjectByName('VIDA38_2OD_REPTILIAN_BODY') as THREE.Mesh;
    const suit = model.subject.getObjectByName('VIDA38_2OD_REPTILIAN_GARMENT') as THREE.Mesh;
    expect(skin).toBeInstanceOf(THREE.Mesh);
    expect(suit).toBeInstanceOf(THREE.Mesh);
    expect(suit.userData['garmentCoverage38OD5']).toBe('FULL_360');
    expect(suit.userData['colorPalette38OD5']).toBe('BLACK_BLUE_GREEN_NEON');
    expect(suit.userData['identityMark38OE2']).toBeTruthy();
    expect(model.subject.userData['vida38IntegratedSdfTail38OD5']).toBe(true);
    const actualPlan = deriveVida38ReptilianVisualPlan38OE2({
      speciesId: contract.speciesId, appearanceFingerprint: contract.appearanceFingerprint,
      primaryColorHex: contract.pigmentation.primaryColorHex,
      secondaryColorHex: contract.pigmentation.secondaryColorHex,
      bodyLengthMeters: contract.bodyLengthMeters,
    });
    expect(model.subject.userData['vida38ReptilianVisualSignature38OE2']).toBe(actualPlan.exactVisualSignature);
    expect(suit.userData['identityMark38OE2']['bars']).toBe(actualPlan.barCount);
    const suitMaterial = suit.material as THREE.MeshPhysicalMaterial;
    const shader = {
      vertexShader: '#include <common>\n#include <begin_vertex>',
      fragmentShader: '#include <common>\n#include <color_fragment>\n#include <emissivemap_fragment>',
      uniforms: {} as Record<string, {value:unknown}>,
    };
    // Simulación del enganche de Three.js: comprueba que el patrón entra en
    // uniformes de GPU y no se limita a una etiqueta en userData.
    suitMaterial.onBeforeCompile(shader as unknown as Parameters<typeof suitMaterial.onBeforeCompile>[0], {} as never);
    expect(shader.fragmentShader).toContain('vida38MarkA');
    expect(shader.fragmentShader).toContain('personalTrace');
    expect(shader.uniforms['vida38MarkA']).toBeDefined();
    expect(shader.uniforms['vida38SuitNeonB']).toBeDefined();
    const firstMark = (shader.uniforms['vida38MarkA']!.value as THREE.Vector4).clone();
    const firstKey = suitMaterial.customProgramCacheKey();
    model.dispose();

    const different = createVida38SpeciesPreviewModelV1(techSuitContract38S8C('rept:visual:2'), {humanoidQuality:'LOW'});
    const differentSuit = different.subject.getObjectByName('VIDA38_2OD_REPTILIAN_GARMENT') as THREE.Mesh;
    const differentMaterial = differentSuit.material as THREE.MeshPhysicalMaterial;
    const secondShader = {vertexShader:'#include <common>\n#include <begin_vertex>',fragmentShader:'#include <common>\n#include <color_fragment>\n#include <emissivemap_fragment>',uniforms:{} as Record<string,{value:unknown}>};
    differentMaterial.onBeforeCompile(secondShader as unknown as Parameters<typeof differentMaterial.onBeforeCompile>[0], {} as never);
    const secondMark=(secondShader.uniforms['vida38MarkA']!.value as THREE.Vector4).clone();
    expect(secondMark.equals(firstMark)).toBe(false);
    expect(differentMaterial.customProgramCacheKey()).toBe(firstKey);
    different.dispose();
  }, 60_000);
});
