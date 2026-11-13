/** 38.2w: perfiles profesionales deterministas. Nunca modifica contrato persistido. */
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
export const VIDA38_ADV_HUMANOID_REVISION_38W='VIDA.38.2w/advanced-humanoid/v1' as const;
export const VIDA38_ADV_HUMANOID_WEAR_38W=['CIVIL_JACKET','INDUSTRIAL_COVERALL','RESEARCH_COAT','FRONTIER_EXPLORER','SECURITY_UNIFORM','ENVIRONMENT_SUIT','FLIGHT_SUIT','DIPLOMATIC_FORMAL'] as const;
export const VIDA38_ADV_HUMANOID_ROLES_38W=['ADMINISTRATOR','ENGINEER','SCIENTIST','EXPLORER','SECURITY','ASTRONAUT','PILOT','DIPLOMAT','MEDIC','TECHNICIAN','COLONIST','SURVEYOR'] as const;
export const VIDA38_ADV_HUMANOID_CULTURES_38W=['BASILICA_TECHNOCRACY','STAR_KINGDOM','DUNE_MANDATE','PELAGIC_CONCORD','FRONTIER_HEGEMONY','OBSIDIAN_CLAN'] as const;
export type Vida38AdvancedHumanoidWear38W=typeof VIDA38_ADV_HUMANOID_WEAR_38W[number];
export type Vida38AdvancedHumanoidRole38W=typeof VIDA38_ADV_HUMANOID_ROLES_38W[number];
export type Vida38AdvancedHumanoidCulture38W=typeof VIDA38_ADV_HUMANOID_CULTURES_38W[number];
export type Vida38AdvancedHumanoidEquipment38W='FIELD_PACK'|'ANALYSER'|'TOOL_CASE'|'BREATHING_MODULE'|'VISOR'|'BADGE'|'COMMUNICATOR'|'MED_KIT'|'BELT_POUCH'|'DATA_TABLET'|'FLIGHT_HARNESS';
export type Vida38AdvancedHumanoidOverlay38W='NONE'|'VEST'|'TABARD'|'EPAULETTE'|'SASH'|'CHEST_RIG'|'SCARF';
export type Vida38AdvancedHumanoidAccessoryBias38W='LIGHT'|'STANDARD'|'HEAVY';
export interface Vida38AdvancedHumanoidPlan38W{
 readonly revision:typeof VIDA38_ADV_HUMANOID_REVISION_38W;readonly speciesId:string;
 readonly culture:Vida38AdvancedHumanoidCulture38W;readonly role:Vida38AdvancedHumanoidRole38W;
 readonly wear:Vida38AdvancedHumanoidWear38W;readonly equipment:readonly Vida38AdvancedHumanoidEquipment38W[];
 readonly primary:string;readonly secondary:string;readonly accent:string;
 readonly frame:'SLIM'|'ATHLETIC'|'BROAD';readonly garmentScale:number;
 readonly overlay:Vida38AdvancedHumanoidOverlay38W;readonly accessoryBias:Vida38AdvancedHumanoidAccessoryBias38W;readonly signature:string;
}
export function hashVida38W(s:string):number{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619)>>>0;return h>>>0;}
export function isVida38AdvancedHumanoid38W(c:Vida38SpeciesVisualContract):boolean{
 const i=c.intelligence as unknown as Record<string,unknown>|null;
 const tier=String(i?.['civilizationTier']??i?.['civilizationLevel']??i?.['civilisationLevel']??i?.['societyLevel']??i?.['stage']??'').toUpperCase();
 return c.morphology.group==='HUMANOIDS'&&String(i?.['lineage']??'').toUpperCase()==='HUMANOID'&&tier==='ADVANCED';
}
const PALETTES:ReadonlyArray<readonly [string,string,string]>=[
 ['#344657','#8296a1','#d6b68d'],['#51536e','#a9abbf','#dfc38a'],['#766653','#b4a48b','#dcb77d'],
 ['#376b76','#94bec2','#c1e0dd'],['#48535d','#9cabae','#dfaa68'],['#35383f','#8b8e96','#c7afb3']];
const WEAR_BY_ROLE:Readonly<Record<Vida38AdvancedHumanoidRole38W,Vida38AdvancedHumanoidWear38W>>={
 ADMINISTRATOR:'CIVIL_JACKET',ENGINEER:'INDUSTRIAL_COVERALL',SCIENTIST:'RESEARCH_COAT',EXPLORER:'FRONTIER_EXPLORER',SECURITY:'SECURITY_UNIFORM',ASTRONAUT:'ENVIRONMENT_SUIT',PILOT:'FLIGHT_SUIT',DIPLOMAT:'DIPLOMATIC_FORMAL',MEDIC:'RESEARCH_COAT',TECHNICIAN:'INDUSTRIAL_COVERALL',COLONIST:'FRONTIER_EXPLORER',SURVEYOR:'ENVIRONMENT_SUIT'};
const EQUIP:Readonly<Record<Vida38AdvancedHumanoidWear38W,readonly Vida38AdvancedHumanoidEquipment38W[]>>={
 CIVIL_JACKET:['COMMUNICATOR','BELT_POUCH'],INDUSTRIAL_COVERALL:['TOOL_CASE','BELT_POUCH'],RESEARCH_COAT:['ANALYSER','DATA_TABLET','MED_KIT'],
 FRONTIER_EXPLORER:['FIELD_PACK','COMMUNICATOR'],SECURITY_UNIFORM:['VISOR','BADGE','BELT_POUCH'],
 ENVIRONMENT_SUIT:['BREATHING_MODULE','VISOR','FIELD_PACK'],FLIGHT_SUIT:['FLIGHT_HARNESS','COMMUNICATOR'],DIPLOMATIC_FORMAL:['BADGE','DATA_TABLET']};
const OVERLAY_BY_ROLE:Readonly<Record<Vida38AdvancedHumanoidRole38W,Vida38AdvancedHumanoidOverlay38W>>={
 ADMINISTRATOR:'VEST',ENGINEER:'CHEST_RIG',SCIENTIST:'TABARD',EXPLORER:'SCARF',SECURITY:'CHEST_RIG',ASTRONAUT:'EPAULETTE',PILOT:'CHEST_RIG',DIPLOMAT:'SASH',MEDIC:'TABARD',TECHNICIAN:'VEST',COLONIST:'SCARF',SURVEYOR:'EPAULETTE'};
const ACCESSORY_BIAS_BY_ROLE:Readonly<Record<Vida38AdvancedHumanoidRole38W,Vida38AdvancedHumanoidAccessoryBias38W>>={
 ADMINISTRATOR:'STANDARD',ENGINEER:'HEAVY',SCIENTIST:'HEAVY',EXPLORER:'HEAVY',SECURITY:'HEAVY',ASTRONAUT:'HEAVY',PILOT:'STANDARD',DIPLOMAT:'LIGHT',MEDIC:'HEAVY',TECHNICIAN:'HEAVY',COLONIST:'STANDARD',SURVEYOR:'HEAVY'};
const CULTURE_OVERLAY_SHIFT:Readonly<Record<Vida38AdvancedHumanoidCulture38W,Vida38AdvancedHumanoidOverlay38W>>={
 BASILICA_TECHNOCRACY:'EPAULETTE',STAR_KINGDOM:'SASH',DUNE_MANDATE:'SCARF',PELAGIC_CONCORD:'VEST',FRONTIER_HEGEMONY:'CHEST_RIG',OBSIDIAN_CLAN:'TABARD'};
export function deriveVida38AdvancedHumanoidPlan38W(c:Vida38SpeciesVisualContract):Vida38AdvancedHumanoidPlan38W{
 const seed=[c.speciesId,c.appearanceFingerprint,c.variantSeedUint32,'38.2w'].join('|');
 const role=VIDA38_ADV_HUMANOID_ROLES_38W[hashVida38W(seed+'|role')%VIDA38_ADV_HUMANOID_ROLES_38W.length]!;
 const culture=VIDA38_ADV_HUMANOID_CULTURES_38W[hashVida38W(seed+'|culture')%6]!;
 const wear=WEAR_BY_ROLE[role],palette=PALETTES[VIDA38_ADV_HUMANOID_CULTURES_38W.indexOf(culture)]!;
 const equipment=EQUIP[wear];const frame=(['SLIM','ATHLETIC','BROAD'] as const)[hashVida38W(seed+'|frame')%3]!;
 const garmentScale=.92+(hashVida38W(seed+'|fit')%17)/100;
 const accessoryBias=ACCESSORY_BIAS_BY_ROLE[role];
 const overlay=(hashVida38W(seed+'|overlay')%3===0?CULTURE_OVERLAY_SHIFT[culture]:OVERLAY_BY_ROLE[role]);
 const signature=[culture,role,wear,equipment.join('+'),frame,garmentScale,overlay,accessoryBias,palette.join(':')].join('|');
 return Object.freeze({revision:VIDA38_ADV_HUMANOID_REVISION_38W,speciesId:c.speciesId,culture,role,wear,
 equipment:Object.freeze([...equipment]),primary:palette[0],secondary:palette[1],accent:palette[2],frame,garmentScale,overlay,accessoryBias,signature});
}
