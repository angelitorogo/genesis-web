/**
 * Fase 38.1 — contrato de representación visual de una especie VIDA.6/9.
 *
 * Fuente exclusiva: ficha biológica VIDA.9 de un cuerpo CONFIRMADO, CT-0.
 * Este contrato NO genera anatomía nueva, imágenes, poblaciones ni observaciones.
 * Los renderizadores 38.2/38.3 consumirán sus rasgos existentes como límites.
 *
 * IMPORTANTE: el llamador debe aplicar previamente la política de conocimiento
 * del jugador; no usar este adaptador para publicar Ground Truth privado.
 */
import { VIDA4_GROUPS, type Vida4Group } from '../../domain/life/procedural-ecology-vida4';
import { VIDA6_REVISION } from '../../domain/life/vida6-ecosystems-species';
import type {
  Vida6BodyCovering,
  Vida6BodyPlan,
  Vida6HabitatKind,
  Vida6Locomotion,
  Vida6Nutrition,
  Vida6Species,
  Vida6VisualPhenotype,
} from '../../domain/life/vida6-ecosystems-species';
import { VIDA7_REVISION } from '../../domain/life/vida7-intelligence-civilizations';
import type {
  Vida7CivilizableLineage,
  Vida7CivilizationTier,
} from '../../domain/life/vida7-intelligence-civilizations';
import { VIDA9_REVISION, type Vida9BiologyRecord } from '../../domain/life/vida9-biology-exploration';

export const VIDA38_SPECIES_VISUAL_REVISION = 'VIDA.38.1/species-visual-contract/v1' as const;

export interface Vida38SpeciesVisualContract {
  readonly revision: typeof VIDA38_SPECIES_VISUAL_REVISION;
  /** Identidad biológica inalterada: no se genera un taxón visual paralelo. */
  readonly speciesId: string;
  readonly speciesName: string;
  /** Clave estable para variantes visuales posteriores; no modifica VIDA.6. */
  readonly variantSeedUint32: number;
  /** Invalida una caché visual si cambia un rasgo certificado sin cambiar el ID. */
  readonly appearanceFingerprint: string;
  readonly provenance: Readonly<{
    status: 'CONFIRMED_SYSTEM_CT0';
    representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION';
    observedImageAvailable: false;
    bodyStorageKey: string;
    ecosystemDigest: string;
  }>;
  readonly morphology: Readonly<{
    group: Vida4Group;
    bodyPlan: Vida6BodyPlan;
    covering: Vida6BodyCovering;
    appendagePairs: number;
  }>;
  readonly ecology: Readonly<{
    habitat: Vida6HabitatKind;
    nutrition: Vida6Nutrition;
    niche: string;
  }>;
  readonly locomotion: Vida6Locomotion;
  /** Metros reales de VIDA.6/VIDA.T1; nunca reescalar el dato científico. */
  readonly bodyLengthMeters: number;
  readonly pigmentation: Readonly<{
    primaryColorHex: string;
    secondaryColorHex: string;
    pattern: Vida6VisualPhenotype['pattern'];
    bioluminescent: boolean;
  }>;
  /** Códigos VIDA.6 sin reinterpretarlos como órganos u objetos 3D. */
  readonly adaptations: readonly string[];
  /** Solo si VIDA.7 enlaza este ID; no inferirlo de forma o tamaño. */
  readonly intelligence: Readonly<{
    lineage: Vida7CivilizableLineage;
    civilizationTier: Vida7CivilizationTier | null;
  }> | null;
}

/** Datos mínimos del registro CT-0 que la ficha ya ha resuelto como confirmado. */
export type Vida38ConfirmedBiologySource = Pick<Vida9BiologyRecord, 'revision' | 'epoch' | 'bodyStorageKey'> & Readonly<{
  ecosystem: Pick<Vida9BiologyRecord['ecosystem'], 'revision' | 'bodyStorageKey' | 'digest' | 'species'>;
  intelligence: Pick<Vida9BiologyRecord['intelligence'],
    'revision' | 'ecosystemDigest' | 'intelligentSpecies' | 'civilization'>;
}>;

const BODY_PLANS: readonly Vida6BodyPlan[] = Object.freeze([
  'CELL_COLONY', 'FILAMENTOUS', 'FROND', 'STEMMED',
  'ARTHROPOD', 'TETRAPOD', 'WINGED', 'BIPED',
]);
const COVERINGS: readonly Vida6BodyCovering[] = Object.freeze([
  'MEMBRANE', 'CHITINOUS', 'SCALES', 'FEATHERS',
  'FUR', 'LEATHERY', 'FIBROUS',
]);
const LOCOMOTIONS: readonly Vida6Locomotion[] = Object.freeze([
  'SESSILE', 'CRAWLING', 'WALKING', 'FLYING', 'SWIMMING',
]);
const HABITATS: readonly Vida6HabitatKind[] = Object.freeze([
  'AQUIFER', 'SUBSURFACE_CAVERN', 'PROTECTED_SEEP', 'SURFACE_SOIL',
  'SURFACE_WET_MARGIN', 'SURFACE_CANOPY', 'SURFACE_OPEN_TERRAIN',
  'SURFACE_ROCK_SHELTER', 'SURFACE_AIR',
]);
const NUTRITION: readonly Vida6Nutrition[] = Object.freeze([
  'CHEMOSYNTHETIC', 'PHOTOSYNTHETIC', 'DECOMPOSER', 'HERBIVORE',
  'PREDATOR', 'OMNIVORE', 'MICROBIVORE',
]);
const PATTERNS: readonly Vida6VisualPhenotype['pattern'][] = Object.freeze([
  'SOLID', 'BANDS', 'SPOTS', 'MOTTLED',
]);
const HEX_RGB = /^#[0-9A-Fa-f]{6}$/;

/** Hash FNV-1a determinista, independiente del motor RNG y del orden de consulta. */
function hash32(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash = Math.imul(hash ^ value.charCodeAt(i), 16777619) >>> 0;
  }
  return hash >>> 0;
}

function validPhenotype(species: Vida6Species): boolean {
  const p = species.phenotype;
  if (!p || !Array.isArray(species.adaptations)) return false;
  return species.id.length > 0 && species.proceduralName.length > 0 &&
    VIDA4_GROUPS.includes(species.group) && BODY_PLANS.includes(p.bodyPlan) &&
    COVERINGS.includes(p.covering) && LOCOMOTIONS.includes(p.locomotion) &&
    HABITATS.includes(species.habitat) && NUTRITION.includes(species.nutrition) &&
    PATTERNS.includes(p.pattern) && p.bodyLengthMeters > 0 &&
    Number.isFinite(p.bodyLengthMeters) && Number.isInteger(p.appendagePairs) &&
    p.appendagePairs >= 0 && HEX_RGB.test(p.primaryColorHex) &&
    HEX_RGB.test(p.secondaryColorHex) && typeof p.bioluminescent === 'boolean' &&
    typeof species.niche === 'string' && species.niche.length > 0 &&
    species.adaptations.every(adaptation => typeof adaptation === 'string' && adaptation.length > 0);
}

/**
 * Solo resuelve especies PRESENTES en un registro confirmado que proporciona
 * explícitamente el llamador. Ausencia, origen incoherente o datos corruptos
 * producen null, nunca un animal o población inventados.
 */
export function vida38SpeciesVisualContractFromConfirmedV1(
  confirmedRecord: Vida38ConfirmedBiologySource | null,
  speciesId: string,
): Vida38SpeciesVisualContract | null {
  if (confirmedRecord === null || confirmedRecord.epoch !== 'CT-0' ||
      confirmedRecord.revision !== VIDA9_REVISION ||
      confirmedRecord.ecosystem.revision !== VIDA6_REVISION ||
      confirmedRecord.intelligence.revision !== VIDA7_REVISION ||
      confirmedRecord.bodyStorageKey !== confirmedRecord.ecosystem.bodyStorageKey ||
      confirmedRecord.intelligence.ecosystemDigest !== confirmedRecord.ecosystem.digest ||
      !speciesId) {
    return null;
  }
  const matches = confirmedRecord.ecosystem.species.filter(species => species.id === speciesId);
  if (matches.length !== 1) return null;
  const species = matches[0]!;
  if (!validPhenotype(species)) return null;

  const intelligent = confirmedRecord.intelligence.intelligentSpecies;
  const civilization = confirmedRecord.intelligence.civilization;
  if (civilization !== null && (intelligent === null ||
      civilization.founderSpeciesId !== intelligent.speciesId ||
      civilization.lineage !== intelligent.lineage)) return null;
  const speciesIsIntelligent = intelligent?.speciesId === species.id;
  const speciesIsCivilized = civilization?.founderSpeciesId === species.id;
  // Un registro inconsistente no autoriza inventar un fundador civilizado.
  if (speciesIsCivilized && (!speciesIsIntelligent || intelligent?.lineage !== civilization?.lineage)) {
    return null;
  }

  const phenotype = species.phenotype;
  const identity = `VIDA.38.1|${species.id}`;
  const appearancePayload = JSON.stringify([
    species.group, species.habitat, species.nutrition, species.niche,
    phenotype.bodyPlan, phenotype.covering, phenotype.locomotion,
    phenotype.bodyLengthMeters, phenotype.primaryColorHex,
    phenotype.secondaryColorHex, phenotype.pattern, phenotype.appendagePairs,
    phenotype.bioluminescent, species.adaptations,
    speciesIsIntelligent ? intelligent?.lineage : null,
  ]);

  return Object.freeze({
    revision: VIDA38_SPECIES_VISUAL_REVISION,
    speciesId: species.id,
    speciesName: species.proceduralName,
    variantSeedUint32: hash32(identity),
    appearanceFingerprint: hash32(appearancePayload).toString(16).padStart(8, '0'),
    provenance: Object.freeze({
      status: 'CONFIRMED_SYSTEM_CT0',
      representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',
      observedImageAvailable: false,
      bodyStorageKey: confirmedRecord.bodyStorageKey,
      ecosystemDigest: confirmedRecord.ecosystem.digest,
    }),
    morphology: Object.freeze({
      group: species.group,
      bodyPlan: phenotype.bodyPlan,
      covering: phenotype.covering,
      appendagePairs: phenotype.appendagePairs,
    }),
    ecology: Object.freeze({
      habitat: species.habitat,
      nutrition: species.nutrition,
      niche: species.niche,
    }),
    locomotion: phenotype.locomotion,
    bodyLengthMeters: phenotype.bodyLengthMeters,
    pigmentation: Object.freeze({
      primaryColorHex: phenotype.primaryColorHex,
      secondaryColorHex: phenotype.secondaryColorHex,
      pattern: phenotype.pattern,
      bioluminescent: phenotype.bioluminescent,
    }),
    adaptations: Object.freeze([...species.adaptations]),
    intelligence: speciesIsIntelligent && intelligent !== null
      ? Object.freeze({
          lineage: intelligent.lineage,
          civilizationTier: speciesIsCivilized && civilization !== null ? civilization.tier : null,
        })
      : null,
  });
}
