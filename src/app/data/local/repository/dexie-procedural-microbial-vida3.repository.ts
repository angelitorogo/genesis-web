import type { GenesisIndexedDb } from '../indexed-db/genesis-indexed-db';
import type { Vida3MicrobialSnapshot } from '../../../domain/life/procedural-microbial-vida3';

/** Immutable insert-or-read, guarded by Dexie's unique compound key. */
export class DexieProceduralMicrobialVIDA3Repository {
  constructor(private readonly db: GenesisIndexedDb) {}

  async ensure(snapshot: Vida3MicrobialSnapshot): Promise<Vida3MicrobialSnapshot> {
    await this.db.openDatabase();
    const id = snapshot.identity;
    // V8 primary key has no revision column. Namespace the *storage* key for v2;
    // previous v1 rows retain their original keys and remain immutable. This is
    // intentionally not a new physical body identity or a schema migration.
    const storageBodyKey = `${snapshot.revision}|${snapshot.bodyStorageKey}`;
    const key: [string, number, string] = [id.universeSeed, id.generatorVersionCode, storageBodyKey];
    const same = (existing: {snapshotJson: string; digest: string}): Vida3MicrobialSnapshot => {
      const prior = JSON.parse(existing.snapshotJson) as Vida3MicrobialSnapshot;
      if (prior.digest !== existing.digest || prior.revision !== snapshot.revision ||
          prior.bodyStorageKey !== snapshot.bodyStorageKey || prior.digest !== snapshot.digest)
        throw new Error('VIDA.3 private snapshot mismatch; no overwrite');
      return prior;
    };
    try {
      return await this.db.transaction('rw', this.db.privateMicrobialBiospheres, async () => {
        const existing = await this.db.privateMicrobialBiospheres.get(key);
        if (existing) return same(existing);
        await this.db.privateMicrobialBiospheres.add({
          universeSeed: id.universeSeed, generatorVersionCode: id.generatorVersionCode,
          bodyStorageKey: storageBodyKey, modelRevision: snapshot.revision,
          snapshotJson: JSON.stringify(snapshot), digest: snapshot.digest,
        });
        return snapshot;
      });
    } catch (error) {
      // Two browser tabs can race on INSERT; the unique index still owns the result.
      if (!(error instanceof Error) || error.name !== 'ConstraintError') throw error;
      const existing = await this.db.privateMicrobialBiospheres.get(key);
      if (!existing) throw error;
      return same(existing);
    }
  }
}
