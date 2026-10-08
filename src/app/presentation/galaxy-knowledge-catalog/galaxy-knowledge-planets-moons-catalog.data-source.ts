import { inject, Injectable } from '@angular/core';

import { type KnownDiscovery } from '../../domain/discovery/known-discovery';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { PlanetType } from '../../domain/planetary/planet-type';
import {
  hasGalaxyKnownWaterMoonSubsurfaceOceanEvidence,
  isGalaxyKnownWaterMoonSurfaceLiquidPotential,
} from '../../domain/exploration/galaxy-known-water-moon-index';
import { isGalaxyKnownWaterWorldCoverage } from '../../domain/exploration/galaxy-known-water-world-index';
import { GENESIS_LOCAL_REPOSITORIES } from '../runtime/genesis-local-repositories';
import {
  GALAXY_PLANET_MOON_CATALOG_SNAPSHOT_RUNTIME,
  type GalaxyKnowledgeMoonCatalogEntry,
  type GalaxyKnowledgePlanetCatalogEntry,
  type GalaxyKnowledgePlanetMoonCatalogSnapshot,
} from '../runtime/galaxy-planet-moon-catalog-snapshot.runtime';
import {
  defineGalaxyKnowledgeCatalogDescriptor,
  galaxyKnowledgeCatalogField,
  galaxyKnowledgeCatalogIdentityField,
  type GalaxyKnowledgeCatalogDataRequest,
  type GalaxyKnowledgeCatalogDataResult,
  type GalaxyKnowledgeCatalogDescriptor,
  type GalaxyKnowledgeCatalogDirection,
  type GalaxyKnowledgeCatalogRow,
} from './galaxy-knowledge-catalog.model';
import {
  GalaxyKnowledgeCatalogViewCache,
  galaxyKnowledgeCatalogViewKey,
} from './galaxy-knowledge-catalog-view-cache';

const PLANET_SUBTYPES = Object.freeze([
  PlanetType.ROCKY,
  PlanetType.SUPER_EARTH,
  PlanetType.DESERT,
  PlanetType.OCEAN,
  PlanetType.ICE,
  PlanetType.VOLCANIC,
  PlanetType.MINI_NEPTUNE,
  PlanetType.GAS_GIANT,
  PlanetType.ICE_GIANT,
  'POST_COLLAPSE_MODEL',
  'WATER_20_PLUS',
  'UNCLASSIFIED',
] as const);

type PlanetCatalogFilter = typeof PLANET_SUBTYPES[number];

const MOON_SUBTYPES = Object.freeze([
  'ROCKY',
  'MIXED_ROCK_ICE',
  'ICY',
  'SURFACE_LIQUID_40_PLUS',
  'SUBSURFACE_OCEAN',
  'UNCLASSIFIED',
] as const);

type MoonCatalogFilter = typeof MOON_SUBTYPES[number];

@Injectable({ providedIn: 'root' })
export class GalaxyKnowledgePlanetsMoonsCatalogDataSource {
  private readonly repositories = inject(GENESIS_LOCAL_REPOSITORIES);
  private readonly snapshotRuntime = inject(GALAXY_PLANET_MOON_CATALOG_SNAPSHOT_RUNTIME);
  private readonly planetViewCache = new GalaxyKnowledgeCatalogViewCache<GalaxyKnowledgePlanetCatalogEntry>();
  private readonly moonViewCache = new GalaxyKnowledgeCatalogViewCache<GalaxyKnowledgeMoonCatalogEntry>();

  describe(
    category: 'planets' | 'moons',
    subtype: string | null,
  ): GalaxyKnowledgeCatalogDescriptor {
    return category === 'planets'
      ? describePlanets(normalizePlanetSubtype(subtype))
      : describeMoons(normalizeMoonSubtype(subtype));
  }

  async query(
    request: GalaxyKnowledgeCatalogDataRequest,
  ): Promise<GalaxyKnowledgeCatalogDataResult> {
    if (request.query.category !== 'planets' && request.query.category !== 'moons') {
      return Object.freeze({ kind: 'not-connected' });
    }

    const knownDiscoveries = await this.loadGalaxyKnowledge(
      request.generationKey,
      request.galaxyIndex,
    );
    const snapshot = await this.snapshotRuntime.resolve(
      request.generationKey,
      request.galaxyIndex,
      knownDiscoveries,
    );

    return request.query.category === 'planets'
      ? planetPage(snapshot, request, this.planetViewCache)
      : moonPage(snapshot, request, this.moonViewCache);
  }

  private async loadGalaxyKnowledge(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
  ): Promise<readonly KnownDiscovery[]> {
    const repository = this.repositories.discoveryRepository;
    if (repository.getKnownDiscoveriesInGalaxy !== undefined) {
      return repository.getKnownDiscoveriesInGalaxy(generationKey, galaxyIndex);
    }

    return (await repository.getKnownDiscoveries(generationKey)).filter(
      discovery => discovery.locator.galaxyIndex === galaxyIndex,
    );
  }
}

function describePlanets(
  subtype: PlanetCatalogFilter | null,
): GalaxyKnowledgeCatalogDescriptor {
  return defineGalaxyKnowledgeCatalogDescriptor({
    category: 'planets' as const,
    title: subtype === null ? 'Planetas conocidos' : planetFilterTitle(subtype),
    description:
      'Planetas pertenecientes al conocimiento persistido de la galaxia. Los sistemas confirmados proyectan su inventario público completo; los BodyLocator históricos sin padre confirmado permanecen físicamente sin clasificar.',
    filterLabel: subtype === null ? 'TODOS' : planetFilterLabel(subtype),
    fields: Object.freeze([
      galaxyKnowledgeCatalogIdentityField('designation', 'Nombre / designación', 'PLANETA'),
      galaxyKnowledgeCatalogField('state', 'Estado científico', {
        columnLabel: 'ESTADO', defaultVisible: true,
      }),
      galaxyKnowledgeCatalogField('type', 'Tipo planetario', {
        columnLabel: 'TIPO', defaultVisible: true,
      }),
      galaxyKnowledgeCatalogField('system', 'Sistema anfitrión', {
        columnLabel: 'SISTEMA', defaultVisible: true,
      }),
      galaxyKnowledgeCatalogField('mass', 'Masa', {
        columnLabel: 'MASA', defaultVisible: true, align: 'end',
      }),
      galaxyKnowledgeCatalogField('radius', 'Radio', {
        columnLabel: 'RADIO', defaultVisible: true, align: 'end',
      }),
      galaxyKnowledgeCatalogField('orbit', 'Semieje mayor', {
        columnLabel: 'ÓRBITA', defaultVisible: true, align: 'end',
      }),
      galaxyKnowledgeCatalogField('period', 'Período orbital'),
      galaxyKnowledgeCatalogField('water', 'Agua líquida superficial', {
        columnLabel: 'AGUA', defaultVisible: true, align: 'end',
      }),
      galaxyKnowledgeCatalogField('temperature', 'Temperatura superficial media'),
      galaxyKnowledgeCatalogField('sector', 'Sector'),
      galaxyKnowledgeCatalogField('locator', 'Localización procedural'),
    ]),
    defaultSortKey: 'designation',
  });
}

function describeMoons(
  subtype: MoonCatalogFilter | null,
): GalaxyKnowledgeCatalogDescriptor {
  return defineGalaxyKnowledgeCatalogDescriptor({
    category: 'moons' as const,
    title: subtype === null ? 'Lunas conocidas' : moonFilterTitle(subtype),
    description:
      'Lunas con identidad científica individual materializada en sistemas confirmados. Las poblaciones de lunas menores no materializadas permanecen como agregados estadísticos y no se convierten en fichas individuales inventadas.',
    filterLabel: subtype === null ? 'TODAS' : moonFilterLabel(subtype),
    fields: Object.freeze([
      galaxyKnowledgeCatalogIdentityField('designation', 'Nombre / designación', 'LUNA'),
      galaxyKnowledgeCatalogField('composition', 'Composición roca / hielo', {
        columnLabel: 'COMPOSICIÓN', defaultVisible: true,
      }),
      galaxyKnowledgeCatalogField('planet', 'Planeta anfitrión', {
        columnLabel: 'PLANETA', defaultVisible: true,
      }),
      galaxyKnowledgeCatalogField('system', 'Sistema anfitrión', {
        columnLabel: 'SISTEMA', defaultVisible: true,
      }),
      galaxyKnowledgeCatalogField('mass', 'Masa', {
        columnLabel: 'MASA', defaultVisible: true, align: 'end',
      }),
      galaxyKnowledgeCatalogField('radius', 'Radio', {
        columnLabel: 'RADIO', defaultVisible: true, align: 'end',
      }),
      galaxyKnowledgeCatalogField('period', 'Período orbital'),
      galaxyKnowledgeCatalogField('ice', 'Riqueza de hielo', {
        columnLabel: 'HIELO', defaultVisible: true, align: 'end',
      }),
      galaxyKnowledgeCatalogField('surface-water', 'Potencial de agua superficial', {
        columnLabel: 'AGUA', defaultVisible: true, cellKey: 'water', align: 'end',
      }),
      galaxyKnowledgeCatalogField('subsurface-ocean', 'Potencial de océano subsuperficial'),
      galaxyKnowledgeCatalogField('sector', 'Sector'),
      galaxyKnowledgeCatalogField('locator', 'Localización procedural'),
    ]),
    defaultSortKey: 'designation',
  });
}

function planetPage(
  snapshot: GalaxyKnowledgePlanetMoonCatalogSnapshot,
  request: GalaxyKnowledgeCatalogDataRequest,
  viewCache: GalaxyKnowledgeCatalogViewCache<GalaxyKnowledgePlanetCatalogEntry>,
): GalaxyKnowledgeCatalogDataResult {
  const subtype = normalizePlanetSubtype(request.query.subtype);
  const records = viewCache.resolve(
    snapshot.planets,
    galaxyKnowledgeCatalogViewKey(subtype, request.query.sortKey, request.query.direction),
    record => matchesPlanetFilter(record, subtype),
    (left, right) => comparePlanets(left, right, request.query.sortKey, request.query.direction),
  );
  return paginated(records, request, toPlanetRow);
}

function moonPage(
  snapshot: GalaxyKnowledgePlanetMoonCatalogSnapshot,
  request: GalaxyKnowledgeCatalogDataRequest,
  viewCache: GalaxyKnowledgeCatalogViewCache<GalaxyKnowledgeMoonCatalogEntry>,
): GalaxyKnowledgeCatalogDataResult {
  const subtype = normalizeMoonSubtype(request.query.subtype);
  const records = viewCache.resolve(
    snapshot.moons,
    galaxyKnowledgeCatalogViewKey(subtype, request.query.sortKey, request.query.direction),
    record => matchesMoonFilter(record, subtype),
    (left, right) => compareMoons(left, right, request.query.sortKey, request.query.direction),
  );
  return paginated(records, request, toMoonRow);
}

function paginated<T>(
  records: readonly T[],
  request: GalaxyKnowledgeCatalogDataRequest,
  row: (record: T) => GalaxyKnowledgeCatalogRow,
): GalaxyKnowledgeCatalogDataResult {
  const totalItems = records.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / request.query.pageSize));
  const page = Math.min(Math.max(1, request.query.page), totalPages);
  const start = (page - 1) * request.query.pageSize;
  const selected = records.slice(start, start + request.query.pageSize);

  return Object.freeze({
    kind: 'page' as const,
    page: Object.freeze({
      totalItems,
      page,
      pageSize: request.query.pageSize,
      totalPages,
      items: Object.freeze(selected.map(row)),
    }),
  });
}

function matchesPlanetFilter(
  record: GalaxyKnowledgePlanetCatalogEntry,
  subtype: PlanetCatalogFilter | null,
): boolean {
  if (subtype === null) return true;
  if (subtype === 'WATER_20_PLUS') {
    return isGalaxyKnownWaterWorldCoverage(record.surfaceLiquidWaterCoverageFraction01);
  }
  return record.subtype === subtype;
}

function matchesMoonFilter(
  record: GalaxyKnowledgeMoonCatalogEntry,
  subtype: MoonCatalogFilter | null,
): boolean {
  if (subtype === null) return true;
  if (subtype === 'SURFACE_LIQUID_40_PLUS') {
    return isGalaxyKnownWaterMoonSurfaceLiquidPotential(record.surfaceLiquidWaterPotentialIndex01);
  }
  if (subtype === 'SUBSURFACE_OCEAN') {
    return hasGalaxyKnownWaterMoonSubsurfaceOceanEvidence(record.waterRegime);
  }
  return record.composition === subtype;
}

function toPlanetRow(record: GalaxyKnowledgePlanetCatalogEntry): GalaxyKnowledgeCatalogRow {
  const actions: GalaxyKnowledgeCatalogRow['actions'][number][] = [];
  if (record.locator !== null) {
    actions.push(Object.freeze({
      label: 'Abrir ficha científica',
      route: Object.freeze([
        '/system',
        record.locator.galaxyIndex.toString(10),
        record.locator.sectorKey.toString(10),
        record.locator.galacticObjectIndex.toString(10),
        'planet',
        record.locator.bodyIndex.toString(10),
      ]),
      emphasis: 'primary' as const,
    }));
  }
  actions.push(Object.freeze({
    label: 'Abrir sistema anfitrión',
    route: systemRoute(record.parentSystemLocator),
    emphasis: record.locator === null ? 'primary' as const : undefined,
  }));

  return Object.freeze({
    id: record.id,
    title: record.designation,
    subtitle: record.locator === null ? `Modelo post-colapso · ${record.id}` : record.id,
    cells: Object.freeze({
      state: discoveryStateLabel(record.stateName),
      type: planetSubtypeLabel(record.subtype),
      system: record.systemDesignation ?? 'Sistema sin caracterizar',
      mass: formatEarth(record.massEarth, 'M⊕'),
      radius: formatEarth(record.radiusEarth, 'R⊕'),
      orbit: formatNumber(record.semiMajorAxisAu, 'UA'),
      period: formatNumber(record.orbitalPeriodDays, 'd'),
      water: formatPercent(record.surfaceLiquidWaterCoverageFraction01),
      temperature: formatNumber(record.meanSurfaceTemperatureKelvin, 'K'),
      sector: record.parentSystemLocator.sectorKey.toLocaleString('es-ES'),
      locator: record.id,
    }),
    actions: Object.freeze(actions),
  });
}

function toMoonRow(record: GalaxyKnowledgeMoonCatalogEntry): GalaxyKnowledgeCatalogRow {
  return Object.freeze({
    id: record.id,
    title: record.designation,
    subtitle: record.id,
    cells: Object.freeze({
      composition: moonCompositionLabel(record.composition),
      planet: record.hostPlanetDesignation,
      system: record.systemDesignation,
      mass: formatEarth(record.massEarth, 'M⊕'),
      radius: formatEarth(record.radiusEarth, 'R⊕'),
      period: formatNumber(record.orbitalPeriodDays, 'd'),
      ice: formatPercent(record.inferredIceRichnessIndex01),
      water: formatPercent(record.surfaceLiquidWaterPotentialIndex01),
      'subsurface-ocean': formatPercent(record.subsurfaceOceanPotentialIndex01),
      sector: record.parentSystemLocator.sectorKey.toLocaleString('es-ES'),
      locator: record.id,
    }),
    actions: Object.freeze([
      Object.freeze({
        label: 'Abrir ficha científica',
        route: Object.freeze([
          '/system',
          record.locator.galaxyIndex.toString(10),
          record.locator.sectorKey.toString(10),
          record.locator.galacticObjectIndex.toString(10),
          'planet',
          record.locator.bodyIndex.toString(10),
          'moon',
          record.locator.moonIndex.toString(10),
        ]),
        emphasis: 'primary' as const,
      }),
      Object.freeze({
        label: 'Abrir planeta anfitrión',
        route: Object.freeze([
          '/system',
          record.locator.galaxyIndex.toString(10),
          record.locator.sectorKey.toString(10),
          record.locator.galacticObjectIndex.toString(10),
          'planet',
          record.locator.bodyIndex.toString(10),
        ]),
      }),
      Object.freeze({
        label: 'Abrir sistema',
        route: systemRoute(record.parentSystemLocator),
      }),
    ]),
  });
}

function systemRoute(locator: GalaxyKnowledgePlanetCatalogEntry['parentSystemLocator']): readonly string[] {
  return Object.freeze([
    '/system',
    locator.galaxyIndex.toString(10),
    locator.sectorKey.toString(10),
    locator.galacticObjectIndex.toString(10),
  ]);
}

function comparePlanets(
  left: GalaxyKnowledgePlanetCatalogEntry,
  right: GalaxyKnowledgePlanetCatalogEntry,
  sortKey: string,
  direction: GalaxyKnowledgeCatalogDirection,
): number {
  const factor = direction === 'desc' ? -1 : 1;
  const difference = comparePlanetByKey(left, right, sortKey);
  if (difference !== 0) return difference * factor;
  return left.id.localeCompare(right.id, 'en');
}

function comparePlanetByKey(
  left: GalaxyKnowledgePlanetCatalogEntry,
  right: GalaxyKnowledgePlanetCatalogEntry,
  sortKey: string,
): number {
  switch (sortKey) {
    case 'designation': return left.designation.localeCompare(right.designation, 'es', { sensitivity: 'base' });
    case 'state': return stateCode(left.stateName) - stateCode(right.stateName);
    case 'type': return planetSubtypeLabel(left.subtype).localeCompare(planetSubtypeLabel(right.subtype), 'es');
    case 'system': return (left.systemDesignation ?? '').localeCompare(right.systemDesignation ?? '', 'es');
    case 'mass': return compareNullableNumber(left.massEarth, right.massEarth);
    case 'radius': return compareNullableNumber(left.radiusEarth, right.radiusEarth);
    case 'orbit': return compareNullableNumber(left.semiMajorAxisAu, right.semiMajorAxisAu);
    case 'period': return compareNullableNumber(left.orbitalPeriodDays, right.orbitalPeriodDays);
    case 'water': return compareNullableNumber(left.surfaceLiquidWaterCoverageFraction01, right.surfaceLiquidWaterCoverageFraction01);
    case 'temperature': return compareNullableNumber(left.meanSurfaceTemperatureKelvin, right.meanSurfaceTemperatureKelvin);
    case 'sector': return compareBigInt(left.parentSystemLocator.sectorKey, right.parentSystemLocator.sectorKey);
    case 'locator': return left.id.localeCompare(right.id, 'en');
    default: return 0;
  }
}

function compareMoons(
  left: GalaxyKnowledgeMoonCatalogEntry,
  right: GalaxyKnowledgeMoonCatalogEntry,
  sortKey: string,
  direction: GalaxyKnowledgeCatalogDirection,
): number {
  const factor = direction === 'desc' ? -1 : 1;
  const difference = compareMoonByKey(left, right, sortKey);
  if (difference !== 0) return difference * factor;
  return left.id.localeCompare(right.id, 'en');
}

function compareMoonByKey(
  left: GalaxyKnowledgeMoonCatalogEntry,
  right: GalaxyKnowledgeMoonCatalogEntry,
  sortKey: string,
): number {
  switch (sortKey) {
    case 'designation': return left.designation.localeCompare(right.designation, 'es', { sensitivity: 'base' });
    case 'composition': return moonCompositionLabel(left.composition).localeCompare(moonCompositionLabel(right.composition), 'es');
    case 'planet': return left.hostPlanetDesignation.localeCompare(right.hostPlanetDesignation, 'es');
    case 'system': return left.systemDesignation.localeCompare(right.systemDesignation, 'es');
    case 'mass': return left.massEarth - right.massEarth;
    case 'radius': return left.radiusEarth - right.radiusEarth;
    case 'period': return left.orbitalPeriodDays - right.orbitalPeriodDays;
    case 'ice': return left.inferredIceRichnessIndex01 - right.inferredIceRichnessIndex01;
    case 'surface-water': return left.surfaceLiquidWaterPotentialIndex01 - right.surfaceLiquidWaterPotentialIndex01;
    case 'subsurface-ocean': return left.subsurfaceOceanPotentialIndex01 - right.subsurfaceOceanPotentialIndex01;
    case 'sector': return compareBigInt(left.parentSystemLocator.sectorKey, right.parentSystemLocator.sectorKey);
    case 'locator': return left.id.localeCompare(right.id, 'en');
    default: return 0;
  }
}

function compareNullableNumber(left: number | null, right: number | null): number {
  // Missing scientific data sorts below every measured value, including a real zero.
  // The direction factor applied by comparePlanets then keeps missing values first in
  // ascending order and last in descending order without conflating null with 0.
  if (left === null && right === null) return 0;
  if (left === null) return -1;
  if (right === null) return 1;
  return left - right;
}

function compareBigInt(left: bigint, right: bigint): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function normalizePlanetSubtype(value: string | null): PlanetCatalogFilter | null {
  if (value === null) return null;
  if ((PLANET_SUBTYPES as readonly string[]).includes(value)) return value as PlanetCatalogFilter;
  throw new RangeError('El subtipo planetario indicado no está soportado por 26.1c.3.');
}

function normalizeMoonSubtype(value: string | null): MoonCatalogFilter | null {
  if (value === null) return null;
  if ((MOON_SUBTYPES as readonly string[]).includes(value)) return value as MoonCatalogFilter;
  throw new RangeError('El subtipo lunar indicado no está soportado por 26.1c.3.');
}

function planetFilterTitle(subtype: PlanetCatalogFilter): string {
  switch (subtype) {
    case PlanetType.ROCKY: return 'Planetas rocosos';
    case PlanetType.SUPER_EARTH: return 'Supertierras';
    case PlanetType.DESERT: return 'Planetas desérticos';
    case PlanetType.OCEAN: return 'Planetas oceánicos';
    case PlanetType.ICE: return 'Planetas helados';
    case PlanetType.VOLCANIC: return 'Planetas volcánicos';
    case PlanetType.MINI_NEPTUNE: return 'Mini-Neptunos';
    case PlanetType.GAS_GIANT: return 'Gigantes gaseosos';
    case PlanetType.ICE_GIANT: return 'Gigantes helados';
    case 'POST_COLLAPSE_MODEL': return 'Planetas del modelo post-colapso';
    case 'WATER_20_PLUS': return 'Planetas con ≥20 % de agua líquida superficial';
    case 'UNCLASSIFIED': return 'Planetas sin clasificación física disponible';
  }
}

function planetFilterLabel(subtype: PlanetCatalogFilter): string {
  if (subtype === 'WATER_20_PLUS') return 'Agua líquida ≥20 %';
  return planetSubtypeLabel(subtype);
}

function planetSubtypeLabel(subtype: GalaxyKnowledgePlanetCatalogEntry['subtype']): string {
  switch (subtype) {
    case PlanetType.ROCKY: return 'Rocoso';
    case PlanetType.SUPER_EARTH: return 'Supertierra';
    case PlanetType.DESERT: return 'Desértico';
    case PlanetType.OCEAN: return 'Oceánico';
    case PlanetType.ICE: return 'Helado';
    case PlanetType.VOLCANIC: return 'Volcánico';
    case PlanetType.MINI_NEPTUNE: return 'Mini-Neptuno';
    case PlanetType.GAS_GIANT: return 'Gigante gaseoso';
    case PlanetType.ICE_GIANT: return 'Gigante helado';
    case 'POST_COLLAPSE_MODEL': return 'Post-colapso';
    case 'UNCLASSIFIED': return 'Sin clasificar';
  }
}

function moonFilterTitle(subtype: MoonCatalogFilter): string {
  switch (subtype) {
    case 'ROCKY': return 'Lunas rocosas';
    case 'MIXED_ROCK_ICE': return 'Lunas mixtas roca/hielo';
    case 'ICY': return 'Lunas heladas';
    case 'SURFACE_LIQUID_40_PLUS': return 'Lunas con ≥40 % de potencial de agua líquida superficial';
    case 'SUBSURFACE_OCEAN': return 'Lunas con evidencia de océano subsuperficial';
    case 'UNCLASSIFIED': return 'Lunas sin clasificación física disponible';
  }
}

function moonFilterLabel(subtype: MoonCatalogFilter): string {
  switch (subtype) {
    case 'SURFACE_LIQUID_40_PLUS': return 'Agua superficial ≥40 %';
    case 'SUBSURFACE_OCEAN': return 'Océano subsuperficial';
    default: return moonCompositionLabel(subtype);
  }
}

function moonCompositionLabel(subtype: GalaxyKnowledgeMoonCatalogEntry['composition']): string {
  switch (subtype) {
    case 'ROCKY': return 'Rocosa';
    case 'MIXED_ROCK_ICE': return 'Mixta roca/hielo';
    case 'ICY': return 'Helada';
    case 'UNCLASSIFIED': return 'Sin clasificar';
  }
}

function discoveryStateLabel(name: string): string {
  switch (name) {
    case 'DETECTED': return 'Detectado';
    case 'DISCOVERED': return 'Descubierto';
    case 'VISITED': return 'Visitado';
    case 'CATALOGUED': return 'Catalogado';
    case 'CONFIRMED': return 'Confirmado';
    default: return name;
  }
}

function stateCode(name: string): number {
  switch (name) {
    case 'DETECTED': return 1;
    case 'DISCOVERED': return 2;
    case 'VISITED': return 3;
    case 'CATALOGUED': return 4;
    case 'CONFIRMED': return 5;
    default: return 0;
  }
}

function formatEarth(value: number | null, unit: string): string | undefined {
  if (value === null || !Number.isFinite(value)) return undefined;
  return `${formatFinite(value)} ${unit}`;
}

function formatNumber(value: number | null, unit: string): string | undefined {
  if (value === null || !Number.isFinite(value)) return undefined;
  return `${formatFinite(value)} ${unit}`;
}

function formatFinite(value: number): string {
  return value.toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.abs(value) < 0.01 ? 5 : Math.abs(value) < 1 ? 3 : 2,
  });
}

function formatPercent(value: number | null): string | undefined {
  if (value === null || !Number.isFinite(value)) return undefined;
  return `${(value * 100).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} %`;
}
