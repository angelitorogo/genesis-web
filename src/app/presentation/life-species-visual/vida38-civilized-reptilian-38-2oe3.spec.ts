import { describe, expect, it } from 'vitest';
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { createVida38SpeciesPreviewModelV1 } from './vida38-species-visual-preview-scene';
import { deriveVida38ReptilianAccessoryPlan38OE3 } from './vida38-civilized-reptilian-accessories-38-2oe3';
import { selectVida38ReptilianVariation38OE1 } from './vida38-civilized-reptilian-variation-38-2oe1';

function specimen(id: string, level: 'VERY_ADVANCED' | 'ADVANCED' | 'PRIMITIVE' = 'VERY_ADVANCED'): Vida38SpeciesVisualContract {
  return {
    revision: VIDA38_SPECIES_VISUAL_REVISION,
    speciesId: id,
    speciesName: id,
    variantSeedUint32: 382007,
    appearanceFingerprint: `38-2oe3:${id}`,
    provenance: { status: 'CONFIRMED_SYSTEM_CT0', representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION', observedImageAvailable: false, bodyStorageKey: 'V3:38.2oe3', ecosystemDigest: 'digest:38.2oe3' },
    morphology: { group: 'REPTILES', bodyPlan: 'TETRAPOD', covering: 'SCALES', appendagePairs: 2 },
    ecology: { habitat: 'SURFACE_WET_MARGIN', nutrition: 'OMNIVORE', niche: 'SURFACE_WET_MARGIN/OMNIVORE' },
    locomotion: 'WALKING', bodyLengthMeters: 2.25,
    pigmentation: { primaryColorHex: '#6b8f97', secondaryColorHex: '#8da7b2', pattern: 'BANDS', bioluminescent: false },
    adaptations: ['SENSORY_ORIENTATION'],
    intelligence: { lineage: 'REPTILIAN', civilizationLevel: level } as unknown as NonNullable<Vida38SpeciesVisualContract['intelligence']>,
  };
}

describe('38.2o.e3 — accesorios deterministas y procedurales', () => {
  it('el plan de accesorios es determinista', () => {
    const a = deriveVida38ReptilianAccessoryPlan38OE3({ speciesId: 'rep:acc', appearanceFingerprint: 'fp:acc', profile: 'HORNED_WARLORD', garmentLine: 'TECHNO_PRIEST', culture: 'BASILICA_TECHNOCRACY' });
    const b = deriveVida38ReptilianAccessoryPlan38OE3({ speciesId: 'rep:acc', appearanceFingerprint: 'fp:acc', profile: 'HORNED_WARLORD', garmentLine: 'TECHNO_PRIEST', culture: 'BASILICA_TECHNOCRACY' });
    expect(a).toEqual(b);
  });

  it('las especies muy avanzadas registran un plan de accesorios y crean geometría accesoria', () => {
    const model = createVida38SpeciesPreviewModelV1(specimen('rep:visual'), { humanoidQuality: 'LOW' });
    const plan = model.subject.userData['vida38ReptilianAccessoryPlan38OE3'] as Record<string, unknown>;
    expect(plan).toBeTruthy();
    expect(typeof model.subject.userData['vida38ReptilianAccessorySignature38OE3']).toBe('string');
    let accessoryCount = 0;
    model.subject.traverse(obj => {
      if (String(obj.name).startsWith('VIDA38_2OE3_REPTILIAN_ACCESSORY')) accessoryCount++;
    });
    expect(accessoryCount).toBeGreaterThan(2);
    model.dispose();
  });

  it('muestra variedad de accesorios entre especies muy avanzadas', () => {
    // Separar estadística procedural (rápida) del test de integración 3D.
    // No construir 24 SDF de alta complejidad para comprobar un selector puro.
    const signatures = new Set<string>();
    const handheldKinds = new Set<string>();
    const eyewearKinds = new Set<string>();
    for (let i = 0; i < 48; i++) {
      const c = specimen(`rep:acc:${i}`);
      const variation = selectVida38ReptilianVariation38OE1(c.speciesId, c.appearanceFingerprint);
      const plan = deriveVida38ReptilianAccessoryPlan38OE3({
        speciesId: c.speciesId,
        appearanceFingerprint: c.appearanceFingerprint,
        profile: variation.profile,
        garmentLine: variation.garmentLine,
        culture: variation.culture,
      });
      signatures.add(plan.exactAccessorySignature);
      eyewearKinds.add(plan.eyewear);
      handheldKinds.add(plan.handheld);
    }
    expect(signatures.size).toBeGreaterThanOrEqual(10);
    expect(eyewearKinds.size).toBeGreaterThanOrEqual(2);
    expect(handheldKinds.size).toBeGreaterThanOrEqual(3);
  });

  it('no añade accesorios a reptilianos no muy avanzados', () => {
    const model = createVida38SpeciesPreviewModelV1(specimen('rep:adv', 'ADVANCED'), { humanoidQuality: 'LOW' });
    let accessoryCount = 0;
    model.subject.traverse(obj => { if (String(obj.name).startsWith('VIDA38_2OE3_REPTILIAN_ACCESSORY')) accessoryCount++; });
    expect(accessoryCount).toBe(0);
    model.dispose();
  });
});
