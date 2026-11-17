import {ChangeDetectionStrategy,Component,DestroyRef,inject,OnInit} from '@angular/core';
import {ActivatedRoute,Router,RouterLink,type ParamMap} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {combineLatest} from 'rxjs';
import {GenesisScreen} from '../../ui/layout/genesis-screen/genesis-screen';
import {GenesisSectionTitle} from '../../ui/components/genesis-section-title/genesis-section-title';
import {GenesisEmptyState} from '../../ui/states/genesis-empty-state/genesis-empty-state';
import {archiveProgressLabel38BisB4}
  from './38-bis/genesis-universal-archive-progress-38-bis-b4';
import {GenesisUniversalArchiveFacade38Bis} from './38-bis/genesis-universal-archive-38-bis.facade';
import {archivePublicCellsA6,archivePublicCopyA6,archivePublicSubtitleA6,
  archivePublicGalaxyNameA6,archivePublicDiscoveryStateA6} from './38-bis/genesis-universal-archive-public-labels-a6';
import {archiveCompactFields38BisB1,archiveCompactActions38BisB1}
  from './38-bis/genesis-universal-archive-list-layout-38-bis-b1';
import {UNIVERSAL_ARCHIVE_PAGE_SIZES_38BIS,
  type UniversalArchiveAction38Bis,type UniversalArchiveCategory38Bis,
  type UniversalArchiveRow38Bis, type UniversalArchiveIndexedCategory38Bis,
  type ArchiveColonyOriginIssue38Bis,
  ARCHIVE_COLONY_ORIGIN_ISSUES_38BIS} from './38-bis/genesis-universal-archive-38-bis.model';

@Component({
  selector:'app-genesis-archive',standalone:true,
  imports:[GenesisEmptyState,GenesisScreen,GenesisSectionTitle,RouterLink],
  templateUrl:'./genesis-archive.html',styleUrl:'./genesis-archive.scss',
  changeDetection:ChangeDetectionStrategy.OnPush,
})
export class GenesisArchive implements OnInit {
  readonly facade=inject(GenesisUniversalArchiveFacade38Bis);
  readonly pageSizes=UNIVERSAL_ARCHIVE_PAGE_SIZES_38BIS;
  private readonly route=inject(ActivatedRoute);
  private readonly router=inject(Router);
  private readonly destroy=inject(DestroyRef);
  searchDraft='';
  minimumDraft='';
  maximumDraft='';
  indexProgressCategory:UniversalArchiveIndexedCategory38Bis='planets';
  readonly progressLabel=archiveProgressLabel38BisB4;
  progressCategoryChanged(event:Event):void {
    const value=(event.target as HTMLSelectElement).value;
    const matched=this.facade.categories.find(item=>item.id===value&&item.id!=='galaxies');
    if(matched)this.indexProgressCategory=matched.id as UniversalArchiveIndexedCategory38Bis;
  }
  progressDetails(){return this.facade.progressDetails(this.indexProgressCategory);}
  storedSorts(sorts:readonly {readonly status:string}[]):number{
    return sorts.filter(sort=>sort.status==='STORED').length;
  }


  ngOnInit():void {
    combineLatest([this.route.paramMap,this.route.queryParamMap])
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe(([params,q]:[ParamMap,ParamMap])=>{
        this.searchDraft=q.get('q')??'';
        this.minimumDraft=q.get('min')??'';
        this.maximumDraft=q.get('max')??'';
        const selected=params.get('category');
        if(this.facade.categories.some(item=>item.id===selected&&item.id!=='galaxies'))
          this.indexProgressCategory=selected as UniversalArchiveIndexedCategory38Bis;
        void this.facade.load({category:params.get('category'),universeRef:q.get('u'),
          galaxyIndex:q.get('g'),subtype:q.get('type'),search:q.get('q'),
          direction:q.get('direction'),page:q.get('page'),size:q.get('size'),
          sort:q.get('sort'),min:q.get('min'),max:q.get('max')});
      });
  }

  name(category:UniversalArchiveCategory38Bis):string {
    return this.facade.categories.find(item=>item.id===category)?.label??category;
  }
  countText(category:UniversalArchiveCategory38Bis):string {
    const result=this.facade.count(category);
    if(result.count===null)return 'Pendiente de indexar';
    const value=result.count.toLocaleString('es-ES');
    return result.indexed<result.totalGalaxies?`${value} indexados · ${result.indexed}/${result.totalGalaxies} galaxias`:
      result.knowledgeComplete?value:`${value} verificados · censo parcial`;
  }
  async changeUniverse(event:Event):Promise<void>{
    const ref=(event.target as HTMLSelectElement).value;
    await this.router.navigate(['/archive'],{queryParams:{u:ref}});
  }
  async changeGalaxy(event:Event):Promise<void>{
    const value=(event.target as HTMLSelectElement).value;
    await this.navigate({g:value||null,page:'1'});
  }
  async changeSubtype(event:Event):Promise<void>{
    const value=(event.target as HTMLSelectElement).value;
    await this.navigate({type:value||null,page:'1'});
  }
  isNumericSort():boolean {
    return this.facade.sortOptions().find(option=>option.key===this.facade.sortKey())?.kind==='number';
  }
  async changeSort(event:Event):Promise<void>{
    const value=(event.target as HTMLSelectElement).value;
    this.minimumDraft='';this.maximumDraft='';
    await this.navigate({sort:value==='name'?null:value,min:null,max:null,page:'1'});
  }
  async applyRange(event:Event):Promise<void>{
    event.preventDefault();
    const valid=(value:string):boolean=>value.trim()==='' ||
      /^[+-]?(?:\d+)(?:[.,]\d+)?$/u.test(value.trim()) &&
      Number.isFinite(Number(value.trim().replace(',','.')));
    if(!valid(this.minimumDraft)||!valid(this.maximumDraft))return;
    const min=this.minimumDraft.trim().replace(',','.')||null;
    const max=this.maximumDraft.trim().replace(',','.')||null;
    if(min!==null&&max!==null&&Number(min)>Number(max))return;
    await this.navigate({min,max,page:'1'});
  }
  async resetFilters():Promise<void>{
    this.searchDraft='';this.minimumDraft='';this.maximumDraft='';
    await this.navigate({g:null,type:null,q:null,sort:null,min:null,max:null,
      direction:null,page:'1'});
  }
  async changeDirection(event:Event):Promise<void>{
    const value=(event.target as HTMLSelectElement).value;
    await this.navigate({direction:value==='desc'?'desc':'asc',page:'1'});
  }
  async changePageSize(event:Event):Promise<void>{
    await this.navigate({size:(event.target as HTMLSelectElement).value,page:'1'});
  }
  async search(event:Event):Promise<void>{
    event.preventDefault();
    await this.navigate({q:this.searchDraft.trim().slice(0,120)||null,page:'1'});
  }
  async clearSearch():Promise<void>{
    this.searchDraft='';await this.navigate({q:null,page:'1'});
  }
  async toPage(page:number):Promise<void>{await this.navigate({page:String(page)});}
  refreshIndex():void{void this.facade.refreshIndex();}
  diagnoseColonization():void{void this.facade.diagnoseColonization();}
  private async navigate(queryParams:Record<string,string|null>):Promise<void>{
    await this.router.navigate([],{relativeTo:this.route,queryParams,queryParamsHandling:'merge'});
  }
  actionQueryParams(action:UniversalArchiveAction38Bis):Record<string,string> {
    return {...action.queryParams,u:this.facade.selectedUniverseRef()};
  }
  galaxyName(galaxyIndex:string):string {
    return archivePublicGalaxyNameA6(galaxyIndex,this.facade.galaxies());
  }
  discoveryStateName(code:number):string {return archivePublicDiscoveryStateA6(code);}
  publicCopy(value:string):string {return archivePublicCopyA6(value);}
  subtitle(row:UniversalArchiveRow38Bis):string {
    return archivePublicSubtitleA6(row,this.facade.galaxies());
  }
  cells(row:UniversalArchiveRow38Bis):readonly {key:string;value:string}[] {
    return archivePublicCellsA6(row);
  }
  compactFields(row:UniversalArchiveRow38Bis):ReturnType<typeof archiveCompactFields38BisB1> {
    const standard=archiveCompactFields38BisB1(row,this.galaxyName(row.galaxyIndex));
    const option=this.facade.sortOptions().find(value=>value.key===this.facade.sortKey());
    if(!option||option.key==='name'||standard.some(field=>field.key===option.key))return standard;
    const value=row.cells[option.key];
    return [...standard,{key:option.key,label:option.label,
      value:typeof value==='string' && value.trim()?value:'No evaluable'}];
  }
  compactActions(row:UniversalArchiveRow38Bis):readonly UniversalArchiveAction38Bis[] {
    return archiveCompactActions38BisB1(row);
  }
  reasonLabel(reason:ArchiveColonyOriginIssue38Bis):string {
    return ARCHIVE_COLONY_ORIGIN_ISSUES_38BIS[reason];
  }
  label(key:string):string {
    return ({system:'Sistema',body:'Cuerpo',planet:'Planeta',state:'Estado',
      tier:'Nivel',origin:'Procedencia',technology:'Hábitat',purpose:'Función',
      count:'Colonias',species:'Especie fundadora',originPlanet:'Planeta natal',
      type:'Tipo',kind:'Clase',lineage:'Linaje',sector:'Sector',
      mass:'Masa',radius:'Radio',composition:'Composición'} as Record<string,string>)[key]??key;
  }
}
