import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  VIDA38_SPECIES_VISUAL_REVISION,
  type Vida38SpeciesVisualContract,
} from './vida38-species-visual-contract';
import { createVida38SpeciesPreviewModelV1 } from './vida38-species-visual-preview-scene';

// Una prueba 38.2m.b independiente del test 38.2m.a del palo:
// usar únicamente enumeraciones VIDA.6 ya aceptadas por Angular.
function rockHabitatContract(
  id: string,
  group: Vida38SpeciesVisualContract['morphology']['group'],
  bodyPlan: Vida38SpeciesVisualContract['morphology']['bodyPlan'],
): Vida38SpeciesVisualContract {
  return {
    revision: VIDA38_SPECIES_VISUAL_REVISION,
    speciesId: id,
    speciesName: id,
    variantSeedUint32: 424242,
    appearanceFingerprint: `fp:rock:${id}`,
    provenance: {
      status: 'CONFIRMED_SYSTEM_CT0',
      representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',
      observedImageAvailable: false,
      bodyStorageKey: `V3:${id}`,
      ecosystemDigest: 'digest:38-2mb',
    },
    morphology: {
      group,
      bodyPlan,
      covering: group === 'INSECTS' ? 'CHITINOUS'
        : group === 'BIRDS' ? 'FEATHERS'
        : group === 'PLANTS_TREES' ? 'FIBROUS' : 'LEATHERY',
      appendagePairs: group === 'INSECTS' ? 3 : group === 'PLANTS_TREES' ? 0 : 2,
    },
    ecology: {
      habitat: 'SURFACE_ROCK_SHELTER',
      nutrition: group === 'PLANTS_TREES' ? 'PHOTOSYNTHETIC' : 'OMNIVORE',
      niche: 'SURFACE_ROCK_SHELTER/TEST',
    },
    locomotion: group === 'PLANTS_TREES' || group === 'FUNGI' || group === 'MICROORGANISMS'
      ? 'SESSILE' : 'WALKING',
    bodyLengthMeters: group === 'PLANTS_TREES' ? 2.4 : 1.1,
    pigmentation: {
      primaryColorHex: '#6d8b75',
      secondaryColorHex: '#c9b49b',
      pattern: 'MOTTLED',
      bioluminescent: false,
    },
    adaptations: ['SENSORY_ORIENTATION'],
    intelligence: null,
  };
}

describe('38.2m.b — ninguna piedra decorativa en el visor 38.2', () => {
  it('mantiene solamente la plataforma del estudio, sin rocas, en todos los grupos', () => {
    const cases: ReadonlyArray<readonly [string, Vida38SpeciesVisualContract]> = [
      ['fungi', rockHabitatContract('rock-fungi', 'FUNGI', 'FILAMENTOUS')],
      ['plant', rockHabitatContract('rock-plant', 'PLANTS_TREES', 'STEMMED')],
      ['insect', rockHabitatContract('rock-insect', 'INSECTS', 'ARTHROPOD')],
      ['bird', rockHabitatContract('rock-bird', 'BIRDS', 'WINGED')],
      ['mammal', rockHabitatContract('rock-mammal', 'MAMMALS', 'TETRAPOD')],
      ['reptile', rockHabitatContract('rock-reptile', 'REPTILES', 'TETRAPOD')],
      ['humanoid', rockHabitatContract('rock-humanoid', 'HUMANOIDS', 'BIPED')],
      ['microbe', rockHabitatContract('rock-microbe', 'MICROORGANISMS', 'FILAMENTOUS')],
    ];
    for (const [label, contract] of cases) {
      const model = createVida38SpeciesPreviewModelV1(contract, { humanoidQuality: 'LOW' });
      try {
        expect(model.descriptor.habitatCue, label).toBe('ROCK');
        const environment = model.root.children.find(child => child !== model.subject);
        expect(environment, label).toBeDefined();
        expect(environment!.children, label).toHaveLength(1);
        const onlyBackdrop = environment!.children[0] as THREE.Mesh;
        expect(onlyBackdrop.geometry, label).toBeInstanceOf(THREE.CylinderGeometry);
        let stones = 0;
        environment!.traverse(node => {
          const geometry = (node as THREE.Mesh).geometry;
          if (geometry instanceof THREE.DodecahedronGeometry) stones++;
        });
        expect(stones, label).toBe(0);
      } finally {
        model.dispose();
      }
    }
  }, 60_000);
});
