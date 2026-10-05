import { TestBed } from '@angular/core/testing';

import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { BodyLocator, MoonLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { MoonWaterRegime } from '../../domain/planetary/moon-water-regime';
import { PlanetType } from '../../domain/planetary/planet-type';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import {
  GENESIS_LOCAL_REPOSITORIES,
  type GenesisLocalRepositories,
} from '../runtime/genesis-local-repositories';
import {
  GALAXY_PLANET_MOON_CATALOG_SNAPSHOT_RUNTIME,
  type GalaxyKnowledgePlanetMoonCatalogSnapshot,
  type GalaxyPlanetMoonCatalogSnapshotRuntime,
} from '../runtime/galaxy-planet-moon-catalog-snapshot.runtime';
import { GalaxyKnowledgePlanetsMoonsCatalogDataSource } from './galaxy-knowledge-planets-moons-catalog.data-source';

const generationKey = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),
  GeneratorVersion.V2,
);
const system = new SystemLocator(0n, 12n, 7n);
const planet0 = new BodyLocator(0n, 12n, 7n, 0n);
const planet1 = new BodyLocator(0n, 12n, 7n, 1n);
const planet2 = new BodyLocator(0n, 12n, 7n, 2n);
const moon0 = new MoonLocator(0n, 12n, 7n, 1n, 0n);

const snapshot: GalaxyKnowledgePlanetMoonCatalogSnapshot = Object.freeze({
  galaxyIndex: 0n,
  planets: Object.freeze([
    Object.freeze({
      id: 'G0/S12/O7/P0',
      locator: planet0,
      parentSystemLocator: system,
      designation: 'Asterion b',
      systemDesignation: 'Asterion',
      stateName: 'CONFIRMED',
      subtype: PlanetType.ROCKY,
      hostLabel: 'A',
      orbitClass: 'SINGLE_HOST',
      massEarth: 1.1,
      radiusEarth: 1.02,
      semiMajorAxisAu: 0.8,
      orbitalPeriodDays: 260,
      meanSurfaceTemperatureKelvin: 289,
      surfaceLiquidWaterCoverageFraction01: 0,
      postCollapseIdentityHex: null,
    }),
    Object.freeze({
      id: 'G0/S12/O7/P1',
      locator: planet1,
      parentSystemLocator: system,
      designation: 'Asterion c',
      systemDesignation: 'Asterion',
      stateName: 'CONFIRMED',
      subtype: PlanetType.OCEAN,
      hostLabel: 'A',
      orbitClass: 'SINGLE_HOST',
      massEarth: 2.4,
      radiusEarth: 1.4,
      semiMajorAxisAu: 1.2,
      orbitalPeriodDays: 480,
      meanSurfaceTemperatureKelvin: 281,
      surfaceLiquidWaterCoverageFraction01: 0.72,
      postCollapseIdentityHex: null,
    }),
    Object.freeze({
      id: 'G0/S12/O7/P2',
      locator: planet2,
      parentSystemLocator: system,
      designation: 'Asterion d',
      systemDesignation: 'Asterion',
      stateName: 'CONFIRMED',
      subtype: PlanetType.ROCKY,
      hostLabel: 'A',
      orbitClass: 'SINGLE_HOST',
      massEarth: 0.7,
      radiusEarth: 0.9,
      semiMajorAxisAu: 1.8,
      orbitalPeriodDays: 760,
      meanSurfaceTemperatureKelvin: 250,
      surfaceLiquidWaterCoverageFraction01: null,
      postCollapseIdentityHex: null,
    }),
  ]),
  moons: Object.freeze([
    Object.freeze({
      id: 'G0/S12/O7/P1/M0',
      locator: moon0,
      parentSystemLocator: system,
      designation: 'Asterion c I',
      hostPlanetDesignation: 'Asterion c',
      systemDesignation: 'Asterion',
      stateName: 'CONFIRMED',
      composition: 'ICY',
      hostLabel: 'A',
      orbitClass: 'SINGLE_HOST',
      massEarth: 0.012,
      radiusEarth: 0.27,
      orbitalPeriodDays: 4.2,
      inferredIceRichnessIndex01: 0.82,
      surfaceLiquidWaterPotentialIndex01: 0.44,
      subsurfaceOceanPotentialIndex01: 0.88,
      waterRegime: MoonWaterRegime.ICE_AND_SUBSURFACE_OCEAN,
    }),
  ]),
  unmaterializedMinorMoonCount: 17n,
});

describe('26.1c.3 GalaxyKnowledgePlanetsMoonsCatalogDataSource', () => {
  let source: GalaxyKnowledgePlanetsMoonsCatalogDataSource;
  let getKnownDiscoveries: ReturnType<typeof vi.fn>;
  let getKnownDiscoveriesInGalaxy: ReturnType<typeof vi.fn>;
  let resolve: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getKnownDiscoveries = vi.fn(async () => {
      throw new Error('Production catalogue path must not scan the whole universe.');
    });
    getKnownDiscoveriesInGalaxy = vi.fn(async () => Object.freeze([]));
    resolve = vi.fn(async () => snapshot);

    TestBed.configureTestingModule({
      providers: [
        GalaxyKnowledgePlanetsMoonsCatalogDataSource,
        {
          provide: GENESIS_LOCAL_REPOSITORIES,
          useValue: {
            discoveryRepository: {
              getKnownDiscoveries,
              getKnownDiscoveriesInGalaxy,
            },
          } as unknown as GenesisLocalRepositories,
        },
        {
          provide: GALAXY_PLANET_MOON_CATALOG_SNAPSHOT_RUNTIME,
          useValue: { resolve } as GalaxyPlanetMoonCatalogSnapshotRuntime,
        },
      ],
    });
    source = TestBed.inject(GalaxyKnowledgePlanetsMoonsCatalogDataSource);
  });

  it('describes physical planet and moon filters with family-specific columns and sorting', () => {
    const planets = source.describe('planets', 'OCEAN');
    const moons = source.describe('moons', 'ICY');

    expect(planets.title).toBe('Planetas oceánicos');
    expect(planets.filterLabel).toBe('Oceánico');
    expect(planets.columns.map(column => column.key)).toContain('water');
    expect(planets.sortOptions.map(option => option.key)).toContain('mass');

    expect(moons.title).toBe('Lunas heladas');
    expect(moons.filterLabel).toBe('Helada');
    expect(moons.columns.map(column => column.key)).toContain('planet');
    expect(moons.sortOptions.map(option => option.key)).toContain('subsurface-ocean');

    expect(() => source.describe('planets', 'UNKNOWN_TYPE')).toThrowError(RangeError);
    expect(() => source.describe('moons', 'GAS')).toThrowError(RangeError);
  });

  it('filters real planet rows, exposes scientific/system navigation and keeps the fast galaxy-scoped path', async () => {
    const result = await source.query({
      generationKey,
      galaxyIndex: 0n,
      galaxyState: DiscoveryState.CONFIRMED,
      query: {
        category: 'planets',
        subtype: 'OCEAN',
        page: 1,
        pageSize: 25,
        sortKey: 'mass',
        direction: 'desc',
      },
    });

    expect(result.kind).toBe('page');
    if (result.kind !== 'page') throw new Error('Expected planet page.');
    expect(result.page.totalItems).toBe(1);
    const row = result.page.items[0]!;
    expect(row.title).toBe('Asterion c');
    expect(row.cells['type']).toBe('Oceánico');
    expect(row.cells['water']).toBe('72 %');
    expect(row.actions[0]?.route).toEqual([
      '/system', '0', '12', '7', 'planet', '1',
    ]);
    expect(row.actions[1]?.route).toEqual(['/system', '0', '12', '7']);
    expect(getKnownDiscoveriesInGalaxy).toHaveBeenCalledWith(generationKey, 0n);
    expect(getKnownDiscoveries).not.toHaveBeenCalled();
    expect(resolve).toHaveBeenCalled();
  });

  it('supports knowledge-safe water subsets and moon composition/water filters with direct moon navigation', async () => {
    const waterPlanets = await source.query({
      generationKey,
      galaxyIndex: 0n,
      galaxyState: DiscoveryState.CONFIRMED,
      query: {
        category: 'planets',
        subtype: 'WATER_20_PLUS',
        page: 1,
        pageSize: 25,
        sortKey: 'designation',
        direction: 'asc',
      },
    });
    if (waterPlanets.kind !== 'page') throw new Error('Expected water planet page.');
    expect(waterPlanets.page.items.map(row => row.title)).toEqual(['Asterion c']);

    const icyMoons = await source.query({
      generationKey,
      galaxyIndex: 0n,
      galaxyState: DiscoveryState.CONFIRMED,
      query: {
        category: 'moons',
        subtype: 'ICY',
        page: 1,
        pageSize: 25,
        sortKey: 'ice',
        direction: 'desc',
      },
    });
    if (icyMoons.kind !== 'page') throw new Error('Expected moon page.');
    expect(icyMoons.page.totalItems).toBe(1);
    expect(icyMoons.page.items[0]?.cells['composition']).toBe('Helada');
    expect(icyMoons.page.items[0]?.actions[0]?.route).toEqual([
      '/system', '0', '12', '7', 'planet', '1', 'moon', '0',
    ]);

    const oceanMoons = await source.query({
      generationKey,
      galaxyIndex: 0n,
      galaxyState: DiscoveryState.CONFIRMED,
      query: {
        category: 'moons',
        subtype: 'SUBSURFACE_OCEAN',
        page: 1,
        pageSize: 25,
        sortKey: 'designation',
        direction: 'asc',
      },
    });
    if (oceanMoons.kind !== 'page') throw new Error('Expected ocean moon page.');
    expect(oceanMoons.page.totalItems).toBe(1);
  });
  it('sorts missing optional scientific values below a real zero in both directions', async () => {
    const ascending = await source.query({
      generationKey,
      galaxyIndex: 0n,
      galaxyState: DiscoveryState.CONFIRMED,
      query: {
        category: 'planets',
        subtype: null,
        page: 1,
        pageSize: 25,
        sortKey: 'water',
        direction: 'asc',
      },
    });
    if (ascending.kind !== 'page') throw new Error('Expected ascending planet page.');
    expect(ascending.page.items.map(row => row.title)).toEqual([
      'Asterion d',
      'Asterion b',
      'Asterion c',
    ]);

    const descending = await source.query({
      generationKey,
      galaxyIndex: 0n,
      galaxyState: DiscoveryState.CONFIRMED,
      query: {
        category: 'planets',
        subtype: null,
        page: 1,
        pageSize: 25,
        sortKey: 'water',
        direction: 'desc',
      },
    });
    if (descending.kind !== 'page') throw new Error('Expected descending planet page.');
    expect(descending.page.items.map(row => row.title)).toEqual([
      'Asterion c',
      'Asterion b',
      'Asterion d',
    ]);
  });

});
