import {computed,signal} from '@angular/core';
import {vi} from 'vitest';
import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {GenesisArchive} from './genesis-archive';
import {GenesisUniversalArchiveFacade38Bis} from './38-bis/genesis-universal-archive-38-bis.facade';
import {UNIVERSAL_ARCHIVE_CATEGORIES_38BIS,type UniversalArchiveCategory38Bis,type UniversalArchivePage38Bis} from './38-bis/genesis-universal-archive-38-bis.model';
import {archiveSortOptions38BisB3} from './38-bis/genesis-universal-archive-sort-38-bis-b3';
import type {ArchiveProgressCategorySummary38BisB4,ArchiveProgressGalaxyDetail38BisB4} from './38-bis/genesis-universal-archive-progress-38-bis-b4';
import type {UniversalArchiveIndexedCategory38Bis} from './38-bis/genesis-universal-archive-38-bis.model';
import type {ArchiveDirtyJob38BisB6} from './38-bis/genesis-universal-archive-dirty-38-bis-b6';

describe('38.bis — Archivo GENESIS universal',()=>{
  const state=signal<'empty'|'ready'>('empty');
  const category=signal<UniversalArchiveCategory38Bis|null>(null);
  const page=signal<UniversalArchivePage38Bis|null>(null);
  // 38.bis-b4: contrato público del panel de progreso persistido.
  const indexProgress=signal<readonly ArchiveProgressCategorySummary38BisB4[]>([]);
  const indexProgressStored=computed(()=>indexProgress().reduce((total,part)=>total+part.stored,0));
  const indexProgressTotal=computed(()=>indexProgress().reduce((total,part)=>total+part.total,0));
  const progressDetails=vi.fn((_category:UniversalArchiveIndexedCategory38Bis):
    readonly ArchiveProgressGalaxyDetail38BisB4[]=>[]);
  type DisplayJob = ArchiveDirtyJob38BisB6 & {readonly galaxyTitle:string;readonly categoryTitle:string;readonly fieldTitle:string|null};
  const updateJobsArchfast1=signal<readonly DisplayJob[]>([]);
  const stub={
    state,error:signal(''),universes:signal([]),galaxies:signal([]),
    selectedUniverseRef:signal('PUBLIC-REF'),indexedGalaxies:signal(0),
    sections:signal([]),category,busy:signal(false),progress:signal(''),
    indexProgress,indexProgressStored,indexProgressTotal,progressDetails,
    sortIndexStats38BisT3:signal({valid:0,stale:0}),dirtyJobCount38BisT3:signal(0),
    updateJobsArchfast1,
    page,selectedGalaxy:signal(null),selectedSubtype:signal(null),
    direction:signal('asc'),pageNumber:signal(1),pageSize:signal(25),
    sortKey:signal('name'),minimum:signal(null),maximum:signal(null),
    sortOptions:computed(()=>category()!==null&&category()!=='galaxies'
      ?archiveSortOptions38BisB3(category() as Exclude<UniversalArchiveCategory38Bis,'galaxies'>):[]),
    categories:UNIVERSAL_ARCHIVE_CATEGORIES_38BIS.filter(category=>category.id!=='sectors'),colonizationOverview:signal(null),
    diagnoseColonization:vi.fn(async()=>undefined),
    count:vi.fn(()=>({count:null,indexed:0,totalGalaxies:0,knowledgeComplete:false})),
    load:vi.fn(async()=>undefined),refreshIndex:vi.fn(async()=>undefined),
  };
  beforeEach(()=>{
    state.set('empty');category.set(null);page.set(null);indexProgress.set([]);
    updateJobsArchfast1.set([]);
    stub.sortKey.set('name');stub.direction.set('asc');
    stub.load.mockClear();progressDetails.mockClear();
    TestBed.configureTestingModule({imports:[GenesisArchive],providers:[provideRouter([]),
      {provide:GenesisUniversalArchiveFacade38Bis,useValue:stub}]});
  });
  it('ofrece regresar a Home incluso con Archivo vacío y conserva la navegación al cargar datos',()=>{
    const fixture=TestBed.createComponent(GenesisArchive);
    fixture.detectChanges();
    const page=fixture.nativeElement as HTMLElement;
    const link=page.querySelector('[data-testid="archive-home-link"]') as HTMLAnchorElement|null;
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe('/');
    expect(link?.textContent).toContain('Volver a Home');
    expect(page.querySelector('[data-testid="genesis-archive-page"]')?.contains(link!)).toBe(true);

    state.set('ready');fixture.detectChanges();
    expect(page.querySelectorAll('[data-testid="archive-home-link"]')).toHaveLength(1);
    expect(page.querySelector('[data-testid="archive-home-link"]')?.getAttribute('href')).toBe('/');
  });
  it('mantiene el estado vacío mientras no exista ningún universo persistido',()=>{
    const fixture=TestBed.createComponent(GenesisArchive);fixture.detectChanges();
    const element=fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="genesis-archive-page"]')).toBeTruthy();
    expect(element.textContent).toContain('Archivo vacío');
  });
  it('muestra categorías globales, incluidas lunas colonizadas, cuando hay conocimiento',()=>{
    state.set('ready');
    const fixture=TestBed.createComponent(GenesisArchive);fixture.detectChanges();
    const element=fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="archive-dashboard"]')).toBeTruthy();
    expect(element.querySelector('[data-category="colonized-moons"]')).toBeTruthy();
    expect(element.querySelector('[data-category="extremes"]')).toBeTruthy();
    expect(element.querySelector('[data-category="stars"]')).toBeTruthy();
    expect(element.querySelector('[data-category="sectors"]')).toBeNull();
    expect(element.textContent).toContain('Pendiente de indexar');
  });
  it('muestra el panel 38.bis-b4 con contadores obtenidos de la fachada',()=>{
    state.set('ready');
    indexProgress.set([{category:'planets',stored:1,checked:0,pending:1,interrupted:0,failed:0,active:0,total:2}]);
    const fixture=TestBed.createComponent(GenesisArchive);fixture.detectChanges();
    const panel=fixture.nativeElement.querySelector('[data-testid="archive-index-progress"]') as HTMLElement|null;
    expect(panel).toBeTruthy();
    expect(panel?.textContent).toContain('1 / 2 fragmentos de catálogo guardados');
    expect(panel?.textContent).not.toContain('revisadas en esta apertura');
    expect(panel?.textContent).toContain('0 ordenaciones vigentes');
    expect(panel?.textContent).toContain('Planetas');
    expect(progressDetails).toHaveBeenCalledWith('planets');
  });
  it('ARCHFAST.1 muestra progreso real por galaxia y campo solo mientras exista el trabajo',()=>{
    state.set('ready');
    updateJobsArchfast1.set([{
      id:'test-job',scope:'test-scope',universeSeed:'test-seed',generatorVersionCode:3,
      galaxyIndex:'4',category:'moons',status:'RUNNING',phase:'SORTS',
      completedSorts:7,totalSorts:12,currentField:'mass',serial:1,attempts:0,
      updatedAtEpochMs:1,startedAtEpochMs:1,
      galaxyTitle:'Erylaune',categoryTitle:'Lunas',fieldTitle:'Masa',
    }]);
    const fixture=TestBed.createComponent(GenesisArchive);fixture.detectChanges();
    const detail=fixture.nativeElement.querySelector('[data-testid="archive-maintenance-detail"]') as HTMLElement|null;
    expect(detail?.textContent).toContain('Erylaune');
    expect(detail?.textContent).toContain('Lunas');
    expect(detail?.textContent).toContain('7 / 12');
    expect(detail?.textContent).toContain('Masa');
    updateJobsArchfast1.set([]);fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="archive-maintenance-detail"]')).toBeNull();
  });
  it('muestra ordenación específica, búsqueda y rango únicamente para magnitudes numéricas',()=>{
    state.set('ready');category.set('planets');
    page.set({items:[],total:0,page:1,pageSize:25,totalPages:1});
    const fixture=TestBed.createComponent(GenesisArchive);fixture.detectChanges();
    const element=fixture.nativeElement as HTMLElement;
    const options=[...(element.querySelector('[data-testid="archive-sort-field"]') as HTMLSelectElement).options]
      .map(item=>item.value);
    expect(options).toContain('water');expect(options).toContain('temperature');
    expect(options).not.toContain('tier');
    expect(element.querySelector('[data-testid="archive-search"]')).toBeTruthy();
    stub.sortKey.set('water');fixture.detectChanges();
    expect(element.querySelector('[data-testid="archive-minimum"]')).toBeTruthy();
    expect(element.querySelector('[data-testid="archive-maximum"]')).toBeTruthy();
    category.set('civilizations');stub.sortKey.set('tier');fixture.detectChanges();
    expect(element.querySelector('[data-testid="archive-minimum"]')).toBeNull();
    expect((element.querySelector('[data-testid="archive-sort-field"]') as HTMLSelectElement).textContent)
      .toContain('Nivel tecnológico');
  });

  it('mantiene visibles la columna y la dirección activas cuando las opciones aparecen de forma diferida',()=>{
    state.set('ready');
    const fixture=TestBed.createComponent(GenesisArchive);fixture.detectChanges();
    const element=fixture.nativeElement as HTMLElement;
    // La fachada conoce el criterio antes de recibir una categoría: inicialmente
    // el <select> no tiene opciones. Después llegan ambas señales desde la ruta.
    stub.sortKey.set('life');stub.direction.set('desc');category.set('moons');
    fixture.detectChanges();
    const sort=element.querySelector('[data-testid="archive-sort-field"]') as HTMLSelectElement;
    const direction=element.querySelector('[data-testid="archive-direction"]') as HTMLSelectElement;
    expect(sort.value).toBe('life');
    expect(sort.selectedOptions[0]?.textContent?.trim()).toBe('Vida');
    expect(direction.value).toBe('desc');
    expect(direction.selectedOptions[0]?.textContent?.trim()).toBe('Sí primero / No después');

    // Una página nueva no debe hacer que el selector vuelva a "Nombre".
    page.set({items:[],total:130,page:2,pageSize:25,totalPages:6});
    fixture.detectChanges();
    expect(sort.value).toBe('life');expect(direction.value).toBe('desc');

    // Al cambiar de categoría, la lista de opciones se reconstruye.
    stub.sortKey.set('civilization');stub.direction.set('asc');category.set('planets');
    fixture.detectChanges();
    expect(sort.value).toBe('civilization');
    expect(sort.selectedOptions[0]?.textContent?.trim()).toBe('Civilización');
    expect(direction.value).toBe('asc');
    expect(direction.selectedOptions[0]?.textContent?.trim()).toBe('No primero / Sí después');

    stub.sortKey.set('galaxy');stub.direction.set('desc');fixture.detectChanges();
    expect(sort.value).toBe('galaxy');
    expect(sort.selectedOptions[0]?.textContent?.trim()).toBe('Galaxia');
    expect(direction.value).toBe('desc');
    expect(direction.selectedOptions[0]?.textContent?.trim()).toBe('Mayor a menor / Z–A');
  });

  it('representa el campo actual al cambiar de nombre a una magnitud numérica',()=>{
    state.set('ready');category.set('planets');
    const fixture=TestBed.createComponent(GenesisArchive);fixture.detectChanges();
    const sort=fixture.nativeElement.querySelector('[data-testid="archive-sort-field"]') as HTMLSelectElement;
    const direction=fixture.nativeElement.querySelector('[data-testid="archive-direction"]') as HTMLSelectElement;
    expect(sort.value).toBe('name');
    stub.sortKey.set('temperature');stub.direction.set('desc');fixture.detectChanges();
    expect(sort.value).toBe('temperature');
    expect(direction.value).toBe('desc');
    stub.sortKey.set('name');stub.direction.set('asc');fixture.detectChanges();
    expect(sort.value).toBe('name');
    expect(direction.value).toBe('asc');
  });

});
