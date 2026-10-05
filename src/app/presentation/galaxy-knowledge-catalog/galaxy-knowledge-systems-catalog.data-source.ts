import { inject, Injectable } from '@angular/core';

import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { DiscoveryTargetType } from '../../domain/discovery/discovery-target-type';
import { type KnownDiscovery } from '../../domain/discovery/known-discovery';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { type SystemSeed } from '../../domain/seed/hierarchical-seeds';
import {
  StellarSystemMultiplicity,
  type StellarSystemMultiplicityName,
} from '../../domain/stellar/stellar-system-multiplicity';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';
import { StellarDesignationGenerator } from '../../simulation/stellar/stellar-designation-generator';
import { multihostPhysicalSourceKey } from '../../simulation/stellar/stellar-multihost-physical-source-key';
import { StellarSystemMultiplicitySelector } from '../../simulation/stellar/stellar-system-multiplicity-selector';
import { GENESIS_LOCAL_REPOSITORIES } from '../runtime/genesis-local-repositories';
import { galaxyKnowledgeRevision } from '../runtime/galaxy-knowledge-snapshot.runtime';
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

const SYSTEM_SUBTYPES = Object.freeze([
  'SINGLE',
  'BINARY',
  'TRIPLE',
  'UNCLASSIFIED',
] as const);

type SystemSubtype = typeof SYSTEM_SUBTYPES[number];

interface KnownSystemCatalogRecord {
  readonly locator: SystemLocator;
  readonly discovery: KnownDiscovery;
  readonly designation: string | null;
  readonly multiplicity: StellarSystemMultiplicity | null;
}

interface KnownSystemCatalogHotRecords {
  readonly generationKey: UniverseGenerationKey;
  readonly galaxyIndex: bigint;
  readonly knowledgeRevision: string;
  readonly records: readonly KnownSystemCatalogRecord[];
}

@Injectable({ providedIn: 'root' })
export class GalaxyKnowledgeSystemsCatalogDataSource {
  private readonly repositories = inject(GENESIS_LOCAL_REPOSITORIES);
  private hotRecords: KnownSystemCatalogHotRecords | null = null;
  private readonly viewCache = new GalaxyKnowledgeCatalogViewCache<KnownSystemCatalogRecord>();

  describe(subtype: string | null): GalaxyKnowledgeCatalogDescriptor {
    const normalizedSubtype = normalizeSystemSubtype(subtype);
    const title = normalizedSubtype === null
      ? 'Sistemas conocidos'
      : normalizedSubtype === 'UNCLASSIFIED'
        ? 'Sistemas sin clasificar'
        : `Sistemas ${multiplicityLabelFromName(normalizedSubtype).toLowerCase()}s`;

    return Object.freeze({
      category: 'systems' as const,
      title,
      description:
        'Sistemas estelares presentes en el conocimiento persistido de la galaxia. La multiplicidad solo se revela desde Descubierto, igual que en la ficha científica.',
      identityLabel: 'SISTEMA',
      filterLabel: normalizedSubtype === null
        ? 'TODOS'
        : normalizedSubtype === 'UNCLASSIFIED'
          ? 'Sin clasificar'
          : multiplicityLabelFromName(normalizedSubtype),
      sortOptions: Object.freeze([
        Object.freeze({ key: 'designation', label: 'Nombre / designación' }),
        Object.freeze({ key: 'state', label: 'Estado científico' }),
        Object.freeze({ key: 'multiplicity', label: 'Tipo de sistema' }),
        Object.freeze({ key: 'components', label: 'Número de estrellas' }),
        Object.freeze({ key: 'sector', label: 'Sector' }),
        Object.freeze({ key: 'locator', label: 'Localización procedural' }),
      ]),
      defaultSortKey: 'designation',
      columns: Object.freeze([
        Object.freeze({ key: 'state', label: 'ESTADO' }),
        Object.freeze({ key: 'multiplicity', label: 'TIPO' }),
        Object.freeze({ key: 'components', label: 'ESTRELLAS', align: 'end' as const }),
        Object.freeze({ key: 'sector', label: 'SECTOR', align: 'end' as const }),
      ]),
    });
  }

  async query(
    request: GalaxyKnowledgeCatalogDataRequest,
  ): Promise<GalaxyKnowledgeCatalogDataResult> {
    if (request.query.category !== 'systems') {
      return Object.freeze({ kind: 'not-connected' });
    }

    const subtype = normalizeSystemSubtype(request.query.subtype);
    const discoveries = await this.loadGalaxySystems(
      request.generationKey,
      request.galaxyIndex,
    );

    const records = this.viewCache.resolve(
      this.recordsFor(
        request.generationKey,
        request.galaxyIndex,
        discoveries,
      ),
      galaxyKnowledgeCatalogViewKey(
        subtype,
        request.query.sortKey,
        request.query.direction,
      ),
      record =>
        subtype === null
        || (subtype === 'UNCLASSIFIED'
          ? record.multiplicity === null
          : record.multiplicity?.name === subtype),
      (left, right) =>
        compareRecords(left, right, request.query.sortKey, request.query.direction),
    );

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
        items: Object.freeze(selected.map(record => toRow(record))),
      }),
    });
  }

  private recordsFor(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    discoveries: readonly KnownDiscovery[],
  ): readonly KnownSystemCatalogRecord[] {
    const knowledgeRevision = galaxyKnowledgeRevision(galaxyIndex, discoveries);
    const cached = this.hotRecords;
    if (
      cached !== null &&
      cached.galaxyIndex === galaxyIndex &&
      cached.knowledgeRevision === knowledgeRevision &&
      cached.generationKey.equals(generationKey)
    ) {
      return cached.records;
    }

    const records = Object.freeze(
      discoveries
        .filter((discovery): discovery is KnownDiscovery & { readonly locator: SystemLocator } =>
          discovery.locator instanceof SystemLocator,
        )
        .map(discovery => systemRecord(generationKey, discovery)),
    );

    this.hotRecords = Object.freeze({
      generationKey: generationKey.copy(),
      galaxyIndex,
      knowledgeRevision,
      records,
    });
    return records;
  }

  private async loadGalaxySystems(
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

    // Compatibility fallback for alternate repositories/test doubles. Production
    // Dexie uses the galaxy-scoped indexed path above.
    return (await repository.getKnownDiscoveries(generationKey)).filter(discovery =>
      discovery.locator instanceof SystemLocator &&
      discovery.locator.galaxyIndex === galaxyIndex,
    );
  }
}

function systemRecord(
  generationKey: UniverseGenerationKey,
  discovery: KnownDiscovery & { readonly locator: SystemLocator },
): KnownSystemCatalogRecord {
  if (discovery.state.code < DiscoveryState.DISCOVERED.code) {
    return Object.freeze({
      locator: discovery.locator,
      discovery,
      designation: null,
      multiplicity: null,
    });
  }

  const physicalKey = multihostPhysicalSourceKey(generationKey);
  const systemSeed = ProceduralTargetResolver.resolveTargetSeed(
    physicalKey,
    discovery.locator,
  ) as SystemSeed;
  const designation = StellarDesignationGenerator.generate(
    physicalKey,
    discovery.locator,
  );
  const multiplicity = StellarSystemMultiplicitySelector.select(
    physicalKey,
    systemSeed,
  );

  return Object.freeze({
    locator: discovery.locator,
    discovery,
    designation: designation.name,
    multiplicity,
  });
}

function toRow(record: KnownSystemCatalogRecord): GalaxyKnowledgeCatalogRow {
  const locatorLabel = systemLocatorLabel(record.locator);
  const title = record.designation ?? 'Sistema detectado';
  const multiplicity = record.multiplicity;

  return Object.freeze({
    id: locatorLabel,
    title,
    subtitle: locatorLabel,
    cells: Object.freeze({
      state: discoveryStateLabel(record.discovery.state.name),
      multiplicity: multiplicity === null ? 'Sin clasificar' : multiplicityLabel(multiplicity),
      components: multiplicity === null ? undefined : multiplicity.stellarComponentCount.toLocaleString('es-ES'),
      sector: record.locator.sectorKey.toLocaleString('es-ES'),
    }),
    actions: Object.freeze([
      Object.freeze({
        label: 'Abrir ficha científica',
        route: Object.freeze([
          '/archive/system',
          record.locator.galaxyIndex.toString(10),
          record.locator.sectorKey.toString(10),
          record.locator.galacticObjectIndex.toString(10),
        ]),
        emphasis: 'primary' as const,
      }),
      Object.freeze({
        label: 'Ir al sistema',
        route: Object.freeze([
          '/system',
          record.locator.galaxyIndex.toString(10),
          record.locator.sectorKey.toString(10),
          record.locator.galacticObjectIndex.toString(10),
        ]),
      }),
    ]),
  });
}

function compareRecords(
  left: KnownSystemCatalogRecord,
  right: KnownSystemCatalogRecord,
  sortKey: string,
  direction: GalaxyKnowledgeCatalogDirection,
): number {
  const factor = direction === 'desc' ? -1 : 1;
  const difference = compareByKey(left, right, sortKey);
  if (difference !== 0) return difference * factor;
  return compareLocator(left.locator, right.locator);
}

function compareByKey(
  left: KnownSystemCatalogRecord,
  right: KnownSystemCatalogRecord,
  sortKey: string,
): number {
  switch (sortKey) {
    case 'designation':
      return (left.designation ?? '').localeCompare(right.designation ?? '', 'es', { sensitivity: 'base' });
    case 'state':
      return left.discovery.state.code - right.discovery.state.code;
    case 'multiplicity':
    case 'components':
      return (left.multiplicity?.stellarComponentCount ?? 0) -
        (right.multiplicity?.stellarComponentCount ?? 0);
    case 'sector':
      return compareBigInt(left.locator.sectorKey, right.locator.sectorKey);
    case 'locator':
      return compareLocator(left.locator, right.locator);
    default:
      return 0;
  }
}

function compareLocator(left: SystemLocator, right: SystemLocator): number {
  const sector = compareBigInt(left.sectorKey, right.sectorKey);
  if (sector !== 0) return sector;
  return compareBigInt(left.galacticObjectIndex, right.galacticObjectIndex);
}

function compareBigInt(left: bigint, right: bigint): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function normalizeSystemSubtype(value: string | null): SystemSubtype | null {
  if (value === null) return null;
  if ((SYSTEM_SUBTYPES as readonly string[]).includes(value)) {
    return value as SystemSubtype;
  }
  throw new RangeError('El subtipo de sistemas debe ser SINGLE, BINARY, TRIPLE o UNCLASSIFIED.');
}

function multiplicityLabel(multiplicity: StellarSystemMultiplicity): string {
  return multiplicityLabelFromName(multiplicity.name);
}

function multiplicityLabelFromName(name: StellarSystemMultiplicityName): string {
  switch (name) {
    case 'SINGLE': return 'Simple';
    case 'BINARY': return 'Binario';
    case 'TRIPLE': return 'Triple';
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

function systemLocatorLabel(locator: SystemLocator): string {
  return [
    `G${locator.galaxyIndex.toString(10)}`,
    `S${locator.sectorKey.toString(10)}`,
    `O${locator.galacticObjectIndex.toString(10)}`,
  ].join(' / ');
}
