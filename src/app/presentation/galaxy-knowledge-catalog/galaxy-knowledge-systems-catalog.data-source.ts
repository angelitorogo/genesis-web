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
import { StellarSupernovaScientificIntegration } from '../runtime/stellar-supernova-scientific-integration';
import { StellarSupernovaScientificPresentationAssembler } from '../runtime/stellar-supernova-scientific-presentation';
import { StellarNovaScientificIntegration } from '../runtime/stellar-nova-scientific-integration';
import { StellarNovaScientificPresentationAssembler } from '../runtime/stellar-nova-scientific-presentation';
import { StellarKilonovaScientificIntegration } from '../runtime/stellar-kilonova-scientific-integration';
import { StellarKilonovaScientificPresentationAssembler } from '../runtime/stellar-kilonova-scientific-presentation';
import { StellarCompactMergerScientificIntegration } from '../runtime/stellar-compact-merger-scientific-integration';
import { StellarCompactMergerScientificPresentationAssembler } from '../runtime/stellar-compact-merger-scientific-presentation';
import { galaxyKnowledgeRevision } from '../runtime/galaxy-knowledge-snapshot.runtime';
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
  private readonly supernovaLabelCache = new Map<string, Promise<string>>();
  private readonly novaLabelCache = new Map<string, Promise<string>>();
  private readonly kilonovaLabelCache = new Map<string, Promise<string>>();
  private readonly compactMergerLabelCache = new Map<string, Promise<string>>();

  describe(subtype: string | null): GalaxyKnowledgeCatalogDescriptor {
    const normalizedSubtype = normalizeSystemSubtype(subtype);
    const title = normalizedSubtype === null
      ? 'Sistemas conocidos'
      : normalizedSubtype === 'UNCLASSIFIED'
        ? 'Sistemas sin clasificar'
        : `Sistemas ${multiplicityLabelFromName(normalizedSubtype).toLowerCase()}s`;

    return defineGalaxyKnowledgeCatalogDescriptor({
      category: 'systems' as const,
      title,
      description:
        'Sistemas estelares presentes en el conocimiento persistido de la galaxia. La multiplicidad se revela desde Descubierto y los canales transitorios de supernova, nova, kilonova y fusión compacta desde Catalogado, igual que en la ficha científica.',
      filterLabel: normalizedSubtype === null
        ? 'TODOS'
        : normalizedSubtype === 'UNCLASSIFIED'
          ? 'Sin clasificar'
          : multiplicityLabelFromName(normalizedSubtype),
      fields: Object.freeze([
        galaxyKnowledgeCatalogIdentityField('designation', 'Nombre / designación', 'SISTEMA'),
        galaxyKnowledgeCatalogField('state', 'Estado científico', {
          columnLabel: 'ESTADO', defaultVisible: true,
        }),
        galaxyKnowledgeCatalogField('multiplicity', 'Tipo de sistema', {
          columnLabel: 'TIPO', defaultVisible: true,
        }),
        galaxyKnowledgeCatalogField('components', 'Número de estrellas', {
          columnLabel: 'ESTRELLAS', defaultVisible: true, align: 'end',
        }),
        galaxyKnowledgeCatalogField('supernova', 'Supernova / linaje', {
          columnLabel: 'SUPERNOVA / LINAJE', defaultVisible: true,
        }),
        galaxyKnowledgeCatalogField('nova', 'Nova / acreción WD', {
          columnLabel: 'NOVA / ACRECIÓN WD', defaultVisible: true,
        }),
        galaxyKnowledgeCatalogField('kilonova', 'Kilonova / contraparte EM', {
          columnLabel: 'KILONOVA', defaultVisible: true,
        }),
        galaxyKnowledgeCatalogField('compactMerger', 'Fusión compacta', {
          columnLabel: 'FUSIÓN COMPACTA', defaultVisible: true,
        }),
        galaxyKnowledgeCatalogField('sector', 'Sector', {
          columnLabel: 'SECTOR', defaultVisible: true, align: 'end',
        }),
        galaxyKnowledgeCatalogField('locator', 'Localización procedural'),
      ]),
      defaultSortKey: 'designation',
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

    const sourceRecords = this.recordsFor(
      request.generationKey,
      request.galaxyIndex,
      discoveries,
    );
    const matchesRequestedSubtype = (record: KnownSystemCatalogRecord): boolean =>
      subtype === null
      || (subtype === 'UNCLASSIFIED'
        ? record.multiplicity === null
        : record.multiplicity?.name === subtype);

    let totalItems: number;
    let page: number;
    let totalPages: number;
    let rows: readonly GalaxyKnowledgeCatalogRow[];

    if (request.query.sortKey === 'supernova' || request.query.sortKey === 'nova' || request.query.sortKey === 'kilonova' || request.query.sortKey === 'compactMerger') {
      // 29.1E/29.2: transient lineage sorts are intentionally opt-in expensive sorts.
      // Correct ordering requires the scientific label for every filtered
      // system, so the full filtered set is materialized only for this key.
      // Labels remain cached per system; every other sort preserves the
      // 26.1c.7 page-first performance boundary.
      const labelledRecords = await Promise.all(
        sourceRecords
          .filter(matchesRequestedSubtype)
          .map(async (record) => Object.freeze({
            record,
            label: request.query.sortKey === 'supernova'
              ? await this.supernovaCatalogLabel(request.generationKey, record)
              : request.query.sortKey === 'nova'
                ? await this.novaCatalogLabel(request.generationKey, record)
                : request.query.sortKey === 'kilonova'
                  ? await this.kilonovaCatalogLabel(request.generationKey, record)
                  : await this.compactMergerCatalogLabel(request.generationKey, record),
          })),
      );

      labelledRecords.sort((left, right) =>
        compareTransientRecords(
          left,
          right,
          request.query.direction,
        ),
      );

      totalItems = labelledRecords.length;
      totalPages = Math.max(1, Math.ceil(totalItems / request.query.pageSize));
      page = Math.min(Math.max(1, request.query.page), totalPages);
      const start = (page - 1) * request.query.pageSize;
      rows = Object.freeze(await Promise.all(
        labelledRecords
          .slice(start, start + request.query.pageSize)
          .map(async ({ record, label }) => toRow(
            record,
            request.query.sortKey === 'supernova' ? label : await this.supernovaCatalogLabel(request.generationKey, record),
            request.query.sortKey === 'nova' ? label : await this.novaCatalogLabel(request.generationKey, record),
            request.query.sortKey === 'kilonova' ? label : await this.kilonovaCatalogLabel(request.generationKey, record),
            request.query.sortKey === 'compactMerger' ? label : await this.compactMergerCatalogLabel(request.generationKey, record),
          )),
      ));
    } else {
      const records = this.viewCache.resolve(
        sourceRecords,
        galaxyKnowledgeCatalogViewKey(
          subtype,
          request.query.sortKey,
          request.query.direction,
        ),
        matchesRequestedSubtype,
        (left, right) =>
          compareRecords(left, right, request.query.sortKey, request.query.direction),
      );

      totalItems = records.length;
      totalPages = Math.max(1, Math.ceil(totalItems / request.query.pageSize));
      page = Math.min(Math.max(1, request.query.page), totalPages);
      const start = (page - 1) * request.query.pageSize;
      const selected = records.slice(start, start + request.query.pageSize);

      rows = Object.freeze(await Promise.all(
        selected.map(async (record) =>
          toRow(
            record,
            await this.supernovaCatalogLabel(request.generationKey, record),
            await this.novaCatalogLabel(request.generationKey, record),
            await this.kilonovaCatalogLabel(request.generationKey, record),
            await this.compactMergerCatalogLabel(request.generationKey, record),
          ),
        ),
      ));
    }

    return Object.freeze({
      kind: 'page' as const,
      page: Object.freeze({
        totalItems,
        page,
        pageSize: request.query.pageSize,
        totalPages,
        items: Object.freeze(rows),
      }),
    });
  }

  private async supernovaCatalogLabel(
    generationKey: UniverseGenerationKey,
    record: KnownSystemCatalogRecord,
  ): Promise<string | undefined> {
    const repository = this.repositories.supernovaCanonicalEventRepository;

    // Legacy/test repository bundles may not expose the 29.1C store. Production
    // does; keeping this optional prevents unrelated catalogue fixtures breaking.
    if (repository === undefined) {
      return undefined;
    }

    if (record.discovery.state.code < DiscoveryState.CATALOGUED.code) {
      return 'Restringido hasta Catalogado';
    }

    const cacheKey = transientLabelCacheKey(generationKey, record.locator);
    const cached = this.supernovaLabelCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const pending = StellarSupernovaScientificIntegration
      .synchronize(repository, generationKey, record.locator)
      .then((snapshot) =>
        StellarSupernovaScientificPresentationAssembler.build(snapshot).catalogLabel,
      );

    this.supernovaLabelCache.set(cacheKey, pending);

    try {
      return await pending;
    } catch (error) {
      this.supernovaLabelCache.delete(cacheKey);
      throw error;
    }
  }

  private async novaCatalogLabel(
    generationKey: UniverseGenerationKey,
    record: KnownSystemCatalogRecord,
  ): Promise<string | undefined> {
    const repository = this.repositories.novaCanonicalEventRepository;
    if (repository === undefined) return undefined;
    if (record.discovery.state.code < DiscoveryState.CATALOGUED.code) {
      return 'Restringido hasta Catalogado';
    }

    const cacheKey = transientLabelCacheKey(generationKey, record.locator);
    const cached = this.novaLabelCache.get(cacheKey);
    if (cached !== undefined) return cached;

    const pending = StellarNovaScientificIntegration
      .synchronize(repository, generationKey, record.locator)
      .then(snapshot => StellarNovaScientificPresentationAssembler.build(snapshot).catalogLabel);
    this.novaLabelCache.set(cacheKey, pending);
    try { return await pending; }
    catch (error) { this.novaLabelCache.delete(cacheKey); throw error; }
  }

  private async kilonovaCatalogLabel(
    generationKey: UniverseGenerationKey,
    record: KnownSystemCatalogRecord,
  ): Promise<string | undefined> {
    const repository = this.repositories.kilonovaCanonicalEventRepository;
    if (repository === undefined) return undefined;
    if (record.discovery.state.code < DiscoveryState.CATALOGUED.code) return 'Restringido hasta Catalogado';
    const cacheKey = transientLabelCacheKey(generationKey, record.locator);
    const cached = this.kilonovaLabelCache.get(cacheKey);
    if (cached !== undefined) return cached;
    const pending = StellarKilonovaScientificIntegration
      .synchronize(repository, generationKey, record.locator)
      .then(snapshot => StellarKilonovaScientificPresentationAssembler.build(snapshot).catalogLabel);
    this.kilonovaLabelCache.set(cacheKey, pending);
    try { return await pending; }
    catch (error) { this.kilonovaLabelCache.delete(cacheKey); throw error; }
  }

  private async compactMergerCatalogLabel(
    generationKey: UniverseGenerationKey,
    record: KnownSystemCatalogRecord,
  ): Promise<string | undefined> {
    const repository = this.repositories.compactMergerCanonicalEventRepository;
    if (repository === undefined) return undefined;
    if (record.discovery.state.code < DiscoveryState.CATALOGUED.code) return 'Restringido hasta Catalogado';
    const cacheKey = transientLabelCacheKey(generationKey, record.locator);
    const cached = this.compactMergerLabelCache.get(cacheKey);
    if (cached !== undefined) return cached;
    const pending = StellarCompactMergerScientificIntegration
      .synchronize(repository, generationKey, record.locator)
      .then(snapshot => StellarCompactMergerScientificPresentationAssembler.build(snapshot).catalogLabel);
    this.compactMergerLabelCache.set(cacheKey, pending);
    try { return await pending; }
    catch (error) { this.compactMergerLabelCache.delete(cacheKey); throw error; }
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

function toRow(
  record: KnownSystemCatalogRecord,
  supernovaCatalogLabel?: string,
  novaCatalogLabel?: string,
  kilonovaCatalogLabel?: string,
  compactMergerCatalogLabel?: string,
): GalaxyKnowledgeCatalogRow {
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
      supernova: supernovaCatalogLabel,
      nova: novaCatalogLabel,
      kilonova: kilonovaCatalogLabel,
      compactMerger: compactMergerCatalogLabel,
      sector: record.locator.sectorKey.toLocaleString('es-ES'),
      locator: locatorLabel,
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

function compareTransientRecords(
  left: Readonly<{ readonly record: KnownSystemCatalogRecord; readonly label: string | undefined }>,
  right: Readonly<{ readonly record: KnownSystemCatalogRecord; readonly label: string | undefined }>,
  direction: GalaxyKnowledgeCatalogDirection,
): number {
  const factor = direction === 'desc' ? -1 : 1;
  const difference = (left.label ?? '')
    .localeCompare(right.label ?? '', 'es', { sensitivity: 'base' });

  if (difference !== 0) {
    return difference * factor;
  }

  return compareLocator(left.record.locator, right.record.locator) * factor;
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
  return compareLocator(left.locator, right.locator) * factor;
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

function transientLabelCacheKey(
  generationKey: UniverseGenerationKey,
  locator: SystemLocator,
): string {
  return [
    generationKey.universeSeed.normalizedValue,
    generationKey.generatorVersion.code.toString(10),
    locator.galaxyIndex.toString(10),
    locator.sectorKey.toString(10),
    locator.galacticObjectIndex.toString(10),
  ].join(':');
}

function systemLocatorLabel(locator: SystemLocator): string {
  return [
    `G${locator.galaxyIndex.toString(10)}`,
    `S${locator.sectorKey.toString(10)}`,
    `O${locator.galacticObjectIndex.toString(10)}`,
  ].join(' / ');
}
