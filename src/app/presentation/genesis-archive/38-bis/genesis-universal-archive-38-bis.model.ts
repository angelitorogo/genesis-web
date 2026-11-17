/** 38.bis · Confirmed-science public catalogue. Exploration history remains separate. */
export const GENESIS_UNIVERSAL_ARCHIVE_REVISION_38BIS = 'GENESIS/38.bis/scientific-confirmed/v2';

export const UNIVERSAL_ARCHIVE_CATEGORIES_38BIS = Object.freeze([
  {id:'galaxies',label:'Galaxias',description:'Galaxias científicamente confirmadas en este universo.'},
  {id:'sectors',label:'Sectores',description:'Sectores confirmados registrados en este universo.'},
  {id:'systems',label:'Sistemas',description:'Sistemas estelares confirmados.'},
  {id:'planets',label:'Planetas',description:'Planetas confirmados o autorizados por un sistema confirmado.'},
  {id:'moons',label:'Lunas',description:'Lunas públicas autorizadas por un sistema confirmado.'},
  {id:'clusters',label:'Cúmulos',description:'Cúmulos estelares confirmados.'},
  {id:'nebulae',label:'Nebulosas',description:'Nebulosas confirmadas.'},
  {id:'extremes',label:'Objetos extremos',description:'Agujeros negros, remanentes y otros objetos extremos.'},
  {id:'asteroids',label:'Asteroides',description:'Asteroides de inventarios confirmados.'},
  {id:'comets',label:'Cometas',description:'Cometas de inventarios confirmados.'},
  {id:'tno',label:'TNO',description:'Objetos transneptunianos de inventarios confirmados.'},
  {id:'captured',label:'Capturados',description:'Cuerpos capturados de inventarios confirmados.'},
  {id:'civilizations',label:'Civilizaciones',description:'Civilizaciones nativas confirmadas.'},
  {id:'colonies',label:'Colonias',description:'Colonias tecnológicas con registro confirmado.'},
  {id:'colonized-planets',label:'Planetas colonizados',description:'Planetas con una o más colonias verificadas.'},
  {id:'colonized-moons',label:'Lunas colonizadas',description:'Lunas con una o más colonias verificadas.'},
] as const);

export type UniversalArchiveCategory38Bis = typeof UNIVERSAL_ARCHIVE_CATEGORIES_38BIS[number]['id'];
export type UniversalArchiveIndexedCategory38Bis = Exclude<UniversalArchiveCategory38Bis,'galaxies'>;
export const UNIVERSAL_ARCHIVE_PAGE_SIZES_38BIS = [25,50,100] as const;
export type UniversalArchivePageSize38Bis = typeof UNIVERSAL_ARCHIVE_PAGE_SIZES_38BIS[number];

export function universalArchiveCategory38Bis(value:string|null):UniversalArchiveCategory38Bis|null {
  return UNIVERSAL_ARCHIVE_CATEGORIES_38BIS.find(category=>category.id===value)?.id??null;
}

/** Normalizing names is a read-model operation, not a new scientific designation. */
export function universalArchiveSearchKey38Bis(value:string):string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/gu,'').toLocaleLowerCase('es-ES').replace(/\s+/gu,' ').trim();
}

export function universalArchivePage38Bis(value:number, total:number, pageSize:UniversalArchivePageSize38Bis):number {
  return Math.min(Math.max(1,Math.trunc(Number.isFinite(value)?value:1)),Math.max(1,Math.ceil(total/pageSize)));
}

/** A colony count counts each body once, never each habitat as a separate moon. */
export function universalArchiveColonizedBodies38Bis<T extends {readonly bodyStorageKey:string}>(items:readonly T[]):number {
  return new Set(items.map(item=>item.bodyStorageKey)).size;
}

export interface UniversalArchiveAction38Bis {
  readonly label:string;
  readonly route:readonly string[];
  readonly queryParams?:Readonly<Record<string,string>>;
}

export type ArchiveColonizerTier38Bis = 'ADVANCED' | 'VERY_ADVANCED';

/** Diagnostic derived exclusively from an authorized destination colony. No
 * unknown source designation, private locator or biological payload is cached. */
export const ARCHIVE_COLONY_ORIGIN_ISSUES_38BIS = Object.freeze({
  ORIGIN_REFERENCE_INCOMPLETE:'Referencia de origen incompleta',
  ORIGIN_OUTSIDE_CONFIRMED_SYSTEM:'Origen ajeno al sistema confirmado o a su versión',
  SOURCE_RECORD_UNAVAILABLE:'Registro biológico natal no disponible',
  SOURCE_RECORD_INVALID:'Registro biológico natal no validable',
  SOURCE_IDENTITY_MISMATCH:'Identidad del mundo natal incoherente',
  SOURCE_DIGEST_MISMATCH:'Datos históricos del ecosistema y la civilización diferentes',
  SOURCE_CIVILIZATION_MISMATCH:'Civilización o especie fundadora no coincidente',
  PUBLIC_DESIGNATION_UNAVAILABLE:'Sin designación pública verificable del mundo natal',
  NOT_DIAGNOSED:'Índice anterior sin diagnóstico individual',
  HISTORICAL_SOURCE_UNAVAILABLE:'No se puede reconstruir la información histórica de origen',
  HISTORICAL_DIGEST_UNREPRODUCIBLE:'Los digests históricos no se reproducen',
  HISTORICAL_FOUNDER_MISMATCH:'La civilización histórica o actual no es compatible',
  HISTORICAL_COLONY_SIGNATURE_MISMATCH:'La identidad histórica de la colonia no coincide',
} as const);
export type ArchiveColonyOriginIssue38Bis = keyof typeof ARCHIVE_COLONY_ORIGIN_ISSUES_38BIS;
export type ArchiveColonyDigestDrift38Bis = 'NONE'|'VIDA6_ONLY'|'VIDA7_ONLY'|'BOTH'|'NOT_COMPARABLE';
export interface ArchiveColonyOriginDiagnostic38Bis {
  readonly reason:ArchiveColonyOriginIssue38Bis;
  readonly count:number;
}


/** Public, confirmed native source; never inferred from technology alone. */
export interface UniversalArchiveVerifiedFounder38Bis {
  readonly id:string;
  readonly galaxyIndex:string;
  readonly name:string;
  /** Real public labels read from independently validated source; never guessed. */
  readonly speciesName?:string;
  readonly planetName?:string;
  readonly tier:ArchiveColonizerTier38Bis;
  readonly route:readonly string[];
}

export interface UniversalArchiveColonizationStatistics38Bis {
  readonly colonies:number;
  readonly advancedColonies:number;
  readonly veryAdvancedColonies:number;
  /** Distinct confirmed source worlds with a matching immutable VIDA.7 digest. */
  readonly verifiedColonizers:number;
  readonly unattributedColonies:number;
  /** Source replay proven with BOTH exact VIDA.8 hashes and colony IDs. */
  readonly historicallyReconciledColonies?:number;
  readonly digestDriftCounts?:Readonly<{vida6Only:number;vida7Only:number;both:number}>;
  /** Counts by non-disclosing failure class. Old cache revisions may omit this. */
  readonly originDiagnostics?:readonly ArchiveColonyOriginDiagnostic38Bis[];
  readonly largestColonizer:Readonly<{
    founder:UniversalArchiveVerifiedFounder38Bis;
    colonyCount:number;
  }> | null;
}

export interface UniversalArchiveCivilizationTierCounts38Bis {
  readonly primitive:number;
  readonly advanced:number;
  readonly veryAdvanced:number;
}

export interface UniversalArchiveRow38Bis {
  readonly id:string;
  readonly scope:string;
  readonly category:UniversalArchiveIndexedCategory38Bis;
  readonly galaxyIndex:string;
  readonly subtype:string;
  readonly sortTitle:string;
  readonly title:string;
  readonly subtitle:string;
  readonly cells:Readonly<Record<string,string>>;
  /** Magnitudes públicas de la fuente del catálogo, sin reconstrucción física. */
  readonly sortNumbers?:Readonly<Record<string,number|null>>;
  readonly actions:readonly UniversalArchiveAction38Bis[];
  /** Only for a colony row; certified from the destination VIDA.9 record. */
  readonly colonyOriginTier?:ArchiveColonizerTier38Bis;
  /** Attached only after independently checking the persisted source body. */
  readonly colonyFounder?:UniversalArchiveVerifiedFounder38Bis;
  /** Failure code for an authorized destination colony; no private source data. */
  readonly colonyOriginIssue?:ArchiveColonyOriginIssue38Bis;
  /** Explicit provenance, never inferred from species name or tier alone. */
  readonly historicalOriginReconciled?:boolean;
  readonly colonyDigestDrift?:ArchiveColonyDigestDrift38Bis;
}

export interface UniversalArchiveSection38Bis {
  readonly scope:string;
  readonly category:UniversalArchiveIndexedCategory38Bis;
  readonly galaxyIndex:string;
  readonly sourceRevision:string;
  readonly indexedAtEpochMs:number;
  readonly count:number;
  /** False means current persisted biological coverage is incomplete, not an empty census. */
  readonly knowledgeComplete:boolean;
  /** Derived counters; no private biological payload is persisted in this cache. */
  readonly colonizationStatistics?:UniversalArchiveColonizationStatistics38Bis;
  readonly civilizationTierCounts?:UniversalArchiveCivilizationTierCounts38Bis;
}

export interface UniversalArchivePage38Bis {
  readonly items:readonly UniversalArchiveRow38Bis[];
  readonly total:number;
  readonly page:number;
  readonly pageSize:UniversalArchivePageSize38Bis;
  readonly totalPages:number;
}

export interface UniversalArchiveFilter38Bis {
  readonly scope:string;
  readonly category:UniversalArchiveIndexedCategory38Bis;
  readonly galaxyIndex:string|null;
  readonly subtype:string|null;
  readonly search:string;
  readonly descending:boolean;
  /** name conserva el índice ordenado ya certificado. */
  readonly sortKey?:string;
  readonly minimum?:number|null;
  readonly maximum?:number|null;
  readonly page:number;
  readonly pageSize:UniversalArchivePageSize38Bis;
}

/** Indexed search deliberately uses prefixes. Substring searches cannot be efficiently paginated by IndexedDB. */
export function universalArchiveFilterKey38Bis(value:string):string {
  return universalArchiveSearchKey38Bis(value.slice(0,120));
}

export function universalArchiveCivilizationSubtype38Bis(label:string):string {
  const value=universalArchiveSearchKey38Bis(label);
  if(value==='muy avanzada')return 'VERY_ADVANCED';
  if(value==='avanzada')return 'ADVANCED';
  if(value==='primitiva')return 'PRIMITIVE';
  return 'UNCLASSIFIED';
}
