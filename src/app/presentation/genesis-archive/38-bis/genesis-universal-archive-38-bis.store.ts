/** 38.bis · Separate, disposable IndexedDB read model: never write into GENESIS CT-0. */
import Dexie, {type Table} from 'dexie';
import {archiveDirtyCategories38BisB6,archiveDirtyJob38BisB6,
  type ArchiveDirtyJob38BisB6} from './genesis-universal-archive-dirty-38-bis-b6';
import type {GenesisKnowledgeCommit38BisB6} from '../../../data/local/repository/genesis-knowledge-commits-38-bis-b6';
import {archiveProgressCheckpointId38BisB4, type ArchiveProgressCheckpoint38BisB4,
  type ArchiveProgressSnapshot38BisB4, type ArchiveProgressPhase38BisB4}
  from './genesis-universal-archive-progress-38-bis-b4';
import {archiveSortOption38BisB3,archiveSortValue38BisB3}
  from './genesis-universal-archive-sort-38-bis-b3';
import {
  type UniversalArchiveFilter38Bis, type UniversalArchivePage38Bis,
  type UniversalArchiveRow38Bis, type UniversalArchiveSection38Bis,
  type UniversalArchiveIndexedCategory38Bis,
  universalArchiveFilterKey38Bis, universalArchivePage38Bis,
} from './genesis-universal-archive-38-bis.model';

/** Índice derivado, construido solo al solicitar una nueva columna de ordenación. */
interface ArchiveSortRow38BisB3 {
  readonly id:string;
  readonly rowId:string;
  readonly scope:string;
  readonly category:UniversalArchiveIndexedCategory38Bis;
  readonly galaxyIndex:string;
  readonly subtype:string;
  readonly field:string;
  readonly available:0|1;
  readonly value:string|number;
  readonly sortTitle:string;
}
export interface ArchiveSortRevision38BisB3 {
  readonly id:string;
  readonly scope:string;
  readonly category:UniversalArchiveIndexedCategory38Bis;
  readonly galaxyIndex:string;
  readonly field:string;
  readonly sourceRevision:string;
}
const sortRevisionId=(scope:string,category:string,galaxy:string,field:string):string=>
  JSON.stringify([scope,category,galaxy,field]);

export class GenesisUniversalArchiveStore38Bis extends Dexie {
  readonly rows!:Table<UniversalArchiveRow38Bis,string>;
  readonly sections!:Table<UniversalArchiveSection38Bis,readonly [string,string,string]>;
  readonly sortRows!:Table<ArchiveSortRow38BisB3,string>;
  readonly sortRevisions!:Table<ArchiveSortRevision38BisB3,string>;
  readonly progressCheckpoints!:Table<ArchiveProgressCheckpoint38BisB4,string>;
  readonly dirtyJobs!:Table<ArchiveDirtyJob38BisB6,string>;

  /** Permite inyectar IndexedDB en tests sin depender de globales del worker.
   * En producción no se proporciona: se utiliza el IndexedDB real del navegador. */
  constructor(name='genesis-web-archive-38bis',
    dependencies?: Readonly<{indexedDB: IDBFactory; IDBKeyRange: typeof IDBKeyRange}>) {
    super(name,{autoOpen:false,...dependencies});
    this.version(1).stores({
      rows:'id, [scope+category], [scope+category+galaxyIndex], [scope+category+sortTitle], [scope+category+galaxyIndex+sortTitle], [scope+category+subtype+sortTitle], [scope+category+galaxyIndex+subtype+sortTitle]',
      sections:'[scope+category+galaxyIndex], [scope+category], scope',
    });
    this.version(2).stores({
      sortRows:'id, [scope+category+galaxyIndex], [scope+category+galaxyIndex+field], [scope+category+field+available+value+rowId], [scope+category+galaxyIndex+field+available+value+rowId], [scope+category+subtype+field+available+value+rowId], [scope+category+galaxyIndex+subtype+field+available+value+rowId]',
      sortRevisions:'id, [scope+category+galaxyIndex]',
    });
    // Non-destructive migration: the v1/v2 scientific cache is preserved.
    this.version(3).stores({
      progressCheckpoints:'id, scope, [scope+category+galaxyIndex]',
      sortRevisions:'id, scope, [scope+category+galaxyIndex]',
    });
    // B6: only a small durable queue in the disposable Archive DB.
    // Existing catalogue rows, revisions and sort caches are untouched.
    this.version(4).stores({
      dirtyJobs:'id, scope, status, [scope+category+galaxyIndex]',
    });
  }

  /** Persisted/coalesced after a knowledge transaction commits. Repeated body
   * discoveries do not create duplicate work for the same galaxy/category. */
  async enqueueKnowledgeChange38BisB6(event:GenesisKnowledgeCommit38BisB6,scope:string,
    now=Date.now()):Promise<number>{
    const categories=archiveDirtyCategories38BisB6(event.kind);
    if(categories.length===0)return 0;
    await this.open();
    await this.transaction('rw',this.dirtyJobs,async()=>{
      for(const category of categories){
        const id=JSON.stringify([scope,event.galaxyIndex,category]);
        const old=await this.dirtyJobs.get(id);
        await this.dirtyJobs.put(archiveDirtyJob38BisB6(event,scope,category,old,now));
      }
    });
    return categories.length;
  }

  /** Claim in a transaction. Two workers cannot claim the same pending row. */
  async claimKnowledgeChange38BisB6(now=Date.now()):Promise<ArchiveDirtyJob38BisB6|null>{
    await this.open();
    return this.transaction('rw',this.dirtyJobs,async()=>{
      const job=await this.dirtyJobs.where('status').equals('PENDING').first();
      if(!job)return null;
      const claimed:ArchiveDirtyJob38BisB6={...job,status:'RUNNING',
        startedAtEpochMs:now,updatedAtEpochMs:now};
      await this.dirtyJobs.put(claimed);
      return claimed;
    });
  }

  /** On restart only stale jobs may be recovered: an active tab might own the
   * others. Never delete a committed section due to an abandoned queue job. */
  async recoverKnowledgeChanges38BisB6(now=Date.now(),leaseMs=120_000):Promise<number>{
    await this.open();
    const interrupted=await this.dirtyJobs.where('status').equals('RUNNING')
      .filter(job=>job.startedAtEpochMs===null||now-job.startedAtEpochMs>leaseMs)
      .modify({status:'PENDING',startedAtEpochMs:null,updatedAtEpochMs:now});
    // Bounded automatic retry for transient source/index errors. Permanent
    // errors remain visible and never cause an unbounded CPU retry loop.
    const retried=await this.dirtyJobs.where('status').equals('ERROR')
      .filter(job=>job.attempts<3 && now-job.updatedAtEpochMs>=30_000*Math.pow(2,Math.max(0,job.attempts-1)))
      .modify({status:'PENDING',startedAtEpochMs:null,updatedAtEpochMs:now});
    return interrupted+retried;
  }

  /** A new notification may arrive during indexing. Then its serial changes
   * and completion must leave a pending job instead of dropping the event. */
  async finishKnowledgeChange38BisB6(claimed:ArchiveDirtyJob38BisB6,
    error?:string,now=Date.now()):Promise<void>{
    await this.open();
    await this.transaction('rw',this.dirtyJobs,async()=>{
      const current=await this.dirtyJobs.get(claimed.id);
      if(!current)return;
      if(current.serial!==claimed.serial){
        if(current.status!=='PENDING')await this.dirtyJobs.put({...current,status:'PENDING',startedAtEpochMs:null});
        return;
      }
      if(!error){await this.dirtyJobs.delete(claimed.id);return;}
      await this.dirtyJobs.put({...current,status:'ERROR',attempts:current.attempts+1,
        startedAtEpochMs:null,error:error.slice(0,220),updatedAtEpochMs:now});
    });
  }

  async pendingKnowledgeChangeCount38BisB6():Promise<number>{
    await this.open();return this.dirtyJobs.where('status').equals('PENDING').count();
  }

  /** Existing sections/sort revisions are authoritative completed checkpoints.
   * In-progress metadata is only a hint; never treat it as a published index. */
  async progressFor(scope:string):Promise<ArchiveProgressSnapshot38BisB4> {
    await this.open();
    const [sections,sortRevisions,checkpoints]=await Promise.all([
      this.sections.where('scope').equals(scope).toArray(),
      this.sortRevisions.where('scope').equals(scope).toArray(),
      this.progressCheckpoints.where('scope').equals(scope).toArray(),
    ]);
    return {sections,sortRevisions,checkpoints};
  }

  async checkpoint(scope:string,category:UniversalArchiveIndexedCategory38Bis,
    galaxyIndex:string,field:string,phase:ArchiveProgressPhase38BisB4):Promise<void> {
    await this.open();
    await this.progressCheckpoints.put({id:archiveProgressCheckpointId38BisB4(scope,category,galaxyIndex,field),
      scope,category,galaxyIndex,field,phase,updatedAtEpochMs:Date.now()});
  }

  async sectionsFor(scope:string):Promise<readonly UniversalArchiveSection38Bis[]> {
    await this.open();
    return this.sections.where('scope').equals(scope).toArray();
  }

  /** Remove derived rows for galaxies that are no longer in observed knowledge.
   * Do not trust an old cache after a discovery reset or universe restore. */
  async pruneUnknownGalaxies(scope:string,known:ReadonlySet<string>):Promise<void> {
    await this.open();
    const sections=await this.sections.where('scope').equals(scope).toArray();
    const stale=sections.filter(section=>!known.has(section.galaxyIndex));
    if(stale.length===0)return;
    await this.transaction('rw',this.rows,this.sections,this.sortRows,this.sortRevisions,this.progressCheckpoints,async()=>{
      for(const section of stale){
        await this.sortRows.where('[scope+category+galaxyIndex]')
          .equals([scope,section.category,section.galaxyIndex]).delete();
        const revisions=await this.sortRevisions.where('[scope+category+galaxyIndex]')
          .equals([scope,section.category,section.galaxyIndex]).toArray();
        if(revisions.length)await this.sortRevisions.bulkDelete(revisions.map(r=>r.id));
        await this.rows.where('[scope+category+galaxyIndex]')
          .equals([scope,section.category,section.galaxyIndex]).delete();
        await this.sections.delete([scope,section.category,section.galaxyIndex]);
        await this.progressCheckpoints.where('[scope+category+galaxyIndex]')
          .equals([scope,section.category,section.galaxyIndex]).delete();
      }
    });
  }

  /** 38.bis-b7: remove a former confirmed galaxy after restore/downgrade.
   * Only the disposable archive cache is touched; CT-0 discoveries stay intact. */
  async removeGalaxyFragment38BisB7(scope:string,galaxyIndex:string):Promise<void> {
    const current=await this.sectionsFor(scope);
    await this.pruneUnknownGalaxies(scope,new Set(current
      .filter(section=>section.galaxyIndex!==galaxyIndex).map(section=>section.galaxyIndex)));
  }

  /** 38.bis-b7a — v2 is isolated from v1 by its scope, so deleting a large
   * v1 cache is never a prerequisite for rendering the Archive. Each tick
   * removes at most 250 entries from ONE derived table and yields to the UI.
   * Never touch GenesisIndexedDb or the exploration/source repositories. */
  private readonly deferredCleanup38BisB7a=new Set<string>();
  private readonly legacyRevision38BisB7='GENESIS/38.bis/observed-index/v1';
  private readonly confirmedRevision38BisB7='GENESIS/38.bis/scientific-confirmed/v2';
  private legacyScope38BisB7(currentScope:string):string|null {
    if(!currentScope.startsWith(this.confirmedRevision38BisB7+'|'))return null;
    return this.legacyRevision38BisB7+currentScope.slice(this.confirmedRevision38BisB7.length);
  }

  /** A single small unit of legacy GC; true means more cleanup may remain. */
  async discardLegacyScopeSlice38BisB7a(currentScope:string,limit=250):Promise<boolean>{
    const legacyScope=this.legacyScope38BisB7(currentScope);
    if(!legacyScope)return false;
    await this.open();
    const section=await this.sections.where('scope').equals(legacyScope).first();
    if(section){
      const selector:[string,string,string]=[legacyScope,section.category,section.galaxyIndex];
      if(await this.sortRows.where('[scope+category+galaxyIndex]').equals(selector).limit(limit).delete())return true;
      if(await this.sortRevisions.where('[scope+category+galaxyIndex]').equals(selector).limit(limit).delete())return true;
      if(await this.rows.where('[scope+category+galaxyIndex]').equals(selector).limit(limit).delete())return true;
      if(await this.progressCheckpoints.where('[scope+category+galaxyIndex]').equals(selector).limit(limit).delete())return true;
      await this.sections.delete(selector);
      return true;
    }
    // Incomplete jobs/checkpoints may exist without a published section.
    if(await this.dirtyJobs.where('scope').equals(legacyScope).limit(limit).delete())return true;
    if(await this.progressCheckpoints.where('scope').equals(legacyScope).limit(limit).delete())return true;
    if(await this.sortRevisions.where('scope').equals(legacyScope).limit(limit).delete())return true;
    return false;
  }

  /** Explicit maintenance API, retained for tests and administrative repair.
   * It does not execute one enormous Dexie transaction. */
  async discardLegacyScope38BisB7(currentScope:string):Promise<void>{
    while(await this.discardLegacyScopeSlice38BisB7a(currentScope)) {
      await new Promise<void>(resolve=>setTimeout(resolve,0));
    }
  }

  /** Fire-and-forget maintenance AFTER the view has reached ready.
   * No IndexedDB operation is started from this synchronous method. */
  scheduleLegacyCleanup38BisB7a(currentScope:string):void {
    if(!this.legacyScope38BisB7(currentScope) || this.deferredCleanup38BisB7a.has(currentScope))return;
    this.deferredCleanup38BisB7a.add(currentScope);
    const step=async():Promise<void>=>{
      try{
        const more=await this.discardLegacyScopeSlice38BisB7a(currentScope);
        if(more){setTimeout(()=>{void step();},40);return;}
      }catch(error){
        console.warn('GENESIS 38.bis-b7a: limpieza diferida del índice antiguo',error);
      }
      this.deferredCleanup38BisB7a.delete(currentScope);
    };
    setTimeout(()=>{void step();},1500);
  }

  /** Atomic publish: a crash never exposes a half-built galactic fragment. */
  async publish(section:UniversalArchiveSection38Bis,rows:readonly UniversalArchiveRow38Bis[]):Promise<void> {
    if(rows.length!==section.count || rows.some(row=>row.scope!==section.scope ||
      row.category!==section.category || row.galaxyIndex!==section.galaxyIndex) ||
      new Set(rows.map(row=>row.id)).size!==rows.length) {
      throw new Error('38.bis: fragmento de índice incoherente; no publicar');
    }
    await this.open();
    await this.transaction('rw',this.rows,this.sections,this.sortRows,this.sortRevisions,this.progressCheckpoints,async()=>{
      // Toda reconstrucción de un fragmento invalida sus claves derivadas.
      await this.sortRows.where('[scope+category+galaxyIndex]')
        .equals([section.scope,section.category,section.galaxyIndex]).delete();
      // T3: retain revision headers as durable usage intents. If a manual
      // rebuild reuses the same scientific revision, mark it stale explicitly.
      const intents=await this.sortRevisions.where('[scope+category+galaxyIndex]')
        .equals([section.scope,section.category,section.galaxyIndex]).toArray();
      for(const intent of intents){
        if(intent.sourceRevision===section.sourceRevision)
          await this.sortRevisions.put({...intent,sourceRevision:'stale|'+intent.sourceRevision});
      }
      await this.rows.where('[scope+category+galaxyIndex]')
        .equals([section.scope,section.category,section.galaxyIndex]).delete();
      for(let i=0;i<rows.length;i+=500)await this.rows.bulkPut(rows.slice(i,i+500));
      await this.sections.put(section);
      // Same atomic transaction as the published base fragment.
      await this.progressCheckpoints.where('[scope+category+galaxyIndex]')
        .equals([section.scope,section.category,section.galaxyIndex]).delete();
      await this.progressCheckpoints.put({
        id:archiveProgressCheckpointId38BisB4(section.scope,section.category,section.galaxyIndex,'base'),
        scope:section.scope,category:section.category,galaxyIndex:section.galaxyIndex,field:'base',
        phase:'DONE',updatedAtEpochMs:Date.now(),
      });
    });
  }

  /** Durable sort intents: a previously used field stays discoverable even
   * when its fragment was atomically replaced. New galaxies inherit only
   * category fields actually used somewhere in this universe. */
  async usedSortFields38BisT3(scope:string,category:UniversalArchiveIndexedCategory38Bis):Promise<readonly string[]> {
    await this.open();
    const revisions=await this.sortRevisions.where('scope').equals(scope)
      .filter(row=>row.category===category).toArray();
    return [...new Set(revisions.map(r=>r.field))]
      .filter(field=>archiveSortOption38BisB3(category,field).key===field && field!=='name');
  }

  /** A small scoped queue lookup; it does not examine scientific records. */
  async knowledgeJobsFor38BisT3(scope:string):Promise<readonly ArchiveDirtyJob38BisB6[]> {
    await this.open();return this.dirtyJobs.where('scope').equals(scope).toArray();
  }

  /** Construye únicamente la columna solicitada, reutilizando las filas observadas.
   * No toca datos científicos ni requiere releer los catálogos galácticos. */
  async ensureSortField(scope:string,category:UniversalArchiveIndexedCategory38Bis,
    galaxyIndex:string,field:string,
    project?:(rows:readonly UniversalArchiveRow38Bis[])=>Promise<readonly UniversalArchiveRow38Bis[]>):Promise<void> {
    const option=archiveSortOption38BisB3(category,field);
    if(option.kind==='name')return;
    await this.open();
    const source=await this.sections.get([scope,category,galaxyIndex]);
    if(!source)throw new Error('38.bis-b3: falta el fragmento de conocimiento verificado');
    const id=sortRevisionId(scope,category,galaxyIndex,option.key);
    if((await this.sortRevisions.get(id))?.sourceRevision===source.sourceRevision)return;
    await this.checkpoint(scope,category,galaxyIndex,option.key,'RUNNING');
    try {
    const rows=await this.rows.where('[scope+category+galaxyIndex]')
      .equals([scope,category,galaxyIndex]).toArray();
    if(rows.length!==source.count)throw new Error('38.bis-b3: fragmento de ordenación incompleto');
    // Biology / galaxy projection stays outside the generic disposable store.
    // Values come only from the confirmed VIDA.9 view, never Ground Truth.
    const projected=project?await project(rows):rows;
    if(projected.length!==rows.length)throw new Error('38.bis-T3: proyección de ordenación incompleta');
    const prepared:ArchiveSortRow38BisB3[]=projected.map(row=>{
      const v=archiveSortValue38BisB3(row,option);
      const available=v===null?0:1;
      return Object.freeze({id:sortRevisionId(scope,category,galaxyIndex,option.key)+'|'+row.id,
        rowId:row.id,scope,category,galaxyIndex,subtype:row.subtype,field:option.key,
        available,value:v??(option.kind==='text'?'':0),sortTitle:row.sortTitle});
    });
    await this.transaction('rw',this.sortRows,this.sortRevisions,this.sections,this.progressCheckpoints,async()=>{
      const current=await this.sections.get([scope,category,galaxyIndex]);
      if(current?.sourceRevision!==source.sourceRevision)
        throw new Error('38.bis-b3: conocimiento actualizado durante la ordenación');
      await this.sortRows.where('[scope+category+galaxyIndex+field]')
        .equals([scope,category,galaxyIndex,option.key]).delete();
      for(let start=0;start<prepared.length;start+=500){
        await this.sortRows.bulkPut(prepared.slice(start,start+500));
      }
      await this.sortRevisions.put({id,scope,category,galaxyIndex,field:option.key,sourceRevision:source.sourceRevision});
      await this.progressCheckpoints.put({id:archiveProgressCheckpointId38BisB4(scope,category,galaxyIndex,option.key),
        scope,category,galaxyIndex,field:option.key,phase:'DONE',updatedAtEpochMs:Date.now()});
    });
    } catch(error) {
      try {await this.checkpoint(scope,category,galaxyIndex,option.key,'ERROR');}
      catch { /* Conservar el fallo original de indexación. */ }
      throw error;
    }
  }

  /** Ordenación global REAL antes de paginar. Los valores ausentes siempre al final.
   * El índice compuesto evita cargar todos los objetos en el componente Angular. */
  private async sortedPage(filter:UniversalArchiveFilter38Bis):Promise<UniversalArchivePage38Bis>{
    const field=filter.sortKey??'name';
    const option=archiveSortOption38BisB3(filter.category,field);
    const {scope,category,galaxyIndex,subtype}=filter;
    const index=galaxyIndex!==null&&subtype!==null
      ?'[scope+category+galaxyIndex+subtype+field+available+value+rowId]'
      :galaxyIndex!==null?'[scope+category+galaxyIndex+field+available+value+rowId]'
      :subtype!==null?'[scope+category+subtype+field+available+value+rowId]'
      :'[scope+category+field+available+value+rowId]';
    const head=[scope,category,...(galaxyIndex===null?[]:[galaxyIndex]),
      ...(subtype===null?[]:[subtype]),option.key];
    const searchPrefix=universalArchiveFilterKey38Bis(filter.search);
    const numericRange=option.kind==='number' &&
      (filter.minimum!==null && filter.minimum!==undefined ||
        filter.maximum!==null && filter.maximum!==undefined);
    const select=(available:0|1)=>{
      const prefix=[...head,available];
      let cursor=this.sortRows.where(index).between(prefix,[...prefix,[]],false,true);
      if(searchPrefix || numericRange)cursor=cursor.filter(row=>
        (!searchPrefix || row.sortTitle.startsWith(searchPrefix)) &&
        (!numericRange || available===1 && typeof row.value==='number' &&
          (filter.minimum===null||filter.minimum===undefined||row.value>=filter.minimum) &&
          (filter.maximum===null||filter.maximum===undefined||row.value<=filter.maximum)));
      return filter.descending?cursor.reverse():cursor;
    };
    const known=select(1);
    const unknown=numericRange?null:select(0);
    const knownCount=await known.count(),missingCount=unknown?await unknown.count():0;
    const total=knownCount+missingCount;
    const page=universalArchivePage38Bis(filter.page,total,filter.pageSize);
    const offset=(page-1)*filter.pageSize;
    const fromKnown=offset<knownCount?await known.offset(offset).limit(filter.pageSize).toArray():[];
    const remaining=filter.pageSize-fromKnown.length;
    const fromUnknown=remaining>0 && unknown
      ?await unknown.offset(Math.max(0,offset-knownCount)).limit(remaining).toArray():[];
    const keys=[...fromKnown,...fromUnknown].map(row=>row.rowId);
    const retrieved=await this.rows.bulkGet(keys);
    if(retrieved.some(value=>value===undefined))throw new Error('38.bis-b3: índice de ordenación desactualizado');
    return Object.freeze({items:retrieved.filter((row):row is UniversalArchiveRow38Bis=>row!==undefined),
      total,page,pageSize:filter.pageSize,totalPages:Math.max(1,Math.ceil(total/filter.pageSize))});
  }

  async page(filter:UniversalArchiveFilter38Bis):Promise<UniversalArchivePage38Bis> {
    await this.open();
    if(filter.sortKey && filter.sortKey!=='name' &&
      archiveSortOption38BisB3(filter.category,filter.sortKey).kind!=='name')
      return this.sortedPage(filter);
    const {scope,category,galaxyIndex,subtype}=filter;
    const prefix=universalArchiveFilterKey38Bis(filter.search);
    const low=[scope,category,...(galaxyIndex===null?[]:[galaxyIndex]),
      ...(subtype===null?[]:[subtype]),prefix];
    const high=[...low.slice(0,-1),prefix+'\uffff'];
    const index=galaxyIndex!==null&&subtype!==null?'[scope+category+galaxyIndex+subtype+sortTitle]':
      galaxyIndex!==null?'[scope+category+galaxyIndex+sortTitle]':
      subtype!==null?'[scope+category+subtype+sortTitle]':'[scope+category+sortTitle]';
    const selected=this.rows.where(index).between(low,high,true,true);
    const total=await selected.count();
    const page=universalArchivePage38Bis(filter.page,total,filter.pageSize);
    const ordered=filter.descending?selected.reverse():selected;
    const items=await ordered.offset((page-1)*filter.pageSize).limit(filter.pageSize).toArray();
    return Object.freeze({items,total,page,pageSize:filter.pageSize,
      totalPages:Math.max(1,Math.ceil(total/filter.pageSize))});
  }
}
