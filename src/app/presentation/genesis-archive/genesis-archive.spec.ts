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
  const stub={
    state,error:signal(''),universes:signal([]),galaxies:signal([]),
    selectedUniverseRef:signal('PUBLIC-REF'),indexedGalaxies:signal(0),
    sections:signal([]),category,busy:signal(false),progress:signal(''),
    indexProgress,indexProgressStored,indexProgressTotal,progressDetails,
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
    stub.load.mockClear();progressDetails.mockClear();
    TestBed.configureTestingModule({imports:[GenesisArchive],providers:[provideRouter([]),
      {provide:GenesisUniversalArchiveFacade38Bis,useValue:stub}]});
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
    expect(panel?.textContent).toContain('0 / 2 revisadas en esta apertura');
    expect(panel?.textContent).toContain('Planetas');
    expect(progressDetails).toHaveBeenCalledWith('planets');
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

});
