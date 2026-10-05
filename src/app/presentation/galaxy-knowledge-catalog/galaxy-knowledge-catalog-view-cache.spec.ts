import {
  GalaxyKnowledgeCatalogViewCache,
  galaxyKnowledgeCatalogViewKey,
} from './galaxy-knowledge-catalog-view-cache';

describe('26.1c.7 GalaxyKnowledgeCatalogViewCache', () => {
  it('reuses one filtered/sorted view across page-only changes', () => {
    const source = Object.freeze([5, 1, 4, 2, 3]);
    const cache = new GalaxyKnowledgeCatalogViewCache<number>();
    const predicate = vi.fn((value: number) => value >= 2);
    const compare = vi.fn((left: number, right: number) => left - right);
    const key = galaxyKnowledgeCatalogViewKey(null, 'value', 'asc');

    const first = cache.resolve(source, key, predicate, compare);
    const second = cache.resolve(source, key, predicate, compare);

    expect(first).toEqual([2, 3, 4, 5]);
    expect(second).toBe(first);
    expect(predicate).toHaveBeenCalledTimes(source.length);
    expect(compare.mock.calls.length).toBeGreaterThan(0);

    const predicateCalls = predicate.mock.calls.length;
    const compareCalls = compare.mock.calls.length;
    cache.resolve(source, key, predicate, compare);
    expect(predicate).toHaveBeenCalledTimes(predicateCalls);
    expect(compare).toHaveBeenCalledTimes(compareCalls);
  });

  it('invalidates when source identity or filter/sort key changes', () => {
    const cache = new GalaxyKnowledgeCatalogViewCache<number>();
    const predicate = vi.fn((value: number) => value > 0);
    const compare = vi.fn((left: number, right: number) => left - right);
    const source = Object.freeze([3, 1, 2]);

    const first = cache.resolve(
      source,
      galaxyKnowledgeCatalogViewKey(null, 'value', 'asc'),
      predicate,
      compare,
    );
    const second = cache.resolve(
      source,
      galaxyKnowledgeCatalogViewKey('POSITIVE', 'value', 'asc'),
      predicate,
      compare,
    );
    const third = cache.resolve(
      Object.freeze([3, 1, 2]),
      galaxyKnowledgeCatalogViewKey('POSITIVE', 'value', 'asc'),
      predicate,
      compare,
    );

    expect(second).not.toBe(first);
    expect(third).not.toBe(second);
    expect(predicate).toHaveBeenCalledTimes(9);
  });
});
