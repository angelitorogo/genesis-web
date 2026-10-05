import { TestBed } from '@angular/core/testing';

import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import {
  PendingGalaxyKnowledgeCatalogDataSource,
} from './galaxy-knowledge-catalog.data-source';
import {
  type GalaxyKnowledgeCatalogCategory,
  type GalaxyKnowledgeCatalogDataResult,
  type GalaxyKnowledgeCatalogDescriptor,
} from './galaxy-knowledge-catalog.model';
import { GalaxyKnowledgeGalacticObjectsCatalogDataSource } from './galaxy-knowledge-galactic-objects-catalog.data-source';
import { GalaxyKnowledgeMinorBodiesCatalogDataSource } from './galaxy-knowledge-minor-bodies-catalog.data-source';
import { GalaxyKnowledgePlanetsMoonsCatalogDataSource } from './galaxy-knowledge-planets-moons-catalog.data-source';
import { GalaxyKnowledgeSystemsCatalogDataSource } from './galaxy-knowledge-systems-catalog.data-source';

const generationKey = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),
  GeneratorVersion.V2,
);

const categories: readonly GalaxyKnowledgeCatalogCategory[] = Object.freeze([
  'systems',
  'planets',
  'moons',
  'clusters',
  'nebulae',
  'extremes',
  'asteroids',
  'comets',
  'tno',
  'captured',
]);

function descriptor(category: GalaxyKnowledgeCatalogCategory): GalaxyKnowledgeCatalogDescriptor {
  return Object.freeze({
    category,
    title: category,
    description: '26.1c.7 regression descriptor',
    identityLabel: 'OBJETO',
    sortOptions: Object.freeze([
      Object.freeze({ key: 'designation', label: 'Nombre / designación' }),
    ]),
    defaultSortKey: 'designation',
    columns: Object.freeze([]),
  });
}

function pageResult(): GalaxyKnowledgeCatalogDataResult {
  return Object.freeze({
    kind: 'page' as const,
    page: Object.freeze({
      totalItems: 0,
      page: 1,
      pageSize: 25 as const,
      totalPages: 1,
      items: Object.freeze([]),
    }),
  });
}

describe('26.1c.7 galaxy knowledge catalogue regression matrix', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('keeps every 26.1c catalogue family connected to exactly one adapter', async () => {
    const systems = {
      describe: vi.fn(() => descriptor('systems')),
      query: vi.fn(async () => pageResult()),
    };
    const planetsMoons = {
      describe: vi.fn((category: 'planets' | 'moons') => descriptor(category)),
      query: vi.fn(async () => pageResult()),
    };
    const galacticObjects = {
      describe: vi.fn((category: 'clusters' | 'nebulae' | 'extremes') => descriptor(category)),
      query: vi.fn(async () => pageResult()),
    };
    const minorBodies = {
      describe: vi.fn((category: 'asteroids' | 'comets' | 'tno' | 'captured') => descriptor(category)),
      query: vi.fn(async () => pageResult()),
    };

    TestBed.configureTestingModule({
      providers: [
        PendingGalaxyKnowledgeCatalogDataSource,
        { provide: GalaxyKnowledgeSystemsCatalogDataSource, useValue: systems },
        { provide: GalaxyKnowledgePlanetsMoonsCatalogDataSource, useValue: planetsMoons },
        { provide: GalaxyKnowledgeGalacticObjectsCatalogDataSource, useValue: galacticObjects },
        { provide: GalaxyKnowledgeMinorBodiesCatalogDataSource, useValue: minorBodies },
      ],
    });

    const source = TestBed.inject(PendingGalaxyKnowledgeCatalogDataSource);

    for (const category of categories) {
      expect(source.describe(category, null).category).toBe(category);
      const result = await source.query({
        generationKey,
        galaxyIndex: 0n,
        galaxyState: DiscoveryState.CONFIRMED,
        query: {
          category,
          subtype: null,
          page: 1,
          pageSize: 25,
          sortKey: 'designation',
          direction: 'asc',
        },
      });
      expect(result.kind).toBe('page');
    }

    expect(systems.describe).toHaveBeenCalledTimes(1);
    expect(systems.query).toHaveBeenCalledTimes(1);
    expect(planetsMoons.describe).toHaveBeenCalledTimes(2);
    expect(planetsMoons.query).toHaveBeenCalledTimes(2);
    expect(galacticObjects.describe).toHaveBeenCalledTimes(3);
    expect(galacticObjects.query).toHaveBeenCalledTimes(3);
    expect(minorBodies.describe).toHaveBeenCalledTimes(4);
    expect(minorBodies.query).toHaveBeenCalledTimes(4);
  });
});
