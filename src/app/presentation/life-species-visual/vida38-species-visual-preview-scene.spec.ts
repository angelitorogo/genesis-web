import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { VIDA9_REVISION } from '../../domain/life/vida9-biology-exploration';
import { VIDA6_REVISION, type Vida6Species } from '../../domain/life/vida6-ecosystems-species';
import { VIDA7_REVISION, type Vida7Civilization, type Vida7IntelligentSpecies } from '../../domain/life/vida7-intelligence-civilizations';
import type { Vida38ConfirmedBiologySource } from './vida38-species-visual-contract';
import { vida38SpeciesVisualContractFromConfirmedV1 } from './vida38-species-visual-contract';
import { createVida38SpeciesPreviewModelV1, describeVida38SpeciesPreviewV1 } from './vida38-species-visual-preview-scene';
import { buildVida38HumanoidRawMesh, auditVida38HumanoidRawMesh, deriveVida38HumanoidAnatomy } from './vida38-humanoid-organic-field-38-2e';

function species(partial: Partial<Vida6Species> & { id: string; proceduralName: string; group: Vida6Species['group'] }): Vida6Species {
  return Object.freeze({
    habitat: 'SURFACE_SOIL',
    nutrition: 'OMNIVORE',
    niche: 'SURFACE_SOIL/OMNIVORE',
    adaptations: Object.freeze(['THERMAL_BUFFERING', 'SENSORY_ORIENTATION']),
    phenotype: Object.freeze({
      bodyPlan: 'TETRAPOD',
      covering: 'SCALES',
      locomotion: 'WALKING',
      bodyLengthMeters: 0.44822,
      primaryColorHex: '#88AA77',
      secondaryColorHex: '#CBAE98',
      pattern: 'MOTTLED',
      appendagePairs: 2,
      bioluminescent: false,
    }),
    ...partial,
  } as Vida6Species);
}

function confirmedRecord(speciesList: readonly Vida6Species[]): Vida38ConfirmedBiologySource {
  return Object.freeze({
    revision: VIDA9_REVISION,
    epoch: 'CT-0',
    bodyStorageKey: 'V3:test-body',
    ecosystem: Object.freeze({
      revision: VIDA6_REVISION,
      bodyStorageKey: 'V3:test-body',
      digest: 'digest:test-body',
      species: speciesList,
    }),
    intelligence: Object.freeze({
      revision: VIDA7_REVISION,
      ecosystemDigest: 'digest:test-body',
      intelligentSpecies: null,
      civilization: null,
    }),
  });
}

function contractOf(sample: Vida6Species) {
  return vida38SpeciesVisualContractFromConfirmedV1(confirmedRecord([sample]), sample.id)!;
}

function meshSummary(root: THREE.Object3D): string[] {
  const summary: string[] = [];
  root.traverse(object => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry && mesh.material) {
      const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      const color = material instanceof THREE.Material && 'color' in material ? (material as unknown as { color?: THREE.Color }).color?.getHexString() ?? 'none' : 'none';
      summary.push([mesh.geometry.type, color, mesh.position.toArray().map(v => v.toFixed(3)).join(',')].join('|'));
    }
  });
  return summary.sort();
}

describe('Fase 38.2 — representación 3D procedural de especies', () => {
  it('clasifica familias de render realistas según grupo y plan corporal', () => {
    const cases: Array<[Vida6Species, string]> = [
      [species({ id: 'vida6:micro', proceduralName: 'Micro', group: 'MICROORGANISMS', habitat: 'SURFACE_ROCK_SHELTER', nutrition: 'PHOTOSYNTHETIC', phenotype: { bodyPlan: 'CELL_COLONY', covering: 'MEMBRANE', locomotion: 'SESSILE', bodyLengthMeters: 0.0000082, primaryColorHex: '#C7B690', secondaryColorHex: '#91AA88', pattern: 'BANDS', appendagePairs: 0, bioluminescent: false } }), 'MICROBIAL_COLONY'],
      [species({ id: 'vida6:fungi', proceduralName: 'Fungi', group: 'FUNGI', nutrition: 'DECOMPOSER', phenotype: { bodyPlan: 'FILAMENTOUS', covering: 'FIBROUS', locomotion: 'SESSILE', bodyLengthMeters: 0.118, primaryColorHex: '#C0B18C', secondaryColorHex: '#8AA081', pattern: 'BANDS', appendagePairs: 0, bioluminescent: false } }), 'FUNGAL_CLUSTER'],
      [species({ id: 'vida6:plant', proceduralName: 'Plant', group: 'PLANTS_TREES', habitat: 'SURFACE_WET_MARGIN', nutrition: 'PHOTOSYNTHETIC', phenotype: { bodyPlan: 'STEMMED', covering: 'FIBROUS', locomotion: 'SESSILE', bodyLengthMeters: 3.2142, primaryColorHex: '#8DA68D', secondaryColorHex: '#CAB7B7', pattern: 'MOTTLED', appendagePairs: 0, bioluminescent: false } }), 'PLANT_FORM'],
      [species({ id: 'vida6:insect', proceduralName: 'Insect', group: 'INSECTS', phenotype: { bodyPlan: 'ARTHROPOD', covering: 'CHITINOUS', locomotion: 'FLYING', bodyLengthMeters: 0.035307, primaryColorHex: '#7AAEAA', secondaryColorHex: '#78AAA3', pattern: 'BANDS', appendagePairs: 3, bioluminescent: false } }), 'INSECT_BODY'],
      [species({ id: 'vida6:bird', proceduralName: 'Bird', group: 'BIRDS', habitat: 'SURFACE_AIR', phenotype: { bodyPlan: 'WINGED', covering: 'FEATHERS', locomotion: 'FLYING', bodyLengthMeters: 0.30942, primaryColorHex: '#D6BAB7', secondaryColorHex: '#7B8E9A', pattern: 'SPOTS', appendagePairs: 2, bioluminescent: false } }), 'AVIAN_BODY'],
      [species({ id: 'vida6:mammal', proceduralName: 'Mammal', group: 'MAMMALS', habitat: 'SURFACE_OPEN_TERRAIN', phenotype: { bodyPlan: 'TETRAPOD', covering: 'FUR', locomotion: 'WALKING', bodyLengthMeters: 0.7108, primaryColorHex: '#C4B18B', secondaryColorHex: '#D4BD93', pattern: 'SOLID', appendagePairs: 2, bioluminescent: false } }), 'QUADRUPED_BODY'],
    ];
    for (const [sample, family] of cases) {
      const descriptor = describeVida38SpeciesPreviewV1(contractOf(sample));
      expect(descriptor.family).toBe(family);
    }
  });

  it('genera una maqueta determinista para el mismo ID y fenotipo', () => {
    const sample = species({ id: 'vida6:deterministic', proceduralName: 'Determinista', group: 'REPTILES' });
    const contract = contractOf(sample);
    const a = createVida38SpeciesPreviewModelV1(contract);
    const b = createVida38SpeciesPreviewModelV1(contract);
    expect(a.descriptor).toEqual(b.descriptor);
    expect(meshSummary(a.root)).toEqual(meshSummary(b.root));
    a.dispose();
    b.dispose();
  });

  it('distingue grupos y nichos: la colonia microbiana no comparte estructura con un cuadrúpedo', () => {
    const micro = contractOf(species({
      id: 'vida6:tesyl', proceduralName: 'Tesyl al1', group: 'MICROORGANISMS', habitat: 'SURFACE_ROCK_SHELTER', nutrition: 'PHOTOSYNTHETIC',
      phenotype: { bodyPlan: 'CELL_COLONY', covering: 'MEMBRANE', locomotion: 'SESSILE', bodyLengthMeters: 0.0000082117, primaryColorHex: '#C7B690', secondaryColorHex: '#91AA88', pattern: 'BANDS', appendagePairs: 0, bioluminescent: false },
    }));
    const mammal = contractOf(species({
      id: 'vida6:arvar', proceduralName: 'Arvar um6', group: 'MAMMALS', habitat: 'SURFACE_OPEN_TERRAIN',
      phenotype: { bodyPlan: 'TETRAPOD', covering: 'FUR', locomotion: 'WALKING', bodyLengthMeters: 0.7108, primaryColorHex: '#C4B18B', secondaryColorHex: '#D4BD93', pattern: 'SOLID', appendagePairs: 2, bioluminescent: false },
    }));
    const a = createVida38SpeciesPreviewModelV1(micro);
    const b = createVida38SpeciesPreviewModelV1(mammal);
    expect(a.descriptor.family).toBe('MICROBIAL_COLONY');
    expect(b.descriptor.family).toBe('QUADRUPED_BODY');
    expect(meshSummary(a.root)).not.toEqual(meshSummary(b.root));
    a.dispose();
    b.dispose();
  });

  it('propaga pigmentación, bioluminiscencia y pistas de adaptación sin inventar civilización', () => {
    const sample = species({
      id: 'vida6:biolight', proceduralName: 'Biolight', group: 'BIRDS', habitat: 'SURFACE_AIR',
      adaptations: Object.freeze(['AERIAL_STABILITY', 'SENSORY_ORIENTATION']),
      phenotype: { bodyPlan: 'WINGED', covering: 'FEATHERS', locomotion: 'FLYING', bodyLengthMeters: 0.25, primaryColorHex: '#D6BAB7', secondaryColorHex: '#7B8E9A', pattern: 'SPOTS', appendagePairs: 2, bioluminescent: true },
    });
    const model = createVida38SpeciesPreviewModelV1(contractOf(sample));
    expect(model.descriptor.primaryColorHex).toBe('#D6BAB7');
    expect(model.descriptor.secondaryColorHex).toBe('#7B8E9A');
    expect(model.descriptor.bioluminescent).toBe(true);
    expect(model.descriptor.adaptationTags).toContain('AERIAL_STABILITY');
    expect(model.descriptor.specialistIntelligenceDeferred).toBe(false);
    let lights = 0;
    model.root.traverse(object => { if (object instanceof THREE.PointLight) lights += 1; });
    expect(lights).toBeGreaterThan(0);
    model.dispose();
  });

  it('marca el refinamiento 38.3 para especies inteligentes de linajes civilizables sin romper 38.2', () => {
    const intelligentSpecies = species({
      id: 'vida6:ismera', proceduralName: 'Ismera on7', group: 'REPTILES', habitat: 'SURFACE_WET_MARGIN',
      phenotype: { bodyPlan: 'TETRAPOD', covering: 'SCALES', locomotion: 'WALKING', bodyLengthMeters: 1.527, primaryColorHex: '#7B8E9A', secondaryColorHex: '#D6BAB7', pattern: 'SOLID', appendagePairs: 2, bioluminescent: false },
    });
    // Tipado explícito VIDA.7: Object.freeze() por sí solo ensancha los literales
    // ('REPTILIAN', 'VERY_ADVANCED', etc.) a string en objetos anidados.
    const intelligence: Vida7IntelligentSpecies = {
      speciesId: intelligentSpecies.id,
      lineage: 'REPTILIAN',
      communication: 'VISUAL_GESTURAL',
      socialStructure: 'CLAN',
      cognitionTraits: ['SYMBOLIC_LEARNING'],
    };
    const civilization: Vida7Civilization = {
      founderSpeciesId: intelligentSpecies.id,
      lineage: 'REPTILIAN',
      tier: 'VERY_ADVANCED',
      culture: {
        socialOrganization: 'PLANETARY_COORDINATION',
        governingTradition: 'SEASONAL_COVENANTS',
        communication: 'VISUAL_GESTURAL',
        culturalFocus: 'STONE_ARCHIVES',
      },
      technology: ['ORBITAL_CAPABILITY'],
      settlementPatterns: [],
    };
    const record: Vida38ConfirmedBiologySource = Object.freeze({
      revision: VIDA9_REVISION,
      epoch: 'CT-0',
      bodyStorageKey: 'V3:intelligent-body',
      ecosystem: Object.freeze({ revision: VIDA6_REVISION, bodyStorageKey: 'V3:intelligent-body', digest: 'digest:intelligent', species: [intelligentSpecies] }),
      intelligence: Object.freeze({
        revision: VIDA7_REVISION,
        ecosystemDigest: 'digest:intelligent',
        intelligentSpecies: intelligence,
        civilization,
      }),
    });
    const contract = vida38SpeciesVisualContractFromConfirmedV1(record, intelligentSpecies.id)!;
    const descriptor = describeVida38SpeciesPreviewV1(contract);
    expect(descriptor.specialistIntelligenceDeferred).toBe(true);
    const model = createVida38SpeciesPreviewModelV1(contract);
    expect(model.descriptor.family).toBe('QUADRUPED_BODY');
    model.dispose();
  });

  it('especializa los humanoides con geometría orgánica continua y más detalle anatómico', () => {
    const humanoid = species({
      id: 'vida6:sania', proceduralName: 'Sania on1', group: 'HUMANOIDS', habitat: 'SURFACE_SOIL',
      phenotype: {
        bodyPlan: 'BIPED',
        covering: 'LEATHERY',
        locomotion: 'WALKING',
        bodyLengthMeters: 1.6126,
        primaryColorHex: '#C7B690',
        secondaryColorHex: '#91AA88',
        pattern: 'SOLID',
        appendagePairs: 2,
        bioluminescent: false,
      },
    });
    const model = createVida38SpeciesPreviewModelV1(contractOf(humanoid));
    expect(model.descriptor.family).toBe('BIPED_BODY');

    let connectedBodyCount = 0;
    let eyes = 0;
    model.root.traverse(object => {
      const mesh = object as THREE.Mesh;
      if (mesh.name === 'VIDA38_2E_ORGANIC_SKIN') {
        connectedBodyCount++;
        expect(mesh.geometry.index?.count).toBeGreaterThan(30_000);
        expect(mesh.material).toBeInstanceOf(THREE.MeshPhysicalMaterial);
        expect((mesh.material as THREE.MeshPhysicalMaterial).normalMap).not.toBeNull();
        expect((mesh.material as THREE.MeshPhysicalMaterial).roughnessMap).not.toBeNull();
      }
      if (object.name.startsWith('VIDA38_2E_EYE')) eyes++;
    });
    expect(connectedBodyCount).toBe(1);
    expect(eyes).toBe(6);
    const raw = buildVida38HumanoidRawMesh(deriveVida38HumanoidAnatomy(contractOf(humanoid)), 'MEDIUM');
    const audit = auditVida38HumanoidRawMesh(raw);
    expect(audit.invalid).toBe(0);
    expect(audit.boundaryEdges).toBe(0);
    expect(audit.nonManifoldEdges).toBe(0);
    expect(audit.components).toBe(1);
    model.dispose();
  });
});
