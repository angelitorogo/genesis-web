import { type KnownDiscoveryState } from '../../domain/discovery/discovery-state';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';

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
  | 'captured';

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

/**
 * 26.1c.8b in-memory column layout for one catalogue category.
 * Identity and actions remain outside this list because both are fixed.
 */
export interface GalaxyKnowledgeCatalogColumnLayout {
  readonly visibleFieldKeys: readonly string[];
}

export type GalaxyKnowledgeCatalogFieldRole = 'identity' | 'data';

export interface GalaxyKnowledgeCatalogField {
  /** Stable field key. Sort queries use this value when sortable=true. */
  readonly key: string;
  /** Human-readable label shared by sorting and future column configuration. */
  readonly label: string;
  /** Table heading when the field is visible. Falls back to label. */
  readonly columnLabel?: string;
  /** Identity is the fixed first column; data fields are configurable in 26.1c.8b. */
  readonly role: GalaxyKnowledgeCatalogFieldRole;
  readonly sortable: boolean;
  /** Default 26.1c table layout. 26.1c.8b may override it in-memory per category. */
  readonly defaultVisible: boolean;
  /** Optional row.cells key when presentation and sort keys intentionally differ. */
  readonly cellKey?: string;
  readonly align?: 'start' | 'end';
}

export interface GalaxyKnowledgeCatalogFieldOptions {
  readonly columnLabel?: string;
  readonly sortable?: boolean;
  readonly defaultVisible?: boolean;
  readonly cellKey?: string;
  readonly align?: 'start' | 'end';
}

export interface GalaxyKnowledgeCatalogDescriptorDefinition {
  readonly category: GalaxyKnowledgeCatalogCategory;
  readonly title: string;
  readonly description: string;
  readonly filterLabel?: string | null;
  readonly fields: readonly GalaxyKnowledgeCatalogField[];
  readonly defaultSortKey: string;
}

/**
 * Resolved descriptor. identityLabel/sortOptions/columns are compatibility
 * projections derived exclusively from fields; fields is the single registry.
 */
export interface GalaxyKnowledgeCatalogDescriptor
  extends GalaxyKnowledgeCatalogDescriptorDefinition {
  readonly identityLabel: string;
  readonly sortOptions: readonly GalaxyKnowledgeCatalogSortOption[];
  readonly columns: readonly GalaxyKnowledgeCatalogColumn[];
}

export function galaxyKnowledgeCatalogIdentityField(
  key: string,
  label: string,
  columnLabel: string,
): GalaxyKnowledgeCatalogField {
  return Object.freeze({
    key,
    label,
    columnLabel,
    role: 'identity' as const,
    sortable: true,
    defaultVisible: true,
  });
}

export function galaxyKnowledgeCatalogField(
  key: string,
  label: string,
  options: GalaxyKnowledgeCatalogFieldOptions = {},
): GalaxyKnowledgeCatalogField {
  return Object.freeze({
    key,
    label,
    columnLabel: options.columnLabel,
    role: 'data' as const,
    sortable: options.sortable ?? true,
    defaultVisible: options.defaultVisible ?? false,
    cellKey: options.cellKey,
    align: options.align,
  });
}

export function galaxyKnowledgeCatalogDefaultColumnLayout(
  descriptor: GalaxyKnowledgeCatalogDescriptor,
): GalaxyKnowledgeCatalogColumnLayout {
  return Object.freeze({
    visibleFieldKeys: Object.freeze(
      descriptor.fields
        .filter(field => field.role === 'data' && field.defaultVisible)
        .map(field => field.key),
    ),
  });
}

export function normalizeGalaxyKnowledgeCatalogColumnLayout(
  descriptor: GalaxyKnowledgeCatalogDescriptor,
  layout: GalaxyKnowledgeCatalogColumnLayout,
): GalaxyKnowledgeCatalogColumnLayout {
  const dataKeys = new Set(
    descriptor.fields
      .filter(field => field.role === 'data')
      .map(field => field.key),
  );
  const seen = new Set<string>();
  const visibleFieldKeys: string[] = [];
  for (const key of layout.visibleFieldKeys) {
    if (!dataKeys.has(key) || seen.has(key)) continue;
    seen.add(key);
    visibleFieldKeys.push(key);
  }
  return Object.freeze({ visibleFieldKeys: Object.freeze(visibleFieldKeys) });
}

export function galaxyKnowledgeCatalogColumnsForLayout(
  descriptor: GalaxyKnowledgeCatalogDescriptor,
  layout: GalaxyKnowledgeCatalogColumnLayout,
): readonly GalaxyKnowledgeCatalogColumn[] {
  const normalized = normalizeGalaxyKnowledgeCatalogColumnLayout(descriptor, layout);
  const fields = new Map(
    descriptor.fields
      .filter(field => field.role === 'data')
      .map(field => [field.key, field] as const),
  );
  return Object.freeze(
    normalized.visibleFieldKeys.flatMap(key => {
      const field = fields.get(key);
      if (field === undefined) return [];
      return [Object.freeze({
        key: field.cellKey ?? field.key,
        label: field.columnLabel ?? field.label,
        ...(field.align === undefined ? {} : { align: field.align }),
      })];
    }),
  );
}

export function galaxyKnowledgeCatalogVisibleFields(
  descriptor: GalaxyKnowledgeCatalogDescriptor,
  layout: GalaxyKnowledgeCatalogColumnLayout,
): readonly GalaxyKnowledgeCatalogField[] {
  const normalized = normalizeGalaxyKnowledgeCatalogColumnLayout(descriptor, layout);
  const fields = new Map(descriptor.fields.map(field => [field.key, field] as const));
  return Object.freeze(
    normalized.visibleFieldKeys.flatMap(key => {
      const field = fields.get(key);
      return field === undefined ? [] : [field];
    }),
  );
}

export function galaxyKnowledgeCatalogHiddenFields(
  descriptor: GalaxyKnowledgeCatalogDescriptor,
  layout: GalaxyKnowledgeCatalogColumnLayout,
): readonly GalaxyKnowledgeCatalogField[] {
  const visible = new Set(
    normalizeGalaxyKnowledgeCatalogColumnLayout(descriptor, layout).visibleFieldKeys,
  );
  return Object.freeze(
    descriptor.fields.filter(field => field.role === 'data' && !visible.has(field.key)),
  );
}

export function defineGalaxyKnowledgeCatalogDescriptor(
  definition: GalaxyKnowledgeCatalogDescriptorDefinition,
): GalaxyKnowledgeCatalogDescriptor {
  const fields = Object.freeze(
    definition.fields.map(field => Object.freeze({ ...field })),
  );
  const keys = new Set<string>();
  for (const field of fields) {
    if (field.key.trim().length === 0 || keys.has(field.key)) {
      throw new RangeError('El registro de campos del catálogo contiene una clave vacía o duplicada.');
    }
    keys.add(field.key);
  }

  const identityFields = fields.filter(field => field.role === 'identity');
  if (identityFields.length !== 1) {
    throw new RangeError('Cada catálogo debe declarar exactamente un campo de identidad.');
  }
  const identity = identityFields[0]!;
  if (!identity.defaultVisible) {
    throw new RangeError('El campo de identidad debe permanecer visible.');
  }

  const unsortableDataField = fields.find(
    field => field.role === 'data' && !field.sortable,
  );
  if (unsortableDataField !== undefined) {
    throw new RangeError(
      `Todo campo configurable debe ser ordenable: ${unsortableDataField.key}.`,
    );
  }

  const defaultSortField = fields.find(field => field.key === definition.defaultSortKey);
  if (defaultSortField === undefined || !defaultSortField.sortable) {
    throw new RangeError('La ordenación por defecto debe corresponder a un campo ordenable.');
  }

  const sortOptions = Object.freeze(
    fields
      .filter(field => field.sortable)
      .map(field => Object.freeze({ key: field.key, label: field.label })),
  );
  const columns = Object.freeze(
    fields
      .filter(field => field.role === 'data' && field.defaultVisible)
      .map(field => Object.freeze({
        key: field.cellKey ?? field.key,
        label: field.columnLabel ?? field.label,
        ...(field.align === undefined ? {} : { align: field.align }),
      })),
  );

  return Object.freeze({
    ...definition,
    fields,
    identityLabel: identity.columnLabel ?? identity.label,
    sortOptions,
    columns,
  });
}

export interface GalaxyKnowledgeCatalogQuery {
  readonly category: GalaxyKnowledgeCatalogCategory;
  readonly subtype: string | null;
  readonly page: number;
  readonly pageSize: GalaxyKnowledgeCatalogPageSize;
  readonly sortKey: string;
  readonly direction: GalaxyKnowledgeCatalogDirection;
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
  readonly subtype: string | null;
  readonly page: string | null;
  readonly pageSize: string | null;
  readonly sortKey: string | null;
  readonly direction: string | null;
}

export const GALAXY_KNOWLEDGE_CATALOG_CATEGORIES: readonly GalaxyKnowledgeCatalogCategory[] = Object.freeze([
  'systems',
  'planets',
  'moons',
  'clusters',
  'nebulae',
  'extremes',
  'asteroids',
  'comets',
  'tno',
  'captured',
]);

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
  const supportedSortKeys = new Set(
    descriptor.fields.filter(field => field.sortable).map(field => field.key),
  );
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
