import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import {
  deriveVida38MicrobialMorphology38N, VIDA38_MICROBIAL_FORMS_38N,
  VIDA38_MICROBIAL_LABELS_38N,
} from './vida38-microbial-morphology-38-2n';
import { createVida38MicrobialPreview38N } from './vida38-microbial-preview-38-2n';
import { createVida38SpeciesPreviewModelV1 } from './vida38-species-visual-preview-scene';

function microbe(id: string, length = .000012): Vida38SpeciesVisualContract {
  return {
    revision: VIDA38_SPECIES_VISUAL_REVISION, speciesId: id, speciesName: id,
    variantSeedUint32: 382001, appearanceFingerprint: `microbe-spec:${id}`,
    provenance: { status: 'CONFIRMED_SYSTEM_CT0', representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',
      observedImageAvailable: false, bodyStorageKey: `V3:micro:${id}`, ecosystemDigest: 'digest:microbes' },
    morphology: { group: 'MICROORGANISMS', bodyPlan: 'FILAMENTOUS', covering: 'MEMBRANE', appendagePairs: 0 },
    ecology: { habitat: 'SURFACE_WET_MARGIN', nutrition: 'DECOMPOSER', niche: 'WET_MARGIN/DECOMPOSER' },
    locomotion: 'SESSILE', bodyLengthMeters: length,
    pigmentation: { primaryColorHex: '#789f91', secondaryColorHex: '#c4a8a2', pattern: 'MOTTLED', bioluminescent: false },
    adaptations: ['HUMIDITY_TOLERANCE'], intelligence: null,
  };
}
function samples(): Map<string, string> {
  const s = new Map<string,string>();
  for (let i = 0; i < 650 && s.size < VIDA38_MICROBIAL_FORMS_38N.length; i++) {
    const id = `microbe:${i}`;
    s.set(deriveVida38MicrobialMorphology38N(microbe(id)).form, id);
  }
  return s;
}
function snapshot(group: THREE.Group): number[] {
  const numbers: number[] = [];
  group.traverse(obj => {
    if (!(obj instanceof THREE.Mesh) || numbers.length > 230) return;
    const pos = obj.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < Math.min(12, pos.count); i++) numbers.push(pos.getX(i), pos.getY(i), pos.getZ(i));
  });
  return numbers;
}
function disposeGroup(group: THREE.Group): void {
  const seen = new Set<THREE.Material | THREE.BufferGeometry>();
  group.traverse(obj => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry && !seen.has(mesh.geometry)) { seen.add(mesh.geometry); mesh.geometry.dispose(); }
    if (mesh.material) {
      const materials: THREE.Material[] = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of materials) if (!seen.has(material)) { seen.add(material); material.dispose(); }
    }
  });
}

describe('38.2n — microorganismos orgánicos con diversidad morfológica', () => {
  it('reparte diez familias distinguibles y mantiene la anatomía independiente de los colores', () => {
    expect(VIDA38_MICROBIAL_FORMS_38N).toHaveLength(10);
    const found = samples();
    expect(found.size).toBe(10);
    for (const form of VIDA38_MICROBIAL_FORMS_38N) {
      const id = found.get(form)!;
      const c = microbe(id);
      const m = deriveVida38MicrobialMorphology38N(c);
      expect(m.form).toBe(form);
      expect(deriveVida38MicrobialMorphology38N(c)).toEqual(m);
      expect(VIDA38_MICROBIAL_LABELS_38N[form].length).toBeGreaterThan(15);
      const recolored = {...c, pigmentation: {...c.pigmentation, primaryColorHex: '#0d0308', secondaryColorHex: '#fefeff'}};
      expect(deriveVida38MicrobialMorphology38N(recolored)).toEqual(m);
      expect(m.provenance).toBe('ARTISTIC_HYPOTHESIS_NOT_OBSERVED');
    }
  });
  it('impide la contaminación de otros taxones y preserva talla científica VIDA', () => {
    const c = microbe('micro-source', .00000937);
    expect(deriveVida38MicrobialMorphology38N(c).sourceLengthMeters).toBe(.00000937);
    expect(() => deriveVida38MicrobialMorphology38N({...c, morphology: {...c.morphology, group: 'FUNGI'}})).toThrow();
  });
  it('construye mallas físicas válidas para los diez morfotipos sin la antigua burbuja global', () => {
    for (const [form, id] of samples()) {
      const g = new THREE.Group();
      const info = createVida38MicrobialPreview38N(g, microbe(id), 'LOW');
      expect(info.form).toBe(form);
      expect(info.cellBodies).toBeGreaterThan(0);
      expect(info.structuralMeshes).toBeGreaterThan(0);
      expect(info.structuralMeshes).toBeLessThan(75);
      expect(g.userData['microbialMorphotype38N']).toBe(form);
      expect(g.children.filter(o => o.name === 'VIDA38_2N_MICROBIAL_ARCHITECTURE')).toHaveLength(1);
      expect(g.userData['microbialScientificStatus38N']).toBe('ARTISTIC_HYPOTHESIS_NOT_OBSERVED');
      let meshCount = 0;
      g.traverse(obj => {
        if (!(obj instanceof THREE.Mesh)) return;
        meshCount++;
        expect(obj.name).not.toMatch(/CANOPY_DECORATIVE|ROCK_DECORATIVE|GLOBAL_MEMBRANE/);
        const pos = obj.geometry.getAttribute('position') as THREE.BufferAttribute;
        const color = obj.geometry.getAttribute('color') as THREE.BufferAttribute;
        expect(pos.count).toBeGreaterThan(8);
        expect(color.count).toBe(pos.count);
        expect(obj.geometry.index?.count).toBeGreaterThan(12);
        expect((obj.material as THREE.MeshPhysicalMaterial).vertexColors).toBe(true);
        for (let i = 0; i < pos.count; i++) {
          expect(Number.isFinite(pos.getX(i) + pos.getY(i) + pos.getZ(i))).toBe(true);
        }
      });
      expect(meshCount).toBe(info.structuralMeshes);
      disposeGroup(g);
    }
  }, 15000);
  it('expone estructuras anatómicas específicas que cambian la silueta, no solo la pigmentación', () => {
    const labels: Record<string,string> = {
      COCCOID_AGGREGATE: 'COCCOID_CELL', BACILLI: 'BACILLUS_SEGMENTED_WALL',
      SPIRILLA: 'HELICAL_CELL', VIBRIOS: 'VIBRIO_COMMA_BODY',
      BRANCHING_FILAMENTS: 'SEPTATE_BRANCH', BIOFILM: 'BIOFILM_MUCOSAL_ISLAND',
      CILIATED: 'CILIA_INSTANCED', AMOEBOID: 'PSEUDOPOD',
      DIATOM: 'FRUSTULE_TRANSVERSE_STRIA', RADIOLARIAN: 'RADIAL_SPICULES',
    };
    for (const [form, id] of samples()) {
      const g = new THREE.Group();
      createVida38MicrobialPreview38N(g, microbe(id), 'LOW');
      let anatomical = 0;
      g.traverse(o => { if (o.name.includes(labels[form]!)) anatomical++; });
      expect(anatomical, form).toBeGreaterThan(0);
      disposeGroup(g);
    }
  }, 15000);
  it('mantiene geometría determinista y conserva la integración, la altura y el encuadre del visor', () => {
    const id = samples().get('RADIOLARIAN')!;
    const a = createVida38SpeciesPreviewModelV1(microbe(id), { humanoidQuality: 'LOW' });
    const first = snapshot(a.subject);
    const restingHeight = a.subject.position.y;
    expect(a.descriptor.family).toBe('MICROBIAL_COLONY');
    expect(a.subject.userData['microbialSourceLengthMeters']).toBe(.000012);
    a.animation(0);
    expect(a.subject.position.y).toBeCloseTo(restingHeight, 6);
    expect(a.subject.position.y).toBeGreaterThan(-2);
    a.dispose();
    const b = createVida38SpeciesPreviewModelV1(microbe(id), { humanoidQuality: 'LOW' });
    expect(snapshot(b.subject)).toEqual(first);
    b.dispose();
  }, 15000);
});
