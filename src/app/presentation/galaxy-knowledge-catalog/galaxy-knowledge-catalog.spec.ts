import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  provideRouter,
  Router,
} from '@angular/router';

import { GalaxyKnowledgeCatalogFacade } from './galaxy-knowledge-catalog.facade';
import { GalaxyKnowledgeCatalogPage } from './galaxy-knowledge-catalog';

describe('26.1c.1 GalaxyKnowledgeCatalogPage', () => {
  const model = Object.freeze({
    galaxyIndex: 0n,
    galaxyName: 'Elixisis',
    galaxyDesignationCode: 'G0',
    routeUniverseRef: '0123456789ABCDEF0123456789ABCDEF',
    descriptor: Object.freeze({
      category: 'extremes' as const,
      title: 'Objetos extremos · MAGNETAR',
      description: 'test',
      identityLabel: 'OBJETO',
      sortOptions: Object.freeze([
        Object.freeze({ key: 'designation', label: 'Nombre / designación' }),
        Object.freeze({ key: 'state', label: 'Estado científico' }),
      ]),
      defaultSortKey: 'designation',
      columns: Object.freeze([
        Object.freeze({ key: 'state', label: 'ESTADO' }),
      ]),
    }),
    query: Object.freeze({
      category: 'extremes' as const,
      subtype: 'MAGNETAR',
      page: 2,
      pageSize: 25 as const,
      sortKey: 'designation',
      direction: 'asc' as const,
    }),
    data: Object.freeze({
      kind: 'page' as const,
      page: Object.freeze({
        totalItems: 63,
        page: 2,
        pageSize: 25 as const,
        totalPages: 3,
        items: Object.freeze([
          Object.freeze({
            id: 'G0/S12/O7',
            title: 'G0 / S12 / O7',
            subtitle: 'Magnetar',
            cells: Object.freeze({ state: 'CONFIRMADO' }),
            actions: Object.freeze([
              Object.freeze({
                label: 'ABRIR FICHA',
                route: Object.freeze(['/archive/galactic-object', '0', '12', '7']),
                emphasis: 'primary' as const,
              }),
            ]),
          }),
        ]),
      }),
    }),
  });

  const state = signal({ kind: 'content' as const, model });
  const facade = {
    state,
    model: signal(model),
    errorMessage: signal(''),
    load: vi.fn(async () => undefined),
  };

  beforeEach(() => {
    facade.load.mockClear();
    TestBed.configureTestingModule({
      imports: [GalaxyKnowledgeCatalogPage],
      providers: [
        provideRouter([]),
        {
          provide: GalaxyKnowledgeCatalogFacade,
          useValue: facade,
        },
      ],
    });
  });

  it('renders one generic table, pagination and navigation independently of object family', () => {
    const fixture = TestBed.createComponent(GalaxyKnowledgeCatalogPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('[data-testid="galaxy-knowledge-catalog-page"]')).toBeTruthy();
    expect(root.querySelector('[data-testid="gkc-row"]')?.textContent).toContain('Magnetar');
    expect(root.querySelector('[data-testid="gkc-page-meta"]')?.textContent).toContain('63');
    expect(root.querySelector('[data-testid="gkc-prev-page"]')).toBeTruthy();
    expect(root.querySelector('[data-testid="gkc-next-page"]')).toBeTruthy();
    expect(root.querySelector('[data-testid="gkc-back-galaxy"]')).toBeTruthy();
    expect(root.querySelector('td.gkc__value-cell')).toBeTruthy();
  });

  it('preserves the public universe ref and subtype while navigating to another page', () => {
    const fixture = TestBed.createComponent(GalaxyKnowledgeCatalogPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.pageQueryParams(3)).toEqual({
      u: model.routeUniverseRef,
      page: '3',
      size: '25',
      sort: 'designation',
      direction: 'asc',
      type: 'MAGNETAR',
    });
  });

  it('moves sorting back to page one through URL state rather than local hidden state', async () => {
    const fixture = TestBed.createComponent(GalaxyKnowledgeCatalogPage);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const select = fixture.nativeElement.querySelector('[data-testid="gkc-sort"]') as HTMLSelectElement;
    select.value = 'state';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: expect.objectContaining({
        u: model.routeUniverseRef,
        type: 'MAGNETAR',
        page: '1',
        sort: 'state',
      }),
    }));
  });
});
