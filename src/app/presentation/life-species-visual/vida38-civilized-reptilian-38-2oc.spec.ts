import { describe, expect, it } from 'vitest';
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { createVida38SpeciesPreviewModelV1 } from './vida38-species-visual-preview-scene';

// La antigua prueba de maniquí se migra al contrato SDF; no se conserva
// una expectativa de múltiples cuerpos separados solo para pasar la regresión.
function reptilian(id: string): Vida38SpeciesVisualContract {
  return {
    revision: VIDA38_SPECIES_VISUAL_REVISION,
    speciesId: id, speciesName: id, variantSeedUint32: 996633,
    appearanceFingerprint: `sdf:${id}`,
    provenance: { status: 'CONFIRMED_SYSTEM_CT0', representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION', observedImageAvailable: false, bodyStorageKey: 'V3:rep', ecosystemDigest: 'digest:rep' },
    morphology: { group: 'REPTILES', bodyPlan: 'TETRAPOD', covering: 'SCALES', appendagePairs: 2 },
    ecology: { habitat: 'SURFACE_WET_MARGIN', nutrition: 'OMNIVORE', niche: 'WET/OMNIVORE' },
    locomotion: 'WALKING', bodyLengthMeters: 2.2,
    pigmentation: { primaryColorHex: '#6b8f96', secondaryColorHex: '#c5ab9e', pattern: 'BANDS', bioluminescent: false },
    adaptations: ['SENSORY_ORIENTATION'],
    intelligence: { lineage: 'REPTILIAN', civilizationLevel: 'ADVANCED' } as unknown as NonNullable<Vida38SpeciesVisualContract['intelligence']>,
  };
}

describe('38-2oc — compatibilidad migrada a la arquitectura orgánica SDF', () => {
  it('dispone de un cuerpo continuo, vestido y erguido, con perfil procedural', () => {
    const model = createVida38SpeciesPreviewModelV1(reptilian('rep:migrated:38-2oc'), { humanoidQuality: 'LOW' });
    expect(model.subject.getObjectByName('VIDA38_2OD_REPTILIAN_BODY')).toBeTruthy();
    expect(model.subject.getObjectByName('VIDA38_2OD_REPTILIAN_GARMENT')).toBeTruthy();
    expect(model.subject.userData['uprightPosture38O']).toBe(true);
    expect(model.subject.userData['vida38ReptilianProfile38OD']).toBeTruthy();
    model.dispose();
  }, 15000);
});
