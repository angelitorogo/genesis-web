/**
 * GENESIS · VIDA.38.2o.e9 — diversidad cultural y validación visual.
 * Capa determinista que combina familia de prenda, longitud, silueta,
 * materialidad, ornamentación y énfasis accesorial para reforzar la lectura
 * visual total sin tocar persistencia ni el universo generado.
 */
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import type {
  Vida38CivilizedReptilianCulture38OE,
  Vida38CivilizedReptilianGarmentFamily38OE6,
  Vida38CivilizedReptilianGarmentLine38OE,
  Vida38CivilizedReptilianProfile38OD,
} from './vida38-civilized-reptilian-preview-38-2o';
import { selectVida38ReptilianVariation38OE1 } from './vida38-civilized-reptilian-variation-38-2oe1';
import { deriveVida38ReptilianAccessoryPlan38OE3 } from './vida38-civilized-reptilian-accessories-38-2oe3';
import { deriveVida38WardrobeCoherencePlan38OE8B } from './vida38-reptilian-wardrobe-coherence-38-2oe8b';

export const VIDA38_CULTURAL_DIVERSITY_REVISION_38OE9 = 'VIDA.38.2o.e9/cultural-diversity/v1' as const;

export type Vida38CulturalLength38OE9 = 'SHORT' | 'MID' | 'KNEE' | 'BELOW_KNEE' | 'LONG' | 'LAYERED_LONG';
export type Vida38CulturalSilhouette38OE9 =
  | 'FITTED'
  | 'STRAIGHT'
  | 'SEGMENTED'
  | 'WRAPPED'
  | 'DRAPED'
  | 'REGAL'
  | 'LAYERED'
  | 'ARMORED';
export type Vida38CulturalMaterial38OE9 =
  | 'CEREMONIAL_TEXTILE'
  | 'TECH_WEAVE'
  | 'FLEX_INDUSTRIAL'
  | 'POLISHED_METAL'
  | 'MATTE_COMPOSITE'
  | 'BIO_MEMBRANE'
  | 'RITUAL_STONEWEAVE';
export type Vida38CulturalAdornment38OE9 = 'MINIMAL' | 'TRIMMED' | 'ORNATE' | 'INSCRIBED' | 'LUMINOUS';
export type Vida38CulturalAccessoryBias38OE9 = 'SCIENTIFIC' | 'NOBLE' | 'CEREMONIAL' | 'TACTICAL' | 'INDUSTRIAL' | 'PELAGIC';

export interface Vida38CulturalDiversityPlan38OE9 {
  readonly revision: typeof VIDA38_CULTURAL_DIVERSITY_REVISION_38OE9;
  readonly speciesId: string;
  readonly profile: Vida38CivilizedReptilianProfile38OD;
  readonly garmentLine: Vida38CivilizedReptilianGarmentLine38OE;
  readonly culture: Vida38CivilizedReptilianCulture38OE;
  readonly garmentFamily: Vida38CivilizedReptilianGarmentFamily38OE6;
  readonly length: Vida38CulturalLength38OE9;
  readonly silhouette: Vida38CulturalSilhouette38OE9;
  readonly material: Vida38CulturalMaterial38OE9;
  readonly adornment: Vida38CulturalAdornment38OE9;
  readonly accessoryBias: Vida38CulturalAccessoryBias38OE9;
  readonly ornamentalLayers: 1 | 2 | 3;
  readonly notes: string;
  readonly visualSignature: string;
}

export interface Vida38CulturalDiversityAudit38OE9 {
  readonly count: number;
  readonly uniqueCultures: number;
  readonly uniqueProfiles: number;
  readonly uniqueGarmentLines: number;
  readonly uniqueFamilies: number;
  readonly uniqueLengths: number;
  readonly uniqueSilhouettes: number;
  readonly uniqueMaterials: number;
  readonly uniqueAdornments: number;
  readonly uniqueAccessoryBiases: number;
  readonly uniqueVisualSignatures: number;
}

function hash32(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

function pick<T>(seed: number, values: readonly T[]): T {
  return values[(seed >>> 0) % values.length]!;
}

function cultureDefaults(culture: Vida38CivilizedReptilianCulture38OE): {
  silhouette: readonly Vida38CulturalSilhouette38OE9[];
  material: readonly Vida38CulturalMaterial38OE9[];
  adornment: readonly Vida38CulturalAdornment38OE9[];
  accessoryBias: Vida38CulturalAccessoryBias38OE9;
  notes: string;
} {
  switch (culture) {
    case 'BASILICA_TECHNOCRACY':
      return {
        silhouette: ['STRAIGHT', 'LAYERED', 'REGAL'],
        material: ['CEREMONIAL_TEXTILE', 'RITUAL_STONEWEAVE', 'TECH_WEAVE'],
        adornment: ['INSCRIBED', 'LUMINOUS', 'ORNATE'],
        accessoryBias: 'CEREMONIAL',
        notes: 'Tecnorreligioso solemne, jerárquico y axial.',
      };
    case 'PELAGIC_CONCORD':
      return {
        silhouette: ['DRAPED', 'WRAPPED', 'LAYERED'],
        material: ['BIO_MEMBRANE', 'TECH_WEAVE', 'CEREMONIAL_TEXTILE'],
        adornment: ['LUMINOUS', 'TRIMMED', 'ORNATE'],
        accessoryBias: 'PELAGIC',
        notes: 'Fluido, membranoso, elegante y acuático.',
      };
    case 'DUNE_MANDATE':
      return {
        silhouette: ['WRAPPED', 'STRAIGHT', 'SEGMENTED'],
        material: ['FLEX_INDUSTRIAL', 'MATTE_COMPOSITE', 'TECH_WEAVE'],
        adornment: ['MINIMAL', 'TRIMMED', 'INSCRIBED'],
        accessoryBias: 'INDUSTRIAL',
        notes: 'Funcional, resistente y colonial.',
      };
    case 'STAR_KINGDOM':
      return {
        silhouette: ['REGAL', 'LAYERED', 'DRAPED'],
        material: ['CEREMONIAL_TEXTILE', 'POLISHED_METAL', 'TECH_WEAVE'],
        adornment: ['ORNATE', 'LUMINOUS', 'TRIMMED'],
        accessoryBias: 'NOBLE',
        notes: 'Noble, ceremonial y de presencia regia.',
      };
    case 'FRONTIER_HEGEMONY':
      return {
        silhouette: ['ARMORED', 'SEGMENTED', 'FITTED'],
        material: ['MATTE_COMPOSITE', 'POLISHED_METAL', 'FLEX_INDUSTRIAL'],
        adornment: ['MINIMAL', 'TRIMMED', 'LUMINOUS'],
        accessoryBias: 'TACTICAL',
        notes: 'Militar, robusto y expansionista.',
      };
    case 'OBSIDIAN_CLAN':
    default:
      return {
        silhouette: ['STRAIGHT', 'ARMORED', 'WRAPPED'],
        material: ['RITUAL_STONEWEAVE', 'MATTE_COMPOSITE', 'CEREMONIAL_TEXTILE'],
        adornment: ['MINIMAL', 'INSCRIBED', 'TRIMMED'],
        accessoryBias: 'CEREMONIAL',
        notes: 'Sobrio, severo, oscuro y ritualizado.',
      };
  }
}

function lineDefaults(line: Vida38CivilizedReptilianGarmentLine38OE): {
  length: readonly Vida38CulturalLength38OE9[];
  silhouette: readonly Vida38CulturalSilhouette38OE9[];
  material: readonly Vida38CulturalMaterial38OE9[];
  adornment: readonly Vida38CulturalAdornment38OE9[];
  accessoryBias: Vida38CulturalAccessoryBias38OE9;
} {
  switch (line) {
    case 'SCIENTIST':
      return {
        length: ['MID', 'KNEE', 'BELOW_KNEE'],
        silhouette: ['FITTED', 'STRAIGHT', 'LAYERED'],
        material: ['TECH_WEAVE', 'CEREMONIAL_TEXTILE', 'BIO_MEMBRANE'],
        adornment: ['TRIMMED', 'LUMINOUS', 'MINIMAL'],
        accessoryBias: 'SCIENTIFIC',
      };
    case 'MILITARY':
      return {
        length: ['SHORT', 'MID', 'KNEE'],
        silhouette: ['ARMORED', 'SEGMENTED', 'FITTED'],
        material: ['POLISHED_METAL', 'MATTE_COMPOSITE', 'FLEX_INDUSTRIAL'],
        adornment: ['MINIMAL', 'TRIMMED', 'LUMINOUS'],
        accessoryBias: 'TACTICAL',
      };
    case 'NOBLE':
      return {
        length: ['KNEE', 'LONG', 'LAYERED_LONG'],
        silhouette: ['REGAL', 'DRAPED', 'LAYERED'],
        material: ['CEREMONIAL_TEXTILE', 'POLISHED_METAL', 'BIO_MEMBRANE'],
        adornment: ['ORNATE', 'LUMINOUS', 'TRIMMED'],
        accessoryBias: 'NOBLE',
      };
    case 'EXPLORER':
      return {
        length: ['SHORT', 'MID', 'KNEE'],
        silhouette: ['SEGMENTED', 'FITTED', 'WRAPPED'],
        material: ['TECH_WEAVE', 'FLEX_INDUSTRIAL', 'MATTE_COMPOSITE'],
        adornment: ['MINIMAL', 'TRIMMED', 'LUMINOUS'],
        accessoryBias: 'TACTICAL',
      };
    case 'TECHNO_PRIEST':
      return {
        length: ['KNEE', 'BELOW_KNEE', 'LONG'],
        silhouette: ['STRAIGHT', 'LAYERED', 'REGAL'],
        material: ['RITUAL_STONEWEAVE', 'CEREMONIAL_TEXTILE', 'TECH_WEAVE'],
        adornment: ['INSCRIBED', 'LUMINOUS', 'ORNATE'],
        accessoryBias: 'CEREMONIAL',
      };
    case 'INDUSTRIAL_COLONIZER':
    default:
      return {
        length: ['SHORT', 'MID', 'KNEE'],
        silhouette: ['SEGMENTED', 'WRAPPED', 'STRAIGHT'],
        material: ['FLEX_INDUSTRIAL', 'MATTE_COMPOSITE', 'TECH_WEAVE'],
        adornment: ['MINIMAL', 'TRIMMED', 'INSCRIBED'],
        accessoryBias: 'INDUSTRIAL',
      };
  }
}

function familyDefaults(family: Vida38CivilizedReptilianGarmentFamily38OE6): {
  length: readonly Vida38CulturalLength38OE9[];
  silhouette: readonly Vida38CulturalSilhouette38OE9[];
  material: readonly Vida38CulturalMaterial38OE9[];
  adornment: readonly Vida38CulturalAdornment38OE9[];
  minLayers: 1 | 2 | 3;
} {
  switch (family) {
    case 'TECH_SUIT':
      return {
        length: ['SHORT', 'MID', 'KNEE'],
        silhouette: ['FITTED', 'SEGMENTED'],
        material: ['TECH_WEAVE', 'MATTE_COMPOSITE'],
        adornment: ['LUMINOUS', 'TRIMMED', 'MINIMAL'],
        minLayers: 1,
      };
    case 'CEREMONIAL_ROBES':
      return {
        length: ['KNEE', 'BELOW_KNEE', 'LONG'],
        silhouette: ['STRAIGHT', 'LAYERED', 'REGAL'],
        material: ['CEREMONIAL_TEXTILE', 'RITUAL_STONEWEAVE'],
        adornment: ['INSCRIBED', 'ORNATE', 'LUMINOUS'],
        minLayers: 2,
      };
    case 'SEGMENTED_ARMOR':
      return {
        length: ['SHORT', 'MID', 'KNEE'],
        silhouette: ['ARMORED', 'SEGMENTED'],
        material: ['POLISHED_METAL', 'MATTE_COMPOSITE'],
        adornment: ['TRIMMED', 'LUMINOUS', 'MINIMAL'],
        minLayers: 1,
      };
    case 'NOBLE_REGALIA':
      return {
        length: ['KNEE', 'LONG', 'LAYERED_LONG'],
        silhouette: ['REGAL', 'DRAPED', 'LAYERED'],
        material: ['CEREMONIAL_TEXTILE', 'POLISHED_METAL', 'BIO_MEMBRANE'],
        adornment: ['ORNATE', 'LUMINOUS', 'TRIMMED'],
        minLayers: 2,
      };
    case 'COLONIAL_RIG':
      return {
        length: ['SHORT', 'MID', 'KNEE'],
        silhouette: ['SEGMENTED', 'WRAPPED', 'FITTED'],
        material: ['FLEX_INDUSTRIAL', 'MATTE_COMPOSITE', 'TECH_WEAVE'],
        adornment: ['MINIMAL', 'TRIMMED', 'LUMINOUS'],
        minLayers: 1,
      };
    case 'PELAGIC_DRAPE':
    default:
      return {
        length: ['BELOW_KNEE', 'LONG', 'LAYERED_LONG'],
        silhouette: ['DRAPED', 'WRAPPED', 'LAYERED'],
        material: ['BIO_MEMBRANE', 'CEREMONIAL_TEXTILE', 'TECH_WEAVE'],
        adornment: ['LUMINOUS', 'TRIMMED', 'ORNATE'],
        minLayers: 2,
      };
  }
}

export function deriveVida38CulturalDiversityPlan38OE9(contract: Vida38SpeciesVisualContract): Vida38CulturalDiversityPlan38OE9 {
  const variation = selectVida38ReptilianVariation38OE1(contract.speciesId, contract.appearanceFingerprint);
  const wardrobe = deriveVida38WardrobeCoherencePlan38OE8B(contract);
  const accessory = deriveVida38ReptilianAccessoryPlan38OE3({
    speciesId: contract.speciesId,
    appearanceFingerprint: contract.appearanceFingerprint,
    profile: variation.profile,
    garmentLine: variation.garmentLine,
    culture: variation.culture,
  });
  const baseSeed = hash32(`${contract.speciesId}|${contract.appearanceFingerprint}|${variation.profile}|${wardrobe.family}|38oe9`);
  const cultural = cultureDefaults(variation.culture);
  const line = lineDefaults(variation.garmentLine);
  const family = familyDefaults(wardrobe.family);

  const length = pick(baseSeed ^ 0x91e10da5, [...family.length, ...line.length]);
  const silhouette = pick(baseSeed ^ 0x6e624eb7, [...family.silhouette, ...cultural.silhouette, ...line.silhouette]);
  const material = pick(baseSeed ^ 0x7f4a7c15, [...family.material, ...cultural.material, ...line.material]);
  const adornment = pick(baseSeed ^ 0x5b6df74d, [...family.adornment, ...cultural.adornment, ...line.adornment]);
  const accessoryBias = ((): Vida38CulturalAccessoryBias38OE9 => {
    if (accessory.handheld === 'SCEPTER' || accessory.handheld === 'STAFF') return 'CEREMONIAL';
    if (accessory.handheld === 'DATA_ROD') return 'SCIENTIFIC';
    if (accessory.handheld === 'NONE' && variation.garmentLine === 'NOBLE') return 'NOBLE';
    if (variation.garmentLine === 'INDUSTRIAL_COLONIZER') return 'INDUSTRIAL';
    if (variation.garmentLine === 'MILITARY' || variation.garmentLine === 'EXPLORER') return 'TACTICAL';
    return cultural.accessoryBias || line.accessoryBias;
  })();
  const ornamentalLayers = Math.max(family.minLayers, 1 + ((baseSeed >>> 3) % 3)) as 1 | 2 | 3;
  const notes = `${cultural.notes} Rol ${variation.garmentLine}; perfil ${variation.profile}; accesorios ${accessory.eyewear}/${accessory.handheld}.`;
  const visualSignature = [variation.culture, variation.garmentLine, variation.profile, wardrobe.family,
    length, silhouette, material, adornment, accessoryBias, ornamentalLayers].join('|');

  return {
    revision: VIDA38_CULTURAL_DIVERSITY_REVISION_38OE9,
    speciesId: contract.speciesId,
    profile: variation.profile,
    garmentLine: variation.garmentLine,
    culture: variation.culture,
    garmentFamily: wardrobe.family,
    length,
    silhouette,
    material,
    adornment,
    accessoryBias,
    ornamentalLayers,
    notes,
    visualSignature,
  };
}

export function auditVida38CulturalDiversity38OE9(contracts: readonly Vida38SpeciesVisualContract[]): Vida38CulturalDiversityAudit38OE9 {
  const plans = contracts.map(deriveVida38CulturalDiversityPlan38OE9);
  return {
    count: plans.length,
    uniqueCultures: new Set(plans.map(plan => plan.culture)).size,
    uniqueProfiles: new Set(plans.map(plan => plan.profile)).size,
    uniqueGarmentLines: new Set(plans.map(plan => plan.garmentLine)).size,
    uniqueFamilies: new Set(plans.map(plan => plan.garmentFamily)).size,
    uniqueLengths: new Set(plans.map(plan => plan.length)).size,
    uniqueSilhouettes: new Set(plans.map(plan => plan.silhouette)).size,
    uniqueMaterials: new Set(plans.map(plan => plan.material)).size,
    uniqueAdornments: new Set(plans.map(plan => plan.adornment)).size,
    uniqueAccessoryBiases: new Set(plans.map(plan => plan.accessoryBias)).size,
    uniqueVisualSignatures: new Set(plans.map(plan => plan.visualSignature)).size,
  };
}
