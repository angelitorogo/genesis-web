import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  provideRouter,
  Router,
} from '@angular/router';

import { GalaxyKnowledgeCatalogFacade, type GalaxyKnowledgeCatalogModel } from './galaxy-knowledge-catalog.facade';
import { GalaxyKnowledgeCatalogPage } from './galaxy-knowledge-catalog';
import { catalogColumnsStorageKey } from './galaxy-knowledge-catalog-columns';

describe('26.1c.1 GalaxyKnowledgeCatalogPage', () => {
  const model: GalaxyKnowledgeCatalogModel = Object.freeze({
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
    localStorage.removeItem(catalogColumnsStorageKey('extremes'));
    facade.model.set(model);
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
    // The name is the only text in the identity cell; keep subtitle available in data, not rendered.
    const identityCell = root.querySelector('[data-testid="gkc-row"] td:first-child');
    expect(identityCell?.textContent?.trim()).toBe('G0 / S12 / O7');
    expect(identityCell?.querySelector('small')).toBeNull();
    expect(identityCell?.textContent).not.toContain('Magnetar');
    expect(root.querySelector('[data-testid="gkc-page-meta"]')?.textContent).toContain('63');
    expect(root.querySelector('[data-testid="gkc-prev-page"]')).toBeTruthy();
    expect(root.querySelector('[data-testid="gkc-next-page"]')).toBeTruthy();
    expect(root.querySelector('[data-testid="gkc-back-galaxy"]')).toBeTruthy();
    expect(root.querySelector('td.gkc__value-cell')).toBeTruthy();
    // Actions remain the very last column, aligned above their own action buttons.
    const actionsHeading = root.querySelector('thead th:last-child') as HTMLTableCellElement;
    const actionsCell = root.querySelector('tbody tr td:last-child') as HTMLTableCellElement;
    expect(actionsHeading.textContent?.trim()).toBe('ACCIONES');
    expect(actionsHeading.classList.contains('gkc__actions-column')).toBe(true);
    expect(actionsCell.classList.contains('gkc__actions-column')).toBe(true);
    expect(actionsCell.querySelector('.gkc__actions a')?.textContent).toContain('ABRIR FICHA');
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


  it('lets the user configure columns and remembers the choice within the category', () => {
    const fixture = TestBed.createComponent(GalaxyKnowledgeCatalogPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const checkbox = root.querySelector('[data-column-key="state"]') as HTMLInputElement;
    expect(root.querySelectorAll('td.gkc__value-cell')).toHaveLength(1);
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(root.querySelectorAll('td.gkc__value-cell')).toHaveLength(0);
    expect(root.querySelector('thead th:last-child')?.textContent?.trim()).toBe('ACCIONES');
    expect(root.querySelector('tbody tr td:last-child .gkc__actions a')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(catalogColumnsStorageKey('extremes')) ?? '{}')).toEqual(
      expect.objectContaining({ visibleFieldKeys: [] }),
    );
    const reset = root.querySelector('[data-testid="gkc-reset-columns"]') as HTMLButtonElement;
    reset.click();
    fixture.detectChanges();
    expect(root.querySelectorAll('td.gkc__value-cell')).toHaveLength(1);
  });

  it('makes the selected sorting field visible even if it was hidden', async () => {
    const fixture = TestBed.createComponent(GalaxyKnowledgeCatalogPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const checkbox = root.querySelector('[data-column-key="state"]') as HTMLInputElement;
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(checkbox.checked).toBe(false);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const sort = root.querySelector('[data-testid="gkc-sort"]') as HTMLSelectElement;
    sort.value = 'state';
    sort.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    // Simulate the facade committing the new query once the URL navigation resolves.
    facade.model.set({ ...model, query: { ...model.query, sortKey: 'state' } });
    fixture.detectChanges();
    expect(sort.value).toBe('state');
    expect(root.querySelectorAll('td.gkc__value-cell')).toHaveLength(1);
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
