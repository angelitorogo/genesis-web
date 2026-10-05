import { TestBed } from '@angular/core/testing';

import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { KnownDiscovery } from '../../domain/discovery/known-discovery';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { type SystemSeed } from '../../domain/seed/hierarchical-seeds';
import { StellarSystemMultiplicity } from '../../domain/stellar/stellar-system-multiplicity';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';
import { multihostPhysicalSourceKey } from '../../simulation/stellar/stellar-multihost-physical-source-key';
import { StellarDesignationGenerator } from '../../simulation/stellar/stellar-designation-generator';
import { StellarSystemMultiplicitySelector } from '../../simulation/stellar/stellar-system-multiplicity-selector';
import {
  GENESIS_LOCAL_REPOSITORIES,
  type GenesisLocalRepositories,
} from '../runtime/genesis-local-repositories';
import { GalaxyKnowledgeSystemsCatalogDataSource } from './galaxy-knowledge-systems-catalog.data-source';

const generationKey = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),
  GeneratorVersion.V2,
);

function findSystem(
  multiplicity: StellarSystemMultiplicity,
  start = 0n,
): SystemLocator {
  const physicalKey = multihostPhysicalSourceKey(generationKey);
  for (let index = start; index < start + 4096n; index += 1n) {
    const locator = new SystemLocator(0n, 0n, index);
    const seed = ProceduralTargetResolver.resolveTargetSeed(
      physicalKey,
      locator,
    ) as SystemSeed;
    if (StellarSystemMultiplicitySelector.select(physicalKey, seed) === multiplicity) {
      return locator;
    }
  }
  throw new Error(`Could not find ${multiplicity.name} system fixture.`);
}

describe('26.1c.2 GalaxyKnowledgeSystemsCatalogDataSource', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('describes SINGLE/BINARY/TRIPLE catalogues with system-specific columns and sort options', () => {
    TestBed.configureTestingModule({
      providers: [
        GalaxyKnowledgeSystemsCatalogDataSource,
        {
          provide: GENESIS_LOCAL_REPOSITORIES,
          useValue: { discoveryRepository: {} } as GenesisLocalRepositories,
        },
      ],
    });

    const source = TestBed.inject(GalaxyKnowledgeSystemsCatalogDataSource);
    const descriptor = source.describe('TRIPLE');
    const unclassifiedDescriptor = source.describe('UNCLASSIFIED');

    expect(descriptor.title).toBe('Sistemas triples');
    expect(descriptor.filterLabel).toBe('Triple');
    expect(unclassifiedDescriptor.title).toBe('Sistemas sin clasificar');
    expect(unclassifiedDescriptor.filterLabel).toBe('Sin clasificar');
    expect(descriptor.columns.map(column => column.key)).toEqual([
      'state',
      'multiplicity',
      'components',
      'sector',
    ]);
    expect(descriptor.sortOptions.map(option => option.key)).toContain('components');
    expect(() => source.describe('QUADRUPLE')).toThrowError(RangeError);
  });

  it('filters by known multiplicity without leaking DETECTED systems and builds navigable rows', async () => {
    const single = findSystem(StellarSystemMultiplicity.SINGLE);
    const binary = findSystem(StellarSystemMultiplicity.BINARY);
    const triple = findSystem(StellarSystemMultiplicity.TRIPLE);
    const detectedTriple = findSystem(StellarSystemMultiplicity.TRIPLE, triple.galacticObjectIndex + 1n);

    const discoveries = Object.freeze([
      new KnownDiscovery(generationKey, single, DiscoveryState.DISCOVERED),
      new KnownDiscovery(generationKey, binary, DiscoveryState.CATALOGUED),
      new KnownDiscovery(generationKey, triple, DiscoveryState.CONFIRMED),
      new KnownDiscovery(generationKey, detectedTriple, DiscoveryState.DETECTED),
    ]);
    const getKnownDiscoveries = vi.fn(async () => {
      throw new Error('Production path must not scan the whole universe catalogue.');
    });
    const getKnownDiscoveriesInGalaxy = vi.fn(async () => discoveries);

    TestBed.configureTestingModule({
      providers: [
        GalaxyKnowledgeSystemsCatalogDataSource,
        {
          provide: GENESIS_LOCAL_REPOSITORIES,
          useValue: {
            discoveryRepository: {
              getKnownDiscoveries,
              getKnownDiscoveriesInGalaxy,
            },
          } as unknown as GenesisLocalRepositories,
        },
      ],
    });

    const source = TestBed.inject(GalaxyKnowledgeSystemsCatalogDataSource);
    const result = await source.query({
      generationKey,
      galaxyIndex: 0n,
      galaxyState: DiscoveryState.CONFIRMED,
      query: {
        category: 'systems',
        subtype: 'TRIPLE',
        page: 1,
        pageSize: 25,
        sortKey: 'designation',
        direction: 'asc',
      },
    });

    expect(result.kind).toBe('page');
    if (result.kind !== 'page') throw new Error('Expected systems page.');
    expect(result.page.totalItems).toBe(1);
    const row = result.page.items[0]!;
    expect(row.cells['multiplicity']).toBe('Triple');
    expect(row.cells['components']).toBe('3');
    expect(row.actions[0]?.route).toEqual([
      '/archive/system',
      '0',
      '0',
      triple.galacticObjectIndex.toString(10),
    ]);
    expect(row.actions[1]?.route).toEqual([
      '/system',
      '0',
      '0',
      triple.galacticObjectIndex.toString(10),
    ]);
    const unclassifiedResult = await source.query({
      generationKey,
      galaxyIndex: 0n,
      galaxyState: DiscoveryState.CONFIRMED,
      query: {
        category: 'systems',
        subtype: 'UNCLASSIFIED',
        page: 1,
        pageSize: 25,
        sortKey: 'designation',
        direction: 'asc',
      },
    });

    expect(unclassifiedResult.kind).toBe('page');
    if (unclassifiedResult.kind !== 'page') throw new Error('Expected unclassified systems page.');
    expect(unclassifiedResult.page.totalItems).toBe(1);
    expect(unclassifiedResult.page.items[0]?.title).toBe('Sistema detectado');
    expect(unclassifiedResult.page.items[0]?.cells['multiplicity']).toBe('Sin clasificar');

    expect(getKnownDiscoveriesInGalaxy).toHaveBeenCalledWith(
      generationKey,
      0n,
      4,
    );
    expect(getKnownDiscoveries).not.toHaveBeenCalled();
  });

  it('paginates after stable locator sorting and keeps DETECTED systems unclassified in the unfiltered catalogue', async () => {
    const discoveries = Object.freeze(
      Array.from({ length: 30 }, (_, index) =>
        new KnownDiscovery(
          generationKey,
          new SystemLocator(0n, BigInt(index % 3), BigInt(index)),
          index === 0 ? DiscoveryState.DETECTED : DiscoveryState.DISCOVERED,
        ),
      ),
    );

    TestBed.configureTestingModule({
      providers: [
        GalaxyKnowledgeSystemsCatalogDataSource,
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

    const source = TestBed.inject(GalaxyKnowledgeSystemsCatalogDataSource);
    const result = await source.query({
      generationKey,
      galaxyIndex: 0n,
      galaxyState: DiscoveryState.CONFIRMED,
      query: {
        category: 'systems',
        subtype: null,
        page: 2,
        pageSize: 25,
        sortKey: 'locator',
        direction: 'asc',
      },
    });

    expect(result.kind).toBe('page');
    if (result.kind !== 'page') throw new Error('Expected systems page.');
    expect(result.page.totalItems).toBe(30);
    expect(result.page.totalPages).toBe(2);
    expect(result.page.page).toBe(2);
    expect(result.page.items).toHaveLength(5);

    const unclassified = await source.query({
      generationKey,
      galaxyIndex: 0n,
      galaxyState: DiscoveryState.CONFIRMED,
      query: {
        category: 'systems',
        subtype: null,
        page: 1,
        pageSize: 25,
        sortKey: 'state',
        direction: 'asc',
      },
    });
    if (unclassified.kind !== 'page') throw new Error('Expected systems page.');
    expect(unclassified.page.items[0]?.title).toBe('Sistema detectado');
    expect(unclassified.page.items[0]?.cells['multiplicity']).toBe('Sin clasificar');
    expect(unclassified.page.items[0]?.cells['components']).toBeUndefined();
  });

  it('26.1c.7 reuses derived system records across sort/page changes and invalidates them when knowledge changes', async () => {
    const firstLocator = new SystemLocator(0n, 7n, 10n);
    const secondLocator = new SystemLocator(0n, 8n, 11n);
    let discoveries: readonly KnownDiscovery[] = Object.freeze([
      new KnownDiscovery(generationKey, firstLocator, DiscoveryState.DISCOVERED),
      new KnownDiscovery(generationKey, secondLocator, DiscoveryState.DISCOVERED),
    ]);

    TestBed.configureTestingModule({
      providers: [
        GalaxyKnowledgeSystemsCatalogDataSource,
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

    const designationSpy = vi.spyOn(StellarDesignationGenerator, 'generate');
    const multiplicitySpy = vi.spyOn(StellarSystemMultiplicitySelector, 'select');
    const source = TestBed.inject(GalaxyKnowledgeSystemsCatalogDataSource);

    const baseRequest = {
      generationKey,
      galaxyIndex: 0n,
      galaxyState: DiscoveryState.CONFIRMED,
    } as const;

    await source.query({
      ...baseRequest,
      query: {
        category: 'systems', subtype: null, page: 1, pageSize: 25,
        sortKey: 'designation', direction: 'asc',
      },
    });
    await source.query({
      ...baseRequest,
      query: {
        category: 'systems', subtype: null, page: 1, pageSize: 25,
        sortKey: 'sector', direction: 'desc',
      },
    });

    expect(designationSpy).toHaveBeenCalledTimes(2);
    expect(multiplicitySpy).toHaveBeenCalledTimes(2);

    discoveries = Object.freeze([
      new KnownDiscovery(generationKey, firstLocator, DiscoveryState.CATALOGUED),
      new KnownDiscovery(generationKey, secondLocator, DiscoveryState.DISCOVERED),
    ]);

    await source.query({
      ...baseRequest,
      query: {
        category: 'systems', subtype: null, page: 1, pageSize: 25,
        sortKey: 'state', direction: 'asc',
      },
    });

    expect(designationSpy).toHaveBeenCalledTimes(4);
    expect(multiplicitySpy).toHaveBeenCalledTimes(4);
  });

});
