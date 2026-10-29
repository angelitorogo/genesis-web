import { type KnownDiscoveryState } from '../../domain/discovery/discovery-state';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { parseCatalogAtmosphereFilter, type CatalogAtmosphereFilter } from './galaxy-knowledge-atmosphere-filter';

export const GALAXY_KNOWLEDGE_CATALOG_PAGE_SIZES = Object.freeze([25, 50, 100] as const);

export type GalaxyKnowledgeCatalogPageSize =
  typeof GALAXY_KNOWLEDGE_CATALOG_PAGE_SIZES[number];

export type GalaxyKnowledgeCatalogDirection = 'asc' | 'desc';

export type GalaxyKnowledgeCatalogCategory =
  | 'systems'
  | 'planets'
  | 'moons'
  | 'clusters'
  | 'nebulae'
  | 'extremes'
  | 'asteroids'
  | 'comets'
  | 'tno'
  | 'captured'
  | 'civilizations';

export interface GalaxyKnowledgeCatalogCategoryDefinition {
  readonly category: GalaxyKnowledgeCatalogCategory;
  readonly label: string;
  readonly singularLabel: string;
}

export interface GalaxyKnowledgeCatalogSortOption {
  readonly key: string;
  readonly label: string;
}

export interface GalaxyKnowledgeCatalogColumn {
  readonly key: string;
  readonly label: string;
  readonly align?: 'start' | 'end';
}

export interface GalaxyKnowledgeCatalogDescriptor {
  readonly category: GalaxyKnowledgeCatalogCategory;
  readonly title: string;
  readonly description: string;
  readonly identityLabel: string;
  readonly filterLabel?: string | null;
  readonly sortOptions: readonly GalaxyKnowledgeCatalogSortOption[];
  readonly defaultSortKey: string;
  readonly columns: readonly GalaxyKnowledgeCatalogColumn[];
}

export interface GalaxyKnowledgeCatalogQuery {
  readonly category: GalaxyKnowledgeCatalogCategory;
  readonly subtype: string | null;
  readonly page: number;
  readonly pageSize: GalaxyKnowledgeCatalogPageSize;
  readonly sortKey: string;
  readonly direction: GalaxyKnowledgeCatalogDirection;
  /** Optional name/designation search within the active known category. */
  readonly search?: string | null;
  readonly atmosphere?: CatalogAtmosphereFilter;
}

export interface GalaxyKnowledgeCatalogAction {
  readonly label: string;
  readonly route: readonly string[];
  readonly queryParams?: Readonly<Record<string, string>>;
  readonly emphasis?: 'default' | 'primary';
}

export interface GalaxyKnowledgeCatalogRow {
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string | null;
  readonly cells: Readonly<Partial<Record<string, string>>>;
  readonly actions: readonly GalaxyKnowledgeCatalogAction[];
}

export interface GalaxyKnowledgeCatalogPage {
  readonly totalItems: number;
  readonly page: number;
  readonly pageSize: GalaxyKnowledgeCatalogPageSize;
  readonly totalPages: number;
  readonly items: readonly GalaxyKnowledgeCatalogRow[];
  /** False while VIDA.9 confirmed biological records are still being indexed. */
  readonly knowledgeComplete?: boolean;
  /** Whole filtered selection, before pagination; only when sorting by atmospheric data. */
  readonly atmosphericSortAvailability?: Readonly<{
    resolved: number;
    positive: number;
    unresolved: number;
  }>;
}

export interface GalaxyKnowledgeCatalogDataRequest {
  readonly generationKey: UniverseGenerationKey;
  readonly galaxyIndex: bigint;
  readonly galaxyState: KnownDiscoveryState;
  readonly query: GalaxyKnowledgeCatalogQuery;
}

export type GalaxyKnowledgeCatalogDataResult =
  | Readonly<{ kind: 'page'; page: GalaxyKnowledgeCatalogPage }>
  | Readonly<{ kind: 'not-connected' }>;

export interface GalaxyKnowledgeCatalogRawQuery {
  readonly search?: string | null;
  readonly gasRanges?: string | null;
  readonly gasCombine?: string | null;
  readonly pressureMin?: string | null;
  readonly pressureMax?: string | null;
  readonly earthMin?: string | null;
  readonly subtype: string | null;
  readonly page: string | null;
  readonly pageSize: string | null;
  readonly sortKey: string | null;
  readonly direction: string | null;
}

const CATEGORY_DEFINITIONS: readonly GalaxyKnowledgeCatalogCategoryDefinition[] = Object.freeze([
  Object.freeze({ category: 'systems', label: 'Sistemas', singularLabel: 'Sistema' }),
  Object.freeze({ category: 'planets', label: 'Planetas', singularLabel: 'Planeta' }),
  Object.freeze({ category: 'moons', label: 'Lunas', singularLabel: 'Luna' }),
  Object.freeze({ category: 'clusters', label: 'Cúmulos', singularLabel: 'Cúmulo' }),
  Object.freeze({ category: 'nebulae', label: 'Nebulosas', singularLabel: 'Nebulosa' }),
  Object.freeze({ category: 'extremes', label: 'Objetos extremos', singularLabel: 'Objeto extremo' }),
  Object.freeze({ category: 'asteroids', label: 'Asteroides', singularLabel: 'Asteroide' }),
  Object.freeze({ category: 'comets', label: 'Cometas', singularLabel: 'Cometa' }),
  Object.freeze({ category: 'tno', label: 'Objetos transneptunianos', singularLabel: 'Objeto transneptuniano' }),
  Object.freeze({ category: 'captured', label: 'Capturados', singularLabel: 'Objeto capturado' }),
  Object.freeze({ category: 'civilizations', label: 'Civilizaciones', singularLabel: 'Civilización' }),
]);

export function galaxyKnowledgeCatalogCategoryDefinition(
  value: string | null,
): GalaxyKnowledgeCatalogCategoryDefinition {
  const definition = CATEGORY_DEFINITIONS.find(candidate => candidate.category === value);
  if (definition === undefined) {
    throw new RangeError('La categoría de conocimiento indicada en la ruta no es válida.');
  }
  return definition;
}

export function normalizeGalaxyKnowledgeCatalogQuery(
  category: GalaxyKnowledgeCatalogCategory,
  descriptor: GalaxyKnowledgeCatalogDescriptor,
  raw: GalaxyKnowledgeCatalogRawQuery,
): GalaxyKnowledgeCatalogQuery {
  const page = parsePositiveInteger(raw.page, 1, 'página');
  const pageSize = parsePageSize(raw.pageSize);
  const direction: GalaxyKnowledgeCatalogDirection = raw.direction === 'desc' ? 'desc' : 'asc';
  const subtype = normalizeSubtype(raw.subtype);
  const search = normalizeCatalogNameQuery(raw.search);
  const supportedSortKeys = new Set(descriptor.sortOptions.map(option => option.key));
  const sortKey = raw.sortKey !== null && supportedSortKeys.has(raw.sortKey)
    ? raw.sortKey
    : descriptor.defaultSortKey;

  return Object.freeze({
    category,
    subtype,
    page,
    pageSize,
    sortKey,
    direction,
    ...(search === null ? {} : { search }),
    ...((category !== 'planets' && category !== 'moons') ? {} : {atmosphere: parseCatalogAtmosphereFilter(raw, category === 'moons')}),
  });
}

export function clampGalaxyKnowledgeCatalogPage(
  query: GalaxyKnowledgeCatalogQuery,
  page: GalaxyKnowledgeCatalogPage,
): GalaxyKnowledgeCatalogPage {
  const totalPages = Math.max(1, Math.ceil(page.totalItems / page.pageSize));
  const normalizedPage = Math.min(Math.max(1, page.page), totalPages);
  if (
    normalizedPage === page.page
    && totalPages === page.totalPages
    && page.pageSize === query.pageSize
  ) {
    return page;
  }

  return Object.freeze({
    ...page,
    page: normalizedPage,
    pageSize: query.pageSize,
    totalPages,
  });
}

function parsePageSize(value: string | null): GalaxyKnowledgeCatalogPageSize {
  if (value === null) return 25;
  const parsed = Number(value);
  return GALAXY_KNOWLEDGE_CATALOG_PAGE_SIZES.includes(parsed as GalaxyKnowledgeCatalogPageSize)
    ? parsed as GalaxyKnowledgeCatalogPageSize
    : 25;
}

function parsePositiveInteger(value: string | null, fallback: number, label: string): number {
  if (value === null || value.trim().length === 0) return fallback;
  if (!/^[1-9]\d*$/.test(value)) {
    throw new RangeError(`La ${label} indicada no es válida.`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new RangeError(`La ${label} indicada excede el rango admitido.`);
  }
  return parsed;
}

function normalizeSubtype(value: string | null): string | null {
  if (value === null) return null;
  const normalized = value.trim().toUpperCase();
  if (normalized.length === 0) return null;
  if (normalized.length > 80 || !/^[A-Z0-9_-]+$/.test(normalized)) {
    throw new RangeError('El subtipo de catálogo indicado no es válido.');
  }
  return normalized;
}

/** Limit URL search length and normalize whitespace without exposing hidden catalogue fields. */
export function normalizeCatalogNameQuery(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim().replace(/\s+/gu, ' ');
  if (trimmed.length === 0) return null;
  if (trimmed.length > 120 || /[\u0000-\u001f\u007f]/u.test(trimmed)) {
    throw new RangeError('La búsqueda por nombre no es válida.');
  }
  return trimmed;
}

/** Matches public names only; accents/case are ignored, not the discovery boundary. */
export function catalogNameMatches(name: string, search: string | null | undefined): boolean {
  if (!search) return true;
  const fold = (value: string): string => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLocaleLowerCase('es');
  return fold(name).includes(fold(search));
}
