import {
  type GalaxyKnowledgeCatalogCategory,
  type GalaxyKnowledgeCatalogColumn,
  type GalaxyKnowledgeCatalogDescriptor,
} from './galaxy-knowledge-catalog.model';

/** Columns are one-to-one with sortable scientific fields; identity is pinned. */
export interface GalaxyKnowledgeCatalogField extends GalaxyKnowledgeCatalogColumn {
  readonly defaultVisible: boolean;
}

export interface GalaxyKnowledgeCatalogColumnPreference {
  readonly visibleFieldKeys: readonly string[];
  readonly knownFieldKeys: readonly string[];
}

export function catalogFields(descriptor: GalaxyKnowledgeCatalogDescriptor): readonly GalaxyKnowledgeCatalogField[] {
  const initial = new Map(descriptor.columns.map(column => [column.key, column]));
  return Object.freeze(descriptor.sortOptions
    .filter(option => option.key !== 'designation')
    .map(option => Object.freeze({
      key: option.key,
      label: initial.get(option.key)?.label ?? option.label.toLocaleUpperCase('es-ES'),
      align: initial.get(option.key)?.align,
      defaultVisible: initial.has(option.key),
    })));
}

export function initialCatalogColumns(fields: readonly GalaxyKnowledgeCatalogField[]): GalaxyKnowledgeCatalogColumnPreference {
  return Object.freeze({
    visibleFieldKeys: Object.freeze(fields.filter(field => field.defaultVisible).map(field => field.key)),
    knownFieldKeys: Object.freeze(fields.map(field => field.key)),
  });
}

/** Obsolete keys are discarded; newly added default columns are included once. */
export function reconcileCatalogColumns(
  fields: readonly GalaxyKnowledgeCatalogField[],
  saved: unknown,
): GalaxyKnowledgeCatalogColumnPreference {
  const defaults = initialCatalogColumns(fields);
  if (!saved || typeof saved !== 'object') return defaults;
  const value = saved as Partial<GalaxyKnowledgeCatalogColumnPreference>;
  if (!Array.isArray(value.visibleFieldKeys) || !Array.isArray(value.knownFieldKeys)) return defaults;
  const available = new Set(fields.map(field => field.key));
  const knownBefore = new Set(value.knownFieldKeys.filter((key): key is string => typeof key === 'string'));
  const visible = [...new Set(value.visibleFieldKeys.filter((key): key is string =>
    typeof key === 'string' && available.has(key),
  ))];
  for (const field of fields) {
    if (!knownBefore.has(field.key) && field.defaultVisible && !visible.includes(field.key)) {
      visible.push(field.key);
    }
  }
  return Object.freeze({
    visibleFieldKeys: Object.freeze(visible),
    knownFieldKeys: defaults.knownFieldKeys,
  });
}

export function catalogColumnsWithSort(
  preference: GalaxyKnowledgeCatalogColumnPreference,
  sortKey: string,
): GalaxyKnowledgeCatalogColumnPreference {
  if (!preference.knownFieldKeys.includes(sortKey) || preference.visibleFieldKeys.includes(sortKey)) {
    return preference;
  }
  return Object.freeze({
    ...preference,
    visibleFieldKeys: Object.freeze([...preference.visibleFieldKeys, sortKey]),
  });
}

export function catalogToggleColumn(
  preference: GalaxyKnowledgeCatalogColumnPreference,
  key: string,
  enabled: boolean,
  sortKey: string,
): GalaxyKnowledgeCatalogColumnPreference {
  if (!preference.knownFieldKeys.includes(key) || (!enabled && key === sortKey)) return preference;
  const visible = enabled
    ? [...new Set([...preference.visibleFieldKeys, key])]
    : preference.visibleFieldKeys.filter(item => item !== key);
  return Object.freeze({ ...preference, visibleFieldKeys: Object.freeze(visible) });
}

export function catalogMoveColumn(
  preference: GalaxyKnowledgeCatalogColumnPreference,
  key: string,
  direction: -1 | 1,
): GalaxyKnowledgeCatalogColumnPreference {
  const visible = [...preference.visibleFieldKeys];
  const index = visible.indexOf(key);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= visible.length) return preference;
  [visible[index], visible[target]] = [visible[target], visible[index]];
  return Object.freeze({ ...preference, visibleFieldKeys: Object.freeze(visible) });
}

export function catalogVisibleColumns(
  fields: readonly GalaxyKnowledgeCatalogField[],
  preference: GalaxyKnowledgeCatalogColumnPreference,
): readonly GalaxyKnowledgeCatalogField[] {
  const byKey = new Map(fields.map(field => [field.key, field]));
  return Object.freeze(preference.visibleFieldKeys.flatMap(key => {
    const field = byKey.get(key);
    return field === undefined ? [] : [field];
  }));
}

export function catalogColumnsStorageKey(category: GalaxyKnowledgeCatalogCategory): string {
  return `genesis:galaxy-knowledge-catalog:columns:${category}`;
}
