/** 38.bis-b6 · Always-on, low-priority Archive upkeep. No navigation to
 * /archive is necessary. All source reads remain knowledge-safe. */
import {inject,Injectable} from '@angular/core';
import {isBulkGalaxyConfirmationActive} from '../../codes/bulk-galaxy-confirmation-session';
import {UniverseGenerationKey} from '../../../domain/generation/universe-generation-key';
import {GeneratorVersion} from '../../../domain/generation/generator-version';
import {UniverseSeed} from '../../../domain/universe/universe-seed';
import {GalaxyLocator} from '../../../domain/generation/procedural-locator';
import {GalaxyGeneralProfileEngine} from '../../../simulation/exploration/galaxy-general-profile-engine';
import {isConfirmedScientificGalaxy38BisB7} from '../../../domain/exploration/scientific-confirmation-38-bis-b7';
import {GENESIS_LOCAL_REPOSITORIES} from '../../runtime/genesis-local-repositories';
import {GenesisUniversalArchiveIndex38Bis,archive38BisScope} from './genesis-universal-archive-38-bis.index';
import {subscribeGenesisKnowledgeCommits38BisB6,type GenesisKnowledgeCommit38BisB6}
  from '../../../data/local/repository/genesis-knowledge-commits-38-bis-b6';
import {archiveDirtyCategories38BisB6, type ArchiveDirtyJob38BisB6}
  from './genesis-universal-archive-dirty-38-bis-b6';

@Injectable({providedIn:'root'})
export class GenesisUniversalArchiveAutoIndex38BisB6 {
  private readonly repository=inject(GENESIS_LOCAL_REPOSITORIES);
  private readonly index=inject(GenesisUniversalArchiveIndex38Bis);
  private active=false;
  private working=false;
  private timer:ReturnType<typeof setTimeout>|null=null;
  private timerDueAt=0;
  private unsubscribe:(()=>void)|null=null;

  /** Called once at application bootstrap; registers before any user navigation. */
  start():void {
    if(this.active)return;
    this.active=true;
    this.unsubscribe=subscribeGenesisKnowledgeCommits38BisB6(event=>this.record(event));
    this.schedule(1500);
  }

  stop():void {
    this.active=false;
    this.unsubscribe?.();this.unsubscribe=null;
    if(this.timer!==null){clearTimeout(this.timer);this.timer=null;}
    this.timerDueAt=0;
  }

  private async record(event:GenesisKnowledgeCommit38BisB6):Promise<void>{
    if(archiveDirtyCategories38BisB6(event.kind).length===0 ||
      !UniverseSeed.isValid(event.universeSeed) ||
      GeneratorVersion.fromCodeOrNull(event.generatorVersionCode)===null ||
      !/^(0|[1-9]\d*)$/.test(event.galaxyIndex))return;
    const key=this.keyFor(event.universeSeed,event.generatorVersionCode);
    // A committed discovery invalidates a shared ARCHFAST snapshot even when
    // the queue already has a job for this galaxy.
    this.index.invalidateArchiveFastGalaxy(key,event.galaxyIndex);
    await this.index.store.enqueueKnowledgeChange38BisB6(event,archive38BisScope(key));
    this.schedule(1800);
  }

  private keyFor(seed:string,version:number):UniverseGenerationKey {
    return new UniverseGenerationKey(UniverseSeed.parse(seed),GeneratorVersion.fromCode(version));
  }

  private schedule(delay:number):void {
    if(!this.active)return;
    const due=Date.now()+delay;
    // A new scientific confirmation must preempt the 30-second idle retry.
    if(this.timer!==null && this.timerDueAt<=due)return;
    if(this.timer!==null)clearTimeout(this.timer);
    this.timerDueAt=due;
    this.timer=setTimeout(()=>{
      this.timer=null;this.timerDueAt=0;
      void this.tick();
    },delay);
  }

  /** One scoped fragment per turn. A discovery never triggers a 15-galaxy
   * reindex. Heavy catalogue queries yield between requests via their source. */
  private async tick():Promise<void>{
    if(!this.active||this.working)return;
    if (isBulkGalaxyConfirmationActive()) {
      this.schedule(2500);
      return;
    }
    this.working=true;
    let processed=false;
    try{
      const run=async(exclusive:boolean)=>{
        // When the Web Locks API holds this cross-tab mutex, no other tab can
        // own a running job; a reload may recover immediately. Fallback uses
        // a long lease instead to avoid stealing another tab's active work.
        await this.index.store.recoverKnowledgeChanges38BisB6(Date.now(),exclusive?0:600_000);
        const job=await this.index.store.claimKnowledgeChange38BisB6();
        if(job){processed=true;await this.process(job);}
      };
      if(typeof navigator!=='undefined' && navigator.locks){
        await navigator.locks.request('genesis-archive-38bis-b6',
          {ifAvailable:true},async lock=>{if(lock)await run(true);});
      }else await run(false);
    }catch(error){
      console.warn('GENESIS 38.bis-b6: fallo de actualización del índice',error);
    }finally{
      this.working=false;
      // Recheck occasionally even without Archive navigation, to recover a
      // pending job whose previous tab stopped mid-transaction.
      this.schedule(processed?200:30_000);
    }
  }

  private async process(job:ArchiveDirtyJob38BisB6):Promise<void>{
    try{
      const key=this.keyFor(job.universeSeed,job.generatorVersionCode);
      // A restored/deleted universe must not revive knowledge from old cache.
      if(!(await this.repository.universeRepository.exists(key))){
        await this.index.store.finishKnowledgeChange38BisB6(job);return;
      }
      // B7a: never hold a knowledge-update worker behind a full legacy purge.
      this.index.store.scheduleLegacyCleanup38BisB7a(archive38BisScope(key));
      const state=await this.repository.discoveryRepository.getState(key,
        new GalaxyLocator(BigInt(job.galaxyIndex)));
      if(!isConfirmedScientificGalaxy38BisB7(state)){
        await this.index.store.removeGalaxyFragment38BisB7(archive38BisScope(key),job.galaxyIndex);
        await this.index.store.finishKnowledgeChange38BisB6(job);return;
      }
      // ensure() checks persisted galaxy discovery revision and VIDA.9 digest
      // fingerprint. It rebuilds only the affected galaxy/category, atomically.
      await this.index.ensure(key,job.galaxyIndex,job.category,undefined,false,true,
        (done,total)=>this.index.store.setKnowledgeChangeProgressArchfast1(
          job,'FRAGMENT',undefined,0,0,done,total));
      // Existing scientific sort intents are retained; only stale fields are
      // built. Their source rows (and any biological projection) are reused.
      const profile=GalaxyGeneralProfileEngine.build(key,BigInt(job.galaxyIndex),state);
      const galaxyTitle=profile.knownName??profile.designationCode;
      await this.index.store.setKnowledgeChangeProgressArchfast1(job,'SORTS',undefined,0,0);
      await this.index.ensureUsedSortsArchfast1(key,job.galaxyIndex,job.category,
        galaxyTitle,(field,done,total)=>
          this.index.store.setKnowledgeChangeProgressArchfast1(job,'SORTS',field,done,total));
      await this.index.store.finishKnowledgeChange38BisB6(job);
    }catch(error){
      await this.index.store.finishKnowledgeChange38BisB6(job,
        error instanceof Error?error.message:String(error));
    }
  }
}
