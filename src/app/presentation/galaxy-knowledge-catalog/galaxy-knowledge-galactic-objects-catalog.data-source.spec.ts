import { TestBed } from '@angular/core/testing';

import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { KnownDiscovery } from '../../domain/discovery/known-discovery';
import { ExplorationResultKind } from '../../domain/exploration/exploration-sector-result';
import { ExtremeType } from '../../domain/galactic-object/extreme-object-type';
import { GalacticObjectScientificSubject } from '../../domain/galactic-object/galactic-object-scientific-subject';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { GalacticObjectLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { ExplorationSectorResultEngine } from '../../simulation/exploration/exploration-sector-result-engine';
import { ExtremeObjectTypeResolver } from '../../simulation/galactic-object/extreme-object-type-resolver';
import { GalacticObjectScientificSubjectResolver } from '../../simulation/galactic-object/galactic-object-scientific-subject-resolver';
import {
  GENESIS_LOCAL_REPOSITORIES,
  type GenesisLocalRepositories,
} from '../runtime/genesis-local-repositories';
import { GalaxyKnowledgeGalacticObjectsCatalogDataSource } from './galaxy-knowledge-galactic-objects-catalog.data-source';

const generationKey = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),
  GeneratorVersion.V2,
);

function locator(index: bigint): GalacticObjectLocator {
  return new GalacticObjectLocator(0n, 123n, index);
}

function request(
  category: 'clusters' | 'nebulae' | 'extremes',
  subtype: string | null,
  sortKey = 'designation',
) {
  return {
    generationKey,
    galaxyIndex: 0n,
    galaxyState: DiscoveryState.CONFIRMED,
    query: {
      category,
      subtype,
      page: 1,
      pageSize: 25 as const,
      sortKey,
      direction: 'asc' as const,
    },
  };
}

describe('26.1c.4 GalaxyKnowledgeGalacticObjectsCatalogDataSource', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('describes cluster, nebula and extreme catalogues with family-specific columns and sorting', () => {
    TestBed.configureTestingModule({
      providers: [
        GalaxyKnowledgeGalacticObjectsCatalogDataSource,
        {
          provide: GENESIS_LOCAL_REPOSITORIES,
          useValue: { discoveryRepository: {} } as GenesisLocalRepositories,
        },
      ],
    });

    const source = TestBed.inject(GalaxyKnowledgeGalacticObjectsCatalogDataSource);

    const clusters = source.describe('clusters', 'OPEN');
    expect(clusters.title).toBe('Cúmulos abiertos');
    expect(clusters.columns.map(column => column.key)).toEqual([
      'state', 'type', 'stars', 'mass', 'age', 'radius', 'sector',
    ]);
    expect(clusters.sortOptions.map(option => option.key)).toContain('stars');

    const nebulae = source.describe('nebulae', 'HII_REGION');
    expect(nebulae.title).toBe('Regiones H II');
    expect(nebulae.sortOptions.map(option => option.key)).toContain('temperature');

    const extremes = source.describe('extremes', 'MAGNETAR');
    expect(extremes.title).toBe('Magnetares');
    expect(extremes.columns.map(column => column.key)).toEqual([
      'state', 'type', 'family', 'semantic', 'sector',
    ]);
    expect(extremes.sortOptions.map(option => option.key)).toContain('family');

    expect(() => source.describe('clusters', 'INVALID')).toThrowError(RangeError);
    expect(() => source.describe('nebulae', 'INVALID')).toThrowError(RangeError);
    expect(() => source.describe('extremes', 'INVALID')).toThrowError(RangeError);
  });

  it('filters cluster and nebula subtypes only when persisted knowledge is allowed to disclose them', async () => {
    const discoveries = Object.freeze([
      new KnownDiscovery(generationKey, locator(0n), DiscoveryState.DISCOVERED),
      new KnownDiscovery(generationKey, locator(1n), DiscoveryState.DISCOVERED),
      new KnownDiscovery(generationKey, locator(2n), DiscoveryState.DISCOVERED),
      new KnownDiscovery(generationKey, locator(3n), DiscoveryState.DISCOVERED),
    ]);

    vi.spyOn(ExplorationSectorResultEngine, 'resolveGalacticObjectKind')
      .mockImplementation((_key, target) => {
        if (target.galacticObjectIndex <= 1n) return ExplorationResultKind.STAR_CLUSTER;
        return ExplorationResultKind.NEBULA;
      });

    vi.spyOn(GalacticObjectScientificSubjectResolver, 'resolve')
      .mockImplementation((_key, target) => {
        switch (target.galacticObjectIndex) {
          case 0n: return GalacticObjectScientificSubject.OPEN_CLUSTER;
          case 1n: return GalacticObjectScientificSubject.GLOBULAR_CLUSTER;
          case 2n: return GalacticObjectScientificSubject.HII_REGION;
          case 3n: return GalacticObjectScientificSubject.NEBULA;
          default: return null;
        }
      });

    const getKnownDiscoveries = vi.fn(async () => {
      throw new Error('Must use the galaxy-scoped fast path.');
    });
    const getKnownDiscoveriesInGalaxy = vi.fn(async () => discoveries);

    TestBed.configureTestingModule({
      providers: [
        GalaxyKnowledgeGalacticObjectsCatalogDataSource,
        {
          provide: GENESIS_LOCAL_REPOSITORIES,
          useValue: {
            discoveryRepository: { getKnownDiscoveries, getKnownDiscoveriesInGalaxy },
          } as unknown as GenesisLocalRepositories,
        },
      ],
    });

    const source = TestBed.inject(GalaxyKnowledgeGalacticObjectsCatalogDataSource);

    const globular = await source.query(request('clusters', 'GLOBULAR'));
    expect(globular.kind).toBe('page');
    if (globular.kind !== 'page') throw new Error('Expected cluster page.');
    expect(globular.page.totalItems).toBe(1);
    expect(globular.page.items[0]?.cells['type']).toBe('Cúmulo globular');

    const hii = await source.query(request('nebulae', 'HII_REGION'));
    expect(hii.kind).toBe('page');
    if (hii.kind !== 'page') throw new Error('Expected nebula page.');
    expect(hii.page.totalItems).toBe(1);
    expect(hii.page.items[0]?.cells['type']).toBe('Región H II');

    const genericNebula = await source.query(request('nebulae', 'UNCLASSIFIED'));
    expect(genericNebula.kind).toBe('page');
    if (genericNebula.kind !== 'page') throw new Error('Expected nebula page.');
    expect(genericNebula.page.totalItems).toBe(1);
    expect(genericNebula.page.items[0]?.title).toBe('Nebulosa sin clasificar');

    expect(getKnownDiscoveriesInGalaxy).toHaveBeenCalledWith(generationKey, 0n, 3);
    expect(getKnownDiscoveries).not.toHaveBeenCalled();
  });

  it('lists real V2 magnetars only after CATALOGUED and navigates to their scientific fiche', async () => {
    const magnetar = locator(4n);
    const pulsar = locator(5n);
    const hidden = locator(6n);
    const discoveries = Object.freeze([
      new KnownDiscovery(generationKey, magnetar, DiscoveryState.CATALOGUED),
      new KnownDiscovery(generationKey, pulsar, DiscoveryState.CONFIRMED),
      new KnownDiscovery(generationKey, hidden, DiscoveryState.DISCOVERED),
    ]);

    vi.spyOn(ExplorationSectorResultEngine, 'resolveGalacticObjectKind')
      .mockReturnValue(ExplorationResultKind.EXTREME_OBJECT);
    vi.spyOn(GalacticObjectScientificSubjectResolver, 'resolve')
      .mockReturnValue(GalacticObjectScientificSubject.DISTRIBUTED_EXTREME_OBJECT);
    vi.spyOn(ExtremeObjectTypeResolver, 'resolve')
      .mockImplementation((_key, target) =>
        target.galacticObjectIndex === 4n ? ExtremeType.MAGNETAR : ExtremeType.PULSAR,
      );

    TestBed.configureTestingModule({
      providers: [
        GalaxyKnowledgeGalacticObjectsCatalogDataSource,
        {
          provide: GENESIS_LOCAL_REPOSITORIES,
          useValue: {
            discoveryRepository: {
              async getKnownDiscoveriesInGalaxy() { return discoveries; },
            },
          } as unknown as GenesisLocalRepositories,
        },
      ],
    });

    const source = TestBed.inject(GalaxyKnowledgeGalacticObjectsCatalogDataSource);
    const result = await source.query(request('extremes', 'MAGNETAR'));

    expect(result.kind).toBe('page');
    if (result.kind !== 'page') throw new Error('Expected extreme page.');
    expect(result.page.totalItems).toBe(1);
    const row = result.page.items[0]!;
    expect(row.title).toBe('Magnetar');
    expect(row.cells['type']).toBe('MAGNETAR');
    expect(row.cells['family']).toBe('Estrella de neutrones');
    expect(row.actions[0]?.route).toEqual([
      '/archive/galactic-object', '0', '123', '4',
    ]);

    const unclassified = await source.query(request('extremes', 'UNCLASSIFIED', 'state'));
    expect(unclassified.kind).toBe('page');
    if (unclassified.kind !== 'page') throw new Error('Expected extreme page.');
    expect(unclassified.page.totalItems).toBe(1);
    expect(unclassified.page.items[0]?.title).toBe('Fuente extrema en caracterización');
    expect(unclassified.page.items[0]?.cells['type']).toBe('Sin clasificar');
  });

  it('26.1c.7 reuses derived galactic-object records while the knowledge revision is unchanged', async () => {
    const first = locator(20n);
    const second = locator(21n);
    let discoveries: readonly KnownDiscovery[] = Object.freeze([
      new KnownDiscovery(generationKey, first, DiscoveryState.DISCOVERED),
      new KnownDiscovery(generationKey, second, DiscoveryState.DISCOVERED),
    ]);

    const kindSpy = vi.spyOn(ExplorationSectorResultEngine, 'resolveGalacticObjectKind')
      .mockReturnValue(ExplorationResultKind.STAR_CLUSTER);
    const subjectSpy = vi.spyOn(GalacticObjectScientificSubjectResolver, 'resolve')
      .mockImplementation((_key, target) =>
        target.galacticObjectIndex === 20n
          ? GalacticObjectScientificSubject.OPEN_CLUSTER
          : GalacticObjectScientificSubject.GLOBULAR_CLUSTER,
      );

    TestBed.configureTestingModule({
      providers: [
        GalaxyKnowledgeGalacticObjectsCatalogDataSource,
        {
          provide: GENESIS_LOCAL_REPOSITORIES,
          useValue: {
            discoveryRepository: {
              async getKnownDiscoveriesInGalaxy() { return discoveries; },
            },
          } as unknown as GenesisLocalRepositories,
        },
      ],
    });

    const source = TestBed.inject(GalaxyKnowledgeGalacticObjectsCatalogDataSource);
    await source.query(request('clusters', null, 'designation'));
    await source.query(request('clusters', 'OPEN', 'sector'));

    expect(kindSpy).toHaveBeenCalledTimes(2);
    expect(subjectSpy).toHaveBeenCalledTimes(2);

    discoveries = Object.freeze([
      new KnownDiscovery(generationKey, first, DiscoveryState.VISITED),
      new KnownDiscovery(generationKey, second, DiscoveryState.DISCOVERED),
    ]);

    await source.query(request('clusters', null, 'state'));

    expect(kindSpy).toHaveBeenCalledTimes(4);
    expect(subjectSpy).toHaveBeenCalledTimes(4);
  });

});
