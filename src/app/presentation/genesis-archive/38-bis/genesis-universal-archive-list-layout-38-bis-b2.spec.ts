import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {vi} from 'vitest';
import {GenesisArchive} from '../genesis-archive';
import {GenesisUniversalArchiveFacade38Bis} from './genesis-universal-archive-38-bis.facade';
import type {UniversalArchiveIndexedCategory38Bis,UniversalArchivePage38Bis,
  UniversalArchiveRow38Bis,UniversalArchiveCategory38Bis} from './genesis-universal-archive-38-bis.model';

const categories:readonly UniversalArchiveIndexedCategory38Bis[]=[
  'systems','stars','planets','moons','clusters','nebulae','extremes','asteroids',
  'comets','tno','captured','civilizations','colonies','colonized-planets','colonized-moons',
];

function sample(category:UniversalArchiveIndexedCategory38Bis):UniversalArchiveRow38Bis {
  const actionLabel=category==='stars'?'Abrir ficha del sistema':
    category==='civilizations'?'Ver especie':
    category==='colonies'||category==='colonized-planets'||category==='colonized-moons'
      ?'Abrir ficha del cuerpo':'Abrir ficha científica';
  return {
    id:`${category}:1`,scope:'u',category,galaxyIndex:'1',subtype:'ALL',
    sortTitle:'aaras',title:'Aaras A-11 I',subtitle:'',
    cells:{planet:'Aaras A-11',system:'Aaras',composition:'Mezcla roca/hielo',
      mass:'0,00066 M⊕',radius:'729 km',count:'1',originPlanet:'Aaras A-3'},
    actions:[{label:actionLabel,route:['/archive']}],
  };
}

describe('38.bis-b2 — metadatos etiqueta/valor en todos los listados',()=>{
  const selectedCategory=signal<UniversalArchiveCategory38Bis|null>('moons');
  const selectedPage=signal<UniversalArchivePage38Bis|null>(null);
  const stub={
    state:signal<'ready'>('ready'),error:signal(''),universes:signal([]),galaxies:signal([]),
    selectedUniverseRef:signal('UNIVERSO-PRUEBA'),indexedGalaxies:signal(1),
    category:selectedCategory,page:selectedPage,busy:signal(false),progress:signal(''),
    indexProgress:signal([]),indexProgressStored:signal(0),indexProgressTotal:signal(0),
    sortIndexStats38BisT3:signal({valid:0,stale:0}),dirtyJobCount38BisT3:signal(0),
    updateJobsArchfast1:signal([]),
    progressDetails:vi.fn(()=>[]),
    selectedGalaxy:signal(null),selectedSubtype:signal(null),direction:signal('asc'),
    sortKey:signal('name'),sortOptions:signal([]),
    pageNumber:signal(1),pageSize:signal(25),colonizationOverview:signal(null),
    categories:categories.map(id=>({id,label:id,description:id})),
    count:vi.fn(()=>({count:1,indexed:1,totalGalaxies:1,knowledgeComplete:true})),
    load:vi.fn(async()=>undefined),refreshIndex:vi.fn(async()=>undefined),
    diagnoseColonization:vi.fn(async()=>undefined),
  };

  beforeEach(()=>{
    selectedCategory.set('moons');selectedPage.set(null);
    TestBed.configureTestingModule({imports:[GenesisArchive],providers:[
      provideRouter([]),{provide:GenesisUniversalArchiveFacade38Bis,useValue:stub},
    ]});
  });

  it.each(categories)('%s presenta cada etiqueta encima de su dato en el mismo bloque',category=>{
    selectedCategory.set(category);
    selectedPage.set({items:[sample(category)],total:1,page:1,pageSize:25,totalPages:1});
    const fixture=TestBed.createComponent(GenesisArchive);
    fixture.detectChanges();
    const element=fixture.nativeElement as HTMLElement;
    const result=element.querySelector<HTMLElement>('[data-testid="archive-result"]');
    expect(result?.querySelector('.archive-row__name')?.textContent?.trim()).toBe('Aaras A-11 I');
    const summary=result?.querySelector<HTMLDListElement>('dl.archive-row__summary');
    expect(summary).not.toBeNull();
    const fields=Array.from(summary!.querySelectorAll<HTMLElement>(':scope > .archive-row__field'));
    expect(fields.length).toBeGreaterThan(0);
    for(const field of fields){
      const label=field.querySelector('dt.archive-row__field-label');
      const value=field.querySelector('dd.archive-row__field-value');
      expect(label?.textContent?.trim()).toBeTruthy();
      expect(value?.textContent?.trim()).toBeTruthy();
      expect(label?.nextElementSibling).toBe(value);
    }
    expect(result?.querySelectorAll('.archive-row__actions a').length).toBe(1);
    fixture.destroy();
  });

  it('no modifica el diseño ni la ruta de la categoría Galaxias',()=>{
    selectedCategory.set('galaxies');
    const fixture=TestBed.createComponent(GenesisArchive);
    fixture.detectChanges();
    const element=fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="archive-galaxies-list"]')).not.toBeNull();
    expect(element.querySelector('.archive-row__summary')).toBeNull();
    fixture.destroy();
  });
});
