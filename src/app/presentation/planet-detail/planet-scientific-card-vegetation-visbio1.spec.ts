import {
  resolvePlanetVegetationPreviewProfileV1,
} from './planet-scientific-card';

import {
  VIDA6_REVISION,
  type Vida6EcosystemSnapshot,
  type Vida6Species,
} from '../../domain/life/vida6-ecosystems-species';

import { VIDA3_MODEL_REVISION } from '../../domain/life/procedural-microbial-vida3';

import {
  VIDA9_REVISION,
  type Vida9BiologyRecord,
} from '../../domain/life/vida9-biology-exploration';

import {
  VIDA7_REVISION,
} from '../../domain/life/vida7-intelligence-civilizations';

import {
  VIDA8_REVISION,
} from '../../domain/life/vida8-technological-colonization';

function buildSpecies(id: string, group: Vida6Species['group']): Vida6Species {
  const vegetationPalette = {
    'species-1': ['#9BCF70', '#79A952'],
    'species-2': ['#D3BF63', '#8C9D48'],
    'species-3': ['#5FA98D', '#3E7D8B'],
    'species-4': ['#B8D779', '#8AAF4F'],
    'species-5': ['#7CA65C', '#AF8D55'],
    'species-6': ['#6987B2', '#54739C'],
  } as const;
  const palette = vegetationPalette[id as keyof typeof vegetationPalette] ?? ['#558844', '#335522'];
  return Object.freeze({
    id,
    proceduralName: id,
    group,
    habitat: group === 'PLANTS_TREES' ? 'SURFACE_CANOPY' : 'SURFACE_OPEN_TERRAIN',
    nutrition: group === 'PLANTS_TREES' ? 'PHOTOSYNTHETIC' : 'HERBIVORE',
    adaptations: Object.freeze([]),
    phenotype: Object.freeze({
      bodyPlan: group === 'PLANTS_TREES' ? 'STEMMED' : 'TETRAPOD',
      covering: group === 'PLANTS_TREES' ? 'FIBROUS' : 'FUR',
      locomotion: group === 'PLANTS_TREES' ? 'SESSILE' : 'WALKING',
      bodyLengthMeters: 1,
      primaryColorHex: palette[0],
      secondaryColorHex: palette[1],
      pattern: 'SOLID',
      appendagePairs: 0,
      bioluminescent: false,
    }),
    niche: 'fixture',
  });
}

function buildEcosystem(
  options: {
    groups: Vida6EcosystemSnapshot['effectiveGroups'];
    habitats: Vida6EcosystemSnapshot['habitatsOccupied'];
    regime?: Vida6EcosystemSnapshot['regime'];
    species?: readonly Vida6Species[];
  },
): Vida6EcosystemSnapshot {
  const species = options.species ?? options.groups.map((group, index) =>
    buildSpecies(`species-${index + 1}`, group),
  );
  return Object.freeze({
    revision: VIDA6_REVISION,
    identity: Object.freeze({
      universeSeed: 'seed',
      generatorVersionCode: 1,
      kind: 'PLANET',
      galaxyIndex: '0',
      sectorKey: '0,0',
      galacticObjectIndex: '0',
      bodyIndex: '1',
      moonIndex: null,
    }),
    bodyStorageKey: 'planet-1',
    microbialRevision: VIDA3_MODEL_REVISION,
    microbialDigest: 'MICRO',
    originalEcologyDigest: 'ECO',
    calibrationDigest: 'CAL',
    habitat: 'SURFACE_OPEN',
    regime: options.regime ?? 'SURFACE_DIVERSE',
    effectiveGroups: Object.freeze([...options.groups]),
    species: Object.freeze(species),
    relations: Object.freeze([]),
    habitatsOccupied: Object.freeze([...options.habitats]),
    biospherePresent: species.length > 0,
    intelligentSpeciesGenerated: false,
    civilizationGenerated: false,
    digest: 'DIGEST',
  });
}

function buildBiologyRecord(ecosystem: Vida6EcosystemSnapshot): Vida9BiologyRecord {
  return Object.freeze({
    revision: VIDA9_REVISION,
    identity: ecosystem.identity,
    bodyStorageKey: ecosystem.bodyStorageKey,
    epoch: 'CT-0',
    epochOffsetYears: 0,
    revealPolicy: 'FULL_SYSTEM_REVEAL_ON_CONFIRMED',
    ecosystem,
    intelligence: Object.freeze({
      revision: VIDA7_REVISION,
      identity: ecosystem.identity,
      bodyStorageKey: ecosystem.bodyStorageKey,
      ecosystemRevision: VIDA6_REVISION,
      ecosystemDigest: ecosystem.digest,
      calibrationDigest: ecosystem.calibrationDigest,
      eligibility: 'INCOMPLETE_ECOSYSTEM',
      intelligentSpecies: null,
      civilization: null,
      intelligencePresent: false,
      civilizationPresent: false,
      digest: 'I',
    }),
    colonization: Object.freeze({
      revision: VIDA8_REVISION,
      identity: ecosystem.identity,
      bodyStorageKey: ecosystem.bodyStorageKey,
      ecosystemRevision: VIDA6_REVISION,
      ecosystemDigest: ecosystem.digest,
      nativeCivilizationRevision: VIDA7_REVISION,
      nativeCivilizationDigest: 'I',
      nativeLifePresent: ecosystem.biospherePresent,
      nativeIntelligencePresent: false,
      nativeCivilizationPresent: false,
      introducedLifePresent: false,
      colonialPopulationPresent: false,
      outcome: 'NOT_SELECTED',
      colonies: Object.freeze([]),
      digest: 'C',
    }),
    nativeLifePresent: ecosystem.biospherePresent,
    nativeIntelligencePresent: false,
    nativeCivilizationPresent: false,
    introducedLifePresent: false,
    colonialPopulationPresent: false,
    historicalOriginEpochYears: null,
    digest: 'B',
  });
}

describe('VISBIO.1b planet vegetation preview profile', () => {
  it('returns null when the ecosystem has no plant group', () => {
    const ecosystem = buildEcosystem({
      groups: Object.freeze(['MICROORGANISMS', 'FUNGI']),
      habitats: Object.freeze(['SURFACE_SOIL']),
      regime: 'SURFACE_LIMITED',
    });

    expect(resolvePlanetVegetationPreviewProfileV1(buildBiologyRecord(ecosystem), undefined)).toBeNull();
  });

  it('increases coverage and palette richness with more flora species and habitats', () => {
    const ecosystem = buildEcosystem({
      groups: Object.freeze(['MICROORGANISMS', 'FUNGI', 'PLANTS_TREES', 'INSECTS']),
      habitats: Object.freeze(['SURFACE_CANOPY', 'SURFACE_OPEN_TERRAIN', 'SURFACE_WET_MARGIN']),
      regime: 'SURFACE_DIVERSE',
      species: Object.freeze([
        buildSpecies('species-1', 'PLANTS_TREES'),
        buildSpecies('species-2', 'PLANTS_TREES'),
        buildSpecies('species-3', 'PLANTS_TREES'),
        buildSpecies('species-4', 'PLANTS_TREES'),
        buildSpecies('species-5', 'INSECTS'),
      ]),
    });

    const profile = resolvePlanetVegetationPreviewProfileV1(
      buildBiologyRecord(ecosystem),
      undefined,
    );

    expect(profile).not.toBeNull();
    expect(profile!.coverageFraction01).toBeGreaterThanOrEqual(0.40);
    expect(profile!.coverageFraction01).toBeLessThanOrEqual(0.86);
    expect(profile!.lushness01).toBeGreaterThan(0.45);
    expect(profile!.floraSpeciesCount).toBe(4);
    expect(profile!.paletteHexes.length).toBeGreaterThan(2);
    expect(profile!.paletteEntries?.length ?? 0).toBeGreaterThan(4);
    expect((profile!.paletteEntries ?? []).reduce((sum, entry) => sum + entry.weight01, 0)).toBeCloseTo(1, 2);
  });

  it('makes one, two, three, four and six flora species visibly progressive', () => {
    const profiles = [1, 2, 3, 4, 6].map(count => {
      const ecosystem = buildEcosystem({
        groups: Object.freeze(['MICROORGANISMS', 'FUNGI', 'PLANTS_TREES']),
        habitats: Object.freeze(['SURFACE_SOIL', 'SURFACE_CANOPY', 'SURFACE_WET_MARGIN']),
        regime: 'SURFACE_DIVERSE',
        species: Object.freeze(Array.from({ length: count }, (_, index) =>
          buildSpecies(`species-${index + 1}`, 'PLANTS_TREES'))),
      });
      return resolvePlanetVegetationPreviewProfileV1(buildBiologyRecord(ecosystem), undefined)!;
    });

    expect(profiles.map(profile => profile.floraSpeciesCount)).toEqual([1, 2, 3, 4, 6]);
    for (let index = 1; index < profiles.length; index += 1) {
      expect(profiles[index]!.coverageFraction01 - profiles[index - 1]!.coverageFraction01)
        .toBeGreaterThanOrEqual(0.09);
    }
    expect(profiles[0]!.paletteHexes).toContain('#9BCF70');
    expect(profiles[3]!.paletteHexes.length).toBeGreaterThan(profiles[0]!.paletteHexes.length);
  });

  it('preserves procedural plant colors as weighted palette entries', () => {
    const ecosystem = buildEcosystem({
      groups: Object.freeze(['PLANTS_TREES']),
      habitats: Object.freeze(['SURFACE_OPEN_TERRAIN']),
      species: Object.freeze([
        buildSpecies('species-2', 'PLANTS_TREES'),
        buildSpecies('species-3', 'PLANTS_TREES'),
      ]),
    });

    const profile = resolvePlanetVegetationPreviewProfileV1(
      buildBiologyRecord(ecosystem),
      undefined,
    )!;

    const entryHexes = (profile.paletteEntries ?? []).map(entry => entry.hex);
    expect(entryHexes).toContain('#D3BF63');
    expect(entryHexes).toContain('#5FA98D');
    expect(entryHexes).toContain('#8C9D48');
    expect(entryHexes).toContain('#3E7D8B');
    expect(profile.paletteEntries![0]!.weight01).toBeGreaterThan(profile.paletteEntries![profile.paletteEntries!.length - 1]!.weight01);
  });
});
