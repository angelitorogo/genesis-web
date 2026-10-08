import { inject, Injectable } from '@angular/core';

import { DiscoveryState, type DiscoveryStateValue } from '../../domain/discovery/discovery-state';
import { DiscoveryTargetType } from '../../domain/discovery/discovery-target-type';
import { type KnownDiscovery } from '../../domain/discovery/known-discovery';
import { ExplorationResultKind } from '../../domain/exploration/exploration-sector-result';
import {
  ExtremeFamily,
  ExtremeSemanticKind,
  ExtremeType,
  extremeTypeDefinition,
  type ExtremeType as ExtremeTypeValue,
} from '../../domain/galactic-object/extreme-object-type';
import { GalacticObjectScientificSubject } from '../../domain/galactic-object/galactic-object-scientific-subject';
import { NebulaType, type NebulaType as NebulaTypeValue } from '../../domain/galactic-object/nebula-type';
import { frozenPhysicalSourceKey } from '../../domain/generation/frozen-physical-source-key';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { GalacticObjectLocator } from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GalacticNucleusState } from '../../domain/universe/galactic-nucleus-state';
import { ExplorationSectorResultEngine } from '../../simulation/exploration/exploration-sector-result-engine';
import { ExtremeObjectTypeResolver } from '../../simulation/galactic-object/extreme-object-type-resolver';
import { GalacticObjectScientificSubjectResolver } from '../../simulation/galactic-object/galactic-object-scientific-subject-resolver';
import { GlobularClusterGenerator } from '../../simulation/galactic-object/globular-cluster-generator';
import { NebulaGenerator } from '../../simulation/galactic-object/nebula-generator';
import { OpenClusterGenerator } from '../../simulation/galactic-object/open-cluster-generator';
import { GalacticCenterNucleusResolver } from '../../simulation/nuclear/galactic-center-nucleus-resolver';
import { GalaxyGenerator } from '../../simulation/universe/galaxy-generator';
import { GENESIS_LOCAL_REPOSITORIES } from '../runtime/genesis-local-repositories';
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

type GalacticObjectCatalogCategory = 'clusters' | 'nebulae' | 'extremes';

type ClusterSubtype = 'OPEN' | 'GLOBULAR' | 'UNCLASSIFIED';
type NebulaSubtype = 'EMISSION' | 'REFLECTION' | 'DARK' | 'PLANETARY' | 'HII_REGION' | 'UNCLASSIFIED';
type ExtremeSubtype = ExtremeTypeValue | 'UNCLASSIFIED';

const CLUSTER_SUBTYPES = Object.freeze(['OPEN', 'GLOBULAR', 'UNCLASSIFIED'] as const);
const NEBULA_SUBTYPES = Object.freeze(['EMISSION', 'REFLECTION', 'DARK', 'PLANETARY', 'HII_REGION', 'UNCLASSIFIED'] as const);
const EXTREME_SUBTYPES = Object.freeze([
  ExtremeType.AGN,
  ExtremeType.QUASAR,
  ExtremeType.NEUTRON_STAR,
  ExtremeType.PULSAR,
  ExtremeType.MILLISECOND_PULSAR,
  ExtremeType.MAGNETAR,
  ExtremeType.STELLAR_MASS_BLACK_HOLE,
  ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE,
  ExtremeType.SUPERNOVA_REMNANT,
  ExtremeType.PULSAR_WIND_NEBULA,
  ExtremeType.X_RAY_BINARY_NS,
  ExtremeType.X_RAY_BINARY_BH,
  ExtremeType.MICROQUASAR,
  ExtremeType.ULX,
  'UNCLASSIFIED',
] as const);

interface BaseRecord {
  readonly locator: GalacticObjectLocator;
  readonly discovery: KnownDiscovery;
  readonly title: string;
}

interface ClusterRecord extends BaseRecord {
  readonly subtype: Exclude<ClusterSubtype, 'UNCLASSIFIED'> | null;
  readonly stellarCount: number | null;
  readonly massSolar: number | null;
  readonly ageGyr: number | null;
  readonly radiusPc: number | null;
}

interface NebulaRecord extends BaseRecord {
  readonly subtype: Exclude<NebulaSubtype, 'UNCLASSIFIED'> | null;
  readonly radiusPc: number | null;
  readonly massSolar: number | null;
  readonly temperatureK: number | null;
  readonly densityCm3: number | null;
}

interface ExtremeRecord extends BaseRecord {
  readonly subtype: ExtremeTypeValue | null;
  readonly family: string | null;
  readonly semanticKind: string | null;
}

interface GalacticObjectHotRecords<T extends BaseRecord> {
  readonly generationKey: UniverseGenerationKey;
  readonly galaxyIndex: bigint;
  readonly knowledgeRevision: string;
  readonly records: readonly T[];
}

@Injectable({ providedIn: 'root' })
export class GalaxyKnowledgeGalacticObjectsCatalogDataSource {
  private readonly repositories = inject(GENESIS_LOCAL_REPOSITORIES);
  private clusterHotRecords: GalacticObjectHotRecords<ClusterRecord> | null = null;
  private nebulaHotRecords: GalacticObjectHotRecords<NebulaRecord> | null = null;
  private extremeHotRecords: GalacticObjectHotRecords<ExtremeRecord> | null = null;
  private readonly clusterViewCache = new GalaxyKnowledgeCatalogViewCache<ClusterRecord>();
  private readonly nebulaViewCache = new GalaxyKnowledgeCatalogViewCache<NebulaRecord>();
  private readonly extremeViewCache = new GalaxyKnowledgeCatalogViewCache<ExtremeRecord>();

  describe(category: GalacticObjectCatalogCategory, subtype: string | null): GalaxyKnowledgeCatalogDescriptor {
    switch (category) {
      case 'clusters': return clusterDescriptor(normalizeClusterSubtype(subtype));
      case 'nebulae': return nebulaDescriptor(normalizeNebulaSubtype(subtype));
      case 'extremes': return extremeDescriptor(normalizeExtremeSubtype(subtype));
    }
  }

  async query(request: GalaxyKnowledgeCatalogDataRequest): Promise<GalaxyKnowledgeCatalogDataResult> {
    if (!isGalacticObjectCatalogCategory(request.query.category)) {
      return Object.freeze({ kind: 'not-connected' });
    }

    const discoveries = await this.loadKnownGalacticObjects(request.generationKey, request.galaxyIndex);
    const known = discoveries.filter((discovery): discovery is KnownDiscovery & { readonly locator: GalacticObjectLocator } =>
      discovery.locator instanceof GalacticObjectLocator,
    );

    switch (request.query.category) {
      case 'clusters': {
        const subtype = normalizeClusterSubtype(request.query.subtype);
        const records = this.clusterViewCache.resolve(
          this.clusterRecords(request.generationKey, request.galaxyIndex, known),
          galaxyKnowledgeCatalogViewKey(subtype, request.query.sortKey, request.query.direction),
          record => matchesSubtype(record.subtype, subtype),
          (left, right) => compareClusterRecords(left, right, request.query.sortKey, request.query.direction),
        );
        return page(records, request, clusterRow);
      }
      case 'nebulae': {
        const subtype = normalizeNebulaSubtype(request.query.subtype);
        const records = this.nebulaViewCache.resolve(
          this.nebulaRecords(request.generationKey, request.galaxyIndex, known),
          galaxyKnowledgeCatalogViewKey(subtype, request.query.sortKey, request.query.direction),
          record => matchesSubtype(record.subtype, subtype),
          (left, right) => compareNebulaRecords(left, right, request.query.sortKey, request.query.direction),
        );
        return page(records, request, nebulaRow);
      }
      case 'extremes': {
        const subtype = normalizeExtremeSubtype(request.query.subtype);
        const records = this.extremeViewCache.resolve(
          this.extremeRecords(request.generationKey, request.galaxyIndex, known),
          galaxyKnowledgeCatalogViewKey(subtype, request.query.sortKey, request.query.direction),
          record => matchesSubtype(record.subtype, subtype),
          (left, right) => compareExtremeRecords(left, right, request.query.sortKey, request.query.direction),
        );
        return page(records, request, extremeRow);
      }
    }
  }

  private clusterRecords(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    discoveries: readonly (KnownDiscovery & { readonly locator: GalacticObjectLocator })[],
  ): readonly ClusterRecord[] {
    const knowledgeRevision = galaxyKnowledgeRevision(galaxyIndex, discoveries);
    const cached = this.clusterHotRecords;
    if (sameHotRecords(cached, generationKey, galaxyIndex, knowledgeRevision)) {
      return cached.records;
    }

    const records = Object.freeze(
      discoveries
        .filter(discovery => resolveKind(generationKey, discovery.locator) === ExplorationResultKind.STAR_CLUSTER)
        .map(discovery => clusterRecord(generationKey, discovery)),
    );
    this.clusterHotRecords = hotRecords(generationKey, galaxyIndex, knowledgeRevision, records);
    return records;
  }

  private nebulaRecords(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    discoveries: readonly (KnownDiscovery & { readonly locator: GalacticObjectLocator })[],
  ): readonly NebulaRecord[] {
    const knowledgeRevision = galaxyKnowledgeRevision(galaxyIndex, discoveries);
    const cached = this.nebulaHotRecords;
    if (sameHotRecords(cached, generationKey, galaxyIndex, knowledgeRevision)) {
      return cached.records;
    }

    const records = Object.freeze(
      discoveries
        .filter(discovery => resolveKind(generationKey, discovery.locator) === ExplorationResultKind.NEBULA)
        .map(discovery => nebulaRecord(generationKey, discovery)),
    );
    this.nebulaHotRecords = hotRecords(generationKey, galaxyIndex, knowledgeRevision, records);
    return records;
  }

  private extremeRecords(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    discoveries: readonly (KnownDiscovery & { readonly locator: GalacticObjectLocator })[],
  ): readonly ExtremeRecord[] {
    const knowledgeRevision = galaxyKnowledgeRevision(galaxyIndex, discoveries);
    const cached = this.extremeHotRecords;
    if (sameHotRecords(cached, generationKey, galaxyIndex, knowledgeRevision)) {
      return cached.records;
    }

    const records = Object.freeze(
      discoveries
        .filter(discovery => resolveKind(generationKey, discovery.locator) === ExplorationResultKind.EXTREME_OBJECT)
        .map(discovery => extremeRecord(generationKey, discovery)),
    );
    this.extremeHotRecords = hotRecords(generationKey, galaxyIndex, knowledgeRevision, records);
    return records;
  }

  private async loadKnownGalacticObjects(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
  ): Promise<readonly KnownDiscovery[]> {
    const repository = this.repositories.discoveryRepository;
    if (repository.getKnownDiscoveriesInGalaxy !== undefined) {
      return repository.getKnownDiscoveriesInGalaxy(
        generationKey,
        galaxyIndex,
        DiscoveryTargetType.GALACTIC_OBJECT.code,
      );
    }

    const discoveries = await repository.getKnownDiscoveries(generationKey) as readonly KnownDiscovery[];
    return discoveries.filter((discovery: KnownDiscovery) =>
      discovery.locator instanceof GalacticObjectLocator && discovery.locator.galaxyIndex === galaxyIndex,
    );
  }
}

function sameHotRecords<T extends BaseRecord>(
  cache: GalacticObjectHotRecords<T> | null,
  generationKey: UniverseGenerationKey,
  galaxyIndex: bigint,
  knowledgeRevision: string,
): cache is GalacticObjectHotRecords<T> {
  return cache !== null
    && cache.galaxyIndex === galaxyIndex
    && cache.knowledgeRevision === knowledgeRevision
    && cache.generationKey.equals(generationKey);
}

function hotRecords<T extends BaseRecord>(
  generationKey: UniverseGenerationKey,
  galaxyIndex: bigint,
  knowledgeRevision: string,
  records: readonly T[],
): GalacticObjectHotRecords<T> {
  return Object.freeze({
    generationKey: generationKey.copy(),
    galaxyIndex,
    knowledgeRevision,
    records,
  });
}

function clusterDescriptor(subtype: ClusterSubtype | null): GalaxyKnowledgeCatalogDescriptor {
  return defineGalaxyKnowledgeCatalogDescriptor({
    category: 'clusters' as const,
    title: subtype === null ? 'Cúmulos conocidos' : clusterCatalogueTitle(subtype),
    description: 'Cúmulos estelares presentes en el conocimiento persistido. La clase se conoce desde Descubierto; las propiedades agregadas solo se publican desde Catalogado.',
    filterLabel: subtype === null ? 'TODOS' : clusterSubtypeLabel(subtype),
    fields: Object.freeze([
      galaxyKnowledgeCatalogIdentityField('designation', 'Tipo / designación', 'CÚMULO'),
      galaxyKnowledgeCatalogField('state', 'Estado científico', { columnLabel: 'ESTADO', defaultVisible: true }),
      galaxyKnowledgeCatalogField('type', 'Tipo de cúmulo', { columnLabel: 'TIPO', defaultVisible: true }),
      galaxyKnowledgeCatalogField('stars', 'Número de estrellas', { columnLabel: 'ESTRELLAS', defaultVisible: true, align: 'end' }),
      galaxyKnowledgeCatalogField('mass', 'Masa total', { columnLabel: 'MASA', defaultVisible: true, align: 'end' }),
      galaxyKnowledgeCatalogField('age', 'Edad', { columnLabel: 'EDAD', defaultVisible: true, align: 'end' }),
      galaxyKnowledgeCatalogField('radius', 'Radio característico', { columnLabel: 'RADIO', defaultVisible: true, align: 'end' }),
      galaxyKnowledgeCatalogField('sector', 'Sector', { columnLabel: 'SECTOR', defaultVisible: true, align: 'end' }),
      galaxyKnowledgeCatalogField('locator', 'Localización procedural'),
    ]),
    defaultSortKey: 'designation',
  });
}

function nebulaDescriptor(subtype: NebulaSubtype | null): GalaxyKnowledgeCatalogDescriptor {
  return defineGalaxyKnowledgeCatalogDescriptor({
    category: 'nebulae' as const,
    title: subtype === null ? 'Nebulosas conocidas' : nebulaCatalogueTitle(subtype),
    description: 'Nebulosas presentes en el conocimiento persistido. Las regiones H II se reconocen desde Descubierto; los demás subtipos y magnitudes físicas requieren Catalogado.',
    filterLabel: subtype === null ? 'TODAS' : nebulaSubtypeLabel(subtype),
    fields: Object.freeze([
      galaxyKnowledgeCatalogIdentityField('designation', 'Tipo / designación', 'NEBULOSA'),
      galaxyKnowledgeCatalogField('state', 'Estado científico', { columnLabel: 'ESTADO', defaultVisible: true }),
      galaxyKnowledgeCatalogField('type', 'Tipo de nebulosa', { columnLabel: 'TIPO', defaultVisible: true }),
      galaxyKnowledgeCatalogField('radius', 'Radio', { columnLabel: 'RADIO', defaultVisible: true, align: 'end' }),
      galaxyKnowledgeCatalogField('mass', 'Masa', { columnLabel: 'MASA', defaultVisible: true, align: 'end' }),
      galaxyKnowledgeCatalogField('temperature', 'Temperatura del gas', { columnLabel: 'TEMP.', defaultVisible: true, align: 'end' }),
      galaxyKnowledgeCatalogField('density', 'Densidad de hidrógeno', { columnLabel: 'DENSIDAD', defaultVisible: true, align: 'end' }),
      galaxyKnowledgeCatalogField('sector', 'Sector', { columnLabel: 'SECTOR', defaultVisible: true, align: 'end' }),
      galaxyKnowledgeCatalogField('locator', 'Localización procedural'),
    ]),
    defaultSortKey: 'designation',
  });
}

function extremeDescriptor(subtype: ExtremeSubtype | null): GalaxyKnowledgeCatalogDescriptor {
  return defineGalaxyKnowledgeCatalogDescriptor({
    category: 'extremes' as const,
    title: subtype === null ? 'Objetos extremos conocidos' : extremeCatalogueTitle(subtype),
    description: 'Fuentes extremas presentes en el conocimiento persistido. El tipo exacto de los extremos distribuidos solo se publica desde Catalogado, igual que en Archive Genesis.',
    filterLabel: subtype === null ? 'TODOS' : extremeSubtypeLabel(subtype),
    fields: Object.freeze([
      galaxyKnowledgeCatalogIdentityField('designation', 'Tipo / designación', 'OBJETO EXTREMO'),
      galaxyKnowledgeCatalogField('state', 'Estado científico', { columnLabel: 'ESTADO', defaultVisible: true }),
      galaxyKnowledgeCatalogField('type', 'Tipo extremo', { columnLabel: 'TIPO', defaultVisible: true }),
      galaxyKnowledgeCatalogField('family', 'Familia física', { columnLabel: 'FAMILIA', defaultVisible: true }),
      galaxyKnowledgeCatalogField('semantic', 'Régimen físico', { columnLabel: 'RÉGIMEN', defaultVisible: true }),
      galaxyKnowledgeCatalogField('sector', 'Sector', { columnLabel: 'SECTOR', defaultVisible: true, align: 'end' }),
      galaxyKnowledgeCatalogField('locator', 'Localización procedural'),
    ]),
    defaultSortKey: 'designation',
  });
}

function clusterRecord(
  generationKey: UniverseGenerationKey,
  discovery: KnownDiscovery & { readonly locator: GalacticObjectLocator },
): ClusterRecord {
  const subtype = resolveClusterSubtype(generationKey, discovery.locator, discovery.state);
  let stellarCount: number | null = null;
  let massSolar: number | null = null;
  let ageGyr: number | null = null;
  let radiusPc: number | null = null;

  if (subtype !== null && discovery.state.code >= DiscoveryState.CATALOGUED.code) {
    const physicalKey = frozenPhysicalSourceKey(generationKey);
    if (subtype === 'OPEN') {
      const properties = OpenClusterGenerator.generate(physicalKey, discovery.locator).physicalProperties;
      stellarCount = properties.stellarCount;
      massSolar = properties.massSolarMasses;
      ageGyr = properties.ageMillionYears / 1000;
      radiusPc = properties.halfMassRadiusParsecs;
    } else {
      const properties = GlobularClusterGenerator.generate(physicalKey, discovery.locator).physicalProperties;
      stellarCount = properties.stellarCount;
      massSolar = properties.massSolarMasses;
      ageGyr = properties.ageBillionYears;
      radiusPc = properties.halfLightRadiusParsecs;
    }
  }

  return Object.freeze({
    locator: discovery.locator,
    discovery,
    subtype,
    title: subtype === null ? 'Cúmulo estelar sin clasificar' : clusterSubtypeLabel(subtype),
    stellarCount,
    massSolar,
    ageGyr,
    radiusPc,
  });
}

function nebulaRecord(
  generationKey: UniverseGenerationKey,
  discovery: KnownDiscovery & { readonly locator: GalacticObjectLocator },
): NebulaRecord {
  const subtype = resolveNebulaSubtype(generationKey, discovery.locator, discovery.state);
  let radiusPc: number | null = null;
  let massSolar: number | null = null;
  let temperatureK: number | null = null;
  let densityCm3: number | null = null;

  if (subtype !== null && discovery.state.code >= DiscoveryState.CATALOGUED.code) {
    const nebula = NebulaGenerator.generate(frozenPhysicalSourceKey(generationKey), discovery.locator);
    radiusPc = nebula.physicalProperties.radiusParsecs;
    massSolar = nebula.physicalProperties.massSolarMasses;
    temperatureK = nebula.physicalProperties.gasTemperatureKelvin;
    densityCm3 = nebula.physicalProperties.hydrogenNumberDensityPerCm3;
  }

  return Object.freeze({
    locator: discovery.locator,
    discovery,
    subtype,
    title: subtype === null ? 'Nebulosa sin clasificar' : nebulaSubtypeLabel(subtype),
    radiusPc,
    massSolar,
    temperatureK,
    densityCm3,
  });
}

function extremeRecord(
  generationKey: UniverseGenerationKey,
  discovery: KnownDiscovery & { readonly locator: GalacticObjectLocator },
): ExtremeRecord {
  const subtype = resolveExtremeSubtype(generationKey, discovery.locator, discovery.state);
  const definition = subtype === null ? null : extremeTypeDefinition(subtype);

  return Object.freeze({
    locator: discovery.locator,
    discovery,
    subtype,
    title: subtype === null
      ? discovery.state.code < DiscoveryState.DISCOVERED.code
        ? 'Fuente extrema detectada'
        : 'Fuente extrema en caracterización'
      : definition!.label,
    family: definition === null ? null : extremeFamilyLabel(definition.family),
    semanticKind: definition === null ? null : extremeSemanticKindLabel(definition.semanticKind),
  });
}

function resolveClusterSubtype(
  generationKey: UniverseGenerationKey,
  locator: GalacticObjectLocator,
  state: DiscoveryStateValue,
): Exclude<ClusterSubtype, 'UNCLASSIFIED'> | null {
  if (state.code < DiscoveryState.DISCOVERED.code) return null;
  const subject = GalacticObjectScientificSubjectResolver.resolve(generationKey, locator, state);
  if (subject === GalacticObjectScientificSubject.OPEN_CLUSTER) return 'OPEN';
  if (subject === GalacticObjectScientificSubject.GLOBULAR_CLUSTER) return 'GLOBULAR';
  return null;
}

function resolveNebulaSubtype(
  generationKey: UniverseGenerationKey,
  locator: GalacticObjectLocator,
  state: DiscoveryStateValue,
): Exclude<NebulaSubtype, 'UNCLASSIFIED'> | null {
  if (state.code < DiscoveryState.DISCOVERED.code) return null;
  const subject = GalacticObjectScientificSubjectResolver.resolve(generationKey, locator, state);
  if (subject === GalacticObjectScientificSubject.HII_REGION) return 'HII_REGION';
  if (subject !== GalacticObjectScientificSubject.NEBULA || state.code < DiscoveryState.CATALOGUED.code) return null;
  return nebulaTypeToSubtype(NebulaGenerator.generate(frozenPhysicalSourceKey(generationKey), locator).nebulaType);
}

function resolveExtremeSubtype(
  generationKey: UniverseGenerationKey,
  locator: GalacticObjectLocator,
  state: DiscoveryStateValue,
): ExtremeTypeValue | null {
  if (state.code < DiscoveryState.DISCOVERED.code) return null;

  const subject = GalacticObjectScientificSubjectResolver.resolve(generationKey, locator, state);
  if (subject === GalacticObjectScientificSubject.ACTIVE_GALACTIC_NUCLEUS) {
    const nucleus = GalacticCenterNucleusResolver.resolveState(
      GalaxyGenerator.generate(generationKey, locator.galaxyIndex),
    );
    if (nucleus === GalacticNucleusState.QUASAR) return ExtremeType.QUASAR;
    if (nucleus === GalacticNucleusState.AGN) return ExtremeType.AGN;
    return null;
  }

  if (
    generationKey.generatorVersion === GeneratorVersion.V2 &&
    state.code >= DiscoveryState.CATALOGUED.code
  ) {
    const exact = ExtremeObjectTypeResolver.resolve(generationKey, locator);
    if (exact !== null) return exact;
  }

  if (subject === GalacticObjectScientificSubject.SUPERNOVA_REMNANT) {
    return ExtremeType.SUPERNOVA_REMNANT;
  }

  if (
    subject === GalacticObjectScientificSubject.INTERMEDIATE_MASS_BLACK_HOLE &&
    state.code >= DiscoveryState.CATALOGUED.code
  ) {
    return ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE;
  }

  return null;
}

function clusterRow(record: ClusterRecord): GalaxyKnowledgeCatalogRow {
  return Object.freeze({
    id: locatorLabel(record.locator),
    title: record.title,
    subtitle: locatorLabel(record.locator),
    cells: Object.freeze({
      state: discoveryStateLabel(record.discovery.state.name),
      type: record.subtype === null ? 'Sin clasificar' : clusterSubtypeLabel(record.subtype),
      stars: record.stellarCount === null ? undefined : record.stellarCount.toLocaleString('es-ES'),
      mass: formatNumber(record.massSolar, 'M☉'),
      age: formatNumber(record.ageGyr, 'Ga'),
      radius: formatNumber(record.radiusPc, 'pc'),
      sector: record.locator.sectorKey.toLocaleString('es-ES'),
      locator: locatorLabel(record.locator),
    }),
    actions: objectActions(record.locator),
  });
}

function nebulaRow(record: NebulaRecord): GalaxyKnowledgeCatalogRow {
  return Object.freeze({
    id: locatorLabel(record.locator),
    title: record.title,
    subtitle: locatorLabel(record.locator),
    cells: Object.freeze({
      state: discoveryStateLabel(record.discovery.state.name),
      type: record.subtype === null ? 'Sin clasificar' : nebulaSubtypeLabel(record.subtype),
      radius: formatNumber(record.radiusPc, 'pc'),
      mass: formatNumber(record.massSolar, 'M☉'),
      temperature: formatNumber(record.temperatureK, 'K', 0),
      density: formatNumber(record.densityCm3, 'cm⁻³'),
      sector: record.locator.sectorKey.toLocaleString('es-ES'),
      locator: locatorLabel(record.locator),
    }),
    actions: objectActions(record.locator),
  });
}

function extremeRow(record: ExtremeRecord): GalaxyKnowledgeCatalogRow {
  return Object.freeze({
    id: locatorLabel(record.locator),
    title: record.title,
    subtitle: locatorLabel(record.locator),
    cells: Object.freeze({
      state: discoveryStateLabel(record.discovery.state.name),
      type: record.subtype === null ? 'Sin clasificar' : extremeTypeDefinition(record.subtype).shortLabel,
      family: record.family ?? undefined,
      semantic: record.semanticKind ?? undefined,
      sector: record.locator.sectorKey.toLocaleString('es-ES'),
      locator: locatorLabel(record.locator),
    }),
    actions: objectActions(record.locator),
  });
}

function objectActions(locator: GalacticObjectLocator): GalaxyKnowledgeCatalogRow['actions'] {
  return Object.freeze([
    Object.freeze({
      label: 'Abrir ficha científica',
      route: Object.freeze([
        '/archive/galactic-object',
        locator.galaxyIndex.toString(10),
        locator.sectorKey.toString(10),
        locator.galacticObjectIndex.toString(10),
      ]),
      emphasis: 'primary' as const,
    }),
  ]);
}

function page<T>(
  records: readonly T[],
  request: GalaxyKnowledgeCatalogDataRequest,
  row: (record: T) => GalaxyKnowledgeCatalogRow,
): GalaxyKnowledgeCatalogDataResult {
  const totalItems = records.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / request.query.pageSize));
  const pageNumber = Math.min(Math.max(1, request.query.page), totalPages);
  const start = (pageNumber - 1) * request.query.pageSize;
  return Object.freeze({
    kind: 'page' as const,
    page: Object.freeze({
      totalItems,
      page: pageNumber,
      pageSize: request.query.pageSize,
      totalPages,
      items: Object.freeze(records.slice(start, start + request.query.pageSize).map(row)),
    }),
  });
}

function compareClusterRecords(left: ClusterRecord, right: ClusterRecord, key: string, direction: GalaxyKnowledgeCatalogDirection): number {
  const factor = direction === 'desc' ? -1 : 1;
  const difference = (() => {
    switch (key) {
      case 'designation': return left.title.localeCompare(right.title, 'es', { sensitivity: 'base' });
      case 'state': return left.discovery.state.code - right.discovery.state.code;
      case 'type': return compareNullableText(left.subtype, right.subtype);
      case 'stars': return compareNullableNumber(left.stellarCount, right.stellarCount);
      case 'mass': return compareNullableNumber(left.massSolar, right.massSolar);
      case 'age': return compareNullableNumber(left.ageGyr, right.ageGyr);
      case 'radius': return compareNullableNumber(left.radiusPc, right.radiusPc);
      case 'sector': return compareBigInt(left.locator.sectorKey, right.locator.sectorKey);
      case 'locator': return compareLocator(left.locator, right.locator);
      default: return 0;
    }
  })();
  return difference !== 0 ? difference * factor : compareLocator(left.locator, right.locator);
}

function compareNebulaRecords(left: NebulaRecord, right: NebulaRecord, key: string, direction: GalaxyKnowledgeCatalogDirection): number {
  const factor = direction === 'desc' ? -1 : 1;
  const difference = (() => {
    switch (key) {
      case 'designation': return left.title.localeCompare(right.title, 'es', { sensitivity: 'base' });
      case 'state': return left.discovery.state.code - right.discovery.state.code;
      case 'type': return compareNullableText(left.subtype, right.subtype);
      case 'radius': return compareNullableNumber(left.radiusPc, right.radiusPc);
      case 'mass': return compareNullableNumber(left.massSolar, right.massSolar);
      case 'temperature': return compareNullableNumber(left.temperatureK, right.temperatureK);
      case 'density': return compareNullableNumber(left.densityCm3, right.densityCm3);
      case 'sector': return compareBigInt(left.locator.sectorKey, right.locator.sectorKey);
      case 'locator': return compareLocator(left.locator, right.locator);
      default: return 0;
    }
  })();
  return difference !== 0 ? difference * factor : compareLocator(left.locator, right.locator);
}

function compareExtremeRecords(left: ExtremeRecord, right: ExtremeRecord, key: string, direction: GalaxyKnowledgeCatalogDirection): number {
  const factor = direction === 'desc' ? -1 : 1;
  const difference = (() => {
    switch (key) {
      case 'designation': return left.title.localeCompare(right.title, 'es', { sensitivity: 'base' });
      case 'state': return left.discovery.state.code - right.discovery.state.code;
      case 'type': return compareNullableText(left.subtype, right.subtype);
      case 'family': return compareNullableText(left.family, right.family);
      case 'semantic': return compareNullableText(left.semanticKind, right.semanticKind);
      case 'sector': return compareBigInt(left.locator.sectorKey, right.locator.sectorKey);
      case 'locator': return compareLocator(left.locator, right.locator);
      default: return 0;
    }
  })();
  return difference !== 0 ? difference * factor : compareLocator(left.locator, right.locator);
}

function matchesSubtype(actual: string | null, filter: string | null): boolean {
  if (filter === null) return true;
  if (filter === 'UNCLASSIFIED') return actual === null;
  return actual === filter;
}

function resolveKind(generationKey: UniverseGenerationKey, locator: GalacticObjectLocator): string {
  return ExplorationSectorResultEngine.resolveGalacticObjectKind(generationKey, locator);
}

function isGalacticObjectCatalogCategory(value: string): value is GalacticObjectCatalogCategory {
  return value === 'clusters' || value === 'nebulae' || value === 'extremes';
}

function normalizeClusterSubtype(value: string | null): ClusterSubtype | null {
  if (value === null) return null;
  if ((CLUSTER_SUBTYPES as readonly string[]).includes(value)) return value as ClusterSubtype;
  throw new RangeError('El subtipo de cúmulos no es válido.');
}

function normalizeNebulaSubtype(value: string | null): NebulaSubtype | null {
  if (value === null) return null;
  if ((NEBULA_SUBTYPES as readonly string[]).includes(value)) return value as NebulaSubtype;
  throw new RangeError('El subtipo de nebulosas no es válido.');
}

function normalizeExtremeSubtype(value: string | null): ExtremeSubtype | null {
  if (value === null) return null;
  if ((EXTREME_SUBTYPES as readonly string[]).includes(value)) return value as ExtremeSubtype;
  throw new RangeError('El subtipo de objeto extremo no es válido.');
}

function nebulaTypeToSubtype(value: NebulaTypeValue): Exclude<NebulaSubtype, 'HII_REGION' | 'UNCLASSIFIED'> {
  switch (value) {
    case NebulaType.EMISSION: return 'EMISSION';
    case NebulaType.REFLECTION: return 'REFLECTION';
    case NebulaType.DARK: return 'DARK';
    case NebulaType.PLANETARY: return 'PLANETARY';
  }
}

function clusterSubtypeLabel(value: ClusterSubtype): string {
  switch (value) {
    case 'OPEN': return 'Cúmulo abierto';
    case 'GLOBULAR': return 'Cúmulo globular';
    case 'UNCLASSIFIED': return 'Sin clasificar';
  }
}

function clusterCatalogueTitle(value: ClusterSubtype): string {
  switch (value) {
    case 'OPEN': return 'Cúmulos abiertos';
    case 'GLOBULAR': return 'Cúmulos globulares';
    case 'UNCLASSIFIED': return 'Cúmulos sin clasificar';
  }
}

function nebulaSubtypeLabel(value: NebulaSubtype): string {
  switch (value) {
    case 'EMISSION': return 'Emisión';
    case 'REFLECTION': return 'Reflexión';
    case 'DARK': return 'Oscura';
    case 'PLANETARY': return 'Planetaria';
    case 'HII_REGION': return 'Región H II';
    case 'UNCLASSIFIED': return 'Sin clasificar';
  }
}

function nebulaCatalogueTitle(value: NebulaSubtype): string {
  switch (value) {
    case 'EMISSION': return 'Nebulosas de emisión';
    case 'REFLECTION': return 'Nebulosas de reflexión';
    case 'DARK': return 'Nebulosas oscuras';
    case 'PLANETARY': return 'Nebulosas planetarias';
    case 'HII_REGION': return 'Regiones H II';
    case 'UNCLASSIFIED': return 'Nebulosas sin clasificar';
  }
}

function extremeSubtypeLabel(value: ExtremeSubtype): string {
  return value === 'UNCLASSIFIED' ? 'Sin clasificar' : extremeTypeDefinition(value).label;
}

function extremeCatalogueTitle(value: ExtremeSubtype): string {
  if (value === 'UNCLASSIFIED') return 'Objetos extremos sin clasificar';
  switch (value) {
    case ExtremeType.AGN: return 'Núcleos galácticos activos';
    case ExtremeType.QUASAR: return 'Quásares';
    case ExtremeType.NEUTRON_STAR: return 'Estrellas de neutrones';
    case ExtremeType.PULSAR: return 'Púlsares';
    case ExtremeType.MILLISECOND_PULSAR: return 'Púlsares de milisegundos';
    case ExtremeType.MAGNETAR: return 'Magnetares';
    case ExtremeType.STELLAR_MASS_BLACK_HOLE: return 'Agujeros negros de masa estelar';
    case ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE: return 'Agujeros negros de masa intermedia';
    case ExtremeType.SUPERNOVA_REMNANT: return 'Remanentes de supernova';
    case ExtremeType.PULSAR_WIND_NEBULA: return 'Nebulosas de viento de púlsar';
    case ExtremeType.X_RAY_BINARY_NS: return 'Binarias X con estrella de neutrones';
    case ExtremeType.X_RAY_BINARY_BH: return 'Binarias X con agujero negro';
    case ExtremeType.MICROQUASAR: return 'Microquásares';
    case ExtremeType.ULX: return 'Fuentes ultraluminosas de rayos X';
    case ExtremeType.SMBH: return 'Agujeros negros supermasivos';
  }
}

function extremeFamilyLabel(value: string): string {
  switch (value) {
    case ExtremeFamily.GALACTIC_NUCLEUS: return 'Núcleo galáctico';
    case ExtremeFamily.NEUTRON_STAR: return 'Estrella de neutrones';
    case ExtremeFamily.BLACK_HOLE: return 'Agujero negro';
    case ExtremeFamily.SUPERNOVA_REMNANT: return 'Remanente de supernova';
    case ExtremeFamily.COMPACT_BINARY: return 'Binaria compacta';
    case ExtremeFamily.HIGH_ENERGY_SOURCE: return 'Fuente de alta energía';
    default: return value;
  }
}

function extremeSemanticKindLabel(value: string): string {
  switch (value) {
    case ExtremeSemanticKind.COMPACT_OBJECT: return 'Objeto compacto';
    case ExtremeSemanticKind.ACTIVITY_REGIME: return 'Régimen de actividad';
    case ExtremeSemanticKind.REMNANT_STRUCTURE: return 'Estructura remanente';
    case ExtremeSemanticKind.BINARY_SYSTEM: return 'Sistema binario';
    case ExtremeSemanticKind.OBSERVATIONAL_SOURCE: return 'Fuente observacional';
    default: return value;
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

function locatorLabel(locator: GalacticObjectLocator): string {
  return `G${locator.galaxyIndex.toString(10)} / S${locator.sectorKey.toString(10)} / O${locator.galacticObjectIndex.toString(10)}`;
}

function formatNumber(value: number | null, unit: string, maximumFractionDigits = 3): string | undefined {
  if (value === null) return undefined;
  return `${value.toLocaleString('es-ES', { maximumFractionDigits })} ${unit}`;
}

function compareNullableNumber(left: number | null, right: number | null): number {
  if (left === null && right === null) return 0;
  if (left === null) return -1;
  if (right === null) return 1;
  return left - right;
}

function compareNullableText(left: string | null, right: string | null): number {
  if (left === null && right === null) return 0;
  if (left === null) return -1;
  if (right === null) return 1;
  return left.localeCompare(right, 'es', { sensitivity: 'base' });
}

function compareLocator(left: GalacticObjectLocator, right: GalacticObjectLocator): number {
  const sector = compareBigInt(left.sectorKey, right.sectorKey);
  if (sector !== 0) return sector;
  return compareBigInt(left.galacticObjectIndex, right.galacticObjectIndex);
}

function compareBigInt(left: bigint, right: bigint): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
