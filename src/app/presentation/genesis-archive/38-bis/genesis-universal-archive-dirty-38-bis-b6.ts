/** Scope-aware, coalesced Archive changes: one job per universe/galaxy/category.
 * The queue stores no names, scientific values or private biology. */
import type {GenesisKnowledgeCommit38BisB6} from '../../../data/local/repository/genesis-knowledge-commits-38-bis-b6';
import type {UniversalArchiveIndexedCategory38Bis} from './genesis-universal-archive-38-bis.model';

export type ArchiveDirtyStatus38BisB6='PENDING'|'RUNNING'|'ERROR';
export interface ArchiveDirtyJob38BisB6 {
  readonly id:string;
  readonly scope:string;
  readonly universeSeed:string;
  readonly generatorVersionCode:number;
  readonly galaxyIndex:string;
  readonly category:UniversalArchiveIndexedCategory38Bis;
  readonly status:ArchiveDirtyStatus38BisB6;
  /** Incremented on every new notification. A running job cannot erase it. */
  readonly serial:number;
  readonly attempts:number;
  readonly updatedAtEpochMs:number;
  readonly startedAtEpochMs:number|null;
  readonly error?:string;
}

export const ARCHIVE_DIRTY_CATEGORIES_38BIS_B6=Object.freeze({
  GALAXY:['systems','clusters','nebulae','extremes'],
  SECTOR:[], // No Sector list in 38.bis; other discoveries emit their own events.
  GALACTIC_OBJECT:['systems','clusters','nebulae','extremes'],
  SYSTEM:['systems','planets','moons','asteroids','comets','tno','captured',
    'civilizations','colonies','colonized-planets','colonized-moons'],
  BODY:['planets','moons','asteroids','comets','tno','captured'],
  CIVILIZATION:['civilizations','colonies','colonized-planets','colonized-moons'],
  VIDA9:['civilizations','colonies','colonized-planets','colonized-moons'],
  RESTORE:['systems','planets','moons','clusters','nebulae','extremes',
    'asteroids','comets','tno','captured','civilizations',
    'colonies','colonized-planets','colonized-moons'],
} as const satisfies Record<GenesisKnowledgeCommit38BisB6['kind'],readonly UniversalArchiveIndexedCategory38Bis[]>);

export function archiveDirtyCategories38BisB6(kind:GenesisKnowledgeCommit38BisB6['kind']):
  readonly UniversalArchiveIndexedCategory38Bis[] {
  return ARCHIVE_DIRTY_CATEGORIES_38BIS_B6[kind];
}
export function archiveDirtyJobId38BisB6(scope:string,galaxy:string,
  category:UniversalArchiveIndexedCategory38Bis):string {
  return JSON.stringify([scope,galaxy,category]);
}

/** Scope must agree with archive38BisScope; do not duplicate its revision text. */
export function archiveDirtyJob38BisB6(
  event:GenesisKnowledgeCommit38BisB6, scope:string,
  category:UniversalArchiveIndexedCategory38Bis, old:ArchiveDirtyJob38BisB6|undefined,
  now:number,
):ArchiveDirtyJob38BisB6 {
  return Object.freeze({id:archiveDirtyJobId38BisB6(scope,event.galaxyIndex,category),
    scope,universeSeed:event.universeSeed,generatorVersionCode:event.generatorVersionCode,
    galaxyIndex:event.galaxyIndex,category,status:'PENDING' as const,
    serial:(old?.serial??0)+1,attempts:0,updatedAtEpochMs:now,startedAtEpochMs:null});
}
