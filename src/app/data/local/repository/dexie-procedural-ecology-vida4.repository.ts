import type { GenesisIndexedDb } from '../indexed-db/genesis-indexed-db';
import type { Vida4EcologySnapshot } from '../../../domain/life/procedural-ecology-vida4';

/** One immutable ecological snapshot per body AND revision; V1/V2 coexist without overwrites. */
export class DexieProceduralEcologyVIDA4Repository {
  constructor(private readonly db: GenesisIndexedDb) {}

  async ensure(snapshot: Vida4EcologySnapshot): Promise<Vida4EcologySnapshot> {
    await this.db.openDatabase();
    const id = snapshot.identity;
    const key: [string, number, string] = [id.universeSeed, id.generatorVersionCode,
      `${snapshot.revision}|${snapshot.bodyStorageKey}`];
    const same = (row: {snapshotJson: string; digest: string; modelRevision: string}) => {
      const previous = JSON.parse(row.snapshotJson) as Vida4EcologySnapshot;
      if (row.modelRevision !== snapshot.revision || previous.digest !== snapshot.digest ||
          row.digest !== snapshot.digest || previous.microbialDigest !== snapshot.microbialDigest ||
          previous.bodyStorageKey !== snapshot.bodyStorageKey) {
        throw new Error('VIDA.4 private ecological snapshot mismatch: no overwrite');
      }
      return previous;
    };
    try {
      return await this.db.transaction('rw', this.db.privateEcologicalBiospheres, async () => {
        const previous = await this.db.privateEcologicalBiospheres.get(key);
        if (previous) return same(previous);
        await this.db.privateEcologicalBiospheres.add({
          universeSeed: id.universeSeed, generatorVersionCode: id.generatorVersionCode,
          bodyStorageKey: key[2], modelRevision: snapshot.revision,
          snapshotJson: JSON.stringify(snapshot), digest: snapshot.digest,
        });
        return snapshot;
      });
    } catch (error) {
      if (!(error instanceof Error) || error.name !== 'ConstraintError') throw error;
      const previous = await this.db.privateEcologicalBiospheres.get(key);
      if (!previous) throw error;
      return same(previous);
    }
  }
}
