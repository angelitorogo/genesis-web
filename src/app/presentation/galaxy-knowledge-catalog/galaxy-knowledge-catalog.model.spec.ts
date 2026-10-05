import {
  galaxyKnowledgeCatalogCategoryDefinition,
  normalizeGalaxyKnowledgeCatalogQuery,
  type GalaxyKnowledgeCatalogDescriptor,
} from './galaxy-knowledge-catalog.model';

const descriptor: GalaxyKnowledgeCatalogDescriptor = Object.freeze({
  category: 'extremes',
  title: 'Objetos extremos conocidos',
  description: 'test',
  identityLabel: 'OBJETO',
  sortOptions: Object.freeze([
    Object.freeze({ key: 'designation', label: 'Nombre' }),
    Object.freeze({ key: 'state', label: 'Estado' }),
  ]),
  defaultSortKey: 'designation',
  columns: Object.freeze([]),
});

describe('26.1c.1 galaxy knowledge catalogue query contract', () => {
  it('recognizes the generic catalogue categories without binding them to one presentation', () => {
    expect(galaxyKnowledgeCatalogCategoryDefinition('systems').label).toBe('Sistemas');
    expect(galaxyKnowledgeCatalogCategoryDefinition('extremes').label).toBe('Objetos extremos');
    expect(galaxyKnowledgeCatalogCategoryDefinition('captured').label).toBe('Capturados');
    expect(() => galaxyKnowledgeCatalogCategoryDefinition('unknown')).toThrowError(RangeError);
  });

  it('normalizes pagination, sorting and subtype into one stable route query', () => {
    const query = normalizeGalaxyKnowledgeCatalogQuery(
      'extremes',
      descriptor,
      {
        subtype: ' magnetar ',
        page: '3',
        pageSize: '50',
        sortKey: 'state',
        direction: 'desc',
      },
    );

    expect(query).toEqual({
      category: 'extremes',
      subtype: 'MAGNETAR',
      page: 3,
      pageSize: 50,
      sortKey: 'state',
      direction: 'desc',
    });
  });

  it('falls back to safe defaults for unsupported sort/page-size values', () => {
    const query = normalizeGalaxyKnowledgeCatalogQuery(
      'extremes',
      descriptor,
      {
        subtype: null,
        page: null,
        pageSize: '999',
        sortKey: 'groundTruthMass',
        direction: 'sideways',
      },
    );

    expect(query.page).toBe(1);
    expect(query.pageSize).toBe(25);
    expect(query.sortKey).toBe('designation');
    expect(query.direction).toBe('asc');
  });

  it('rejects malformed page and subtype route inputs', () => {
    expect(() => normalizeGalaxyKnowledgeCatalogQuery(
      'extremes',
      descriptor,
      {
        subtype: null,
        page: '0',
        pageSize: null,
        sortKey: null,
        direction: null,
      },
    )).toThrowError(RangeError);

    expect(() => normalizeGalaxyKnowledgeCatalogQuery(
      'extremes',
      descriptor,
      {
        subtype: 'MAGNETAR/../../hidden',
        page: null,
        pageSize: null,
        sortKey: null,
        direction: null,
      },
    )).toThrowError(RangeError);
  });
});
