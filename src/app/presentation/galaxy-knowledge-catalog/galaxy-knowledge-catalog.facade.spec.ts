import { TestBed } from '@angular/core/testing';

import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import {
  GENESIS_LOCAL_REPOSITORIES,
  type GenesisLocalRepositories,
} from '../runtime/genesis-local-repositories';
import { DEFAULT_UNIVERSE_SEED } from '../universe/universe-seed.facade';
import {
  GALAXY_KNOWLEDGE_CATALOG_DATA_SOURCE,
  type GalaxyKnowledgeCatalogDataSource,
} from './galaxy-knowledge-catalog.data-source';
import { GalaxyKnowledgeCatalogFacade } from './galaxy-knowledge-catalog.facade';
import {
  defineGalaxyKnowledgeCatalogDescriptor,
  galaxyKnowledgeCatalogField,
  galaxyKnowledgeCatalogIdentityField,
} from './galaxy-knowledge-catalog.model';

const generationKey = new UniverseGenerationKey(
  UniverseSeed.parse(DEFAULT_UNIVERSE_SEED),
  GeneratorVersion.V1,
);

describe('26.1c.1 GalaxyKnowledgeCatalogFacade', () => {
  it('resolves the known galaxy and forwards one normalized generic query without scanning the global catalogue', async () => {
    const getKnownDiscoveries = vi.fn(async () => {
      throw new Error('26.1c.1 core must not scan all discoveries before a category adapter asks for them.');
    });
    const repositories = {
      universeRepository: {
        async getAll() { return [generationKey]; },
      },
      discoveryRepository: {
        async getState() { return DiscoveryState.CONFIRMED; },
        getKnownDiscoveries,
      },
    } as unknown as GenesisLocalRepositories;

    const query = vi.fn(async () => Object.freeze({
      kind: 'page' as const,
      page: Object.freeze({
        totalItems: 2,
        page: 1,
        pageSize: 25 as const,
        totalPages: 1,
        items: Object.freeze([]),
      }),
    }));
    const dataSource: GalaxyKnowledgeCatalogDataSource = {
      describe(category, subtype) {
        expect(category).toBe('extremes');
        expect(subtype).toBe('MAGNETAR');
        return defineGalaxyKnowledgeCatalogDescriptor({
          category,
          title: 'Magnetares',
          description: 'test',
          fields: Object.freeze([
            galaxyKnowledgeCatalogIdentityField('designation', 'Nombre', 'OBJETO'),
            galaxyKnowledgeCatalogField('state', 'Estado'),
          ]),
          defaultSortKey: 'designation',
        });
      },
      query,
    };

    TestBed.configureTestingModule({
      providers: [
        GalaxyKnowledgeCatalogFacade,
        { provide: GENESIS_LOCAL_REPOSITORIES, useValue: repositories },
        { provide: GALAXY_KNOWLEDGE_CATALOG_DATA_SOURCE, useValue: dataSource },
      ],
    });

    const facade = TestBed.inject(GalaxyKnowledgeCatalogFacade);
    await facade.load('0', 'extremes', null, {
      subtype: 'magnetar',
      page: '1',
      pageSize: '25',
      sortKey: 'state',
      direction: 'desc',
    });

    expect(facade.state().kind).toBe('content');
    const model = facade.model();
    expect(model?.query).toEqual({
      category: 'extremes',
      subtype: 'MAGNETAR',
      page: 1,
      pageSize: 25,
      sortKey: 'state',
      direction: 'desc',
    });
    expect(query).toHaveBeenCalledWith(expect.objectContaining({
      generationKey,
      galaxyIndex: 0n,
      galaxyState: DiscoveryState.CONFIRMED,
    }));
    expect(getKnownDiscoveries).not.toHaveBeenCalled();
  });

  it('keeps an unknown galaxy outside the catalogue before asking a category adapter for data', async () => {
    const query = vi.fn();
    const repositories = {
      universeRepository: {
        async getAll() { return [generationKey]; },
      },
      discoveryRepository: {
        async getState() { return DiscoveryState.UNKNOWN; },
      },
    } as unknown as GenesisLocalRepositories;
    const dataSource: GalaxyKnowledgeCatalogDataSource = {
      describe() {
        return defineGalaxyKnowledgeCatalogDescriptor({
          category: 'systems',
          title: 'Sistemas',
          description: 'test',
          fields: Object.freeze([
            galaxyKnowledgeCatalogIdentityField('designation', 'Nombre', 'OBJETO'),
          ]),
          defaultSortKey: 'designation',
        });
      },
      query,
    };

    TestBed.configureTestingModule({
      providers: [
        GalaxyKnowledgeCatalogFacade,
        { provide: GENESIS_LOCAL_REPOSITORIES, useValue: repositories },
        { provide: GALAXY_KNOWLEDGE_CATALOG_DATA_SOURCE, useValue: dataSource },
      ],
    });

    const facade = TestBed.inject(GalaxyKnowledgeCatalogFacade);
    await facade.load('9', 'systems', null, {
      subtype: null,
      page: null,
      pageSize: null,
      sortKey: null,
      direction: null,
    });

    expect(facade.state()).toEqual({ kind: 'not-found' });
    expect(query).not.toHaveBeenCalled();
  });
});
