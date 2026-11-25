import { type GalaxyKnowledgeCatalogDataRequest, type GalaxyKnowledgeCatalogDataResult } from '../galaxy-knowledge-catalog/galaxy-knowledge-catalog.model';

/** CACHE-CAT.1: each fragment is a PUBLIC, already authorized catalogue page. */
export interface GalaxyKnowledgeCatalogPersistedPagesV1 {
  readonly version: 1;
  readonly entries: readonly Readonly<{
    key: string;
    result: GalaxyKnowledgeCatalogDataResult;
  }>[];
}

const MAX_PAGES_PER_GALAXY = 24;
const MAX_PAGES_JSON_CHARACTERS = 750_000;

/** Stable, fully normalized query, including atmospheric filters and pagination. */
export function galaxyKnowledgeCatalogPageCacheKeyCAT1(request: GalaxyKnowledgeCatalogDataRequest): string {
  return JSON.stringify([
    request.galaxyState.code,
    request.query.category,
    request.query.subtype,
    request.query.page,
    request.query.pageSize,
    request.query.sortKey,
    request.query.direction,
    request.query.search ?? null,
    request.query.atmosphere ?? null,
  ]);
}

export function galaxyKnowledgeCatalogPageCacheableCAT1(
  result: GalaxyKnowledgeCatalogDataResult,
): result is Extract<GalaxyKnowledgeCatalogDataResult, {kind:'page'}> {
  // VIDA.9 can report progressive results; they MUST NOT become durable truths.
  return result.kind === 'page' && result.page.knowledgeComplete !== false;
}

/** Discard malformed, incomplete and unknown-version caches (fail closed). */
export function restoreGalaxyKnowledgeCatalogPagesCAT1(json: string | undefined): GalaxyKnowledgeCatalogPersistedPagesV1 {
  if (!json) return { version: 1, entries: [] };
  try {
    const value: unknown = JSON.parse(json);
    if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1 ||
      !('entries' in value) || !Array.isArray(value.entries)) return { version: 1, entries: [] };
    const entries: {key:string;result:GalaxyKnowledgeCatalogDataResult}[] = [];
    for (const entry of value.entries) {
      if (!entry || typeof entry.key !== 'string' || entry.key.length > 4096 ||
        !entry.result || !galaxyKnowledgeCatalogPageCacheableCAT1(entry.result) ||
        !Array.isArray(entry.result.page.items) ||
        !Number.isSafeInteger(entry.result.page.totalItems) ||
        entry.result.page.totalItems < 0) continue;
      entries.push({key:entry.key,result:entry.result});
    }
    return {version:1,entries:entries.slice(-MAX_PAGES_PER_GALAXY)};
  } catch {
    return {version:1,entries:[]};
  }
}

export function appendGalaxyKnowledgeCatalogPageCAT1(
  existingJson: string | undefined,
  key: string,
  result: GalaxyKnowledgeCatalogDataResult,
): string | null {
  if (!galaxyKnowledgeCatalogPageCacheableCAT1(result)) return null;
  const existing = restoreGalaxyKnowledgeCatalogPagesCAT1(existingJson).entries
    .filter(entry => entry.key !== key);
  const entries = [...existing, {key,result}].slice(-MAX_PAGES_PER_GALAXY);
  let json = JSON.stringify({version:1,entries});
  while (json.length > MAX_PAGES_JSON_CHARACTERS && entries.length > 1) {
    entries.shift();
    json = JSON.stringify({version:1,entries});
  }
  return json.length <= MAX_PAGES_JSON_CHARACTERS ? json : null;
}

