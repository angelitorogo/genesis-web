/**
 * GENESIS · VIDA.38.2o.e8b — coherencia funcional y trazabilidad de indumentaria.
 * Esta capa NO genera geometría; decide qué motor existente corresponde
 * a cada especie y permite contrastar la decisión con el resultado real.
 */
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { selectVida38ReptilianVariation38OE1 } from './vida38-civilized-reptilian-variation-38-2oe1';
import type {
  Vida38CivilizedReptilianCulture38OE,
  Vida38CivilizedReptilianGarmentFamily38OE6,
  Vida38CivilizedReptilianGarmentLine38OE,
  Vida38CivilizedReptilianLevel38OD,
  Vida38CivilizedReptilianProfile38OD,
} from './vida38-civilized-reptilian-preview-38-2o';

export const VIDA38_WARDROBE_COHERENCE_REVISION_38OE8B = 'VIDA.38.2o.e8b/wardrobe-selection/v1' as const;
export type Vida38WardrobeEngine38OE8B = 'TECH_SUIT_38OD5' | 'ORGANIC_SOFT_38OE7C' | 'TECHNICAL_ARMOR_38OE8A' | 'LEGACY_38OD';

export interface Vida38WardrobeCoherencePlan38OE8B {
  readonly revision: typeof VIDA38_WARDROBE_COHERENCE_REVISION_38OE8B;
  readonly speciesId: string;
  readonly profile: Vida38CivilizedReptilianProfile38OD;
  readonly garmentLine: Vida38CivilizedReptilianGarmentLine38OE;
  readonly culture: Vida38CivilizedReptilianCulture38OE;
  readonly family: Vida38CivilizedReptilianGarmentFamily38OE6;
  readonly engine: Vida38WardrobeEngine38OE8B;
  readonly suitability: 'COHERENT' | 'LEGACY';
  readonly softGarment: boolean;
  readonly inspectionHint: string;
}

/**
 * La línea funcional establece las opciones admisibles; la cultura les da
 * carácter, pero nunca convierte un explorador/militar en un hábito rígido.
 * Se conserva variación real dentro de cada línea: no uniforme único.
 */
export function selectVida38WardrobeFamily38OE8B(args: {
  seed: number;
  level: Vida38CivilizedReptilianLevel38OD;
  garmentLine: Vida38CivilizedReptilianGarmentLine38OE;
  culture: Vida38CivilizedReptilianCulture38OE;
  profile: Vida38CivilizedReptilianProfile38OD;
}): Vida38CivilizedReptilianGarmentFamily38OE6 {
  if (args.level !== 'VERY_ADVANCED') return 'TECH_SUIT';
  const { garmentLine, culture, profile } = args;
  let options: readonly Vida38CivilizedReptilianGarmentFamily38OE6[];
  switch (garmentLine) {
    case 'MILITARY':
      options = culture === 'PELAGIC_CONCORD'
        ? ['SEGMENTED_ARMOR', 'SEGMENTED_ARMOR', 'TECH_SUIT', 'COLONIAL_RIG']
        : ['SEGMENTED_ARMOR', 'SEGMENTED_ARMOR', 'SEGMENTED_ARMOR', 'TECH_SUIT', 'COLONIAL_RIG'];
      break;
    case 'EXPLORER':
      options = culture === 'DUNE_MANDATE'
        ? ['COLONIAL_RIG', 'COLONIAL_RIG', 'TECH_SUIT', 'TECH_SUIT']
        : ['COLONIAL_RIG', 'COLONIAL_RIG', 'TECH_SUIT'];
      break;
    case 'INDUSTRIAL_COLONIZER':
      options = ['COLONIAL_RIG', 'COLONIAL_RIG', 'COLONIAL_RIG', 'TECH_SUIT'];
      break;
    case 'SCIENTIST':
      options = culture === 'BASILICA_TECHNOCRACY'
        ? ['TECH_SUIT', 'TECH_SUIT', 'CEREMONIAL_ROBES']
        : culture === 'PELAGIC_CONCORD'
          ? ['PELAGIC_DRAPE', 'PELAGIC_DRAPE', 'TECH_SUIT']
          : ['TECH_SUIT', 'TECH_SUIT', 'TECH_SUIT', 'CEREMONIAL_ROBES'];
      break;
    case 'TECHNO_PRIEST':
      options = culture === 'OBSIDIAN_CLAN'
        ? ['SEGMENTED_ARMOR', 'CEREMONIAL_ROBES', 'NOBLE_REGALIA']
        : ['CEREMONIAL_ROBES', 'NOBLE_REGALIA', 'CEREMONIAL_ROBES', 'SEGMENTED_ARMOR'];
      break;
    case 'NOBLE':
      options = culture === 'FRONTIER_HEGEMONY'
        ? ['SEGMENTED_ARMOR', 'NOBLE_REGALIA', 'NOBLE_REGALIA']
        : culture === 'PELAGIC_CONCORD' || profile === 'AMPHIBIOUS_DIPLOMAT'
          ? ['PELAGIC_DRAPE', 'NOBLE_REGALIA', 'NOBLE_REGALIA']
          : ['NOBLE_REGALIA', 'NOBLE_REGALIA', 'CEREMONIAL_ROBES', 'SEGMENTED_ARMOR'];
      break;
    default:
      options = ['TECH_SUIT'];
  }
  return options[(args.seed >>> 0) % options.length]!;
}

export function getVida38WardrobeEngine38OE8B(family: Vida38CivilizedReptilianGarmentFamily38OE6,
  level: Vida38CivilizedReptilianLevel38OD): Vida38WardrobeEngine38OE8B {
  if (level !== 'VERY_ADVANCED') return 'LEGACY_38OD';
  switch (family) {
    case 'SEGMENTED_ARMOR':
    case 'COLONIAL_RIG': return 'TECHNICAL_ARMOR_38OE8A';
    case 'CEREMONIAL_ROBES':
    case 'NOBLE_REGALIA':
    case 'PELAGIC_DRAPE': return 'ORGANIC_SOFT_38OE7C';
    default: return 'TECH_SUIT_38OD5';
  }
}

function levelFrom38OE8B(contract: Vida38SpeciesVisualContract): Vida38CivilizedReptilianLevel38OD {
  const values: string[] = [];
  const intelligence = contract.intelligence as unknown as Record<string, unknown> | null;
  const add = (value: unknown): void => {
    if (typeof value === 'string' || typeof value === 'number') values.push(String(value).toUpperCase());
  };
  if (intelligence) {
    for (const key of ['civilizationLevel', 'civilisationLevel', 'societyLevel', 'stage', 'civilizationStage']) add(intelligence[key]);
    const civilization = intelligence['civilization'];
    const society = intelligence['society'];
    if (typeof civilization === 'object' && civilization !== null) add((civilization as Record<string, unknown>)['level']);
    if (typeof society === 'object' && society !== null) add((society as Record<string, unknown>)['level']);
  }
  const other = contract as unknown as Record<string, unknown>;
  add(other['civilizationLevel']); add(other['technologyLevel']);
  const blob = (values.join(' ') + ' ' + JSON.stringify(contract.intelligence ?? {}) + ' ' + JSON.stringify(contract)).toUpperCase();
  if (blob.includes('VERY_ADVANCED')) return 'VERY_ADVANCED';
  if (blob.includes('ADVANCED')) return 'ADVANCED';
  return 'PRIMITIVE';
}

export function deriveVida38WardrobeCoherencePlan38OE8B(contract: Vida38SpeciesVisualContract): Vida38WardrobeCoherencePlan38OE8B {
  const variation = selectVida38ReptilianVariation38OE1(contract.speciesId, contract.appearanceFingerprint);
  const level = levelFrom38OE8B(contract);
  const family = selectVida38WardrobeFamily38OE8B({
    seed: variation.anatomySeed ^ contract.speciesId.length ^ contract.appearanceFingerprint.length,
    level, garmentLine: variation.garmentLine, culture: variation.culture, profile: variation.profile,
  });
  const engine = getVida38WardrobeEngine38OE8B(family, level);
  const softGarment = engine === 'ORGANIC_SOFT_38OE7C';
  return {
    revision: VIDA38_WARDROBE_COHERENCE_REVISION_38OE8B,
    speciesId: contract.speciesId,
    profile: variation.profile,
    garmentLine: variation.garmentLine,
    culture: variation.culture,
    family,
    engine,
    suitability: level === 'VERY_ADVANCED' ? 'COHERENT' : 'LEGACY',
    softGarment,
    inspectionHint: softGarment
      ? 'Prenda blanda e7c: comprobar caída, cola y posible silueta acampanada en 3D.'
      : engine === 'TECHNICAL_ARMOR_38OE8A'
        ? 'Equipo técnico e8a: comprobar peto, espalda, extremidades y cintura.'
        : engine === 'TECH_SUIT_38OD5'
          ? 'Traje integral d5: comprobar continuidad y bandas luminosas.'
          : 'Vestimenta previa a la tecnología muy avanzada.',
  };
}

/** Contrasta los metadatos del cuerpo renderizado con la selección determinista. */
export function auditVida38WardrobeRendered38OE8B(plan: Vida38WardrobeCoherencePlan38OE8B,
  userData: Readonly<Record<string, unknown>>): { status: 'MATCH' | 'MISMATCH'; actualFamily: string; actualEngine: Vida38WardrobeEngine38OE8B | 'UNKNOWN' } {
  const actualFamily = String(userData['vida38ReptilianGarmentFamily38OE6'] ?? 'UNKNOWN');
  const hasSoft = typeof userData['vida38OrganicGarmentRevision38OE7C'] === 'string';
  const hasTech = typeof userData['vida38TechnicalGarmentRevision38OE8'] === 'string';
  const hasSuit = userData['vida38Full360Suit38OD5'] === true;
  const actualEngine: Vida38WardrobeEngine38OE8B | 'UNKNOWN' = hasSoft ? 'ORGANIC_SOFT_38OE7C'
    : hasTech ? 'TECHNICAL_ARMOR_38OE8A'
      : hasSuit ? 'TECH_SUIT_38OD5' : 'UNKNOWN';
  return {
    status: actualFamily === plan.family && actualEngine === plan.engine ? 'MATCH' : 'MISMATCH',
    actualFamily,
    actualEngine,
  };
}
