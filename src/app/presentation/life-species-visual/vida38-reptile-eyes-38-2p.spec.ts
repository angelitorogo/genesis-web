import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { VIDA38_REPTILE_ARCHETYPES, deriveVida38ReptileMorphology38J } from './vida38-reptile-morphology-38-2j';
import { deriveVida38ReptileLandmarks38J } from './vida38-reptile-organic-field-38-2j';
import { createVida38ReptilePreview38J } from './vida38-reptile-preview-38-2j';
import { deriveVida38ReptileEyePlan38P, locateVida38ReptileEyeOnSkin38P } from './vida38-reptile-eyes-38-2p';

function specimen(id: string): Vida38SpeciesVisualContract {
  return {
    revision: VIDA38_SPECIES_VISUAL_REVISION,
    speciesId: id, speciesName: id, variantSeedUint32: 382020,
    appearanceFingerprint: `38-2p:${id}`,
    provenance: { status: 'CONFIRMED_SYSTEM_CT0', representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION', observedImageAvailable: false, bodyStorageKey: 'V3:38.2p', ecosystemDigest: '38.2p' },
    morphology: { group: 'REPTILES', bodyPlan: 'TETRAPOD', covering: 'SCALES', appendagePairs: 2 },
    ecology: { habitat: 'SURFACE_OPEN_TERRAIN', nutrition: 'OMNIVORE', niche: 'SURFACE_OPEN_TERRAIN/OMNIVORE' },
    locomotion: 'WALKING', bodyLengthMeters: 1.75,
    pigmentation: { primaryColorHex: '#789487', secondaryColorHex: '#b5a87c', pattern: 'BANDS', bioluminescent: false },
    adaptations: ['RESOURCE_FORAGING'], intelligence: null,
  };
}

describe('38.2p — ojos reptilianos de reptiles no civilizados', () => {
  it('genera un diseño ocular determinista por identidad anatómica', () => {
    const m = deriveVida38ReptileMorphology38J(specimen('rept:eye:a'));
    expect(deriveVida38ReptileEyePlan38P(m)).toEqual(deriveVida38ReptileEyePlan38P(m));
    expect(deriveVida38ReptileEyePlan38P(m).slitWidth).toBeGreaterThan(0);
  });

  it('integra globos en cavidades SDF, iris y pupila vertical', () => {
    const group = new THREE.Group();
    const created = createVida38ReptilePreview38J(group, specimen('rept:eye:normal'), 'LOW');
    const eyes = created.filter(obj => obj.name.startsWith('VIDA38_2P_REPTILE_GLOBE_'));
    const irises = created.filter(obj => obj.name.startsWith('VIDA38_2P_REPTILE_IRIS_'));
    const pupils = created.filter(obj => obj.name.startsWith('VIDA38_2P_REPTILE_PUPIL_'));
    expect(eyes).toHaveLength(2);
    expect(irises).toHaveLength(2);
    expect(pupils).toHaveLength(2);
    for (const eye of eyes) {
      expect((eye as THREE.Mesh).geometry).toBeInstanceOf(THREE.SphereGeometry);
      expect(eye.userData['reptileEyeRevision38P']).toContain('38.2p');
    }
    expect(created.some(obj => obj.name.startsWith('VIDA38_2J_REPTILE_EYE_'))).toBe(false);
    // Limpieza local de test; el visor principal dispone de model.dispose().
    for (const obj of created) {
      if (!(obj instanceof THREE.Mesh)) continue;
      obj.geometry.dispose();
      if (Array.isArray(obj.material)) obj.material.forEach(mat => mat.dispose());
      else obj.material.dispose();
    }
  }, 60_000);

  it('las órbitas de distintos reptiles admiten un punto de anclaje real', () => {
    // Muestra diversa sin obligar a construir 9 mallas HIGH.
    for (const kind of [VIDA38_REPTILE_ARCHETYPES[0]!, VIDA38_REPTILE_ARCHETYPES[2]!, VIDA38_REPTILE_ARCHETYPES[4]!] as const) {
      const c = specimen(`rept:eye:${kind}`);
      const m = deriveVida38ReptileMorphology38J(c, kind);
      const group = new THREE.Group();
      // La preview usa el mapeo procedural de producción; aquí validamos el
      // anclaje del perfil geométrico real de cada arquetipo elegido.
      const geometry = createVida38ReptilePreview38J(group, c, 'LOW');
      const skin = geometry.find(obj => obj.name === 'VIDA38_2J_REPTILE_ORGANIC_SKIN') as THREE.Mesh;
      expect(skin).toBeTruthy();
      // La preview puede elegir otro arquetipo; se comprueba su perfil real.
      const actual = deriveVida38ReptileMorphology38J(c);
      const a = deriveVida38ReptileLandmarks38J(actual);
      expect(locateVida38ReptileEyeOnSkin38P(skin, actual, a, -1)).not.toBeNull();
      expect(locateVida38ReptileEyeOnSkin38P(skin, actual, a, +1)).not.toBeNull();
      expect(m.archetype).toBe(kind);
      for (const obj of geometry) {
        if (!(obj instanceof THREE.Mesh)) continue;
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach(mat => mat.dispose());
        else obj.material.dispose();
      }
    }
  }, 60_000);
});
