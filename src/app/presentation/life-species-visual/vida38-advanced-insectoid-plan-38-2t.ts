/**
 * GENESIS 38.2t — planes profesionales deterministas para INSECTOID / ADVANCED.
 * Usa la anatomía insectoide orgánica de 38.2q como REFERENCIA, pero conserva
 * un contrato, selección de vestuario y geometrías separados de VERY_ADVANCED.
 */
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import {
  deriveVida38CivilizedInsectoidPlan38Q,
  isVida38VeryAdvancedInsectoid38Q,
  type Vida38CivilizedInsectoidPlan38Q,
} from './vida38-civilized-insectoid-preview-38-2q';

export const VIDA38_ADV_INSECT_REVISION_38T = 'VIDA.38.2t/advanced-insectoids/v2-arms' as const;
export const VIDA38_ADV_INSECT_CULTURES_38T = [
  'BASILICA_TECHNOCRACY', 'STAR_KINGDOM', 'DUNE_MANDATE',
  'PELAGIC_CONCORD', 'FRONTIER_HEGEMONY', 'OBSIDIAN_CLAN',
] as const;
export const VIDA38_ADV_INSECT_ROLES_38T = [
  'SCIENTIST', 'MEDIC', 'ENGINEER', 'TECHNICIAN', 'EXPLORER', 'COLONIST',
  'SECURITY', 'ASTRONAUT', 'PILOT', 'DIPLOMAT', 'ADMINISTRATOR', 'ARCHIVIST',
] as const;
export const VIDA38_ADV_INSECT_WEAR_38T = [
  'CIVIL_UNIFORM', 'INDUSTRIAL_OVERALLS', 'SCIENTIFIC_COAT', 'COLONIAL_EXPLORER',
  'SECURITY_UNIFORM', 'ENVIRONMENTAL_EVA', 'DIPLOMATIC_FORMAL', 'AEROSPACE_FLIGHT',
] as const;
export type Vida38AdvancedInsectCulture38T = typeof VIDA38_ADV_INSECT_CULTURES_38T[number];
export type Vida38AdvancedInsectRole38T = typeof VIDA38_ADV_INSECT_ROLES_38T[number];
export type Vida38AdvancedInsectWear38T = typeof VIDA38_ADV_INSECT_WEAR_38T[number];
export type Vida38AdvancedInsectAccessory38T =
  'INSIGNIA' | 'TABLET' | 'TOOL_KIT' | 'SAMPLE_CASE' | 'VISOR' | 'FIELD_PACK' |
  'SHOULDER_RADIO' | 'CHEST_HARNESS' | 'MEDICAL_KIT' | 'BREATHING_MODULE' |
  'HELMET' | 'TACTICAL_POUCH';

export interface Vida38AdvancedInsectPlan38T {
  readonly revision: typeof VIDA38_ADV_INSECT_REVISION_38T;
  readonly speciesId: string;
  readonly archetype: Vida38CivilizedInsectoidPlan38Q['archetype'];
  readonly role: Vida38AdvancedInsectRole38T;
  readonly culture: Vida38AdvancedInsectCulture38T;
  readonly wear: Vida38AdvancedInsectWear38T;
  readonly accessories: readonly Vida38AdvancedInsectAccessory38T[];
  readonly wingPairs: number;
  readonly armCount: number;
  readonly stinger: Vida38CivilizedInsectoidPlan38Q['stinger'];
  readonly outerHex: string;
  readonly innerHex: string;
  readonly accentHex: string;
  readonly utilityHex: string;
  readonly garmentLength: number;
  readonly shoulderVolume: number;
  readonly shapeVariant: number;
  readonly signature: string;
}

export function vida38Hash38T(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619) >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b) >>> 0; h ^= h >>> 13;
  return h >>> 0;
}
const fraction = (seed: string) => vida38Hash38T(seed) / 4294967295;

export function isVida38AdvancedInsectoid38T(contract: Vida38SpeciesVisualContract): boolean {
  if (contract.morphology.group !== 'INSECTS') return false;
  const data = contract.intelligence as unknown as Record<string, unknown> | null;
  if (String(data?.['lineage'] ?? '').toUpperCase() !== 'INSECTOID') return false;
  if (isVida38VeryAdvancedInsectoid38Q(contract)) return false;
  const civilization = data?.['civilization'] as Record<string, unknown> | undefined;
  const society = data?.['society'] as Record<string, unknown> | undefined;
  const tier = String(data?.['civilizationTier'] ?? data?.['civilizationLevel'] ?? data?.['civilisationLevel'] ??
    data?.['societyLevel'] ?? data?.['civilizationStage'] ?? data?.['stage'] ??
    civilization?.['level'] ?? society?.['level'] ?? '').toUpperCase();
  return tier === 'ADVANCED';
}

/** Nunca se pasa el contrato original al renderer VERY_ADVANCED. Solo se usa una copia efímera
 * para reutilizar su geometría orgánica sin modificar datos del universo ni persistencia. */
export function anatomicalVida38AdvancedInsectContract38T(contract: Vida38SpeciesVisualContract): Vida38SpeciesVisualContract {
  if (!isVida38AdvancedInsectoid38T(contract)) throw new Error('38.2t: linaje/nivel incompatible');
  return {
    ...contract,
    morphology: {...contract.morphology,appendagePairs: Math.max(3,Math.min(4,Math.trunc(contract.morphology.appendagePairs)))},
    intelligence: {
      ...(contract.intelligence ?? {}),
      civilizationLevel: 'VERY_ADVANCED',
      civilizationTier: 'VERY_ADVANCED',
    } as unknown as NonNullable<Vida38SpeciesVisualContract['intelligence']>,
  };
}

const PREFERRED: Record<Vida38AdvancedInsectRole38T, Vida38AdvancedInsectWear38T> = {
  SCIENTIST: 'SCIENTIFIC_COAT', MEDIC: 'SCIENTIFIC_COAT',
  ENGINEER: 'INDUSTRIAL_OVERALLS', TECHNICIAN: 'INDUSTRIAL_OVERALLS',
  EXPLORER: 'COLONIAL_EXPLORER', COLONIST: 'COLONIAL_EXPLORER',
  SECURITY: 'SECURITY_UNIFORM', ASTRONAUT: 'ENVIRONMENTAL_EVA',
  PILOT: 'AEROSPACE_FLIGHT', DIPLOMAT: 'DIPLOMATIC_FORMAL',
  ADMINISTRATOR: 'CIVIL_UNIFORM', ARCHIVIST: 'CIVIL_UNIFORM',
};
const PALETTES: Record<Vida38AdvancedInsectCulture38T, readonly [string, string, string, string]> = {
  BASILICA_TECHNOCRACY: ['#58636d','#b6bec1','#c7ae80','#293e49'],
  STAR_KINGDOM: ['#555d78','#bcb9c7','#c4a677','#30334c'],
  DUNE_MANDATE: ['#8d7960','#c0b19b','#d5bf8e','#565044'],
  PELAGIC_CONCORD: ['#457c87','#accdd0','#9abfc2','#315461'],
  FRONTIER_HEGEMONY: ['#5c6c5b','#a9b5a4','#b8a17f','#313e38'],
  OBSIDIAN_CLAN: ['#444a52','#939da4','#9aa3a9','#292f36'],
};
const GEAR: Record<Vida38AdvancedInsectWear38T, readonly Vida38AdvancedInsectAccessory38T[]> = {
  CIVIL_UNIFORM: ['INSIGNIA','TABLET','SHOULDER_RADIO'],
  INDUSTRIAL_OVERALLS: ['TOOL_KIT','TACTICAL_POUCH','CHEST_HARNESS'],
  SCIENTIFIC_COAT: ['SAMPLE_CASE','VISOR','TABLET','MEDICAL_KIT'],
  COLONIAL_EXPLORER: ['FIELD_PACK','CHEST_HARNESS','SHOULDER_RADIO'],
  SECURITY_UNIFORM: ['TACTICAL_POUCH','CHEST_HARNESS','SHOULDER_RADIO','VISOR'],
  ENVIRONMENTAL_EVA: ['BREATHING_MODULE','HELMET','SHOULDER_RADIO'],
  DIPLOMATIC_FORMAL: ['INSIGNIA','TABLET','VISOR'],
  AEROSPACE_FLIGHT: ['HELMET','CHEST_HARNESS','SHOULDER_RADIO'],
};

export function deriveVida38AdvancedInsectPlan38T(contract: Vida38SpeciesVisualContract): Vida38AdvancedInsectPlan38T {
  const q = deriveVida38CivilizedInsectoidPlan38Q(anatomicalVida38AdvancedInsectContract38T(contract));
  const seed = `${contract.speciesId}|${contract.appearanceFingerprint}|${contract.variantSeedUint32}|38.2t`;
  const role = VIDA38_ADV_INSECT_ROLES_38T[vida38Hash38T(seed + '|role') % VIDA38_ADV_INSECT_ROLES_38T.length]!;
  const culture = VIDA38_ADV_INSECT_CULTURES_38T[vida38Hash38T(seed + '|culture') % VIDA38_ADV_INSECT_CULTURES_38T.length]!;
  const wear = PREFERRED[role];
  const colors = PALETTES[culture];
  const main = GEAR[wear];
  const accessories: Vida38AdvancedInsectAccessory38T[] = [main[0]!];
  const extra = main[1 + vida38Hash38T(seed + '|accessory') % (main.length - 1)]!;
  if (!accessories.includes(extra)) accessories.push(extra);
  if (role === 'MEDIC' && !accessories.includes('MEDICAL_KIT')) accessories.push('MEDICAL_KIT');
  const shapeVariant = vida38Hash38T(seed + '|silhouette') % 5;
  const garmentLength = .74 + fraction(seed + '|length') * .29;
  const shoulderVolume = .035 + fraction(seed + '|shoulders') * .090;
  const signature = [q.archetype,role,culture,wear,accessories.join('+'),q.armCount,q.wingPairs,
    q.stinger,shapeVariant,garmentLength.toFixed(5),shoulderVolume.toFixed(5),colors.join('')].join('|');
  return Object.freeze({revision:VIDA38_ADV_INSECT_REVISION_38T,speciesId:contract.speciesId,
    archetype:q.archetype,role,culture,wear,accessories:Object.freeze(accessories),
    wingPairs:q.wingPairs,armCount:q.armCount,stinger:q.stinger,
    outerHex:colors[0],innerHex:colors[1],accentHex:colors[2],utilityHex:colors[3],
    garmentLength,shoulderVolume,shapeVariant,signature});
}
