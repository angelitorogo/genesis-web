import {
  defineGalaxyKnowledgeCatalogDescriptor,
  galaxyKnowledgeCatalogColumnsForLayout,
  galaxyKnowledgeCatalogDefaultColumnLayout,
  galaxyKnowledgeCatalogField,
  galaxyKnowledgeCatalogHiddenFields,
  galaxyKnowledgeCatalogIdentityField,
  galaxyKnowledgeCatalogVisibleFields,
  normalizeGalaxyKnowledgeCatalogColumnLayout,
  galaxyKnowledgeCatalogCategoryDefinition,
  normalizeGalaxyKnowledgeCatalogQuery,
  type GalaxyKnowledgeCatalogDescriptor,
} from './galaxy-knowledge-catalog.model';

const descriptor: GalaxyKnowledgeCatalogDescriptor = defineGalaxyKnowledgeCatalogDescriptor({
  category: 'extremes',
  title: 'Objetos extremos conocidos',
  description: 'test',
  fields: Object.freeze([
    galaxyKnowledgeCatalogIdentityField('designation', 'Nombre', 'OBJETO'),
    galaxyKnowledgeCatalogField('state', 'Estado'),
  ]),
  defaultSortKey: 'designation',
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

  it('derives sorting and default columns from one field registry', () => {
    const unified = defineGalaxyKnowledgeCatalogDescriptor({
      category: 'planets',
      title: 'Planetas',
      description: 'test',
      fields: Object.freeze([
        galaxyKnowledgeCatalogIdentityField('designation', 'Nombre / designación', 'PLANETA'),
        galaxyKnowledgeCatalogField('mass', 'Masa', {
          columnLabel: 'MASA', defaultVisible: true, align: 'end',
        }),
        galaxyKnowledgeCatalogField('temperature', 'Temperatura'),
        galaxyKnowledgeCatalogField('diagnostic', 'Diagnóstico', {
          columnLabel: 'DIAGNÓSTICO', defaultVisible: true,
        }),
      ]),
      defaultSortKey: 'designation',
    });

    expect(unified.sortOptions).toEqual([
      { key: 'designation', label: 'Nombre / designación' },
      { key: 'mass', label: 'Masa' },
      { key: 'temperature', label: 'Temperatura' },
      { key: 'diagnostic', label: 'Diagnóstico' },
    ]);
    expect(unified.columns).toEqual([
      { key: 'mass', label: 'MASA', align: 'end' },
      { key: 'diagnostic', label: 'DIAGNÓSTICO' },
    ]);
    expect(unified.identityLabel).toBe('PLANETA');
  });

  it('requires every configurable data field to be a real sorting option', () => {
    expect(() => defineGalaxyKnowledgeCatalogDescriptor({
      category: 'planets',
      title: 'Planetas',
      description: 'test',
      fields: Object.freeze([
        galaxyKnowledgeCatalogIdentityField('designation', 'Nombre', 'PLANETA'),
        galaxyKnowledgeCatalogField('mass', 'Masa', {
          columnLabel: 'MASA', defaultVisible: true, sortable: false,
        }),
      ]),
      defaultSortKey: 'designation',
    })).toThrowError(/Todo campo configurable debe ser ordenable/);
  });

  it('builds an ordered configurable column layout from the same field registry', () => {
    const configurable = defineGalaxyKnowledgeCatalogDescriptor({
      category: 'planets',
      title: 'Planetas',
      description: 'test',
      fields: Object.freeze([
        galaxyKnowledgeCatalogIdentityField('designation', 'Nombre / designación', 'PLANETA'),
        galaxyKnowledgeCatalogField('state', 'Estado', { columnLabel: 'ESTADO', defaultVisible: true }),
        galaxyKnowledgeCatalogField('mass', 'Masa', { columnLabel: 'MASA', defaultVisible: true, align: 'end' }),
        galaxyKnowledgeCatalogField('temperature', 'Temperatura', { columnLabel: 'TEMP.' }),
      ]),
      defaultSortKey: 'designation',
    });

    const defaults = galaxyKnowledgeCatalogDefaultColumnLayout(configurable);
    expect(defaults.visibleFieldKeys).toEqual(['state', 'mass']);
    expect(galaxyKnowledgeCatalogVisibleFields(configurable, defaults).map(field => field.key))
      .toEqual(['state', 'mass']);
    expect(galaxyKnowledgeCatalogHiddenFields(configurable, defaults).map(field => field.key))
      .toEqual(['temperature']);

    const customized = normalizeGalaxyKnowledgeCatalogColumnLayout(configurable, {
      visibleFieldKeys: ['temperature', 'mass', 'temperature', 'designation', 'unknown'],
    });
    expect(customized.visibleFieldKeys).toEqual(['temperature', 'mass']);
    expect(galaxyKnowledgeCatalogColumnsForLayout(configurable, customized)).toEqual([
      { key: 'temperature', label: 'TEMP.' },
      { key: 'mass', label: 'MASA', align: 'end' },
    ]);
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
