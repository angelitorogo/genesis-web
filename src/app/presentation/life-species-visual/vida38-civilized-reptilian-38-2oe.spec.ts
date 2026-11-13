import { deriveVida38WardrobeCoherencePlan38OE8B } from './vida38-reptilian-wardrobe-coherence-38-2oe8b';
import { describe, expect, it } from 'vitest';
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { createVida38SpeciesPreviewModelV1 } from './vida38-species-visual-preview-scene';
import { selectVida38ReptilianVariation38OE1, hasReptilianOrnaments38OE1 } from './vida38-civilized-reptilian-variation-38-2oe1';

function specimen(id: string, level: 'VERY_ADVANCED' | 'ADVANCED' | 'PRIMITIVE' = 'VERY_ADVANCED'): Vida38SpeciesVisualContract {
  return {
    revision: VIDA38_SPECIES_VISUAL_REVISION,
    speciesId: id,
    speciesName: id,
    variantSeedUint32: 382006,
    appearanceFingerprint: `38-2oe:${id}`,
    provenance: { status: 'CONFIRMED_SYSTEM_CT0', representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION', observedImageAvailable: false, bodyStorageKey: 'V3:38.2oe', ecosystemDigest: 'digest:38.2oe' },
    morphology: { group: 'REPTILES', bodyPlan: 'TETRAPOD', covering: 'SCALES', appendagePairs: 2 },
    ecology: { habitat: 'SURFACE_WET_MARGIN', nutrition: 'OMNIVORE', niche: 'SURFACE_WET_MARGIN/OMNIVORE' },
    locomotion: 'WALKING', bodyLengthMeters: 2.25,
    pigmentation: { primaryColorHex: '#6b8f97', secondaryColorHex: '#8da7b2', pattern: 'BANDS', bioluminescent: false },
    adaptations: ['SENSORY_ORIENTATION'],
    intelligence: { lineage: 'REPTILIAN', civilizationLevel: level } as unknown as NonNullable<Vida38SpeciesVisualContract['intelligence']>,
  };
}

describe('38.2o.e — diversificación amplia de reptilianos civilizados', () => {
  it('es determinista para una especie fija', () => {
    const a = createVida38SpeciesPreviewModelV1(specimen('rept:deterministic'), { humanoidQuality: 'LOW' });
    const b = createVida38SpeciesPreviewModelV1(specimen('rept:deterministic'), { humanoidQuality: 'LOW' });
    expect(a.subject.userData['vida38ReptilianProfile38OD']).toBe(b.subject.userData['vida38ReptilianProfile38OD']);
    expect(a.subject.userData['vida38ReptilianGarmentLine38OE']).toBe(b.subject.userData['vida38ReptilianGarmentLine38OE']);
    expect(a.subject.userData['vida38ReptilianCulture38OE']).toBe(b.subject.userData['vida38ReptilianCulture38OE']);
    a.dispose(); b.dispose();
  });

  it('distribuye múltiples familias anatómicas, líneas de indumentaria y culturas', () => {
    // La distribución se audita antes de mallar: construir 48 SDF cuesta demasiado
    // y confunde el test estadístico con el rendimiento del renderer.
    const profiles = new Set<string>();
    const lines = new Set<string>();
    const cultures = new Set<string>();
    for (let i = 0; i < 48; i++) {
      const identity = `rept:${i}`;
      const variant = selectVida38ReptilianVariation38OE1(identity, `38-2oe:${identity}`);
      profiles.add(variant.profile);
      lines.add(variant.garmentLine);
      cultures.add(variant.culture);
    }
    expect(profiles.size).toBeGreaterThanOrEqual(8);
    expect(lines.size).toBe(6);
    expect(cultures.size).toBeGreaterThanOrEqual(5);
  });

  it('las especies muy avanzadas mantienen traje 360 y paleta no payasesca', () => {
    let contract = specimen('rept:advanced-suit', 'VERY_ADVANCED');
    for (let i = 0; i < 360 && deriveVida38WardrobeCoherencePlan38OE8B(contract).family !== 'TECH_SUIT'; i++) {
      contract = specimen(`rept:advanced-suit:${i}`, 'VERY_ADVANCED');
    }
    expect(deriveVida38WardrobeCoherencePlan38OE8B(contract).family).toBe('TECH_SUIT');
    const model = createVida38SpeciesPreviewModelV1(contract, { humanoidQuality: 'LOW' });
    const suit = model.subject.getObjectByName('VIDA38_2OD_REPTILIAN_GARMENT');
    expect(suit?.userData['garmentCoverage38OD5']).toBe('FULL_360');
    expect(suit?.userData['colorPalette38OD5']).toBe('BLACK_BLUE_GREEN_NEON');
    expect(model.subject.userData['vida38ReptilianGarmentLine38OE']).toBeTruthy();
    expect(model.subject.userData['vida38ReptilianCulture38OE']).toBeTruthy();
    model.dispose();
  });

  it('las familias ornamentadas realmente crean cuernos, placas o barbillas', () => {
    const ids = Array.from({ length: 24 }, (_, i) => `rept:orn:${i}`);
    const ornamentedIds = ids.filter(id =>
      hasReptilianOrnaments38OE1(selectVida38ReptilianVariation38OE1(id, `38-2oe:${id}`).profile),
    );
    expect(ornamentedIds.length).toBeGreaterThan(8);
    // Una prueba de integración pequeña comprueba los objetos THREE reales.
    // Se buscan perfiles con la geometría que originalmente fallaba al anclar.
    const requested = ['HORNED_WARLORD', 'PLATED_TITAN', 'MARSH_ORACLE', 'CREST_SCHOLAR'] as const;
    const sampleIds: string[] = [];
    for (const profile of requested) {
      const id = Array.from({ length: 120 }, (_, i) => `rept:orn-real:${i}`)
        .find(candidate => selectVida38ReptilianVariation38OE1(candidate, `38-2oe:${candidate}`).profile === profile);
      expect(id).toBeDefined();
      if (id) sampleIds.push(id);
    }
    for (const id of sampleIds) {
      const model = createVida38SpeciesPreviewModelV1(specimen(id), { humanoidQuality: 'LOW' });
      let found = false;
      model.subject.traverse(obj => {
        if (obj.name === 'VIDA38_2OE_REPTILIAN_HORN' || obj.name === 'VIDA38_2OE_REPTILIAN_PLATE' || obj.name === 'VIDA38_2OE_REPTILIAN_BARBEL' || obj.name === 'VIDA38_2OD_REPTILIAN_CREST') found = true;
      });
      expect(found).toBe(true);
      model.dispose();
    }
  }, 60_000);
});
