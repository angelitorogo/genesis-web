import {
  catalogColumnsStorageKey,
  catalogColumnsWithSort,
  catalogFields,
  catalogMoveColumn,
  catalogToggleColumn,
  catalogVisibleColumns,
  initialCatalogColumns,
  reconcileCatalogColumns,
} from './galaxy-knowledge-catalog-columns';
import { type GalaxyKnowledgeCatalogDescriptor } from './galaxy-knowledge-catalog.model';

const systemsDescriptor: GalaxyKnowledgeCatalogDescriptor = {
  category: 'systems',
  title: 'Sistemas', description: '', identityLabel: 'SISTEMA',
  sortOptions: [
    { key: 'designation', label: 'Nombre / designación' },
    { key: 'state', label: 'Estado científico' },
    { key: 'multiplicity', label: 'Tipo de sistema' },
    { key: 'components', label: 'Número de estrellas' },
    { key: 'sector', label: 'Sector' },
    { key: 'locator', label: 'Localización procedural' },
  ],
  defaultSortKey: 'designation',
  columns: [
    { key: 'state', label: 'ESTADO' },
    { key: 'multiplicity', label: 'TIPO' },
    { key: 'components', label: 'ESTRELLAS', align: 'end' },
    { key: 'sector', label: 'SECTOR', align: 'end' },
  ],
};

describe('26.1c.8 restored per-category catalogue columns', () => {
  const fields = catalogFields(systemsDescriptor);

  it('uses all sortable fields as columns while keeping identity pinned', () => {
    expect(fields.map(field => field.key)).toEqual(
      systemsDescriptor.sortOptions.filter(field => field.key !== 'designation').map(field => field.key),
    );
    expect(initialCatalogColumns(fields).visibleFieldKeys).toEqual([
      'state', 'multiplicity', 'components', 'sector',
    ]);
    expect(fields.find(field => field.key === 'components')?.align).toBe('end');
  });

  it('hides and adds columns without changing the available sorting options', () => {
    const initial = initialCatalogColumns(fields);
    const removed = catalogToggleColumn(initial, 'components', false, 'designation');
    expect(catalogVisibleColumns(fields, removed).map(field => field.key)).not.toContain('components');
    const restored = catalogToggleColumn(removed, 'components', true, 'designation');
    expect(catalogVisibleColumns(fields, restored).map(field => field.key)).toContain('components');
    expect(systemsDescriptor.sortOptions).toHaveLength(6);
  });

  it('automatically reveals the hidden sort field and prevents hiding the active sort', () => {
    const initial = initialCatalogColumns(fields);
    expect(initial.visibleFieldKeys).not.toContain('locator');
    const sorted = catalogColumnsWithSort(initial, 'locator');
    expect(sorted.visibleFieldKeys).toContain('locator');
    expect(catalogToggleColumn(sorted, 'locator', false, 'locator')).toEqual(sorted);
    expect(catalogColumnsWithSort(sorted, 'designation')).toEqual(sorted);
  });

  it('reorders visible columns without affecting pinned name/actions', () => {
    const initial = initialCatalogColumns(fields);
    const moved = catalogMoveColumn(initial, 'sector', -1);
    expect(moved.visibleFieldKeys).toEqual(['state', 'multiplicity', 'sector', 'components']);
    expect(catalogMoveColumn(moved, 'state', -1)).toEqual(moved);
  });

  it('preserves user choices, rejects stale columns and incorporates newly added defaults', () => {
    const persisted = {
      visibleFieldKeys: ['sector', 'state', 'obsolete-key', 'sector'],
      knownFieldKeys: ['state', 'multiplicity', 'sector', 'obsolete-key'],
    };
    expect(reconcileCatalogColumns(fields, persisted).visibleFieldKeys).toEqual([
      'sector', 'state', 'components',
    ]);
    expect(reconcileCatalogColumns(fields, { visibleFieldKeys: 'bad' })).toEqual(
      initialCatalogColumns(fields),
    );
  });

  it('separates preference keys for all ten object categories', () => {
    const categories = [
      'systems', 'planets', 'moons', 'clusters', 'nebulae', 'extremes',
      'asteroids', 'comets', 'tno', 'captured',
    ] as const;
    expect(new Set(categories.map(catalogColumnsStorageKey)).size).toBe(10);
  });
});
