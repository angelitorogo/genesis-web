/**
 * 26.1c.7 bounded hot cache for a catalogue's current filtered/sorted view.
 *
 * It intentionally keeps only one view. Pagination and page-size changes reuse
 * the same ordered records, while a different source snapshot, filter or sort
 * replaces the cached view. This avoids retaining a combinatorial set of large
 * arrays for galaxies with tens of thousands of known bodies.
 */
export class GalaxyKnowledgeCatalogViewCache<T> {
  private source: readonly T[] | null = null;
  private key: string | null = null;
  private view: readonly T[] = Object.freeze([]);

  resolve(
    source: readonly T[],
    key: string,
    predicate: (value: T) => boolean,
    compare: (left: T, right: T) => number,
  ): readonly T[] {
    if (this.source === source && this.key === key) {
      return this.view;
    }

    const view = source.filter(predicate);
    view.sort(compare);
    this.source = source;
    this.key = key;
    this.view = Object.freeze(view);
    return this.view;
  }
}

export function galaxyKnowledgeCatalogViewKey(
  subtype: string | null,
  sortKey: string,
  direction: string,
): string {
  return JSON.stringify([subtype, sortKey, direction]);
}
