/** GENESIS 38.2r: identidad visual de civilizaciones humanoides MUY AVANZADAS.
 * Contrato 38.1 inalterado. Todas las decisiones son hipótesis visuales CT-0.
 * Sin Three.js, almacenamiento ni aleatoriedad global. */
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';

export const VIDA38_CIV_HUMANOID_REVISION_38R = 'VIDA.38.2r/civilized-humanoids/v1' as const;
export const VIDA38_HUMANOID_ARCHETYPES_38R = [
  'LITHE_DIPLOMAT','ROBUST_COLONIST','ATHLETIC_VANGUARD','LONGNECK_SEER',
  'COMPACT_ENGINEER','REGAL_HIGHBORN','TALL_ARCHIVIST','BROAD_SENTINEL',
  'PELAGIC_ENVOY','ASCETIC_ORACLE',
] as const;
export const VIDA38_HUMANOID_CULTURES_38R = [
  'BASILICA_TECHNOCRACY','STAR_KINGDOM','DUNE_MANDATE',
  'PELAGIC_CONCORD','FRONTIER_HEGEMONY','OBSIDIAN_CLAN',
] as const;
export const VIDA38_HUMANOID_ROLES_38R = [
  'SCIENTIST','MILITARY','NOBLE','DIPLOMAT',
  'EXPLORER','TECHNO_PRIEST','COLONIZER','ARCHIVIST',
] as const;
export const VIDA38_HUMANOID_GARMENTS_38R = [
  'CEREMONIAL_TUNIC','NOBLE_MANTLE','TECHNO_HABIT','TECH_SUIT',
  'ANATOMIC_ARMOR','DIPLOMATIC_DRAPE','SCIENTIFIC_COAT','COLONIAL_GEAR',
  'ROYAL_REGALIA','ELITE_UNIFORM',
] as const;
export type Vida38HumanoidArchetype38R = typeof VIDA38_HUMANOID_ARCHETYPES_38R[number];
export type Vida38HumanoidCulture38R = typeof VIDA38_HUMANOID_CULTURES_38R[number];
export type Vida38HumanoidRole38R = typeof VIDA38_HUMANOID_ROLES_38R[number];
export type Vida38HumanoidGarment38R = typeof VIDA38_HUMANOID_GARMENTS_38R[number];
export type Vida38HumanoidAccessory38R = 'VISOR'|'MONOCLE'|'CROWN'|'DIADEM'|'DATA_STAFF'|'SCEPTER'|'WRIST_MODULE'|'HOLO_ORB'|'NONE';
export type Vida38HumanoidMaterial38R = 'FLEXWEAVE'|'BIOCERAMIC'|'CEREMONIAL_FIBER'|'MATTE_ALLOY'|'PEARL_MEMBRANE'|'LUMEN_SILK';

export interface Vida38CivilHumanoidPlan38R {
  readonly revision: typeof VIDA38_CIV_HUMANOID_REVISION_38R;
  readonly speciesId: string;
  readonly archetype: Vida38HumanoidArchetype38R;
  readonly culture: Vida38HumanoidCulture38R;
  readonly role: Vida38HumanoidRole38R;
  readonly garment: Vida38HumanoidGarment38R;
  readonly accessory: Vida38HumanoidAccessory38R;
  readonly secondAccessory: Vida38HumanoidAccessory38R;
  readonly material: Vida38HumanoidMaterial38R;
  readonly bodyWidth: number;
  readonly shoulderScale: number;
  readonly headScale: number;
  readonly legScale: number;
  readonly neckScale: number;
  readonly garmentLength: number;
  readonly hemFlare: number;
  readonly layerCount: number;
  readonly ornament: 'MINIMAL'|'RITUAL'|'GLYPHIC'|'LUMINOUS'|'HERALDIC';
  readonly primaryHex: string;
  readonly secondaryHex: string;
  readonly accentHex: string;
  readonly signature: string;
}

export function vida38Hash38R(s:string):number{
  let h=2166136261;
  for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619)>>>0;
  h^=h>>>16; h=Math.imul(h,0x85ebca6b)>>>0; h^=h>>>13;
  return h>>>0;
}
function unit(seed:string,channel:string):number{return vida38Hash38R(seed+'|'+channel)/4294967295;}
function pick<T>(items:readonly T[],seed:string,salt:string):T{return items[Math.min(items.length-1,Math.floor(unit(seed,salt)*items.length))]!;}
function blend(a:number,b:number,t:number):number{return a+(b-a)*t;}

/** Intencionadamente no interpreta inteligencias simplemente hipotéticas ni ADVANCED. */
export function isVida38VeryAdvancedHumanoid38R(contract:Vida38SpeciesVisualContract):boolean{
  if(contract.morphology.group!=='HUMANOIDS')return false;
  const intel=contract.intelligence;
  return !!intel && intel.lineage==='HUMANOID' && intel.civilizationTier==='VERY_ADVANCED';
}
const roleGarments:Record<Vida38HumanoidRole38R,readonly Vida38HumanoidGarment38R[]> = {
  SCIENTIST:['SCIENTIFIC_COAT','TECH_SUIT','DIPLOMATIC_DRAPE'],
  MILITARY:['ANATOMIC_ARMOR','ELITE_UNIFORM','COLONIAL_GEAR'],
  NOBLE:['NOBLE_MANTLE','ROYAL_REGALIA','CEREMONIAL_TUNIC'],
  DIPLOMAT:['DIPLOMATIC_DRAPE','NOBLE_MANTLE','TECH_SUIT'],
  EXPLORER:['COLONIAL_GEAR','TECH_SUIT','SCIENTIFIC_COAT'],
  TECHNO_PRIEST:['TECHNO_HABIT','CEREMONIAL_TUNIC','ROYAL_REGALIA'],
  COLONIZER:['COLONIAL_GEAR','ELITE_UNIFORM','TECH_SUIT'],
  ARCHIVIST:['SCIENTIFIC_COAT','TECHNO_HABIT','CEREMONIAL_TUNIC'],
};
const cultureBias:Record<Vida38HumanoidCulture38R,readonly Vida38HumanoidGarment38R[]> = {
  BASILICA_TECHNOCRACY:['TECHNO_HABIT','CEREMONIAL_TUNIC','SCIENTIFIC_COAT'],
  STAR_KINGDOM:['ROYAL_REGALIA','NOBLE_MANTLE','DIPLOMATIC_DRAPE'],
  DUNE_MANDATE:['COLONIAL_GEAR','ELITE_UNIFORM','ANATOMIC_ARMOR'],
  PELAGIC_CONCORD:['DIPLOMATIC_DRAPE','SCIENTIFIC_COAT','NOBLE_MANTLE'],
  FRONTIER_HEGEMONY:['ANATOMIC_ARMOR','ELITE_UNIFORM','TECH_SUIT'],
  OBSIDIAN_CLAN:['CEREMONIAL_TUNIC','TECHNO_HABIT','ANATOMIC_ARMOR'],
};
const culturePalette:Record<Vida38HumanoidCulture38R, readonly [string,string,string]> = {
  BASILICA_TECHNOCRACY:['#101e2b','#345d69','#67dfdb'],
  STAR_KINGDOM:['#24283f','#778aaa','#a5ddf2'],
  DUNE_MANDATE:['#343b42','#6b837b','#6fc5b3'],
  PELAGIC_CONCORD:['#123f53','#337f89','#7cedd7'],
  FRONTIER_HEGEMONY:['#1a293d','#506a7a','#43d5bd'],
  OBSIDIAN_CLAN:['#0c1720','#303943','#5bc4dc'],
};
const archetypeMorph:Record<Vida38HumanoidArchetype38R,readonly [number,number,number,number,number]> = {
  LITHE_DIPLOMAT:[.89,.94,.99,1.08,1.03],
  ROBUST_COLONIST:[1.16,1.13,1.02,.96,.96],
  ATHLETIC_VANGUARD:[1.08,1.13,.95,1.03,.96],
  LONGNECK_SEER:[.88,.91,.94,1.09,1.22],
  COMPACT_ENGINEER:[1.05,.98,1.07,.91,.94],
  REGAL_HIGHBORN:[1.00,1.03,1.04,1.05,1.08],
  TALL_ARCHIVIST:[.84,.91,.95,1.14,1.13],
  BROAD_SENTINEL:[1.19,1.24,.98,.98,.91],
  PELAGIC_ENVOY:[.90,.96,1.09,1.10,1.03],
  ASCETIC_ORACLE:[.85,.90,.96,1.08,1.16],
};

export function deriveVida38CivilHumanoidPlan38R(contract:Vida38SpeciesVisualContract):Vida38CivilHumanoidPlan38R{
  if(!isVida38VeryAdvancedHumanoid38R(contract))throw new Error('38.2r: requiere HUMANOID/VERY_ADVANCED');
  const seed=`38.2r|${contract.speciesId}|${contract.appearanceFingerprint}|${contract.variantSeedUint32}`;
  const archetype=pick(VIDA38_HUMANOID_ARCHETYPES_38R,seed,'anatomy');
  const culture=pick(VIDA38_HUMANOID_CULTURES_38R,seed,'culture');
  const role=pick(VIDA38_HUMANOID_ROLES_38R,seed,'role');
  // La cultura domina la gramática de diseño, el rol la modula y aporta funcionalidad.
  const culturallyBiased=unit(seed,'cultural-dominance')<.65;
  const garment=pick(culturallyBiased?cultureBias[culture]:roleGarments[role],seed,'garment');
  const materials:Record<Vida38HumanoidCulture38R,readonly Vida38HumanoidMaterial38R[]> = {
    BASILICA_TECHNOCRACY:['CEREMONIAL_FIBER','BIOCERAMIC','LUMEN_SILK'],
    STAR_KINGDOM:['LUMEN_SILK','CEREMONIAL_FIBER','PEARL_MEMBRANE'],
    DUNE_MANDATE:['FLEXWEAVE','MATTE_ALLOY','BIOCERAMIC'],
    PELAGIC_CONCORD:['PEARL_MEMBRANE','LUMEN_SILK','FLEXWEAVE'],
    FRONTIER_HEGEMONY:['MATTE_ALLOY','BIOCERAMIC','FLEXWEAVE'],
    OBSIDIAN_CLAN:['BIOCERAMIC','CEREMONIAL_FIBER','MATTE_ALLOY'],
  };
  const material=pick(materials[culture],seed,'material');
  const accessories:Record<Vida38HumanoidRole38R,readonly Vida38HumanoidAccessory38R[]> = {
    SCIENTIST:['VISOR','MONOCLE','HOLO_ORB','WRIST_MODULE'],
    MILITARY:['VISOR','WRIST_MODULE','NONE'],
    NOBLE:['CROWN','DIADEM','SCEPTER','HOLO_ORB'],
    DIPLOMAT:['MONOCLE','DIADEM','SCEPTER','NONE'],
    EXPLORER:['VISOR','DATA_STAFF','WRIST_MODULE'],
    TECHNO_PRIEST:['DIADEM','DATA_STAFF','SCEPTER'],
    COLONIZER:['WRIST_MODULE','DATA_STAFF','VISOR'],
    ARCHIVIST:['MONOCLE','HOLO_ORB','DATA_STAFF'],
  };
  const accessory=pick(accessories[role],seed,'accessory');
  const secondAccessory=unit(seed,'extra-accent')>.70?pick(['WRIST_MODULE','HOLO_ORB','NONE'] as const,seed,'second'):'NONE';
  const shape=archetypeMorph[archetype];
  const jitter=(name:string)=>blend(.96,1.04,unit(seed,name));
  const bodyWidth=shape[0]*jitter('body'),shoulderScale=shape[1]*jitter('shoulders');
  const headScale=shape[2]*jitter('cranium'),legScale=shape[3]*jitter('leg'),neckScale=shape[4]*jitter('neck');
  const garmentLength=blend(.58,1.16,unit(seed,'hem-length'));
  const hemFlare=blend(.10,.35,unit(seed,'hem-flare'));
  const layerCount=1+Math.floor(unit(seed,'cloth-layers')*3);
  const ornament=pick(['MINIMAL','RITUAL','GLYPHIC','LUMINOUS','HERALDIC'] as const,seed,'ornament');
  const [primaryHex,secondaryHex,accentHex]=culturePalette[culture];
  const signature=[archetype,culture,role,garment,material,accessory,secondAccessory,ornament,
    bodyWidth,shoulderScale,headScale,legScale,neckScale,garmentLength,hemFlare,layerCount]
    .map(x=>typeof x==='number'?x.toFixed(5):x).join('|');
  return Object.freeze({revision:VIDA38_CIV_HUMANOID_REVISION_38R,speciesId:contract.speciesId,archetype,culture,role,garment,material,accessory,secondAccessory,
    bodyWidth,shoulderScale,headScale,legScale,neckScale,garmentLength,hemFlare,layerCount,ornament,
    primaryHex,secondaryHex,accentHex,signature});
}
