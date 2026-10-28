import { TestBed } from '@angular/core/testing';

import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { BodyLocator, MoonLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { MoonWaterRegime } from '../../domain/planetary/moon-water-regime';
import { PlanetType } from '../../domain/planetary/planet-type';
import { AtmosphereGas as Gas } from '../../domain/planetary/atmosphere-gas';
import { parseCatalogAtmosphereFilter } from './galaxy-knowledge-atmosphere-filter';
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
import { catalogFields } from './galaxy-knowledge-catalog-columns';
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
      atmosphere: {fractions:{[Gas.NITROGEN]:.78084,[Gas.OXYGEN]:.20946,[Gas.ARGON]:.00934,[Gas.CARBON_DIOXIDE]:.00042},pressureBar:1.01325,conditional:false},
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
      atmosphere: {fractions:{[Gas.NITROGEN]:.52,[Gas.CARBON_DIOXIDE]:.4,[Gas.ARGON]:.08},pressureBar:.3,conditional:false},
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
      atmosphere: null,
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
      atmosphere:{fractions:{[Gas.NITROGEN]:.4,[Gas.CARBON_DIOXIDE]:.6},pressureBar:.0003,conditional:true},
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
    // The short label is shared by the sort picker, column picker and table header.
    expect(planets.sortOptions.find(option => option.key === 'temperature')?.label).toBe('Tª superficial');
    expect(catalogFields(planets).find(column => column.key === 'temperature')?.label).toBe('Tª SUPERFICIAL');

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
    expect(row.cells['radius']).toBe('8.919 km');
    expect(row.cells['temperature']).toBe('8 °C');
    expect(row.cells['period']).toBe('1 año, 3 meses y 24 días');
    expect(row.cells['pressure-atm']).toBe('0,3 bar');
    expect(row.cells['earth-similarity']).toMatch(/^\d+ %$/u);
    expect(row.actions[0]?.route).toEqual([
      '/system', '0', '12', '7', 'planet', '1',
    ]);
    expect(row.actions[1]?.route).toEqual(['/system', '0', '12', '7']);
    expect(getKnownDiscoveriesInGalaxy).toHaveBeenCalledWith(generationKey, 0n);
    expect(getKnownDiscoveries).not.toHaveBeenCalled();
    expect(resolve).toHaveBeenCalled();
  });

  it('filters planet and moon names before pagination, keeping the known-only snapshot', async () => {
    const base = { generationKey, galaxyIndex: 0n, galaxyState: DiscoveryState.CONFIRMED } as const;
    const query = { subtype: null, page: 5, pageSize: 25 as const, sortKey: 'designation', direction: 'asc' as const };
    const planets = await source.query({ ...base, query: { ...query, category: 'planets', search: 'ASTERION C' } });
    if (planets.kind !== 'page') throw new Error('Expected planet page.');
    expect(planets.page.totalItems).toBe(1);
    expect(planets.page.page).toBe(1);
    expect(planets.page.items.map(item => item.title)).toEqual(['Asterion c']);
    const moons = await source.query({ ...base, query: { ...query, category: 'moons', search: 'c i' } });
    if (moons.kind !== 'page') throw new Error('Expected moon page.');
    expect(moons.page.totalItems).toBe(1);
    expect(moons.page.items[0]!.title).toBe('Asterion c I');
    const noMatch = await source.query({ ...base, query: { ...query, category: 'moons', search: 'Aaemoria' } });
    if (noMatch.kind !== 'page') throw new Error('Expected moon page.');
    expect(noMatch.page.totalItems).toBe(0);
    expect(getKnownDiscoveries).not.toHaveBeenCalled();
  });

  it('displays Celsius while temperature ordering still follows scientific Kelvin values', async () => {
    const result = await source.query({
      generationKey, galaxyIndex: 0n, galaxyState: DiscoveryState.CONFIRMED,
      query: {
        category: 'planets', subtype: null, page: 1, pageSize: 25,
        sortKey: 'temperature', direction: 'asc',
      },
    });
    if (result.kind !== 'page') throw new Error('Expected planet page.');
    expect(result.page.items.map(row => row.title)).toEqual([
      'Asterion d', 'Asterion c', 'Asterion b',
    ]);
    expect(result.page.items.map(row => row.cells['temperature'])).toEqual([
      '-23 °C', '8 °C', '16 °C',
    ]);
  });

  it('displays orbital durations for planets and moons without changing numerical ordering', async () => {
    const base = { generationKey, galaxyIndex: 0n, galaxyState: DiscoveryState.CONFIRMED } as const;
    const common = { subtype: null, page: 1, pageSize: 25 as const, sortKey: 'period', direction: 'asc' as const };
    const planets = await source.query({ ...base, query: { ...common, category: 'planets' } });
    if (planets.kind !== 'page') throw new Error('Expected planet page.');
    expect(planets.page.items.map(row => row.title)).toEqual(['Asterion b', 'Asterion c', 'Asterion d']);
    expect(planets.page.items.map(row => row.cells['period'])).toEqual([
      '8 meses y 17 días',
      '1 año, 3 meses y 24 días',
      '2 años y 1 mes',
    ]);
    const moons = await source.query({ ...base, query: { ...common, category: 'moons' } });
    if (moons.kind !== 'page') throw new Error('Expected moon page.');
    expect(moons.page.items[0]?.cells['period']).toBe('4 días');
  });

  it('31.4f labels compact water as conditional, never as a known water world', async () => {
    const compact = Object.freeze({
      ...snapshot.planets[0]!, orbitClass: 'COMPACT_HOST' as const,
      designation: 'Escenario compacto b',
      meanSurfaceTemperatureKelvin: null, surfaceLiquidWaterCoverageFraction01: null,
      compactConditionalTemperatureKelvin: 294,
      compactConditionalLiquidCoverage01: 0.25,
    });
    resolve.mockResolvedValue(Object.freeze({
      ...snapshot, planets: Object.freeze([compact]),
    }));
    const query = async (subtype: string | null) => source.query({
      generationKey, galaxyIndex: 0n, galaxyState: DiscoveryState.CONFIRMED,
      query: {category: 'planets' as const, subtype, page: 1, pageSize: 25,
        sortKey:'designation', direction:'asc' as const},
    });
    const all = await query(null);
    if (all.kind !== 'page') throw new Error('Expected compact planet row.');
    expect(all.page.items[0]!.cells['water']).toBe('25 % (esc.)');
    const knownWater = await query('WATER_20_PLUS');
    if (knownWater.kind !== 'page') throw new Error('Expected known-water page.');
    expect(knownWater.page.totalItems).toBe(0);
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
    expect(waterPlanets.page.items[0]?.cells['radius']).toBe('8.919 km');

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
    expect(icyMoons.page.items[0]?.cells['radius']).toBe('1.720 km');
    expect(icyMoons.page.items[0]?.cells['period']).toBe('4 días');
    expect(icyMoons.page.items[0]?.cells['ice']).toBe('82,0 %');
    expect(icyMoons.page.items[0]?.cells['water']).toBe('44,0 %');
    expect(icyMoons.page.items[0]?.cells['subsurface-ocean']).toBe('88,0 %');
    expect(icyMoons.page.items[0]?.cells['pressure-atm']).toBe('< 0,01 bar (esc.)');
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

  it('filters by complete final atmospheric fractions before pagination and sorts numeric gas values',async()=>{
    const base={generationKey,galaxyIndex:0n,galaxyState:DiscoveryState.CONFIRMED} as const;
    const common={category:'planets' as const,subtype:null,page:1,pageSize:25 as const,sortKey:'gas-NITROGEN',direction:'desc' as const};
    const all=await source.query({...base,query:common});
    expect(all.kind).toBe('page');
    if(all.kind!=='page')return;
    expect(all.page.items.map(row=>row.title)).toEqual(['Asterion b','Asterion c','Asterion d']);
    expect(all.page.items[0]!.cells['gas-CARBON_DIOXIDE']).toBe('< 0,1 %');
    expect(all.page.items[2]!.cells['gas-OXYGEN']).toBe('No determinado');
    const filter=parseCatalogAtmosphereFilter({gasRanges:'NITROGEN:75:85;OXYGEN:19:22;CARBON_DIOXIDE::0.05',pressureMin:'0.9',earthMin:'95'},false);
    const matching=await source.query({...base,query:{...common,atmosphere:filter}});
    if(matching.kind!=='page')return;
    expect(matching.page.totalItems).toBe(1);
    expect(matching.page.items[0]!.title).toBe('Asterion b');
    const co2=await source.query({...base,query:{...common,atmosphere:parseCatalogAtmosphereFilter({gasRanges:'CARBON_DIOXIDE:30:50'},false)}});
    if(co2.kind!=='page')return;
    expect(co2.page.items.map(row=>row.title)).toEqual(['Asterion c']);
  });
  it('changes O₂ ascending/descending order on the WHOLE catalogue, distinguishing zero from unresolved',async()=>{
    const extra=Object.freeze({
      ...snapshot.planets[1]!,
      id:'G0/S12/O7/P3',
      designation:'Asterion aa',
      atmosphere: {fractions:{[Gas.OXYGEN]:.60,[Gas.NITROGEN]:.40},pressureBar:1.8,conditional:false},
    });
    // Deliberately out of order: an alphabetical fallback must not pass this test.
    const newSnapshot=Object.freeze({
      ...snapshot,
      planets:Object.freeze([snapshot.planets[2]!,snapshot.planets[1]!,extra,snapshot.planets[0]!]),
    });
    resolve.mockResolvedValue(newSnapshot);
    const base={generationKey,galaxyIndex:0n,galaxyState:DiscoveryState.CONFIRMED} as const;
    const common={category:'planets' as const,subtype:null,page:1,pageSize:25 as const,sortKey:'gas-OXYGEN'};
    const desc=await source.query({...base,query:{...common,direction:'desc'}});
    const asc=await source.query({...base,query:{...common,direction:'asc'}});
    expect(desc.kind).toBe('page');expect(asc.kind).toBe('page');
    if(desc.kind!=='page'||asc.kind!=='page')return;
    expect(desc.page.items.map(row=>row.title)).toEqual([
      'Asterion aa','Asterion b','Asterion c','Asterion d',
    ]);
    expect(asc.page.items.map(row=>row.title)).toEqual([
      'Asterion c','Asterion b','Asterion aa','Asterion d',
    ]);
    expect(desc.page.atmosphericSortAvailability).toEqual({resolved:3,positive:2,unresolved:1});
    expect(desc.page.items.map(row=>row.cells['gas-OXYGEN'])).toEqual([
      '60,0 %','20,9 %','0,0 %','No determinado',
    ]);
    const oxygenRange=parseCatalogAtmosphereFilter({gasRanges:'OXYGEN:10:50'},false);
    const filtered=await source.query({...base,query:{...common,direction:'desc',atmosphere:oxygenRange}});
    if(filtered.kind!=='page')return;
    expect(filtered.page.totalItems).toBe(1);
    expect(filtered.page.items[0]?.title).toBe('Asterion b');
    expect(filtered.page.atmosphericSortAvailability).toEqual({resolved:1,positive:1,unresolved:0});
    const zeroOnly=await source.query({...base,query:{...common,direction:'desc',
      atmosphere:parseCatalogAtmosphereFilter({gasRanges:'OXYGEN::0'},false)}});
    if(zeroOnly.kind!=='page')return;
    expect(zeroOnly.page.items.map(row=>row.title)).toEqual(['Asterion c']);
    expect(zeroOnly.page.totalItems).toBe(1);
    // Same query cache and identity may be reused, but direction MUST invalidate its view.
    const descAgain=await source.query({...base,query:{...common,direction:'desc'}});
    if(descAgain.kind!=='page')return;
    expect(descAgain.page.items[0]?.title).toBe('Asterion aa');
  });

  it('combines atmospheric pressure and gas Y/O filters before pagination',async()=>{
    const base={generationKey,galaxyIndex:0n,galaxyState:DiscoveryState.CONFIRMED} as const;
    const common={category:'planets' as const,subtype:null,page:1,pageSize:25 as const,sortKey:'gas-CARBON_DIOXIDE',direction:'desc' as const};
    const orFilter=parseCatalogAtmosphereFilter({gasRanges:'OXYGEN:20:;CARBON_DIOXIDE:35:',gasCombine:'OR',pressureMin:'0.2'},false);
    const result=await source.query({...base,query:{...common,atmosphere:orFilter}});
    if(result.kind!=='page')throw new Error('Expected page');
    expect(result.page.totalItems).toBe(2);
    expect(result.page.items.map(row=>row.title)).toEqual(['Asterion c','Asterion b']);
    const andFilter=parseCatalogAtmosphereFilter({gasRanges:'OXYGEN:20:;CARBON_DIOXIDE:35:',gasCombine:'AND'},false);
    const empty=await source.query({...base,query:{...common,atmosphere:andFilter}});
    if(empty.kind!=='page')throw new Error('Expected empty page');
    expect(empty.page.totalItems).toBe(0);
  });

  it('offers correct gas columns and respects conditional lunar gas scenarios',async()=>{
    const planetFields=catalogFields(source.describe('planets',null));
    expect(planetFields.find(field=>field.key==='gas-CARBON_DIOXIDE')?.defaultVisible).toBe(false);
    expect(planetFields.some(field=>field.key==='earth-similarity')).toBe(true);
    const moonFields=catalogFields(source.describe('moons',null));
    expect(moonFields.some(field=>field.key==='gas-OXYGEN')).toBe(false);
    expect(moonFields.some(field=>field.key==='gas-NITROGEN')).toBe(true);
    const result=await source.query({generationKey,galaxyIndex:0n,galaxyState:DiscoveryState.CONFIRMED,
      query:{category:'moons',subtype:null,page:1,pageSize:25,sortKey:'gas-CARBON_DIOXIDE',direction:'desc',
        atmosphere:parseCatalogAtmosphereFilter({gasRanges:'CARBON_DIOXIDE:55:70'},true)}});
    if(result.kind!=='page')return;
    expect(result.page.totalItems).toBe(1);
    expect(result.page.items[0]!.cells['gas-CARBON_DIOXIDE']).toBe('60,0 % (esc.)');
  });

});
