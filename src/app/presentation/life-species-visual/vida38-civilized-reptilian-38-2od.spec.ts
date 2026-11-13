import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { createVida38SpeciesPreviewModelV1, describeVida38SpeciesPreviewV1 } from './vida38-species-visual-preview-scene';

function reptilianCivilized(id: string, level: 'PRIMITIVE' | 'ADVANCED' | 'VERY_ADVANCED', pattern: Vida38SpeciesVisualContract['pigmentation']['pattern'] = 'BANDS'): Vida38SpeciesVisualContract {
  return {
    revision: VIDA38_SPECIES_VISUAL_REVISION,
    speciesId: id,
    speciesName: id,
    variantSeedUint32: 382000,
    appearanceFingerprint: `38-2od:${id}`,
    provenance: {
      status: 'CONFIRMED_SYSTEM_CT0',
      representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',
      observedImageAvailable: false,
      bodyStorageKey: 'V3:38.2od',
      ecosystemDigest: 'digest:38.2od',
    },
    morphology: { group: 'REPTILES', bodyPlan: 'BIPED', covering: 'SCALES', appendagePairs: 2 },
    ecology: { habitat: 'SURFACE_WET_MARGIN', nutrition: 'OMNIVORE', niche: 'SURFACE_WET_MARGIN/OMNIVORE' },
    locomotion: 'WALKING',
    bodyLengthMeters: 2.15,
    pigmentation: { primaryColorHex: '#6fa397', secondaryColorHex: '#c4a997', pattern, bioluminescent: false },
    adaptations: ['SENSORY_ORIENTATION'],
    intelligence: { lineage: 'REPTILIAN', civilizationLevel: level } as unknown as NonNullable<Vida38SpeciesVisualContract['intelligence']>,
  };
}

describe('38.2o.d — reptilianos civilizados SDF humanoide', () => {
  it('mantiene la ruta bípedo y resuelve el especialista reptiliano', () => {
    const descriptor = describeVida38SpeciesPreviewV1(reptilianCivilized('rep:route', 'ADVANCED'));
    expect(descriptor.family).toBe('BIPED_BODY');
    expect(descriptor.specialistIntelligenceDeferred).toBe(false);
  });

  it('reutiliza el cuerpo humanoide continuo y añade rasgos reptilianos visibles', () => {
    const model = createVida38SpeciesPreviewModelV1(reptilianCivilized('rep:sdf', 'VERY_ADVANCED'), { humanoidQuality: 'LOW' });
    const body = model.subject.getObjectByName('VIDA38_2OD_REPTILIAN_BODY') as THREE.Mesh | undefined;
    expect(model.subject.userData['vida38ReptilianSdfReuse38OD']).toBe(true);
    expect(body).toBeTruthy();
    const bodyGeometry = body!.geometry as THREE.BufferGeometry;
    expect(bodyGeometry.attributes['position']!.count).toBeGreaterThan(900);
    let garments = 0, eyes = 0, claws = 0;
    model.subject.traverse((obj: THREE.Object3D) => {
      if (obj.name === 'VIDA38_2OD_REPTILIAN_GARMENT') garments++;
      if (obj.name.startsWith('VIDA38_2OE4_REPTILIAN_')) eyes++;
      if (obj.name === 'VIDA38_2OD_REPTILIAN_CLAW') claws++;
    });
    expect(garments).toBeGreaterThan(0);
    expect(eyes).toBeGreaterThanOrEqual(4);
    expect(claws).toBeGreaterThanOrEqual(2);
    expect(model.subject.getObjectByName('VIDA38_2OD_REPTILIAN_TAIL')).toBeTruthy();
    const bounds = new THREE.Box3().setFromObject(model.subject);
    const size = bounds.getSize(new THREE.Vector3());
    expect(size.y).toBeGreaterThan(size.x * 1.25);
    model.dispose();
  });

  it('produce variedad real de perfiles y niveles civilizados', () => {
    const profiles = new Set<string>();
    const levels = new Set<string>();
    for (let i = 0; i < 12; i++) {
      const level = i % 3 === 0 ? 'PRIMITIVE' : i % 3 === 1 ? 'ADVANCED' : 'VERY_ADVANCED';
      const model = createVida38SpeciesPreviewModelV1(reptilianCivilized(`rep:${i}`, level, i % 2 === 0 ? 'BANDS' : 'MOTTLED'), { humanoidQuality: 'LOW' });
      profiles.add(String(model.subject.userData['vida38ReptilianProfile38OD']));
      levels.add(String(model.subject.userData['vida38ReptilianLevel38OD']));
      model.dispose();
    }
    expect(profiles.size).toBeGreaterThanOrEqual(3);
    expect(levels.size).toBe(3);
  });
});
