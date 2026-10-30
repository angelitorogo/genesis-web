import { describe, expect, it } from 'vitest';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { VIDA38_SPECIES_VISUAL_REVISION } from './vida38-species-visual-contract';
import {
  deriveVida38HumanoidMorphologyV1,
  VIDA38_HUMANOID_MORPHOLOGY_LIMITS,
  VIDA38_HUMANOID_MORPHOLOGY_REVISION,
} from './vida38-humanoid-morphology-38-2f';
import {
  auditVida38HumanoidRawMesh,
  buildVida38HumanoidRawMesh,
  deriveVida38HumanoidAnatomy,
  measureVida38HumanoidMeshV1,
} from './vida38-humanoid-organic-field-38-2e';

function contract(speciesId: string): Vida38SpeciesVisualContract {
  return {
    revision: VIDA38_SPECIES_VISUAL_REVISION,
    speciesId,
    speciesName: speciesId,
    variantSeedUint32: 0xacab1234,
    appearanceFingerprint: 'abcdef12',
    provenance: {
      status: 'CONFIRMED_SYSTEM_CT0',
      representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',
      observedImageAvailable: false,
      bodyStorageKey: 'v3:38-2f-specimen',
      ecosystemDigest: 'test',
    },
    morphology: { group: 'HUMANOIDS', bodyPlan: 'BIPED', covering: 'LEATHERY', appendagePairs: 2 },
    ecology: { habitat: 'SURFACE_SOIL', nutrition: 'OMNIVORE', niche: 'SURFACE_SOIL/OMNIVORE' },
    locomotion: 'WALKING',
    bodyLengthMeters: 1.6126,
    pigmentation: {
      primaryColorHex: '#927E9B', secondaryColorHex: '#D4A89A',
      pattern: 'MOTTLED', bioluminescent: false,
    },
    adaptations: ['SENSORY_ORIENTATION', 'THERMAL_BUFFERING'],
    intelligence: null,
  };
}

const names = ['Kamera ix1', 'Sania on1', 'Elvar um3', 'Lonia aj2', 'Ivar en8', 'Amier or5'] as const;

describe('GENESIS 38.2f — variación morfológica procedural determinista de humanoides', () => {
  it('versiona perfiles inmutables con límites anatómicos explícitos', () => {
    const profile = deriveVida38HumanoidMorphologyV1(contract('vida6:kamera'));
    expect(profile.revision).toBe(VIDA38_HUMANOID_MORPHOLOGY_REVISION);
    expect(Object.isFrozen(profile)).toBe(true);
    expect(profile.provenance).toBe('ARTISTIC_SCIENTIFIC_RECONSTRUCTION_NOT_OBSERVED');
    for (const [key, [min, max]] of Object.entries(VIDA38_HUMANOID_MORPHOLOGY_LIMITS)) {
      const value = profile[key as keyof typeof VIDA38_HUMANOID_MORPHOLOGY_LIMITS];
      expect(value).toBeGreaterThanOrEqual(min);
      expect(value).toBeLessThanOrEqual(max);
    }
  });

  it('la misma identidad reproduce exactamente el perfil, también tras consultar otras especies', () => {
    const a = deriveVida38HumanoidMorphologyV1(contract('vida6:kamera'));
    for (const id of names) deriveVida38HumanoidMorphologyV1(contract(`vida6:${id}`));
    const b = deriveVida38HumanoidMorphologyV1(contract('vida6:kamera'));
    expect(a).toEqual(b);
    expect(a.anatomyFingerprint).toBe(b.anatomyFingerprint);
  });

  it('el cambio de pigmentación y de huella visual NO modifica la morfología ni el SDF', () => {
    const a = contract('vida6:monochrome');
    const b: Vida38SpeciesVisualContract = {
      ...a,
      appearanceFingerprint: '88888888',
      pigmentation: { primaryColorHex: '#000000', secondaryColorHex: '#FFFFFF', pattern: 'BANDS', bioluminescent: true },
    };
    expect(deriveVida38HumanoidMorphologyV1(a)).toEqual(deriveVida38HumanoidMorphologyV1(b));
    const first = buildVida38HumanoidRawMesh(deriveVida38HumanoidAnatomy(a), 'LOW');
    const second = buildVida38HumanoidRawMesh(deriveVida38HumanoidAnatomy(b), 'LOW');
    expect(first.positions).toEqual(second.positions);
    expect(first.indices).toEqual(second.indices);
    expect(first.normals).toEqual(second.normals);
  });

  it('seis especies con pigmentación idéntica generan diferencias de proporción y silueta', () => {
    const ratios: number[] = [];
    const headRatios: number[] = [];
    const armRatios: number[] = [];
    const fingerprints = new Set<string>();
    for (const id of names) {
      const c = contract(`vida6:${id}`);
      const anatomy = deriveVida38HumanoidAnatomy(c);
      const raw = buildVida38HumanoidRawMesh(anatomy, 'LOW');
      const audit = auditVida38HumanoidRawMesh(raw);
      expect(audit.invalid).toBe(0);
      expect(audit.boundaryEdges).toBe(0);
      expect(audit.nonManifoldEdges).toBe(0);
      expect(audit.inconsistentEdges).toBe(0);
      expect(audit.components).toBe(1);
      const metrics = measureVida38HumanoidMeshV1(raw);
      ratios.push(metrics.widthToHeight);
      headRatios.push(metrics.headToBodyRatio);
      armRatios.push(metrics.armToBodyRatio);
      fingerprints.add(anatomy.morphology.anatomyFingerprint);
      expect(metrics.metersPerUnit * metrics.heightUnits).toBeCloseTo(c.bodyLengthMeters, 7);
    }
    expect(fingerprints.size).toBe(names.length);
    expect(Math.max(...ratios) - Math.min(...ratios)).toBeGreaterThan(0.015);
    expect(Math.max(...headRatios) - Math.min(...headRatios)).toBeGreaterThan(0.012);
    expect(Math.max(...armRatios) - Math.min(...armRatios)).toBeGreaterThan(0.012);
  });

  it('conserva medidas VIDA.T1 aun cambiando hábitat, locomoción y longitud corporal', () => {
    const original = contract('vida6:vida-t1');
    const altered: Vida38SpeciesVisualContract = {
      ...original,
      bodyLengthMeters: 2.718,
      ecology: { ...original.ecology, habitat: 'SURFACE_WET_MARGIN', niche: 'SURFACE_WET_MARGIN/OMNIVORE' },
      locomotion: 'CRAWLING',
      adaptations: ['SENSORY_ORIENTATION', 'EXTERNAL_ARMOR'],
    };
    const a = deriveVida38HumanoidMorphologyV1(original);
    const b = deriveVida38HumanoidMorphologyV1(altered);
    expect(b.anatomyFingerprint).not.toBe(a.anatomyFingerprint);
    expect(b.lengthMeters).toBe(2.718);
    expect(original.bodyLengthMeters).toBe(1.6126);
    const metrics = measureVida38HumanoidMeshV1(buildVida38HumanoidRawMesh(deriveVida38HumanoidAnatomy(altered), 'LOW'));
    expect(metrics.actualHeightMeters).toBe(2.718);
  });

  it('el generador no acepta perfiles humanoides para linajes de otra familia', () => {
    const invalid: Vida38SpeciesVisualContract = {
      ...contract('vida6:reptile'),
      morphology: { group: 'REPTILES', bodyPlan: 'TETRAPOD', covering: 'SCALES', appendagePairs: 2 },
    };
    expect(() => deriveVida38HumanoidMorphologyV1(invalid)).toThrow();
  });
});
