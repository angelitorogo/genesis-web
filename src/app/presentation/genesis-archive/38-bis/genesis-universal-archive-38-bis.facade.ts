/** 38.bis · Fast global archive: compact dashboard + lazy indexed lists. */
import {computed,inject,Injectable,signal} from '@angular/core';
import type {UniverseGenerationKey} from '../../../domain/generation/universe-generation-key';
import {GENESIS_LOCAL_REPOSITORIES} from '../../runtime/genesis-local-repositories';
import {UniverseSeedFacade} from '../../universe/universe-seed.facade';
import {isScientificRouteUniverseRef,scientificRouteUniverseRef} from '../../scientific/scientific-route-identity';
import {GenesisUniversalArchiveIndex38Bis,type KnownArchiveGalaxy38Bis,archive38BisScope} from './genesis-universal-archive-38-bis.index';
import {archiveSortOption38BisB3,archiveSortOptions38BisB3,archiveRangeBoundary38BisB3}
  from './genesis-universal-archive-sort-38-bis-b3';
import {archiveProgressOverview38BisB4,archiveProgressDetails38BisB4,
  EMPTY_ARCHIVE_PROGRESS_38BIS_B4, type ArchiveProgressActive38BisB4,
  type ArchiveProgressSnapshot38BisB4}
  from './genesis-universal-archive-progress-38-bis-b4';
import {combineArchiveColonies38Bis,diagnoseArchiveCivilizationCoverage38Bis} from './genesis-universal-archive-38-bis-colonization-stats';
import {archiveIndexPlan38BisT2,archiveIndexTaskKey38BisT2} from './genesis-universal-archive-index-plan-38bis-t2';
import {archiveVisibleFragmentChanged38BisT3b} from './genesis-universal-archive-t3b-update-policy';
import {type UniversalArchivePage38Bis,type UniversalArchiveCategory38Bis,
  type UniversalArchiveIndexedCategory38Bis,type UniversalArchiveSection38Bis,
  type UniversalArchivePageSize38Bis,universalArchiveCategory38Bis,
  UNIVERSAL_ARCHIVE_CATEGORIES_38BIS} from './genesis-universal-archive-38-bis.model';

export interface ArchiveUniverseOption38Bis {readonly ref:string;readonly label:string}
export type UniversalArchiveState38Bis='loading'|'empty'|'ready'|'error';
export interface UniversalArchiveParameters38Bis {
  readonly category:string|null; readonly universeRef:string|null;
  readonly galaxyIndex:string|null; readonly subtype:string|null;
  readonly search:string|null;readonly direction:string|null;
  readonly page:string|null;readonly size:string|null;
  readonly sort?:string|null;readonly min?:string|null;readonly max?:string|null;
}

export interface ArchiveCategoryCount38Bis {readonly count:number|null;readonly indexed:number;
  readonly totalGalaxies:number;readonly knowledgeComplete:boolean}

@Injectable({providedIn:'root'})
export class GenesisUniversalArchiveFacade38Bis {
  private readonly repositories=inject(GENESIS_LOCAL_REPOSITORIES);
  private readonly seed=inject(UniverseSeedFacade);
  private readonly index=inject(GenesisUniversalArchiveIndex38Bis);
  private readonly stateSignal=signal<UniversalArchiveState38Bis>('loading');
  private readonly errorSignal=signal('');
  private readonly optionsSignal=signal<readonly ArchiveUniverseOption38Bis[]>([]);
  private readonly galaxiesSignal=signal<readonly KnownArchiveGalaxy38Bis[]>([]);
  private readonly sectionsSignal=signal<readonly UniversalArchiveSection38Bis[]>([]);
  private readonly categorySignal=signal<UniversalArchiveCategory38Bis|null>(null);
  private readonly scopeSignal=signal('');
  private readonly selectedRefSignal=signal('');
  private readonly pageSignal=signal<UniversalArchivePage38Bis|null>(null);
  private readonly busySignal=signal(false);
  // Prevent a stale derived cache from showing rows until the live discovery
  // revision has been verified for every selected galaxy in this navigation.
  private readonly verifiedSectionsSignal=signal<ReadonlySet<string>>(new Set<string>());
  private readonly verifiedStatisticsSignal=signal<ReadonlySet<string>>(new Set<string>());
  private readonly progressSignal=signal('');
  private readonly progressSnapshotSignal=signal<ArchiveProgressSnapshot38BisB4>(EMPTY_ARCHIVE_PROGRESS_38BIS_B4);
  private readonly dirtyJobCountSignal38BisT3=signal(0);
  /** Comprobaciones completadas en esta apertura; no deben confundirse con índices persistidos. */
  private readonly checkedCatalogSignal=signal<ReadonlySet<string>>(new Set<string>());
  private readonly activeProgressSignal=signal<ArchiveProgressActive38BisB4|null>(null);
  private readonly selectedGalaxySignal=signal<string|null>(null);
  private readonly selectedSubtypeSignal=signal<string|null>(null);
  private readonly selectedSearchSignal=signal('');
  private readonly selectedDirectionSignal=signal<'asc'|'desc'>('asc');
  private readonly selectedSortSignal=signal('name');
  private readonly selectedMinimumSignal=signal<number|null>(null);
  private readonly selectedMaximumSignal=signal<number|null>(null);
  private readonly selectedPageSignal=signal(1);
  private readonly selectedSizeSignal=signal<UniversalArchivePageSize38Bis>(25);
  private generationKey:UniverseGenerationKey|null=null;
  private loadSequence=0;
  private jobSequence=0;
  private pageRequestSequence=0;
  private progressRefreshSequence=0;
  private pendingRefreshTimer38BisT3:ReturnType<typeof setTimeout>|null=null;

  readonly state=this.stateSignal.asReadonly();
  readonly error=this.errorSignal.asReadonly();
  readonly universes=this.optionsSignal.asReadonly();
  readonly galaxies=this.galaxiesSignal.asReadonly();
  readonly sections=this.sectionsSignal.asReadonly();
  readonly category=this.categorySignal.asReadonly();
  readonly scope=this.scopeSignal.asReadonly();
  readonly selectedUniverseRef=this.selectedRefSignal.asReadonly();
  readonly page=this.pageSignal.asReadonly();
  readonly busy=this.busySignal.asReadonly();
  readonly progress=this.progressSignal.asReadonly();
  readonly indexProgress=computed(()=>archiveProgressOverview38BisB4(this.galaxies(),
    this.categories.filter(c=>c.id!=='galaxies')
      .map(c=>c.id as UniversalArchiveIndexedCategory38Bis),this.progressSnapshotSignal(),
      this.activeProgressSignal(),this.checkedCatalogSignal()));
  readonly dirtyJobCount38BisT3=this.dirtyJobCountSignal38BisT3.asReadonly();
  readonly sortIndexStats38BisT3=computed(()=>{
    const snapshot=this.progressSnapshotSignal();
    const current=new Map(snapshot.sections.map(s=>
      [s.category+'|'+s.galaxyIndex,s.sourceRevision]));
    const valid=snapshot.sortRevisions.filter(r=>
      r.sourceRevision===current.get(r.category+'|'+r.galaxyIndex)).length;
    return {valid,stale:snapshot.sortRevisions.length-valid};
  });
  readonly indexProgressStored=computed(()=>this.indexProgress().reduce((sum,c)=>sum+c.stored,0));
  readonly indexProgressTotal=computed(()=>this.indexProgress().reduce((sum,c)=>sum+c.total,0));
  progressDetails(category:UniversalArchiveIndexedCategory38Bis){
    return archiveProgressDetails38BisB4(this.galaxies(),category,
      this.progressSnapshotSignal(),this.activeProgressSignal());
  }
  private markCatalogChecked(category:UniversalArchiveIndexedCategory38Bis,galaxyIndex:string):void{
    const key=category+'|'+galaxyIndex;
    this.checkedCatalogSignal.update(prior=>new Set([...prior,key]));
  }
  /** An unchanged verified fragment requires no additional full-table reads.
   * Rebuilt fragments still reload the authoritative sort/checkpoint metadata. */
  private async acceptVerifiedSection38BisT2(scope:string,section:UniversalArchiveSection38Bis):Promise<void>{
    if(scope!==this.scopeSignal())return;
    const old=this.sectionsSignal().find(s=>s.category===section.category&&s.galaxyIndex===section.galaxyIndex);
    if(old?.indexedAtEpochMs===section.indexedAtEpochMs && old.sourceRevision===section.sourceRevision)return;
    this.sectionsSignal.update(prior=>[...prior.filter(s=>
      !(s.category===section.category&&s.galaxyIndex===section.galaxyIndex)),section]);
    await this.reloadIndexProgress(scope);
  }
  /** Metadata-only filtering: never inspect scientific discovery rows to
   * decide whether cached sections may be displayed on an ordinary opening. */
  private adoptProgressSnapshot38BisT3b(scope:string,snapshot:ArchiveProgressSnapshot38BisB4):void{
    if(scope!==this.scopeSignal())return;
    const allowed=new Set(this.galaxies().map(g=>g.index));
    this.progressSnapshotSignal.set({
      sections:snapshot.sections.filter(s=>allowed.has(s.galaxyIndex)),
      sortRevisions:snapshot.sortRevisions.filter(s=>allowed.has(s.galaxyIndex)),
      checkpoints:snapshot.checkpoints.filter(s=>allowed.has(s.galaxyIndex)),
    });
  }
  private async reloadIndexProgress(scope=this.scopeSignal()):Promise<void>{
    if(!scope)return;
    const request=++this.progressRefreshSequence;
    const snapshot=await this.index.store.progressFor(scope);
    if(request===this.progressRefreshSequence)
      this.adoptProgressSnapshot38BisT3b(scope,snapshot);
  }
  readonly selectedGalaxy=this.selectedGalaxySignal.asReadonly();
  readonly selectedSubtype=this.selectedSubtypeSignal.asReadonly();
  readonly search=this.selectedSearchSignal.asReadonly();
  readonly direction=this.selectedDirectionSignal.asReadonly();
  readonly sortKey=this.selectedSortSignal.asReadonly();
  readonly minimum=this.selectedMinimumSignal.asReadonly();
  readonly maximum=this.selectedMaximumSignal.asReadonly();
  readonly pageNumber=this.selectedPageSignal.asReadonly();
  readonly pageSize=this.selectedSizeSignal.asReadonly();
  // Sectores permanece como código de lectura histórica, pero no es una categoría visible.
  readonly categories=UNIVERSAL_ARCHIVE_CATEGORIES_38BIS.filter(category=>category.id!=='sectors');
  readonly indexedGalaxies=computed(()=>this.galaxies().length);
  readonly sortOptions=computed(()=>{
    const category=this.category();
    return category===null||category==='galaxies'?[]:archiveSortOptions38BisB3(category);
  });

  /** Derived from compact section headers, never from a scan of every colony
   * row on the main thread. Its scope follows the selected universe/galaxy. */
  readonly colonizationOverview=computed(()=>{
    if(this.state()!=='ready')return null;
    const all=this.galaxies().map(g=>g.index);
    const selected=this.category()!==null?this.selectedGalaxy():null;
    const indices=selected===null?all:all.filter(id=>id===selected);
    const allowed=new Set(indices);
    const sections=this.sections();
    const verified=this.verifiedStatisticsSignal();
    const colonies=sections.filter(s=>s.category==='colonies'&&allowed.has(s.galaxyIndex) &&
      verified.has('colonies|'+s.galaxyIndex));
    const civilizations=sections.filter(s=>s.category==='civilizations'&&allowed.has(s.galaxyIndex) &&
      verified.has('civilizations|'+s.galaxyIndex));
    const statistics=combineArchiveColonies38Bis(colonies);
    const tierCoverage=diagnoseArchiveCivilizationCoverage38Bis(indices,sections,verified);
    const potentialColonizers=tierCoverage.indexed===0?null:
      tierCoverage.counts.advanced+tierCoverage.counts.veryAdvanced;
    return Object.freeze({statistics,potentialColonizers,
      indexedColonyGalaxies:colonies.length,indexedCivilizationGalaxies:tierCoverage.indexed,
      pendingTierIndexing:tierCoverage.pendingIndexing,
      pendingTierVerification:tierCoverage.pendingVerification,
      missingTierSummaries:tierCoverage.missingTierCounts,
      totalGalaxies:indices.length,
      partial:colonies.length!==indices.length||tierCoverage.indexed!==indices.length||
        colonies.some(s=>!s.knowledgeComplete)||civilizations.some(s=>!s.knowledgeComplete)});
  });

  count(category:UniversalArchiveCategory38Bis):ArchiveCategoryCount38Bis {
    const galaxies=this.galaxies();
    if(category==='galaxies')return {count:galaxies.length,indexed:galaxies.length,
      totalGalaxies:galaxies.length,knowledgeComplete:true};
    const ids=new Set(galaxies.map(g=>g.index));
    const sections=this.sections().filter(s=>s.category===category&&ids.has(s.galaxyIndex));
    return {count:sections.length>0?sections.reduce((n,s)=>n+s.count,0):null,
      indexed:sections.length,totalGalaxies:galaxies.length,
      knowledgeComplete:sections.length===galaxies.length&&sections.every(s=>s.knowledgeComplete)};
  }

  async load(raw:UniversalArchiveParameters38Bis):Promise<void> {
    const call=++this.loadSequence;
    ++this.progressRefreshSequence; // Invalidate a snapshot from an older Archive route.
    ++this.jobSequence; // Cancel any in-progress work for an older route.
    this.busySignal.set(false);
    if(this.pendingRefreshTimer38BisT3!==null){clearTimeout(this.pendingRefreshTimer38BisT3);this.pendingRefreshTimer38BisT3=null;}
    this.progressSnapshotSignal.set(EMPTY_ARCHIVE_PROGRESS_38BIS_B4);
    this.dirtyJobCountSignal38BisT3.set(0);
    this.checkedCatalogSignal.set(new Set<string>());
    this.activeProgressSignal.set(null);
    const currentCategory=universalArchiveCategory38Bis(raw.category);
    this.stateSignal.set('loading');this.errorSignal.set('');
    this.progressSignal.set('Leyendo universos persistidos…');
    this.categorySignal.set(currentCategory);
    this.pageSignal.set(null);
    this.verifiedSectionsSignal.set(new Set<string>());
    this.verifiedStatisticsSignal.set(new Set<string>());
    this.selectedSearchSignal.set((raw.search??'').slice(0,120));
    const galaxyIndex=raw.galaxyIndex!==null&&/^(0|[1-9]\d*)$/.test(raw.galaxyIndex)?raw.galaxyIndex:null;
    this.selectedGalaxySignal.set(galaxyIndex);
    this.selectedSubtypeSignal.set(raw.subtype==='PRIMITIVE'||raw.subtype==='ADVANCED'||
      raw.subtype==='VERY_ADVANCED'||raw.subtype==='PLANET'||raw.subtype==='MOON'||
      ['BLACK_HOLE','NEUTRON_STAR','GALACTIC_NUCLEUS','SUPERNOVA_REMNANT','COMPACT_BINARY','HIGH_ENERGY_SOURCE'].includes(raw.subtype??'')?raw.subtype:null);
    this.selectedDirectionSignal.set(raw.direction==='desc'?'desc':'asc');
    const sortCategory=currentCategory===null||currentCategory==='galaxies'?'sectors':currentCategory;
    const sortOption=archiveSortOption38BisB3(sortCategory,raw.sort??'name');
    this.selectedSortSignal.set(sortOption.key);
    const minimum=sortOption.kind==='number'?archiveRangeBoundary38BisB3(raw.min):null;
    const maximum=sortOption.kind==='number'?archiveRangeBoundary38BisB3(raw.max):null;
    this.selectedMinimumSignal.set(minimum);
    this.selectedMaximumSignal.set(maximum);
    const p=Number(raw.page??'1');this.selectedPageSignal.set(Number.isSafeInteger(p)&&p>0?p:1);
    const size=Number(raw.size??'25');this.selectedSizeSignal.set(size===50||size===100?size:25);
    try{
      if(raw.category!==null && currentCategory===null)throw new Error('Categoría del archivo desconocida');
      const universeKeys=await this.repositories.universeRepository.getAll();
      if(call!==this.loadSequence)return;
      if(universeKeys.length===0){this.stateSignal.set('empty');return;}
      const options=universeKeys.map(key=>({ref:scientificRouteUniverseRef(
        key.universeSeed.serialize(),key.generatorVersionCode),
        label:`Universo ${key.universeSeed.serialize()} · V${key.generatorVersionCode}`}));
      this.optionsSignal.set(options);
      const key=this.selectUniverse(universeKeys,raw.universeRef);
      if(!key)throw new Error('La referencia de universo no pertenece a una partida persistida');
      const scope=archive38BisScope(key),ref=scientificRouteUniverseRef(
        key.universeSeed.serialize(),key.generatorVersionCode);
      this.progressSignal.set('Comprobando galaxias confirmadas…');
      const galaxies=await this.index.knownGalaxies(key);
      if(call!==this.loadSequence)return;
      this.generationKey=key;
      this.scopeSignal.set(scope);
      this.selectedRefSignal.set(ref);
      this.galaxiesSignal.set(galaxies);
      // B7a: the old revision is a separate namespace. Do not await its
      // potentially enormous deletion while the Archive remains in loading.
      // Run bounded garbage collection only after publishing the ready view.
      // Stale scopes are excluded by the confirmed-galaxy allowlist; explicit
      // restore events or manual maintenance reconcile them later.
      this.progressSignal.set('Leyendo índices persistidos…');
      // T3: no general revision scan, no full cleanup, no forced indexing on entry.
      // Confirmed galaxies are already an authoritative knowledge gate.
      const allowedGalaxies=new Set(galaxies.map(g=>g.index));
      // One read-only transaction for fragment headers AND pending jobs.
      // A background commit cannot interleave to give us stale sections with
      // an already-cleared job queue. No source-science traversal occurs.
      const {progress:snapshot,jobs:dirty}=await this.index.store.openingSnapshot38BisT3b(scope);
      if(call!==this.loadSequence)return;
      const sections=snapshot.sections.filter(s=>allowedGalaxies.has(s.galaxyIndex));
      const pendingKeys=new Set(dirty.map(j=>j.category+'|'+j.galaxyIndex));
      this.dirtyJobCountSignal38BisT3.set(dirty.length);
      this.sectionsSignal.set(sections);
      this.verifiedSectionsSignal.set(new Set(sections.filter(s=>s.category===currentCategory &&
        !pendingKeys.has(s.category+'|'+s.galaxyIndex)).map(s=>s.galaxyIndex)));
      this.verifiedStatisticsSignal.set(new Set(sections.filter(s=>
        (s.category==='civilizations'||s.category==='colonies')&&
        !pendingKeys.has(s.category+'|'+s.galaxyIndex)).map(s=>s.category+'|'+s.galaxyIndex)));
      this.adoptProgressSnapshot38BisT3b(scope,snapshot);
      if(call!==this.loadSequence)return;
      if(galaxyIndex!==null&&!galaxies.some(g=>g.index===galaxyIndex))throw new Error('La galaxia no pertenece al conocimiento persistido');
      this.stateSignal.set('ready');
      const totalNeeded=galaxies.length*this.categories.filter(c=>c.id!=='galaxies').length;
      const stale=this.sortIndexStats38BisT3().stale;
      this.progressSignal.set(dirty.length>0
        ?`Actualizaciones en segundo plano: ${dirty.length} fragmento(s) pendiente(s).`
        :sections.length!==totalNeeded?'Catálogos incompletos. Usa «Actualizar índice» para reconciliarlos.'
          :stale>0?`${stale} ordenaciones pendientes de reconstrucción; utiliza «Actualizar índice» si deseas reconciliarlas.`
            :'Índices científicos y ordenaciones actualizados.');
      // Legacy cleanup is maintenance, not an Archive-opening prerequisite.
      await this.refreshPage();
      if(call!==this.loadSequence)return;
      if(dirty.length>0)this.schedulePendingRefresh38BisT3(key,scope,call);
      // An empty (new) Archive can be indexed by explicit refresh or future
      // confirmation events. Entry itself NEVER starts the 210-fragment pass.
    }catch(error){if(call!==this.loadSequence)return;
      this.errorSignal.set(error instanceof Error?error.message:'No se pudo abrir el archivo');
      this.stateSignal.set('error');
    }
  }

  /** Only watch the small durable queue while an active update is pending.
   * Never compare 210 scientific revisions on the navigation path. */
  private schedulePendingRefresh38BisT3(key:UniverseGenerationKey,scope:string,call:number):void {
    if(this.pendingRefreshTimer38BisT3!==null)return;
    this.pendingRefreshTimer38BisT3=setTimeout(()=>{
      this.pendingRefreshTimer38BisT3=null;
      void (async()=>{
        if(call!==this.loadSequence||scope!==this.scopeSignal())return;
        const {progress:snapshot,jobs}=await this.index.store.openingSnapshot38BisT3b(scope);
        if(call!==this.loadSequence||scope!==this.scopeSignal())return;
        const pending=new Set(jobs.map(j=>j.category+'|'+j.galaxyIndex));
        this.dirtyJobCountSignal38BisT3.set(jobs.length);
        const selected=this.category();
        const selectedGalaxy=this.selectedGalaxy();
        const allowed=new Set(this.galaxies().map(g=>g.index));
        const sections=snapshot.sections.filter(s=>allowed.has(s.galaxyIndex));
        const visibleFragmentChanged=archiveVisibleFragmentChanged38BisT3b(
          this.sectionsSignal(),sections,selected,selectedGalaxy);
        this.sectionsSignal.set(sections);
        this.verifiedSectionsSignal.set(new Set(sections.filter(s=>s.category===selected&&
          !pending.has(s.category+'|'+s.galaxyIndex)).map(s=>s.galaxyIndex)));
        this.verifiedStatisticsSignal.set(new Set(sections.filter(s=>
          (s.category==='civilizations'||s.category==='colonies')&&
          !pending.has(s.category+'|'+s.galaxyIndex)).map(s=>s.category+'|'+s.galaxyIndex)));
        this.adoptProgressSnapshot38BisT3b(scope,snapshot);
        if(call!==this.loadSequence||scope!==this.scopeSignal())return;
        this.progressSignal.set(jobs.length>0?`Actualizaciones en segundo plano: ${jobs.length} pendiente(s).`:'Índices científicos y ordenaciones actualizados.');
        // A background job in another galaxy/category must NOT reload the
        // visible page and trigger its (potentially expensive) sort pipeline.
        if(selected!==null&&selected!=='galaxies' &&
            (visibleFragmentChanged||this.pageSignal()===null))
          await this.refreshPage();
        if(jobs.some(j=>j.status!=='ERROR'))this.schedulePendingRefresh38BisT3(key,scope,call);
      })().catch(error=>this.errorSignal.set(error instanceof Error?error.message:String(error)));
    },2200);
  }

  private selectUniverse(keys:readonly UniverseGenerationKey[],ref:string|null):UniverseGenerationKey|null {
    if(ref!==null){
      if(!isScientificRouteUniverseRef(ref))return null;
      return keys.find(k=>scientificRouteUniverseRef(k.universeSeed.serialize(),k.generatorVersionCode)===ref)??null;
    }
    return this.seed.resolvePersistedUniverse(keys);
  }

  async refreshPage():Promise<void> {
    const pageRequest=++this.pageRequestSequence;
    const category=this.category(),scope=this.scopeSignal();
    if(this.state()!=='ready'||category===null||scope===''){this.pageSignal.set(null);return;}
    if(category==='galaxies'){this.pageSignal.set(null);return;}
    if(this.galaxies().length===0){this.pageSignal.set({items:[],total:0,page:1,pageSize:this.pageSize(),totalPages:1});return;}
    const required=this.selectedGalaxy()===null?this.galaxies().map(g=>g.index):[this.selectedGalaxy()!];
    if(!required.every(g=>this.verifiedSectionsSignal().has(g))){
      this.pageSignal.set(null);return;
    }
    // Los índices secundarios son derivados y se construyen solo al elegir una
    // columna. La ordenación cruza TODAS las galaxias antes de paginar.
    const sortKey=this.sortKey();
    if(sortKey!=='name'){
      for(const galaxy of required){
        const active={category,galaxyIndex:galaxy,field:sortKey};
        this.activeProgressSignal.set(active);
        try{
          const name=this.galaxies().find(g=>g.index===galaxy)?.title??galaxy;
          await this.index.ensureSort38BisT3(this.generationKey!,galaxy,category,sortKey,name);
        }
        finally{
          if(this.activeProgressSignal()===active)this.activeProgressSignal.set(null);
          await this.reloadIndexProgress(scope);
        }
        if(pageRequest!==this.pageRequestSequence)return;
      }
    }
    const page=await this.index.store.page({scope,category,galaxyIndex:this.selectedGalaxy(),
      subtype:this.selectedSubtype(),search:this.search(),descending:this.direction()==='desc',
      sortKey,minimum:this.minimum(),maximum:this.maximum(),
      page:this.pageNumber(),pageSize:this.pageSize()});
    // Solo la página visible consulta registros biológicos certificados.
    const enriched=category==='planets'||category==='moons'
      ?{...page,items:(await this.index.enrichVisibleBiologyB1(this.generationKey!,page.items))
        .map(row=>({...row,cells:{...row.cells,galaxy:
          this.galaxies().find(g=>g.index===row.galaxyIndex)?.title??row.galaxyIndex}}))}:page;
    if(pageRequest===this.pageRequestSequence && scope===this.scopeSignal() && category===this.category())
      this.pageSignal.set(enriched);
  }

  private async warmUsedSorts38BisT3(key:UniverseGenerationKey,
    category:UniversalArchiveIndexedCategory38Bis,galaxy:KnownArchiveGalaxy38Bis):Promise<void>{
    const fields=await this.index.store.usedSortFields38BisT3(archive38BisScope(key),category);
    for(const field of fields)await this.index.ensureSort38BisT3(key,galaxy.index,category,field,galaxy.title);
  }

  /** Targeted verification: colonies and civilization tiers only. It never
   * regenerates biological records or rebuilds the unrelated object catalogues. */
  async diagnoseColonization():Promise<void> {
    const key=this.generationKey;
    if(!key||this.state()!=='ready'||this.busy())return;
    const job=++this.jobSequence;
    const scope=archive38BisScope(key);
    const galaxies=this.selectedGalaxy()===null?this.galaxies():
      this.galaxies().filter(g=>g.index===this.selectedGalaxy());
    this.busySignal.set(true);
    this.errorSignal.set('');
    try {
      for(const category of ['colonies','civilizations'] as const){
        for(const galaxy of galaxies){
          if(job!==this.jobSequence || scope!==this.scopeSignal())return;
          this.progressSignal.set(`Diagnosticando ${category} · ${galaxy.title}`);
          const active={category,galaxyIndex:galaxy.index,field:'base'};
          this.activeProgressSignal.set(active);
          try{await this.index.ensure(key,galaxy.index,category,
            info=>this.progressSignal.set(info));}
          finally{if(this.activeProgressSignal()===active)this.activeProgressSignal.set(null);
            await this.reloadIndexProgress(scope);}
          if(job!==this.jobSequence || scope!==this.scopeSignal())return;
          this.sectionsSignal.set(await this.index.store.sectionsFor(scope));
          this.verifiedStatisticsSignal.update(prior=>new Set([...prior,category+'|'+galaxy.index]));
          if(this.category()===category){
            this.verifiedSectionsSignal.update(prior=>new Set([...prior,galaxy.index]));
            await this.refreshPage();
          }
          await archiveYield38Bis();
        }
      }
      this.progressSignal.set('Diagnóstico colonial y cobertura de niveles verificados.');
    }catch(error){
      if(job===this.jobSequence){
        this.errorSignal.set(error instanceof Error?error.message:'No se pudo diagnosticar el censo');
        this.progressSignal.set('El diagnóstico es parcial. No se modificaron los datos científicos.');
      }
    }finally{if(job===this.jobSequence)this.busySignal.set(false);}
  }

  async refreshIndex():Promise<void>{
    this.checkedCatalogSignal.set(new Set<string>());
    this.verifiedSectionsSignal.set(new Set<string>());
    this.verifiedStatisticsSignal.set(new Set<string>());
    this.pageSignal.set(null);
    const key=this.generationKey;
    if(!key||this.state()!=='ready')return;
    // A revision comparison is authoritative. 'force' would rebuild all 210
    // already valid fragments instead of refreshing only the stale/missing ones.
    const category=this.category();
    const call=this.loadSequence;
    const scope=this.scopeSignal();
    if(category!==null&&category!=='galaxies'){
      const galaxies=this.selectedGalaxy()===null?this.galaxies():
        this.galaxies().filter(g=>g.index===this.selectedGalaxy());
      void this.buildCategory(key,galaxies,category,call).finally(()=>{
        if(call===this.loadSequence&&scope===this.scopeSignal()&&this.state()==='ready')
          void this.backgroundIndex(key,this.galaxies(),scope);
      });
    }else void this.backgroundIndex(key,this.galaxies(),scope);
  }

  private async buildCategory(key:UniverseGenerationKey,galaxies:readonly KnownArchiveGalaxy38Bis[],
    category:UniversalArchiveIndexedCategory38Bis,call:number):Promise<void> {
    const job=++this.jobSequence;
    this.busySignal.set(true);
    try{
      for(const galaxy of galaxies){
        if(job!==this.jobSequence||this.loadSequence!==call)return;
        this.progressSignal.set(`Verificando ${category} · ${galaxy.title}`);
        const active={category,galaxyIndex:galaxy.index,field:'base'};
        this.activeProgressSignal.set(active);
        let section:UniversalArchiveSection38Bis;
        try{section=await this.index.ensure(key,galaxy.index,category,message=>this.progressSignal.set(message));}
        finally{if(this.activeProgressSignal()===active)this.activeProgressSignal.set(null);}
        if(job!==this.jobSequence||this.loadSequence!==call)return;
        await this.acceptVerifiedSection38BisT2(archive38BisScope(key),section);
        await this.warmUsedSorts38BisT3(key,category,galaxy);
        this.markCatalogChecked(category,galaxy.index);
        if(category==='colonies'||category==='civilizations')
          this.verifiedStatisticsSignal.update(prior=>new Set([...prior,category+'|'+galaxy.index]));
        this.verifiedSectionsSignal.update(prior=>new Set([...prior,galaxy.index]));
        await this.refreshPage();
        await archiveYield38Bis();
      }
      // Verify the second statistical source after the visible category. Do not
      // expose stale cached founder names from an earlier discovery state.
      if(['civilizations','colonies','colonized-planets','colonized-moons'].includes(category)){
        for(const secondary of ['colonies','civilizations'] as const){
          if(secondary===category)continue;
          for(const galaxy of galaxies){
            if(job!==this.jobSequence||this.loadSequence!==call)return;
            this.progressSignal.set(`Verificando estadísticas · ${galaxy.title}`);
            const active={category:secondary,galaxyIndex:galaxy.index,field:'base'};
            this.activeProgressSignal.set(active);
            let section:UniversalArchiveSection38Bis;
            try{section=await this.index.ensure(key,galaxy.index,secondary);}
            finally{if(this.activeProgressSignal()===active)this.activeProgressSignal.set(null);}
            if(job!==this.jobSequence||this.loadSequence!==call)return;
            await this.acceptVerifiedSection38BisT2(archive38BisScope(key),section);
            this.markCatalogChecked(secondary,galaxy.index);
            this.verifiedStatisticsSignal.update(prior=>new Set([...prior,secondary+'|'+galaxy.index]));
            await archiveYield38Bis();
          }
        }
      }
      this.progressSignal.set('Índice de la categoría actualizado.');
    }catch(error){if(job===this.jobSequence){this.errorSignal.set(error instanceof Error?error.message:'Falló la indexación');
      this.progressSignal.set('Índice parcial: revisa el error indicado.');}}
    finally{if(job===this.jobSequence)this.busySignal.set(false);}
  }

  private async backgroundIndex(key:UniverseGenerationKey,galaxies:readonly KnownArchiveGalaxy38Bis[],
    scope:string):Promise<void> {
    const job=++this.jobSequence;
    this.busySignal.set(true);
    let failures=0;
    let firstError='';
    try{
      // A persisted section is NOT automatically considered verified. Prioritize
      // the 50 or so missing fragments, then validate the saved 160 against the
      // live confirmed scientific revision without rebuilding unchanged rows.
      const sequence:readonly UniversalArchiveIndexedCategory38Bis[]=[
        'colonized-moons','colonized-planets','colonies','systems','civilizations',
        'extremes','clusters','nebulae','planets','moons','asteroids','comets','tno','captured'];
      const stored=new Set(this.sectionsSignal().map(s=>archiveIndexTaskKey38BisT2(s.category,s.galaxyIndex)));
      const tasks=archiveIndexPlan38BisT2(sequence,galaxies,stored,this.checkedCatalogSignal());
      const outstanding=tasks.filter(task=>!stored.has(archiveIndexTaskKey38BisT2(task.category,task.galaxyIndex))).length;
      for(let position=0;position<tasks.length;position++){
        const task=tasks[position]!;
        if(job!==this.jobSequence||scope!==this.scopeSignal())return;
        const category=task.category;
        const galaxy=galaxies.find(g=>g.index===task.galaxyIndex)!;
        const prefix=`Índice universal ${position+1}/${tasks.length}`;
        this.progressSignal.set(`${prefix} · ${position<outstanding?'Completando':'Revisando'} ${category} · ${galaxy.title}`);
        const active={category,galaxyIndex:galaxy.index,field:'base'};
        this.activeProgressSignal.set(active);
        try{
          const section=await this.index.ensure(key,galaxy.index,category,
            message=>{if(job===this.jobSequence)this.progressSignal.set(`${prefix} · ${message}`);});
          if(job!==this.jobSequence||scope!==this.scopeSignal())return;
          this.markCatalogChecked(category,galaxy.index);
          await this.acceptVerifiedSection38BisT2(scope,section);
          await this.warmUsedSorts38BisT3(key,category,galaxy);
          if(category==='colonies'||category==='civilizations')
            this.verifiedStatisticsSignal.update(prior=>new Set([...prior,category+'|'+galaxy.index]));
          if(this.category()===category){
            this.verifiedSectionsSignal.update(prior=>new Set([...prior,galaxy.index]));
            await this.refreshPage();
          }
        }catch(error){
          // One bad/large asteroid catalogue must not prevent comets, TNO and
          // captured objects from being indexed. Keep the failed checkpoint and
          // the last good section; continue with all other galaxies/categories.
          if(job!==this.jobSequence||scope!==this.scopeSignal())return;
          failures++;
          const reason=error instanceof Error?error.message:String(error);
          if(!firstError)firstError=`${category} · ${galaxy.title}: ${reason}`;
          console.warn('GENESIS 38.bis-T2: fragmento no indexado',category,galaxy.index,error);
          await this.reloadIndexProgress(scope);
        }finally{
          if(this.activeProgressSignal()===active)this.activeProgressSignal.set(null);
        }
        await archiveYield38Bis();
      }
      if(failures){
        this.errorSignal.set(`${failures} fragmento(s) pendientes. Primer error: ${firstError}`);
        this.progressSignal.set(`Indexación parcial: ${failures} fragmento(s) con error; el resto se ha comprobado.`);
      }else{
        this.errorSignal.set('');
        this.progressSignal.set('Índice universal actualizado.');
      }
    }catch(error){
      if(job===this.jobSequence){
        this.errorSignal.set(error instanceof Error?error.message:'Error de indexación');
        this.progressSignal.set('Índice parcial; los resultados confirmados siguen disponibles.');
      }
    }finally{
      if(job===this.jobSequence)this.busySignal.set(false);
    }
  }

}
function archiveYield38Bis():Promise<void>{return new Promise(resolve=>setTimeout(resolve,0));}
