/** 38.bis-T2 — ordering only: never decides whether cached science is valid.
 * The archive indexer still verifies the live discovery/VIDA.9 revision before
 * reusing a persisted section. Unpublished fragments go first after restart. */
import type { UniversalArchiveIndexedCategory38Bis } from './genesis-universal-archive-38-bis.model';

export interface ArchiveIndexTask38BisT2 {
  readonly category: UniversalArchiveIndexedCategory38Bis;
  readonly galaxyIndex: string;
}

export function archiveIndexTaskKey38BisT2(
  category: UniversalArchiveIndexedCategory38Bis, galaxyIndex: string,
): string { return `${category}|${galaxyIndex}`; }

export function archiveIndexPlan38BisT2(
  categories: readonly UniversalArchiveIndexedCategory38Bis[],
  galaxies: readonly { readonly index: string }[],
  stored: ReadonlySet<string>,
  checked: ReadonlySet<string> = new Set<string>(),
): readonly ArchiveIndexTask38BisT2[] {
  const missing: ArchiveIndexTask38BisT2[] = [];
  const existing: ArchiveIndexTask38BisT2[] = [];
  for (const category of categories) {
    for (const galaxy of galaxies) {
      const fragment = archiveIndexTaskKey38BisT2(category, galaxy.index);
      if (checked.has(fragment)) continue; // Verified in THIS navigation.
      (stored.has(fragment) ? existing : missing).push({category, galaxyIndex:galaxy.index});
    }
  }
  return Object.freeze([...missing, ...existing]);
}
