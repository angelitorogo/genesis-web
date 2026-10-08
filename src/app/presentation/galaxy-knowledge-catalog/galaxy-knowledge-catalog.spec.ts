import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  provideRouter,
  Router,
} from '@angular/router';

import { GalaxyKnowledgeCatalogFacade } from './galaxy-knowledge-catalog.facade';
import {
  defineGalaxyKnowledgeCatalogDescriptor,
  galaxyKnowledgeCatalogField,
  galaxyKnowledgeCatalogIdentityField,
  type GalaxyKnowledgeCatalogQuery,
} from './galaxy-knowledge-catalog.model';
import { GalaxyKnowledgeCatalogPage } from './galaxy-knowledge-catalog';
import {
  GALAXY_KNOWLEDGE_CATALOG_COLUMN_PREFERENCES_STORAGE_KEY,
} from './galaxy-knowledge-catalog-column-preferences';

describe('26.1c.1 GalaxyKnowledgeCatalogPage', () => {
  const model = Object.freeze({
    galaxyIndex: 0n,
    galaxyName: 'Elixisis',
    galaxyDesignationCode: 'G0',
    routeUniverseRef: '0123456789ABCDEF0123456789ABCDEF',
    descriptor: defineGalaxyKnowledgeCatalogDescriptor({
      category: 'extremes' as const,
      title: 'Objetos extremos · MAGNETAR',
      description: 'test',
      fields: Object.freeze([
        galaxyKnowledgeCatalogIdentityField('designation', 'Nombre / designación', 'OBJETO'),
        galaxyKnowledgeCatalogField('state', 'Estado científico', {
          columnLabel: 'ESTADO', defaultVisible: true,
        }),
        galaxyKnowledgeCatalogField('type', 'Tipo extremo', {
          columnLabel: 'TIPO', defaultVisible: true,
        }),
        galaxyKnowledgeCatalogField('family', 'Familia física', {
          columnLabel: 'FAMILIA',
        }),
      ]),
      defaultSortKey: 'designation',
    }),
    query: Object.freeze<GalaxyKnowledgeCatalogQuery>({
      category: 'extremes',
      subtype: 'MAGNETAR',
      page: 2,
      pageSize: 25,
      sortKey: 'designation',
      direction: 'asc',
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
            cells: Object.freeze({ state: 'CONFIRMADO', type: 'Magnetar', family: 'Estrella de neutrones' }),
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
    localStorage.removeItem(GALAXY_KNOWLEDGE_CATALOG_COLUMN_PREFERENCES_STORAGE_KEY);
    facade.load.mockClear();
    facade.model.set(model);
    state.set({ kind: 'content' as const, model });
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

  afterEach(() => {
    localStorage.removeItem(GALAXY_KNOWLEDGE_CATALOG_COLUMN_PREFERENCES_STORAGE_KEY);
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

  it('keeps the visible Ordenar por selection synchronized with the current query', () => {
    const fixture = TestBed.createComponent(GalaxyKnowledgeCatalogPage);
    fixture.detectChanges();

    const sortedModel = Object.freeze({
      ...model,
      query: Object.freeze({ ...model.query, sortKey: 'state' }),
    });
    facade.model.set(sortedModel);
    state.set({ kind: 'content' as const, model: sortedModel });
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('[data-testid="gkc-sort"]') as HTMLSelectElement;
    expect(select.value).toBe('state');
    expect(select.selectedOptions.item(0)?.textContent?.trim()).toBe('Estado científico');
  });


  it('opens a category-specific column selector with identity/actions fixed', () => {
    const fixture = TestBed.createComponent(GalaxyKnowledgeCatalogPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    (root.querySelector('[data-testid="gkc-columns-toggle"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const panel = root.querySelector('[data-testid="gkc-columns-panel"]');
    expect(panel).toBeTruthy();
    expect(panel?.textContent).toContain('OBJETO');
    expect(panel?.textContent).toContain('Acciones');
    expect(panel?.textContent).toContain('Familia física');
    expect(root.querySelectorAll('[data-testid="gkc-visible-column"]')).toHaveLength(2);
    expect(root.querySelectorAll('[data-testid="gkc-hidden-column"]')).toHaveLength(1);
  });

  it('shows/hides optional fields and renders the selected scientific value', async () => {
    const fixture = TestBed.createComponent(GalaxyKnowledgeCatalogPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    (root.querySelector('[data-testid="gkc-columns-toggle"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const family = root.querySelector('input[data-field-key="family"]') as HTMLInputElement;
    family.checked = true;
    family.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();

    const headings = [...root.querySelectorAll('thead th')].map(cell => cell.textContent?.trim());
    expect(headings).toEqual(['OBJETO', 'ESTADO', 'TIPO', 'FAMILIA', 'ACCIONES']);
    expect(root.querySelector('tbody')?.textContent).toContain('Estrella de neutrones');

    const visibleFamily = root.querySelector('input[data-field-key="family"]') as HTMLInputElement;
    visibleFamily.checked = false;
    visibleFamily.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect([...root.querySelectorAll('thead th')].map(cell => cell.textContent?.trim()))
      .toEqual(['OBJETO', 'ESTADO', 'TIPO', 'ACCIONES']);
  });

  it('reorders visible fields without moving identity or actions', () => {
    const fixture = TestBed.createComponent(GalaxyKnowledgeCatalogPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    fixture.componentInstance.moveVisibleColumn(model.descriptor, 'type', -1);
    fixture.detectChanges();

    expect([...root.querySelectorAll('thead th')].map(cell => cell.textContent?.trim()))
      .toEqual(['OBJETO', 'TIPO', 'ESTADO', 'ACCIONES']);
  });

  it('restores the descriptor default columns after local customization', async () => {
    const fixture = TestBed.createComponent(GalaxyKnowledgeCatalogPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const event = { target: { checked: true } } as unknown as Event;
    await fixture.componentInstance.changeColumnVisibility(model.descriptor, 'family', event);
    fixture.componentInstance.moveVisibleColumn(model.descriptor, 'family', -1);
    fixture.componentInstance.resetColumns(model.descriptor);
    fixture.detectChanges();

    expect([...root.querySelectorAll('thead th')].map(cell => cell.textContent?.trim()))
      .toEqual(['OBJETO', 'ESTADO', 'TIPO', 'ACCIONES']);
  });

  it('automatically shows a hidden field when it becomes the active sort criterion', async () => {
    const fixture = TestBed.createComponent(GalaxyKnowledgeCatalogPage);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const root = fixture.nativeElement as HTMLElement;

    const select = root.querySelector('[data-testid="gkc-sort"]') as HTMLSelectElement;
    select.value = 'family';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect([...root.querySelectorAll('thead th')].map(cell => cell.textContent?.trim()))
      .toContain('FAMILIA');
  });

  it('persists a category layout and restores it in a fresh catalogue component', async () => {
    const first = TestBed.createComponent(GalaxyKnowledgeCatalogPage);
    first.detectChanges();

    await first.componentInstance.changeColumnVisibility(
      model.descriptor,
      'family',
      { target: { checked: true } } as unknown as Event,
    );
    first.componentInstance.moveVisibleColumn(model.descriptor, 'family', -1);
    first.destroy();

    const second = TestBed.createComponent(GalaxyKnowledgeCatalogPage);
    second.detectChanges();
    const headings = [...(second.nativeElement as HTMLElement).querySelectorAll('thead th')]
      .map(cell => cell.textContent?.trim());

    expect(headings).toEqual(['OBJETO', 'ESTADO', 'FAMILIA', 'TIPO', 'ACCIONES']);
  });

  it('resetting columns clears the persisted override and restores descriptor defaults', async () => {
    const fixture = TestBed.createComponent(GalaxyKnowledgeCatalogPage);
    fixture.detectChanges();
    await fixture.componentInstance.changeColumnVisibility(
      model.descriptor,
      'family',
      { target: { checked: true } } as unknown as Event,
    );

    await fixture.componentInstance.resetColumns(model.descriptor);

    const raw = localStorage.getItem(GALAXY_KNOWLEDGE_CATALOG_COLUMN_PREFERENCES_STORAGE_KEY);
    expect(raw ?? '').not.toContain('family');
    fixture.detectChanges();
    expect([...(fixture.nativeElement as HTMLElement).querySelectorAll('thead th')]
      .map(cell => cell.textContent?.trim()))
      .toEqual(['OBJETO', 'ESTADO', 'TIPO', 'ACCIONES']);
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
