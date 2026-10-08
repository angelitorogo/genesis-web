import {
  defineGalaxyKnowledgeCatalogDescriptor,
  galaxyKnowledgeCatalogField,
  galaxyKnowledgeCatalogIdentityField,
} from './galaxy-knowledge-catalog.model';
import {
  GALAXY_KNOWLEDGE_CATALOG_COLUMN_PREFERENCES_STORAGE_KEY,
  galaxyKnowledgeCatalogLayoutFromStoredPreference,
  galaxyKnowledgeCatalogStoredPreferenceFromLayout,
  parseGalaxyKnowledgeCatalogColumnPreferences,
  readGalaxyKnowledgeCatalogColumnPreferences,
  saveGalaxyKnowledgeCatalogColumnPreferences,
} from './galaxy-knowledge-catalog-column-preferences';

function descriptor(includeFutureDefault = false) {
  return defineGalaxyKnowledgeCatalogDescriptor({
    category: 'planets',
    title: 'Planetas',
    description: 'test',
    fields: Object.freeze([
      galaxyKnowledgeCatalogIdentityField('designation', 'Nombre', 'PLANETA'),
      galaxyKnowledgeCatalogField('state', 'Estado', {
        columnLabel: 'ESTADO', defaultVisible: true,
      }),
      galaxyKnowledgeCatalogField('mass', 'Masa', {
        columnLabel: 'MASA', defaultVisible: true,
      }),
      galaxyKnowledgeCatalogField('temperature', 'Temperatura'),
      ...(includeFutureDefault
        ? [galaxyKnowledgeCatalogField('density', 'Densidad', {
          columnLabel: 'DENSIDAD', defaultVisible: true,
        })]
        : []),
    ]),
    defaultSortKey: 'designation',
  });
}

describe('26.1c.8c persisted catalogue column preferences', () => {
  beforeEach(() => {
    localStorage.removeItem(GALAXY_KNOWLEDGE_CATALOG_COLUMN_PREFERENCES_STORAGE_KEY);
  });

  afterEach(() => {
    localStorage.removeItem(GALAXY_KNOWLEDGE_CATALOG_COLUMN_PREFERENCES_STORAGE_KEY);
  });

  it('persists only field keys/order per category and never scientific row values', () => {
    const current = descriptor();
    const preference = galaxyKnowledgeCatalogStoredPreferenceFromLayout(current, {
      visibleFieldKeys: ['temperature', 'mass'],
    });

    saveGalaxyKnowledgeCatalogColumnPreferences({ planets: preference });

    const raw = localStorage.getItem(GALAXY_KNOWLEDGE_CATALOG_COLUMN_PREFERENCES_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(raw).toContain('temperature');
    expect(raw).toContain('mass');
    expect(raw).not.toContain('Magnetar');
    expect(raw).not.toContain('CONFIRMADO');
    expect(raw).not.toContain('7F21-A9D4');

    const restored = readGalaxyKnowledgeCatalogColumnPreferences();
    expect(restored.planets?.visibleFieldKeys).toEqual(['temperature', 'mass']);
    expect(restored.planets?.knownFieldKeys).toEqual(['state', 'mass', 'temperature']);
  });

  it('isolates layouts by catalogue category', () => {
    saveGalaxyKnowledgeCatalogColumnPreferences({
      planets: {
        visibleFieldKeys: ['mass'],
        knownFieldKeys: ['state', 'mass', 'temperature'],
      },
      moons: {
        visibleFieldKeys: ['ice', 'period'],
        knownFieldKeys: ['ice', 'period'],
      },
    });

    const restored = readGalaxyKnowledgeCatalogColumnPreferences();
    expect(restored.planets?.visibleFieldKeys).toEqual(['mass']);
    expect(restored.moons?.visibleFieldKeys).toEqual(['ice', 'period']);
    expect(restored.systems).toBeUndefined();
  });

  it('merges a future default-visible field without reviving fields the user hid', () => {
    const oldDescriptor = descriptor();
    const stored = galaxyKnowledgeCatalogStoredPreferenceFromLayout(oldDescriptor, {
      visibleFieldKeys: ['mass'],
    });

    const restored = galaxyKnowledgeCatalogLayoutFromStoredPreference(
      descriptor(true),
      stored,
    );

    expect(restored.visibleFieldKeys).toEqual(['mass', 'density']);
    expect(restored.visibleFieldKeys).not.toContain('state');
  });

  it('drops obsolete, duplicated and non-registry keys so preferences cannot expose hidden science', () => {
    const restored = galaxyKnowledgeCatalogLayoutFromStoredPreference(descriptor(), {
      visibleFieldKeys: ['groundTruthMass', 'temperature', 'temperature', 'obsolete'],
      knownFieldKeys: ['state', 'mass', 'temperature', 'groundTruthMass', 'obsolete'],
    });

    expect(restored.visibleFieldKeys).toEqual(['temperature']);
  });

  it('falls back safely from corrupt or unsupported local snapshots', () => {
    expect(parseGalaxyKnowledgeCatalogColumnPreferences('{broken')).toEqual({});
    expect(parseGalaxyKnowledgeCatalogColumnPreferences(JSON.stringify({
      version: 99,
      categories: { planets: { visibleFieldKeys: ['mass'], knownFieldKeys: ['mass'] } },
    }))).toEqual({});

    localStorage.setItem(
      GALAXY_KNOWLEDGE_CATALOG_COLUMN_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ version: 1, categories: { planets: { visibleFieldKeys: [42], knownFieldKeys: [] } } }),
    );
    expect(readGalaxyKnowledgeCatalogColumnPreferences()).toEqual({});
  });
});
