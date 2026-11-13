import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';

export const VIDA38_ADVANCED_REPTILIAN_REVISION_38S = 'VIDA.38.2s/advanced-reptilians/v1' as const;

export const VIDA38_ADV_REPT_ARCHETYPES_38S = [
  'URBAN_DIPLOMAT','FIELD_SCIENTIST','ASTRONAUT_PILOT','SECURITY_VETERAN',
  'COLONY_ENGINEER','MARSH_EXPLORER','DESERT_RANGER','CIVIC_ADMINISTRATOR',
  'CULTURAL_SCHOLAR','INDUSTRIAL_TECHNICIAN','MEDICAL_SPECIALIST','MEDIA_ANALYST',
] as const;
export const VIDA38_ADV_REPT_CULTURES_38S = [
  'METRO_POLITIES','DUNE_LEAGUE','MARSH_COLLECTIVE','ORBITAL_SYNDICATE',
  'RIVER_COMMONWEALTH','BASILICA_ACADEMY',
] as const;
export const VIDA38_ADV_REPT_ROLES_38S = [
  'DIPLOMAT','SCIENTIST','PILOT','SECURITY','ENGINEER','EXPLORER',
  'COLONIST','ADMINISTRATOR','SCHOLAR','TECHNICIAN','MEDIC','ANALYST',
] as const;
export const VIDA38_ADV_REPT_OUTFITS_38S = [
  'CASUAL_LAYERS','FIELD_JACKET','UTILITY_OVERALLS','SERVICE_UNIFORM',
  'PRESSURE_SUIT','LAB_APPAREL','EXPLORER_GEAR','CEREMONIAL_ATTIRE',
  'EXECUTIVE_ATTIRE','TACTICAL_WORKWEAR',
] as const;
export const VIDA38_ADV_REPT_MATERIALS_38S = [
  'COTTON_BLEND','SYNTHWEAVE','UTILITY_CANVAS','LEATHERETTE','PRESSURE_TEXTILE','SMART_FABRIC',
] as const;
export const VIDA38_ADV_REPT_ORNAMENTS_38S = ['MINIMAL','TRIMMED','PATCHED','INSIGNIA','FORMAL'] as const;
export const VIDA38_ADV_REPT_ACCESSORIES_38S = [
  'NONE','DATA_TABLET','TOOL_BELT','FIELD_PACK','UTILITY_BADGE','COMMS_HEADSET','HELMET',
  'ID_SASH','WRIST_TERMINAL','SAMPLE_CASE','MED_KIT','DOCUMENT_FOLDER',
] as const;

export type Vida38AdvancedReptilianArchetype38S = typeof VIDA38_ADV_REPT_ARCHETYPES_38S[number];
export type Vida38AdvancedReptilianCulture38S = typeof VIDA38_ADV_REPT_CULTURES_38S[number];
export type Vida38AdvancedReptilianRole38S = typeof VIDA38_ADV_REPT_ROLES_38S[number];
export type Vida38AdvancedReptilianOutfit38S = typeof VIDA38_ADV_REPT_OUTFITS_38S[number];
export type Vida38AdvancedReptilianMaterial38S = typeof VIDA38_ADV_REPT_MATERIALS_38S[number];
export type Vida38AdvancedReptilianOrnament38S = typeof VIDA38_ADV_REPT_ORNAMENTS_38S[number];
export type Vida38AdvancedReptilianAccessory38S = typeof VIDA38_ADV_REPT_ACCESSORIES_38S[number];

export interface Vida38AdvancedReptilianPlan38S {
  readonly revision: typeof VIDA38_ADVANCED_REPTILIAN_REVISION_38S;
  readonly speciesId: string;
  readonly archetype: Vida38AdvancedReptilianArchetype38S;
  readonly culture: Vida38AdvancedReptilianCulture38S;
  readonly role: Vida38AdvancedReptilianRole38S;
  readonly outfit: Vida38AdvancedReptilianOutfit38S;
  readonly material: Vida38AdvancedReptilianMaterial38S;
  readonly ornament: Vida38AdvancedReptilianOrnament38S;
  readonly accessory: Vida38AdvancedReptilianAccessory38S;
  readonly secondAccessory: Vida38AdvancedReptilianAccessory38S;
  readonly note: string;
}

export function vida38Hash38S(text:string):number{
  let h=2166136261;
  for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619)>>>0;
  h^=h>>>16;h=Math.imul(h,0x85ebca6b)>>>0;h^=h>>>13;h=Math.imul(h,0xc2b2ae35)>>>0;h^=h>>>16;
  return h>>>0;
}
function pick<T>(seed:number,values:readonly T[]):T{return values[seed%values.length]!;}

export function isVida38AdvancedReptilian38S(contract:Vida38SpeciesVisualContract):boolean{
  const intel=contract.intelligence;
  return contract.morphology.group==='REPTILES' && !!intel && intel.lineage==='REPTILIAN' && intel.civilizationTier==='ADVANCED';
}

export function deriveVida38AdvancedReptilianPlan38S(contract:Vida38SpeciesVisualContract):Vida38AdvancedReptilianPlan38S{
  if(!isVida38AdvancedReptilian38S(contract)){
    throw new Error(`38.2s: contrato ${contract.speciesId} no es un reptiliano avanzado`);
  }
  const base=vida38Hash38S(`${contract.speciesId}|${contract.appearanceFingerprint}|38.2s`);
  const archetype=pick(base,VIDA38_ADV_REPT_ARCHETYPES_38S);
  const culture=pick(vida38Hash38S(`${base}|culture`),VIDA38_ADV_REPT_CULTURES_38S);
  const role=pick(vida38Hash38S(`${base}|role`),VIDA38_ADV_REPT_ROLES_38S);
  let outfit:Vida38AdvancedReptilianOutfit38S=pick(vida38Hash38S(`${base}|outfit`),VIDA38_ADV_REPT_OUTFITS_38S);
  const material=pick(vida38Hash38S(`${base}|material`),VIDA38_ADV_REPT_MATERIALS_38S);
  const ornament=pick(vida38Hash38S(`${base}|ornament`),VIDA38_ADV_REPT_ORNAMENTS_38S);
  let accessory=pick(vida38Hash38S(`${base}|accessoryA`),VIDA38_ADV_REPT_ACCESSORIES_38S);
  let secondAccessory=pick(vida38Hash38S(`${base}|accessoryB`),VIDA38_ADV_REPT_ACCESSORIES_38S);

  // Reglas blandas: un rol modula una estética actual/avanzada, menos futurista que VERY_ADVANCED.
  if(role==='PILOT') { outfit='PRESSURE_SUIT'; accessory='HELMET'; }
  if(role==='SCIENTIST') { outfit=outfit==='PRESSURE_SUIT'?'LAB_APPAREL':outfit; accessory=accessory==='NONE'?'DATA_TABLET':accessory; }
  if(role==='ENGINEER' || role==='TECHNICIAN') { outfit='UTILITY_OVERALLS'; }
  if(role==='SECURITY') { outfit='SERVICE_UNIFORM'; }
  if(role==='DIPLOMAT' || role==='ADMINISTRATOR') { outfit=outfit==='UTILITY_OVERALLS'?'EXECUTIVE_ATTIRE':outfit; }
  if(role==='EXPLORER' || role==='COLONIST') { outfit=outfit==='EXECUTIVE_ATTIRE'?'EXPLORER_GEAR':outfit; }
  if(role==='SCHOLAR') { outfit=outfit==='TACTICAL_WORKWEAR'?'CEREMONIAL_ATTIRE':outfit; }
  if(secondAccessory===accessory) secondAccessory='NONE';

  const note =
    role==='PILOT' ? 'Astronauta/reptiliano orbital con equipo presurizado y lectura contemporánea.' :
    role==='SCIENTIST' ? 'Perfil científico con ropa actual técnica y accesorios de trabajo.' :
    role==='DIPLOMAT' ? 'Vestimenta social contemporánea refinada con matiz cultural reptiliano.' :
    role==='SECURITY' ? 'Uniformidad funcional avanzada, más cercana a seguridad moderna que a armadura total.' :
    'Civilización avanzada reptiliana con mezcla de ropa actual, utilitaria y técnica.';

  return Object.freeze({
    revision:VIDA38_ADVANCED_REPTILIAN_REVISION_38S,
    speciesId:contract.speciesId,
    archetype,culture,role,outfit,material,ornament,accessory,secondAccessory,note,
  });
}
