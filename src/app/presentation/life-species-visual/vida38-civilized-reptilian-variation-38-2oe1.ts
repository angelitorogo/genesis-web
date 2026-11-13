/** Selección procedural pura: separa las dimensiones y mezcla los bits bajos del hash.
 * No usa Math.random(), estado global ni orden de enumeración del catálogo. */
export const REPTILIAN_PROFILES_38OE1 = [
  'LITHE_SCOUT', 'ROBUST_SENTINEL', 'CREST_SCHOLAR',
  'AMPHIBIOUS_DIPLOMAT', 'LONGNECK_SEER', 'BRACHYCEPHALIC_GUARD',
  'HORNED_WARLORD', 'PLATED_TITAN',
  'EXTREME_DIGITIGRADE_HUNTER', 'MARSH_ORACLE',
] as const;
export const REPTILIAN_GARMENTS_38OE1 = [
  'SCIENTIST', 'MILITARY', 'NOBLE', 'EXPLORER',
  'TECHNO_PRIEST', 'INDUSTRIAL_COLONIZER',
] as const;
export const REPTILIAN_CULTURES_38OE1 = [
  'STAR_KINGDOM', 'BASILICA_TECHNOCRACY', 'FRONTIER_HEGEMONY',
  'PELAGIC_CONCORD', 'DUNE_MANDATE', 'OBSIDIAN_CLAN',
] as const;

function fnv1a32(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash = Math.imul(hash ^ value.charCodeAt(i), 16777619) >>> 0;
  }
  return hash >>> 0;
}
/** Finalización avalanche de 32 bits; evita sesgos FNV en módulo pequeño. */
function avalanche32(hash: number): number {
  let h = hash >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}
export interface Vida38ReptilianVariation38OE1 {
  readonly profile: typeof REPTILIAN_PROFILES_38OE1[number];
  readonly garmentLine: typeof REPTILIAN_GARMENTS_38OE1[number];
  readonly culture: typeof REPTILIAN_CULTURES_38OE1[number];
  readonly anatomySeed: number;
}
export function selectVida38ReptilianVariation38OE1(
  speciesId: string,
  appearanceFingerprint: string,
): Vida38ReptilianVariation38OE1 {
  const identity = `${speciesId}|${appearanceFingerprint}|38.2oe1`;
  const anatomySeed = avalanche32(fnv1a32(`ANATOMY|${identity}`));
  const garmentSeed = avalanche32(fnv1a32(`GARMENT|${identity}`));
  const cultureSeed = avalanche32(fnv1a32(`CULTURE|${identity}`));
  return {
    profile: REPTILIAN_PROFILES_38OE1[anatomySeed % REPTILIAN_PROFILES_38OE1.length]!,
    garmentLine: REPTILIAN_GARMENTS_38OE1[garmentSeed % REPTILIAN_GARMENTS_38OE1.length]!,
    culture: REPTILIAN_CULTURES_38OE1[cultureSeed % REPTILIAN_CULTURES_38OE1.length]!,
    anatomySeed,
  };
}
export function hasReptilianOrnaments38OE1(profile: typeof REPTILIAN_PROFILES_38OE1[number]): boolean {
  return profile === 'ROBUST_SENTINEL'
    || profile === 'AMPHIBIOUS_DIPLOMAT'
    || profile === 'BRACHYCEPHALIC_GUARD'
    || profile === 'HORNED_WARLORD'
    || profile === 'PLATED_TITAN'
    || profile === 'MARSH_ORACLE';
}
