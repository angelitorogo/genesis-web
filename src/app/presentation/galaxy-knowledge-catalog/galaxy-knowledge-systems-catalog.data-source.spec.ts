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
import { StellarSupernovaScientificIntegration } from '../runtime/stellar-supernova-scientific-integration';
import { StellarSupernovaScientificPresentationAssembler } from '../runtime/stellar-supernova-scientific-presentation';
import { StellarNovaScientificIntegration } from '../runtime/stellar-nova-scientific-integration';
import { StellarNovaScientificPresentationAssembler } from '../runtime/stellar-nova-scientific-presentation';
import { StellarKilonovaScientificIntegration } from '../runtime/stellar-kilonova-scientific-integration';
import { StellarKilonovaScientificPresentationAssembler } from '../runtime/stellar-kilonova-scientific-presentation';
import { StellarCompactMergerScientificIntegration } from '../runtime/stellar-compact-merger-scientific-integration';
import { StellarCompactMergerScientificPresentationAssembler } from '../runtime/stellar-compact-merger-scientific-presentation';
import { StellarGravitationalWaveScientificIntegration } from '../runtime/stellar-gravitational-wave-scientific-integration';
import { StellarGravitationalWaveScientificPresentationAssembler } from '../runtime/stellar-gravitational-wave-scientific-presentation';
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
      'supernova',
      'nova',
      'kilonova',
      'compactMerger',
      'gravitationalWave',
      'sector',
    ]);
    expect(descriptor.sortOptions.map(option => option.key)).toContain('components');
    expect(descriptor.sortOptions.map(option => option.key)).toContain('supernova');
    expect(descriptor.sortOptions.map(option => option.key)).toContain('nova');
    expect(descriptor.sortOptions.map(option => option.key)).toContain('kilonova');
    expect(descriptor.sortOptions.map(option => option.key)).toContain('compactMerger');
    expect(descriptor.sortOptions.map(option => option.key)).toContain('gravitationalWave');
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


  it('materializes 29.1E supernova science only for the visible catalogue page', async () => {
    const discoveries = Object.freeze(
      Array.from(
        { length: 26 },
        (_, index) =>
          new KnownDiscovery(
            generationKey,
            new SystemLocator(0n, 0n, BigInt(index)),
            DiscoveryState.CATALOGUED,
          ),
      ),
    );
    const synchronize = vi
      .spyOn(StellarSupernovaScientificIntegration, 'synchronize')
      .mockResolvedValue(Object.freeze({
        lineages: Object.freeze([]),
        events: Object.freeze([]),
        consequences: Object.freeze([]),
      }));

    TestBed.configureTestingModule({
      providers: [
        GalaxyKnowledgeSystemsCatalogDataSource,
        {
          provide: GENESIS_LOCAL_REPOSITORIES,
          useValue: {
            discoveryRepository: {
              async getKnownDiscoveriesInGalaxy() { return discoveries; },
            },
            supernovaCanonicalEventRepository: {},
          } as unknown as GenesisLocalRepositories,
        },
      ],
    });

    const source = TestBed.inject(GalaxyKnowledgeSystemsCatalogDataSource);
    const firstPage = await source.query({
      generationKey,
      galaxyIndex: 0n,
      galaxyState: DiscoveryState.CONFIRMED,
      query: {
        category: 'systems',
        subtype: null,
        page: 1,
        pageSize: 25,
        sortKey: 'locator',
        direction: 'asc',
      },
    });

    expect(firstPage.kind).toBe('page');
    if (firstPage.kind !== 'page') throw new Error('Expected systems page.');
    expect(firstPage.page.items).toHaveLength(25);
    expect(firstPage.page.items[0]?.cells['supernova']).toBe('Sin canal SN');
    expect(synchronize).toHaveBeenCalledTimes(25);

    await source.query({
      generationKey,
      galaxyIndex: 0n,
      galaxyState: DiscoveryState.CONFIRMED,
      query: {
        category: 'systems',
        subtype: null,
        page: 1,
        pageSize: 25,
        sortKey: 'locator',
        direction: 'asc',
      },
    });
    expect(synchronize).toHaveBeenCalledTimes(25);

    const secondPage = await source.query({
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

    expect(secondPage.kind).toBe('page');
    if (secondPage.kind !== 'page') throw new Error('Expected systems page.');
    expect(secondPage.page.items).toHaveLength(1);
    expect(synchronize).toHaveBeenCalledTimes(26);

    synchronize.mockRestore();
  });

  it('sorts by 29.1E supernova/lineage only when that sort is explicitly selected', async () => {
    const discoveries = Object.freeze([
      new KnownDiscovery(generationKey, new SystemLocator(0n, 0n, 10n), DiscoveryState.CATALOGUED),
      new KnownDiscovery(generationKey, new SystemLocator(0n, 0n, 11n), DiscoveryState.CATALOGUED),
      new KnownDiscovery(generationKey, new SystemLocator(0n, 0n, 12n), DiscoveryState.CATALOGUED),
    ]);

    const synchronize = vi
      .spyOn(StellarSupernovaScientificIntegration, 'synchronize')
      .mockImplementation(async (_repository, _generationKey, locator) =>
        Object.freeze({
          marker: Number(locator.galacticObjectIndex),
          lineages: Object.freeze([]),
          events: Object.freeze([]),
          consequences: Object.freeze([]),
        }) as never,
      );
    const presentation = vi
      .spyOn(StellarSupernovaScientificPresentationAssembler, 'build')
      .mockImplementation((snapshot) => {
        const marker = (snapshot as unknown as { readonly marker: number }).marker;
        const labels: Readonly<Record<number, string>> = Object.freeze({
          10: 'Sin canal SN',
          11: 'Ic · futura',
          12: 'Ia · retardo binario',
        });
        return Object.freeze({
          summary: '',
          catalogLabel: labels[marker] ?? 'Sin canal SN',
          canonicalEventCount: 0,
          directCollapseCount: 0,
          entries: Object.freeze([]),
        });
      });

    TestBed.configureTestingModule({
      providers: [
        GalaxyKnowledgeSystemsCatalogDataSource,
        {
          provide: GENESIS_LOCAL_REPOSITORIES,
          useValue: {
            discoveryRepository: {
              async getKnownDiscoveriesInGalaxy() { return discoveries; },
            },
            supernovaCanonicalEventRepository: {},
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
        page: 1,
        pageSize: 25,
        sortKey: 'supernova',
        direction: 'asc',
      },
    });

    expect(result.kind).toBe('page');
    if (result.kind !== 'page') throw new Error('Expected systems page.');
    expect(result.page.items.map(row => row.cells['supernova'])).toEqual([
      'Ia · retardo binario',
      'Ic · futura',
      'Sin canal SN',
    ]);
    expect(synchronize).toHaveBeenCalledTimes(3);
    expect(presentation).toHaveBeenCalledTimes(3);
  });

  it('materializes 29.2 nova science only when the nova repository is available', async () => {
    const discoveries = Object.freeze([
      new KnownDiscovery(generationKey, new SystemLocator(0n, 0n, 21n), DiscoveryState.CATALOGUED),
      new KnownDiscovery(generationKey, new SystemLocator(0n, 0n, 22n), DiscoveryState.CATALOGUED),
    ]);
    const synchronize = vi.spyOn(StellarNovaScientificIntegration, 'synchronize')
      .mockImplementation(async (_repository, _generationKey, locator) => Object.freeze({
        marker: Number(locator.galacticObjectIndex),
        lineages: Object.freeze([]), events: Object.freeze([]), consequences: Object.freeze([]),
      }) as never);
    const presentation = vi.spyOn(StellarNovaScientificPresentationAssembler, 'build')
      .mockImplementation(snapshot => Object.freeze({
        summary: '',
        catalogLabel: (snapshot as unknown as { readonly marker: number }).marker === 21
          ? 'Nova Recurrente · 1 WD'
          : 'Sin canal de nova',
        canonicalEventCount: 0,
        entries: Object.freeze([]),
      }));

    TestBed.configureTestingModule({
      providers: [
        GalaxyKnowledgeSystemsCatalogDataSource,
        { provide: GENESIS_LOCAL_REPOSITORIES, useValue: {
          discoveryRepository: { async getKnownDiscoveriesInGalaxy() { return discoveries; } },
          novaCanonicalEventRepository: {},
        } as unknown as GenesisLocalRepositories },
      ],
    });

    const source = TestBed.inject(GalaxyKnowledgeSystemsCatalogDataSource);
    const result = await source.query({
      generationKey, galaxyIndex: 0n, galaxyState: DiscoveryState.CONFIRMED,
      query: { category: 'systems', subtype: null, page: 1, pageSize: 25, sortKey: 'nova', direction: 'asc' },
    });
    expect(result.kind).toBe('page');
    if (result.kind !== 'page') throw new Error('Expected systems page.');
    expect(result.page.items.map(row => row.cells['nova'])).toEqual([
      'Nova Recurrente · 1 WD',
      'Sin canal de nova',
    ]);
    expect(synchronize).toHaveBeenCalledTimes(2);
    expect(presentation).toHaveBeenCalledTimes(2);
  });


  it('materializes and sorts 29.3 kilonova science only through the dedicated repository', async () => {
    const discoveries = Object.freeze([
      new KnownDiscovery(generationKey, new SystemLocator(0n, 0n, 31n), DiscoveryState.CATALOGUED),
      new KnownDiscovery(generationKey, new SystemLocator(0n, 0n, 32n), DiscoveryState.CATALOGUED),
      new KnownDiscovery(generationKey, new SystemLocator(0n, 0n, 33n), DiscoveryState.CATALOGUED),
    ]);
    const synchronize = vi.spyOn(StellarKilonovaScientificIntegration, 'synchronize')
      .mockImplementation(async (_repository, _generationKey, locator) => Object.freeze({
        marker: Number(locator.galacticObjectIndex),
        lineage: null, events: Object.freeze([]), consequences: Object.freeze([]),
      }) as never);
    const presentation = vi.spyOn(StellarKilonovaScientificPresentationAssembler, 'build')
      .mockImplementation(snapshot => {
        const marker = (snapshot as unknown as { readonly marker: number }).marker;
        const labels: Readonly<Record<number, string>> = Object.freeze({
          31: 'Sin canal de kilonova',
          32: 'Kilonova NS–NS · 12,5 Ma',
          33: 'Candidato NS–BH · spin no resuelto',
        });
        return Object.freeze({
          summary: '', catalogLabel: labels[marker] ?? 'Sin canal de kilonova',
          canonicalEventCount: 0, entries: Object.freeze([]),
        });
      });

    TestBed.configureTestingModule({
      providers: [
        GalaxyKnowledgeSystemsCatalogDataSource,
        { provide: GENESIS_LOCAL_REPOSITORIES, useValue: {
          discoveryRepository: { async getKnownDiscoveriesInGalaxy() { return discoveries; } },
          kilonovaCanonicalEventRepository: {},
        } as unknown as GenesisLocalRepositories },
      ],
    });

    const source = TestBed.inject(GalaxyKnowledgeSystemsCatalogDataSource);
    const result = await source.query({
      generationKey, galaxyIndex: 0n, galaxyState: DiscoveryState.CONFIRMED,
      query: { category: 'systems', subtype: null, page: 1, pageSize: 25, sortKey: 'kilonova', direction: 'asc' },
    });
    expect(result.kind).toBe('page');
    if (result.kind !== 'page') throw new Error('Expected systems page.');
    expect(result.page.items.map(row => row.cells['kilonova'])).toEqual([
      'Candidato NS–BH · spin no resuelto',
      'Kilonova NS–NS · 12,5 Ma',
      'Sin canal de kilonova',
    ]);
    expect(synchronize).toHaveBeenCalledTimes(3);
    expect(presentation).toHaveBeenCalledTimes(3);
  });



  it('materializes and sorts 29.4 compact-merger science independently from the kilonova channel', async () => {
    const discoveries = Object.freeze([
      new KnownDiscovery(generationKey, new SystemLocator(0n, 0n, 41n), DiscoveryState.CATALOGUED),
      new KnownDiscovery(generationKey, new SystemLocator(0n, 0n, 42n), DiscoveryState.CATALOGUED),
      new KnownDiscovery(generationKey, new SystemLocator(0n, 0n, 43n), DiscoveryState.CATALOGUED),
    ]);
    const synchronize = vi.spyOn(StellarCompactMergerScientificIntegration, 'synchronize')
      .mockImplementation(async (_repository, _generationKey, locator) => Object.freeze({
        marker: Number(locator.galacticObjectIndex),
        lineage: null, events: Object.freeze([]), consequences: Object.freeze([]),
      }) as never);
    const presentation = vi.spyOn(StellarCompactMergerScientificPresentationAssembler, 'build')
      .mockImplementation(snapshot => {
        const marker = (snapshot as unknown as { readonly marker: number }).marker;
        const labels: Readonly<Record<number, string>> = Object.freeze({
          41: 'Sin fusión compacta',
          42: 'Fusión NS–BH · 42 Ma',
          43: 'Fusión BH–BH · 680 Ma',
        });
        return Object.freeze({
          summary: '', catalogLabel: labels[marker] ?? 'Sin fusión compacta',
          canonicalEventCount: 0, entries: Object.freeze([]),
        });
      });

    TestBed.configureTestingModule({
      providers: [
        GalaxyKnowledgeSystemsCatalogDataSource,
        { provide: GENESIS_LOCAL_REPOSITORIES, useValue: {
          discoveryRepository: { async getKnownDiscoveriesInGalaxy() { return discoveries; } },
          compactMergerCanonicalEventRepository: {},
        } as unknown as GenesisLocalRepositories },
      ],
    });

    const source = TestBed.inject(GalaxyKnowledgeSystemsCatalogDataSource);
    const result = await source.query({
      generationKey, galaxyIndex: 0n, galaxyState: DiscoveryState.CONFIRMED,
      query: { category: 'systems', subtype: null, page: 1, pageSize: 25, sortKey: 'compactMerger', direction: 'asc' },
    });
    expect(result.kind).toBe('page');
    if (result.kind !== 'page') throw new Error('Expected systems page.');
    expect(result.page.items.map(row => row.cells['compactMerger'])).toEqual([
      'Fusión BH–BH · 680 Ma',
      'Fusión NS–BH · 42 Ma',
      'Sin fusión compacta',
    ]);
    expect(synchronize).toHaveBeenCalledTimes(3);
    expect(presentation).toHaveBeenCalledTimes(3);
  });


  it('materializes and sorts 29.5 gravitational-wave science from the shared 29.4 canonical merger snapshot', async () => {
    const discoveries = Object.freeze([
      new KnownDiscovery(generationKey, new SystemLocator(0n, 0n, 51n), DiscoveryState.CATALOGUED),
      new KnownDiscovery(generationKey, new SystemLocator(0n, 0n, 52n), DiscoveryState.CATALOGUED),
      new KnownDiscovery(generationKey, new SystemLocator(0n, 0n, 53n), DiscoveryState.CATALOGUED),
    ]);
    const synchronize = vi.spyOn(StellarCompactMergerScientificIntegration, 'synchronize')
      .mockImplementation(async (_repository, _generationKey, locator) => Object.freeze({
        marker: Number(locator.galacticObjectIndex),
        lineage: null, events: Object.freeze([]), consequences: Object.freeze([]),
      }) as never);
    vi.spyOn(StellarGravitationalWaveScientificIntegration, 'derive')
      .mockImplementation(snapshot => Object.freeze({ events: Object.freeze([]), marker: (snapshot as unknown as { marker: number }).marker }) as never);
    const presentation = vi.spyOn(StellarGravitationalWaveScientificPresentationAssembler, 'build')
      .mockImplementation(snapshot => {
        const marker = (snapshot as unknown as { readonly marker: number }).marker;
        const labels: Readonly<Record<number, string>> = Object.freeze({
          51: 'Sin señal GW compacta',
          52: 'GW NS–NS · 185 µHz → ISCO 1,659 kHz',
          53: 'GW BH–BH · 294 µHz → ISCO 74,526 Hz',
        });
        return Object.freeze({
          summary: '', catalogLabel: labels[marker] ?? 'Sin señal GW compacta',
          signalCount: 0, entries: Object.freeze([]),
        });
      });

    TestBed.configureTestingModule({
      providers: [
        GalaxyKnowledgeSystemsCatalogDataSource,
        { provide: GENESIS_LOCAL_REPOSITORIES, useValue: {
          discoveryRepository: { async getKnownDiscoveriesInGalaxy() { return discoveries; } },
          compactMergerCanonicalEventRepository: {},
        } as unknown as GenesisLocalRepositories },
      ],
    });

    const source = TestBed.inject(GalaxyKnowledgeSystemsCatalogDataSource);
    const result = await source.query({
      generationKey, galaxyIndex: 0n, galaxyState: DiscoveryState.CONFIRMED,
      query: { category: 'systems', subtype: null, page: 1, pageSize: 25, sortKey: 'gravitationalWave', direction: 'asc' },
    });
    expect(result.kind).toBe('page');
    if (result.kind !== 'page') throw new Error('Expected systems page.');
    expect(result.page.items.map(row => row.cells['gravitationalWave'])).toEqual([
      'GW BH–BH · 294 µHz → ISCO 74,526 Hz',
      'GW NS–NS · 185 µHz → ISCO 1,659 kHz',
      'Sin señal GW compacta',
    ]);
    expect(synchronize).toHaveBeenCalledTimes(3);
    expect(presentation).toHaveBeenCalledTimes(3);
  });


  it('reverses the locator tie-break when changing generic sort direction', async () => {
    const discoveries = Object.freeze([
      new KnownDiscovery(generationKey, new SystemLocator(0n, 7n, 101n), DiscoveryState.CATALOGUED),
      new KnownDiscovery(generationKey, new SystemLocator(0n, 7n, 102n), DiscoveryState.CATALOGUED),
      new KnownDiscovery(generationKey, new SystemLocator(0n, 7n, 103n), DiscoveryState.CATALOGUED),
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

    const source = TestBed.inject(GalaxyKnowledgeSystemsCatalogDataSource);
    const query = async (direction: 'asc' | 'desc') => source.query({
      generationKey,
      galaxyIndex: 0n,
      galaxyState: DiscoveryState.CONFIRMED,
      query: {
        category: 'systems',
        subtype: null,
        page: 1,
        pageSize: 25,
        sortKey: 'state',
        direction,
      },
    });

    const asc = await query('asc');
    const desc = await query('desc');
    if (asc.kind !== 'page' || desc.kind !== 'page') throw new Error('Expected systems page.');

    expect(asc.page.items.map(row => row.actions[0]?.route[3])).toEqual(['101', '102', '103']);
    expect(desc.page.items.map(row => row.actions[0]?.route[3])).toEqual(['103', '102', '101']);
  });

  it('reverses nova tie-break ordering when all systems share the same catalogue label', async () => {
    const discoveries = Object.freeze([
      new KnownDiscovery(generationKey, new SystemLocator(0n, 9n, 201n), DiscoveryState.CATALOGUED),
      new KnownDiscovery(generationKey, new SystemLocator(0n, 9n, 202n), DiscoveryState.CATALOGUED),
      new KnownDiscovery(generationKey, new SystemLocator(0n, 9n, 203n), DiscoveryState.CATALOGUED),
    ]);
    const synchronize = vi.spyOn(StellarNovaScientificIntegration, 'synchronize')
      .mockImplementation(async (_repository, _generationKey, locator) => Object.freeze({
        marker: Number(locator.galacticObjectIndex),
        lineages: Object.freeze([]), events: Object.freeze([]), consequences: Object.freeze([]),
      }) as never);
    const presentation = vi.spyOn(StellarNovaScientificPresentationAssembler, 'build')
      .mockImplementation(() => Object.freeze({
        summary: '', catalogLabel: 'Sin canal de nova', canonicalEventCount: 0, entries: Object.freeze([]),
      }));

    TestBed.configureTestingModule({
      providers: [
        GalaxyKnowledgeSystemsCatalogDataSource,
        { provide: GENESIS_LOCAL_REPOSITORIES, useValue: {
          discoveryRepository: { async getKnownDiscoveriesInGalaxy() { return discoveries; } },
          novaCanonicalEventRepository: {},
        } as unknown as GenesisLocalRepositories },
      ],
    });

    const source = TestBed.inject(GalaxyKnowledgeSystemsCatalogDataSource);
    const query = async (direction: 'asc' | 'desc') => source.query({
      generationKey,
      galaxyIndex: 0n,
      galaxyState: DiscoveryState.CONFIRMED,
      query: {
        category: 'systems',
        subtype: null,
        page: 1,
        pageSize: 25,
        sortKey: 'nova',
        direction,
      },
    });

    const asc = await query('asc');
    const desc = await query('desc');
    if (asc.kind !== 'page' || desc.kind !== 'page') throw new Error('Expected systems page.');

    expect(asc.page.items.map(row => row.actions[0]?.route[3])).toEqual(['201', '202', '203']);
    expect(desc.page.items.map(row => row.actions[0]?.route[3])).toEqual(['203', '202', '201']);

    synchronize.mockRestore();
    presentation.mockRestore();
  });

});
