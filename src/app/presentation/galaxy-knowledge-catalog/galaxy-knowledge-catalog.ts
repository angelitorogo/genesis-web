import {
  ChangeDetectionStrategy,
  computed,
  effect,
  signal,
  untracked,
  Component,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest } from 'rxjs';

import { GenesisScreen } from '../../ui/layout/genesis-screen/genesis-screen';
import { GalaxyKnowledgeCatalogFacade } from './galaxy-knowledge-catalog.facade';
import { CATALOG_ATMOSPHERE_GASES, parseCatalogAtmosphereFilter, type CatalogGasRange } from './galaxy-knowledge-atmosphere-filter';
import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import {
  catalogColumnsStorageKey,
  catalogColumnsWithSort,
  catalogFields,
  catalogMoveColumn,
  catalogToggleColumn,
  catalogVisibleColumns,
  initialCatalogColumns,
  reconcileCatalogColumns,
  type GalaxyKnowledgeCatalogColumnPreference,
} from './galaxy-knowledge-catalog-columns';
import {
  GALAXY_KNOWLEDGE_CATALOG_PAGE_SIZES,
  type GalaxyKnowledgeCatalogAction,
  type GalaxyKnowledgeCatalogPageSize,
  type GalaxyKnowledgeCatalogCategory,
} from './galaxy-knowledge-catalog.model';

@Component({
  selector: 'app-galaxy-knowledge-catalog-page',
  standalone: true,
  imports: [GenesisScreen, RouterLink],
  templateUrl: './galaxy-knowledge-catalog.html',
  styleUrl: './galaxy-knowledge-catalog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalaxyKnowledgeCatalogPage implements OnInit {
  readonly facade = inject(GalaxyKnowledgeCatalogFacade);
  readonly pageSizes = GALAXY_KNOWLEDGE_CATALOG_PAGE_SIZES;
  searchDraft = '';
  readonly atmosphericGases=CATALOG_ATMOSPHERE_GASES;
  gasRows: Array<{gas:AtmosphereGas;min:string;max:string}> = [];
  gasCombine: 'AND'|'OR' = 'AND';
  pressureMinDraft = '';
  pressureMaxDraft = '';
  earthMinDraft = '';
  atmosphereError = '';

  availableGases(lunar: boolean) { return CATALOG_ATMOSPHERE_GASES.filter(item=>!lunar||item.lunar); }
  addGasRow(): void {
    const lunar=this.facade.model()?.query.category==='moons';
    const gas=this.availableGases(lunar)[0]!.gas;
    this.gasRows=[...this.gasRows,{gas,min:'',max:''}];
  }
  removeGasRow(index:number):void {this.gasRows=this.gasRows.filter((_,i)=>i!==index);}
  changeGasRow(index:number, field:'gas'|'min'|'max', event:Event):void {
    const value=(event.target as HTMLInputElement|HTMLSelectElement).value;
    this.gasRows=this.gasRows.map((row,i)=>i===index?{
      ...row,[field]:value,
    }:row) as typeof this.gasRows;
  }
  async applyAtmosphereFilters(event:Event):Promise<void> {
    event.preventDefault();
    const lunar=this.facade.model()?.query.category==='moons';
    const gasRanges=this.gasRows.map(row=>`${row.gas}:${row.min.trim().replace(',','.')}:${row.max.trim().replace(',','.')}`).join(';');
    const raw={gasRanges,gasCombine:this.gasCombine,
      pressureMin:this.pressureMinDraft.trim().replace(',','.'),pressureMax:this.pressureMaxDraft.trim().replace(',','.'),
      earthMin:lunar?'':this.earthMinDraft.trim().replace(',','.')};
    try { parseCatalogAtmosphereFilter(raw,lunar); this.atmosphereError=''; }
    catch(error) {this.atmosphereError=error instanceof Error?error.message:'Filtro atmosférico incorrecto';return;}
    await this.navigateQuery({atm:raw.gasRanges,amode:raw.gasCombine,pmin:raw.pressureMin,
      pmax:raw.pressureMax,earth:raw.earthMin,page:'1'});
  }
  async clearAtmosphereFilters():Promise<void> {
    this.gasRows=[];this.gasCombine='AND';this.pressureMinDraft='';this.pressureMaxDraft='';this.earthMinDraft='';
    this.atmosphereError='';
    await this.navigateQuery({atm:'',amode:'AND',pmin:'',pmax:'',earth:'',page:'1'});
  }


  private readonly columnSelection = signal<Readonly<{
    category: string;
    preferences: GalaxyKnowledgeCatalogColumnPreference;
  }> | null>(null);
  readonly availableColumns = computed(() => {
    const model = this.facade.model();
    return model === null ? [] : catalogFields(model.descriptor);
  });
  readonly visibleColumns = computed(() => {
    const model = this.facade.model();
    if (model === null) return [];
    const fields = this.availableColumns();
    const selected = this.columnSelection();
    const preferences = selected?.category === model.descriptor.category
      ? selected.preferences
      : initialCatalogColumns(fields);
    return catalogVisibleColumns(fields, catalogColumnsWithSort(preferences, model.query.sortKey));
  });
  readonly visibleColumnKeys = computed(() => new Set(this.visibleColumns().map(column => column.key)));

  private readonly syncPreferences = effect(() => {
    const model = this.facade.model();
    if (model === null) return;
    // Every new model is a URL/category update; never share settings across families.
    untracked(() => {
      const category = model.descriptor.category;
      const preferences = catalogColumnsWithSort(
        reconcileCatalogColumns(catalogFields(model.descriptor), this.readColumnPreferences(category)),
        model.query.sortKey,
      );
      this.columnSelection.set({ category, preferences });
      this.writeColumnPreferences(category, preferences);
    });
  });

  private readonly syncSearch = effect(() => {
    const search = this.facade.model()?.query.search ?? '';
    untracked(() => { this.searchDraft = search; });
  });

  private readonly syncAtmosphereDraft = effect(() => {
    const model=this.facade.model();
    untracked(()=>{
      const a=model?.query.atmosphere;
      this.gasRows=(a?.ranges??[]).map((r:CatalogGasRange)=>({
        gas:r.gas,min:r.minPercent===null?'':String(r.minPercent),
        max:r.maxPercent===null?'':String(r.maxPercent),
      }));
      this.gasCombine=a?.combine??'AND';
      this.pressureMinDraft=a?.minPressureBar===null||a===undefined?'':String(a.minPressureBar);
      this.pressureMaxDraft=a?.maxPressureBar===null||a===undefined?'':String(a.maxPressureBar);
      this.earthMinDraft=a?.minEarthSimilarityPercent===null||a===undefined?'':String(a.minEarthSimilarityPercent);
      this.atmosphereError='';
    });
  });

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    combineLatest([
      this.route.paramMap,
      this.route.queryParamMap,
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([params, queryParams]) => {
        void this.facade.load(
          params.get('galaxyIndex'),
          params.get('category'),
          queryParams.get('u'),
          {
            subtype: queryParams.get('type'),
            page: queryParams.get('page'),
            pageSize: queryParams.get('size'),
            sortKey: queryParams.get('sort'),
            direction: queryParams.get('direction'),
            search: queryParams.get('q'),
            gasRanges: queryParams.get('atm'),gasCombine:queryParams.get('amode'),
            pressureMin:queryParams.get('pmin'),pressureMax:queryParams.get('pmax'),earthMin:queryParams.get('earth'),
          },
        );
      });
  }

  updateSearchDraft(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (input !== null) this.searchDraft = input.value;
  }

  async submitSearch(event: Event): Promise<void> {
    event.preventDefault();
    const query = this.searchDraft.trim().replace(/\s+/gu, ' ').slice(0, 120);
    await this.navigateQuery({ q: query, page: '1' });
  }

  async clearSearch(): Promise<void> {
    this.searchDraft = '';
    await this.navigateQuery({ q: '', page: '1' });
  }

  async changeSort(event: Event): Promise<void> {
    const target = event.target as HTMLSelectElement | null;
    if (target === null) return;
    this.showSortColumn(target.value);
    await this.navigateQuery({ sort: target.value, page: '1' });
  }

  async changeDirection(event: Event): Promise<void> {
    const target = event.target as HTMLSelectElement | null;
    if (target === null) return;
    await this.navigateQuery({ direction: target.value, page: '1' });
  }

  async changePageSize(event: Event): Promise<void> {
    const target = event.target as HTMLSelectElement | null;
    if (target === null) return;
    const size = Number(target.value) as GalaxyKnowledgeCatalogPageSize;
    if (!GALAXY_KNOWLEDGE_CATALOG_PAGE_SIZES.includes(size)) return;
    await this.navigateQuery({ size: size.toString(), page: '1' });
  }

  toggleColumn(key: string, event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const model = this.facade.model();
    if (target === null || model === null) return;
    this.updateColumnSelection(catalogToggleColumn(
      this.currentColumnPreferences(), key, target.checked, model.query.sortKey,
    ));
  }

  moveColumn(key: string, direction: -1 | 1): void {
    this.updateColumnSelection(catalogMoveColumn(this.currentColumnPreferences(), key, direction));
  }

  resetColumns(): void {
    const model = this.facade.model();
    if (model === null) return;
    this.updateColumnSelection(catalogColumnsWithSort(
      initialCatalogColumns(catalogFields(model.descriptor)), model.query.sortKey,
    ));
  }

  private showSortColumn(key: string): void {
    this.updateColumnSelection(catalogColumnsWithSort(this.currentColumnPreferences(), key));
  }

  private currentColumnPreferences(): GalaxyKnowledgeCatalogColumnPreference {
    const model = this.facade.model();
    const selected = this.columnSelection();
    if (model === null) return initialCatalogColumns([]);
    return selected?.category === model.descriptor.category
      ? selected.preferences
      : initialCatalogColumns(catalogFields(model.descriptor));
  }

  private updateColumnSelection(preferences: GalaxyKnowledgeCatalogColumnPreference): void {
    const model = this.facade.model();
    if (model === null) return;
    this.columnSelection.set({ category: model.descriptor.category, preferences });
    this.writeColumnPreferences(model.descriptor.category, preferences);
  }

  private readColumnPreferences(category: GalaxyKnowledgeCatalogCategory): unknown {
    try {
      return JSON.parse(localStorage.getItem(catalogColumnsStorageKey(category)) ?? 'null') as unknown;
    } catch {
      return null;
    }
  }

  private writeColumnPreferences(category: GalaxyKnowledgeCatalogCategory, preferences: GalaxyKnowledgeCatalogColumnPreference): void {
    try {
      localStorage.setItem(catalogColumnsStorageKey(category), JSON.stringify(preferences));
    } catch {
      // Browser storage can be unavailable; the in-memory selection still works.
    }
  }

  pageQueryParams(page: number): Readonly<Record<string, string>> | null {
    const model = this.facade.model();
    if (model === null) return null;
    return this.queryParams({ page: page.toString() });
  }

  actionQueryParams(action: GalaxyKnowledgeCatalogAction): Readonly<Record<string, string>> | null {
    const model = this.facade.model();
    if (model === null) return null;
    return Object.freeze({
      u: model.routeUniverseRef,
      ...(action.queryParams ?? {}),
    });
  }

  formatCount(value: number): string {
    return value.toLocaleString('es-ES');
  }

  rowTrackKey(id: string): string {
    return id;
  }

  private async navigateQuery(
    changes: Readonly<Record<string, string>>,
  ): Promise<void> {
    const params = this.queryParams(changes);
    if (params === null) return;
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
    });
  }

  private queryParams(
    changes: Readonly<Record<string, string>>,
  ): Readonly<Record<string, string>> | null {
    const model = this.facade.model();
    if (model === null) return null;
    const params: Record<string, string> = {
      u: model.routeUniverseRef,
      page: model.query.page.toString(),
      size: model.query.pageSize.toString(),
      sort: model.query.sortKey,
      direction: model.query.direction,
    };
    if (model.query.search) {
      params['q'] = model.query.search;
    }
    if(model.query.atmosphere) {
      const a=model.query.atmosphere;
      if(a.ranges.length)params['atm']=a.ranges.map(r=>`${r.gas}:${r.minPercent??''}:${r.maxPercent??''}`).join(';');
      if(a.combine==='OR')params['amode']='OR';
      if(a.minPressureBar!==null)params['pmin']=String(a.minPressureBar);
      if(a.maxPressureBar!==null)params['pmax']=String(a.maxPressureBar);
      if(a.minEarthSimilarityPercent!==null)params['earth']=String(a.minEarthSimilarityPercent);
    }
    if (model.query.subtype !== null) {
      params['type'] = model.query.subtype;
    }
    Object.assign(params, changes);
    return Object.freeze(params);
  }
}
