import { inject, Injectable } from '@angular/core';

import { AsteroidCompositionRegime } from '../../domain/planetary/asteroid-composition-regime';
import { AsteroidMultiplicityRegime } from '../../domain/planetary/asteroid-multiplicity-regime';
import { AsteroidStructureRegime } from '../../domain/planetary/asteroid-structure-regime';
import { CapturedExtrasolarObjectCaptureRegime } from '../../domain/planetary/captured-extrasolar-object-capture-regime';
import { CapturedExtrasolarObjectCompositionRegime } from '../../domain/planetary/captured-extrasolar-object-composition-regime';
import { CometPeriodRegime } from '../../domain/planetary/comet-period-regime';
import { TransNeptunianObjectDynamicalRegime } from '../../domain/planetary/trans-neptunian-object-dynamical-regime';
import { DiscoveryTargetType } from '../../domain/discovery/discovery-target-type';
import { type KnownDiscovery } from '../../domain/discovery/known-discovery';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GENESIS_LOCAL_REPOSITORIES } from '../runtime/genesis-local-repositories';
import {
  GALAXY_MINOR_BODY_CATALOG_SNAPSHOT_RUNTIME,
  type GalaxyKnowledgeMinorBodyCatalogEntry,
  type GalaxyKnowledgeMinorBodyCatalogSnapshot,
} from '../runtime/galaxy-minor-body-catalog-snapshot.runtime';
import {
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

export type MinorBodyCatalogCategory = 'asteroids' | 'comets' | 'tno' | 'captured';

const ASTEROID_FILTERS = Object.freeze([
  ...Object.values(AsteroidCompositionRegime),
  ...Object.values(AsteroidStructureRegime),
  ...Object.values(AsteroidMultiplicityRegime),
] as string[]);

const COMET_FILTERS = Object.freeze(Object.values(CometPeriodRegime));
const TNO_FILTERS = Object.freeze([
  ...Object.values(TransNeptunianObjectDynamicalRegime),
  'DWARF_PLANET_SCALE',
] as string[]);
const CAPTURED_FILTERS = Object.freeze([
  ...Object.values(CapturedExtrasolarObjectCompositionRegime),
  ...Object.values(CapturedExtrasolarObjectCaptureRegime),
] as string[]);

@Injectable({ providedIn: 'root' })
export class GalaxyKnowledgeMinorBodiesCatalogDataSource {
  private readonly repositories = inject(GENESIS_LOCAL_REPOSITORIES);
  private readonly snapshotRuntime = inject(GALAXY_MINOR_BODY_CATALOG_SNAPSHOT_RUNTIME);
  private readonly viewCache = new GalaxyKnowledgeCatalogViewCache<GalaxyKnowledgeMinorBodyCatalogEntry>();

  describe(
    category: MinorBodyCatalogCategory,
    subtype: string | null,
  ): GalaxyKnowledgeCatalogDescriptor {
    const normalized = normalizeSubtype(category, subtype);
    switch (category) {
      case 'asteroids': return asteroidDescriptor(normalized);
      case 'comets': return cometDescriptor(normalized);
      case 'tno': return tnoDescriptor(normalized);
      case 'captured': return capturedDescriptor(normalized);
    }
  }

  async query(
    request: GalaxyKnowledgeCatalogDataRequest,
  ): Promise<GalaxyKnowledgeCatalogDataResult> {
    const category = request.query.category;
    if (!isMinorBodyCategory(category)) {
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
    const records = this.viewCache.resolve(
      recordsFor(snapshot, category),
      galaxyKnowledgeCatalogViewKey(
        request.query.subtype,
        request.query.sortKey,
        request.query.direction,
      ),
      record => matchesSubtype(category, record, request.query.subtype),
      (left, right) => compareRecords(
        left,
        right,
        request.query.sortKey,
        request.query.direction,
      ),
    );

    return paginated(records, request, record => toRow(category, record));
  }

  private async loadGalaxyKnowledge(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
  ): Promise<readonly KnownDiscovery[]> {
    const repository = this.repositories.discoveryRepository;
    if (repository.getKnownDiscoveriesInGalaxy !== undefined) {
      return repository.getKnownDiscoveriesInGalaxy(
        generationKey,
        galaxyIndex,
        DiscoveryTargetType.SYSTEM.code,
      );
    }
    return (await repository.getKnownDiscoveries(generationKey)).filter(
      discovery =>
        discovery.locator instanceof SystemLocator &&
        discovery.locator.galaxyIndex === galaxyIndex,
    );
  }
}

function asteroidDescriptor(subtype: string | null): GalaxyKnowledgeCatalogDescriptor {
  return Object.freeze({
    category: 'asteroids' as const,
    title: subtype === null ? 'Asteroides conocidos' : `Asteroides · ${subtypeLabel(subtype)}`,
    description:
      'Asteroides relevantes individualmente materializados en sistemas confirmados. El catálogo no convierte la población estadística completa de los cinturones en objetos ficticios.',
    identityLabel: 'ASTEROIDE',
    filterLabel: subtype === null ? 'TODOS' : subtypeLabel(subtype),
    sortOptions: commonSortOptions([
      ['subtype', 'Composición / clase'],
      ['diameter', 'Diámetro'],
      ['semi-major-axis', 'Semieje mayor'],
      ['eccentricity', 'Excentricidad'],
      ['inclination', 'Inclinación'],
      ['periapsis', 'Periapsis'],
      ['density', 'Densidad'],
      ['albedo', 'Albedo'],
      ['ice', 'Fracción de hielo'],
    ]),
    defaultSortKey: 'designation',
    columns: Object.freeze([
      Object.freeze({ key: 'system', label: 'SISTEMA' }),
      Object.freeze({ key: 'host', label: 'HOST' }),
      Object.freeze({ key: 'subtype', label: 'CLASE' }),
      Object.freeze({ key: 'diameter', label: 'DIÁMETRO', align: 'end' as const }),
      Object.freeze({ key: 'orbit', label: 'ÓRBITA', align: 'end' as const }),
      Object.freeze({ key: 'eccentricity', label: 'EXCENTRICIDAD', align: 'end' as const }),
    ]),
  });
}

function cometDescriptor(subtype: string | null): GalaxyKnowledgeCatalogDescriptor {
  return Object.freeze({
    category: 'comets' as const,
    title: subtype === null ? 'Cometas conocidos' : `Cometas · ${subtypeLabel(subtype)}`,
    description:
      'Núcleos cometarios relevantes de sistemas confirmados, con su órbita física congelada y clasificación por período.',
    identityLabel: 'COMETA',
    filterLabel: subtype === null ? 'TODOS' : subtypeLabel(subtype),
    sortOptions: commonSortOptions([
      ['subtype', 'Régimen de período'],
      ['diameter', 'Diámetro'],
      ['period', 'Período orbital'],
      ['semi-major-axis', 'Semieje mayor'],
      ['eccentricity', 'Excentricidad'],
      ['inclination', 'Inclinación'],
      ['periapsis', 'Perihelio'],
      ['apoapsis', 'Afelio'],
      ['volatile', 'Riqueza volátil'],
    ]),
    defaultSortKey: 'designation',
    columns: Object.freeze([
      Object.freeze({ key: 'system', label: 'SISTEMA' }),
      Object.freeze({ key: 'host', label: 'HOST' }),
      Object.freeze({ key: 'subtype', label: 'PERÍODO' }),
      Object.freeze({ key: 'diameter', label: 'DIÁMETRO', align: 'end' as const }),
      Object.freeze({ key: 'periapsis', label: 'PERIHELIO', align: 'end' as const }),
      Object.freeze({ key: 'eccentricity', label: 'EXCENTRICIDAD', align: 'end' as const }),
    ]),
  });
}

function tnoDescriptor(subtype: string | null): GalaxyKnowledgeCatalogDescriptor {
  return Object.freeze({
    category: 'tno' as const,
    title: subtype === null ? 'Objetos transneptunianos conocidos' : `TNO · ${subtypeLabel(subtype)}`,
    description:
      'Objetos transneptunianos relevantes de sistemas confirmados. Solo se listan identidades físicas individualmente materializadas.',
    identityLabel: 'TNO',
    filterLabel: subtype === null ? 'TODOS' : subtypeLabel(subtype),
    sortOptions: commonSortOptions([
      ['subtype', 'Régimen dinámico'],
      ['diameter', 'Diámetro'],
      ['period', 'Período orbital'],
      ['semi-major-axis', 'Semieje mayor'],
      ['eccentricity', 'Excentricidad'],
      ['inclination', 'Inclinación'],
      ['periapsis', 'Perihelio'],
      ['ice', 'Fracción de hielo'],
      ['density', 'Densidad'],
    ]),
    defaultSortKey: 'designation',
    columns: Object.freeze([
      Object.freeze({ key: 'system', label: 'SISTEMA' }),
      Object.freeze({ key: 'host', label: 'HOST' }),
      Object.freeze({ key: 'subtype', label: 'RÉGIMEN' }),
      Object.freeze({ key: 'diameter', label: 'DIÁMETRO', align: 'end' as const }),
      Object.freeze({ key: 'orbit', label: 'ÓRBITA', align: 'end' as const }),
      Object.freeze({ key: 'ice', label: 'HIELO', align: 'end' as const }),
    ]),
  });
}

function capturedDescriptor(subtype: string | null): GalaxyKnowledgeCatalogDescriptor {
  return Object.freeze({
    category: 'captured' as const,
    title: subtype === null ? 'Objetos capturados conocidos' : `Capturados · ${subtypeLabel(subtype)}`,
    description:
      'Objetos de origen extrasolar capturados de forma permanente y materializados individualmente en sistemas confirmados.',
    identityLabel: 'CAPTURADO',
    filterLabel: subtype === null ? 'TODOS' : subtypeLabel(subtype),
    sortOptions: commonSortOptions([
      ['subtype', 'Composición / captura'],
      ['diameter', 'Diámetro'],
      ['period', 'Período orbital'],
      ['semi-major-axis', 'Semieje mayor'],
      ['eccentricity', 'Excentricidad'],
      ['inclination', 'Inclinación'],
      ['periapsis', 'Periapsis'],
      ['incoming-velocity', 'Velocidad hiperbólica de llegada'],
      ['volatile', 'Fracción volátil'],
    ]),
    defaultSortKey: 'designation',
    columns: Object.freeze([
      Object.freeze({ key: 'system', label: 'SISTEMA' }),
      Object.freeze({ key: 'host', label: 'HOST' }),
      Object.freeze({ key: 'subtype', label: 'COMPOSICIÓN' }),
      Object.freeze({ key: 'capture', label: 'CAPTURA' }),
      Object.freeze({ key: 'diameter', label: 'DIÁMETRO', align: 'end' as const }),
      Object.freeze({ key: 'orbit', label: 'ÓRBITA', align: 'end' as const }),
    ]),
  });
}

function commonSortOptions(extra: readonly (readonly [string, string])[]) {
  return Object.freeze([
    Object.freeze({ key: 'designation', label: 'Nombre / designación' }),
    Object.freeze({ key: 'system', label: 'Sistema anfitrión' }),
    Object.freeze({ key: 'host', label: 'Componente anfitrión' }),
    ...extra.map(([key, label]) => Object.freeze({ key, label })),
    Object.freeze({ key: 'sector', label: 'Sector' }),
    Object.freeze({ key: 'locator', label: 'Localización procedural' }),
  ]);
}

function recordsFor(
  snapshot: GalaxyKnowledgeMinorBodyCatalogSnapshot,
  category: MinorBodyCatalogCategory,
): GalaxyKnowledgeMinorBodyCatalogEntry[] {
  switch (category) {
    case 'asteroids': return [...snapshot.asteroids];
    case 'comets': return [...snapshot.comets];
    case 'tno': return [...snapshot.transNeptunianObjects];
    case 'captured': return [...snapshot.capturedObjects];
  }
}

function matchesSubtype(
  category: MinorBodyCatalogCategory,
  record: GalaxyKnowledgeMinorBodyCatalogEntry,
  subtype: string | null,
): boolean {
  const filter = normalizeSubtype(category, subtype);
  if (filter === null) return true;
  return record.subtype === filter || record.secondarySubtype === filter || record.tertiarySubtype === filter;
}

function normalizeSubtype(category: MinorBodyCatalogCategory, subtype: string | null): string | null {
  if (subtype === null) return null;
  const values = category === 'asteroids'
    ? ASTEROID_FILTERS
    : category === 'comets'
      ? COMET_FILTERS
      : category === 'tno'
        ? TNO_FILTERS
        : CAPTURED_FILTERS;
  if (values.includes(subtype)) return subtype;
  throw new RangeError(`El subtipo indicado no es válido para ${category}.`);
}

function paginated(
  records: readonly GalaxyKnowledgeMinorBodyCatalogEntry[],
  request: GalaxyKnowledgeCatalogDataRequest,
  row: (record: GalaxyKnowledgeMinorBodyCatalogEntry) => GalaxyKnowledgeCatalogRow,
): GalaxyKnowledgeCatalogDataResult {
  const totalItems = records.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / request.query.pageSize));
  const page = Math.min(Math.max(1, request.query.page), totalPages);
  const start = (page - 1) * request.query.pageSize;
  return Object.freeze({
    kind: 'page' as const,
    page: Object.freeze({
      totalItems,
      page,
      pageSize: request.query.pageSize,
      totalPages,
      items: Object.freeze(records.slice(start, start + request.query.pageSize).map(row)),
    }),
  });
}

function toRow(
  category: MinorBodyCatalogCategory,
  record: GalaxyKnowledgeMinorBodyCatalogEntry,
): GalaxyKnowledgeCatalogRow {
  const kind = category === 'asteroids' ? 'asteroid'
    : category === 'comets' ? 'comet'
      : category === 'tno' ? 'tno'
        : 'captured';
  return Object.freeze({
    id: record.id,
    title: record.designation,
    subtitle: `${systemLocatorLabel(record.parentSystemLocator)} / ${record.proceduralId}`,
    cells: Object.freeze({
      system: record.systemDesignation,
      host: record.hostLabel,
      subtype: subtypeLabel(record.subtype),
      capture: record.secondarySubtype === null ? undefined : subtypeLabel(record.secondarySubtype),
      diameter: formatNumber(record.diameterKilometers, 'km'),
      orbit: formatNumber(record.semiMajorAxisAu, 'UA'),
      eccentricity: formatPlain(record.eccentricity, 4),
      periapsis: formatNumber(record.periapsisAu, 'UA'),
      ice: formatPercent(record.volatileOrIceFraction01),
    }),
    actions: Object.freeze([
      Object.freeze({
        label: 'Abrir ficha científica',
        route: Object.freeze([
          '/system',
          record.parentSystemLocator.galaxyIndex.toString(10),
          record.parentSystemLocator.sectorKey.toString(10),
          record.parentSystemLocator.galacticObjectIndex.toString(10),
          'minor-body',
          kind,
          record.proceduralId,
        ]),
        emphasis: 'primary' as const,
      }),
      Object.freeze({
        label: 'Abrir sistema anfitrión',
        route: Object.freeze([
          '/system',
          record.parentSystemLocator.galaxyIndex.toString(10),
          record.parentSystemLocator.sectorKey.toString(10),
          record.parentSystemLocator.galacticObjectIndex.toString(10),
        ]),
      }),
    ]),
  });
}

function compareRecords(
  left: GalaxyKnowledgeMinorBodyCatalogEntry,
  right: GalaxyKnowledgeMinorBodyCatalogEntry,
  key: string,
  direction: GalaxyKnowledgeCatalogDirection,
): number {
  const factor = direction === 'desc' ? -1 : 1;
  const difference = (() => {
    switch (key) {
      case 'designation': return left.designation.localeCompare(right.designation, 'es', { sensitivity: 'base' });
      case 'system': return left.systemDesignation.localeCompare(right.systemDesignation, 'es', { sensitivity: 'base' });
      case 'host': return left.hostLabel.localeCompare(right.hostLabel, 'en');
      case 'subtype': return left.subtype.localeCompare(right.subtype, 'en');
      case 'diameter': return left.diameterKilometers - right.diameterKilometers;
      case 'period': return compareNullableNumber(left.orbitalPeriodYears, right.orbitalPeriodYears);
      case 'semi-major-axis': return left.semiMajorAxisAu - right.semiMajorAxisAu;
      case 'eccentricity': return left.eccentricity - right.eccentricity;
      case 'inclination': return left.inclinationDegrees - right.inclinationDegrees;
      case 'periapsis': return left.periapsisAu - right.periapsisAu;
      case 'apoapsis': return left.apoapsisAu - right.apoapsisAu;
      case 'density': return compareNullableNumber(left.densityGramsPerCubicCentimeter, right.densityGramsPerCubicCentimeter);
      case 'albedo': return compareNullableNumber(left.albedo01, right.albedo01);
      case 'ice':
      case 'volatile': return compareNullableNumber(left.volatileOrIceFraction01, right.volatileOrIceFraction01);
      case 'incoming-velocity': return compareNullableNumber(left.incomingVelocityKmPerSecond, right.incomingVelocityKmPerSecond);
      case 'sector': return compareBigInt(left.parentSystemLocator.sectorKey, right.parentSystemLocator.sectorKey);
      case 'locator': return compareSystemLocator(left.parentSystemLocator, right.parentSystemLocator);
      default: return 0;
    }
  })();
  return difference !== 0 ? difference * factor : left.id.localeCompare(right.id, 'en');
}

function compareNullableNumber(left: number | null, right: number | null): number {
  if (left === null && right === null) return 0;
  if (left === null) return -1;
  if (right === null) return 1;
  return left - right;
}

function isMinorBodyCategory(value: string): value is MinorBodyCatalogCategory {
  return value === 'asteroids' || value === 'comets' || value === 'tno' || value === 'captured';
}

function subtypeLabel(value: string): string {
  const labels: Readonly<Record<string, string>> = Object.freeze({
    CARBONACEOUS: 'Carbonáceo',
    SILICACEOUS: 'Silíceo',
    METALLIC: 'Metálico',
    ICE_RICH: 'Rico en hielo',
    MIXED_ROCK_ICE: 'Roca / hielo',
    COHERENT: 'Coherente',
    FRACTURED: 'Fracturado',
    RUBBLE_PILE: 'Pila de escombros',
    CONTACT_BINARY: 'Binario de contacto',
    SINGLE: 'Simple',
    BINARY: 'Binario',
    INNER: 'Cinturón interior',
    OUTER: 'Cinturón exterior',
    SHORT_PERIOD: 'Período corto',
    LONG_PERIOD: 'Período largo',
    COLD_CLASSICAL: 'Clásico frío',
    HOT_CLASSICAL: 'Clásico caliente',
    RESONANT: 'Resonante',
    SCATTERED: 'Disperso',
    DETACHED: 'Desacoplado',
    DWARF_PLANET_SCALE: 'Escala planeta enano',
    ROCK_DOMINATED: 'Dominado por roca',
    MIXED: 'Mixto',
    VOLATILE_RICH: 'Rico en volátiles',
    PLANETARY_SCATTERING: 'Dispersión planetaria',
    BINARY_EXCHANGE: 'Intercambio binario',
    COMBINED_MULTIBODY: 'Interacción multicuerpo',
  });
  return labels[value] ?? value.replaceAll('_', ' ');
}

function formatNumber(value: number | null, unit: string, maximumFractionDigits = 3): string | undefined {
  if (value === null) return undefined;
  return `${value.toLocaleString('es-ES', { maximumFractionDigits })} ${unit}`;
}

function formatPlain(value: number | null, maximumFractionDigits: number): string | undefined {
  if (value === null) return undefined;
  return value.toLocaleString('es-ES', { maximumFractionDigits });
}

function formatPercent(value: number | null): string | undefined {
  if (value === null) return undefined;
  return `${(value * 100).toLocaleString('es-ES', { maximumFractionDigits: 1 })} %`;
}

function systemLocatorLabel(locator: GalaxyKnowledgeMinorBodyCatalogEntry['parentSystemLocator']): string {
  return `G${locator.galaxyIndex} / S${locator.sectorKey} / O${locator.galacticObjectIndex}`;
}

function compareSystemLocator(
  left: GalaxyKnowledgeMinorBodyCatalogEntry['parentSystemLocator'],
  right: GalaxyKnowledgeMinorBodyCatalogEntry['parentSystemLocator'],
): number {
  const sector = compareBigInt(left.sectorKey, right.sectorKey);
  if (sector !== 0) return sector;
  return compareBigInt(left.galacticObjectIndex, right.galacticObjectIndex);
}

function compareBigInt(left: bigint, right: bigint): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
