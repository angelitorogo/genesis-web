import {
  GALAXY_KNOWLEDGE_CATALOG_CATEGORIES,
  galaxyKnowledgeCatalogDefaultColumnLayout,
  normalizeGalaxyKnowledgeCatalogColumnLayout,
  type GalaxyKnowledgeCatalogCategory,
  type GalaxyKnowledgeCatalogColumnLayout,
  type GalaxyKnowledgeCatalogDescriptor,
} from './galaxy-knowledge-catalog.model';

export const GALAXY_KNOWLEDGE_CATALOG_COLUMN_PREFERENCES_STORAGE_KEY =
  'genesis.galaxy-knowledge-catalog.columns.v1';

const COLUMN_PREFERENCES_VERSION = 1;
const MAX_FIELD_KEYS = 128;
const MAX_FIELD_KEY_LENGTH = 120;

export interface GalaxyKnowledgeCatalogStoredColumnPreference {
  readonly visibleFieldKeys: readonly string[];
  /** Fields known when the preference was written, used to merge future defaults safely. */
  readonly knownFieldKeys: readonly string[];
}

export type GalaxyKnowledgeCatalogColumnPreferences = Readonly<
  Partial<Record<GalaxyKnowledgeCatalogCategory, GalaxyKnowledgeCatalogStoredColumnPreference>>
>;

interface GalaxyKnowledgeCatalogStoredSnapshot {
  readonly version: 1;
  readonly categories: GalaxyKnowledgeCatalogColumnPreferences;
}

export function readGalaxyKnowledgeCatalogColumnPreferences(): GalaxyKnowledgeCatalogColumnPreferences {
  try {
    const raw = globalThis.localStorage?.getItem(
      GALAXY_KNOWLEDGE_CATALOG_COLUMN_PREFERENCES_STORAGE_KEY,
    ) ?? null;
    return parseGalaxyKnowledgeCatalogColumnPreferences(raw);
  } catch {
    return emptyPreferences();
  }
}

export function saveGalaxyKnowledgeCatalogColumnPreferences(
  preferences: GalaxyKnowledgeCatalogColumnPreferences,
): void {
  try {
    const snapshot: GalaxyKnowledgeCatalogStoredSnapshot = Object.freeze({
      version: COLUMN_PREFERENCES_VERSION,
      categories: normalizePreferences(preferences),
    });
    globalThis.localStorage?.setItem(
      GALAXY_KNOWLEDGE_CATALOG_COLUMN_PREFERENCES_STORAGE_KEY,
      JSON.stringify(snapshot),
    );
  } catch {
    // UI preferences are best-effort and must never interrupt scientific navigation.
  }
}

export function parseGalaxyKnowledgeCatalogColumnPreferences(
  raw: string | null,
): GalaxyKnowledgeCatalogColumnPreferences {
  if (raw === null) return emptyPreferences();

  try {
    const candidate = JSON.parse(raw) as unknown;
    if (!isRecord(candidate) || candidate['version'] !== COLUMN_PREFERENCES_VERSION) {
      return emptyPreferences();
    }
    const categories = candidate['categories'];
    if (!isRecord(categories)) return emptyPreferences();

    const parsed: Partial<
      Record<GalaxyKnowledgeCatalogCategory, GalaxyKnowledgeCatalogStoredColumnPreference>
    > = {};
    for (const category of GALAXY_KNOWLEDGE_CATALOG_CATEGORIES) {
      const preference = parseCategoryPreference(categories[category]);
      if (preference !== null) parsed[category] = preference;
    }
    return Object.freeze(parsed);
  } catch {
    return emptyPreferences();
  }
}

export function galaxyKnowledgeCatalogStoredPreferenceFromLayout(
  descriptor: GalaxyKnowledgeCatalogDescriptor,
  layout: GalaxyKnowledgeCatalogColumnLayout,
): GalaxyKnowledgeCatalogStoredColumnPreference {
  const normalized = normalizeGalaxyKnowledgeCatalogColumnLayout(descriptor, layout);
  return Object.freeze({
    visibleFieldKeys: Object.freeze([...normalized.visibleFieldKeys]),
    knownFieldKeys: Object.freeze(
      descriptor.fields
        .filter(field => field.role === 'data')
        .map(field => field.key),
    ),
  });
}

export function galaxyKnowledgeCatalogLayoutFromStoredPreference(
  descriptor: GalaxyKnowledgeCatalogDescriptor,
  stored: GalaxyKnowledgeCatalogStoredColumnPreference | undefined,
): GalaxyKnowledgeCatalogColumnLayout {
  if (stored === undefined) {
    return galaxyKnowledgeCatalogDefaultColumnLayout(descriptor);
  }

  const knownAtWrite = new Set(stored.knownFieldKeys);
  const merged = [...stored.visibleFieldKeys];
  for (const field of descriptor.fields) {
    if (
      field.role === 'data'
      && field.defaultVisible
      && !knownAtWrite.has(field.key)
      && !merged.includes(field.key)
    ) {
      merged.push(field.key);
    }
  }
  return normalizeGalaxyKnowledgeCatalogColumnLayout(descriptor, Object.freeze({
    visibleFieldKeys: Object.freeze(merged),
  }));
}

export function withGalaxyKnowledgeCatalogColumnPreference(
  current: GalaxyKnowledgeCatalogColumnPreferences,
  descriptor: GalaxyKnowledgeCatalogDescriptor,
  layout: GalaxyKnowledgeCatalogColumnLayout,
): GalaxyKnowledgeCatalogColumnPreferences {
  return Object.freeze({
    ...current,
    [descriptor.category]: galaxyKnowledgeCatalogStoredPreferenceFromLayout(descriptor, layout),
  });
}

export function withoutGalaxyKnowledgeCatalogColumnPreference(
  current: GalaxyKnowledgeCatalogColumnPreferences,
  category: GalaxyKnowledgeCatalogCategory,
): GalaxyKnowledgeCatalogColumnPreferences {
  const next = { ...current };
  delete next[category];
  return Object.freeze(next);
}

function normalizePreferences(
  preferences: GalaxyKnowledgeCatalogColumnPreferences,
): GalaxyKnowledgeCatalogColumnPreferences {
  const normalized: Partial<
    Record<GalaxyKnowledgeCatalogCategory, GalaxyKnowledgeCatalogStoredColumnPreference>
  > = {};
  for (const category of GALAXY_KNOWLEDGE_CATALOG_CATEGORIES) {
    const preference = preferences[category];
    if (preference === undefined) continue;
    const parsed = parseCategoryPreference(preference);
    if (parsed !== null) normalized[category] = parsed;
  }
  return Object.freeze(normalized);
}

function parseCategoryPreference(value: unknown): GalaxyKnowledgeCatalogStoredColumnPreference | null {
  if (!isRecord(value)) return null;
  const visibleFieldKeys = parseFieldKeys(value['visibleFieldKeys']);
  const knownFieldKeys = parseFieldKeys(value['knownFieldKeys']);
  if (visibleFieldKeys === null || knownFieldKeys === null) return null;
  return Object.freeze({ visibleFieldKeys, knownFieldKeys });
}

function parseFieldKeys(value: unknown): readonly string[] | null {
  if (!Array.isArray(value) || value.length > MAX_FIELD_KEYS) return null;
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const entry of value) {
    if (
      typeof entry !== 'string'
      || entry.length === 0
      || entry.length > MAX_FIELD_KEY_LENGTH
      || !/^[a-z0-9-]+$/i.test(entry)
    ) {
      return null;
    }
    if (seen.has(entry)) continue;
    seen.add(entry);
    keys.push(entry);
  }
  return Object.freeze(keys);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function emptyPreferences(): GalaxyKnowledgeCatalogColumnPreferences {
  return Object.freeze({});
}
