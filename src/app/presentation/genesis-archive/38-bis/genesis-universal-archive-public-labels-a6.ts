/** 38.bis-a6 · Presentación pública, sin exponer códigos internos del índice.
 * Todas las referencias científicas y rutas permanecen en el modelo indexado. */
import type {UniversalArchiveRow38Bis,UniversalArchiveVerifiedFounder38Bis} from './genesis-universal-archive-38-bis.model';
import {stellarCatalogPublicCellLabel} from '../../galaxy-knowledge-catalog/stellar-catalog-public-labels';

export interface ArchiveNamedGalaxyA6 {readonly index:string;readonly title:string;}

export function archivePublicGalaxyNameA6(index:string,known:readonly ArchiveNamedGalaxyA6[]):string {
  const found=known.find(galaxy=>galaxy.index===index)?.title.trim();
  return found || 'Galaxia sin designación pública';
}

export function archivePublicDiscoveryStateA6(code:number):string {
  return ({1:'Detectada',2:'Descubierta',3:'Visitada',4:'Catalogada',5:'Confirmada'} as Record<number,string>)[code]
    ?? 'Estado no determinado';
}

/** Only explicit implementation/version markers are suppressed. Stellar families,
 * classifications and physical notation are never guessed or rewritten. */
export function archivePublicCopyA6(text:string):string {
  return text
    .replace(/\bVIDA\.[0-9]+(?:\.[A-Za-z0-9]+)*\b/gu,'')
    .replace(/\bCT-0\b/gu,'')
    .replace(/\bVERY_ADVANCED\b/gu,'muy avanzada')
    .replace(/\bADVANCED\b/gu,'avanzada')
    .replace(/\bPRIMITIVE\b/gu,'primitiva')
    .replace(/\b1 colonia verificadas\b/giu,'1 colonia verificada')
    .replace(/\s*·\s*·\s*/gu,' · ')
    .replace(/^\s*[·:—-]\s*|\s*[·:—-]\s*$/gu,'')
    .replace(/\s{2,}/gu,' ')
    .trim();
}

export function archivePublicSubtitleA6(row:UniversalArchiveRow38Bis,known:readonly ArchiveNamedGalaxyA6[]):string {
  // A legacy cached sector subtitle is an internal locator, not a designation.
  if(/^Galaxia\s+\d+$/iu.test(row.subtitle.trim()))
    return archivePublicGalaxyNameA6(row.galaxyIndex,known);
  return archivePublicCopyA6(row.subtitle);
}

export function archivePublicCellsA6(row:UniversalArchiveRow38Bis):readonly {key:string;value:string}[] {
  const colony=row.category==='colonies'||row.category==='colonized-planets'||row.category==='colonized-moons';
  const priority=colony
    ? ['system','count','species','originPlanet','origin','kind','technology','purpose','tier']
    : Object.keys(row.cells);
  return priority
    .filter(key=>typeof row.cells[key]==='string'&&row.cells[key]!.trim().length>0)
    .map(key=>({key,value:archivePublicCopyA6(
      stellarCatalogPublicCellLabel(row.category,key,row.cells[key]))}))
    .filter(field=>field.value.length>0)
    .slice(0,5);
}

/** Aggregated body rows cannot claim one source unless ALL their colonies have
 * verified public provenance from the same immutable source record. */
export function archiveSharedFounderA6(colonyIds:readonly string[],
  verified:ReadonlyMap<string,UniversalArchiveVerifiedFounder38Bis>):UniversalArchiveVerifiedFounder38Bis|null {
  if(colonyIds.length===0||new Set(colonyIds).size!==colonyIds.length)return null;
  const first=verified.get(colonyIds[0]!);
  if(!first?.speciesName?.trim()||!first.planetName?.trim())return null;
  for(const id of colonyIds){
    const next=verified.get(id);
    if(!next || next.id!==first.id || next.galaxyIndex!==first.galaxyIndex ||
       next.tier!==first.tier || next.speciesName!==first.speciesName ||
       next.planetName!==first.planetName || next.route.join('/')!==first.route.join('/'))return null;
  }
  return first;
}
