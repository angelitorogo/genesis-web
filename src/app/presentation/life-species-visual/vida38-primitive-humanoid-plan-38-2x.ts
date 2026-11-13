import type {Vida38SpeciesVisualContract} from './vida38-species-visual-contract';

export const VIDA38_PRIMITIVE_HUMANOID_REVISION_38X='VIDA.38.2x/primitive-humanoid/v1' as const;
export const VIDA38_PRIMITIVE_HUMANOID_WEAR_38X=[
 'FIBER_LOINCLOTH','HIDE_TUNIC','SHOULDER_HIDE','HUNTER_STRAPS',
 'WOVEN_SKIRT','WARRIOR_LEATHERS','SHAMAN_REGALIA','CHIEF_MANTLE',
] as const;
export const VIDA38_PRIMITIVE_HUMANOID_ROLES_38X=[
 'FISHER','WEAVER','ELDER','HUNTER','GATHERER','WARRIOR','SHAMAN','CHIEF',
 'SCOUT','CRAFTER','TRADER','GUARD','HEALER','FARMER','HERDER','BUILDER',
] as const;
export const VIDA38_PRIMITIVE_HUMANOID_CULTURES_38X=[
 'BASILICA_TECHNOCRACY','STAR_KINGDOM','DUNE_MANDATE','PELAGIC_CONCORD','FRONTIER_HEGEMONY','OBSIDIAN_CLAN',
] as const;
export type Vida38PrimitiveHumanoidWear38X=typeof VIDA38_PRIMITIVE_HUMANOID_WEAR_38X[number];
export type Vida38PrimitiveHumanoidRole38X=typeof VIDA38_PRIMITIVE_HUMANOID_ROLES_38X[number];
export type Vida38PrimitiveHumanoidCulture38X=typeof VIDA38_PRIMITIVE_HUMANOID_CULTURES_38X[number];
export type Vida38PrimitiveHumanoidAccessory38X='BEAD_NECKLACE'|'BONE_TALISMAN'|'STONE_TOOL'|'HIDE_POUCH'|'WATER_GOURD'|'FIBER_BASKET'|'ARM_BINDINGS'|'SHIN_WRAP'|'RITUAL_STAFF'|'CHIEF_MEDALLION'|'SHOULDER_BADGE'|'KNIFE_SHEATH';
export interface Vida38PrimitiveHumanoidPlan38X {
 readonly revision:typeof VIDA38_PRIMITIVE_HUMANOID_REVISION_38X;
 readonly speciesId:string;readonly culture:Vida38PrimitiveHumanoidCulture38X;
 readonly role:Vida38PrimitiveHumanoidRole38X;readonly wear:Vida38PrimitiveHumanoidWear38X;
 readonly accessories:readonly Vida38PrimitiveHumanoidAccessory38X[];
 readonly silhouette:'LITHE'|'ROBUST'|'TALL';readonly ornament:'MINIMAL'|'MODERATE'|'CEREMONIAL';
 readonly primary:string;readonly secondary:string;readonly accent:string;
 readonly hemLength:number;readonly signature:string;
}
export function hashVida38X(value:string):number {let h=2166136261;for(let i=0;i<value.length;i++)h=Math.imul(h^value.charCodeAt(i),16777619)>>>0;return h>>>0;}
export function isVida38PrimitiveHumanoid38X(c:Vida38SpeciesVisualContract):boolean{
 const intel=c.intelligence as unknown as Record<string,unknown>|null;
 const tier=String(intel?.['civilizationTier']??intel?.['civilizationLevel']??intel?.['civilisationLevel']??intel?.['societyLevel']??intel?.['stage']??'').toUpperCase();
 return c.morphology.group==='HUMANOIDS'&&String(intel?.['lineage']??'').toUpperCase()==='HUMANOID'&&tier==='PRIMITIVE';
}
const ROLE_WEAR:Readonly<Record<Vida38PrimitiveHumanoidRole38X,Vida38PrimitiveHumanoidWear38X>>={
 FISHER:'FIBER_LOINCLOTH',WEAVER:'HIDE_TUNIC',ELDER:'SHOULDER_HIDE',HUNTER:'HUNTER_STRAPS',GATHERER:'WOVEN_SKIRT',WARRIOR:'WARRIOR_LEATHERS',SHAMAN:'SHAMAN_REGALIA',CHIEF:'CHIEF_MANTLE',
 SCOUT:'HUNTER_STRAPS',CRAFTER:'HIDE_TUNIC',TRADER:'SHOULDER_HIDE',GUARD:'WARRIOR_LEATHERS',HEALER:'SHAMAN_REGALIA',FARMER:'WOVEN_SKIRT',HERDER:'FIBER_LOINCLOTH',BUILDER:'HIDE_TUNIC',
};
const ROLE_EQUIPMENT:Readonly<Record<Vida38PrimitiveHumanoidWear38X,readonly Vida38PrimitiveHumanoidAccessory38X[]>>={
 FIBER_LOINCLOTH:['ARM_BINDINGS','WATER_GOURD'],HIDE_TUNIC:['HIDE_POUCH','STONE_TOOL'],SHOULDER_HIDE:['BEAD_NECKLACE','HIDE_POUCH'],HUNTER_STRAPS:['KNIFE_SHEATH','WATER_GOURD'],
 WOVEN_SKIRT:['FIBER_BASKET','ARM_BINDINGS'],WARRIOR_LEATHERS:['ARM_BINDINGS','KNIFE_SHEATH'],SHAMAN_REGALIA:['BEAD_NECKLACE','BONE_TALISMAN','RITUAL_STAFF'],CHIEF_MANTLE:['CHIEF_MEDALLION','SHOULDER_BADGE','BEAD_NECKLACE'],
};
const PALETTES:readonly (readonly [string,string,string])[]=[
 ['#856c52','#c4aa88','#ead1a4'],['#7d6456','#baa389','#d6bb86'],['#8d7554','#c8ae7f','#dbc99d'],
 ['#61746e','#a8b2a0','#d4c5a0'],['#756054','#ad9178','#d7b998'],['#5d5754','#aaa19a','#d0bdad'],
];
export function deriveVida38PrimitiveHumanoidPlan38X(c:Vida38SpeciesVisualContract):Vida38PrimitiveHumanoidPlan38X{
 const seed=[c.speciesId,c.appearanceFingerprint,c.variantSeedUint32,'38.2x'].join('|');
 const serial=/^LAB-38X-HUMANOID-(\d+)$/.exec(c.speciesId);
 const role=VIDA38_PRIMITIVE_HUMANOID_ROLES_38X[serial?(Number(serial[1])-1)%VIDA38_PRIMITIVE_HUMANOID_ROLES_38X.length:hashVida38X(seed+'|role')%VIDA38_PRIMITIVE_HUMANOID_ROLES_38X.length]!;
 const culture=VIDA38_PRIMITIVE_HUMANOID_CULTURES_38X[hashVida38X(seed+'|culture')%6]!;
 const wear=ROLE_WEAR[role],palette=PALETTES[VIDA38_PRIMITIVE_HUMANOID_CULTURES_38X.indexOf(culture)]!;
 const silhouette=(['LITHE','ROBUST','TALL'] as const)[hashVida38X(seed+'|shape')%3]!;
 const ornament=wear==='CHIEF_MANTLE'||wear==='SHAMAN_REGALIA'?'CEREMONIAL':(hashVida38X(seed+'|ornament')%3===0?'MODERATE':'MINIMAL');
 const hemLength=.25+(hashVida38X(seed+'|hem')%25)/100;
 const accessories=ROLE_EQUIPMENT[wear];
 const signature=[culture,role,wear,silhouette,ornament,accessories.join('+'),hemLength.toFixed(3),...palette].join('|');
 return Object.freeze({revision:VIDA38_PRIMITIVE_HUMANOID_REVISION_38X,speciesId:c.speciesId,culture,role,wear,accessories:Object.freeze([...accessories]),
  silhouette,ornament,primary:palette[0]!,secondary:palette[1]!,accent:palette[2]!,hemLength,signature});
}
