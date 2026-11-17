/** 38.bis-b4 · Progress is a disposable read model, never scientific truth.
 * A stored fragment is not proof that it still matches current discoveries;
 * the existing ensure() revision check remains authoritative.
 */
import {archiveSortOptions38BisB3} from './genesis-universal-archive-sort-38-bis-b3';
import {type UniversalArchiveIndexedCategory38Bis,
  type UniversalArchiveSection38Bis} from './genesis-universal-archive-38-bis.model';

export type ArchiveProgressPhase38BisB4='RUNNING'|'DONE'|'ERROR';
export interface ArchiveProgressCheckpoint38BisB4 {
  readonly id:string;
  readonly scope:string;
  readonly category:UniversalArchiveIndexedCategory38Bis;
  readonly galaxyIndex:string;
  /** 'base' denotes the galactic/category fragment; other values are sort-field keys. */
  readonly field:string;
  readonly phase:ArchiveProgressPhase38BisB4;
  readonly updatedAtEpochMs:number;
}
export interface ArchiveProgressSortRevision38BisB4 {
  readonly scope:string;
  readonly category:UniversalArchiveIndexedCategory38Bis;
  readonly galaxyIndex:string;
  readonly field:string;
  readonly sourceRevision:string;
}
export interface ArchiveProgressSnapshot38BisB4 {
  readonly sections:readonly UniversalArchiveSection38Bis[];
  readonly sortRevisions:readonly ArchiveProgressSortRevision38BisB4[];
  readonly checkpoints:readonly ArchiveProgressCheckpoint38BisB4[];
}
export type ArchiveProgressStatus38BisB4='STORED'|'ACTIVE'|'INTERRUPTED'|'FAILED'|'PENDING'|'OUTDATED';
export interface ArchiveProgressActive38BisB4 {
  readonly category:UniversalArchiveIndexedCategory38Bis;
  readonly galaxyIndex:string;
  readonly field:string;
}
export interface ArchiveProgressCategorySummary38BisB4 {
  readonly category:UniversalArchiveIndexedCategory38Bis;
  readonly stored:number;
  /** Galaxias cuya revisión terminó en la apertura actual; no se deduce de la caché. */
  readonly checked:number;
  readonly pending:number;
  readonly interrupted:number;
  readonly failed:number;
  readonly active:number;
  readonly total:number;
}
export interface ArchiveProgressGalaxyDetail38BisB4 {
  readonly galaxyIndex:string;
  readonly name:string;
  readonly base:ArchiveProgressStatus38BisB4;
  readonly scientificSorts:readonly {readonly key:string;readonly label:string;
    readonly status:ArchiveProgressStatus38BisB4}[];
}
export const archiveProgressCheckpointId38BisB4=(scope:string,category:string,galaxyIndex:string,field:string):string=>
  JSON.stringify([scope,category,galaxyIndex,field]);

export const EMPTY_ARCHIVE_PROGRESS_38BIS_B4:ArchiveProgressSnapshot38BisB4=Object.freeze({
  sections:Object.freeze([]),sortRevisions:Object.freeze([]),checkpoints:Object.freeze([]),
});

/** Maps are built once per view; no scientific record or catalog row is read. */
export function archiveProgressOverview38BisB4(
  galaxies:readonly {readonly index:string;readonly title:string}[],
  categories:readonly UniversalArchiveIndexedCategory38Bis[],
  snapshot:ArchiveProgressSnapshot38BisB4,
  active:ArchiveProgressActive38BisB4|null,
  checked:ReadonlySet<string>=new Set<string>(),
):readonly ArchiveProgressCategorySummary38BisB4[] {
  const sections=new Set(snapshot.sections.map(s=>s.category+'|'+s.galaxyIndex));
  const checkpoints=new Map(snapshot.checkpoints.filter(p=>p.field==='base')
    .map(p=>[p.category+'|'+p.galaxyIndex,p.phase]));
  return categories.map(category=>{
    const counters={stored:0,checked:0,pending:0,interrupted:0,failed:0,active:0};
    for(const galaxy of galaxies){
      const key=category+'|'+galaxy.index;
      const materialized=sections.has(key);
      const isActive=active?.category===category&&active.galaxyIndex===galaxy.index&&active.field==='base';
      // Caché y trabajo en curso no son estados excluyentes: una revisión
      // nunca puede hacer desaparecer un fragmento que sigue publicado.
      if(materialized)counters.stored++;
      if(checked.has(key))counters.checked++;
      if(isActive)counters.active++;
      if(!materialized && !isActive){
        const phase=checkpoints.get(key);
        if(phase==='RUNNING')counters.interrupted++;
        else if(phase==='ERROR')counters.failed++;
        else counters.pending++;
      }
    }
    return Object.freeze({category,...counters,total:galaxies.length});
  });
}

export function archiveProgressStatus38BisB4(
  materialized:boolean,phase:ArchiveProgressPhase38BisB4|undefined,active:boolean|undefined,
):ArchiveProgressStatus38BisB4 {
  if(active)return 'ACTIVE';
  // A fully published fragment is retained even if a later rebuild was interrupted.
  if(materialized)return 'STORED';
  if(phase==='RUNNING')return 'INTERRUPTED';
  if(phase==='ERROR')return 'FAILED';
  return 'PENDING';
}

export function archiveProgressDetails38BisB4(
  galaxies:readonly {readonly index:string;readonly title:string}[],
  category:UniversalArchiveIndexedCategory38Bis,
  snapshot:ArchiveProgressSnapshot38BisB4,
  active:ArchiveProgressActive38BisB4|null,
):readonly ArchiveProgressGalaxyDetail38BisB4[] {
  const sections=new Map(snapshot.sections.filter(s=>s.category===category)
    .map(s=>[s.galaxyIndex,s]));
  const sortRevisions=new Map(snapshot.sortRevisions.filter(s=>s.category===category)
    .map(r=>[r.galaxyIndex+'|'+r.field,r.sourceRevision]));
  const checkpoints=new Map(snapshot.checkpoints.filter(s=>s.category===category)
    .map(r=>[r.galaxyIndex+'|'+r.field,r.phase]));
  const fields=archiveSortOptions38BisB3(category).filter(f=>f.key!=='name');
  return galaxies.map(galaxy=>{
    const section=sections.get(galaxy.index);
    const base=archiveProgressStatus38BisB4(section!==undefined,checkpoints.get(galaxy.index+'|base'),
      active?.category===category&&active.galaxyIndex===galaxy.index&&active.field==='base');
    const scientificSorts=fields.map(field=>{
      const revision=sortRevisions.get(galaxy.index+'|'+field.key);
      const activeSort=active?.category===category&&active.galaxyIndex===galaxy.index&&active.field===field.key;
      const phase=checkpoints.get(galaxy.index+'|'+field.key);
      let status:ArchiveProgressStatus38BisB4;
      if(activeSort)status='ACTIVE';
      else if(section && revision===section.sourceRevision)status='STORED';
      else if(phase==='RUNNING')status='INTERRUPTED';
      else if(phase==='ERROR')status='FAILED';
      else if(revision!==undefined)status='OUTDATED';
      else status='PENDING';
      return Object.freeze({key:field.key,label:field.label,status});
    });
    return Object.freeze({galaxyIndex:galaxy.index,name:galaxy.title,base,scientificSorts});
  });
}

export function archiveProgressLabel38BisB4(status:ArchiveProgressStatus38BisB4):string {
  switch(status){
    case 'STORED':return 'Guardado';
    case 'ACTIVE':return 'En curso';
    case 'INTERRUPTED':return 'Interrumpido';
    case 'FAILED':return 'Error';
    case 'OUTDATED':return 'Desactualizado';
    default:return 'Pendiente';
  }
}
