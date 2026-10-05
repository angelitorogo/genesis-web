import { TestBed } from '@angular/core/testing';

import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { DiscoveryTargetType } from '../../domain/discovery/discovery-target-type';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import {
  GENESIS_LOCAL_REPOSITORIES,
  type GenesisLocalRepositories,
} from '../runtime/genesis-local-repositories';
import {
  GALAXY_MINOR_BODY_CATALOG_SNAPSHOT_RUNTIME,
  type GalaxyKnowledgeMinorBodyCatalogSnapshot,
  type GalaxyMinorBodyCatalogSnapshotRuntime,
} from '../runtime/galaxy-minor-body-catalog-snapshot.runtime';
import { GalaxyKnowledgeMinorBodiesCatalogDataSource } from './galaxy-knowledge-minor-bodies-catalog.data-source';

const generationKey = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),
  GeneratorVersion.V2,
);
const system = new SystemLocator(0n, 12n, 7n);

const base = Object.freeze({
  parentSystemLocator: system,
  systemDesignation: 'Asterion',
  hostLabel: 'A',
  secondarySubtype: null,
  tertiarySubtype: null,
  inclinationDegrees: 7,
  densityGramsPerCubicCentimeter: 1.8,
  albedo01: 0.1,
  incomingVelocityKmPerSecond: null,
});

const snapshot: GalaxyKnowledgeMinorBodyCatalogSnapshot = Object.freeze({
  galaxyIndex: 0n,
  asteroids: Object.freeze([
    Object.freeze({
      ...base,
      id: 'asteroid-1',
      kind: 'ASTEROID' as const,
      proceduralId: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      designation: 'AST-1',
      subtype: 'METALLIC',
      secondarySubtype: 'COHERENT',
      tertiarySubtype: 'SINGLE',
      diameterKilometers: 180,
      semiMajorAxisAu: 2.2,
      eccentricity: 0.08,
      periapsisAu: 2.024,
      apoapsisAu: 2.376,
      orbitalPeriodYears: null,
      volatileOrIceFraction01: 0,
    }),
  ]),
  comets: Object.freeze([
    Object.freeze({
      ...base,
      id: 'comet-1',
      kind: 'COMET' as const,
      proceduralId: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
      designation: 'COM-1',
      subtype: 'SHORT_PERIOD',
      diameterKilometers: 14,
      semiMajorAxisAu: 8,
      eccentricity: 0.7,
      periapsisAu: 2.4,
      apoapsisAu: 13.6,
      orbitalPeriodYears: 22.6,
      volatileOrIceFraction01: 0.82,
    }),
  ]),
  transNeptunianObjects: Object.freeze([
    Object.freeze({
      ...base,
      id: 'tno-1',
      kind: 'TNO' as const,
      proceduralId: 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
      designation: 'TNO-1',
      subtype: 'DETACHED',
      secondarySubtype: 'DWARF_PLANET_SCALE',
      diameterKilometers: 1200,
      semiMajorAxisAu: 60,
      eccentricity: 0.3,
      periapsisAu: 42,
      apoapsisAu: 78,
      orbitalPeriodYears: 465,
      volatileOrIceFraction01: 0.7,
    }),
  ]),
  capturedObjects: Object.freeze([
    Object.freeze({
      ...base,
      id: 'captured-1',
      kind: 'CAPTURED' as const,
      proceduralId: 'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
      designation: 'CAP-1',
      subtype: 'VOLATILE_RICH',
      secondarySubtype: 'BINARY_EXCHANGE',
      diameterKilometers: 9,
      semiMajorAxisAu: 4,
      eccentricity: 0.45,
      periapsisAu: 2.2,
      apoapsisAu: 5.8,
      orbitalPeriodYears: 8,
      volatileOrIceFraction01: 0.75,
      incomingVelocityKmPerSecond: 24,
    }),
  ]),
});

describe('26.1c.5 GalaxyKnowledgeMinorBodiesCatalogDataSource', () => {
  let source: GalaxyKnowledgeMinorBodiesCatalogDataSource;
  let getKnownDiscoveries: ReturnType<typeof vi.fn>;
  let getKnownDiscoveriesInGalaxy: ReturnType<typeof vi.fn>;
  let resolve: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getKnownDiscoveries = vi.fn(async () => {
      throw new Error('Minor-body catalogue must not scan all universes.');
    });
    getKnownDiscoveriesInGalaxy = vi.fn(async () => Object.freeze([]));
    resolve = vi.fn(async () => snapshot);

    TestBed.configureTestingModule({
      providers: [
        GalaxyKnowledgeMinorBodiesCatalogDataSource,
        {
          provide: GENESIS_LOCAL_REPOSITORIES,
          useValue: {
            discoveryRepository: { getKnownDiscoveries, getKnownDiscoveriesInGalaxy },
          } as unknown as GenesisLocalRepositories,
        },
        {
          provide: GALAXY_MINOR_BODY_CATALOG_SNAPSHOT_RUNTIME,
          useValue: { resolve } as GalaxyMinorBodyCatalogSnapshotRuntime,
        },
      ],
    });
    source = TestBed.inject(GalaxyKnowledgeMinorBodiesCatalogDataSource);
  });

  it('describes all four minor-body families with physical sorting and validates subtypes', () => {
    expect(source.describe('asteroids', 'METALLIC').title).toContain('Metálico');
    expect(source.describe('comets', 'SHORT_PERIOD').sortOptions.map(option => option.key)).toContain('period');
    expect(source.describe('tno', 'DETACHED').columns.map(column => column.key)).toContain('ice');
    expect(source.describe('captured', 'BINARY_EXCHANGE').columns.map(column => column.key)).toContain('capture');
    expect(() => source.describe('comets', 'MAGNETAR')).toThrowError(RangeError);
  });

  it('filters and navigates directly to a minor-body fiche without scanning the whole universe', async () => {
    const result = await source.query({
      generationKey,
      galaxyIndex: 0n,
      galaxyState: DiscoveryState.CONFIRMED,
      query: {
        category: 'comets', subtype: 'SHORT_PERIOD', page: 1, pageSize: 25,
        sortKey: 'periapsis', direction: 'asc',
      },
    });

    if (result.kind !== 'page') throw new Error('Expected comet page.');
    expect(result.page.totalItems).toBe(1);
    expect(result.page.items[0]?.title).toBe('COM-1');
    expect(result.page.items[0]?.actions[0]?.route).toEqual([
      '/system', '0', '12', '7', 'minor-body', 'comet', 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    ]);
    expect(result.page.items[0]?.actions[1]?.route).toEqual(['/system', '0', '12', '7']);
    expect(getKnownDiscoveriesInGalaxy).toHaveBeenCalledWith(
      generationKey,
      0n,
      DiscoveryTargetType.SYSTEM.code,
    );
    expect(getKnownDiscoveries).not.toHaveBeenCalled();
  });

  it('supports TNO dwarf-scale and captured-origin filters', async () => {
    const tno = await source.query({
      generationKey,
      galaxyIndex: 0n,
      galaxyState: DiscoveryState.CONFIRMED,
      query: {
        category: 'tno', subtype: 'DWARF_PLANET_SCALE', page: 1, pageSize: 25,
        sortKey: 'diameter', direction: 'desc',
      },
    });
    if (tno.kind !== 'page') throw new Error('Expected TNO page.');
    expect(tno.page.items.map(row => row.title)).toEqual(['TNO-1']);

    const captured = await source.query({
      generationKey,
      galaxyIndex: 0n,
      galaxyState: DiscoveryState.CONFIRMED,
      query: {
        category: 'captured', subtype: 'BINARY_EXCHANGE', page: 1, pageSize: 25,
        sortKey: 'incoming-velocity', direction: 'desc',
      },
    });
    if (captured.kind !== 'page') throw new Error('Expected captured page.');
    expect(captured.page.items[0]?.cells['capture']).toBe('Intercambio binario');
  });
});
