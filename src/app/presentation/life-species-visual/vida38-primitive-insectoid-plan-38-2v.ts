/** 38.2v — antropometría civilizada insectoide 38.2q; solo atuendo primitivo independiente. */
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { deriveVida38CivilizedInsectoidPlan38Q, type Vida38CivilizedInsectoidPlan38Q } from './vida38-civilized-insectoid-preview-38-2q';
import { vida38Hash38T } from './vida38-advanced-insectoid-plan-38-2t';
export const VIDA38_PRIMITIVE_INSECT_REVISION_38V='VIDA.38.2v/primitive-insectoids/v1' as const;
export const VIDA38_PRIMITIVE_INSECT_WEAR_38V=[
  'MINIMAL_FIBER_WRAP','WOVEN_BARK_TUNIC','HIDE_SHOULDER_CLOAK','FORAGER_HARNESS',
  'CHITIN_WARRIOR_PANELS','CEREMONIAL_BEADS','TRIBAL_SKIRT','ELDER_MANTLE',
] as const;
export const VIDA38_PRIMITIVE_INSECT_ROLES_38V=[
  'FORAGER','HUNTER','GUARD','WARRIOR','WEAVER','HEALER','SHAMAN','ELDER',
  'BUILDER','SCOUT','FISHER','TRADER',
] as const;
export const VIDA38_PRIMITIVE_INSECT_CULTURES_38V=[
  'BASILICA_TECHNOCRACY','STAR_KINGDOM','DUNE_MANDATE','PELAGIC_CONCORD','FRONTIER_HEGEMONY','OBSIDIAN_CLAN',
] as const;
export type Vida38PrimitiveInsectWear38V=typeof VIDA38_PRIMITIVE_INSECT_WEAR_38V[number];
export type Vida38PrimitiveInsectRole38V=typeof VIDA38_PRIMITIVE_INSECT_ROLES_38V[number];
export type Vida38PrimitiveInsectCulture38V=typeof VIDA38_PRIMITIVE_INSECT_CULTURES_38V[number];
export type Vida38PrimitiveInsectAccessory38V='BEAD_COLLAR'|'BONE_TALISMAN'|'BRAIDED_CUFF'|'HIDE_SATCHEL'|
  'SEED_POUCH'|'STONE_TOOL'|'RITUAL_STAFF'|'CLAY_CHARM'|'FIBER_BINDINGS'|'SHELL_DECORATION';
export interface Vida38PrimitiveInsectPlan38V {
  readonly revision:typeof VIDA38_PRIMITIVE_INSECT_REVISION_38V;
  readonly speciesId:string;
  readonly archetype:Vida38CivilizedInsectoidPlan38Q['archetype'];
  readonly culture:Vida38PrimitiveInsectCulture38V;
  readonly role:Vida38PrimitiveInsectRole38V;
  readonly wear:Vida38PrimitiveInsectWear38V;
  readonly accessories:readonly Vida38PrimitiveInsectAccessory38V[];
  readonly wingPairs:number;
  readonly armCount:number;
  readonly stinger:Vida38CivilizedInsectoidPlan38Q['stinger'];
  readonly materialHex:string;
  readonly trimHex:string;
  readonly fiberHex:string;
  readonly shape:number;
  readonly signature:string;
}
const RULE:Record<Vida38PrimitiveInsectRole38V,Vida38PrimitiveInsectWear38V>={
  FORAGER:'MINIMAL_FIBER_WRAP',HUNTER:'FORAGER_HARNESS',GUARD:'CHITIN_WARRIOR_PANELS',
  WARRIOR:'CHITIN_WARRIOR_PANELS',WEAVER:'WOVEN_BARK_TUNIC',HEALER:'CEREMONIAL_BEADS',
  SHAMAN:'CEREMONIAL_BEADS',ELDER:'ELDER_MANTLE',BUILDER:'WOVEN_BARK_TUNIC',
  SCOUT:'HIDE_SHOULDER_CLOAK',FISHER:'TRIBAL_SKIRT',TRADER:'HIDE_SHOULDER_CLOAK',
};
const PALETTES:Record<Vida38PrimitiveInsectCulture38V,readonly [string,string,string]>={
  BASILICA_TECHNOCRACY:['#796c56','#c7ae89','#c6bf97'],STAR_KINGDOM:['#7d6251','#cba983','#ddd09f'],
  DUNE_MANDATE:['#8c7854','#c6ac7b','#dfc792'],PELAGIC_CONCORD:['#63736a','#a6bfaa','#c4b9a0'],
  FRONTIER_HEGEMONY:['#68594c','#bca184','#d2c6a7'],OBSIDIAN_CLAN:['#504c47','#a99c8b','#b4a58d'],
};
const GEAR:Record<Vida38PrimitiveInsectWear38V,readonly Vida38PrimitiveInsectAccessory38V[]>={
  MINIMAL_FIBER_WRAP:['FIBER_BINDINGS','SEED_POUCH'],WOVEN_BARK_TUNIC:['BRAIDED_CUFF','STONE_TOOL','SEED_POUCH'],
  HIDE_SHOULDER_CLOAK:['HIDE_SATCHEL','FIBER_BINDINGS','SHELL_DECORATION'],
  FORAGER_HARNESS:['HIDE_SATCHEL','STONE_TOOL','FIBER_BINDINGS'],
  CHITIN_WARRIOR_PANELS:['BRAIDED_CUFF','STONE_TOOL','BONE_TALISMAN'],
  CEREMONIAL_BEADS:['BEAD_COLLAR','BONE_TALISMAN','RITUAL_STAFF','CLAY_CHARM'],
  TRIBAL_SKIRT:['SEED_POUCH','SHELL_DECORATION','BRAIDED_CUFF'],
  ELDER_MANTLE:['BEAD_COLLAR','CLAY_CHARM','SHELL_DECORATION'],
};
export function isVida38PrimitiveInsectoid38V(contract:Vida38SpeciesVisualContract):boolean{
  const i=contract.intelligence as unknown as Record<string,unknown>|null;
  const civ=i?.['civilization'] as Record<string,unknown>|undefined;
  const soc=i?.['society'] as Record<string,unknown>|undefined;
  const tier=String(i?.['civilizationTier']??i?.['civilizationLevel']??i?.['civilisationLevel']??
    i?.['societyLevel']??i?.['civilizationStage']??i?.['stage']??civ?.['level']??soc?.['level']??'').toUpperCase();
  return contract.morphology.group==='INSECTS'&&String(i?.['lineage']??'').toUpperCase()==='INSECTOID'&&tier==='PRIMITIVE';
}
export function anatomicalVida38PrimitiveInsectContract38V(contract:Vida38SpeciesVisualContract):Vida38SpeciesVisualContract{
  if(!isVida38PrimitiveInsectoid38V(contract))throw new Error('38.2v: nivel incompatible');
  // Copia efímera: el renderer 38.2q nunca recibe el contrato persistido original.
  return {...contract,morphology:{...contract.morphology,appendagePairs:Math.max(3,Math.min(4,Math.trunc(contract.morphology.appendagePairs)))},
    intelligence:{...(contract.intelligence??{}),civilizationTier:'VERY_ADVANCED',civilizationLevel:'VERY_ADVANCED'} as NonNullable<Vida38SpeciesVisualContract['intelligence']>};
}
export function deriveVida38PrimitiveInsectPlan38V(contract:Vida38SpeciesVisualContract):Vida38PrimitiveInsectPlan38V{
  const q=deriveVida38CivilizedInsectoidPlan38Q(anatomicalVida38PrimitiveInsectContract38V(contract));
  const seed=`${contract.speciesId}|${contract.appearanceFingerprint}|${contract.variantSeedUint32}|38.2v`;
  const role=VIDA38_PRIMITIVE_INSECT_ROLES_38V[vida38Hash38T(seed+'|role')%VIDA38_PRIMITIVE_INSECT_ROLES_38V.length]!;
  const culture=VIDA38_PRIMITIVE_INSECT_CULTURES_38V[vida38Hash38T(seed+'|culture')%VIDA38_PRIMITIVE_INSECT_CULTURES_38V.length]!;
  const wear=RULE[role];const palette=PALETTES[culture];const gear=GEAR[wear];
  const accessories:Vida38PrimitiveInsectAccessory38V[]=[gear[0]!];
  const another=gear[1+vida38Hash38T(seed+'|accessory')%(gear.length-1)]!;
  if(!accessories.includes(another))accessories.push(another);
  const shape=vida38Hash38T(seed+'|shape')%7;
  const signature=[q.archetype,role,culture,wear,accessories.join('+'),q.armCount,q.wingPairs,q.stinger,
    shape,palette.join('|')].join('|');
  return Object.freeze({revision:VIDA38_PRIMITIVE_INSECT_REVISION_38V,speciesId:contract.speciesId,
    archetype:q.archetype,role,culture,wear,accessories:Object.freeze(accessories),
    wingPairs:q.wingPairs,armCount:q.armCount,stinger:q.stinger,
    materialHex:palette[0],trimHex:palette[1],fiberHex:palette[2],shape,signature});
}
