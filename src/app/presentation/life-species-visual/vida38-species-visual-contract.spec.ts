import { describe, expect, it } from 'vitest';
import { VIDA9_REVISION } from '../../domain/life/vida9-biology-exploration';
import { VIDA6_REVISION, type Vida6Species } from '../../domain/life/vida6-ecosystems-species';
import { VIDA7_REVISION } from '../../domain/life/vida7-intelligence-civilizations';
import type {
  Vida7Civilization,
  Vida7IntelligentSpecies,
} from '../../domain/life/vida7-intelligence-civilizations';
import {
  VIDA38_SPECIES_VISUAL_REVISION,
  type Vida38ConfirmedBiologySource,
  vida38SpeciesVisualContractFromConfirmedV1,
} from './vida38-species-visual-contract';

const examples: readonly Readonly<{
  id: string;
  group: Vida6Species['group'];
  bodyPlan: Vida6Species['phenotype']['bodyPlan'];
  covering: Vida6Species['phenotype']['covering'];
  locomotion: Vida6Species['phenotype']['locomotion'];
  length: number;
  habitat: Vida6Species['habitat'];
  nutrition: Vida6Species['nutrition'];
}>[] = [
  { id: 'Tesyl al1', group: 'MICROORGANISMS', bodyPlan: 'CELL_COLONY', covering: 'MEMBRANE', locomotion: 'SESSILE', length: 0.0000082117, habitat: 'SURFACE_ROCK_SHELTER', nutrition: 'PHOTOSYNTHETIC' },
  { id: 'Isvar al2', group: 'FUNGI', bodyPlan: 'FILAMENTOUS', covering: 'FIBROUS', locomotion: 'SESSILE', length: 0.11808, habitat: 'SURFACE_SOIL', nutrition: 'DECOMPOSER' },
  { id: 'Kathar ix2', group: 'PLANTS_TREES', bodyPlan: 'STEMMED', covering: 'FIBROUS', locomotion: 'SESSILE', length: 3.2142, habitat: 'SURFACE_WET_MARGIN', nutrition: 'PHOTOSYNTHETIC' },
  { id: 'Lovor um1', group: 'INSECTS', bodyPlan: 'ARTHROPOD', covering: 'CHITINOUS', locomotion: 'FLYING', length: 0.035307, habitat: 'SURFACE_SOIL', nutrition: 'OMNIVORE' },
  { id: 'Loquor en2', group: 'REPTILES', bodyPlan: 'TETRAPOD', covering: 'SCALES', locomotion: 'WALKING', length: 0.44822, habitat: 'SURFACE_OPEN_TERRAIN', nutrition: 'OMNIVORE' },
  { id: 'Zudros is1', group: 'BIRDS', bodyPlan: 'WINGED', covering: 'FEATHERS', locomotion: 'FLYING', length: 0.30942, habitat: 'SURFACE_AIR', nutrition: 'OMNIVORE' },
  { id: 'Arvar um6', group: 'MAMMALS', bodyPlan: 'TETRAPOD', covering: 'FUR', locomotion: 'WALKING', length: 0.7108, habitat: 'SURFACE_OPEN_TERRAIN', nutrition: 'OMNIVORE' },
  { id: 'Sania on1', group: 'HUMANOIDS', bodyPlan: 'BIPED', covering: 'LEATHERY', locomotion: 'WALKING', length: 1.6126, habitat: 'SURFACE_SOIL', nutrition: 'OMNIVORE' },
  { id: 'Ismera on7', group: 'REPTILES', bodyPlan: 'TETRAPOD', covering: 'SCALES', locomotion: 'WALKING', length: 1.527, habitat: 'SURFACE_WET_MARGIN', nutrition: 'OMNIVORE' },
];

function speciesOf(example: typeof examples[number]): Vida6Species {
  return Object.freeze({
    id: `vida6:${example.id.replaceAll(' ', '-')}`,
    proceduralName: example.id,
    group: example.group,
    habitat: example.habitat,
    nutrition: example.nutrition,
    niche: `${example.habitat}/${example.nutrition}`,
    adaptations: Object.freeze(['THERMAL_BUFFERING', 'SENSORY_ORIENTATION']),
    phenotype: Object.freeze({
      bodyPlan: example.bodyPlan,
      covering: example.covering,
      locomotion: example.locomotion,
      bodyLengthMeters: example.length,
      primaryColorHex: '#AabbCC',
      secondaryColorHex: '#557799',
      pattern: 'MOTTLED' as const,
      appendagePairs: example.group === 'MICROORGANISMS' || example.group === 'FUNGI' || example.group === 'PLANTS_TREES' ? 0 : example.group === 'INSECTS' ? 3 : 2,
      bioluminescent: false,
    }),
  });
}

function confirmedRecord(
  species: readonly Vida6Species[],
  intelligentSpecies: Vida7IntelligentSpecies | null = null,
  civilization: Vida7Civilization | null = null,
): Vida38ConfirmedBiologySource {
  return Object.freeze({
    revision: VIDA9_REVISION,
    epoch: 'CT-0',
    bodyStorageKey: 'V3:sample-planet',
    ecosystem: Object.freeze({
      revision: VIDA6_REVISION,
      bodyStorageKey: 'V3:sample-planet',
      digest: 'ecosystem-digest',
      species,
    }),
    intelligence: Object.freeze({
      revision: VIDA7_REVISION,
      ecosystemDigest: 'ecosystem-digest',
      intelligentSpecies,
      civilization,
    }),
  });
}

describe('Fase 38.1 — contrato visual desde VIDA.6/7/9', () => {
  it.each(examples)('preserva el grupo, cuerpo, locomoción y tamaño exacto de $id', example => {
    const source = speciesOf(example);
    const contract = vida38SpeciesVisualContractFromConfirmedV1(confirmedRecord([source]), source.id);
    expect(contract).not.toBeNull();
    expect(contract!.revision).toBe(VIDA38_SPECIES_VISUAL_REVISION);
    expect(contract!.speciesId).toBe(source.id);
    expect(contract!.morphology.group).toBe(example.group);
    expect(contract!.morphology.bodyPlan).toBe(example.bodyPlan);
    expect(contract!.morphology.covering).toBe(example.covering);
    expect(contract!.locomotion).toBe(example.locomotion);
    expect(contract!.bodyLengthMeters).toBe(example.length);
    expect(contract!.ecology.habitat).toBe(example.habitat);
    expect(contract!.ecology.nutrition).toBe(example.nutrition);
    expect(contract!.ecology.niche).toBe(source.niche);
  });

  it('usa un ID visual y una huella estables sin volver a lanzar VIDA ni inventar rasgos', () => {
    const original = speciesOf(examples[3]!);
    const record = confirmedRecord([original]);
    const a = vida38SpeciesVisualContractFromConfirmedV1(record, original.id)!;
    const b = vida38SpeciesVisualContractFromConfirmedV1(record, original.id)!;
    expect(a).toEqual(b);
    expect(JSON.parse(JSON.stringify(a))).toEqual(a);
    expect(a.variantSeedUint32).toBeGreaterThanOrEqual(0);
    expect(a.appearanceFingerprint).toMatch(/^[0-9a-f]{8}$/);
    expect(a.pigmentation).toEqual({
      primaryColorHex: '#AabbCC', secondaryColorHex: '#557799',
      pattern: 'MOTTLED', bioluminescent: false,
    });
    expect(a.adaptations).toEqual(original.adaptations);
    expect(a.provenance.observedImageAvailable).toBe(false);
    expect(a.provenance.representation).toBe('SCIENTIFIC_PROCEDURAL_RECONSTRUCTION');
    expect(Object.isFrozen(a)).toBe(true);
    expect(Object.isFrozen(a.morphology)).toBe(true);
    expect(Object.isFrozen(a.adaptations)).toBe(true);
    expect(Object.isFrozen(a.pigmentation)).toBe(true);
    expect(a.intelligence).toBeNull();
  });

  it('mantiene la misma identidad de variante y cambia la huella si VIDA altera un rasgo', () => {
    const original = speciesOf(examples[0]!);
    const changed: Vida6Species = {
      ...original,
      phenotype: { ...original.phenotype, secondaryColorHex: '#112233' },
    };
    const a = vida38SpeciesVisualContractFromConfirmedV1(confirmedRecord([original]), original.id)!;
    const b = vida38SpeciesVisualContractFromConfirmedV1(confirmedRecord([changed]), changed.id)!;
    expect(a.variantSeedUint32).toBe(b.variantSeedUint32);
    expect(a.appearanceFingerprint).not.toBe(b.appearanceFingerprint);
  });

  it('asocia inteligencia y tecnología solo a la especie de VIDA.7 enlazada por ID', () => {
    const elder = speciesOf(examples[8]!);
    const bystander = speciesOf(examples[4]!);
    const intelligence: Vida7IntelligentSpecies = {
      speciesId: elder.id, lineage: 'REPTILIAN', communication: 'VISUAL_GESTURAL',
      socialStructure: 'CLAN', cognitionTraits: ['SYMBOLIC_LEARNING', 'TOOL_MANIPULATION'],
    };
    const civilization: Vida7Civilization = {
      founderSpeciesId: elder.id, lineage: 'REPTILIAN', tier: 'VERY_ADVANCED',
      culture: {
        socialOrganization: 'PLANETARY_COORDINATION',
        governingTradition: 'SEASONAL_COVENANTS',
        communication: 'VISUAL_GESTURAL',
        culturalFocus: 'STONE_ARCHIVES',
      },
      technology: ['TELECOMMUNICATIONS', 'ORBITAL_CAPABILITY'],
      settlementPatterns: [],
    };
    const record = confirmedRecord([elder, bystander], intelligence, civilization);
    const founder = vida38SpeciesVisualContractFromConfirmedV1(record, elder.id)!;
    const other = vida38SpeciesVisualContractFromConfirmedV1(record, bystander.id)!;
    expect(founder.intelligence).toEqual({ lineage: 'REPTILIAN', civilizationTier: 'VERY_ADVANCED' });
    expect(founder.bodyLengthMeters).toBeGreaterThanOrEqual(1.5);
    expect(other.intelligence).toBeNull();
    expect(other.bodyLengthMeters).toBe(0.44822);
  });

  it('no inventa civilización en especies inteligentes que no la tienen', () => {
    const species = speciesOf(examples[7]!);
    const intelligence: Vida7IntelligentSpecies = {
      speciesId: species.id, lineage: 'HUMANOID', communication: 'VOCAL_SYMBOLIC',
      socialStructure: 'CLAN', cognitionTraits: ['SOCIAL_MEMORY'],
    };
    const result = vida38SpeciesVisualContractFromConfirmedV1(
      confirmedRecord([species], intelligence), species.id,
    );
    expect(result?.intelligence).toEqual({ lineage: 'HUMANOID', civilizationTier: null });
  });

  it('no revela especies no contenidas en un registro CT-0 del sistema confirmado', () => {
    const specimen = speciesOf(examples[0]!);
    const known = confirmedRecord([specimen]);
    expect(vida38SpeciesVisualContractFromConfirmedV1(null, specimen.id)).toBeNull();
    expect(vida38SpeciesVisualContractFromConfirmedV1(known, 'vida6:unknown')).toBeNull();
    expect(vida38SpeciesVisualContractFromConfirmedV1({ ...known, epoch: 'CT-1' as 'CT-0' }, specimen.id)).toBeNull();
    expect(vida38SpeciesVisualContractFromConfirmedV1({ ...known, bodyStorageKey: 'other' }, specimen.id)).toBeNull();
    expect(vida38SpeciesVisualContractFromConfirmedV1({ ...known, intelligence: {
      ...known.intelligence, ecosystemDigest: 'other-digest',
    } }, specimen.id)).toBeNull();
  });

  it('rechaza tamaños, pigmentos y apéndices inválidos sin inventar geometría', () => {
    const specimen = speciesOf(examples[0]!);
    const bad = [
      { ...specimen, phenotype: { ...specimen.phenotype, bodyLengthMeters: 0 } },
      { ...specimen, phenotype: { ...specimen.phenotype, bodyLengthMeters: Number.NaN } },
      { ...specimen, phenotype: { ...specimen.phenotype, primaryColorHex: 'red' } },
      { ...specimen, phenotype: { ...specimen.phenotype, appendagePairs: -1 } },
    ];
    for (const candidate of bad) {
      expect(vida38SpeciesVisualContractFromConfirmedV1(confirmedRecord([candidate]), specimen.id)).toBeNull();
    }
  });

  it('no atribuye una civilización con identidad de fundador o linaje incoherentes', () => {
    const specimen = speciesOf(examples[8]!);
    const intelligent: Vida7IntelligentSpecies = {
      speciesId: specimen.id, lineage: 'REPTILIAN', communication: 'VISUAL_GESTURAL',
      socialStructure: 'CLAN', cognitionTraits: [],
    };
    const wrong: Vida7Civilization = {
      founderSpeciesId: specimen.id, lineage: 'INSECTOID', tier: 'ADVANCED',
      culture: { socialOrganization: 'CLAN', governingTradition: 'COUNCILS',
        communication: 'VISUAL_GESTURAL', culturalFocus: 'STONE_ARCHIVES' },
      technology: [], settlementPatterns: [],
    };
    expect(vida38SpeciesVisualContractFromConfirmedV1(
      confirmedRecord([specimen], intelligent, wrong), specimen.id,
    )).toBeNull();
  });
});
