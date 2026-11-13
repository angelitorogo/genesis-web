import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';

export const VIDA38_PRIMITIVE_REPTILIAN_REVISION_38U = 'VIDA.38.2u/primitive-reptilians/v3-visible-diversity' as const;
export const VIDA38_PRIMITIVE_REPTILIAN_CULTURES_38U = [
  'BASILICA_TECHNOCRACY', 'STAR_KINGDOM', 'DUNE_MANDATE',
  'PELAGIC_CONCORD', 'FRONTIER_HEGEMONY', 'OBSIDIAN_CLAN',
] as const;
export const VIDA38_PRIMITIVE_REPTILIAN_ROLES_38U = [
  'HUNTER', 'SCOUT', 'WARRIOR', 'SHAMAN', 'GATHERER', 'HERDER',
  'CRAFTER', 'FISHER', 'ELDER', 'CHIEF', 'GUARD', 'TRADER',
] as const;
export const VIDA38_PRIMITIVE_REPTILIAN_WEAR_38U = [
  'LOINCLOTH_WRAP', 'HIDE_TUNIC', 'SHOULDER_MANTLE', 'HUNTER_STRAPS',
  'TRIBAL_SKIRT', 'WARRIOR_LEATHERS', 'SHAMAN_REGALIA', 'CHIEF_REGALIA',
] as const;
export type Vida38PrimitiveReptilianCulture38U = typeof VIDA38_PRIMITIVE_REPTILIAN_CULTURES_38U[number];
export type Vida38PrimitiveReptilianRole38U = typeof VIDA38_PRIMITIVE_REPTILIAN_ROLES_38U[number];
export type Vida38PrimitiveReptilianWear38U = typeof VIDA38_PRIMITIVE_REPTILIAN_WEAR_38U[number];
export type Vida38PrimitiveReptilianAccessory38U =
  'BONE_NECKLACE' | 'BEAD_NECKLACE' | 'HIDE_POUCH' | 'TOTEM' | 'FEATHER_BAND' |
  'BONE_DAGGER' | 'WATER_GOURD' | 'SATCHEL' | 'WRIST_BINDINGS' | 'SHIN_BINDINGS';

export interface Vida38PrimitiveReptilianPlan38U {
  readonly revision: typeof VIDA38_PRIMITIVE_REPTILIAN_REVISION_38U;
  readonly speciesId: string;
  readonly role: Vida38PrimitiveReptilianRole38U;
  readonly culture: Vida38PrimitiveReptilianCulture38U;
  readonly wear: Vida38PrimitiveReptilianWear38U;
  readonly accessories: readonly Vida38PrimitiveReptilianAccessory38U[];
  readonly silhouette: 'LITHE' | 'ROBUST' | 'TALL';
  readonly crest: 'NONE' | 'SHORT' | 'TALL';
  readonly tail: 'SHORT' | 'LONG';
  readonly outerHex: string;
  readonly innerHex: string;
  readonly accentHex: string;
  readonly skinMixHex: string;
  readonly garmentLength: number;
  readonly shoulderScale: number;
  readonly visual: Readonly<{
    silhouetteFamily: string;
    torsoCoverage: 'OPEN' | 'PARTIAL' | 'WRAPPED';
    shoulderCoverage: 'BARE' | 'STRAPPED' | 'MANTLED';
    visibleOrnaments: number;
    collar: boolean;
    headpiece: boolean;
    beltDecor: boolean;
    satchel: boolean;
    staff: boolean;
  }>;
  readonly signature: string;
}

const PREFERRED: Record<Vida38PrimitiveReptilianRole38U, Vida38PrimitiveReptilianWear38U> = {
  HUNTER: 'HUNTER_STRAPS',
  SCOUT: 'LOINCLOTH_WRAP',
  WARRIOR: 'WARRIOR_LEATHERS',
  SHAMAN: 'SHAMAN_REGALIA',
  GATHERER: 'TRIBAL_SKIRT',
  HERDER: 'HIDE_TUNIC',
  CRAFTER: 'HIDE_TUNIC',
  FISHER: 'LOINCLOTH_WRAP',
  ELDER: 'SHOULDER_MANTLE',
  CHIEF: 'CHIEF_REGALIA',
  GUARD: 'WARRIOR_LEATHERS',
  TRADER: 'SHOULDER_MANTLE',
};

const PALETTES: Record<Vida38PrimitiveReptilianCulture38U, readonly [string, string, string]> = {
  BASILICA_TECHNOCRACY: ['#836e54', '#bba98c', '#d1c29d'],
  STAR_KINGDOM: ['#7a6452', '#c0a37c', '#d8caad'],
  DUNE_MANDATE: ['#8f7658', '#c6ae8b', '#e1cf9f'],
  PELAGIC_CONCORD: ['#6c7164', '#aeb79f', '#b8d0bd'],
  FRONTIER_HEGEMONY: ['#6d584c', '#b08e78', '#d1b79d'],
  OBSIDIAN_CLAN: ['#5d5450', '#9f8e84', '#c4b4aa'],
};

const ACCESSORY_SETS: Record<Vida38PrimitiveReptilianWear38U, readonly Vida38PrimitiveReptilianAccessory38U[]> = {
  LOINCLOTH_WRAP: ['WRIST_BINDINGS', 'SHIN_BINDINGS', 'WATER_GOURD'],
  HIDE_TUNIC: ['HIDE_POUCH', 'WRIST_BINDINGS', 'SATCHEL'],
  SHOULDER_MANTLE: ['BEAD_NECKLACE', 'SATCHEL', 'HIDE_POUCH'],
  HUNTER_STRAPS: ['BONE_DAGGER', 'HIDE_POUCH', 'WATER_GOURD'],
  TRIBAL_SKIRT: ['WRIST_BINDINGS', 'SATCHEL', 'BEAD_NECKLACE'],
  WARRIOR_LEATHERS: ['BONE_DAGGER', 'WRIST_BINDINGS', 'SHIN_BINDINGS'],
  SHAMAN_REGALIA: ['TOTEM', 'FEATHER_BAND', 'BONE_NECKLACE'],
  CHIEF_REGALIA: ['BEAD_NECKLACE', 'TOTEM', 'FEATHER_BAND'],
};

export function vida38PrimitiveHash38U(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619) >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b) >>> 0; h ^= h >>> 13;
  return h >>> 0;
}
const fraction = (seed: string) => vida38PrimitiveHash38U(seed) / 4294967295;
function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 255, ag = (pa >> 8) & 255, ab = pa & 255;
  const br = (pb >> 16) & 255, bg = (pb >> 8) & 255, bb = pb & 255;
  const rr = Math.round(ar + (br - ar) * t), rg = Math.round(ag + (bg - ag) * t), rb = Math.round(ab + (bb - ab) * t);
  return `#${((rr << 16) | (rg << 8) | rb).toString(16).padStart(6, '0')}`;
}

export function isVida38PrimitiveReptilian38U(contract: Vida38SpeciesVisualContract): boolean {
  if (contract.morphology.group !== 'REPTILES') return false;
  const data = contract.intelligence as unknown as Record<string, unknown> | null;
  if (String(data?.['lineage'] ?? '').toUpperCase() !== 'REPTILIAN') return false;
  const tier = String(
    data?.['civilizationTier'] ?? data?.['civilizationLevel'] ?? data?.['civilisationLevel'] ??
    data?.['societyLevel'] ?? data?.['civilizationStage'] ?? data?.['stage'] ?? ''
  ).toUpperCase();
  return tier === 'PRIMITIVE';
}

export function deriveVida38PrimitiveReptilianPlan38U(contract: Vida38SpeciesVisualContract): Vida38PrimitiveReptilianPlan38U {
  const seed = `${contract.speciesId}|${contract.appearanceFingerprint}|${contract.variantSeedUint32}|38.2u`;
  const role = VIDA38_PRIMITIVE_REPTILIAN_ROLES_38U[vida38PrimitiveHash38U(seed + '|role') % VIDA38_PRIMITIVE_REPTILIAN_ROLES_38U.length]!;
  const culture = VIDA38_PRIMITIVE_REPTILIAN_CULTURES_38U[vida38PrimitiveHash38U(seed + '|culture') % VIDA38_PRIMITIVE_REPTILIAN_CULTURES_38U.length]!;
  const wear = PREFERRED[role];
  const accPool = ACCESSORY_SETS[wear];
  const accessories: Vida38PrimitiveReptilianAccessory38U[] = [accPool[0]!];
  const second = accPool[1 + (vida38PrimitiveHash38U(seed + '|acc-2') % (accPool.length - 1))]!;
  if (!accessories.includes(second)) accessories.push(second);
  const third = accPool[1 + (vida38PrimitiveHash38U(seed + '|acc-3') % (accPool.length - 1))]!;
  if (!accessories.includes(third)) accessories.push(third);
  if (role === 'SHAMAN' && !accessories.includes('TOTEM')) accessories.push('TOTEM');
  if (role === 'CHIEF' && !accessories.includes('FEATHER_BAND')) accessories.push('FEATHER_BAND');
  if (role in { 'WARRIOR':1, 'GUARD':1, 'HUNTER':1 } && !accessories.includes('BONE_DAGGER')) accessories.push('BONE_DAGGER');
  const colors = PALETTES[culture];
  const silhouette = (['LITHE', 'ROBUST', 'TALL'] as const)[vida38PrimitiveHash38U(seed + '|silhouette') % 3]!;
  const crest = (['NONE', 'SHORT', 'TALL'] as const)[vida38PrimitiveHash38U(seed + '|crest') % 3]!;
  const tail = (['SHORT', 'LONG'] as const)[vida38PrimitiveHash38U(seed + '|tail') % 2]!;
  const garmentLength = 0.72 + fraction(seed + '|length') * 0.36;
  const shoulderScale = 0.92 + fraction(seed + '|shoulder') * 0.22;
  const skinMixHex = mixHex(contract.pigmentation.primaryColorHex, contract.pigmentation.secondaryColorHex, 0.38);
  const visual = Object.freeze({
    silhouetteFamily:wear,
    torsoCoverage:wear==='HIDE_TUNIC'||wear==='CHIEF_REGALIA'?'WRAPPED' as const:
      wear==='SHOULDER_MANTLE'||wear==='WARRIOR_LEATHERS'||wear==='SHAMAN_REGALIA'?'PARTIAL' as const:'OPEN' as const,
    shoulderCoverage:wear==='SHOULDER_MANTLE'||wear==='SHAMAN_REGALIA'||wear==='CHIEF_REGALIA'?'MANTLED' as const:
      wear==='HUNTER_STRAPS'||wear==='WARRIOR_LEATHERS'?'STRAPPED' as const:'BARE' as const,
    visibleOrnaments:accessories.length+(wear==='CHIEF_REGALIA'?8:wear==='SHAMAN_REGALIA'?10:wear==='WARRIOR_LEATHERS'?5:wear==='HUNTER_STRAPS'?3:0),
    collar:accessories.includes('BONE_NECKLACE')||accessories.includes('BEAD_NECKLACE')||wear==='SHAMAN_REGALIA'||wear==='CHIEF_REGALIA',
    headpiece:wear==='SHAMAN_REGALIA'||wear==='CHIEF_REGALIA'||accessories.includes('FEATHER_BAND'),
    beltDecor:wear==='TRIBAL_SKIRT'||wear==='SHAMAN_REGALIA'||wear==='CHIEF_REGALIA'||wear==='WARRIOR_LEATHERS',
    satchel:wear==='HUNTER_STRAPS'||wear==='CHIEF_REGALIA'||accessories.includes('HIDE_POUCH')||accessories.includes('SATCHEL'),
    staff:accessories.includes('TOTEM'),
  });
  const signature = [role, culture, wear, accessories.join('+'), silhouette, crest, tail,
    JSON.stringify(visual),
    garmentLength.toFixed(5), shoulderScale.toFixed(5), colors.join('|'), skinMixHex].join('|');
  return Object.freeze({
    revision: VIDA38_PRIMITIVE_REPTILIAN_REVISION_38U,
    speciesId: contract.speciesId,
    role, culture, wear, accessories: Object.freeze(accessories),
    silhouette, crest, tail,
    outerHex: colors[0], innerHex: colors[1], accentHex: colors[2], skinMixHex,
    garmentLength, shoulderScale, visual, signature,
  });
}
